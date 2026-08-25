import Papa from "papaparse";

let cachedCsvText: string | null = null;

async function fetchCSV(): Promise<string> {
  if (cachedCsvText !== null) return cachedCsvText;

  const response = await fetch("/synthetic_model_rocket_flight.csv");
  const text = await response.text();
  cachedCsvText = text;
  return text;
}


export const MockFlight = {
  getSensorData: async (row: number): Promise<any> => {
    const csv = await fetchCSV();
    const parsed = Papa.parse<any>(csv, { header: true, dynamicTyping: true });
    const raw = parsed.data[row];
    if (!raw) return undefined;

    const mapped = {
      quat_w: raw["Unit Quaternion W"] ?? raw.quat_w ?? raw["UnitQuaternionW"],
      quat_x: raw["Unit Quaternion X"] ?? raw.quat_x ?? raw["UnitQuaternionX"],
      quat_y: raw["Unit Quaternion Y"] ?? raw.quat_y ?? raw["UnitQuaternionY"],
      quat_z: raw["Unit Quaternion Z"] ?? raw.quat_z ?? raw["UnitQuaternionZ"],

      alt: raw["Barometric Altitude"] ?? raw.alt ?? raw["Barometric Altitude (m)"] ?? raw["GPS Altitude (ft)"] ?? 0,

      long: raw["GPS Longitude (deg)"] ?? raw.long ?? raw.longitude ?? raw.lon ?? 0,
      lat: raw["GPS Latitude (deg)"] ?? raw.lat ?? raw.latitude ?? 0,

      acc_x: raw["Pre-converted Accel X"] ?? raw.acc_x ?? raw["Accel X"] ?? 0,

      roll_rate: raw["Roll Body Rate"] ?? raw.roll_rate ?? 0,
    };

    return mapped;
  },
};
