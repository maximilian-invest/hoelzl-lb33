"use client";

import { FC } from "react";
import { ContextMetrics } from "@/types/score";
import { InfoTooltip } from "@/components/InfoTooltip";
import { formatPercent } from "@/lib/format";

interface Props {
  metrics: ContextMetrics;
}

export const ContextFacts: FC<Props> = ({ metrics }) => {
  const irrVal = formatPercent(metrics.irr);
  return (
    <div className="mt-4 rounded-md border p-3 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-2">
      <div className="flex items-center gap-1">
        <span className="font-semibold">DSCR</span>
        <InfoTooltip metric="DSCR" />
        <span className="ml-1">{metrics.dscr.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">IRR</span>
        <InfoTooltip metric="IRR" />
        {irrVal ? (
          <span className="ml-1">{irrVal}</span>
        ) : (
          <span className="ml-1 flex items-center gap-1">
            —<InfoTooltip content="IRR nicht berechenbar (Prüfe Cashflows)" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">Preis-Discount</span>
        <InfoTooltip metric="Preis-Discount" />
        <span className="ml-1">{Math.round(metrics.priceDiscount * 100)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-semibold">Cashflow positiv ab Jahr</span>
        <InfoTooltip metric="Positiv ab Jahr" />
        <span className="ml-1">{metrics.cfPosAb || "–"}</span>
      </div>
    </div>
  );
};
