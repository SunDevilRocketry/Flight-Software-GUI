import { api } from "@/utils/api";
import { useState, useEffect } from "react";

export function useBackendConnection() {
    const [connected, setConnected] = useState(false);
    const [reset, setReset] = useState(false);

    const checkBoardStatus = () => {
        api.checkBackend()
            .then((response) => {
                setReset(!reset);
            })
            .catch(error => {
                console.log("Backend not reachable ", error);
            })
    }

    const checkStatusPing = () => {
        api.ping()
            .then((response) => {
                console.log("ping status ", response);
                setConnected(true)
            })
            .catch((error) => {
                console.log("ping error ", error);
                setConnected(false);
                setReset(prev => !prev);
            });
    }


    useEffect(() => {
        if (!connected) {
            const interval = setInterval(() => {
                checkBoardStatus();
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [connected]);


    return {
        connected,
        setConnected,
        reset,
        setReset,
        checkStatusPing,
    };
}