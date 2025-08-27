import type { LucideIcon } from "lucide-react";
import React from "react";

interface SettingSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function SettingSection({ title, icon: Icon, children }: SettingSectionProps) {
  return (
    <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
        <Icon className="h-4 w-4" />
        {title}
      </summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}

export default SettingSection;
