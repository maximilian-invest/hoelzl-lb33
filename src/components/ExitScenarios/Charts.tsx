"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioResult } from "@/types/exit-scenarios";
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  // Legend,
  // BarChart,
  // Bar,
  // ComposedChart,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

interface ExitScenarioChartsProps {
  result: ExitScenarioResult;
}

export function ExitScenarioCharts({ result }: ExitScenarioChartsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("de-AT", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Cashflow-Chart Daten vorbereiten
  const cashflowChartData = result.jaehrlicheCashflows.map((cashflow, index) => ({
    jahr: index,
    cashflow: cashflow
  }));

  // Kumulierte Cashflow-Chart Daten
  const kumulierteCashflowChartData = result.kumulierteCashflows.map((kumuliert, index) => ({
    jahr: index,
    kumuliert: kumuliert
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">Jahr {label}</p>
          {payload.map((entry: unknown, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Jährliche Cashflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Jährliche Cashflows
            <InfoTooltip content="Zeigt die jährlichen Cashflows des Verkauf-Szenarios. Formel: FCF = Mieteinnahmen - Betriebskosten - Zinsen - Tilgung" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cashflowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="jahr" 
                label={{ value: 'Jahr', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Cashflow (€)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cashflow"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Jährlicher Cashflow"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Kumulierte Cashflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Kumulierte Cashflows
            <InfoTooltip content="Zeigt die kumulierten Cashflows über die Zeit. Formel: Kumulierter FCF = Summe aller jährlichen FCF bis zum Exit-Jahr" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={kumulierteCashflowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="jahr" 
                label={{ value: 'Jahr', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Kumulierter Cashflow (€)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="kumuliert"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Kumulierter Cashflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rendite-Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Rendite-Übersicht
            <InfoTooltip content="Wichtigste Rendite-Kennzahlen des Verkauf-Szenarios. IRR: Jährliche Rendite, ROI: Gesamtrendite, Gesamterlös: Verkaufserlös + kumulierter FCF" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercent(result.irr)}
              </div>
              <div className="text-sm text-gray-600">IRR</div>
              <InfoTooltip content="Interne Rendite - jährliche Rendite der Investition. Formel: IRR wird durch iterative Berechnung ermittelt, bei der der Barwert aller Cashflows (inkl. Exit-Erlös) gleich null ist." />
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatPercent(result.roi)}
              </div>
              <div className="text-sm text-gray-600">ROI</div>
              <InfoTooltip content="Return on Investment - Gesamtrendite über die Haltedauer. Formel: ROI = (Gesamterlös - Eigenkapital) / Eigenkapital × 100%" />
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(result.gesamtErloes)}
              </div>
              <div className="text-sm text-gray-600">Gesamterlös</div>
              <InfoTooltip content="Gesamterlös aus dem Verkauf. Formel: Gesamterlös = (Verkaufspreis - Restschuld) + kumulierter FCF" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

