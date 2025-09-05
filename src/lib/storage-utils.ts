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
 * Schätzt die aktuelle localStorage-Nutzung
 */
export function getStorageInfo(): StorageInfo {
  let used = 0;
  
  // Durchlaufe alle localStorage-Schlüssel und summiere die Größe
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  // Schätze die verfügbare Kapazität (meist 5-10 MB)
  const estimatedTotal = 5 * 1024 * 1024; // 5 MB als konservative Schätzung
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
 * Versucht Daten im localStorage zu speichern mit Quota-Überprüfung
 */
export function safeSetItem(key: string, value: unknown): { success: boolean; error?: string } {
  try {
    const jsonString = JSON.stringify(value);
    const size = new Blob([jsonString]).size;
    
    if (!hasEnoughStorage(size)) {
      return {
        success: false,
        error: `Nicht genügend Speicherplatz verfügbar. Benötigt: ${formatBytes(size)}, Verfügbar: ${formatBytes(getStorageInfo().available)}`
      };
    }
    
    localStorage.setItem(key, jsonString);
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Der verfügbare Speicherplatz wurde überschritten. Bitte löschen Sie alte Bilder oder PDFs.'
      };
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
    
    // Lösche alte Projekte (behalte nur das aktuelle)
    const projects = localStorage.getItem('lb33_projects');
    if (projects) {
      const projectsData = JSON.parse(projects);
      const currentProject = localStorage.getItem('lb33_current_project');
      
      if (typeof projectsData === 'object' && projectsData !== null) {
        const projectKeys = Object.keys(projectsData);
        if (projectKeys.length > 1) {
          // Behalte nur das aktuelle Projekt
          const cleanedProjects = currentProject && projectsData[currentProject] 
            ? { [currentProject]: projectsData[currentProject] }
            : {};
          
          localStorage.setItem('lb33_projects', JSON.stringify(cleanedProjects));
          freedBytes += new Blob([JSON.stringify(projects)]).size - new Blob([JSON.stringify(cleanedProjects)]).size;
          removed += projectKeys.length - Object.keys(cleanedProjects).length;
        }
      }
    }
    
  } catch (error) {
    console.error('Fehler beim Bereinigen des Speichers:', error);
  }
  
  return { removed, freedBytes };
}
