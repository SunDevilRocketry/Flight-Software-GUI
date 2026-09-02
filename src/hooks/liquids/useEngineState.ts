import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { Alert, AlertPriority } from "@/utils/liquids/alert";
import { forceHandler, pressureHandler, temperatureHandler } from "@/utils/units/units";

import { mockEngineState, ValveId } from "./useMockEngine";
import type { EngineSensors, EngineState, SensorReading } from "./useMockEngine";

export { ValveId } from "./useMockEngine";
export type { EngineActuators, EngineSensors, EngineState, SensorReading } from "./useMockEngine";

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

export interface UseEngineStateResult {
  state: EngineState;
  setState: Dispatch<SetStateAction<EngineState>>;
  setValveOpen: (id: ValveId, open: boolean) => void;
  toggleValve: (id: ValveId) => void;
  reset: () => void;
}

export function useEngineState(initialState: EngineState = mockEngineState(undefined, undefined, undefined, false)): UseEngineStateResult {
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
