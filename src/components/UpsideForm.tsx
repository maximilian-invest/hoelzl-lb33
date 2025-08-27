import React from "react";
import { Button } from "@/components/ui/button";
import UpsideCard from "@/components/UpsideCard";
import type { UpsideScenario } from "@/lib/upside";

interface UpsideFormProps {
  scenarios: UpsideScenario[];
  add: () => void;
  update: (id: string, patch: Partial<UpsideScenario>) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
}

export function UpsideForm({
  scenarios,
  add,
  update,
  duplicate,
  remove,
}: UpsideFormProps) {
  return (
    <div>
      {scenarios.map((s) => (
        <UpsideCard
          key={s.id}
          scenario={s}
          onChange={(patch) => update(s.id, patch)}
          onDuplicate={() => duplicate(s.id)}
          onDelete={() => remove(s.id)}
        />
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1">
        Upside hinzufügen
      </Button>
    </div>
  );
}

export default UpsideForm;
