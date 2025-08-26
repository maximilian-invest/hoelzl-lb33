"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Hotel, Printer, Settings, X, Plus, ImagePlus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// --- Helpers ---
const fmtEUR = (n: number): string =>
  new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number): string => new Intl.NumberFormat("de-AT").format(n);

// ==== KONFIG: Standardwerte ==================================================
// Du kannst alles im UI anpassen (Button "Einstellungen").
// Änderungen werden in localStorage gespeichert und beim Laden übernommen.

type Unit = { flaeche: number; miete: number };

type ProjectImage = { src: string; caption: string; width: number; height: number };

type Assumptions = {
  adresse: string;
  units: Unit[];
  kaufpreis: number;
  nebenkosten: number;
  ekQuote: number;
  tilgung: number;
  laufzeit: number;
  marktMiete: number;
  wertSteigerung: number;
  inflation: number;
  avgPreisGnigl: number;
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  adresse: "Linzer Bundesstraße 33, 5020 Salzburg (Gnigl)",
  units: [{ flaeche: 700, miete: 15 }],
  kaufpreis: 2_800_000,
  nebenkosten: 0.1,
  ekQuote: 0.2,
  tilgung: 0.02,
  laufzeit: 30,
  marktMiete: 16,
  wertSteigerung: 0.02,
  inflation: 0.03,
  avgPreisGnigl: 5055,
};

// Cashflow/Finanzierungsmodell (aus Excel abgeleitet)
export type Finance = {
  darlehen: number;
  zinssatz: number;
  annuitaet: number; // jährlich
  bkFix: number; // nicht umlagefähige BK p.a.
  bkWachstum: number; // p.a.
  einnahmenJ1: number; // Einnahmen Jahr 1
  einnahmenWachstum: number; // p.a.
};

const SCENARIOS = ["bear", "base", "bull"] as const;
type Scenario = (typeof SCENARIOS)[number];

const defaultCfgCases: Record<Scenario, Assumptions> = {
  bear: { ...DEFAULT_ASSUMPTIONS, wertSteigerung: 0.01 },
  base: DEFAULT_ASSUMPTIONS,
  bull: { ...DEFAULT_ASSUMPTIONS, wertSteigerung: 0.03 },
};

const buildDefaultFinance = (cfg: Assumptions): Finance => {
  const darlehen = cfg.kaufpreis * (1 - cfg.ekQuote + cfg.nebenkosten);
  const zinssatz = 0.032;
  return {
    darlehen,
    zinssatz,
    annuitaet: darlehen * (zinssatz + cfg.tilgung),
    bkFix: 15_000,
    bkWachstum: 0.03,
    einnahmenJ1: cfg.units.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0),
    einnahmenWachstum: 0.03,
  };
};

const defaultFinCases: Record<Scenario, Finance> = {
  bear: buildDefaultFinance(defaultCfgCases.bear),
  base: buildDefaultFinance(defaultCfgCases.base),
  bull: buildDefaultFinance(defaultCfgCases.bull),
};

// Planberechnung (jährlich)
export type PlanRow = {
  jahr: number;
  zins: number;
  tilgung: number;
  annuitaet: number;
  restschuld: number;
  einnahmen: number;
  ausgaben: number;
  fcf: number;
};

function buildPlan(years: number, fin: Finance): PlanRow[] {
  let saldo = fin.darlehen;
  let einnahmen = fin.einnahmenJ1;
  let bk = fin.bkFix;
  const rows: PlanRow[] = [];
  for (let j = 1; j <= years; j++) {
    const zins = saldo * fin.zinssatz;
    const tilgung = Math.max(0, fin.annuitaet - zins);
    const ausgaben = fin.annuitaet + bk;
    const fcf = einnahmen - ausgaben;

    rows.push({
      jahr: j,
      zins,
      tilgung,
      annuitaet: fin.annuitaet,
      restschuld: saldo,
      einnahmen,
      ausgaben,
      fcf,
    });

    saldo = Math.max(0, saldo - tilgung);
    einnahmen = einnahmen * (1 + fin.einnahmenWachstum);
    bk = bk * (1 + fin.bkWachstum);
  }
  return rows;
}

// UI‑Snippets
type KeyProps = {
  label: string;
  value: string | number | React.ReactNode;
  sub?: string | React.ReactNode;
};

const Key: React.FC<KeyProps> = ({ label, value, sub }) => (
  <div className="flex flex-col">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-lg font-semibold">{value}</span>
    {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
  </div>
);

// kleine Input-Helfer
function NumField({
  label,
  value,
  step = 1,
  onChange,
  suffix,
  readOnly,
  placeholder,
}: {
  label: string;
  value: number;
  step?: number;
  suffix?: string;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  placeholder?: number | string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-md border px-2 py-1"
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange?.(Number(e.target.value))}
          readOnly={readOnly}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        {suffix ? <span className="text-slate-500 text-xs">{suffix}</span> : null}
      </div>
    </label>
  );
}

function HouseGraphic({ units }: { units: Unit[] }) {
  const floors: Unit[][] = [];
  for (let i = 0; i < units.length; i += 2) {
    floors.push(units.slice(i, i + 2));
  }
  return (
    <div className="flex flex-col items-center transition-all">
      <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[20px] border-b-slate-600 border-l-transparent border-r-transparent" />
      {floors
        .slice()
        .reverse()
        .map((floor, idx) => (
          <div key={idx} className="flex">
            {floor.map((u, i) => (
              <div
                key={i}
                className="w-20 h-16 border border-slate-400 bg-white flex items-center justify-center text-xs font-medium"
              >
                {u.flaeche} m²
              </div>
            ))}
            {floor.length === 1 && <div className="w-20 h-16 border border-slate-200 bg-slate-50" />}
          </div>
        ))}
    </div>
  );
}

export default function InvestmentCaseLB33() {
  // === State: Konfiguration ===
  const [scenario, setScenario] = useState<Scenario>("base");
  const [cfgCases, setCfgCases] = useState<Record<Scenario, Assumptions>>(() => {
    try {
      const raw = localStorage.getItem("lb33_cfg_cases");
      if (!raw) return defaultCfgCases;
      const parsed = JSON.parse(raw);
      return {
        bear: { ...defaultCfgCases.bear, ...(parsed.bear ?? {}) },
        base: { ...defaultCfgCases.base, ...(parsed.base ?? {}) },
        bull: { ...defaultCfgCases.bull, ...(parsed.bull ?? {}) },
      };
    } catch {
      return defaultCfgCases;
    }
  });

  const [finCases, setFinCases] = useState<Record<Scenario, Finance>>(() => {
    try {
      const raw = localStorage.getItem("lb33_fin_cases");
      return raw ? { ...defaultFinCases, ...JSON.parse(raw) } : defaultFinCases;
    } catch {
      return defaultFinCases;
    }
  });

  const [images, setImages] = useState<ProjectImage[]>(() => {
    try {
      const raw = localStorage.getItem("lb33_images");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cfg = cfgCases[scenario];
  const fin = finCases[scenario];

  const setCfg = (c: Assumptions) =>
    setCfgCases((prev) => ({ ...prev, [scenario]: c }));
  const setFin = (f: Finance) =>
    setFinCases((prev) => ({ ...prev, [scenario]: f }));

  useEffect(() => {
    localStorage.setItem("lb33_cfg_cases", JSON.stringify(cfgCases));
  }, [cfgCases]);
  useEffect(() => {
    localStorage.setItem("lb33_fin_cases", JSON.stringify(finCases));
  }, [finCases]);

  useEffect(() => {
    localStorage.setItem("lb33_images", JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    const nk = cfg.kaufpreis * cfg.nebenkosten;
    const darlehen = cfg.kaufpreis * (1 - cfg.ekQuote) + nk;
    const annuitaet = darlehen * (fin.zinssatz + cfg.tilgung);
    setFinCases((prev) => {
      const cur = prev[scenario];
      if (cur.darlehen === darlehen && cur.annuitaet === annuitaet) return prev;
      return { ...prev, [scenario]: { ...cur, darlehen, annuitaet } };
    });
  }, [cfg.kaufpreis, cfg.nebenkosten, cfg.ekQuote, cfg.tilgung, fin.zinssatz, scenario]);

  useEffect(() => {
    const einnahmen = cfg.units.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0);
    setFinCases((prev) => {
      const cur = prev[scenario];
      if (cur.einnahmenJ1 === einnahmen) return prev;
      return { ...prev, [scenario]: { ...cur, einnahmenJ1: einnahmen } };
    });
  }, [cfg.units, scenario]);

  // === Derived ===
  const PLAN_30Y = useMemo(() => buildPlan(30, fin), [fin]);
  const PLAN_15Y = useMemo(() => PLAN_30Y.slice(0, 15), [PLAN_30Y]);

  const cfPosAb = useMemo(() => {
    const idx = PLAN_30Y.findIndex((r) => r.fcf > 0);
    return idx >= 0 ? idx + 1 : 0;
  }, [PLAN_30Y]);

  const YEARS_15 = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 1), []);

  const totalFlaeche = useMemo(
    () => cfg.units.reduce((sum, u) => sum + u.flaeche, 0),
    [cfg.units]
  );
  const avgMiete = useMemo(
    () =>
      totalFlaeche
        ? cfg.units.reduce((sum, u) => sum + u.flaeche * u.miete, 0) / totalFlaeche
        : 0,
    [cfg.units, totalFlaeche]
  );

  const chartData = useMemo(
    () =>
      YEARS_15.map((y, idx) => ({
        Jahr: y,
        Restschuld: PLAN_15Y[idx].restschuld,
        Immobilienwert: cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, y - 1),
        FCF: PLAN_15Y[idx].fcf,
      })),
    [YEARS_15, PLAN_15Y, cfg.kaufpreis, cfg.wertSteigerung]
  );

  const startEK = useMemo(
    () => cfg.kaufpreis * cfg.ekQuote,
    [cfg.kaufpreis, cfg.ekQuote]
  );
  const equityAt = useMemo(
    () =>
      (years: number) => {
        const rest = PLAN_30Y[years]?.restschuld ?? 0;
        const wert = cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, years);
        return wert - rest;
      },
    [PLAN_30Y, cfg.kaufpreis, cfg.wertSteigerung]
  );

  const PLAN_15Y_CASES = useMemo(() => {
    return {
      bear: buildPlan(15, finCases.bear),
      base: buildPlan(15, finCases.base),
      bull: buildPlan(15, finCases.bull),
    } as Record<Scenario, PlanRow[]>;
  }, [finCases]);

  const compareFcfData = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        Jahr: i + 1,
        Bear: PLAN_15Y_CASES.bear[i].fcf,
        Base: PLAN_15Y_CASES.base[i].fcf,
        Bull: PLAN_15Y_CASES.bull[i].fcf,
      })),
    [PLAN_15Y_CASES]
  );

  const compareEquityData = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        Jahr: i + 1,
        Bear:
          cfgCases.bear.kaufpreis * Math.pow(1 + cfgCases.bear.wertSteigerung, i + 1) -
          PLAN_15Y_CASES.bear[i].restschuld,
        Base:
          cfgCases.base.kaufpreis * Math.pow(1 + cfgCases.base.wertSteigerung, i + 1) -
          PLAN_15Y_CASES.base[i].restschuld,
        Bull:
          cfgCases.bull.kaufpreis * Math.pow(1 + cfgCases.bull.wertSteigerung, i + 1) -
          PLAN_15Y_CASES.bull[i].restschuld,
      })),
    [PLAN_15Y_CASES, cfgCases]
  );

  const compareEquityZuwachsData = useMemo(() => {
    return SCENARIOS.map((s) => {
      const start = cfgCases[s].kaufpreis * cfgCases[s].ekQuote;
      const plan = PLAN_15Y_CASES[s];
      const eq5 = cfgCases[s].kaufpreis * Math.pow(1 + cfgCases[s].wertSteigerung, 5) - plan[4].restschuld;
      const eq10 = cfgCases[s].kaufpreis * Math.pow(1 + cfgCases[s].wertSteigerung, 10) - plan[9].restschuld;
      const eq15 = cfgCases[s].kaufpreis * Math.pow(1 + cfgCases[s].wertSteigerung, 15) - plan[14].restschuld;
      return {
        Scenario: s.charAt(0).toUpperCase() + s.slice(1),
        eq5,
        zuw5: eq5 - start,
        eq10,
        zuw10: eq10 - start,
        eq15,
        zuw15: eq15 - start,
      };
    });
  }, [cfgCases, PLAN_15Y_CASES]);

  const kaufpreisProM2 = cfg.kaufpreis / totalFlaeche;
  const vermoegensZuwachs10y = equityAt(10) - startEK;

  const addUnit = () =>
    setCfg({ ...cfg, units: [...cfg.units, { flaeche: 0, miete: avgMiete }] });
  const updateUnit = (idx: number, u: Unit) =>
    setCfg({ ...cfg, units: cfg.units.map((unit, i) => (i === idx ? u : unit)) });
  const removeUnit = (idx: number) =>
    setCfg({ ...cfg, units: cfg.units.filter((_, i) => i !== idx) });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        setImages((prev) => [...prev, { src, caption: "", width: img.width, height: img.height }]);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateImageCaption = (idx: number, caption: string) =>
    setImages((prev) => prev.map((img, i) => (i === idx ? { ...img, caption } : img)));

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  // === UI: Einstellungs-Panel ===
  const [open, setOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const saveProject = () => {
    localStorage.setItem("lb33_cfg_cases", JSON.stringify(cfgCases));
    localStorage.setItem("lb33_fin_cases", JSON.stringify(finCases));
    localStorage.setItem("lb33_images", JSON.stringify(images));
    alert("Gespeichert");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* Einstellungs-Panel */}
      {open && (
        <div className="fixed right-4 top-16 z-50 w-[420px] max-w-[95vw] rounded-2xl border bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">
              Einstellungen – {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case
            </div>
            <button aria-label="close" onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Einheiten */}
            <details className="border rounded-md p-2">
              <summary className="cursor-pointer font-bold text-slate-600">Einheiten</summary>
              <div className="mt-2 space-y-2">
                <Button variant="outline" size="sm" onClick={addUnit} className="gap-1">
                  <Plus className="w-4 h-4" /> Einheit
                </Button>
                {cfg.units.map((u, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                    <NumField label="m²" value={u.flaeche} onChange={(n) => updateUnit(idx, { ...u, flaeche: n })} />
                    <NumField label="Miete €/m²" value={u.miete} step={0.5} onChange={(n) => updateUnit(idx, { ...u, miete: n })} />
                    <Button variant="ghost" size="icon" onClick={() => removeUnit(idx)} className="mb-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </details>

            {/* Finanzierung */}
            <details className="border rounded-md p-2">
              <summary className="cursor-pointer font-bold text-slate-600">Finanzierung</summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumField label="Kaufpreis (€)" value={cfg.kaufpreis} step={1000} onChange={(n) => setCfg({ ...cfg, kaufpreis: n })} />
                <NumField
                  label="Nebenkosten %"
                  value={cfg.nebenkosten * 100}
                  step={0.1}
                  onChange={(n) => setCfg({ ...cfg, nebenkosten: n / 100 })}
                  suffix="%"
                  placeholder={10}
                />
                <NumField label="EK-Quote %" value={cfg.ekQuote * 100} step={1} onChange={(n) => setCfg({ ...cfg, ekQuote: n / 100 })} suffix="%" />
                <NumField label="Tilgung %" value={cfg.tilgung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, tilgung: n / 100 })} suffix="%" />
                <NumField label="Laufzeit (J)" value={cfg.laufzeit} onChange={(n) => setCfg({ ...cfg, laufzeit: n })} />
                <NumField label="Zins (Darlehen) %" value={fin.zinssatz * 100} step={0.1} onChange={(n) => setFin({ ...fin, zinssatz: n / 100 })} suffix="%" />
                <NumField label="Darlehen (€)" value={fin.darlehen} readOnly />
                <NumField label="Annuität (€ p.a.)" value={fin.annuitaet} readOnly />
              </div>
            </details>

            {/* Kosten & Einnahmen */}
            <details className="border rounded-md p-2">
              <summary className="cursor-pointer font-bold text-slate-600">Kosten & Einnahmen</summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumField label="BK fix (€ p.a.)" value={fin.bkFix} step={500} onChange={(n) => setFin({ ...fin, bkFix: n })} />
                <NumField label="BK-Steigerung %" value={fin.bkWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, bkWachstum: n / 100 })} suffix="%" />
                <NumField label="Einnahmen J1 (€)" value={fin.einnahmenJ1} readOnly />
                <NumField label="Einnahmen-Wachstum %" value={fin.einnahmenWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, einnahmenWachstum: n / 100 })} suffix="%" />
              </div>
            </details>

            {/* Marktannahmen */}
            <details className="border rounded-md p-2">
              <summary className="cursor-pointer font-bold text-slate-600">Marktannahmen</summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumField label="Marktmiete (€/m²)" value={cfg.marktMiete} step={0.5} onChange={(n) => setCfg({ ...cfg, marktMiete: n })} />
                <NumField label="Wertsteigerung %" value={cfg.wertSteigerung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, wertSteigerung: n / 100 })} suffix="%" />
                <NumField label="Inflation %" value={cfg.inflation * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, inflation: n / 100 })} suffix="%" />
                <NumField label="Ø Preis Gnigl (€/m²)" value={cfg.avgPreisGnigl} step={10} onChange={(n) => setCfg({ ...cfg, avgPreisGnigl: n })} />
              </div>
            </details>

            {/* Objektbilder */}
            <details className="border rounded-md p-2">
              <summary className="cursor-pointer font-bold text-slate-600">Objektbilder</summary>
              <div className="mt-2 space-y-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
                  <ImagePlus className="w-4 h-4" /> Bild
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Image
                      src={img.src}
                      alt={img.caption || `Bild ${idx + 1}`}
                      width={60}
                      height={60}
                      className="rounded object-cover"
                      unoptimized
                    />
                    <input
                      className="flex-1 rounded-md border px-2 py-1 text-sm"
                      type="text"
                      value={img.caption}
                      placeholder="Bildunterschrift"
                      onChange={(e) => updateImageCaption(idx, e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeImage(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </details>

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={saveProject}>Speichern</Button>
              <Button onClick={() => setOpen(false)}>Fertig</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header mit Szenario-Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Hölzl Investments Logo" width={32} height={32} />
              <Badge variant="secondary" className="hidden sm:inline">LB33</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Drucken / PDF</Button>
              <Button variant="outline" className="gap-2" onClick={() => setOpen((v) => !v)}><Settings className="w-4 h-4" /> Einstellungen</Button>
            </div>
          </div>
          <nav className="flex gap-2 pb-2 overflow-x-auto">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-1 rounded-md border text-sm ${
                  scenario === s ? "bg-slate-200 font-semibold" : "bg-white hover:bg-slate-100"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-start gap-6">
          <HouseGraphic units={cfg.units} />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Investment Case – {cfg.adresse}</h1>
            <p className="mt-2 text-slate-600 max-w-3xl">
              Zinshaus in zentraler Lage (Gnigl) mit zwei Gewerbeeinheiten im EG und drei Wohnungen in den oberen Geschossen – ergänzt durch Kellerflächen. Konservativer, banktauglicher Case mit
              Upside durch mögliche Umwidmung in ein Hotel.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{totalFlaeche} m² gesamt</Badge>
              <Badge variant="secondary">{fmtEUR(cfg.kaufpreis)} Kaufpreis</Badge>
              <Badge variant="secondary">{fmt(Math.round(kaufpreisProM2))} €/m² Kaufpreis</Badge>
              <Badge variant="secondary">Ø Lagepreis Gnigl: {fmt(cfg.avgPreisGnigl)} €/m²</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cashflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key label="Positiv ab Jahr" value={cfPosAb ? `ab Jahr ${cfPosAb}` : "–"} sub="konservativ gerechnet" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vermögenszuwachs (10 J.)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key label="Konservatives Szenario" value={fmtEUR(vermoegensZuwachs10y)} sub="Tilgung + Wertsteigerung + Miete" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Konservative Miete</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key label="Unterstellt (ORS)" value={`${fmt(avgMiete)} €/m² netto kalt`} sub="100% Auslastung, kein Leerstandsrisiko" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Marktmiete Salzburg</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key label="Konservativ" value={`${cfg.marktMiete} €/m²`} sub="tatsächlich häufig darüber" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Textblöcke */}
      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Investment Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              Die Liegenschaft befindet sich in zbentraler Stadtlage von Salzburg-Gnigl. Im Erdgeschoß sind zwei Gewerbeeinheiten situiert, darüber in drei Obergeschoßen drei Wohnungen; Kellerflächen runden das
              Angebot ab. Insgesamt stehen knapp {totalFlaeche} m² Nutzfläche zur Verfügung.
            </p>
            <p>
              Die Kalkulation wurde konservativ angesetzt und vom Steuerberater verifiziert. Bei einer Nettokaltmiete von nur {fmt(avgMiete)} €/m² – und damit unter dem salzburger Marktniveau – wird ab dem {cfPosAb || "–"}.
              Jahr ein positiver Cashflow erzielt. Grundlage ist eine Finanzierung mit {Math.round(cfg.ekQuote * 100)} % Eigenkapital, {Math.round(fin.zinssatz * 1000) / 10}% Zinsen, {Math.round(cfg.tilgung * 100)} % Tilgung
              und {cfg.laufzeit} Jahren Laufzeit sowie Annahmen von {Math.round(fin.einnahmenWachstum * 100)}% Einnahmenwachstum, {Math.round(cfg.wertSteigerung * 100)}% Wertsteigerung und {Math.round(cfg.inflation * 100)}% Inflation p.a.
            </p>
            <p>
              Im Zehnjahreszeitraum ergibt sich ein konservativer Vermögenszuwachs von {fmtEUR(vermoegensZuwachs10y)} (Equity‑Aufbau aus laufenden Überschüssen, Tilgung und Wertsteigerung). Der Einstiegspreis liegt mit {fmt(Math.round(kaufpreisProM2))} €/m² deutlich unter dem
              durchschnittlichen Lagepreis von {fmt(cfg.avgPreisGnigl)} €/m².
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Vermietung (Konservativ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Unterstellt wird eine Vollvermietung an <b>ORS</b> mit {fmt(avgMiete)} €/m² netto kalt. Damit wird eine <b>100% Auslastung ohne Leerstandsrisiko</b> angenommen – bewusst konservativ
              unter der marktüblichen Miete von {cfg.marktMiete} €/m² in Salzburg.
            </p>
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-emerald-900">
              Stabiler Basiscase – die tatsächlichen Erträge sind voraussichtlich höher.
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <section className="max-w-6xl mx-auto px-6 mt-6 grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>FCF-Entwicklung (Jahr 1–15)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fcf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={80} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Area type="monotone" dataKey="FCF" name="Freier Cashflow" stroke="#06b6d4" fill="url(#fcf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Positiver Cashflow ab Jahr {cfPosAb || "–"} (Einnahmen-Wachstum {Math.round(fin.einnahmenWachstum * 100)}% p.a., Annuität {fmtEUR(fin.annuitaet)}, BK {fmtEUR(fin.bkFix)} p.a.).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restschuld vs. Immobilienwert (konservativ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={80} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Line type="monotone" dataKey="Restschuld" stroke="#4338ca" name="Restschuld" strokeWidth={2} />
                  <Line type="monotone" dataKey="Immobilienwert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Wertsteigerung aktuell {Math.round(cfg.wertSteigerung * 100)}% p.a. auf Kaufpreis unterstellt.</p>
          </CardContent>
        </Card>
      </section>

      {/* Gegenüberstellung 5 / 10 / 15 Jahre */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        {(() => {
          const points = [5, 10, 15] as const;
          const rows = points.map((p) => ({
            Periode: `${p} J.`,
            Equity: equityAt(p),
            Zuwachs: equityAt(p) - startEK,
            Restschuld: PLAN_30Y[p - 1].restschuld,
            Wertzuwachs: cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, p) - cfg.kaufpreis,
          }));

          return (
            <Card>
              <CardHeader>
                <CardTitle>5 / 10 / 15 Jahre – Equity & Zuwachs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rows} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Periode" />
                      <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={90} />
                      <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                      <Legend />
                      <Line type="monotone" dataKey="Equity" name="Gesamtvermögen Immobilie" stroke="#0ea5e9" strokeWidth={2} />
                      <Line type="monotone" dataKey="Zuwachs" name="Gesamtvermögenszuwachs" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Definition wie im Excel: Equity = Marktwert − Restschuld, Zuwachs = Equity − Start‑EK ({fmtEUR(startEK)}).</p>
              </CardContent>
            </Card>
          );
        })()}
      </section>

      {/* Vergleichsdaten Bear/Base/Bull */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Button variant="outline" onClick={() => setShowCompare((v) => !v)}>
          {showCompare ? "Vergleichsdaten ausblenden" : "Vergleichsdaten einblenden"}
        </Button>
        {showCompare && (
          <>
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>FCF Vergleich</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compareFcfData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Jahr" />
                        <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={80} />
                        <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                        <Legend />
                        <Line type="monotone" dataKey="Bear" stroke="#dc2626" />
                        <Line type="monotone" dataKey="Base" stroke="#2563eb" />
                        <Line type="monotone" dataKey="Bull" stroke="#16a34a" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Equity Vergleich</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compareEquityData} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Jahr" />
                        <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={80} />
                        <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                        <Legend />
                        <Line type="monotone" dataKey="Bear" stroke="#dc2626" />
                        <Line type="monotone" dataKey="Base" stroke="#2563eb" />
                        <Line type="monotone" dataKey="Bull" stroke="#16a34a" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
              </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Szenario</th>
                        <th className="py-2 pr-3">Equity 5J</th>
                        <th className="py-2 pr-3">Zuwachs 5J</th>
                        <th className="py-2 pr-3">Equity 10J</th>
                        <th className="py-2 pr-3">Zuwachs 10J</th>
                        <th className="py-2 pr-3">Equity 15J</th>
                        <th className="py-2 pr-3">Zuwachs 15J</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareEquityZuwachsData.map((r) => (
                        <tr key={r.Scenario} className="border-t">
                          <td className="py-1 pr-3">{r.Scenario}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.eq5)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.zuw5)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.eq10)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.zuw10)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.eq15)}</td>
                          <td className="py-1 pr-3">{fmtEUR(r.zuw15)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Cashflow Vergleich (Jahre 1–15)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Jahr</th>
                        <th className="py-2 pr-3">Bear</th>
                        <th className="py-2 pr-3">Base</th>
                        <th className="py-2 pr-3">Bull</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareFcfData.map((r) => (
                        <tr key={r.Jahr} className="border-t">
                          <td className="py-1 pr-3">{r.Jahr}</td>
                          <td className={`py-1 pr-3 ${r.Bear > 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtEUR(r.Bear)}</td>
                          <td className={`py-1 pr-3 ${r.Base > 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtEUR(r.Base)}</td>
                          <td className={`py-1 pr-3 ${r.Bull > 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtEUR(r.Bull)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      {/* Cashflow‑Detail (Jahre 1–15) */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Cashflow‑Detail (Auszug Jahre 1–15)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Jahr</th>
                    <th className="py-2 pr-3">Zinsen</th>
                    <th className="py-2 pr-3">Tilgung</th>
                    <th className="py-2 pr-3">Annuität</th>
                    <th className="py-2 pr-3">Restschuld</th>
                    <th className="py-2 pr-3">Einnahmen</th>
                    <th className="py-2 pr-3">Ausgaben</th>
                    <th className="py-2 pr-3">FCF</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_15Y.map((r) => (
                    <tr key={r.jahr} className="border-t">
                      <td className="py-1 pr-3">{r.jahr}</td>
                      <td className="py-1 pr-3">{fmtEUR(r.zins)}</td>
                      <td className="py-1 pr-3">{fmtEUR(r.tilgung)}</td>
                      <td className="py-1 pr-3">{fmtEUR(r.annuitaet)}</td>
                      <td className="py-1 pr-3">{fmtEUR(r.restschuld)}</td>
                      <td className="py-1 pr-3">{fmtEUR(r.einnahmen)}</td>
                      <td className="py-1 pr-3">{fmtEUR(r.ausgaben)}</td>
                      <td className={`py-1 pr-3 font-medium ${r.fcf > 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtEUR(r.fcf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Annuität {fmtEUR(fin.annuitaet)} p.a. | BK {fmtEUR(fin.bkFix)} p.a. | Einnahmen starten bei {fmtEUR(fin.einnahmenJ1)} und wachsen mit {Math.round(fin.einnahmenWachstum * 100)}% p.a.</p>
          </CardContent>
        </Card>
      </section>

      {/* Upside */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5" /> Upside: mögliche Umwidmung zum Hotel</CardTitle>
          </CardHeader>
          <CardContent className="leading-relaxed text-sm md:text-base">
            In Vorgesprächen wurden für die Umwidmung in einen Hotelbetrieb bereits <b>mündlich positive Signale</b> durch anwaltliche Prüfinstanzen kommuniziert. Nach aktueller Einschätzung lassen Flächenwidmung
            und Rechtslage (inkl. ROG) die Umnutzung voraussichtlich problemlos zu. Dies eröffnet signifikant höhere laufende Erträge und eine spürbare Steigerung des Objektwerts.
            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-2 text-indigo-900">
              <TrendingUp className="w-4 h-4" />
              <span>Upside-Perspektive mit deutlich höherem Cashflow gegenüber Zinshaus-Basiscase</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Marktvergleich Salzburg (Auszug) */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Marktvergleich Salzburg (Auszug)</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p>Aus deinem Spreadsheet (Ø‑Preis Bestand, €/m²):</p>
              <ul className="list-disc pl-5 grid grid-cols-2 md:grid-cols-2 gap-x-6">
                {[
                  { ort: "Riedenburg", preis: 6727 },
                  { ort: "Mülln", preis: 6662 },
                  { ort: "Gneis/Gois", preis: 6650 },
                  { ort: "Leopoldskron", preis: 6502 },
                  { ort: "Innere Stadt", preis: 6485 },
                  { ort: "Maxglan", preis: 5162 },
                  { ort: "Gnigl", preis: cfg.avgPreisGnigl },
                  { ort: "Hallwang 2", preis: 5044 },
                ].map((r) => (
                  <li key={r.ort} className="flex items-center justify-between border-b py-1">
                    <span>{r.ort}</span>
                    <span className={`font-medium ${r.ort === "Gnigl" ? "text-indigo-600" : ""}`}>{fmt(r.preis)} €/m²</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border">
              <p className="mb-2">Unser Einstiegspreis (kaufpreis / m²):</p>
              <div className="text-2xl font-semibold">{fmt(Math.round(cfg.kaufpreis / totalFlaeche))} €/m²</div>
              <p className="text-xs text-muted-foreground mt-2">
                Im Direktvergleich liegt der Einstieg unter dem Ø‑Preis für <b>Gnigl ({fmt(cfg.avgPreisGnigl)} €/m²)</b> und deutlich unter vielen Stadtlagen.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Objektbilder */}
      {images.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Objektbilder</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <figure key={idx}>
                <Image
                  src={img.src}
                  alt={img.caption || `Bild ${idx + 1}`}
                  width={img.width}
                  height={img.height}
                  className="rounded-md object-cover w-full h-auto"
                  unoptimized
                />
                {img.caption && (
                  <figcaption className="text-sm text-center mt-1 text-slate-600">{img.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <section className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          * Alle Angaben ohne Gewähr, konservative Annahmen; Zahlen teils gerundet. Bank- & steuerberatertaugliche Detailunterlagen auf Anfrage.
        </div>
      </section>
    </div>
  );
}
