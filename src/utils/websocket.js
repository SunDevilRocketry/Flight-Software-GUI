import { BASE_IP } from '@/utils/api';

export const SOCK_URL = "ws://127.0.0.1:5050";

let socket = null;
let listeners = [];
let sensor_data = null;

function createSocket() {
    const ws = new WebSocket(SOCK_URL);

    ws.onopen = () => {
        console.log("Socket Opened.");
    };

    ws.onmessage = (event) => {
        sensor_data = JSON.parse(event.data.trim());
    };

    ws.onclose = (event) => {
        console.log("Socket closed. Attempting auto-reconnect. ", event.reason);
        socket = null;
        setTimeout(getSocket, 3000); // auto-reconnect
    };

    ws.onerror = (err) => {
        console.error("Socket error: ", err);
        ws.close();
    };

    return ws;
}

function getSocket() {
    if (!socket || socket.readyState === WebSocket.CLOSED) {
        socket = createSocket();
    }
    return socket;
}

export function getSensorDataWS() {
    if ( sensor_data == null) {
        getSocket();
        return new Promise((resolve, reject) => {
        
        // Resolve if sensor data already exists
        if (sensor_data !== null) {
            resolve(sensor_data);
            return;
        }

        // Else wait
        const checkInterval = setInterval(() => {
        if (sensor_data !== null) {
            clearInterval(checkInterval);
            resolve(sensor_data);
        } }, 100); // check every 10ms

        // Timeout if no data
        setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Timed out waiting for sensor_data"));
        }, 5000); // 5 seconds timeout
        });
    }
    else {
        return sensor_data;
    }
}