import React from "react";

interface SettingContentProps {
  children: React.ReactNode;
  title?: string;
  headerRight?: React.ReactNode;
}

export function SettingContent({ children, title, headerRight }: SettingContentProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {headerRight}
          </div>
        </div>
      )}
      <div className="grid gap-4">
        {children}
      </div>
    </div>
  );
}

export default SettingContent;
