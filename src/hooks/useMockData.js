import { MockFlight } from '@/utils/mock';
import { useState, useEffect } from 'react';

export const useMockData = (setBoardInfo) => {
    const [mockConnected, setMockConnected] = useState(false)

    const onMockConnected = () => {
        setMockConnected(!mockConnected)
        setBoardInfo( 
            {
            firmware: "JERRY",
            name: "MOCK FLIGHT",
            status: "RUNNING"
            }
        );
    } 

    return {
        mockConnected,
        onMockConnected,
    };
};