"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProjectFile, getSignedUrl, type ProjectFile } from "@/lib/project-api";
import { useToast } from "@/components/ui/toast";

interface ProjectFileUploadProps {
  projectId: string;
  projectFiles: ProjectFile[];
  onFilesUpdate: () => void; // Callback um die Dateien neu zu laden
}

export function ProjectFileUpload({ projectId, projectFiles, onFilesUpdate }: ProjectFileUploadProps) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Validiere Dateityp
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      addToast({
        title: "Ungültiger Dateityp",
        description: "Nur Bilder (JPG, PNG, etc.) und PDF-Dateien sind erlaubt.",
        type: "error",
        duration: 5000
      });
      return;
    }

    // Prüfe Dateigröße (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      addToast({
        title: "Datei zu groß",
        description: `&quot;${file.name}&quot; ist zu groß. Maximale Größe: 20MB`,
        type: "error",
        duration: 5000
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const result = await uploadProjectFile(token, projectId, file);
      
      if (result.success) {
        addToast({
          title: "Datei hochgeladen",
          description: `"${file.name}" wurde erfolgreich hochgeladen`,
          type: "success",
          duration: 3000
        });
        
        // Lade die Dateien neu
        onFilesUpdate();
      } else {
        throw new Error(result.message || 'Upload fehlgeschlagen');
      }
    } catch (error) {
      console.error('Upload-Fehler:', error);
      addToast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload',
        type: "error",
        duration: 5000
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileClick = async (file: ProjectFile) => {
    if (!token) return;

    try {
      const result = await getSignedUrl(token, file.id);
      // Öffne die Datei in einem neuen Tab
      window.open(result.url, '_blank');
    } catch (error) {
      console.error('Fehler beim Öffnen der Datei:', error);
      addToast({
        title: "Fehler",
        description: "Datei konnte nicht geöffnet werden",
        type: "error",
        duration: 3000
      });
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  // Kategorisiere Dateien nach Typ
  const imageFiles = projectFiles.filter(file => file.project_type === 'image');
  const pdfFiles = projectFiles.filter(file => file.project_type === 'pdf');

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={triggerUpload}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Upload läuft...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Datei hochladen
            </>
          )}
        </Button>
        <span className="text-sm text-gray-500">
          PDF oder Bild (max. 20MB)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Dateien anzeigen in zwei Spalten */}
      {projectFiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Linke Spalte: Fotos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Fotos ({imageFiles.length})
            </h3>
            
            {imageFiles.length > 0 ? (
              <div className="space-y-2">
                {imageFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(file.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Keine Fotos vorhanden</p>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Dokumente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dokumente ({pdfFiles.length})
            </h3>
            
            {pdfFiles.length > 0 ? (
              <div className="space-y-2">
                {pdfFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(file.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Keine Dokumente vorhanden</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leere Zustand */}
      {projectFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p>Noch keine Dateien hochgeladen</p>
          <p className="text-sm">Klicke auf "Datei hochladen" um zu beginnen</p>
        </div>
      )}
    </div>
  );
}
