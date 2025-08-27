"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type StoredProject = {
  updatedAt: string;
};

export default function ProjectOverview() {
  const router = useRouter();
  const [projects, setProjects] = useState<Record<string, StoredProject>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lb33_projects");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, StoredProject>;
        setProjects(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const openProject = (name: string) => {
    router.push(`/editor?name=${encodeURIComponent(name)}`);
  };

  const newProject = () => {
    localStorage.removeItem("lb33_current_project");
    router.push("/editor");
  };

  const deleteProject = (name: string) => {
    if (!confirm("Projekt löschen?")) return;
    setProjects((prev) => {
      const copy = { ...prev };
      delete copy[name];
      localStorage.setItem("lb33_projects", JSON.stringify(copy));
      return copy;
    });
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projekte</h1>
        <Button onClick={newProject}>Neues Projekt</Button>
      </header>
      {Object.keys(projects).length ? (
        <ul className="divide-y">
          {Object.entries(projects).map(([name, data]) => (
            <li key={name} className="flex items-center justify-between py-2">
              <div className="flex-1 mr-4">
                <div className="font-medium truncate">{name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(data.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openProject(name)}>
                  Öffnen
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteProject(name)}>
                  Löschen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Keine Projekte gespeichert.</p>
      )}
    </main>
  );
}
