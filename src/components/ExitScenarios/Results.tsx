"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioComparison, ExitScenarioResult, ExitScenarioWarning } from "@/types/exit-scenarios";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface ExitScenarioResultsProps {
  vergleich: ExitScenarioComparison;
  warnings: ExitScenarioWarning[];
}

export function ExitScenarioResults({ vergleich, warnings }: ExitScenarioResultsProps) {
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "niedrig": return "bg-green-100 text-green-800";
      case "mittel": return "bg-yellow-100 text-yellow-800";
      case "hoch": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getWarningIcon = (typ: string) => {
    switch (typ) {
      case "risiko": return <AlertTriangle className="h-4 w-4" />;
      case "steuer": return <DollarSign className="h-4 w-4" />;
      case "markt": return <TrendingDown className="h-4 w-4" />;
      case "liquiditaet": return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getWarningColor = (schweregrad: string) => {
    switch (schweregrad) {
      case "niedrig": return "border-yellow-200 bg-yellow-50";
      case "mittel": return "border-orange-200 bg-orange-50";
      case "hoch": return "border-red-200 bg-red-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Empfehlung */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-5 w-5" />
            Empfehlung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge className={`px-3 py-1 ${getRiskColor(vergleich.empfehlung.risikobewertung)}`}>
                {vergleich.empfehlung.risikobewertung.toUpperCase()}
              </Badge>
              <span className="font-semibold text-lg">
                {getStrategyLabel(vergleich.empfehlung.besteStrategie)}
              </span>
            </div>
            <p className="text-gray-700">{vergleich.empfehlung.begruendung}</p>
          </div>
        </CardContent>
      </Card>

      {/* Warnungen */}
      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Warnungen & Risiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((warning, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${getWarningColor(warning.schweregrad)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-orange-600 mt-0.5">
                      {getWarningIcon(warning.typ)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{warning.nachricht}</span>
                        <Badge variant="outline" className="text-xs">
                          {warning.schweregrad}
                        </Badge>
                      </div>
                      {warning.empfehlung && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Empfehlung:</strong> {warning.empfehlung}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Szenario-Vergleich */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Szenario-Vergleich
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Strategie</th>
                  <th className="text-right p-3 font-semibold">
                    IRR
                    <InfoTooltip content="Interne Rendite - jährliche Rendite der Investition" />
                  </th>
                  <th className="text-right p-3 font-semibold">
                    ROI
                    <InfoTooltip content="Return on Investment - Gesamtrendite über die Haltedauer" />
                  </th>
                  <th className="text-right p-3 font-semibold">
                    NPV
                    <InfoTooltip content="Net Present Value - Barwert der Investition" />
                  </th>
                  <th className="text-right p-3 font-semibold">
                    Cash-on-Cash
                    <InfoTooltip content="Jährliche Rendite auf das eingesetzte Eigenkapital" />
                  </th>
                  <th className="text-right p-3 font-semibold">
                    Exit-Wert
                    <InfoTooltip content="Wert der Immobilie zum Exit-Zeitpunkt" />
                  </th>
                  <th className="text-right p-3 font-semibold">
                    Netto-Erlös
                    <InfoTooltip content="Netto-Erlös nach Kosten und Steuern" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {vergleich.szenarien.map((szenario, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getStrategyLabel(szenario.strategie)}
                        </span>
                        {szenario.strategie === vergleich.empfehlung.besteStrategie && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Empfohlen
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-3">
                      <span className={`font-mono ${szenario.irr > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(szenario.irr)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <span className={`font-mono ${szenario.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(szenario.roi)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <span className={`font-mono ${szenario.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(szenario.npv)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <span className={`font-mono ${szenario.cashOnCashReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(szenario.cashOnCashReturn)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <span className="font-mono">
                        {formatCurrency(szenario.exitWert)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      <span className="font-mono">
                        {formatCurrency(szenario.nettoExitErloes)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detaillierte Ergebnisse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vergleich.szenarien.map((szenario, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStrategyLabel(szenario.strategie)}
                {szenario.strategie === vergleich.empfehlung.besteStrategie && (
                  <Badge className="bg-green-100 text-green-800">
                    Beste Option
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Hauptkennzahlen */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercent(szenario.irr)}
                    </div>
                    <div className="text-sm text-gray-600">IRR</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPercent(szenario.roi)}
                    </div>
                    <div className="text-sm text-gray-600">ROI</div>
                  </div>
                </div>

                {/* Weitere Kennzahlen */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>NPV:</span>
                    <span className="font-mono">{formatCurrency(szenario.npv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash-on-Cash Return:</span>
                    <span className="font-mono">{formatPercent(szenario.cashOnCashReturn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback Period:</span>
                    <span className="font-mono">{szenario.paybackPeriod} Jahre</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break-Even Jahr:</span>
                    <span className="font-mono">{szenario.breakEvenJahr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-mono">{formatPercent(szenario.maxDrawdown)}</span>
                  </div>
                </div>

                {/* Exit-Details */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Exit-Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Exit-Wert:</span>
                      <span className="font-mono">{formatCurrency(szenario.exitWert)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exit-Kosten:</span>
                      <span className="font-mono">{formatCurrency(szenario.exitKosten)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Steuerlast:</span>
                      <span className="font-mono">{formatCurrency(szenario.steuerlast)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Netto-Erlös:</span>
                      <span className="font-mono">{formatCurrency(szenario.nettoExitErloes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

