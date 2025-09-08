/**
 * PostgreSQL-Utility-Funktionen für erweiterte Speicherverwaltung
 * Ersetzt die IndexedDB-Implementierung durch eine serverbasierte PostgreSQL-Lösung
 */

import { queryDatabase } from './database';

export interface ProjectData {
  cfgCases: Record<string, unknown>;
  finCases: Record<string, unknown>;
  images: Array<{ src: string; caption?: string; width?: number; height?: number }>;
  pdfs: Array<{ src: string; name?: string }>;
  showUploads: boolean;
  texts: Record<string, string>;
  upsideScenarios?: unknown[];
  lastModified?: number;
}

export interface PostgresStorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
  projects: number;
  images: number;
  pdfs: number;
}

class PostgresManager {
  /**
   * Speichert ein Projekt in der PostgreSQL-Datenbank
   */
  async saveProject(name: string, data: ProjectData): Promise<{ success: boolean; error?: string }> {
    try {
      // Prüfe, ob Projekt bereits existiert
      const existingProject = await queryDatabase(
        'SELECT id FROM projects WHERE name = $1',
        [name]
      );

      if (existingProject.success && existingProject.data && existingProject.data.length > 0) {
        // Update bestehendes Projekt
        const result = await queryDatabase(`
          UPDATE projects 
          SET cfg_cases = $1, fin_cases = $2, texts = $3, upside_scenarios = $4, show_uploads = $5, updated_at = CURRENT_TIMESTAMP
          WHERE name = $6
        `, [
          JSON.stringify(data.cfgCases),
          JSON.stringify(data.finCases),
          JSON.stringify(data.texts),
          JSON.stringify(data.upsideScenarios || []),
          data.showUploads,
          name
        ]);

        if (!result.success) {
          return { success: false, error: result.error };
        }
      } else {
        // Erstelle neues Projekt
        const result = await queryDatabase(`
          INSERT INTO projects (name, cfg_cases, fin_cases, texts, upside_scenarios, show_uploads)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          name,
          JSON.stringify(data.cfgCases),
          JSON.stringify(data.finCases),
          JSON.stringify(data.texts),
          JSON.stringify(data.upsideScenarios || []),
          data.showUploads
        ]);

        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      // Speichere Bilder
      if (data.images && data.images.length > 0) {
        await this.saveImages(name, data.images);
      }

      // Speichere PDFs
      if (data.pdfs && data.pdfs.length > 0) {
        await this.savePdfs(name, data.pdfs);
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
   * Lädt ein Projekt aus der PostgreSQL-Datenbank
   */
  async loadProject(name: string): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
    try {
      // Lade Projektdaten
      const projectResult = await queryDatabase(
        'SELECT * FROM projects WHERE name = $1',
        [name]
      );

      if (!projectResult.success || !projectResult.data || projectResult.data.length === 0) {
        return { success: false, error: 'Projekt nicht gefunden' };
      }

      const project = projectResult.data[0];

      // Lade Bilder
      const imagesResult = await this.getImages(name);
      const images = imagesResult.success ? imagesResult.images || [] : [];

      // Lade PDFs
      const pdfsResult = await this.getPdfs(name);
      const pdfs = pdfsResult.success ? pdfsResult.pdfs || [] : [];

      const projectData: ProjectData = {
        cfgCases: project.cfg_cases || {},
        finCases: project.fin_cases || {},
        texts: project.texts || {},
        upsideScenarios: project.upside_scenarios || [],
        showUploads: project.show_uploads || false,
        images,
        pdfs,
        lastModified: new Date(project.updated_at).getTime()
      };

      return { success: true, data: projectData };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden' 
      };
    }
  }

  /**
   * Lädt alle Projekte aus der PostgreSQL-Datenbank
   */
  async getAllProjects(): Promise<{ success: boolean; projects?: Record<string, ProjectData>; error?: string }> {
    try {
      const result = await queryDatabase('SELECT name FROM projects ORDER BY updated_at DESC');
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const projects: Record<string, ProjectData> = {};

      for (const project of result.data) {
        const loadResult = await this.loadProject(project.name);
        if (loadResult.success && loadResult.data) {
          projects[project.name] = loadResult.data;
        }
      }

      return { success: true, projects };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden aller Projekte' 
      };
    }
  }

  /**
   * Löscht ein Projekt aus der PostgreSQL-Datenbank
   */
  async deleteProject(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await queryDatabase('DELETE FROM projects WHERE name = $1', [name]);
      
      if (!result.success) {
        return { success: false, error: result.error };
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
   * Speichert Bilder für ein Projekt
   */
  async saveImages(projectName: string, images: Array<{ src: string; caption?: string; width?: number; height?: number }>): Promise<{ success: boolean; error?: string }> {
    try {
      // Lösche alte Bilder des Projekts
      await queryDatabase('DELETE FROM images WHERE project_name = $1', [projectName]);

      // Speichere neue Bilder
      for (const image of images) {
        const result = await queryDatabase(`
          INSERT INTO images (project_name, src, caption, width, height)
          VALUES ($1, $2, $3, $4, $5)
        `, [projectName, image.src, image.caption, image.width, image.height]);

        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern der Bilder' 
      };
    }
  }

  /**
   * Lädt Bilder für ein Projekt
   */
  async getImages(projectName: string): Promise<{ success: boolean; images?: Array<{ src: string; caption?: string; width?: number; height?: number }>; error?: string }> {
    try {
      const result = await queryDatabase(
        'SELECT src, caption, width, height FROM images WHERE project_name = $1 ORDER BY created_at ASC',
        [projectName]
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const images = result.data.map((img: any) => ({
        src: img.src,
        caption: img.caption,
        width: img.width,
        height: img.height
      }));

      return { success: true, images };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der Bilder' 
      };
    }
  }

  /**
   * Speichert PDFs für ein Projekt
   */
  async savePdfs(projectName: string, pdfs: Array<{ src: string; name?: string }>): Promise<{ success: boolean; error?: string }> {
    try {
      // Lösche alte PDFs des Projekts
      await queryDatabase('DELETE FROM pdfs WHERE project_name = $1', [projectName]);

      // Speichere neue PDFs
      for (const pdf of pdfs) {
        const result = await queryDatabase(`
          INSERT INTO pdfs (project_name, src, name)
          VALUES ($1, $2, $3)
        `, [projectName, pdf.src, pdf.name]);

        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern der PDFs' 
      };
    }
  }

  /**
   * Lädt PDFs für ein Projekt
   */
  async getPdfs(projectName: string): Promise<{ success: boolean; pdfs?: Array<{ src: string; name?: string }>; error?: string }> {
    try {
      const result = await queryDatabase(
        'SELECT src, name FROM pdfs WHERE project_name = $1 ORDER BY created_at ASC',
        [projectName]
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const pdfs = result.data.map((pdf: any) => ({
        src: pdf.src,
        name: pdf.name
      }));

      return { success: true, pdfs };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der PDFs' 
      };
    }
  }

  /**
   * Ruft Speicherinformationen ab
   */
  async getStorageInfo(): Promise<PostgresStorageInfo> {
    try {
      // Zähle Projekte
      const projectsResult = await queryDatabase('SELECT COUNT(*) as count FROM projects');
      const projectCount = projectsResult.success ? parseInt(projectsResult.data[0].count) : 0;

      // Zähle Bilder
      const imagesResult = await queryDatabase('SELECT COUNT(*) as count FROM images');
      const imageCount = imagesResult.success ? parseInt(imagesResult.data[0].count) : 0;

      // Zähle PDFs
      const pdfsResult = await queryDatabase('SELECT COUNT(*) as count FROM pdfs');
      const pdfCount = pdfsResult.success ? parseInt(pdfsResult.data[0].count) : 0;

      // Schätze Speicherverbrauch
      const estimatedUsed = (projectCount * 50) + (imageCount * 500) + (pdfCount * 1000); // KB
      const estimatedTotal = 1000 * 1024 * 1024; // 1 GB als Schätzung
      const available = Math.max(0, estimatedTotal - estimatedUsed);
      const percentage = (estimatedUsed / estimatedTotal) * 100;

      return {
        used: estimatedUsed,
        available,
        total: estimatedTotal,
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
  async cleanup(): Promise<{ success: boolean; freedBytes?: number; error?: string }> {
    try {
      // Lösche Bilder älter als 30 Tage
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      await queryDatabase('DELETE FROM images WHERE created_at < $1', [thirtyDaysAgo]);

      // Lösche PDFs älter als 30 Tage
      await queryDatabase('DELETE FROM pdfs WHERE created_at < $1', [thirtyDaysAgo]);

      return { success: true, freedBytes: 0 };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Bereinigung' 
      };
    }
  }
}

// Singleton-Instanz
export const postgresManager = new PostgresManager();

// Hilfsfunktionen für einfache Verwendung
export async function saveProjectToPostgres(name: string, data: ProjectData): Promise<{ success: boolean; error?: string }> {
  return await postgresManager.saveProject(name, data);
}

export async function loadProjectFromPostgres(name: string): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
  return await postgresManager.loadProject(name);
}

export async function getAllProjectsFromPostgres(): Promise<{ success: boolean; projects?: Record<string, ProjectData>; error?: string }> {
  return await postgresManager.getAllProjects();
}

export async function deleteProjectFromPostgres(name: string): Promise<{ success: boolean; error?: string }> {
  return await postgresManager.deleteProject(name);
}

export async function getPostgresStorageInfo(): Promise<PostgresStorageInfo> {
  return await postgresManager.getStorageInfo();
}

export async function cleanupPostgres(): Promise<{ success: boolean; freedBytes?: number; error?: string }> {
  return await postgresManager.cleanup();
}
