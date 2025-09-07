import { useCallback, useMemo, useState, useEffect } from "react";
import { nanoid } from "nanoid";
import type { UpsideScenario, UpsideCalculationResult } from "@/lib/upside";
import { calculateUpside } from "@/lib/upside";
import { safeGetItem, safeSetItem } from "@/lib/storage-utils";

export interface UseUpsideResult extends UpsideCalculationResult {
  scenarios: UpsideScenario[];
  add: () => void;
  update: (id: string, patch: Partial<UpsideScenario>) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  loadScenarios: (scenarios: UpsideScenario[]) => void;
  reset: () => void;
}

const DEFAULT_SCENARIO: Omit<UpsideScenario, "id"> = {
  active: true,
  type: "Umwidmung_Hotel",
  title: "Upside 1",
  startYear: 5,
  probabilityPct: 50,
  capex: 0,
  mode: "add_area",
  addedSqm: 0,
  newRentPerSqm: 0,
  existingSqm: 0,
  rentIncreasePerSqm: 0,
  occupancyPct: 90,
  remarks: "",
};

export function useUpside(
  cashflowsBasis: number[],
  irrBasis: number
): UseUpsideResult {
  const [scenarios, setScenarios] = useState<UpsideScenario[]>(() => {
    try {
      const raw = safeGetItem("lb33_upside_scenarios");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Speichere Szenarien automatisch im localStorage
  useEffect(() => {
    const result = safeSetItem("lb33_upside_scenarios", scenarios);
    if (!result.success) {
      console.warn('Fehler beim Speichern der Upside-Szenarien:', result.error);
    }
  }, [scenarios]);

  const add = useCallback(() => {
    setScenarios((prev) => [
      ...prev,
      { ...DEFAULT_SCENARIO, id: nanoid(), title: `Upside ${prev.length + 1}` },
    ]);
  }, []);

  const update = useCallback((id: string, patch: Partial<UpsideScenario>) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const duplicate = useCallback((id: string) => {
    setScenarios((prev) => {
      const orig = prev.find((s) => s.id === id);
      if (!orig) return prev;
      return [
        ...prev,
        { ...orig, id: nanoid(), title: `${orig.title} Kopie` },
      ];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }, []);

  const loadScenarios = useCallback((scenarios: UpsideScenario[]) => {
    setScenarios(scenarios);
  }, []);

  const reset = useCallback(() => {
    setScenarios([]);
  }, []);

  const result = useMemo(
    () => calculateUpside(cashflowsBasis, irrBasis, scenarios),
    [cashflowsBasis, irrBasis, scenarios]
  );

  return {
    scenarios,
    add,
    update,
    duplicate,
    remove,
    toggle,
    loadScenarios,
    reset,
    ...result,
  };
}

export default useUpside;
