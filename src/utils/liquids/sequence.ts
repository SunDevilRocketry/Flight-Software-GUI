export type DaqSequenceAction = [timeSeconds: number, actuatorId: string, state: 0 | 1];

export interface DaqSequenceStep {
  name: string;
  start_s: number;
  actions: DaqSequenceAction[];
}

export interface DaqSequenceDefinition {
  steps: DaqSequenceStep[];
}

const actuatorDisplayNames: Record<string, string> = {
  tank_depress: "Tank Vent",
  fuel_vent: "Fuel Vent",
  lox_press: "LOx Pressurization Valve",
  fuel_press: "Fuel Pressurization Valve",
  lox_purge: "LOx Purge",
  fuel_purge: "Fuel Purge",
  lox_main: "LOx Main Valve",
  fuel_main: "Fuel Main Valve",
  ignition_arm: "Igniter",
  ignition_fire: "Ignition",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses a sequence payload and derives each step's start from its earliest action. */
export function parseDaqSequenceDefinition(value: unknown): DaqSequenceDefinition {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    throw new Error("The DAQ sequence response must contain a steps array.");
  }

  const steps = value.steps.map((step, stepIndex): DaqSequenceStep => {
    if (!isRecord(step) || typeof step.name !== "string" || !Array.isArray(step.actions)) {
      throw new Error(`DAQ sequence step ${stepIndex + 1} is malformed.`);
    }

    const actions = step.actions.map((action, actionIndex): DaqSequenceAction => {
      if (
        !Array.isArray(action)
        || action.length !== 3
        || typeof action[0] !== "number"
        || !Number.isFinite(action[0])
        || typeof action[1] !== "string"
        || (action[2] !== 0 && action[2] !== 1)
      ) {
        throw new Error(`Action ${actionIndex + 1} in DAQ sequence step "${step.name}" is malformed.`);
      }

      return [action[0], action[1], action[2]];
    });

    if (actions.length === 0) {
      throw new Error(`DAQ sequence step "${step.name}" has no actions.`);
    }

    return {
      name: step.name,
      start_s: Math.min(...actions.map(([timeSeconds]) => timeSeconds)),
      actions,
    };
  });

  if (steps.length === 0) {
    throw new Error("The DAQ sequence contains no steps.");
  }

  const sequence = { steps };
  if (getIgnitionReferenceSeconds(sequence) === null) {
    throw new Error('The DAQ sequence has no "ignition_fire" action with state 1.');
  }

  return sequence;
}

/** Finds the first ignition-fire activation used as GUI T+0. */
export function getIgnitionReferenceSeconds(sequence: DaqSequenceDefinition): number | null {
  const ignitionTimes = sequence.steps.flatMap((step) =>
    step.actions
      .filter(([, actuatorId, state]) => actuatorId === "ignition_fire" && state === 1)
      .map(([timeSeconds]) => timeSeconds),
  );

  return ignitionTimes.length > 0 ? Math.min(...ignitionTimes) : null;
}

/** Converts DAQ sequence seconds to GUI centiseconds relative to ignition. */
export function daqSecondsToGuiCentiseconds(daqSeconds: number, ignitionSeconds: number): number {
  return Math.round((daqSeconds - ignitionSeconds) * 100);
}

/** Converts GUI centiseconds relative to ignition back to DAQ sequence seconds. */
export function guiCentisecondsToDaqSeconds(guiCentiseconds: number, ignitionSeconds: number): number {
  return guiCentiseconds / 100 + ignitionSeconds;
}

/** Formats GUI-relative sequence time stored in centiseconds. */
export function formatSequenceTime(timerCentiseconds: number): string {
  const absoluteCentiseconds = Math.abs(timerCentiseconds);
  const totalSeconds = Math.floor(absoluteCentiseconds / 100);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = absoluteCentiseconds % 100;
  const time = [minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");

  return `T${timerCentiseconds < 0 ? "-" : "+"}${hours ? `${hours.toString().padStart(2, "0")}:` : ""}${time}.${centiseconds
    .toString()
    .padStart(2, "0")}`;
}

/** Resolves a DAQ actuator identifier to the label used by the dashboard. */
export function actuatorNameToDisplayName(actuatorId: string): string {
  return actuatorDisplayNames[actuatorId] ?? actuatorId;
}

/** Formats actions with GUI-relative timestamps and dashboard actuator labels. */
export function describeSequenceActions(actions: DaqSequenceAction[], ignitionSeconds: number): string {
  return [...actions]
    .sort(([firstTime], [secondTime]) => firstTime - secondTime)
    .map(([timeSeconds, actuatorId, state]) => {
      const actionTime = formatSequenceTime(daqSecondsToGuiCentiseconds(timeSeconds, ignitionSeconds));
      let description: string;

    if (actuatorId === "ignition_arm") {
        description = state === 1 ? "ARM Igniter" : "DISARM Igniter";
      } else if (actuatorId === "ignition_fire") {
        description = state === 1 ? "IGNITE" : "IGNITION OFF";
      } else {
        description = `${state === 1 ? "OPEN" : "CLOSE"} ${actuatorNameToDisplayName(actuatorId)}`;
      }

      return `${actionTime} ${description}`;
    })
    .join("\n");
}
