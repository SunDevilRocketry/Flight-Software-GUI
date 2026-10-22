interface ValveControlProps {
  label: string;
  moving?: boolean;
  movementDirection?: "opening" | "closing";
  showStateWhileMoving?: boolean;
  open: boolean;
  onToggle: () => void;
}

/** Renders a square P&ID valve control and its current open state.
 * @param props Valve label, state, and toggle callback.
 * @returns The rendered valve button.
 */
export function ValveControl({ label, moving = false, movementDirection, showStateWhileMoving = false, open, onToggle }: ValveControlProps) {
  const movementClasses = movementDirection === "opening"
    ? "cursor-not-allowed border-yellow-400 bg-red-800 text-white"
    : movementDirection === "closing"
      ? "cursor-not-allowed border-yellow-400 bg-emerald-500 text-zinc-950"
      : moving
        ? showStateWhileMoving
          ? open
            ? "cursor-not-allowed border-yellow-400 bg-emerald-500 text-zinc-950"
            : "cursor-not-allowed border-yellow-400 bg-red-800 text-white"
          : "cursor-not-allowed border-zinc-500 bg-zinc-400 text-zinc-700 disabled:hover:bg-zinc-400"
        : open
          ? "border-emerald-300 bg-emerald-500 text-zinc-950"
          : "border-red-300 bg-red-800 text-white hover:bg-red-700";
  const animationClasses = movementDirection === "opening"
    ? "bg-emerald-500 text-zinc-950 valve-opening-fill"
    : "bg-red-800 text-white valve-closing-fill";

  const renderLabel = () => label.split(" ").map((word) => (
    <span key={word} className="block">{word}</span>
  ));

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={moving || movementDirection !== undefined}
      aria-pressed={open}
      className={`relative isolate flex size-12 items-center justify-center overflow-hidden border-2 px-1 text-center text-xs font-bold leading-tight disabled:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${movementClasses}`}
      title={`${label}: ${movementDirection ?? (moving ? "moving" : open ? "open" : "closed")}`}
    >
      {movementDirection && (
        <span aria-hidden="true" className={`absolute inset-0 z-20 flex flex-col items-center justify-center px-1 text-center text-xs font-bold leading-tight ${animationClasses}`}>
          {renderLabel()}
        </span>
      )}
      <span className="relative z-10">
        {renderLabel()}
      </span>
    </button>
  );
}