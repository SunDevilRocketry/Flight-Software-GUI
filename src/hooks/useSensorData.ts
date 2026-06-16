import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { MockFlight } from "@/utils/mock";
import type { SensorData } from "@/components/widgets/SensorReadingWidget";

/**
 * Raw sensor payload shape coming from the backend / mock flight source.
 * Field names mirror the device's wire format before conversion to the
 * camelCase, human-readable `SensorData` shape used by the UI.
 */
interface RawSensorPacket {
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
  /** Present when the mock source returns an array instead of a single packet. */
  length?: number;
}

const POLLING_INTERVAL_MS = 40;

const INITIAL_SENSOR_DATA: SensorData = {
  accelerationX: 0,
  accelerationY: 0,
  accelerationZ: 0,
  gyroscopeX: 0,
  gyroscopeY: 0,
  gyroscopeZ: 0,
  pitch: 0,
  pitchRate: 0,
  roll: 0,
  rollRate: 0,
  yaw: 0,
  yawRate: 0,
  pressure: 0,
  velocity: 0,
  altitude: 0,
  chipTemperature: 0,
  longitude: 0,
  latitude: 0,
  time: 0,
};

/** Formats a raw numeric value, falling back to the previous value when invalid. */
function toFixedOrPrevious(value: number | undefined, previous: number, digits = 2): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return previous;
  }
  return Number(Number(value).toFixed(digits));
}

function parseSensorData(data: RawSensorPacket | null, prevState: SensorData): SensorData {
  if (!data) {
    return prevState;
  }

  return {
    accelerationX: toFixedOrPrevious(data.accXconv, prevState.accelerationX),
    accelerationY: toFixedOrPrevious(data.accYconv, prevState.accelerationY),
    accelerationZ: toFixedOrPrevious(data.accZconv, prevState.accelerationZ),

    gyroscopeX: toFixedOrPrevious(data.gyroXconv, prevState.gyroscopeX),
    gyroscopeY: toFixedOrPrevious(data.gyroYconv, prevState.gyroscopeY),
    gyroscopeZ: toFixedOrPrevious(data.gyroZconv, prevState.gyroscopeZ),

    pitch: toFixedOrPrevious(data.pitchDeg, prevState.pitch),
    pitchRate: toFixedOrPrevious(data.pitchRate, prevState.pitchRate),
    roll: toFixedOrPrevious(data.rollDeg, prevState.roll),
    rollRate: toFixedOrPrevious(data.rollRate, prevState.rollRate),
    yaw: toFixedOrPrevious(data.yawDeg, prevState.yaw),
    yawRate: toFixedOrPrevious(data.yawRate, prevState.yawRate),

    pressure: toFixedOrPrevious(data.pres, prevState.pressure),
    velocity: toFixedOrPrevious(data.bvelo, prevState.velocity),
    altitude: toFixedOrPrevious(data.alt, prevState.altitude),

    time: toFixedOrPrevious(data.time, prevState.time),

    longitude: data.lat !== 0 || data.long !== 0 ? (data.long ?? prevState.longitude) : prevState.longitude,
    latitude: data.lat !== 0 || data.long !== 0 ? (data.lat ?? prevState.latitude) : prevState.latitude,
    chipTemperature: toFixedOrPrevious(data.temp, prevState.chipTemperature),
  };
}

export const useSensorData = (
  connected: boolean,
  mock: boolean,
  onConnectionLost?: () => void,
): SensorData => {
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR_DATA);
  const [rowCount, setRowCount] = useState<number>(0);

  const fetchData = useCallback(async () => {
    try {
      const result: RawSensorPacket = mock
        ? await MockFlight.getSensorData(rowCount)
        : (await api.getSensorData()).data;

      // Mock data occasionally flickers in a malformed (array-shaped) packet;
      // skip the update rather than corrupting state with it.
      if (result && typeof result.length === "number") {
        return;
      }

      setSensorData((prev) => parseSensorData(result, prev));

      if (mock) {
        setRowCount((count) => count + 1);
      }
    } catch (err) {
      console.error("Connection error:", err);
      if (!mock) onConnectionLost?.();
    }
  }, [mock, rowCount, onConnectionLost]);

  useEffect(() => {
    if (!connected && !mock) return;

    const interval = setInterval(fetchData, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [connected, mock, fetchData]);

  return sensorData;
};
