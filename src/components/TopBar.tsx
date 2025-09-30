// import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  X,
  TrendingUp,
  Edit3,
  Check,
  Save,
  Menu,
  QrCode,
  LogOut,
  Plus,
  FolderOpen,
  Trash2,
  // Calculator,
} from "lucide-react";
import React, { useState } from "react";
import { LiveMarketTicker } from "./LiveMarketTicker";
import { CloseConfirmationDialog } from "./CloseConfirmationDialog";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { fetchProjects, deleteProject as deleteApiProject, type Project } from "@/lib/project-api";

interface TopBarProps {
  open: boolean;
  onToggleSettings: () => void;
  onShowProjects: () => void;
  onCloseApp?: () => void;
  onSaveAndClose?: () => void;
  onSave?: () => void;
  projectName?: string;
  onProjectNameChange?: (newName: string) => void;
  scenario?: "bear" | "base" | "bull";
  onProjectSelect?: (projectId: string) => void;
  onNewProject?: () => void;
  showProjectSelection?: boolean;
  currentProjectId?: string;
  isSaving?: boolean;
}

export function TopBar({
  open,
  onToggleSettings,
  onShowProjects,
  onCloseApp,
  onSaveAndClose,
  onSave,
  projectName,
  onProjectNameChange,
  scenario = "base",
  onProjectSelect,
  onNewProject,
  showProjectSelection = false,
  currentProjectId,
  isSaving = false,
}: TopBarProps) {
  const [showLiveTicker, setShowLiveTicker] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(projectName || "");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiProjects, setApiProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const { addToast } = useToast();
  const { token, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Synchronisiere editingProjectName mit projectName
  React.useEffect(() => {
    if (!isEditingProjectName) {
      setEditingProjectName(projectName || "");
    }
  }, [projectName, isEditingProjectName]);

  // API-Projekte laden wenn authentifiziert
  React.useEffect(() => {
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

  // Scenario-spezifische Farben
  const scenarioColors = {
    bear: {
      bg: "bg-red-500",
      text: "text-white",
      border: "border-red-600",
      label: "Bear Case"
    },
    base: {
      bg: "bg-blue-500", 
      text: "text-white",
      border: "border-blue-600",
      label: "Base Case"
    },
    bull: {
      bg: "bg-green-500",
      text: "text-white", 
      border: "border-green-600",
      label: "Bull Case"
    }
  };

  const currentScenario = scenarioColors[scenario];

  const handleCloseClick = () => {
    setShowCloseConfirmation(true);
  };

  const handleCloseWithoutSave = () => {
    setShowCloseConfirmation(false);
    if (onCloseApp) {
      onCloseApp();
    } else {
      router.push("/");
    }
  };

  const handleCloseAndSave = () => {
    setShowCloseConfirmation(false);
    if (onSaveAndClose) {
      onSaveAndClose();
    }
    // Fallback falls onSaveAndClose nicht definiert ist
    if (!onSaveAndClose) {
      router.push("/");
    }
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleStartEditProjectName = () => {
    setIsEditingProjectName(true);
    setEditingProjectName(projectName || "");
  };

  const handleSaveProjectName = () => {
    if (editingProjectName.trim() && onProjectNameChange) {
      onProjectNameChange(editingProjectName.trim());
      addToast({
        title: "Projektname gespeichert",
        description: `Projekt wurde umbenannt zu "${editingProjectName.trim()}"`,
        type: "success",
        duration: 3000
      });
    }
    setIsEditingProjectName(false);
  };

  const handleCancelEditProjectName = () => {
    setIsEditingProjectName(false);
    setEditingProjectName(projectName || "");
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveProjectName();
    } else if (e.key === 'Escape') {
      handleCancelEditProjectName();
    }
  };

  const handleSave = async () => {
    if (!onSave || isSaving) return;
    
    try {
      await onSave();
      setSaveSuccess(true);
      addToast({
        title: "Projekt gespeichert",
        description: "Ihr Projekt wurde erfolgreich gespeichert",
        type: "success",
        duration: 3000
      });
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      addToast({
        title: "Fehler beim Speichern",
        description: "Das Projekt konnte nicht gespeichert werden",
        type: "error",
        duration: 5000
      });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
    setShowSidebar(false);
  };

  const handleNewProject = () => {
    if (onNewProject) {
      onNewProject();
    }
    setShowSidebar(false);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Möchten Sie das Projekt "${projectName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    if (!token) {
      addToast({
        title: "Fehler",
        description: "Nicht authentifiziert",
        type: "error",
        duration: 3000
      });
      return;
    }

    try {
      await deleteApiProject(token, projectId);
      setApiProjects(prev => prev.filter(p => p.id !== projectId));
      addToast({
        title: "Projekt gelöscht",
        description: `Projekt "${projectName}" wurde erfolgreich gelöscht`,
        type: "success",
        duration: 3000
      });
    } catch (error) {
      addToast({
        title: "Fehler beim Löschen",
        description: `Fehler beim Löschen des Projekts: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        type: "error",
        duration: 5000
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-gray-300/50 dark:border-gray-600/50 bg-gray-500/20 dark:bg-gray-400/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-2 sm:px-6">
        <div className="h-14 sm:h-16 flex items-center justify-between">
          {/* Linke Seite - Burger Menu + Projektname */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Burger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 cursor-pointer"
              aria-label="Menü öffnen"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            
            {/* Projektname Badge */}
            {projectName && (
              <div className="hidden sm:flex items-center gap-1">
                {isEditingProjectName ? (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-200 rounded-full px-3 py-1 border border-gray-300 dark:border-gray-400">
                    <input
                      type="text"
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      onKeyDown={handleProjectNameKeyDown}
                      className="bg-transparent text-gray-700 dark:text-gray-800 text-sm font-medium outline-none min-w-0 flex-1"
                      autoFocus
                      placeholder="Projektname"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveProjectName}
                      className="w-4 h-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-300 rounded cursor-pointer"
                      disabled={!editingProjectName.trim()}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEditProjectName}
                      className="w-4 h-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-300 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="secondary" 
                      className="bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800 border-gray-300 dark:border-gray-400 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-300 transition-colors"
                      onClick={handleStartEditProjectName}
                    >
                      {projectName}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartEditProjectName}
                      className="w-4 h-4 p-0 hover:bg-gray-100 dark:hover:bg-gray-200 rounded cursor-pointer"
                      title="Projektname bearbeiten"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Rechte Seite - Logo */}
          <div className="flex items-center gap-1 sm:gap-4 min-w-0 flex-1 justify-end">
            <div className="text-lg sm:text-xl font-bold tracking-tight select-none text-gray-900 dark:text-gray-900 flex-shrink-0">allround.immo</div>
          </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setShowSidebar(false)}>
          <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl border-r border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Menü</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-2">
              {/* Projektauswahl Sektion */}
              {showProjectSelection && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Projekte</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewProject}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Neu
                    </Button>
                  </div>
                  
                  {isLoadingProjects ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Lade Projekte...</p>
                    </div>
                  ) : apiProjects.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {apiProjects.map((project) => {
                        const isCurrentProject = currentProjectId === project.id;
                        return (
                          <div
                            key={project.id}
                            className={`flex items-center justify-between p-2 rounded-lg group ${
                              isCurrentProject 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Button
                              variant="ghost"
                              onClick={() => handleProjectSelect(project.id)}
                              className={`flex-1 justify-start p-0 h-auto text-left text-sm cursor-pointer ${
                                isCurrentProject
                                  ? 'text-blue-900 dark:text-blue-100 font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              <FolderOpen className={`w-4 h-4 mr-2 flex-shrink-0 ${
                                isCurrentProject ? 'text-blue-600 dark:text-blue-400' : ''
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium flex items-center gap-2">
                                  {project.name}
                                  {isCurrentProject && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                      Aktuell
                                    </Badge>
                                  )}
                                </div>
                                {project.description && (
                                  <div className={`truncate text-xs ${
                                    isCurrentProject 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </Button>
                            {!isCurrentProject && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Keine Projekte gefunden</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNewProject}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Erstes Projekt erstellen
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Live-Ticker Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSidebar(false);
                  setShowLiveTicker(true);
                }}
                className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <div className="relative">
                  <TrendingUp className="w-4 h-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-blink"></div>
                </div>
                <span>Live-Ticker</span>
              </Button>
              
              {/* Speichern Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSidebar(false);
                  handleSave();
                }}
                disabled={isSaving}
                className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Speichern..." : saveSuccess ? "Gespeichert!" : "Speichern"}</span>
              </Button>
              
              {/* QR-Code Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSidebar(false);
                  setShowQRCode(true);
                }}
                className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QR-Code generieren</span>
              </Button>
              
              {/* Logout Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSidebar(false);
                    handleLogout();
                  }}
                  className="w-full justify-start gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Abmelden</span>
                </Button>
              </div>

              {/* Schließen Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSidebar(false);
                    handleCloseClick();
                  }}
                  className="w-full justify-start gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Schließen</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Live-Ticker Popup */}
      {showLiveTicker && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setShowLiveTicker(false)}>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl mx-2 sm:mx-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                Live Marktanalyse
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLiveTicker(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)]">
              <LiveMarketTicker />
            </div>
          </div>
        </div>
      )}

      {/* Schließen-Bestätigungsdialog */}
      <CloseConfirmationDialog
        isOpen={showCloseConfirmation}
        onClose={handleCancelClose}
        onCancel={handleCancelClose}
        onCloseWithoutSave={handleCloseWithoutSave}
        onCloseAndSave={handleCloseAndSave}
        projectName={projectName}
      />

      {/* QR-Code Generator */}
      {showQRCode && projectName && (
        <QRCodeGenerator
          projectName={projectName}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </>
  );
}

export default TopBar;