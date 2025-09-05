"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface CompactComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: Array<{
    name: string;
    color: string;
    data: Array<{
      Jahr: number;
      FCF: number;
      Equity: number;
      Restschuld: number;
      Immobilienwert: number;
    }>;
    score: number;
    grade: string;
    irr: number | null;
    dscr: number;
    cfPosAb: number;
  }>;
  fmtEUR: (n: number) => string;
  formatPercent: (n: number) => string | null;
}

export function CompactComparisonModal({
  isOpen,
  onClose,
  scenarios,
  fmtEUR,
  formatPercent,
}: CompactComparisonModalProps) {
  if (!isOpen) return null;

  // Kombiniere Daten für Charts - alle Szenarien in einem Chart
  const combinedChartData = scenarios[0]?.data.map((_, yearIndex) => {
    const year = yearIndex + 1;
    const dataPoint: any = { Jahr: year };
    
    scenarios.forEach(scenario => {
      const yearData = scenario.data[yearIndex];
      if (yearData) {
        dataPoint[`${scenario.name}_FCF`] = yearData.FCF;
        dataPoint[`${scenario.name}_Equity`] = yearData.Equity;
      }
    });
    
    return dataPoint;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kompakter Vergleich aller Szenarien
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Investment Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.name} className="border-2" style={{ borderColor: scenario.color }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: scenario.color }}
                    />
                    {scenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                    <span className="font-semibold">{Math.round(scenario.score)} ({scenario.grade})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">IRR:</span>
                    <span className="font-semibold">
                      {scenario.irr ? formatPercent(scenario.irr) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">DSCR:</span>
                    <span className="font-semibold">{scenario.dscr.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">FCF ab Jahr:</span>
                    <span className="font-semibold">{scenario.cfPosAb}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FCF Comparison */}
            <Card className="h-80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">FCF-Entwicklung Vergleich</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={50} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    {scenarios.map((scenario) => (
                      <Line
                        key={scenario.name}
                        type="monotone"
                        dataKey={`${scenario.name}_FCF`}
                        name={scenario.name}
                        stroke={scenario.color}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Equity Comparison */}
            <Card className="h-80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Equity-Entwicklung Vergleich</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={50} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    {scenarios.map((scenario) => (
                      <Line
                        key={scenario.name}
                        type="monotone"
                        dataKey={`${scenario.name}_Equity`}
                        name={scenario.name}
                        stroke={scenario.color}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zusammenfassung nach 5, 10 und 15 Jahren</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Szenario</th>
                      <th className="py-2 pr-3">Jahr</th>
                      <th className="py-2 pr-3">FCF</th>
                      <th className="py-2 pr-3">Equity</th>
                      <th className="py-2 pr-3">Restschuld</th>
                      <th className="py-2 pr-3">Immobilienwert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 10, 15].map((year) => 
                      scenarios.map((scenario) => {
                        const yearData = scenario.data.find(d => d.Jahr === year);
                        if (!yearData) return null;
                        
                        return (
                          <tr key={`${scenario.name}-${year}`} className="border-t">
                            <td className="py-1 pr-3 flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: scenario.color }}
                              />
                              {scenario.name}
                            </td>
                            <td className="py-1 pr-3">{year}</td>
                            <td className="py-1 pr-3">{fmtEUR(yearData.FCF)}</td>
                            <td className="py-1 pr-3">{fmtEUR(yearData.Equity)}</td>
                            <td className="py-1 pr-3">{fmtEUR(yearData.Restschuld)}</td>
                            <td className="py-1 pr-3">{fmtEUR(yearData.Immobilienwert)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
