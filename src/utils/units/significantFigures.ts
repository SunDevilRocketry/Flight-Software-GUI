export function formatSignificantFigures(value: number): string {
  const magnitude = Math.abs(value);
  const decimalPlaces = magnitude < 10 ? 2 : magnitude < 100 ? 1 : 0;

  return value.toFixed(decimalPlaces);
}
