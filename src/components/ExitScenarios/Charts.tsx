"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioComparison } from "@/types/exit-scenarios";
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

interface ExitScenarioChartsProps {
  vergleich: ExitScenarioComparison;
}

export function ExitScenarioCharts({ vergleich }: ExitScenarioChartsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("de-AT", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getStrategyLabel = (strategy: string) => {
    const labels: { [key: string]: string } = {
      verkauf: "Verkauf",
      refinanzierung: "Refinanzierung", 
      buy_and_hold: "Buy & Hold",
      fix_and_flip: "Fix & Flip",
      exchange_1031: "1031 Exchange",
      wholesaling: "Wholesaling",
      rent_to_own: "Rent-to-Own",
      vererbung: "Vererbung"
    };
    return labels[strategy] || strategy;
  };

  const getStrategyColor = (strategy: string) => {
    const colors: { [key: string]: string } = {
      verkauf: "#3B82F6", // blue
      refinanzierung: "#10B981", // green
      buy_and_hold: "#F59E0B", // yellow
      fix_and_flip: "#EF4444", // red
      exchange_1031: "#8B5CF6", // purple
      wholesaling: "#06B6D4", // cyan
      rent_to_own: "#F97316", // orange
      vererbung: "#6B7280" // gray
    };
    return colors[strategy] || "#6B7280";
  };

  // Cashflow-Chart Daten vorbereiten
  const cashflowChartData = [];
  const maxYears = Math.max(...vergleich.szenarien.map(s => s.jaehrlicheCashflows.length));
  
  for (let year = 0; year < maxYears; year++) {
    const dataPoint: any = { jahr: year };
    
    vergleich.szenarien.forEach(szenario => {
      const cashflow = szenario.jaehrlicheCashflows[year] || 0;
      dataPoint[getStrategyLabel(szenario.strategie)] = cashflow;
    });
    
    cashflowChartData.push(dataPoint);
  }

  // Kumulierte Cashflow-Chart Daten
  const kumulierteCashflowChartData = [];
  for (let year = 0; year < maxYears; year++) {
    const dataPoint: any = { jahr: year };
    
    vergleich.szenarien.forEach(szenario => {
      const kumuliert = szenario.kumulierteCashflows[year] || 0;
      dataPoint[getStrategyLabel(szenario.strategie)] = kumuliert;
    });
    
    kumulierteCashflowChartData.push(dataPoint);
  }

  // IRR-Vergleich Chart
  const irrComparisonData = vergleich.szenarien.map(szenario => ({
    strategie: getStrategyLabel(szenario.strategie),
    irr: szenario.irr,
    roi: szenario.roi,
    npv: szenario.npv / 1000, // In Tausend Euro für bessere Darstellung
    color: getStrategyColor(szenario.strategie)
  }));

  // Sensitivitätsanalyse Chart
  const sensitivitaetData = [];
  const preisVariationen = ["-20%", "-10%", "+10%", "+20%"];
  
  vergleich.szenarien.forEach(szenario => {
    const strategieLabel = getStrategyLabel(szenario.strategie);
    const color = getStrategyColor(szenario.strategie);
    
    preisVariationen.forEach(variation => {
      const irrWert = szenario.sensitivitaet.preisVariation[variation];
      if (irrWert !== undefined) {
        sensitivitaetData.push({
          strategie: strategieLabel,
          variation: variation,
          irr: irrWert,
          color: color
        });
      }
    });
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">Jahr {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const IRRComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'irr' && `${entry.dataKey.toUpperCase()}: ${formatPercent(entry.value)}`}
              {entry.dataKey === 'roi' && `${entry.dataKey.toUpperCase()}: ${formatPercent(entry.value)}`}
              {entry.dataKey === 'npv' && `NPV: ${formatCurrency(entry.value * 1000)}`}
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
            <InfoTooltip content="Zeigt die jährlichen Cashflows für jede Exit-Strategie" />
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
              <Legend />
              {vergleich.szenarien.map((szenario, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={getStrategyLabel(szenario.strategie)}
                  stroke={getStrategyColor(szenario.strategie)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
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
            <InfoTooltip content="Zeigt die kumulierten Cashflows über die Zeit" />
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
              <Legend />
              {vergleich.szenarien.map((szenario, index) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={getStrategyLabel(szenario.strategie)}
                  stackId="1"
                  stroke={getStrategyColor(szenario.strategie)}
                  fill={getStrategyColor(szenario.strategie)}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* IRR & ROI Vergleich */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Rendite-Vergleich
            <InfoTooltip content="Vergleich der wichtigsten Rendite-Kennzahlen" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={irrComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="strategie" />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatPercent(value)}
                label={{ value: 'IRR & ROI (%)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tickFormatter={(value) => formatCurrency(value * 1000)}
                label={{ value: 'NPV (€)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<IRRComparisonTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="irr" 
                fill="#3B82F6" 
                name="IRR (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="left"
                dataKey="roi" 
                fill="#10B981" 
                name="ROI (%)"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="npv" 
                stroke="#EF4444" 
                strokeWidth={3}
                name="NPV (€)"
                dot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sensitivitätsanalyse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sensitivitätsanalyse - Preisvariation
            <InfoTooltip content="Zeigt wie sich die IRR bei verschiedenen Preisänderungen entwickelt" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={sensitivitaetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="variation" 
                label={{ value: 'Preisvariation', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                tickFormatter={(value) => formatPercent(value)}
                label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatPercent(value), 'IRR']}
                labelFormatter={(label) => `Preisvariation: ${label}`}
              />
              <Legend />
              {vergleich.szenarien.map((szenario, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey="irr"
                  stroke={getStrategyColor(szenario.strategie)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={getStrategyLabel(szenario.strategie)}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

