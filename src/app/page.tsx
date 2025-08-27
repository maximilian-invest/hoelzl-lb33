"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  type SetStateAction,
} from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Hotel,
  Printer,
  Menu,
  X,
  Plus,
  ImagePlus,
  FilePlus,
  FileDown,
  FileText,
  Sun,
  Moon,
  Pencil,
  RotateCcw,
  FolderOpen,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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
type ProjectPdf = { src: string; name: string };

type TextBlocks = {
  title: string;
  subtitle: string;
  story: string;
  tipTitle: string;
  tipText: string;
  upsideTitle: string;
  upsideText: string;
};

const REQUIRED_DOCS = [
  {
    key: "bk",
    label: "BK Abrechnung",
    keywords: ["bk", "betriebskosten"],
  },
  {
    key: "eigentuemer",
    label: "Eigentümerabrechnung",
    keywords: ["eig", "eigentümer"],
  },
  {
    key: "nutzwert",
    label: "Nutzwertliste",
    keywords: ["nutzwert"],
  },
  {
    key: "plaene",
    label: "Pläne",
    keywords: ["plan", "grundriss"],
  },
] as const;

const DISTRICT_PRICES = {
  bestand: [
    { ort: "Riedenburg", preis: 6727, max: 12195 },
    { ort: "Mülln", preis: 6662 },
    { ort: "Gois", preis: 6650, max: 6800 },
    { ort: "Leopoldskron", preis: 6502, max: 7222 },
    { ort: "Innere Stadt", preis: 6485, max: 8077 },
    { ort: "Nonntal", preis: 5919, max: 9931 },
    { ort: "Anif", preis: 5688, max: 9882 },
    { ort: "Elsbethen", preis: 5498, max: 6205 },
    { ort: "Aigen 2", preis: 5442, max: 7949 },
    { ort: "Aigen 1", preis: 5407, max: 14281 },
    { ort: "Morzg", preis: 5387, max: 14983 },
    { ort: "Siezenheim 1", preis: 5359, max: 6636 },
    { ort: "Liefering 2", preis: 5280, max: 9456 },
    { ort: "Maxglan", preis: 5162, max: 12057 },
    { ort: "Gnigl", preis: 5055, max: 8702 },
    { ort: "Hallwang 2", preis: 5044, max: 6082 },
    { ort: "Schallmoos", preis: 5029, max: 9156 },
    { ort: "Äußerer Stein", preis: 4938, max: 12129 },
    { ort: "Wals 1", preis: 4895, max: 7091 },
    { ort: "Hallwang 1", preis: 4669, max: 6307 },
    { ort: "Elixhausen", preis: 4579, max: 6125 },
    { ort: "Glanegg", preis: 4539, max: 6673 },
    { ort: "Itzling", preis: 4539, max: 7059 },
    { ort: "Elisabeth-Vorstadt", preis: 4474, max: 8824 },
    { ort: "Lehen", preis: 4196, max: 8388 },
    { ort: "Grödig", preis: 4099, max: 6633 },
    { ort: "Siezenheim 2", preis: 4073, max: 5812 },
    { ort: "Großgmain", preis: 3870, max: 4404 },
    { ort: "Wals 2", preis: 3294, max: 3294 },
  ],
  neubau: [
    { ort: "Innere Stadt", preis: 16023, max: 18345 },
    { ort: "Äußerer Stein", preis: 14555, max: 16176 },
    { ort: "Nonntal", preis: 12303, max: 15012 },
    { ort: "Maxglan", preis: 10673, max: 15767 },
    { ort: "Anif", preis: 10328, max: 11302 },
    { ort: "Morzg", preis: 9405, max: 21655 },
    { ort: "Elisabeth-Vorstadt", preis: 9247, max: 9872 },
    { ort: "Gnigl", preis: 9027, max: 9831 },
    { ort: "Schallmoos", preis: 8774, max: 9427 },
    { ort: "Grödig", preis: 8017, max: 8431 },
    { ort: "Aigen 1", preis: 7979, max: 14134 },
    { ort: "Liefering 2", preis: 7900, max: 14207 },
    { ort: "Hallwang 2", preis: 7874, max: 9574 },
    { ort: "Siezenheim 1", preis: 6735, max: 7739 },
    { ort: "Elixhausen", preis: 6724, max: 7157 },
    { ort: "Gois", preis: 6627 },
    { ort: "Wals 1", preis: 6299, max: 8856 },
  ],
} as const;
type District =
  | (typeof DISTRICT_PRICES.bestand)[number]["ort"]
  | (typeof DISTRICT_PRICES.neubau)[number]["ort"];
type Bauart = keyof typeof DISTRICT_PRICES;

type Assumptions = {
  adresse: string;
  stadtteil: District;
  bauart: Bauart;
  units: Unit[];
  kaufpreis: number;
  nebenkosten: number;
  ekQuote: number;
  tilgung: number;
  laufzeit: number;
  marktMiete: number;
  wertSteigerung: number;
  inflation: number;
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  adresse: "",
  stadtteil: "Riedenburg",
  bauart: "bestand",
  units: [
    { flaeche: 50, miete: 15 },
    { flaeche: 50, miete: 15 },
  ],
  kaufpreis: 2800000,
  nebenkosten: 0.1,
  ekQuote: 0.2,
  tilgung: 0.02,
  laufzeit: 30,
  marktMiete: 16,
  wertSteigerung: 0.02,
  inflation: 0.02,
};

// Cashflow/Finanzierungsmodell (aus Excel abgeleitet)
export type Finance = {
  darlehen: number;
  zinssatz: number;
  annuitaet: number; // jährlich
  bkM2: number; // nicht umlagefähige BK €/m²/Monat
  bkWachstum: number; // p.a.
  einnahmenJ1: number; // Einnahmen Jahr 1
  einnahmenWachstum: number; // p.a.
  leerstand: number; // Anteil Leerstand
  steuerRate: number; // Einkommenssteuersatz
  afaRate: number; // AfA % vom Kaufpreis
};

const SCENARIOS = ["bear", "base", "bull"] as const;
type Scenario = (typeof SCENARIOS)[number];

const CASE_INFO: Record<Scenario, { label: string; color: string }> = {
  bear: { label: "Vorsichtiger Bearcase", color: "bg-red-500" },
  base: { label: "Stabiler Basiscase", color: "bg-orange-500" },
  bull: { label: "Chancenreicher Bullcase", color: "bg-emerald-500" },
};

type ProjectData = {
  cfgCases: Record<Scenario, Assumptions>;
  finCases: Record<Scenario, Finance>;
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  showUploads: boolean;
  texts: TextBlocks;
};

const makeDefaultAssumptions = (): Assumptions => ({
  ...DEFAULT_ASSUMPTIONS,
  units: DEFAULT_ASSUMPTIONS.units.map((u) => ({ ...u })),
});

const defaultCfgCases: Record<Scenario, Assumptions> = {
  bear: {
    ...makeDefaultAssumptions(),
    units: DEFAULT_ASSUMPTIONS.units.map((u) => ({
      flaeche: u.flaeche,
      miete: u.miete * 0.9,
    })),
    wertSteigerung: DEFAULT_ASSUMPTIONS.wertSteigerung * 0.9,
    ekQuote: DEFAULT_ASSUMPTIONS.ekQuote * 1.1,
  },
  base: makeDefaultAssumptions(),
  bull: {
    ...makeDefaultAssumptions(),
    units: DEFAULT_ASSUMPTIONS.units.map((u) => ({
      flaeche: u.flaeche,
      miete: u.miete * 1.1,
    })),
    wertSteigerung: DEFAULT_ASSUMPTIONS.wertSteigerung * 1.1,
    ekQuote: DEFAULT_ASSUMPTIONS.ekQuote * 0.9,
  },
};

const buildDefaultFinance = (cfg: Assumptions, scenario: Scenario): Finance => {
  const darlehen = cfg.kaufpreis * (1 - cfg.ekQuote + cfg.nebenkosten);
  const baseRate = 0.04;
  const zinssatz =
    scenario === "bear" ? baseRate * 1.1 : scenario === "bull" ? baseRate * 0.9 : baseRate;
  const einnahmen = cfg.units.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0);
  const einnahmenWachstumBase = 0.02;
  const einnahmenWachstum =
    scenario === "bear"
      ? einnahmenWachstumBase * 0.9
      : scenario === "bull"
      ? einnahmenWachstumBase * 1.1
      : einnahmenWachstumBase;
  return {
    darlehen,
    zinssatz,
    annuitaet: darlehen * (zinssatz + cfg.tilgung),
    bkM2: 0,
    bkWachstum: 0.03,
    einnahmenJ1: einnahmen,
    einnahmenWachstum,
    leerstand: scenario === "bear" ? 0.05 : 0,
    steuerRate: 0.4,
    afaRate: 0.015,
  };
};

const defaultFinCases: Record<Scenario, Finance> = {
  bear: buildDefaultFinance(defaultCfgCases.bear, "bear"),
  base: buildDefaultFinance(defaultCfgCases.base, "base"),
  bull: buildDefaultFinance(defaultCfgCases.bull, "bull"),
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

function buildPlan(years: number, fin: Finance, cfg: Assumptions): PlanRow[] {
  let saldo = fin.darlehen;
  let einnahmenBrutto = fin.einnahmenJ1;
  const flaeche = cfg.units.reduce((s, u) => s + u.flaeche, 0);
  let bk = flaeche * fin.bkM2 * 12;
  const afa = cfg.kaufpreis * fin.afaRate;
  const rows: PlanRow[] = [];
  for (let j = 1; j <= years; j++) {
    const einnahmen = einnahmenBrutto * (1 - fin.leerstand);
    const zins = saldo * fin.zinssatz;
    const tilgung = Math.min(saldo, Math.max(0, fin.annuitaet - zins));
    const annuitaet = saldo > 0 ? zins + tilgung : 0;
    const steuerBasis = einnahmen - bk - zins - afa;
    const steuer = Math.max(0, steuerBasis * fin.steuerRate);
    const ausgaben = annuitaet + bk + steuer;
    const fcf = einnahmen - ausgaben;

    rows.push({
      jahr: j,
      zins,
      tilgung,
      annuitaet,
      restschuld: saldo,
      einnahmen,
      ausgaben,
      fcf,
    });

    saldo = Math.max(0, saldo - tilgung);
    einnahmenBrutto = einnahmenBrutto * (1 + fin.einnahmenWachstum);
    if (fin.bkWachstum > 0) {
      bk = bk * (1 + fin.bkWachstum);
    }
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
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-md border px-2 py-1"
          type="number"
          step={step}
          value={Number.isFinite(value) ? (value === 0 && !readOnly ? "" : value) : ""}
          onChange={(e) => onChange?.(Number(e.target.value))}
          readOnly={readOnly}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        {suffix ? <span className="text-slate-500 dark:text-slate-400 text-xs">{suffix}</span> : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <select
        className="w-full rounded-md border px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function HouseGraphic({ units }: { units: Unit[] }) {
  const floors: { unit: Unit; index: number }[][] = [];
  for (let i = 0; i < units.length; i += 2) {
    const floor: { unit: Unit; index: number }[] = [{ unit: units[i], index: i }];
    if (units[i + 1]) floor.push({ unit: units[i + 1], index: i + 1 });
    floors.push(floor);
  }
  return (
    <div className="flex flex-col items-center transition-all">
      <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[20px] border-b-slate-600 border-l-transparent border-r-transparent" />
      {floors
        .slice()
        .reverse()
        .map((floor, idx) => (
          <div key={idx} className="flex">
            {floor.map(({ unit, index }) => (
              <div
                key={index}
                className="w-20 h-16 border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 flex flex-col items-center justify-center text-[10px] font-medium"
              >
                <div>Top {index + 1}</div>
                <div>{unit.flaeche} m²</div>
              </div>
            ))}
            {floor.length === 1 && (
              <div className="w-20 h-16 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
            )}
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

  const [pdfs, setPdfs] = useState<ProjectPdf[]>(() => {
    try {
      const raw = localStorage.getItem("lb33_pdfs");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const docChecklist = useMemo(
    () =>
      REQUIRED_DOCS.map((doc) => ({
        ...doc,
        present: pdfs.some((p) => {
          const name = p.name?.toLowerCase() ?? "";
          return doc.keywords.some((k) => name.includes(k));
        }),
      })),
    [pdfs]
  );
  const docsPercent = Math.round(
    (docChecklist.filter((d) => d.present).length / docChecklist.length) * 100
  );

  const [showUploads, setShowUploads] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("lb33_show_uploads");
      return raw ? JSON.parse(raw) : true;
    } catch {
      return true;
    }
  });
  const [texts, setTexts] = useState<TextBlocks>(() => {
    try {
      const raw = localStorage.getItem("lb33_texts");
      return raw
        ? JSON.parse(raw)
        : {
            title: "",
            subtitle: "",
            story: "",
            tipTitle: "",
            tipText: "",
            upsideTitle: "",
            upsideText: "",
          };
    } catch {
      return {
        title: "",
        subtitle: "",
        story: "",
        tipTitle: "",
        tipText: "",
        upsideTitle: "",
        upsideText: "",
      };
    }
  });
  const [projects, setProjects] = useState<Record<string, ProjectData>>(() => {
    try {
      const raw = localStorage.getItem("lb33_projects");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [projOpen, setProjOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [editingStory, setEditingStory] = useState(false);
  const [editingTip, setEditingTip] = useState(false);
  const [editingUpside, setEditingUpside] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lb33_dark");
    setDark(stored === "true");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("lb33_dark", String(dark));
  }, [dark]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const cfg = cfgCases[scenario];
  const fin = finCases[scenario];

  const setCfg = useCallback(
    (c: SetStateAction<Assumptions>) =>
      setCfgCases((prev) => ({
        ...prev,
        [scenario]:
          typeof c === "function"
            ? (c as (prev: Assumptions) => Assumptions)(prev[scenario])
            : c,
      })),
    [scenario]
  );
  const setFin = (f: Finance) =>
    setFinCases((prev) => ({ ...prev, [scenario]: f }));

  useEffect(() => {
    localStorage.setItem("lb33_cfg_cases", JSON.stringify(cfgCases));
  }, [cfgCases]);
  useEffect(() => {
    localStorage.setItem("lb33_fin_cases", JSON.stringify(finCases));
  }, [finCases]);

  useEffect(() => {
    setCfg((c) => {
      if (DISTRICT_PRICES[c.bauart].some((d) => d.ort === c.stadtteil)) return c;
      return { ...c, stadtteil: DISTRICT_PRICES[c.bauart][0].ort as District };
    });
  }, [cfg.bauart, setCfg]);

  useEffect(() => {
    localStorage.setItem("lb33_images", JSON.stringify(images));
  }, [images]);
  useEffect(() => {
    localStorage.setItem("lb33_pdfs", JSON.stringify(pdfs));
  }, [pdfs]);
  useEffect(() => {
    localStorage.setItem("lb33_show_uploads", JSON.stringify(showUploads));
  }, [showUploads]);
  useEffect(() => {
    localStorage.setItem("lb33_texts", JSON.stringify(texts));
  }, [texts]);

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
    const einnahmen = cfg.units.reduce(
      (sum, u) => sum + u.flaeche * u.miete * 12,
      0
    );
    setFinCases((prev) => {
      const cur = prev[scenario];
      if (cur.einnahmenJ1 === einnahmen) return prev;
      return { ...prev, [scenario]: { ...cur, einnahmenJ1: einnahmen } };
    });
  }, [cfg.units, scenario]);

  // === Derived ===
  const PLAN_30Y = useMemo(() => buildPlan(30, fin, cfg), [fin, cfg]);
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

  const bkJ1 = useMemo(
    () => totalFlaeche * fin.bkM2 * 12,
    [totalFlaeche, fin.bkM2]
  );

  const PLAN_15Y_CASES = useMemo(() => {
    return {
      bear: buildPlan(15, finCases.bear, cfgCases.bear),
      base: buildPlan(15, finCases.base, cfgCases.base),
      bull: buildPlan(15, finCases.bull, cfgCases.bull),
    } as Record<Scenario, PlanRow[]>;
  }, [finCases, cfgCases]);

  const compareDebtValueData = useMemo(
    () =>
      YEARS_15.map((y, idx) => ({
        Jahr: y,
        BearRestschuld: PLAN_15Y_CASES.bear[idx].restschuld,
        BaseRestschuld: PLAN_15Y_CASES.base[idx].restschuld,
        BullRestschuld: PLAN_15Y_CASES.bull[idx].restschuld,
        BearWert:
          cfgCases.bear.kaufpreis * Math.pow(1 + cfgCases.bear.wertSteigerung, y - 1),
        BaseWert:
          cfgCases.base.kaufpreis * Math.pow(1 + cfgCases.base.wertSteigerung, y - 1),
        BullWert:
          cfgCases.bull.kaufpreis * Math.pow(1 + cfgCases.bull.wertSteigerung, y - 1),
      })),
    [YEARS_15, PLAN_15Y_CASES, cfgCases]
  );

  const compareValueGrowthData = useMemo(
    () =>
      YEARS_15.map((y) => ({
        Jahr: y,
        Bear:
          cfgCases.bear.kaufpreis * Math.pow(1 + cfgCases.bear.wertSteigerung, y - 1),
        Base:
          cfgCases.base.kaufpreis * Math.pow(1 + cfgCases.base.wertSteigerung, y - 1),
        Bull:
          cfgCases.bull.kaufpreis * Math.pow(1 + cfgCases.bull.wertSteigerung, y - 1),
      })),
    [YEARS_15, cfgCases]
  );

  const startEK = useMemo(
    () => cfg.kaufpreis * (cfg.ekQuote + cfg.nebenkosten),
    [cfg.kaufpreis, cfg.ekQuote, cfg.nebenkosten]
  );

  const { vermoegensZuwachs10y, vermoegensTooltip } = useMemo(() => {
    const years = 10;
    const rest = PLAN_30Y[years]?.restschuld ?? 0;
    const wert = cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, years);
    const cumFcf = PLAN_30Y.slice(0, years).reduce((s, r) => s + r.fcf, 0);
    const equity = wert - rest + cumFcf;
    const zuwachs = equity - startEK;
    const tooltip = `Wert nach 10 J.: ${fmtEUR(wert)}\n− Restschuld: ${fmtEUR(rest)}\n+ kum. Cashflow: ${fmtEUR(cumFcf)}\n− eingesetztes EK: ${fmtEUR(startEK)}\n= Vermögenszuwachs: ${fmtEUR(zuwachs)}`;
    return { vermoegensZuwachs10y: zuwachs, vermoegensTooltip: tooltip };
  }, [PLAN_30Y, cfg.kaufpreis, cfg.wertSteigerung, startEK]);

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
    () => {
      let cumBear = 0;
      let cumBase = 0;
      let cumBull = 0;
      return Array.from({ length: 15 }, (_, i) => {
        cumBear += PLAN_15Y_CASES.bear[i].fcf;
        cumBase += PLAN_15Y_CASES.base[i].fcf;
        cumBull += PLAN_15Y_CASES.bull[i].fcf;
        return {
          Jahr: i + 1,
          Bear:
            cfgCases.bear.kaufpreis * Math.pow(1 + cfgCases.bear.wertSteigerung, i + 1) -
            PLAN_15Y_CASES.bear[i].restschuld +
            cumBear,
          Base:
            cfgCases.base.kaufpreis * Math.pow(1 + cfgCases.base.wertSteigerung, i + 1) -
            PLAN_15Y_CASES.base[i].restschuld +
            cumBase,
          Bull:
            cfgCases.bull.kaufpreis * Math.pow(1 + cfgCases.bull.wertSteigerung, i + 1) -
            PLAN_15Y_CASES.bull[i].restschuld +
            cumBull,
        };
      });
    },
    [PLAN_15Y_CASES, cfgCases]
  );

  const compareEquitySummaryData = useMemo(() => {
    const points = [5, 10, 15] as const;
    return points.map((p) => {
      const calc = (s: Scenario) => {
        let cum = 0;
        for (let i = 0; i < p; i++) {
          cum += PLAN_15Y_CASES[s][i].fcf;
        }
        const wert =
          cfgCases[s].kaufpreis * Math.pow(1 + cfgCases[s].wertSteigerung, p);
        const equity = wert - PLAN_15Y_CASES[s][p - 1].restschuld + cum;
        const start = cfgCases[s].kaufpreis * cfgCases[s].ekQuote;
        return { equity, zuwachs: equity - start };
      };
      const bear = calc("bear");
      const base = calc("base");
      const bull = calc("bull");
      return {
        Periode: `${p} J.`,
        BearEquity: bear.equity,
        BearZuwachs: bear.zuwachs,
        BaseEquity: base.equity,
        BaseZuwachs: base.zuwachs,
        BullEquity: bull.equity,
        BullZuwachs: bull.zuwachs,
      };
    });
  }, [PLAN_15Y_CASES, cfgCases]);

  const kaufpreisProM2 = cfg.kaufpreis / totalFlaeche;
  const avgPreisStadtteil =
    DISTRICT_PRICES[cfg.bauart].find((d) => d.ort === cfg.stadtteil)?.preis ?? 0;
  const caseLabel = CASE_INFO[scenario].label;
  const caseColor = CASE_INFO[scenario].color;

  const defaultTexts = useMemo(
    () => ({
      title: `Investment Case – ${cfg.adresse}`,
      subtitle: `Zinshaus in zentraler Lage (${cfg.stadtteil}) mit zwei Gewerbeeinheiten im EG und drei Wohnungen in den oberen Geschossen – ergänzt durch Kellerflächen. Konservativer, banktauglicher Case mit Upside durch mögliche Umwidmung in ein Hotel.`,
      story: `Die Liegenschaft befindet sich in zentraler Stadtlage von Salzburg-${cfg.stadtteil}. Im Erdgeschoß sind zwei Gewerbeeinheiten situiert, darüber in drei Obergeschoßen drei Wohnungen; Kellerflächen runden das Angebot ab. Insgesamt stehen knapp ${totalFlaeche} m² Nutzfläche zur Verfügung.\n\nDie Kalkulation wurde konservativ angesetzt und vom Steuerberater verifiziert. Bei einer Nettokaltmiete von nur ${fmt(avgMiete)} €/m² – und damit unter dem salzburger Marktniveau – wird ab dem ${cfPosAb || "–"}. Jahr ein positiver Cashflow erzielt. Grundlage ist eine Finanzierung mit ${Math.round(cfg.ekQuote * 100)} % Eigenkapital, ${Math.round(fin.zinssatz * 1000) / 10}% Zinsen, ${Math.round(cfg.tilgung * 100)} % Tilgung und ${cfg.laufzeit} Jahren Laufzeit sowie Annahmen von ${Math.round(fin.einnahmenWachstum * 100)}% Einnahmenwachstum, ${Math.round(cfg.wertSteigerung * 100)}% Wertsteigerung und ${Math.round(cfg.inflation * 100)}% Inflation p.a.\n\nIm Zehnjahreszeitraum ergibt sich ein konservativer Vermögenszuwachs von ${fmtEUR(vermoegensZuwachs10y)} (Equity‑Aufbau aus laufenden Überschüssen, Tilgung und Wertsteigerung). Der Einstiegspreis liegt mit ${fmt(Math.round(kaufpreisProM2))} €/m² deutlich unter dem durchschnittlichen Lagepreis von ${fmt(avgPreisStadtteil)} €/m².`,
      tipTitle: "Vermietung (Konservativ)",
      tipText: `Unterstellt wird eine Vollvermietung an ORS mit ${fmt(avgMiete)} €/m² netto kalt. Damit wird eine 100% Auslastung ohne Leerstandsrisiko angenommen – bewusst konservativ unter der marktüblichen Miete von ${cfg.marktMiete} €/m² in Salzburg.\n\n${caseLabel} – die tatsächlichen Erträge sind voraussichtlich höher.`,
      upsideTitle: "Upside: mögliche Umwidmung zum Hotel",
      upsideText: `In Vorgesprächen wurden für die Umwidmung in einen Hotelbetrieb bereits mündlich positive Signale durch anwaltliche Prüfinstanzen kommuniziert. Nach aktueller Einschätzung lassen Flächenwidmung und Rechtslage (inkl. ROG) die Umnutzung voraussichtlich problemlos zu. Dies eröffnet signifikant höhere laufende Erträge und eine spürbare Steigerung des Objektwerts.\n\nUpside-Perspektive mit deutlich höherem Cashflow gegenüber Zinshaus-Basiscase`,
    }),
    [
      cfg.adresse,
      cfg.stadtteil,
      cfg.ekQuote,
      cfg.tilgung,
      cfg.laufzeit,
      cfg.wertSteigerung,
      cfg.inflation,
      cfg.marktMiete,
      fin.zinssatz,
      fin.einnahmenWachstum,
      totalFlaeche,
      avgMiete,
      cfPosAb,
      kaufpreisProM2,
      avgPreisStadtteil,
      vermoegensZuwachs10y,
      caseLabel,
    ]
  );

  const titleText = texts.title || defaultTexts.title;
  const subtitleText = texts.subtitle || defaultTexts.subtitle;
  const storyText = texts.story || defaultTexts.story;
  const tipTitle = texts.tipTitle || defaultTexts.tipTitle;
  const tipText = texts.tipText || defaultTexts.tipText;
  const upsideTitle = texts.upsideTitle || defaultTexts.upsideTitle;
  const upsideText = texts.upsideText || defaultTexts.upsideText;

  const storyParagraphs = storyText.split(/\n\n+/);
  const [tipMain, tipNote = ""] = tipText.split(/\n\n+/);
  const [upsideMain, upsideNote = ""] = upsideText.split(/\n\n+/);

  const evaluation = useMemo(() => {
    const discountPct = avgPreisStadtteil
      ? (avgPreisStadtteil - kaufpreisProM2) / avgPreisStadtteil
      : 0;
    const priceDiscount = Math.max(0, Math.min(1, discountPct / 0.2)) * 100;

    const rentDeltaPct = cfg.marktMiete
      ? (cfg.marktMiete - avgMiete) / cfg.marktMiete
      : 0;
    const rentDelta = Math.max(0, Math.min(100, 50 + (rentDeltaPct / 0.2) * 50));

    const cashflowStability = cfPosAb
      ? Math.max(0, 100 - (cfPosAb - 1) * 10)
      : 0;

    const basisDSCR =
      (fin.einnahmenJ1 * (1 - fin.leerstand) - bkJ1) / fin.annuitaet;
    const financing =
      basisDSCR <= 1
        ? 0
        : Math.max(0, Math.min(1, (basisDSCR - 1) / 0.5)) * 100;

    const upside = texts.upsideText ? 100 : 0;

    const filled = [
      cfg.adresse,
      cfg.kaufpreis,
      cfg.nebenkosten,
      cfg.ekQuote,
      cfg.tilgung,
      cfg.laufzeit,
      cfg.units.length &&
        cfg.units.every((u) => u.flaeche > 0 && u.miete > 0),
    ];
    const dataQuality =
      (filled.filter(Boolean).length / filled.length) * 100;

    const total =
      priceDiscount * 0.25 +
      rentDelta * 0.15 +
      cashflowStability * 0.2 +
      financing * 0.2 +
      upside * 0.1 +
      dataQuality * 0.1;

    const grade =
      total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : "D";

    const bullets: string[] = [
      `Kaufpreis ${Math.round(discountPct * 100)} % ${
        discountPct >= 0 ? "unter" : "über"
      } Markt`,
      `Miete ${Math.round(Math.abs(rentDeltaPct) * 100)} % ${
        rentDeltaPct >= 0 ? "unter" : "über"
      } Marktniveau`,
      cfPosAb
        ? `Cashflow ab Jahr ${cfPosAb} positiv`
        : "Cashflow bleibt negativ",
      `DSCR ${basisDSCR.toFixed(2)}`,
    ];
    if (texts.upsideTitle) bullets.push(texts.upsideTitle);
    if (dataQuality < 100) bullets.push("Daten teilweise unvollständig");

    return {
      total,
      grade,
      subscores: {
        priceDiscount,
        rentDelta,
        cashflowStability,
        financing,
        upside,
        dataQuality,
      },
      rentDeltaPct,
      bullets: bullets.slice(0, 5),
    };
  }, [
      avgPreisStadtteil,
      kaufpreisProM2,
      cfg.marktMiete,
      avgMiete,
      cfPosAb,
      fin.einnahmenJ1,
      fin.leerstand,
      bkJ1,
      fin.annuitaet,
      texts.upsideText,
      texts.upsideTitle,
      cfg.adresse,
    cfg.kaufpreis,
    cfg.nebenkosten,
    cfg.ekQuote,
    cfg.tilgung,
    cfg.laufzeit,
    cfg.units,
  ]);

  const scoreNarrative = useMemo(() => {
    const reasons = evaluation.bullets.join(". ");
    return `Mit ${Math.round(evaluation.total)} Punkten (Note ${evaluation.grade}) wird das Objekt bewertet. ${reasons}.`;
    }, [evaluation]);

  const subscoreItems = useMemo(
    () => [
      {
        label: "Preis-Discount",
        value: evaluation.subscores.priceDiscount,
        desc: "Einstiegspreis vs. Ø-Marktpreis im Stadtteil",
      },
      {
        label: "Miet-Delta",
        value: evaluation.subscores.rentDelta,
        desc: "Abweichung der Ist-Miete von der Marktmiete (positiv = günstiger, negativ = teurer)",
      },
      {
        label: "Cashflow-Stabilität",
        value: evaluation.subscores.cashflowStability,
        desc: "Ab wann der Cashflow positiv wird",
      },
      {
        label: "Finanzierung & DSCR",
        value: evaluation.subscores.financing,
        desc: "Belastung des Cashflows durch Zins und Tilgung",
      },
      {
        label: "Upside-Potenzial",
        value: evaluation.subscores.upside,
        desc: "Zusätzliche Chancen wie Umwidmung oder Ausbau",
      },
      {
        label: "Datenqualität",
        value: evaluation.subscores.dataQuality,
        desc: "Vollständigkeit und Verlässlichkeit der Eingaben",
      },
    ],
    [evaluation]
  );

  const barColor = (label: string, v: number) => {
    if (label === "Miet-Delta") {
      const d = evaluation.rentDeltaPct;
      if (d > 0) return "bg-emerald-500";
      if (d < -0.1) return "bg-red-500";
      if (d < 0) return "bg-orange-500";
      return "bg-orange-500";
    }
    return v >= 75 ? "bg-emerald-500" : v >= 50 ? "bg-orange-500" : "bg-red-500";
  };

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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setPdfs((prev) => [...prev, { src, name: file.name }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateImageCaption = (idx: number, caption: string) =>
    setImages((prev) => prev.map((img, i) => (i === idx ? { ...img, caption } : img)));

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const removePdf = (idx: number) => setPdfs((prev) => prev.filter((_, i) => i !== idx));

  const downloadImages = async () => {
    if (images.length === 0) return;
    const zip = new JSZip();
    images.forEach((img, idx) => {
      const base64 = img.src.split(",")[1];
      const ext = img.src.substring("data:image/".length, img.src.indexOf(";"));
      zip.file(`bild${idx + 1}.${ext}`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "bilder.zip");
  };

  const downloadPdfs = async () => {
    if (pdfs.length === 0) return;
    if (pdfs.length === 1) {
      const link = document.createElement("a");
      link.href = pdfs[0].src;
      link.download = pdfs[0].name;
      link.click();
      return;
    }
    const zip = new JSZip();
    pdfs.forEach((pdf, idx) => {
      const base64 = pdf.src.split(",")[1];
      zip.file(pdf.name || `dok${idx + 1}.pdf`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "pdfs.zip");
  };

  const downloadAllZip = async () => {
    if (images.length === 0 && pdfs.length === 0) return;
    const zip = new JSZip();
    images.forEach((img, idx) => {
      const base64 = img.src.split(",")[1];
      const ext = img.src.substring("data:image/".length, img.src.indexOf(";"));
      zip.file(`bild${idx + 1}.${ext}`, base64, { base64: true });
    });
    pdfs.forEach((pdf, idx) => {
      const base64 = pdf.src.split(",")[1];
      zip.file(pdf.name || `dok${idx + 1}.pdf`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "projekt.zip");
  };

  // === UI: Einstellungs-Panel ===
  const [open, setOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const saveProject = () => {
    const name = prompt("Projektname?");
    if (!name) return;
    const newProjects = {
      ...projects,
      [name]: { cfgCases, finCases, images, pdfs, showUploads, texts },
    };
    setProjects(newProjects);
    localStorage.setItem("lb33_projects", JSON.stringify(newProjects));
    localStorage.setItem("lb33_current_project", name);
    alert("Gespeichert");
  };

  const resetProject = () => {
    if (
      !confirm(
        "Sind Sie sicher? Vergessen Sie nicht Ihr Projekt zu speichern/downloaden"
      )
    )
      return;
    setCfgCases(defaultCfgCases);
    setFinCases(defaultFinCases);
    setImages([]);
    setPdfs([]);
    setShowUploads(true);
    setTexts({
      title: "",
      subtitle: "",
      story: "",
      tipTitle: "",
      tipText: "",
      upsideTitle: "",
      upsideText: "",
    });
    localStorage.removeItem("lb33_cfg_cases");
    localStorage.removeItem("lb33_fin_cases");
    localStorage.removeItem("lb33_images");
    localStorage.removeItem("lb33_pdfs");
    localStorage.removeItem("lb33_show_uploads");
    localStorage.removeItem("lb33_texts");
    localStorage.removeItem("lb33_current_project");
  };

  const loadProject = (name: string) => {
    const raw = localStorage.getItem("lb33_projects");
    if (!raw) return;
    try {
      const stored = JSON.parse(raw);
      const data = stored[name] as ProjectData | undefined;
      if (!data) return;
      setCfgCases(data.cfgCases);
      setFinCases(data.finCases);
      setImages(data.images);
      setPdfs(data.pdfs);
      setShowUploads(data.showUploads);
      setTexts(data.texts);
      setProjects(stored);
      localStorage.setItem("lb33_current_project", name);
    } catch {
      /* ignore */
    }
  };

  const exportProject = () => {
    const data = { cfgCases, finCases, images, pdfs, showUploads, texts };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    saveAs(blob, "investmentcase.json");
  };

  const importInputRef = useRef<HTMLInputElement>(null);
  const triggerImport = () => importInputRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.cfgCases) setCfgCases(data.cfgCases);
        if (data.finCases) setFinCases(data.finCases);
        if (data.images) setImages(data.images);
        if (data.pdfs) setPdfs(data.pdfs);
        if (typeof data.showUploads !== "undefined") setShowUploads(data.showUploads);
        if (data.texts) setTexts(data.texts);
        alert("Projekt geladen");
      } catch {
        alert("Ungültige Datei");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const copyFromBase = () => {
    setCfgCases((prev) => ({
      ...prev,
      [scenario]: JSON.parse(JSON.stringify(prev.base)),
    }));
    setFinCases((prev) => ({
      ...prev,
      [scenario]: JSON.parse(JSON.stringify(prev.base)),
    }));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Einstellungs-Panel */}
      {open && <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setOpen(false)} />}
      <div
        className={`fixed inset-y-0 left-0 z-60 w-[420px] max-w-[95vw] border-r bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-xl transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">
            Einstellungen – {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case
          </div>
          <div className="flex items-center gap-2">
            {scenario !== "base" && (
              <Button variant="outline" size="sm" onClick={copyFromBase}>
                Aus Base Case übernehmen
              </Button>
            )}
            <button aria-label="close" onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 h-full overflow-y-auto pr-1">
            {/* Einheiten */}
            <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Einheiten</summary>
              <div className="mt-2 space-y-2">
                <Button variant="outline" size="sm" onClick={addUnit} className="gap-1">
                  <Plus className="w-4 h-4" /> Einheit
                </Button>
                {cfg.units.map((u, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                    <div className="text-sm font-medium mb-2">Top {idx + 1}</div>
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
            <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Finanzierung</summary>
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

            {/* Steuer */}
            <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Steuer</summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumField label="ESt-Satz %" value={fin.steuerRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, steuerRate: n / 100 })} suffix="%" />
                <NumField label="AfA % vom KP" value={fin.afaRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, afaRate: n / 100 })} suffix="%" />
                <NumField label="AfA (€ p.a.)" value={cfg.kaufpreis * fin.afaRate} readOnly />
              </div>
            </details>

            {/* Kosten & Einnahmen */}
            <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Kosten & Einnahmen</summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumField label="BK €/m²/Monat" value={fin.bkM2} step={0.1} onChange={(n) => setFin({ ...fin, bkM2: n })} />
                <NumField label="BK-Steigerung %" value={fin.bkWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, bkWachstum: n / 100 })} suffix="%" />
                <NumField label="Jährliche Bewirtschaftungskosten (€)" value={bkJ1} readOnly />
                <NumField label="Leerstand %" value={fin.leerstand * 100} step={0.1} onChange={(n) => setFin({ ...fin, leerstand: n / 100 })} suffix="%" />
                <NumField label="Einnahmen J1 (€)" value={fin.einnahmenJ1} readOnly />
                <NumField label="Einnahmen-Wachstum %" value={fin.einnahmenWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, einnahmenWachstum: n / 100 })} suffix="%" />
              </div>
            </details>

            {/* Marktannahmen */}
            <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Marktannahmen</summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <NumField label="Marktmiete (€/m²)" value={cfg.marktMiete} step={0.5} onChange={(n) => setCfg({ ...cfg, marktMiete: n })} />
                <NumField label="Wertsteigerung %" value={cfg.wertSteigerung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, wertSteigerung: n / 100 })} suffix="%" />
                <NumField label="Inflation %" value={cfg.inflation * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, inflation: n / 100 })} suffix="%" />
                <SelectField
                  label="Stadtteil"
                  value={cfg.stadtteil}
                  options={DISTRICT_PRICES[cfg.bauart].map((d) => d.ort)}
                  onChange={(s) => setCfg({ ...cfg, stadtteil: s as District })}
                />
              </div>
            </details>

            {/* Uploads */}
            <details className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Uploads</summary>
              <div className="mt-2 space-y-6">
                {/* Bilder */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Bilder</h4>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
                    <ImagePlus className="w-4 h-4" /> Bild hochladen
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="mt-2 space-y-2">
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
                </div>

                {/* PDFs */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">PDFs</h4>
                  <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="gap-1">
                    <FilePlus className="w-4 h-4" /> PDF hochladen
                  </Button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                  <div className="mt-2 space-y-2">
                    {pdfs.map((pdf, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-md border px-2 py-1 text-sm"
                      >
                        <span className="truncate flex-1">{pdf.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => removePdf(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Checkliste */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Checkliste ({docsPercent}%)
                  </h4>
                  <ul className="space-y-1">
                    {docChecklist.map((doc) => (
                      <li key={doc.key} className="flex items-center gap-2 text-sm">
                        {doc.present ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{doc.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-1" onClick={resetProject}>
                  <RotateCcw className="w-4 h-4" /> Neues Projekt
                </Button>
                <Button variant="outline" onClick={saveProject}>Speichern</Button>
                <Button variant="outline" className="gap-1" onClick={exportProject}>
                  <FileDown className="w-4 h-4" /> Download
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <Button variant="outline" className="gap-1" onClick={triggerImport}>
                  <FilePlus className="w-4 h-4" /> Upload
                </Button>
              </div>
              <Button onClick={() => setOpen(false)}>Fertig</Button>
            </div>
          </div>
        </div>

      {/* Projektübersicht */}
      {projOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md shadow-xl w-[min(90%,400px)] space-y-4">
            <h2 className="text-xl font-bold">Projektübersicht</h2>
            <div className="max-h-[50vh] overflow-y-auto">
              {Object.keys(projects).length ? (
                <ul className="space-y-2">
                  {Object.keys(projects).map((name) => (
                    <li key={name} className="flex items-center justify-between">
                      <span className="truncate mr-2">{name}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          loadProject(name);
                          setProjOpen(false);
                        }}
                      >
                        Laden
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Projekte gespeichert.</p>
              )}
            </div>
            <Button onClick={() => setProjOpen(false)}>Schließen</Button>
          </div>
        </div>
      )}

      {/* Header mit Szenario-Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen((o) => !o)}
                className="text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Einstellungen"
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Image src="/logo.png" alt="Hölzl Investments Logo" width={32} height={32} />
              <Badge variant="secondary" className="hidden sm:inline">LB33</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark((v) => !v)}
                className="text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.print()}
                className="gap-2 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" /> Drucken / PDF
              </Button>
              <Button
                variant="ghost"
                className="gap-2 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setProjOpen(true)}
              >
                <FolderOpen className="w-4 h-4" /> Projekte
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="flex items-start gap-6">
          <HouseGraphic units={cfg.units} />
          <div>
            {editingTitle ? (
              <div className="space-y-2">
                <input
                  className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 text-3xl md:text-4xl font-extrabold tracking-tight focus:outline-none"
                  value={titleText}
                  placeholder="Titel eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, title: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingTitle(false)}>Fertig</Button>
                </div>
              </div>
            ) : (
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
                {titleText}
                <button
                  onClick={() => setEditingTitle(true)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Titel bearbeiten"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </h1>
            )}
            {editingSubtitle ? (
              <div className="mt-2 space-y-2 max-w-3xl">
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={3}
                  value={subtitleText}
                  placeholder="Beschreibung eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, subtitle: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingSubtitle(false)}>Fertig</Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl flex items-start gap-2">
                {subtitleText}
                <button
                  onClick={() => setEditingSubtitle(true)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Text bearbeiten"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className={`${caseColor} text-white`}>{caseLabel}</Badge>
              <Badge variant="secondary">{totalFlaeche} m² gesamt</Badge>
              <Badge variant="secondary">{fmtEUR(cfg.kaufpreis)} Kaufpreis</Badge>
              <Badge variant="secondary">{fmt(Math.round(kaufpreisProM2))} €/m² Kaufpreis</Badge>
              <Badge variant="secondary">Ø Lagepreis {cfg.stadtteil}: {fmt(avgPreisStadtteil)} €/m²</Badge>
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
              <div title={vermoegensTooltip}>
                <Key
                  label="Konservatives Szenario"
                  value={fmtEUR(vermoegensZuwachs10y)}
                  sub="Tilgung + Wertsteigerung + Miete"
                />
              </div>
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Investitionsscore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold">{Math.round(evaluation.total)}</span>
              <span className="text-2xl font-semibold text-slate-500 dark:text-slate-400">
                {evaluation.grade}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {subscoreItems.map(({ label, value, desc }) => (
                <div key={label} className="space-y-1" title={desc}>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                  {label === "Miet-Delta" ? (
                    <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400" />
                      <div
                        className={`absolute top-0 h-2 rounded ${barColor(label, value)}`}
                        style={{
                          width: `${Math.min(
                            Math.abs(evaluation.rentDeltaPct) / 0.2 * 50,
                            50
                          )}%`,
                          [evaluation.rentDeltaPct >= 0 ? "left" : "right"]: "50%",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded">
                      <div
                        className={`h-2 rounded ${barColor(label, value)}`}
                        style={{ width: `${Math.round(value)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <ul className="mt-4 list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
              {evaluation.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Textblöcke */}
      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex items-start justify-between">
            <CardTitle>Investment Story</CardTitle>
            {!editingStory && (
              <button
                onClick={() => setEditingStory(true)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Investment Story bearbeiten"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            {editingStory ? (
              <>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={8}
                  value={storyText}
                  placeholder="Text eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, story: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingStory(false)}>Fertig</Button>
                </div>
              </>
            ) : (
              storyParagraphs.map((p, i) => <p key={i}>{p}</p>)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-start justify-between">
            {editingTip ? (
              <input
                className="font-semibold text-base flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none"
                value={tipTitle}
                placeholder="Titel eingeben"
                onChange={(e) => setTexts((t) => ({ ...t, tipTitle: e.target.value }))}
              />
            ) : (
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {tipTitle}
              </CardTitle>
            )}
            {!editingTip && (
              <button
                onClick={() => setEditingTip(true)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Vermietung bearbeiten"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            {editingTip ? (
              <>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={6}
                  value={tipText}
                  placeholder="Text eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, tipText: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingTip(false)}>Fertig</Button>
                </div>
              </>
            ) : (
              <>
                <p>{tipMain}</p>
                {tipNote && (
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-emerald-900">
                    {tipNote}
                  </div>
                )}
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{Math.round(evaluation.total)}</span>
                    <span className="text-xl font-semibold text-slate-500 dark:text-slate-400">
                      {evaluation.grade}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{scoreNarrative}</p>
                </div>
              </>
            )}
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
            <CardTitle>Restschuld vs. Immobilienwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareDebtValueData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={80} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Line type="monotone" dataKey="BearRestschuld" stroke="#dc2626" name="Restschuld Bear" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="BearWert"
                    stroke="#dc2626"
                    strokeDasharray="5 5"
                    name="Immobilienwert Bear"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="BaseRestschuld" stroke="#2563eb" name="Restschuld Base" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="BaseWert"
                    stroke="#2563eb"
                    strokeDasharray="5 5"
                    name="Immobilienwert Base"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="BullRestschuld" stroke="#16a34a" name="Restschuld Bull" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="BullWert"
                    stroke="#16a34a"
                    strokeDasharray="5 5"
                    name="Immobilienwert Bull"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wertzuwachs der Immobilie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareValueGrowthData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
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
      </section>

      {/* Gegenüberstellung 5 / 10 / 15 Jahre */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareEquitySummaryData} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Periode" />
                  <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={90} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Line type="monotone" dataKey="BearEquity" stroke="#dc2626" name="Equity Bear" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="BearZuwachs"
                    stroke="#dc2626"
                    strokeDasharray="5 5"
                    name="Zuwachs Bear"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="BaseEquity" stroke="#2563eb" name="Equity Base" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="BaseZuwachs"
                    stroke="#2563eb"
                    strokeDasharray="5 5"
                    name="Zuwachs Base"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="BullEquity" stroke="#16a34a" name="Equity Bull" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="BullZuwachs"
                    stroke="#16a34a"
                    strokeDasharray="5 5"
                    name="Zuwachs Bull"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Definition: Equity = Marktwert − Restschuld + kumulierter Cashflow, Zuwachs = Equity − Start‑EK des jeweiligen Szenarios.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Vergleichsdaten Bear/Base/Bull */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        {showCompare && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
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
                <CardTitle>Cashflow Vergleich (Jahre 1–15)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500 dark:text-slate-400">
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
                <thead className="text-left text-slate-500 dark:text-slate-400">
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
            <p className="text-xs text-muted-foreground mt-2">Annuität {fmtEUR(fin.annuitaet)} p.a. | BK {fmtEUR(bkJ1)} p.a. | Einnahmen starten bei {fmtEUR(fin.einnahmenJ1)} und wachsen mit {Math.round(fin.einnahmenWachstum * 100)}% p.a.</p>
          </CardContent>
        </Card>
      </section>

      {/* Upside */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Card>
          <CardHeader className="flex items-start justify-between">
            {editingUpside ? (
              <input
                className="font-semibold text-base flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none"
                value={upsideTitle}
                placeholder="Titel eingeben"
                onChange={(e) => setTexts((t) => ({ ...t, upsideTitle: e.target.value }))}
              />
            ) : (
              <CardTitle className="flex items-center gap-2">
                <Hotel className="w-5 h-5" /> {upsideTitle}
              </CardTitle>
            )}
            {!editingUpside && (
              <button
                onClick={() => setEditingUpside(true)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Upside bearbeiten"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </CardHeader>
          <CardContent className="leading-relaxed text-sm md:text-base">
            {editingUpside ? (
              <>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={6}
                  value={upsideText}
                  placeholder="Text eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, upsideText: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingUpside(false)}>Fertig</Button>
                </div>
              </>
            ) : (
              <>
                <p>{upsideMain}</p>
                {upsideNote && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-2 text-indigo-900">
                    <TrendingUp className="w-4 h-4" />
                    <span>{upsideNote}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Marktvergleich */}
      <section className="w-full mt-6">
        <div className="max-w-6xl mx-auto px-6 mb-4 flex justify-end gap-2">
          <Button
            size="sm"
            variant={cfg.bauart === "bestand" ? "default" : "outline"}
            onClick={() => setCfg({ ...cfg, bauart: "bestand" })}
          >
            Bestand
          </Button>
          <Button
            size="sm"
            variant={cfg.bauart === "neubau" ? "default" : "outline"}
            onClick={() => setCfg({ ...cfg, bauart: "neubau" })}
          >
            Neubau
          </Button>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Marktvergleich Salzburg (Auszug)</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p>Aus deinem Spreadsheet (Ø‑Preis {cfg.bauart === "bestand" ? "Bestand" : "Neubau"}, €/m²):</p>
              <ul className="list-disc pl-5 grid grid-cols-2 md:grid-cols-2 gap-x-6">
                {DISTRICT_PRICES[cfg.bauart].map((r) => (
                  <li
                    key={r.ort}
                    className={`flex items-center justify-between border-b py-1 cursor-pointer ${r.ort === cfg.stadtteil ? "bg-indigo-50" : ""}`}
                    onClick={() => setCfg({ ...cfg, stadtteil: r.ort as District })}
                  >
                    <span>{r.ort}</span>
                    <span className={`font-medium ${r.ort === cfg.stadtteil ? "text-indigo-600" : ""}`}>{fmt(r.preis)} €/m²</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 border dark:border-slate-700">
              <p className="mb-2">Unser Einstiegspreis (kaufpreis / m²):</p>
              <div className="text-2xl font-semibold">{fmt(Math.round(cfg.kaufpreis / totalFlaeche))} €/m²</div>
              <p className="text-xs text-muted-foreground mt-2">
                Im Direktvergleich liegt der Einstieg unter dem Ø‑Preis für <b>{cfg.stadtteil} ({fmt(avgPreisStadtteil)} €/m²)</b> und deutlich unter vielen Stadtlagen.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Uploads */}
      {(images.length > 0 || pdfs.length > 0) && (
        <section className="max-w-6xl mx-auto px-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Uploads</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm">anzeigen</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showUploads}
                onChange={(e) => setShowUploads(e.target.checked)}
              />
              <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer-checked:bg-indigo-600 relative transition">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-white dark:bg-slate-900 rounded-full transition peer-checked:translate-x-5"></span>
              </div>
            </label>
          </div>
          {showUploads && (
            <>
              {images.length > 0 && (
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
                        <figcaption className="text-sm text-center mt-1 text-slate-600 dark:text-slate-300">{img.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
              {pdfs.length > 0 && (
                <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {pdfs.map((pdf, idx) => (
                    <a
                      key={idx}
                      href={pdf.src}
                      download={pdf.name}
                      className="flex items-center justify-between rounded-md border p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span className="truncate text-sm">{pdf.name}</span>
                      </div>
                      <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {images.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadImages} className="gap-1">
                    <FileDown className="w-4 h-4" /> Bilder
                  </Button>
                )}
                {pdfs.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadPdfs} className="gap-1">
                    <FileDown className="w-4 h-4" /> PDF
                  </Button>
                )}
                {(images.length > 0 || pdfs.length > 0) && (
                  <Button variant="outline" size="sm" onClick={downloadAllZip} className="gap-1">
                    <FileDown className="w-4 h-4" /> ZIP
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      </main>

      {/* Scenario Tabs & Vergleichs-Switch */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
        <label className="flex items-center gap-2 border rounded-lg shadow bg-white dark:bg-slate-800 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={showCompare}
            onChange={(e) => setShowCompare(e.target.checked)}
            className="accent-slate-600"
          />
          Vergleich
        </label>
        <div className="flex border rounded-lg shadow bg-white dark:bg-slate-800 overflow-hidden">
          {SCENARIOS.map((s) => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`px-4 py-2 text-sm ${
                scenario === s
                  ? "bg-slate-200 dark:bg-slate-700 font-semibold"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <section className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          * Alle Angaben ohne Gewähr, konservative Annahmen; Zahlen teils gerundet. Bank- & steuerberatertaugliche Detailunterlagen auf Anfrage.
        </div>
      </section>
    </div>
  );
}
