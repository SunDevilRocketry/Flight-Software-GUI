import axios from 'axios';

export const BASE_IP = '127.0.0.1'
export const BASE_PORT = '5000'
export const BASE_URL = 'http://' + BASE_IP + ':' + BASE_PORT;

export const api = {
    // Backend status
    checkBackend: () => axios.get(`${BASE_URL}/`),
    ping: () => axios.get(`${BASE_URL}/ping`),

    // Board management
    connectBoard: (comport) => axios.post(`${BASE_URL}/connect-p`, { comport }),
    getComPorts: () => axios.get(`${BASE_URL}/comports-l`),
    disconnectBoard: () => axios.get(`${BASE_URL}/comports-d`),

    // Sensor data
    getSensorData: () => getSensorDataWS()
};