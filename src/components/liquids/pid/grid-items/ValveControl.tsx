interface ValveControlProps {
  label: string;
  open: boolean;
  onToggle: () => void;
}

/** Renders a square P&ID valve control and its current open state.
 * @param props Valve label, state, and toggle callback.
 * @returns The rendered valve button.
 */
export function ValveControl({ label, open, onToggle }: ValveControlProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={`flex size-12 items-center justify-center border-2 px-1 text-center text-xs font-bold leading-tight transition duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
        open
          ? "border-emerald-300 bg-emerald-500 text-zinc-950"
          : "border-red-300 bg-red-800 text-white hover:bg-red-700"
      }`}
      title={`${label}: ${open ? "open" : "closed"}`}
    >
      <span>
        {label.split(" ").map((word) => (
          <span key={word} className="block">{word}</span>
        ))}
      </span>
    </button>
  );
}