import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CloseConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onCloseWithoutSave: () => void;
  onCloseAndSave: () => void;
  projectName?: string;
}

export function CloseConfirmationDialog({
  isOpen,
  onClose,
  onCancel,
  onCloseWithoutSave,
  onCloseAndSave,
  projectName
}: CloseConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Projekt schließen
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Möchtest du das Projekt{projectName ? ` "${projectName}"` : ""} wirklich schließen?
            {projectName && (
              <span className="block mt-2 text-sm text-slate-500 dark:text-slate-400">
                Alle ungespeicherten Änderungen gehen verloren.
              </span>
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Abbrechen
            </Button>
            <Button
              variant="outline"
              onClick={onCloseWithoutSave}
              className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Ja
            </Button>
            <Button
              onClick={onCloseAndSave}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ja & Speichern
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
