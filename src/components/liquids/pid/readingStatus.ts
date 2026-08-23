export enum ReadingStatus {
  WARNING = "WARNING",
  CAUTION = "CAUTION",
  NOMINAL = "NOMINAL",
}

export const readingStatusTextClasses: Record<ReadingStatus, string> = {
  [ReadingStatus.WARNING]: "text-red-600 dark:text-red-400",
  [ReadingStatus.CAUTION]: "text-orange-600 dark:text-orange-300",
  [ReadingStatus.NOMINAL]: "text-emerald-600 dark:text-emerald-400",
};