export function formatPercent(value: number): string | null {
  if (!isFinite(value)) return null;
  if (Math.abs(value) > 1e4) return null;
  return `${(value * 100).toFixed(1)}%`;
}
