import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LiquidsDashboard } from "@/components/liquids/LiquidsDashboard";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { ValveId } from "@/hooks/liquids/useMockEngine";

const abort = vi.fn(() => Promise.resolve());
const toggleValve = vi.fn();
const setEngineState = vi.fn();
const resetEngineState = vi.fn();

const reading = { value: 1, status: ReadingStatus.NOMINAL };
const sensors = {
  gn2PressurePa: reading,
  gn2TemperatureC: reading,
  loxTankPressurePa: reading,
  loxTankLevel: reading,
  loxTankTemperatureC: reading,
  loxOrificePressureAPa: reading,
  loxOrificePressureBPa: reading,
  keroseneTankPressurePa: reading,
  keroseneTankLevel: reading,
  keroseneTankTemperatureC: reading,
  keroseneOrificePressureAPa: reading,
  keroseneOrificePressureBPa: reading,
  chamberPressurePa: reading,
  chamberTemperatureC: reading,
  inletTemperatureC: reading,
  thrustNewtons: reading,
};
const safeValves = {
  [ValveId.LoxPressurization]: true,
  [ValveId.LoxVent]: false,
  [ValveId.KerosenePressurization]: true,
  [ValveId.KeroseneVent]: false,
  [ValveId.LoxPurge]: true,
  [ValveId.KerosenePurge]: true,
  [ValveId.KeroseneMain]: false,
  [ValveId.LoxMain]: false,
};
let dashboardValves = safeValves;

vi.mock("@/hooks/liquids/useDaqBackend", () => ({
  useDaqBackend: () => ({
    abort,
    actuateValve: vi.fn(() => Promise.resolve(true)),
    baseUrl: "http://daq.local",
    connect: vi.fn(),
    connectionFailed: false,
    dataSourceVersion: 0,
    daqState: { valves: {} },
    daqStateReady: false,
    disconnect: vi.fn(),
    isConnected: false,
    isValveMoving: vi.fn(() => false),
    status: null,
  }),
}));

vi.mock("@/hooks/liquids/useEngineState", () => ({
  useEngineState: () => ({
    state: { sensors, actuators: { valves: dashboardValves } },
    setState: setEngineState,
    toggleValve,
    reset: resetEngineState,
  }),
}));

vi.mock("@/components/liquids/sequence/Sequence", () => ({
  Sequence: ({ abortControl }: { abortControl: React.ReactNode }) => <section aria-label="Sequence controller">{abortControl}</section>,
}));
vi.mock("@/components/liquids/CasPane", () => ({ CasPane: () => <section aria-label="Caution and warning system" /> }));
vi.mock("@/components/liquids/Gauges", () => ({ Gauges: () => <section aria-label="Display configuration" /> }));
vi.mock("@/components/widgets/RollingChart", () => ({ RollingChart: ({ ariaLabel }: { ariaLabel: string }) => <section aria-label={ariaLabel} /> }));
vi.mock("@/components/liquids/DaqBackendStatus", () => ({ DaqBackendStatus: () => <section aria-label="DAQ API connection" /> }));

describe("LiquidsDashboard composition", () => {
  beforeEach(() => {
    dashboardValves = safeValves;
    abort.mockClear();
    setEngineState.mockClear();
    resetEngineState.mockClear();
    toggleValve.mockClear();
  });

  it("RQ.NLFS.00004 and RQ.NLFS.00007: renders all P&ID controls and sends abort", () => {
    render(<LiquidsDashboard />);

    expect(screen.getAllByRole("button")).toHaveLength(9);
    expect(screen.getByRole("button", { name: /LOx Press/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /K Press/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /LOx Vent/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /K Vent/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /LOx Main/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /LOx Purge/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /K Purge/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /K Main/i })).toBeVisible();

    const abortButton = screen.getByRole("button", { name: "ABORT" });
    expect(abortButton).toHaveClass("bg-base-200");
    fireEvent.click(abortButton);
    expect(abort).toHaveBeenCalledOnce();
    expect(resetEngineState).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /System Aborted/i })).toBeVisible();
  });

  it("RQ.NLFS.00009: highlights abort when the valve state is not safe", () => {
    dashboardValves = { ...safeValves, [ValveId.LoxMain]: true };
    render(<LiquidsDashboard />);
    expect(screen.getByRole("button", { name: "ABORT" })).toHaveClass("bg-yellow-400");
  });
});
