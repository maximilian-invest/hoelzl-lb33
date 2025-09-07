/**
 * Migrations-Utility für den Wechsel von localStorage zu IndexedDB
 */

import { safeGetItem } from './storage-utils';
import { 
  initIndexedDB, 
  saveProjectToIndexedDB, 
  type ProjectData 
} from './indexeddb-utils';

export interface MigrationStatus {
  completed: boolean;
  migratedProjects: number;
  error?: string;
  timestamp: number;
}

const MIGRATION_KEY = 'lb33_migration_status';

/**
 * Prüft, ob die Migration bereits durchgeführt wurde
 */
export function isMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const status = localStorage.getItem(MIGRATION_KEY);
    if (status) {
      const parsed: MigrationStatus = JSON.parse(status);
      return parsed.completed;
    }
  } catch (error) {
    console.error('Fehler beim Prüfen des Migrationsstatus:', error);
  }
  
  return false;
}

/**
 * Markiert die Migration als abgeschlossen
 */
export function markMigrationCompleted(migratedProjects: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const status: MigrationStatus = {
      completed: true,
      migratedProjects,
      timestamp: Date.now()
    };
    localStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Fehler beim Markieren der Migration als abgeschlossen:', error);
  }
}

/**
 * Führt die Migration von localStorage zu IndexedDB durch
 */
export async function migrateToIndexedDB(): Promise<{ success: boolean; migratedProjects: number; error?: string }> {
  try {
    // IndexedDB initialisieren
    const initSuccess = await initIndexedDB();
    if (!initSuccess) {
      return { success: false, migratedProjects: 0, error: 'IndexedDB konnte nicht initialisiert werden' };
    }

    // Prüfen, ob bereits migriert wurde
    if (isMigrationCompleted()) {
      return { success: true, migratedProjects: 0, error: 'Migration bereits durchgeführt' };
    }

    // Projekte aus localStorage laden
    const projectsRaw = safeGetItem('lb33_projects');
    if (!projectsRaw) {
      markMigrationCompleted(0);
      return { success: true, migratedProjects: 0, error: 'Keine Projekte in localStorage gefunden' };
    }

    let projects: Record<string, ProjectData>;
    try {
      projects = JSON.parse(projectsRaw);
    } catch {
      return { success: false, migratedProjects: 0, error: 'Fehler beim Parsen der Projektdaten' };
    }

    // Projekte zu IndexedDB migrieren
    let migratedCount = 0;
    const errors: string[] = [];

    for (const [projectName, projectData] of Object.entries(projects)) {
      try {
        // Projekt zu IndexedDB speichern
        const result = await saveProjectToIndexedDB(projectName, projectData as ProjectData);
        
        if (result.success) {
          migratedCount++;
        } else {
          errors.push(`Projekt "${projectName}": ${result.error}`);
        }
      } catch (error) {
        errors.push(`Projekt "${projectName}": ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      }
    }

    // Migration als abgeschlossen markieren
    markMigrationCompleted(migratedCount);

    // Warnung bei Fehlern, aber Migration als erfolgreich markieren
    if (errors.length > 0) {
      console.warn('Migration mit Fehlern abgeschlossen:', errors);
    }

    return { 
      success: true, 
      migratedProjects: migratedCount,
      error: errors.length > 0 ? `Migration abgeschlossen mit ${errors.length} Fehlern` : undefined
    };

  } catch (error) {
    return { 
      success: false, 
      migratedProjects: 0, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Migration' 
    };
  }
}

/**
 * Prüft, ob IndexedDB verfügbar ist
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'indexedDB' in window;
}

/**
 * Führt eine automatische Migration durch, wenn nötig
 */
export async function autoMigrate(): Promise<{ success: boolean; migratedProjects: number; error?: string }> {
  // Prüfen, ob IndexedDB verfügbar ist
  if (!isIndexedDBAvailable()) {
    return { success: false, migratedProjects: 0, error: 'IndexedDB nicht verfügbar' };
  }

  // Prüfen, ob Migration bereits durchgeführt wurde
  if (isMigrationCompleted()) {
    return { success: true, migratedProjects: 0, error: 'Migration bereits durchgeführt' };
  }

  // Migration durchführen
  return await migrateToIndexedDB();
}

/**
 * Setzt den Migrationsstatus zurück (für Tests)
 */
export function resetMigrationStatus(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(MIGRATION_KEY);
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Migrationsstatus:', error);
  }
}

/**
 * Zeigt Migrationsinformationen an
 */
export function getMigrationInfo(): { 
  isCompleted: boolean; 
  isIndexedDBAvailable: boolean; 
  status?: MigrationStatus 
} {
  const isCompleted = isMigrationCompleted();
  const indexedDBAvailable = isIndexedDBAvailable();
  
  let status: MigrationStatus | undefined;
  if (typeof window !== 'undefined') {
    try {
      const statusRaw = localStorage.getItem(MIGRATION_KEY);
      if (statusRaw) {
        status = JSON.parse(statusRaw);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Migrationsinformationen:', error);
    }
  }

  return {
    isCompleted,
    isIndexedDBAvailable: indexedDBAvailable,
    status
  };
}

