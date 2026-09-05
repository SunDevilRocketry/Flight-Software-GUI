import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CasPane } from "@/components/liquids/CasPane";
import { DaqBackendStatus } from "@/components/liquids/DaqBackendStatus";
import { useDaqBackend } from "@/hooks/liquids/useDaqBackend";
import { ValveId } from "@/hooks/liquids/useMockEngine";
import { alertQueue, clearAlerts } from "@/utils/liquids/alert";
import type { DaqStatus } from "@/utils/liquids/daqApi";

const { getStatus, postActuator, abort } = vi.hoisted(() => ({
  getStatus: vi.fn(),
  postActuator: vi.fn(),
  abort: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/utils/liquids/daqApi", () => ({
  daqApi: {
    abort,
    getStatus,
    postActuator,
  },
}));

vi.mock("@/hooks/SSE/sseLiquids", () => ({
  createInitialDaqState: () => ({
    timestamp: 0,
    streaming: false,
    isStale: false,
    sequence: { active: false, name: null, elapsed_s: null },
    sensors: {},
    valves: {},
    derived: {},
  }),
  subscribeToLiquidsSse: vi.fn(() => vi.fn()),
}));

const healthyStatus: DaqStatus = {
  data_age_s: 0.1,
  ok: true,
  sequence_active: false,
  sequence_name: null,
  server_time: 0,
  stale: false,
  stream_hz: 20,
  using_mock: false,
};

const staleStatus: DaqStatus = {
  ...healthyStatus,
  data_age_s: 5.2,
  stale: true,
};

beforeEach(() => {
  clearAlerts();
  getStatus.mockReset();
  postActuator.mockReset();
  abort.mockClear();
});

describe("Liquids Dashboard hazard mitigation", () => {
  it("FC.NLFS.LD.2, FC.NLFS.LQDDAQ.2: indicates when telemetry exceeds its allowed age", async () => {
    getStatus.mockResolvedValue({ data: staleStatus });
    render(<CasPane />);
    const { result } = renderHook(() => useDaqBackend());

    act(() => result.current.connect("http://daq.local"));

    await waitFor(() => expect(screen.getByText("DAQ telemetry stale")).toBeVisible());
    expect(screen.getByText("Latest telemetry is 5.2 s old.")).toBeVisible();
    expect(alertQueue.isEmpty()).toBe(true);
  });

  it("FC.NLFS.LD.2, FC.NLFS.LQDDAQ.1: shows an abort recommendation after an HTTP 500 data failure", async () => {
    getStatus.mockRejectedValue({ response: { status: 500 } });
    render(<CasPane />);
    const { result } = renderHook(() => useDaqBackend());

    act(() => result.current.connect("http://daq.local"));

    await waitFor(() => expect(screen.getByText("DAQ backend unavailable")).toBeVisible());
    expect(screen.getByText(/ABORT/i)).toBeVisible();
  });

  it("FC.NLFS.LD.2, FC.NLFS.LQDDAQ.2: displays the API as disconnected after connection loss", () => {
    render(
      <DaqBackendStatus
        baseUrl="http://daq.local"
        connectionFailed
        isConnected={false}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
        status={null}
      />,
    );

    expect(screen.getByText("Disconnected")).toBeVisible();
  });

  it("FC.NLFS.LD.3: recommends a manual abort when a LabJack control command fails", async () => {
    getStatus.mockResolvedValue({ data: healthyStatus });
    postActuator.mockRejectedValue({ response: { status: 500 } });
    render(<CasPane />);
    const { result } = renderHook(() => useDaqBackend());

    act(() => result.current.connect("http://daq.local"));
    await act(async () => {
      await result.current.actuateValve(ValveId.LoxMain, true);
    });

    await waitFor(() => expect(screen.getByText("Actuator command failed")).toBeVisible());
    expect(screen.getByText(/ABORT/i)).toBeVisible();
  });
});
