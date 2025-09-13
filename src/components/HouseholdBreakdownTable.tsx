"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HouseholdCalcResult } from '@/types/household';
import { TrendingUp, TrendingDown, Euro, Calculator, Users, Home, Car, Shield } from 'lucide-react';

interface HouseholdBreakdownTableProps {
  result: HouseholdCalcResult | null;
}

export function HouseholdBreakdownTable({ result }: HouseholdBreakdownTableProps) {
  if (!result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Detaillierte Aufschlüsselung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Bitte füllen Sie das Formular aus, um die detaillierte Aufschlüsselung zu sehen.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { inputs, computed } = result;

  // Formatierung für EUR
  const formatEUR = (amount: number) => 
    new Intl.NumberFormat('de-AT', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(amount);

  // Berechnung der Einkommensaufschlüsselung
  const getIncomeBreakdown = () => {
    const breakdown = {
      employment: 0,
      rental: 0,
      other: 0,
      total: 0
    };

    // Erwerbseinkommen
    inputs.employmentIncomes.forEach(income => {
      let haircutPct = 0;
      switch (income.employmentType) {
        case 'employee':
          haircutPct = 0;
          break;
        case 'selfEmployed':
          haircutPct = inputs.haircut.selfEmployedPct;
          break;
        case 'pension':
          haircutPct = 0;
          break;
      }
      breakdown.employment += income.netMonthly * (1 - haircutPct / 100);
    });

    // Mieteinkommen
    inputs.rentalIncomes.forEach(income => {
      breakdown.rental += income.netMonthly * (1 - inputs.haircut.rentalPct / 100);
    });

    // Sonstige Einkommen
    inputs.otherIncomes.forEach(income => {
      breakdown.other += income.netMonthly * (1 - inputs.haircut.otherPct / 100);
    });

    breakdown.total = breakdown.employment + breakdown.rental + breakdown.other;
    return breakdown;
  };

  // Berechnung der Ausgabenaufschlüsselung
  const getExpensesBreakdown = () => {
    const breakdown = {
      housing: inputs.rentOrHousingCost,
      utilities: inputs.utilitiesEnergy,
      telecom: inputs.telecomInternet,
      insurance: inputs.insurance,
      transport: inputs.transportLeases,
      alimony: inputs.alimony,
      other: inputs.otherFixedExpenses,
      existingLoans: inputs.existingLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0),
      pauschalen: (inputs.adults * inputs.pauschalePerAdult) + (inputs.children * inputs.pauschalePerChild),
      total: 0
    };

    breakdown.total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    return breakdown;
  };

  const incomeBreakdown = getIncomeBreakdown();
  const expensesBreakdown = getExpensesBreakdown();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Detaillierte Aufschlüsselung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Einkommen */}
        <div>
          <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Einkommen (nach Haircuts)
          </h4>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="space-y-2">
              {inputs.employmentIncomes.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Erwerbseinkommen</span>
                  <span className="font-mono font-medium">{formatEUR(incomeBreakdown.employment)}</span>
                </div>
              )}
              {inputs.rentalIncomes.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mieteinkommen</span>
                  <span className="font-mono font-medium">{formatEUR(incomeBreakdown.rental)}</span>
                </div>
              )}
              {inputs.otherIncomes.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sonstige Einkommen</span>
                  <span className="font-mono font-medium">{formatEUR(incomeBreakdown.other)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-2 font-semibold">
                <span>Gesamteinkommen</span>
                <span className="font-mono">{formatEUR(incomeBreakdown.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ausgaben */}
        <div>
          <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Ausgaben
          </h4>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="space-y-2">
              {/* Wohnen */}
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Wohnen
                </span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.housing)}</span>
              </div>
              
              {/* Nebenkosten */}
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  Nebenkosten/Energie
                </span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.utilities)}</span>
              </div>
              
              {/* Telekom */}
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  Telekom/Internet
                </span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.telecom)}</span>
              </div>
              
              {/* Versicherungen */}
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Versicherungen
                </span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.insurance)}</span>
              </div>
              
              {/* Transport */}
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  Transport/Leasing
                </span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.transport)}</span>
              </div>
              
              {/* Unterhalt */}
              {expensesBreakdown.alimony > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Unterhalt</span>
                  <span className="font-mono font-medium">{formatEUR(expensesBreakdown.alimony)}</span>
                </div>
              )}
              
              {/* Sonstige */}
              <div className="flex justify-between items-center">
                <span className="text-sm">Sonstige Fixkosten</span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.other)}</span>
              </div>
              
              {/* Bestehende Kredite */}
              {expensesBreakdown.existingLoans > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bestehende Kredite</span>
                  <span className="font-mono font-medium">{formatEUR(expensesBreakdown.existingLoans)}</span>
                </div>
              )}
              
              {/* Pauschalen */}
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Bank-Pauschalen ({inputs.adults} Erwachsene, {inputs.children} Kinder)
                </span>
                <span className="font-mono font-medium">{formatEUR(expensesBreakdown.pauschalen)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2 font-semibold">
                <span>Gesamtausgaben</span>
                <span className="font-mono">{formatEUR(expensesBreakdown.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bestehende Kredite Detail */}
        {inputs.existingLoans.length > 0 && (
          <div>
            <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-3">
              Bestehende Kredite im Detail
            </h4>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="space-y-3">
                {inputs.existingLoans.map((loan, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                    <div>
                      <span className="font-medium">{loan.label}</span>
                      {loan.interestPct && (
                        <span className="text-xs text-gray-500 ml-2">({loan.interestPct}% p.a.)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{formatEUR(loan.monthlyPayment)}/Monat</div>
                      <div className="text-xs text-gray-500">Restschuld: {formatEUR(loan.remainingBalance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Kredit-Details */}
        <div>
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
            Neuer Kredit
          </h4>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Kreditbetrag</span>
                  <span className="font-mono font-medium">{formatEUR(inputs.targetLoanAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Nominalzins</span>
                  <span className="font-mono font-medium">{inputs.nominalInterestPct}% p.a.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Laufzeit</span>
                  <span className="font-mono font-medium">{inputs.termYears} Jahre</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Annuität (nominal)</span>
                  <span className="font-mono font-medium">{formatEUR(computed.annuity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Annuität (Stress-Test)</span>
                  <span className="font-mono font-medium">{formatEUR(computed.annuityStress)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">DSCR</span>
                  <span className="font-mono font-medium">{computed.dscr.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zusammenfassung */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Zusammenfassung
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Einkommen (bereinigt)</span>
                <span className="font-mono font-medium text-green-600">{formatEUR(computed.adjustedIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Ausgaben gesamt</span>
                <span className="font-mono font-medium text-red-600">{formatEUR(computed.fixedCosts)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-semibold">Überschuss vor Kredit</span>
                <span className="font-mono font-bold text-lg">{formatEUR(computed.surplus)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Kreditrate</span>
                <span className="font-mono font-medium">{formatEUR(computed.annuity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Puffer nominal</span>
                <span className={`font-mono font-medium ${computed.bufferAfterNominal >= inputs.minMonthlyBuffer ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEUR(computed.bufferAfterNominal)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-semibold">Max. Kreditbetrag</span>
                <span className="font-mono font-bold text-lg text-blue-600">{formatEUR(computed.maxLoan)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
