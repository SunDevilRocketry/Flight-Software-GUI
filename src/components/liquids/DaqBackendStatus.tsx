"use client";

import { useState } from "react";

import type { DaqStatus } from "@/utils/liquids/daqApi";

interface DaqBackendStatusProps {
  baseUrl: string;
  isConnected: boolean;
  onConnect: (baseUrl: string) => void;
  onDisconnect: () => void;
  status: DaqStatus | null;
}

/** Displays DAQ connection controls and the latest backend status.
 * @param props DAQ connection state, status, and connection callbacks.
 * @returns The rendered DAQ status panel.
 */
export function DaqBackendStatus({ baseUrl, isConnected, onConnect, onDisconnect, status }: DaqBackendStatusProps) {
  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const connectionLabel = !isConnected ? "Disconnected" : status?.ok ? "Connected" : "Connecting";
  const connectionClasses = !isConnected ? "text-base-500" : status?.ok ? "text-emerald-500" : "text-accent-red";

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
        <dd className="font-semibold">{status ? `${status.stream_hz.toFixed(1)} Hz` : "--"}</dd>
        <dt className="text-base-500">Source</dt>
        <dd className="font-semibold">{status ? (status.using_mock ? "Mock" : "Live") : "--"}</dd>
      </dl>
    </section>
  );
}