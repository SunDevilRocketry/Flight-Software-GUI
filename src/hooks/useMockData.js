import { useState } from 'react';

export const useMockData = (setBoardInfo) => {
    const [mockConnected, setMockConnected] = useState(false)

    const onMockConnected = () => {
        setMockConnected(mockConnected => !mockConnected)
        setBoardInfo( 
            {
            firmware: "1.0.1",
            name: "MOCK FLIGHT",
            status: "RUNNING"
            }
        );
    }
    const onMockDisconnected = () => {
        console.log("DISCONNECTING MOCK FLIGHT")
        setMockConnected(mockConnected => !mockConnected)
        //setBoardInfo(null);
        
    } 

    return {
        mockConnected,
        onMockConnected,
        onMockDisconnected,
    };
};