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
  { startTimeCentiseconds: 13.65 * 100, name: "SAFE", action: "RETURN TO SAFE STATE" },
];

export const mockSequenceInitialTimeCentiseconds = mockLiquidSequence[0].startTimeCentiseconds - 5 * 100;

const autosequenceStartTimeCentiseconds = -22 * 100;
const autosequenceEndTimeCentiseconds = 8.65 * 100;
const pascalsPerPsi = 6_894.757293168;
const pascalsPerAtm = 101_325;

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

const gaussianNoise = (standardDeviation: number) => {
  const first = Math.max(Number.EPSILON, Math.random());
  const second = Math.random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second) * standardDeviation;
};

function mockActuatorsAtTime(timeCentiseconds: number): EngineActuators {
  const valves: Record<ValveId, boolean> = {
    [ValveId.LoxPressurization]: false,
    [ValveId.LoxFill]: true,
    [ValveId.KerosenePressurization]: false,
    [ValveId.KeroseneFill]: true,
    [ValveId.MainOxidizer]: false,
    [ValveId.MainFuel]: false,
    [ValveId.KeroseneDrain]: false,
    [ValveId.LoxDrain]: false,
  };

  if (timeCentiseconds >= -22 * 100) {
    valves[ValveId.LoxFill] = false;
  }
  if (timeCentiseconds >= -21.5 * 100) {
    valves[ValveId.LoxPressurization] = true;
  }
  if (timeCentiseconds >= -13.5 * 100) {
    valves[ValveId.KeroseneFill] = false;
    valves[ValveId.KerosenePressurization] = true;
  }
  if (timeCentiseconds >= -0.5 * 100) {
    valves[ValveId.LoxDrain] = true;
  }
  if (timeCentiseconds >= 0) {
    valves[ValveId.KeroseneDrain] = true;
  }
  if (timeCentiseconds >= 2 * 100) {
    valves[ValveId.LoxDrain] = false;
    valves[ValveId.MainOxidizer] = true;
  }
  if (timeCentiseconds >= 2.15 * 100) {
    valves[ValveId.KeroseneDrain] = false;
  }
  if (timeCentiseconds >= 3.65 * 100) {
    valves[ValveId.MainFuel] = true;
    valves[ValveId.KerosenePressurization] = false;
    valves[ValveId.LoxPressurization] = false;
    valves[ValveId.KeroseneFill] = true;
    valves[ValveId.LoxFill] = true;
  }
  if (timeCentiseconds >= 8.65 * 100) {
    valves[ValveId.MainOxidizer] = false;
    valves[ValveId.MainFuel] = false;
  }
  if (timeCentiseconds >= 13.65 * 100) {
    valves[ValveId.LoxPressurization] = true;
    valves[ValveId.LoxFill] = false;
    valves[ValveId.KerosenePressurization] = true;
    valves[ValveId.KeroseneFill] = false;
    valves[ValveId.MainOxidizer] = true;
    valves[ValveId.MainFuel] = true;
    valves[ValveId.KeroseneDrain] = false;
    valves[ValveId.LoxDrain] = false;
  }

  return { valves };
}

export function mockEngineState(
  sensorStatus = nominalStatus,
  sequenceTimeCentiseconds?: number,
  previousActuators: EngineActuators = defaultActuators,
  includeNoise = true,
): EngineState {
  const actuators = sequenceTimeCentiseconds === undefined || sequenceTimeCentiseconds < mockLiquidSequence[0].startTimeCentiseconds
    ? previousActuators
    : mockActuatorsAtTime(sequenceTimeCentiseconds);
  const engineFlow = actuators.valves[ValveId.LoxDrain] || actuators.valves[ValveId.KeroseneDrain];
  const fuelOpen = actuators.valves[ValveId.KeroseneDrain];
  const loxClosed = !actuators.valves[ValveId.LoxDrain];
  const fuelClosed = !actuators.valves[ValveId.KeroseneDrain];
  const mockSensor = (value: number) => sensor(
    value,
    Number.isNaN(value) ? ReadingStatus.UNCONFIGURED : sensorStatus,
  );
  const noise = (standardDeviation: number) => includeNoise ? gaussianNoise(standardDeviation) : 0;
  const isWithinAutosequence = sequenceTimeCentiseconds !== undefined
    && sequenceTimeCentiseconds >= autosequenceStartTimeCentiseconds
    && sequenceTimeCentiseconds <= autosequenceEndTimeCentiseconds;
  const tankPressure = (pressValveOpen: boolean) => (
    pressValveOpen
      ? (isWithinAutosequence ? 500 * pascalsPerPsi : 10 * pascalsPerAtm)
      : 2 * pascalsPerAtm
  ) + noise(2_000);
  const loxTankPressurePa = tankPressure(actuators.valves[ValveId.LoxPressurization]);
  const keroseneTankPressurePa = tankPressure(actuators.valves[ValveId.KerosenePressurization]);

  return {
    sensors: {
      gn2PressurePa: mockSensor(Number.NaN),
      gn2TemperatureC: mockSensor(Number.NaN),
      loxTankPressurePa: mockSensor(loxTankPressurePa),
      loxTankLevel: mockSensor(Number.NaN),
      loxTankTemperatureC: mockSensor(Number.NaN),
      loxOrificePressureAPa: mockSensor(Number.NaN),
      loxOrificePressureBPa: mockSensor(Number.NaN),
      keroseneTankPressurePa: mockSensor(keroseneTankPressurePa),
      keroseneTankLevel: mockSensor(Number.NaN),
      keroseneTankTemperatureC: mockSensor(Number.NaN),
      keroseneOrificePressureAPa: mockSensor(Number.NaN),
      keroseneOrificePressureBPa: mockSensor(Number.NaN),
      chamberPressurePa: mockSensor(
        (2_220_111.85 + (engineFlow ? 650_000 : 0) + (fuelOpen ? 700_000 : 0) - (loxClosed ? 350_000 : 0) - (fuelClosed ? 250_000 : 0)) + noise(8_000),
      ),
      chamberTemperatureC: mockSensor((engineFlow ? 2_900 : 21.67) + noise(8)),
      inletTemperatureC: mockSensor(-185 + noise(0.25)),
      thrustNewtons: mockSensor(
        (engineFlow ? 5_400 : 0) + (fuelOpen ? 2_000 : 0) - (loxClosed ? 1_000 : 0) + noise(60),
      ),
    },
    actuators,
  };
}
