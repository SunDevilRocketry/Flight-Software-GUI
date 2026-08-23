import { ConversionFactors, type UnitsHandler } from "@/utils/units/units";

export { PressureUnits, PressureUnitsHandler };

/** Supported pressure display units. Internal pressure values are always Pa. */
enum PressureUnits {
  PASCALS,
  POUNDS_PER_SQUARE_INCH,
}

/** Converts SI pressure measurements for presentation; psi is the dashboard default. */
class PressureUnitsHandler implements UnitsHandler {
  systemUnits = PressureUnits.POUNDS_PER_SQUARE_INCH;

  /** Converts a Pa input to the configured display unit. */
  convertToDisplay(input: number): number {
    switch (this.systemUnits) {
      case PressureUnits.PASCALS:
        return input;
      case PressureUnits.POUNDS_PER_SQUARE_INCH:
        return input / ConversionFactors.PASCALS_PER_PSI;
    }
  }

  getDisplayUnitShort(): string {
    return this.systemUnits === PressureUnits.PASCALS ? "Pa" : "psi";
  }

  getDisplayUnitLong(): string {
    return this.systemUnits === PressureUnits.PASCALS ? "pascals" : "pounds per square inch";
  }

  /** Formats a converted pressure reading with its configured display unit. */
  getDisplayString(input: number): string {
    return `${this.convertToDisplay(input).toFixed(0)} ${this.getDisplayUnitShort()}`;
  }
}