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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto bg-gray-500/20 dark:bg-gray-400/20 backdrop-blur-xl rounded-t-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0",
                "hover:bg-gray-100/50 dark:hover:bg-gray-100/50",
                isActive
                  ? "text-gray-900 dark:text-gray-900 bg-gray-100/50 dark:bg-gray-100/50 border-b-2 border-gray-700 dark:border-gray-700"
                  : "text-gray-700 dark:text-gray-900 hover:text-gray-900 dark:hover:text-gray-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg transition-colors",
                isActive
                  ? "bg-gray-200 dark:bg-gray-200"
                  : "bg-gray-100 dark:bg-gray-100"
              )}>
                <Icon className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4",
                  isActive
                    ? "text-gray-700 dark:text-gray-700"
                    : "text-gray-600 dark:text-gray-600"
                )} />
              </div>
              <span className="hidden xs:inline">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6 min-h-[600px]">
        {activeTabContent}
      </div>
    </div>
  );
}

export default SettingsTabs;
