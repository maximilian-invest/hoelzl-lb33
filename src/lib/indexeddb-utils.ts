/**
 * IndexedDB-Utility-Funktionen für erweiterte Speicherverwaltung
 * Bietet viel mehr Speicherplatz als localStorage (GB statt MB)
 */

export interface IndexedDBStorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
  projects: number;
  images: number;
  pdfs: number;
}

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

class IndexedDBManager {
  private dbName = 'LB33Storage';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('IndexedDB konnte nicht geöffnet werden:', request.error);
        resolve(false);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Projekte-Store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'name' });
          projectStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
        
        // Bilder-Store
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('projectName', 'projectName', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // PDFs-Store
        if (!db.objectStoreNames.contains('pdfs')) {
          const pdfStore = db.createObjectStore('pdfs', { keyPath: 'id' });
          pdfStore.createIndex('projectName', 'projectName', { unique: false });
          pdfStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<boolean> {
    if (!this.db) {
      return await this.init();
    }
    return true;
  }

  async saveProject(name: string, data: ProjectData): Promise<{ success: boolean; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      
      const projectData = {
        name,
        ...data,
        lastModified: Date.now()
      };
      
      const request = store.put(projectData);
      
      request.onsuccess = () => {
        resolve({ success: true });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Speichern des Projekts' });
      };
    });
  }

  async loadProject(name: string): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(name);
      
      request.onsuccess = () => {
        if (request.result) {
          const { name, ...data } = request.result;
          // Entferne den name-Feld aus den Daten
          delete (data as { name?: string }).name;
          resolve({ success: true, data: data as ProjectData });
        } else {
          resolve({ success: false, error: 'Projekt nicht gefunden' });
        }
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Laden des Projekts' });
      };
    });
  }

  async getAllProjects(): Promise<{ success: boolean; projects?: Record<string, ProjectData>; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const projects: Record<string, ProjectData> = {};
        request.result.forEach((item: { name: string; [key: string]: unknown }) => {
          const { name, ...data } = item;
          projects[name] = data as ProjectData;
        });
        resolve({ success: true, projects });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Laden der Projekte' });
      };
    });
  }

  async deleteProject(name: string): Promise<{ success: boolean; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(name);
      
      request.onsuccess = () => {
        resolve({ success: true });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Löschen des Projekts' });
      };
    });
  }

  async saveImage(projectName: string, imageData: { src: string; caption?: string; width?: number; height?: number }): Promise<{ success: boolean; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const imageRecord = {
        id: `${projectName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectName,
        ...imageData,
        timestamp: Date.now()
      };
      
      const request = store.put(imageRecord);
      
      request.onsuccess = () => {
        resolve({ success: true });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Speichern des Bildes' });
      };
    });
  }

  async getImages(projectName: string): Promise<{ success: boolean; images?: Array<{ src: string; caption?: string; width?: number; height?: number }>; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const index = store.index('projectName');
      const request = index.getAll(projectName);
      
      request.onsuccess = () => {
        const images = request.result.map((item: { src: string; caption?: string; width?: number; height?: number }) => ({
          src: item.src,
          caption: item.caption,
          width: item.width,
          height: item.height
        }));
        resolve({ success: true, images });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Laden der Bilder' });
      };
    });
  }

  async savePdf(projectName: string, pdfData: { src: string; name?: string }): Promise<{ success: boolean; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['pdfs'], 'readwrite');
      const store = transaction.objectStore('pdfs');
      
      const pdfRecord = {
        id: `${projectName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectName,
        ...pdfData,
        timestamp: Date.now()
      };
      
      const request = store.put(pdfRecord);
      
      request.onsuccess = () => {
        resolve({ success: true });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Speichern der PDF' });
      };
    });
  }

  async getPdfs(projectName: string): Promise<{ success: boolean; pdfs?: Array<{ src: string; name?: string }>; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['pdfs'], 'readonly');
      const store = transaction.objectStore('pdfs');
      const index = store.index('projectName');
      const request = index.getAll(projectName);
      
      request.onsuccess = () => {
        const pdfs = request.result.map((item: { src: string; name?: string }) => ({
          src: item.src,
          name: item.name
        }));
        resolve({ success: true, pdfs });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Laden der PDFs' });
      };
    });
  }

  async deleteImages(projectName: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const index = store.index('projectName');
      const request = index.getAll(projectName);
      
      request.onsuccess = () => {
        const images = request.result;
        let deletedCount = 0;
        
        // Lösche alle Bilder des Projekts
        for (const image of images) {
          const deleteRequest = store.delete(image.id);
          deleteRequest.onsuccess = () => {
            deletedCount++;
          };
        }
        
        resolve({ success: true, deletedCount });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Löschen der Bilder' });
      };
    });
  }

  async deletePdfs(projectName: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['pdfs'], 'readwrite');
      const store = transaction.objectStore('pdfs');
      const index = store.index('projectName');
      const request = index.getAll(projectName);
      
      request.onsuccess = () => {
        const pdfs = request.result;
        let deletedCount = 0;
        
        // Lösche alle PDFs des Projekts
        for (const pdf of pdfs) {
          const deleteRequest = store.delete(pdf.id);
          deleteRequest.onsuccess = () => {
            deletedCount++;
          };
        }
        
        resolve({ success: true, deletedCount });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Löschen der PDFs' });
      };
    });
  }

  async getStorageInfo(): Promise<IndexedDBStorageInfo> {
    if (!(await this.ensureDB())) {
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

    try {
      // Zähle Projekte
      const projectsResult = await this.getAllProjects();
      const projectCount = projectsResult.success ? Object.keys(projectsResult.projects || {}).length : 0;

      // Zähle Bilder
      const imagesResult = await this.getAllImages();
      const imageCount = imagesResult.success ? imagesResult.images?.length || 0 : 0;

      // Zähle PDFs
      const pdfsResult = await this.getAllPdfs();
      const pdfCount = pdfsResult.success ? pdfsResult.pdfs?.length || 0 : 0;

      // Schätze Speicherverbrauch (IndexedDB hat normalerweise viel mehr Platz)
      const estimatedUsed = (projectCount * 50) + (imageCount * 500) + (pdfCount * 1000); // KB
      const estimatedTotal = 100 * 1024 * 1024; // 100 MB als konservative Schätzung
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

  private async getAllImages(): Promise<{ success: boolean; images?: Array<{ id: string; projectName: string; src: string; caption?: string; width?: number; height?: number; timestamp: number }>; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve({ success: true, images: request.result });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Laden aller Bilder' });
      };
    });
  }

  private async getAllPdfs(): Promise<{ success: boolean; pdfs?: Array<{ id: string; projectName: string; src: string; name?: string; timestamp: number }>; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['pdfs'], 'readonly');
      const store = transaction.objectStore('pdfs');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve({ success: true, pdfs: request.result });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: 'Fehler beim Laden aller PDFs' });
      };
    });
  }

  async cleanup(): Promise<{ success: boolean; freedBytes?: number; error?: string }> {
    if (!(await this.ensureDB())) {
      return { success: false, error: 'IndexedDB nicht verfügbar' };
    }

    try {
      // Lösche alte Bilder (älter als 30 Tage)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const imagesResult = await this.getAllImages();
      if (imagesResult.success && imagesResult.images) {
        const oldImages = imagesResult.images.filter((img) => img.timestamp < thirtyDaysAgo);
        
        for (const img of oldImages) {
          const transaction = this.db!.transaction(['images'], 'readwrite');
          const store = transaction.objectStore('images');
          store.delete(img.id);
        }
      }

      // Lösche alte PDFs (älter als 30 Tage)
      const pdfsResult = await this.getAllPdfs();
      if (pdfsResult.success && pdfsResult.pdfs) {
        const oldPdfs = pdfsResult.pdfs.filter((pdf) => pdf.timestamp < thirtyDaysAgo);
        
        for (const pdf of oldPdfs) {
          const transaction = this.db!.transaction(['pdfs'], 'readwrite');
          const store = transaction.objectStore('pdfs');
          store.delete(pdf.id);
        }
      }

      return { success: true, freedBytes: 0 }; // IndexedDB bereinigt sich automatisch
    } catch {
      return { success: false, error: 'Fehler bei der Bereinigung' };
    }
  }
}

// Singleton-Instanz
export const indexedDBManager = new IndexedDBManager();

// Hilfsfunktionen für einfache Verwendung
export async function initIndexedDB(): Promise<boolean> {
  return await indexedDBManager.init();
}

export async function saveProjectToIndexedDB(name: string, data: ProjectData): Promise<{ success: boolean; error?: string }> {
  return await indexedDBManager.saveProject(name, data);
}

export async function loadProjectFromIndexedDB(name: string): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
  return await indexedDBManager.loadProject(name);
}

export async function getAllProjectsFromIndexedDB(): Promise<{ success: boolean; projects?: Record<string, ProjectData>; error?: string }> {
  return await indexedDBManager.getAllProjects();
}

export async function deleteProjectFromIndexedDB(name: string): Promise<{ success: boolean; error?: string }> {
  return await indexedDBManager.deleteProject(name);
}

export async function getIndexedDBStorageInfo(): Promise<IndexedDBStorageInfo> {
  return await indexedDBManager.getStorageInfo();
}

export async function cleanupIndexedDB(): Promise<{ success: boolean; freedBytes?: number; error?: string }> {
  return await indexedDBManager.cleanup();
}
