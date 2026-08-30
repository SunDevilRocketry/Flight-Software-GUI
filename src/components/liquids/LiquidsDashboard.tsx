"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { CasPane } from "@/components/liquids/CasPane";
import { DaqBackendStatus } from "@/components/liquids/DaqBackendStatus";
import { FlightApiStatus } from "@/components/liquids/FlightApiStatus";
import { Gauges } from "@/components/liquids/gauges";
import { Sequence } from "@/components/liquids/sequence/Sequence";
import { ReadingStatus, readingStatusTextClasses } from "@/components/liquids/pid/readingStatus";
import { SensorReadout } from "@/components/liquids/pid/grid-items/SensorReadout";
import { ValveControl } from "@/components/liquids/pid/grid-items/ValveControl";
import { RollingChart } from "@/components/widgets/RollingChart";
import { Alert, AlertPriority, alertState, clearAlerts, silenceAlertAurals } from "@/utils/alerts/alert";
import { pressureHandler, temperatureHandler } from "@/utils/units/units";
import { useDaqBackend } from "@/hooks/useDaqBackend";

type ValveId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface ValveDefinition {
  id: ValveId;
  label: string;
  initialOpen: boolean;
}

const valves: ValveDefinition[] = [
  { id: 1, label: "LOx pressurization valve", initialOpen: true },
  { id: 2, label: "LOx fill valve", initialOpen: false },
  { id: 3, label: "Kerosene pressurization valve", initialOpen: true },
  { id: 4, label: "Kerosene fill valve", initialOpen: false },
  { id: 5, label: "Main oxidizer valve", initialOpen: true },
  { id: 6, label: "Main fuel valve", initialOpen: true },
  { id: 7, label: "Kerosene drain valve", initialOpen: false },
  { id: 8, label: "LOx drain valve", initialOpen: false },
];

const initialValveState = Object.fromEntries(
  valves.map(({ id, initialOpen }) => [id, initialOpen]),
) as Record<ValveId, boolean>;

/* Mock telemetry stays in SI so every P&ID display goes through the configured unit handlers. */
const readings = {
  gn2: { pressurePa: 14_823_728.18, temperatureC: 21.67, status: ReadingStatus.NOMINAL },
  lox: { pressurePa: 3_019_903.69, temperatureC: -172.22, status: ReadingStatus.NOMINAL },
  kerosene: { pressurePa: 2_840_640, temperatureC: 23.33, status: ReadingStatus.NOMINAL },
  loxOrifice: { upstreamPressurePa: 2_764_797.67, downstreamPressurePa: 2_682_060.59, status: ReadingStatus.NOMINAL },
  keroseneOrifice: { upstreamPressurePa: 2_716_534.37, downstreamPressurePa: 2_626_902.53, status: ReadingStatus.NOMINAL },
  chamber: { pressurePa: 2_220_111.85, temperatureC: 1615.56, status: ReadingStatus.NOMINAL },
  inlet: { temperatureC: 21.67, status: ReadingStatus.NOMINAL },
};

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
  const [valveState, setValveState] = useState<Record<ValveId, boolean>>(initialValveState);
  const [telemetryPhase, setTelemetryPhase] = useState(0);
  const [abortIssued, setAbortIssued] = useState(false);
  const { abort: abortDaq, baseUrl, connect, disconnect, isConnected: isDaqConnected, status: daqStatus } = useDaqBackend();
  const hasWarning = useSyncExternalStore(
    alertState.subscribe,
    alertState.hasWarning,
    () => false,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTelemetryPhase((phase) => phase + 0.05);
    }, 50);

    return () => window.clearInterval(interval);
  }, []);

  const toggleValve = (id: ValveId) => {
    setValveState((current) => ({ ...current, [id]: !current[id] }));
  };

  const abort = () => {
    if (abortIssued) {
      setAbortIssued(false);
      clearAlerts();
      return;
    }

    setValveState(initialValveState);
    setAbortIssued(true);
    silenceAlertAurals();
    void abortDaq().catch(() => {
      new Alert("Abort command failed", "Unable to send the abort command to the DAQ backend.", AlertPriority.WARNING);
    });
    new Alert("Abort command sent", "The system is returning to its predetermined safe state. Ensure readings have stabilized before declaring the system safe.", AlertPriority.CAUTION);
  };

  const gn2SupplyFlow = true;
  const loxPressurizationFlow = gn2SupplyFlow && valveState[1];
  const kerosenePressurizationFlow = gn2SupplyFlow && valveState[3];
  const loxDrainFlow = loxPressurizationFlow && valveState[8];
  const keroseneDrainFlow = kerosenePressurizationFlow && valveState[7];
  const mainOxidizerFlow = gn2SupplyFlow && valveState[5];
  const mainFuelFlow = gn2SupplyFlow && valveState[6];
  const chamberManifoldFlow =
    loxDrainFlow || keroseneDrainFlow || mainOxidizerFlow || mainFuelFlow;
  const engineFlow = valveState[5] && valveState[6];
  const chamberPressurePa = engineFlow
    ? readings.chamber.pressurePa + Math.sin(telemetryPhase) * 18_000
    : 0;
  const thrustNewtons = engineFlow
    ? 5_400 + Math.sin(telemetryPhase * 0.7) * 180
    : 0;
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

          <div className="absolute left-1/2 top-4 -translate-x-1/2">
            <SensorReadout
              label="GN2"
              readings={[
                { label: "P", value: pressureHandler.getDisplayString(readings.gn2.pressurePa), status: readings.gn2.status },
                { label: "T", value: temperatureHandler.getDisplayString(readings.gn2.temperatureC), status: readings.gn2.status },
              ]}
            />
          </div>

          <div className="absolute left-[10.5%] top-28">
            <ValveControl number={1} label="LOx pressurization valve" open={valveState[1]} onToggle={() => toggleValve(1)} />
          </div>
          <div className="absolute right-[11%] top-28">
            <ValveControl number={3} label="Kerosene pressurization valve" open={valveState[3]} onToggle={() => toggleValve(3)} />
          </div>

          <div className="absolute left-[2%] top-48 flex items-center gap-3">
            <div className="translate-x-4">
              <PressureGauge label="LOx P" value={pressureHandler.getDisplayString(readings.lox.pressurePa)} status={readings.lox.status} />
            </div>
            <div className={`h-3 w-14 ${loxPressurizationFlow ? "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.7)]" : "bg-base-400"}`} />
          </div>
          <div className="absolute right-[2%] top-48 flex flex-row-reverse items-center gap-3">
            <div className="-translate-x-5">
              <PressureGauge label="K P" value={pressureHandler.getDisplayString(readings.kerosene.pressurePa)} status={readings.kerosene.status} />
            </div>
            <div className={`h-3 w-14 ${kerosenePressurizationFlow ? "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.7)]" : "bg-base-400"}`} />
          </div>

          <div className="absolute left-[1.5%] top-[35%]">
            <ValveControl number={2} label="LOx fill valve" open={valveState[2]} onToggle={() => toggleValve(2)} />
          </div>
          <div className="absolute right-[17%] top-[35%]">
            <ValveControl number={4} label="Kerosene fill valve" open={valveState[4]} onToggle={() => toggleValve(4)} />
          </div>
          <p className="absolute right-[1%] top-[calc(35%-2px)] z-10 bg-base px-1 text-xs font-semibold">K Fill</p>

          <div className="absolute left-[9%] top-[40%] translate-y-2">
            <SensorReadout
              label="LOx"
              readings={[
                { label: "P", value: pressureHandler.getDisplayString(readings.lox.pressurePa), status: readings.lox.status },
                { label: "Level", value: "76%", status: readings.lox.status },
                { label: "T", value: temperatureHandler.getDisplayString(readings.lox.temperatureC), status: readings.lox.status },
              ]}
            />
          </div>
          <div className="absolute right-[9%] top-[40%] translate-y-4">
            <SensorReadout
              label="K"
              readings={[
                { label: "P", value: pressureHandler.getDisplayString(readings.kerosene.pressurePa), status: readings.kerosene.status },
                { label: "Level", value: "63%", status: readings.kerosene.status },
                { label: "T", value: temperatureHandler.getDisplayString(readings.kerosene.temperatureC), status: readings.kerosene.status },
              ]}
            />
          </div>

          <div className="absolute left-[9.5%] top-[59%]">
            <SensorReadout
              label="LOx orifice"
              compact
              readings={[
                { label: "A", value: pressureHandler.getDisplayString(readings.loxOrifice.upstreamPressurePa), status: readings.loxOrifice.status },
                { label: "B", value: pressureHandler.getDisplayString(readings.loxOrifice.downstreamPressurePa), status: readings.loxOrifice.status },
              ]}
            />
          </div>
          <p className="absolute left-[1%] top-[72%] z-10 bg-base px-1 text-xs font-semibold">LOx Fill / Drain</p>
          <div className="absolute right-[9.7%] top-[63%]">
            <SensorReadout
              label="K orifice"
              compact
              readings={[
                { label: "A", value: pressureHandler.getDisplayString(readings.keroseneOrifice.upstreamPressurePa), status: readings.keroseneOrifice.status },
                { label: "B", value: pressureHandler.getDisplayString(readings.keroseneOrifice.downstreamPressurePa), status: readings.keroseneOrifice.status },
              ]}
            />
          </div>
          <p className="absolute right-[1%] top-[54%] z-10 bg-base px-1 text-xs font-semibold">K Drain</p>

          <div className="absolute bottom-30 left-[10.9%]">
            <ValveControl number={8} label="LOx drain valve" open={valveState[8]} onToggle={() => toggleValve(8)} />
          </div>
          <div className="absolute bottom-32 left-[37.5%]">
            <ValveControl number={5} label="Main oxidizer valve" open={valveState[5]} onToggle={() => toggleValve(5)} />
          </div>
          <div className="absolute bottom-32 right-[37.5%]">
            <ValveControl number={6} label="Main fuel valve" open={valveState[6]} onToggle={() => toggleValve(6)} />
          </div>
          <div className="absolute bottom-32 right-[10.9%]">
            <ValveControl number={7} label="Kerosene drain valve" open={valveState[7]} onToggle={() => toggleValve(7)} />
          </div>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <PressureGauge
              label="chamber"
              value={pressureHandler.getDisplayString(chamberPressurePa)}
              status={readings.chamber.status}
            />
            <span className="mt-1 text-xs text-base-500">
              Chamber temperature: <span className={readingStatusTextClasses[readings.chamber.status]}>{engineFlow ? temperatureHandler.getDisplayString(readings.chamber.temperatureC) : "ambient"}</span>
            </span>
          </div>
        </section>

        <div className="col-start-2 grid min-h-0 grid-cols-2">
          <RollingChart
            value={chamberPressurePa}
            active={engineFlow}
            title="Chamber Pressure"
            ariaLabel="Rolling chamber pressure chart"
            formatValue={(value) => `${(value / 6_894.757).toFixed(0)} psi`}
            lookbackSeconds={20}
            fillContainer
          />
          <RollingChart
            value={thrustNewtons}
            active={engineFlow}
            title="Thrust"
            ariaLabel="Rolling thrust chart"
            formatValue={(value) => `${value.toFixed(0)} N`}
            lookbackSeconds={20}
            fillContainer
          />
        </div>
        <div className="col-start-1 row-start-1 row-span-2 grid min-h-0 overflow-hidden grid-rows-2">
          <Sequence
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
            fuelPressurePa={readings.kerosene.pressurePa}
            inletTemperatureC={readings.inlet.temperatureC}
            loxPressurePa={readings.lox.pressurePa}
          />
          <section className="flex shrink-0 flex-col gap-4 p-4">
            <DaqBackendStatus
              baseUrl={baseUrl}
              isConnected={isDaqConnected}
              onConnect={connect}
              onDisconnect={disconnect}
              status={daqStatus}
            />
            <FlightApiStatus />
          </section>
        </div>
      </div>
    </main>
  );
}