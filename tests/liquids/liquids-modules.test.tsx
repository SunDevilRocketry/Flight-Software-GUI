import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DaqBackendStatus } from "@/components/liquids/DaqBackendStatus";
import { Gauges } from "@/components/liquids/Gauges";
import { ValveControl } from "@/components/liquids/pid/grid-items/ValveControl";
import { RollingChart } from "@/components/widgets/RollingChart";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";

const status = {
  ok: true,
  sequence_active: false,
  sequence_name: null,
  server_time: 0,
  stale: false,
  stream_hz: 20,
  using_mock: false,
  data_age_s: 0.1,
};

describe("Liquids Dashboard modules", () => {
  it("RQ.NLFS.00012, RQ.NLFS.00040, RQ.NLFS.00013: manages and reports the LQD-DAQ connection", () => {
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();
    render(
      <DaqBackendStatus
        baseUrl="http://daq.local"
        connectionFailed={false}
        isConnected={false}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        status={null}
      />,
    );

    expect(screen.getByRole("region", { name: "DAQ API connection" })).toBeVisible();
    expect(screen.getByText("Disconnected")).toBeVisible();
    fireEvent.change(screen.getByLabelText("DAQ URL"), { target: { value: " http://daq.example/ " } });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(onConnect).toHaveBeenCalledWith("http://daq.example/");

    render(
      <DaqBackendStatus
        baseUrl="http://daq.example"
        connectionFailed={false}
        isConnected
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        status={status}
      />,
    );
    expect(screen.getByText("Connected")).toBeVisible();
    expect(screen.getByText("20.0 Hz")).toBeVisible();
    expect(screen.getByText("Live")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("RQ.NLFS.00004, RQ.NLFS.00005, RQ.NLFS.00006: exposes valve output state and status-colored readings", () => {
    const onToggle = vi.fn();
    render(<ValveControl label="LOx Main" open={false} onToggle={onToggle} />);
    const valve = screen.getByRole("button", { name: /LOx Main/i });
    expect(valve).toHaveAttribute("aria-pressed", "false");
    expect(valve).toHaveAttribute("title", "LOx Main: closed");
    fireEvent.click(valve);
    expect(onToggle).toHaveBeenCalledOnce();

    render(
      <Gauges
        chamberPressurePa={1000}
        chamberPressureStatus={ReadingStatus.WARNING}
        fuelPressurePa={2000}
        fuelPressureStatus={ReadingStatus.NOMINAL}
        inletTemperatureC={-20}
        inletTemperatureStatus={ReadingStatus.CAUTION}
        loxPressurePa={3000}
        loxPressureStatus={ReadingStatus.NOMINAL}
      />,
    );
    expect(screen.getByLabelText("Chamber P gauge")).toHaveTextContent("WARNING");
    expect(screen.getByLabelText("LOx P gauge")).toHaveTextContent("LOx P");
    expect(screen.getByLabelText("Fuel P gauge")).toHaveTextContent("Fuel P");
    expect(screen.getByLabelText("Inlet T gauge")).toHaveTextContent("CAUTION");
  });

  it("RQ.NLFS.00014, RQ.NLFS.00042, RQ.NLFS.00043, RQ.NLFS.00044: renders the three required rolling charts", () => {
    render(
      <>
        <RollingChart value={1} active title="Chamber Pressure" ariaLabel="Rolling chamber pressure chart" formatValue={String} />
        <RollingChart value={2} active title="Thrust" ariaLabel="Rolling thrust chart" formatValue={String} />
        <RollingChart value={3} active title="LOx Tank Pressure" ariaLabel="Rolling LOx tank pressure chart" formatValue={String} />
      </>,
    );

    expect(screen.getByRole("region", { name: "Rolling chamber pressure chart" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Rolling thrust chart" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Rolling LOx tank pressure chart" })).toBeVisible();
  });

  it("RQ.NLFS.00010 and RQ.NLFS.00011: gives immediate moving feedback and disables a moving valve", () => {
    const onToggle = vi.fn();
    render(<ValveControl label="LOx Purge" moving open onToggle={onToggle} />);
    const valve = screen.getByRole("button", { name: /LOx Purge/i });
    expect(valve).toBeDisabled();
    expect(valve).toHaveAttribute("title", "LOx Purge: moving");
    expect(valve).toHaveAttribute("aria-pressed", "true");
  });
});
