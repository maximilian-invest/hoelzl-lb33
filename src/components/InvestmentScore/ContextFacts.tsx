"use client";

import { FC } from "react";
import { ContextMetrics } from "@/types/score";
import { InfoTooltip } from "@/components/InfoTooltip";
import { formatPercent } from "@/lib/format";
import { formatDeltaSigned } from "@/lib/delta";

interface Props {
  metrics: ContextMetrics;
}

export const ContextFacts: FC<Props> = ({ metrics }) => {
  const irrVal = formatPercent(metrics.irr);
  const discountVal = formatPercent(metrics.priceDiscount);
  return (
    <div className="mt-4 rounded-md border p-3 text-xs text-white grid grid-cols-2 gap-2 relative overflow-hidden">
      {/* Hintergrundbild mit Overlay für bessere Lesbarkeit */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWU0MDY2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAzNzBmMztzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDY2NmNjO3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudCkiIC8+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyNTAiIHI9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-slate-800/80"></div>
      <div className="relative z-10">
      <div className="flex items-center gap-1">
        <span className="font-semibold">DSCR</span>
        <InfoTooltip metric="DSCR" />
        <span className="ml-1">{metrics.dscr.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">Miet-Delta</span>
        <InfoTooltip metric="Miet-Delta" />
        <span className="ml-1">{formatDeltaSigned(metrics.rentDeltaPct)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">IRR</span>
        <InfoTooltip metric="IRR" />
        {irrVal ? (
          <span className="ml-1">{irrVal}</span>
        ) : (
          <span className="ml-1 flex items-center gap-1">
            —
            <InfoTooltip content="IRR nicht berechenbar (z. B. fehlender negativer Start-Cashflow oder zu kurze Laufzeit)" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">Preis-Discount</span>
        <InfoTooltip metric="Preis-Discount" />
        <span className="ml-1">{discountVal ?? "—"}</span>
      </div>
        <div className="flex items-center gap-1 col-span-2">
          <span className="font-semibold">
            Freier Cashflow nach Schuldendienst positiv ab Jahr
          </span>
          <InfoTooltip metric="Positiv ab Jahr" />
          <span className="ml-1">{metrics.cfPosAb || "–"}</span>
        </div>
      </div>
    </div>
  );
};
