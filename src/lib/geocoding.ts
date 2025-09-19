/**
 * Geocoding-Service für Adressvalidierung und -vervollständigung
 * Verwendet OpenStreetMap's Nominatim API
 */

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
    county?: string;
  };
  boundingbox?: string[];
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
}

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
    county?: string;
  };
  formatted_address: string;
  confidence?: number;
}

/**
 * Sucht Adressvorschläge basierend auf einer Suchanfrage
 */
export async function searchAddresses(query: string, limit: number = 5): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&countrycodes=at,de,ch&addressdetails=1&extratags=1&namedetails=1`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeocodingResult[] = await response.json();
    
    return data.map((result) => ({
      ...result,
      formatted_address: formatAddress(result),
      confidence: calculateConfidence(result, query)
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Adressvorschläge:', error);
    return [];
  }
}

/**
 * Geocodiert eine Adresse zu Koordinaten
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || address.trim() === "") return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=at,de,ch&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeocodingResult[] = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Fehler beim Geocodieren der Adresse:', error);
    return null;
  }
}

/**
 * Reverse-Geocoding: Konvertiert Koordinaten zu einer Adresse
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeocodingResult = await response.json();
    return data;
  } catch (error) {
    console.error('Fehler beim Reverse-Geocodieren:', error);
    return null;
  }
}

/**
 * Formatiert eine Adresse für die Anzeige
 */
export function formatAddress(result: GeocodingResult): string {
  const addr = result.address;
  if (!addr) return result.display_name;

  const parts = [];
  
  // Straße und Hausnummer
  if (addr.house_number && addr.road) {
    parts.push(`${addr.road} ${addr.house_number}`);
  } else if (addr.road) {
    parts.push(addr.road);
  }
  
  // PLZ und Stadt
  if (addr.postcode && addr.city) {
    parts.push(`${addr.postcode} ${addr.city}`);
  } else if (addr.city) {
    parts.push(addr.city);
  }
  
  // Bundesland/Staat (nur wenn nicht Österreich)
  if (addr.state && addr.state !== 'Salzburg' && addr.state !== 'Österreich') {
    parts.push(addr.state);
  }
  
  // Land (nur wenn nicht Österreich)
  if (addr.country && addr.country !== 'Österreich') {
    parts.push(addr.country);
  }

  return parts.length > 0 ? parts.join(', ') : result.display_name;
}

/**
 * Berechnet ein Confidence-Score für die Adressvorschläge
 */
function calculateConfidence(result: GeocodingResult, query: string): number {
  let confidence = 0;
  const queryLower = query.toLowerCase();
  const displayNameLower = result.display_name.toLowerCase();
  
  // Basis-Confidence basierend auf Übereinstimmung
  if (displayNameLower.includes(queryLower)) {
    confidence += 50;
  }
  
  // Zusätzliche Punkte für exakte Übereinstimmungen
  if (result.address) {
    const addr = result.address;
    
    // Straße und Hausnummer vorhanden
    if (addr.road && addr.house_number) {
      confidence += 20;
    }
    
    // PLZ vorhanden
    if (addr.postcode) {
      confidence += 10;
    }
    
    // Stadt vorhanden
    if (addr.city) {
      confidence += 10;
    }
    
    // Österreich als Land
    if (addr.country === 'Österreich') {
      confidence += 5;
    }
    
    // Salzburg als Bundesland
    if (addr.state === 'Salzburg') {
      confidence += 5;
    }
  }
  
  return Math.min(confidence, 100);
}

/**
 * Validiert eine Adresse und gibt zusätzliche Informationen zurück
 */
export async function validateAddress(address: string): Promise<{
  isValid: boolean;
  confidence: number;
  coordinates?: { lat: number; lon: number };
  formattedAddress?: string;
  city?: string;
  postcode?: string;
  country?: string;
}> {
  const result = await geocodeAddress(address);
  
  if (!result) {
    return {
      isValid: false,
      confidence: 0
    };
  }
  
  const confidence = calculateConfidence(result, address);
  const isValid = confidence >= 30; // Mindest-Confidence für gültige Adresse
  
  return {
    isValid,
    confidence,
    coordinates: {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    },
    formattedAddress: formatAddress(result),
    city: result.address?.city,
    postcode: result.address?.postcode,
    country: result.address?.country
  };
}

/**
 * Debounced search function für bessere Performance
 */
export function createDebouncedSearch(
  searchFn: (query: string) => Promise<AddressSuggestion[]>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (query: string): Promise<AddressSuggestion[]> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        searchFn(query).then(resolve);
      }, delay);
    });
  };
}
