"use client";

import { ReadingStatus, readingStatusTextClasses } from "@/components/liquids/pid/readingStatus";
import { massFlowHandler, pressureHandler, temperatureHandler } from "@/utils/units/units";

interface GaugeProps {
  label: string;
  max: number;
  min: number;
  precision?: number;
  unit: string;
  value: number;
  status: ReadingStatus;
}

const TICK_ANGLES = Array.from({ length: 11 }, (_, index) => -135 + index * 27);

function Gauge({ label, max, min, precision = 0, unit, value, status }: GaugeProps) {
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const needleAngle = -135 + normalizedValue * 270;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1" aria-label={`${label} gauge`}>
      <div className="relative aspect-square w-full max-w-36 rounded-full border-2 border-base-400 bg-base-200 p-2 shadow-inner">
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" className="stroke-base-300" strokeWidth="5" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            className="stroke-base-500"
            strokeDasharray="198 66"
            strokeLinecap="round"
            strokeWidth="5"
            transform="rotate(135 50 50)"
          />
          {TICK_ANGLES.map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="11"
              x2="50"
              y2="16"
              className="stroke-base-500"
              strokeWidth="1.5"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="16"
            className="stroke-accent-red transition-transform duration-300 ease-out"
            strokeLinecap="round"
            strokeWidth="2"
            transform={`rotate(${needleAngle} 50 50)`}
          />
          <circle cx="50" cy="50" r="3.5" className="fill-accent-red" />
        </svg>
        <div className="absolute inset-0 flex translate-y-5 flex-col items-center justify-center pt-4 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-base-500">
            {label}
          </span>
        </div>
        <span className="absolute bottom-1 left-3 text-[9px] font-semibold text-base-500">{min.toFixed(0)}</span>
        <span className="absolute bottom-1 right-3 text-[9px] font-semibold text-base-500">{max.toFixed(0)}</span>
      </div>
      <span className={`text-xs font-semibold ${readingStatusTextClasses[status]}`}>
        {status}
      </span>
      <span className={`max-w-full truncate text-sm font-bold ${readingStatusTextClasses[status]}`}>
        {value.toFixed(precision)} {unit}
      </span>
    </div>
  );
}

interface GaugesProps {
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
}

/** Displays the primary liquid-engine pressure and temperature gauges.
 * @param props Gauge values, units, and health statuses.
 * @returns The rendered gauge panel.
 */
export function Gauges({
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
}: GaugesProps) {
  const pressureMin = pressureHandler.convertToDisplay(0);
  const pressureMax = pressureHandler.convertToDisplay(1_000 * 6_894.757293168);
  const temperatureMin = temperatureHandler.convertToDisplay(-200);
  const temperatureMax = temperatureHandler.convertToDisplay(25);
  const massFlowMin = massFlowHandler.convertToDisplay(0);
  const massFlowMax = massFlowHandler.convertToDisplay(1_000);

  return (
    <section className="flex min-h-0 flex-1 flex-col border border-base-300 bg-base-100 p-4 shadow-lg" aria-label="Display configuration">
      <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-x-3 gap-y-5 pt-5">
        <Gauge label="Inlet T" value={temperatureHandler.convertToDisplay(inletTemperatureC)} min={temperatureMin} max={temperatureMax} unit={temperatureHandler.getDisplayUnitShort()} status={inletTemperatureStatus} />
        <Gauge label="Chamber P" value={pressureHandler.convertToDisplay(chamberPressurePa)} min={pressureMin} max={pressureMax} unit={pressureHandler.getDisplayUnitShort()} status={chamberPressureStatus} />
        <Gauge label="LOx P" value={pressureHandler.convertToDisplay(loxPressurePa)} min={pressureMin} max={pressureMax} unit={pressureHandler.getDisplayUnitShort()} status={loxPressureStatus} />
        <Gauge label="Fuel P" value={pressureHandler.convertToDisplay(fuelPressurePa)} min={pressureMin} max={pressureMax} unit={pressureHandler.getDisplayUnitShort()} status={fuelPressureStatus} />
        <Gauge label="MFR LOx" value={massFlowHandler.convertToDisplay(loxMassFlowRateGramsPerSecond)} min={massFlowMin} max={massFlowMax} unit={massFlowHandler.getDisplayUnitShort()} status={loxMassFlowRateStatus} />
        <Gauge label="MFR Fuel" value={massFlowHandler.convertToDisplay(fuelMassFlowRateGramsPerSecond)} min={massFlowMin} max={massFlowMax} unit={massFlowHandler.getDisplayUnitShort()} status={fuelMassFlowRateStatus} />
        <div className="col-span-2 flex justify-center">
          <div className="w-1/2">
            <Gauge label="Mixture Ratio" value={mixtureRatio} min={0} max={3} precision={2} unit="O/F" status={mixtureRatioStatus} />
          </div>
        </div>
      </div>
    </section>
  );
}