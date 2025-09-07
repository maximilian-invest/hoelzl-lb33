/**
 * Utility-Funktionen für localStorage-Quota-Management und IndexedDB-Integration
 */

import { 
  initIndexedDB, 
  saveProjectToIndexedDB, 
  loadProjectFromIndexedDB, 
  getAllProjectsFromIndexedDB,
  deleteProjectFromIndexedDB,
  getIndexedDBStorageInfo,
  cleanupIndexedDB,
  type ProjectData 
} from './indexeddb-utils';
import { autoMigrate, isMigrationCompleted } from './migration-utils';

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
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

/**
 * Schätzt die aktuelle localStorage-Nutzung
 */
export function getStorageInfo(): StorageInfo {
  if (!isLocalStorageAvailable()) {
    return {
      used: 0,
      available: 0,
      total: 0,
      percentage: 0
    };
  }

  let used = 0;
  
  // Durchlaufe alle localStorage-Schlüssel und summiere die Größe
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  // Schätze die verfügbare Kapazität (meist 5-10 MB)
  const estimatedTotal = 10 * 1024 * 1024; // 10 MB - realistischere Schätzung
  const available = Math.max(0, estimatedTotal - used);
  const percentage = (used / estimatedTotal) * 100;
  
  return {
    used,
    available,
    total: estimatedTotal,
    percentage: Math.min(percentage, 100)
  };
}

/**
 * Überprüft, ob genug Speicherplatz für neue Daten verfügbar ist
 */
export function hasEnoughStorage(requiredBytes: number): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  const info = getStorageInfo();
  return info.available > requiredBytes;
}

/**
 * Schätzt die Größe eines Objekts in Bytes (JSON.stringify)
 */
export function estimateObjectSize(obj: unknown): number {
  return new Blob([JSON.stringify(obj)]).size;
}

/**
 * Versucht Daten im localStorage zu speichern mit Quota-Überprüfung und automatischer Bereinigung
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
      
      if (cleanupResult.freedBytes > 0) {
        console.log(`Bereinigung abgeschlossen: ${cleanupResult.removed} Elemente entfernt, ${formatBytes(cleanupResult.freedBytes)} freigegeben`);
        
        // Versuche erneut zu speichern nach der Bereinigung
        try {
          const jsonString = JSON.stringify(value);
          localStorage.setItem(key, jsonString);
          return { 
            success: true, 
            cleaned: true, 
            freedBytes: cleanupResult.freedBytes,
            warning: 'Speicherplatz war knapp - einige ältere Bilder wurden automatisch entfernt, um Platz zu schaffen.'
          };
        } catch {
          return {
            success: false,
            error: 'Speicherplatz immer noch nicht ausreichend. Bitte löschen Sie manuell alte Bilder oder PDFs.',
            cleaned: true,
            freedBytes: cleanupResult.freedBytes
          };
        }
      } else {
        return {
          success: false,
          error: 'Keine Bereinigungsmöglichkeiten gefunden. Bitte löschen Sie manuell alte Bilder oder PDFs.',
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
 * Bereinigt alte oder große Bilder aus dem localStorage
 */
export function cleanupStorage(): { removed: number; freedBytes: number } {
  if (!isLocalStorageAvailable()) {
    return { removed: 0, freedBytes: 0 };
  }

  let removed = 0;
  let freedBytes = 0;
  
  try {
    // Lösche alte Bilder (lb33_images)
    const images = localStorage.getItem('lb33_images');
    if (images) {
      const imagesData = JSON.parse(images);
      if (Array.isArray(imagesData) && imagesData.length > 0) {
        freedBytes += new Blob([images]).size;
        localStorage.removeItem('lb33_images');
        removed += imagesData.length;
      }
    }
    
    // Lösche alte PDFs (lb33_pdfs)
    const pdfs = localStorage.getItem('lb33_pdfs');
    if (pdfs) {
      const pdfsData = JSON.parse(pdfs);
      if (Array.isArray(pdfsData) && pdfsData.length > 0) {
        freedBytes += new Blob([pdfs]).size;
        localStorage.removeItem('lb33_pdfs');
        removed += pdfsData.length;
      }
    }
    
    // Lösche alte Projekte (behalte alle Projekte, aber reduziere deren Größe)
    const projects = localStorage.getItem('lb33_projects');
    if (projects) {
      const projectsData = JSON.parse(projects);
      
      if (typeof projectsData === 'object' && projectsData !== null) {
        const projectKeys = Object.keys(projectsData);
        if (projectKeys.length > 0) {
          // Reduziere die Größe der Projekte, aber lösche sie nicht komplett
          const cleanedProjects: Record<string, unknown> = {};
          
          for (const projectName of projectKeys) {
            const project = projectsData[projectName];
            if (project) {
              // Behalte das Projekt, aber reduziere die Anzahl der Bilder/PDFs
              // Entferne nur die Hälfte der Bilder/PDFs, um wichtige Daten zu erhalten
              const images = project.images || [];
              const pdfs = project.pdfs || [];
              
              // Behalte die ersten 50% der Bilder und PDFs
              const keepImagesCount = Math.max(1, Math.floor(images.length / 2));
              const keepPdfsCount = Math.max(1, Math.floor(pdfs.length / 2));
              
              cleanedProjects[projectName] = {
                ...project,
                images: images.slice(0, keepImagesCount), // Behalte die ersten 50% der Bilder
                pdfs: pdfs.slice(0, keepPdfsCount),       // Behalte die ersten 50% der PDFs
                // Behalte alle anderen wichtigen Daten
                cfgCases: project.cfgCases || {},
                finCases: project.finCases || {},
                texts: project.texts || {},
                upsideScenarios: project.upsideScenarios || []
              };
            }
          }
          
          localStorage.setItem('lb33_projects', JSON.stringify(cleanedProjects));
          freedBytes += new Blob([JSON.stringify(projects)]).size - new Blob([JSON.stringify(cleanedProjects)]).size;
          removed += 0; // Keine Projekte gelöscht, nur deren Inhalte reduziert
        }
      }
    }
    
  } catch (error) {
    console.error('Fehler beim Bereinigen des Speichers:', error);
  }
  
  return { removed, freedBytes };
}

/**
 * Erweiterte Speicherfunktionen mit IndexedDB-Unterstützung
 */

/**
 * Initialisiert IndexedDB und führt Migration durch
 */
export async function initializeAdvancedStorage(): Promise<{ success: boolean; error?: string; migratedProjects?: number }> {
  try {
    // IndexedDB initialisieren
    const initSuccess = await initIndexedDB();
    if (!initSuccess) {
      return { success: false, error: 'IndexedDB konnte nicht initialisiert werden' };
    }

    // Automatische Migration durchführen
    const migrationResult = await autoMigrate();
    if (!migrationResult.success) {
      console.warn('Migration fehlgeschlagen, verwende localStorage:', migrationResult.error);
    }

    return { 
      success: true, 
      migratedProjects: migrationResult.migratedProjects,
      error: migrationResult.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Initialisierung' 
    };
  }
}

/**
 * Speichert ein Projekt mit IndexedDB (falls verfügbar) oder localStorage
 */
export async function saveProjectAdvanced(name: string, data: ProjectData): Promise<{ success: boolean; error?: string; warning?: string; usedIndexedDB?: boolean }> {
  try {
    // Prüfen, ob Migration durchgeführt wurde
    if (isMigrationCompleted()) {
      // IndexedDB verwenden
      const result = await saveProjectToIndexedDB(name, data);
      
      // Bilder und PDFs sind bereits in den Projektdaten gespeichert
      // Keine separate Speicherung nötig, da dies zu Verdopplung führt
      
      return { 
        success: result.success, 
        error: result.error,
        usedIndexedDB: true
      };
    } else {
      // localStorage verwenden (Fallback)
      const result = safeSetItem('lb33_projects', { [name]: data });
      return { 
        success: result.success, 
        error: result.error,
        warning: result.warning,
        usedIndexedDB: false
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern' 
    };
  }
}

/**
 * Lädt ein Projekt aus IndexedDB (falls verfügbar) oder localStorage
 */
export async function loadProjectAdvanced(name: string): Promise<{ success: boolean; data?: ProjectData; error?: string; usedIndexedDB?: boolean }> {
  try {
    // Prüfen, ob Migration durchgeführt wurde
    if (isMigrationCompleted()) {
      // IndexedDB verwenden
      const result = await loadProjectFromIndexedDB(name);
      
      // Bilder und PDFs sind bereits in den Projektdaten enthalten
      // Keine separate Ladung nötig, da dies zu Verdopplung führt
      
      return { 
        success: result.success, 
        data: result.data,
        error: result.error,
        usedIndexedDB: true
      };
    } else {
      // localStorage verwenden (Fallback)
      const projectsRaw = safeGetItem('lb33_projects');
      if (!projectsRaw) {
        return { success: false, error: 'Keine Projekte gefunden', usedIndexedDB: false };
      }

      try {
        const projects = JSON.parse(projectsRaw);
        const projectData = projects[name];
        if (projectData) {
          return { success: true, data: projectData, usedIndexedDB: false };
        } else {
          return { success: false, error: 'Projekt nicht gefunden', usedIndexedDB: false };
        }
      } catch {
        return { success: false, error: 'Fehler beim Parsen der Projektdaten', usedIndexedDB: false };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden' 
    };
  }
}

/**
 * Lädt alle Projekte aus IndexedDB (falls verfügbar) oder localStorage
 */
export async function getAllProjectsAdvanced(): Promise<{ success: boolean; projects?: Record<string, ProjectData>; error?: string; usedIndexedDB?: boolean }> {
  try {
    // Prüfen, ob Migration durchgeführt wurde
    if (isMigrationCompleted()) {
      // IndexedDB verwenden
      const result = await getAllProjectsFromIndexedDB();
      return { 
        success: result.success, 
        projects: result.projects,
        error: result.error,
        usedIndexedDB: true
      };
    } else {
      // localStorage verwenden (Fallback)
      const projectsRaw = safeGetItem('lb33_projects');
      if (!projectsRaw) {
        return { success: true, projects: {}, usedIndexedDB: false };
      }

      try {
        const projects = JSON.parse(projectsRaw);
        return { success: true, projects, usedIndexedDB: false };
      } catch {
        return { success: false, error: 'Fehler beim Parsen der Projektdaten', usedIndexedDB: false };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden aller Projekte' 
    };
  }
}

/**
 * Löscht ein Projekt aus IndexedDB (falls verfügbar) oder localStorage
 */
export async function deleteProjectAdvanced(name: string): Promise<{ success: boolean; error?: string; usedIndexedDB?: boolean }> {
  try {
    // Prüfen, ob Migration durchgeführt wurde
    if (isMigrationCompleted()) {
      // IndexedDB verwenden
      const result = await deleteProjectFromIndexedDB(name);
      return { 
        success: result.success, 
        error: result.error,
        usedIndexedDB: true
      };
    } else {
      // localStorage verwenden (Fallback)
      const projectsRaw = safeGetItem('lb33_projects');
      if (!projectsRaw) {
        return { success: false, error: 'Keine Projekte gefunden', usedIndexedDB: false };
      }

      try {
        const projects = JSON.parse(projectsRaw);
        delete projects[name];
        const result = safeSetItem('lb33_projects', projects);
        return { 
          success: result.success, 
          error: result.error,
          usedIndexedDB: false
        };
      } catch {
        return { success: false, error: 'Fehler beim Löschen des Projekts', usedIndexedDB: false };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen' 
    };
  }
}

/**
 * Erweiterte Speicherinformationen mit IndexedDB-Unterstützung
 */
export async function getAdvancedStorageInfo(): Promise<StorageInfo & { usedIndexedDB: boolean; projects: number; images: number; pdfs: number }> {
  try {
    // Prüfen, ob Migration durchgeführt wurde
    if (isMigrationCompleted()) {
      // IndexedDB-Informationen abrufen
      const indexedDBInfo = await getIndexedDBStorageInfo();
      return {
        used: indexedDBInfo.used,
        available: indexedDBInfo.available,
        total: indexedDBInfo.total,
        percentage: indexedDBInfo.percentage,
        usedIndexedDB: true,
        projects: indexedDBInfo.projects,
        images: indexedDBInfo.images,
        pdfs: indexedDBInfo.pdfs
      };
    } else {
      // localStorage-Informationen abrufen
      const localStorageInfo = getStorageInfo();
      return {
        ...localStorageInfo,
        usedIndexedDB: false,
        projects: 0,
        images: 0,
        pdfs: 0
      };
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Speicherinformationen:', error);
    return {
      used: 0,
      available: 0,
      total: 0,
      percentage: 0,
      usedIndexedDB: false,
      projects: 0,
      images: 0,
      pdfs: 0
    };
  }
}

/**
 * Erweiterte Bereinigung mit IndexedDB-Unterstützung
 */
export async function cleanupAdvancedStorage(): Promise<{ success: boolean; freedBytes?: number; error?: string; usedIndexedDB?: boolean }> {
  try {
    // Prüfen, ob Migration durchgeführt wurde
    if (isMigrationCompleted()) {
      // IndexedDB-Bereinigung
      const result = await cleanupIndexedDB();
      return { 
        success: result.success, 
        freedBytes: result.freedBytes,
        error: result.error,
        usedIndexedDB: true
      };
    } else {
      // localStorage-Bereinigung
      const result = cleanupStorage();
      return { 
        success: true, 
        freedBytes: result.freedBytes,
        usedIndexedDB: false
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Bereinigung' 
    };
  }
}
