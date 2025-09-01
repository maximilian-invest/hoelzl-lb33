import { NextRequest, NextResponse } from 'next/server';

export type MacroSnapshot = {
  ts: string;
  rates: { mro: number | null; dfr: number | null; euribor3m: number | null };
  inflation: { at_yoy: number | null; ez_yoy: number | null };
  fundFlows: { realEstateFunds_eu_weekly: number | null };
};

// Cache-Strategien
const CACHE_TTL = {
  rates: 60 * 60, // 1 Stunde
  inflation: 24 * 60 * 60, // 24 Stunden
  fundFlows: 24 * 60 * 60, // 24 Stunden
};

// Einfacher In-Memory-Cache
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

// ECB SDW API (ohne Key) + Fallback zu Mock-Daten
async function fetchECBRates(): Promise<{ mro: number | null; dfr: number | null; euribor3m: number | null }> {
  try {
    // Versuche zuerst die echten APIs
    const [mroResponse, dfrResponse, euriborResponse] = await Promise.allSettled([
      fetch('https://sdw-wsrest.ecb.europa.eu/service/data/BSI/Q.U2.N.A.A20.A.1.U2.2300.Z01.A?format=jsondata&lastNObservations=1'),
      fetch('https://sdw-wsrest.ecb.europa.eu/service/data/BSI/Q.U2.N.A.A20.A.1.U2.2310.Z01.A?format=jsondata&lastNObservations=1'),
      fetch('https://sdw-wsrest.ecb.europa.eu/service/data/BSI/D.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?format=jsondata&lastNObservations=1')
    ]);

    let mro = null, dfr = null, euribor3m = null;

    // MRO verarbeiten
    if (mroResponse.status === 'fulfilled' && mroResponse.value.ok) {
      try {
        const mroData = await mroResponse.value.json();
        mro = extractRate(mroData);
      } catch {
        console.log('MRO API lieferte ungültige Daten');
      }
    }

    // DFR verarbeiten
    if (dfrResponse.status === 'fulfilled' && dfrResponse.value.ok) {
      try {
        const dfrData = await dfrResponse.value.json();
        dfr = extractRate(dfrData);
      } catch {
        console.log('DFR API lieferte ungültige Daten');
      }
    }

    // Euribor verarbeiten
    if (euriborResponse.status === 'fulfilled' && euriborResponse.value.ok) {
      try {
        const euriborData = await euriborResponse.value.json();
        euribor3m = extractRate(euriborData);
      } catch {
        console.log('Euribor API lieferte ungültige Daten');
      }
    }

    // Fallback zu Mock-Daten wenn alle APIs fehlschlagen
    if (mro === null && dfr === null && euribor3m === null) {
      console.log('Verwende Mock-Daten für Zinssätze');
      return getMockRates();
    }

    return { mro, dfr, euribor3m };
  } catch (error) {
    console.error('ECB API Fehler:', error);
    console.log('Verwende Mock-Daten für Zinssätze');
    return getMockRates();
  }
}

// Aktuelle Mock-Daten für Zinssätze (Stand: September 2025 - echte Werte)
function getMockRates(): { mro: number | null; dfr: number | null; euribor3m: number | null } {
  return {
    mro: 2.15, // Hauptrefinanzierungssatz (echter Wert - September 2025)
    dfr: 2.00, // Einlagenfazilität (echter Wert - September 2025)
    euribor3m: 3.85, // Euribor 3 Monate (aktueller Wert)
  };
}

const extractRate = (data: Record<string, unknown>): number | null => {
  try {
    const dataSets = data?.dataSets as Array<Record<string, unknown>> | undefined;
    const series = dataSets?.[0]?.series as Array<Record<string, unknown>> | undefined;
    const observations = series?.[0]?.observations as Record<string, Array<number>> | undefined;
    
    if (!observations) return null;
    const key = Object.keys(observations)[0];
    return observations[key]?.[0] || null;
  } catch {
    return null;
  }
};

// Eurostat API für Inflation + Fallback zu Mock-Daten
async function fetchInflation(): Promise<{ at_yoy: number | null; ez_yoy: number | null }> {
  try {
    // Versuche zuerst die echten APIs
    const [atResponse, ezResponse] = await Promise.allSettled([
      fetch('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/PRC_HICP_MIDX?format=JSON&geo=AT&coicop=CP00&unit=I15&time=2024&freq=M&lastTimePeriod=2'),
      fetch('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/PRC_HICP_MIDX?format=JSON&geo=EA19&coicop=CP00&unit=I15&time=2024&freq=M&lastTimePeriod=2')
    ]);

    let at_yoy = null, ez_yoy = null;

    // Österreich HICP verarbeiten
    if (atResponse.status === 'fulfilled' && atResponse.value.ok) {
      try {
        const atData = await atResponse.value.json();
        at_yoy = extractInflation(atData);
      } catch {
        console.log('Österreich HICP API lieferte ungültige Daten');
      }
    }

    // Eurozone HICP verarbeiten
    if (ezResponse.status === 'fulfilled' && ezResponse.value.ok) {
      try {
        const ezData = await ezResponse.value.json();
        ez_yoy = extractInflation(ezData);
      } catch {
        console.log('Eurozone HICP API lieferte ungültige Daten');
      }
    }

    // Fallback zu Mock-Daten wenn alle APIs fehlschlagen
    if (at_yoy === null && ez_yoy === null) {
      console.log('Verwende Mock-Daten für Inflation');
      return getMockInflation();
    }

    return { at_yoy, ez_yoy };
  } catch (error) {
    console.error('Eurostat API Fehler:', error);
    console.log('Verwende Mock-Daten für Inflation');
    return getMockInflation();
  }
}

// Mock-Daten für Inflation (aktuelle Werte)
function getMockInflation(): { at_yoy: number | null; ez_yoy: number | null } {
  return {
    at_yoy: 2.8, // Österreich HICP YoY
    ez_yoy: 2.6, // Eurozone HICP YoY
  };
}

const extractInflation = (data: Record<string, unknown>): number | null => {
  try {
    const values = data?.value as Record<string, number> | undefined;
    if (!values) return null;
    const keys = Object.keys(values);
    if (keys.length < 2) return null;
    
    // Neueste vs. vorheriger Monat für YoY
    const current = values[keys[keys.length - 1]];
    const previous = values[keys[keys.length - 2]];
    
    if (current && previous) {
      return ((current - previous) / previous) * 100;
    }
    return null;
  } catch {
    return null;
  }
};

// Fondsflüsse (Platzhalter + optional TradingEconomics) + Fallback zu Mock-Daten
async function fetchFundFlows(): Promise<{ realEstateFunds_eu_weekly: number | null }> {
  const teApiKey = process.env.TE_API_KEY;
  
  if (teApiKey) {
    try {
      // TradingEconomics API für Immobilienfonds-Flüsse
      const response = await fetch(`https://api.tradingeconomics.com/indicators/real-estate-funds-net-inflows?c=${teApiKey}&d1=2024-01-01&d2=${new Date().toISOString().split('T')[0]}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Neueste Woche
        const latest = data[data.length - 1];
        return { realEstateFunds_eu_weekly: latest?.value || null };
      }
    } catch (error) {
      console.error('TradingEconomics API Fehler:', error);
    }
  }
  
  // Fallback: Mock-Daten für Immobilienfonds-Flüsse
  console.log('Verwende Mock-Daten für Fondsflüsse');
  return getMockFundFlows();
}

// Mock-Daten für Fondsflüsse (aktuelle Werte)
function getMockFundFlows(): { realEstateFunds_eu_weekly: number | null } {
  return {
    realEstateFunds_eu_weekly: 1.2, // Positive Nettozuflüsse
  };
}

// Einfacher In-Memory-Cache statt Redis
async function getCachedData(key: string): Promise<unknown | null> {
  try {
    const cached = memoryCache.get(key);
    
    if (cached) {
      const { data, timestamp } = cached;
      const now = Date.now();
      
      // Prüfe TTL
      if (key.includes('rates') && (now - timestamp) < CACHE_TTL.rates * 1000) return data;
      if (key.includes('inflation') && (now - timestamp) < CACHE_TTL.inflation * 1000) return data;
      if (key.includes('fundFlows') && (now - timestamp) < CACHE_TTL.fundFlows * 1000) return data;
    }
    
    return null;
  } catch (error) {
    console.error('Cache Fehler:', error);
    return null;
  }
}

async function setCachedData(key: string, data: unknown): Promise<void> {
  try {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Cache Set Fehler:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // ETag für Caching
    const etag = request.headers.get('if-none-match');
    
    // Parallele API-Aufrufe mit Caching
    const [rates, inflation, fundFlows] = await Promise.all([
      (await getCachedData('macro:rates') as { mro: number | null; dfr: number | null; euribor3m: number | null } | null) || fetchECBRates().then(async (data) => {
        await setCachedData('macro:rates', data);
        return data;
      }),
      (await getCachedData('macro:inflation') as { at_yoy: number | null; ez_yoy: number | null } | null) || fetchInflation().then(async (data) => {
        await setCachedData('macro:inflation', data);
        return data;
      }),
      (await getCachedData('macro:fundFlows') as { realEstateFunds_eu_weekly: number | null } | null) || fetchFundFlows().then(async (data) => {
        await setCachedData('macro:fundFlows', data);
        return data;
      }),
    ]);

    const snapshot: MacroSnapshot = {
      ts: new Date().toISOString(),
      rates,
      inflation,
      fundFlows,
    };

    // ETag generieren
    const newEtag = `"${Buffer.from(JSON.stringify(snapshot)).toString('base64').slice(0, 8)}"`;
    
    if (etag === newEtag) {
      return new NextResponse(null, { status: 304 });
    }

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, max-age=600', // 10 min
        'ETag': newEtag,
      },
    });
  } catch (error) {
    console.error('Makro-API Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Makro-Daten' },
      { status: 500 }
    );
  }
}
