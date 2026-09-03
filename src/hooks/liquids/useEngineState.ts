import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { Alert, AlertPriority } from "@/utils/liquids/alert";
import { forceHandler, pressureHandler, temperatureHandler } from "@/utils/units/units";

import { createInitialDaqState, type DaqSensorState, type DaqState } from "../SSE/sseLiquids";
import { mockEngineState, noDataSourceEngineState, ValveId } from "./useMockEngine";
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

/** Maps sensor status values to the alert priority used by the CAS.
 * @param status Sensor health status.
 * @returns Matching alert priority, or null for nominal/unconfigured readings.
 */
function getAlertPriority(status: ReadingStatus): AlertPriority | null {
  if (status === ReadingStatus.WARNING) {
    return AlertPriority.WARNING;
  }

  if (status === ReadingStatus.CAUTION) {
    return AlertPriority.CAUTION;
  }

  return null;
}

/** Formats a raw SI sensor value using the currently selected display units.
 * @param sensorKey Sensor field being formatted.
 * @param value Raw sensor value.
 * @returns Formatted value with its display unit when applicable.
 */
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

/** Applies hysteresis and synchronizes sensor alerts with the current readings.
 * @param sensors Current engine sensor readings.
 * @param alertStates Mutable per-sensor alert tracking state.
 */
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

function toReadingStatus(status: string): ReadingStatus {
  return Object.values(ReadingStatus).includes(status as ReadingStatus)
    ? status as ReadingStatus
    : ReadingStatus.UNCONFIGURED;
}

function daqReading(daqState: DaqState, sensorId: string, fallback: SensorReading): SensorReading {
  const sensor: DaqSensorState | undefined = daqState.sensors[sensorId];
  return sensor
    ? { value: sensor.readout ?? Number.NaN, status: toReadingStatus(sensor.status) }
    : fallback;
}

function daqLoadCellReading(daqState: DaqState): SensorReading {
  const loadCells = [daqState.sensors.lc0, daqState.sensors.lc1];
  const finiteLoadCells = loadCells.filter((sensor) => sensor?.readout !== null && sensor?.readout !== undefined && Number.isFinite(sensor.readout));

  if (!finiteLoadCells.length) {
    return { value: Number.NaN, status: ReadingStatus.UNCONFIGURED };
  }

  const status = finiteLoadCells.find((sensor) => sensor.status !== "NOMINAL")?.status ?? "NOMINAL";
  return {
    value: finiteLoadCells.reduce((total, sensor) => total + Number(sensor.readout), 0),
    status: toReadingStatus(status),
  };
}

function engineStateFromDaq(daqState: DaqState, previousState: EngineState): EngineState {
  const pressureSensorIds = ["pt0", "pt1", "pt2", "pt3", "pt4", "pt5", "pt6", "pt7"];
  const [gn2Pressure, loxTankPressure, keroseneTankPressure, loxOrificeA, loxOrificeB, keroseneOrificeA, keroseneOrificeB, chamberPressure] = pressureSensorIds
    .map((sensorId) => daqReading(daqState, sensorId, { value: Number.NaN, status: ReadingStatus.UNCONFIGURED }));
  const valveIds: Record<ValveId, string> = {
    [ValveId.LoxPressurization]: "lox_press",
    [ValveId.LoxVent]: "lox_vent",
    [ValveId.KerosenePressurization]: "fuel_press",
    [ValveId.KeroseneVent]: "fuel_vent",
    [ValveId.LoxPurge]: "lox_purge",
    [ValveId.KerosenePurge]: "fuel_purge",
    [ValveId.KeroseneMain]: "fuel_main",
    [ValveId.LoxMain]: "lox_main",
  };

  return {
    sensors: {
      ...previousState.sensors,
      gn2PressurePa: gn2Pressure,
      gn2TemperatureC: daqReading(daqState, "tc0", previousState.sensors.gn2TemperatureC),
      loxTankPressurePa: loxTankPressure,
      loxTankLevel: daqReading(daqState, "pos_lox_main", previousState.sensors.loxTankLevel),
      loxTankTemperatureC: previousState.sensors.loxTankTemperatureC,
      loxOrificePressureAPa: loxOrificeA,
      loxOrificePressureBPa: loxOrificeB,
      keroseneTankPressurePa: keroseneTankPressure,
      keroseneTankLevel: daqReading(daqState, "pos_fuel_main", previousState.sensors.keroseneTankLevel),
      keroseneTankTemperatureC: previousState.sensors.keroseneTankTemperatureC,
      keroseneOrificePressureAPa: keroseneOrificeA,
      keroseneOrificePressureBPa: keroseneOrificeB,
      chamberPressurePa: chamberPressure,
      chamberTemperatureC: previousState.sensors.chamberTemperatureC,
      inletTemperatureC: previousState.sensors.inletTemperatureC,
      thrustNewtons: daqLoadCellReading(daqState),
    },
    actuators: {
      valves: Object.fromEntries(
        Object.entries(valveIds).map(([id, valveId]) => [
          id,
          daqState.valves[valveId]?.status.toLowerCase() === "open",
        ]),
      ) as Record<ValveId, boolean>,
    },
  };
}

/** State and actuator commands exposed by the engine-state hook. */
export interface UseEngineStateResult {
  state: EngineState;
  setState: Dispatch<SetStateAction<EngineState>>;
  setValveOpen: (id: ValveId, open: boolean) => void;
  toggleValve: (id: ValveId) => void;
  reset: () => void;
  daqState: DaqState;
}

/** Owns engine telemetry, actuator mutations, and sensor-alert processing.
 * @param initialState Optional initial state used instead of the deterministic mock state.
 * @returns Engine state and actuator commands.
 */
export function useEngineState(
  initialState: EngineState = noDataSourceEngineState(),
  daqState: DaqState | null = null,
  dataSourceEnabled = false,
): UseEngineStateResult {
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

  useEffect(() => {
    if (!dataSourceEnabled) {
      setState(noDataSourceEngineState());
      return;
    }

    if (!daqState) {
      return;
    }

    setState((current) => engineStateFromDaq(daqState, current));
  }, [daqState, dataSourceEnabled, setState]);

  return {
    state,
    setState,
    setValveOpen,
    toggleValve,
    reset: () => setState(mockEngineState()),
    daqState: daqState ?? createInitialDaqState(),
  };
}
