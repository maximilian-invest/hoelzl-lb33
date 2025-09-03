"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, BarChart3, PieChart, FileText } from "lucide-react";

export type TabType = "overview" | "market" | "exit-scenarios" | "detail-analysis" | "documents";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  progressPercentage: number;
}

export function TabNavigation({ activeTab, onTabChange, progressPercentage }: TabNavigationProps) {
  const tabs = [
    {
      id: "overview" as TabType,
      label: "Übersicht",
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
      icon: FileText,
    },
  ];

  return (
    <div className="fixed top-16 left-0 right-0 z-30 w-full border-b border-gray-300/50 dark:border-gray-600/50 bg-black dark:bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between py-2">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={`gap-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-black shadow-md"
                      : "text-white hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white text-sm">
              <span className="text-gray-300">% ausgefüllt</span>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2"
                />
                {/* Progress circle */}
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={progressPercentage >= 80 ? "#10b981" : progressPercentage >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="2"
                  strokeDasharray={`${progressPercentage}, 100`}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              {/* Percentage text in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {progressPercentage}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
