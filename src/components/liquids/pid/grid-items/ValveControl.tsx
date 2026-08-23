interface ValveControlProps {
  number: number;
  label: string;
  open: boolean;
  onToggle: () => void;
}

export function ValveControl({ number, label, open, onToggle }: ValveControlProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={`flex size-12 items-center justify-center border-2 text-lg font-bold transition duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
        open
          ? "border-emerald-300 bg-emerald-500 text-zinc-950"
          : "border-red-300 bg-red-800 text-white hover:bg-red-700"
      }`}
      title={`${label}: ${open ? "open" : "closed"}`}
    >
      <span className="sr-only">{label}: </span>
      {number}
    </button>
  );
}