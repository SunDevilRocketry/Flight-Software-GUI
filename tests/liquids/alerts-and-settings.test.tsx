import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { CasPane } from "@/components/liquids/CasPane";
import { Settings } from "@/components/liquids/Settings";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import {
  Alert,
  AlertPriority,
  alertQueue,
  alertState,
  areAlertAuralsMuted,
  clearAlerts,
} from "@/utils/liquids/alert";
import { MassFlowUnits, PressureUnits, massFlowHandler, pressureHandler } from "@/utils/units/units";

beforeEach(() => {
  clearAlerts();
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("CAS and dashboard settings", () => {
  it("RQ.NLFS.00019 and RQ.NLFS.00020: tracks severity and presents off-nominal alerts", async () => {
    render(<CasPane />);
    new Alert("Off-nominal reading", "LOx pressure is outside its normal range.", AlertPriority.WARNING);

    await waitFor(() => expect(screen.getByText("Off-nominal reading")).toBeVisible());
    expect(screen.getByText("1 System Message(s)")).toBeVisible();
    expect(alertState.hasWarning()).toBe(true);
    expect(alertQueue.isEmpty()).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss Off-nominal reading" }));
    expect(screen.getByText("No Active Alerts")).toBeVisible();
    expect(alertState.hasWarning()).toBe(false);
  });

  it("RQ.NLFS.00035, RQ.NLFS.00036, RQ.NLFS.00037, RQ.NLFS.00038: exposes configurable units, theme, and alert audio", async () => {
    const onMockDataSourceChange = vi.fn();
    const onMockSensorStatusChange = vi.fn();
    render(<Settings onMockDataSourceChange={onMockDataSourceChange} onMockSensorStatusChange={onMockSensorStatusChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Open dashboard options" }));
    expect(screen.getByRole("dialog")).toBeVisible();

    fireEvent.click(screen.getByRole("switch", { name: "Toggle dark mode" }));
    fireEvent.click(screen.getByRole("switch", { name: "Mute all alerts" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(areAlertAuralsMuted()).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Units" }));
    fireEvent.change(screen.getByLabelText("Pressure units"), { target: { value: String(PressureUnits.PASCALS) } });
    expect(pressureHandler.systemUnits).toBe(PressureUnits.PASCALS);
    fireEvent.change(screen.getByLabelText("Mass flow units"), { target: { value: String(MassFlowUnits.KILOGRAMS_PER_HOUR) } });
    expect(massFlowHandler.systemUnits).toBe(MassFlowUnits.KILOGRAMS_PER_HOUR);
    expect(JSON.parse(window.localStorage.getItem("sdr-dashboard-settings-v1") ?? "{}")).toMatchObject({
      darkMode: true,
      alertsMuted: true,
      pressureUnits: PressureUnits.PASCALS,
      massFlowUnits: MassFlowUnits.KILOGRAMS_PER_HOUR,
    });
  });

  it("RQ.NLFS.00039: restores saved user settings between mounts", async () => {
    window.localStorage.setItem("sdr-dashboard-settings-v1", JSON.stringify({
      darkMode: true,
      alertsMuted: true,
      pressureUnits: PressureUnits.PASCALS,
      mockSensorStatus: ReadingStatus.WARNING,
      mockDataEnabled: true,
    }));
    const onMockDataSourceChange = vi.fn();
    const onMockSensorStatusChange = vi.fn();

    render(<Settings onMockDataSourceChange={onMockDataSourceChange} onMockSensorStatusChange={onMockSensorStatusChange} />);

    await waitFor(() => {
      expect(onMockDataSourceChange).toHaveBeenCalledWith(true);
      expect(onMockSensorStatusChange).toHaveBeenCalledWith(ReadingStatus.WARNING);
    });
    expect(document.documentElement).toHaveClass("dark");
    expect(areAlertAuralsMuted()).toBe(true);
  });
});
