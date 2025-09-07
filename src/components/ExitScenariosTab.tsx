"use client";

import React, { useState, useEffect } from "react";
import { ExitScenarios } from "@/components/ExitScenarios";
import { ExitScenarioInputs } from "@/types/exit-scenarios";

interface ExitScenariosTabProps {
  initialInputs: ExitScenarioInputs;
  address?: string;
  onReinesVerkaufsszenarioChange?: (isReinesVerkaufsszenario: boolean) => void;
  onExitScenarioInputsChange?: (inputs: ExitScenarioInputs) => void;
  onExitScenarioReportCreated?: () => void;
}

export function ExitScenariosTab({ initialInputs, onReinesVerkaufsszenarioChange, onExitScenarioInputsChange, onExitScenarioReportCreated }: ExitScenariosTabProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="pt-20 pb-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Exit-Szenarien
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Lade Exit-Szenarien...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        {/* Tab Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Exit-Szenarien
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Plane verschiedene Exit-Strategien für dein Immobilieninvestment. 
            Analysiere Verkaufszeitpunkte, Verkaufsoptionen und potenzielle Renditen.
          </p>
        </div>


        <ExitScenarios 
          initialInputs={initialInputs} 
          onReinesVerkaufsszenarioChange={onReinesVerkaufsszenarioChange}
          onExitScenarioInputsChange={onExitScenarioInputsChange}
          onExitScenarioReportCreated={onExitScenarioReportCreated}
        />
      </div>
    </div>
  );
}
