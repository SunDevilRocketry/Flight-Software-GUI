import type { UnitsHandler } from "@/utils/units/units";
import { formatSignificantFigures } from "@/utils/units/significantFigures";

export { ForceUnits, ForceUnitsHandler };

enum ForceUnits {
  NEWTONS,
  POUNDS_FORCE,
}

class ForceUnitsHandler implements UnitsHandler {
  systemUnits = ForceUnits.NEWTONS;

  convertToDisplay(input: number): number {
    return this.systemUnits === ForceUnits.POUNDS_FORCE ? input / 4.448221615 : input;
  }

  getDisplayUnitShort(): string {
    return this.systemUnits === ForceUnits.POUNDS_FORCE ? "lbf" : "N";
  }

  getDisplayUnitLong(): string {
    return this.systemUnits === ForceUnits.POUNDS_FORCE ? "pounds-force" : "newtons";
  }

  getDisplayString(input: number): string {
    return `${formatSignificantFigures(this.convertToDisplay(input))} ${this.getDisplayUnitShort()}`;
  }
}