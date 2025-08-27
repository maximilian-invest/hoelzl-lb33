"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Initialize theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", initial === "dark");
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center justify-center rounded-md border bg-background p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
