"use client";

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  title?: string;
}

export function Toggle({ checked, label, onChange, title }: ToggleProps) {
  return (
    <button
      className={`flex h-7 w-12 shrink-0 items-center rounded-full border border-base-400 p-1 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
        checked ? "bg-white" : "bg-black"
      }`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title ?? label}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`size-5 rounded-full transition-transform duration-300 ${
          checked ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
        }`}
      />
    </button>
  );
}

interface ThemeToggleProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

export function ThemeToggle({ darkMode, onDarkModeChange }: ThemeToggleProps) {
  return <Toggle checked={darkMode} label="Toggle dark mode" onChange={onDarkModeChange} />;
}