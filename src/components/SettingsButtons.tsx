import React from "react";
import { Button } from "@/components/ui/button";

interface SettingsButtonsProps {
  onFinish: () => void;
}

export function SettingsButtons({
  onFinish
}: SettingsButtonsProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-3 justify-center">
        <Button 
          className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-200 hover:scale-105 shadow-lg"
          onClick={onFinish}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

export default SettingsButtons;
