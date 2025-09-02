export type ExitStrategy = 
  | "verkauf" 
  | "refinanzierung" 
  | "buy_and_hold" 
  | "exchange_1031" 
  | "wholesaling" 
  | "fix_and_flip" 
  | "rent_to_own" 
  | "vererbung";

export type MarketScenario = "bull" | "base" | "bear";

export interface ExitScenarioInputs {
  // Grunddaten
  kaufpreis: number;
  nebenkosten: number;
  darlehenStart: number;
  eigenkapital: number;
  
  // Exit-Parameter
  exitJahr: number; // 1-30 Jahre
  exitStrategie: ExitStrategy;
  marktSzenario: MarketScenario;
  
  // Verkaufs-spezifisch
  verkaeuferpreis?: number;
  wachstumsrate: number; // 2-5% p.a.
  maklerprovision: number; // 5-6%
  notarkosten: number;
  grunderwerbsteuer: number;
  
  // Refinanzierung-spezifisch
  neueZinsrate?: number;
  neueLaufzeit?: number;
  auszahlungsquote?: number; // 0-100%
  
  // Renovierung (Fix & Flip)
  renovierungskosten?: number;
  renovierungsdauer?: number; // Monate
  
  // Steuern
  steuersatz: number; // Kapitalertragssteuer
  abschreibung: number; // AfA p.a.
  
  // Risiko-Szenarien
  preisVariation: number; // ±% für Sensitivitätsanalyse
  zinsVariation: number; // ±% für Zinssensitivität
  
  // Cashflow-Daten
  jaehrlicheMieteinnahmen: number[];
  jaehrlicheBetriebskosten: number[];
  jaehrlicheTilgung: number[];
  jaehrlicheZinsen: number[];
}

export interface ExitScenarioResult {
  strategie: ExitStrategy;
  exitJahr: number;
  
  // Finanzielle Kennzahlen
  irr: number;
  roi: number;
  npv: number; // Net Present Value
  cashOnCashReturn: number;
  totalReturn: number;
  
  // Cashflow-Analyse
  jaehrlicheCashflows: number[];
  kumulierteCashflows: number[];
  
  // Exit-Details
  exitWert: number;
  exitKosten: number;
  nettoExitErloes: number;
  steuerlast: number;
  
  // Risiko-Metriken
  paybackPeriod: number;
  breakEvenJahr: number;
  maxDrawdown: number;
  
  // Sensitivitätsanalyse
  sensitivitaet: {
    preisVariation: { [key: string]: number };
    zinsVariation: { [key: string]: number };
  };
}

export interface ExitScenarioComparison {
  szenarien: ExitScenarioResult[];
  empfehlung: {
    besteStrategie: ExitStrategy;
    begruendung: string;
    risikobewertung: "niedrig" | "mittel" | "hoch";
  };
}

export interface ExitScenarioWarning {
  typ: "risiko" | "steuer" | "markt" | "liquiditaet";
  schweregrad: "niedrig" | "mittel" | "hoch";
  nachricht: string;
  empfehlung?: string;
}

export interface ExitScenarioReport {
  inputs: ExitScenarioInputs;
  vergleich: ExitScenarioComparison;
  warnings: ExitScenarioWarning[];
  charts: {
    cashflowChart: any[];
    irrComparison: any[];
    sensitivitaetChart: any[];
  };
  erstelltAm: Date;
}

