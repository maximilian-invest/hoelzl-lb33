"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const total = 6;

  const percent = Math.round(((step + 1) / total) * 100);

  const next = () => setStep((s) => (s < (total - 1) ? ((s + 1) as Step) : s));
  const prev = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));

  const finish = () => {
    const emptyCfg = {
      adresse: "",
      stadtteil: "Riedenburg",
      bauart: "bestand",
      units: [] as Array<{ flaeche: number; miete: number }>,
      kaufpreis: 0,
      nebenkosten: 0,
      ekQuote: 0,
      tilgung: 0,
      laufzeit: 0,
      marktMiete: 0,
      wertSteigerung: 0,
    };
    const emptyFin = {
      darlehen: 0,
      zinssatz: 0,
      annuitaet: 0,
      bkM2: 0,
      bkWachstum: 0,
      einnahmenJ1: 0,
      einnahmenWachstum: 0,
      leerstand: 0,
      steuerRate: 0,
      afaRate: 0,
    };
    const cfgCases = { bear: emptyCfg, base: emptyCfg, bull: emptyCfg } as any;
    const finCases = { bear: emptyFin, base: emptyFin, bull: emptyFin } as any;
    localStorage.setItem("lb33_cfg_cases", JSON.stringify(cfgCases));
    localStorage.setItem("lb33_fin_cases", JSON.stringify(finCases));
    localStorage.setItem("lb33_images", JSON.stringify([]));
    localStorage.setItem("lb33_pdfs", JSON.stringify([]));
    localStorage.setItem("lb33_show_uploads", JSON.stringify(true));
    localStorage.setItem("lb33_texts", JSON.stringify({ title: "", subtitle: "", story: "", tipTitle: "", tipText: "", upsideTitle: "", upsideText: "" }));
    localStorage.setItem("lb33_current_project", "Neues Projekt");
    localStorage.setItem("lb33_autoload", "true");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight mb-4">Neues Projekt – Assistent</h1>

        {/* Fortschritt */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
          <div className="h-2 bg-indigo-600" style={{ width: `${percent}%` }} />
        </div>

        {/* Schritte */}
        {step === 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1) Basisdaten</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Gib Titel und Adresse ein.</p>
            <input className="w-full border rounded-md px-3 py-2" placeholder="Projekttitel" />
            <input className="w-full border rounded-md px-3 py-2" placeholder="Adresse" />
          </section>
        )}
        {step === 1 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2) Einheiten</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Füge m² und Mieten hinzu.</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded-md px-2 py-2" placeholder="m²" />
              <input className="border rounded-md px-2 py-2" placeholder="Miete €/m²" />
            </div>
            <Button variant="outline" size="sm">Weitere Einheit</Button>
          </section>
        )}
        {step === 2 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3) Finanzierung</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded-md px-2 py-2" placeholder="Kaufpreis (€)" />
              <input className="border rounded-md px-2 py-2" placeholder="EK‑Quote %" />
              <input className="border rounded-md px-2 py-2" placeholder="Tilgung %" />
              <input className="border rounded-md px-2 py-2" placeholder="Zins %" />
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4) Kosten & Einnahmen</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded-md px-2 py-2" placeholder="BK €/m²/Monat" />
              <input className="border rounded-md px-2 py-2" placeholder="Leerstand %" />
            </div>
          </section>
        )}
        {step === 4 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5) Marktannahmen</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded-md px-2 py-2" placeholder="Marktmiete €/m²" />
              <input className="border rounded-md px-2 py-2" placeholder="Wertsteigerung %" />
            </div>
          </section>
        )}
        {step === 5 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6) Upside‑Potenzial</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Optionale Szenarien (z. B. Umwidmung/Ausbau).</p>
            <textarea className="w-full border rounded-md px-3 py-2" rows={4} placeholder="Kurzbeschreibung" />
          </section>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0}>Zurück</Button>
          {step < (total - 1) ? (
            <Button onClick={next}>Weiter</Button>
          ) : (
            <Button onClick={finish}>Zur Kalkulation</Button>
          )}
        </div>
      </div>
    </main>
  );
}


