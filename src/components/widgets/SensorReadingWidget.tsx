import type { FC } from "react";
import { altitudeHandler, accelerationHandler } from "@/utils/units/units"
import { formatSignificantFigures } from "@/utils/units/significantFigures";

export interface SensorData {
  w: number;
  x: number;
  y: number;
  z: number;
  alt: number;
  long: number;
  lat: number;
  acc_x: number;
  roll_rate: number;
}

export interface SensorReadingWidgetProps {
  sensorData: SensorData;
}

interface DataItem {
  label: string;
  value: string;
}

interface DataGroupProps {
  title: string;
  data: DataItem[];
}

const DataGroup: FC<DataGroupProps> = ({ title, data }) => (
  <div className="mt-2 transition-colors duration-700">
    <p className="text-lg font-bold">{title}</p>
    <div className="text-sm">
      {data.map(({ label, value }) => (
        <div key={label} className="flex justify-between w-full">
          <span>{label}</span>
          <span>{value}</span>
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
    acc_x, /* accel on thrust axis */
    roll_rate /* rate of body roll */
  } = sensorData;

  return (
    <div className="w-full mb-6 px-10 py-7 bg-base-100/50 text-base-700 dark:bg-base-100 dark:text-highlight rounded-lg transition-colors duration-700 shadow-xl">
      <h1 className="text-2xl font-bold mb-3">Sensor Readings</h1>
      <div className="grid grid-cols-2 grid-rows-3 gap-x-24">
        <DataGroup
          title="Gyroscope"
          data={[
            { label: "W", value: formatSignificantFigures(w) }, // unitless
            { label: "X", value: formatSignificantFigures(x) }, // unitless
            { label: "Y", value: formatSignificantFigures(y) }, // unitless
            { label: "Z", value: formatSignificantFigures(z) }, // unitless
          ]}
        />
        <DataGroup
          title="Location"
          data={[
            { label: "latitude", value: formatSignificantFigures(lat) + " deg" },   // units are fixed
            { label: "longitude", value: formatSignificantFigures(long) + " deg" }, // units are fixed
          ]}
        />
        <DataGroup
          title="Vehicle Dynamics"
          data={[
            { label: "alt", value: altitudeHandler.getDisplayString(alt) },
            { label: "acc_x", value: accelerationHandler.getDisplayString(acc_x) },
            { label: "roll_rate", value: formatSignificantFigures(roll_rate) + " deg/s" }, // no system units yet
          ]}
        />
      </div>
    </div>
  );
};
