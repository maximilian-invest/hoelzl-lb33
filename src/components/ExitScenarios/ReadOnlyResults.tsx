"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExitScenarioInputs } from "@/types/exit-scenarios";
import { berechneVerkaufSzenario } from "@/lib/exit-scenarios";

interface ReadOnlyExitResultsProps {
  inputs: ExitScenarioInputs;
}

export function ReadOnlyExitResults({ inputs }: ReadOnlyExitResultsProps) {
  // Berechne die Ergebnisse basierend auf den Eingaben
  const result = berechneVerkaufSzenario(inputs);

  const fmtEUR = (value: number) => new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  const fmtPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Hauptkennzahlen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800">IRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900 break-words">
              {fmtPercent(result.irr)}
            </div>
            <p className="text-sm text-blue-700">Interne Rendite</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-800">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-900 break-words">
              {fmtPercent(result.roi)}
            </div>
            <p className="text-sm text-green-700">Return on Investment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-800">Gesamterlös</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900 break-words">
              {fmtEUR(result.gesamtErloes)}
            </div>
            <p className="text-sm text-purple-700">Nach {result.exitJahr} Jahren</p>
          </CardContent>
        </Card>
      </div>

      {/* Verkaufsdetails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Verkaufsdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-1 min-w-0">Verkaufspreis:</span>
                <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.verkaeuferpreis)}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-1 min-w-0">Restschuld:</span>
                <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.restschuld)}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-1 min-w-0">Netto-Exit-Erlös:</span>
                <span className="font-semibold text-green-600 text-right flex-shrink-0">{fmtEUR(result.nettoExitErloes)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-1 min-w-0">Gesamtkosten:</span>
                <span className="font-semibold text-red-600 text-right flex-shrink-0">{fmtEUR(result.exitKosten)}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-1 min-w-0">Kumulierter FCF:</span>
                <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.kumulierterFCF)}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-1 min-w-0">Gesamterlös:</span>
                <span className="font-semibold text-blue-600 text-right flex-shrink-0">{fmtEUR(result.gesamtErloes)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kostenaufschlüsselung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kostenaufschlüsselung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 flex-1 min-w-0">Maklerprovision ({inputs.maklerprovision}%):</span>
              <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.kostenAufschlüsselung.maklerprovision)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 flex-1 min-w-0">Sanierungskosten:</span>
              <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.kostenAufschlüsselung.sanierungskosten)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 flex-1 min-w-0">Notarkosten:</span>
              <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.kostenAufschlüsselung.notarkosten)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 flex-1 min-w-0">Grunderwerbsteuer:</span>
              <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.kostenAufschlüsselung.grunderwerbsteuer)}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 flex-1 min-w-0">Weitere Kosten:</span>
              <span className="font-semibold text-right flex-shrink-0">{fmtEUR(result.kostenAufschlüsselung.weitereKosten)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-start gap-2 font-bold text-lg">
              <span className="flex-1 min-w-0">Gesamtkosten:</span>
              <span className="text-red-600 text-right flex-shrink-0">{fmtEUR(result.kostenAufschlüsselung.gesamtKosten)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reines Verkaufsszenario Hinweis */}
      {inputs.reinesVerkaufsszenario && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg text-orange-800">Reines Verkaufsszenario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              In diesem Modus werden nur die Verkaufsergebnisse angezeigt. 
              Laufende Einnahmen und Cashflows sind nicht berücksichtigt.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
