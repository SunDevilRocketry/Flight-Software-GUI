"use client";

import { useEffect, useEffectEvent, useState } from "react";

interface Sample {
  timestamp: number;
  value: number;
}

interface ChartState {
  samples: Sample[];
  timelineStartTimestamp: number | null;
}

interface RollingChartProps {
  value: number;
  active: boolean;
  title: string;
  ariaLabel: string;
  formatValue: (value: number) => string;
  sampleRateHz?: number;
  lookbackSeconds?: number;
  fillContainer?: boolean;
}

const CHART_WIDTH = 620;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 20, bottom: 32, left: 58 };

function buildPath(samples: Sample[], minimum: number, maximum: number) {
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  return samples
    .map((sample, index) => {
      const x = PADDING.left + (index / Math.max(samples.length - 1, 1)) * innerWidth;
      const y = PADDING.top + ((maximum - sample.value) / (maximum - minimum)) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function RollingChart({
  value,
  active,
  title,
  ariaLabel,
  formatValue,
  sampleRateHz = 20,
  lookbackSeconds = 20,
  fillContainer = false,
}: RollingChartProps) {
  const maxSamples = Math.round(sampleRateHz * lookbackSeconds) + 1;
  const sampleIntervalMs = 1_000 / sampleRateHz;
  const [{ samples, timelineStartTimestamp }, setChartState] = useState<ChartState>({
    samples: [],
    timelineStartTimestamp: null,
  });
  const getLatestValue = useEffectEvent(() => value);

  useEffect(() => {
    setChartState({ samples: [], timelineStartTimestamp: null });

    const interval = window.setInterval(() => {
      const timestamp = Date.now();
      const sample = { timestamp, value: getLatestValue() };

      setChartState((current) => {
        const nextSamples = [...current.samples, sample].slice(-maxSamples);

        return {
          timelineStartTimestamp: current.timelineStartTimestamp ?? timestamp,
          samples: nextSamples,
        };
      });
    }, sampleIntervalMs);

    return () => window.clearInterval(interval);
  }, [lookbackSeconds, maxSamples, sampleIntervalMs]);

  const values = samples.map((sample) => sample.value);
  const observedMinimum = values.length ? Math.min(...values) : 0;
  const observedMaximum = values.length ? Math.max(...values) : 1;
  const rangePadding = Math.max((observedMaximum - observedMinimum) * 0.12, 1);
  const minimum = observedMinimum - rangePadding;
  const maximum = observedMaximum + rangePadding;
  const path = samples.length > 1 ? buildPath(samples, minimum, maximum) : "";
  const currentElapsedSeconds = samples.length && timelineStartTimestamp
    ? (samples[samples.length - 1].timestamp - timelineStartTimestamp) / 1_000
    : 0;
  const firstSampleElapsedSeconds = Math.max(0, currentElapsedSeconds - lookbackSeconds);

  return (
    <section
      className={`border border-base-300 bg-base-100 p-4 shadow-lg ${
        fillContainer ? "flex h-full min-h-[280px] flex-col" : ""
      }`}
      aria-label={ariaLabel}
    >
      <div className="mb-3 flex items-baseline justify-center gap-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
      </div>

      <div className={fillContainer ? "relative min-h-0 flex-1" : "relative aspect-[620/220] w-full"}>
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title} over time`}
        >
          {[0, 0.5, 1].map((position) => {
            const y = PADDING.top + position * (CHART_HEIGHT - PADDING.top - PADDING.bottom);

            return (
              <line
                key={position}
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="stroke-base-300"
                strokeDasharray="4 4"
              />
            );
          })}
          {path && <path d={path} fill="none" className="stroke-cyan-500" strokeWidth="3" />}
        </svg>
        {[0, 0.5, 1].map((position) => {
          const y = PADDING.top + position * (CHART_HEIGHT - PADDING.top - PADDING.bottom);
          const label = maximum - position * (maximum - minimum);

          return (
            <span
              key={position}
              className="absolute left-0 -translate-y-1/2 text-[11px] leading-none text-base-500"
              style={{ top: `${(y / CHART_HEIGHT) * 100}%` }}
            >
              {formatValue(label)}
            </span>
          );
        })}
        <span
          className="absolute bottom-0 whitespace-nowrap text-[11px] leading-none text-base-500"
          style={{ left: `${(PADDING.left / CHART_WIDTH) * 100}%` }}
        >
          T+{firstSampleElapsedSeconds.toFixed(1)} s
        </span>
        <span
          className="absolute bottom-0 -translate-x-full whitespace-nowrap text-[11px] leading-none text-base-500"
          style={{ left: `${((CHART_WIDTH - PADDING.right) / CHART_WIDTH) * 100}%` }}
        >
          T+{currentElapsedSeconds.toFixed(1)} s
        </span>
      </div>
    </section>
  );
}