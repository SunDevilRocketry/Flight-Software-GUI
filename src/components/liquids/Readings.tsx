"use client";

import { ReadingStatus, readingStatusTextClasses } from "@/components/liquids/pid/readingStatus";
import { forceHandler, massFlowHandler, pressureHandler, temperatureHandler } from "@/utils/units/units";
import { formatSignificantFigures } from "@/utils/units/significantFigures";

interface ReadingsProps {
  chamberPressurePa: number;
  chamberPressureStatus: ReadingStatus;
  fuelPressurePa: number;
  fuelPressureStatus: ReadingStatus;
  inletTemperatureC: number;
  inletTemperatureStatus: ReadingStatus;
  loxPressurePa: number;
  loxPressureStatus: ReadingStatus;
  loxMassFlowRateGramsPerSecond: number;
  loxMassFlowRateStatus: ReadingStatus;
  fuelMassFlowRateGramsPerSecond: number;
  fuelMassFlowRateStatus: ReadingStatus;
  mixtureRatio: number;
  mixtureRatioStatus: ReadingStatus;
  thrustNewtons: number;
  thrustStatus: ReadingStatus;
}

interface ReadingItem {
  label: string;
  status: ReadingStatus;
  unit: string;
  value: number;
}

function Reading({ label, status, unit, value }: ReadingItem) {
  return (
    <dl
      className="grid min-h-0 min-w-0 grid-cols-[7rem_1px_minmax(0,1fr)] items-center gap-2 border border-base-300 bg-base-100 p-3 shadow-lg"
      aria-label={`${label} reading`}
    >
      <dt className="text-right text-base font-bold uppercase tracking-wide text-base-500">{label}</dt>
      <span className="h-5 w-px bg-base-400" aria-hidden="true" />
      <dd className={`min-w-0 break-all ${readingStatusTextClasses[status]}`}>
        <span className="text-3xl font-black leading-none tracking-tight xl:text-4xl">
          {formatSignificantFigures(value)}{" "}
          <span className="text-sm font-bold">{unit}</span>
        </span>
      </dd>
    </dl>
  );
}

/** Displays the dashboard's primary engine values as prominent numeric readouts.
 * @param props Sensor values and health statuses.
 * @returns The rendered primary readings panel.
 */
export function Readings({
  chamberPressurePa,
  chamberPressureStatus,
  fuelPressurePa,
  fuelPressureStatus,
  inletTemperatureC,
  inletTemperatureStatus,
  loxPressurePa,
  loxPressureStatus,
  loxMassFlowRateGramsPerSecond,
  loxMassFlowRateStatus,
  fuelMassFlowRateGramsPerSecond,
  fuelMassFlowRateStatus,
  mixtureRatio,
  mixtureRatioStatus,
  thrustNewtons,
  thrustStatus,
}: ReadingsProps) {
  const readings: ReadingItem[] = [
    {
      label: "Inlet T",
      value: temperatureHandler.convertToDisplay(inletTemperatureC),
      unit: temperatureHandler.getDisplayUnitShort(),
      status: inletTemperatureStatus,
    },
    {
      label: "LOx P",
      value: pressureHandler.convertToDisplay(loxPressurePa),
      unit: pressureHandler.getDisplayUnitShort(),
      status: loxPressureStatus,
    },
    {
      label: "Fuel P",
      value: pressureHandler.convertToDisplay(fuelPressurePa),
      unit: pressureHandler.getDisplayUnitShort(),
      status: fuelPressureStatus,
    },
    {
      label: "Chamber P",
      value: pressureHandler.convertToDisplay(chamberPressurePa),
      unit: pressureHandler.getDisplayUnitShort(),
      status: chamberPressureStatus,
    },
    {
      label: "Thrust",
      value: forceHandler.convertToDisplay(thrustNewtons),
      unit: forceHandler.getDisplayUnitShort(),
      status: thrustStatus,
    },
    {
      label: "MFR LOx",
      value: massFlowHandler.convertToDisplay(loxMassFlowRateGramsPerSecond),
      unit: massFlowHandler.getDisplayUnitShort(),
      status: loxMassFlowRateStatus,
    },
    {
      label: "MFR Fuel",
      value: massFlowHandler.convertToDisplay(fuelMassFlowRateGramsPerSecond),
      unit: massFlowHandler.getDisplayUnitShort(),
      status: fuelMassFlowRateStatus,
    },
    {
      label: "Mixture Ratio",
      value: mixtureRatio,
      unit: "O/F",
      status: mixtureRatioStatus,
    },
  ];

  return (
    <section
      className="grid min-h-0 flex-1 grid-cols-1 grid-rows-8 gap-2 border border-base-300 bg-base-100 p-3"
      aria-label="Primary sensor readings"
    >
      {readings.map((reading) => (
        <Reading key={reading.label} {...reading} />
      ))}
    </section>
  );
}
