import { ConversionFactors, type UnitsHandler } from "@/utils/units/units";

export { PressureUnits, PressureUnitsHandler };

/** Supported pressure display units. Internal pressure values are always Pa. */
enum PressureUnits {
  PASCALS,
  POUNDS_PER_SQUARE_INCH,
  INCHES_OF_MERCURY,
  KILOPASCALS,
  ATMOSPHERES,
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
      case PressureUnits.INCHES_OF_MERCURY:
        return input / ConversionFactors.PASCALS_PER_INHG;
      case PressureUnits.KILOPASCALS:
        return input / ConversionFactors.PASCALS_PER_KPA;
      case PressureUnits.ATMOSPHERES:
        return input / ConversionFactors.PASCALS_PER_ATM;
    }
  }

  getDisplayUnitShort(): string {
    switch (this.systemUnits) {
      case PressureUnits.PASCALS:
        return "Pa";
      case PressureUnits.POUNDS_PER_SQUARE_INCH:
        return "psi";
      case PressureUnits.INCHES_OF_MERCURY:
        return "inHg";
      case PressureUnits.KILOPASCALS:
        return "kPa";
      case PressureUnits.ATMOSPHERES:
        return "atm";
    }
  }

  getDisplayUnitLong(): string {
    switch (this.systemUnits) {
      case PressureUnits.PASCALS:
        return "pascals";
      case PressureUnits.POUNDS_PER_SQUARE_INCH:
        return "pounds per square inch";
      case PressureUnits.INCHES_OF_MERCURY:
        return "inches of mercury";
      case PressureUnits.KILOPASCALS:
        return "kilopascals";
      case PressureUnits.ATMOSPHERES:
        return "atmospheres";
    }
  }

  /** Formats a converted pressure reading with its configured display unit. */
  getDisplayString(input: number): string {
    return `${this.convertToDisplay(input).toFixed(0)} ${this.getDisplayUnitShort()}`;
  }
}