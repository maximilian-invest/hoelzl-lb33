import React from "react";
import type { UpsideScenario, UpsideType } from "@/lib/upside";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash2 } from "lucide-react";

interface UpsideCardProps {
  scenario: UpsideScenario;
  onChange: (patch: Partial<UpsideScenario>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const TYPES: UpsideType[] = [
  "Umwidmung_Hotel",
  "Dachausbau",
  "Airbnb",
  "Sanierung_Mietanhebung",
  "Nachverdichtung",
  "Sonstiges",
];

export function UpsideCard({ scenario, onChange, onDuplicate, onDelete }: UpsideCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            value={scenario.title}
            onChange={(e) => onChange({ title: e.target.value })}
            title="Titel für dieses Upside-Szenario"
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={scenario.active}
              onChange={() => onChange({ active: !scenario.active })}
              title="Szenario aktivieren/deaktivieren"
            />
            Aktiv
          </label>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onDuplicate} title="Duplizieren">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Löschen">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col" title="Art des Upside-Potenzials">
          Art
          <select
            className="border rounded px-1 py-1"
            value={scenario.type}
            onChange={(e) => onChange({ type: e.target.value as UpsideType })}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col" title="Wie der Upside Erträge generiert">
          Ertragsart
          <select
            className="border rounded px-1 py-1"
            value={scenario.mode}
            onChange={(e) =>
              onChange({ mode: e.target.value as UpsideScenario["mode"] })
            }
          >
            <option value="add_area">Mehr Fläche</option>
            <option value="rent_increase">Miete erhöhen</option>
          </select>
        </label>
        <label className="flex flex-col" title="Ab welchem Jahr wirkt der Upside">
          Startjahr
          <input
            type="number"
            min={1}
            className="border rounded px-1 py-1"
            value={scenario.startYear}
            onChange={(e) => onChange({ startYear: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col" title="Einmalige Investition in EUR">
          CapEx €
          <input
            type="number"
            min={0}
            className="border rounded px-1 py-1"
            value={scenario.capex}
            onChange={(e) => onChange({ capex: Number(e.target.value) })}
          />
        </label>
        {scenario.mode === "add_area" ? (
          <>
            <label className="flex flex-col" title="Zusätzliche Fläche in Quadratmeter">
              +m²
              <input
                type="number"
                min={0}
                className="border rounded px-1 py-1"
                value={scenario.addedSqm}
                onChange={(e) => onChange({ addedSqm: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col" title="Miete auf die neue Fläche in EUR pro m²">
              Miete €/m²
              <input
                type="number"
                min={0}
                className="border rounded px-1 py-1"
                value={scenario.newRentPerSqm}
                onChange={(e) => onChange({ newRentPerSqm: Number(e.target.value) })}
              />
            </label>
          </>
        ) : (
          <>
            <label className="flex flex-col" title="Bestehende Fläche mit Mietsteigerung">
              m² betroffen
              <input
                type="number"
                min={0}
                className="border rounded px-1 py-1"
                value={scenario.existingSqm}
                onChange={(e) => onChange({ existingSqm: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col" title="Zusätzliche Miete in EUR pro m²">
              +€/m²
              <input
                type="number"
                min={0}
                className="border rounded px-1 py-1"
                value={scenario.rentIncreasePerSqm}
                onChange={(e) => onChange({ rentIncreasePerSqm: Number(e.target.value) })}
              />
            </label>
          </>
        )}
        <label className="flex flex-col" title="Auslastung in Prozent">
          Auslastung %
          <input
            type="number"
            min={0}
            max={100}
            className="border rounded px-1 py-1"
            value={scenario.occupancyPct}
            onChange={(e) => onChange({ occupancyPct: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col" title="Eintrittswahrscheinlichkeit in Prozent">
          Wahrscheinlichkeit %
          <input
            type="number"
            min={0}
            max={100}
            className="border rounded px-1 py-1"
            value={scenario.probabilityPct}
            onChange={(e) => onChange({ probabilityPct: Number(e.target.value) })}
          />
        </label>
      </CardContent>
    </Card>
  );
}

export default UpsideCard;
