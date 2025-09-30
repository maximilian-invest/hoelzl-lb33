"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, BarChart3, PieChart, Upload, ClipboardList, Lock, AlertTriangle, ChevronLeft, ChevronRight, Hand } from "lucide-react";

export type TabType = "overview" | "market" | "exit-scenarios" | "detail-analysis" | "documents" | "complete-overview";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  progressPercentage: number;
  reinesVerkaufsszenario?: boolean;
  isProjectCompleted?: boolean;
  onLockedTabClick?: () => void;
  onProjectComplete?: () => void;
  onProjectUnlock?: () => void;
  onToggleSettings?: () => void;
  settingsOpen?: boolean;
}

export function TabNavigation({ 
  activeTab, 
  onTabChange, 
  progressPercentage, 
  reinesVerkaufsszenario = false,
  isProjectCompleted = false,
  onLockedTabClick,
  onProjectComplete,
  onProjectUnlock,
  onToggleSettings,
  settingsOpen = false
}: TabNavigationProps) {
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hintIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const allTabs = [
    {
      id: "overview" as TabType,
      label: "Grunddaten",
      icon: BarChart3,
    },
    {
      id: "detail-analysis" as TabType,
      label: "Detailanalyse",
      icon: PieChart,
    },
    {
      id: "exit-scenarios" as TabType,
      label: "Exit-Szenarien",
      icon: Calculator,
    },
    {
      id: "market" as TabType,
      label: "Marktvergleich",
      icon: TrendingUp,
    },
    {
      id: "documents" as TabType,
      label: "Dokumente & Fotos",
      icon: Upload,
    },
    {
      id: "complete-overview" as TabType,
      label: "Komplettübersicht",
      icon: ClipboardList,
    },
  ];

  // Filter tabs based on reines Verkaufsszenario
  const tabs = reinesVerkaufsszenario 
    ? allTabs.filter(tab => 
        ["overview", "exit-scenarios", "documents", "market", "complete-overview"].includes(tab.id)
      )
    : allTabs;

  // Check if a tab is locked (all tabs except complete-overview when project is completed)
  const isTabLocked = (tabId: TabType) => {
    return isProjectCompleted && tabId !== "complete-overview";
  };

  // Handle tab click with locking logic
  const handleTabClick = (tabId: TabType) => {
    if (isTabLocked(tabId)) {
      if (onLockedTabClick) {
        onLockedTabClick();
      }
      return;
    }
    
    onTabChange(tabId);
  };


  // Show swipe hint animation every 1 minute, only on mobile
  useEffect(() => {
    const showHint = () => {
      setShowSwipeHint(true);
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      hintTimeoutRef.current = setTimeout(() => {
        setShowSwipeHint(false);
      }, 3000); // Show for 3 seconds
    };

    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Show hint immediately on mobile devices
      showHint();
      
      // Set up interval to show hint every 1 minute (60000ms)
      hintIntervalRef.current = setInterval(showHint, 60000);
    }

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      if (hintIntervalRef.current) {
        clearInterval(hintIntervalRef.current);
      }
    };
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      if (hintIntervalRef.current) {
        clearInterval(hintIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`fixed left-0 right-0 z-30 w-full border-b border-gray-300/50 dark:border-gray-600/50 bg-black dark:bg-black ${
      isProjectCompleted ? 'top-0' : 'top-14 sm:top-16'
    }`}>
      {/* Swipe Hint Animation - Only on mobile */}
      {showSwipeHint && (
        <div className="absolute inset-0 pointer-events-none z-40 md:hidden">
          {/* Right side subtle hint with hand icon and wave effect */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {/* Wave effect background */}
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-blue-500/10 rounded-full animate-ping"></div>
            <div className="absolute -right-1 -top-1 w-12 h-12 bg-blue-500/20 rounded-full animate-pulse"></div>
            
            {/* Hand icon with subtle animation */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-3 shadow-lg border border-white/20 dark:border-gray-700/20">
              <Hand className="w-5 h-5 text-blue-500/70 animate-bounce" />
              
              {/* Subtle swipe indicator */}
              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-1 opacity-60">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between py-2">
          {/* Eingaben Button - ganz links */}
          <div className="flex items-center gap-1.5">
            {onToggleSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSettings}
                disabled={isProjectCompleted}
                className={`text-xs transition-all duration-200 ${
                  isProjectCompleted
                    ? "opacity-50 cursor-not-allowed text-gray-400 bg-gray-100"
                    : settingsOpen
                    ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                title={isProjectCompleted ? "Eingaben sind gesperrt - Projekt wurde abgeschlossen" : undefined}
              >
                <span className="text-xs font-medium">Voreinstellungen</span>
              </Button>
            )}
          </div>

          {/* Tabs - in der Mitte */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const locked = isTabLocked(tab.id);
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleTabClick(tab.id)}
                  disabled={locked}
                  className={`gap-1.5 transition-all duration-200 ${
                    locked
                      ? "opacity-50 cursor-not-allowed text-gray-400"
                      : activeTab === tab.id
                      ? "bg-white text-black shadow-md"
                      : "text-white hover:bg-gray-800 hover:text-white"
                  }`}
                  title={locked ? "Tab ist gesperrt - Projekt wurde abgeschlossen" : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Projekt Abschließen Button - ganz rechts */}
          <div className="flex items-center gap-1.5">
            {isProjectCompleted ? (
              <Button
                onClick={onLockedTabClick}
                variant="outline"
                size="sm"
                className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/30 text-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">Mit PIN entsperren</span>
              </Button>
            ) : (
              <Button
                onClick={onProjectComplete}
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">Sperren</span>
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
