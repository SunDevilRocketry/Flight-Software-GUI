import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiquidsDashboard } from "@/components/liquids/LiquidsDashboard";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { ValveId } from "@/hooks/liquids/useMockEngine";
import { alertQueue } from "@/utils/liquids/alert";

const abort = vi.fn(() => Promise.resolve());
const toggleValve = vi.fn();
const setEngineState = vi.fn();
const resetEngineState = vi.fn();
const daqConnection = {
  isConnected: false,
  isReady: false,
  isMoving: false,
  isStale: false,
  position: null as string | null,
  fireState: null as string | null,
  unwired: [] as ValveId[],
  dataSourceVersion: 0,
  sequenceActive: null as boolean | null,
  statusOk: true,
};
const sequenceStart = vi.fn((onMismatch?: string): Promise<unknown> => Promise.resolve({ onMismatch }));
const sequenceStop = vi.fn(() => Promise.resolve({ sequence_time_ms: 0 }));
const ignitionSequence = { steps: [{ name: "ignition_on", start_s: 3.9, actions: [[3.9, "ignition_arm", 1], [4.0, "ignition_fire", 1], [4.5, "ignition_fire", 0]] }] };
const { postActuator } = vi.hoisted(() => ({ postActuator: vi.fn(() => Promise.resolve({})) }));

vi.mock("@/utils/liquids/daqApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/utils/liquids/daqApi")>();
  return { ...original, daqApi: { ...original.daqApi, postActuator } };
});

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
  [ValveId.LoxPressurization]: false,
  [ValveId.TankVent]: false,
  [ValveId.KerosenePressurization]: false,
  [ValveId.KeroseneVent]: false,
  [ValveId.LoxPurge]: false,
  [ValveId.KerosenePurge]: false,
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
    daqState: { receivedAtMs: 0, streaming: true, isStale: daqConnection.isStale, valves: {}, sensors: {}, derived: {}, sequence: { active: false, elapsed_s: null, state: daqConnection.fireState } },
    daqStateReady: daqConnection.isReady,
    disconnect: vi.fn(),
    fire: vi.fn(() => Promise.resolve({})),
    isConnected: daqConnection.isConnected,
    isValveUnwired: vi.fn((id: ValveId) => daqConnection.unwired.includes(id)),
    logger: null,
    isValveMoving: vi.fn(() => daqConnection.isMoving),
    valvePosition: vi.fn(() => daqConnection.position),
    sequenceDefinition: ignitionSequence,
    sequenceStart,
    sequenceStop,
    status: daqConnection.isConnected
      ? { ok: daqConnection.statusOk, stale: false, sequence_active: daqConnection.sequenceActive ?? false }
      : null,
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
    daqFireState,
    onDaqSequenceToggle,
  }: {
    abortControl: React.ReactNode;
    onMockDataSourceChange: (enabled: boolean) => void;
    daqFireState: string | null;
    onDaqSequenceToggle: () => Promise<void>;
  }) => (
    <section aria-label="Sequence controller">
      <button type="button" onClick={() => onMockDataSourceChange(true)}>Enable mock source</button>
      {daqFireState && (
        <button
          type="button"
          aria-label={daqFireState === "running" ? "Pause fire" : "Resume fire"}
          onClick={() => void onDaqSequenceToggle()}
        />
      )}
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
    daqConnection.isStale = false;
    daqConnection.position = null;
    daqConnection.fireState = null;
    daqConnection.unwired = [];
    sequenceStart.mockReset();
    sequenceStart.mockImplementation((onMismatch?: string) => Promise.resolve({ onMismatch }));
    daqConnection.dataSourceVersion = 0;
    daqConnection.sequenceActive = null;
    daqConnection.statusOk = true;
    sequenceStart.mockClear();
    sequenceStop.mockClear();
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

  it("pauses or resumes the fire according to its state", async () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    daqConnection.sequenceActive = false;
    daqConnection.fireState = "paused";
    const { rerender } = render(<LiquidsDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Resume fire" }));
    await act(async () => Promise.resolve());
    expect(sequenceStart).toHaveBeenCalledOnce();
    expect(sequenceStop).not.toHaveBeenCalled();

    daqConnection.fireState = "running";
    rerender(<LiquidsDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Pause fire" }));
    await act(async () => Promise.resolve());
    expect(sequenceStop).toHaveBeenCalledOnce();
  });

  it("warns when the fire pauses inside the ignition window", async () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    daqConnection.sequenceActive = true;
    daqConnection.fireState = "running";
    sequenceStop.mockResolvedValueOnce({ sequence_time_ms: 4200 });
    render(<LiquidsDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Pause fire" }));
    await act(async () => Promise.resolve());
    expect(alertQueue.toArray().map((alert) => alert.topLine)).toContain("Paused during ignition");
  });

  it("restores valves while paused and resumes only on request", async () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    daqConnection.sequenceActive = false;
    daqConnection.fireState = "paused";
    sequenceStart.mockImplementationOnce(() => Promise.reject({
      response: { status: 409, data: { detail: "mismatch", differences: [
        { actuator: "lox_purge", expected: 0, actual: 1 },
        { actuator: "ignition_arm", expected: 1, actual: 0 },
      ] } },
    }));
    render(<LiquidsDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Resume fire" }));
    await act(async () => Promise.resolve());
    expect(screen.getByRole("alertdialog", { name: "Resume mismatch" })).toHaveTextContent("lox_purge: sequence off, now on");

    // Restore writes the valve, stays paused and leaves the igniter row for resume.
    fireEvent.click(screen.getByRole("button", { name: "Restore sequence state" }));
    await act(async () => Promise.resolve());
    expect(postActuator).toHaveBeenCalledExactlyOnceWith("http://daq.local", { name: "lox_purge", state: 0 });
    expect(sequenceStart).toHaveBeenCalledOnce();
    expect(screen.getByRole("alertdialog", { name: "Resume mismatch" })).not.toHaveTextContent("lox_purge");
    expect(screen.getByRole("button", { name: "Restore and resume" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Resume with manual state" }));
    await act(async () => Promise.resolve());
    expect(sequenceStart).toHaveBeenLastCalledWith("keep");
    expect(screen.queryByRole("alertdialog", { name: "Resume mismatch" })).toBeNull();
  });

  it("blocks valve commands while /status reports the DAQ unhealthy", () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    daqConnection.statusOk = false;
    render(<LiquidsDashboard />);
    expect(screen.getByRole("button", { name: /LOx Press/i })).toBeDisabled();
  });

  it("disables actuators LQD-DAQ reports as unwired", () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    daqConnection.unwired = [ValveId.LoxMain];
    render(<LiquidsDashboard />);
    expect(screen.getByRole("button", { name: /LOx Main/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Fuel Main/i })).toBeEnabled();
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

  it("shows a live main valve's motion and position from the DAQ", () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    const { rerender } = render(<LiquidsDashboard />);
    const valve = screen.getByRole("button", { name: /LOx Main/i });

    daqConnection.isMoving = true;
    daqConnection.position = "opening";
    rerender(<LiquidsDashboard />);
    expect(valve.querySelector(".valve-opening-fill")).not.toBeNull();
    expect(valve).toBeDisabled();

    daqConnection.isMoving = false;
    daqConnection.position = "open";
    rerender(<LiquidsDashboard />);
    expect(valve.querySelector(".valve-opening-fill")).toBeNull();
    expect(valve).toHaveClass("border-emerald-300");
  });

  it("blocks valve commands while DAQ data is stale", () => {
    daqConnection.isConnected = true;
    daqConnection.isReady = true;
    daqConnection.isStale = true;
    render(<LiquidsDashboard />);
    expect(screen.getByRole("button", { name: /LOx Purge/i })).toBeDisabled();
  });

  it("skips the DAQ abort only in mock-only mode", () => {
    render(<LiquidsDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Enable mock source" }));
    fireEvent.click(screen.getByRole("button", { name: "ABORT" }));
    expect(abort).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /System Aborted/i })).toBeVisible();
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
