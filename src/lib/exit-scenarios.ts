import { 
  ExitScenarioInputs, 
  ExitScenarioResult, 
  ExitScenarioWarning,
  ExitScenarioReport,
  // VerkaufspreisTyp
} from "@/types/exit-scenarios";
import { irr } from "@/lib/upside";

/**
 * Berechnet den Verkaufspreis basierend auf Typ und Eingaben
 */
export function berechneVerkaufspreis(
  inputs: ExitScenarioInputs
): number {
  if (inputs.verkaufspreisTyp === "pauschal") {
    return inputs.verkaeuferpreisPauschal || 0;
  } else {
    // Pro Quadratmeter
    return (inputs.verkaeuferpreisProM2 || 0) * inputs.wohnflaeche;
  }
}

/**
 * Berechnet Verkaufskosten (nur Maklerprovision)
 */
export function berechneVerkaufskosten(
  verkaeuferpreis: number,
  maklerprovision: number
): number {
  return verkaeuferpreis * (maklerprovision / 100);
}

/**
 * Berechnet Kapitalertragssteuer (entfernt - wird nicht mehr verwendet)
 */
export function berechneKapitalertragssteuer(
  _verkaeuferpreis: number,
  _kaufpreis: number,
  _nebenkosten: number,
  _abschreibung: number,
  _haltungsdauer: number,
  _steuersatz: number
): number {
  // Steuern werden nicht mehr berücksichtigt
  return 0;
}

/**
 * Berechnet jährliche Cashflows für die Haltedauer
 * Vereinfacht: Verwendet die echten FCF-Daten aus der Cashflow-Analyse
 */
export function berechneJaehrlicheCashflows(inputs: ExitScenarioInputs): number[] {
  const cashflows: number[] = [];
  
  // Jahr 0: Initiale Investition (negativ)
  const initialeInvestition = inputs.eigenkapital + (inputs.nebenkosten || 0);
  cashflows.push(-initialeInvestition);
  
  // Sicherstellen, dass alle Arrays vorhanden sind
  const mieteinnahmen = Array.isArray(inputs.jaehrlicheMieteinnahmen) ? inputs.jaehrlicheMieteinnahmen : Array(30).fill(30000);
  const betriebskosten = Array.isArray(inputs.jaehrlicheBetriebskosten) ? inputs.jaehrlicheBetriebskosten : Array(30).fill(8000);
  const zinsen = Array.isArray(inputs.jaehrlicheZinsen) ? inputs.jaehrlicheZinsen : Array(30).fill(16000);
  const tilgung = Array.isArray(inputs.jaehrlicheTilgung) ? inputs.jaehrlicheTilgung : Array(30).fill(20000);
  
  // Jahre 1 bis exitJahr: Mieteinnahmen - Betriebskosten - Zinsen - Tilgung
  // Das entspricht dem Free Cash Flow (FCF) aus der Detailanalyse
  for (let jahr = 1; jahr <= inputs.exitJahr; jahr++) {
    const mieteinnahmenJahr = mieteinnahmen[jahr - 1] || 30000;
    const betriebskostenJahr = betriebskosten[jahr - 1] || 8000;
    const zinsenJahr = zinsen[jahr - 1] || 16000;
    const tilgungJahr = tilgung[jahr - 1] || 20000;
    
    const cashflow = mieteinnahmenJahr - betriebskostenJahr - zinsenJahr - tilgungJahr;
    cashflows.push(cashflow);
  }
  
  return cashflows;
}

/**
 * Berechnet den kumulierten FCF direkt aus den echten FCF-Daten
 * Verwendet die FCF-Werte aus der Cashflow-Detailansicht
 */
export function berechneKumuliertenFCF(inputs: ExitScenarioInputs): number {
  // Berechne den FCF aus den echten Daten: Mieteinnahmen - Betriebskosten - Zinsen - Tilgung
  const mieteinnahmen = Array.isArray(inputs.jaehrlicheMieteinnahmen) ? inputs.jaehrlicheMieteinnahmen : [];
  const betriebskosten = Array.isArray(inputs.jaehrlicheBetriebskosten) ? inputs.jaehrlicheBetriebskosten : [];
  const zinsen = Array.isArray(inputs.jaehrlicheZinsen) ? inputs.jaehrlicheZinsen : [];
  const tilgung = Array.isArray(inputs.jaehrlicheTilgung) ? inputs.jaehrlicheTilgung : [];
  
  // Kumuliere nur die FCF-Werte für die Haltedauer
  let kumulierterFCF = 0;
  for (let jahr = 0; jahr < inputs.exitJahr; jahr++) {
    const mieteinnahmenJahr = mieteinnahmen[jahr] || 0;
    const betriebskostenJahr = betriebskosten[jahr] || 0;
    const zinsenJahr = zinsen[jahr] || 0;
    const tilgungJahr = tilgung[jahr] || 0;
    
    // FCF = Mieteinnahmen - Betriebskosten - Zinsen - Tilgung
    const fcfJahr = mieteinnahmenJahr - betriebskostenJahr - zinsenJahr - tilgungJahr;
    kumulierterFCF += fcfJahr;
  }
  
  return kumulierterFCF;
}

/**
 * Berechnet die Restschuld zum Exit-Zeitpunkt
 * Vereinfacht: Verwendet die echten Tilgungsdaten aus der Cashflow-Analyse
 */
export function berechneRestschuld(inputs: ExitScenarioInputs): number {
  const darlehenStart = inputs.darlehenStart;
  
  // Sicherstellen, dass jaehrlicheTilgung ein Array ist
  const tilgung = Array.isArray(inputs.jaehrlicheTilgung) ? inputs.jaehrlicheTilgung : Array(30).fill(20000);
  
  // Kumulierte Tilgung bis zum Exit-Jahr
  const tilgungen = tilgung.slice(0, inputs.exitJahr);
  const gesamtTilgung = tilgungen.reduce((sum, tilgung) => sum + tilgung, 0);
  
  return Math.max(0, darlehenStart - gesamtTilgung);
}

/**
 * Berechnet Exit-Szenario für Verkauf - Vereinfachte Version
 * Formel: (Verkaufspreis - Restschuld) + kumulierter FCF
 */
export function berechneVerkaufSzenario(inputs: ExitScenarioInputs): ExitScenarioResult {
  const verkaeuferpreis = berechneVerkaufspreis(inputs);
  const restschuld = berechneRestschuld(inputs);
  
  // Verkaufskosten berechnen
  const verkaufskosten = berechneVerkaufskosten(
    verkaeuferpreis,
    inputs.maklerprovision
  );
  
  // Steuerlast wird nicht mehr berücksichtigt
  const steuerlast = 0;
  
  // Netto-Exit-Erlös (nur nach Verkaufskosten)
  const nettoExitErloes = verkaeuferpreis - verkaufskosten;
  
  // Jährliche Cashflows berechnen
  const jaehrlicheCashflows = berechneJaehrlicheCashflows(inputs);
  
  // Kumulierte Cashflows berechnen
  const kumulierteCashflows = jaehrlicheCashflows.reduce((acc, cf, index) => {
    acc.push((acc[index - 1] || 0) + cf);
    return acc;
  }, [] as number[]);
  
  // Kumulierter FCF direkt aus den echten FCF-Daten berechnen
  const kumulierterFCF = berechneKumuliertenFCF(inputs);
  
  // Hauptberechnung: (Verkaufspreis - Restschuld) + kumulierter FCF
  const gesamtErloes = (verkaeuferpreis - restschuld) + kumulierterFCF;
  
  // IRR berechnen (mit Exit-Erlös im letzten Jahr)
  const cashflowsMitExit = [...jaehrlicheCashflows];
  cashflowsMitExit[cashflowsMitExit.length - 1] += nettoExitErloes;
  const irrWert = irr(cashflowsMitExit) * 100;
  
  // ROI berechnen
  const totalReturn = (gesamtErloes - inputs.eigenkapital) / inputs.eigenkapital * 100;
  
  return {
    exitJahr: inputs.exitJahr,
    irr: irrWert,
    roi: totalReturn,
    totalReturn,
    jaehrlicheCashflows,
    kumulierteCashflows,
    kumulierterFCF,
    jaehrlicheTilgung: inputs.jaehrlicheTilgung,
    jaehrlicheZinsen: inputs.jaehrlicheZinsen,
    verkaeuferpreis,
    restschuld,
    exitKosten: verkaufskosten,
    nettoExitErloes,
    steuerlast,
    gesamtErloes
  };
}

/**
 * Hauptfunktion: Berechnet das Verkauf-Szenario
 */
export function berechneExitSzenario(inputs: ExitScenarioInputs): ExitScenarioResult {
  console.log("Starte berechneExitSzenario mit:", inputs);
  
  try {
    console.log("Berechne Verkauf-Szenario...");
    const result = berechneVerkaufSzenario(inputs);
    console.log("Verkauf-Szenario erfolgreich:", result);
    return result;
  } catch (error) {
    console.error("Fehler bei Verkauf-Szenario:", error);
    throw new Error(`Fehler bei der Berechnung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Generiert Warnungen basierend auf den Ergebnissen
 */
export function generiereWarnungen(
  inputs: ExitScenarioInputs, 
  result: ExitScenarioResult
): ExitScenarioWarning[] {
  const warnings: ExitScenarioWarning[] = [];
  
  // IRR-Warnungen
  if (result.irr < 5) {
    warnings.push({
      typ: "risiko",
      schweregrad: "hoch",
      nachricht: "Niedrige IRR-Werte (<5%) deuten auf unattraktive Renditen hin.",
      empfehlung: "Überprüfen Sie die Investitionsparameter oder erwägen Sie alternative Strategien."
    });
  }
  
  // Negative Cashflows
  if (result.jaehrlicheCashflows && result.jaehrlicheCashflows.some(cf => cf < 0)) {
    warnings.push({
      typ: "liquiditaet",
      schweregrad: "mittel",
      nachricht: "Negative Cashflows in bestimmten Jahren erfordern Liquiditätsreserven.",
      empfehlung: "Stellen Sie ausreichende Liquiditätsreserven für diese Perioden bereit."
    });
  }
  
  // Hohe Steuerlast
  if (result.steuerlast > result.nettoExitErloes * 0.3) {
    warnings.push({
      typ: "steuer",
      schweregrad: "mittel",
      nachricht: "Hohe Steuerlast (>30% des Nettoerlöses) reduziert die Rendite erheblich.",
      empfehlung: "Erwägen Sie steueroptimierte Exit-Strategien oder längere Haltedauer."
    });
  }
  
  return warnings;
}

/**
 * Erstellt einen vollständigen Exit-Szenario-Bericht
 */
export function erstelleExitSzenarioBericht(inputs: ExitScenarioInputs): ExitScenarioReport {
  const result = berechneExitSzenario(inputs);
  const warnings = generiereWarnungen(inputs, result);
  
  // Charts-Daten vorbereiten
  const charts = {
    cashflowChart: [{
      jahre: Array.from({ length: result.jaehrlicheCashflows?.length || 0 }, (_, i) => i),
      cashflows: result.jaehrlicheCashflows || [],
      kumuliert: result.kumulierteCashflows || []
    }]
  };
  
  return {
    inputs,
    result,
    warnings,
    charts,
    erstelltAm: new Date()
  };
}
