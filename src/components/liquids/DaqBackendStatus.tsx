"use client";

import { useState } from "react";

import type { DaqState } from "@/hooks/SSE/sseLiquids";
import type { DaqLoggerStatus, DaqStatus } from "@/utils/liquids/daqApi";
import { formatSignificantFigures } from "@/utils/units/significantFigures";
import { forceHandler } from "@/utils/units/units";

interface DaqBackendStatusProps {
  baseUrl: string;
  connectionFailed: boolean;
  isConnected: boolean;
  onConnect: (baseUrl: string) => void;
  onDisconnect: () => void;
  status: DaqStatus | null;
  daqState: DaqState | null;
  logger: DaqLoggerStatus | null;
}

/** Displays DAQ connection controls and the latest backend status.
 * @param props DAQ connection state, status, and connection callbacks.
 * @returns The rendered DAQ status panel.
 */
export function DaqBackendStatus({ baseUrl, connectionFailed, daqState, isConnected, logger, onConnect, onDisconnect, status }: DaqBackendStatusProps) {
  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const connectionLabel = !isConnected ? "Disconnected" : connectionFailed ? "Connection failed" : status?.ok ? "Connected" : "Connecting";
  const connectionClasses = !isConnected
    ? "text-base-500"
    : connectionFailed
      ? "text-accent-red"
      : status === null
      ? "text-amber-500"
      : status.ok
        ? "text-emerald-500"
        : "text-amber-500";

  const ignSense = daqState?.sensors.ign_sense;
  const impulseLbfS = daqState?.derived.total_impulse_lbf_s;
  const boiling = daqState?.derived.lox_boiling_advisory;
  const recordingProblem = Boolean(logger && (logger.rows_dropped > 0 || logger.error));

  const connect = () => {
    const nextUrl = draftUrl.trim();

    if (!nextUrl) {
      return;
    }

    onConnect(nextUrl);
  };

  return (
    <section className="flex w-full flex-col border border-base-300 bg-base-100 p-4 shadow-lg" aria-label="DAQ API connection">
      <div className="flex items-baseline justify-between border-b border-base-300 pb-3">
        <h2 className="text-lg font-bold">LQD-DAQ</h2>
        <span className={`text-xs font-semibold ${connectionClasses}`}>{connectionLabel}</span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold">
          DAQ URL
          <input
            className="h-9 w-full border border-base-400 bg-base px-2 font-mono text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current read-only:cursor-default"
            type="url"
            readOnly={isConnected}
            value={isConnected ? baseUrl : draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
          />
        </label>
        {isConnected && (
          <button
            className="h-9 border border-base-400 px-3 text-xs font-semibold transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            type="button"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        )}
        {!isConnected && (
          <button
            className="h-9 border border-base-400 px-3 text-xs font-semibold transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            type="button"
            onClick={connect}
          >
            Connect
          </button>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <dt className="text-base-500">Stream</dt>
        <dd className="font-semibold">{status ? `${formatSignificantFigures(status.stream_hz)} Hz` : "--"}</dd>
        <dt className="text-base-500">Source</dt>
        <dd className="font-semibold">{status ? (status.using_mock ? "Mock" : "Live") : "--"}</dd>
        <dt className="text-base-500">Backlog (T7 / LJM)</dt>
        <dd className="font-semibold">{daqState?.backlog ? `${daqState.backlog.device} / ${daqState.backlog.ljm}` : "--"}</dd>
        <dt className="text-base-500">Igniter sense</dt>
        <dd className="font-semibold">
          {ignSense?.readout == null ? "--" : `${formatSignificantFigures(ignSense.readout)} V`}
          {ignSense?.label ? ` (${ignSense.label})` : ""}
        </dd>
        <dt className="text-base-500">Total impulse</dt>
        <dd className="font-semibold">
          {/* LQD-DAQ sends lbf*s; shown in the selected force unit. */}
          {typeof impulseLbfS === "number" ? `${forceHandler.getDisplayString(impulseLbfS * 4.448221615)}·s` : "--"}
        </dd>
        <dt className="text-base-500">LOX boiling</dt>
        <dd className={`font-semibold ${boiling === true ? "text-orange-500" : ""}`}>
          {boiling === true ? "Boiling" : boiling === false ? "No" : "--"}
        </dd>
        <dt className="text-base-500">Recording</dt>
        <dd className={`break-all font-semibold ${recordingProblem ? "text-orange-500" : ""}`}>
          {!logger ? "--" : logger.recording ? (logger.path?.split("/").pop() ?? "On") : "Off"}
          {logger?.rows_dropped ? ` (${logger.rows_dropped} rows dropped)` : ""}
          {logger?.error ? ` ${logger.error}` : ""}
        </dd>
      </dl>
    </section>
  );
}
