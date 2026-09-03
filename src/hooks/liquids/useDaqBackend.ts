"use client";

import { useEffect, useRef, useState } from "react";

import { Alert, AlertPriority, clearAlerts } from "@/utils/liquids/alert";
import { daqApi, type DaqStatus } from "@/utils/liquids/daqApi";

import { createInitialDaqState, subscribeToLiquidsSse, type DaqState } from "../SSE/sseLiquids";

const DEFAULT_DAQ_URL = "http://localhost:8000";
const STATUS_POLL_INTERVAL_MS = 1_000;

/** State and commands exposed by the DAQ backend connection hook. */
export interface UseDaqBackendResult {
  abort: () => Promise<void>;
  baseUrl: string;
  connect: (baseUrl: string) => void;
  connectionFailed: boolean;
  disconnect: () => void;
  daqState: DaqState;
  daqStateReady: boolean;
  dataSourceVersion: number;
  isConnected: boolean;
  status: DaqStatus | null;
}

/** Manages DAQ connection state and periodic status polling. */
export function useDaqBackend(): UseDaqBackendResult {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_DAQ_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [status, setStatus] = useState<DaqStatus | null>(null);
  const [daqState, setDaqState] = useState(createInitialDaqState);
  const [daqStateReady, setDaqStateReady] = useState(false);
  const [dataSourceVersion, setDataSourceVersion] = useState(0);
  const backendWarningRef = useRef<Alert | null>(null);
  const staleWarningRef = useRef<Alert | null>(null);
  const hasEstablishedConnectionRef = useRef(false);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    let isCurrent = true;
    hasEstablishedConnectionRef.current = false;
    const unsubscribe = subscribeToLiquidsSse(baseUrl, {
      onSystemState: (nextState) => {
        if (isCurrent) {
          setDaqState(nextState);
          setDaqStateReady(true);
        }
      },
    });

    const resolveWarning = (warningRef: React.MutableRefObject<Alert | null>) => {
      warningRef.current?.stop();
      warningRef.current = null;
    };

    const pollStatus = async () => {
      if (isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      try {
        const response = await daqApi.getStatus(baseUrl);

        if (!isCurrent) {
          return;
        }

        const nextStatus = response.data;
        setStatus(nextStatus);
        setConnectionFailed(!nextStatus.ok);

        if (nextStatus.ok) {
          hasEstablishedConnectionRef.current = true;
          resolveWarning(backendWarningRef);
        } else if (!backendWarningRef.current) {
          const priority = hasEstablishedConnectionRef.current
            ? AlertPriority.WARNING
            : AlertPriority.CAUTION;
          backendWarningRef.current = new Alert(
            "DAQ backend unavailable",
            "The DAQ server reports that streaming is unavailable.",
            priority,
          );
        }

        if (nextStatus.stale) {
          const age = `${nextStatus.data_age_s.toFixed(1)} s`;
          if (staleWarningRef.current) {
            staleWarningRef.current.bottomLine = `Latest telemetry is ${age} old.`;
          } else {
            staleWarningRef.current = new Alert(
              "DAQ telemetry stale",
              `Latest telemetry is ${age} old.`,
              AlertPriority.WARNING,
            );
          }
        } else {
          resolveWarning(staleWarningRef);
        }
      } catch {
        if (!isCurrent) {
          return;
        }

        setStatus(null);
        setConnectionFailed(true);
        if (!backendWarningRef.current) {
          const priority = hasEstablishedConnectionRef.current
            ? AlertPriority.WARNING
            : AlertPriority.CAUTION;
          backendWarningRef.current = new Alert(
            "DAQ backend unavailable",
            "Unable to reach the DAQ status endpoint.",
            priority,
          );
        }
        resolveWarning(staleWarningRef);
      } finally {
        isPollingRef.current = false;
      }
    };

    void pollStatus();
    const interval = window.setInterval(() => void pollStatus(), STATUS_POLL_INTERVAL_MS);

    return () => {
      isCurrent = false;
      unsubscribe();
      window.clearInterval(interval);
      resolveWarning(backendWarningRef);
      resolveWarning(staleWarningRef);
    };
  }, [baseUrl, isConnected]);

  return {
    abort: () => daqApi.abort(baseUrl).then(() => undefined),
    baseUrl,
    connect: (nextBaseUrl) => {
      clearAlerts();
      setDataSourceVersion((version) => version + 1);
      setBaseUrl(nextBaseUrl.replace(/\/$/, ""));
      setConnectionFailed(false);
      setStatus(null);
      setConnectionFailed(false);
      setDaqState(createInitialDaqState());
      setDaqStateReady(false);
      setIsConnected(true);
    },
    disconnect: () => {
      clearAlerts();
      setDataSourceVersion((version) => version + 1);
      setStatus(null);
      setDaqState(createInitialDaqState());
      setDaqStateReady(false);
      setIsConnected(false);
    },
    isConnected,
    connectionFailed,
    status,
    daqState,
    daqStateReady,
    dataSourceVersion,
  };
}