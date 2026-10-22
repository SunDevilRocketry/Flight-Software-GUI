"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Settings } from "@/components/liquids/Settings";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { Toggle } from "@/components/liquids/ThemeToggle";
import { Alert, AlertPriority } from "@/utils/liquids/alert";
import { mockLiquidSequence, mockSequenceInitialTimeCentiseconds } from "@/hooks/liquids/useMockEngine";
import {
  daqSecondsToGuiCentiseconds,
  describeSequenceActions,
  formatSequenceTime,
  getIgnitionReferenceSeconds,
  guiCentisecondsToDaqSeconds,
  type DaqSequenceDefinition,
  type DaqSequenceStep,
} from "@/utils/liquids/sequence";

import { Step } from "./Step";

interface SequenceProps {
  abortControl: ReactNode;
  mockDataEnabled: boolean;
  daqSequence: DaqSequenceDefinition | null;
  daqSequenceActive: boolean | null;
  daqSequenceReceivedAtMs: number;
  daqSequenceTimeSeconds: number | null;
  isDaqConnected: boolean;
  isDaqSequenceRunning: boolean;
  onMockDataSourceChange: (enabled: boolean) => void;
  onMockSensorStatusChange: (status: ReadingStatus) => void;
  onDaqSequenceToggle: () => Promise<void>;
  onDaqSequenceSeekTime: (seconds: number) => Promise<void>;
  onDaqSequenceSeekStep: (name: string) => Promise<void>;
  onSequenceJump: (timeCentiseconds: number) => void;
  onSequenceStateChange: (timeCentiseconds: number, isRunning: boolean) => void;
  stopSignal: number;
}

const initialTimerCentiseconds = mockSequenceInitialTimeCentiseconds;

/** Parses the sequence timer format and returns centiseconds when valid.
 * @param value Timer text entered by the user.
 * @returns Parsed centiseconds, or null when the text is invalid.
 */
const parseTimer = (value: string) => {
  const match = /^T([+-])(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\.(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, direction, hours = "0", minutes, seconds, centiseconds] = match;
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);

  if (parsedMinutes > 59 || parsedSeconds > 59) {
    return null;
  }

  const absoluteCentiseconds = (((Number(hours) * 60 + parsedMinutes) * 60 + parsedSeconds) * 100) + Number(centiseconds);

  return direction === "-" ? -absoluteCentiseconds : absoluteCentiseconds;
};

/** Provides sequence playback, timer editing, step navigation, and abort controls.
 * @param props Sequence controller properties.
 * @returns The rendered sequence controller.
 */
export function Sequence({
  abortControl,
  daqSequence,
  daqSequenceActive,
  daqSequenceReceivedAtMs,
  daqSequenceTimeSeconds,
  isDaqConnected,
  isDaqSequenceRunning,
  mockDataEnabled,
  onDaqSequenceToggle,
  onDaqSequenceSeekTime,
  onDaqSequenceSeekStep,
  onMockDataSourceChange,
  onMockSensorStatusChange,
  onSequenceJump,
  onSequenceStateChange,
  stopSignal,
}: SequenceProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isDaqCommandPending, setIsDaqCommandPending] = useState(false);
  const [timerCentiseconds, setTimerCentiseconds] = useState(initialTimerCentiseconds);
  const [timerInput, setTimerInput] = useState(formatSequenceTime(initialTimerCentiseconds));
  const [daqClockNowMs, setDaqClockNowMs] = useState(0);
  const [isTimerInputDirty, setIsTimerInputDirty] = useState(false);
  const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const autoScrollTargetRef = useRef<number | null>(null);
  const [startedStopSignal, setStartedStopSignal] = useState(stopSignal);
  const sequence = isDaqConnected ? daqSequence : mockDataEnabled ? mockLiquidSequence : null;
  const ignitionReferenceSeconds = sequence ? getIgnitionReferenceSeconds(sequence) : null;
  const ignitionReferenceCentiseconds = ignitionReferenceSeconds === null
    ? 0
    : Math.round(ignitionReferenceSeconds * 100);
  const sequenceSteps = sequence?.steps ?? [];
  const daqElapsedSeconds = daqSequenceTimeSeconds !== null
    && isDaqSequenceRunning
    ? daqSequenceTimeSeconds + Math.max(0, daqClockNowMs - daqSequenceReceivedAtMs) / 1_000
    : daqSequenceTimeSeconds;
  const streamTimerCentiseconds = isDaqConnected && daqElapsedSeconds !== null
    ? Math.round(daqElapsedSeconds * 100)
    : null;
  const activeTimerCentiseconds = streamTimerCentiseconds ?? timerCentiseconds;
  const sequenceIsRunning = !isDaqConnected && mockDataEnabled && isRunning && startedStopSignal === stopSignal;
  const playButtonIsPressed = isDaqConnected ? daqSequenceActive === true : sequenceIsRunning;
  const playButtonLabel = isDaqConnected
    ? daqSequenceActive === true ? "Stop DAQ sequence" : "Start DAQ sequence"
    : sequenceIsRunning ? "Pause countdown" : "Start countdown";

  useEffect(() => {
    onSequenceStateChange(activeTimerCentiseconds, sequenceIsRunning);
  }, [activeTimerCentiseconds, onSequenceStateChange, sequenceIsRunning]);

  const hasDaqSequenceTime = daqSequenceTimeSeconds !== null;
  useEffect(() => {
    if (!isDaqConnected || !isDaqSequenceRunning || !hasDaqSequenceTime) {
      return;
    }

    const interval = window.setInterval(() => {
      setDaqClockNowMs(performance.now());
    }, 16);

    return () => window.clearInterval(interval);
  }, [hasDaqSequenceTime, isDaqConnected, isDaqSequenceRunning]);

  useEffect(() => {
    if (!sequenceIsRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimerCentiseconds((current) => current + 1);
    }, 10);

    return () => window.clearInterval(interval);
  }, [sequenceIsRunning]);

  const timerValue = isDaqConnected && streamTimerCentiseconds === null
    ? "T+--:--.--"
    : formatSequenceTime(activeTimerCentiseconds - ignitionReferenceCentiseconds);
  const displayedTimer = isTimerInputDirty ? timerInput : timerValue;
  const activeStepIndex = sequenceSteps.reduce(
    (activeIndex, step, index) => (
      step.start_s * 100 <= activeTimerCentiseconds ? index : activeIndex
    ),
    -1,
  );

  useEffect(() => {
    if (!isAutoFollowEnabled) {
      return;
    }

    const list = listRef.current;
    const activeStep = stepRefs.current[activeStepIndex];

    if (!list || !activeStep) {
      return;
    }

    const targetScrollTop = Math.max(0, activeStep.offsetTop - activeStep.offsetHeight);
    autoScrollTargetRef.current = targetScrollTop;
    list.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [activeStepIndex, isAutoFollowEnabled]);

  const commitTimerInput = () => {
    if (sequenceIsRunning || (isDaqConnected && (isDaqSequenceRunning || isDaqCommandPending))) {
      return;
    }

    const parsedTimer = parseTimer(timerInput);

    if (parsedTimer === null) {
      setTimerInput(timerValue);
      setIsTimerInputDirty(false);
      return;
    }

    const nextTimerCentiseconds = Math.round(
      guiCentisecondsToDaqSeconds(parsedTimer, ignitionReferenceCentiseconds / 100) * 100,
    );
    if (isDaqConnected) {
      setIsDaqCommandPending(true);
      setIsTimerInputDirty(false);
      void onDaqSequenceSeekTime(nextTimerCentiseconds / 100)
        .finally(() => setIsDaqCommandPending(false));
      return;
    }

    setTimerCentiseconds(nextTimerCentiseconds);
    setTimerInput(formatSequenceTime(parsedTimer));
    setIsTimerInputDirty(false);
  };

  const toggleCountdown = () => {
    if (isDaqConnected) {
      if (daqSequenceActive === null || isDaqCommandPending) {
        return;
      }

      setIsDaqCommandPending(true);
      void onDaqSequenceToggle().finally(() => setIsDaqCommandPending(false));
      return;
    }

    if (sequenceIsRunning) {
      setTimerInput(timerValue);
      setIsTimerInputDirty(false);
      setIsRunning(false);
      return;
    }

    setStartedStopSignal(stopSignal);
    setIsRunning(true);
  };

  const jumpToStep = (step: DaqSequenceStep) => {
    if (isDaqConnected) {
      if (isDaqCommandPending) {
        return;
      }

      setIsDaqCommandPending(true);
      void onDaqSequenceSeekStep(step.name).finally(() => setIsDaqCommandPending(false));
      return;
    }

    const startTimeCentiseconds = Math.round(step.start_s * 100);
    setTimerCentiseconds(startTimeCentiseconds);
    setTimerInput(formatSequenceTime(startTimeCentiseconds - ignitionReferenceCentiseconds));
    setIsTimerInputDirty(false);
    onSequenceJump(startTimeCentiseconds);
  };

  const disableAutoFollowOnManualScroll = () => {
    const list = listRef.current;
    const autoScrollTarget = autoScrollTargetRef.current;

    if (!list || autoScrollTarget === null) {
      setIsAutoFollowEnabled(false);
      return;
    }

    if (Math.abs(list.scrollTop - autoScrollTarget) < 1) {
      autoScrollTargetRef.current = null;
    }
  };

  const disableAutoFollow = () => {
    autoScrollTargetRef.current = null;
    setIsAutoFollowEnabled(false);
  };

  const announceSequenceInfo = () => {
    new Alert(
      "Sequence settings disabled",
      "The settings menu for sequencing does not provide any functionality at this time. ",
      AlertPriority.INFO,
    );
  };

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden border border-base-300 bg-base-100 shadow-lg"
      aria-label="Sequence controller"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 p-4">
        <div className="flex min-w-0 items-center gap-5">
          <Settings onMockDataSourceChange={onMockDataSourceChange} onMockSensorStatusChange={onMockSensorStatusChange} />
          <input
            className="w-48 border border-base-400 bg-base px-2 py-1 font-mono text-3xl font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current read-only:cursor-default"
            type="text"
            aria-label="Sequence timer"
            readOnly={sequenceIsRunning || (isDaqConnected && (isDaqSequenceRunning || !daqSequence || isDaqCommandPending))}
            value={displayedTimer}
            onChange={(event) => {
              setTimerInput(event.target.value);
              setIsTimerInputDirty(true);
            }}
            onBlur={commitTimerInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex size-9 items-center justify-center border border-base-400 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            type="button"
            aria-pressed={playButtonIsPressed}
            aria-label={playButtonLabel}
            title={playButtonLabel}
            disabled={isDaqConnected && (daqSequenceActive === null || isDaqCommandPending)}
            onClick={toggleCountdown}
          >
            {sequenceIsRunning ? (
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-4 w-1.5 bg-current" />
                <span className="h-4 w-1.5 bg-current" />
              </span>
            ) : (
              <span className="ml-0.5 size-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" aria-hidden="true" />
            )}
          </button>
          <button
            className="flex size-9 items-center justify-center border border-base-400 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            type="button"
            aria-label="Sequence information"
            title="Sequence information"
            onClick={announceSequenceInfo}
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className="h-0.5 w-4 bg-current" />
              <span className="h-0.5 w-4 bg-current" />
              <span className="h-0.5 w-4 bg-current" />
            </span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <label className="flex shrink-0 items-center justify-between border-b border-base-300 px-4 py-2 text-xs font-semibold">
          Follow active step
          <Toggle
            checked={isAutoFollowEnabled}
            label="Follow active step"
            onChange={setIsAutoFollowEnabled}
          />
        </label>
        <div
          ref={listRef}
          className="themed-scrollbar relative min-h-0 flex-1 overflow-y-auto"
          tabIndex={0}
          onScroll={disableAutoFollowOnManualScroll}
          onWheel={disableAutoFollow}
          onTouchMove={disableAutoFollow}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              disableAutoFollow();
            }
          }}
          onKeyDown={(event) => {
            if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
              disableAutoFollow();
            }
          }}
        >
          {isDaqConnected && !daqSequence && (
            <p className="p-4 text-sm text-base-500" role="status">Loading DAQ sequence…</p>
          )}
          {sequenceSteps.map((step, index) => (
            <Step
              key={`${step.name}-${step.start_s}`}
              action={describeSequenceActions(step.actions, ignitionReferenceSeconds ?? 0)}
              active={index === activeStepIndex}
              disabled={isDaqConnected && isDaqCommandPending}
              elementRef={(element) => {
                stepRefs.current[index] = element;
              }}
              name={step.name}
              startTime={formatSequenceTime(daqSecondsToGuiCentiseconds(
                step.start_s,
                ignitionReferenceSeconds ?? 0,
              ))}
              onJump={() => jumpToStep(step)}
            />
          ))}
        </div>
      </div>

      <footer className="shrink-0 border-t border-base-300 p-4">{abortControl}</footer>
    </section>
  );
}