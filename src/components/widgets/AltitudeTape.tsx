import type { FC } from "react";
import { POLLING_INTERVAL_MS } from "@/hooks/useSensorData";
import { ConversionFactors, altitudeHandler, AltitudeMode } from "@/utils/units/units"

/* -- Constants -- */
const DEFAULT_ALTITUDE_MAXIMUM_METERS = 10000 / ConversionFactors.METERS_TO_FEET;
const GROUND_BAND_REM = 2;      // reserved space at the bottom for the reading
const TOP_CLEARANCE_REM = 3.33; // reserved space at the top so the pill can't breach it
const TRACK_TRANSITION_MS = POLLING_INTERVAL_MS; // small buffer so transitions finish before the next poll lands

/* -- Model Functions -- */
export const getAltitudeMaximumMeters = (override?: number): number => {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return override;
  }

  /* Rev 3's barometer has a different max altitude, so we could
  apply scaling based on the platform using this function. This 
  is postponed for now, though. */

  return DEFAULT_ALTITUDE_MAXIMUM_METERS;
};

/* -- View & Presenter -- */
export interface AltitudeTapeProps {
  altitudeMeters: number;
  altitudeMaximumMeters?: number;
}

export const AltitudeTape: FC<AltitudeTapeProps> = ({
  altitudeMeters,
  altitudeMaximumMeters,
}) => {
  const hasReceivedReading = altitudeMeters > 0;

  // Inline style rather than a Tailwind class, since the duration is
  // computed at runtime from POLLING_INTERVAL_MS and won't survive
  // Tailwind's JIT class scanning as a template string.
  const trackTransitionStyle = hasReceivedReading
    ? { transition: `bottom ${TRACK_TRANSITION_MS}ms` }
    : {};

  const adjustedAltitudeMeters = altitudeHandler.mode === AltitudeMode.QFE
    ? altitudeMeters - altitudeHandler.referenceElevation
    : altitudeMeters;
  const maximum = getAltitudeMaximumMeters(altitudeMaximumMeters);
  const safeAltitude = Number.isFinite(adjustedAltitudeMeters) ? adjustedAltitudeMeters : 0;
  const clampedAltitude = Math.max(0, Math.min(safeAltitude, maximum));
  const fillPercent = maximum > 0 ? (clampedAltitude / maximum) * 100 : 0;
  const clampedFillPercent = Math.max(0, Math.min(fillPercent, 100));
  const fillFraction = clampedFillPercent / 100;

  // Both the bar and the pill sit within the space above the ground band,
  // so 0% lands right at the top of the ground band instead of the very
  // bottom of the container. The top of the container is also reserved,
  // meaning the pill position will latch at maxAltitude and keep from
  // blocking the unit readout.
  const trackPosition = `calc(${fillFraction} * (100% - ${GROUND_BAND_REM}rem - ${TOP_CLEARANCE_REM}rem) + ${GROUND_BAND_REM}rem)`;

  // Widget Layout
  return (
    <div className="relative flex h-full w-20 flex-col items-center justify-between rounded-l-none rounded-r-lg font-sans text-xs text-white/90 transition-colors duration-700 shadow-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-l-none rounded-r-lg">
        <div className="absolute inset-0 bg-gradient-to-b transition-colors duration-700 to-sky-200 from-blue-400 dark:to-sky-800 dark:from-blue-950" />
        <div
          className="absolute bottom-0 left-0 right-0 bg-amber-800 transition-colors duration-700 dark:bg-amber-950"
          style={{ height: `${GROUND_BAND_REM}rem` }}
        />
        <div
          className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          style={{ bottom: trackPosition, ...trackTransitionStyle }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center pt-2 transition-colors duration-700 text-slate-800 dark:text-slate-400">
        <span className="font-medium leading-tight">Altitude</span>
        <span className="text-[10px] font-normal leading-tight">({altitudeHandler.getReferenceMode()})</span>
      </div>

      <div
        className="absolute left-0 right-0 z-20 flex justify-center"
        style={{ bottom: trackPosition, transform: "translateY(50%)", ...trackTransitionStyle }}
      >
        <div className="rounded-full border border-white/25 bg-slate-200 dark:bg-slate-800 px-2 py-1 font-medium transition-colors duration-700 text-black/95 dark:text-white/95">
          {altitudeHandler.getDisplayString(altitudeMeters)} 
        </div>
      </div>
    </div>
  );
};