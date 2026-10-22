import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sequence } from "@/components/liquids/sequence/Sequence";
import {
  actuatorNameToDisplayName,
  daqSecondsToGuiCentiseconds,
  describeSequenceActions,
  getIgnitionReferenceSeconds,
  guiCentisecondsToDaqSeconds,
  parseDaqSequenceDefinition,
} from "@/utils/liquids/sequence";

const scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  if (scrollToDescriptor) {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", scrollToDescriptor);
  } else {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
  }
});

describe("DAQ sequence utilities", () => {
  it("derives the step start from its earliest action and finds ignition T+0", () => {
    const sequence = parseDaqSequenceDefinition({
      steps: [
        { name: "Ignition", start_s: 99, actions: [[25, "ignition_fire", 1]] },
        { name: "Open main", start_s: 99, actions: [[26.2, "fuel_main", 1], [26, "lox_main", 1]] },
      ],
    });

    expect(sequence.steps.map(({ start_s }) => start_s)).toEqual([25, 26]);
    expect(getIgnitionReferenceSeconds(sequence)).toBe(25);
    expect(daqSecondsToGuiCentiseconds(26, 25)).toBe(100);
  });

  it("converts GUI time back to DAQ time", () => {
    expect(guiCentisecondsToDaqSeconds(125, 25)).toBe(26.25);
  });

  it("uses dashboard names when describing DAQ actions", () => {
    expect(actuatorNameToDisplayName("tank_depress")).toBe("Tank Vent");
    expect(describeSequenceActions([
      [0, "tank_depress", 1],
      [1, "ignition_arm", 1],
      [2, "ignition_fire", 0],
    ], 0)).toBe("T+00:00.00 OPEN Tank Vent\nT+00:01.00 ARM Igniter\nT+00:02.00 IGNITION OFF");
  });

  it("rejects malformed sequences or sequences without ignition T+0", () => {
    expect(() => parseDaqSequenceDefinition({ steps: [] })).toThrow("contains no steps");
    expect(() => parseDaqSequenceDefinition({
      steps: [{ name: "No ignition", actions: [[0, "lox_main", 1]] }],
    })).toThrow('no "ignition_fire" action with state 1');
  });
});

describe("live sequence display", () => {
  it("shows ignition-relative step times and follows the DAQ stream timer", async () => {
    const sequence = parseDaqSequenceDefinition({
      steps: [
        { name: "Ignition", actions: [[25, "ignition_fire", 1]] },
        { name: "Open main valves", actions: [[26.2, "fuel_main", 1], [26, "lox_main", 1]] },
      ],
    });
    const onDaqSequenceSeekStep = vi.fn(() => Promise.resolve());

    const { rerender } = render(
      <Sequence
        abortControl={<button type="button">ABORT</button>}
        daqSequence={sequence}
        daqSequenceActive={false}
        daqSequenceReceivedAtMs={0}
        daqSequenceTimeSeconds={26.25}
        isDaqConnected
        isDaqSequenceRunning={false}
        mockDataEnabled={false}
        onDaqSequenceToggle={() => Promise.resolve()}
        onDaqSequenceSeekTime={() => Promise.resolve()}
        onDaqSequenceSeekStep={onDaqSequenceSeekStep}
        onMockDataSourceChange={() => undefined}
        onMockSensorStatusChange={() => undefined}
        onSequenceJump={() => undefined}
        onSequenceStateChange={() => undefined}
        stopSignal={0}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Sequence timer" })).toHaveValue("T+00:01.25");
    expect(screen.getByText((_, element) => (
      element?.textContent === "T+00:01.00 OPEN LOx Main Valve\nT+00:01.20 OPEN Fuel Main Valve"
    ))).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Jump" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Jump" })[1]).toBeEnabled();
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Jump" })[1]);
      await Promise.resolve();
    });
    expect(onDaqSequenceSeekStep).toHaveBeenCalledWith("Open main valves");
    expect(screen.getAllByText("T+00:01.00")).toHaveLength(1);

    rerender(
      <Sequence
        abortControl={<button type="button">ABORT</button>}
        daqSequence={sequence}
        daqSequenceActive={false}
        daqSequenceReceivedAtMs={0}
        daqSequenceTimeSeconds={27}
        isDaqConnected
        isDaqSequenceRunning={false}
        mockDataEnabled={false}
        onDaqSequenceToggle={() => Promise.resolve()}
        onDaqSequenceSeekTime={() => Promise.resolve()}
        onDaqSequenceSeekStep={() => Promise.resolve()}
        onMockDataSourceChange={() => undefined}
        onMockSensorStatusChange={() => undefined}
        onSequenceJump={() => undefined}
        onSequenceStateChange={() => undefined}
        stopSignal={0}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Sequence timer" })).toHaveValue("T+00:02.00");
  });

  it("uses the DAQ active status to start or stop playback", async () => {
    const onDaqSequenceToggle = vi.fn(() => Promise.resolve());
    const props = {
      abortControl: <button type="button">ABORT</button>,
      daqSequence: null,
      daqSequenceReceivedAtMs: 0,
      daqSequenceTimeSeconds: null,
      isDaqConnected: true,
      isDaqSequenceRunning: false,
      mockDataEnabled: false,
      onDaqSequenceToggle,
      onDaqSequenceSeekTime: () => Promise.resolve(),
      onDaqSequenceSeekStep: () => Promise.resolve(),
      onMockDataSourceChange: () => undefined,
      onMockSensorStatusChange: () => undefined,
      onSequenceJump: () => undefined,
      onSequenceStateChange: () => undefined,
      stopSignal: 0,
    };
    const { rerender } = render(<Sequence {...props} daqSequenceActive={false} />);

    const startButton = screen.getByRole("button", { name: "Start DAQ sequence" });
    expect(startButton).toHaveAttribute("aria-pressed", "false");
    await act(async () => {
      fireEvent.click(startButton);
      await Promise.resolve();
    });
    expect(onDaqSequenceToggle).toHaveBeenCalledOnce();

    rerender(<Sequence {...props} daqSequenceActive />);
    expect(screen.getByRole("button", { name: "Stop DAQ sequence" })).toHaveAttribute("aria-pressed", "true");
  });

  it("interpolates the live timer between SSE time samples", () => {
    vi.useFakeTimers();
    const props = {
      abortControl: <button type="button">ABORT</button>,
      daqSequence: null,
      daqSequenceActive: true,
      daqSequenceReceivedAtMs: 0,
      daqSequenceTimeSeconds: 26.25,
      isDaqConnected: true,
      isDaqSequenceRunning: true,
      mockDataEnabled: false,
      onDaqSequenceToggle: () => Promise.resolve(),
      onDaqSequenceSeekTime: () => Promise.resolve(),
      onDaqSequenceSeekStep: () => Promise.resolve(),
      onMockDataSourceChange: () => undefined,
      onMockSensorStatusChange: () => undefined,
      onSequenceJump: () => undefined,
      onSequenceStateChange: () => undefined,
      stopSignal: 0,
    };
    const { rerender } = render(<Sequence {...props} />);

    expect(screen.getByRole("textbox", { name: "Sequence timer" })).toHaveValue("T+00:26.25");
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("textbox", { name: "Sequence timer" })).toHaveValue("T+00:26.75");

    rerender(<Sequence {...props} daqSequenceReceivedAtMs={500} daqSequenceTimeSeconds={26.75} />);
    expect(screen.getByRole("textbox", { name: "Sequence timer" })).toHaveValue("T+00:26.75");
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByRole("textbox", { name: "Sequence timer" })).toHaveValue("T+00:26.99");
  });

  it("posts timer edits in the DAQ timebase only while the DAQ timer is paused", async () => {
    const sequence = parseDaqSequenceDefinition({
      steps: [
        { name: "Ignition", actions: [[25, "ignition_fire", 1]] },
        { name: "Open main valves", actions: [[26, "lox_main", 1]] },
      ],
    });
    const onDaqSequenceSeekTime = vi.fn(() => Promise.resolve());
    const props = {
      abortControl: <button type="button">ABORT</button>,
      daqSequence: sequence,
      daqSequenceActive: false,
      daqSequenceReceivedAtMs: 0,
      daqSequenceTimeSeconds: 26,
      isDaqConnected: true,
      isDaqSequenceRunning: false,
      mockDataEnabled: false,
      onDaqSequenceToggle: () => Promise.resolve(),
      onDaqSequenceSeekTime,
      onDaqSequenceSeekStep: () => Promise.resolve(),
      onMockDataSourceChange: () => undefined,
      onMockSensorStatusChange: () => undefined,
      onSequenceJump: () => undefined,
      onSequenceStateChange: () => undefined,
      stopSignal: 0,
    };
    const { rerender } = render(<Sequence {...props} />);
    const timer = screen.getByRole("textbox", { name: "Sequence timer" });

    expect(timer).not.toHaveAttribute("readonly");
    fireEvent.change(timer, { target: { value: "T+00:05.00" } });
    await act(async () => {
      fireEvent.blur(timer);
      await Promise.resolve();
    });
    expect(onDaqSequenceSeekTime).toHaveBeenCalledWith(30);

    rerender(<Sequence {...props} isDaqSequenceRunning />);
    expect(timer).toHaveAttribute("readonly");
  });
});
