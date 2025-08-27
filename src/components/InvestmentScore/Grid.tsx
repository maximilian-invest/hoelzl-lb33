"use client";

import { FC, useMemo } from "react";
import { ScoreResult } from "@/types/score";

interface GridProps {
  score: ScoreResult;
}

export const Grid: FC<GridProps> = ({ score }) => {
  const items = useMemo(
    () => [
      {
        label: "Preis-Discount",
        value: score.subscores.priceDiscount,
        desc: "Einstiegspreis vs. Ø-Marktpreis im Stadtteil",
      },
      {
        label: "Miet-Delta",
        value: score.subscores.rentDelta,
        desc: "Abweichung der Ist-Miete von der Marktmiete (positiv = günstiger, negativ = teurer)",
      },
      {
        label: "Cashflow-Stabilität",
        value: score.subscores.cashflowStability,
        desc: "Ab wann der Cashflow positiv wird",
      },
      {
        label: "Finanzierung & DSCR",
        value: score.subscores.financing,
        desc: "Belastung des Cashflows durch Zins und Tilgung",
      },
      {
        label: "Upside-Potenzial",
        value: score.subscores.upside,
        desc: "Zusätzliche Chancen wie Umwidmung oder Ausbau",
      },
      {
        label: "Datenqualität",
        value: score.subscores.dataQuality,
        desc: "Vollständigkeit und Verlässlichkeit der Eingaben",
      },
    ],
    [score]
  );

  const barColor = (label: string, v: number) => {
    if (label === "Miet-Delta") {
      const d = score.rentDeltaPct;
      if (d > 0) return "bg-emerald-500";
      if (d < -0.1) return "bg-red-500";
      if (d < 0) return "bg-orange-500";
      return "bg-orange-500";
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
      {items.map(({ label, value, desc }) => (
        <div key={label} className="space-y-1" title={desc}>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{label}</span>
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
