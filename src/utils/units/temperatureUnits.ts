import { ConversionFactors, type UnitsHandler } from "@/utils/units/units";

export { TemperatureUnits, TemperatureUnitsHandler };

/** Supported temperature display units. Internal temperature values are always C. */
enum TemperatureUnits {
  CELSIUS,
  FAHRENHEIT,
  KELVIN,
}

/** Converts SI temperature measurements for presentation; C is the dashboard default. */
class TemperatureUnitsHandler implements UnitsHandler {
  systemUnits = TemperatureUnits.CELSIUS;

  /** Converts a C input to the configured display unit. */
  convertToDisplay(input: number): number {
    switch (this.systemUnits) {
      case TemperatureUnits.CELSIUS:
        return input;
      case TemperatureUnits.FAHRENHEIT:
        return input * ConversionFactors.CELSIUS_TO_FAHRENHEIT_MULTIPLIER + ConversionFactors.CELSIUS_TO_FAHRENHEIT_OFFSET;
      case TemperatureUnits.KELVIN:
        return input + ConversionFactors.CELSIUS_TO_KELVIN_OFFSET;
    }
  }

  getDisplayUnitShort(): string {
    switch (this.systemUnits) {
      case TemperatureUnits.CELSIUS:
        return "C";
      case TemperatureUnits.FAHRENHEIT:
        return "F";
      case TemperatureUnits.KELVIN:
        return "K";
    }
  }

  getDisplayUnitLong(): string {
    switch (this.systemUnits) {
      case TemperatureUnits.CELSIUS:
        return "degrees Celsius";
      case TemperatureUnits.FAHRENHEIT:
        return "degrees Fahrenheit";
      case TemperatureUnits.KELVIN:
        return "kelvin";
    }
  }

  /** Formats a converted temperature reading with its configured display unit. */
  getDisplayString(input: number): string {
    return `${this.convertToDisplay(input).toFixed(1)} ${this.getDisplayUnitShort()}`;
  }
}