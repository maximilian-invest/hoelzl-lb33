"use client";

import React from "react";
import { Card } from "@/components/ui/card";

interface MapComponentProps {
  lat?: number;
  lon?: number;
  address?: string;
  className?: string;
  height?: string;
}

export function MapComponent({ 
  lat = 47.8095, 
  lon = 13.0550, 
  address = "Salzburg, Österreich",
  className = "",
  height = "h-64"
}: MapComponentProps) {
  // Berechne Bounding Box basierend auf Koordinaten
  const bbox = `${(lon - 0.01).toFixed(6)}%2C${(lat - 0.01).toFixed(6)}%2C${(lon + 0.01).toFixed(6)}%2C${(lat + 0.01).toFixed(6)}`;
  
  return (
    <div className={`mb-8 ${className}`}>
      <Card className="overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="w-full h-64">
          <iframe
            title={`Lage des Objekts - ${address}`}
            className="w-full h-full border-0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📍 {address}
          </p>
        </div>
      </Card>
    </div>
  );
}
