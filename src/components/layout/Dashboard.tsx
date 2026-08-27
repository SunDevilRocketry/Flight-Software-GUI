"use client";

import React, { useState, useEffect, type FC } from "react";

import MyThree from "@/utils/Three";
import Settings, { type SettingsType } from "@/components/layout/Settings";

import { SensorReadingWidget, type SensorData } from "@/components/widgets/SensorReadingWidget";
import {
  BoardStatusWidget,
  type BoardInfo,
  type BoardSummary,
  type WirelessBoardInfo,
} from "@/components/widgets/BoardStatusWidget";
import { AltitudeTape } from "@/components/widgets/AltitudeTape";
import { altitudeHandler, AltitudeMode } from "@/utils/units/units";
import { MockFlight } from "@/utils/mock";

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

const controlButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/15 text-base-content transition hover:bg-black/25";

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [attemptedAutoConnect, setAttemptedAutoConnect] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fs:settings");
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.darkMode === "boolean") setDarkMode(!!s.darkMode);

        try {
          if (typeof s.altMode === "string") {
            altitudeHandler.mode = s.altMode === "QFE" ? AltitudeMode.QFE : AltitudeMode.QNH;
          }
          if (typeof s.referenceElevation === "number") {
            altitudeHandler.referenceElevation = s.referenceElevation;
          } else if (s.referenceElevation === null) {
            altitudeHandler.referenceElevation = -0.1;
          }
        } catch (e) {
          console.error("Failed to apply altitude settings on load", e);
        }

        try {
          if (typeof s.demoMode === "boolean") {
            MockFlight.setDemoMode(!!s.demoMode);
            if (s.demoMode && !mockConnected) {
              onMockConnected();
            }
          }
          if (typeof s.mockFile === "string" && s.mockFile) MockFlight.setSource(s.mockFile);
        } catch (err) {
          console.error("Failed to apply mock settings on load", err);
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fs:settings");
      if (!attemptedAutoConnect && raw) {
        const s = JSON.parse(raw);
        if (s?.autoConnect && s?.defaultComPort && !connected && !mockConnected) {
          setAttemptedAutoConnect(true);
          connectToBoard(s.defaultComPort, (success: boolean) => {
            setConnected(success);
            if (!success) setReset((prev) => !prev);
          });
        }
      }
    } catch (e) {
      /* ignore */
    }
  }, [attemptedAutoConnect, connectToBoard, connected, mockConnected, setReset]);

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

 const onSettingsChanged = (s: SettingsType | null) => {
   if (!s) return;
   if (typeof s.darkMode === "boolean") setDarkMode(!!s.darkMode);

   if (s.autoConnect && s.defaultComPort && !connected && !mockConnected) {
     connectToBoard(s.defaultComPort, (success: boolean) => {
       setConnected(success);
       if (!success && !mockConnected) setReset((prev) => !prev);
     });
   }

   try {
     if (typeof s.altMode === "string") {
       altitudeHandler.mode = s.altMode === "QFE" ? AltitudeMode.QFE : AltitudeMode.QNH;
     }
     if (typeof s.referenceElevation === "number") {
       altitudeHandler.referenceElevation = s.referenceElevation;
     } else if (s.referenceElevation === null) {
       altitudeHandler.referenceElevation = -0.1;
     }

     if (typeof s.demoMode === "boolean") {
       MockFlight.setDemoMode(!!s.demoMode);
       if (s.demoMode && !mockConnected) {
         onMockConnected();
       }
       if (!s.demoMode && mockConnected) {
         onMockDisconnected();
       }
     }
     if (typeof s.mockFile === "string" && s.mockFile) {
       MockFlight.setSource(s.mockFile);
     }
   } catch (e) {
     console.error("Failed to apply settings", e);
   }
 };

 return (
   <div className="flex h-screen w-full overflow-hidden no-scrollbar">

     {/* Left panel*/}
     <div className="flex h-screen w-1/3 min-w-[20rem]">
       
       {/* Control buttons */}
       <div className="relative opacity-75 transition-opacity duration-300 hover:opacity-95">
         <div className="fixed left-4 top-4 z-50 flex items-center gap-2">
           <button
             type="button"
             onClick={() => setDarkMode((prev) => !prev)}
             className={controlButtonClass}
             aria-label="Toggle dark mode"
           >
             {darkMode ? <BrightnessIcon /> : <BrightnessIcon className="fill-base-200" />}
           </button>

           <button
             type="button"
             onClick={() => setShowSettingsModal((prev) => !prev)}
             className={controlButtonClass}
             aria-label="Open settings"
             title="Settings"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
               <path d="M9.405 1.05c-.413-1.4-2.5-1.4-2.913 0l-.1.34a1.99 1.99 0 0 1-1.516 1.255l-.356.084c-1.4.333-1.4 2.5 0 2.833l.356.083c.596.14 1.076.558 1.316 1.083l.1.339c.413 1.4 2.5 1.4 2.913 0l.1-.338c.24-.525.72-.942 1.316-1.083l.356-.083c1.4-.333 1.4-2.5 0-2.833l-.356-.084a1.99 1.99 0 0 1-1.516-1.255l-.1-.34zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
             </svg>
           </button>
         </div>
       </div>

       {/* Left panel with 3D model and altitude tape */}
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

         <div className="relative flex h-full w-[clamp(3.5rem,4.6vw,5rem)] flex-shrink-0 items-stretch bg-base p-0 transition-colors duration-700 dark:bg-base">
           <AltitudeTape altitudeMeters={sensorData.alt} />
         </div>
       </div>
     </div>


      {/* Right panel with widgets and settings modal */}
     <div className="h-screen min-w-0 flex-1 overflow-y-auto bg-base p-6 no-scrollbar transition-colors duration-700 dark:bg-base">
       <div className="flex w-full gap-3 sm:gap-4 xl:gap-6">
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

       <div className="mb-6 rounded-lg bg-base-100/50 p-4 text-base-700 shadow-xl transition-colors duration-700 dark:bg-base-100 dark:text-highlight">
         <h2 className="text-lg font-bold">GPS Coordinate</h2>
       </div>

       <Settings toggle={showSettingsModal} setToggle={setShowSettingsModal} onChange={onSettingsChanged} />
     </div>
   </div>
 );
};