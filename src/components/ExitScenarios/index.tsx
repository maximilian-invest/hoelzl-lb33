"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExitScenarioForm } from "./Form";
import { ExitScenarioResults } from "./Results";
import { ExitScenarioCharts } from "./Charts";
import { ExitScenarioExport } from "./Export";
import { ExitScenarioInputs, ExitScenarioReport } from "@/types/exit-scenarios";
import { erstelleExitSzenarioBericht } from "@/lib/exit-scenarios";
import { 
  Calculator, 
  BarChart3, 
  FileDown, 
  RotateCcw,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

type ViewMode = "form" | "results" | "charts" | "export";

interface ExitScenariosProps {
  initialInputs?: Partial<ExitScenarioInputs>;
  onClose?: () => void;
}

export function ExitScenarios({ initialInputs, onClose }: ExitScenariosProps) {
  const [currentView, setCurrentView] = useState<ViewMode>("form");
  const [report, setReport] = useState<ExitScenarioReport | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async (inputs: ExitScenarioInputs) => {
    setIsCalculating(true);
    try {
      console.log("Starte Berechnung mit Inputs:", inputs);
      
      // Datum erst beim Berechnen generieren, nicht beim ersten Render
      const newReport = erstelleExitSzenarioBericht(inputs);
      console.log("Berechnung erfolgreich:", newReport);
      
      setReport(newReport);
      setCurrentView("results");
    } catch (error) {
      console.error("Fehler bei der Berechnung:", error);
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler bei der Berechnung";
      alert(`Fehler bei der Berechnung der Exit-Szenarien:\n\n${errorMessage}\n\nBitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setCurrentView("form");
  };

  const navigationItems = [
    { id: "form", label: "Eingabe", icon: Calculator },
    { id: "results", label: "Ergebnisse", icon: BarChart3 },
    { id: "charts", label: "Charts", icon: BarChart3 },
    { id: "export", label: "Export", icon: FileDown }
  ];

  const canNavigateTo = (view: ViewMode) => {
    if (view === "form") return true;
    return report !== null;
  };

  const getNextView = () => {
    const currentIndex = navigationItems.findIndex(item => item.id === currentView);
    const nextIndex = (currentIndex + 1) % navigationItems.length;
    return navigationItems[nextIndex].id as ViewMode;
  };

  const getPrevView = () => {
    const currentIndex = navigationItems.findIndex(item => item.id === currentView);
    const prevIndex = currentIndex === 0 ? navigationItems.length - 1 : currentIndex - 1;
    return navigationItems[prevIndex].id as ViewMode;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Exit-Szenarien Analyse
            </CardTitle>
            <div className="flex items-center gap-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Schließen
                </Button>
              )}
              {report && (
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Neu berechnen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const isDisabled = !canNavigateTo(item.id as ViewMode);
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    disabled={isDisabled}
                    onClick={() => setCurrentView(item.id as ViewMode)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView(getPrevView())}
                disabled={!canNavigateTo(getPrevView())}
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView(getNextView())}
                disabled={!canNavigateTo(getNextView())}
              >
                Weiter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="min-h-[600px]">
        {currentView === "form" && (
          <ExitScenarioForm
            initialInputs={initialInputs}
            onSubmit={handleCalculate}
            onCancel={onClose}
          />
        )}

        {currentView === "results" && report && (
          <ExitScenarioResults
            vergleich={report.vergleich}
            warnings={report.warnings}
          />
        )}

        {currentView === "charts" && report && (
          <ExitScenarioCharts
            vergleich={report.vergleich}
          />
        )}

        {currentView === "export" && report && (
          <ExitScenarioExport
            report={report}
          />
        )}
      </div>

      {/* Loading Overlay */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <CardContent className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span>Berechne Exit-Szenarien...</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">Hinweise zur Exit-Szenarien Analyse:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Die Berechnungen basieren auf den eingegebenen Parametern und aktuellen Marktbedingungen</li>
              <li>• Alle Rendite-Kennzahlen sind Schätzungen und können von der tatsächlichen Performance abweichen</li>
              <li>• Steuerliche Aspekte können je nach individueller Situation variieren</li>
              <li>• Konsultieren Sie einen Finanzberater für professionelle Beratung</li>
              <li>• Marktrisiken und unvorhersehbare Ereignisse sind nicht berücksichtigt</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
