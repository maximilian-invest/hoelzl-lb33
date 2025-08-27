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
import { TopBar } from "@/components/TopBar";
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Hotel,
  X,
  Plus,
  ImagePlus,
  FilePlus,
  FileDown,
  FileText,
  Pencil,
  RotateCcw,
  Building,
  PiggyBank,
  Percent,
  Wallet,
  Upload,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { fmt, fmtEUR } from "@/lib/format";
import { DISTRICT_PRICES, REQUIRED_DOCS } from "@/lib/constants";
import { useProjectStorage } from "@/hooks/useProjectStorage";
import { SettingsDialog } from "./components/SettingsDialog";
import { ChartsSection } from "./components/ChartsSection";
import { DocumentUploads } from "./components/DocumentUploads";
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
  tooltip?: string;
};

const Key: React.FC<KeyProps> = ({ label, value, sub, tooltip }) => (
  <div className="flex flex-col">
    <div className="flex items-center">
      <span className="text-sm">{label}</span>
      {tooltip ? (
        <span className="ml-1 cursor-help text-xs" title={tooltip}>
          !
        </span>
      ) : null}
    </div>
    <span className="text-lg font-semibold">{value}</span>
    {sub ? <span className="text-xs">{sub}</span> : null}
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
  const {
    projects,
    saveProject,
    resetProject,
    loadProject,
    exportProject,
  } = useProjectStorage({
    cfgCases,
    finCases,
    images,
    pdfs,
    showUploads,
    texts,
    setCfgCases,
    setFinCases,
    setImages,
    setPdfs,
    setShowUploads,
    setTexts,
    defaultCfgCases,
    defaultFinCases,
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

  const valueGrowthData = useMemo(
    () =>
      Array.from({ length: cfg.laufzeit }, (_, i) => ({
        Jahr: i + 1,
        Wert: cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, i + 1),
      })),
    [cfg.kaufpreis, cfg.wertSteigerung, cfg.laufzeit]
  );

  const startEK = useMemo(
    () => cfg.kaufpreis * (cfg.ekQuote + cfg.nebenkosten),
    [cfg.kaufpreis, cfg.ekQuote, cfg.nebenkosten]
  );
  const equityAt = useMemo(
    () =>
      (years: number) => {
        const rest = PLAN_30Y[years]?.restschuld ?? 0;
        const wert = cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, years);
        const cumFcf = PLAN_30Y.slice(0, years).reduce((s, r) => s + r.fcf, 0);
        return wert - rest + cumFcf;
      },
    [PLAN_30Y, cfg.kaufpreis, cfg.wertSteigerung]
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

  const PLAN_15Y_CASES = useMemo(() => {
    return {
      bear: buildPlan(15, finCases.bear, cfgCases.bear),
      base: buildPlan(15, finCases.base, cfgCases.base),
      bull: buildPlan(15, finCases.bull, cfgCases.bull),
    } as Record<Scenario, PlanRow[]>;
  }, [finCases, cfgCases]);

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
        <SettingsDialog open={open} setOpen={setOpen} scenario={scenario} cfg={cfg} setCfg={setCfg} fin={fin} setFin={setFin} addUnit={addUnit} updateUnit={updateUnit} removeUnit={removeUnit} bkJ1={bkJ1} images={images} pdfs={pdfs} handleImageUpload={handleImageUpload} handlePdfUpload={handlePdfUpload} updateImageCaption={updateImageCaption} removeImage={removeImage} removePdf={removePdf} fileInputRef={fileInputRef} pdfInputRef={pdfInputRef} docsPercent={docsPercent} docChecklist={docChecklist} resetProject={resetProject} saveProject={saveProject} exportProject={exportProject} triggerImport={triggerImport} importInputRef={importInputRef} handleImportFile={handleImportFile} copyFromBase={copyFromBase} />

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
      <TopBar
        open={open}
        dark={dark}
        onToggleSettings={() => setOpen((o) => !o)}
        onToggleDark={() => setDark((v) => !v)}
        onPrint={() => window.print()}
        onShowProjects={() => setProjOpen(true)}
      />

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
          <Card className="bg-black text-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cashflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key
                label="Positiv ab Jahr"
                value={cfPosAb ? `ab Jahr ${cfPosAb}` : "–"}
                sub="konservativ gerechnet"
                tooltip="konservativ gerechnet"
              />
            </CardContent>
          </Card>
          <Card className="bg-black text-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vermögenszuwachs (10 J.)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key
                label="Konservatives Szenario"
                value={fmtEUR(vermoegensZuwachs10y)}
                sub="Tilgung + Wertsteigerung + Miete"
                tooltip={vermoegensTooltip}
              />
            </CardContent>
          </Card>
          <Card className="bg-black text-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Konservative Miete</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key
                label="Unterstellt (ORS)"
                value={`${fmt(avgMiete)} €/m² netto kalt`}
                sub="100% Auslastung, kein Leerstandsrisiko"
                tooltip="100% Auslastung, kein Leerstandsrisiko"
              />
            </CardContent>
          </Card>
          <Card className="bg-black text-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Marktmiete Salzburg</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key
                label="Konservativ"
                value={`${cfg.marktMiete} €/m²`}
                sub="tatsächlich häufig darüber"
                tooltip="tatsächlich häufig darüber"
              />
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

      <ChartsSection chartData={chartData} valueGrowthData={valueGrowthData} cfg={cfg} fin={fin} bkJ1={bkJ1} cfPosAb={cfPosAb} startEK={startEK} PLAN_30Y={PLAN_30Y} equityAt={equityAt} compareFcfData={compareFcfData} compareEquityData={compareEquityData} showCompare={showCompare} />
        <DocumentUploads images={images} pdfs={pdfs} showUploads={showUploads} setShowUploads={setShowUploads} downloadImages={downloadImages} downloadPdfs={downloadPdfs} downloadAllZip={downloadAllZip} />
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

