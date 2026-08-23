"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = (matches: boolean) => {
      setDarkMode(matches);
      document.documentElement.classList.toggle("dark", matches);
    };
    const handleChange = (event: MediaQueryListEvent) => applySystemTheme(event.matches);

    applySystemTheme(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <button
      className="fixed left-3 top-3 z-50 flex h-7 w-12 items-center rounded-full border border-base-400 bg-base-100 p-1 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight"
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={toggleTheme}
    >
      <span
        className={`size-5 rounded-full bg-base-700 transition-transform duration-300 dark:bg-highlight ${
          darkMode ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}