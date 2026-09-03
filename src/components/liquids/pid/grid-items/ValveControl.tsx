interface ValveControlProps {
  label: string;
  moving?: boolean;
  open: boolean;
  onToggle: () => void;
}

/** Renders a square P&ID valve control and its current open state.
 * @param props Valve label, state, and toggle callback.
 * @returns The rendered valve button.
 */
export function ValveControl({ label, moving = false, open, onToggle }: ValveControlProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={moving}
      aria-pressed={open}
      className={`flex size-12 items-center justify-center border-2 px-1 text-center text-xs font-bold leading-tight transition duration-100 disabled:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
        moving
          ? "cursor-not-allowed border-zinc-500 bg-zinc-400 text-zinc-700 disabled:hover:bg-zinc-400"
          : open
          ? "border-emerald-300 bg-emerald-500 text-zinc-950"
          : "border-red-300 bg-red-800 text-white hover:bg-red-700"
      }`}
      title={`${label}: ${moving ? "moving" : open ? "open" : "closed"}`}
    >
      <span>
        {label.split(" ").map((word) => (
          <span key={word} className="block">{word}</span>
        ))}
      </span>
    </button>
  );
}