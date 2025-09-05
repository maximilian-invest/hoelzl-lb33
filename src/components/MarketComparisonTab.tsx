"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
import { DISTRICT_PRICES, type District } from "@/types/districts";

interface MarketComparisonTabProps {
  kaufpreis: number;
  totalFlaeche: number;
  stadtteil: District;
  onStadtteilChange: (stadtteil: District) => void;
  address?: string;
}

const fmt = (n: number): string => new Intl.NumberFormat("de-AT").format(n);

export function MarketComparisonTab({ 
  kaufpreis, 
  totalFlaeche, 
  stadtteil, 
  onStadtteilChange,
}: MarketComparisonTabProps) {
  const kaufpreisProM2 = kaufpreis / totalFlaeche;
  
  const avgPreisBestand = DISTRICT_PRICES.bestand.find((d) => d.ort === stadtteil)?.preis ?? 0;
  const avgPreisNeubau = DISTRICT_PRICES.neubau.find((d) => d.ort === stadtteil)?.preis ?? 0;

  return (
    <div className="pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        {/* Tab Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Marktvergleich
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Vergleiche dein Investment mit den aktuellen Marktpreisen in Salzburg. 
            Hier siehst du sowohl Bestand- als auch Neubau-Preise für alle Stadtteile.
          </p>
        </div>


        <div className="grid md:grid-cols-2 gap-6">
          {/* Bestand Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Marktvergleich Salzburg - Bestand (Auszug)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm mb-2">Aus deinem Spreadsheet (Ø‑Preis Bestand, €/m²):</p>
                <ul className="list-disc pl-5 grid grid-cols-1 gap-x-6 text-sm max-h-64 overflow-y-auto">
                  {DISTRICT_PRICES.bestand.map((r) => (
                    <li
                      key={r.ort}
                      className={`flex items-center justify-between border-b py-1 cursor-pointer ${
                        r.ort === stadtteil ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => onStadtteilChange(r.ort)}
                    >
                      <span>{r.ort}</span>
                      <span className={`font-medium ${
                        r.ort === stadtteil ? "text-indigo-600" : ""
                      }`}>
                        {fmt(r.preis)} €/m²
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 border dark:border-slate-700">
                <p className="mb-2 text-sm">Unser Einstiegspreis (kaufpreis / m²):</p>
                <div className="text-2xl font-semibold">{fmt(Math.round(kaufpreisProM2))} €/m²</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Im Direktvergleich liegt der Einstieg{" "}
                  {kaufpreisProM2 < avgPreisBestand ? "unter" : "über"} dem Ø‑Preis für{" "}
                  <b>{stadtteil} ({fmt(avgPreisBestand)} €/m²)</b>
                  {kaufpreisProM2 < avgPreisBestand 
                    ? " und deutlich unter vielen Stadtlagen." 
                    : "."
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Neubau Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Marktvergleich Salzburg - Neubau (Auszug)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm mb-2">Aus deinem Spreadsheet (Ø‑Preis Neubau, €/m²):</p>
                <ul className="list-disc pl-5 grid grid-cols-1 gap-x-6 text-sm max-h-64 overflow-y-auto">
                  {DISTRICT_PRICES.neubau.map((r) => (
                    <li
                      key={r.ort}
                      className={`flex items-center justify-between border-b py-1 cursor-pointer ${
                        r.ort === stadtteil ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => onStadtteilChange(r.ort)}
                    >
                      <span>{r.ort}</span>
                      <span className={`font-medium ${
                        r.ort === stadtteil ? "text-indigo-600" : ""
                      }`}>
                        {fmt(r.preis)} €/m²
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 border dark:border-slate-700">
                <p className="mb-2 text-sm">Unser Einstiegspreis (kaufpreis / m²):</p>
                <div className="text-2xl font-semibold">{fmt(Math.round(kaufpreisProM2))} €/m²</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Im Direktvergleich liegt der Einstieg{" "}
                  {kaufpreisProM2 < avgPreisNeubau ? "unter" : "über"} dem Ø‑Preis für{" "}
                  <b>{stadtteil} ({fmt(avgPreisNeubau)} €/m²)</b>
                  {kaufpreisProM2 < avgPreisNeubau 
                    ? " und deutlich unter vielen Stadtlagen." 
                    : "."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
