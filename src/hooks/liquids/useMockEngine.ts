/**
 * Provides a mock engine for UI testing without LQD-DAQ.
 * 
 * No safety effect from this file.
 */

import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import type { DaqSequenceAction, DaqSequenceDefinition, DaqSequenceStep } from "@/utils/liquids/sequence";

/** Identifies each controllable valve in the liquid-engine P&ID. */
export enum ValveId {
  LoxPressurization = 1,
  TankVent = 2,
  KerosenePressurization = 3,
  KeroseneVent = 4,
  LoxPurge = 5,
  KerosenePurge = 6,
  KeroseneMain = 7,
  LoxMain = 8,
  IgnitionArm = 9,
  IgnitionFire = 10,
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
  loxOrificeDifferentialPressurePa: SensorReading;
  keroseneTankPressurePa: SensorReading;
  keroseneTankLevel: SensorReading;
  keroseneTankTemperatureC: SensorReading;
  keroseneOrificeDifferentialPressurePa: SensorReading;
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
  derived: EngineDerivedReadings;
  actuators: EngineActuators;
}

/** Derived engine quantities calculated from telemetry rather than direct sensors. */
export interface EngineDerivedReadings {
  loxMassFlowRateGramsPerSecond: SensorReading;
  fuelMassFlowRateGramsPerSecond: SensorReading;
  mixtureRatio: SensorReading;
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
    derived: Object.fromEntries(
      Object.keys(safeState.derived).map((readingKey) => [
        readingKey,
        { value: Number.NaN, status: ReadingStatus.UNCONFIGURED },
      ]),
    ) as unknown as EngineDerivedReadings,
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
    derived: Object.fromEntries(
      Object.entries(state.derived).map(([readingKey, reading]) => [
        readingKey,
        reading.status === ReadingStatus.UNCONFIGURED ? reading : { ...reading, status },
      ]),
    ) as EngineDerivedReadings,
  };
}

function mockSequenceStep(name: string, actions: DaqSequenceAction[]): DaqSequenceStep {
  return {
    name,
    start_s: Math.min(...actions.map(([timeSeconds]) => timeSeconds)),
    actions,
  };
}

/** Timeline uses the same DAQ seconds/actions format as the live sequence endpoint. */
export const mockLiquidSequence: DaqSequenceDefinition = {
  steps: [
    mockSequenceStep("Sequence Start", [[0, "tank_depress", 0]]),
    mockSequenceStep("LOx pressurization", [[0.5, "lox_press", 1]]),
    mockSequenceStep("Fuel pressurization", [[8.5, "fuel_vent", 0], [8.5, "fuel_press", 1]]),
    mockSequenceStep("Arm Igniter", [[19.5, "ignition_arm", 1]]),
    mockSequenceStep("Ignition", [[20.5, "ignition_fire", 1]]),
    mockSequenceStep("Ignition off", [[21, "ignition_fire", 0], [21.1, "ignition_arm", 0]]),
    mockSequenceStep("LOx main valve", [[21.5, "lox_main", 1]]),
    mockSequenceStep("Fuel main valve", [[22, "fuel_main", 1]]),
    mockSequenceStep("LOx main valve / purge", [[24, "lox_main", 0], [24, "lox_purge", 1]]),
    mockSequenceStep("Fuel main valve", [[24.15, "fuel_main", 0]]),
    mockSequenceStep("Pressurization and vents", [
      [25.65, "fuel_purge", 1],
      [25.65, "fuel_press", 0],
      [25.65, "lox_press", 0],
      [25.65, "fuel_vent", 1],
      [25.65, "tank_depress", 1],
    ]),
    mockSequenceStep("Autosequence end", [[30.65, "lox_purge", 0], [30.65, "fuel_purge", 0]]),
    mockSequenceStep("SAFE", [
      [35.65, "lox_press", 1],
      [35.65, "tank_depress", 0],
      [35.65, "fuel_press", 1],
      [35.65, "fuel_vent", 0],
      [35.65, "lox_purge", 1],
      [35.65, "fuel_purge", 1],
    ]),
  ],
};

/** Initial DAQ-time position, five seconds before autosequence start. */
export const mockSequenceInitialTimeCentiseconds = -5 * 100;

const autosequenceStartTimeCentiseconds = 0;
const autosequenceEndTimeCentiseconds = 30.65 * 100;
const pascalsPerPsi = 6_894.757293168;
const pascalsPerAtm = 101_325;

const nominalStatus = ReadingStatus.NOMINAL;

const defaultActuators: EngineActuators = {
  valves: {
    [ValveId.LoxPressurization]: true,
    [ValveId.TankVent]: false,
    [ValveId.KerosenePressurization]: true,
    [ValveId.KeroseneVent]: false,
    [ValveId.LoxPurge]: true,
    [ValveId.KerosenePurge]: true,
    [ValveId.KeroseneMain]: false,
    [ValveId.LoxMain]: false,
    [ValveId.IgnitionArm]: false,
    [ValveId.IgnitionFire]: false,
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
    [ValveId.TankVent]: true,
    [ValveId.KerosenePressurization]: false,
    [ValveId.KeroseneVent]: true,
    [ValveId.LoxPurge]: false,
    [ValveId.KerosenePurge]: false,
    [ValveId.KeroseneMain]: false,
    [ValveId.LoxMain]: false,
    [ValveId.IgnitionArm]: false,
    [ValveId.IgnitionFire]: false,
  };

  if (timeCentiseconds >= 0) {
    valves[ValveId.TankVent] = false;
  }
  if (timeCentiseconds >= 0.5 * 100) {
    valves[ValveId.LoxPressurization] = true;
  }
  if (timeCentiseconds >= 8.5 * 100) {
    valves[ValveId.KeroseneVent] = false;
    valves[ValveId.KerosenePressurization] = true;
  }
  if (timeCentiseconds >= 19.5 * 100) {
    valves[ValveId.IgnitionArm] = true;
  }
  if (timeCentiseconds >= 20.5 * 100) {
    valves[ValveId.IgnitionFire] = true;
  }
  if (timeCentiseconds >= 21 * 100) {
    valves[ValveId.IgnitionFire] = false;
  }
  if (timeCentiseconds >= 21.1 * 100) {
    valves[ValveId.IgnitionArm] = false;
  }
  if (timeCentiseconds >= 21.5 * 100) {
    valves[ValveId.LoxMain] = true;
  }
  if (timeCentiseconds >= 22 * 100) {
    valves[ValveId.KeroseneMain] = true;
  }
  if (timeCentiseconds >= 24 * 100) {
    valves[ValveId.LoxMain] = false;
    valves[ValveId.LoxPurge] = true;
  }
  if (timeCentiseconds >= 24.15 * 100) {
    valves[ValveId.KeroseneMain] = false;
  }
  if (timeCentiseconds >= 25.65 * 100) {
    valves[ValveId.KerosenePurge] = true;
    valves[ValveId.KerosenePressurization] = false;
    valves[ValveId.LoxPressurization] = false;
    valves[ValveId.KeroseneVent] = true;
    valves[ValveId.TankVent] = true;
  }
  if (timeCentiseconds >= 30.65 * 100) {
    valves[ValveId.LoxPurge] = false;
    valves[ValveId.KerosenePurge] = false;
  }
  if (timeCentiseconds >= 35.65 * 100) {
    valves[ValveId.LoxPressurization] = true;
    valves[ValveId.TankVent] = false;
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
  const actuators = sequenceTimeCentiseconds === undefined || sequenceTimeCentiseconds < mockLiquidSequence.steps[0].start_s * 100
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
  const loxMainOpen = actuators.valves[ValveId.LoxMain];
  const fuelMainOpen = actuators.valves[ValveId.KeroseneMain];
  const bothMainValvesOpen = loxMainOpen && fuelMainOpen;
  const loxMassFlowRateGramsPerSecond = mockSensor(
    (loxMainOpen ? 300 : 2) + noise(loxMainOpen ? 2 : 0.05),
  );
  const fuelMassFlowRateGramsPerSecond = mockSensor(
    (fuelMainOpen ? 500 : 2) + noise(fuelMainOpen ? 2 : 0.05),
  );
  const mixtureRatio = fuelMainOpen
    ? mockSensor(1.5 + noise(0.01))
    : mockSensor(Number.NaN);

  return {
    sensors: {
      gn2PressurePa: mockSensor(Number.NaN),
      gn2TemperatureC: mockSensor(Number.NaN),
      loxTankPressurePa: mockSensor(loxTankPressurePa),
      loxTankLevel: mockSensor(Number.NaN),
      loxTankTemperatureC: mockSensor(Number.NaN),
      loxOrificeDifferentialPressurePa: mockSensor(
        (loxMainOpen ? 20 : 0.5) * pascalsPerPsi + noise(0.05 * pascalsPerPsi),
      ),
      keroseneTankPressurePa: mockSensor(keroseneTankPressurePa),
      keroseneTankLevel: mockSensor(Number.NaN),
      keroseneTankTemperatureC: mockSensor(Number.NaN),
      keroseneOrificeDifferentialPressurePa: mockSensor(
        (fuelMainOpen ? 20 : 0.5) * pascalsPerPsi + noise(0.05 * pascalsPerPsi),
      ),
      chamberPressurePa: mockSensor(
        (2_220_111.85 + (engineFlow ? 650_000 : 0) + (fuelOpen ? 700_000 : 0) - (loxClosed ? 350_000 : 0) - (fuelClosed ? 250_000 : 0)) + noise(8_000),
      ),
      chamberTemperatureC: mockSensor((engineFlow ? 2_900 : 21.67) + noise(8)),
      inletTemperatureC: mockSensor(-185 + noise(0.25)),
      thrustNewtons: mockSensor(
        (bothMainValvesOpen ? 7_400 : 0) + noise(60),
      ),
    },
    derived: {
      loxMassFlowRateGramsPerSecond,
      fuelMassFlowRateGramsPerSecond,
      mixtureRatio,
    },
    actuators,
  };
}
