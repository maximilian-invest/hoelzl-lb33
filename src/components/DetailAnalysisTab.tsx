"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/InfoTooltip";
import { InvestmentScoreSection } from "@/components/InvestmentScore/Section";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface DetailAnalysisTabProps {
  // Chart data
  chartData: unknown[];
  compareEquityData: unknown[];
  valueGrowthData: unknown[];
  valueGrowthTable: Array<{
    Jahr: number;
    Wert: number;
    Zuwachs: number;
    ZuwachsPct: number;
  }>;
  
  // Financial data
  fin: {
    annuitaet: number;
    einnahmenJ1: number;
    einnahmenWachstum: number;
  };
  cfg: {
    wertSteigerung: number;
    kaufpreis: number;
  };
  cfPosAb: number;
  bkJ1: number;
  laufzeitAuto: number;
  PLAN_30Y: Array<{
    fcf: number;
    tilgung: number;
    restschuld: number;
  }>;
  PLAN_LAUFZEIT: Array<{
    einnahmen: number;
    fcf: number;
    jahr: number;
    zins: number;
    tilgung: number;
    annuitaet: number;
    restschuld: number;
    ausgaben: number;
  }>;
  investUnlevered: number;
  nkInLoan: boolean;
  NKabs: number;
  V0: number;
  L0: number;
  
  // Utility functions
  fmtEUR: (n: number) => string;
  formatPercent: (n: number) => string | null;
  
  // Investment Score
  score: import("@/types/score").ScoreResult;
  metrics: import("@/types/score").ContextMetrics;
  
  // Kennzahlen & Metriken
  selectedCards: string[];
  availableCards: Record<string, {
    title: string;
    tooltip?: string;
    content: React.ReactNode;
    controls?: React.ReactNode;
  }>;
  showCardSelector: boolean;
  onShowCardSelector: (show: boolean) => void;
}

export function DetailAnalysisTab({
  chartData,
  // compareEquityData,
  valueGrowthData,
  valueGrowthTable,
  fin,
  cfg,
  cfPosAb,
  bkJ1,
  laufzeitAuto,
  PLAN_30Y,
  PLAN_LAUFZEIT,
  investUnlevered,
  nkInLoan,
  NKabs,
  V0,
  L0,
  fmtEUR,
  formatPercent,
  score,
  metrics,
  selectedCards,
  availableCards,
  // showCardSelector,
  onShowCardSelector,
}: DetailAnalysisTabProps) {
  return (
    <div className="pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        {/* Tab Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Detailanalyse
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Umfassende Analyse deines Immobilieninvestments mit detaillierten Charts, 
            Cashflow-Entwicklung und Wertsteigerungsprognosen.
          </p>
        </div>

        {/* Investment Score */}
        <div className="mb-8">
          <InvestmentScoreSection score={score} metrics={metrics} />
        </div>

        {/* Kennzahlen & Metriken */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schnellübersicht</h2>
            <button
              onClick={() => onShowCardSelector(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Cards verwalten
            </button>
          </div>
          
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:[--card-h:240px] md:[--card-h:260px] lg:[--card-h:260px]">
            {selectedCards.map((cardKey) => {
              const card = availableCards[cardKey];
              if (!card) return null;
              
              return (
                <Card key={cardKey} className="text-white shadow-lg border border-gray-700 rounded-2xl h-[var(--card-h)] transition-all duration-200 hover:shadow-xl relative overflow-hidden">
                  {/* Hintergrundbild mit Overlay für bessere Lesbarkeit */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
                    style={{
                      backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWU0MDY2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAzNzBmMztzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDY2NmNjO3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudCkiIC8+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyNTAiIHI9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-900/80 to-slate-800/85"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-base flex items-center gap-2 font-semibold text-white">
                      {card.title}
                      <InfoTooltip content={card.tooltip} />
                    </CardTitle>
                    {card.controls && card.controls}
                  </CardHeader>
                  <CardContent className="pt-0 text-white relative z-10">
                    {card.content}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        {/* Charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 [--card-h:350px] sm:[--card-h:300px] lg:[--card-h:360px]">
          <Card className="h-[var(--card-h)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">FCF-Entwicklung (Jahr 1–15)</CardTitle>
                <InfoTooltip content={`Positiver Cashflow ab Jahr ${cfPosAb || "–"} (Annuität ${fmtEUR(fin.annuitaet)}, BK ${fmtEUR(bkJ1)} p.a.).`} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-[200px] sm:min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <AreaChart data={chartData} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="fcf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={50} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    <Legend />
                    <Area type="monotone" dataKey="FCF" name="Freier Cashflow" stroke="#06b6d4" fill="url(#fcf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[var(--card-h)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Restschuld vs. Immobilienwert (konservativ)</CardTitle>
                <InfoTooltip content={`Wertsteigerung aktuell ${Math.round(cfg.wertSteigerung * 100)}% p.a. auf Kaufpreis unterstellt.`} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-[200px] sm:min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <LineChart data={chartData} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={50} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    <Legend />
                    <Line type="monotone" dataKey="Restschuld" stroke="#4338ca" name="Restschuld" strokeWidth={2} />
                    <Line type="monotone" dataKey="Immobilienwert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[var(--card-h)] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>Wertzuwachs der Immobilie</CardTitle>
                <InfoTooltip content="Zeigt die Entwicklung des Immobilienwerts über die Jahre basierend auf der unterstellten Wertsteigerung." />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-[200px] sm:min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <LineChart data={valueGrowthData} margin={{ left: 0, right: 5, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={50} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    <Legend />
                    <Line type="monotone" dataKey="Wert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[var(--card-h)] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>Wertzuwachs der Immobilie</CardTitle>
                <InfoTooltip content="Detaillierte Tabelle mit dem Wertzuwachs der Immobilie über die Jahre, einschließlich absoluter und prozentualer Veränderungen." />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto border border-slate-200 rounded">
                <div className="min-w-[320px] sm:min-w-[420px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <tr className="text-left text-slate-500">
                        <th className="py-1 pr-3">Jahr</th>
                        <th className="py-1 pr-3">Wert</th>
                        <th className="py-1 pr-3">Zuwachs ggü. Start</th>
                        <th className="py-1 pr-3">Zuwachs %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valueGrowthTable.map((r) => (
                        <tr key={r.Jahr} className="border-t border-slate-200">
                          <td className="py-1 pr-3">{r.Jahr}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.Wert)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.Zuwachs)}</td>
                          <td className="py-1 pr-3">{formatPercent(r.ZuwachsPct) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5/10/15 Jahre Equity & Zuwachs Vergleich */}
        <section className="mt-8">
          {(() => {
            const points = [5, 10, 15] as const;
            const rows = points.map((p) => {
              const Vt = cfg.kaufpreis * Math.pow(1 + (cfg.wertSteigerung || 0), p);
              const cumFcfT = PLAN_30Y.slice(0, p).reduce((s, r) => s + r.fcf, 0);
              const cumTilgungT = PLAN_30Y.slice(0, p).reduce((s, r) => s + r.tilgung, 0);
              const zuwachs = cumTilgungT + (Vt - cfg.kaufpreis) + cumFcfT;
              
              // Eingesetztes Eigenkapital abziehen (EK₀) - gleiche Formel wie Vermögenszuwachs
              const initialEquity = (nkInLoan ? cfg.kaufpreis : cfg.kaufpreis + NKabs) - L0;
              const nettoZuwachs = zuwachs - initialEquity;
              
              return {
                Periode: `${p} J.`,
                Equity: Vt - PLAN_30Y[p - 1].restschuld,
                Zuwachs: nettoZuwachs,
                Restschuld: PLAN_30Y[p - 1].restschuld,
                Wertzuwachs: Vt - cfg.kaufpreis,
              };
            });

            return (
              <Card className="h-[400px] flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle>5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</CardTitle>
                    <InfoTooltip content={`Definition: Equity = Marktwert − Restschuld, Netto-Zuwachs = ΣWertzuwachs + ΣTilgung + ΣFCF - EK₀ (${fmtEUR((nkInLoan ? cfg.kaufpreis : cfg.kaufpreis + NKabs) - L0)}).`} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-full min-h-[200px] sm:min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                      <LineChart data={rows} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Periode" />
                        <YAxis tickFormatter={(v) => {
                          const num = typeof v === "number" ? v : Number(v);
                          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                          if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                          return num.toString();
                        }} width={50} />
                        <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                        <Legend />
                        <Line type="monotone" dataKey="Equity" name="Immobilien-Equity" stroke="#0ea5e9" strokeWidth={2} />
                        <Line type="monotone" dataKey="Zuwachs" name="Netto-Vermögenszuwachs" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </section>

        {/* Cashflow Detail */}
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Cashflow‑Detail (Auszug Jahre 1–{laufzeitAuto || 30})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Jahr</th>
                      <th className="py-2 pr-3">Zinsen</th>
                      <th className="py-2 pr-3">Tilgung</th>
                      <th className="py-2 pr-3">Annuität</th>
                      <th className="py-2 pr-3">Restschuld</th>
                      <th className="py-2 pr-3">Einnahmen</th>
                      <th className="py-2 pr-3">Ausgaben</th>
                      <th className="py-2 pr-3">FCF</th>
                      <th className="py-2 pr-3">ROI</th>
                      <th className="py-2 pr-3">ROE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_LAUFZEIT.map((r) => {
                      // Jährlicher ROI: (Einnahmen - BK) / Investition
                      const jaehrlicherROI = investUnlevered > 0 ? (r.einnahmen - bkJ1) / investUnlevered : 0;
                      
                      // Jährlicher ROE: FCF / Eigenkapital
                      const ek0 = (nkInLoan ? V0 : V0 + NKabs) - L0;
                      const jaehrlicherROE = ek0 > 0 ? r.fcf / ek0 : 0;
                      
                      return (
                        <tr key={r.jahr} className="border-t">
                          <td className="py-1 pr-3">{r.jahr}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.zins)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.tilgung)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.annuitaet)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.restschuld)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.einnahmen)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.ausgaben)}</td>
                          <td className={`py-1 pr-3 font-medium ${r.fcf > 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtEUR(r.fcf)}</td>
                          <td className={`py-1 pr-3 font-medium ${jaehrlicherROI > 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPercent(jaehrlicherROI)}</td>
                          <td className={`py-1 pr-3 font-medium ${jaehrlicherROE > 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPercent(jaehrlicherROE)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Annuität {fmtEUR(fin.annuitaet)} p.a. | BK {fmtEUR(bkJ1)} p.a. | Einnahmen starten bei {fmtEUR(fin.einnahmenJ1)} und wachsen mit {Math.round(fin.einnahmenWachstum * 100)}% p.a.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}