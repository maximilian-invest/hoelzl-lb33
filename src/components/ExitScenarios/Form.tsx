"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioInputs, ExitStrategy, MarketScenario } from "@/types/exit-scenarios";
import { 
  Building, 
  TrendingUp, 
  Calculator, 
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ExitScenarioFormProps {
  initialInputs?: Partial<ExitScenarioInputs>;
  onSubmit: (inputs: ExitScenarioInputs) => void;
  onCancel?: () => void;
}

export function ExitScenarioForm({ initialInputs, onSubmit, onCancel }: ExitScenarioFormProps) {
  const [inputs, setInputs] = useState<ExitScenarioInputs>(() => ({
    kaufpreis: initialInputs?.kaufpreis || 500000,
    nebenkosten: initialInputs?.nebenkosten || 25000,
    darlehenStart: initialInputs?.darlehenStart || 400000,
    eigenkapital: initialInputs?.eigenkapital || 125000,
    exitJahr: initialInputs?.exitJahr || 10,
    exitStrategie: initialInputs?.exitStrategie || "verkauf",
    marktSzenario: initialInputs?.marktSzenario || "base",
    verkaeuferpreis: initialInputs?.verkaeuferpreis,
    wachstumsrate: initialInputs?.wachstumsrate || 3,
    maklerprovision: initialInputs?.maklerprovision || 5,
    notarkosten: initialInputs?.notarkosten || 5000,
    grunderwerbsteuer: initialInputs?.grunderwerbsteuer || 15000,
    neueZinsrate: initialInputs?.neueZinsrate || 4,
    neueLaufzeit: initialInputs?.neueLaufzeit || 20,
    auszahlungsquote: initialInputs?.auszahlungsquote || 70,
    renovierungskosten: initialInputs?.renovierungskosten || 50000,
    renovierungsdauer: initialInputs?.renovierungsdauer || 6,
    steuersatz: initialInputs?.steuersatz || 25,
    abschreibung: initialInputs?.abschreibung || 2,
    preisVariation: initialInputs?.preisVariation || 10,
    zinsVariation: initialInputs?.zinsVariation || 2,
    jaehrlicheMieteinnahmen: initialInputs?.jaehrlicheMieteinnahmen || Array(30).fill(30000),
    jaehrlicheBetriebskosten: initialInputs?.jaehrlicheBetriebskosten || Array(30).fill(8000),
    jaehrlicheTilgung: initialInputs?.jaehrlicheTilgung || Array(30).fill(20000),
    jaehrlicheZinsen: initialInputs?.jaehrlicheZinsen || Array(30).fill(16000),
  }));

  const [expandedSections, setExpandedSections] = useState({
    grunddaten: true,
    exitParameter: true,
    verkauf: false,
    refinanzierung: false,
    renovierung: false,
    steuern: false,
    risiko: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: keyof ExitScenarioInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submit mit Inputs:", inputs);
    onSubmit(inputs);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("de-AT", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);

  const formatPercent = (value: number) => `${value}%`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Exit-Szenarien Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Grunddaten */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('grunddaten')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Grunddaten der Immobilie
                </span>
                {expandedSections.grunddaten ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.grunddaten && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Kaufpreis (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.kaufpreis}
                      onChange={(e) => handleInputChange('kaufpreis', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nebenkosten (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.nebenkosten}
                      onChange={(e) => handleInputChange('nebenkosten', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Darlehen Start (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.darlehenStart}
                      onChange={(e) => handleInputChange('darlehenStart', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Eigenkapital (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.eigenkapital}
                      onChange={(e) => handleInputChange('eigenkapital', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Exit-Parameter */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('exitParameter')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Exit-Parameter
                </span>
                {expandedSections.exitParameter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.exitParameter && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Exit-Jahr
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={inputs.exitJahr}
                      onChange={(e) => handleInputChange('exitJahr', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Exit-Strategie
                    </label>
                    <select
                      value={inputs.exitStrategie}
                      onChange={(e) => handleInputChange('exitStrategie', e.target.value as ExitStrategy)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="verkauf">Verkauf</option>
                      <option value="refinanzierung">Refinanzierung</option>
                      <option value="buy_and_hold">Buy & Hold</option>
                      <option value="fix_and_flip">Fix & Flip</option>
                      <option value="exchange_1031">1031 Exchange</option>
                      <option value="wholesaling">Wholesaling</option>
                      <option value="rent_to_own">Rent-to-Own</option>
                      <option value="vererbung">Vererbung</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Markt-Szenario
                    </label>
                    <select
                      value={inputs.marktSzenario}
                      onChange={(e) => handleInputChange('marktSzenario', e.target.value as MarketScenario)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="bull">Bullenmarkt (+20% Wachstum)</option>
                      <option value="base">Basis-Szenario</option>
                      <option value="bear">Bärenmarkt (-40% Wachstum)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Verkaufs-spezifische Parameter */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('verkauf')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Verkaufs-Parameter
                  <InfoTooltip content="Parameter für Verkaufs-Szenarien" />
                </span>
                {expandedSections.verkauf ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.verkauf && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Verkäuferpreis (€) - optional
                    </label>
                    <input
                      type="number"
                      value={inputs.verkaeuferpreis || ''}
                      onChange={(e) => handleInputChange('verkaeuferpreis', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border rounded"
                      placeholder="Wird automatisch berechnet wenn leer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Wachstumsrate p.a. (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={inputs.wachstumsrate}
                      onChange={(e) => handleInputChange('wachstumsrate', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Maklerprovision (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={inputs.maklerprovision}
                      onChange={(e) => handleInputChange('maklerprovision', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notarkosten (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.notarkosten}
                      onChange={(e) => handleInputChange('notarkosten', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Grunderwerbsteuer (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.grunderwerbsteuer}
                      onChange={(e) => handleInputChange('grunderwerbsteuer', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Refinanzierungs-Parameter */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('refinanzierung')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Refinanzierungs-Parameter
                  <InfoTooltip content="Parameter für Refinanzierungs-Szenarien" />
                </span>
                {expandedSections.refinanzierung ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.refinanzierung && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Neue Zinsrate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={inputs.neueZinsrate || ''}
                      onChange={(e) => handleInputChange('neueZinsrate', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Neue Laufzeit (Jahre)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={inputs.neueLaufzeit || ''}
                      onChange={(e) => handleInputChange('neueLaufzeit', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Auszahlungsquote (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={inputs.auszahlungsquote || ''}
                      onChange={(e) => handleInputChange('auszahlungsquote', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Renovierungs-Parameter */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('renovierung')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Renovierungs-Parameter
                  <InfoTooltip content="Parameter für Fix & Flip Szenarien" />
                </span>
                {expandedSections.renovierung ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.renovierung && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Renovierungskosten (€)
                    </label>
                    <input
                      type="number"
                      value={inputs.renovierungskosten || ''}
                      onChange={(e) => handleInputChange('renovierungskosten', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Renovierungsdauer (Monate)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={inputs.renovierungsdauer || ''}
                      onChange={(e) => handleInputChange('renovierungsdauer', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Steuer-Parameter */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('steuern')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Steuer-Parameter
                  <InfoTooltip content="Steuerliche Parameter für die Berechnung" />
                </span>
                {expandedSections.steuern ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.steuern && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Steuersatz (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={inputs.steuersatz}
                      onChange={(e) => handleInputChange('steuersatz', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Abschreibung p.a. (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={inputs.abschreibung}
                      onChange={(e) => handleInputChange('abschreibung', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Risiko-Parameter */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('risiko')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risiko-Parameter
                  <InfoTooltip content="Parameter für Sensitivitätsanalyse" />
                </span>
                {expandedSections.risiko ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.risiko && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Preis-Variation (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={inputs.preisVariation}
                      onChange={(e) => handleInputChange('preisVariation', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Zins-Variation (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={inputs.zinsVariation}
                      onChange={(e) => handleInputChange('zinsVariation', Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Exit-Szenarien berechnen
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
