export function formatPercent(value: number): string | null {
  if (!isFinite(value)) return null;
  if (Math.abs(value) > 1e4) return null;
  return `${(value * 100).toFixed(1)}%`;
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
