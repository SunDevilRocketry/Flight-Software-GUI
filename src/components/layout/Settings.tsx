import React, { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";

export interface SettingsType {
  darkMode: boolean;
  autoConnect: boolean;
  defaultComPort: string | null;
  altMode: "QNH" | "QFE";
  referenceElevation: number | null;
  demoMode: boolean;
  mockFile: string | null;
}

interface SettingsProps {
  toggle: boolean;
  setToggle: React.Dispatch<React.SetStateAction<boolean>>;
  onChange?: (s: SettingsType) => void;
}

const defaultSettings: SettingsType = {
  darkMode: true,
  autoConnect: false,
  defaultComPort: null,
  altMode: "QNH",
  referenceElevation: null,
  demoMode: false,
  mockFile: null,
};

export const Settings: React.FC<SettingsProps> = ({ toggle, setToggle, onChange }) => {
  const [loadingPorts, setLoadingPorts] = useState<boolean>(false);
  const [ports, setPorts] = useState<string[]>([]);
  const [activePort, setActivePort] = useState<string | null>(null);
  const [mockFiles, setMockFiles] = useState<string[]>([]);
  const [loadingMockFiles, setLoadingMockFiles] = useState<boolean>(false);

  const [settings, setSettings] = useState<SettingsType>(() => {
    try {
      const raw = localStorage.getItem("fs:settings");
      return raw ? (JSON.parse(raw) as SettingsType) : defaultSettings;
    } catch (e) {
      console.error("Error parsing settings from localStorage", e);
      return defaultSettings;
    }
  });

  const generalRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const mockRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<string>("general");

  const sidebarButtonClass = (isSelected: boolean) =>
    [
      "w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
      isSelected
        ? "bg-base-300 text-base-content shadow-inner"
        : "text-base-content/80 hover:bg-base-300/30",
    ].join(" ");

  const fieldClass =
    "w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm text-base-content outline-none ring-0 placeholder:text-base-content/40";
  const cardClass = "rounded-xl border border-base-300 bg-base-200/40 p-3";

  useEffect(() => {
    if (!toggle) return;

    setLoadingPorts(true);
    api
      .getComPorts()
      .then((res) => {
        const portsMap = (res.data as Record<string, string>) || {};
        setPorts(Object.keys(portsMap));
      })
      .catch((err) => console.error("Failed to fetch COM ports", err))
      .finally(() => setLoadingPorts(false));

    api
      .getActiveComPort()
      .then((res) => {
        if (res.status === 204 || !res.data) setActivePort(null);
        else setActivePort(res.data as string);
      })
      .catch(() => setActivePort(null));

    setLoadingMockFiles(true);
    fetch("/mock-files.json")
      .then((res) => res.json())
      .then((list) => {
        if (Array.isArray(list)) setMockFiles(list as string[]);
      })
      .catch(() => setMockFiles([]))
      .finally(() => setLoadingMockFiles(false));
  }, [toggle]);

  const persist = (s: SettingsType) => {
    try {
      localStorage.setItem("fs:settings", JSON.stringify(s));
      onChange?.(s);
    } catch (e) {
      console.error("Failed to persist settings", e);
    }
  };

  const update = (patch: Partial<SettingsType>) => {
    const next = { ...settings, ...patch } as SettingsType;
    setSettings(next);
    persist(next);
  };

  const restoreDefaults = (): void => {
    setSettings(defaultSettings);
    persist(defaultSettings);
  };


  const sections = [
    { id: "general", label: "General", ref: generalRef },
    { id: "board", label: "Board", ref: boardRef },
    { id: "mock", label: "Mock", ref: mockRef },
  ];

  const scrollTo = (id: string) => {
    const s = sections.find((x) => x.id === id);
    if (s?.ref?.current) {
      s.ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setSelected(id);
    }
  };

  if (!toggle) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black/50">
      <div className="absolute left-1/2 top-1/2 h-[78vh] w-[min(65vw,62rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/95 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="text-xl font-bold text-base-content">Settings</h2>
          <button
            type="button"
            aria-label="Close settings"
            title="Close"
            onClick={() => setToggle(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-red)] text-white shadow-sm transition hover:brightness-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 1 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(100%-73px)]">
          <div className="w-[13rem] border-r border-base-300 bg-base-200/40 p-3">
            <nav className="flex flex-col gap-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={sidebarButtonClass(selected === s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
            <div ref={generalRef} id="general" className="mb-8 scroll-mt-6">
              <h3 className="mb-3 text-lg font-bold">General</h3>

              <label className="mb-3 flex items-center justify-between gap-4 text-sm">
                <span>Dark mode</span>
                <input
                  type="checkbox"
                  checked={!!settings.darkMode}
                  onChange={(e) => update({ darkMode: e.target.checked })}
                />
              </label>

              <div className={cardClass}>
                <div className="mb-2 text-sm font-medium">Altitude reference</div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="altRef"
                      value="QNH"
                      checked={settings.altMode === "QNH"}
                      onChange={() => update({ altMode: "QNH" })}
                    />
                    <span>QNH (sea-level)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="altRef"
                      value="QFE"
                      checked={settings.altMode === "QFE"}
                      onChange={() => update({ altMode: "QFE" })}
                    />
                    <span>QFE (airfield)</span>
                  </label>
                </div>

                {settings.altMode === "QFE" && (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm">Reference elevation (meters)</label>
                    <input
                      type="number"
                      value={settings.referenceElevation ?? ""}
                      onChange={(e) => update({ referenceElevation: e.target.value ? Number(e.target.value) : null })}
                      className={fieldClass}
                      placeholder="e.g. 12.5"
                    />
                    <p className="mt-1 text-xs text-base-content/70">Enter the airfield elevation in meters for QFE calculations.</p>
                  </div>
                )}
              </div>
            </div>

            <div ref={boardRef} id="board" className="mb-8 scroll-mt-6">
              <h3 className="mb-3 text-lg font-bold">Board</h3>

              <label className="mb-3 flex items-center justify-between gap-4 text-sm">
                <span>Auto-connect to default COM port</span>
                <input
                  type="checkbox"
                  checked={!!settings.autoConnect}
                  onChange={(e) => update({ autoConnect: e.target.checked })}
                />
              </label>

              <div className={cardClass}>
                <label className="mb-1 block text-sm font-medium">Default COM port</label>
                <select
                  className={fieldClass}
                  value={settings.defaultComPort ?? ""}
                  onChange={(e) => update({ defaultComPort: e.target.value || null })}
                >
                  <option value="">-- none --</option>
                  {loadingPorts ? (
                    <option>Loading...</option>
                  ) : (
                    ports.map((p) => (
                      <option key={p} value={p}>
                        {p}{activePort && p === activePort ? " (active)" : ""}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-2 text-xs text-base-content/70">Set a default COM port for the dashboard to auto-connect to when the app starts.</p>
              </div>
            </div>

            <div ref={mockRef} id="mock" className="mb-8 scroll-mt-6">
              <h3 className="mb-3 text-lg font-bold">Mock / Demo</h3>

              <label className="mb-3 flex items-center justify-between gap-4 text-sm">
                <span>Demo mode</span>
                <input
                  type="checkbox"
                  checked={!!settings.demoMode}
                  onChange={(e) => update({ demoMode: e.target.checked })}
                />
              </label>

              <div className={cardClass}>
                <label className="mb-1 block text-sm font-medium">Mock CSV source</label>
                <select
                  className={fieldClass}
                  value={settings.mockFile ?? ""}
                  onChange={(e) => update({ mockFile: e.target.value || null })}
                >
                  <option value="">-- none --</option>
                  {loadingMockFiles ? (
                    <option>Loading...</option>
                  ) : (
                    mockFiles.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-2 text-xs text-base-content/70">Choose a CSV file from /public as the mock data source, or enable demo mode for randomized telemetry.</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={restoreDefaults}
                className="rounded-md border border-base-300 bg-base-200 px-3 py-2 text-sm font-medium text-base-content transition hover:bg-base-300"
              >
                Restore defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
