"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExitScenario, ExitScenarioInputs } from "@/types/exit-scenarios";
import { useMultiExitScenarios } from "@/hooks/useMultiExitScenarios";
import { ExitScenarioForm } from "./Form";
import { ExitScenarioResults } from "./Results";
import { 
  Plus, 
  Play, 
  BarChart3, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface SimplifiedExitScenariosProps {
  initialInputs?: Partial<ExitScenarioInputs>;
  onClose?: () => void;
}

type Step = "overview" | "create";

export function SimplifiedExitScenarios({ initialInputs, onClose }: SimplifiedExitScenariosProps) {
  const [currentStep, setCurrentStep] = useState<Step>("overview");
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
    reset
  } = useMultiExitScenarios();

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  // Erstelle Standard-Inputs
  const createDefaultInputs = (): ExitScenarioInputs => ({
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
  });

  const handleCreateScenario = () => {
    const id = addScenario(createDefaultInputs(), "Neues Szenario", "");
    setActiveScenario(id);
    setEditingScenarioId(id);
    setCurrentStep("create");
  };

  const handleEditScenario = (id: string) => {
    setActiveScenario(id);
    setEditingScenarioId(id);
    setCurrentStep("create");
  };

  const handleCalculateScenario = async (id: string) => {
    setIsCalculating(true);
    try {
      await calculateScenario(id);
    } catch (error) {
      console.error("Fehler bei der Berechnung:", error);
      alert("Fehler bei der Berechnung des Szenarios.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      await calculateAllScenarios();
    } catch (error) {
      console.error("Fehler bei der Berechnung:", error);
      alert("Fehler bei der Berechnung aller Szenarien.");
    } finally {
      setIsCalculating(false);
    }
  };

  const getScenarioStatus = (scenario: ExitScenario) => {
    if (!scenario.result) return { status: "pending", icon: Clock, color: "text-yellow-600", label: "Nicht berechnet" };
    if (scenario.warnings && scenario.warnings.some(w => w.schweregrad === "hoch")) {
      return { status: "warning", icon: AlertCircle, color: "text-red-600", label: "Warnungen" };
    }
    return { status: "success", icon: CheckCircle2, color: "text-green-600", label: "Berechnet" };
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

  // Übersicht - Hauptansicht
  if (currentStep === "overview") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Exit-Szenarien
              </CardTitle>
              <div className="flex items-center gap-2">
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Schließen
                  </Button>
                )}
                {scenarios.length > 0 && (
                  <Button variant="outline" onClick={reset}>
                    Zurücksetzen
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Aktions-Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button onClick={handleCreateScenario} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Neues Szenario erstellen</span>
                  <span className="sm:hidden">Neues Szenario</span>
                </Button>
                {scenarios.length > 0 && (
                  <Button onClick={handleCalculateAll} variant="outline" disabled={isCalculating}>
                    <Play className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Alle berechnen</span>
                    <span className="sm:hidden">Alle berechnen</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Szenario-Liste */}
        {scenarios.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Noch keine Exit-Szenarien
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Erstellen Sie Ihr erstes Exit-Szenario, um verschiedene Verkaufsstrategien für Ihre Immobilie zu analysieren.
              </p>
              <Button onClick={handleCreateScenario} size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
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
                <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{scenario.name}</h3>
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                          <Badge variant="secondary" className="text-xs">
                            {status.label}
                          </Badge>
                        </div>
                        
                        {scenario.description && (
                          <p className="text-gray-600 mb-3">{scenario.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
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
                      </div>
                      
                      <div className="flex flex-row sm:flex-col gap-2 ml-0 sm:ml-4 mt-4 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditScenario(scenario.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Settings className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Bearbeiten</span>
                        </Button>
                        {scenario.result ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveScenario(scenario.id);
                              setCurrentStep("create");
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            <BarChart3 className="h-4 w-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">Ergebnisse</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCalculateScenario(scenario.id)}
                            disabled={isCalculating}
                            className="flex-1 sm:flex-none"
                          >
                            <Play className="h-4 w-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">Berechnen</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateScenario(scenario.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Copy className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Kopieren</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteScenario(scenario.id)}
                          className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Löschen</span>
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
    );
  }

  // Erstellen/Bearbeiten - Einfaches Formular
  if (currentStep === "create" && activeScenario) {
    return (
      <div className="space-y-6">
        {/* Header mit Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {editingScenarioId ? "Szenario bearbeiten" : "Neues Szenario"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setCurrentStep("overview")}>
                  ← Zurück zur Übersicht
                </Button>
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Schließen
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Formular */}
        <ExitScenarioForm
          initialInputs={activeScenario.inputs}
          onSubmit={(inputs) => {
            updateScenario(activeScenario.id, { inputs });
            setCurrentStep("overview");
          }}
          onCancel={() => setCurrentStep("overview")}
          onInputChange={(inputs) => {
            updateScenario(activeScenario.id, { inputs });
          }}
          propertyValueByYear={activeScenario.inputs.propertyValueByYear}
          scenarioName={activeScenario.name}
          scenarioDescription={activeScenario.description}
          onNameChange={(name) => updateScenario(activeScenario.id, { name })}
          onDescriptionChange={(description) => updateScenario(activeScenario.id, { description })}
        />

        {/* Ergebnisse anzeigen, wenn vorhanden */}
        {activeScenario.result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Berechnungsergebnisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExitScenarioResults
                result={activeScenario.result}
                warnings={activeScenario.warnings || []}
                inputs={activeScenario.inputs}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }


  return null;
}
