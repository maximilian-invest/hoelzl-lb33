// import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Settings,
  Moon,
  Printer,
  Sun,
  X,
} from "lucide-react";
import React from "react";

interface TopBarProps {
  open: boolean;
  dark: boolean;
  onToggleSettings: () => void;
  onToggleDark: () => void;
  onPrint: () => void;
  onShowProjects: () => void;
  onCloseApp?: () => void;
  projectName?: string;
}

export function TopBar({
  open,
  dark,
  onToggleSettings,
  onToggleDark,
  onPrint,
  onShowProjects,
  onCloseApp: _,
  projectName,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-gray-200 dark:border-gray-300 bg-white/90 dark:bg-white/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSettings}
              className="text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200"
              aria-label="Einstellungen"
            >
              {open ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </Button>
            <div className="text-xl font-bold tracking-tight select-none text-gray-900 dark:text-gray-900">ImmoCalc</div>
            <Badge variant="secondary" className="hidden sm:inline bg-blue-50 dark:bg-blue-50 text-blue-700 dark:text-blue-700 border-blue-200 dark:border-blue-200 rounded-full px-3 py-1">
              {projectName || "—"}
            </Badge>
          </div>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
              className="text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              onClick={onPrint}
              className="gap-2 text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Drucken / PDF</span>
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-gray-700 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-xl transition-all duration-200"
              onClick={onShowProjects}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projekte</span>
            </Button>
          </nav>
          
          {/* Schließen-Button ganz rechts */}
          <Button
            variant="outline"
            className="gap-2 ml-4 border border-gray-300 dark:border-gray-300 text-gray-700 dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-50 rounded-xl transition-all duration-200"
            onClick={() => window.location.href = "/start"}
            aria-label="Kalkulationsprogramm schließen"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Schließen</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
