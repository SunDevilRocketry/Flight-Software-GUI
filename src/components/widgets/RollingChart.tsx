"use client";

import { useEffect, useEffectEvent, useState } from "react";

interface Sample {
  timestamp: number;
  value: number;
}

interface ChartState {
  samples: Sample[];
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
const GAP_THRESHOLD_MULTIPLIER = 8;

function buildPath(
  samples: Sample[],
  minimum: number,
  maximum: number,
  startTimestamp: number,
  endTimestamp: number,
  sampleIntervalMs: number,
) {
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const timeRange = Math.max(endTimestamp - startTimestamp, 1);

  return samples
    .map((sample, index) => {
      const elapsed = Math.max(0, Math.min(timeRange, sample.timestamp - startTimestamp));
      const x = PADDING.left + (elapsed / timeRange) * innerWidth;
      const y = PADDING.top + ((maximum - sample.value) / (maximum - minimum)) * innerHeight;
      const previousSample = samples[index - 1];
      const hasGap = previousSample
        && sample.timestamp - previousSample.timestamp > sampleIntervalMs * GAP_THRESHOLD_MULTIPLIER;
      return `${index === 0 || hasGap ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
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
  const [{ samples }, setChartState] = useState<ChartState>({
    samples: [],
  });
  const getLatestValue = useEffectEvent(() => value);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const timestamp = Date.now();
      const sample = { timestamp, value: getLatestValue() };

      setChartState((current) => {
        const cutoffTimestamp = timestamp - lookbackSeconds * 1_000;
        const nextSamples = [...current.samples, sample]
          .filter((currentSample) => currentSample.timestamp >= cutoffTimestamp)
          .slice(-maxSamples);

        return {
          samples: nextSamples,
        };
      });
    }, sampleIntervalMs);

    return () => window.clearInterval(interval);
  }, [lookbackSeconds, maxSamples, sampleIntervalMs]);

  const values = samples.map((sample) => sample.value);
  const observedMinimum = values.length ? Math.min(...values) : 0;
  const observedMaximum = values.length ? Math.max(...values) : 1;
  const rangePadding = observedMinimum === observedMaximum
    ? Math.max(Math.abs(observedMinimum) * 0.01, 1)
    : 0;
  const minimum = observedMinimum - rangePadding;
  const maximum = observedMaximum + rangePadding;
  const latestTimestamp = samples.at(-1)?.timestamp ?? 0;
  const chartStartTimestamp = latestTimestamp - lookbackSeconds * 1_000;
  const visibleSamples = samples.filter((sample) => sample.timestamp >= chartStartTimestamp);
  const path = visibleSamples.length > 1
    ? buildPath(visibleSamples, minimum, maximum, chartStartTimestamp, latestTimestamp, sampleIntervalMs)
    : "";
  return (
    <section
      className={`border border-base-300 bg-base-100 p-4 shadow-lg ${
        fillContainer ? "flex h-full min-h-[280px] flex-col" : ""
      }`}
      aria-label={ariaLabel}
      data-active={active}
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
          -{lookbackSeconds.toFixed(0)}s
        </span>
        <span
          className="absolute bottom-0 -translate-x-full whitespace-nowrap text-[11px] leading-none text-base-500"
          style={{ left: `${((CHART_WIDTH - PADDING.right) / CHART_WIDTH) * 100}%` }}
        >
          0s
        </span>
      </div>
    </section>
  );
}