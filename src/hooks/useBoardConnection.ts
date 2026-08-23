import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import type { BoardInfo, BoardSummary, WirelessBoardInfo } from "@/components/widgets/BoardStatusWidget";
import { subscribeToFlightSse } from "./SSE/sseFlight";

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

const EMPTY_BOARD_INFO: BoardInfo = {
  firmware: "",
  name: "",
};

export const useBoardConnection = (reset: boolean): UseBoardConnectionResult => {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [activeComPort, setActiveComPort] = useState<string | null>(null);
  const [boardInfo, setBoardInfo] = useState<BoardInfo>(EMPTY_BOARD_INFO);
  const [wirelessBoardInfo, setWirelessBoardInfo] = useState<WirelessBoardInfo | null>(null);
  const [sseEnabled, setSseEnabled] = useState(false);

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

          api.startDashboardDump();
          setSseEnabled(true);

          onConnect(true);
        })
        .catch((error: unknown) => {
          console.error("Error connecting to PCB:", error);
          onConnect(false);
        });
    },
    [],
  );

  const disconnectBoard = useCallback(
    (onDisconnect: (connected: boolean) => void) => {
      api
        .disconnectBoard()
        .then(() => {
          api.stopDashboardDump();
          setSseEnabled(false);
          setWirelessBoardInfo(null);
          onDisconnect(false);
        })
        .catch(() => onDisconnect(true));
    },
    [],
  );

  useEffect(() => {
    if (!sseEnabled) return;

    return subscribeToFlightSse({ onVehicleId: setWirelessBoardInfo });
  }, [sseEnabled]);

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
