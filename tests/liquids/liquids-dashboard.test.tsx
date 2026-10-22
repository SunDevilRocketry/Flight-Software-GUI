import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiquidsDashboard } from "@/components/liquids/LiquidsDashboard";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { ValveId } from "@/hooks/liquids/useMockEngine";

const abort = vi.fn(() => Promise.resolve());
const toggleValve = vi.fn();
const setEngineState = vi.fn();
const resetEngineState = vi.fn();
const daqConnection = { isConnected: false, isReady: false, isMoving: false, dataSourceVersion: 0 };

const reading = { value: 1, status: ReadingStatus.NOMINAL };
const sensors = {
  gn2PressurePa: reading,
  gn2TemperatureC: reading,
  loxTankPressurePa: reading,
  loxTankLevel: reading,
  loxTankTemperatureC: reading,
  loxOrificeDifferentialPressurePa: reading,
  keroseneTankPressurePa: reading,
  keroseneTankLevel: reading,
  keroseneTankTemperatureC: reading,
  keroseneOrificeDifferentialPressurePa: reading,
  chamberPressurePa: reading,
  chamberTemperatureC: reading,
  inletTemperatureC: reading,
  thrustNewtons: reading,
};
const safeValves = {
  [ValveId.LoxPressurization]: true,
  [ValveId.TankVent]: false,
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
    dataSourceVersion: daqConnection.dataSourceVersion,
    daqState: { valves: {} },
    daqStateReady: daqConnection.isReady,
    disconnect: vi.fn(),
    isConnected: daqConnection.isConnected,
    isValveMoving: vi.fn(() => daqConnection.isMoving),
    status: null,
  }),
}));

vi.mock("@/hooks/liquids/useEngineState", () => ({
  useEngineState: () => ({
    state: {
      sensors,
      derived: {
        loxMassFlowRateGramsPerSecond: reading,
        fuelMassFlowRateGramsPerSecond: reading,
        mixtureRatio: reading,
      },
      actuators: { valves: dashboardValves },
    },
    setState: setEngineState,
    toggleValve,
    reset: resetEngineState,
  }),
}));

vi.mock("@/components/liquids/sequence/Sequence", () => ({
  Sequence: ({
    abortControl,
    onMockDataSourceChange,
  }: {
    abortControl: React.ReactNode;
    onMockDataSourceChange: (enabled: boolean) => void;
  }) => (
    <section aria-label="Sequence controller">
      <button type="button" onClick={() => onMockDataSourceChange(true)}>Enable mock source</button>
      {abortControl}
    </section>
  ),
}));
vi.mock("@/components/liquids/CasPane", () => ({ CasPane: () => <section aria-label="Caution and warning system" /> }));
vi.mock("@/components/liquids/Gauges", () => ({ Gauges: () => <section aria-label="Display configuration" /> }));
vi.mock("@/components/widgets/RollingChart", () => ({ RollingChart: ({ ariaLabel }: { ariaLabel: string }) => <section aria-label={ariaLabel} /> }));
vi.mock("@/components/liquids/DaqBackendStatus", () => ({
  DaqBackendStatus: ({ onConnect, onDisconnect }: { onConnect: (url: string) => void; onDisconnect: () => void }) => (
    <section aria-label="DAQ API connection">
      <button type="button" onClick={() => onConnect("http://daq.local")}>Connect test DAQ</button>
      <button type="button" onClick={onDisconnect}>Disconnect test DAQ</button>
    </section>
  ),
}));

describe("LiquidsDashboard composition", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useRealTimers();
    daqConnection.isConnected = false;
    daqConnection.isReady = false;
    daqConnection.isMoving = false;
    daqConnection.dataSourceVersion = 0;
    dashboardValves = safeValves;
    abort.mockClear();
    setEngineState.mockClear();
    resetEngineState.mockClear();
    toggleValve.mockClear();
  });

  it("RQ.NLFS.00004 and RQ.NLFS.00007: renders all P&ID controls and sends abort", () => {
    render(<LiquidsDashboard />);

    expect(screen.getAllByRole("button")).toHaveLength(12);
    expect(screen.getByRole("button", { name: /LOx Press/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Fuel Press/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Tank Vent/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Fuel Vent/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /LOx Main/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /LOx Purge/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Fuel Purge/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Fuel Main/i })).toBeVisible();
    expect(screen.getByRole("region", { name: "Fuel sensor readings" })).toBeVisible();
    expect(screen.getByRole("region", { name: /Fuel\s+Orifice sensor readings/i })).toBeVisible();
    expect(screen.getByText("Fuel Fill")).toBeVisible();
    expect(screen.getByText("Fuel Drain")).toBeVisible();

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

  it("simulates LOx Main movement for 1.5 seconds without a live DAQ source", () => {
    vi.useFakeTimers();
    render(<LiquidsDashboard />);

    const valve = screen.getByRole("button", { name: /LOx Main/i });
    fireEvent.click(valve);

    expect(valve).toBeDisabled();
    expect(valve).toHaveClass("border-yellow-400");
    expect(valve.querySelector(".valve-opening-fill")).not.toBeNull();
    expect(toggleValve).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1_499));
    expect(toggleValve).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(toggleValve).toHaveBeenCalledWith(ValveId.LoxMain);
  });

  it("holds the target appearance until DAQ confirms the main-valve state", async () => {
    vi.useFakeTimers();
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    const { rerender } = render(<LiquidsDashboard />);

    const valve = screen.getByRole("button", { name: /LOx Main/i });
    await act(async () => {
      fireEvent.click(valve);
      await Promise.resolve();
    });
    expect(valve).toHaveClass("border-yellow-400");
    daqConnection.isMoving = true;
    act(() => vi.advanceTimersByTime(1_499));
    expect(valve.querySelector(".valve-opening-fill")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(valve.querySelector(".valve-opening-fill")).toBeNull();
    expect(valve).toHaveClass("border-yellow-400", "bg-emerald-500");
    expect(valve).toBeDisabled();

    dashboardValves = { ...safeValves, [ValveId.LoxMain]: true };
    daqConnection.isMoving = false;
    rerender(<LiquidsDashboard />);
    await act(async () => Promise.resolve());

    expect(valve.querySelector(".valve-opening-fill")).toBeNull();
    expect(valve).toHaveClass("border-emerald-300");
  });

  it("preserves a snapshot of mock valve state while connected and restores it on disconnect", () => {
    vi.useFakeTimers();
    dashboardValves = { ...safeValves, [ValveId.LoxMain]: true };
    const { rerender } = render(<LiquidsDashboard />);
    const valve = screen.getByRole("button", { name: /LOx Main/i });
    fireEvent.click(screen.getByRole("button", { name: "Enable mock source" }));

    daqConnection.isConnected = true;
    daqConnection.isReady = false;
    daqConnection.dataSourceVersion = 2;
    fireEvent.click(screen.getByRole("button", { name: "Connect test DAQ" }));
    rerender(<LiquidsDashboard />);
    act(() => vi.advanceTimersByTime(100));
    expect(setEngineState).not.toHaveBeenCalled();

    dashboardValves = { ...safeValves, [ValveId.LoxMain]: false };
    daqConnection.isReady = true;
    rerender(<LiquidsDashboard />);
    expect(valve).not.toBeDisabled();
    expect(valve).toHaveAttribute("aria-pressed", "false");
    expect(valve.querySelector(".valve-opening-fill")).toBeNull();

    daqConnection.isConnected = false;
    daqConnection.isReady = false;
    fireEvent.click(screen.getByRole("button", { name: "Disconnect test DAQ" }));

    expect(setEngineState).toHaveBeenCalledOnce();
    const mockState = setEngineState.mock.calls[0][0];
    expect(mockState).toMatchObject({
      actuators: { valves: { [ValveId.LoxMain]: true, [ValveId.KeroseneMain]: false } },
    });
  });
});
