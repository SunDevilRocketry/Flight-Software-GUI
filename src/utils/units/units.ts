/* Export all handlers */
// Altitude
import { AltitudeUnitsHandler } from "@/utils/units/altitudeUnits"
export * from "@/utils/units/altitudeUnits"
// Acceleration
import { AccelerationUnitsHandler } from "@/utils/units/accelerationUnits"
export * from "@/utils/units/accelerationUnits"
// Pressure
import { PressureUnitsHandler } from "@/utils/units/pressureUnits"
export * from "@/utils/units/pressureUnits"
// Temperature
import { TemperatureUnitsHandler } from "@/utils/units/temperatureUnits"
export * from "@/utils/units/temperatureUnits"

/* All exported units handlers should be defined here */
export const altitudeHandler = new AltitudeUnitsHandler();
export const accelerationHandler = new AccelerationUnitsHandler();
/* P&ID defaults: SI pressure values display as psi; SI temperatures display as C. */
export const pressureHandler = new PressureUnitsHandler();
export const temperatureHandler = new TemperatureUnitsHandler();

export { type UnitsHandler };

/**
 * Enumerated type with constant conversion factors used by this module.
 */
enum ConversionFactors {
    METERS_TO_FEET = 3.280839895,
    GRAVITY_MPS = 9.80665,
    PASCALS_PER_PSI = 6894.757293168,
    CELSIUS_TO_FAHRENHEIT_MULTIPLIER = 9 / 5,
    CELSIUS_TO_FAHRENHEIT_OFFSET = 32
}
export default ConversionFactors;

/**
 * Interface for all unit converters to follow for portability.
 */
interface UnitsHandler {
    /* Shared members for unitsHandler. Not typed for inheritance reasons. */
    systemUnits: unknown

    /**
     * Convert the internal measurement to the system's configured
     * display units.
     * 
     * @param input The input readout (as SI unit)
     * @returns The output readout (as system units)
     */
    convertToDisplay(input: number): number

    /**
     * Retrieve a short unit string to append to the readout.
     * 
     * @returns A shortened form of the unit string
     */
    getDisplayUnitShort(): string

    /**
     * Retrieve the full unit string to append to the readout.
     * 
     * @returns The unit string
     */
    getDisplayUnitLong(): string

    /**
     * Retrieve a string with the correct units for display.
     * 
     * @param input The input value (as SI)
     * @returns A string with the output value and its associated units
     */
    getDisplayString(input: number): string
}