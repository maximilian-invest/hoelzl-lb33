"use client";

import { FC } from "react";
import { ContextMetrics } from "@/types/score";

interface Props {
  metrics: ContextMetrics;
}

export const ContextFacts: FC<Props> = ({ metrics }) => (
  <div className="mt-4 rounded-md border p-3 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-2">
    <div><span className="font-semibold">DSCR:</span> {metrics.dscr.toFixed(2)}</div>
    <div>
      <span className="font-semibold">IRR:</span> {(metrics.irr * 100).toFixed(1)}%
    </div>
    <div>
      <span className="font-semibold">Preis-Premium:</span> {Math.round(metrics.pricePremium * 100)}%
    </div>
    <div>
      <span className="font-semibold">Positiv ab Jahr:</span> {metrics.cfPosAb || "–"}
    </div>
  </div>
);
