export const METRIC_INFO = {
  DSCR: {
    title: "DSCR",
    kurz: "Debt Service Coverage Ratio",
    ausfuehrlich: "NOI / Schuldendienst (Zins+Tilgung).",
    formel: "NOI / Schuldendienst",
    bankfaustregeln: "<1,0 kritisch; ≥1,2 solide.",
  },
  NOI: {
    title: "NOI",
    kurz: "Net Operating Income",
    ausfuehrlich:
      "Miete – Leerstand – Bewirtschaftung (ohne Zins/AfA/Steuern/CapEx).",
  },
  IRR: {
    title: "IRR",
    kurz: "Interne Verzinsung des investierten Kapitals",
    ausfuehrlich:
      "Mit/ohne Fremdkapital; berechnet aus Cashflows inkl. Exit.",
    bankfaustregeln: "Nicht berechenbar, wenn kein negativer Start-CF vorhanden.",
  },
  LTV: {
    title: "LTV",
    kurz: "Loan-to-Value",
    ausfuehrlich: "Darlehen/Marktwert in %.",
    bankfaustregeln: "Bankseitig meist ≤70 %.",
  },
  "Cap Rate/Exit-Yield": {
    title: "Cap Rate / Exit-Yield",
    kurz: "NOI/Preis",
    ausfuehrlich: "Rendite auf Basis Nettoertrag.",
  },
  AfA: {
    title: "AfA",
    kurz: "Absetzung für Abnutzung",
    ausfuehrlich: "Nur auf Gebäudewertanteil (ohne Boden).",
  },
  "Miet-Delta": {
    title: "Miet-Delta",
    kurz: "Abweichung Ist-Miete zu Markt",
    ausfuehrlich: "Niedrig = grün (nahe Markt), hoch = rot.",
    formel: "|Ist−Markt| / Markt · 100",
  },
  "Preis-Discount": {
    title: "Preis-Discount",
    kurz: "Preisabschlag zum Markt",
    ausfuehrlich: "(ØMarkt − Preis) / ØMarkt.",
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
  },
  Datenqualität: {
    title: "Datenqualität",
    kurz: "Vollständigkeit und Verlässlichkeit der Eingaben.",
  },
  "Positiv ab Jahr": {
    title: "Cashflow positiv ab Jahr",
    kurz: "Erstes Jahr mit positivem Cashflow.",
  },
};
export type MetricKey = keyof typeof METRIC_INFO;
