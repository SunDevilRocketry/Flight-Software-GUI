import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";

export interface UseBackendConnectionResult {
  connected: boolean;
  setConnected: (connected: boolean) => void;
  reset: boolean;
  setReset: React.Dispatch<React.SetStateAction<boolean>>;
  checkStatusPing: () => void;
}

const BOARD_STATUS_POLL_MS = 2000;

export function useBackendConnection(): UseBackendConnectionResult {
  const [connected, setConnected] = useState<boolean>(false);
  const [reset, setReset] = useState<boolean>(false);

  const checkBoardStatus = useCallback(() => {
    api
      .checkBackend()
      .then(() => {
        setReset((prev) => !prev);
      })
      .catch((error: unknown) => {
        console.error("Backend not reachable", error);
      });
  }, []);

  const checkStatusPing = useCallback(() => {
    api
      .ping()
      .then((response: unknown) => {
        console.log("ping status", response);
        setConnected(true);
      })
      .catch((error: unknown) => {
        console.error("ping error", error);
        setConnected(false);
        setReset((prev) => !prev);
      });
  }, []);

  useEffect(() => {
    if (connected) return;

    const interval = setInterval(checkBoardStatus, BOARD_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [connected, checkBoardStatus]);

  return {
    connected,
    setConnected,
    reset,
    setReset,
    checkStatusPing,
  };
}
