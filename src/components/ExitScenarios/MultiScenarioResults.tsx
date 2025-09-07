"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExitScenario } from "@/types/exit-scenarios";
import { useMultiExitScenarios } from "@/hooks/useMultiExitScenarios";
import { ReadOnlyExitResults } from "./ReadOnlyResults";
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Copy,
  Trash2
} from "lucide-react";

interface MultiScenarioResultsProps {
  onEditScenario?: (scenarioId: string) => void;
}

export function MultiScenarioResults({ onEditScenario }: MultiScenarioResultsProps) {
  const { scenarios, calculateScenario, duplicateScenario, deleteScenario } = useMultiExitScenarios();
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const [isCalculating, setIsCalculating] = useState(false);

  const toggleExpanded = (scenarioId: string) => {
    setExpandedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
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

  const getScenarioStatus = (scenario: ExitScenario) => {
    if (!scenario.result) return { status: "pending", icon: Clock, color: "text-yellow-600", label: "Nicht berechnet" };
    if (scenario.warnings && scenario.warnings.some(w => w.schweregrad === "hoch")) {
      return { status: "warning", icon: AlertCircle, color: "text-red-600", label: "Warnungen" };
    }
    return { status: "success", icon: CheckCircle2, color: "text-green-600", label: "Berechnet" };
  };


  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Keine Exit-Szenarien vorhanden
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Erstellen Sie Exit-Szenarien, um verschiedene Verkaufsstrategien zu analysieren.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => {
        const status = getScenarioStatus(scenario);
        const StatusIcon = status.icon;
        const isExpanded = expandedScenarios.has(scenario.id);
        
        return (
          <Card key={scenario.id} className="hover:shadow-md transition-shadow">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(scenario.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{scenario.name}</h3>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${status.color} flex-shrink-0`} />
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {status.label}
                    </Badge>
                  </div>
                  {scenario.description && (
                    <span className="text-sm text-gray-600 truncate">- {scenario.description}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {scenario.result && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm text-gray-500">IRR: {formatPercentage(scenario.result.irr)}</div>
                      <div className="text-xs sm:text-sm text-gray-500">ROI: {formatPercentage(scenario.result.roi)}</div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(scenario.id);
                    }}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Szenario-Aktionen */}
                  <div className="flex flex-wrap items-center gap-2 pb-4 border-b">
                    {!scenario.result ? (
                      <Button
                        onClick={() => handleCalculateScenario(scenario.id)}
                        disabled={isCalculating}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Berechnen</span>
                        <span className="sm:hidden">Berechnen</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onEditScenario?.(scenario.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Bearbeiten</span>
                        <span className="sm:hidden">Bearbeiten</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => duplicateScenario(scenario.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Duplizieren</span>
                      <span className="sm:hidden">Kopieren</span>
                    </Button>
                    <Button
                      onClick={() => deleteScenario(scenario.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Löschen</span>
                      <span className="sm:hidden">Löschen</span>
                    </Button>
                  </div>

                  {/* Ergebnisse anzeigen */}
                  {scenario.result ? (
                    <ReadOnlyExitResults inputs={scenario.inputs} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Dieses Szenario wurde noch nicht berechnet.</p>
                      <p className="text-sm">Klicken Sie auf &quot;Berechnen&quot;, um die Ergebnisse zu sehen.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
