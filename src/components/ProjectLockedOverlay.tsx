"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface ProjectLockedOverlayProps {
  onUnlock: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function ProjectLockedOverlay({ 
  onUnlock, 
  title = "Projekt-Sperre aufheben um zu navigieren",
  description = "Das Projekt wurde abgeschlossen. Geben Sie den PIN ein, um wieder zu bearbeiten.",
  className = ""
}: ProjectLockedOverlayProps) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
        
        <Button
          onClick={onUnlock}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
        >
          Mit PIN entsperren
        </Button>
      </div>
    </div>
  );
}
