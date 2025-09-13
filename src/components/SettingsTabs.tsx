"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface SettingsTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function SettingsTabs({ tabs, defaultTab }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      {/* Tab Navigation - Fixed unter TopBar */}
      <div className="fixed top-14 left-0 right-0 z-40 flex justify-center border-b border-gray-200 dark:border-gray-800 bg-black backdrop-blur-xl w-full shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-all duration-200 relative min-w-0",
                "hover:bg-white/20",
                isActive
                  ? "text-white bg-white/20 shadow-sm border-b-2 border-blue-400"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all duration-200",
                isActive
                  ? "bg-blue-500 text-white"
                  : "bg-gray-600 text-gray-300"
              )}>
                <Icon className="h-3 w-3 sm:h-3 sm:w-3" />
              </div>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline">{tab.title}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content - Full Screen */}
      <div className="w-full h-screen pt-16 overflow-y-auto pb-20">
        {activeTabContent}
      </div>
    </div>
  );
}

export default SettingsTabs;
