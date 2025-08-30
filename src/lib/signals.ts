export type SignalColor = 'green' | 'yellow' | 'red';

export interface MacroSignals {
  rates: SignalColor;
  inflation: SignalColor;
  fundFlows: SignalColor;
}

// Konstanten für Signal-Schwellenwerte
export const SIGNAL_THRESHOLDS = {
  // Zins-Signale
  RATES: {
    GREEN_MAX: 2.5, // ≤ 2.5% = Grün
    YELLOW_MAX: 3.5, // 2.5-3.5% = Gelb
    // > 3.5% = Rot
  },
  
  // Inflation-Signale
  INFLATION: {
    GREEN_MAX: 2.0, // ≤ 2% = Grün (ECB-Ziel)
    YELLOW_MAX: 4.0, // 2-4% = Gelb
    // > 4% = Rot
  },
  
  // Fondsflüsse-Signale
  FUND_FLOWS: {
    GREEN_THRESHOLD: 0, // > 0 = Grün (Nettozuflüsse)
    YELLOW_THRESHOLD: 0.02, // ±2% = Gelb
    // < 0 = Rot (Nettoabflüsse)
  },
} as const;

/**
 * Bestimmt die Ampel-Farbe für Zinsniveau
 */
export function getRatesSignal(mro: number | null): SignalColor {
  if (mro === null) return 'yellow'; // Unbekannt = Gelb
  
  if (mro <= SIGNAL_THRESHOLDS.RATES.GREEN_MAX) {
    return 'green';
  } else if (mro <= SIGNAL_THRESHOLDS.RATES.YELLOW_MAX) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Bestimmt die Ampel-Farbe für Inflation
 */
export function getInflationSignal(inflationRate: number | null): SignalColor {
  if (inflationRate === null) return 'yellow'; // Unbekannt = Gelb
  
  if (inflationRate <= SIGNAL_THRESHOLDS.INFLATION.GREEN_MAX) {
    return 'green';
  } else if (inflationRate <= SIGNAL_THRESHOLDS.INFLATION.YELLOW_MAX) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Bestimmt die Ampel-Farbe für Fondsflüsse
 */
export function getFundFlowsSignal(flowRate: number | null): SignalColor {
  if (flowRate === null) return 'yellow'; // Unbekannt = Gelb
  
  if (flowRate > SIGNAL_THRESHOLDS.FUND_FLOWS.GREEN_THRESHOLD) {
    return 'green';
  } else if (Math.abs(flowRate) <= SIGNAL_THRESHOLDS.FUND_FLOWS.YELLOW_THRESHOLD) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Berechnet alle Makro-Signale basierend auf aktuellen Daten
 */
export function calculateMacroSignals(data: {
  rates: { mro: number | null; dfr: number | null; euribor3m: number | null };
  inflation: { at_yoy: number | null; ez_yoy: number | null };
  fundFlows: { realEstateFunds_eu_weekly: number | null };
}): MacroSignals {
  return {
    rates: getRatesSignal(data.rates.mro),
    inflation: getInflationSignal(data.inflation.ez_yoy), // Eurozone als Hauptindikator
    fundFlows: getFundFlowsSignal(data.fundFlows.realEstateFunds_eu_weekly),
  };
}

/**
 * Generiert eine Zusammenfassung der aktuellen Marktsignale
 */
export function getMarketSummary(signals: MacroSignals): string {
  const summaries = [];
  
  if (signals.rates === 'green') {
    summaries.push('Günstiges Zinsumfeld');
  } else if (signals.rates === 'red') {
    summaries.push('Hohe Zinsen belasten Märkte');
  }
  
  if (signals.inflation === 'green') {
    summaries.push('Inflation im Zielbereich');
  } else if (signals.inflation === 'red') {
    summaries.push('Inflation über Zielbereich');
  }
  
  if (signals.fundFlows === 'green') {
    summaries.push('Positive Fondsflüsse');
  } else if (signals.fundFlows === 'red') {
    summaries.push('Negative Fondsflüsse');
  }
  
  return summaries.length > 0 ? summaries.join(', ') : 'Marktsignale neutral';
}
