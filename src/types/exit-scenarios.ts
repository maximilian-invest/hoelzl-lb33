export type VerkaufspreisTyp = "pauschal" | "pro_quadratmeter";

export interface ExitScenarioInputs {
  // Grunddaten
  kaufpreis: number;
  nebenkosten: number;
  darlehenStart: number;
  eigenkapital: number;
  wohnflaeche: number; // m² für Verkaufspreis pro m²
  
  // Exit-Parameter
  exitJahr: number; // 1-30 Jahre
  reinesVerkaufsszenario: boolean; // Reines Verkaufsszenario ohne FCF-Berechnung
  
  // Verkaufs-spezifisch
  verkaufspreisTyp: VerkaufspreisTyp;
  verkaeuferpreisPauschal?: number; // Pauschaler Verkaufspreis
  verkaeuferpreisProM2?: number; // Verkaufspreis pro m²
  
  // Verkaufskosten
  maklerprovision: number; // 5-6%
  
  // Zusätzliche Kosten vor Verkauf
  sanierungskosten: number; // Sanierungskosten vor Verkauf
  notarkosten: number; // Notarkosten
  grunderwerbsteuer: number; // Grunderwerbsteuer (falls anwendbar)
  weitereKosten: number; // Weitere Kosten (z.B. Gutachten, etc.)
  
  // Steuern (nicht mehr verwendet)
  steuersatz: number; // Kapitalertragssteuer
  abschreibung: number; // AfA p.a.
  
  // Marktwert aus Detailanalyse
  marktwertNachJahren?: number; // Marktwert der Immobilie nach X Jahren
  propertyValueByYear: number[]; // Alle Marktwerte für dynamische Berechnung
  wachstumsrate?: number; // Wachstumsrate für Berechnungen
  marktSzenario?: string; // Markt-Szenario
  
  // Cashflow-Daten
  jaehrlicheMieteinnahmen: number[];
  jaehrlicheBetriebskosten: number[];
  jaehrlicheTilgung: number[];
  jaehrlicheZinsen: number[];
}

export interface ExitScenarioResult {
  exitJahr: number;
  
  // Finanzielle Kennzahlen
  irr: number;
  roi: number;
  totalReturn: number;
  
  // Cashflow-Analyse
  jaehrlicheCashflows: number[];
  kumulierteCashflows: number[];
  kumulierterFCF: number; // Kumulierter Free Cash Flow bis zum Exit
  
  // Jährliche Finanzierungsdaten
  jaehrlicheTilgung: number[];
  jaehrlicheZinsen: number[];
  
  // Exit-Details
  verkaeuferpreis: number;
  restschuld: number;
  exitKosten: number;
  nettoExitErloes: number;
  steuerlast: number;
  
  // Detaillierte Kostenaufschlüsselung
  kostenAufschlüsselung: {
    maklerprovision: number;
    sanierungskosten: number;
    notarkosten: number;
    grunderwerbsteuer: number;
    weitereKosten: number;
    gesamtKosten: number;
  };
  
  // Berechnung: (Verkaufspreis - Restschuld) + kumulierter FCF
  gesamtErloes: number;
}

export interface ExitScenarioWarning {
  typ: "risiko" | "steuer" | "liquiditaet";
  schweregrad: "niedrig" | "mittel" | "hoch";
  nachricht: string;
  empfehlung?: string;
}

export interface ExitScenarioReport {
  inputs: ExitScenarioInputs;
  result: ExitScenarioResult;
  warnings: ExitScenarioWarning[];
  charts: {
    cashflowChart: unknown[];
  };
  erstelltAm: Date;
}

