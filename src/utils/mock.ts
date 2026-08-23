import Papa from "papaparse";
import type { RawSensorPacket } from "@/utils/api";

let cachedCsvText: string | null = null;

async function fetchCSV(): Promise<string> {
  if (cachedCsvText !== null) return cachedCsvText;

  const response = await fetch("/extracted_data.csv");
  const text = await response.text();
  cachedCsvText = text;
  return text;
}

export const MockFlight = {
  getSensorData: async (row: number): Promise<RawSensorPacket | undefined> => {
    const csv = await fetchCSV();
    const parsed = Papa.parse<RawSensorPacket>(csv, { header: true, dynamicTyping: true });
    return parsed.data[row];
  },
};
