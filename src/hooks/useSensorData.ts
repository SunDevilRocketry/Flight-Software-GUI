import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { MockFlight } from "@/utils/mock";
import type { SensorData } from "@/components/widgets/SensorReadingWidget";
import { subscribeToFlightSse } from "./SSE/sseFlight";

/** Used for renderers to determine the fastest possible update rate */
export const POLLING_INTERVAL_MS = 40;

/**
 * Raw sensor payload shape coming from the backend / mock flight source.
 * Field names mirror the device's wire format before conversion to the
 */
export interface RawSensorPacket {
  quat_w?: number;
  quat_x?: number;
  quat_y?: number;
  quat_z?: number;
  alt?: number;
  long?: number;
  lat?: number;
  acc_x?: number;
  roll_rate?: number;
  /** Present when the mock source returns an array instead of a single packet. */
  length?: number;
}

const INITIAL_SENSOR_DATA: SensorData = {
  w: 1,
  x: 0,
  y: 0,
  z: 0,
  alt: 0,
  long: 0,
  lat: 0,
  acc_x: 0,
  roll_rate: 0,
};

/** Formats a raw numeric value, falling back to the previous value when invalid. */
function toFixedOrPrevious(value: number | undefined, previous: number, digits = 2): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return previous;
  }
  return Number(Number(value).toFixed(digits));
}

function parseSensorData(data: RawSensorPacket | null | undefined, prevState: SensorData): SensorData {
  if (!data) {
    return prevState;
  }

  return {
    w: toFixedOrPrevious(data.quat_w, prevState.w, 6),
    x: toFixedOrPrevious(data.quat_x, prevState.x, 6),
    y: toFixedOrPrevious(data.quat_y, prevState.y, 6),
    z: toFixedOrPrevious(data.quat_z, prevState.z, 6),

    alt: toFixedOrPrevious(data.alt, prevState.alt),
    long: data.lat !== 0 || data.long !== 0 ? (data.long ?? prevState.long) : prevState.long,
    lat: data.lat !== 0 || data.long !== 0 ? (data.lat ?? prevState.lat) : prevState.lat,
    acc_x: toFixedOrPrevious(data.acc_x, prevState.acc_x),
    roll_rate: toFixedOrPrevious(data.roll_rate, prevState.roll_rate),
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
      const result: RawSensorPacket | undefined = mock
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
    if (!mock) return;

    const interval = setInterval(fetchData, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mock, fetchData]);

  useEffect(() => {
    if (!connected || mock) return;

    return subscribeToFlightSse({
      onDashboardData: (packet) => setSensorData((previous) => parseSensorData(packet, previous)),
    });
  }, [connected, mock]);

  return sensorData;
};