import { HouseholdInputs, DEFAULT_HOUSEHOLD_INPUTS } from '@/types/household';

const STORAGE_KEY = 'haushaltsrechnung:v1';

/**
 * Lädt die Haushaltsdaten aus dem localStorage
 */
export function loadHouseholdData(): Partial<HouseholdInputs> {
  try {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
    // Validiere die geladenen Daten und fülle fehlende Felder mit Defaults
    return {
      ...DEFAULT_HOUSEHOLD_INPUTS,
      ...parsed,
      // Stelle sicher, dass Arrays existieren
      employmentIncomes: parsed.employmentIncomes || DEFAULT_HOUSEHOLD_INPUTS.employmentIncomes,
      rentalIncomes: parsed.rentalIncomes || DEFAULT_HOUSEHOLD_INPUTS.rentalIncomes,
      otherIncomes: parsed.otherIncomes || DEFAULT_HOUSEHOLD_INPUTS.otherIncomes,
      existingLoans: parsed.existingLoans || DEFAULT_HOUSEHOLD_INPUTS.existingLoans,
      haircut: {
        ...DEFAULT_HOUSEHOLD_INPUTS.haircut,
        ...parsed.haircut
      }
    };
  } catch {
    console.warn('Fehler beim Laden der Haushaltsdaten');
    return {};
  }
}

/**
 * Speichert die Haushaltsdaten im localStorage
 */
export function saveHouseholdData(data: HouseholdInputs): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('Fehler beim Speichern der Haushaltsdaten');
  }
}

/**
 * Löscht die Haushaltsdaten aus dem localStorage
 */
export function clearHouseholdData(): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Fehler beim Löschen der Haushaltsdaten');
  }
}

/**
 * Prüft, ob Haushaltsdaten im localStorage gespeichert sind
 */
export function hasHouseholdData(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Hook für die Haushaltsdaten-Verwaltung
 */
export function useHouseholdStorage() {
  const loadData = () => loadHouseholdData();
  const saveData = (data: HouseholdInputs) => saveHouseholdData(data);
  const clearData = () => clearHouseholdData();
  const hasData = () => hasHouseholdData();
  
  return {
    loadData,
    saveData,
    clearData,
    hasData
  };
}
