import axios, { type AxiosResponse } from "axios";

const BASE_URL = "http://127.0.0.1:5000";
// const BASE_URL = 'http://localhost:5000';

export interface ConnectBoardPacket {
  controller: {
    firmware: string;
    name: string;
  };
  status: string;
}

export interface WirelessInfoResponse {
  target: string;
  firmware: string;
}

/** Raw per-port description map: { "COM3": "USB Serial Device", ... } */
export type ComPortsMap = Record<string, string>;

/** Raw sensor payload shape coming from the backend dashboard-dump endpoint. */
export interface RawSensorPacket {
  accXconv?: number;
  accYconv?: number;
  accZconv?: number;
  gyroXconv?: number;
  gyroYconv?: number;
  gyroZconv?: number;
  pitchDeg?: number;
  pitchRate?: number;
  rollDeg?: number;
  rollRate?: number;
  yawDeg?: number;
  yawRate?: number;
  pres?: number;
  bvelo?: number;
  alt?: number;
  time?: number;
  lat?: number;
  long?: number;
  temp?: number;
}

export const api = {
  // Backend status
  checkBackend: (): Promise<AxiosResponse<unknown>> => axios.get(`${BASE_URL}/`),
  ping: (): Promise<AxiosResponse<unknown>> => axios.get(`${BASE_URL}/ping`),

  // Board management
  connectBoard: (comport: string): Promise<AxiosResponse<ConnectBoardPacket>> => {
    console.log("Connecting to board with comport:", comport);
    return axios.post(`${BASE_URL}/connect`, { comport: comport.toString() });
  },
  getComPorts: (): Promise<AxiosResponse<ComPortsMap>> => axios.get(`${BASE_URL}/comports`),
  getActiveComPort: (): Promise<AxiosResponse<string | null>> =>
    axios.get(`${BASE_URL}/comports/active`),
  disconnectBoard: (): Promise<AxiosResponse<unknown>> => axios.get(`${BASE_URL}/disconnect`),
  getWirelessInfo: (): Promise<AxiosResponse<WirelessInfoResponse | null>> =>
    axios.get(`${BASE_URL}/wireless-stats`),

  // Sensor data
  startDashboardDump: (): Promise<AxiosResponse<unknown>> =>
    axios.post(`${BASE_URL}/dashboard-dump`, { start: true }),
  stopDashboardDump: (): Promise<AxiosResponse<unknown>> =>
    axios.post(`${BASE_URL}/dashboard-dump`, { stop: true }),
  getSensorData: (): Promise<AxiosResponse<RawSensorPacket>> =>
    axios.get(`${BASE_URL}/dashboard-dump`),
};
