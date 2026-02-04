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
    const { boards, boardInfo, wirelessBoardInfo, setBoardInfo, connectToBoard, disconnectBoard } = useBoardConnection(reset);
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
                <div className='relative opacity-75 hover:opacity-95' >
                    <div className={`fixed top-4 left-4 z-49 p-2 size-10  rounded-full ${darkMode ? 'bg-zinc-200/10' : 'bg-zinc-700/40'} `}></div>
                    <button
                        onClick={() => setDarkMode((prev) => !prev)} 
                        className="fixed top-4 left-4 z-50 p-2 rounded-full text-base-content transition"
                    >
                        {
                        darkMode ? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-brightness-high" viewBox="0 0 16 16">
                        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
                        </svg> 
                        : 
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-brightness-high fill-base-200" viewBox="0 0 16 16">
                        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
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
                        wirelessBoardInfo={wirelessBoardInfo}
                        connected={connected}
                        onConnect={handleConnect}
                        mockConnected={mockConnected}
                        onMockConnected={onMockConnected}
                        onDisconnect={handleDisconnect}
                    />
                </div>

                {/* GPS Coordinate */}
                <div className="mb-6 p-4 rounded-lg bg-base-700 text-base-200 dark:bg-base-100 dark:text-highlight transition-colors duration-700 shadow-xl">
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
