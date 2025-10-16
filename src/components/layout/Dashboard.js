"use client";

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

export function Dashboard() {
    const { connected, setConnected, reset, setReset, checkStatusPing } = useBackendConnection();
    const { boards, boardInfo, connectToBoard, disconnectBoard } = useBoardConnection(reset);
    const sensorData = useSensorData(false, true, checkStatusPing);


    const handleConnect = (boardName) => {
        connectToBoard(boardName, (success) => {
            setConnected(success);
            if (!success) setReset(prev => !prev);
        });
    };

    const handleDisconnect = () => {
        disconnectBoard(setConnected);
    };

    return (

        <div className="flex h-screen w-full no-scrollbar">
            {/* Left Side - 3D Model */}
            <div className="w-1/3 h-screen flex items-center justify-center">
                <MyThree
                    roll={sensorData.roll}
                    pitch={sensorData.pitch}
                    yaw={sensorData.yaw}
                    accelerationX={sensorData.accelerationX}
                    accelerationY={sensorData.accelerationY}
                    accelerationZ={sensorData.accelerationZ}
                />
            </div>

            {/* Right Side - Data Panels */}
            <div className="w-2/3 h-screen overflow-y-auto bg-base p-6 no-scrollbar">
                <div className="flex w-full space-x-6">
                    <SensorReadingWidget sensorData={sensorData} />
                    <BoardStatusWidget
                        boards={boards}
                        boardInfo={boardInfo}
                        connected={connected}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                    />
                </div>

                {/* GPS Coordinate */}
                <div className="mb-6 p-4 bg-base-100 rounded-lg">
                    <h2 className="text-lg font-bold">GPS Coordinate</h2>
                    <GoogleMap
                        latitude={sensorData.latitude}
                        longitude={sensorData.longitude}
                    />
                </div>
            </div>
        </div>

    );


}
