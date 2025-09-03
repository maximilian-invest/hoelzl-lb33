import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, FileDown, FilePlus } from "lucide-react";

interface SettingsButtonsProps {
  onResetProject: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
  onFinish: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
}

export function SettingsButtons({
  onResetProject,
  onSaveProject,
  onExportProject,
  onImportProject,
  onFinish,
  onImportFile,
  importInputRef
}: SettingsButtonsProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-3 justify-center">
        <Button 
          variant="outline" 
          className="gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
          onClick={onResetProject}
        >
          <RotateCcw className="w-4 h-4" /> Neues Projekt
        </Button>
        <Button 
          variant="outline" 
          className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
          onClick={onSaveProject}
        >
          Speichern
        </Button>
        <Button 
          variant="outline" 
          className="gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
          onClick={onExportProject}
        >
          <FileDown className="w-4 h-4" /> Download
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImportFile}
        />
        <Button 
          variant="outline" 
          className="gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
          onClick={onImportProject}
        >
          <FilePlus className="w-4 h-4" /> Upload
        </Button>
        <Button 
          className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-200 hover:scale-105 shadow-lg"
          onClick={onFinish}
        >
          Fertig
        </Button>
      </div>
    </div>
  );
}

export default SettingsButtons;
