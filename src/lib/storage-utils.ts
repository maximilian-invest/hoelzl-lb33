/**
 * JSON-basierte Speicherung für Immobilien-Konfigurationen
 * Alle Projektdaten werden als JSON in Variablen gespeichert
 */

export interface ProjectData {
  cfgCases: Record<string, unknown>;
  finCases: Record<string, unknown>;
  images: Array<{ src: string; caption?: string; width?: number; height?: number }>;
  pdfs: Array<{ src: string; name?: string }>;
  showUploads: boolean;
  texts: Record<string, string>;
  upsideScenarios?: unknown[];
  householdCalculation?: {
    inputs: Record<string, unknown>;
    result: Record<string, unknown> | null;
    lastModified?: number;
  };
  lastModified?: number;
}

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
  projects: number;
  images: number;
  pdfs: number;
}

// Globale Variablen für die Speicherung aller Projekte
let projectsStorage: Record<string, ProjectData> = {};
let storageInitialized = false;

/**
 * Initialisiert den Speicher und lädt vorhandene Daten
 */
export function initializeStorage(): { success: boolean; error?: string; loadedProjects?: number } {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Speicher nur im Browser verfügbar' };
    }

    // Lade vorhandene Projekte aus localStorage
    const storedProjects = localStorage.getItem('lb33_projects');
    if (storedProjects) {
      try {
        projectsStorage = JSON.parse(storedProjects);
        storageInitialized = true;
        const projectCount = Object.keys(projectsStorage).length;
        return { success: true, loadedProjects: projectCount };
      } catch (error) {
        console.warn('Fehler beim Laden der Projekte, starte mit leerem Speicher:', error);
        projectsStorage = {};
        storageInitialized = true;
        return { success: true, loadedProjects: 0 };
      }
    } else {
      projectsStorage = {};
      storageInitialized = true;
      return { success: true, loadedProjects: 0 };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Initialisierung' 
    };
  }
}

/**
 * Speichert alle Projekte persistent
 */
function saveToPersistentStorage(): { success: boolean; error?: string } {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'localStorage nur im Browser verfügbar' };
    }

    const jsonString = JSON.stringify(projectsStorage);
    localStorage.setItem('lb33_projects', jsonString);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Fehler beim Speichern' 
    };
  }
}

/**
 * Prüft, ob der Speicher initialisiert ist
 */
function ensureStorageInitialized(): boolean {
  if (!storageInitialized) {
    const initResult = initializeStorage();
    return initResult.success;
  }
  return true;
}

/**
 * Speichert ein Projekt
 */
export function saveProject(name: string, data: ProjectData): { success: boolean; error?: string; warning?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    // Aktualisiere das Projekt mit Zeitstempel
    const projectData: ProjectData = {
      ...data,
      lastModified: Date.now()
    };

    projectsStorage[name] = projectData;

    // Speichere persistent
    const saveResult = saveToPersistentStorage();
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern' 
    };
  }
}

/**
 * Lädt ein Projekt
 */
export function loadProject(name: string): { success: boolean; data?: ProjectData; error?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    const projectData = projectsStorage[name];
    if (!projectData) {
      return { success: false, error: 'Projekt nicht gefunden' };
    }

    return { success: true, data: projectData };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden' 
    };
  }
}

/**
 * Lädt alle Projekte
 */
export function getAllProjects(): { success: boolean; projects?: Record<string, ProjectData>; error?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    return { success: true, projects: { ...projectsStorage } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden aller Projekte' 
    };
  }
}

/**
 * Löscht ein Projekt
 */
export function deleteProject(name: string): { success: boolean; error?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    if (!(name in projectsStorage)) {
      return { success: false, error: 'Projekt nicht gefunden' };
    }

    delete projectsStorage[name];

    // Speichere persistent
    const saveResult = saveToPersistentStorage();
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen' 
    };
  }
}

/**
 * Ruft Speicherinformationen ab
 */
export function getStorageInfo(): StorageInfo {
  try {
    if (!ensureStorageInitialized()) {
      return {
        used: 0,
        available: 0,
        total: 0,
        percentage: 0,
        projects: 0,
        images: 0,
        pdfs: 0
      };
    }

    const projectCount = Object.keys(projectsStorage).length;
    let imageCount = 0;
    let pdfCount = 0;

    // Zähle Bilder und PDFs
    Object.values(projectsStorage).forEach(project => {
      imageCount += project.images?.length || 0;
      pdfCount += project.pdfs?.length || 0;
    });

    // Schätze Speicherverbrauch
    const jsonString = JSON.stringify(projectsStorage);
    const used = new Blob([jsonString]).size;
    const total = 10 * 1024 * 1024; // 10 MB als Schätzung
    const available = Math.max(0, total - used);
    const percentage = (used / total) * 100;

    return {
      used,
      available,
      total,
      percentage: Math.min(percentage, 100),
      projects: projectCount,
      images: imageCount,
      pdfs: pdfCount
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Speicherinformationen:', error);
    return {
      used: 0,
      available: 0,
      total: 0,
      percentage: 0,
      projects: 0,
      images: 0,
      pdfs: 0
    };
  }
}

/**
 * Bereinigt alte Daten
 */
export function cleanupStorage(): { success: boolean; freedBytes?: number; removedProjects?: number } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, freedBytes: 0, removedProjects: 0 };
    }

    const beforeSize = new Blob([JSON.stringify(projectsStorage)]).size;
    const beforeCount = Object.keys(projectsStorage).length;

    // Lösche Projekte älter als 90 Tage
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const projectsToDelete: string[] = [];

    Object.entries(projectsStorage).forEach(([name, project]) => {
      if (project.lastModified && project.lastModified < ninetyDaysAgo) {
        projectsToDelete.push(name);
      }
    });

    // Lösche alte Projekte
    projectsToDelete.forEach(name => {
      delete projectsStorage[name];
    });

    // Speichere persistent
    const saveResult = saveToPersistentStorage();
    if (!saveResult.success) {
      console.warn('Fehler beim Speichern nach Bereinigung:', saveResult.error);
    }

    const afterSize = new Blob([JSON.stringify(projectsStorage)]).size;
    const afterCount = Object.keys(projectsStorage).length;
    const freedBytes = beforeSize - afterSize;
    const removedProjects = beforeCount - afterCount;

    return { 
      success: true, 
      freedBytes: Math.max(0, freedBytes),
      removedProjects
    };
  } catch (error) {
    console.error('Fehler bei der Bereinigung:', error);
    return { success: false, freedBytes: 0, removedProjects: 0 };
  }
}

/**
 * Formatiert Bytes in eine lesbare Größe
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Exportiert alle Projekte als JSON
 */
export function exportAllProjects(): { success: boolean; data?: string; error?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projects: projectsStorage
    };

    return { success: true, data: JSON.stringify(exportData, null, 2) };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Exportieren' 
    };
  }
}

/**
 * Importiert Projekte aus JSON
 */
export function importProjects(jsonData: string): { success: boolean; importedProjects?: number; error?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    const importData = JSON.parse(jsonData);
    
    if (!importData.projects || typeof importData.projects !== 'object') {
      return { success: false, error: 'Ungültiges Import-Format' };
    }

    let importedCount = 0;
    Object.entries(importData.projects).forEach(([name, projectData]) => {
      if (projectData && typeof projectData === 'object') {
        projectsStorage[name] = projectData as ProjectData;
        importedCount++;
      }
    });

    // Speichere persistent
    const saveResult = saveToPersistentStorage();
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    return { success: true, importedProjects: importedCount };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Importieren' 
    };
  }
}

/**
 * Löscht alle Projekte
 */
export function clearAllProjects(): { success: boolean; error?: string } {
  try {
    if (!ensureStorageInitialized()) {
      return { success: false, error: 'Speicher konnte nicht initialisiert werden' };
    }

    projectsStorage = {};

    // Speichere persistent
    const saveResult = saveToPersistentStorage();
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen aller Projekte' 
    };
  }
}

/**
 * Prüft, ob localStorage verfügbar ist
 */
function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null;
  } catch {
    return false;
  }
}

/**
 * Sichere localStorage.getItem Implementierung
 */
export function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Sichere localStorage.setItem Implementierung
 */
export function safeSetItem(key: string, value: unknown): { success: boolean; error?: string; cleaned?: boolean; freedBytes?: number; warning?: string } {
  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: 'localStorage ist nicht verfügbar (Server-Side-Rendering)'
    };
  }

  try {
    const jsonString = JSON.stringify(value);
    
    // Versuche zuerst normal zu speichern
    localStorage.setItem(key, jsonString);
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Speicher ist voll - versuche automatisch aufzuräumen
      console.log('Speicher voll - führe automatische Bereinigung durch...');
      const cleanupResult = cleanupStorage();
      
      if (cleanupResult.freedBytes && cleanupResult.freedBytes > 0) {
        console.log(`Bereinigung abgeschlossen: ${cleanupResult.removedProjects} Projekte entfernt, ${formatBytes(cleanupResult.freedBytes)} freigegeben`);
        
        // Versuche erneut zu speichern nach der Bereinigung
        try {
          const jsonString = JSON.stringify(value);
          localStorage.setItem(key, jsonString);
          return { 
            success: true, 
            cleaned: true, 
            freedBytes: cleanupResult.freedBytes,
            warning: 'Speicherplatz war knapp - einige ältere Projekte wurden automatisch entfernt, um Platz zu schaffen.'
          };
        } catch {
          return {
            success: false,
            error: 'Speicherplatz immer noch nicht ausreichend. Bitte löschen Sie manuell alte Projekte.',
            cleaned: true,
            freedBytes: cleanupResult.freedBytes
          };
        }
      } else {
        return {
          success: false,
          error: 'Keine Bereinigungsmöglichkeiten gefunden. Bitte löschen Sie manuell alte Projekte.',
          cleaned: false
        };
      }
    }
    return {
      success: false,
      error: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

/**
 * Sichere localStorage.setItemDirect Implementierung (ohne JSON.stringify)
 */
export function safeSetItemDirect(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sichere localStorage.removeItem Implementierung
 */
export function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Automatische Initialisierung beim Import
if (typeof window !== 'undefined') {
  initializeStorage();
}