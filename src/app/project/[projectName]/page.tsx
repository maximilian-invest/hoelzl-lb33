"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { safeSetItem, safeGetItem } from "@/lib/storage-utils";
import { ProjectLockedOverlay } from "@/components/ProjectLockedOverlay";
import { PinDialog } from "@/components/PinDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";

export default function ProjectViewPage() {
  const params = useParams();
  const router = useRouter();
  const [projectName, setProjectName] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [projectLoaded, setProjectLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectNameParam = params.projectName as string;
        const decodedProjectName = decodeURIComponent(projectNameParam);
        setProjectName(decodedProjectName);

        // Prüfe ob das Projekt in localStorage existiert
        const projects = safeGetItem("lb33_projects");
        const projectExists = projects ? JSON.parse(projects)[decodedProjectName] : null;

        if (!projectExists) {
          console.error('Projekt nicht gefunden:', decodedProjectName);
          setIsLoading(false);
          return;
        }

        // Prüfe URL-Parameter für gesperrten Modus
        const urlParams = new URLSearchParams(window.location.search);
        const locked = urlParams.get('locked') === 'true';
        setIsLocked(locked);

        if (locked) {
          // Setze das Projekt als abgeschlossen (gesperrt)
          safeSetItem("lb33_current_project", decodedProjectName);
          safeSetItem("isProjectCompleted", "true");
          safeSetItem("lb33_autoload", "true");
        } else {
          // Normales Laden des Projekts
          safeSetItem("lb33_current_project", decodedProjectName);
          safeSetItem("lb33_autoload", "true");
        }

        setProjectLoaded(true);
      } catch (error) {
        console.error('Fehler beim Laden des Projekts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [params.projectName]);

  const handleUnlock = () => {
    setShowPinDialog(true);
  };

  const handlePinVerified = (pin: string) => {
    console.log("PIN verifiziert:", pin);
    // Entsperre das Projekt
    safeSetItem("isProjectCompleted", "false");
    setShowPinDialog(false);
    setIsLocked(false);
    // Weiterleitung zur Hauptseite
    router.push("/");
  };

  const handleGoToMain = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.push("/start");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Projekt wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!projectLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              Projekt nicht gefunden
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Das angeforderte Projekt konnte nicht gefunden werden.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Projektübersicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <ProjectLockedOverlay
          onUnlock={handleUnlock}
          title="Projekt im gesperrten Modus geöffnet"
          description="Dieses Projekt wurde über einen QR-Code geöffnet und ist im gesperrten Modus. Geben Sie den PIN ein, um das Projekt zu bearbeiten."
        />
        
        <PinDialog
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onPinVerified={handlePinVerified}
          title="PIN eingeben"
          description="Geben Sie den 4-stelligen PIN ein, um das Projekt zu bearbeiten:"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
            Projekt erfolgreich geladen
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {projectName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Das Projekt wurde erfolgreich geladen und ist bereit zur Bearbeitung.
          </p>
          <Button onClick={handleGoToMain} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Projekt öffnen
          </Button>
          <Button onClick={handleGoBack} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Projektübersicht
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
