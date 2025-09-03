"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioResult, ExitScenarioWarning, ExitScenarioInputs } from "@/types/exit-scenarios";
import { 
  TrendingUp, 
  // TrendingDown, 
  DollarSign, 
  // Percent, 
  // Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface ExitScenarioResultsProps {
  result: ExitScenarioResult;
  warnings: ExitScenarioWarning[];
  inputs: ExitScenarioInputs; // Für zusätzliche Transparenz
}

export function ExitScenarioResults({ result, warnings, inputs }: ExitScenarioResultsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("de-AT", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;



  const getWarningIcon = (typ: string) => {
    switch (typ) {
      case "risiko": return <AlertTriangle className="h-4 w-4" />;
      case "steuer": return <DollarSign className="h-4 w-4" />;
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
      {/* Hauptkennzahlen */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-5 w-5" />
            Verkauf-Szenario Ergebnisse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {formatPercent(result.irr)}
              </div>
              <div className="text-sm text-gray-600">IRR</div>
              <InfoTooltip content="Interne Rendite - jährliche Rendite der Investition. Formel: IRR wird durch iterative Berechnung ermittelt, bei der der Barwert aller Cashflows (inkl. Exit-Erlös) gleich null ist." />
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {formatPercent(result.roi)}
              </div>
              <div className="text-sm text-gray-600">ROI</div>
              <InfoTooltip content="Return on Investment - Gesamtrendite über die Haltedauer. Formel: ROI = (Gesamterlös - Eigenkapital) / Eigenkapital × 100%" />
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(result.gesamtErloes)}
              </div>
              <div className="text-sm text-gray-600">Gesamterlös</div>
              <InfoTooltip content="Gesamterlös aus dem Verkauf. Formel: Gesamterlös = (Verkaufspreis - Restschuld) + kumulierter FCF" />
            </div>
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

      {/* Detaillierte Berechnung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detaillierte Berechnung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Eingabeparameter */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Eingabeparameter:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Kaufpreis:</span>
                    <span className="font-mono">{formatCurrency(inputs?.kaufpreis || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eigenkapital:</span>
                    <span className="font-mono">{formatCurrency(inputs?.eigenkapital || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Darlehenssumme:</span>
                    <span className="font-mono">{formatCurrency(inputs?.darlehenStart || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wohnfläche:</span>
                    <span className="font-mono">{inputs?.wohnflaeche || 0} m²</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Exit-Jahr:</span>
                    <span className="font-mono">{result.exitJahr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verkaufspreis-Typ:</span>
                    <span className="font-mono">{inputs?.verkaufspreisTyp === 'pauschal' ? 'Pauschal' : 'Pro m²'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verkaufspreis:</span>
                    <span className="font-mono">{formatCurrency(result.verkaeuferpreis)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Steuersatz:</span>
                    <span className="font-mono">{inputs?.steuersatz || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Berechnungsformel */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Berechnungsformel:</h4>
              <p className="text-lg font-mono text-blue-600">
                Gesamterlös = (Verkaufspreis - Restschuld) + kumulierter FCF
              </p>
            </div>

            {/* Detaillierte Aufschlüsselung */}
            <div className="space-y-6">
              {/* Restschuld-Berechnung */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Restschuld-Berechnung nach {result.exitJahr} Jahren:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Darlehenssumme (Start):</span>
                    <span className="font-mono">{formatCurrency(inputs?.darlehenStart || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gesamte Tilgungen ({result.exitJahr} Jahre):</span>
                    <span className="font-mono">-{formatCurrency(result.jaehrlicheTilgung.slice(0, result.exitJahr).reduce((sum, t) => sum + t, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gesamte Zinsen ({result.exitJahr} Jahre):</span>
                    <span className="font-mono">-{formatCurrency(result.jaehrlicheZinsen.slice(0, result.exitJahr).reduce((sum, z) => sum + z, 0))}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Restschuld nach {result.exitJahr} Jahren:</span>
                    <span className="font-mono">{formatCurrency(result.restschuld)}</span>
                  </div>
                </div>
              </div>

              {/* Kumulierter FCF-Berechnung */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Kumulierter FCF-Berechnung nach {result.exitJahr} Jahren:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Initiale Investition (Jahr 0):</span>
                    <span className="font-mono">{formatCurrency(result.jaehrlicheCashflows[0])}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium">Jährliche Cashflows (aus Cashflow-Detail-Tabelle):</span>
                    {result.jaehrlicheCashflows.slice(1, result.exitJahr + 1).map((cf, index) => {
                      const jahr = index + 1;
                      const mieteinnahmen = inputs?.jaehrlicheMieteinnahmen?.[index] || 0;
                      const betriebskosten = inputs?.jaehrlicheBetriebskosten?.[index] || 0;
                      const zinsen = inputs?.jaehrlicheZinsen?.[index] || 0;
                      const tilgung = inputs?.jaehrlicheTilgung?.[index] || 0;
                      
                      return (
                        <div key={index} className="ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                          <div className="flex justify-between font-medium">
                            <span>Jahr {jahr} (FCF):</span>
                            <span className="font-mono">{formatCurrency(cf)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>+ Mieteinnahmen:</span>
                              <span className="font-mono">{formatCurrency(mieteinnahmen)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>- Betriebskosten:</span>
                              <span className="font-mono">-{formatCurrency(betriebskosten)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>- Zinsen:</span>
                              <span className="font-mono">-{formatCurrency(zinsen)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>- Tilgung:</span>
                              <span className="font-mono">-{formatCurrency(tilgung)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-medium text-sm">
                            <span>= Free Cash Flow:</span>
                            <span className="font-mono">{formatCurrency(cf)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Kumulierter FCF nach {result.exitJahr} Jahren:</span>
                    <span className="font-mono">{formatCurrency(result.kumulierterFCF)}</span>
                  </div>
                </div>
              </div>

              {/* Verkaufskomponenten */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Verkaufskomponenten:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Verkaufspreis:</span>
                      <span className="font-mono">{formatCurrency(result.verkaeuferpreis)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restschuld:</span>
                      <span className="font-mono">-{formatCurrency(result.restschuld)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Verkaufserlös:</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(result.verkaeuferpreis - result.restschuld)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Kosten & Steuern:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="space-y-1">
                      <span className="font-medium">Exit-Kosten-Aufschlüsselung:</span>
                      <div className="ml-4 space-y-1">
                        <div className="flex justify-between">
                          <span>Maklerprovision ({inputs?.maklerprovision || 0}%):</span>
                          <span className="font-mono">-{formatCurrency(result.verkaeuferpreis * (inputs?.maklerprovision || 0) / 100)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Gesamte Exit-Kosten:</span>
                          <span className="font-mono">-{formatCurrency(result.exitKosten)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Notarkosten und Grunderwerbsteuer werden nicht berücksichtigt.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium">Steuerlast-Berechnung:</span>
                      <div className="ml-4 space-y-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Steuern werden in dieser Berechnung nicht berücksichtigt.</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Für eine detaillierte Steuerberechnung konsultieren Sie bitte einen Steuerberater.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Netto-Exit-Erlös:</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(result.nettoExitErloes)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gesamtergebnis */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Gesamterlös:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(result.gesamtErloes)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                (Verkaufspreis - Restschuld) + kumulierter FCF = {formatCurrency(result.verkaeuferpreis - result.restschuld)} + {formatCurrency(result.kumulierterFCF)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

