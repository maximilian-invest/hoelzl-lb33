import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Menu,
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
}

export function TopBar({
  open,
  dark,
  onToggleSettings,
  onToggleDark,
  onPrint,
  onShowProjects,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSettings}
              className="text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Einstellungen"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="relative w-40 h-30 shrink-0">
              <Image
                src="/logo.png"
                alt="Hölzl Investments Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <Badge variant="secondary" className="hidden sm:inline">
              LB33
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDark}
              className="text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              onClick={onPrint}
              className="gap-2 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Drucken / PDF</span>
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onShowProjects}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projekte</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
