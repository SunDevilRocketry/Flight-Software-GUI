import Papa from "papaparse";

let cachedCsvText: string | null = null;

type CsvRow = Record<string, string | number | null | undefined>;

async function fetchCSV(): Promise<string> {
  if (cachedCsvText !== null) return cachedCsvText;

  const response = await fetch("/synthetic_model_rocket_flight.csv");
  const text = await response.text();
  cachedCsvText = text;
  return text;
}

export const MockFlight = {
  getSensorData: async (row: number): Promise<Record<string, number | undefined> | undefined> => {
    const csv = await fetchCSV();
    const parsed = Papa.parse<CsvRow>(csv, { header: true, dynamicTyping: true });
    const rowCount = parsed.data.length;

    if (!rowCount) return undefined;

    const safeRow = row >= 0 ? row % rowCount : 0;
    const raw = parsed.data[safeRow] ?? {};
    if (!raw) return undefined;

    const getValue = (keys: string[]): number | undefined => {
      for (const key of keys) {
        const value = raw[key];
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
          continue;
        }
        return Number(value);
      }
      return undefined;
    };

    const mapped = {
      quat_w: getValue(["Unit Quaternion W", "quat_w", "UnitQuaternionW"]),
      quat_x: getValue(["Unit Quaternion X", "quat_x", "UnitQuaternionX"]),
      quat_y: getValue(["Unit Quaternion Y", "quat_y", "UnitQuaternionY"]),
      quat_z: getValue(["Unit Quaternion Z", "quat_z", "UnitQuaternionZ"]),

      alt: getValue(["Barometric Altitude", "alt", "Barometric Altitude (m)", "GPS Altitude (ft)"]) ?? 0,
      long: getValue(["GPS Longitude (deg)", "long", "longitude", "lon"]) ?? 0,
      lat: getValue(["GPS Latitude (deg)", "lat", "latitude"]) ?? 0,
      acc_x: getValue(["Pre-converted Accel X", "acc_x", "Accel X"]) ?? 0,
      roll_rate: getValue(["Roll Body Rate", "roll_rate"]) ?? 0,
    };

    return mapped;
  },
};
