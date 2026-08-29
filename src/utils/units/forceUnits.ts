import type { UnitsHandler } from "@/utils/units/units";

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
    return `${this.convertToDisplay(input).toFixed(0)} ${this.getDisplayUnitShort()}`;
  }
}