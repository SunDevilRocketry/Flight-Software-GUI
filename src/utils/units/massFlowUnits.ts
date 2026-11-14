import { type UnitsHandler } from "@/utils/units/units";
import { formatSignificantFigures } from "@/utils/units/significantFigures";

export { MassFlowUnits, MassFlowUnitsHandler };

/** Supported mass-flow display units. Internal mass flow is grams per second. */
enum MassFlowUnits {
  GRAMS_PER_SECOND,
  KILOGRAMS_PER_HOUR,
  POUNDS_PER_HOUR,
  KILOGRAMS_PER_SECOND,
}

/** Converts mass-flow measurements from the SI dashboard unit to the selected display unit. */
class MassFlowUnitsHandler implements UnitsHandler {
  systemUnits = MassFlowUnits.KILOGRAMS_PER_SECOND;

  convertToDisplay(input: number): number {
    switch (this.systemUnits) {
      case MassFlowUnits.GRAMS_PER_SECOND:
        return input;
      case MassFlowUnits.KILOGRAMS_PER_HOUR:
        return input * 3.6;
      case MassFlowUnits.POUNDS_PER_HOUR:
        return input * 3600 / 453.59237;
      case MassFlowUnits.KILOGRAMS_PER_SECOND:
        return input / 1000;
    }
  }

  getDisplayUnitShort(): string {
    switch (this.systemUnits) {
      case MassFlowUnits.GRAMS_PER_SECOND:
        return "g/s";
      case MassFlowUnits.KILOGRAMS_PER_HOUR:
        return "kg/h";
      case MassFlowUnits.POUNDS_PER_HOUR:
        return "lb/h";
      case MassFlowUnits.KILOGRAMS_PER_SECOND:
        return "kg/s";
    }
  }

  getDisplayUnitLong(): string {
    switch (this.systemUnits) {
      case MassFlowUnits.GRAMS_PER_SECOND:
        return "grams per second";
      case MassFlowUnits.KILOGRAMS_PER_HOUR:
        return "kilograms per hour";
      case MassFlowUnits.POUNDS_PER_HOUR:
        return "pounds per hour";
      case MassFlowUnits.KILOGRAMS_PER_SECOND:
        return "kilograms per second";
    }
  }

  getDisplayString(input: number): string {
    return `${formatSignificantFigures(this.convertToDisplay(input))} ${this.getDisplayUnitShort()}`;
  }
}
