"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { safeSetItem, safeGetItem, formatBytes } from "@/lib/storage-utils";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
  const [projects, setProjects] = useState<Record<string, ProjectData>>({});
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = safeGetItem("lb33_projects");
      setProjects(raw ? JSON.parse(raw) : {});
    } catch {
      setProjects({});
    }
  }, []);

  const projectNames = useMemo(() => Object.keys(projects), [projects]);

  const newProject = () => {
    // leeres Projekt-Wizard starten
    router.push("/wizard");
  };

  const loadProject = async (name: string) => {
    setIsLoadingProject(true);
    
    try {
      const results = [
        safeSetItem("lb33_current_project", name),
        safeSetItem("lb33_autoload", "true")
      ];
      
      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        console.warn('Fehler beim Laden des Projekts:', failedResults.map(r => r.error));
      }
      
      // Mindestens 2 Sekunden Ladezeit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      router.push("/");
    } finally {
      setIsLoadingProject(false);
    }
  };

  const deleteProject = (name: string) => {
    if (!confirm(`Möchten Sie das Projekt "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    const updatedProjects = { ...projects };
    delete updatedProjects[name];
    
    const results = [
      safeSetItem("lb33_projects", updatedProjects)
    ];
    
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.warn('Fehler beim Löschen des Projekts:', failedResults.map(r => r.error));
      alert("Fehler beim Löschen des Projekts");
      return;
    }
    
    // Aktualisiere den lokalen State
    setProjects(updatedProjects);
    console.log(`Projekt "${name}" erfolgreich gelöscht`);
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
        
        const name = `Import ${new Date().toLocaleString("de-AT")}`;
        const all = { ...projects, [name]: validatedData };
        
        const results = [
          safeSetItem("lb33_projects", all),
          safeSetItem("lb33_current_project", name),
          safeSetItem("lb33_autoload", "true"),
          // Speichere auch die einzelnen Daten-Keys für die Hauptseite
          safeSetItem("lb33_cfg_cases", validatedData.cfgCases),
          safeSetItem("lb33_fin_cases", validatedData.finCases),
          safeSetItem("lb33_images", validatedData.images),
          safeSetItem("lb33_pdfs", validatedData.pdfs),
          safeSetItem("lb33_show_uploads", validatedData.showUploads),
          safeSetItem("lb33_texts", validatedData.texts)
        ];
        
        const failedResults = results.filter(r => !r.success);
        const cleanedResults = results.filter(r => r.cleaned && r.freedBytes);
        
        if (failedResults.length > 0) {
          console.warn('Fehler beim Importieren des Projekts:', failedResults.map(r => r.error));
          alert("Projekt importiert, aber einige Speichervorgänge fehlgeschlagen");
        } else if (cleanedResults.length > 0) {
          const totalFreed = cleanedResults.reduce((sum, r) => sum + (r.freedBytes || 0), 0);
          console.log(`Projekt importiert, ${formatBytes(totalFreed)} Speicherplatz freigegeben`);
        } else {
          console.log('Projekt erfolgreich importiert');
        }
        
        // Aktualisiere den lokalen State
        setProjects(all);
        
        router.push("/");
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
          {projectNames.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projectNames.map((projectName) => {
                const project = projects[projectName];
                const projectInfo = project?.texts || {};
                const hasImages = project?.images && project.images.length > 0;
                const hasPdfs = project?.pdfs && project.pdfs.length > 0;
                
                return (
                  <div key={projectName} className="group relative rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Projekt-Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate" title={projectName}>
                        {projectName}
                      </h3>
                      {projectInfo.title && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {projectInfo.title}
                        </p>
                      )}
                    </div>

                    {/* Projekt-Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {hasImages ? `${project.images.length} Fotos` : 'Keine Fotos'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {hasPdfs ? `${project.pdfs.length} PDFs` : 'Keine PDFs'}
                      </div>
                    </div>

                    {/* Aktionen */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => loadProject(projectName)}
                        className="flex-1"
                      >
                        Öffnen
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteProject(projectName)}
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


