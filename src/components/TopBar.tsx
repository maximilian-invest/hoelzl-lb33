// import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Settings,
  Moon,
  Printer,
  Sun,
  X,
  TrendingUp,
  // Calculator,
} from "lucide-react";
import React, { useState } from "react";
import { LiveMarketTicker } from "./LiveMarketTicker";

interface TopBarProps {
  open: boolean;
  dark: boolean;
  onToggleSettings: () => void;
  onToggleDark: () => void;
  onPrint: () => void;
  onShowProjects: () => void;

  onCloseApp?: () => void;
  projectName?: string;
  scenario?: "bear" | "base" | "bull";
}

export function TopBar({
  open,
  dark,
  onToggleSettings,
  onToggleDark,
  onPrint,
  onShowProjects,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCloseApp: _onCloseApp,
  projectName,
  scenario = "base",
}: TopBarProps) {
  const [showLiveTicker, setShowLiveTicker] = useState(false);

  // Scenario-spezifische Farben
  const scenarioColors = {
    bear: {
      bg: "bg-red-500",
      text: "text-white",
      border: "border-red-600",
      label: "Bear Case"
    },
    base: {
      bg: "bg-blue-500", 
      text: "text-white",
      border: "border-blue-600",
      label: "Base Case"
    },
    bull: {
      bg: "bg-green-500",
      text: "text-white", 
      border: "border-green-600",
      label: "Bull Case"
    }
  };

  const currentScenario = scenarioColors[scenario];

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-gray-300/50 dark:border-gray-600/50 bg-gray-500/20 dark:bg-gray-400/20 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSettings}
              className="text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10"
              aria-label="Einstellungen"
            >
              {open ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Settings className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            <div className="text-lg sm:text-xl font-bold tracking-tight select-none text-gray-900 dark:text-gray-900">ImmoCalc</div>
            
            {/* Scenario Badge mit farblicher Anzeige */}
            <div className="flex items-center gap-2">
              <Badge 
                className={`${currentScenario.bg} ${currentScenario.text} ${currentScenario.border} border-2 rounded-full px-3 py-1 font-semibold shadow-lg`}
              >
                {currentScenario.label}
              </Badge>
              {projectName && (
                <Badge variant="secondary" className="hidden sm:inline bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800 border-gray-300 dark:border-gray-400 rounded-full px-3 py-1">
                  {projectName}
                </Badge>
              )}
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
              className="text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10"
            >
              {dark ? <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> : <Moon className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
            {/* Live-Ticker Button mit animiertem grünen Blinklicht */}
            <Button
              variant="ghost"
              onClick={() => setShowLiveTicker(true)}
              className="gap-1 sm:gap-2 text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 relative px-2 sm:px-3"
            >
              <div className="relative">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                {/* Animiertes grünes Blinklicht */}
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-blink shadow-lg"></div>
              </div>
              <span className="hidden sm:inline text-xs sm:text-sm">Live-Ticker</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={onPrint}
              className="gap-1 sm:gap-2 text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 px-2 sm:px-3"
            >
              <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Drucken / PDF</span>
            </Button>
            <Button
              variant="ghost"
              className="gap-1 sm:gap-2 text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200 px-2 sm:px-3"
              onClick={onShowProjects}
            >
              <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Projekte</span>
            </Button>
            
            {/* Schließen-Button in der Navigation */}
            <Button
              variant="outline"
              size="icon"
              className="border border-gray-300 dark:border-gray-300 text-gray-700 dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-50 rounded-xl transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10"
              onClick={() => window.location.href = "/start"}
              aria-label="Kalkulationsprogramm schließen"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
    
          {/* Live-Ticker Popup */}
      {showLiveTicker && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setShowLiveTicker(false)}>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl mx-2 sm:mx-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                Live Marktanalyse
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLiveTicker(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)]">
              <LiveMarketTicker />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopBar;
