import React from "react";

interface SettingContentProps {
  children: React.ReactNode;
}

export function SettingContent({ children }: SettingContentProps) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}

export default SettingContent;
