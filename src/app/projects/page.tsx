"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lb33_projects");
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        setProjects(Object.keys(data));
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Projektübersicht</h1>
      <div className="space-y-2">
        {projects.length ? (
          <ul className="space-y-2">
            {projects.map((name) => (
              <li key={name} className="flex items-center justify-between">
                <span className="truncate mr-2">{name}</span>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/tool?project=${encodeURIComponent(name)}`)
                  }
                >
                  Öffnen
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keine Projekte gespeichert.
          </p>
        )}
      </div>
      <Button onClick={() => router.push("/tool?new")}>
        Neues Projekt
      </Button>
    </main>
  );
}
