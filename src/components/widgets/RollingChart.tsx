"use client";

import { useEffect, useEffectEvent, useState } from "react";

interface Sample {
  timestamp: number;
  value: number;
}

interface ChartState {
  samples: Sample[];
  startTimestamp: number | null;
}

interface RollingChartProps {
  value: number;
  active: boolean;
  title: string;
  ariaLabel: string;
  formatValue: (value: number) => string;
  sampleRateHz?: number;
  lookbackSeconds?: number;
}

const CHART_WIDTH = 620;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 32, left: 58 };

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
}: RollingChartProps) {
  const [{ samples, startTimestamp }, setChartState] = useState<ChartState>(() => {
    const timestamp = Date.now();
    return {
      samples: [{ timestamp, value }],
      startTimestamp: timestamp,
    };
  });
  const maxSamples = sampleRateHz * lookbackSeconds;
  const sampleIntervalMs = 1_000 / sampleRateHz;
  const getLatestValue = useEffectEvent(() => value);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const timestamp = Date.now();
      const sample = { timestamp, value: getLatestValue() };

      setChartState((current) => ({
        startTimestamp: current.startTimestamp ?? timestamp,
        samples: [...current.samples, sample].slice(-maxSamples),
      }));
    }, sampleIntervalMs);

    return () => window.clearInterval(interval);
  }, [maxSamples, sampleIntervalMs]);

  const values = samples.map((sample) => sample.value);
  const observedMinimum = values.length ? Math.min(...values) : 0;
  const observedMaximum = values.length ? Math.max(...values) : 1;
  const rangePadding = Math.max((observedMaximum - observedMinimum) * 0.12, 1);
  const minimum = observedMinimum - rangePadding;
  const maximum = observedMaximum + rangePadding;
  const path = samples.length > 1 ? buildPath(samples, minimum, maximum) : "";
  const firstSampleElapsedSeconds = samples.length && startTimestamp
    ? (samples[0].timestamp - startTimestamp) / 1_000
    : 0;
  const currentElapsedSeconds = samples.length && startTimestamp
    ? (samples[samples.length - 1].timestamp - startTimestamp) / 1_000
    : 0;

  return (
    <section className="border border-base-300 bg-base-100 p-4 shadow-lg" aria-label={ariaLabel}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-cyan-700 dark:text-cyan-300">LIVE TREND</p>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <span className={`text-xs font-semibold ${active ? "text-emerald-500" : "text-base-500"}`}>
          {active ? "STREAMING" : "STANDBY"}
        </span>
      </div>

      <svg className="h-auto w-full" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${title} over time`}>
        {[0, 0.5, 1].map((position) => {
          const y = PADDING.top + position * (CHART_HEIGHT - PADDING.top - PADDING.bottom);
          const label = maximum - position * (maximum - minimum);
          return (
            <g key={position}>
              <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} className="stroke-base-300" strokeDasharray="4 4" />
              <text x={PADDING.left - 8} y={y + 4} textAnchor="end" className="fill-base-500 text-[11px]">{formatValue(label)}</text>
            </g>
          );
        })}
        {path && <path d={path} fill="none" className="stroke-cyan-500" strokeWidth="3" />}
        <text x={PADDING.left} y={CHART_HEIGHT - 8} className="fill-base-500 text-[11px]">T+{firstSampleElapsedSeconds.toFixed(1)} s</text>
        <text x={CHART_WIDTH - PADDING.right} y={CHART_HEIGHT - 8} textAnchor="end" className="fill-base-500 text-[11px]">T+{currentElapsedSeconds.toFixed(1)} s</text>
      </svg>
    </section>
  );
}