"use client";

import { FC } from "react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface SummaryProps {
  total: number;
  grade: string;
}

export const Summary: FC<SummaryProps> = ({ total, grade }) => (
  <div className="flex items-baseline gap-4">
    <span className="text-4xl font-bold">{Math.round(total)}</span>
    <span className="text-2xl font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
      {grade}
      <InfoTooltip content="Notenskala: A ≥ 85, B 75–84, C 65–74, D 55–64, E < 55" />
    </span>
  </div>
);
