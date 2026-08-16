import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { MockFlight } from "@/utils/mock";
import type { SensorData } from "@/components/widgets/SensorReadingWidget";

/**
 * Raw sensor payload shape coming from the backend / mock flight source.
 * Field names mirror the device's wire format before conversion to the
 */
interface RawSensorPacket {
  quat_w?: number;
  quat_x?: number;
  quat_y?: number;
  quat_z?: number;
  alt?: number;
  long?: number;
  lat?: number;
  acc_z?: number;
  roll_rate?: number;
  /** Present when the mock source returns an array instead of a single packet. */
  length?: number;
}

const POLLING_INTERVAL_MS = 40;

const INITIAL_SENSOR_DATA: SensorData = {
  quatW: 1,
  quatX: 0,
  quatY: 0,
  quatZ: 0,
  altitude: 0,
  longitude: 0,
  latitude: 0,
  accelerationZ: 0,
  rollRate: 0,
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
    quatW: toFixedOrPrevious(data["Unit Quaternion W"], prevState.quatW, 6),
    quatX: toFixedOrPrevious(data["Unit Quaternion X"], prevState.quatX, 6),
    quatY: toFixedOrPrevious(data["Unit Quaternion Y"], prevState.quatY, 6),
    quatZ: toFixedOrPrevious(data["Unit Quaternion Z"], prevState.quatZ, 6),

    altitude: toFixedOrPrevious(data.alt, prevState.altitude),

    longitude: data["GPS Longitude (deg)"] !== 0 ||data["GPS Longitude (deg)"] !== 0 ? (data["GPS Longitude (deg)"] ?? prevState.longitude) : prevState.longitude,
    latitude:  data["GPS Latitude (deg)"] !== 0 || data["GPS Latitude (deg)"] !== 0 ? (data["GPS Latitude (deg)"]  ?? prevState.latitude)  : prevState.latitude,

    accelerationZ: toFixedOrPrevious(data["Pre-converted Accel Z"], prevState.accelerationZ),
    rollRate: toFixedOrPrevious(data["Roll Body Rate"], prevState.rollRate),
    time: toFixedOrPrevious(data["Time"], prevState.time, 1)
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
      setSensorData(prev => parseSensorData(result, prev));

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

  console.log(sensorData.time)
  return sensorData;
};