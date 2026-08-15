import { RollingChart } from "@/components/widgets/RollingChart";

interface ChamberPressureChartProps {
  pressurePa: number;
  active: boolean;
}

export function ChamberPressureChart({ pressurePa, active }: ChamberPressureChartProps) {
  return (
    <RollingChart
      key={active ? "streaming" : "standby"}
      value={pressurePa}
      active={active}
      title="Chamber pressure"
      ariaLabel="Rolling chamber pressure chart"
      formatValue={(value) => `${(value / 6_894.757).toFixed(0)} psi`}
    />
  );
}