"use client";

import { useEffect, useState } from 'react';
import { initializeStorage } from '@/lib/storage-utils';

interface StorageInitializerProps {
  children: React.ReactNode;
}

export function StorageInitializer({ children }: StorageInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [loadedProjects, setLoadedProjects] = useState<number>(0);

  useEffect(() => {
    const initStorage = () => {
      try {
        const result = initializeStorage();
        
        if (result.success) {
          setIsInitialized(true);
          if (result.loadedProjects && result.loadedProjects > 0) {
            setLoadedProjects(result.loadedProjects);
            console.log(`✅ JSON-Speicher-Initialisierung erfolgreich! ${result.loadedProjects} Projekte geladen.`);
          } else {
            console.log('✅ JSON-Speicher-Initialisierung erfolgreich!');
          }
        } else {
          setInitializationError(result.error || 'Unbekannter Fehler');
          console.error('❌ JSON-Speicher-Initialisierung fehlgeschlagen:', result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        setInitializationError(errorMessage);
        console.error('❌ Fehler bei der Speicher-Initialisierung:', error);
      }
    };

    initStorage();
  }, []);

  // Zeige Ladebildschirm während der Initialisierung
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            {initializationError ? 'Initialisierung fehlgeschlagen' : 'allround.immo wird initialisiert...'}
          </p>
          {loadedProjects > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {loadedProjects} Projekte aus JSON-Speicher geladen
            </p>
          )}
          {initializationError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {initializationError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

