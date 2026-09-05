import type { SSEMessage } from "./sseCommon";

export const LQD_DAQ_ORIGIN = "LQD-DAQ";
export const LQD_DAQ_VERSION = "1.0";

export type DaqSensorType = "pressure" | "temperature" | "force" | "position" | string;

export interface DaqSequenceState {
  active: boolean;
  name: string | null;
  elapsed_s: number | null;
}

export interface DaqSensorState {
  readout: number | null;
  type: DaqSensorType;
  status: string;
}

export interface DaqValveState {
  status: string;
  moving: boolean;
}

export interface DaqState {
  timestamp: number;
  streaming: boolean;
  isStale: boolean;
  sequence: DaqSequenceState;
  sensors: Record<string, DaqSensorState>;
  valves: Record<string, DaqValveState>;
  derived: Record<string, unknown>;
}

export interface LiquidsSseListener {
  onSystemState?: (state: DaqState) => void;
}

const listeners = new Map<string, Set<LiquidsSseListener>>();
const eventSources = new Map<string, EventSource>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return fallback;
}

function parseSequence(value: unknown): DaqSequenceState {
  if (!isRecord(value)) {
    return { active: false, name: null, elapsed_s: null };
  }

  return {
    active: parseBoolean(value.active),
    name: typeof value.name === "string" || value.name === null ? value.name : null,
    elapsed_s: parseNullableNumber(value.elapsed_s),
  };
}

function parseSensors(value: unknown): Record<string, DaqSensorState> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, sensor]) => isRecord(sensor))
      .map(([id, sensorValue]) => {
        const sensor = sensorValue as Record<string, unknown>;
        return [id, {
        readout: parseNullableNumber(sensor.readout),
        type: typeof sensor.type === "string" ? sensor.type : "unknown",
        status: typeof sensor.status === "string" ? sensor.status : "UNKNOWN",
        }];
      }),
  );
}

function parseValves(value: unknown): Record<string, DaqValveState> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, valve]) => isRecord(valve))
      .map(([id, valveValue]) => {
        const valve = valveValue as Record<string, unknown>;
        return [id, {
        status: typeof valve.status === "string" ? valve.status : "unknown",
        moving: parseBoolean(valve.moving),
        }];
      }),
  );
}

export function createInitialDaqState(): DaqState {
  return {
    timestamp: 0,
    streaming: false,
    isStale: false,
    sequence: { active: false, name: null, elapsed_s: null },
    sensors: {},
    valves: {},
    derived: {},
  };
}

export function parseSystemStateMessage(message: SSEMessage): DaqState | null {
  if (
    message.origin !== LQD_DAQ_ORIGIN
    || message.version !== LQD_DAQ_VERSION
    || message.messageType !== "system-state"
    || !isRecord(message.payload)
  ) {
    return null;
  }

  const payload = message.payload;
  return {
    timestamp: typeof message.timestamp === "number" ? message.timestamp : 0,
    streaming: parseBoolean(payload.streaming),
    isStale: parseBoolean(payload.is_stale),
    sequence: parseSequence(payload.sequence),
    sensors: parseSensors(payload.sensors),
    valves: parseValves(payload.valves),
    derived: isRecord(payload.derived) ? { ...payload.derived } : {},
  };
}

export function handleLiquidsSseMessage(rawMessage: unknown): DaqState | null {
  if (typeof rawMessage === "string") {
    const json = rawMessage.trim().replace(/^data:\s*/, "");
    try {
      return handleLiquidsSseMessage(JSON.parse(json));
    } catch {
      return null;
    }
  }

  if (!isRecord(rawMessage)) return null;

  if ("data" in rawMessage && typeof rawMessage.data === "string") {
    return handleLiquidsSseMessage(rawMessage.data);
  }

  return parseSystemStateMessage(rawMessage as unknown as SSEMessage);
}

function startConnection(baseUrl: string): void {
  if (typeof window === "undefined" || eventSources.has(baseUrl)) return;

  const eventSource = new EventSource(`${baseUrl.replace(/\/$/, "")}/stream`);
  eventSources.set(baseUrl, eventSource);
  const handleEvent = (event: MessageEvent<string>) => {
    try {
      const state = handleLiquidsSseMessage(event.data);
      if (!state) return;
      listeners.get(baseUrl)?.forEach((listener) => listener.onSystemState?.(state));
    } catch (error) {
      console.error("Failed to parse LQD-DAQ SSE event:", error);
    }
  };
  eventSource.onmessage = handleEvent;
  eventSource.addEventListener("system-state", handleEvent as EventListener);
  eventSource.onerror = (error) => {
    console.error("LQD-DAQ SSE connection error:", error);
  };
}

export function subscribeToLiquidsSse(baseUrl: string, listener: LiquidsSseListener): () => void {
  const normalizedUrl = baseUrl.replace(/\/$/, "");
  const urlListeners = listeners.get(normalizedUrl) ?? new Set<LiquidsSseListener>();
  urlListeners.add(listener);
  listeners.set(normalizedUrl, urlListeners);
  startConnection(normalizedUrl);

  return () => {
    const currentListeners = listeners.get(normalizedUrl);
    currentListeners?.delete(listener);
    if (currentListeners?.size) return;

    listeners.delete(normalizedUrl);
    eventSources.get(normalizedUrl)?.close();
    eventSources.delete(normalizedUrl);
  };
}
