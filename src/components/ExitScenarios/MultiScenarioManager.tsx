"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExitScenario, ExitScenarioInputs } from "@/types/exit-scenarios";
import { useMultiExitScenarios } from "@/hooks/useMultiExitScenarios";
import { 
  Plus, 
  Copy, 
  Trash2, 
  Play, 
  BarChart3, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { ExitScenarioForm } from "./Form";
import { ExitScenarioResults } from "./Results";

type ViewMode = "list" | "form" | "results";

interface MultiScenarioManagerProps {
  initialInputs?: Partial<ExitScenarioInputs>;
  onClose?: () => void;
}

export function MultiScenarioManager({ initialInputs, onClose }: MultiScenarioManagerProps) {
  const [currentView, setCurrentView] = useState<ViewMode>("list");
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    scenarios,
    activeScenarioId,
    addScenario,
    updateScenario,
    duplicateScenario,
    deleteScenario,
    setActiveScenario,
    calculateScenario,
    calculateAllScenarios,
    getActiveScenario,
    reset
  } = useMultiExitScenarios();

  const activeScenario = getActiveScenario();

  const handleAddScenario = (inputs: ExitScenarioInputs, name?: string, description?: string) => {
    const id = addScenario(inputs, name, description);
    setActiveScenario(id);
    setCurrentView("form");
    setEditingScenarioId(id);
  };

  const handleEditScenario = (id: string) => {
    setActiveScenario(id);
    setCurrentView("form");
    setEditingScenarioId(id);
  };

  const handleViewResults = (id: string) => {
    setActiveScenario(id);
    setCurrentView("results");
  };

  const handleCalculateScenario = async (id: string) => {
    setIsCalculating(true);
    try {
      await calculateScenario(id);
    } catch (error) {
      console.error("Fehler bei der Berechnung:", error);
      alert("Fehler bei der Berechnung des Szenarios. Bitte versuchen Sie es erneut.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      await calculateAllScenarios();
    } catch (error) {
      console.error("Fehler bei der Berechnung aller Szenarien:", error);
      alert("Fehler bei der Berechnung. Einige Szenarien konnten nicht berechnet werden.");
    } finally {
      setIsCalculating(false);
    }
  };

  const getScenarioStatus = (scenario: ExitScenario) => {
    if (!scenario.result) return { status: "pending", icon: Clock, color: "text-yellow-600" };
    if (scenario.warnings && scenario.warnings.some(w => w.schweregrad === "hoch")) {
      return { status: "warning", icon: AlertCircle, color: "text-red-600" };
    }
    return { status: "success", icon: CheckCircle2, color: "text-green-600" };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Multi-Exit-Szenarien
            </CardTitle>
            <div className="flex items-center gap-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Schließen
                </Button>
              )}
              <Button variant="outline" onClick={reset}>
                Zurücksetzen
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === "list" ? "default" : "outline"}
                onClick={() => setCurrentView("list")}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Übersicht
              </Button>
              {activeScenario && (
                <>
                  <Button
                    variant={currentView === "form" ? "default" : "outline"}
                    onClick={() => setCurrentView("form")}
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant={currentView === "results" ? "default" : "outline"}
                    onClick={() => setCurrentView("results")}
                    size="sm"
                    disabled={!activeScenario.result}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ergebnisse
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  const defaultInputs: ExitScenarioInputs = {
                    kaufpreis: 500000,
                    nebenkosten: 25000,
                    darlehenStart: 400000,
                    eigenkapital: 125000,
                    wohnflaeche: 100,
                    exitJahr: 10,
                    reinesVerkaufsszenario: false,
                    verkaufspreisTyp: "pauschal",
                    maklerprovision: 5,
                    sanierungskosten: 0,
                    notarkosten: 0,
                    grunderwerbsteuer: 0,
                    weitereKosten: 0,
                    steuersatz: 0,
                    abschreibung: 0,
                    propertyValueByYear: Array(31).fill(0),
                    jaehrlicheMieteinnahmen: Array(31).fill(0),
                    jaehrlicheBetriebskosten: Array(31).fill(0),
                    jaehrlicheTilgung: Array(31).fill(0),
                    jaehrlicheZinsen: Array(31).fill(0),
                    ...initialInputs
                  };
                  const id = addScenario(defaultInputs, "Neues Szenario", "");
                  setActiveScenario(id);
                  setCurrentView("form");
                  setEditingScenarioId(id);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neues Szenario
              </Button>
              {scenarios.length > 0 && (
                <Button
                  onClick={handleCalculateAll}
                  variant="outline"
                  size="sm"
                  disabled={isCalculating}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Alle berechnen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="min-h-[600px]">
        {currentView === "list" && (
          <div className="space-y-4">
            {scenarios.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Keine Exit-Szenarien vorhanden
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Erstellen Sie Ihr erstes Exit-Szenario, um verschiedene Verkaufsstrategien zu analysieren.
                  </p>
                  <Button onClick={() => {
                    const defaultInputs: ExitScenarioInputs = {
                      kaufpreis: 500000,
                      nebenkosten: 25000,
                      darlehenStart: 400000,
                      eigenkapital: 125000,
                      wohnflaeche: 100,
                      exitJahr: 10,
                      reinesVerkaufsszenario: false,
                      verkaufspreisTyp: "pauschal",
                      maklerprovision: 5,
                      sanierungskosten: 0,
                      notarkosten: 0,
                      grunderwerbsteuer: 0,
                      weitereKosten: 0,
                      steuersatz: 0,
                      abschreibung: 0,
                      propertyValueByYear: Array(31).fill(0),
                      jaehrlicheMieteinnahmen: Array(31).fill(0),
                      jaehrlicheBetriebskosten: Array(31).fill(0),
                      jaehrlicheTilgung: Array(31).fill(0),
                      jaehrlicheZinsen: Array(31).fill(0),
                      ...initialInputs
                    };
                    const id = addScenario(defaultInputs, "Neues Szenario", "");
                    setActiveScenario(id);
                    setCurrentView("form");
                    setEditingScenarioId(id);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erstes Szenario erstellen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {scenarios.map((scenario) => {
                  const status = getScenarioStatus(scenario);
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={scenario.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{scenario.name}</h3>
                              <StatusIcon className={`h-5 w-5 ${status.color}`} />
                              {scenario.aktiv && (
                                <Badge variant="secondary">Aktiv</Badge>
                              )}
                            </div>
                            
                            {scenario.description && (
                              <p className="text-gray-600 mb-3">{scenario.description}</p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Exit-Jahr:</span>
                                <div className="font-semibold">{scenario.inputs.exitJahr}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Kaufpreis:</span>
                                <div className="font-semibold">{formatCurrency(scenario.inputs.kaufpreis)}</div>
                              </div>
                              {scenario.result && (
                                <>
                                  <div>
                                    <span className="text-gray-500">IRR:</span>
                                    <div className="font-semibold text-green-600">
                                      {formatPercentage(scenario.result.irr)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">ROI:</span>
                                    <div className="font-semibold text-blue-600">
                                      {formatPercentage(scenario.result.roi)}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-2">
                              Erstellt: {new Date(scenario.erstelltAm).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditScenario(scenario.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            {scenario.result ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewResults(scenario.id)}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCalculateScenario(scenario.id)}
                                disabled={isCalculating}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateScenario(scenario.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteScenario(scenario.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === "form" && activeScenario && (
          <ExitScenarioForm
            initialInputs={activeScenario.inputs}
            onSubmit={(inputs) => {
              updateScenario(activeScenario.id, { inputs });
              setCurrentView("list");
            }}
            onCancel={() => setCurrentView("list")}
            onInputChange={(inputs) => {
              updateScenario(activeScenario.id, { inputs });
            }}
            propertyValueByYear={activeScenario.inputs.propertyValueByYear}
            scenarioName={activeScenario.name}
            scenarioDescription={activeScenario.description}
            onNameChange={(name) => updateScenario(activeScenario.id, { name })}
            onDescriptionChange={(description) => updateScenario(activeScenario.id, { description })}
          />
        )}

        {currentView === "results" && activeScenario && activeScenario.result && (
          <ExitScenarioResults
            result={activeScenario.result}
            warnings={activeScenario.warnings || []}
            inputs={activeScenario.inputs}
          />
        )}

      </div>

      {/* Loading Overlay */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <CardContent className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span>Berechne Szenarien...</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
