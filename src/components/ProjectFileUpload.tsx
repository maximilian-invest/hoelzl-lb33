"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProjectFile, getSignedUrl, deleteProjectFile, type ProjectFile } from "@/lib/project-api";
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

  // Funktion zum Löschen einer Datei
  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!token) return;
    
    // Bestätigung vor dem Löschen
    if (!confirm(`Möchten Sie die Datei "${fileName}" wirklich löschen?`)) {
      return;
    }
    
    try {
      const result = await deleteProjectFile(token, fileId);
      
      if (result.success) {
        addToast({
          title: "Datei gelöscht",
          description: `&quot;${fileName}&quot; wurde erfolgreich gelöscht`,
          type: "success",
          duration: 3000
        });
        
        // Lade die Dateien neu
        onFilesUpdate();
      } else {
        throw new Error(result.message || 'Löschen fehlgeschlagen');
      }
    } catch (error) {
      console.error('Lösch-Fehler:', error);
      addToast({
        title: "Löschen fehlgeschlagen",
        description: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen',
        type: "error",
        duration: 5000
      });
    }
  };

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
  const imageFiles = projectFiles.filter(file => file.file_type === 'image');
  const pdfFiles = projectFiles.filter(file => file.file_type === 'pdf');

  return (
    <div className="pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Projekt-Dateien
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Lade Bilder und Dokumente für dein Projekt hoch. Alle Dateien werden sicher gespeichert und können jederzeit geöffnet oder gelöscht werden.
          </p>
        </div>

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
            <span className="text-sm text-muted-foreground">
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
          <Card className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fotos ({imageFiles.length})
              </h3>
              
              {imageFiles.length > 0 ? (
                <div className="space-y-2">
                  {imageFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div 
                        className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        <p className="text-sm font-medium text-card-foreground truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDelete(file.id, file.file_name);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Keine Fotos vorhanden</p>
                </div>
              )}
            </div>
          </Card>

          {/* Rechte Spalte: Dokumente */}
          <Card className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dokumente ({pdfFiles.length})
              </h3>
              
              {pdfFiles.length > 0 ? (
                <div className="space-y-2">
                  {pdfFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div 
                        className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        <p className="text-sm font-medium text-card-foreground truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDelete(file.id, file.file_name);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Keine Dokumente vorhanden</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Leere Zustand */}
      {projectFiles.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-foreground mb-2">Noch keine Dateien hochgeladen</p>
            <p className="text-sm">Klicke auf &quot;Datei hochladen&quot; um zu beginnen</p>
          </div>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}
