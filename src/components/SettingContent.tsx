import React from "react";

interface SettingContentProps {
  children: React.ReactNode;
}

export function SettingContent({ children }: SettingContentProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8">
        {children}
      </div>
    </div>
  );
}

export default SettingContent;
