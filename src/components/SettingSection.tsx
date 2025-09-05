import type { LucideIcon } from "lucide-react";
import React from "react";

interface SettingSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  fullscreen?: boolean;
}

export function SettingSection({ title, icon: Icon, children, fullscreen = false }: SettingSectionProps) {
  return (
    <details 
      className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700"
      open={fullscreen}
    >
      <summary className="flex cursor-pointer items-center gap-6 font-semibold text-gray-800 dark:text-gray-200 mb-8 list-none hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 group-hover:from-blue-100 dark:group-hover:from-blue-900/30 group-hover:to-blue-200 dark:group-hover:to-blue-800/30 transition-all duration-300">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-xl font-bold">{title}</span>
        <div className="ml-auto w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-all duration-300">
          <svg 
            className="w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform group-open:rotate-180 duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>
      <div className="space-y-8 pl-4 border-l-2 border-gray-100 dark:border-gray-800 ml-6">{children}</div>
    </details>
  );
}

export default SettingSection;
