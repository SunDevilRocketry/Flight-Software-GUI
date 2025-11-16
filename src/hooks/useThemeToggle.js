import { useState } from 'react';

export function NightModeToggle({ value, onChange }) {
  // If using external state, pass value & onChange
  const [isNight, setIsNight] = useState(false);

  const handleToggle = () => {
    setIsNight((prev) => !prev);
    if (onChange) onChange(!isNight);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle night mode"
      className={`relative w-24 h-12 rounded-full transition-colors duration-500 focus:outline-none ${
        isNight ? "bg-zinc-800" : "bg-orange-500"
      }`}
    >
      {/* Icon container */}
      <span
        className={`absolute left-0 top-0 w-12 h-12 flex items-center justify-center transition-all duration-500 ${
          isNight ? "translate-x-12" : "translate-x-0"
        }`}
      >
        {!isNight ? (
          // Sun icon (SVG for accessibility & crispness)
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <circle cx="12" cy="12" r="5" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1={12}
                y1={2}
                x2={12}
                y2={6}
                stroke="white"
                strokeWidth="2"
                transform={`rotate(${i * 45} 12 12)`}
              />
            ))}
          </svg>
        ) : (
          // Moon icon
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M17 12a5 5 0 1 1-10 0 6 6 0 0 0 10 0z" />
          </svg>
        )}
      </span>
      {/* Circle "knob" */}
      <span
        className={
          `absolute top-1 left-1 h-10 w-10 rounded-full bg-white shadow transition-all duration-500 ${
            isNight ? "translate-x-12" : "translate-x-0"
          }`
        }
      />
    </button>
  );
}