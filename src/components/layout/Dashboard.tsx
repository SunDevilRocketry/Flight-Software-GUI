"use client";

import React, { useState, useEffect, type FC } from "react";

import MyThree from "@/utils/Three";

import { SensorReadingWidget, type SensorData } from "@/components/widgets/SensorReadingWidget";
import {
  BoardStatusWidget,
  type BoardInfo,
  type BoardSummary,
  type WirelessBoardInfo,
} from "@/components/widgets/BoardStatusWidget";
import { AltitudeTape } from "@/components/widgets/AltitudeTape";
import MapWidget from "@/components/widgets/MapWidget";

import { useBackendConnection } from "@/hooks/useBackendConnection";
import { useBoardConnection } from "@/hooks/useBoardConnection";
import { useSensorData } from "@/hooks/useSensorData";
import { useMockData } from "@/hooks/useMockData";

interface UseBackendConnectionResult {
  connected: boolean;
  setConnected: (connected: boolean) => void;
  reset: boolean;
  setReset: React.Dispatch<React.SetStateAction<boolean>>;
  checkStatusPing: () => void;
}

interface UseBoardConnectionResult {
  boards: BoardSummary[];
  activeComPort: string | null;
  boardInfo: BoardInfo;
  wirelessBoardInfo: WirelessBoardInfo | null;
  setBoardInfo: React.Dispatch<React.SetStateAction<BoardInfo>>;
  connectToBoard: (boardName: string, callback: (success: boolean) => void) => void;
  disconnectBoard: (setConnected: (connected: boolean) => void) => void;
}

interface UseMockDataResult {
  mockConnected: boolean;
  onMockConnected: () => void;
  onMockDisconnected: () => void;
}

const BrightnessIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    className={`bi bi-brightness-high ${className ?? ""}`}
    viewBox="0 0 16 16"
  >
    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708" />
  </svg>
);

export const Dashboard: FC = () => {
  const { connected, setConnected, reset, setReset, checkStatusPing } =
    useBackendConnection() as UseBackendConnectionResult;

  const {
    boards,
    activeComPort,
    boardInfo,
    wirelessBoardInfo,
    setBoardInfo,
    connectToBoard,
    disconnectBoard,
  } = useBoardConnection(reset) as UseBoardConnectionResult;

  const { mockConnected, onMockConnected, onMockDisconnected } = useMockData(
    setBoardInfo,
  ) as UseMockDataResult;

  const sensorData = useSensorData(connected, mockConnected, checkStatusPing) as SensorData;

  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleConnect = (boardName: string): void => {
    if (mockConnected) return;
    connectToBoard(boardName, (success: boolean) => {
      setConnected(success);
      if (!success && !mockConnected) setReset((prev) => !prev);
    });
  };

  const handleDisconnect = (): void => {
    onMockDisconnected();
    if (connected) {
      disconnectBoard(setConnected);
    }
  };

  return (
    <div className="flex h-screen w-full no-scrollbar">
      {/* Left Side - 3D Model */}
      <div className="flex h-screen min-w-[320px] flex-shrink basis-1/3 items-stretch justify-center">
        <div className="relative opacity-75 hover:opacity-95">
          <div
            className={`fixed top-4 left-4 z-49 p-2 size-10 rounded-full ${
              darkMode ? "bg-zinc-200/10" : "bg-zinc-700/40"
            }`}
          />
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="fixed top-4 left-4 z-50 p-2 rounded-full text-base-content transition"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <BrightnessIcon /> : <BrightnessIcon className="fill-base-200" />}
          </button>
        </div>

        <div className="flex h-full w-full items-stretch">
          <div className="min-w-0 flex-1">
            <MyThree
              w={sensorData.w}
              x={sensorData.x}
              y={sensorData.y}
              z={sensorData.z}
              lightMode={darkMode}
            />
          </div>

          <div className="relative flex h-full flex-shrink-0 items-stretch bg-base transition-colors duration-700 dark:bg-base">
            <AltitudeTape altitudeMeters={sensorData.alt} />
          </div>
        </div>
      </div>

      {/* Right Side - Data Panels */}
      <div className="h-screen min-w-0 flex-1 overflow-y-auto bg-base p-6 no-scrollbar transition-colors duration-700 dark:bg-base">
        <div className="flex w-full space-x-6">
          <SensorReadingWidget sensorData={sensorData} />
          <BoardStatusWidget
            boards={boards}
            activeComPort={activeComPort}
            boardInfo={boardInfo}
            wirelessBoardInfo={wirelessBoardInfo}
            connected={connected}
            onConnect={handleConnect}
            mockConnected={mockConnected}
            onMockConnected={onMockConnected}
            onDisconnect={handleDisconnect}
          />
        </div>

        {/* GPS Coordinate / Map */}
        <MapWidget sensorData={sensorData} darkMode={darkMode} />
      </div>
    </div>
  );
};
