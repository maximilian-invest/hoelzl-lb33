"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/InfoTooltip";
import { InvestmentScoreSection } from "@/components/InvestmentScore/Section";
import { PDFViewer } from "@/components/PDFViewer";
import { MultiScenarioResults } from "@/components/ExitScenarios/MultiScenarioResults";
import { DISTRICT_PRICES, type District } from "@/types/districts";

// Hilfsfunktion um zu prüfen, ob ein Exit-Szenario als berechnet gilt
const isExitScenarioCalculated = (inputs?: import("@/types/exit-scenarios").ExitScenarioInputs | null): boolean => {
  if (!inputs) return false;
  
  // Ein Exit-Szenario gilt als berechnet, wenn ein Verkaufspreis gesetzt wurde
  if (inputs.verkaufspreisTyp === "pauschal" && inputs.verkaeuferpreisPauschal && inputs.verkaeuferpreisPauschal > 0) {
    return true;
  }
  
  if (inputs.verkaufspreisTyp === "pro_quadratmeter" && inputs.verkaeuferpreisProM2 && inputs.verkaeuferpreisProM2 > 0) {
    return true;
  }
  
  return false;
};
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const fmt = (n: number): string => new Intl.NumberFormat("de-AT").format(n);

// Swipe Modal Component für Fotos
const SwipeModal = ({ 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}: { 
  images: Array<{ src: string; caption: string; width: number; height: number }>; 
  currentIndex: number; 
  onClose: () => void; 
  onNext: () => void; 
  onPrev: () => void; 
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      onNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      onPrev();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      onPrev();
    } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
      onNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="relative max-w-6xl max-h-[95vh] w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-lg font-semibold">{currentImage.caption}</h3>
              <p className="text-sm text-gray-300">
                {currentIndex + 1} von {images.length} • {currentImage.width} × {currentImage.height}px
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Image Container */}
        <div 
          className="flex-1 flex items-center justify-center p-8"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative max-w-full max-h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            <img
              src={currentImage.src}
              alt={currentImage.caption}
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
        </div>

        {/* Footer mit Dots */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex justify-center space-x-2 mb-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  // Jump to specific image
                  const event = new CustomEvent('jumpToImage', { detail: index });
                  window.dispatchEvent(event);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-white text-sm">
            <p>Wischen Sie oder verwenden Sie die Pfeiltasten zum Navigieren</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CompleteOverviewTabProps {
  // Investment Score
  score: import("@/types/score").ScoreResult;
  metrics: import("@/types/score").ContextMetrics;
  reinesVerkaufsszenario?: boolean;
  
  // Exit Scenarios
  exitScenarioInputs?: import("@/types/exit-scenarios").ExitScenarioInputs;
  
  // Chart data
  chartData: unknown[];
  valueGrowthData: unknown[];
  valueGrowthTable: Array<{
    Jahr: number;
    Wert: number;
    Zuwachs: number;
    ZuwachsPct: number;
  }>;
  PLAN_30Y: Array<{
    fcf: number;
    tilgung: number;
    restschuld: number;
  }>;
  PLAN_LAUFZEIT: Array<{
    einnahmen: number;
    fcf: number;
    jahr: number;
    zins: number;
    tilgung: number;
    annuitaet: number;
    restschuld: number;
    ausgaben: number;
  }>;
  investUnlevered: number;
  nkInLoan: boolean;
  NKabs: number;
  V0: number;
  L0: number;
  
  // Financial data
  fin: {
    annuitaet: number;
    einnahmenJ1: number;
    einnahmenWachstum: number;
  };
  cfg: {
    wertSteigerung: number;
    kaufpreis: number;
  };
  cfPosAb: number;
  bkJ1: number;
  laufzeitAuto: number;
  
  // Utility functions
  fmtEUR: (n: number) => string;
  formatPercent: (n: number) => string | null;
  
  // Kennzahlen & Metriken
  selectedCards: string[];
  availableCards: Record<string, {
    title: string;
    tooltip?: string;
    content: React.ReactNode;
    controls?: React.ReactNode;
  }>;
  
  
  // Market Comparison
  kaufpreis: number;
  totalFlaeche: number;
  stadtteil: District;
  onStadtteilChange: (stadtteil: District) => void;
  projectName: string;
  
  // Investment Story
  storyParagraphs: string[];
  texts: {
    beschreibung: string;
    lage: string;
    entwicklungspotenzial: string;
    weiteres: string;
  };
  
  // Current Scenario
  scenario: "bear" | "base" | "bull";
  
  // Settings/Configuration
  assumptions: {
    adresse: string;
    stadtteil: District;
    bauart: "bestand" | "neubau";
    objektTyp: string;
    baujahr: number;
    sanierungen: string[];
    energiewerte: {
      hwb: number;
      fgee: number;
      heizung: string;
      dachung: string;
      fenster: string;
      waermedaemmung: string;
    };
    units: Array<{
      flaeche: number;
      miete: number;
      typ: string;
      stockwerk: string;
      bezeichnung: string;
      balkon?: boolean;
      balkonGroesse?: number;
      keller?: boolean;
      kellerGroesse?: number;
      parkplatz?: boolean;
      parkplatzAnzahl?: number;
      terrasse?: boolean;
      garten?: boolean;
      aufzug?: boolean;
      einbaukueche?: boolean;
      badewanne?: boolean;
      dusche?: boolean;
      wc?: number;
      zimmer?: number;
      schlafzimmer?: number;
    }>;
    kaufpreis: number;
    nebenkosten: number;
    ekQuote: number;
    tilgung: number;
    laufzeit: number;
    marktMiete: number;
    wertSteigerung: number;
  };
  finCases: {
    bear: {
      darlehen: number;
      zinssatz: number;
      annuitaet: number;
      bkM2: number;
      bkWachstum: number;
      einnahmenJ1: number;
      einnahmenWachstum: number;
      leerstand: number;
      steuerRate: number;
      afaRate: number;
    };
    base: {
      darlehen: number;
      zinssatz: number;
      annuitaet: number;
      bkM2: number;
      bkWachstum: number;
      einnahmenJ1: number;
      einnahmenWachstum: number;
      leerstand: number;
      steuerRate: number;
      afaRate: number;
    };
    bull: {
      darlehen: number;
      zinssatz: number;
      annuitaet: number;
      bkM2: number;
      bkWachstum: number;
      einnahmenJ1: number;
      einnahmenWachstum: number;
      leerstand: number;
      steuerRate: number;
      afaRate: number;
    };
  };
  
  // PDF Documents
  pdfs?: Array<{
    src: string;
    name: string;
    description?: string;
  }>;
  
  // Images
  images?: Array<{
    src: string;
    caption: string;
    width: number;
    height: number;
  }>;
}

export function CompleteOverviewTab({
  score,
  metrics,
  reinesVerkaufsszenario = false,
  exitScenarioInputs,
  chartData,
  valueGrowthData,
  valueGrowthTable,
  PLAN_30Y,
  PLAN_LAUFZEIT,
  investUnlevered,
  nkInLoan,
  NKabs,
  V0,
  L0,
  fin,
  cfg,
  cfPosAb,
  bkJ1,
  laufzeitAuto,
  fmtEUR,
  formatPercent,
  selectedCards,
  availableCards,
  kaufpreis,
  totalFlaeche,
  stadtteil,
  onStadtteilChange,
  projectName,
  storyParagraphs,
  texts,
  scenario,
  assumptions,
  finCases,
  pdfs = [],
  images = [],
}: CompleteOverviewTabProps) {
  const [swipeModalOpen, setSwipeModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const kaufpreisProM2 = kaufpreis / totalFlaeche;
  const avgPreisBestand = DISTRICT_PRICES.bestand.find((d) => d.ort === stadtteil)?.preis ?? 0;
  const avgPreisNeubau = DISTRICT_PRICES.neubau.find((d) => d.ort === stadtteil)?.preis ?? 0;

  const openSwipeModal = (index: number) => {
    setCurrentImageIndex(index);
    setSwipeModalOpen(true);
  };

  const closeSwipeModal = () => {
    setSwipeModalOpen(false);
  };

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Event listener für Jump to Image
  useEffect(() => {
    const handleJumpToImage = (event: CustomEvent) => {
      setCurrentImageIndex(event.detail);
    };

    window.addEventListener('jumpToImage', handleJumpToImage as EventListener);
    return () => {
      window.removeEventListener('jumpToImage', handleJumpToImage as EventListener);
    };
  }, []);

  return (
    <div className="pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Tab Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {reinesVerkaufsszenario ? "Reines Verkaufsszenario - Komplettübersicht" : "Komplettübersicht - Investmentcase"} ({projectName})
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {reinesVerkaufsszenario 
              ? "Fokussierte Übersicht für reine Verkaufsstrategien ohne laufende Einnahmen. Nur relevante Bereiche für Verkaufsszenarien werden angezeigt."
              : "Umfassende Übersicht über dein Immobilieninvestment mit allen wichtigen Kennzahlen, Analysen und Finanzierungsparametern auf einen Blick."
            }
          </p>
        </div>

        {/* Reines Verkaufsszenario Hinweis */}
        {reinesVerkaufsszenario && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Reines Verkaufsszenario aktiviert</h3>
                  <p className="text-sm text-orange-700">
                    In diesem Modus werden nur die für Verkaufsstrategien relevanten Bereiche angezeigt. 
                    Charts und Cashflow-Tabellen, die für laufende Einnahmen relevant sind, werden ausgeblendet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Investment-Story */}
        <section className="py-4 mb-6 sm:py-8 sm:mb-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Investment-Story</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
            
            {/* Investment Story - Vereint in einem großen Bereich */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">Investment Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Beschreibung */}
                {texts.beschreibung && texts.beschreibung.trim().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Beschreibung</h4>
                    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                      {texts.beschreibung}
                    </p>
                  </div>
                )}

                {/* Lage */}
                {texts.lage && texts.lage.trim().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lage</h4>
                    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                      {texts.lage}
                    </p>
                  </div>
                )}

                {/* Entwicklungspotenzial */}
                {texts.entwicklungspotenzial && texts.entwicklungspotenzial.trim().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Entwicklungspotenzial</h4>
                    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                      {texts.entwicklungspotenzial}
                    </p>
                  </div>
                )}

                {/* Weiteres */}
                {texts.weiteres && texts.weiteres.trim().length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Weiteres</h4>
                    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                      {texts.weiteres}
                    </p>
                  </div>
                )}

                {/* Fallback: Alte Story, wenn keine neuen Felder ausgefüllt sind */}
                {!texts.beschreibung && !texts.lage && !texts.entwicklungspotenzial && !texts.weiteres && storyParagraphs.length > 0 && (
                  <div>
                    {storyParagraphs.map((p, i) => (
                      <p key={i} className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4 last:mb-0">
                        {p}
                      </p>
                    ))}
                  </div>
                )}

                {/* Fallback wenn nichts ausgefüllt ist */}
                {!texts.beschreibung && !texts.lage && !texts.entwicklungspotenzial && !texts.weiteres && storyParagraphs.length === 0 && (
                  <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400 italic">
                    Keine Investment Story verfügbar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Übersicht Tab Inhalt */}
        <div className="mb-8">
          {/* Hier wird der Inhalt des ersten Tabs eingefügt */}
        </div>

        {/* Objekt-Übersicht */}
        <section className="py-4 mb-6 sm:py-8 sm:mb-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Objekt-Übersicht</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Objekt-Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Adresse */}
              {assumptions.adresse && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Adresse</div>
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{assumptions.adresse}</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Objekttyp</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{assumptions.objektTyp}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Gesamtfläche</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{totalFlaeche} m²</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Baujahr</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assumptions.baujahr || 'N/A'}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bauart</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{assumptions.bauart}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">HWB</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assumptions.energiewerte.hwb || 'N/A'} kWh/m²a</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">FGEE</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assumptions.energiewerte.fgee || 'N/A'}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Heizung</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assumptions.energiewerte.heizung || 'N/A'}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dachung</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assumptions.energiewerte.dachung || 'N/A'}</div>
                </div>
              </div>

              {/* Einheiten-Übersicht */}
              {assumptions.units.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Einheiten-Übersicht</h3>
                  
                  {/* Zusammenfassung */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{assumptions.units.length}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Gesamt</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{assumptions.units.filter(u => u.typ === 'wohnung').length}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Wohnungen</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{assumptions.units.filter(u => u.typ === 'gewerbe').length}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Gewerbe</div>
                    </div>
                  </div>
                  
                  {/* Detaillierte Einheiten */}
                  <div className="space-y-4">
                    {assumptions.units.map((unit, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{unit.bezeichnung}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">({unit.stockwerk})</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{unit.flaeche} m²</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{unit.miete.toLocaleString('de-AT')} €/m²</div>
                          </div>
                        </div>
                        
                        {/* Einheitendetails */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {unit.zimmer && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 dark:text-slate-400">Zimmer:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{unit.zimmer}</span>
                            </div>
                          )}
                          {unit.schlafzimmer && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 dark:text-slate-400">Schlafzimmer:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{unit.schlafzimmer}</span>
                            </div>
                          )}
                          {unit.balkon && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 dark:text-slate-400">Balkon:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{unit.balkonGroesse}m²</span>
                            </div>
                          )}
                          {unit.keller && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 dark:text-slate-400">Keller:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{unit.kellerGroesse}m²</span>
                            </div>
                          )}
                          {unit.parkplatz && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 dark:text-slate-400">Parkplatz:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{unit.parkplatzAnzahl}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sanierungen */}
              {assumptions.sanierungen.length > 0 && assumptions.sanierungen.some(s => s.trim() !== '') && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Sanierungen</h3>
                  <div className="space-y-2">
                    {assumptions.sanierungen.filter(s => s.trim() !== '').map((sanierung, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span>{sanierung}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </section>

        {/* Finanzierungsparameter */}
        <section className="py-4 mb-6 sm:py-8 sm:mb-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Finanzierungsparameter</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Finanzierungsparameter aus Einstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Grunddaten</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Kaufpreis:</span>
                      <span className="font-medium">{fmtEUR(assumptions.kaufpreis)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Eigenkapitalquote:</span>
                      <span className="font-medium">{formatPercent(assumptions.ekQuote) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Darlehen:</span>
                      <span className="font-medium">{fmtEUR(finCases[scenario].darlehen)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Finanzierung</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Zinssatz:</span>
                      <span className="font-medium">{formatPercent(finCases[scenario].zinssatz) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tilgung:</span>
                      <span className="font-medium">{formatPercent(assumptions.tilgung) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Laufzeit:</span>
                      <span className="font-medium">{laufzeitAuto} Jahre</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Einnahmen</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Einnahmen J1:</span>
                      <span className="font-medium">{fmtEUR(finCases[scenario].einnahmenJ1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Wachstum:</span>
                      <span className="font-medium">{formatPercent(finCases[scenario].einnahmenWachstum) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Leerstand:</span>
                      <span className="font-medium">{formatPercent(finCases[scenario].leerstand) || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </section>

        {/* Investment Score - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
          <section className="py-4 mb-6 sm:py-8 sm:mb-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
              <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Investment Score</h2>
                <div className="w-16 h-0.5 bg-white"></div>
              </div>
              <div className="shadow-lg rounded-xl overflow-hidden">
                <InvestmentScoreSection score={score} metrics={metrics} />
              </div>
            </div>
          </section>
        )}

        {/* Schnellübersicht Kennzahlen - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
          <section className="py-4 mb-6 sm:py-8 sm:mb-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
              <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Schnellübersicht</h2>
                <div className="w-16 h-0.5 bg-white"></div>
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:[--card-h:240px] md:[--card-h:260px] lg:[--card-h:260px]">
              {selectedCards.map((cardKey) => {
                const card = availableCards[cardKey];
                if (!card) return null;
                
                return (
                  <Card key={cardKey} className="text-white shadow-lg border border-gray-700 rounded-2xl h-[var(--card-h)] transition-all duration-200 hover:shadow-xl relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
                      style={{
                        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWU0MDY2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAzNzBmMztzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDY2NmNjO3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudCkiIC8+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyNTAiIHI9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-900/80 to-slate-800/85"></div>
                    <CardHeader className="pb-3 relative z-10">
                      <CardTitle className="text-base flex items-center gap-2 font-semibold text-white">
                        {card.title}
                        <InfoTooltip content={card.tooltip} />
                      </CardTitle>
                      {card.controls && card.controls}
                    </CardHeader>
                    <CardContent className="pt-0 text-white relative z-10">
                      {card.content}
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>
          </section>
        )}

        {/* Exit-Szenarien - nur anzeigen wenn tatsächlich berechnet */}
        {isExitScenarioCalculated(exitScenarioInputs) && (
          <section className="py-4 mb-6 sm:py-8 sm:mb-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
              <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Exit-Szenarien</h2>
                <div className="w-16 h-0.5 bg-white"></div>
              </div>
              <div className="shadow-lg rounded-xl overflow-hidden">
                <div className="p-6">
                  <MultiScenarioResults 
                    onEditScenario={(scenarioId) => {
                      // Hier könnte man zur Bearbeitung navigieren
                      console.log("Bearbeite Szenario:", scenarioId);
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Charts - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
          <section className="py-4 mb-6 sm:py-8 sm:mb-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
              <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Finanzielle Entwicklung</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 [--card-h:400px] sm:[--card-h:350px] lg:[--card-h:360px]">
          <Card className="h-[var(--card-h)] flex flex-col rounded-2xl shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">FCF-Entwicklung (Jahr 1–15)</CardTitle>
                <InfoTooltip content={`Positiver Cashflow ab Jahr ${cfPosAb || "–"} (Annuität ${fmtEUR(fin.annuitaet)}, BK ${fmtEUR(bkJ1)} p.a.).`} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-[250px] sm:min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                  <AreaChart data={chartData} margin={{ left: 5, right: 10, top: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="fcf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={40} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    <Legend />
                    <Area type="monotone" dataKey="FCF" name="Freier Cashflow" stroke="#06b6d4" fill="url(#fcf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[var(--card-h)] flex flex-col rounded-2xl shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Restschuld vs. Immobilienwert (konservativ)</CardTitle>
                <InfoTooltip content={`Wertsteigerung aktuell ${Math.round(cfg.wertSteigerung * 100)}% p.a. auf Kaufpreis unterstellt.`} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-[250px] sm:min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                  <LineChart data={chartData} margin={{ left: 5, right: 10, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="Jahr" />
                    <YAxis tickFormatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                      return num.toString();
                    }} width={40} />
                    <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                    <Legend />
                    <Line type="monotone" dataKey="Restschuld" stroke="#4338ca" name="Restschuld" strokeWidth={2} />
                    <Line type="monotone" dataKey="Immobilienwert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </div>
          </div>
        </section>
        )}

        {/* 5/10/15 Jahre Equity & Zuwachs Vergleich - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
        <section className="py-4 mb-6 sm:py-8 sm:mb-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
          {(() => {
            const points = [5, 10, 15] as const;
            const rows = points.map((p) => {
              const Vt = cfg.kaufpreis * Math.pow(1 + (cfg.wertSteigerung || 0), p);
              const cumFcfT = PLAN_30Y.slice(0, p).reduce((s, r) => s + r.fcf, 0);
              const cumTilgungT = PLAN_30Y.slice(0, p).reduce((s, r) => s + r.tilgung, 0);
              const zuwachs = cumTilgungT + (Vt - cfg.kaufpreis) + cumFcfT;
              
              // Eingesetztes Eigenkapital abziehen (EK₀) - gleiche Formel wie Vermögenszuwachs
              const initialEquity = (nkInLoan ? cfg.kaufpreis : cfg.kaufpreis + NKabs) - L0;
              const nettoZuwachs = zuwachs - initialEquity;
              
              return {
                Periode: `${p} J.`,
                Equity: Vt - PLAN_30Y[p - 1].restschuld,
                Zuwachs: nettoZuwachs,
                Restschuld: PLAN_30Y[p - 1].restschuld,
                Wertzuwachs: Vt - cfg.kaufpreis,
              };
            });

            return (
              <Card className="h-[450px] sm:h-[400px] flex flex-col shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</CardTitle>
                    <InfoTooltip content={`Definition: Equity = Marktwert − Restschuld, Netto-Zuwachs = ΣWertzuwachs + ΣTilgung + ΣFCF - EK₀ (${fmtEUR((nkInLoan ? cfg.kaufpreis : cfg.kaufpreis + NKabs) - L0)}).`} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-full min-h-[250px] sm:min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                      <LineChart data={rows} margin={{ left: 5, right: 10, top: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Periode" />
                        <YAxis tickFormatter={(v) => {
                          const num = typeof v === "number" ? v : Number(v);
                          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                          if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                          return num.toString();
                        }} width={40} />
                        <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                        <Legend />
                        <Line type="monotone" dataKey="Equity" name="Immobilien-Equity" stroke="#0ea5e9" strokeWidth={2} />
                        <Line type="monotone" dataKey="Zuwachs" name="Netto-Vermögenszuwachs" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          </div>
          </section>
        )}

        {/* Wertzuwachs Chart und Tabelle - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
        <section className="py-4 mb-6 sm:py-8 sm:mb-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Wertzuwachs der Immobilie</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wertzuwachs Chart */}
            <Card className="h-[450px] sm:h-[400px] flex flex-col shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Wertzuwachs der Immobilie</CardTitle>
                  <InfoTooltip content="Zeigt die Entwicklung des Immobilienwerts über die Jahre basierend auf der unterstellten Wertsteigerung." />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="h-full min-h-[250px] sm:min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <LineChart data={valueGrowthData} margin={{ left: 5, right: 10, top: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Jahr" />
                      <YAxis tickFormatter={(v) => {
                        const num = typeof v === "number" ? v : Number(v);
                        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                        return num.toString();
                      }} width={40} />
                      <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                      <Legend />
                      <Line type="monotone" dataKey="Wert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Wertzuwachs Tabelle */}
            <Card className="h-[450px] sm:h-[400px] flex flex-col shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Wertzuwachs Tabelle</CardTitle>
                  <InfoTooltip content="Detaillierte Tabelle mit dem Wertzuwachs der Immobilie über die Jahre, einschließlich absoluter und prozentualer Veränderungen." />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto border border-slate-200 rounded">
                  <div className="min-w-[320px] sm:min-w-[420px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <tr className="text-left text-slate-500">
                          <th className="py-1 pr-3">Jahr</th>
                          <th className="py-1 pr-3">Wert</th>
                          <th className="py-1 pr-3">Zuwachs ggü. Start</th>
                          <th className="py-1 pr-3">Zuwachs %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {valueGrowthTable.map((r) => (
                          <tr key={r.Jahr} className="border-t border-slate-200">
                            <td className="py-1 pr-3">{r.Jahr}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.Wert)}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.Zuwachs)}</td>
                            <td className="py-1 pr-3">{formatPercent(r.ZuwachsPct) ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </section>
        )}

        {/* Cashflow-Detail - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
        <section className="py-4 mb-6 sm:py-8 sm:mb-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Cashflow-Detail</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
          <Card className="h-[400px] flex flex-col shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Cashflow‑Detail (Auszug Jahre 1–{laufzeitAuto || 30})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto border border-slate-200 dark:border-slate-700 rounded">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-3">Jahr</th>
                        <th className="py-2 pr-3">Zinsen</th>
                        <th className="py-2 pr-3">Tilgung</th>
                        <th className="py-2 pr-3">Annuität</th>
                        <th className="py-2 pr-3">Restschuld</th>
                        <th className="py-2 pr-3">Einnahmen</th>
                        <th className="py-2 pr-3">Ausgaben</th>
                        <th className="py-2 pr-3">FCF</th>
                        <th className="py-2 pr-3">ROI</th>
                        <th className="py-2 pr-3">ROE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLAN_LAUFZEIT.map((r) => {
                        // Jährlicher ROI: (Einnahmen - BK) / Investition
                        const jaehrlicherROI = investUnlevered > 0 ? (r.einnahmen - bkJ1) / investUnlevered : 0;
                        
                        // Jährlicher ROE: FCF / Eigenkapital
                        const ek0 = (nkInLoan ? V0 : V0 + NKabs) - L0;
                        const jaehrlicherROE = ek0 > 0 ? r.fcf / ek0 : 0;
                        
                        return (
                          <tr key={r.jahr} className="border-t border-slate-200 dark:border-slate-700">
                            <td className="py-1 pr-3">{r.jahr}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.zins)}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.tilgung)}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.annuitaet)}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.restschuld)}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.einnahmen)}</td>
                            <td className="py-1 pr-3">{fmtEUR(r.ausgaben)}</td>
                            <td className={`py-1 pr-3 font-medium ${r.fcf > 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtEUR(r.fcf)}</td>
                            <td className={`py-1 pr-3 font-medium ${jaehrlicherROI > 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPercent(jaehrlicherROI)}</td>
                            <td className={`py-1 pr-3 font-medium ${jaehrlicherROE > 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPercent(jaehrlicherROE)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Annuität {fmtEUR(fin.annuitaet)} p.a. | BK {fmtEUR(bkJ1)} p.a. | Einnahmen starten bei {fmtEUR(fin.einnahmenJ1)} und wachsen mit {Math.round(fin.einnahmenWachstum * 100)}% p.a.</p>
            </CardContent>
          </Card>
          </div>
        </section>
        )}

        {/* Marktvergleich - nur anzeigen wenn nicht reines Verkaufsszenario */}
        {!reinesVerkaufsszenario && (
        <section className="py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Marktvergleich</h2>
              <div className="w-16 h-0.5 bg-white"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
            {/* Bestand Chart */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Marktvergleich Salzburg - Bestand (Auszug)</CardTitle>
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
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Marktvergleich Salzburg - Neubau (Auszug)</CardTitle>
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
        </section>
        )}

        {/* Projekt-Dokumente (PDFs und Fotos) */}
        {(pdfs.length > 0 || images.length > 0) && (
          <section className="py-4 mb-6 sm:py-8 sm:mb-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
              <div className="bg-black px-3 py-3 mb-6 sm:px-6 sm:py-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Projekt-Dokumente</h2>
                <div className="w-16 h-0.5 bg-white"></div>
              </div>
              
              {/* PDFs */}
              {pdfs.length > 0 && (
                <div className="mb-8">
                  <PDFViewer 
                    pdfs={pdfs} 
                    title="PDF-Dokumente"
                    showDownloadButtons={true}
                  />
                </div>
              )}
              
              {/* Fotos */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Projekt-Fotos ({images.length})
                      </h3>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {images.length} Fotos
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                        <div className="relative">
                          <img
                            src={image.src}
                            alt={image.caption}
                            width={400}
                            height={192}
                            className="w-full h-48 object-cover"
                          />
                          <button
                            className="absolute top-2 right-2 w-8 h-8 p-0 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Öffne das Foto in einem Swipe-Modal
                              openSwipeModal(index);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-sm mb-2 truncate">
                            {image.caption}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">
                            {image.width} × {image.height}px
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = image.src;
                                link.download = `bild_${index + 1}.jpg`;
                                link.click();
                              }}
                              className="flex-1 gap-1 text-xs"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </button>
                            <button
                              onClick={() => openSwipeModal(index)}
                              className="flex-1 gap-1 text-xs"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ansehen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* Swipe Modal für Fotos */}
      {swipeModalOpen && images.length > 0 && (
        <SwipeModal
          images={images}
          currentIndex={currentImageIndex}
          onClose={closeSwipeModal}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </div>
  );
}
