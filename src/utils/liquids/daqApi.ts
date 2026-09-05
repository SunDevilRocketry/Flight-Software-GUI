import axios from "axios";

/** Status payload returned by the DAQ backend. */
export interface DaqStatus {
  data_age_s: number;
  ok: boolean;
  sequence_active: boolean;
  sequence_name: string | null;
  server_time: number;
  stale: boolean;
  stream_hz: number;
  using_mock: boolean;
}

export interface ActuatorCommand {
  name: string;
  state: 0 | 1;
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
  postActuator: (baseUrl: string, command: ActuatorCommand) =>
    axios.post<{ ok: boolean; name: string; state: 0 | 1 }>(withRoute(baseUrl, "/actuator"), command),
  getStatus: (baseUrl: string) => axios.get<DaqStatus>(withRoute(baseUrl, "/status")),
};