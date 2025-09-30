"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProjects, fetchProject, deleteProject as deleteApiProject, type Project } from "@/lib/project-api";
import { safeSetItem, safeGetItem } from "@/lib/storage-utils";
import { Plus, FolderOpen, Trash2, Calendar, CheckCircle } from "lucide-react";

interface ProjectSelectionProps {
  onProjectLoad?: (projectId: string) => void;
}

export function ProjectSelection({ onProjectLoad }: ProjectSelectionProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [apiProjects, setApiProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(false);

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
      } catch (error) {
        console.error('Fehler beim Laden der API-Projekte:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadApiProjects();
  }, [token, isAuthenticated]);

  const newProject = () => {
    router.push("/wizard");
  };

  const loadProject = async (projectId: string) => {
    setIsLoadingProject(true);
    
    try {
      if (!token) {
        console.error('Nicht authentifiziert');
        return;
      }

      // Lade das vollständige Projekt von der API
      const fullProject = await fetchProject(token, projectId);

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
        let projectsData: Record<string, any> = {};
        
        if (projects) {
          try {
            const parsed = JSON.parse(projects);
            if (typeof parsed === 'object' && parsed !== null) {
              projectsData = parsed;
            }
          } catch (error) {
            console.error('Fehler beim Parsen der Projekte:', error);
            projectsData = {};
          }
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
      
      // Benachrichtige die Hauptseite über das geladene Projekt
      if (onProjectLoad) {
        onProjectLoad(projectId);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
      alert('Fehler beim Laden des Projekts: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsLoadingProject(false);
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Möchten Sie das Projekt "${projectName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    if (!token) {
      alert('Nicht authentifiziert');
      return;
    }

    try {
      await deleteApiProject(token, projectId);
      setApiProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Fehler beim Löschen des Projekts:', error);
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">allround.immo</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Willkommen beim Immobilien-Kalkulationsprogramm!<br />
              Bitte melden Sie sich an, um Ihre Projekte zu verwalten.
            </p>
          </header>
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Anmeldung erforderlich</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Bitte loggen Sie sich ein, um Ihre Projekte zu sehen.</p>
            <Button onClick={() => router.push('/login')} className="cursor-pointer">Anmelden</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Ladeanimation */}
      {isLoadingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white animate-pulse">
                  Projekt wird geladen...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bitte warten Sie einen Moment
                </p>
              </div>
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
            Mit diesem Tool können Sie komplexe Immobilieninvestments analysieren, Projekte speichern, laden oder neue erstellen. <br />
            Alle Kalkulationen erfolgen auf Basis professioneller Standards.
          </p>
        </header>

        {/* Aktionen */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Neues Projekt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Starten Sie mit einer leeren Vorlage.</p>
              <Button onClick={newProject} className="w-full cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Neues Projekt
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Projekt hochladen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Upload-Funktionen sind vorübergehend deaktiviert.</p>
              <Button variant="outline" className="w-full cursor-not-allowed" disabled>
                <FolderOpen className="w-4 h-4 mr-2" />
                Projekt hochladen
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Upload-Funktionen sind vorübergehend deaktiviert
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Projektkacheln */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Meine Projekte</h2>
          {isLoadingProjects ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Projekte werden geladen...</h3>
              <p className="text-slate-500 dark:text-slate-400">Bitte warten Sie einen Moment</p>
            </div>
          ) : apiProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {apiProjects.map((project) => (
                <Card key={project.id} className="group relative hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate" title={project.name}>
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProject(project.id, project.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        Erstellt: {new Date(project.created_at).toLocaleDateString('de-AT')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle className="w-4 h-4" />
                        Status: {project.status}
                      </div>
                    </div>
                    <Button 
                      onClick={() => loadProject(project.id)}
                      className="w-full cursor-pointer"
                    >
                      Projekt öffnen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Keine Projekte gefunden</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">Erstellen Sie Ihr erstes Projekt oder laden Sie ein vorhandenes hoch.</p>
              <Button onClick={newProject} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Erstes Projekt erstellen
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
