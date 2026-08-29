import axios from "axios";

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

const withRoute = (baseUrl: string, route: string) => `${baseUrl.replace(/\/$/, "")}${route}`;

export const daqApi = {
  abort: (baseUrl: string) => axios.post<void>(withRoute(baseUrl, "/abort")),
  getStatus: (baseUrl: string) => axios.get<DaqStatus>(withRoute(baseUrl, "/status")),
};