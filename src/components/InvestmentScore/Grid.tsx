"use client";

import { FC, useMemo } from "react";
import { ScoreResult } from "@/types/score";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { MetricKey } from "@/lib/metric-info";

interface GridProps {
  score: ScoreResult;
}

export const Grid: FC<GridProps> = ({ score }) => {
  const items = useMemo(
    () => [
      { label: "Preis-Discount", value: score.subscores.priceDiscount, metric: "Preis-Discount" },
      { label: "Miet-Delta", value: score.subscores.rentDelta, metric: "Miet-Delta" },
      { label: "Cashflow-Stabilität", value: score.subscores.cashflowStability, metric: "Cashflow-Stabilität" },
      { label: "Finanzierung & DSCR", value: score.subscores.financing, metric: "DSCR" },
      { label: "Upside-Potenzial", value: score.subscores.upside, metric: "Upside-Potenzial" },
      { label: "Datenqualität", value: score.subscores.dataQuality, metric: "Datenqualität" },
    ],
    [score]
  );

  // Rent delta thresholds in percentage points: green ≤2, yellow ≤7, red >7
  const RENT_DELTA_THRESHOLDS = { green: 2, yellow: 7 };
  // Determines bar color based on metric label and value
  const barColor = (label: string, v: number) => {
    if (label === "Miet-Delta") {
      const d = Math.abs(score.rentDeltaPct) * 100; // in percentage points
      if (d <= RENT_DELTA_THRESHOLDS.green) return "bg-emerald-500";
      if (d <= RENT_DELTA_THRESHOLDS.yellow) return "bg-orange-500";
      return "bg-red-500";
    }
    if (label === "Upside-Potenzial") {
      return v > 0
        ? v >= 50
          ? "bg-emerald-500"
          : "bg-orange-500"
        : "bg-red-500";
    }
    return v >= 75 ? "bg-emerald-500" : v >= 50 ? "bg-orange-500" : "bg-red-500";
  };

  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(({ label, value, metric }) => (
        <div key={label} className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              {label}
              <InfoTooltip metric={metric as MetricKey} />
            </span>
            <span>{Math.round(value)}</span>
          </div>
          {label === "Miet-Delta" ? (
            <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded">
              <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400" />
              <div
                className={`absolute top-0 h-2 rounded ${barColor(label, value)}`}
                style={{
                  width: `${Math.min(Math.abs(score.rentDeltaPct) / 0.2 * 50, 50)}%`,
                  [score.rentDeltaPct >= 0 ? "left" : "right"]: "50%",
                }}
              />
            </div>
          ) : (
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded">
              <div
                className={`h-2 rounded ${barColor(label, value)}`}
                style={{ width: `${Math.round(value)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
