"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, BarChart3 } from "lucide-react";

export type TabType = "overview" | "market" | "exit-scenarios";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: "overview" as TabType,
      label: "Übersicht",
      icon: BarChart3,
    },
    {
      id: "market" as TabType,
      label: "Marktvergleich",
      icon: TrendingUp,
    },
    {
      id: "exit-scenarios" as TabType,
      label: "Exit-Szenarien",
      icon: Calculator,
    },
  ];

  return (
    <div className="fixed top-16 left-0 right-0 z-30 w-full border-b border-gray-300/50 dark:border-gray-600/50 bg-gray-500/20 dark:bg-gray-400/20 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-1 py-2">
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
                    ? "bg-gray-700 dark:bg-gray-600 text-white dark:text-white shadow-md"
                    : "text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
