import { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';

export const useBoardConnection = (reset) => {
    const [boards, setBoards] = useState([]);
    const [boardInfo, setBoardInfo] = useState({
        firmware: null,
        name: null,
        status: null,
    });
    const [wirelessBoardInfo, setWirelessBoardInfo] = useState(null);
    const wirelessIntervalRef = useRef(null);

    // Fetch COM ports on reset
    useEffect(() => {
        api.getComPorts()
            .then(response => {
                setBoards(response.data);
            })
            .catch(error => {
                console.error('Error fetching board data:', error);
            });
    }, [reset]);

    // Function to start polling wireless info
    const startWirelessPolling = () => {
        if (wirelessIntervalRef.current) return; // already polling

        const fetchWirelessInfo = async () => {
            try {
                const response = await api.getWirelessInfo();

                // If 204 or empty response, set null
                if (response.status === 204 || !response.data) {
                    setWirelessBoardInfo(null);
                    return;
                }

                // The API returns the object directly
                setWirelessBoardInfo(response.data);

            } catch (error) {
                console.error('Error fetching wireless info:', error);
                setWirelessBoardInfo(null);
            }
        };

        // Initial fetch
        fetchWirelessInfo();

        // Poll every 1.5 seconds
        wirelessIntervalRef.current = setInterval(fetchWirelessInfo, 1500);
    };

    const stopWirelessPolling = () => {
        if (wirelessIntervalRef.current) {
            clearInterval(wirelessIntervalRef.current);
            wirelessIntervalRef.current = null;
        }
    };

    const connectToBoard = (name, onConnect) => {
        api.connectBoard(name)
            .then(response => {
                const packet = response.data;
                console.log("Connected to PCB:", packet);
                setBoardInfo({
                    firmware: packet.controller.firmware,
                    name: packet.controller.name,
                    status: packet.status
                });

                // Start polling wireless info
                startWirelessPolling();

                onConnect(true);
            })
            .catch(error => {
                console.error('Error connecting to PCB:', error);
                onConnect(false);
            });
    };

    const disconnectBoard = (onDisconnect) => {
        api.disconnectBoard()
            .then(() => {
                // Stop polling when disconnected
                stopWirelessPolling();
                onDisconnect(false);
            })
            .catch(() => onDisconnect(true));
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            stopWirelessPolling();
        };
    }, []);

    console.log(wirelessBoardInfo)

    return {
        boards,
        boardInfo,
        wirelessBoardInfo,
        setBoardInfo,
        connectToBoard,
        disconnectBoard
    };
};