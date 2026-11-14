/** Health state reported for a sensor reading. */
export enum ReadingStatus {
  WARNING = "WARNING",
  CAUTION = "CAUTION",
  NOMINAL = "NOMINAL",
  UNCONFIGURED = "UNCONFIGURED",
}

/** Tailwind text classes used to present each sensor health state. */
export const readingStatusTextClasses: Record<ReadingStatus, string> = {
  [ReadingStatus.WARNING]: "text-red-600 dark:text-red-400",
  [ReadingStatus.CAUTION]: "text-orange-600 dark:text-orange-300",
  [ReadingStatus.NOMINAL]: "text-emerald-600 dark:text-emerald-400",
  [ReadingStatus.UNCONFIGURED]: "text-base-500",
};