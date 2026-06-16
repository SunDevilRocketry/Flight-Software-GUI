import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/utils/api";
import type { BoardInfo, BoardSummary, WirelessBoardInfo } from "@/components/widgets/BoardStatusWidget";

export interface UseBoardConnectionResult {
  boards: BoardSummary[];
  activeComPort: string | null;
  boardInfo: BoardInfo;
  wirelessBoardInfo: WirelessBoardInfo | null;
  setBoardInfo: React.Dispatch<React.SetStateAction<BoardInfo>>;
  connectToBoard: (name: string, onConnect: (success: boolean) => void) => void;
  disconnectBoard: (onDisconnect: (connected: boolean) => void) => void;
}

interface ControllerPacket {
  controller: {
    firmware: string;
    name: string;
  };
  status: string;
}

const WIRELESS_POLL_MS = 1500;

const EMPTY_BOARD_INFO: BoardInfo = {
  firmware: "",
  name: "",
};

export const useBoardConnection = (reset: boolean): UseBoardConnectionResult => {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [activeComPort, setActiveComPort] = useState<string | null>(null);
  const [boardInfo, setBoardInfo] = useState<BoardInfo>(EMPTY_BOARD_INFO);
  const [wirelessBoardInfo, setWirelessBoardInfo] = useState<WirelessBoardInfo | null>(null);
  const wirelessIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch COM ports on reset
  useEffect(() => {
    Promise.all([api.getComPorts(), api.getActiveComPort()])
      .then(([portsResponse, activeResponse]) => {
        setBoards(
          Object.entries(portsResponse.data as Record<string, string>).map(
            ([port, device_description]) => ({
              port,
              device_description,
            }),
          ),
        );

        if (activeResponse.status === 204 || !activeResponse.data) {
          setActiveComPort(null);
        } else {
          setActiveComPort(activeResponse.data as string);
        }
      })
      .catch((error: unknown) => {
        console.error("Error fetching board data:", error);
      });
  }, [reset]);

  const fetchWirelessInfo = useCallback(async () => {
    try {
      const response = await api.getWirelessInfo();

      if (response.status === 204 || !response.data) {
        setWirelessBoardInfo(null);
        return;
      }

      setWirelessBoardInfo(response.data as WirelessBoardInfo);
    } catch (error) {
      console.error("Error fetching wireless info:", error);
      setWirelessBoardInfo(null);
    }
  }, []);

  const startWirelessPolling = useCallback(() => {
    if (wirelessIntervalRef.current) return; // already polling

    fetchWirelessInfo();
    wirelessIntervalRef.current = setInterval(fetchWirelessInfo, WIRELESS_POLL_MS);
  }, [fetchWirelessInfo]);

  const stopWirelessPolling = useCallback(() => {
    if (wirelessIntervalRef.current) {
      api.stopDashboardDump();
      clearInterval(wirelessIntervalRef.current);
      wirelessIntervalRef.current = null;
    }
  }, []);

  const connectToBoard = useCallback(
    (name: string, onConnect: (success: boolean) => void) => {
      api
        .connectBoard(name)
        .then((response) => {
          const packet = response.data as ControllerPacket;
          console.log("Connected to PCB:", packet);
          setBoardInfo({
            firmware: packet.controller.firmware,
            name: packet.controller.name,
          });

          startWirelessPolling();
          api.startDashboardDump();

          onConnect(true);
        })
        .catch((error: unknown) => {
          console.error("Error connecting to PCB:", error);
          onConnect(false);
        });
    },
    [startWirelessPolling],
  );

  const disconnectBoard = useCallback(
    (onDisconnect: (connected: boolean) => void) => {
      api
        .disconnectBoard()
        .then(() => {
          stopWirelessPolling();
          api.stopDashboardDump();
          onDisconnect(false);
        })
        .catch(() => onDisconnect(true));
    },
    [stopWirelessPolling],
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopWirelessPolling();
    };
  }, [stopWirelessPolling]);

  return {
    boards,
    activeComPort,
    boardInfo,
    wirelessBoardInfo,
    setBoardInfo,
    connectToBoard,
    disconnectBoard,
  };
};
