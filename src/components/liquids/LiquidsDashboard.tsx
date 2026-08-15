"use client";

import { useState } from "react";

import { SensorReadout } from "@/components/liquids/pid/grid-items/SensorReadout";
import { ValveControl } from "@/components/liquids/pid/grid-items/ValveControl";
import { pressureHandler, temperatureHandler } from "@/utils/units/units";

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
  gn2: { pressurePa: 14_823_728.18, temperatureC: 21.67 },
  lox: { pressurePa: 3_019_903.69, temperatureC: -172.22 },
  kerosene: { pressurePa: 2_840_640, temperatureC: 23.33 },
  loxOrifice: { upstreamPressurePa: 2_764_797.67, downstreamPressurePa: 2_682_060.59 },
  keroseneOrifice: { upstreamPressurePa: 2_716_534.37, downstreamPressurePa: 2_626_902.53 },
  chamber: { pressurePa: 2_220_111.85, temperatureC: 1615.56 },
};

const Pipe = ({ active, className = "" }: { active: boolean; className?: string }) => (
  <div
    className={`absolute bg-base-400 transition-colors duration-200 ${
      active ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" : ""
    } ${className}`}
    aria-hidden="true"
  />
);

const PressureGauge = ({ label, value }: { label: string; value: string }) => (
  <div className="flex size-14 items-center justify-center rounded-full border-2 border-base-400 bg-base-100 text-center text-xs font-semibold text-base-700 dark:text-highlight">
    <span>
      {value}
      <br />
      <span className="text-[10px] text-base-500">{label}</span>
    </span>
  </div>
);

export function LiquidsDashboard() {
  const [valveState, setValveState] = useState<Record<ValveId, boolean>>(initialValveState);
  const toggleValve = (id: ValveId) => {
    setValveState((current) => ({ ...current, [id]: !current[id] }));
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

  return (
    <main className="min-h-screen overflow-x-auto bg-base p-4 text-base-700 transition-colors duration-300 dark:text-highlight sm:p-8">
      <div className="mx-auto min-w-[860px] max-w-[1180px]">
        <header className="mb-8 flex items-end justify-between border-b border-base-400 pb-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
              LIQUIDS DAQ
            </p>
            <h1 className="mt-1 text-3xl font-bold">Propellant P&amp;ID</h1>
          </div>
          <div className="text-right text-xs text-base-500">
            <p>Pre-integration simulation</p>
            <p>{Object.values(valveState).filter(Boolean).length} valves open</p>
          </div>
        </header>

        <section
          className="relative h-[770px] border border-base-300 bg-base-100/60 shadow-2xl"
          aria-label="Liquid engine propellant process and instrumentation diagram"
        >
          {/* GN2 supply manifold */}
          <Pipe active={gn2SupplyFlow} className="left-1/2 top-20 h-[534px] w-3 -translate-x-1/2" />
          <Pipe active={gn2SupplyFlow} className="left-[14%] right-[14%] top-32 h-3" />

          {/* LOx process branch */}
          <Pipe active={loxPressurizationFlow} className="left-[12.5%] top-40 h-[148px] w-3" />
          <Pipe active={loxPressurizationFlow} className="left-[12.5%] top-[53%] h-[6%] w-3" />
          <Pipe active={loxPressurizationFlow} className="left-[12.5%] top-[69%] h-[14.5%] w-3" />
          <Pipe active={loxPressurizationFlow} className="left-[3%] top-[75%] h-3 w-[9.5%]" />
          <Pipe active={loxPressurizationFlow} className="left-[1.5%] top-[37%] h-3 w-[11%]" />
          <Pipe active={chamberManifoldFlow} className="bottom-[102px] left-[12.5%] h-[26px] w-3" />
          <Pipe active={chamberManifoldFlow} className="bottom-[102px] left-[39%] h-[26px] w-3" />

          {/* Kerosene process branch */}
          <Pipe active={kerosenePressurizationFlow} className="right-[12.5%] top-40 h-[148px] w-3" />
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
                { label: "P", value: pressureHandler.getDisplayString(readings.gn2.pressurePa) },
                { label: "T", value: temperatureHandler.getDisplayString(readings.gn2.temperatureC) },
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
            <PressureGauge label="LOx P" value={pressureHandler.getDisplayString(readings.lox.pressurePa)} />
            <div className={`h-3 w-14 ${loxPressurizationFlow ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" : "bg-base-400"}`} />
          </div>
          <div className="absolute right-[2%] top-48 flex flex-row-reverse items-center gap-3">
            <PressureGauge label="K P" value={pressureHandler.getDisplayString(readings.kerosene.pressurePa)} />
            <div className={`h-3 w-14 ${kerosenePressurizationFlow ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" : "bg-base-400"}`} />
          </div>

          <div className="absolute left-[1.5%] top-[35%]">
            <ValveControl number={2} label="LOx fill valve" open={valveState[2]} onToggle={() => toggleValve(2)} />
          </div>
          <div className="absolute right-[17%] top-[35%]">
            <ValveControl number={4} label="Kerosene fill valve" open={valveState[4]} onToggle={() => toggleValve(4)} />
          </div>
          <p className="absolute right-[1%] top-[calc(35%-2px)] z-10 bg-base px-1 text-xs font-semibold">K Fill</p>

          <div className="absolute left-[9%] top-[40%]">
            <SensorReadout
              label="LOx"
              readings={[
                { label: "P", value: pressureHandler.getDisplayString(readings.lox.pressurePa) },
                { label: "Level", value: "76%" },
                { label: "T", value: temperatureHandler.getDisplayString(readings.lox.temperatureC) },
              ]}
            />
          </div>
          <div className="absolute right-[9%] top-[40%]">
            <SensorReadout
              label="K"
              readings={[
                { label: "P", value: pressureHandler.getDisplayString(readings.kerosene.pressurePa) },
                { label: "Level", value: "63%" },
                { label: "T", value: temperatureHandler.getDisplayString(readings.kerosene.temperatureC) },
              ]}
            />
          </div>

          <div className="absolute left-[8%] top-[59%]">
            <SensorReadout
              label="LOx orifice"
              compact
              readings={[
                { label: "A", value: pressureHandler.getDisplayString(readings.loxOrifice.upstreamPressurePa) },
                { label: "B", value: pressureHandler.getDisplayString(readings.loxOrifice.downstreamPressurePa) },
              ]}
            />
          </div>
          <p className="absolute left-[1%] top-[72%] z-10 bg-base px-1 text-xs font-semibold">LOx Fill / Drain</p>
          <div className="absolute right-[8%] top-[63%]">
            <SensorReadout
              label="K orifice"
              compact
              readings={[
                { label: "A", value: pressureHandler.getDisplayString(readings.keroseneOrifice.upstreamPressurePa) },
                { label: "B", value: pressureHandler.getDisplayString(readings.keroseneOrifice.downstreamPressurePa) },
              ]}
            />
          </div>
          <p className="absolute right-[1%] top-[54%] z-10 bg-base px-1 text-xs font-semibold">K Drain</p>

          <div className="absolute bottom-32 left-[10.5%]">
            <ValveControl number={8} label="LOx drain valve" open={valveState[8]} onToggle={() => toggleValve(8)} />
          </div>
          <div className="absolute bottom-32 left-[37.5%]">
            <ValveControl number={5} label="Main oxidizer valve" open={valveState[5]} onToggle={() => toggleValve(5)} />
          </div>
          <div className="absolute bottom-32 right-[37.5%]">
            <ValveControl number={6} label="Main fuel valve" open={valveState[6]} onToggle={() => toggleValve(6)} />
          </div>
          <div className="absolute bottom-32 right-[11%]">
            <ValveControl number={7} label="Kerosene drain valve" open={valveState[7]} onToggle={() => toggleValve(7)} />
          </div>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <PressureGauge
              label="chamber"
              value={pressureHandler.getDisplayString(engineFlow ? readings.chamber.pressurePa : 0)}
            />
            <span className="mt-1 text-xs text-base-500">
              Chamber temperature: {engineFlow ? temperatureHandler.getDisplayString(readings.chamber.temperatureC) : "ambient"}
            </span>
          </div>
        </section>

        <footer className="mt-4 flex items-center justify-between text-xs text-base-500">
          <p>Green piping indicates an active mock flow path.</p>
          <p>Valve controls are local simulation inputs.</p>
        </footer>
      </div>
    </main>
  );
}