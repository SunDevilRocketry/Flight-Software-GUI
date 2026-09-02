"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CasPane } from "@/components/liquids/CasPane";
import { DaqBackendStatus } from "@/components/liquids/DaqBackendStatus";
import { Gauges } from "@/components/liquids/Gauges";
import { Sequence } from "@/components/liquids/sequence/Sequence";
import { ReadingStatus, readingStatusTextClasses } from "@/components/liquids/pid/readingStatus";
import { SensorReadout } from "@/components/liquids/pid/grid-items/SensorReadout";
import { ValveControl } from "@/components/liquids/pid/grid-items/ValveControl";
import { RollingChart } from "@/components/widgets/RollingChart";
import { Alert, AlertPriority, alertState, clearAlerts, silenceAlertAurals } from "@/utils/liquids/alert";
import { forceHandler, pressureHandler, temperatureHandler } from "@/utils/units/units";
import { useDaqBackend } from "@/hooks/liquids/useDaqBackend";
import { useEngineState } from "@/hooks/liquids/useEngineState";
import { mockEngineState, mockSequenceInitialTimeCentiseconds, setMockSensorStatus as applyMockSensorStatus, ValveId } from "@/hooks/liquids/useMockEngine";

interface ValveDefinition {
  id: ValveId;
  label: string;
  initialOpen: boolean;
}

const valves: ValveDefinition[] = [
  { id: ValveId.LoxPressurization, label: "LOx pressurization valve", initialOpen: true },
  { id: ValveId.LoxFill, label: "LOx fill valve", initialOpen: false },
  { id: ValveId.KerosenePressurization, label: "Kerosene pressurization valve", initialOpen: true },
  { id: ValveId.KeroseneFill, label: "Kerosene fill valve", initialOpen: false },
  { id: ValveId.MainOxidizer, label: "Main oxidizer valve", initialOpen: true },
  { id: ValveId.MainFuel, label: "Main fuel valve", initialOpen: true },
  { id: ValveId.KeroseneDrain, label: "Kerosene drain valve", initialOpen: false },
  { id: ValveId.LoxDrain, label: "LOx drain valve", initialOpen: false },
];

const Pipe = ({ active, className = "" }: { active: boolean; className?: string }) => (
  <div
    className={`absolute bg-base-400 transition-colors duration-100 ${
      active ? "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.7)]" : ""
    } ${className}`}
    aria-hidden="true"
  />
);

const PressureGauge = ({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: ReadingStatus;
}) => (
  <div className="flex size-14 items-center justify-center rounded-full border-2 border-base-400 bg-base-100 text-center text-xs font-semibold text-base-700 dark:text-highlight">
    <span>
      <span className={readingStatusTextClasses[status]}>{value}</span>
      <br />
      <span className="text-[10px] text-base-500">{label}</span>
    </span>
  </div>
);

export function LiquidsDashboard() {
  const sequenceStateRef = useRef({
    isRunning: false,
    timeCentiseconds: mockSequenceInitialTimeCentiseconds,
  });
  const [manualValveActuationVersion, setManualValveActuationVersion] = useState(0);
  const [abortIssued, setAbortIssued] = useState(false);
  const { state: engineState, setState: setEngineState, toggleValve, reset: resetEngineState } = useEngineState();
  const { sensors, actuators } = engineState;
  const valveState = actuators.valves;
  const { abort: abortDaq, baseUrl, connect, disconnect, isConnected: isDaqConnected, status: daqStatus } = useDaqBackend();
  const hasWarning = useSyncExternalStore(
    alertState.subscribe,
    alertState.hasWarning,
    () => false,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setEngineState((current) => {
        const mockState = mockEngineState(
          current.sensors.chamberPressurePa.status,
          sequenceStateRef.current.isRunning
            ? sequenceStateRef.current.timeCentiseconds
            : undefined,
          current.actuators,
        );

        return {
          ...mockState,
        };
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [setEngineState]);

  const handleSequenceStateChange = useCallback((timeCentiseconds: number, isRunning: boolean) => {
    sequenceStateRef.current = { timeCentiseconds, isRunning };
  }, []);

  const handleSequenceJump = useCallback((timeCentiseconds: number) => {
    sequenceStateRef.current = { timeCentiseconds, isRunning: false };
    setEngineState((current) => mockEngineState(
      current.sensors.chamberPressurePa.status,
      timeCentiseconds,
      current.actuators,
    ));
  }, [setEngineState]);

  const handleManualValveToggle = useCallback((id: ValveId) => {
    setManualValveActuationVersion((current) => current + 1);
    toggleValve(id);
  }, [toggleValve]);

  const abort = () => {
    if (abortIssued) {
      setAbortIssued(false);
      clearAlerts();
      return;
    }

    resetEngineState();
    setAbortIssued(true);
    silenceAlertAurals();
    void abortDaq().catch(() => {
      new Alert("Abort command failed", "Unable to send the abort command to the DAQ backend.", AlertPriority.WARNING);
    });
    new Alert("Abort command sent", "The system is returning to its predetermined safe state. Ensure readings have stabilized before declaring the system safe.", AlertPriority.CAUTION);
  };

  const gn2SupplyFlow = true;
  const loxPressurizationFlow = gn2SupplyFlow && valveState[ValveId.LoxPressurization];
  const kerosenePressurizationFlow = gn2SupplyFlow && valveState[ValveId.KerosenePressurization];
  const loxDrainFlow = loxPressurizationFlow && valveState[ValveId.LoxDrain];
  const keroseneDrainFlow = kerosenePressurizationFlow && valveState[ValveId.KeroseneDrain];
  const mainOxidizerFlow = gn2SupplyFlow && valveState[ValveId.MainOxidizer];
  const mainFuelFlow = gn2SupplyFlow && valveState[ValveId.MainFuel];
  const chamberManifoldFlow =
    loxDrainFlow || keroseneDrainFlow || mainOxidizerFlow || mainFuelFlow;
  const engineFlow = valveState[ValveId.MainOxidizer] && valveState[ValveId.MainFuel];
  const chamberPressurePa = sensors.chamberPressurePa.value;
  const thrustNewtons = sensors.thrustNewtons.value;
  const handleMockSensorStatusChange = useCallback((status: ReadingStatus) => {
    setEngineState((current) => applyMockSensorStatus(current, status));
  }, [setEngineState]);
  const isSystemSafe = valves.every(
    ({ id, initialOpen }) => valveState[id] === initialOpen,
  );
  const abortClassName = abortIssued
    ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
    : hasWarning
    ? "border-orange-600 bg-orange-500 text-white hover:bg-orange-600"
    : isSystemSafe
      ? "border-base-400 bg-base-200 text-base-600 hover:bg-base-300"
      : "border-yellow-500 bg-yellow-400 text-yellow-950 hover:bg-yellow-500";

  return (
    <main className="h-screen overflow-hidden bg-base text-base-700 transition-colors duration-300 dark:text-highlight">
      <div className="grid h-full min-w-[1720px] grid-cols-[minmax(430px,0.75fr)_minmax(860px,1180px)_minmax(430px,0.75fr)] grid-rows-[minmax(0,770px)_minmax(0,1fr)]">
        <section
          className="relative col-start-2 h-[770px] border border-base-300 bg-base-100 shadow-2xl"
          aria-label="Liquid engine propellant process and instrumentation diagram"
        >
          {/* GN2 supply manifold */}
          <Pipe active={gn2SupplyFlow} className="left-1/2 top-20 h-[534px] w-3 -translate-x-1/2" />
          <Pipe active={gn2SupplyFlow} className="left-[14%] right-[14%] top-32 h-3" />

          {/* LOx process branch */}
          <Pipe active={loxPressurizationFlow} className="left-[12.5%] top-40 h-[164px] w-3" />
          <Pipe active={loxPressurizationFlow} className="left-[12.5%] top-[53%] h-[6%] w-3" />
          <Pipe active={loxPressurizationFlow} className="left-[12.5%] top-[69%] h-[14.5%] w-3" />
          <Pipe active={loxPressurizationFlow} className="left-[3%] top-[75%] h-3 w-[9.5%]" />
          <Pipe active={loxPressurizationFlow} className="left-[1.5%] top-[37%] h-3 w-[11%]" />
          <Pipe active={chamberManifoldFlow} className="bottom-[102px] left-[12.5%] h-[26px] w-3" />
          <Pipe active={chamberManifoldFlow} className="bottom-[102px] left-[39%] h-[26px] w-3" />

          {/* Kerosene process branch */}
          <Pipe active={kerosenePressurizationFlow} className="right-[12.5%] top-40 h-[164px] w-3" />
          <Pipe active={kerosenePressurizationFlow} className="right-[12.5%] top-[53%] h-[10%] w-3" />
          <Pipe active={kerosenePressurizationFlow} className="right-[12.5%] top-[73%] h-[10.5%] w-3" />
          <Pipe active={kerosenePressurizationFlow} className="right-[3%] top-[58%] h-3 w-[9.5%]" />
          <Pipe active={kerosenePressurizationFlow} className="left-[79%] top-[37%] h-3 right-[3%]" />
          <Pipe active={chamberManifoldFlow} className="bottom-[102px] right-[12.5%] h-[26px] w-3" />
          <Pipe active={chamberManifoldFlow} className="bottom-[102px] right-[39%] h-[26px] w-3" />

          {/* The GN2 center line supplies valves 5 and 6 only. */}
          <Pipe active={gn2SupplyFlow} className="bottom-[144px] left-[39%] right-[39%] h-3" />

          {/* All four lower valves collect independently into the chamber manifold. */}
          <Pipe
            active={chamberManifoldFlow}
            className="bottom-24 left-[12.5%] right-[12.5%] h-3"
          />
          <Pipe active={chamberManifoldFlow} className="bottom-[89px] left-1/2 h-[7px] w-3 -translate-x-1/2" />

          <div
            className="absolute bottom-[108px] left-[calc(24%+1.65rem)] h-3 w-1 bg-base-400"
            aria-hidden="true"
          />
          <div className="absolute bottom-[118px] left-[24%]">
            <PressureGauge
              label="LOx T"
              value={temperatureHandler.getDisplayString(sensors.inletTemperatureC.value)}
              status={sensors.inletTemperatureC.status}
            />
          </div>

          <div className="absolute left-1/2 top-4 -translate-x-1/2">
            <SensorReadout
              label="GN2"
              muted
              readings={[
                { label: "P", value: "--", status: sensors.gn2PressurePa.status },
                { label: "T", value: "--", status: sensors.gn2TemperatureC.status },
              ]}
            />
          </div>

          <div className="absolute left-[11%] top-28">
            <ValveControl label="LOx Press" open={valveState[ValveId.LoxPressurization]} onToggle={() => handleManualValveToggle(ValveId.LoxPressurization)} />
          </div>
          <div className="absolute right-[11%] top-28">
            <ValveControl label="K Press" open={valveState[ValveId.KerosenePressurization]} onToggle={() => handleManualValveToggle(ValveId.KerosenePressurization)} />
          </div>

          <div className="absolute left-[2%] top-48 flex items-center gap-3">
            <div className="translate-x-4">
              <PressureGauge label="LOx P" value={pressureHandler.getDisplayString(sensors.loxTankPressurePa.value)} status={sensors.loxTankPressurePa.status} />
            </div>
            <div className={`h-3 w-14 ${loxPressurizationFlow ? "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.7)]" : "bg-base-400"}`} />
          </div>
          <div className="absolute right-[2%] top-48 flex flex-row-reverse items-center gap-3">
            <div className="-translate-x-5">
              <PressureGauge label="K P" value={pressureHandler.getDisplayString(sensors.keroseneTankPressurePa.value)} status={sensors.keroseneTankPressurePa.status} />
            </div>
            <div className={`h-3 w-14 ${kerosenePressurizationFlow ? "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.7)]" : "bg-base-400"}`} />
          </div>

          <div className="absolute left-[1.5%] top-[35%]">
            <ValveControl label="LOx Vent" open={valveState[ValveId.LoxFill]} onToggle={() => handleManualValveToggle(ValveId.LoxFill)} />
          </div>
          <div className="absolute right-[17%] top-[35%]">
            <ValveControl label="K Vent" open={valveState[ValveId.KeroseneFill]} onToggle={() => handleManualValveToggle(ValveId.KeroseneFill)} />
          </div>
          <p className="absolute right-[1%] top-[calc(35%-2px)] z-10 bg-base px-1 text-xs font-semibold">K Fill</p>

          <div className="absolute left-[9%] top-[40%] translate-y-2">
            <SensorReadout
              label="LOx"
              muted
              readings={[
                { label: "P", value: "--", status: sensors.loxTankPressurePa.status },
                { label: "Level", value: "--", status: sensors.loxTankLevel.status },
                { label: "T", value: "--", status: sensors.loxTankTemperatureC.status },
              ]}
            />
          </div>
          <div className="absolute right-[9%] top-[40%] translate-y-4">
            <SensorReadout
              label="K"
              muted
              readings={[
                { label: "P", value: "--", status: sensors.keroseneTankPressurePa.status },
                { label: "Level", value: "--", status: sensors.keroseneTankLevel.status },
                { label: "T", value: "--", status: sensors.keroseneTankTemperatureC.status },
              ]}
            />
          </div>

          <div className="absolute left-[9.5%] top-[59%]">
            <SensorReadout
              label="LOx orifice"
              compact
              muted
              readings={[
                { label: "A", value: "--", status: sensors.loxOrificePressureAPa.status },
                { label: "B", value: "--", status: sensors.loxOrificePressureBPa.status },
              ]}
            />
          </div>
          <p className="absolute left-[1%] top-[72%] z-10 bg-base px-1 text-xs font-semibold">LOx Fill / Drain</p>
          <div className="absolute right-[9.7%] top-[63%]">
            <SensorReadout
              label="K orifice"
              compact
              muted
              readings={[
                { label: "A", value: "--", status: sensors.keroseneOrificePressureAPa.status },
                { label: "B", value: "--", status: sensors.keroseneOrificePressureBPa.status },
              ]}
            />
          </div>
          <p className="absolute right-[1%] top-[54%] z-10 bg-base px-1 text-xs font-semibold">K Drain</p>

          <div className="absolute bottom-30 left-[10.9%]">
            <ValveControl label="LOx Main" open={valveState[ValveId.LoxDrain]} onToggle={() => handleManualValveToggle(ValveId.LoxDrain)} />
          </div>
          <div className="absolute bottom-32 left-[37.5%]">
            <ValveControl label="LOx Purge" open={valveState[ValveId.MainOxidizer]} onToggle={() => handleManualValveToggle(ValveId.MainOxidizer)} />
          </div>
          <div className="absolute bottom-32 right-[37.5%]">
            <ValveControl label="K Purge" open={valveState[ValveId.MainFuel]} onToggle={() => handleManualValveToggle(ValveId.MainFuel)} />
          </div>
          <div className="absolute bottom-32 right-[10.9%]">
            <ValveControl label="K Main" open={valveState[ValveId.KeroseneDrain]} onToggle={() => handleManualValveToggle(ValveId.KeroseneDrain)} />
          </div>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 -translate-y-5 flex-col items-center">
            <PressureGauge
              label="chamber"
              value={pressureHandler.getDisplayString(chamberPressurePa)}
              status={sensors.chamberPressurePa.status}
            />
          </div>
        </section>

        <div className="col-start-2 grid min-h-0 grid-cols-3">
          <RollingChart
            value={chamberPressurePa}
            active={engineFlow}
            title="Chamber Pressure"
            ariaLabel="Rolling chamber pressure chart"
            formatValue={(value) => pressureHandler.getDisplayString(value)}
            lookbackSeconds={20}
            fillContainer
          />
          <RollingChart
            value={thrustNewtons}
            active={engineFlow}
            title="Thrust"
            ariaLabel="Rolling thrust chart"
            formatValue={(value) => forceHandler.getDisplayString(value)}
            lookbackSeconds={20}
            fillContainer
          />
          <RollingChart
            value={sensors.loxTankPressurePa.value}
            active
            title="LOx Tank Pressure"
            ariaLabel="Rolling LOx tank pressure chart"
            formatValue={(value) => pressureHandler.getDisplayString(value)}
            lookbackSeconds={20}
            fillContainer
          />
        </div>
        <div className="col-start-1 row-start-1 row-span-2 grid min-h-0 overflow-hidden grid-rows-2">
          <Sequence
            onMockSensorStatusChange={handleMockSensorStatusChange}
            onSequenceJump={handleSequenceJump}
            onSequenceStateChange={handleSequenceStateChange}
            stopSignal={manualValveActuationVersion}
            abortControl={
            <button
              className={`w-full border-2 px-6 py-5 text-2xl font-black tracking-wide transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${abortClassName}`}
              type="button"
              onClick={abort}
            >
              {abortIssued ? (
                <span className="flex flex-col items-center">
                  <span>System Aborted</span>
                  <span className="mt-1 text-xs font-semibold tracking-normal">
                    press again to reset the system
                  </span>
                </span>
              ) : (
                "ABORT"
              )}
            </button>
            }
          />
          <div className="min-h-0">
            <CasPane />
          </div>
        </div>
        <div className="col-start-3 row-start-1 row-span-2 flex min-h-0 flex-col">
          <Gauges
            chamberPressurePa={chamberPressurePa}
            chamberPressureStatus={sensors.chamberPressurePa.status}
            fuelPressurePa={sensors.keroseneTankPressurePa.value}
            fuelPressureStatus={sensors.keroseneTankPressurePa.status}
            inletTemperatureC={sensors.inletTemperatureC.value}
            inletTemperatureStatus={sensors.inletTemperatureC.status}
            loxPressurePa={sensors.loxTankPressurePa.value}
            loxPressureStatus={sensors.loxTankPressurePa.status}
          />
          <section className="flex shrink-0 flex-col gap-4 p-4">
            <DaqBackendStatus
              baseUrl={baseUrl}
              isConnected={isDaqConnected}
              onConnect={connect}
              onDisconnect={disconnect}
              status={daqStatus}
            />
          </section>
        </div>
      </div>
    </main>
  );
}