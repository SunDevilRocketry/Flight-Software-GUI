import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createInitialDaqState } from "@/hooks/SSE/sseLiquids";
import { useEngineState } from "@/hooks/liquids/useEngineState";
import { ReadingStatus } from "@/components/liquids/pid/readingStatus";
import { mockEngineState, noDataSourceEngineState, ValveId } from "@/hooks/liquids/useMockEngine";

type EngineStateHookProps = {
  nextDaqState: ReturnType<typeof createInitialDaqState> | null;
  enabled: boolean;
  preserveStateWhenDisabled: boolean;
};

describe("engine state source transitions", () => {
  it("applies DAQ valve state on connect and holds it on disconnect when requested", () => {
    const daqState = createInitialDaqState();
    daqState.valves.lox_main = { status: "open", moving: false, position: null };
    daqState.valves.fuel_main = { status: "closed", moving: false, position: null };
    daqState.valves.tank_depress = { status: "open", moving: false, position: null };

    const { result, rerender } = renderHook<
      ReturnType<typeof useEngineState>,
      EngineStateHookProps
    >(
      ({ nextDaqState, enabled, preserveStateWhenDisabled }) => useEngineState(
        noDataSourceEngineState(),
        nextDaqState,
        enabled,
        preserveStateWhenDisabled,
      ),
      {
        initialProps: {
          nextDaqState: null,
          enabled: false,
          preserveStateWhenDisabled: false,
        },
      },
    );

    rerender({ nextDaqState: daqState, enabled: true, preserveStateWhenDisabled: false });
    expect(result.current.state.actuators.valves[ValveId.LoxMain]).toBe(true);
    expect(result.current.state.actuators.valves[ValveId.KeroseneMain]).toBe(false);
    expect(result.current.state.actuators.valves[ValveId.TankVent]).toBe(true);

    rerender({ nextDaqState: null, enabled: false, preserveStateWhenDisabled: true });
    expect(result.current.state.actuators.valves[ValveId.LoxMain]).toBe(true);
  });

  it("resets to the no-source state when preservation is disabled", () => {
    const daqState = createInitialDaqState();
    daqState.valves.lox_main = { status: "open", moving: false, position: null };

    const { result, rerender } = renderHook<
      ReturnType<typeof useEngineState>,
      EngineStateHookProps
    >(
      ({ nextDaqState, enabled, preserveStateWhenDisabled }) => useEngineState(
        noDataSourceEngineState(),
        nextDaqState,
        enabled,
        preserveStateWhenDisabled,
      ),
      {
        initialProps: {
          nextDaqState: daqState,
          enabled: true,
          preserveStateWhenDisabled: false,
        },
      },
    );
    expect(result.current.state.actuators.valves[ValveId.LoxMain]).toBe(true);

    rerender({ nextDaqState: null, enabled: false, preserveStateWhenDisabled: false });
    expect(result.current.state.actuators.valves[ValveId.LoxMain]).toBe(false);
  });

  it("uses the DAQ tc0 reading and status for inlet temperature", () => {
    const daqState = createInitialDaqState();
    daqState.sensors.tc0 = {
      readout: -179,
      type: "temperature",
      status: ReadingStatus.UNCONFIGURED,
    };
    const mockState = mockEngineState(ReadingStatus.NOMINAL, undefined, undefined, false);
    mockState.sensors.gn2TemperatureC = { value: 20, status: ReadingStatus.NOMINAL };

    const { result } = renderHook(() => useEngineState(
      mockState,
      daqState,
      true,
    ));

    expect(result.current.state.sensors.inletTemperatureC).toEqual({
      value: -179,
      status: ReadingStatus.UNCONFIGURED,
    });
    expect(result.current.state.sensors.gn2TemperatureC.status).toBe(ReadingStatus.NOMINAL);
  });

  it("propagates source status to derived flow and mixture readings", () => {
    const daqState = createInitialDaqState();
    daqState.sensors.dpt0 = { readout: 500, type: "pressure", status: ReadingStatus.UNCONFIGURED };
    daqState.sensors.dpt1 = { readout: 500, type: "pressure", status: ReadingStatus.UNCONFIGURED };
    daqState.derived = {
      lox_mass_flow_rate_kg_s: 0.04,
      fuel_mass_flow_rate_kg_s: 0.02,
      mixture_ratio: 2,
    };

    const { result } = renderHook(() => useEngineState(
      noDataSourceEngineState(),
      daqState,
      true,
    ));

    expect(result.current.state.derived.loxMassFlowRateGramsPerSecond.status).toBe(ReadingStatus.UNCONFIGURED);
    expect(result.current.state.derived.fuelMassFlowRateGramsPerSecond.status).toBe(ReadingStatus.UNCONFIGURED);
    expect(result.current.state.derived.mixtureRatio.status).toBe(ReadingStatus.UNCONFIGURED);
  });

  it("maps PTs to their cart roles, converts thrust to newtons, and ignores photogates", () => {
    const daqState = createInitialDaqState();
    const nominal = { type: "pressure", status: ReadingStatus.NOMINAL };
    daqState.sensors.pt0 = { readout: 1, ...nominal };
    daqState.sensors.pt1 = { readout: 2, ...nominal };
    daqState.sensors.pt2 = { readout: 3, ...nominal };
    daqState.sensors.pt3 = { readout: 4, ...nominal };
    daqState.sensors.lc0 = { readout: 100, type: "force", status: ReadingStatus.NOMINAL };
    daqState.sensors.lc1 = { readout: 50, type: "force", status: ReadingStatus.NOMINAL };
    daqState.sensors.pos_lox_main = { readout: 1, type: "position", status: ReadingStatus.NOMINAL };

    const { result } = renderHook(() => useEngineState(noDataSourceEngineState(), daqState, true));
    const { sensors } = result.current.state;

    expect(sensors.loxTankPressurePa.value).toBe(1);
    expect(sensors.keroseneTankPressurePa.value).toBe(2);
    expect(sensors.chamberPressurePa.value).toBe(3);
    expect(sensors.gn2PressurePa.value).toBeNaN();
    expect(sensors.thrustNewtons.value).toBeCloseTo(150 * 4.448221615);
    expect(sensors.loxTankLevel.value).toBeNaN();
  });

  it("uses the most severe configured source status for mixture ratio", () => {
    const daqState = createInitialDaqState();
    daqState.sensors.dpt0 = { readout: 500, type: "pressure", status: ReadingStatus.CAUTION };
    daqState.sensors.dpt1 = { readout: 500, type: "pressure", status: ReadingStatus.WARNING };
    daqState.derived = {
      lox_mass_flow_rate_kg_s: 0.04,
      fuel_mass_flow_rate_kg_s: 0.02,
      mixture_ratio: 2,
    };

    const { result } = renderHook(() => useEngineState(
      noDataSourceEngineState(),
      daqState,
      true,
    ));

    expect(result.current.state.derived.loxMassFlowRateGramsPerSecond.status).toBe(ReadingStatus.CAUTION);
    expect(result.current.state.derived.fuelMassFlowRateGramsPerSecond.status).toBe(ReadingStatus.WARNING);
    expect(result.current.state.derived.mixtureRatio.status).toBe(ReadingStatus.WARNING);
  });
});
