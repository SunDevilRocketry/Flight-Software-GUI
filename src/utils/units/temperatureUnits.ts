import ConversionFactors, { type UnitsHandler } from "@/utils/units/units";

export { TemperatureUnits, TemperatureUnitsHandler };

/** Supported temperature display units. Internal temperature values are always C. */
enum TemperatureUnits {
  CELSIUS,
  FAHRENHEIT,
}

/** Converts SI temperature measurements for presentation; C is the dashboard default. */
class TemperatureUnitsHandler implements UnitsHandler {
  systemUnits = TemperatureUnits.CELSIUS;

  /** Converts a C input to the configured display unit. */
  convertToDisplay(input: number): number {
    return this.systemUnits === TemperatureUnits.FAHRENHEIT
      ? input * ConversionFactors.CELSIUS_TO_FAHRENHEIT_MULTIPLIER + ConversionFactors.CELSIUS_TO_FAHRENHEIT_OFFSET
      : input;
  }

  getDisplayUnitShort(): string {
    return this.systemUnits === TemperatureUnits.FAHRENHEIT ? "F" : "C";
  }

  getDisplayUnitLong(): string {
    return this.systemUnits === TemperatureUnits.FAHRENHEIT ? "degrees Fahrenheit" : "degrees Celsius";
  }

  /** Formats a converted temperature reading with its configured display unit. */
  getDisplayString(input: number): string {
    return `${this.convertToDisplay(input).toFixed(1)} ${this.getDisplayUnitShort()}`;
  }
}