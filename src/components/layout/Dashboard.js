"use client";

//React
import React, { useState, useEffect } from 'react';

//Services
import MyThree from '@/utils/Three.js';
import GoogleMap from "@/utils/GoogleMaps.js";

//Custom UI Components: Widgets
import { SensorReadingWidget } from '@/components/widgets/SensorReadingWidget.js';
import { BoardStatusWidget } from '@/components/widgets/BoardStatusWidget.js';

//Custom Hooks
import { useBackendConnection } from '@/hooks/useBackendConnection';
import { useBoardConnection } from '@/hooks/useBoardConnection';
import { useSensorData } from '@/hooks/useSensorData';
import { useMockData } from '@/hooks/useMockData';

export function Dashboard() {
    const { connected, setConnected, reset, setReset, checkStatusPing } = useBackendConnection();
    const { boards, boardInfo, setBoardInfo, connectToBoard, disconnectBoard } = useBoardConnection(reset);
    const { mockConnected, onMockConnected, onMockDisconnected } = useMockData(setBoardInfo);
    const sensorData = useSensorData(connected, mockConnected, checkStatusPing);

    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleConnect = (boardName) => {
        if(mockConnected) return;
        connectToBoard(boardName, (success) => {
            setConnected(success);
            if (!success && !mockConnected) setReset(prev => !prev);
        });
    };

    const handleDisconnect = () => {
        onMockDisconnected();
        if(connected){
            disconnectBoard(setConnected);

        }
    };

    return (

        <div className="flex h-screen w-full no-scrollbar ">

            {/* Left Side - 3D Model */}
            <div className="w-1/3 h-screen flex items-center justify-center">
                <div className='relative' >
                    <div className={`fixed top-4 left-4 z-49 p-2 size-12 rounded-full ${darkMode ? 'bg-zinc-200/10' : 'bg-zinc-800/20'} `}></div>
                    <button
                        onClick={() => setDarkMode((prev) => !prev)} 
                        className="fixed top-4 left-4 z-50 p-2 rounded-full text-base-content transition"
                    >
                        {
                        darkMode ? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-brightness-high" viewBox="0 0 16 16">
                        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
                        </svg> 
                        : 
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-moon fill-base-600" viewBox="0 0 16 16">
                        <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/>
                        </svg>
                        }
                    </button>
                </div>
                <MyThree
                    roll={sensorData.roll}
                    pitch={sensorData.pitch}
                    yaw={sensorData.yaw}
                    accelerationX={sensorData.accelerationX}
                    accelerationY={sensorData.accelerationY}
                    accelerationZ={sensorData.accelerationZ}
                    lightMode={darkMode}
                />
            </div>

            {/* Right Side - Data Panels */}
            
            <div className="w-2/3 h-screen overflow-y-auto bg-base-600 dark:bg-base p-6 no-scrollbar transition-colors duration-700">
                <div className="flex w-full space-x-6">
                    <SensorReadingWidget sensorData={sensorData} />
                    <BoardStatusWidget
                        boards={boards}
                        boardInfo={boardInfo}
                        connected={connected}
                        onConnect={handleConnect}
                        mockConnected={mockConnected}
                        onMockConnected={onMockConnected}
                        onDisconnect={handleDisconnect}
                    />
                </div>

                {/* GPS Coordinate */}
                <div className="mb-6 p-4 rounded-lg bg-base-700 text-base-200 dark:bg-base-100 dark:text-highlight transition-colors duration-700">
                    <h2 className="text-lg font-bold ">GPS Coordinate</h2>
                    <GoogleMap
                        latitude={sensorData.latitude}
                        longitude={sensorData.longitude}
                    />
                </div>
            </div>
        </div>

    );


}
