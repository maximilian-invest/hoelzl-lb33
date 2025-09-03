"use client";

import React, { useState, useEffect } from "react";
import { ExitScenarios } from "@/components/ExitScenarios";
import { ExitScenarioInputs } from "@/types/exit-scenarios";

export default function ExitScenariosDemo() {
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);
  // Demo-Daten für die Exit-Szenarien - statische Werte um Hydration-Probleme zu vermeiden
  const demoInputs: Partial<ExitScenarioInputs> = {
    kaufpreis: 500000,
    nebenkosten: 25000,
    darlehenStart: 400000,
    eigenkapital: 125000,
    exitJahr: 10,
    verkaufspreisTyp: "pauschal" as const,
    maklerprovision: 5,
    steuersatz: 25,
    abschreibung: 2,
    wohnflaeche: 100,
    jaehrlicheMieteinnahmen: Array(30).fill(30000),
    jaehrlicheBetriebskosten: Array(30).fill(8000),
    jaehrlicheTilgung: Array(30).fill(20000),
    jaehrlicheZinsen: Array(30).fill(16000),
    propertyValueByYear: Array(30).fill(500000),
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Exit-Szenarien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Exit-Szenarien Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Diese Demo zeigt die Exit-Szenarien Funktionalität mit vordefinierten Beispiel-Daten.
          </p>
        </div>
        
        <ExitScenarios 
          initialInputs={demoInputs}
        />
      </div>
    </div>
  );
}
