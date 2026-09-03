import { ReadingStatus } from "@/components/liquids/pid/readingStatus";

/** Identifies each controllable valve in the liquid-engine P&ID. */
export enum ValveId {
  LoxPressurization = 1,
  LoxVent = 2,
  KerosenePressurization = 3,
  KeroseneVent = 4,
  LoxPurge = 5,
  KerosenePurge = 6,
  KeroseneMain = 7,
  LoxMain = 8,
}

/** A raw sensor value and its current health status. */
export interface SensorReading {
  value: number;
  status: ReadingStatus;
}

/** Raw SI-unit telemetry exposed by the mock liquid engine. */
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

/** Current commanded state of the engine valves. */
export interface EngineActuators {
  valves: Record<ValveId, boolean>;
}

/** Combined mock engine telemetry and actuator state. */
export interface EngineState {
  sensors: EngineSensors;
  actuators: EngineActuators;
}

/** Creates the safe engine state shown when no telemetry source is enabled. */
export function noDataSourceEngineState(): EngineState {
  const safeState = mockEngineState(ReadingStatus.UNCONFIGURED, undefined, undefined, false);

  return {
    sensors: Object.fromEntries(
      Object.keys(safeState.sensors).map((sensorKey) => [
        sensorKey,
        { value: Number.NaN, status: ReadingStatus.UNCONFIGURED },
      ]),
    ) as unknown as EngineSensors,
    actuators: safeState.actuators,
  };
}

/** Applies one health status to all configured mock sensors.
 * @param state Current engine state.
 * @param status Status to apply to configured sensors.
 * @returns A new engine state with updated sensor statuses.
 */
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

/** A named event in the mock liquid-engine autosequence. */
export interface MockSequenceStep {
  action: string;
  name: string;
  startTimeCentiseconds: number;
}

/** Timeline of mock autosequence events, measured in centiseconds. */
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

/** Initial timer position, five seconds before autosequence start. */
export const mockSequenceInitialTimeCentiseconds = mockLiquidSequence[0].startTimeCentiseconds - 5 * 100;

const autosequenceStartTimeCentiseconds = -22 * 100;
const autosequenceEndTimeCentiseconds = 8.65 * 100;
const pascalsPerPsi = 6_894.757293168;
const pascalsPerAtm = 101_325;

const nominalStatus = ReadingStatus.NOMINAL;

const defaultActuators: EngineActuators = {
  valves: {
    [ValveId.LoxPressurization]: true,
    [ValveId.LoxVent]: false,
    [ValveId.KerosenePressurization]: true,
    [ValveId.KeroseneVent]: false,
    [ValveId.LoxPurge]: true,
    [ValveId.KerosenePurge]: true,
    [ValveId.KeroseneMain]: false,
    [ValveId.LoxMain]: false,
  },
};

/** Creates a mock sensor reading with a nominal status by default. */
const sensor = (value: number, status = nominalStatus): SensorReading => ({
  value,
  status,
});

/** Generates normally distributed noise for simulated sensor variation. */
const gaussianNoise = (standardDeviation: number) => {
  const first = Math.max(Number.EPSILON, Math.random());
  const second = Math.random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second) * standardDeviation;
};

/** Resolves valve states from the mock autosequence timeline. */
function mockActuatorsAtTime(timeCentiseconds: number): EngineActuators {
  const valves: Record<ValveId, boolean> = {
    [ValveId.LoxPressurization]: false,
    [ValveId.LoxVent]: true,
    [ValveId.KerosenePressurization]: false,
    [ValveId.KeroseneVent]: true,
    [ValveId.LoxPurge]: false,
    [ValveId.KerosenePurge]: false,
    [ValveId.KeroseneMain]: false,
    [ValveId.LoxMain]: false,
  };

  if (timeCentiseconds >= -22 * 100) {
    valves[ValveId.LoxVent] = false;
  }
  if (timeCentiseconds >= -21.5 * 100) {
    valves[ValveId.LoxPressurization] = true;
  }
  if (timeCentiseconds >= -13.5 * 100) {
    valves[ValveId.KeroseneVent] = false;
    valves[ValveId.KerosenePressurization] = true;
  }
  if (timeCentiseconds >= -0.5 * 100) {
    valves[ValveId.LoxMain] = true;
  }
  if (timeCentiseconds >= 0) {
    valves[ValveId.KeroseneMain] = true;
  }
  if (timeCentiseconds >= 2 * 100) {
    valves[ValveId.LoxMain] = false;
    valves[ValveId.LoxPurge] = true;
  }
  if (timeCentiseconds >= 2.15 * 100) {
    valves[ValveId.KeroseneMain] = false;
  }
  if (timeCentiseconds >= 3.65 * 100) {
    valves[ValveId.KerosenePurge] = true;
    valves[ValveId.KerosenePressurization] = false;
    valves[ValveId.LoxPressurization] = false;
    valves[ValveId.KeroseneVent] = true;
    valves[ValveId.LoxVent] = true;
  }
  if (timeCentiseconds >= 8.65 * 100) {
    valves[ValveId.LoxPurge] = false;
    valves[ValveId.KerosenePurge] = false;
  }
  if (timeCentiseconds >= 13.65 * 100) {
    valves[ValveId.LoxPressurization] = true;
    valves[ValveId.LoxVent] = false;
    valves[ValveId.KerosenePressurization] = true;
    valves[ValveId.KeroseneVent] = false;
    valves[ValveId.LoxPurge] = true;
    valves[ValveId.KerosenePurge] = true;
    valves[ValveId.KeroseneMain] = false;
    valves[ValveId.LoxMain] = false;
  }

  return { valves };
}

/** Creates a mock engine snapshot for the current sensor and sequence state.
 * @param sensorStatus Status assigned to configured readings.
 * @param sequenceTimeCentiseconds Optional sequence time used to resolve actuators.
 * @param previousActuators Actuators preserved before sequence start.
 * @param includeNoise Whether generated readings should include random noise.
 * @returns A complete mock engine state.
 */
export function mockEngineState(
  sensorStatus = nominalStatus,
  sequenceTimeCentiseconds?: number,
  previousActuators: EngineActuators = defaultActuators,
  includeNoise = true,
): EngineState {
  const actuators = sequenceTimeCentiseconds === undefined || sequenceTimeCentiseconds < mockLiquidSequence[0].startTimeCentiseconds
    ? previousActuators
    : mockActuatorsAtTime(sequenceTimeCentiseconds);
  const engineFlow = actuators.valves[ValveId.LoxMain] || actuators.valves[ValveId.KeroseneMain];
  const fuelOpen = actuators.valves[ValveId.KeroseneMain];
  const loxClosed = !actuators.valves[ValveId.LoxMain];
  const fuelClosed = !actuators.valves[ValveId.KeroseneMain];
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
