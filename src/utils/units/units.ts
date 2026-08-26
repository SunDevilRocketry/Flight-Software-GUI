/* Export all handlers */
// Altitude
import { AltitudeUnitsHandler } from "@/utils/units/altitudeUnits"
export * from "@/utils/units/altitudeUnits"
// Acceleration
import { AccelerationUnitsHandler } from "@/utils/units/accelerationUnits"
export * from "@/utils/units/accelerationUnits"

/* All exported units handlers should be defined here */
export const altitudeHandler = new AltitudeUnitsHandler();
export const accelerationHandler = new AccelerationUnitsHandler();

export { type UnitsHandler };

/**
 * Enumerated type with constant conversion factors used by this module.
 */
export const ConversionFactors = {
    METERS_TO_FEET: 3.280839895,
    GRAVITY_MPS: 9.80665
} as const;

/**
 * Interface for all unit converters to follow for portability.
 */
interface UnitsHandler {
    /* 
     * Defines the system units. Should be mutable by settings UI. 
     * Should be the specific enum for the UnitsHandler 
     */
    systemUnits: number

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