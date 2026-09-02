import { ReadingStatus } from "@/components/liquids/pid/readingStatus";

export enum ValveId {
  LoxPressurization = 1,
  LoxFill = 2,
  KerosenePressurization = 3,
  KeroseneFill = 4,
  MainOxidizer = 5,
  MainFuel = 6,
  KeroseneDrain = 7,
  LoxDrain = 8,
}

export interface SensorReading {
  value: number;
  status: ReadingStatus;
}

export interface EngineSensors {
  gn2PressurePa: SensorReading;
  gn2TemperatureC: SensorReading;
  loxTankPressurePa: SensorReading;
  loxTankLevel: SensorReading;
  loxTankTemperatureC: SensorReading;
  loxOrificePressureAPa: SensorReading;
  loxOrificePressureBPa: SensorReading;
  keroseneTankPressurePa: SensorReading;
  keroseneTankLevel: SensorReading;
  keroseneTankTemperatureC: SensorReading;
  keroseneOrificePressureAPa: SensorReading;
  keroseneOrificePressureBPa: SensorReading;
  chamberPressurePa: SensorReading;
  chamberTemperatureC: SensorReading;
  inletTemperatureC: SensorReading;
  thrustNewtons: SensorReading;
}

export interface EngineActuators {
  valves: Record<ValveId, boolean>;
}

export interface EngineState {
  sensors: EngineSensors;
  actuators: EngineActuators;
}

export function setMockSensorStatus(state: EngineState, status: ReadingStatus): EngineState {
  return {
    ...state,
    sensors: Object.fromEntries(
      Object.entries(state.sensors).map(([sensorKey, reading]) => [
        sensorKey,
        reading.status === ReadingStatus.UNCONFIGURED ? reading : { ...reading, status },
      ]),
    ) as EngineSensors,
  };
}

export interface MockSequenceStep {
  action: string;
  name: string;
  startTimeCentiseconds: number;
}

export const mockLiquidSequence: MockSequenceStep[] = [
  { startTimeCentiseconds: -22 * 100, name: "Autosequence start", action: "START Autosequence; CLOSE LOx Vent" },
  { startTimeCentiseconds: -21.5 * 100, name: "LOx pressurization", action: "OPEN LOx Pressurization Valve" },
  { startTimeCentiseconds: -13.5 * 100, name: "Fuel pressurization", action: "CLOSE Fuel Vent; OPEN Fuel Pressurization Valve" },
  { startTimeCentiseconds: -1.5 * 100, name: "Ignition", action: "ENERGIZE/IGNITE Solid Propellant Ignitor" },
  { startTimeCentiseconds: -0.5 * 100, name: "LOx main valve", action: "OPEN LOx Main Valve" },
  { startTimeCentiseconds: 0, name: "Fuel main valve", action: "OPEN Fuel Main Valve" },
  { startTimeCentiseconds: 2 * 100, name: "LOx main valve / purge", action: "CLOSE LOx Main Valve; OPEN LOx Purge" },
  { startTimeCentiseconds: 2.15 * 100, name: "Fuel main valve", action: "CLOSE Fuel Main Valve" },
  { startTimeCentiseconds: 3.65 * 100, name: "Pressurization and vents", action: "OPEN Fuel Purge; CLOSE Fuel Pressurization; CLOSE LOx Pressurization; OPEN Fuel Vent; OPEN LOx Vent" },
  { startTimeCentiseconds: 8.65 * 100, name: "Autosequence end", action: "CLOSE LOx Purge; CLOSE Fuel Purge; END Autosequence" },
];

const nominalStatus = ReadingStatus.NOMINAL;

const defaultActuators: EngineActuators = {
  valves: {
    [ValveId.LoxPressurization]: true,
    [ValveId.LoxFill]: false,
    [ValveId.KerosenePressurization]: true,
    [ValveId.KeroseneFill]: false,
    [ValveId.MainOxidizer]: true,
    [ValveId.MainFuel]: true,
    [ValveId.KeroseneDrain]: false,
    [ValveId.LoxDrain]: false,
  },
};

const sensor = (value: number, status = nominalStatus): SensorReading => ({
  value,
  status,
});

export function mockEngineState(
  telemetryPhase = 0,
  sensorStatus = nominalStatus,
): EngineState {
  const engineFlow = true;
  const mockSensor = (value: number) => sensor(
    value,
    Number.isNaN(value) ? ReadingStatus.UNCONFIGURED : sensorStatus,
  );

  return {
    sensors: {
      gn2PressurePa: mockSensor(Number.NaN),
      gn2TemperatureC: mockSensor(Number.NaN),
      loxTankPressurePa: mockSensor(3_019_903.69 + Math.sin(telemetryPhase * 0.45) * 12_000),
      loxTankLevel: mockSensor(Number.NaN),
      loxTankTemperatureC: mockSensor(Number.NaN),
      loxOrificePressureAPa: mockSensor(Number.NaN),
      loxOrificePressureBPa: mockSensor(Number.NaN),
      keroseneTankPressurePa: mockSensor(2_840_640 + Math.sin(telemetryPhase * 0.55 + 1) * 10_000),
      keroseneTankLevel: mockSensor(Number.NaN),
      keroseneTankTemperatureC: mockSensor(Number.NaN),
      keroseneOrificePressureAPa: mockSensor(Number.NaN),
      keroseneOrificePressureBPa: mockSensor(Number.NaN),
      chamberPressurePa: mockSensor(
        engineFlow ? 2_220_111.85 + Math.sin(telemetryPhase) * 18_000 : 0,
      ),
      chamberTemperatureC: mockSensor(engineFlow ? 2_900 + Math.sin(telemetryPhase * 0.8) * 25 : 21.67),
      inletTemperatureC: mockSensor(-185 + Math.sin(telemetryPhase * 0.35 + 2) * 0.5),
      thrustNewtons: mockSensor(
        engineFlow ? 5_400 + Math.sin(telemetryPhase * 0.7) * 180 : 0,
      ),
    },
    actuators: defaultActuators,
  };
}
