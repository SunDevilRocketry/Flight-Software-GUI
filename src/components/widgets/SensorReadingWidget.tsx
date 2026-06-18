import type { FC } from "react";

export interface SensorData {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
  pitch: number;
  pitchRate: number;
  roll: number;
  rollRate: number;
  yaw: number;
  yawRate: number;
  pressure: number;
  velocity: number;
  altitude: number;
  chipTemperature: number;
  latitude: number;
  longitude: number;
  time: number;
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
    accelerationX,
    accelerationY,
    accelerationZ,
    gyroscopeX,
    gyroscopeY,
    gyroscopeZ,
    pitch,
    pitchRate,
    roll,
    rollRate,
    yaw,
    yawRate,
    pressure,
    velocity,
    altitude,
    chipTemperature,
    latitude,
    longitude,
  } = sensorData;

  return (
    <div className="w-full mb-6 px-10 py-7 bg-base-100/50 text-base-700 dark:bg-base-100 dark:text-highlight rounded-lg transition-colors duration-700 shadow-xl">
      <h1 className="text-2xl font-bold mb-3">Sensor Readings</h1>
      <div className="grid grid-cols-2 grid-rows-3 gap-x-24">
        <DataGroup
          title="Acceleration"
          data={[
            { label: "X", value: accelerationX },
            { label: "Y", value: accelerationY },
            { label: "Z", value: accelerationZ },
          ]}
        />

        <DataGroup
          title="Barometer"
          data={[
            { label: "Pressure", value: pressure },
            { label: "Velocity", value: velocity },
            { label: "Altitude", value: altitude },
          ]}
        />

        <DataGroup
          title="Gyroscope"
          data={[
            { label: "X", value: gyroscopeX },
            { label: "Y", value: gyroscopeY },
            { label: "Z", value: gyroscopeZ },
          ]}
        />

        <div>
          <p className="text-lg font-bold">Temperature: </p>
          <p>{chipTemperature}</p>
        </div>

        <DataGroup
          title="Orientation"
          data={[
            { label: "Pitch", value: pitch },
            { label: "Pitch Rate", value: pitchRate },
            { label: "Roll", value: roll },
            { label: "Roll Rate", value: rollRate },
            { label: "Yaw", value: yaw },
            { label: "Yaw Rate", value: yawRate },
          ]}
        />

        <DataGroup
          title="Location"
          data={[
            { label: "latitude", value: latitude },
            { label: "longitude", value: longitude },
          ]}
        />
      </div>
    </div>
  );
};
