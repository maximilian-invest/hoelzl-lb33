/**
 * Utility-Funktionen für localStorage-Quota-Management
 */

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
  const estimatedTotal = 50 * 1024 * 1024; // 50 MB für mehr Upload-Kapazität
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
export function safeSetItem(key: string, value: unknown): { success: boolean; error?: string; cleaned?: boolean; freedBytes?: number } {
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
          return { success: true, cleaned: true, freedBytes: cleanupResult.freedBytes };
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
          const cleanedProjects: Record<string, any> = {};
          
          for (const projectName of projectKeys) {
            const project = projectsData[projectName];
            if (project) {
              // Behalte das Projekt, aber entferne große Daten (Bilder, PDFs)
              cleanedProjects[projectName] = {
                ...project,
                images: [], // Entferne alle Bilder
                pdfs: [],   // Entferne alle PDFs
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
