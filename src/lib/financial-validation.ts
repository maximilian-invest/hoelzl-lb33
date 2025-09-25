/**
 * Validierung der Vollständigkeit der Finanzdaten
 * Exit-Szenarien können nur geplant werden, wenn alle erforderlichen Finanzdaten eingegeben sind
 */

import type { Finance } from "@/app/page";
import type { Assumptions } from "@/app/page";

/**
 * Prüft ob die Finanzdaten vollständig eingegeben sind
 * @param finance Finanzierungsdaten
 * @param assumptions Annahmen/Objektdaten
 * @returns true wenn alle erforderlichen Finanzdaten vorhanden sind
 */
export function areFinancialDataComplete(finance: Finance, assumptions: Assumptions): boolean {
  // Prüfe Finanzierungsdaten
  const financeComplete = 
    finance.darlehen > 0 &&
    finance.zinssatz > 0 &&
    finance.annuitaet > 0 &&
    finance.bkM2 >= 0 &&
    finance.bkWachstum >= 0 &&
    finance.einnahmenJ1 > 0 &&
    finance.einnahmenWachstum >= 0 &&
    finance.leerstand >= 0 &&
    finance.steuerRate >= 0 &&
    finance.afaRate >= 0;

  // Prüfe Objektdaten
  const assumptionsComplete =
    assumptions.kaufpreis > 0 &&
    assumptions.nebenkosten >= 0 &&
    assumptions.ekQuote > 0 &&
    assumptions.tilgung > 0 &&
    assumptions.units.length > 0 &&
    assumptions.units.every(unit => 
      unit.flaeche > 0 && 
      unit.miete > 0 &&
      unit.bezeichnung.trim() !== ""
    );

  return financeComplete && assumptionsComplete;
}

/**
 * Gibt eine detaillierte Beschreibung der fehlenden Finanzdaten zurück
 * @param finance Finanzierungsdaten
 * @param assumptions Annahmen/Objektdaten
 * @returns Array mit Beschreibungen der fehlenden Felder
 */
export function getMissingFinancialFields(finance: Finance, assumptions: Assumptions): string[] {
  const missing: string[] = [];

  // Finanzierungsdaten prüfen
  if (finance.darlehen <= 0) missing.push("Darlehensbetrag");
  if (finance.zinssatz <= 0) missing.push("Zinssatz");
  if (finance.annuitaet <= 0) missing.push("Annuität");
  if (finance.einnahmenJ1 <= 0) missing.push("Einnahmen Jahr 1");
  if (finance.leerstand < 0) missing.push("Leerstand");
  if (finance.steuerRate < 0) missing.push("Steuersatz");
  if (finance.afaRate < 0) missing.push("AfA-Rate");

  // Objektdaten prüfen
  if (assumptions.kaufpreis <= 0) missing.push("Kaufpreis");
  if (assumptions.ekQuote <= 0) missing.push("Eigenkapitalquote");
  if (assumptions.tilgung <= 0) missing.push("Tilgungssatz");
  if (assumptions.units.length === 0) missing.push("Mieteinheiten");
  
  // Prüfe einzelne Mieteinheiten
  assumptions.units.forEach((unit, index) => {
    if (unit.flaeche <= 0) missing.push(`Fläche für Einheit ${index + 1}`);
    if (unit.miete <= 0) missing.push(`Miete für Einheit ${index + 1}`);
    if (!unit.bezeichnung.trim()) missing.push(`Bezeichnung für Einheit ${index + 1}`);
  });

  return missing;
}

/**
 * Generiert eine benutzerfreundliche Nachricht über fehlende Finanzdaten
 * @param finance Finanzierungsdaten
 * @param assumptions Annahmen/Objektdaten
 * @returns Benutzerfreundliche Nachricht auf Deutsch
 */
export function getFinancialDataIncompleteMessage(finance: Finance, assumptions: Assumptions): string {
  const missing = getMissingFinancialFields(finance, assumptions);
  
  if (missing.length === 0) {
    return "Alle Finanzdaten sind vollständig eingegeben.";
  }

  if (missing.length === 1) {
    return `Bitte geben Sie noch ${missing[0]} ein, bevor Sie Exit-Szenarien planen können.`;
  }

  if (missing.length <= 3) {
    return `Bitte geben Sie noch folgende Daten ein: ${missing.join(", ")}.`;
  }

  return `Bitte vervollständigen Sie noch ${missing.length} Finanzdaten-Felder, bevor Sie Exit-Szenarien planen können.`;
}

