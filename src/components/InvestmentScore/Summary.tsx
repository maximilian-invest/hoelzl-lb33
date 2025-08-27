"use client";

import { FC } from "react";

interface SummaryProps {
  total: number;
  grade: string;
}

export const Summary: FC<SummaryProps> = ({ total, grade }) => (
  <div className="flex items-baseline gap-4">
    <span className="text-4xl font-bold">{Math.round(total)}</span>
    <span className="text-2xl font-semibold text-slate-500 dark:text-slate-400">
      {grade}
    </span>
  </div>
);
