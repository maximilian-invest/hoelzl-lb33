"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, BarChart3, PieChart, Upload, ClipboardList, Lock, CheckCircle, AlertTriangle } from "lucide-react";

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
}

export function TabNavigation({ 
  activeTab, 
  onTabChange, 
  progressPercentage, 
  reinesVerkaufsszenario = false,
  isProjectCompleted = false,
  onLockedTabClick,
  onProjectComplete,
  onProjectUnlock
}: TabNavigationProps) {
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
        ["exit-scenarios", "documents", "market", "complete-overview"].includes(tab.id)
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

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-30 w-full border-b border-gray-300/50 dark:border-gray-600/50 bg-black dark:bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between py-2">
          {/* Tabs */}
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

          {/* Projekt Abschließen Button */}
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
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">Projekt abschließen</span>
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
