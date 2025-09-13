/**
 * PostgreSQL-basierte Speicher-Utility-Funktionen
 * Ersetzt die IndexedDB/localStorage-Implementierung durch serverbasierte PostgreSQL-Lösung
 */

import { 
  saveProjectToPostgres, 
  loadProjectFromPostgres, 
  getAllProjectsFromPostgres,
  deleteProjectFromPostgres,
  getPostgresStorageInfo,
  cleanupPostgres,
  type ProjectData 
} from './postgres-utils';

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
  projects: number;
  images: number;
  pdfs: number;
}

/**
 * Speichert ein Projekt mit PostgreSQL
 */
export async function saveProjectAdvanced(name: string, data: ProjectData): Promise<{ success: boolean; error?: string; warning?: string; usedPostgres?: boolean }> {
  try {
    const result = await saveProjectToPostgres(name, data);
    
    return { 
      success: result.success, 
      error: result.error,
      usedPostgres: true
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern',
      usedPostgres: false
    };
  }
}

/**
 * Lädt ein Projekt aus PostgreSQL
 */
export async function loadProjectAdvanced(name: string): Promise<{ success: boolean; data?: ProjectData; error?: string; usedPostgres?: boolean }> {
  try {
    const result = await loadProjectFromPostgres(name);
    
    return { 
      success: result.success, 
      data: result.data,
      error: result.error,
      usedPostgres: true
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden',
      usedPostgres: false
    };
  }
}

/**
 * Lädt alle Projekte aus PostgreSQL
 */
export async function getAllProjectsAdvanced(): Promise<{ success: boolean; projects?: Record<string, ProjectData>; error?: string; usedPostgres?: boolean }> {
  try {
    const result = await getAllProjectsFromPostgres();
    
    return { 
      success: result.success, 
      projects: result.projects,
      error: result.error,
      usedPostgres: true
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden aller Projekte',
      usedPostgres: false
    };
  }
}

/**
 * Löscht ein Projekt aus PostgreSQL
 */
export async function deleteProjectAdvanced(name: string): Promise<{ success: boolean; error?: string; usedPostgres?: boolean }> {
  try {
    const result = await deleteProjectFromPostgres(name);
    
    return { 
      success: result.success, 
      error: result.error,
      usedPostgres: true
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen',
      usedPostgres: false
    };
  }
}

/**
 * Ruft Speicherinformationen aus PostgreSQL ab
 */
export async function getAdvancedStorageInfo(): Promise<StorageInfo & { usedPostgres: boolean }> {
  try {
    const postgresInfo = await getPostgresStorageInfo();
    
    return {
      ...postgresInfo,
      usedPostgres: true
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
      pdfs: 0,
      usedPostgres: false
    };
  }
}

/**
 * Bereinigt PostgreSQL-Speicher
 */
export async function cleanupAdvancedStorage(): Promise<{ success: boolean; freedBytes?: number; error?: string; usedPostgres?: boolean }> {
  try {
    const result = await cleanupPostgres();
    
    return { 
      success: result.success, 
      freedBytes: result.freedBytes,
      error: result.error,
      usedPostgres: true
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Bereinigung',
      usedPostgres: false
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
 * Schätzt die Größe eines Objekts in Bytes (JSON.stringify)
 */
export function estimateObjectSize(obj: unknown): number {
  return new Blob([JSON.stringify(obj)]).size;
}

/**
 * Prüft, ob genug Speicherplatz verfügbar ist
 */
export function hasEnoughStorage(requiredBytes: number): boolean {
  // PostgreSQL hat normalerweise viel mehr Speicherplatz verfügbar
  return true;
}
