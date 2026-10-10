import axios from "axios";

import type { DaqFireState } from "@/hooks/SSE/sseLiquids";

/** Status payload returned by the DAQ backend. */
export interface DaqStatus {
  data_age_s: number;
  ok: boolean;
  sequence_active: boolean;
  sequence_name: string | null;
  sequence_step: string | null;
  sequence_state: DaqFireState;
  server_time: number;
  stale: boolean;
  stream_hz: number;
  using_mock: boolean;
}

export interface ActuatorCommand {
  name: string;
  state: 0 | 1;
}

/**
 * Shared response for /sequence/* endpoints (matches daq/engine.py:sequence_status()).
 * state explains false sequence_active (paused/completed/aborted).
 */
export interface DaqSequenceStatus {
  step: string | null;
  state: DaqFireState;
  server_time_ms: number;
  sequence_time_ms: number;
}

/** Joins a DAQ base URL and API route without duplicating a slash.
 * @param baseUrl DAQ server base URL.
 * @param route API route beginning with a slash.
 * @returns The complete request URL.
 */
const withRoute = (baseUrl: string, route: string) => `${baseUrl.replace(/\/$/, "")}${route}`;

/** HTTP commands used to query and control the DAQ backend. */
export const daqApi = {
  abort: (baseUrl: string) => axios.post<void>(withRoute(baseUrl, "/abort")),
  safe: (baseUrl: string) => axios.post<{ ok: boolean }>(withRoute(baseUrl, "/safe")),
  tare: (baseUrl: string) => axios.post<{ ok: boolean }>(withRoute(baseUrl, "/tare")),
  postActuator: (baseUrl: string, command: ActuatorCommand) =>
    axios.post<{ ok: boolean; name: string; state: 0 | 1 }>(withRoute(baseUrl, "/actuator"), command),
  getStatus: (baseUrl: string) => axios.get<DaqStatus>(withRoute(baseUrl, "/status")),
  /** Starts the fire autosequence from T=0. Refused (409) if already active. */
  fire: (baseUrl: string) => axios.post<{ ok: boolean; sequence: string }>(withRoute(baseUrl, "/fire")),
  /** Resumes the fire sequence from its current position (not a reset to T=0). */
  sequenceStart: (baseUrl: string) =>
    axios.post<DaqSequenceStatus>(withRoute(baseUrl, "/sequence/start")),
  /** Pauses the fire sequence in place; resumable via sequenceStart(). */
  sequenceStop: (baseUrl: string) =>
    axios.post<DaqSequenceStatus>(withRoute(baseUrl, "/sequence/stop")),
  /** Seeks the fire sequence clock. Forward-only while running. */
  sequenceTime: (baseUrl: string, seconds: number) =>
    axios.post<DaqSequenceStatus>(withRoute(baseUrl, "/sequence/time"), { seconds }),
  /** Seeks to a named fire-sequence step's start time. Forward-only while running. */
  sequenceStep: (baseUrl: string, name: string) =>
    axios.post<DaqSequenceStatus>(withRoute(baseUrl, "/sequence/step"), { name }),
};