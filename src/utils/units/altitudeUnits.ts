import {ConversionFactors, type UnitsHandler} from "@/utils/units/units"

export { AltitudeUnits, AltitudeMode, AltitudeUnitsHandler };

enum AltitudeUnits {
    FEET,
    METERS
}

enum AltitudeMode {
    QNH, /* Sea Level Reference Elevation */
    QFE  /* Airfield Reference Elevation */
}

class AltitudeUnitsHandler implements UnitsHandler {
    /* Shared members for unitsHandler. Not typed for inheritance reasons. */
    systemUnits = AltitudeUnits.FEET;

    /* Altitude only */
    mode: AltitudeMode = AltitudeMode.QNH;
    referenceElevation: number = -0.1;

    /**
     * Convert the internal measurement to the system's configured
     * display units.
     * 
     * @param input The input readout (as SI unit)
     * @returns The output readout (as system units)
     */
    convertToDisplay(input: number): number {
        /* Convert to altitude relative to reference */
        switch (this.mode) {
            case AltitudeMode.QFE:
                if (this.referenceElevation < 0) {
                    break; /* use QNH if no reference elevation defined. assumes we'd never launch from below sea level */
                }
                input -= this.referenceElevation; /* negative altitudes allowed */
                break;
            default:
                console.error("Invalid altitude reference mode."); /* intentional fallthrough to QNH */
            case AltitudeMode.QNH:
                break; /* do nothing */
        }

        /* Convert to display unit */
        switch (this.systemUnits) {
            case AltitudeUnits.METERS:
                break; /* SI/input units */
            default:
                console.error("Invalid altitude units.") /* intentional fallthrough to feet */
            case AltitudeUnits.FEET:
                input *= ConversionFactors.METERS_TO_FEET;
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
            case AltitudeUnits.METERS:
                out += "m";
                break;
            default:
                console.error("Invalid altitude units."); /* intentional fallthrough to feet */
            case AltitudeUnits.FEET:
                out += "ft";
                break;
        }

        /* Extra step for altitude: reference mode */
        if(this.referenceElevation >= 0 && this.mode === AltitudeMode.QFE) {
            out += " AGL";
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
            case AltitudeUnits.METERS:
                out += "meters";
                break;
            default:
                console.error("Invalid altitude units."); /* intentional fallthrough to feet */
            case AltitudeUnits.FEET:
                out += "feet";
                break;
        }

        /* Extra step for altitude: reference mode */
        if(this.referenceElevation >= 0 && this.mode === AltitudeMode.QFE) {
            out += " AGL";
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
        return this.convertToDisplay(input).toFixed(0) + " " + this.getDisplayUnitShort();
    }

    /**
     * For altitude only: Retrieve the altitude reference mode in use
     * 
     * @returns A string describing the altitude reference mode
     */
    getReferenceMode(): string {
        if(this.referenceElevation >= 0 && this.mode === AltitudeMode.QFE) {
            return "QFE";
        }
        else {
            return "QNH";
        }
    }
}