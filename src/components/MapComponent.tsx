"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface MapComponentProps {
  lat?: number;
  lon?: number;
  address?: string;
  className?: string;
  height?: string;
}

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

export function MapComponent({ 
  lat: initialLat = 47.8095, 
  lon: initialLon = 13.0550, 
  address = "Salzburg, Österreich",
  className = "",
}: MapComponentProps) {
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lon: initialLon });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocoding-Funktion
  const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
    if (!address || address.trim() === "") return null;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=at,de,ch`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding-Anfrage fehlgeschlagen');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      
      return null;
    } catch (err) {
      console.error('Geocoding-Fehler:', err);
      return null;
    }
  };

  // Adresse geocodieren wenn sie sich ändert
  useEffect(() => {
    if (address && address !== "Salzburg, Österreich") {
      setIsLoading(true);
      setError(null);
      
      geocodeAddress(address)
        .then((result) => {
          if (result) {
            setCoordinates({ lat: result.lat, lon: result.lon });
          } else {
            setError('Adresse konnte nicht gefunden werden');
          }
        })
        .catch((err) => {
          setError('Fehler beim Laden der Adresse');
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Fallback zu den ursprünglichen Koordinaten
      setCoordinates({ lat: initialLat, lon: initialLon });
    }
  }, [address, initialLat, initialLon]);

  // Berechne Bounding Box basierend auf aktuellen Koordinaten
  const bbox = `${(coordinates.lon - 0.01).toFixed(6)}%2C${(coordinates.lat - 0.01).toFixed(6)}%2C${(coordinates.lon + 0.01).toFixed(6)}%2C${(coordinates.lat + 0.01).toFixed(6)}`;
  
  return (
    <div className={`mb-8 ${className}`}>
      <Card className="overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="w-full h-64 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Karte wird geladen...
              </div>
            </div>
          )}
          <iframe
            title={`Lage des Objekts - ${address}`}
            className="w-full h-full border-0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📍 {address}
            {error && <span className="text-red-500 ml-2">({error})</span>}
          </p>
        </div>
      </Card>
    </div>
  );
}
