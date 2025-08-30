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
import { formatPercent } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/TopBar";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SettingSection } from "@/components/SettingSection";
import UpsideForm from "@/components/UpsideForm";
import { useUpside } from "@/hooks/useUpside";
import { irr } from "@/lib/upside";
import { InvestmentScoreSection } from "@/components/InvestmentScore/Section";
import { calculateScore } from "@/logic/score";

import {
  CheckCircle2,
  Circle,
  TrendingUp,
  // Hotel,
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
  ChevronDown,
  ChevronUp,
  Maximize2,
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

type ObjektTyp = 'zinshaus' | 'wohnung' | 'gewerbe' | 'hotel' | 'büro' | 'lager' | 'sonstiges';

type Unit = { 
  flaeche: number; 
  miete: number; 
  typ: 'wohnung' | 'gewerbe';
  stockwerk: string;
  bezeichnung: string;
};

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
    label: "Pläne & Grundrisse",
    keywords: ["plan", "grundriss"],
  },
  {
    key: "energieausweis",
    label: "Energieausweis",
    keywords: ["energie", "ausweis", "epass"],
  },
  {
    key: "grundbuch",
    label: "Grundbuchauszug",
    keywords: ["grundbuch", "eigentum"],
  },
  {
    key: "kataster",
    label: "Katasterplan",
    keywords: ["kataster", "plan"],
  },
  {
    key: "finanzierung",
    label: "Finanzierungsbestätigung",
    keywords: ["finanzierung", "bank", "darlehen"],
  },
  {
    key: "gutachten",
    label: "Wertgutachten",
    keywords: ["gutachten", "bewertung", "wert"],
  },
  {
    key: "versicherung",
    label: "Versicherungsnachweis",
    keywords: ["versicherung", "police"],
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
// type Bauart = keyof typeof DISTRICT_PRICES;

type Assumptions = {
  adresse: string;
  stadtteil: District;
  bauart: "bestand" | "neubau";
  objektTyp: ObjektTyp;
  baujahr: number;
  sanierungen: string[];
  energiewerte: {
    energiekennzahl: number;
    heizung: string;
    dachung: string;
    fenster: string;
    waermedaemmung: string;
  };
  units: Unit[];
  kaufpreis: number;
  nebenkosten: number;
  ekQuote: number;
  tilgung: number;
  laufzeit: number;
  marktMiete: number;
  wertSteigerung: number;
  einnahmenBoostPct?: number; // optionaler Aufschlag für Bear/Bull (% als 0.10 = +10%)
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  adresse: "",
  stadtteil: "Riedenburg",
  bauart: "bestand",
  objektTyp: "zinshaus",
  baujahr: 1990,
  sanierungen: ["Heizung 2015", "Fenster 2018"],
  energiewerte: {
    energiekennzahl: 120,
    heizung: "Gas",
    dachung: "Ziegel",
    fenster: "Doppelverglasung",
    waermedaemmung: "Teilweise",
  },
  units: [
    { flaeche: 120, miete: 16, typ: 'wohnung', stockwerk: '1. OG', bezeichnung: 'Wohnung 1' },
    { flaeche: 120, miete: 16, typ: 'wohnung', stockwerk: '2. OG', bezeichnung: 'Wohnung 2' },
  ],
  kaufpreis: 1000000,
  nebenkosten: 0.1,
  ekQuote: 0.2,
  tilgung: 0.02,
  laufzeit: 30,
  marktMiete: 16,
  wertSteigerung: 0.02,
  einnahmenBoostPct: 0,
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
      typ: u.typ,
      stockwerk: u.stockwerk,
      bezeichnung: u.bezeichnung,
    })),
  },
  base: makeDefaultAssumptions(),
  bull: {
    ...makeDefaultAssumptions(),
    units: DEFAULT_ASSUMPTIONS.units.map((u) => ({
      flaeche: u.flaeche,
      miete: u.miete * 1.1,
      typ: u.typ,
      stockwerk: u.stockwerk,
      bezeichnung: u.bezeichnung,
    })),
  },
};

const buildDefaultFinance = (cfg: Assumptions): Finance => {
  const darlehen = cfg.kaufpreis * (1 - cfg.ekQuote + cfg.nebenkosten);
  const zinssatz = 0.03;
  const einnahmen = cfg.units.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0);
  const einnahmenWachstum = 0.03;
  return {
    darlehen,
    zinssatz,
    annuitaet: darlehen * (zinssatz + cfg.tilgung),
    bkM2: 0,
    bkWachstum: 0.03,
    einnahmenJ1: einnahmen,
    einnahmenWachstum,
    leerstand: 0,
    steuerRate: 0,
    afaRate: 0,
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
function AddressWithMap({ cfg, setCfg }: { cfg: Assumptions; setCfg: (c: Assumptions) => void }) {
  type NomAddress = {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    county?: string;
    state?: string;
  };
  type NomResult = { display_name: string; lat: string; lon: string; address?: NomAddress };

  const [addrQ, setAddrQ] = useState<string>(cfg.adresse || "");
  const [suggestions, setSuggestions] = useState<NomResult[]>([]);
  const [selected, setSelected] = useState<NomResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAddrQ(cfg.adresse || "");
  }, [cfg.adresse]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!addrQ || addrQ.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(addrQ)}&addressdetails=1&limit=5`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const data = (await res.json()) as NomResult[];
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [addrQ]);

  const onSelect = (s: NomResult) => {
    setSelected(s);
    setSuggestions([]);
    setAddrQ(s.display_name);
    // Try to infer district from address/display_name and map to known districts
    const allDistricts = DISTRICT_PRICES[cfg.bauart].map((d) => d.ort);
    const addrParts: string[] = [];
    if (s.address) {
      addrParts.push(
        s.address.neighbourhood || "",
        s.address.suburb || "",
        s.address.city_district || "",
        s.address.town || "",
        s.address.city || "",
        s.address.village || ""
      );
    }
    addrParts.push(s.display_name);
    const match = allDistricts.find((ort) => addrParts.some((p) => p && p.toLowerCase().includes(ort.toLowerCase())));
    setCfg({ ...cfg, adresse: s.display_name, stadtteil: (match as District) || cfg.stadtteil });
  };

  const lat = selected ? parseFloat(selected.lat) : null;
  const lon = selected ? parseFloat(selected.lon) : null;
  const bbox = lat !== null && lon !== null
    ? `${(lon - 0.01).toFixed(6)}%2C${(lat - 0.01).toFixed(6)}%2C${(lon + 0.01).toFixed(6)}%2C${(lat + 0.01).toFixed(6)}`
    : null;

  return (
    <div className="mt-3">
      <div className="relative max-w-xl">
        <input
          value={addrQ}
          onChange={(e) => setAddrQ(e.target.value)}
          placeholder="Adresse des Objekts eingeben"
          className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white dark:bg-slate-900 shadow">
            {suggestions.map((s, i) => (
              <li
                key={`${s.lat}-${s.lon}-${i}`}
                className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                onClick={() => onSelect(s)}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {lat !== null && lon !== null && bbox && (
        <div className="mt-3 border rounded-md overflow-hidden">
          <iframe
            title="Lage des Objekts"
            className="w-full h-60"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
          />
        </div>
      )}
    </div>
  );
}

// UI‑Snippets
type KeyProps = {
  label: string;
  value: string | number | React.ReactNode;
  sub?: string | React.ReactNode;
  tooltip?: string;
};

const Key: React.FC<KeyProps> = ({ label, value, sub }) => (
  <div className="flex flex-col">
    <div className="flex items-center">
      <span className="text-sm">{label}</span>
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
    <label className="flex flex-col gap-3 text-sm">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <input
          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          type="number"
          step={step}
          value={Number.isFinite(value) ? (value === 0 && !readOnly ? "" : value) : ""}
          onChange={(e) => onChange?.(Number(e.target.value))}
          readOnly={readOnly}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        {suffix ? <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{suffix}</span> : null}
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
    <label className="flex flex-col gap-3 text-sm">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <select
        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="py-2">
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}



export default function InvestmentCaseLB33() {
  // === State: Konfiguration ===
  // Beim direkten Laden ohne explizite Projektwahl zur Startseite schicken
  useEffect(() => {
    try {
      const autoload = localStorage.getItem("lb33_autoload");
      const current = localStorage.getItem("lb33_current_project");
      if (!autoload || !current) {
        window.location.replace("/start");
      }
    } catch {
      window.location.replace("/start");
    }
  }, []);
  const [scenario, setScenario] = useState<Scenario>("base");
  const [cfgCases, setCfgCases] = useState<Record<Scenario, Assumptions>>(() => {
    try {
      const raw = localStorage.getItem("lb33_cfg_cases");
      if (!raw) {
                 // leeres Projekt
         return {
           bear: { ...DEFAULT_ASSUMPTIONS, units: [], kaufpreis: 0, nebenkosten: 0, ekQuote: 0, tilgung: 0, laufzeit: 0, marktMiete: 0, wertSteigerung: 0, objektTyp: "zinshaus", baujahr: 1990, sanierungen: [], energiewerte: DEFAULT_ASSUMPTIONS.energiewerte },
           base: { ...DEFAULT_ASSUMPTIONS, units: [], kaufpreis: 0, nebenkosten: 0, ekQuote: 0, tilgung: 0, laufzeit: 0, marktMiete: 0, wertSteigerung: 0, objektTyp: "zinshaus", baujahr: 1990, sanierungen: [], energiewerte: DEFAULT_ASSUMPTIONS.energiewerte },
           bull: { ...DEFAULT_ASSUMPTIONS, units: [], kaufpreis: 0, nebenkosten: 0, ekQuote: 0, tilgung: 0, laufzeit: 0, marktMiete: 0, wertSteigerung: 0, objektTyp: "zinshaus", baujahr: 0, sanierungen: [], energiewerte: DEFAULT_ASSUMPTIONS.energiewerte },
         };
      }
      const parsed = JSON.parse(raw);
      return {
        bear: { ...defaultCfgCases.bear, ...(parsed.bear ?? {}) },
        base: { ...defaultCfgCases.base, ...(parsed.base ?? {}) },
        bull: { ...defaultCfgCases.bull, ...(parsed.bull ?? {}) },
      };
    } catch {
       return {
         bear: { ...DEFAULT_ASSUMPTIONS, units: [], kaufpreis: 0, nebenkosten: 0, ekQuote: 0, tilgung: 0, laufzeit: 0, marktMiete: 0, wertSteigerung: 0, objektTyp: "zinshaus", baujahr: 1990, sanierungen: [], energiewerte: DEFAULT_ASSUMPTIONS.energiewerte },
         base: { ...DEFAULT_ASSUMPTIONS, units: [], kaufpreis: 0, nebenkosten: 0, ekQuote: 0, tilgung: 0, laufzeit: 0, marktMiete: 0, wertSteigerung: 0, objektTyp: "zinshaus", baujahr: 1990, sanierungen: [], energiewerte: DEFAULT_ASSUMPTIONS.energiewerte },
         bull: { ...DEFAULT_ASSUMPTIONS, units: [], kaufpreis: 0, nebenkosten: 0, ekQuote: 0, tilgung: 0, laufzeit: 0, marktMiete: 0, wertSteigerung: 0, objektTyp: "zinshaus", baujahr: 1990, sanierungen: [], energiewerte: DEFAULT_ASSUMPTIONS.energiewerte },
       };
    }
  });

  const [finCases, setFinCases] = useState<Record<Scenario, Finance>>(() => {
    try {
      const raw = localStorage.getItem("lb33_fin_cases");
      return raw
        ? { ...defaultFinCases, ...JSON.parse(raw) }
        : {
            bear: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
            base: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
            bull: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
          };
    } catch {
      return {
        bear: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
        base: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
        bull: { darlehen: 0, zinssatz: 0, annuitaet: 0, bkM2: 0, bkWachstum: 0, einnahmenJ1: 0, einnahmenWachstum: 0, leerstand: 0, steuerRate: 0, afaRate: 0 },
      };
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

  const [manualChecklist, setManualChecklist] = useState<Record<string, boolean>>({});

  const docChecklist = useMemo(
    () =>
      REQUIRED_DOCS.map((doc) => ({
        ...doc,
        present: manualChecklist[doc.key] || pdfs.some((p) => {
          const name = p.name?.toLowerCase() ?? "";
          return doc.keywords.some((k) => name.includes(k));
        }),
      })),
    [pdfs, manualChecklist]
  );

  const toggleDocument = useCallback((key: string) => {
    setManualChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
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
  // const [editingUpside, setEditingUpside] = useState(false);
  const [vzYears, setVzYears] = useState<number>(10);
  const [currentProjectName, setCurrentProjectName] = useState<string | undefined>(undefined);
  const [compareExpanded, setCompareExpanded] = useState(true);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(520);
  const [isResizing, setIsResizing] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');
  const [selectedCards, setSelectedCards] = useState<string[]>([
    'cashflow', 'vermoegenszuwachs', 'roi', 'roe', 'miete', 'marktmiete', 'debug'
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("lb33_dark");
    setDark(stored === "true");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("lb33_dark", String(dark));
    
    // Set body background for dark mode
    if (dark) {
      document.body.style.backgroundColor = 'black';
      document.body.style.color = 'white';
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  }, [dark]);

  useEffect(() => {
    try {
      const name = localStorage.getItem("lb33_current_project") || undefined;
      setCurrentProjectName(name || undefined);
    } catch {}
  }, []);

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

  // Track current section for navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'cards', 'story', 'charts', 'tips', 'upside', 'compare'];
      const scrollPosition = window.scrollY + 100;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setCurrentSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const base = cfg.units.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0);
    const factor = 1 + (cfg.einnahmenBoostPct || 0);
    const einnahmen = base * factor;
    setFinCases((prev) => {
      const cur = prev[scenario];
      if (cur.einnahmenJ1 === einnahmen) return prev;
      return { ...prev, [scenario]: { ...cur, einnahmenJ1: einnahmen } };
    });
  }, [cfg.units, cfg.einnahmenBoostPct, scenario]);

  // === Derived ===
  const PLAN_30Y = useMemo(() => buildPlan(30, fin, cfg), [fin, cfg]);
  const PLAN_15Y = useMemo(() => PLAN_30Y.slice(0, 15), [PLAN_30Y]);

  const cashflowsBasis = useMemo(
    () => [-(cfg.kaufpreis * (1 + cfg.nebenkosten)), ...PLAN_15Y.map((r) => r.fcf)],
    [cfg.kaufpreis, cfg.nebenkosten, PLAN_15Y]
  );
  const irrBasis = useMemo(() => irr(cashflowsBasis), [cashflowsBasis]);
  const upsideState = useUpside(cashflowsBasis, irrBasis);

  const cfPosAb = useMemo(() => {
    const idx = PLAN_30Y.findIndex((r) => r.fcf > 0);
    return idx >= 0 ? idx + 1 : 0;
  }, [PLAN_30Y]);

  // const YEARS_15 = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 1), []);

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

  // const avgMieteWohnung = useMemo(
  //   () => {
  //     const wohnungen = cfg.units.filter(u => u.typ === 'wohnung');
  //     const wohnungsFlaeche = wohnungen.reduce((sum, u) => sum + u.flaeche, 0);
  //     return wohnungsFlaeche > 0
  //       ? wohnungen.reduce((sum, u) => sum + u.flaeche * u.miete, 0) / wohnungsFlaeche
  //       : 0;
  //   },
  //   [cfg.units]
  // );

  // const avgMieteGewerbe = useMemo(
  //   () => {
  //     const wohnungen = cfg.units.filter(u => u.typ === 'gewerbe');
  //     const gewerbeFlaeche = gewerbe.reduce((sum, u) => sum + u.flaeche, 0);
  //     const gewerbeFlaeche = gewerbe.reduce((sum, u) => sum + u.flaeche, 0);
  //     return gewerbeFlaeche > 0
  //       ? gewerbe.reduce((sum, u) => sum + u.flaeche * u.miete, 0) / gewerbeFlaeche
  //       : 0;
  //   },
  //   [cfg.units]
  // );

  const bkJ1 = useMemo(
    () => totalFlaeche * fin.bkM2 * 12,
    [totalFlaeche, fin.bkM2]
  );

  // Compounded property value arrays across the model horizon
  const horizonYears = PLAN_30Y.length;

  // Laufzeit automatisch aus Restschuld ableiten (unabhängig von 30J-Plan):
  // simuliere bis max 100 Jahre und nimm das erste Jahr, in dem die Restschuld 0 ist
  const laufzeitAuto = useMemo(() => {
    let saldo = fin.darlehen;
    const maxYears = 100;
    for (let j = 1; j <= maxYears; j++) {
      const zins = saldo * fin.zinssatz;
      const tilgung = Math.min(saldo, Math.max(0, fin.annuitaet - zins));
      saldo = Math.max(0, saldo - tilgung);
      if (saldo <= 1e-6) return j;
    }
    return 0; // Falls Annuität <= Zins dauerhaft, keine Amortisation
  }, [fin.darlehen, fin.zinssatz, fin.annuitaet]);
  const propertyValueByYear = useMemo(
    () =>
      Array.from({ length: horizonYears }, (_, i) =>
        cfg.kaufpreis * Math.pow(1 + (cfg.wertSteigerung || 0), i + 1)
      ),
    [horizonYears, cfg.kaufpreis, cfg.wertSteigerung]
  );
  const valueIncreaseAbsByYear = useMemo(
    () => propertyValueByYear.map((v) => v - cfg.kaufpreis),
    [propertyValueByYear, cfg.kaufpreis]
  );
  const valueIncreasePctByYear = useMemo(
    () =>
      Array.from({ length: horizonYears }, (_, i) =>
        Math.pow(1 + (cfg.wertSteigerung || 0), i + 1) - 1
      ),
    [horizonYears, cfg.wertSteigerung]
  );

  // Für Wertzuwachs-Darstellung: immer mindestens 20 Jahre anzeigen
  const growthYears = useMemo(
    () => Math.min(horizonYears, Math.max(20, laufzeitAuto || 0)),
    [horizonYears, laufzeitAuto]
  );

  const chartData = useMemo(() => {
    const restEnd = PLAN_15Y.map((r) => Math.max(0, r.restschuld - r.tilgung));
    const n = Math.min(15, propertyValueByYear.length, restEnd.length, PLAN_15Y.length);
    return Array.from({ length: n }, (_, idx) => ({
      Jahr: idx + 1,
      Restschuld: restEnd[idx],
      Immobilienwert: propertyValueByYear[idx],
      FCF: PLAN_15Y[idx].fcf,
    }));
  }, [PLAN_15Y, propertyValueByYear]);

  const valueGrowthData = useMemo(
    () =>
      Array.from({ length: growthYears }, (_, i) => ({
        Jahr: i + 1,
        Wert: propertyValueByYear[i],
      })),
    [growthYears, propertyValueByYear]
  );

  const valueGrowthTable = useMemo(
    () =>
      Array.from({ length: growthYears }, (_, i) => ({
        Jahr: i + 1,
        Wert: propertyValueByYear[i],
        Zuwachs: valueIncreaseAbsByYear[i],
        ZuwachsPct: valueIncreasePctByYear[i],
      })),
    [growthYears, propertyValueByYear, valueIncreaseAbsByYear, valueIncreasePctByYear]
  );


  // --- ROI & ROE helpers ---
  const nkInLoan = false; // TODO: make configurable in UI
  const V0 = cfg.kaufpreis;
  const NKabs = V0 * (cfg.nebenkosten || 0);
  const L0 = fin.darlehen;
  // const g = cfg.wertSteigerung || 0;
  const investUnlevered = V0 + (nkInLoan ? 0 : NKabs);

  // const startEK = useMemo(() => {
  // return (nkInLoan ? V0 : V0 + NKabs) - L0;
  // }, [nkInLoan, V0, NKabs, L0]);

  const einnahmenByYear = useMemo(() => PLAN_30Y.map(r => r.einnahmen), [PLAN_30Y]);
  const ausgabenByYear = useMemo(() => PLAN_30Y.map(r => r.ausgaben), [PLAN_30Y]);
  const fcfByYear = useMemo(() => PLAN_30Y.map(r => r.fcf), [PLAN_30Y]);
  // const restBegByYear = useMemo(() => PLAN_30Y.map(r => r.restschuld), [PLAN_30Y]);
  // const tilgungByYear = useMemo(() => PLAN_30Y.map(r => r.tilgung), [PLAN_30Y]);
  // const restEndByYear = useMemo(() => restBegByYear.map((rb, i) => rb - (tilgungByYear[i] || 0)), [restBegByYear, tilgungByYear]);

  // ROI/ROE: nur Jahr 1 (periodisch)

  const roiValue = useMemo(() => {
    if (investUnlevered <= 0) return null;
    const net1 = (einnahmenByYear[0] ?? 0) - (ausgabenByYear[0] ?? 0);
    return net1 / investUnlevered;
  }, [investUnlevered, einnahmenByYear, ausgabenByYear]);

  const roeValue = useMemo(() => {
    const ek0 = (nkInLoan ? V0 : V0 + NKabs) - L0;
    if (ek0 <= 0) return null;
    return (fcfByYear[0] ?? 0) / ek0;
  }, [V0, NKabs, L0, fcfByYear, nkInLoan]);
  // const equityAt = useMemo(
  //   () =>
  //     (years: number) => {
  //       const rest = PLAN_30Y[years]?.restschuld ?? 0;
  //       const wert = cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, years);
  //       const cumFcf = PLAN_30Y.slice(0, years).reduce((s, r) => s + r.fcf, 0);
  //       return wert - rest + cumFcf;
  //     },
  //   [PLAN_30Y, cfg.kaufpreis, cfg.wertSteigerung]
  // );

  const { vermoegensZuwachs10y, vermoegensTooltip } = useMemo(() => {
    const years = vzYears;
    const V0 = cfg.kaufpreis;
            // const g = cfg.wertSteigerung || 0;

    // Marktwert nach t Jahren mit Zinseszinseffekt auf V0 (exkl. NK)
    const marktwert10 = V0 * Math.pow(1 + cfg.wertSteigerung, years);
    // Summe FCF 1..t (bereits nach Schuldendienst)
    const cumFcf10 = PLAN_30Y.slice(0, years).reduce((s, r) => s + r.fcf, 0);
    // Summe Tilgung 1..t
    const cumTilgung10 = PLAN_30Y.slice(0, years).reduce((s, r) => s + r.tilgung, 0);

    // Neue Definition: Tilgung kumuliert + (Wertzuwachs) + kum. FCF bis Jahr 10
    const wertzuwachs10 = marktwert10 - V0;
    const zuwachsFinal = cumTilgung10 + wertzuwachs10 + cumFcf10;
    
    // Eingesetztes Eigenkapital abziehen (EK₀)
    const initialEquity = (nkInLoan ? V0 : V0 + NKabs) - L0;
    const nettoZuwachs = zuwachsFinal - initialEquity;

    const tooltip = "Der kumulierte Wertzuwachs gemeinsam mit kumulierter Tilgung und dem Free Cashflow abzüglich der eingesetzten Eigenmittel ergibt den Netto-Vermögenszuwachs nach dem gewählten Zeitraum";

    return { vermoegensZuwachs10y: nettoZuwachs, vermoegensTooltip: tooltip };
  }, [PLAN_30Y, cfg.kaufpreis, cfg.wertSteigerung, vzYears, nkInLoan, NKabs, L0]);

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
  // const priceBelowMarket = kaufpreisProM2 < avgPreisStadtteil;
  const caseLabel = CASE_INFO[scenario].label;
  // const caseColor = CASE_INFO[scenario].color;

  const defaultTexts = useMemo(
    () => {
      const wohnungen = cfg.units.filter(u => u.typ === 'wohnung');
      const gewerbe = cfg.units.filter(u => u.typ === 'gewerbe');
      // const wohnungsFlaeche = wohnungen.reduce((sum, u) => sum + u.flaeche, 0);
      // const gewerbeFlaeche = gewerbe.reduce((sum, u) => sum + u.flaeche, 0);
      
      // Baujahr-Text
      const baujahrText = cfg.baujahr > 0 ? `Das ${cfg.bauart === 'neubau' ? 'neue' : 'bestehende'} Objekt wurde ${cfg.baujahr === new Date().getFullYear() ? 'in diesem Jahr' : `im Jahr ${cfg.baujahr}`} ${cfg.bauart === 'neubau' ? 'errichtet' : 'gebaut'}` : '';
      
      // Sanierungen-Text
      const sanierungenText = cfg.sanierungen.length > 0 && cfg.sanierungen.some(s => s.trim() !== '') 
        ? `Wichtige Sanierungen: ${cfg.sanierungen.filter(s => s.trim() !== '').join(', ')}.` 
        : '';
      
      // Energiewerte-Text
      const energiewerteText = `Energiewerte: ${cfg.energiewerte.energiekennzahl} kWh/m²a, ${cfg.energiewerte.heizung}-Heizung, ${cfg.energiewerte.dachung}-Dachung, ${cfg.energiewerte.fenster}, ${cfg.energiewerte.waermedaemmung} Wärmedämmung.`;
      
      // Objekttyp-spezifische Beschreibung
      const objektTypText = (() => {
        switch(cfg.objektTyp) {
          case 'zinshaus': return 'Mehrfamilienhaus mit mehreren Wohneinheiten';
          case 'wohnung': return 'Einzelwohnung';
          case 'gewerbe': return 'Gewerbeimmobilie';
          case 'hotel': return 'Hotel mit mehreren Zimmern';
          case 'büro': return 'Bürogebäude mit mehreren Büros';
          case 'lager': return 'Lager- oder Logistikimmobilie';
          case 'sonstiges': return 'Sonstige Immobilie';
          default: return 'Immobilienobjekt';
        }
      })();

      return {
        title: `Investment Case – ${cfg.adresse || objektTypText}`,
        subtitle: `${cfg.units.length > 0 ? `${cfg.units.length} Einheiten` : 'Immobilienobjekt'} in ${cfg.stadtteil || 'zentraler Lage'}. ${objektTypText}. ${totalFlaeche > 0 ? `Insgesamt ${totalFlaeche} m² Nutzfläche.` : ''} ${cfg.bauart === 'neubau' ? 'Neubau mit modernen Standards.' : 'Bestandsimmobilie mit Entwicklungspotenzial.'}${upsideState.scenarios.length > 0 ? ` ${upsideState.scenarios.length} Upside-Szenarien identifiziert.` : ''}`,
        story: `${cfg.adresse ? `Die Liegenschaft ${cfg.adresse}` : 'Die Liegenschaft'} befindet sich in ${cfg.stadtteil ? `Salzburg-${cfg.stadtteil}` : 'zentraler Stadtlage'}. ${baujahrText} ${sanierungenText} ${energiewerteText}\n\n${gewerbe.length > 0 ? `Im Erdgeschoß sind ${gewerbe.length} Gewerbeeinheiten situiert` : 'Gewerbeeinheiten sind vorhanden'}, ${wohnungen.length > 0 ? `darüber ${wohnungen.length} Wohnungen` : 'Wohnungen sind vorhanden'}. ${totalFlaeche > 0 ? `Insgesamt stehen ${totalFlaeche} m² Nutzfläche zur Verfügung.` : ''}\n\n${avgMiete > 0 ? `Bei einer Nettokaltmiete von ${fmt(avgMiete)} €/m²` : 'Bei realistischer Mieteannahme'} ${cfPosAb > 0 ? `wird ab dem ${cfPosAb}. Jahr ein positiver Cashflow erzielt` : 'wird ein positiver Cashflow angestrebt'}. ${cfg.ekQuote > 0 ? `Grundlage ist eine Finanzierung mit ${Math.round(cfg.ekQuote * 100)} % Eigenkapital` : 'Die Finanzierung wird realistisch kalkuliert'}, ${fin.zinssatz > 0 ? `${Math.round(fin.zinssatz * 1000) / 10}% Zinsen` : ''}, ${cfg.tilgung > 0 ? `${Math.round(cfg.tilgung * 100)} % Tilgung` : ''} ${laufzeitAuto > 0 ? `und ${laufzeitAuto} Jahren Laufzeit` : ''} sowie Annahmen von ${fin.einnahmenWachstum > 0 ? `${Math.round(fin.einnahmenWachstum * 100)}% Einnahmenwachstum` : 'realistischem Einnahmenwachstum'} und ${cfg.wertSteigerung > 0 ? `${Math.round(cfg.wertSteigerung * 100)}% Wertsteigerung p.a.` : 'moderater Wertsteigerung'}.\n\n${vermoegensZuwachs10y > 0 ? `Im Zehnjahreszeitraum ergibt sich ein Vermögenszuwachs von ${fmtEUR(vermoegensZuwachs10y)} (Equity‑Aufbau aus laufenden Überschüssen, Tilgung und Wertsteigerung).` : 'Der Vermögenszuwachs wird realistisch kalkuliert.'} ${kaufpreisProM2 > 0 && avgPreisStadtteil > 0 ? `Der Einstiegspreis liegt mit ${fmt(Math.round(kaufpreisProM2))} €/m² ${kaufpreisProM2 < avgPreisStadtteil ? 'deutlich unter' : 'im Bereich'} dem durchschnittlichen Lagepreis von ${fmt(avgPreisStadtteil)} €/m².` : ''}${upsideState.scenarios.length > 0 ? `\n\nUpside-Potenzial: ${upsideState.scenarios.map(s => s.title).join(', ')}. ${upsideState.bonus > 0 ? `Das zusätzliche Upside-Potenzial beträgt ${fmtEUR(upsideState.bonus)}.` : ''}` : ''}`,
        tipTitle: "Vermietungsstrategie & Marktposition",
        tipText: `${avgMiete > 0 ? `Unterstellt wird eine Vollvermietung mit ${fmt(avgMiete)} €/m² netto kalt.` : 'Es wird eine Vollvermietung angestrebt.'} ${cfg.marktMiete > 0 ? `Die kalkulierte Miete liegt ${avgMiete < cfg.marktMiete ? 'unter' : 'im Bereich'} der marktüblichen Miete von ${cfg.marktMiete} €/m² in Salzburg.` : 'Die Miete wird marktorientiert kalkuliert.'}\n\n${caseLabel} – die tatsächlichen Erträge können je nach Marktentwicklung variieren.`,
        upsideTitle: "Upside-Potenzial & Entwicklung",
        upsideText: `${upsideState.scenarios.length > 0 ? `Mehrere Upside-Szenarien wurden identifiziert: ${upsideState.scenarios.map(s => s.title).join(', ')}.` : 'Das Objekt bietet verschiedene Upside-Potenziale.'} ${cfg.wertSteigerung > 0 ? `Bei einer jährlichen Wertsteigerung von ${Math.round(cfg.wertSteigerung * 100)}%` : 'Bei moderater Wertentwicklung'} ergeben sich zusätzliche Wertsteigerungspotenziale.\n\n${upsideState.scenarios.length > 0 ? `Upside-Szenarien: ${upsideState.scenarios.map(s => `${s.title}${s.remarks ? ` (${s.remarks})` : ''}`).join('; ')}.` : 'Verschiedene Upside-Potenziale sind identifiziert worden.'} ${upsideState.bonus > 0 ? `Das zusätzliche Upside-Potenzial beträgt ${fmtEUR(upsideState.bonus)}.` : ''}\n\nUpside-Perspektive mit höherem Cashflow gegenüber dem Basiscase.`,
      };
    },
    [
      cfg.adresse,
      cfg.stadtteil,
      cfg.ekQuote,
      cfg.tilgung,
      laufzeitAuto,
      cfg.wertSteigerung,
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
      cfg.units,
      upsideState.scenarios,
      upsideState.bonus,
      cfg.baujahr,
      cfg.bauart,
      cfg.sanierungen,
      cfg.objektTyp,
      cfg.energiewerte,
    ]
  );

  // Automatische Text-Updates basierend auf Datenänderungen
  const autoUpdateTexts = useCallback(() => {
    if (Object.keys(texts).every(key => !texts[key as keyof TextBlocks])) {
      // Wenn alle Texte leer sind, automatisch mit Standardtexten füllen
      setTexts(defaultTexts);
    }
  }, [texts, defaultTexts]);

  const updateAllTextsWithAI = useCallback(() => {
    setTexts(defaultTexts);
  }, [defaultTexts]);

  // Sidebar Resize Functions
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 300 && newWidth <= 800) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    autoUpdateTexts();
  }, [autoUpdateTexts]);

  const titleText = texts.title || defaultTexts.title;
  const subtitleText = texts.subtitle || defaultTexts.subtitle;
  const storyText = texts.story || defaultTexts.story;
  const tipTitle = texts.tipTitle || defaultTexts.tipTitle;
  const tipText = texts.tipText || defaultTexts.tipText;
  // const upsideTitle = texts.upsideTitle || defaultTexts.upsideTitle;
  // const upsideText = texts.upsideText || defaultTexts.upsideText;

  const storyParagraphs = storyText.split(/\n\n+/);
  const [tipMain, tipNote = ""] = tipText.split(/\n\n+/);
  // const [upsideMain, upsideNote = ""] = upsideText.split(/\n\n+/);

  const { score, metrics } = useMemo(
    () =>
      calculateScore({
        avgPreisStadtteil,
        kaufpreisProM2,
        marktMiete: cfg.marktMiete,
        avgMiete,
        cfPosAb,
        finEinnahmenJ1: fin.einnahmenJ1,
        finLeerstand: fin.leerstand,
        bkJ1,
        annuitaet: fin.annuitaet,
        upsideBonus: upsideState.bonus,
        upsideTitle: texts.upsideTitle,
        irr: irrBasis,
        project: {
          adresse: cfg.adresse,
          kaufpreis: cfg.kaufpreis,
          nebenkosten: cfg.nebenkosten,
          ekQuote: cfg.ekQuote,
          tilgung: cfg.tilgung,
          laufzeit: laufzeitAuto,
          units: cfg.units,
        },
      }),
    [
      avgPreisStadtteil,
      kaufpreisProM2,
      cfg.marktMiete,
      avgMiete,
      cfPosAb,
      fin.einnahmenJ1,
      fin.leerstand,
      bkJ1,
      fin.annuitaet,
      upsideState.bonus,
      texts.upsideTitle,
      irrBasis,
      cfg.adresse,
      cfg.kaufpreis,
      cfg.nebenkosten,
      cfg.ekQuote,
      cfg.tilgung,
      laufzeitAuto,
      cfg.units,
    ]
  );

  const scoreNarrative = useMemo(() => {
    const reasons = score.bullets.join(". ");
    return `Mit ${Math.round(score.total)} Punkten (Note ${score.grade}) wird das Objekt bewertet. ${reasons}.`;
  }, [score]);

  const addUnit = () => {
    const nextNumber = cfg.units.length + 1;
    let defaultTyp: 'wohnung' | 'gewerbe' = 'wohnung';
    const defaultStockwerk = `${nextNumber}. OG`;
    let defaultBezeichnung = `Wohnung ${nextNumber}`;
    
    // Anpassung basierend auf Objekttyp
    if (cfg.objektTyp === 'hotel') {
      defaultTyp = 'gewerbe';
      defaultBezeichnung = `Zimmer ${nextNumber}`;
    } else if (cfg.objektTyp === 'büro') {
      defaultTyp = 'gewerbe';
      defaultBezeichnung = `Büro ${nextNumber}`;
    }
    
    setCfg({ ...cfg, units: [...cfg.units, { 
      flaeche: 0, 
      miete: avgMiete, 
      typ: defaultTyp, 
      stockwerk: defaultStockwerk, 
      bezeichnung: defaultBezeichnung 
    }] });
  };
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
  const [fullscreen, setFullscreen] = useState(false);
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

  // === Card System ===
  const AVAILABLE_CARDS: Record<string, {
    title: string;
    tooltip: string;
    content: React.ReactNode;
    controls?: React.ReactNode;
  }> = {
    cashflow: {
      title: "Cashflow",
      tooltip: "Freier Cashflow nach Schuldendienst im ersten Jahr. Zeigt, wie viel Geld nach Abzug aller Kosten (Annuität, Betriebskosten, Steuern) übrig bleibt.",
      content: (
        <Key
          label="Positiv ab Jahr"
          value={cfPosAb ? `ab Jahr ${cfPosAb}` : "–"}
          sub="konservativ gerechnet"
          tooltip="konservativ gerechnet"
        />
      )
    },
    vermoegenszuwachs: {
      title: "Vermögenszuwachs",
      tooltip: "Zeigt den Netto-Vermögenszuwachs nach 5, 10 oder 15 Jahren. Berechnet sich aus Wertzuwachs der Immobilie + kumulierte Tilgung + kumulierter Cashflow - eingesetztes Eigenkapital.",
      content: (
        <Key
          label={`Netto-Vermögenszuwachs nach ${vzYears} Jahren`}
          value={fmtEUR(vermoegensZuwachs10y)}
          sub="ΣWertzuwachs + ΣTilgung + ΣFCF - EK₀"
          tooltip={vermoegensTooltip}
        />
      ),
      controls: (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant={vzYears === 5 ? 'default' : 'secondary'} onClick={() => setVzYears(5)}>5 J</Button>
          <Button size="sm" variant={vzYears === 10 ? 'default' : 'secondary'} onClick={() => setVzYears(10)}>10 J</Button>
          <Button size="sm" variant={vzYears === 15 ? 'default' : 'secondary'} onClick={() => setVzYears(15)}>15 J</Button>
        </div>
      )
    },
    roi: {
      title: "ROI",
      tooltip: "Return on Investment (Kapitalrendite) = (Einnahmen − Ausgaben) / Investitionskosten. Zeigt die jährliche Rendite auf die Gesamtinvestition.",
      content: (
        <Key
          label="Allgemeiner return on invest"
          value={roiValue === null ? '—' : formatPercent(roiValue)}
          sub={`Investition inkl. NK: ${fmtEUR(investUnlevered)}`}
          tooltip={roiValue === null ? 'Eingaben prüfen' : 'ROI = Gewinn / Investition'}
        />
      )
    },
    roe: {
      title: "ROE (Eigenkapitalrendite)",
      tooltip: "Return on Equity = FCF Jahr 1 / eingesetztes Eigenkapital. Zeigt die Rendite auf das tatsächlich eingesetzte Eigenkapital (ohne Fremdkapital).",
      content: (
        <Key
          label="Allgemeiner return on equity"
          value={roeValue === null ? '—' : formatPercent(roeValue)}
          sub={`Basis: EK₀ ${fmtEUR((nkInLoan ? V0 : V0 + NKabs) - L0)}`}
          tooltip={'ROE = FCF Jahr 1 / eingesetztes Eigenkapital (EK₀)'}
        />
      )
    },
    miete: {
      title: "Angenommene Miete",
      tooltip: "Unterstellte Nettokaltmiete (€/m²) im ersten Jahr. Konservativ angesetzt - Auslastung und Leerstandsrisiko werden nicht berücksichtigt.",
      content: (
        <Key
          label="Unterstellt"
          value={`${fmt(avgMiete)} €/m² netto kalt`}
          sub="Auslastung und Leerstandsrisiko nicht berücksichtigt"
          tooltip="100% Auslastung, kein Leerstandsrisiko"
        />
      )
    },
    marktmiete: {
      title: "Marktmiete Salzburg",
      tooltip: "Referenz-Marktmiete (€/m²) für den Standort Salzburg. Konservative Annahme - tatsächliche Mieten liegen häufig darüber.",
      content: (
        <Key
          label="Basierend auf Markt"
          value={`${cfg.marktMiete} €/m²`}
          sub="tatsächlich häufig darüber"
          tooltip="tatsächlich häufig darüber"
        />
      )
    },
    // Neue Cards
    kaufpreis: {
      title: "Kaufpreis & NK",
      tooltip: "Gesamtinvestition inklusive Nebenkosten (Notar, Grunderwerbsteuer, Makler). Die tatsächlichen Kosten für den Erwerb der Immobilie.",
      content: (
        <Key
          label="Gesamtinvestition"
          value={fmtEUR(cfg.kaufpreis * (1 + cfg.nebenkosten))}
          sub={`Kaufpreis: ${fmtEUR(cfg.kaufpreis)} + NK: ${fmtEUR(cfg.kaufpreis * cfg.nebenkosten)}`}
          tooltip="Gesamtinvestition inklusive Nebenkosten"
        />
      )
    },
    darlehen: {
      title: "Darlehen",
      tooltip: "Fremdkapital und Zinsbelastung. Der geliehene Betrag, der durch Mieteinnahmen zurückgezahlt werden muss.",
      content: (
        <Key
          label="Fremdkapital"
          value={fmtEUR(fin.darlehen)}
          sub={`Zins: ${Math.round(fin.zinssatz * 1000) / 10}% | Tilgung: ${Math.round(cfg.tilgung * 100)}%`}
          tooltip="Darlehensbetrag und Zins-/Tilgungsrate"
        />
      )
    },
    annuitaet: {
      title: "Annuität",
      tooltip: "Jährliche Belastung aus dem Darlehen. Setzt sich zusammen aus Zinsen und Tilgung - der Betrag, der jährlich an die Bank gezahlt werden muss.",
      content: (
        <Key
          label="Jährliche Belastung"
          value={fmtEUR(fin.annuitaet)}
          sub={`Zins: ${fmtEUR(fin.darlehen * fin.zinssatz)} + Tilgung: ${fmtEUR(fin.darlehen * cfg.tilgung)}`}
          tooltip="Jährliche Belastung aus Zins und Tilgung"
        />
      )
    },
    laufzeit: {
      title: "Laufzeit",
      tooltip: "Zeit bis zur vollständigen Tilgung des Darlehens. Wird automatisch berechnet basierend auf der Annuität und dem Darlehensbetrag.",
      content: (
        <Key
          label="Tilgungsdauer"
          value={laufzeitAuto ? `${laufzeitAuto} Jahre` : "–"}
          sub="Automatisch berechnet aus Annuität"
          tooltip="Zeit bis zur vollständigen Tilgung des Darlehens"
        />
      )
    },
    einnahmen: {
      title: "Einnahmen J1",
      tooltip: "Bruttoeinnahmen im ersten Jahr. Alle Mieteinnahmen vor Abzug von Kosten, basierend auf der Fläche und der angenommenen Miete.",
      content: (
        <Key
          label="Bruttoeinnahmen"
          value={fmtEUR(fin.einnahmenJ1)}
          sub={`${totalFlaeche} m² × ${fmt(avgMiete)} €/m² × 12 Monate`}
          tooltip="Jährliche Mieteinnahmen im ersten Jahr"
        />
      )
    },
    ausgaben: {
      title: "Ausgaben J1",
      tooltip: "Jährliche Ausgaben im ersten Jahr. Setzt sich zusammen aus der Annuität (Zins + Tilgung) und den Betriebskosten.",
      content: (
        <Key
          label="Jährliche Ausgaben"
          value={fmtEUR(fin.annuitaet + bkJ1)}
          sub={`Annuität: ${fmtEUR(fin.annuitaet)} + BK: ${fmtEUR(bkJ1)}`}
          tooltip="Jährliche Belastung aus Darlehen und Betriebskosten"
        />
      )
    },
    bewirtschaftung: {
      title: "Bewirtschaftung",
      tooltip: "Betriebskosten und Verwaltung der Immobilie. Kosten für Instandhaltung, Versicherung, Hausmeister, etc. pro Quadratmeter und Monat.",
      content: (
        <Key
          label="Betriebskosten"
          value={fmtEUR(bkJ1)}
          sub={`${fmt(fin.bkM2)} €/m²/Monat × ${totalFlaeche} m² × 12`}
          tooltip="Jährliche Betriebskosten basierend auf Fläche"
        />
      )
    },
    wertsteigerung: {
      title: "Wertsteigerung",
      tooltip: "Jährliche Wertsteigerung der Immobilie. Konservative Annahme für die Wertentwicklung der Immobilie über die Zeit.",
      content: (
        <Key
          label="Jährliche Steigerung"
          value={`${Math.round(cfg.wertSteigerung * 100)}%`}
          sub={`Nach 10 Jahren: ${fmtEUR(cfg.kaufpreis * Math.pow(1 + cfg.wertSteigerung, 10))}`}
          tooltip="Jährliche Wertsteigerung und Wert nach 10 Jahren"
        />
      )
    },
    flaeche: {
      title: "Flächenaufteilung",
      tooltip: "Verteilung der Nutzflächen auf die verschiedenen Einheiten. Zeigt die Gesamtfläche und durchschnittliche Größe der Einheiten.",
      content: (
        <Key
          label="Gesamtfläche"
          value={`${totalFlaeche} m²`}
          sub={`${cfg.units.length} Einheiten, Ø ${fmt(totalFlaeche / cfg.units.length)} m²`}
          tooltip="Gesamtfläche und durchschnittliche Einheitsgröße"
        />
      )
    },
    mietrendite: {
      title: "Mietrendite",
      tooltip: "Bruttomietrendite vor Abzug aller Kosten. Zeigt die Rendite auf die Investition, bevor Kosten abgezogen werden.",
      content: (
        <Key
          label="Bruttomietrendite"
          value={`${Math.round((fin.einnahmenJ1 / (cfg.kaufpreis * (1 + cfg.nebenkosten))) * 100)}%`}
          sub={`${fmtEUR(fin.einnahmenJ1)} / ${fmtEUR(cfg.kaufpreis * (1 + cfg.nebenkosten))}`}
          tooltip="Bruttomietrendite vor Abzug aller Kosten"
        />
      )
    },
    nettomietrendite: {
      title: "Nettomietrendite",
      tooltip: "Nettomietrendite nach Abzug von Betriebskosten und Leerstandsrisiko (ohne Finanzierungskosten). Zeigt die tatsächliche Rendite aus dem Immobilienbetrieb.",
      content: (
        <Key
          label="Nettomietrendite"
          value={`${Math.round((Math.max(0, fin.einnahmenJ1 * (1 - fin.leerstand) - bkJ1) / (cfg.kaufpreis * (1 + cfg.nebenkosten))) * 100)}%`}
          sub={`Netto: ${fmtEUR(Math.max(0, fin.einnahmenJ1 * (1 - fin.leerstand) - bkJ1))} / Investition: ${fmtEUR(cfg.kaufpreis * (1 + cfg.nebenkosten))}`}
          tooltip="Nettomietrendite nach Betriebskosten und Leerstand (ohne Finanzierungskosten)"
        />
      )
    },
    steuer: {
      title: "Steuerbelastung",
      tooltip: "Jährliche Steuerbelastung aus den Mieteinnahmen. Einkommensteuer auf die Gewinne und Abschreibungen (AfA) zur Steuerersparnis.",
      content: (
        <Key
          label="Einkommensteuer"
          value={fin.steuerRate > 0 ? `${Math.round(fin.steuerRate * 100)}%` : "0%"}
          sub={`AfA: ${fmtEUR(cfg.kaufpreis * fin.afaRate)} p.a.`}
          tooltip="Steuersatz und Abschreibungsbetrag"
        />
      )
    },
    leerstand: {
      title: "Leerstandsrisiko",
      tooltip: "Unterstelltes Leerstandsrisiko der Immobilie. Prozentsatz der Fläche, der im Durchschnitt leer steht und keine Mieteinnahmen generiert.",
      content: (
        <Key
          label="Leerstandsrisiko"
          value={`${Math.round(fin.leerstand * 100)}%`}
          sub={`Reduzierte Einnahmen: ${fmtEUR(fin.einnahmenJ1 * (1 - fin.leerstand))}`}
          tooltip="Unterstelltes Leerstandsrisiko und reduzierte Einnahmen"
        />
      )
    },
    wachstum: {
      title: "Einnahmenwachstum",
      tooltip: "Jährliches Wachstum der Mieteinnahmen. Annahme für die Steigerung der Mieten über die Zeit (Inflation, Marktentwicklung).",
      content: (
        <Key
          label="Mietwachstum"
          value={`${Math.round(fin.einnahmenWachstum * 100)}% p.a.`}
          sub={`Nach 5 Jahren: ${fmtEUR(fin.einnahmenJ1 * Math.pow(1 + fin.einnahmenWachstum, 5))}`}
          tooltip="Jährliches Wachstum der Mieteinnahmen"
        />
      )
    },
    bkwachstum: {
      title: "BK-Wachstum",
      tooltip: "Jährliches Wachstum der Betriebskosten. Annahme für die Steigerung der Bewirtschaftungskosten über die Zeit (Inflation, steigende Energiekosten).",
      content: (
        <Key
          label="BK-Wachstum"
          value={`${Math.round(fin.bkWachstum * 100)}% p.a.`}
          sub={`Nach 5 Jahren: ${fmtEUR(bkJ1 * Math.pow(1 + fin.bkWachstum, 5))}`}
          tooltip="Jährliches Wachstum der Betriebskosten"
        />
      )
    },
    marktpreis: {
      title: "Marktpreis",
      tooltip: "Vergleich des Kaufpreises mit den Marktpreisen im Stadtteil. Zeigt, ob das Objekt über oder unter dem Marktniveau liegt.",
      content: (
        <Key
          label="Marktpreis"
          value={`${fmt(avgPreisStadtteil)} €/m²`}
          sub={`${kaufpreisProM2 < avgPreisStadtteil ? 'Unter' : 'Über'} Markt: ${Math.round(Math.abs((kaufpreisProM2 - avgPreisStadtteil) / avgPreisStadtteil * 100))}%`}
          tooltip="Vergleich des Kaufpreises mit dem Marktpreis"
        />
      )
    },
    irr: {
      title: "IRR",
      tooltip: "Internal Rate of Return (Interne Rendite). Zeigt die durchschnittliche jährliche Rendite über den gesamten Betrachtungszeitraum, basierend auf allen Cashflows.",
      content: (
        <Key
          label="Internal Rate of Return"
          value={irrBasis ? `${Math.round(irrBasis * 100)}%` : "–"}
          sub="Basierend auf 15-Jahres-Plan"
          tooltip="Internal Rate of Return basierend auf Cashflows"
        />
      )
    },
    debug: {
      title: "Debug: Nettomietrendite",
      tooltip: "Einzelne Werte zur Überprüfung der korrigierten Berechnung der Nettomietrendite. Hilft bei der Fehlersuche.",
      content: (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Brutto-Einnahmen J1:</span>
            <span className="font-medium">{fmtEUR(fin.einnahmenJ1)}</span>
          </div>
          <div className="flex justify-between">
            <span>Leerstand ({Math.round(fin.leerstand * 100)}%):</span>
            <span className="font-medium">-{fmtEUR(fin.einnahmenJ1 * fin.leerstand)}</span>
          </div>
          <div className="flex justify-between">
            <span>Netto-Einnahmen:</span>
            <span className="font-medium">{fmtEUR(fin.einnahmenJ1 * (1 - fin.leerstand))}</span>
          </div>
          <div className="flex justify-between">
            <span>Betriebskosten:</span>
            <span className="font-medium">-{fmtEUR(bkJ1)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Netto-Ertrag:</span>
            <span className="font-medium">{fmtEUR(Math.max(0, fin.einnahmenJ1 * (1 - fin.leerstand) - bkJ1))}</span>
          </div>
          <div className="flex justify-between">
            <span>Gesamtinvestition:</span>
            <span className="font-medium">{fmtEUR(cfg.kaufpreis * (1 + cfg.nebenkosten))}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Nettomietrendite:</span>
            <span className="font-medium">{Math.round((Math.max(0, fin.einnahmenJ1 * (1 - fin.leerstand) - bkJ1) / (cfg.kaufpreis * (1 + cfg.nebenkosten))) * 100)}%</span>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Einstellungs-Panel */}
      {open && <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setOpen(false)} />}
      <div
        className={`fixed inset-y-0 left-0 z-60 ${
          fullscreen 
            ? 'w-full max-w-none' 
            : `w-[${sidebarWidth}px] max-w-[95vw]`
        } border-r border-slate-200 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 shadow-2xl transform transition-all duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: fullscreen ? '100%' : `${sidebarWidth}px` }}
      >
        {/* Resize Handle */}
        {!fullscreen && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors duration-200"
            onMouseDown={handleResizeStart}
          />
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFullscreen((f) => !f)}
              className="w-10 h-10 rounded-xl text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
              aria-label={fullscreen ? "Vollbild beenden" : "Vollbild aktivieren"}
            >
              {fullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Einstellungen
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case
              </p>
          </div>
          </div>
          <div className="flex items-center gap-3">
            {scenario !== "base" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyFromBase}
                className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Aus Base Case übernehmen
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className={`flex-1 space-y-6 overflow-y-auto pr-2 ${fullscreen ? 'pb-56' : 'pb-56'}`}>
                                      <SettingSection title="Objekt" icon={Building} fullscreen={fullscreen}>
               {/* Objekttyp-Auswahl */}
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Objekttyp</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                     {(['zinshaus', 'wohnung', 'gewerbe', 'hotel', 'büro', 'lager', 'sonstiges'] as ObjektTyp[]).map((typ) => (
                       <button
                         key={typ}
                         onClick={() => setCfg({ ...cfg, objektTyp: typ })}
                         className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all duration-200 ${
                           cfg.objektTyp === typ
                             ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                             : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                         }`}
                       >
                         {typ.charAt(0).toUpperCase() + typ.slice(1)}
            </button>
                     ))}
          </div>
        </div>

                 {/* Baujahr und Bauart */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="space-y-2">
                     <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Baujahr</label>
                     <input
                       type="number"
                       value={cfg.baujahr}
                       onChange={(e) => setCfg({ ...cfg, baujahr: parseInt(e.target.value) || 0 })}
                                                className="w-full px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                       placeholder="z.B. 1990"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Bauart</label>
                     <div className="grid grid-cols-2 gap-2">
                       {(['bestand', 'neubau'] as const).map((art) => (
                         <button
                           key={art}
                           onClick={() => setCfg({ ...cfg, bauart: art })}
                                                    className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all duration-200 ${
                           cfg.bauart === art
                             ? 'bg-green-500 text-white border-green-500 shadow-md'
                             : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                           }`}
                         >
                           {art === 'bestand' ? 'Bestand' : 'Neubau'}
                         </button>
                       ))}
                     </div>
                   </div>
                 </div>
                 
                 {/* Energiewerte */}
                 <div className="space-y-3">
                   <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 border-b pb-2">Energiewerte</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Energiekennzahl (kWh/m²a)</label>
                       <input
                         type="number"
                         value={cfg.energiewerte.energiekennzahl}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, energiekennzahl: parseInt(e.target.value) || 0 } 
                         })}
                         className="w-full px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         placeholder="z.B. 120"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Heizung</label>
                       <select
                         value={cfg.energiewerte.heizung}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, heizung: e.target.value } 
                         })}
                         className="w-full px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                       >
                         <option value="Gas">Gas</option>
                         <option value="Öl">Öl</option>
                         <option value="Fernwärme">Fernwärme</option>
                         <option value="Wärmepumpe">Wärmepumpe</option>
                         <option value="Pellet">Pellet</option>
                         <option value="Sonstiges">Sonstiges</option>
                       </select>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Dachung</label>
                       <select
                         value={cfg.energiewerte.dachung}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, dachung: e.target.value } 
                         })}
                         className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                       >
                         <option value="Ziegel">Ziegel</option>
                         <option value="Beton">Beton</option>
                         <option value="Metall">Metall</option>
                         <option value="Dachpappe">Dachpappe</option>
                         <option value="Sonstiges">Sonstiges</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Fenster</label>
                       <select
                         value={cfg.energiewerte.fenster}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, fenster: e.target.value } 
                         })}
                         className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                       >
                         <option value="Einfachverglasung">Einfachverglasung</option>
                         <option value="Doppelverglasung">Doppelverglasung</option>
                         <option value="Dreifachverglasung">Dreifachverglasung</option>
                         <option value="Sonstiges">Sonstiges</option>
                       </select>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Wärmedämmung</label>
                     <select
                       value={cfg.energiewerte.waermedaemmung}
                       onChange={(e) => setCfg({ 
                         ...cfg, 
                         energiewerte: { ...cfg.energiewerte, waermedaemmung: e.target.value } 
                       })}
                       className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                     >
                       <option value="Keine">Keine</option>
                       <option value="Teilweise">Teilweise</option>
                       <option value="Vollständig">Vollständig</option>
                       <option value="Hochwertig">Hochwertig</option>
                     </select>
                   </div>
                 </div>
                 
                 {/* Sanierungen */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sanierungen</label>
                   <div className="space-y-2">
                     {cfg.sanierungen.map((sanierung, idx) => (
                       <div key={idx} className="flex gap-2">
                         <input
                           className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                           placeholder="z.B. Heizung 2015, Fenster 2018"
                           value={sanierung}
                           onChange={(e) => {
                             const newSanierungen = [...cfg.sanierungen];
                             newSanierungen[idx] = e.target.value;
                             setCfg({ ...cfg, sanierungen: newSanierungen });
                           }}
                         />
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => {
                             const newSanierungen = cfg.sanierungen.filter((_, i) => i !== idx);
                             setCfg({ ...cfg, sanierungen: newSanierungen });
                           }}
                         >
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCfg({ ...cfg, sanierungen: [...cfg.sanierungen, ''] })}
                       className="w-full"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Sanierung hinzufügen
                     </Button>
                   </div>
                 </div>
                 
                 {/* Einheiten-Verwaltung nur bei bestimmten Objekttypen */}
                 {(cfg.objektTyp === 'zinshaus' || cfg.objektTyp === 'hotel' || cfg.objektTyp === 'büro') && (
                   <>
                     <div className="border-t pt-4">
                       <h4 className="font-medium text-sm mb-3">Einheiten verwalten</h4>
                <Button variant="outline" size="sm" onClick={addUnit} className="gap-1">
                  <Plus className="w-4 h-4" /> Einheit
                </Button>
                       
                       {scenario !== "base" && (
                         <div className="mt-3 grid grid-cols-2 gap-2 items-end">
                           <NumField
                             label="Einnahmen-Boost %"
                             value={(cfg.einnahmenBoostPct || 0) * 100}
                             step={0.5}
                             onChange={(n) => setCfg({ ...cfg, einnahmenBoostPct: n / 100 })}
                             suffix="%"
                           />
                           <Button
                             variant="secondary"
                             onClick={() => {
                               const factor = 1 + (cfg.einnahmenBoostPct || 0);
                               setCfg({
                                 ...cfg,
                                 units: cfg.units.map((u) => ({ ...u, miete: u.miete * factor })),
                               });
                             }}
                           >
                             Anwenden
                           </Button>
                         </div>
                       )}
                       
                {cfg.units.map((u, idx) => (
                         <div key={idx} className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                           <div className="flex items-center justify-between">
                             <div className="text-sm font-medium">Top {idx + 1}</div>
                             <Button variant="ghost" size="icon" onClick={() => removeUnit(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             <NumField label="m²" value={u.flaeche} onChange={(n) => updateUnit(idx, { ...u, flaeche: n })} />
                             <NumField label="Miete €/m²" value={u.miete} step={0.5} onChange={(n) => updateUnit(idx, { ...u, miete: n })} />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-2">
                               <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wohnungsart</label>
                               <select
                                 value={u.typ}
                                 onChange={(e) => updateUnit(idx, { ...u, typ: e.target.value as 'wohnung' | 'gewerbe' })}
                                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                               >
                                 <option value="wohnung">Wohnung</option>
                                 <option value="gewerbe">Gewerbe</option>
                               </select>
                             </div>
                             <input
                               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                               placeholder="Stockwerk (z.B. EG, 1. OG)"
                               value={u.stockwerk}
                               onChange={(e) => updateUnit(idx, { ...u, stockwerk: e.target.value })}
                             />
                           </div>
                           <input
                             className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
                             placeholder="Bezeichnung (z.B. Wohnung 1, Büro EG)"
                             value={u.bezeichnung}
                             onChange={(e) => updateUnit(idx, { ...u, bezeichnung: e.target.value })}
                             />
                  </div>
                ))}
                     </div>
                   </>
                 )}
                 
                 {/* Einzelne Objekte (Wohnung, Gewerbe, etc.) */}
                 {(cfg.objektTyp === 'wohnung' || cfg.objektTyp === 'gewerbe' || cfg.objektTyp === 'lager' || cfg.objektTyp === 'sonstiges') && (
                   <div className="border-t pt-4">
                     <h4 className="font-medium text-sm mb-3">Objekt-Details</h4>
                     <div className="grid grid-cols-2 gap-3">
                       <NumField 
                         label="Gesamtfläche (m²)" 
                         value={cfg.units.length > 0 ? cfg.units[0].flaeche : 0} 
                         onChange={(n) => {
                           if (cfg.units.length > 0) {
                             updateUnit(0, { ...cfg.units[0], flaeche: n });
                           } else {
                             setCfg({ ...cfg, units: [{ 
                               flaeche: n, 
                               miete: avgMiete, 
                               typ: cfg.objektTyp === 'wohnung' ? 'wohnung' : 'gewerbe', 
                               stockwerk: 'Objekt', 
                               bezeichnung: cfg.objektTyp.charAt(0).toUpperCase() + cfg.objektTyp.slice(1) 
                             }] });
                           }
                         }} 
                       />
                       <NumField 
                         label="Miete (€/m²)" 
                         value={cfg.units.length > 0 ? cfg.units[0].miete : avgMiete} 
                         step={0.5} 
                         onChange={(n) => {
                           if (cfg.units.length > 0) {
                             updateUnit(0, { ...cfg.units[0], miete: n });
                           } else {
                             setCfg({ ...cfg, units: [{ 
                               flaeche: cfg.units.length > 0 ? cfg.units[0].flaeche : 0, 
                               miete: n, 
                               typ: cfg.objektTyp === 'wohnung' ? 'wohnung' : 'gewerbe', 
                               stockwerk: 'Objekt', 
                               bezeichnung: cfg.objektTyp.charAt(0).toUpperCase() + cfg.objektTyp.slice(1) 
                             }] });
                           }
                         }} 
                       />
                     </div>
                   </div>
                 )}
               </div>
            </SettingSection>

            <SettingSection title="Finanzierung" icon={PiggyBank} fullscreen={fullscreen}>
              <div className="grid grid-cols-2 gap-3">
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
                <NumField label="Laufzeit (J)" value={laufzeitAuto} readOnly />
                <NumField label="Zins (Darlehen) %" value={fin.zinssatz * 100} step={0.1} onChange={(n) => setFin({ ...fin, zinssatz: n / 100 })} suffix="%" />
                <NumField label="Darlehen (€)" value={fin.darlehen} readOnly />
                <NumField label="Annuität (€ p.a.)" value={fin.annuitaet} readOnly />
              </div>
            </SettingSection>

            <SettingSection title="Steuer" icon={Percent} fullscreen={fullscreen}>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="ESt-Satz %" value={fin.steuerRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, steuerRate: n / 100 })} suffix="%" />
                <NumField label="AfA % vom KP" value={fin.afaRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, afaRate: n / 100 })} suffix="%" />
                <NumField label="AfA (€ p.a.)" value={cfg.kaufpreis * fin.afaRate} readOnly />
              </div>
            </SettingSection>

            <SettingSection title="Kosten & Einnahmen" icon={Wallet} fullscreen={fullscreen}>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="BK €/m²/Monat" value={fin.bkM2} step={0.1} onChange={(n) => setFin({ ...fin, bkM2: n })} />
                <NumField label="BK-Steigerung %" value={fin.bkWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, bkWachstum: n / 100 })} suffix="%" />
                <NumField label="Jährliche Bewirtschaftungskosten (€)" value={bkJ1} readOnly />
                <NumField label="Leerstand %" value={fin.leerstand * 100} step={0.1} onChange={(n) => setFin({ ...fin, leerstand: n / 100 })} suffix="%" />
                <NumField label="Einnahmen J1 (€)" value={fin.einnahmenJ1} readOnly />
                <NumField label="Einnahmen-Wachstum %" value={fin.einnahmenWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, einnahmenWachstum: n / 100 })} suffix="%" />
              </div>
            </SettingSection>

            <SettingSection title="Marktannahmen" icon={TrendingUp} fullscreen={fullscreen}>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Marktmiete (€/m²)" value={cfg.marktMiete} step={0.5} onChange={(n) => setCfg({ ...cfg, marktMiete: n })} />
                <NumField label="Wertsteigerung %" value={cfg.wertSteigerung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, wertSteigerung: n / 100 })} suffix="%" />
                <SelectField
                  label="Stadtteil"
                  value={cfg.stadtteil}
                  options={DISTRICT_PRICES[cfg.bauart].map((d) => d.ort)}
                  onChange={(s) => setCfg({ ...cfg, stadtteil: s as District })}
                />
              </div>
            </SettingSection>

            <SettingSection title="Upside-Potenzial" icon={TrendingUp} fullscreen={fullscreen}>
              <UpsideForm
                scenarios={upsideState.scenarios}
                add={upsideState.add}
                update={upsideState.update}
                duplicate={upsideState.duplicate}
                remove={upsideState.remove}
              />
            </SettingSection>

            <SettingSection title="Uploads" icon={Upload} fullscreen={fullscreen}>
              <div className="space-y-6">
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
                           className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500"
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
                          className="flex items-center justify-between px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      >
                        <span className="truncate flex-1">{pdf.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => removePdf(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>


              </div>
            </SettingSection>

            <SettingSection title="Projekt-Checkliste" icon={CheckCircle2} fullscreen={fullscreen}>
              <div className="space-y-4">
                {/* Fortschrittsbalken */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Dokumente vervollständigt</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{docsPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${docsPercent}%` }}
                    />
                  </div>
                </div>

                {/* Checkliste */}
                <div className="grid grid-cols-1 gap-3">
                    {docChecklist.map((doc) => (
                    <button
                      key={doc.key}
                      onClick={() => toggleDocument(doc.key)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                        doc.present 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        doc.present 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                      }`}>
                        {doc.present ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-sm font-medium text-left flex-1 ${
                        doc.present 
                          ? 'text-emerald-800 dark:text-emerald-200' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {doc.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Status-Info */}
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                  {docsPercent === 100 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Alle Dokumente sind vollständig!
                    </span>
                  ) : (
                    <span>
                      {docChecklist.filter(d => d.present).length} von {docChecklist.length} Dokumenten vorhanden
                    </span>
                  )}
                </div>
              </div>
            </SettingSection>
          </div>
          
          {/* Feste Button-Leiste am unteren Rand */}
          <div className={`border-t border-slate-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 ${
            fullscreen ? 'fixed bottom-0 left-0 right-0 h-24 flex items-start justify-center backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 pt-4' : 'absolute bottom-0 left-0 right-0 h-32 flex items-start justify-center pt-4'
          }`}>
            <div className={`flex flex-col gap-4 ${
              fullscreen ? 'w-full max-w-6xl mx-auto px-6' : 'w-full px-6'
            }`}>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
                  onClick={resetProject}
                >
                  <RotateCcw className="w-4 h-4" /> Neues Projekt
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
                  onClick={saveProject}
                >
                  Speichern
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
                  onClick={exportProject}
                >
                  <FileDown className="w-4 h-4" /> Download
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105" 
                  onClick={triggerImport}
                >
                  <FilePlus className="w-4 h-4" /> Upload
                </Button>
                <Button 
                  className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-200 hover:scale-105 shadow-lg"
                  onClick={() => setOpen(false)}
                >
                  Fertig
                </Button>
              </div>
            </div>
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

       {/* Card-Selector Modal */}
       {showCardSelector && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-md shadow-xl w-[min(90%,800px)] max-h-[90vh] space-y-4">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold">Cards verwalten</h2>
               <Button onClick={() => setShowCardSelector(false)}>Schließen</Button>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
               {Object.entries(AVAILABLE_CARDS).map(([key, card]) => (
                 <label
                   key={key}
                   className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                     selectedCards.includes(key)
                       ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                       : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                   }`}
                 >
                   <input
                     type="checkbox"
                     checked={selectedCards.includes(key)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setSelectedCards(prev => [...prev, key]);
                       } else {
                         setSelectedCards(prev => prev.filter(c => c !== key));
                       }
                     }}
                     className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                   />
                   <div className="flex-1">
                     <div className="font-medium text-sm">{card.title}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.tooltip}</div>
                   </div>
                 </label>
               ))}
             </div>
             
             <div className="flex items-center justify-between pt-4 border-t">
               <div className="text-sm text-slate-600 dark:text-slate-400">
                 {selectedCards.length} von {Object.keys(AVAILABLE_CARDS).length} Cards ausgewählt
               </div>
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setSelectedCards(Object.keys(AVAILABLE_CARDS))}
                 >
                   Alle auswählen
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setSelectedCards([])}
                 >
                   Alle abwählen
                 </Button>
               </div>
             </div>
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
        projectName={currentProjectName}
      />

      <main className="pt-24">
        {/* Right Side Navigation */}
        <div className="fixed right-3 top-48 z-30">
          <div className="bg-black dark:bg-white rounded-full border border-gray-700 dark:border-gray-300 shadow-lg p-1.5">
            <div className="space-y-2">
              <button
                onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                  currentSection === 'hero' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title="Hero"
              >
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  1. Hero
                </span>
              </button>
              <button
                onClick={() => document.getElementById('cards')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                  currentSection === 'cards' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title="Cards"
              >
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  2. Cards
                </span>
              </button>
              <button
                onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                  currentSection === 'story' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title="Story"
              >
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  3. Story
                </span>
              </button>
              <button
                onClick={() => document.getElementById('charts')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                  currentSection === 'charts' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title="Charts"
              >
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  4. Charts
                </span>
              </button>
              <button
                onClick={() => document.getElementById('tips')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                  currentSection === 'tips' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title="Tips"
              >
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  5. Tips
                </span>
              </button>
              <button
                onClick={() => document.getElementById('upside')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                  currentSection === 'upside' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title="Upside"
              >
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  6. Upside
                </span>
              </button>
              {showCompare && (
                <button
                  onClick={() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 block mx-auto relative group ${
                    currentSection === 'compare' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-600'
                  }`}
                  title="Marktvergleich"
                >
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    7. Marktvergleich
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Hero */}
      <section id="hero" className="max-w-6xl mx-auto px-6 pb-6">
        <div className="min-w-0">
            {editingTitle ? (
              <div className="space-y-3">
                <input
                  className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 text-3xl md:text-4xl font-bold tracking-tight focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                  value={titleText}
                  placeholder="Titel eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, title: e.target.value }))}
                />
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => setEditingTitle(false)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200">Fertig</Button>
                   <Button 
                     size="sm" 
                     variant="default"
                     onClick={() => setEditingTitle(false)}
                     className="gap-2 bg-blue-500 hover:bg-blue-600 text-white border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 shadow-sm"
                   >
                     <CheckCircle2 className="w-4 h-4" />
                     Speichern
                   </Button>
                   <Button 
                     size="sm" 
                     variant="outline"
                     onClick={() => setTexts(defaultTexts)}
                     className="gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-4 py-2 font-medium transition-all duration-200"
                   >
                     <RotateCcw className="w-4 h-4" />
                     KI-Text neu generieren
                   </Button>
                </div>
              </div>
            ) : (
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
                {titleText}
                <button
                  onClick={() => setEditingTitle(true)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  aria-label="Titel bearbeiten"
                >
                  <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </h1>
            )}

            {/* Adresse und Karte */}
            <AddressWithMap cfg={cfg} setCfg={setCfg} />
            {editingSubtitle ? (
              <div className="mt-3 space-y-3 max-w-3xl">
                <textarea
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 resize-none"
                  rows={3}
                  value={subtitleText}
                  placeholder="Beschreibung eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, subtitle: e.target.value }))}
                />
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => setEditingSubtitle(false)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200">Fertig</Button>
                   <Button 
                     size="sm" 
                     variant="outline"
                     onClick={() => setTexts(prev => ({ ...prev, subtitle: defaultTexts.subtitle }))}
                     className="gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-4 py-2 font-medium transition-all duration-200"
                   >
                     <RotateCcw className="w-4 h-4" />
                     KI-Text neu generieren
                   </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-3xl flex items-start gap-2 text-lg leading-relaxed">
                {subtitleText}
                <button
                  onClick={() => setEditingSubtitle(true)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  aria-label="Text bearbeiten"
                >
                  <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Badge className={`${CASE_INFO[scenario].color} text-white rounded-full px-3 py-1 font-medium shadow-sm`}>{caseLabel}</Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 font-medium border-0">{totalFlaeche} m² gesamt</Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 font-medium border-0">{fmtEUR(cfg.kaufpreis)} Kaufpreis</Badge>
              <Badge variant="secondary" className="bg-gray-700 dark:bg-gray-800 text-gray-300 rounded-full px-3 py-1 font-medium border-0">{fmt(Math.round(kaufpreisProM2))} €/m² Kaufpreis</Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 font-medium border-0">Ø Lagepreis {cfg.stadtteil}: {fmt(avgPreisStadtteil)} €/m²</Badge>
               <Button 
                 size="sm" 
                 variant="outline"
                 onClick={updateAllTextsWithAI}
                 className="gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl px-4 py-2 font-medium transition-all duration-200"
               >
                 <RotateCcw className="w-4 h-4" />
                 Alle Texte KI-aktualisieren
               </Button>
            </div>
             
                          {/* Objekt-Übersicht */}
             <div className="mt-6 -mx-6 p-6 bg-gray-50 dark:bg-gray-100 border-y border-gray-200 dark:border-gray-300 shadow-sm">
               <h4 className="font-semibold text-lg mb-6 text-gray-900 dark:text-gray-800 flex items-center gap-3">
                 <Building className="w-6 h-6 text-blue-600" />
                 Objekt-Übersicht
               </h4>
               
                                {/* Hauptinformationen */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Typ</div>
                     <div className="text-sm font-semibold text-gray-900 capitalize">{cfg.objektTyp}</div>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Baujahr</div>
                     <div className="text-sm font-semibold text-gray-900">{cfg.baujahr}</div>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Bauart</div>
                     <div className="text-sm font-semibold text-gray-900 capitalize">{cfg.bauart}</div>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Energie</div>
                     <div className="text-sm font-semibold text-gray-900">{cfg.energiewerte.energiekennzahl} kWh/m²a</div>
          </div>
        </div>

                                {/* Energiewerte */}
                 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                   <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Energiewerte</div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                     <div className="flex flex-col">
                       <span className="text-gray-500 text-xs mb-1">Heizung</span>
                       <span className="font-medium text-gray-900">{cfg.energiewerte.heizung}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-gray-500 text-xs mb-1">Dachung</span>
                       <span className="font-medium text-gray-900">{cfg.energiewerte.dachung}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-gray-500 text-xs mb-1">Fenster</span>
                       <span className="font-medium text-gray-900">{cfg.energiewerte.fenster}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-gray-500 text-xs mb-1">Dämmung</span>
                       <span className="font-medium text-gray-900">{cfg.energiewerte.waermedaemmung}</span>
                     </div>
                   </div>
                 </div>
                 
                                  {/* Sanierungen */}
                 {cfg.sanierungen.length > 0 && cfg.sanierungen.some(s => s.trim() !== '') && (
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Sanierungen</div>
                     <div className="text-sm text-gray-900">
                       {cfg.sanierungen.filter(s => s.trim() !== '').join(' • ')}
                     </div>
                   </div>
                 )}
                
                                  {/* Einheiten-Übersicht */}
                 {(cfg.objektTyp === 'zinshaus' || cfg.objektTyp === 'hotel' || cfg.objektTyp === 'büro') ? (
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Einheiten-Übersicht</div>
                     
                                            {/* Zusammenfassung */}
                       <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
                         <div className="text-center">
                           <div className="text-xl font-bold text-blue-600">{cfg.units.length}</div>
                           <div className="text-xs text-gray-600">Gesamt</div>
                         </div>
                         <div className="text-center">
                           <div className="text-xl font-bold text-green-600">{cfg.units.filter(u => u.typ === 'wohnung').length}</div>
                           <div className="text-xs text-gray-600">Wohnungen</div>
                         </div>
                         <div className="text-center">
                           <div className="text-xl font-bold text-orange-600">{cfg.units.filter(u => u.typ === 'gewerbe').length}</div>
                           <div className="text-xs text-gray-600">Gewerbe</div>
                         </div>
                       </div>
                     
                     {/* Detaillierte Einheiten */}
                     <div className="space-y-3">
                       {/* Wohnungen */}
                       {cfg.units.filter(u => u.typ === 'wohnung').length > 0 && (
                         <div className="space-y-2">
                           <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                             Wohnungen ({cfg.units.filter(u => u.typ === 'wohnung').length})
                           </div>
                           <div className="grid gap-2">
                             {cfg.units.filter(u => u.typ === 'wohnung').map((unit, idx) => (
                               <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                 <div className="flex items-center gap-2">
                                   <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{unit.bezeichnung}</span>
                                   <span className="text-xs text-slate-500 dark:text-slate-400">({unit.stockwerk})</span>
                                 </div>
                                 <div className="text-right">
                                   <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{unit.flaeche} m²</div>
                                   <div className="text-xs text-slate-500 dark:text-slate-400">{fmt(unit.miete)} €/m²</div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       {/* Gewerbeeinheiten */}
                       {cfg.units.filter(u => u.typ === 'gewerbe').length > 0 && (
                         <div className="space-y-2">
                           <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                             <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                             Gewerbeeinheiten ({cfg.units.filter(u => u.typ === 'gewerbe').length})
                           </div>
                           <div className="grid gap-2">
                             {cfg.units.filter(u => u.typ === 'gewerbe').map((unit, idx) => (
                               <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                 <div className="flex items-center gap-2">
                                   <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{unit.bezeichnung}</span>
                                   <span className="text-xs text-slate-500 dark:text-slate-400">({unit.stockwerk})</span>
                                 </div>
                                 <div className="text-right">
                                   <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{unit.flaeche} m²</div>
                                   <div className="text-xs text-slate-500 dark:text-slate-400">{fmt(unit.miete)} €/m²</div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 ) : (
                   <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Objekt-Details</div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="text-center p-3 bg-gray-50 rounded-lg">
                         <div className="text-lg font-bold text-blue-600">{totalFlaeche} m²</div>
                         <div className="text-xs text-gray-600">Gesamtfläche</div>
                       </div>
                       <div className="text-center p-3 bg-gray-50 rounded-lg">
                         <div className="text-lg font-bold text-green-600">{fmt(avgMiete)} €/m²</div>
                         <div className="text-xs text-gray-600">Ø Miete</div>
                       </div>
                     </div>
                   </div>
                 )}
             </div>
          </div>

                                  <div className="mt-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Kennzahlen & Metriken</h3>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setShowCardSelector(true)}
                       className="gap-2"
                     >
                       <Pencil className="w-4 h-4" />
                       Cards verwalten
                     </Button>
                   </div>
                   
                   <div id="cards" className="grid gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:[--card-h:240px] md:[--card-h:260px] lg:[--card-h:260px]">
                     {selectedCards.map((cardKey) => {
                       const card = AVAILABLE_CARDS[cardKey];
                       if (!card) return null;
                       
                       return (
                         <Card key={cardKey} className="bg-black dark:bg-black text-white shadow-lg border border-gray-700 rounded-2xl h-[var(--card-h)] transition-all duration-200 hover:shadow-xl">
                    <CardHeader className="pb-3">
                             <CardTitle className="text-base flex items-center gap-2 font-semibold text-white">
                               {card.title}
                               <InfoTooltip content={card.tooltip} />
                             </CardTitle>
                             {card.controls && card.controls}
            </CardHeader>
                    <CardContent className="pt-0 text-white">
                             {card.content}
            </CardContent>
          </Card>
                         );
                       })}
                     </div>
        </div>
        <InvestmentScoreSection score={score} metrics={metrics} />
      </section>

      {/* Textblöcke */}
      <section id="story" className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">
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
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 resize-none"
                  rows={8}
                  value={storyText}
                  placeholder="Text eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, story: e.target.value }))}
                />
                <div className="flex gap-3 mt-3">
                  <Button size="sm" onClick={() => setEditingStory(false)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200">Fertig</Button>
                   <Button 
                     size="sm" 
                     variant="outline"
                     onClick={() => setTexts(prev => ({ ...prev, story: defaultTexts.story }))}
                     className="gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-4 py-2 font-medium transition-all duration-200"
                   >
                     <RotateCcw className="w-4 h-4" />
                     KI-Text neu generieren
                   </Button>
                </div>
              </>
            ) : (
              storyParagraphs.map((p, i) => <p key={i} className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{p}</p>)
            )}
          </CardContent>
        </Card>

        <Card id="tips" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
          <CardHeader className="flex items-start justify-between">
            {editingTip ? (
              <input
                className="font-semibold text-base flex-1 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 text-gray-900 dark:text-white"
                value={tipTitle}
                placeholder="Titel eingeben"
                onChange={(e) => setTexts((t) => ({ ...t, tipTitle: e.target.value }))}
              />
            ) : (
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                <CheckCircle2 className="w-6 h-6 text-green-500" /> {tipTitle}
              </CardTitle>
            )}
            {!editingTip && (
              <button
                onClick={() => setEditingTip(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                aria-label="Vermietung bearbeiten"
              >
                <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
            {editingTip ? (
              <>
                <textarea
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 resize-none"
                  rows={6}
                  value={tipText}
                  placeholder="Text eingeben"
                  onChange={(e) => setTexts((t) => ({ ...t, tipText: e.target.value }))}
                />
                <div className="flex gap-3 mt-3">
                  <Button size="sm" onClick={() => setEditingTip(false)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200">Fertig</Button>
                   <Button 
                     size="sm" 
                     variant="outline"
                     onClick={() => setTexts(prev => ({ ...prev, tipText: defaultTexts.tipText }))}
                     className="gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-4 py-2 font-medium transition-all duration-200"
                   >
                     <RotateCcw className="w-4 h-4" />
                     KI-Text neu generieren
                   </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-base leading-relaxed">{tipMain}</p>
                {tipNote && (
                  <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100">
                    {tipNote}
                  </div>
                )}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{Math.round(score.total)}</span>
                    <span className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                      {score.grade}
                    </span>
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">{scoreNarrative}</p>
                </div>
                {/* Upside Text mit Wahrscheinlichkeit */}
                {upsideState.scenarios.length > 0 && (
                  <div className="pt-4 border-t mt-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">Upside‑Potenzial</h4>
                      <InfoTooltip content="Zusatzpotenzial aus Szenarien (z. B. Umwidmung/Ausbau). Anzeige inkl. Eintrittswahrscheinlichkeit." />
                    </div>
                    <ul className="mt-2 space-y-1">
                      {upsideState.scenarios.map((s, i) => (
                        <li key={s.id} className="text-sm">
                          <span className="font-medium">{s.title || `Upside ${i + 1}`}:</span>{" "}
                          <span>{s.active ? `${s.probabilityPct}% Wahrscheinlichkeit` : "inaktiv"}</span>
                          {s.remarks ? <span className="text-slate-500"> — {s.remarks}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <section id="charts" className="max-w-6xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 [--card-h:350px] sm:[--card-h:300px] lg:[--card-h:360px]">
        <Card className="h-[var(--card-h)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">FCF-Entwicklung (Jahr 1–15)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[200px] sm:min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <AreaChart data={chartData} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="fcf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => {
                    const num = typeof v === "number" ? v : Number(v);
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                    return num.toString();
                  }} width={50} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Area type="monotone" dataKey="FCF" name="Freier Cashflow" stroke="#06b6d4" fill="url(#fcf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-3 sm:px-6">Positiver Cashflow ab Jahr {cfPosAb || "–"} (Annuität {fmtEUR(fin.annuitaet)}, BK {fmtEUR(bkJ1)} p.a.).</p>
          </CardContent>
        </Card>

        <Card className="h-[var(--card-h)] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Restschuld vs. Immobilienwert (konservativ)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[200px] sm:min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <LineChart data={chartData} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => {
                    const num = typeof v === "number" ? v : Number(v);
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                    return num.toString();
                  }} width={50} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Line type="monotone" dataKey="Restschuld" stroke="#4338ca" name="Restschuld" strokeWidth={2} />
                  <Line type="monotone" dataKey="Immobilienwert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-3 sm:px-6">Wertsteigerung aktuell {Math.round(cfg.wertSteigerung * 100)}% p.a. auf Kaufpreis unterstellt.</p>
          </CardContent>
        </Card>

        <Card className="h-[var(--card-h)] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Wertzuwachs der Immobilie</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[200px] sm:min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <LineChart data={valueGrowthData} margin={{ left: 0, right: 5, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => {
                    const num = typeof v === "number" ? v : Number(v);
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                    return num.toString();
                  }} width={50} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Legend />
                  <Line type="monotone" dataKey="Wert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="h-[var(--card-h)] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Wertzuwachs der Immobilie</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto border border-slate-200 rounded">
              <div className="min-w-[320px] sm:min-w-[420px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <tr className="text-left text-slate-500">
                      <th className="py-1 pr-3">Jahr</th>
                      <th className="py-1 pr-3">Wert</th>
                      <th className="py-1 pr-3">Zuwachs ggü. Start</th>
                      <th className="py-1 pr-3">Zuwachs %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueGrowthTable.map((r) => (
                      <tr key={r.Jahr} className="border-t border-slate-200">
                        <td className="py-1 pr-3">{r.Jahr}</td>
                        <td className="py-1 pr-3">{fmtEUR(r.Wert)}</td>
                        <td className="py-1 pr-3">{fmtEUR(r.Zuwachs)}</td>
                        <td className="py-1 pr-3">{formatPercent(r.ZuwachsPct) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Gegenüberstellung 5 / 10 / 15 Jahre */}
      <section className="max-w-6xl mx-auto px-6 mt-6 [--card-h:350px] sm:[--card-h:300px] lg:[--card-h:360px]">
        {(() => {
          const points = [5, 10, 15] as const;
          const rows = points.map((p) => {
            const Vt = cfg.kaufpreis * Math.pow(1 + (cfg.wertSteigerung || 0), p);
            const cumFcfT = PLAN_30Y.slice(0, p).reduce((s, r) => s + r.fcf, 0);
            const cumTilgungT = PLAN_30Y.slice(0, p).reduce((s, r) => s + r.tilgung, 0);
            const zuwachs = cumTilgungT + (Vt - cfg.kaufpreis) + cumFcfT;
            
            // Eingesetztes Eigenkapital abziehen (EK₀) - gleiche Formel wie Vermögenszuwachs
            const initialEquity = (nkInLoan ? cfg.kaufpreis : cfg.kaufpreis + NKabs) - L0;
            const nettoZuwachs = zuwachs - initialEquity;
            
            return {
            Periode: `${p} J.`,
              Equity: Vt - PLAN_30Y[p - 1].restschuld,
              Zuwachs: nettoZuwachs,
            Restschuld: PLAN_30Y[p - 1].restschuld,
              Wertzuwachs: Vt - cfg.kaufpreis,
            };
          });

          return (
            <Card className="h-[var(--card-h)] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="h-full min-h-[200px] sm:min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <LineChart data={rows} margin={{ left: 5, right: 5, top: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Periode" />
                      <YAxis tickFormatter={(v) => {
                        const num = typeof v === "number" ? v : Number(v);
                        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                        return num.toString();
                      }} width={50} />
                      <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                      <Legend />
                      <Line type="monotone" dataKey="Equity" name="Immobilien-Equity" stroke="#0ea5e9" strokeWidth={2} />
                      <Line type="monotone" dataKey="Zuwachs" name="Netto-Vermögenszuwachs" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Definition: Equity = Marktwert − Restschuld,
                  Netto-Zuwachs = ΣWertzuwachs + ΣTilgung + ΣFCF - EK₀ ({fmtEUR((nkInLoan ? cfg.kaufpreis : cfg.kaufpreis + NKabs) - L0)}).
                </p>
              </CardContent>
            </Card>
          );
        })()}
      </section>

      {/* Vergleichsdaten Bear/Base/Bull */}
        {showCompare && (
           <section id="compare" className="max-w-6xl mx-auto px-6 mt-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vergleichsdaten</h2>
            <button
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all duration-200"
              onClick={() => setCompareExpanded((v) => !v)}
            >
              {compareExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {compareExpanded ? "Einklappen" : "Aufklappen"}
            </button>
          </div>
          {compareExpanded && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">FCF Vergleich</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compareFcfData} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="Jahr" />
                        <YAxis tickFormatter={(v) => {
                          const num = typeof v === "number" ? v : Number(v);
                          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                          if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                          return num.toString();
                        }} width={60} />
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
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Equity Vergleich</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compareEquityData} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="Jahr" />
                        <YAxis tickFormatter={(v) => {
                          const num = typeof v === "number" ? v : Number(v);
                          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                          if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                          return num.toString();
                        }} width={60} />
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

            <Card className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Cashflow Vergleich (Jahre 1–15)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="py-3 pr-4 font-medium">Jahr</th>
                        <th className="py-3 pr-4 font-medium">Bear</th>
                        <th className="py-3 pr-4 font-medium">Base</th>
                        <th className="py-3 pr-4 font-medium">Bull</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareFcfData.map((r) => (
                        <tr key={r.Jahr} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{r.Jahr}</td>
                          <td className={`py-3 pr-4 ${r.Bear > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{fmtEUR(r.Bear)}</td>
                          <td className={`py-3 pr-4 ${r.Base > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{fmtEUR(r.Base)}</td>
                          <td className={`py-3 pr-4 ${r.Bull > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{fmtEUR(r.Bull)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            </div>
        )}
      </section>
      )}

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

      {/* Upside section removed as requested */}

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
                Im Direktvergleich liegt der Einstieg {kaufpreisProM2 < avgPreisStadtteil ? "unter" : "über"} dem Ø‑Preis für <b>{cfg.stadtteil} ({fmt(avgPreisStadtteil)} €/m²)</b>{kaufpreisProM2 < avgPreisStadtteil ? " und deutlich unter vielen Stadtlagen." : "."}
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
