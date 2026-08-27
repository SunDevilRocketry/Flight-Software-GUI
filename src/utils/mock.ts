import Papa from "papaparse";
import { Euler, MathUtils, Quaternion } from "three";

export interface MockSensorPacket {
  quat_w?: number;
  quat_x?: number;
  quat_y?: number;
  quat_z?: number;
  alt?: number;
  lat?: number;
  long?: number;
  acc_x?: number;
  roll_rate?: number;
}

const DEFAULT_SOURCE = "/extracted_data.csv";

let csvRowsCache: MockSensorPacket[] | null = null;
let currentSource = DEFAULT_SOURCE;
let demoMode = false;

let demoStepIndex = 0;
let currentDemoState: MockSensorPacket | null = null;
let targetDemoState: MockSensorPacket | null = null;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function packetToQuaternion(packet: MockSensorPacket | null | undefined): Quaternion {
  const source = packet ?? {};
  return new Quaternion(
    source.quat_x ?? 0,
    source.quat_y ?? 0,
    source.quat_z ?? 0,
    source.quat_w ?? 1,
  );
}

function quaternionToPacket(quaternion: Quaternion): MockSensorPacket {
  return {
    quat_w: quaternion.w,
    quat_x: quaternion.x,
    quat_y: quaternion.y,
    quat_z: quaternion.z,
  };
}

function blendDemoPacket(base?: MockSensorPacket): MockSensorPacket {
  const previousAlt = base?.alt ?? 384;
  const previousLat = base?.lat ?? 55.6721;
  const previousLong = base?.long ?? 12.5216;
  const previousAccX = base?.acc_x ?? 0;
  const previousRollRate = base?.roll_rate ?? 0;

  const quaternion = new Quaternion().setFromEuler(
    new Euler(
      toRadians((Math.random() - 0.5) * 30),
      toRadians((Math.random() - 0.5) * 20),
      toRadians((Math.random() - 0.5) * 60),
      "XYZ",
    ),
  );

  return {
    ...quaternionToPacket(quaternion),
    alt: MathUtils.clamp(previousAlt + (Math.random() - 0.5) * 26, 300, 500),
    lat: Number((previousLat + (Math.random() - 0.5) * 0.0008).toFixed(6)),
    long: Number((previousLong + (Math.random() - 0.5) * 0.0008).toFixed(6)),
    acc_x: Number((previousAccX + (Math.random() - 0.5) * 0.6).toFixed(2)),
    roll_rate: Number((previousRollRate + (Math.random() - 0.5) * 18).toFixed(2)),
  };
}

function initDemoState() {
  currentDemoState = blendDemoPacket();
  targetDemoState = blendDemoPacket(currentDemoState);
  demoStepIndex = 0;
}

function nextDemoPacket(): MockSensorPacket {
  if (!currentDemoState || !targetDemoState) {
    initDemoState();
  }

  const steps = 40;
  const t = demoStepIndex >= steps ? 1 : demoStepIndex / steps;
  const currentQuaternion = packetToQuaternion(currentDemoState ?? {});
  const targetQuaternion = packetToQuaternion(targetDemoState ?? {});
  const nextQuaternion = currentQuaternion.clone().slerp(targetQuaternion, t);

  const nextPacket: MockSensorPacket = {
    ...quaternionToPacket(nextQuaternion),
    alt: Number(MathUtils.lerp(currentDemoState?.alt ?? 0, targetDemoState?.alt ?? 0, t).toFixed(2)),
    lat: Number(MathUtils.lerp(currentDemoState?.lat ?? 0, targetDemoState?.lat ?? 0, t).toFixed(6)),
    long: Number(MathUtils.lerp(currentDemoState?.long ?? 0, targetDemoState?.long ?? 0, t).toFixed(6)),
    acc_x: Number(MathUtils.lerp(currentDemoState?.acc_x ?? 0, targetDemoState?.acc_x ?? 0, t).toFixed(2)),
    roll_rate: Number(
      MathUtils.lerp(currentDemoState?.roll_rate ?? 0, targetDemoState?.roll_rate ?? 0, t).toFixed(2),
    ),
  };

  demoStepIndex += 1;

  if (demoStepIndex >= steps) {
    currentDemoState = targetDemoState;
    targetDemoState = blendDemoPacket(currentDemoState);
    demoStepIndex = 0;
  }

  return nextPacket;
}

function clearCache() {
  csvRowsCache = null;
}

async function fetchCsvRows(): Promise<MockSensorPacket[]> {
  if (csvRowsCache) {
    return csvRowsCache;
  }

  const response = await fetch(currentSource);
  if (!response.ok) {
    throw new Error(`Failed to load mock CSV: ${response.status}`);
  }

  const csv = await response.text();
  const parsed = Papa.parse<Record<string, string | number | null>>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const rows: MockSensorPacket[] = [];

  for (const row of parsed.data ?? []) {
    const alt = Number(row["Barometric Altitude"] ?? row["alt"] ?? NaN);
    const lat = Number(row["GPS Latitude (deg)"] ?? row["lat"] ?? NaN);
    const long = Number(row["GPS Longitude (deg)"] ?? row["long"] ?? NaN);
    const accX = Number(row["Pre-converted Accel X"] ?? row["acc_x"] ?? NaN);
    const rollRate = Number(row["Roll Body Rate"] ?? row["roll_rate"] ?? NaN);
    const quatW = Number(row["Unit Quaternion W"] ?? row["quat_w"] ?? NaN);
    const quatX = Number(row["Unit Quaternion X"] ?? row["quat_x"] ?? NaN);
    const quatY = Number(row["Unit Quaternion Y"] ?? row["quat_y"] ?? NaN);
    const quatZ = Number(row["Unit Quaternion Z"] ?? row["quat_z"] ?? NaN);

    if (!Number.isFinite(alt) && !Number.isFinite(lat) && !Number.isFinite(long)) {
      continue;
    }

    rows.push({
      quat_w: Number.isFinite(quatW) ? quatW : undefined,
      quat_x: Number.isFinite(quatX) ? quatX : undefined,
      quat_y: Number.isFinite(quatY) ? quatY : undefined,
      quat_z: Number.isFinite(quatZ) ? quatZ : undefined,
      alt: Number.isFinite(alt) ? alt : undefined,
      lat: Number.isFinite(lat) ? lat : undefined,
      long: Number.isFinite(long) ? long : undefined,
      acc_x: Number.isFinite(accX) ? accX : undefined,
      roll_rate: Number.isFinite(rollRate) ? rollRate : undefined,
    });
  }

  csvRowsCache = rows;
  return rows;
}

export const MockFlight = {
  setSource: (path: string) => {
    currentSource = path || DEFAULT_SOURCE;
    clearCache();
  },
  setDemoMode: (enabled: boolean) => {
    demoMode = !!enabled;
    if (demoMode) {
      initDemoState();
    }
  },
  getSensorData: async (row: number): Promise<MockSensorPacket | undefined> => {
    if (demoMode) {
      return nextDemoPacket();
    }

    try {
      const rows = await fetchCsvRows();
      if (!rows.length) return undefined;
      const index = Math.abs(row) % rows.length;
      return rows[index];
    } catch (error) {
      console.error("MockFlight: failed to read CSV", error);
      return undefined;
    }
  },
};
