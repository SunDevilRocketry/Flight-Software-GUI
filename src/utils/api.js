import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
// const BASE_URL = 'http://localhost:5000';

export const api = {
    // Backend status
    checkBackend: () => axios.get(`${BASE_URL}/`),
    ping: () => axios.get(`${BASE_URL}/ping`),

    // Board management
    connectBoard: (comport) => {
        console.log("Connecting to board with comport:", comport);
        return axios.post(`${BASE_URL}/connect`, { comport:comport.toString() })
    },  
    getComPorts: () => axios.get(`${BASE_URL}/comports`),
    disconnectBoard: () => axios.get(`${BASE_URL}/disconnect`),
    getWirelessInfo: () => axios.get(`${BASE_URL}/wireless-stats`),

    // Sensor data
    startDashboardDump: () => axios.post(`${BASE_URL}/dashboard-dump`, { start:true }),
    stopDashboardDump: () => axios.post(`${BASE_URL}/dashboard-dump`, { stop:true }),
    getSensorData: () => axios.get(`${BASE_URL}/dashboard-dump`),
};