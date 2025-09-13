"use client";

import { useEffect, useState } from 'react';
import { initializeAdvancedStorage } from '@/lib/storage-utils';

interface StorageInitializerProps {
  children: React.ReactNode;
}

export function StorageInitializer({ children }: StorageInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [migratedProjects, setMigratedProjects] = useState<number>(0);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const result = await initializeAdvancedStorage();
        
        if (result.success) {
          setIsInitialized(true);
          if (result.migratedProjects && result.migratedProjects > 0) {
            setMigratedProjects(result.migratedProjects);
            console.log(`✅ IndexedDB-Initialisierung erfolgreich! ${result.migratedProjects} Projekte migriert.`);
          } else {
            console.log('✅ IndexedDB-Initialisierung erfolgreich!');
          }
        } else {
          setInitializationError(result.error || 'Unbekannter Fehler');
          console.error('❌ IndexedDB-Initialisierung fehlgeschlagen:', result.error);
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
          {migratedProjects > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {migratedProjects} Projekte zu IndexedDB migriert
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

