"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Euro, Calculator } from 'lucide-react';
import { HouseholdCalcResult } from '@/types/household';
import { InfoTooltip } from './InfoTooltip';

interface HouseholdSummaryCardProps {
  result: HouseholdCalcResult | null;
}

export function HouseholdSummaryCard({ result }: HouseholdSummaryCardProps) {
  if (!result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Tragfähigkeitsprüfung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Bitte füllen Sie das Formular aus, um die Tragfähigkeitsprüfung durchzuführen.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { computed, assumptions } = result;
  
  // Entscheidung mit visueller Darstellung
  const getDecisionDisplay = () => {
    if (computed.overallPass) {
      return {
        icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
        title: "✅ Tragfähig",
        description: "Der Kredit ist tragfähig",
        badge: <Badge className="bg-green-100 text-green-800 border-green-200">Tragfähig</Badge>,
        bgColor: "bg-green-50 border-green-200"
      };
    } else if (computed.passNominal) {
      return {
        icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
        title: "⚠️ Stress-Test nicht bestanden",
        description: "Nominal tragfähig, aber Stress-Test nicht bestanden",
        badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Bedingt tragfähig</Badge>,
        bgColor: "bg-yellow-50 border-yellow-200"
      };
    } else {
      return {
        icon: <XCircle className="w-8 h-8 text-red-600" />,
        title: "❌ Nicht tragfähig",
        description: "Der Kredit ist nicht tragfähig",
        badge: <Badge className="bg-red-100 text-red-800 border-red-200">Nicht tragfähig</Badge>,
        bgColor: "bg-red-50 border-red-200"
      };
    }
  };

  const decision = getDecisionDisplay();

  // Formatierung für EUR
  const formatEUR = (amount: number) => 
    new Intl.NumberFormat('de-AT', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(amount);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Tragfähigkeitsprüfung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entscheidung */}
        <div className={`p-4 rounded-lg border-2 ${decision.bgColor}`}>
          <div className="flex items-center gap-3 mb-3">
            {decision.icon}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{decision.title}</h3>
              <p className="text-sm text-gray-600">{decision.description}</p>
            </div>
            {decision.badge}
          </div>
        </div>

        {/* Hauptkennzahlen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Einkommen & Ausgaben</h4>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Angepasstes Einkommen
                <InfoTooltip content="Einkommen nach Abzug der Bank-Haircuts" />
              </span>
              <span className="font-mono font-medium">{formatEUR(computed.adjustedIncome)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm">
                <TrendingDown className="w-4 h-4 text-red-600" />
                Fixkosten inkl. Pauschalen
                <InfoTooltip content="Alle Fixkosten plus Bank-Pauschalen für Lebenshaltung" />
              </span>
              <span className="font-mono font-medium">{formatEUR(computed.fixedCosts)}</span>
            </div>
            
            <div className="flex justify-between items-center border-t pt-2">
              <span className="flex items-center gap-2 font-medium">
                <Euro className="w-4 h-4 text-blue-600" />
                Überschuss vor Kredit
                <InfoTooltip content="Verfügbarer Betrag vor Berücksichtigung der neuen Kreditrate" />
              </span>
              <span className="font-mono font-bold text-lg">
                {formatEUR(computed.surplus)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Kredit & Tragfähigkeit</h4>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Kreditrate (nominal)</span>
              <span className="font-mono font-medium">{formatEUR(computed.annuity)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Kreditrate (Stress +{assumptions.stressInterestAddPct}%)</span>
              <span className="font-mono font-medium">{formatEUR(computed.annuityStress)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm">
                DSCR
                <InfoTooltip content="Debt Service Coverage Ratio - Verhältnis von Überschuss zu Kreditrate" />
              </span>
              <span className="font-mono font-medium">{computed.dscr.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Puffer-Analyse */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Puffer-Analyse</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Puffer nominal</span>
                <span className={`font-mono font-medium ${computed.bufferAfterNominal >= assumptions.minMonthlyBuffer ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEUR(computed.bufferAfterNominal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Puffer Stress-Test</span>
                <span className={`font-mono font-medium ${computed.bufferAfterStress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEUR(computed.bufferAfterStress)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Mindestpuffer</span>
                <span className="font-mono font-medium">{formatEUR(assumptions.minMonthlyBuffer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Anteil Fixkosten</span>
                <span className="font-mono font-medium">{computed.fixedCostShare.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maximaler Kredit */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Maximal leistbarer Kredit
            <InfoTooltip content="Maximaler Kreditbetrag basierend auf dem verfügbaren Überschuss und Mindestpuffer" />
          </h4>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono">
            {formatEUR(computed.maxLoan)}
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Bei {assumptions.nominalInterestPct}% Zinsen und {assumptions.termYears} Jahren Laufzeit
          </p>
        </div>

        {/* Annahmen */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Annahmen:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Pauschale pro Erwachsener: {formatEUR(assumptions.pauschalePerAdult)}/Monat</li>
            <li>Pauschale pro Kind: {formatEUR(assumptions.pauschalePerChild)}/Monat</li>
            <li>Haircuts: Selbständige {assumptions.haircut.selfEmployedPct}%, Miete {assumptions.haircut.rentalPct}%, Sonstige {assumptions.haircut.otherPct}%</li>
            <li>Stress-Test: +{assumptions.stressInterestAddPct}% Zinsen</li>
            <li>Mindestpuffer: {formatEUR(assumptions.minMonthlyBuffer)}/Monat</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
