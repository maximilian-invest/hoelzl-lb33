"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { safeSetItem, safeGetItem, formatBytes } from "@/lib/storage-utils";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProjects, fetchProject, deleteProject as deleteApiProject, type Project } from "@/lib/project-api";

type ProjectData = {
  cfgCases: Record<string, unknown>;
  finCases: Record<string, unknown>;
  images: Array<{ src: string; caption?: string; width?: number; height?: number }>;
  pdfs: Array<{ src: string; name?: string }>;
  showUploads: boolean;
  texts: Record<string, string>;
  householdCalculation?: {
    inputs: Record<string, unknown>;
    result: Record<string, unknown> | null;
    lastModified?: number;
  };
};

export default function StartPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [apiProjects, setApiProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API-Projekte laden wenn authentifiziert
  useEffect(() => {
    const loadApiProjects = async () => {
      if (!token || !isAuthenticated) {
        return;
      }

      setIsLoadingProjects(true);
      try {
        const projects = await fetchProjects(token);
        setApiProjects(projects);
        console.log('API-Projekte geladen:', projects);
      } catch (error) {
        console.error('Fehler beim Laden der API-Projekte:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadApiProjects();
  }, [token, isAuthenticated]);

  const projectNames = useMemo(() => apiProjects.map(p => p.name), [apiProjects]);

  const newProject = () => {
    // leeres Projekt-Wizard starten
    router.push("/wizard");
  };

  const loadProject = async (name: string) => {
    setIsLoadingProject(true);
    
    try {
      // Finde das Projekt in der API-Liste
      const project = apiProjects.find(p => p.name === name);
      if (!project) {
        console.error('Projekt nicht gefunden:', name);
        return;
      }
      
      console.log('Gefundenes Projekt:', project);
      console.log('Projekt ID:', project.id);

      if (!token) {
        console.error('Nicht authentifiziert');
        return;
      }

      // Lade das vollständige Projekt von der API
      console.log('Lade Projekt von API mit project.id:', project.id);
      console.log('Token verfügbar:', !!token);
      const fullProjectResult = await fetchProject(token, project.id);
      const fullProject = fullProjectResult;
      console.log('API-Response:', fullProject);
      console.log('API-Projekt geladen:', fullProject);
      console.log('fullProject.id:', fullProject.id);

      // Speichere das Projekt im localStorage für die Hauptanwendung
      if (fullProject.config) {
        // Konvertiere das API-Projekt in das lokale Format
        const projectData = {
          cfgCases: {
            base: fullProject.config,
            bear: fullProject.config,
            bull: fullProject.config
          },
          finCases: {
            kaufpreis: fullProject.config.kaufpreis,
            nebenkosten: fullProject.config.nebenkosten,
            ekQuote: fullProject.config.ekQuote,
            tilgung: fullProject.config.tilgung,
            laufzeit: fullProject.config.laufzeit,
            marktMiete: fullProject.config.marktMiete,
            wertSteigerung: fullProject.config.wertSteigerung
          },
          images: [],
          pdfs: [],
          showUploads: true,
          texts: {
            title: fullProject.name,
            description: fullProject.description || ''
          },
          lastModified: new Date(fullProject.updated_at).getTime()
        };

        // Speichere das Projekt im localStorage
        const projects = safeGetItem("lb33_projects");
        let projectsData: Record<string, ProjectData> = {};
        
        console.log('Raw projects from localStorage:', projects);
        console.log('Type of projects:', typeof projects);
        
        if (projects) {
          try {
            const parsed = JSON.parse(projects);
            console.log('Parsed projects:', parsed);
            console.log('Type of parsed:', typeof parsed);
            
            // Stelle sicher, dass parsed ein Objekt ist
            if (typeof parsed === 'object' && parsed !== null) {
              projectsData = parsed;
            } else {
              console.warn('Parsed data is not an object, using empty object');
              projectsData = {};
            }
          } catch (error) {
            console.error('Fehler beim Parsen der Projekte:', error);
            projectsData = {};
          }
        }
        
        console.log('Final projectsData:', projectsData);
        console.log('Type of projectsData:', typeof projectsData);
        
        // Stelle sicher, dass projectsData ein Objekt ist, bevor wir es verwenden
        if (typeof projectsData !== 'object' || projectsData === null) {
          console.warn('projectsData is not an object, creating new object');
          projectsData = {};
        }
        
        projectsData[fullProject.name] = projectData;
        safeSetItem("lb33_projects", JSON.stringify(projectsData));

        // Setze das aktuelle Projekt
        safeSetItem("lb33_current_project", fullProject.name);
        safeSetItem("lb33_current_project_id", fullProject.id);
        safeSetItem("lb33_autoload", "true");
        
        // Lade die API-Config direkt in die Hauptanwendung
        safeSetItem("lb33_cfg_cases", JSON.stringify({
          base: fullProject.config,
          bear: fullProject.config,
          bull: fullProject.config
        }));
        safeSetItem("lb33_fin_cases", JSON.stringify({
          kaufpreis: fullProject.config.kaufpreis,
          nebenkosten: fullProject.config.nebenkosten,
          ekQuote: fullProject.config.ekQuote,
          tilgung: fullProject.config.tilgung,
          laufzeit: fullProject.config.laufzeit,
          marktMiete: fullProject.config.marktMiete,
          wertSteigerung: fullProject.config.wertSteigerung
        }));
        safeSetItem("lb33_texts", JSON.stringify({
          title: fullProject.name,
          subtitle: fullProject.description || ''
        }));
      }
      
      // Weiterleitung zur Hauptseite mit projectId als Query-Parameter
      const url = `/?projectId=${fullProject.id}`;
      console.log('Weiterleitung zu URL:', url);
      router.push(url);
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      alert('Fehler beim Laden des Projekts: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsLoadingProject(false);
    }
  };

  const deleteProject = async (name: string) => {
    if (!confirm(`Möchten Sie das Projekt "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    if (!token) {
      alert('Nicht authentifiziert');
      return;
    }

    try {
      // Finde das Projekt in der API-Liste
      const project = apiProjects.find(p => p.name === name);
      if (!project) {
        console.error('Projekt nicht gefunden:', name);
        return;
      }

      await deleteApiProject(token, project.id);
      
      // Aktualisiere API-Projekte State
      setApiProjects(prev => prev.filter(p => p.id !== project.id));
      
      console.log(`Projekt "${name}" erfolgreich gelöscht`);
    } catch (error) {
      console.error('Fehler beim Löschen des Projekts:', error);
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as ProjectData;
        
        // Validiere die importierten Daten
        if (!json.cfgCases || !json.finCases) {
          alert("Ungültige Projektdatei: Fehlende Konfigurationsdaten");
          return;
        }
        
        // Stelle sicher, dass alle erforderlichen Eigenschaften vorhanden sind
        const validatedData: ProjectData = {
          cfgCases: json.cfgCases || {},
          finCases: json.finCases || {},
          images: json.images || [],
          pdfs: json.pdfs || [],
          showUploads: json.showUploads !== undefined ? json.showUploads : true,
          texts: json.texts || {}
        };
        
        // Lokale Projekte werden nicht mehr unterstützt
        alert('Lokale Projekte werden nicht mehr unterstützt. Bitte verwende den Projekt-Wizard um ein neues Projekt zu erstellen.');
        return;
      } catch (error) {
        console.error('Fehler beim Importieren:', error);
        alert("Ungültige Projektdatei oder Fehler beim Lesen der Datei");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Ladeanimation */}
      {isLoadingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              {/* Animierter Spinner */}
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              
              {/* Pulsierender Text */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white animate-pulse">
                  Projekt wird geladen...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bitte warten Sie einen Moment
                </p>
              </div>
              
              {/* Fortschrittsbalken */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">allround.immo</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Willkommen beim Immobilien-Kalkulationsprogramm!<br />
            Mit diesem Tool kannst du komplexe Immobilieninvestments analysieren, Projekte speichern, laden oder neue erstellen. <br />
            Alle Kalkulationen erfolgen auf Basis professioneller Standards.
          </p>
        </header>

        {/* Aktionen */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Neues Projekt</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Starte mit einer leeren Vorlage.</p>
            <Button onClick={newProject}>Neues Projekt</Button>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Projekt hochladen</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Lade eine zuvor exportierte JSON‑Datei.</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={triggerUpload}>Projekt hochladen</Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        </section>

        {/* Projektkacheln */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Meine Projekte</h2>
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Anmeldung erforderlich</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">Bitte logge dich ein, um deine Projekte zu sehen.</p>
              <Button onClick={() => router.push('/login')}>Anmelden</Button>
            </div>
          ) : isLoadingProjects ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Projekte werden geladen...</h3>
              <p className="text-slate-500 dark:text-slate-400">Bitte warten Sie einen Moment</p>
            </div>
          ) : projectNames.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {apiProjects.map((project) => {
                const hasImages = false; // API-Projekte haben noch keine Bilder
                const hasPdfs = false; // API-Projekte haben noch keine PDFs
                
                return (
                  <div key={project.id} className="group relative rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Projekt-Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate" title={project.name}>
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Projekt-Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {hasImages ? `0 Fotos` : 'Keine Fotos'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {hasPdfs ? `0 PDFs` : 'Keine PDFs'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Erstellt: {new Date(project.created_at).toLocaleDateString('de-AT')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status: {project.status}
                      </div>
                    </div>

                    {/* Aktionen */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => loadProject(project.name)}
                        className="flex-1"
                      >
                        Öffnen
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteProject(project.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 px-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>

                    {/* Hover-Effekt */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Keine Projekte gefunden</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">Erstelle dein erstes Projekt oder lade ein vorhandenes hoch.</p>
              <Button onClick={newProject}>Erstes Projekt erstellen</Button>
            </div>
          )}
        </section>
      </div>
    </main>
    </ProtectedRoute>
  );
}


