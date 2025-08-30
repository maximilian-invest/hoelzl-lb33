"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ProjectData = {
  cfgCases: any;
  finCases: any;
  images: any[];
  pdfs: any[];
  showUploads: boolean;
  texts: any;
};

export default function StartPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Record<string, ProjectData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lb33_projects");
      setProjects(raw ? JSON.parse(raw) : {});
    } catch {
      setProjects({});
    }
  }, []);

  const projectNames = useMemo(() => Object.keys(projects), [projects]);

  const newProject = () => {
    // leeres Projekt-Wizard starten
    router.push("/wizard");
  };

  const loadProject = (name: string) => {
    localStorage.setItem("lb33_current_project", name);
    localStorage.setItem("lb33_autoload", "true");
    router.push("/");
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as ProjectData;
        const name = `Import ${new Date().toLocaleString("de-AT")}`;
        const all = { ...projects, [name]: json };
        localStorage.setItem("lb33_projects", JSON.stringify(all));
        localStorage.setItem("lb33_current_project", name);
        localStorage.setItem("lb33_autoload", "true");
        router.push("/");
      } catch {
        alert("Ungültige Projektdatei");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">ImmoCalc</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Willkommen beim Immobilien-Kalkulationsprogramm!<br />
            Mit diesem Tool kannst du komplexe Immobilieninvestments analysieren, Projekte speichern, laden oder neue erstellen. <br />
            Alle Kalkulationen erfolgen auf Basis professioneller Standards.
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Neues Projekt</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Starte mit einer leeren Vorlage.</p>
            <Button onClick={newProject}>Neues Projekt</Button>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Projekt laden</h2>
            {projectNames.length ? (
              <ul className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
                {projectNames.map((n) => (
                  <li key={n} className="flex items-center justify-between">
                    <span className="truncate mr-2">{n}</span>
                    <Button size="sm" variant="outline" onClick={() => loadProject(n)}>Laden</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Keine gespeicherten Projekte gefunden.</p>
            )}
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Projekt hochladen</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Lade eine zuvor exportierte JSON‑Datei.</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={triggerUpload}>Projekt hochladen</Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


