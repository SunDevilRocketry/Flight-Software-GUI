interface StepProps {
  action: string;
  active: boolean;
  name: string;
  startTime: string;
  onJump: () => void;
  elementRef: (element: HTMLElement | null) => void;
}

/** Displays one sequence event and allows the timer to jump to its start time.
 * @param props Sequence event details and navigation callbacks.
 * @returns The rendered sequence event.
 */
export function Step({ action, active, name, startTime, onJump, elementRef }: StepProps) {
  return (
    <article
      ref={elementRef}
      className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-base-300 px-4 py-3 transition-colors duration-300 ease-out last:border-b-0 ${
        active ? "bg-cyan-400/20 dark:bg-cyan-300/15" : ""
      }`}
    >
      <time className="font-mono text-sm font-bold tabular-nums text-base-600">{startTime}</time>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold">{name}</h3>
        <p className="mt-0.5 font-mono text-xs text-base-500">{action}</p>
      </div>
      <button
        className="border border-base-400 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        type="button"
        onClick={onJump}
      >
        Jump
      </button>
    </article>
  );
}