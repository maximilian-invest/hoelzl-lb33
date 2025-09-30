"use client";

import React, { useState, useEffect } from "react";
import { CompleteOverviewTab } from "@/components/CompleteOverviewTab";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { type District } from "@/types/districts";
import { safeGetItem } from "@/lib/storage-utils";
import { ExitScenarioInputs } from "@/types/exit-scenarios";

// Hilfsfunktion um zu prüfen, ob ein Exit-Szenario als berechnet gilt
const isExitScenarioCalculated = (inputs?: ExitScenarioInputs | null): boolean => {
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

// Importiere alle benötigten Funktionen und Hooks
import { calculateScore } from "@/logic/score";
import { formatEUR, formatPercent } from "@/lib/format";
import type { ScoreResult, ContextMetrics } from "@/types/score";


export default function KomplettuebersichtPage() {
  // State für alle benötigten Daten
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [metrics, setMetrics] = useState<ContextMetrics | null>(null);
  const [chartData, setChartData] = useState<Array<Record<string, number>>>([]);
  const [valueGrowthData, setValueGrowthData] = useState<Array<Record<string, number>>>([]);
  const [valueGrowthTable, setValueGrowthTable] = useState<Array<{ Jahr: number; Wert: number; Zuwachs: number; ZuwachsPct: number; }>>([]);
  const [PLAN_30Y, setPLAN_30Y] = useState<Array<{ fcf: number; tilgung: number; restschuld: number; }>>([]);
  const [PLAN_LAUFZEIT, setPLAN_LAUFZEIT] = useState<Array<{ einnahmen: number; fcf: number; jahr: number; zins: number; tilgung: number; annuitaet: number; restschuld: number; ausgaben: number; }>>([]);
  const [investUnlevered, setInvestUnlevered] = useState(0);
  const [nkInLoan, setNkInLoan] = useState(false);
  const [NKabs, setNKabs] = useState(0);
  const [V0, setV0] = useState(0);
  const [L0, setL0] = useState(0);
  const [fin, setFin] = useState({
    annuitaet: 0,
    einnahmenJ1: 0,
    einnahmenWachstum: 0,
    zinssatz: 0,
  });
  const [cfg, setCfg] = useState({
    wertSteigerung: 0,
    kaufpreis: 0,
  });
  const [cfPosAb, setCfPosAb] = useState(0);
  const [bkJ1, setBkJ1] = useState(0);
  const [laufzeitAuto, setLaufzeitAuto] = useState(30);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [availableCards, setAvailableCards] = useState<Record<string, { title: string; tooltip: string; content: React.ReactNode }>>({});
  const [kaufpreis, setKaufpreis] = useState(0);
  const [totalFlaeche, setTotalFlaeche] = useState(0);
  const [stadtteil, setStadtteil] = useState<District>("Innere Stadt");
  const [projectName, setProjectName] = useState("Beispielprojekt");
  const [storyParagraphs, setStoryParagraphs] = useState<string[]>([]);
  const [scenario] = useState<"bear" | "base" | "bull">("base");
  const [pdfs, setPdfs] = useState<Array<{src: string; name: string; description?: string}>>([]);
  const [texts, setTexts] = useState({
    beschreibung: "",
    lage: "",
    entwicklungspotenzial: "",
    weiteres: ""
  });
  const [exitScenarioInputs, setExitScenarioInputs] = useState<ExitScenarioInputs | undefined>(undefined);

  // Hook für Upside-Berechnungen
  // const { upside } = useUpside();

  // Lade Exit-Szenario-Eingaben aus localStorage
  useEffect(() => {
    try {
      const saved = safeGetItem('exit-scenario-inputs');
      if (saved) {
        const parsedInputs = JSON.parse(saved);
        setExitScenarioInputs(parsedInputs);
        console.log("Exit-Szenario-Eingaben geladen:", parsedInputs);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Exit-Szenario-Eingaben:", error);
    }
  }, []);

  // Initialisiere mit Beispieldaten
  useEffect(() => {
    // Beispiel-Assumptions
    const exampleAssumptions = {
      adresse: "Musterstraße 123, 5020 Salzburg",
      stadtteil: "Innere Stadt" as District,
      bauart: "bestand" as const,
      objektTyp: "Mehrfamilienhaus",
      baujahr: 1985,
      sanierungen: ["Fenster erneuert", "Heizung modernisiert", "Badezimmer renoviert"],
      energiewerte: {
        hwb: 120,
        fgee: "C",
        heizung: "Gas",
        dachung: "Ziegel",
        fenster: "Doppelverglasung",
        waermedaemmung: "Teilweise",
      },
      units: [
        {
          flaeche: 85,
          miete: 12,
          typ: "wohnung",
          stockwerk: "EG",
          bezeichnung: "Wohnung 1",
          balkon: true,
          balkonGroesse: 8,
          keller: true,
          kellerGroesse: 12,
          parkplatz: true,
          parkplatzAnzahl: 1,
          terrasse: false,
          garten: false,
          aufzug: false,
          einbaukueche: true,
          badewanne: true,
          dusche: true,
          wc: 1,
          zimmer: 3,
          schlafzimmer: 2,
        },
        {
          flaeche: 75,
          miete: 11,
          typ: "wohnung",
          stockwerk: "1. OG",
          bezeichnung: "Wohnung 2",
          balkon: true,
          balkonGroesse: 6,
          keller: true,
          kellerGroesse: 10,
          parkplatz: false,
          terrasse: false,
          garten: false,
          aufzug: false,
          einbaukueche: false,
          badewanne: false,
          dusche: true,
          wc: 1,
          zimmer: 2,
          schlafzimmer: 1,
        },
      ],
      kaufpreis: 450000,
      nebenkosten: 45000,
      ekQuote: 0.2,
      tilgung: 0.02,
      laufzeit: 30,
      marktMiete: 11.5,
      wertSteigerung: 0.03,
    };

    const exampleFinCases = {
      bear: {
        darlehen: 360000,
        zinssatz: 0.045,
        annuitaet: 21600,
        bkM2: 3.5,
        bkWachstum: 0.02,
        einnahmenJ1: 18000,
        einnahmenWachstum: 0.02,
        leerstand: 0.05,
        steuerRate: 0.25,
        afaRate: 0.025,
      },
      base: {
        darlehen: 360000,
        zinssatz: 0.035,
        annuitaet: 19800,
        bkM2: 3.0,
        bkWachstum: 0.025,
        einnahmenJ1: 19200,
        einnahmenWachstum: 0.025,
        leerstand: 0.03,
        steuerRate: 0.25,
        afaRate: 0.025,
      },
      bull: {
        darlehen: 360000,
        zinssatz: 0.025,
        annuitaet: 18000,
        bkM2: 2.5,
        bkWachstum: 0.03,
        einnahmenJ1: 20400,
        einnahmenWachstum: 0.03,
        leerstand: 0.01,
        steuerRate: 0.25,
        afaRate: 0.025,
      },
    };

    // Setze alle States
    setKaufpreis(exampleAssumptions.kaufpreis);
    setTotalFlaeche(160); // Summe der Flächen
    setProjectName("Musterprojekt Salzburg");
    setStoryParagraphs([
      "Dieses Mehrfamilienhaus in der Salzburger Altstadt bietet eine ausgezeichnete Investitionsmöglichkeit mit stabilem Mietertrag und langfristigem Wertsteigerungspotenzial.",
      "Die Immobilie wurde 1985 erbaut und wurde in den letzten Jahren umfassend saniert, wodurch sie moderne Standards erfüllt und gleichzeitig den Charme historischer Bausubstanz bewahrt.",
      "Mit zwei Wohnungen und einer Gesamtfläche von 160 m² liegt der Kaufpreis von 450.000 € deutlich unter dem Durchschnittspreis für vergleichbare Objekte in dieser Lage.",
      "Die prognostizierte Wertsteigerung von 3% p.a. und die stabile Mietrendite von ca. 4,3% machen diese Immobilie zu einer attraktiven langfristigen Investition.",
    ]);

    // Berechne Finanzdaten
    const currentFin = exampleFinCases.base;
    setFin({
      annuitaet: currentFin.annuitaet,
      einnahmenJ1: currentFin.einnahmenJ1,
      einnahmenWachstum: currentFin.einnahmenWachstum,
    });

    setCfg({
      wertSteigerung: exampleAssumptions.wertSteigerung,
      kaufpreis: exampleAssumptions.kaufpreis,
    });

    // Berechne weitere Werte
    setInvestUnlevered(exampleAssumptions.kaufpreis + exampleAssumptions.nebenkosten);
    setNkInLoan(false);
    setNKabs(exampleAssumptions.nebenkosten);
    setV0(exampleAssumptions.kaufpreis);
    setL0(exampleFinCases.base.darlehen);
    setCfPosAb(3);
    setBkJ1(480); // 3€/m² * 160m²
    setLaufzeitAuto(30);

    // Generiere Chart-Daten
    const chartData = [];
    const valueGrowthData = [];
    const valueGrowthTable = [];
    const plan30Y = [];
    const planLaufzeit = [];

    for (let jahr = 1; jahr <= 30; jahr++) {
      const wert = exampleAssumptions.kaufpreis * Math.pow(1 + exampleAssumptions.wertSteigerung, jahr);
      const fcf = jahr <= 5 ? -5000 + jahr * 2000 : 5000 + (jahr - 5) * 1000;
      const tilgung = jahr <= 30 ? 12000 : 0;
      const restschuld = Math.max(0, exampleFinCases.base.darlehen - (jahr - 1) * 12000);
      
      chartData.push({
        Jahr: jahr,
        FCF: fcf,
        Restschuld: restschuld,
        Immobilienwert: wert,
      });

      valueGrowthData.push({
        Jahr: jahr,
        Wert: wert,
      });

      valueGrowthTable.push({
        Jahr: jahr,
        Wert: wert,
        Zuwachs: wert - exampleAssumptions.kaufpreis,
        ZuwachsPct: ((wert - exampleAssumptions.kaufpreis) / exampleAssumptions.kaufpreis) * 100,
      });

      plan30Y.push({
        fcf: fcf,
        tilgung: tilgung,
        restschuld: restschuld,
      });

      if (jahr <= 30) {
        planLaufzeit.push({
          einnahmen: currentFin.einnahmenJ1 * Math.pow(1 + currentFin.einnahmenWachstum, jahr - 1),
          fcf: fcf,
          jahr: jahr,
          zins: restschuld * currentFin.zinssatz,
          tilgung: tilgung,
          annuitaet: currentFin.annuitaet,
          restschuld: restschuld,
          ausgaben: currentFin.bkM2 * 160,
        });
      }
    }

    setChartData(chartData);
    setValueGrowthData(valueGrowthData);
    setValueGrowthTable(valueGrowthTable);
    setPLAN_30Y(plan30Y);
    setPLAN_LAUFZEIT(planLaufzeit);

    // Berechne Score
    const scoreResult = calculateScore({
      avgPreisStadtteil: null,
      kaufpreisProM2: totalFlaeche > 0 ? exampleAssumptions.kaufpreis / totalFlaeche : 0,
      marktMiete: exampleAssumptions.marktMiete,
      avgMiete: totalFlaeche > 0 ? currentFin.einnahmenJ1 / totalFlaeche / 12 : 0,
      cfPosAb: 1, // Dummy-Wert
      finEinnahmenJ1: currentFin.einnahmenJ1,
      finLeerstand: currentFin.leerstand,
      bkJ1: totalFlaeche * currentFin.bkM2 * 12,
      annuitaet: currentFin.annuitaet,
      upsideBonus: 0,
      irr: 0.05, // Dummy-Wert
      project: {
        adresse: exampleAssumptions.adresse || "Beispieladresse",
        kaufpreis: exampleAssumptions.kaufpreis,
        nebenkosten: exampleAssumptions.nebenkosten,
        ekQuote: exampleAssumptions.ekQuote,
        tilgung: exampleAssumptions.tilgung,
        laufzeit: exampleAssumptions.laufzeit,
        units: exampleAssumptions.units || [],
      },
    });

    setScore(scoreResult.score);
    setMetrics(scoreResult.metrics);

    // Setze verfügbare Karten
    const cards = {
      irr: {
        title: "IRR",
        tooltip: "Interne Rendite: Die durchschnittliche jährliche Rendite der Investition",
        content: (
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{formatPercent(scoreResult.metrics.irr) || "—"}</div>
            <div className="text-sm text-gray-300 mt-1">p.a.</div>
          </div>
        ),
      },
      npv: {
        title: "NPV",
        tooltip: "Net Present Value: Der Barwert der Investition",
        content: (
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{formatEUR(100000)}</div>
            <div className="text-sm text-gray-300 mt-1">Barwert</div>
          </div>
        ),
      },
      roi: {
        title: "ROI",
        tooltip: "Return on Investment: Die Gesamtrendite der Investition",
        content: (
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{formatPercent(0.06) || "—"}</div>
            <div className="text-sm text-gray-300 mt-1">Gesamt</div>
          </div>
        ),
      },
    };

    setAvailableCards(cards);
    setSelectedCards(["irr", "npv", "roi"]);

    // Beispiel-PDFs für Demo - verwende öffentliche PDF-URLs
    const examplePdfs = [
      {
        src: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        name: "Investment-Studie.pdf",
        description: "Detaillierte Analyse der Immobilieninvestition mit allen Kennzahlen und Prognosen"
      },
      {
        src: "https://www.africau.edu/images/default/sample.pdf",
        name: "Finanzierungsplan.pdf",
        description: "Detaillierter Finanzierungsplan mit Tilgungsplan und Zinsberechnungen"
      },
      {
        src: "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf",
        name: "Marktanalyse.pdf",
        description: "Umfassende Marktanalyse mit Preisentwicklung und Vergleichsdaten"
      },
      {
        src: "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-download-10-mb.pdf",
        name: "Rechnungen.pdf",
        description: "Alle relevanten Rechnungen und Kostenvoranschläge"
      }
    ];

    setPdfs(examplePdfs);
  }, []);

  // Wrapper-Funktionen
  const fmtEUR = (n: number): string => formatEUR(n);
  const formatPercentWrapper = (n: number): string | null => formatPercent(n);

  const onStadtteilChange = (newStadtteil: District) => {
    setStadtteil(newStadtteil);
  };

  if (!score || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Komplettübersicht...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header mit Export-Button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Komplettübersicht - {projectName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Stand: {new Date().toLocaleDateString("de-AT")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Drucken/PDF
              </Button>
              <Button
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([document.documentElement.outerHTML], {type: 'text/html'});
                  element.href = URL.createObjectURL(file);
                  element.download = `komplettuebersicht-${projectName.toLowerCase().replace(/\s+/g, '-')}.html`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                variant="outline"
              >
                Als HTML speichern
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Komplettübersicht Inhalt */}
      <CompleteOverviewTab
        score={score}
        metrics={metrics}
        exitScenarioInputs={isExitScenarioCalculated(exitScenarioInputs) ? exitScenarioInputs : undefined}
        chartData={chartData}
        valueGrowthData={valueGrowthData}
        valueGrowthTable={valueGrowthTable}
        PLAN_30Y={PLAN_30Y}
        PLAN_LAUFZEIT={PLAN_LAUFZEIT}
        investUnlevered={investUnlevered}
        nkInLoan={nkInLoan}
        NKabs={NKabs}
        V0={V0}
        L0={L0}
        fin={fin}
        cfg={cfg}
        cfPosAb={cfPosAb}
        bkJ1={bkJ1}
        laufzeitAuto={laufzeitAuto}
        fmtEUR={fmtEUR}
        formatPercent={formatPercentWrapper}
        selectedCards={selectedCards}
        availableCards={availableCards}
        kaufpreis={kaufpreis}
        totalFlaeche={totalFlaeche}
        stadtteil={stadtteil}
        onStadtteilChange={onStadtteilChange}
        projectName={projectName}
        storyParagraphs={storyParagraphs}
        scenario={scenario}
        assumptions={{
          adresse: "Beispielstraße 1",
          stadtteil: stadtteil,
          bauart: "bestand" as const,
          objektTyp: "zinshaus",
          baujahr: 1990,
          sanierungen: [],
          energiewerte: {
            hwb: 0,
            fgee: 0,
            heizung: "",
            dachung: "",
            fenster: "",
            waermedaemmung: "",
          },
          units: [],
          kaufpreis: 500000,
          nebenkosten: 0.1,
          ekQuote: 0.2,
          tilgung: 0.02,
          laufzeit: 25,
          marktMiete: 12,
          wertSteigerung: 0.02,
        }}
        finCases={{
          bear: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
          base: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
          bull: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 }
        }}
        pdfs={pdfs}
        texts={texts}
      />
    </div>
    </ProtectedRoute>
  );
}
