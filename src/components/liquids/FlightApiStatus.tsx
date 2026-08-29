"use client";

import { useEffect, useRef, useState } from "react";

interface FlightApiStatusProps {
  firmware?: string;
  hardware?: string;
}

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "offline";

const STATUS_POLL_INTERVAL_MS = 1_000;

export function FlightApiStatus({ firmware, hardware }: FlightApiStatusProps) {
  const [baseUrl, setBaseUrl] = useState("http://localhost:5000");
  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const isCheckingRef = useRef(false);
  const isConnected = connectionStatus !== "disconnected";

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    let isCurrent = true;

    const checkConnection = async () => {
      if (isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/`);

        if (isCurrent) {
          setConnectionStatus(response.ok ? "connected" : "offline");
        }
      } catch {
        if (isCurrent) {
          setConnectionStatus("offline");
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    void checkConnection();
    const interval = window.setInterval(() => void checkConnection(), STATUS_POLL_INTERVAL_MS);

    return () => {
      isCurrent = false;
      window.clearInterval(interval);
    };
  }, [baseUrl, isConnected]);

  const connect = () => {
    const nextUrl = draftUrl.trim();

    if (!nextUrl) {
      return;
    }

    setBaseUrl(nextUrl.replace(/\/$/, ""));
    setConnectionStatus("connecting");
  };

  const disconnect = () => setConnectionStatus("disconnected");
  const connectionClasses = connectionStatus === "connected"
    ? "text-emerald-500"
    : connectionStatus === "offline"
      ? "text-accent-red"
      : "text-base-500";
  const connectionLabel = connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1);

  return (
    <section className="flex w-full flex-col border border-base-300 bg-base-100 p-4 shadow-lg" aria-label="Flight API status">
      <div className="flex items-baseline justify-between border-b border-base-300 pb-3">
        <h2 className="text-lg font-bold">SDEC-API</h2>
        <span className={`text-xs font-semibold ${connectionClasses}`}>
          {connectionLabel}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold">
          API URL
          <input
            className="h-9 w-full border border-base-400 bg-base px-2 font-mono text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current read-only:cursor-default"
            type="url"
            readOnly={isConnected}
            value={isConnected ? baseUrl : draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
          />
        </label>
        {isConnected ? (
          <button
            className="h-9 border border-base-400 px-3 text-xs font-semibold transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            type="button"
            onClick={disconnect}
          >
            Disconnect
          </button>
        ) : (
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
        <dt className="text-base-500">Hardware</dt>
        <dd className="font-semibold">{hardware || "--"}</dd>
        <dt className="text-base-500">Firmware</dt>
        <dd className="font-semibold">{firmware || "--"}</dd>
      </dl>
    </section>
  );
}