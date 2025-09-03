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
      className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700"
      open={fullscreen}
    >
      <summary className="flex cursor-pointer items-center gap-6 font-semibold text-gray-700 dark:text-gray-200 mb-6 list-none hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <span className="text-lg">{title}</span>
        <div className="ml-auto w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
          <svg 
            className="w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform group-open:rotate-180" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>
      <div className="space-y-6 pl-16">{children}</div>
    </details>
  );
}

export default SettingSection;
