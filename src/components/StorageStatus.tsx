"use client";

import { useEffect, useState } from 'react';
import { getStorageInfo, cleanupStorage } from '@/lib/storage-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/storage-utils';

interface StorageStatusProps {
  className?: string;
}

export function StorageStatus({ className }: StorageStatusProps) {
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: number;
    total: number;
    percentage: number;
    projects: number;
    images: number;
    pdfs: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStorageInfo = () => {
    setIsLoading(true);
    try {
      const info = getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Fehler beim Laden der Speicherinformationen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = () => {
    setIsLoading(true);
    try {
      const result = cleanupStorage();
      if (result.success) {
        console.log('Bereinigung erfolgreich:', result.freedBytes ? `${formatBytes(result.freedBytes)} freigegeben` : 'Keine Bereinigung nötig');
        loadStorageInfo(); // Aktualisiere die Anzeige
      } else {
        console.error('Bereinigung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Fehler bei der Bereinigung:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  if (!storageInfo) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Speicherstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (percentage: number) => {
    if (percentage < 50) return 'Ausreichend';
    if (percentage < 80) return 'Mittel';
    return 'Knapp';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Speicherstatus
          <Badge variant="default">
            JSON Storage
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speicherplatz-Balken */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Speicherplatz</span>
            <span className={`font-medium ${storageInfo.percentage > 80 ? 'text-red-600' : storageInfo.percentage > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
              {getStatusText(storageInfo.percentage)}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(storageInfo.percentage)}`}
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{formatBytes(storageInfo.used)} verwendet</span>
            <span>{formatBytes(storageInfo.available)} verfügbar</span>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500 dark:text-slate-400">Projekte</div>
            <div className="font-medium">{storageInfo.projects}</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Bilder</div>
            <div className="font-medium">{storageInfo.images}</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">PDFs</div>
            <div className="font-medium">{storageInfo.pdfs}</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Speichertyp</div>
            <div className="font-medium">JSON + localStorage</div>
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStorageInfo}
            disabled={isLoading}
          >
            {isLoading ? 'Lädt...' : 'Aktualisieren'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanup}
            disabled={isLoading}
          >
            {isLoading ? 'Bereinigt...' : 'Bereinigen'}
          </Button>
        </div>

        {/* Info-Text */}
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          ✅ JSON-basierte Speicherung aktiv - Alle Immobilien-Konfigurationen werden als JSON in Variablen gespeichert
        </div>
      </CardContent>
    </Card>
  );
}

