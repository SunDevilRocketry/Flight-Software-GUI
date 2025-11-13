import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

export const useBoardConnection = (reset) => {
    const [boards, setBoards] = useState([]);
    const [boardInfo, setBoardInfo] = useState({
        firmware: null,
        name: null,
        status: null,
    }); "?"

    useEffect(() => {
        api.getComPorts()
            .then(response => {
                setBoards(response.data);
            })
            .catch(error => {
                console.error('Error fetching board data:', error);
                
            });
    }, [reset]);

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
                onConnect(true);
            })
            .catch(error => {
                console.error('Error connecting to PCB:', error);
                onConnect(false);
            });
    };

    const disconnectBoard = (onDisconnect) => {
        api.disconnectBoard()
            .then(() => onDisconnect(false))
            .catch(() => onDisconnect(true));
    };

    return {
        boards,
        boardInfo,
        setBoardInfo,
        connectToBoard,
        disconnectBoard
    };
};