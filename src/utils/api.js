import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';

export const api = {
    // Backend status
    checkBackend: () => axios.get(`${BASE_URL}/`),
    ping: () => axios.get(`${BASE_URL}/ping`),

    // Board management
    connectBoard: (comport) => {
        console.log("Connecting to board with comport:", comport);
        return axios.post(`${BASE_URL}/connect-p`, { comport:comport.toString() })
    },  
    getComPorts: () => axios.get(`${BASE_URL}/comports-l`),
    disconnectBoard: () => axios.get(`${BASE_URL}/comports-d`),

    // Sensor data
    getSensorData: () => axios.get(`${BASE_URL}/sensor-dump`),
    //getMockData: () => axios.get(`${BASE_URL}/sensor-dump-mock`)
};