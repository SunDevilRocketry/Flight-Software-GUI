import { ReadingStatus, readingStatusTextClasses } from "@/components/liquids/pid/readingStatus";

interface SensorReadoutProps {
  label: string;
  readings: Array<{ label: string; value: string; status: ReadingStatus }>;
  compact?: boolean;
}

export function SensorReadout({ label, readings, compact = false }: SensorReadoutProps) {
  return (
    <section
      className={`border border-base-400 bg-base-100 text-base-700 shadow-lg dark:text-highlight ${
        compact ? "w-20 p-1.5" : "w-24 p-2"
      }`}
      aria-label={`${label} sensor readings`}
    >
      <h2 className="border-b border-base-400 pb-1 text-center text-sm font-bold">{label}</h2>
      <dl className="mt-1 space-y-0.5 text-center text-xs">
        {readings.map((reading) => (
          <div key={reading.label}>
            <dt className="sr-only">{reading.label}</dt>
            <dd>
              <span className="text-base-500">{reading.label} </span>
              <span className={`font-semibold ${readingStatusTextClasses[reading.status]}`}>
                {reading.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}