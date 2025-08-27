import { useCallback, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { UpsideScenario, UpsideCalculationResult } from "@/lib/upside";
import { calculateUpside } from "@/lib/upside";

export interface UseUpsideResult extends UpsideCalculationResult {
  scenarios: UpsideScenario[];
  add: () => void;
  update: (id: string, patch: Partial<UpsideScenario>) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
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
  const [scenarios, setScenarios] = useState<UpsideScenario[]>([]);

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
    ...result,
  };
}

export default useUpside;
