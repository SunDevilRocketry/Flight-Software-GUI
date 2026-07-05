import type { FC } from "react";

export interface SensorData {
  w: number;
  x: number;
  y: number;
  z: number;
  alt: number;
  long: number;
  lat: number;
  acc_z: number;
  roll_rate: number;
}

export interface SensorReadingWidgetProps {
  sensorData: SensorData;
}

interface DataItem {
  label: string;
  value: number;
}

interface DataGroupProps {
  title: string;
  data: DataItem[];
}

function padNumber(value: number, length = 6): string {
  const str = String(value);
  if (str.startsWith("-")) {
    return `-${str.slice(1).padStart(length, "0")}`;
  }
  return str.padStart(length, "0");
}

function formatValue(value: number): string {
  return value === 0 ? "0" : padNumber(value);
}

const DataGroup: FC<DataGroupProps> = ({ title, data }) => (
  <div className="mt-2 transition-colors duration-700">
    <p className="text-lg font-bold">{title}</p>
    <div className="text-sm">
      {data.map(({ label, value }) => (
        <div key={label} className="flex justify-between w-full">
          <span>{label}</span>
          <span>{formatValue(value)}</span>
        </div>
      ))}
    </div>
  </div>
);

export const SensorReadingWidget: FC<SensorReadingWidgetProps> = ({ sensorData }) => {
  const { 
    w, /* unit quaternions (orientation) */ 
    x, 
    y, 
    z,
    alt, /* alt (m) */
    long, /* last GPS ping */
    lat,
    acc_z, /* accel on thrust axis */
    roll_rate /* rate of body roll */
  } = sensorData;

  return (
    <div className="w-full mb-6 px-10 py-7 bg-base-100/50 text-base-700 dark:bg-base-100 dark:text-highlight rounded-lg transition-colors duration-700 shadow-xl">
      <h1 className="text-2xl font-bold mb-3">Sensor Readings</h1>
      <div className="grid grid-cols-2 grid-rows-3 gap-x-24">
        <DataGroup
          title="Gyroscope"
          data={[
            { label: "W", value: w },
            { label: "X", value: x },
            { label: "Y", value: y },
            { label: "Z", value: z },
          ]}
        />
        <DataGroup
          title="Location"
          data={[
            { label: "latitude", value: lat },
            { label: "longitude", value: long },
          ]}
        />
        <DataGroup
          title="Vehicle Dynamics"
          data={[
            { label: "alt", value: alt },
            { label: "acc_z", value: acc_z },
            { label: "roll_rate", value: roll_rate },
          ]}
        />
      </div>
    </div>
  );
};
