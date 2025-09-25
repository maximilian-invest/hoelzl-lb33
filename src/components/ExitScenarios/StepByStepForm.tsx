"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExitScenarioInputs, VerkaufspreisTyp } from "@/types/exit-scenarios";
import { InfoTooltip } from "@/components/InfoTooltip";
import { 
  Building, 
  TrendingUp, 
  Calculator, 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Euro,
  Calendar,
  Settings,
  FileText
} from "lucide-react";

interface StepByStepFormProps {
  initialInputs?: Partial<ExitScenarioInputs>;
  onSubmit: (inputs: ExitScenarioInputs) => void;
  onCancel?: () => void;
  onInputChange?: (inputs: ExitScenarioInputs) => void;
  propertyValueByYear?: number[];
  onReinesVerkaufsszenarioChange?: (isReinesVerkaufsszenario: boolean) => void;
  scenarioName?: string;
  scenarioDescription?: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, title: "Grunddaten", description: "Szenario-Informationen und Exit-Jahr", icon: FileText },
  { id: 2, title: "Verkaufspreis", description: "Verkaufspreis und -typ festlegen", icon: Euro },
  { id: 3, title: "Kosten", description: "Kosten vor Verkauf eingeben", icon: Settings },
  { id: 4, title: "Zusammenfassung", description: "Übersicht und Berechnung", icon: Calculator },
] as const;

export function StepByStepForm({ 
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
}: StepByStepFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  const [inputs, setInputs] = useState<ExitScenarioInputs>(() => {
    const safeInitialInputs = initialInputs || {};
    
    return {
      kaufpreis: safeInitialInputs.kaufpreis || 500000,
      nebenkosten: safeInitialInputs.nebenkosten || 25000,
      darlehenStart: safeInitialInputs.darlehenStart || 400000,
      eigenkapital: safeInitialInputs.eigenkapital || 125000,
      wohnflaeche: safeInitialInputs.wohnflaeche || 100,
      exitJahr: safeInitialInputs.exitJahr || 10,
      reinesVerkaufsszenario: safeInitialInputs.reinesVerkaufsszenario || false,
      verkaufspreisTyp: safeInitialInputs.verkaufspreisTyp || "pauschal",
      verkaeuferpreisPauschal: safeInitialInputs.verkaeuferpreisPauschal,
      verkaeuferpreisProM2: safeInitialInputs.verkaeuferpreisProM2,
      maklerprovision: safeInitialInputs.maklerprovision || 5,
      sanierungskosten: safeInitialInputs.sanierungskosten || 0,
      notarkosten: safeInitialInputs.notarkosten || 0,
      grunderwerbsteuer: safeInitialInputs.grunderwerbsteuer || 0,
      weitereKosten: safeInitialInputs.weitereKosten || 0,
      steuersatz: safeInitialInputs.steuersatz || 25,
      abschreibung: safeInitialInputs.abschreibung || 2,
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
      propertyValueByYear: propertyValueByYear || Array(30).fill(500000),
    };
  });

  const handleInputChange = (field: keyof ExitScenarioInputs, value: string | number | boolean) => {
    const newInputs = {
      ...inputs,
      [field]: value
    };
    setInputs(newInputs);
    
    if (onInputChange) {
      onInputChange(newInputs);
    }
    
    if (field === 'reinesVerkaufsszenario' && onReinesVerkaufsszenarioChange) {
      onReinesVerkaufsszenarioChange(Boolean(value));
    }
  };

  const getMarktwertForExitYear = (exitJahr: number): number => {
    if (!propertyValueByYear || propertyValueByYear.length === 0) {
      return 0;
    }
    return propertyValueByYear[exitJahr - 1] || 0;
  };

  const getMarktwertProM2 = (exitJahr: number): number => {
    const marktwert = getMarktwertForExitYear(exitJahr);
    return marktwert > 0 && inputs.wohnflaeche > 0 ? marktwert / inputs.wohnflaeche : 0;
  };

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

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("de-AT", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);

  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 1:
        return scenarioName.trim() !== "" && inputs.exitJahr > 0;
      case 2:
        return inputs.verkaufspreisTyp === "pauschal" 
          ? (inputs.verkaeuferpreisPauschal || 0) > 0
          : (inputs.verkaeuferpreisProM2 || 0) > 0;
      case 3:
        return true; // Kosten sind optional
      case 4:
        return true; // Zusammenfassung
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStepValid(4)) {
      onSubmit(inputs);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(step.id as Step);
        const isCurrent = currentStep === step.id;
        const StepIcon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : isCurrent 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-500'
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <StepIcon className="h-5 w-5" />
              )}
            </div>
            <div className="ml-3 hidden sm:block">
              <div className={`text-sm font-medium ${
                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-4 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grunddaten definieren</h2>
        <p className="text-gray-600">Geben Sie die grundlegenden Informationen für Ihr Exit-Szenario ein.</p>
      </div>

      {/* Szenario-Informationen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Szenario-Informationen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Szenario-Name *
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => onNameChange?.(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. Optimistisches Marktszenario"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grunddaten der Immobilie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Grunddaten der Immobilie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Diese Grunddaten werden aus den Projekteingaben übernommen und sind hier nicht änderbar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kaufpreis (€)</label>
              <div className="w-full p-3 bg-gray-100 border rounded-lg text-gray-700">
                {formatCurrency(inputs.kaufpreis)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nebenkosten (€)</label>
              <div className="w-full p-3 bg-gray-100 border rounded-lg text-gray-700">
                {formatCurrency(inputs.nebenkosten)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Darlehen Start (€)</label>
              <div className="w-full p-3 bg-gray-100 border rounded-lg text-gray-700">
                {formatCurrency(inputs.darlehenStart)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Eigenkapital (€)</label>
              <div className="w-full p-3 bg-gray-100 border rounded-lg text-gray-700">
                {formatCurrency(inputs.eigenkapital)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wohnfläche (m²)</label>
              <div className="w-full p-3 bg-gray-100 border rounded-lg text-gray-700">
                {inputs.wohnflaeche} m²
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exit-Parameter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exit-Parameter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Exit-Jahr *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={inputs.exitJahr}
                onChange={(e) => handleInputChange('exitJahr', Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                In welchem Jahr soll die Immobilie verkauft werden?
              </p>
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
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Im reinen Verkaufsszenario wird nur der Verkaufserlös nach Abzug der Kosten berücksichtigt. 
                  Die jährlichen Cashflows aus Mieteinnahmen und Betriebskosten fließen nicht in die Renditeberechnung ein.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verkaufspreis festlegen</h2>
        <p className="text-gray-600">Definieren Sie den Verkaufspreis für Ihr Exit-Szenario.</p>
      </div>

      {/* Marktwert-Anzeige */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Marktwert der Immobilie nach {inputs.exitJahr} Jahren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {getMarktwertForExitYear(inputs.exitJahr) > 0 ? 
                formatCurrency(getMarktwertForExitYear(inputs.exitJahr)) : 
                'Wird berechnet...'
              }
            </div>
            {getMarktwertProM2(inputs.exitJahr) > 0 && (
              <div className="text-lg text-blue-800 mb-4">
                = {formatCurrency(getMarktwertProM2(inputs.exitJahr))} / m²
              </div>
            )}
            <p className="text-sm text-blue-700 mb-4">
              Basierend auf der Wertsteigerung aus der Detailanalyse
            </p>
            <button
              type="button"
              onClick={setMarktwertAsVerkaufspreis}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Marktwert als Verkaufspreis übernehmen
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Verkaufspreis-Eingabe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Verkaufspreis definieren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Verkaufspreis-Eingabe
              </label>
              <select
                value={inputs.verkaufspreisTyp}
                onChange={(e) => handleInputChange('verkaufspreisTyp', e.target.value as VerkaufspreisTyp)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pauschal">Pauschaler Verkaufspreis</option>
                <option value="pro_quadratmeter">Verkaufspreis pro m²</option>
              </select>
            </div>
            
            {inputs.verkaufspreisTyp === "pauschal" ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Verkaufspreis (€) *
                </label>
                <input
                  type="number"
                  value={inputs.verkaeuferpreisPauschal || ''}
                  onChange={(e) => handleInputChange('verkaeuferpreisPauschal', e.target.value ? Number(e.target.value) : 0)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={getMarktwertForExitYear(inputs.exitJahr) > 0 ? 
                    `Marktwert: ${formatCurrency(getMarktwertForExitYear(inputs.exitJahr))}` : 
                    "z.B. 650000"
                  }
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Verkaufspreis pro m² (€) *
                </label>
                <input
                  type="number"
                  value={inputs.verkaeuferpreisProM2 || ''}
                  onChange={(e) => handleInputChange('verkaeuferpreisProM2', e.target.value ? Number(e.target.value) : 0)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={getMarktwertProM2(inputs.exitJahr) > 0 ? 
                    `Marktwert: ${formatCurrency(getMarktwertProM2(inputs.exitJahr))} / m²` : 
                    "z.B. 6500"
                  }
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Gesamtpreis: {inputs.verkaeuferpreisProM2 && inputs.wohnflaeche ? 
                    formatCurrency(inputs.verkaeuferpreisProM2 * inputs.wohnflaeche) : 
                    "Bitte Werte eingeben"}
                </p>
              </div>
            )}
            
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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Notarkosten und Grunderwerbsteuer werden nicht berücksichtigt.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kosten vor Verkauf</h2>
        <p className="text-gray-600">Geben Sie zusätzliche Kosten ein, die vor dem Verkauf anfallen.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kosten vor Verkauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Diese Kosten werden vom Verkaufserlös abgezogen und reduzieren den Netto-Erlös entsprechend.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Sanierungskosten vor Verkauf (€)
              </label>
              <input
                type="number"
                min="0"
                value={inputs.sanierungskosten}
                onChange={(e) => handleInputChange('sanierungskosten', Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. 50000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Kosten für Renovierung, Modernisierung oder Reparaturen
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Notarkosten (€)
              </label>
              <input
                type="number"
                min="0"
                value={inputs.notarkosten}
                onChange={(e) => handleInputChange('notarkosten', Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. 2000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Notarielle Kosten für den Verkauf
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Grunderwerbsteuer (€)
              </label>
              <input
                type="number"
                min="0"
                value={inputs.grunderwerbsteuer}
                onChange={(e) => handleInputChange('grunderwerbsteuer', Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. 0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Nur falls anwendbar (meist beim Verkauf nicht relevant)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Weitere Kosten (€)
              </label>
              <input
                type="number"
                min="0"
                value={inputs.weitereKosten}
                onChange={(e) => handleInputChange('weitereKosten', Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. 5000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Gutachten, Wertermittlung, etc.
              </p>
            </div>
          </div>
          
          {/* Kostenübersicht */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Kostenübersicht</h4>
            <div className="space-y-2 text-sm">
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
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Gesamtkosten:</span>
                <span>{formatCurrency(inputs.sanierungskosten + inputs.notarkosten + inputs.grunderwerbsteuer + inputs.weitereKosten)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => {
    const verkaufspreis = inputs.verkaufspreisTyp === "pauschal" 
      ? (inputs.verkaeuferpreisPauschal || 0)
      : (inputs.verkaeuferpreisProM2 || 0) * inputs.wohnflaeche;
    
    const maklerkosten = verkaufspreis * (inputs.maklerprovision / 100);
    const gesamtkosten = inputs.sanierungskosten + inputs.notarkosten + inputs.grunderwerbsteuer + inputs.weitereKosten;
    const nettoVerkaufserloes = verkaufspreis - maklerkosten - gesamtkosten;

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zusammenfassung</h2>
          <p className="text-gray-600">Überprüfen Sie Ihre Eingaben und berechnen Sie das Exit-Szenario.</p>
        </div>

        {/* Szenario-Übersicht */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Szenario-Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Grunddaten</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{scenarioName || "Nicht angegeben"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exit-Jahr:</span>
                    <span className="font-medium">{inputs.exitJahr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reines Verkaufsszenario:</span>
                    <span className="font-medium">{inputs.reinesVerkaufsszenario ? "Ja" : "Nein"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Verkaufspreis</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Typ:</span>
                    <span className="font-medium">
                      {inputs.verkaufspreisTyp === "pauschal" ? "Pauschal" : "Pro m²"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verkaufspreis:</span>
                    <span className="font-medium">{formatCurrency(verkaufspreis)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maklerprovision:</span>
                    <span className="font-medium">{inputs.maklerprovision}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Berechnungsergebnis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Berechnungsergebnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Verkaufserlös</h4>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(verkaufspreis)}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">Abzüge</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Maklerprovision:</span>
                      <span>{formatCurrency(maklerkosten)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weitere Kosten:</span>
                      <span>{formatCurrency(gesamtkosten)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Gesamt:</span>
                      <span>{formatCurrency(maklerkosten + gesamtkosten)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <h4 className="font-semibold text-green-900 mb-2">Netto-Verkaufserlös</h4>
                <div className="text-3xl font-bold text-green-900">
                  {formatCurrency(nettoVerkaufserloes)}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Nach Abzug aller Kosten
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Schritt-Indikator */}
        <StepIndicator />

        {/* Schritt-Inhalt */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Abbrechen
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="flex items-center gap-2"
              >
                Weiter
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isStepValid(4)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Calculator className="h-4 w-4" />
                Szenario berechnen
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
