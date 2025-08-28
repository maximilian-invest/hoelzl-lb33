import type { MetricKey } from "@/lib/metric-info";

// Central policy controlling where numeric values are allowed to appear.
// Metrics listed here should show numbers in grid/facts, but NOT again in bullets.
export const DISPLAY_POLICY = {
  numericInGridOrFactsOnly: new Set<MetricKey>(["Miet-Delta"]),
};

export function shouldShowNumericInBullets(metric: MetricKey): boolean {
  return !DISPLAY_POLICY.numericInGridOrFactsOnly.has(metric);
}


