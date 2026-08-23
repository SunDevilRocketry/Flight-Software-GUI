import { ConversionFactors, type UnitsHandler } from "@/utils/units/units"

export { AccelerationUnits, AccelerationUnitsHandler };

enum AccelerationUnits {
    G_FORCE,
    METERS_PER_SECOND_SQUARED
}

class AccelerationUnitsHandler implements UnitsHandler {
    /* Shared members for unitsHandler. Not typed for inheritance reasons. */
    systemUnits = AccelerationUnits.G_FORCE;

    /**
     * Convert the internal measurement to the system's configured
     * display units.
     * 
     * @param input The input readout (as SI unit)
     * @returns The output readout (as system units)
     */
    convertToDisplay(input: number): number {
        /* Convert to display unit */
        switch (this.systemUnits) {
            case AccelerationUnits.METERS_PER_SECOND_SQUARED:
                break; /* SI/input units */
            default:
                console.error("Invalid acceleration units.") /* intentional fallthrough to G */
            case AccelerationUnits.G_FORCE:
                input /= ConversionFactors.GRAVITY_MPS;
                break;
        }

        return input;
    }

    /**
     * Retrieve a short unit string to append to the readout.
     * 
     * @returns A shortened form of the unit string
     */
    getDisplayUnitShort(): string {
        let out: string = ""
        switch (this.systemUnits) {
            case AccelerationUnits.METERS_PER_SECOND_SQUARED:
                out += "m/s²"; // yay unicode
                break;
            default:
                console.error("Invalid acceleration units."); /* intentional fallthrough to g */
            case AccelerationUnits.G_FORCE:
                out += "g";
                break;
        }

        return out;
    }

    /**
     * Retrieve the full unit string to append to the readout.
     * 
     * @returns The unit string
     */
    getDisplayUnitLong(): string {
        let out: string = ""
        switch (this.systemUnits) {
            case AccelerationUnits.METERS_PER_SECOND_SQUARED:
                out += "meters per second squared"; // yay unicode
                break;
            default:
                console.error("Invalid acceleration units."); /* intentional fallthrough to g */
            case AccelerationUnits.G_FORCE:
                out += "times the force of gravity";
                break;
        }

        return out;
    }

    /**
     * Retrieve a string with the correct units for display.
     * 
     * @param input The input value (as SI)
     * @returns A string with the output value and its associated units
     */
    getDisplayString(input: number): string {
        if(this.systemUnits === AccelerationUnits.G_FORCE)
            {
            /* Give an extra decimal for G-force since there's less precision before the decimal */
            return this.convertToDisplay(input).toFixed(3) + " " + this.getDisplayUnitShort();
            }
        else
            {
            return this.convertToDisplay(input).toFixed(2) + " " + this.getDisplayUnitShort();
            }
    }

}