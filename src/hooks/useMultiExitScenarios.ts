"use client";

import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { ExitScenario, MultiExitScenarioState, ExitScenarioInputs, ExitScenarioResult, ExitScenarioWarning } from "@/types/exit-scenarios";
import { erstelleExitSzenarioBericht } from "@/lib/exit-scenarios";
import { safeSetItem, safeGetItem } from "@/lib/storage-utils";

const STORAGE_KEY = "lb33_multi_exit_scenarios";

export interface UseMultiExitScenariosResult {
  // State
  scenarios: ExitScenario[];
  activeScenarioId: string | null;
  
  // Scenario Management
  addScenario: (inputs: ExitScenarioInputs, name?: string, description?: string) => string;
  updateScenario: (id: string, updates: Partial<ExitScenario>) => void;
  duplicateScenario: (id: string) => string;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string | null) => void;
  
  // Calculation
  calculateScenario: (id: string) => Promise<void>;
  calculateAllScenarios: () => Promise<void>;
  
  // Utility
  getActiveScenario: () => ExitScenario | null;
  reset: () => void;
}

const DEFAULT_SCENARIO_NAME = "Exit-Szenario";

export function useMultiExitScenarios(): UseMultiExitScenariosResult {
  const [state, setState] = useState<MultiExitScenarioState>(() => {
    try {
      const saved = safeGetItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        scenarios: [],
        activeScenarioId: null
      };
    } catch {
      return {
        scenarios: [],
        activeScenarioId: null
      };
    }
  });

  // Speichere State automatisch im localStorage
  useEffect(() => {
    const result = safeSetItem(STORAGE_KEY, state);
    if (!result.success) {
      console.warn('Fehler beim Speichern der Multi-Exit-Szenarien:', result.error);
    }
  }, [state]);

  const addScenario = useCallback((inputs: ExitScenarioInputs, name?: string, description?: string): string => {
    const id = nanoid();
    const scenarioName = name || `${DEFAULT_SCENARIO_NAME} ${state.scenarios.length + 1}`;
    
    const newScenario: ExitScenario = {
      id,
      name: scenarioName,
      description,
      inputs,
      erstelltAm: new Date(),
      aktiv: true
    };

    setState(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, newScenario],
      activeScenarioId: id
    }));

    return id;
  }, [state.scenarios.length]);

  const updateScenario = useCallback((id: string, updates: Partial<ExitScenario>) => {
    setState(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }));
  }, []);

  const duplicateScenario = useCallback((id: string): string => {
    const original = state.scenarios.find(s => s.id === id);
    if (!original) return "";

    const newId = nanoid();
    const duplicatedScenario: ExitScenario = {
      ...original,
      id: newId,
      name: `${original.name} (Kopie)`,
      erstelltAm: new Date(),
      result: undefined, // Neu berechnen
      warnings: undefined
    };

    setState(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, duplicatedScenario],
      activeScenarioId: newId
    }));

    return newId;
  }, [state.scenarios]);

  const deleteScenario = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      scenarios: prev.scenarios.filter(s => s.id !== id),
      activeScenarioId: prev.activeScenarioId === id ? null : prev.activeScenarioId
    }));
  }, []);

  const setActiveScenario = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      activeScenarioId: id
    }));
  }, []);

  const calculateScenario = useCallback(async (id: string) => {
    const scenario = state.scenarios.find(s => s.id === id);
    if (!scenario) return;

    try {
      const report = erstelleExitSzenarioBericht(scenario.inputs);
      
      updateScenario(id, {
        result: report.result,
        warnings: report.warnings
      });
    } catch (error) {
      console.error(`Fehler bei der Berechnung von Szenario ${id}:`, error);
      throw error;
    }
  }, [state.scenarios, updateScenario]);

  const calculateAllScenarios = useCallback(async () => {
    const scenariosToCalculate = state.scenarios.filter(s => s.aktiv && !s.result);
    
    for (const scenario of scenariosToCalculate) {
      try {
        await calculateScenario(scenario.id);
      } catch (error) {
        console.error(`Fehler bei der Berechnung von Szenario ${scenario.id}:`, error);
      }
    }
  }, [state.scenarios, calculateScenario]);

  const getActiveScenario = useCallback((): ExitScenario | null => {
    return state.scenarios.find(s => s.id === state.activeScenarioId) || null;
  }, [state.scenarios, state.activeScenarioId]);

  const reset = useCallback(() => {
    setState({
      scenarios: [],
      activeScenarioId: null
    });
  }, []);

  return {
    // State
    scenarios: state.scenarios,
    activeScenarioId: state.activeScenarioId,
    
    // Scenario Management
    addScenario,
    updateScenario,
    duplicateScenario,
    deleteScenario,
    setActiveScenario,
    
    // Calculation
    calculateScenario,
    calculateAllScenarios,
    
    // Utility
    getActiveScenario,
    reset
  };
}
