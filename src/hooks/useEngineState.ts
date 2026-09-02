import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { Alert, AlertPriority } from "@/utils/alerts/alert";
import { forceHandler, pressureHandler, temperatureHandler } from "@/utils/units/units";

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

const nominalStatus = ReadingStatus.NOMINAL;
const ALERT_HYSTERESIS_SAMPLES = 3;

const sensorLabels: Record<keyof EngineSensors, string> = {
  gn2PressurePa: "GN2 pressure",
  gn2TemperatureC: "GN2 temperature",
  loxTankPressurePa: "LOx tank pressure",
  loxTankLevel: "LOx tank level",
  loxTankTemperatureC: "LOx tank temperature",
  loxOrificePressureAPa: "LOx orifice A pressure",
  loxOrificePressureBPa: "LOx orifice B pressure",
  keroseneTankPressurePa: "Kerosene tank pressure",
  keroseneTankLevel: "Kerosene tank level",
  keroseneTankTemperatureC: "Kerosene tank temperature",
  keroseneOrificePressureAPa: "Kerosene orifice A pressure",
  keroseneOrificePressureBPa: "Kerosene orifice B pressure",
  chamberPressurePa: "Chamber pressure",
  chamberTemperatureC: "Chamber temperature",
  inletTemperatureC: "Inlet temperature",
  thrustNewtons: "Thrust",
};

interface SensorAlertState {
  status: ReadingStatus;
  stableSamples: number;
  alert: Alert | null;
}

function getAlertPriority(status: ReadingStatus): AlertPriority | null {
  if (status === ReadingStatus.WARNING) {
    return AlertPriority.WARNING;
  }

  if (status === ReadingStatus.CAUTION) {
    return AlertPriority.CAUTION;
  }

  return null;
}

function formatSensorValue(sensorKey: keyof EngineSensors, value: number): string {
  if (sensorKey.endsWith("PressurePa")) {
    return pressureHandler.getDisplayString(value);
  }

  if (sensorKey.endsWith("TemperatureC")) {
    return temperatureHandler.getDisplayString(value);
  }

  if (sensorKey.endsWith("Level")) {
    return `${(value * 100).toFixed(0)}%`;
  }

  if (sensorKey === "thrustNewtons") {
    return forceHandler.getDisplayString(value);
  }

  return value.toString();
}

function processSensorAlerts(sensors: EngineSensors, alertStates: Map<string, SensorAlertState>) {
  (Object.entries(sensors) as [keyof EngineSensors, SensorReading][]).forEach(([sensorKey, reading]) => {
    const previous = alertStates.get(sensorKey);

    if (reading.status === ReadingStatus.UNCONFIGURED) {
      previous?.alert?.stop();
      alertStates.delete(sensorKey);
      return;
    }

    const stableSamples = previous?.status === reading.status
      ? previous.stableSamples + 1
      : 1;
    const nextState: SensorAlertState = {
      status: reading.status,
      stableSamples,
      alert: previous?.alert ?? null,
    };
    const priority = getAlertPriority(reading.status);

    if (priority && stableSamples >= ALERT_HYSTERESIS_SAMPLES) {
      if (!nextState.alert || nextState.alert.priority !== priority) {
        nextState.alert?.stop();
        nextState.alert = new Alert(
          `${sensorLabels[sensorKey]} ${reading.status}`,
          `Current reading: ${formatSensorValue(sensorKey, reading.value)}`,
          priority,
        );
      } else {
        nextState.alert.bottomLine = `Current reading: ${formatSensorValue(sensorKey, reading.value)}`;
      }
    } else if (!priority && nextState.alert && stableSamples >= ALERT_HYSTERESIS_SAMPLES) {
      nextState.alert.stop();
      nextState.alert = null;
    }

    alertStates.set(sensorKey, nextState);
  });
}

const sensor = (value: number, status = nominalStatus): SensorReading => ({
  value,
  status,
});

/** Returns a complete telemetry snapshot for local development and UI previews. */
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

export interface UseEngineStateResult {
  state: EngineState;
  setState: Dispatch<SetStateAction<EngineState>>;
  setValveOpen: (id: ValveId, open: boolean) => void;
  toggleValve: (id: ValveId) => void;
  reset: () => void;
}

export function useEngineState(initialState: EngineState = mockEngineState()): UseEngineStateResult {
  const [state, setReactState] = useState(initialState);
  const stateRef = useRef(initialState);
  const sensorAlertStatesRef = useRef(new Map<string, SensorAlertState>());

  const setState = useCallback<Dispatch<SetStateAction<EngineState>>>((nextState) => {
    const resolvedState = typeof nextState === "function"
      ? nextState(stateRef.current)
      : nextState;

    stateRef.current = resolvedState;
    processSensorAlerts(resolvedState.sensors, sensorAlertStatesRef.current);
    setReactState(resolvedState);
  }, []);

  const setValveOpen = (id: ValveId, open: boolean) => {
    setState((current) => ({
      ...current,
      actuators: {
        ...current.actuators,
        valves: {
          ...current.actuators.valves,
          [id]: open,
        },
      },
    }));
  };

  const toggleValve = (id: ValveId) => {
    setState((current) => ({
      ...current,
      actuators: {
        ...current.actuators,
        valves: {
          ...current.actuators.valves,
          [id]: !current.actuators.valves[id],
        },
      },
    }));
  };

  return {
    state,
    setState,
    setValveOpen,
    toggleValve,
    reset: () => setState(mockEngineState()),
  };
}