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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg w-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 backdrop-blur-xl rounded-t-2xl w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-all duration-200 relative flex-1 min-w-0",
                "hover:bg-white/60 dark:hover:bg-gray-700/60",
                isActive
                  ? "text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm border-b-2 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-lg sm:rounded-xl transition-all duration-200",
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              )}>
                <Icon className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden xs:inline">{tab.title}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6 lg:p-8 min-h-[700px] max-w-none">
        <div className="max-w-7xl mx-auto">
          {activeTabContent}
        </div>
      </div>
    </div>
  );
}

export default SettingsTabs;
