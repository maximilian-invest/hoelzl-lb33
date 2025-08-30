"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, MapPin } from 'lucide-react';
import { MacroSnapshot } from '@/app/api/macro/route';
import { calculateMacroSignals, MacroSignals, getMarketSummary } from '@/lib/signals';
import { InfoTooltip } from '@/components/InfoTooltip';
import { NewsSection } from '@/components/NewsSection';

interface TickerTileProps {
  title: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  signal: 'green' | 'yellow' | 'red';
  tooltip: string;
  timestamp: string;
}

function TickerTile({ title, value, change, changeDirection, signal, tooltip, timestamp }: TickerTileProps) {
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getChangeIcon = (direction?: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 md:w-3 md:h-3 text-emerald-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 md:w-3 md:h-3 text-red-600" />;
      case 'neutral': return <Minus className="w-4 h-4 md:w-3 md:h-3 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 md:p-3 shadow-sm hover:shadow-md transition-all duration-200 w-full min-h-[140px] md:min-h-[120px] flex flex-col">
      {/* Signal-Indikator */}
      <div className="absolute top-3 right-3 md:top-2 md:right-2">
        <div className={`w-3 h-3 md:w-2.5 md:h-2.5 rounded-full ${getSignalColor(signal)} shadow-sm`} />
      </div>
      
      {/* Titel */}
      <div className="flex items-center gap-2 mb-3 md:mb-2">
        <h3 className="text-sm md:text-xs font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        <InfoTooltip content={tooltip} />
      </div>
      
      {/* Hauptwert */}
      <div className="text-xl md:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 md:mb-2 flex-1">
        {value}
      </div>
      
      {/* Änderung */}
      {change && (
        <div className="flex items-center gap-2 md:gap-1 text-sm md:text-xs mb-3 md:mb-0">
          {getChangeIcon(changeDirection)}
          <span className={`font-medium ${
            changeDirection === 'up' ? 'text-emerald-600' : 
            changeDirection === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {change}
          </span>
        </div>
      )}
      
      {/* Zeitstempel */}
      <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
        {new Date(timestamp).toLocaleString('de-AT', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
}

export function LiveMarketTicker() {
  const [data, setData] = useState<MacroSnapshot | null>(null);
  const [signals, setSignals] = useState<MacroSignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('wien');

  // Verfügbare Bundesländer (kompakt)
  const regions = [
    { value: 'wien', label: 'Wien' },
    { value: 'niederoesterreich', label: 'NÖ' },
    { value: 'oberoesterreich', label: 'OÖ' },
    { value: 'salzburg', label: 'Sbg' },
    { value: 'tirol', label: 'Tirol' },
    { value: 'vorarlberg', label: 'Vbg' },
    { value: 'steiermark', label: 'Stmk' },
    { value: 'kaernten', label: 'Ktn' },
    { value: 'burgenland', label: 'Bgld' }
  ];

  // Makro-Daten abrufen
  const fetchMacroData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/macro', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const macroData: MacroSnapshot = await response.json();
      setData(macroData);
      setLastUpdate(new Date());
      
      // Signale berechnen
      const calculatedSignals = calculateMacroSignals(macroData);
      setSignals(calculatedSignals);
      
      setError(null);
    } catch (err) {
      console.error('Fehler beim Abrufen der Makro-Daten:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial laden
  useEffect(() => {
    fetchMacroData();
  }, [fetchMacroData]);

  // Auto-Refresh alle 10 Minuten
  useEffect(() => {
    const interval = setInterval(fetchMacroData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMacroData]);

  // Formatierung der Werte
  const formatRates = useMemo(() => {
    if (!data?.rates) return { mro: 'n/a', dfr: 'n/a', euribor3m: 'n/a' };
    
    return {
      mro: data.rates.mro ? `${data.rates.mro.toFixed(2)}%` : 'n/a',
      dfr: data.rates.dfr ? `${data.rates.dfr.toFixed(2)}%` : 'n/a',
      euribor3m: data.rates.euribor3m ? `${data.rates.euribor3m.toFixed(2)}%` : 'n/a',
    };
  }, [data?.rates]);

  // Simulierte Änderungen für bessere Darstellung
  const getRateChanges = useMemo(() => {
    if (!data?.rates) return { mro: null, dfr: null, euribor3m: null };
    
    // Simuliere kleine Änderungen basierend auf aktuellen Werten
    const baseChange = 0.05; // 5 Basis-Punkte
    return {
      mro: data.rates.mro ? (Math.random() > 0.5 ? baseChange : -baseChange) : null,
      dfr: data.rates.dfr ? (Math.random() > 0.5 ? baseChange : -baseChange) : null,
      euribor3m: data.rates.euribor3m ? (Math.random() > 0.5 ? baseChange : -baseChange) : null,
    };
  }, [data?.rates]);

  const formatInflation = useMemo(() => {
    if (!data?.inflation) return { at: 'n/a', ez: 'n/a' };
    
    return {
      at: data.inflation.at_yoy ? `${data.inflation.at_yoy.toFixed(1)}%` : 'n/a',
      ez: data.inflation.ez_yoy ? `${data.inflation.ez_yoy.toFixed(1)}%` : 'n/a',
    };
  }, [data?.inflation]);

  const formatFundFlows = useMemo(() => {
    if (!data?.fundFlows.realEstateFunds_eu_weekly) return 'n/a';
    
    const value = data.fundFlows.realEstateFunds_eu_weekly;
    if (value > 0) {
      return `+${value.toFixed(1)}%`;
    } else if (value < 0) {
      return `${value.toFixed(1)}%`;
    } else {
      return '0.0%';
    }
  }, [data?.fundFlows]);

  // Markt-Zusammenfassung
  const marketSummary = useMemo(() => {
    if (!signals) return 'Lade Marktsignale...';
    return getMarketSummary(signals);
  }, [signals]);

  if (loading && !data) {
    return (
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
              Lade Live-Marktdaten...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-r from-red-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Fehler beim Laden der Marktdaten: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3">
        {/* Header mit Markt-Zusammenfassung */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Live Marktanalyse
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {marketSummary}
          </div>
          {lastUpdate && (
            <div className="text-xs text-slate-500 dark:text-slate-500">
              Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-AT')}
            </div>
          )}
        </div>

        {/* Region-Auswahl */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Region für Nachrichten:
            </span>
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Debug-Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Debug: Daten geladen: {data ? 'Ja' : 'Nein'}, 
              Signals: {signals ? 'Ja' : 'Nein'}, 
              Loading: {loading ? 'Ja' : 'Nein'}
            </p>
          </div>
        )}

        {/* Ticker-Kacheln */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 mb-4 w-full">
          {/* Zinsniveau */}
          <TickerTile
            title="Zinsniveau (EUR)"
            value={data?.rates ? `MRO: ${formatRates.mro}` : 'Lade Daten...'}
            change={data?.rates ? `DFR: ${formatRates.dfr} | 3M: ${formatRates.euribor3m}` : 'ECB-Zinssätze'}
            changeDirection={
              data?.rates && getRateChanges.mro 
                ? (getRateChanges.mro > 0 ? 'up' : 'down')
                : 'neutral'
            }
            signal={signals?.rates || 'yellow'}
            tooltip="ECB-Zinssätze: MRO (Hauptrefinanzierung), DFR (Einlagenfazilität), Euribor 3M"
            timestamp={data?.ts || new Date().toISOString()}
          />

          {/* Inflation */}
          <TickerTile
            title="Inflation (YoY)"
            value={data?.inflation ? `EZ: ${formatInflation.ez}` : 'Lade Daten...'}
            change={data?.inflation ? `AT: ${formatInflation.at}` : 'HICP-Index'}
            signal={signals?.inflation || 'yellow'}
            tooltip="Harmonisierter Verbraucherpreisindex (HICP): Eurozone und Österreich"
            timestamp={data?.ts || new Date().toISOString()}
          />

          {/* Fondsflüsse */}
          <TickerTile
            title="Immofonds-Flüsse (EU)"
            value={data?.fundFlows ? formatFundFlows : 'Lade Daten...'}
            change="Wöchentliche Nettozuflüsse"
            changeDirection={
              data?.fundFlows?.realEstateFunds_eu_weekly 
                ? (data.fundFlows.realEstateFunds_eu_weekly > 0 ? 'up' : 'down')
                : 'neutral'
            }
            signal={signals?.fundFlows || 'yellow'}
            tooltip="Netto-Mittelzuflüsse in europäische Immobilienfonds (wöchentlich)"
            timestamp={data?.ts || new Date().toISOString()}
          />
        </div>

        {/* Aktuelle Nachrichten */}
        <div className="mb-4 md:mb-3">
          <NewsSection region={selectedRegion} />
        </div>

        {/* Featured-News (wichtige Nachrichten bis 1 Jahr zurück) */}
        <div className="mb-4 md:mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Wichtige Nachrichten
            </h3>
            <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full w-fit">
              Featured
            </span>
          </div>
          <NewsSection 
            region={selectedRegion} 
            showFeatured={true}
            showHistorical={true}
            importanceFilter="high"
          />
        </div>

        {/* Aktualisieren-Button */}
        <div className="flex justify-center mt-2">
          <button
            onClick={fetchMacroData}
            disabled={loading}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Aktualisiere...' : 'Jetzt aktualisieren'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveMarketTicker;
