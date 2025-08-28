export interface MetricInfo {
  title: string;
  kurz: string;
  ausfuehrlich?: string;
  formel?: string;
  bankfaustregeln?: string;
}

export const METRIC_INFO = {
  DSCR: {
    title: "DSCR",
    kurz: "Debt Service Coverage Ratio = NOI / Schuldendienst (Zins+Tilgung).",
    ausfuehrlich:
      "Verhältnis von Net Operating Income zum Schuldendienst; <1,0 kritisch; ≥1,2 solide.",
    formel: "NOI / Schuldendienst",
    bankfaustregeln: "<1,0 kritisch; ≥1,2 solide.",
  },
  NOI: {
    title: "NOI",
    kurz:
      "Net Operating Income = Miete – Leerstand – Bewirtschaftung (ohne Zins/AfA/Steuern/CapEx).",
    ausfuehrlich: "Kennzahl für den operativen Nettoertrag einer Immobilie.",
  },
  IRR: {
    title: "IRR",
    kurz:
      "Interne Verzinsung des investierten Kapitals (mit/ohne Fremdkapital)",
    ausfuehrlich: "Berechnet aus Cashflows inkl. Exit.",
    bankfaustregeln:
      "Nicht berechenbar, wenn kein negativer Start-CF oder zu kurze Laufzeit.",
  },
  LTV: {
    title: "LTV",
    kurz: "Loan-to-Value = Darlehen/Marktwert in %.",
    ausfuehrlich: "Verschuldungsgrad im Verhältnis zum Objektwert.",
    bankfaustregeln: "Bankseitig meist ≤70 %.",
  },
  "Cap Rate/Exit-Yield": {
    title: "Cap Rate / Exit-Yield",
    kurz: "NOI/Preis; Rendite auf Basis Nettoertrag.",
    ausfuehrlich: "NOI dividiert durch Kaufpreis bzw. Exit-Preis.",
  },
  AfA: {
    title: "AfA",
    kurz: "Absetzung für Abnutzung nur auf Gebäudewertanteil (ohne Boden).",
    ausfuehrlich: "Steuerliche Abschreibung auf den Gebäudewert.",
  },
  "Miet-Delta": {
    title: "Miet-Delta",
    kurz: "Abweichung Ist-Miete vom Marktniveau.",
    ausfuehrlich:
      "Abweichung der Ist-Miete vom Marktniveau. Farbe bewertet die Nähe zum Markt (niedrig = gut).",
    formel: "|Ist−Markt| / Markt · 100",
  },
  "Preis-Discount": {
    title: "Preis-Discount",
    kurz: "Preisabschlag zum Markt",
    ausfuehrlich: "(ØMarkt − Preis) / ØMarkt.",
    formel: "(ØMarkt − Preis) / ØMarkt",
  },
  WALT: {
    title: "WALT",
    kurz: "Weighted Average Lease Term",
    ausfuehrlich: "Durchschnittliche Restlaufzeit aller Mietverträge.",
  },
  Leerstand: {
    title: "Leerstand",
    kurz: "Nicht vermietete Fläche",
    ausfuehrlich: "Anteil leer stehender Einheiten.",
  },
  ERV: {
    title: "ERV",
    kurz: "Estimated Rental Value",
    ausfuehrlich: "Marktmietwert einer Fläche.",
  },
  Gesamtscore: {
    title: "Gesamtscore",
    kurz: "0–100 Punkte",
    ausfuehrlich: "Gewichteter Mittelwert der Teil-Scores.",
  },
  "Cashflow-Stabilität": {
    title: "Cashflow-Stabilität",
    kurz: "Ab wann der Cashflow positiv wird.",
  },
  "Upside-Potenzial": {
    title: "Upside-Potenzial",
    kurz: "Zusätzliche Chancen wie Umwidmung oder Ausbau.",
    ausfuehrlich:
      "Bonus aus (IRR_Upside − IRR_Basis) × Eintrittswahrscheinlichkeit, skaliert auf 0–10 Punkte (Gewicht im Gesamtscore 10 %).",
    formel:
      "(IRR_Upside − IRR_Basis) × Eintrittswahrscheinlichkeit → 0–10 Punkte",
  },
  Datenqualität: {
    title: "Datenqualität",
    kurz: "Vollständigkeit und Verlässlichkeit der Eingaben.",
  },
  "Positiv ab Jahr": {
    title: "Freier Cashflow nach Schuldendienst positiv ab Jahr",
    kurz: "Erstes Jahr, in dem der freie Cashflow nach Schuldendienst positiv wird.",
  },
};
export type MetricKey = keyof typeof METRIC_INFO;
