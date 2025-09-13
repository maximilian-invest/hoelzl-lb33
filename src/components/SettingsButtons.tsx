import React, { RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface SettingsButtonsProps {
  onFinish: () => void;
  onResetProject?: () => void;
  onSaveProject?: () => void;
  onExportProject?: () => void;
  onImportProject?: () => void;
  onImportFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef?: RefObject<HTMLInputElement | null>;
}

export function SettingsButtons({
  onFinish,
  onResetProject,
  onSaveProject,
  onExportProject,
  onImportProject,
  onImportFile,
  importInputRef
}: SettingsButtonsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSave = async () => {
    if (!onSaveProject) return;
    
    setIsSaving(true);
    try {
      await onSaveProject();
      setSaveSuccess(true);
      addToast({
        title: "Einstellungen gespeichert",
        description: "Ihre Einstellungen wurden erfolgreich gespeichert",
        type: "success",
        duration: 3000
      });
      
      // Schließe die Einstellungen nach erfolgreichem Speichern
      setTimeout(() => {
        if (onFinish) {
          onFinish();
        }
      }, 1500); // Warte 1.5 Sekunden, damit der Benutzer das Success-Feedback sieht
    } catch (error) {
      addToast({
        title: "Fehler beim Speichern",
        description: "Einstellungen konnten nicht gespeichert werden",
        type: "error",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-2 justify-center">
        <Button 
          size="sm"
          className="rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-200 hover:scale-105"
          onClick={handleSave}
          loading={isSaving}
          success={saveSuccess}
          loadingText="Speichern..."
          successText="Gespeichert!"
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

export default SettingsButtons;
