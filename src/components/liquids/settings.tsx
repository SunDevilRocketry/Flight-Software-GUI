"use client";

import { useEffect, useRef, useState } from "react";
import { Settings as SettingsIcon, X } from "lucide-react";

import { ThemeToggle, Toggle } from "@/components/liquids/ThemeToggle";
import { areAlertAuralsMuted, setAlertAuralsMuted } from "@/utils/alerts/alert";
import {
  AltitudeUnits,
  ForceUnits,
  PressureUnits,
  TemperatureUnits,
  altitudeHandler,
  forceHandler,
  pressureHandler,
  temperatureHandler,
} from "@/utils/units/units";

type SettingsCategory = "general" | "units";

interface StoredSettings {
  alertsMuted?: boolean;
  altitudeUnits?: AltitudeUnits;
  darkMode?: boolean;
  forceUnits?: ForceUnits;
  pressureUnits?: PressureUnits;
  temperatureUnits?: TemperatureUnits;
}

const SETTINGS_STORAGE_KEY = "sdr-dashboard-settings-v1";

const categories: { id: SettingsCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "units", label: "Units" },
];

interface UnitSelectProps {
  label: string;
  onChange: (value: number) => void;
  options: { label: string; value: number }[];
  value: number;
}

function UnitSelect({ label, onChange, options, value }: UnitSelectProps) {
  return (
    <label className="grid grid-cols-[1fr_10rem] items-center gap-4 border-b border-base-300 py-3 text-sm font-semibold last:border-b-0">
      {label}
      <select
        className="h-9 border border-base-400 bg-base px-2 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Settings() {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const [isAlertsMuted, setIsAlertsMuted] = useState(areAlertAuralsMuted);
  const [unitSettingsVersion, setUnitSettingsVersion] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const hasSavedThemePreferenceRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle("dark", isDark);
    };
    const savedSettings = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}") as StoredSettings;
    const initialDarkMode = savedSettings.darkMode ?? mediaQuery.matches;

    hasSavedThemePreferenceRef.current = savedSettings.darkMode !== undefined;
    setDarkMode(initialDarkMode);
    setAlertAuralsMuted(savedSettings.alertsMuted ?? false);
    setIsAlertsMuted(savedSettings.alertsMuted ?? false);
    pressureHandler.systemUnits = savedSettings.pressureUnits ?? pressureHandler.systemUnits;
    temperatureHandler.systemUnits = savedSettings.temperatureUnits ?? temperatureHandler.systemUnits;
    altitudeHandler.systemUnits = savedSettings.altitudeUnits ?? altitudeHandler.systemUnits;
    forceHandler.systemUnits = savedSettings.forceUnits ?? forceHandler.systemUnits;
    setUnitSettingsVersion((current) => current + 1);
    applyTheme(initialDarkMode);

    const handleChange = (event: MediaQueryListEvent) => {
      if (!hasSavedThemePreferenceRef.current) {
        setDarkMode(event.matches);
        applyTheme(event.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const saveSettings = (overrides: Partial<StoredSettings> = {}) => {
    const settings: StoredSettings = {
      darkMode,
      alertsMuted: isAlertsMuted,
      pressureUnits: pressureHandler.systemUnits,
      temperatureUnits: temperatureHandler.systemUnits,
      altitudeUnits: altitudeHandler.systemUnits,
      forceUnits: forceHandler.systemUnits,
      ...overrides,
    };

    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  };

  const updateDarkMode = (nextDarkMode: boolean) => {
    hasSavedThemePreferenceRef.current = true;
    document.documentElement.classList.toggle("dark", nextDarkMode);
    setDarkMode(nextDarkMode);
    saveSettings({ darkMode: nextDarkMode });
  };

  const updateUnitSetting = (update: () => void) => {
    update();
    setUnitSettingsVersion((current) => current + 1);
    saveSettings();
  };

  return (
    <>
      <button
        className="flex size-9 shrink-0 items-center justify-center border border-base-400 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        type="button"
        aria-label="Open dashboard options"
        title="Dashboard options"
        onClick={() => setIsOptionsOpen(true)}
      >
        <SettingsIcon size={18} aria-hidden="true" />
      </button>

      {isOptionsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOptionsOpen(false);
            }
          }}
        >
          <section
            className="flex h-[min(34rem,calc(100vh-3rem))] w-full max-w-3xl overflow-hidden border border-base-300 bg-base-100 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-options-title"
          >
            <nav className="flex w-40 shrink-0 flex-col border-r border-base-300 bg-base-200 p-3" aria-label="Settings categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-2 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-current ${
                    activeCategory === category.id ? "bg-base-400 text-base-100" : "hover:bg-base-300"
                  }`}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </nav>
            <div className="flex min-w-0 flex-1 flex-col p-6">
              <div className="flex items-center justify-between pb-6">
                <h3 className="text-xl font-bold">{activeCategory === "general" ? "General" : "Units"}</h3>
                <button
                  className="flex size-9 items-center justify-center border border-base-400 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                  type="button"
                  aria-label="Close dashboard options"
                  title="Close"
                  onClick={() => setIsOptionsOpen(false)}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {activeCategory === "general" ? (
                <div>
                  <div className="flex items-center justify-between border-b border-base-300 py-3">
                    <span className="text-sm font-semibold">Dark Mode</span>
                    <ThemeToggle darkMode={darkMode} onDarkModeChange={updateDarkMode} />
                  </div>
                  <label className="flex items-center justify-between py-3 text-sm font-semibold">
                    Mute all alerts
                    <Toggle
                      checked={isAlertsMuted}
                      label="Mute all alerts"
                      onChange={(muted) => {
                        setAlertAuralsMuted(muted);
                        setIsAlertsMuted(muted);
                        saveSettings({ alertsMuted: muted });
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div key={unitSettingsVersion}>
                  <UnitSelect
                    label="Pressure units"
                    value={pressureHandler.systemUnits}
                    options={[{ label: "psi", value: PressureUnits.POUNDS_PER_SQUARE_INCH }, { label: "Pa", value: PressureUnits.PASCALS }]}
                    onChange={(value) => updateUnitSetting(() => { pressureHandler.systemUnits = value as PressureUnits; })}
                  />
                  <UnitSelect
                    label="Temperature units"
                    value={temperatureHandler.systemUnits}
                    options={[{ label: "Celsius", value: TemperatureUnits.CELSIUS }, { label: "Fahrenheit", value: TemperatureUnits.FAHRENHEIT }]}
                    onChange={(value) => updateUnitSetting(() => { temperatureHandler.systemUnits = value as TemperatureUnits; })}
                  />
                  <UnitSelect
                    label="Altitude units"
                    value={altitudeHandler.systemUnits}
                    options={[{ label: "Feet", value: AltitudeUnits.FEET }, { label: "Meters", value: AltitudeUnits.METERS }]}
                    onChange={(value) => updateUnitSetting(() => { altitudeHandler.systemUnits = value as AltitudeUnits; })}
                  />
                  <UnitSelect
                    label="Force units"
                    value={forceHandler.systemUnits}
                    options={[{ label: "Newtons", value: ForceUnits.NEWTONS }, { label: "Pounds-force", value: ForceUnits.POUNDS_FORCE }]}
                    onChange={(value) => updateUnitSetting(() => { forceHandler.systemUnits = value as ForceUnits; })}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}