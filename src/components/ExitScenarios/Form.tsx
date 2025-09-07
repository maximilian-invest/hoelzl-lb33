"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioInputs, VerkaufspreisTyp } from "@/types/exit-scenarios";
import { 
  Building, 
  TrendingUp, 
  Calculator, 
  // AlertTriangle,
  // Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ExitScenarioFormProps {
  initialInputs?: Partial<ExitScenarioInputs>;
  onSubmit: (inputs: ExitScenarioInputs) => void;
  onCancel?: () => void;
  onInputChange?: (inputs: ExitScenarioInputs) => void; // Callback für Änderungen
  propertyValueByYear?: number[]; // Marktwerte für jedes Jahr
  onReinesVerkaufsszenarioChange?: (isReinesVerkaufsszenario: boolean) => void;
  scenarioName?: string;
  scenarioDescription?: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
}

export function ExitScenarioForm({ 
  initialInputs, 
  onSubmit, 
  onCancel, 
  onInputChange, 
  propertyValueByYear, 
  onReinesVerkaufsszenarioChange,
  scenarioName = "",
  scenarioDescription = "",
  onNameChange,
  onDescriptionChange
}: ExitScenarioFormProps) {
  const [inputs, setInputs] = useState<ExitScenarioInputs>(() => {
    // Sicherstellen, dass alle Arrays korrekt initialisiert werden
    const safeInitialInputs = initialInputs || {};
    
    return {
      // Grunddaten aus Einstellungen übernehmen (nicht anpassbar)
      kaufpreis: safeInitialInputs.kaufpreis || 500000,
      nebenkosten: safeInitialInputs.nebenkosten || 25000,
      darlehenStart: safeInitialInputs.darlehenStart || 400000,
      eigenkapital: safeInitialInputs.eigenkapital || 125000,
      wohnflaeche: safeInitialInputs.wohnflaeche || 100,
      
      // Exit-Parameter
      exitJahr: safeInitialInputs.exitJahr || 10,
      reinesVerkaufsszenario: safeInitialInputs.reinesVerkaufsszenario || false,
      verkaufspreisTyp: safeInitialInputs.verkaufspreisTyp || "pauschal",
      verkaeuferpreisPauschal: safeInitialInputs.verkaeuferpreisPauschal,
      verkaeuferpreisProM2: safeInitialInputs.verkaeuferpreisProM2,
      
      // Verkaufskosten
      maklerprovision: safeInitialInputs.maklerprovision || 5,
      sanierungskosten: safeInitialInputs.sanierungskosten || 0,
      notarkosten: safeInitialInputs.notarkosten || 0,
      grunderwerbsteuer: safeInitialInputs.grunderwerbsteuer || 0,
      weitereKosten: safeInitialInputs.weitereKosten || 0,
      
      // Steuern aus Einstellungen übernehmen (nicht anpassbar)
      steuersatz: safeInitialInputs.steuersatz || 25,
      abschreibung: safeInitialInputs.abschreibung || 2,
      
      // Cashflow-Daten aus Einstellungen übernehmen (nicht anpassbar)
      // Sicherstellen, dass Arrays korrekt initialisiert werden
      jaehrlicheMieteinnahmen: Array.isArray(safeInitialInputs.jaehrlicheMieteinnahmen) 
        ? safeInitialInputs.jaehrlicheMieteinnahmen 
        : Array(30).fill(30000),
      jaehrlicheBetriebskosten: Array.isArray(safeInitialInputs.jaehrlicheBetriebskosten) 
        ? safeInitialInputs.jaehrlicheBetriebskosten 
        : Array(30).fill(8000),
      jaehrlicheTilgung: Array.isArray(safeInitialInputs.jaehrlicheTilgung) 
        ? safeInitialInputs.jaehrlicheTilgung 
        : Array(30).fill(20000),
      jaehrlicheZinsen: Array.isArray(safeInitialInputs.jaehrlicheZinsen) 
        ? safeInitialInputs.jaehrlicheZinsen 
        : Array(30).fill(16000),
      
      // Marktwert-Daten
      propertyValueByYear: propertyValueByYear || Array(30).fill(500000),
    };
  });

  const [expandedSections, setExpandedSections] = useState({
    grunddaten: true,
    exitParameter: true,
    verkauf: true,
    kosten: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: keyof ExitScenarioInputs, value: string | number | boolean) => {
    const newInputs = {
      ...inputs,
      [field]: value
    };
    setInputs(newInputs);
    
    // Rufe den Callback auf, um die Eingaben zu speichern
    if (onInputChange) {
      onInputChange(newInputs);
    }
    
    // Spezielle Behandlung für reines Verkaufsszenario
    if (field === 'reinesVerkaufsszenario' && onReinesVerkaufsszenarioChange) {
      onReinesVerkaufsszenarioChange(Boolean(value));
    }
  };

  // Automatische Aktualisierung des Verkaufspreises bei Änderung des Exit-Jahres
  useEffect(() => {
    const marktwert = getMarktwertForExitYear(inputs.exitJahr);
    if (marktwert > 0) {
      // Nur aktualisieren, wenn noch kein Verkaufspreis eingegeben wurde
      if (inputs.verkaufspreisTyp === "pauschal" && !inputs.verkaeuferpreisPauschal) {
        handleInputChange('verkaeuferpreisPauschal', marktwert);
      } else if (inputs.verkaufspreisTyp === "pro_quadratmeter" && !inputs.verkaeuferpreisProM2) {
        const preisProM2 = getMarktwertProM2(inputs.exitJahr);
        handleInputChange('verkaeuferpreisProM2', preisProM2);
      }
    }
  }, [inputs.exitJahr, inputs.verkaufspreisTyp, inputs.verkaeuferpreisPauschal, inputs.verkaeuferpreisProM2]);

  // Berechnet den Marktwert basierend auf dem aktuellen Exit-Jahr
  const getMarktwertForExitYear = (exitJahr: number): number => {
    if (!propertyValueByYear || propertyValueByYear.length === 0) {
      return 0;
    }
    // Index ist exitJahr - 1 (da Array bei 0 beginnt)
    return propertyValueByYear[exitJahr - 1] || 0;
  };

  // Berechnet den Preis pro m² basierend auf dem Marktwert
  const getMarktwertProM2 = (exitJahr: number): number => {
    const marktwert = getMarktwertForExitYear(exitJahr);
    return marktwert > 0 && inputs.wohnflaeche > 0 ? marktwert / inputs.wohnflaeche : 0;
  };

  // Setzt automatisch den Marktwert als Verkaufspreis
  const setMarktwertAsVerkaufspreis = () => {
    const marktwert = getMarktwertForExitYear(inputs.exitJahr);
    if (marktwert > 0) {
      if (inputs.verkaufspreisTyp === "pauschal") {
        handleInputChange('verkaeuferpreisPauschal', marktwert);
      } else {
        const preisProM2 = getMarktwertProM2(inputs.exitJahr);
        handleInputChange('verkaeuferpreisProM2', preisProM2);
      }
    }
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

  // const formatPercent = (value: number) => `${value}%`;

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
            
            {/* Szenario-Informationen */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Szenario-Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Szenario-Name *
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => onNameChange?.(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="z.B. Verkauf nach 10 Jahren"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Beschreibung (optional)
                  </label>
                  <input
                    type="text"
                    value={scenarioDescription}
                    onChange={(e) => onDescriptionChange?.(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="z.B. Optimistisches Marktszenario"
                  />
                </div>
              </div>
            </div>
            
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
                <div className="mt-4">
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Hinweis:</strong> Diese Grunddaten werden aus den Projekteinstellungen übernommen und sind hier nicht änderbar.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Kaufpreis (€)
                      </label>
                      <div className="w-full p-2 bg-gray-100 border rounded text-gray-700">
                        {formatCurrency(inputs.kaufpreis)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nebenkosten (€)
                      </label>
                      <div className="w-full p-2 bg-gray-100 border rounded text-gray-700">
                        {formatCurrency(inputs.nebenkosten)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Darlehen Start (€)
                      </label>
                      <div className="w-full p-2 bg-gray-100 border rounded text-gray-700">
                        {formatCurrency(inputs.darlehenStart)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Eigenkapital (€)
                      </label>
                      <div className="w-full p-2 bg-gray-100 border rounded text-gray-700">
                        {formatCurrency(inputs.eigenkapital)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Wohnfläche (m²)
                      </label>
                      <div className="w-full p-2 bg-gray-100 border rounded text-gray-700">
                        {inputs.wohnflaeche} m²
                      </div>
                    </div>
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
                <div className="space-y-4 mt-4">
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
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reinesVerkaufsszenario"
                      checked={inputs.reinesVerkaufsszenario}
                      onChange={(e) => handleInputChange('reinesVerkaufsszenario', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="reinesVerkaufsszenario" className="text-sm font-medium text-gray-700">
                      Reines Verkaufsszenario (ohne FCF-Berechnung)
                    </label>
                    <InfoTooltip content="Bei aktiviertem reinen Verkaufsszenario werden nur der Verkaufserlös und die Kosten berücksichtigt. Die jährlichen Cashflows (FCF) werden nicht in die Renditeberechnung einbezogen." asButton={false} />
                  </div>
                  
                  {inputs.reinesVerkaufsszenario && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Hinweis:</strong> Im reinen Verkaufsszenario wird nur der Verkaufserlös nach Abzug der Kosten berücksichtigt. 
                        Die jährlichen Cashflows aus Mieteinnahmen und Betriebskosten fließen nicht in die Renditeberechnung ein.
                      </p>
                    </div>
                  )}
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
                  <InfoTooltip content="Parameter für Verkaufs-Szenarien. Hier können Sie den Verkaufspreis (pauschal oder pro m²) und die Maklerprovision eingeben." asButton={false} />
                </span>
                {expandedSections.verkauf ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.verkauf && (
                <div className="space-y-4 mt-4">
                  {/* Marktwert der Immobilie nach X Jahren */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Marktwert der Immobilie nach {inputs.exitJahr} Jahren
                    </h4>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {getMarktwertForExitYear(inputs.exitJahr) > 0 ? 
                        new Intl.NumberFormat('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(getMarktwertForExitYear(inputs.exitJahr)) : 
                        'Wird berechnet...'
                      }
                    </div>
                    {getMarktwertProM2(inputs.exitJahr) > 0 && (
                      <div className="text-lg text-blue-800 dark:text-blue-200 mt-1">
                        = {new Intl.NumberFormat('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(getMarktwertProM2(inputs.exitJahr))} / m²
                      </div>
                    )}
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Basierend auf der Wertsteigerung aus der Detailanalyse
                    </p>
                    <button
                      type="button"
                      onClick={setMarktwertAsVerkaufspreis}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Marktwert als Verkaufspreis übernehmen
                    </button>
                  </div>

                  {/* Verkaufspreis-Typ */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Verkaufspreis-Eingabe
                    </label>
                    <select
                      value={inputs.verkaufspreisTyp}
                      onChange={(e) => handleInputChange('verkaufspreisTyp', e.target.value as VerkaufspreisTyp)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="pauschal">Pauschaler Verkaufspreis</option>
                      <option value="pro_quadratmeter">Verkaufspreis pro m²</option>
                    </select>
                  </div>
                  
                  {/* Verkaufspreis-Eingabe */}
                  {inputs.verkaufspreisTyp === "pauschal" ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Verkaufspreis (€)
                      </label>
                      <input
                        type="number"
                        value={inputs.verkaeuferpreisPauschal || ''}
                        onChange={(e) => handleInputChange('verkaeuferpreisPauschal', e.target.value ? Number(e.target.value) : 0)}
                        className="w-full p-2 border rounded"
                        placeholder={getMarktwertForExitYear(inputs.exitJahr) > 0 ? 
                          `Marktwert: ${new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(getMarktwertForExitYear(inputs.exitJahr))}` : 
                          "z.B. 650000"
                        }
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Verkaufspreis pro m² (€)
                      </label>
                      <input
                        type="number"
                        value={inputs.verkaeuferpreisProM2 || ''}
                        onChange={(e) => handleInputChange('verkaeuferpreisProM2', e.target.value ? Number(e.target.value) : 0)}
                        className="w-full p-2 border rounded"
                        placeholder={getMarktwertProM2(inputs.exitJahr) > 0 ? 
                          `Marktwert: ${new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(getMarktwertProM2(inputs.exitJahr))} / m²` : 
                          "z.B. 6500"
                        }
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Gesamtpreis: {inputs.verkaeuferpreisProM2 && inputs.wohnflaeche ? 
                          new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
                            .format(inputs.verkaeuferpreisProM2 * inputs.wohnflaeche) : 
                          "Bitte Werte eingeben"}
                      </p>
                    </div>
                  )}
                  
                  {/* Verkaufskosten */}
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
                    <p className="text-sm text-gray-500 mt-1">
                      Notarkosten und Grunderwerbsteuer werden nicht berücksichtigt.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Kosten vor Verkauf */}
            <div className="border rounded-lg p-4">
              <button
                type="button"
                onClick={() => toggleSection('kosten')}
                className="flex items-center justify-between w-full text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Kosten vor Verkauf
                  <InfoTooltip content="Hier können Sie zusätzliche Kosten eingeben, die vor dem Verkauf anfallen, wie z.B. Sanierungskosten, Notarkosten oder Grunderwerbsteuer." asButton={false} />
                </span>
                {expandedSections.kosten ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.kosten && (
                <div className="space-y-4 mt-4">
                  <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Hinweis:</strong> Diese Kosten werden vom Verkaufserlös abgezogen und reduzieren den Netto-Erlös entsprechend.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sanierungskosten */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Sanierungskosten vor Verkauf (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.sanierungskosten}
                        onChange={(e) => handleInputChange('sanierungskosten', Number(e.target.value))}
                        className="w-full p-2 border rounded"
                        placeholder="z.B. 50000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Kosten für Renovierung, Modernisierung oder Reparaturen
                      </p>
                    </div>
                    
                    {/* Notarkosten */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Notarkosten (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.notarkosten}
                        onChange={(e) => handleInputChange('notarkosten', Number(e.target.value))}
                        className="w-full p-2 border rounded"
                        placeholder="z.B. 2000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Notarielle Kosten für den Verkauf
                      </p>
                    </div>
                    
                    {/* Grunderwerbsteuer */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Grunderwerbsteuer (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.grunderwerbsteuer}
                        onChange={(e) => handleInputChange('grunderwerbsteuer', Number(e.target.value))}
                        className="w-full p-2 border rounded"
                        placeholder="z.B. 0"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Nur falls anwendbar (meist beim Verkauf nicht relevant)
                      </p>
                    </div>
                    
                    {/* Weitere Kosten */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Weitere Kosten (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.weitereKosten}
                        onChange={(e) => handleInputChange('weitereKosten', Number(e.target.value))}
                        className="w-full p-2 border rounded"
                        placeholder="z.B. 5000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Gutachten, Wertermittlung, etc.
                      </p>
                    </div>
                  </div>
                  
                  {/* Kostenübersicht */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Kostenübersicht
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Sanierungskosten:</span>
                        <span>{formatCurrency(inputs.sanierungskosten)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Notarkosten:</span>
                        <span>{formatCurrency(inputs.notarkosten)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Grunderwerbsteuer:</span>
                        <span>{formatCurrency(inputs.grunderwerbsteuer)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weitere Kosten:</span>
                        <span>{formatCurrency(inputs.weitereKosten)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Gesamtkosten:</span>
                        <span>{formatCurrency(inputs.sanierungskosten + inputs.notarkosten + inputs.grunderwerbsteuer + inputs.weitereKosten)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Verkauf-Szenario berechnen
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
