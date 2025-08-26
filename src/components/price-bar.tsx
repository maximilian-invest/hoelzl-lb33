"use client";

import * as React from "react";

export type PriceBarProps = {
  /** Einstiegspreis €/m² (z. B. Kaufpreis / Fläche) */
  value: number;
  /** Ø-Preis €/m² (z. B. Gnigl) */
  avg: number;
  /** optionaler Max-Anker für die Skala (falls du die Skala künstlich deckeln willst) */
  max?: number;
  /** optional extra styles */
  className?: string;
  /** Beschriftungen */
  labelLeft?: string;
  labelRight?: string;
  /** Custom Formatter (default: de-AT, gerundet) */
  format?: (n: number) => string;
};

const defaultFmt = (n: number) =>
  new Intl.NumberFormat("de-AT").format(Math.round(n));

export function PriceBar({
  value,
  avg,
  max,
  className,
  labelLeft = "Einstieg",
  labelRight = "Ø Gnigl",
  format = defaultFmt,
}: PriceBarProps) {
  // etwas Headroom, damit Marker nicht am rechten Rand kleben
  const upper = Math.max(value, avg, max ?? 0) * 1.25;
  const pct = (n: number) =>
    `${Math.min(100, Math.max(0, (n / upper) * 100))}%`;

  return (
    <div className={`mt-4 select-none ${className ?? ""}`}>
      <div className="text-xs text-slate-500 mb-1">
        Preis je m² – Einstieg vs. Ø Salzburg (Gnigl)
      </div>

      <div className="relative h-3 rounded-full bg-slate-200">
        {/* gefüllte Leiste bis zum Einstiegspreis */}
        <div
          className="absolute left-0 top-0 h-3 rounded-full bg-emerald-300"
          style={{ width: pct(value) }}
        />
        {/* Marker Einstieg */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `calc(${pct(value)} - 6px)` }}
        >
          <div className="h-3 w-3 rounded-full bg-emerald-600 border-2 border-white shadow" />
        </div>
        {/* Marker Ø */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `calc(${pct(avg)} - 6px)` }}
        >
          <div className="h-3 w-3 rounded-full bg-indigo-600 border-2 border-white shadow" />
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs">
        <span className="text-emerald-700">
          {labelLeft}: {format(value)} €/m²
        </span>
        <span className="text-indigo-700">
          {labelRight}: {format(avg)} €/m²
        </span>
      </div>
    </div>
  );
}
