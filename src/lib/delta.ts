export type DeltaBand = "low" | "mid" | "high";

// Thresholds in percentage points (absolute)
export const DELTA_THRESHOLDS = {
  greenMax: 2,
  yellowMax: 7,
};

export function formatDeltaSigned(value: number): string {
  const sign = value >= 0 ? "+" : "−"; // use minus sign
  const pct = Math.round(Math.abs(value) * 100);
  return `${sign}${pct} %`;
}

export function deltaBand(absValue: number): DeltaBand {
  const pp = Math.abs(absValue) * 100;
  if (pp <= DELTA_THRESHOLDS.greenMax) return "low";
  if (pp <= DELTA_THRESHOLDS.yellowMax) return "mid";
  return "high";
}

export function deltaQualifier(band: DeltaBand): string {
  if (band === "low") return "nahe Markt";
  if (band === "mid") return "moderat abweichend";
  return "deutlich abweichend";
}

export function colorFromMietDelta(absValue: number): string {
  const band = deltaBand(absValue);
  if (band === "low") return "bg-emerald-500";
  if (band === "mid") return "bg-orange-500";
  return "bg-red-500";
}

// Signed coloring: negative delta (unter Markt) = green, positive (über Markt) = red
export function colorFromMietDeltaSigned(value: number): string {
  if (value < 0) return "bg-emerald-500";
  if (value > 0) return "bg-red-500";
  return "bg-slate-400";
}


