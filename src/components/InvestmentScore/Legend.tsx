"use client";

import { FC } from "react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ScoreResult } from "@/types/score";

interface LegendProps {
  score?: ScoreResult;
}

export const Legend: FC<LegendProps> = () => {
  return (
    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1 mb-1">
        <span className="font-semibold">Gesamtscore-Legende (0–100)</span>
        <InfoTooltip metric="Gesamtscore" />
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>&gt;=75</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-orange-500" />
          <span>50-74</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-500" />
          <span>&lt;50</span>
        </div>
      </div>
    </div>
  );
};
