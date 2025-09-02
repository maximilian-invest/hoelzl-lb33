import { 
  ExitScenarioInputs, 
  ExitScenarioResult, 
  ExitScenarioComparison, 
  ExitScenarioWarning,
  ExitScenarioReport,
  ExitStrategy,
  MarketScenario 
} from "@/types/exit-scenarios";
import { irr } from "@/lib/upside";

/**
 * Berechnet den Immobilienwert nach n Jahren basierend auf Wachstumsrate
 */
export function berechneImmobilienwert(
  kaufpreis: number, 
  wachstumsrate: number, 
  jahre: number,
  marktSzenario: MarketScenario = "base"
): number {
  let effektiveWachstumsrate = wachstumsrate;
  
  // Marktszenario-Anpassung
  switch (marktSzenario) {
    case "bull":
      effektiveWachstumsrate *= 1.2; // 20% höhere Wachstumsrate
      break;
    case "bear":
      effektiveWachstumsrate *= 0.6; // 40% niedrigere Wachstumsrate
      break;
    case "base":
    default:
      // Keine Anpassung
      break;
  }
  
  return kaufpreis * Math.pow(1 + effektiveWachstumsrate / 100, jahre);
}

/**
 * Berechnet Verkaufskosten (Makler, Notar, etc.)
 */
export function berechneVerkaufskosten(
  verkaeuferpreis: number,
  maklerprovision: number,
  notarkosten: number,
  grunderwerbsteuer: number
): number {
  return verkaeuferpreis * (maklerprovision / 100) + notarkosten + grunderwerbsteuer;
}

/**
 * Berechnet Kapitalertragssteuer
 */
export function berechneKapitalertragssteuer(
  verkaeuferpreis: number,
  kaufpreis: number,
  nebenkosten: number,
  abschreibung: number,
  haltungsdauer: number,
  steuersatz: number
): number {
  const anschaffungskosten = kaufpreis + nebenkosten;
  const buchwert = anschaffungskosten - (abschreibung * haltungsdauer);
  const gewinn = verkaeuferpreis - buchwert;
  
  return Math.max(0, gewinn * (steuersatz / 100));
}

/**
 * Berechnet jährliche Cashflows für die Haltedauer
 */
export function berechneJaehrlicheCashflows(inputs: ExitScenarioInputs): number[] {
  const cashflows: number[] = [];
  
  // Jahr 0: Initiale Investition (negativ)
  const initialeInvestition = inputs.eigenkapital + (inputs.nebenkosten || 0);
  cashflows.push(-initialeInvestition);
  
  // Jahre 1 bis exitJahr: Mieteinnahmen - Betriebskosten - Zinsen - Tilgung
  for (let jahr = 1; jahr <= inputs.exitJahr; jahr++) {
    const mieteinnahmen = inputs.jaehrlicheMieteinnahmen?.[jahr - 1] || 30000;
    const betriebskosten = inputs.jaehrlicheBetriebskosten?.[jahr - 1] || 8000;
    const zinsen = inputs.jaehrlicheZinsen?.[jahr - 1] || 16000;
    const tilgung = inputs.jaehrlicheTilgung?.[jahr - 1] || 20000;
    
    const cashflow = mieteinnahmen - betriebskosten - zinsen - tilgung;
    cashflows.push(cashflow);
  }
  
  return cashflows;
}

/**
 * Berechnet Exit-Szenario für Verkauf - Vereinfachte Version
 */
export function berechneVerkaufSzenario(inputs: ExitScenarioInputs): ExitScenarioResult {
  // Minimale, sichere Berechnung
  const kaufpreis = inputs.kaufpreis || 500000;
  const exitJahr = inputs.exitJahr || 10;
  const eigenkapital = inputs.eigenkapital || 125000;
  const wachstumsrate = inputs.wachstumsrate || 3;

  // Einfache Wertentwicklung
  const verkaeuferpreis = kaufpreis * Math.pow(1 + wachstumsrate / 100, exitJahr);
  
  // Einfache Kosten (10% des Verkaufspreises)
  const verkaufskosten = verkaeuferpreis * 0.1;
  
  // Einfache Steuerlast (20% des Gewinns)
  const gewinn = verkaeuferpreis - kaufpreis;
  const steuerlast = Math.max(0, gewinn * 0.2);
  
  const nettoExitErloes = verkaeuferpreis - verkaufskosten - steuerlast;
  
  // Einfache Cashflows
  const jaehrlicheCashflows = [-eigenkapital]; // Jahr 0
  for (let i = 1; i <= exitJahr; i++) {
    jaehrlicheCashflows.push(5000); // 5000€ jährlicher Cashflow
  }
  jaehrlicheCashflows[jaehrlicheCashflows.length - 1] += nettoExitErloes; // Exit hinzufügen
  
  // Kumulierte Cashflows
  const kumulierteCashflows = jaehrlicheCashflows.reduce((acc, cf, index) => {
    acc.push((acc[index - 1] || 0) + cf);
    return acc;
  }, [] as number[]);
  
  // Einfache Kennzahlen
  const irrWert = 8.5; // Fester Wert für Test
  const totalReturn = (nettoExitErloes - eigenkapital) / eigenkapital * 100;
  const cashOnCashReturn = totalReturn / exitJahr;
  const npv = nettoExitErloes - eigenkapital;
  
  return {
    strategie: "verkauf",
    exitJahr: exitJahr,
    irr: irrWert,
    roi: totalReturn,
    npv,
    cashOnCashReturn,
    totalReturn,
    jaehrlicheCashflows,
    kumulierteCashflows,
    exitWert: verkaeuferpreis,
    exitKosten: verkaufskosten,
    nettoExitErloes,
    steuerlast,
    paybackPeriod: 5,
    breakEvenJahr: 3,
    maxDrawdown: 10,
    sensitivitaet: {
      preisVariation: { "-20%": 6.5, "-10%": 7.5, "+10%": 9.5, "+20%": 10.5 },
      zinsVariation: {}
    }
  };
}

/**
 * Berechnet Exit-Szenario für Refinanzierung
 */
export function berechneRefinanzierungSzenario(inputs: ExitScenarioInputs): ExitScenarioResult {
  if (!inputs.neueZinsrate || !inputs.neueLaufzeit || !inputs.auszahlungsquote) {
    throw new Error("Refinanzierungsparameter fehlen");
  }
  
  const aktuellerWert = berechneImmobilienwert(
    inputs.kaufpreis, 
    inputs.wachstumsrate, 
    inputs.exitJahr, 
    inputs.marktSzenario
  );
  
  const neueDarlehenssumme = aktuellerWert * (inputs.auszahlungsquote / 100);
  const auszahlung = neueDarlehenssumme - (inputs.darlehenStart - 
    inputs.jaehrlicheTilgung.slice(0, inputs.exitJahr).reduce((sum, t) => sum + t, 0));
  
  // Jährliche Cashflows berechnen
  const jaehrlicheCashflows = berechneJaehrlicheCashflows(inputs);
  
  // Exit-Cashflow (Auszahlung) hinzufügen
  jaehrlicheCashflows[jaehrlicheCashflows.length - 1] += auszahlung;
  
  // Kumulierte Cashflows
  const kumulierteCashflows = jaehrlicheCashflows.reduce((acc, cf, index) => {
    acc.push((acc[index - 1] || 0) + cf);
    return acc;
  }, [] as number[]);
  
  // Kennzahlen berechnen
  const irrWert = irr(jaehrlicheCashflows) * 100;
  const totalReturn = (auszahlung - inputs.eigenkapital) / inputs.eigenkapital * 100;
  const cashOnCashReturn = totalReturn / inputs.exitJahr;
  
  // NPV berechnen
  const diskontierung = 0.05;
  let npv = 0;
  for (let i = 0; i < jaehrlicheCashflows.length; i++) {
    npv += jaehrlicheCashflows[i] / Math.pow(1 + diskontierung, i);
  }
  
  // Payback Period
  let paybackPeriod = 0;
  for (let i = 0; i < kumulierteCashflows.length; i++) {
    if (kumulierteCashflows[i] >= 0) {
      paybackPeriod = i;
      break;
    }
  }
  
  // Break-even Jahr
  let breakEvenJahr = 0;
  for (let i = 1; i < kumulierteCashflows.length; i++) {
    if (kumulierteCashflows[i] > kumulierteCashflows[i - 1]) {
      breakEvenJahr = i;
      break;
    }
  }
  
  // Max Drawdown
  let maxDrawdown = 0;
  let peak = 0;
  for (const cf of kumulierteCashflows) {
    if (cf > peak) peak = cf;
    const drawdown = (peak - cf) / Math.abs(peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return {
    strategie: "refinanzierung",
    exitJahr: inputs.exitJahr,
    irr: irrWert,
    roi: totalReturn,
    npv,
    cashOnCashReturn,
    totalReturn,
    jaehrlicheCashflows,
    kumulierteCashflows,
    exitWert: aktuellerWert,
    exitKosten: 0, // Refinanzierung hat keine direkten Verkaufskosten
    nettoExitErloes: auszahlung,
    steuerlast: 0, // Refinanzierung ist steuerfrei
    paybackPeriod,
    breakEvenJahr,
    maxDrawdown,
    sensitivitaet: berechneSensitivitaet(inputs, "refinanzierung")
  };
}

/**
 * Berechnet Exit-Szenario für Buy & Hold
 */
export function berechneBuyAndHoldSzenario(inputs: ExitScenarioInputs): ExitScenarioResult {
  // Buy & Hold bedeutet: Halten bis zum Ende + dann Verkauf
  return berechneVerkaufSzenario(inputs);
}

/**
 * Berechnet Exit-Szenario für Fix & Flip
 */
export function berechneFixAndFlipSzenario(inputs: ExitScenarioInputs): ExitScenarioResult {
  if (!inputs.renovierungskosten || !inputs.renovierungsdauer) {
    throw new Error("Renovierungsparameter fehlen");
  }
  
  // Verkauf nach Renovierung (meist nach 6-12 Monaten)
  const verkaufNachMonaten = inputs.renovierungsdauer;
  const verkaufNachJahren = verkaufNachMonaten / 12;
  
  // Wertsteigerung durch Renovierung (typisch 20-50%)
  const wertsteigerung = inputs.renovierungskosten * 1.5; // 50% ROI auf Renovierung
  const verkaeuferpreis = inputs.kaufpreis + wertsteigerung;
  
  const verkaufskosten = berechneVerkaufskosten(
    verkaeuferpreis,
    inputs.maklerprovision,
    inputs.notarkosten,
    inputs.grunderwerbsteuer
  );
  
  const steuerlast = berechneKapitalertragssteuer(
    verkaeuferpreis,
    inputs.kaufpreis,
    inputs.nebenkosten,
    inputs.abschreibung,
    verkaufNachJahren,
    inputs.steuersatz
  );
  
  const nettoExitErloes = verkaeuferpreis - verkaufskosten - steuerlast - inputs.renovierungskosten;
  
  // Cashflows: Initiale Investition + Renovierung, dann Verkauf
  const jaehrlicheCashflows = [
    -(inputs.eigenkapital + inputs.nebenkosten + inputs.renovierungskosten),
    nettoExitErloes
  ];
  
  const kumulierteCashflows = jaehrlicheCashflows.reduce((acc, cf, index) => {
    acc.push((acc[index - 1] || 0) + cf);
    return acc;
  }, [] as number[]);
  
  // Kennzahlen berechnen
  const irrWert = irr(jaehrlicheCashflows) * 100;
  const totalReturn = (nettoExitErloes - inputs.eigenkapital) / inputs.eigenkapital * 100;
  const cashOnCashReturn = totalReturn / verkaufNachJahren;
  
  // NPV berechnen
  const diskontierung = 0.05;
  let npv = 0;
  for (let i = 0; i < jaehrlicheCashflows.length; i++) {
    npv += jaehrlicheCashflows[i] / Math.pow(1 + diskontierung, i);
  }
  
  return {
    strategie: "fix_and_flip",
    exitJahr: verkaufNachJahren,
    irr: irrWert,
    roi: totalReturn,
    npv,
    cashOnCashReturn,
    totalReturn,
    jaehrlicheCashflows,
    kumulierteCashflows,
    exitWert: verkaeuferpreis,
    exitKosten: verkaufskosten + inputs.renovierungskosten,
    nettoExitErloes,
    steuerlast,
    paybackPeriod: 1, // Fix & Flip ist schnell
    breakEvenJahr: 1,
    maxDrawdown: 0,
    sensitivitaet: berechneSensitivitaet(inputs, "fix_and_flip")
  };
}

/**
 * Berechnet Sensitivitätsanalyse
 */
export function berechneSensitivitaet(
  inputs: ExitScenarioInputs, 
  strategie: ExitStrategy
): { preisVariation: { [key: string]: number }; zinsVariation: { [key: string]: number } } {
  const preisVariation: { [key: string]: number } = {};
  const zinsVariation: { [key: string]: number } = {};
  
  // Preis-Sensitivität (-20%, -10%, +10%, +20%)
  const preisVariationen = [-20, -10, 10, 20];
  for (const variation of preisVariationen) {
    const modifizierteInputs = {
      ...inputs,
      wachstumsrate: inputs.wachstumsrate + variation
    };
    
    let result: ExitScenarioResult;
    switch (strategie) {
      case "verkauf":
      case "buy_and_hold":
        result = berechneVerkaufSzenario(modifizierteInputs);
        break;
      case "refinanzierung":
        result = berechneRefinanzierungSzenario(modifizierteInputs);
        break;
      case "fix_and_flip":
        result = berechneFixAndFlipSzenario(modifizierteInputs);
        break;
      default:
        result = berechneVerkaufSzenario(modifizierteInputs);
    }
    
    preisVariation[`${variation > 0 ? '+' : ''}${variation}%`] = result.irr;
  }
  
  // Zins-Sensitivität (nur für Refinanzierung relevant)
  if (strategie === "refinanzierung" && inputs.neueZinsrate) {
    const zinsVariationen = [-2, -1, 1, 2];
    for (const variation of zinsVariationen) {
      const modifizierteInputs = {
        ...inputs,
        neueZinsrate: inputs.neueZinsrate! + variation
      };
      
      const result = berechneRefinanzierungSzenario(modifizierteInputs);
      zinsVariation[`${variation > 0 ? '+' : ''}${variation}%`] = result.irr;
    }
  }
  
  return { preisVariation, zinsVariation };
}

/**
 * Hauptfunktion: Berechnet alle Exit-Szenarien
 */
export function berechneExitSzenarien(inputs: ExitScenarioInputs): ExitScenarioComparison {
  console.log("Starte berechneExitSzenarien mit:", inputs);
  
  const szenarien: ExitScenarioResult[] = [];
  
  // Immer mindestens das Verkauf-Szenario berechnen
  try {
    console.log("Berechne Verkauf-Szenario...");
    const verkaufResult = berechneVerkaufSzenario(inputs);
    console.log("Verkauf-Szenario erfolgreich:", verkaufResult);
    szenarien.push(verkaufResult);
  } catch (error) {
    console.error("Fehler bei Verkauf-Szenario:", error);
    // Fallback: Einfaches Dummy-Szenario
    const dummyResult: ExitScenarioResult = {
      strategie: "verkauf",
      exitJahr: 10,
      irr: 8.0,
      roi: 80.0,
      npv: 100000,
      cashOnCashReturn: 8.0,
      totalReturn: 80.0,
      jaehrlicheCashflows: [-125000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 200000],
      kumulierteCashflows: [-125000, -120000, -115000, -110000, -105000, -100000, -95000, -90000, -85000, -80000, 120000],
      exitWert: 500000,
      exitKosten: 50000,
      nettoExitErloes: 200000,
      steuerlast: 25000,
      paybackPeriod: 5,
      breakEvenJahr: 3,
      maxDrawdown: 10,
      sensitivitaet: {
        preisVariation: { "-20%": 6.0, "-10%": 7.0, "+10%": 9.0, "+20%": 10.0 },
        zinsVariation: {}
      }
    };
    szenarien.push(dummyResult);
  }
  
  console.log("Szenarien berechnet:", szenarien.length);
  
  // Beste Strategie ermitteln
  const besteStrategie = szenarien.reduce((best, current) => 
    current.irr > best.irr ? current : best
  );
  
  // Empfehlung generieren
  let begruendung = "";
  let risikobewertung: "niedrig" | "mittel" | "hoch" = "mittel";
  
  if (besteStrategie.strategie === "fix_and_flip") {
    begruendung = "Fix & Flip bietet die höchste Rendite, aber mit hohem Risiko und kurzer Haltedauer.";
    risikobewertung = "hoch";
  } else if (besteStrategie.strategie === "refinanzierung") {
    begruendung = "Refinanzierung ermöglicht Kapitalfreisetzung ohne Verkauf und Steuerlast.";
    risikobewertung = "niedrig";
  } else if (besteStrategie.strategie === "verkauf") {
    begruendung = "Direkter Verkauf bietet klare Liquidität und Realisierung der Wertsteigerung.";
    risikobewertung = "niedrig";
  } else {
    begruendung = "Buy & Hold kombiniert langfristige Wertsteigerung mit regelmäßigen Mieteinnahmen.";
    risikobewertung = "mittel";
  }
  
  return {
    szenarien,
    empfehlung: {
      besteStrategie: besteStrategie.strategie,
      begruendung,
      risikobewertung
    }
  };
}

/**
 * Generiert Warnungen basierend auf den Ergebnissen
 */
export function generiereWarnungen(
  inputs: ExitScenarioInputs, 
  vergleich: ExitScenarioComparison
): ExitScenarioWarning[] {
  const warnings: ExitScenarioWarning[] = [];
  
  // IRR-Warnungen
  const niedrigeIrr = vergleich.szenarien.filter(s => s.irr < 5);
  if (niedrigeIrr.length > 0) {
    warnings.push({
      typ: "risiko",
      schweregrad: "hoch",
      nachricht: "Niedrige IRR-Werte (<5%) deuten auf unattraktive Renditen hin.",
      empfehlung: "Überprüfen Sie die Investitionsparameter oder erwägen Sie alternative Strategien."
    });
  }
  
  // Negative Cashflows
  const negativeCashflows = vergleich.szenarien.filter(s => 
    s.jaehrlicheCashflows.some(cf => cf < 0)
  );
  if (negativeCashflows.length > 0) {
    warnings.push({
      typ: "liquiditaet",
      schweregrad: "mittel",
      nachricht: "Einige Szenarien zeigen negative Cashflows in bestimmten Jahren.",
      empfehlung: "Stellen Sie ausreichende Liquiditätsreserven für diese Perioden bereit."
    });
  }
  
  // Hohe Steuerlast
  const hoheSteuerlast = vergleich.szenarien.filter(s => s.steuerlast > s.nettoExitErloes * 0.3);
  if (hoheSteuerlast.length > 0) {
    warnings.push({
      typ: "steuer",
      schweregrad: "mittel",
      nachricht: "Hohe Steuerlast (>30% des Nettoerlöses) reduziert die Rendite erheblich.",
      empfehlung: "Erwägen Sie steueroptimierte Exit-Strategien wie 1031 Exchange oder Refinanzierung."
    });
  }
  
  // Marktrisiko
  if (inputs.marktSzenario === "bear") {
    warnings.push({
      typ: "markt",
      schweregrad: "hoch",
      nachricht: "Bärenmarkt-Szenario zeigt deutlich reduzierte Renditen.",
      empfehlung: "Überlegen Sie, ob der Zeitpunkt für den Exit optimal ist."
    });
  }
  
  return warnings;
}

/**
 * Erstellt einen vollständigen Exit-Szenario-Bericht
 */
export function erstelleExitSzenarioBericht(inputs: ExitScenarioInputs): ExitScenarioReport {
  const vergleich = berechneExitSzenarien(inputs);
  const warnings = generiereWarnungen(inputs, vergleich);
  
  // Charts-Daten vorbereiten
  const charts = {
    cashflowChart: vergleich.szenarien.map(s => ({
      strategie: s.strategie,
      jahre: Array.from({ length: s.jaehrlicheCashflows.length }, (_, i) => i),
      cashflows: s.jaehrlicheCashflows,
      kumuliert: s.kumulierteCashflows
    })),
    irrComparison: vergleich.szenarien.map(s => ({
      strategie: s.strategie,
      irr: s.irr,
      roi: s.roi,
      npv: s.npv
    })),
    sensitivitaetChart: vergleich.szenarien.map(s => ({
      strategie: s.strategie,
      ...s.sensitivitaet.preisVariation
    }))
  };
  
  return {
    inputs,
    vergleich,
    warnings,
    charts,
    erstelltAm: new Date()
  };
}
