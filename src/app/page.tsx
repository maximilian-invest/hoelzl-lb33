"use client";

import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
  type SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { formatPercent } from "@/lib/format";
import { safeSetItem, safeGetItem, safeSetItemDirect, safeRemoveItem, formatBytes } from "@/lib/storage-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/TopBar";
import { TabNavigation, type TabType } from "@/components/TabNavigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MarketComparisonTab } from "@/components/MarketComparisonTab";
import { DetailAnalysisTab } from "@/components/DetailAnalysisTab";
import { ExitScenariosTab } from "@/components/ExitScenariosTab";
import { DocumentsTab } from "@/components/DocumentsTab";
import { ProjectFileUpload } from "@/components/ProjectFileUpload";
import { CompleteOverviewTab } from "@/components/CompleteOverviewTab";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SettingsTabs } from "@/components/SettingsTabs";
import { SettingContent } from "@/components/SettingContent";
import { SettingsButtons } from "@/components/SettingsButtons";
import { MapComponent } from "@/components/MapComponent";
import { ProjectLockedOverlay } from "@/components/ProjectLockedOverlay";
import { PinDialog } from "@/components/PinDialog";
import { StorageStatus } from "@/components/StorageStatus";
import { useToast } from "@/components/ui/toast";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProjects, fetchProject, updateProject, deleteProject as deleteApiProject, type Project, type CreateProjectRequest, type ProjectFile } from "@/lib/project-api";
import { ProjectSelection } from "@/components/ProjectSelection";

import UpsideForm from "@/components/UpsideForm";
import { useUpside } from "@/hooks/useUpside";
import { irr, type UpsideScenario } from "@/lib/upside";
import { calculateScore } from "@/logic/score";
import { DISTRICT_PRICES, type District } from "@/types/districts";
import { HouseholdForm } from "@/components/HouseholdForm";
import { HouseholdSummaryCard } from "@/components/HouseholdSummaryCard";
import { HouseholdBreakdownTable } from "@/components/HouseholdBreakdownTable";
import { HouseholdActionsBar } from "@/components/HouseholdActionsBar";
import { HouseholdInputs, DEFAULT_HOUSEHOLD_INPUTS, HouseholdCalcResult } from "@/types/household";
import { calculateHousehold } from "@/lib/household-calculations";
import { loadHouseholdData, saveHouseholdData, clearHouseholdData } from "@/lib/household-storage";

// Hilfsfunktion um zu prüfen, ob ein Exit-Szenario als berechnet gilt
const isExitScenarioCalculated = (inputs?: import("@/types/exit-scenarios").ExitScenarioInputs | null): boolean => {
  if (!inputs) return false;
  
  // Ein Exit-Szenario gilt als berechnet, wenn ein Verkaufspreis gesetzt wurde
  if (inputs.verkaufspreisTyp === "pauschal" && inputs.verkaeuferpreisPauschal && inputs.verkaeuferpreisPauschal > 0) {
    return true;
  }
  
  if (inputs.verkaufspreisTyp === "pro_quadratmeter" && inputs.verkaeuferpreisProM2 && inputs.verkaeuferpreisProM2 > 0) {
    return true;
  }
  
  return false;
};

import {
  CheckCircle2,
  Circle,
  TrendingUp,
  X,
  Plus,
  ImagePlus,
  FilePlus,
  Pencil,
  RotateCcw,
  Building,
  PiggyBank,
  Percent,
  Wallet,
  Upload,
  ChevronDown,
} from "lucide-react";

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
  // Wohnungsdetails
  balkon?: boolean;
  balkonGroesse?: number; // m²
  keller?: boolean;
  kellerGroesse?: number; // m²
  parkplatz?: boolean;
  parkplatzAnzahl?: number;
  terrasse?: boolean;
  terrasseGroesse?: number; // m²
  garten?: boolean;
  gartenGroesse?: number; // m²
  aufzug?: boolean;
  einbaukueche?: boolean;
  badewanne?: boolean;
  dusche?: boolean;
  wc?: number; // Anzahl
  zimmer?: number;
  schlafzimmer?: number;
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


// type Bauart = keyof typeof DISTRICT_PRICES;

export type Assumptions = {
  adresse: string;
  stadtteil: District;
  bauart: "bestand" | "neubau";
  objektTyp: ObjektTyp;
  rechtsform: 'Privatperson' | 'Einzelunternehmen' | 'OG' | 'KG' | 'GmbH' | 'GmbH & Co KG' | 'AG' | 'Verein' | 'Stiftung' | 'Sonstige';
  baujahr: number;
  sanierungen: string[];
  energiewerte: {
    hwb: number;
    fgee: number;
    heizung: string;
    dachung: string;
    fenster: string;
    waermedaemmung: string;
  };
  units: Unit[];
  kaufpreis: number;
  nebenkosten: number;
  // Detailfelder für Nebenkosten (absolute Beträge in EUR)
  nkMakler?: number;
  nkVertragserrichter?: number;
  nkGrunderwerbsteuer?: number;
  nkEintragungsgebuehr?: number;
  nkPfandEintragungsgebuehr?: number;
  // Globaler Modus für Nebenkosten-Eingabe: EUR vs. Prozent
  nkMode?: 'EUR' | 'PCT';
  // Prozentwerte je Posten (nur genutzt, wenn nkMode = 'PCT')
  nkMaklerPct?: number;
  nkVertragserrichterPct?: number;
  nkGrunderwerbsteuerPct?: number;
  nkEintragungsgebuehrPct?: number;
  nkPfandEintragungsgebuehrPct?: number;
  // Basis für EK-Quote: Netto (nur Kaufpreis) oder Brutto (inkl. NK)
  ekQuoteBase?: 'NETTO' | 'BRUTTO';
  // Sollen Nebenkosten im Darlehen mitfinanziert werden?
  nkInLoan?: boolean;
  ekQuote: number;
  tilgung: number;
  laufzeit: number;
  marktMiete: number;
  wertSteigerung: number;
  einnahmenBoostPct?: number; // optionaler Aufschlag für Bear/Bull (% als 0.10 = +10%)
  showHouseholdCalculation?: boolean; // Toggle für Haushaltsrechnung
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  adresse: "",
  stadtteil: "Riedenburg",
  bauart: "bestand",
  objektTyp: "zinshaus",
  rechtsform: 'Privatperson',
  baujahr: 1990,
  sanierungen: ["Heizung 2015", "Fenster 2018"],
  energiewerte: {
    hwb: 120,
    fgee: 0.8,
    heizung: "Gas",
    dachung: "Ziegel",
    fenster: "Doppelverglasung",
    waermedaemmung: "Teilweise",
  },
  units: [
    { 
      flaeche: 120, 
      miete: 16, 
      typ: 'wohnung', 
      stockwerk: '1. OG', 
      bezeichnung: 'Wohnung 1',
      balkon: true,
      balkonGroesse: 8,
      keller: true,
      kellerGroesse: 6,
      parkplatz: true,
      parkplatzAnzahl: 1,
      terrasse: false,
      garten: false,
      aufzug: false,
      einbaukueche: true,
      badewanne: true,
      dusche: true,
      wc: 1,
      zimmer: 4,
      schlafzimmer: 2
    },
    { 
      flaeche: 120, 
      miete: 16, 
      typ: 'wohnung', 
      stockwerk: '2. OG', 
      bezeichnung: 'Wohnung 2',
      balkon: true,
      balkonGroesse: 10,
      keller: true,
      kellerGroesse: 8,
      parkplatz: false,
      terrasse: false,
      garten: false,
      aufzug: false,
      einbaukueche: false,
      badewanne: false,
      dusche: true,
      wc: 1,
      zimmer: 3,
      schlafzimmer: 2
    },
  ],
  kaufpreis: 1000000,
  nebenkosten: 0.098,
  nkMakler: 0,
  nkVertragserrichter: 0,
  nkGrunderwerbsteuer: 0,
  nkEintragungsgebuehr: 0,
  nkPfandEintragungsgebuehr: 0,
  nkMode: 'PCT',
  nkMaklerPct: 3,
  nkVertragserrichterPct: 1,
  nkGrunderwerbsteuerPct: 3.5,
  nkEintragungsgebuehrPct: 1.1,
  nkPfandEintragungsgebuehrPct: 1.2,
  ekQuoteBase: 'NETTO',
  nkInLoan: true,
  ekQuote: 0.2,
  tilgung: 0.02,
  laufzeit: 30,
  marktMiete: 16,
  wertSteigerung: 0.02,
  einnahmenBoostPct: 0,
  showHouseholdCalculation: false,
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
  afaRate: number; // AfA‑Satz % vom Gebäudewert
  gebaeudewertMode?: 'PCT' | 'ABS';
  gebaeudewertPct?: number; // Anteil am Kaufpreis 0..1
  gebaeudewertAbs?: number; // €
  accelAfaEnabled?: boolean;
  accelAfaY1Pct?: number; // 0..100
  accelAfaY2Pct?: number; // 0..100
  inventarAmount?: number; // €
  inventarRestYears?: number; // Jahre
  grundsteuerAnnual?: number; // € p.a.
};

const SCENARIOS = ["bear", "base", "bull"] as const;
type Scenario = (typeof SCENARIOS)[number];

const CASE_INFO: Record<Scenario, { label: string; color: string }> = {
  bear: { label: "Vorsichtiger Bearcase", color: "bg-red-500" },
  base: { label: "Stabiler Basiscase", color: "bg-orange-500" },
  bull: { label: "Chancenreicher Bullcase", color: "bg-emerald-500" },
};

type LocalProjectData = {
  cfgCases: Record<Scenario, Assumptions>;
  finCases: Record<Scenario, Finance>;
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  showUploads: boolean;
  texts: TextBlocks;
  upsideScenarios?: import("@/lib/upside").UpsideScenario[];
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
  const NKabs = (cfg.kaufpreis || 0) * (cfg.nebenkosten || 0);
  const equityBase = (cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? (cfg.kaufpreis || 0) + NKabs : (cfg.kaufpreis || 0);
  const equityAmount = equityBase * (cfg.ekQuote || 0);
  const loanBase = (cfg.kaufpreis || 0) + ((cfg.nkInLoan ?? true) ? NKabs : 0);
  const darlehen = Math.max(0, loanBase - equityAmount);
  const zinssatz = 0.03;
  const einnahmen = cfg.units?.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0) || 0;
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
    afaRate: 0.015,
    gebaeudewertMode: 'PCT',
    gebaeudewertPct: 0.6,
    gebaeudewertAbs: 0,
    accelAfaEnabled: false,
    accelAfaY1Pct: 0,
    accelAfaY2Pct: 0,
    inventarAmount: 0,
    inventarRestYears: 0,
    grundsteuerAnnual: 0,
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
  const flaeche = cfg.units?.reduce((s, u) => s + u.flaeche, 0) || 0;
  let bk = flaeche * fin.bkM2 * 12;
  const gebaeudewert = fin.gebaeudewertMode === 'ABS'
    ? (fin.gebaeudewertAbs || 0)
    : (cfg.kaufpreis * (fin.gebaeudewertPct ?? 1));
  function computeAfaForYear(yearIndex: number): number {
    // yearIndex: 0-based (0=J1)
    if (fin.accelAfaEnabled) {
      if (yearIndex === 0) {
        const pct = Math.min(fin.accelAfaY1Pct ?? 0, 4.5) / 100;
        return gebaeudewert * pct;
      }
      if (yearIndex === 1) {
        const pct = Math.min(fin.accelAfaY2Pct ?? 0, 3.0) / 100;
        return gebaeudewert * pct;
      }
    }
    return gebaeudewert * (fin.afaRate || 0);
  }

  function computeInventarAfaForYear(yearIndex: number): number {
    const betrag = fin.inventarAmount || 0;
    const years = fin.inventarRestYears || 0;
    if (betrag <= 0 || years <= 0) return 0;
    // Nur innerhalb der Restnutzungsdauer ansetzen
    if (yearIndex >= years) return 0;
    return betrag / years;
  }
  const rows: PlanRow[] = [];
  for (let j = 1; j <= years; j++) {
    const einnahmen = einnahmenBrutto * (1 - fin.leerstand);
    const zins = saldo * fin.zinssatz;
    const tilgung = Math.min(saldo, Math.max(0, fin.annuitaet - zins));
    const annuitaet = saldo > 0 ? zins + tilgung : 0;
    const afaYear = computeAfaForYear(j - 1);
    const inventarAfa = computeInventarAfaForYear(j - 1);
    const steuerBasis = einnahmen - bk - zins - (afaYear + inventarAfa) - (fin.grundsteuerAnnual || 0);
    const steuer = Math.max(0, steuerBasis * fin.steuerRate);
    const ausgaben = annuitaet + bk + (fin.grundsteuerAnnual || 0) + steuer;
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
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
      <div className="flex items-center gap-1">
        <input
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-xs transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          type="number"
          step={step}
          value={Number.isFinite(value) ? (value === 0 && !readOnly ? "" : value) : ""}
          onChange={(e) => onChange?.(Number(e.target.value))}
          readOnly={readOnly}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        {suffix ? <span className="text-gray-500 dark:text-gray-400 text-xs font-medium whitespace-nowrap">{suffix}</span> : null}
      </div>
    </label>
  );
}

// Einfaches Feld für EUR-Beträge mit Komma-Unterstützung und 2-Nachkommastellen-Rundung
function MoneyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
  placeholder?: number | string;
}) {
  const parseMoney = (raw: string): number => {
    if (!raw) return 0;
    // Erlaube Komma als Dezimaltrenner, entferne Tausenderpunkte/Leerzeichen
    const normalized = raw
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const n = Number.parseFloat(normalized);
    if (!Number.isFinite(n)) return 0;
    // Vermeide 3.4000000000005 → auf 2 Nachkommastellen runden
    return Math.round(n * 100) / 100;
  };
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
      <div className="flex items-center gap-1">
        <input
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-xs transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          type="text"
          inputMode="decimal"
          defaultValue={value ? String(value) : ""}
          onBlur={(e) => onChange?.(parseMoney(e.target.value))}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium whitespace-nowrap">€</span>
      </div>
    </label>
  );
}

// Prozentfeld mit Komma-Unterstützung und 2-Nachkommastellen-Rundung
function PercentField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
  placeholder?: number | string;
}) {
  const parsePct = (raw: string): number => {
    if (!raw) return 0;
    const normalized = raw
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const n = Number.parseFloat(normalized);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100; // 2 Nachkommastellen
  };
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
      <div className="flex items-center gap-1">
        <input
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-xs transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          type="text"
          inputMode="decimal"
          defaultValue={value ? String(value) : ""}
          onBlur={(e) => onChange?.(parsePct(e.target.value))}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium whitespace-nowrap">%</span>
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
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
      <select
        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-xs transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="py-1">
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}



export default function InvestmentCaseLB33() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const { addToast } = useToast();
  const { token, isAuthenticated } = useAuth();
  
  // === State: Konfiguration ===
  // Beim direkten Laden ohne explizite Projektwahl Projektauswahl anzeigen
  useEffect(() => {
    setIsClient(true);
    
    // Load localStorage values after client-side hydration
    try {
      const rawCfg = safeGetItem("lb33_cfg_cases");
      if (rawCfg) {
        const parsed = JSON.parse(rawCfg);
        setCfgCases({
          bear: { ...defaultCfgCases.bear, ...(parsed.bear ?? {}) },
          base: { ...defaultCfgCases.base, ...(parsed.base ?? {}) },
          bull: { ...defaultCfgCases.bull, ...(parsed.bull ?? {}) },
        });
      }
    } catch {}
    
    try {
      const rawFin = safeGetItem("lb33_fin_cases");
      if (rawFin) {
        setFinCases({ ...defaultFinCases, ...JSON.parse(rawFin) });
      }
    } catch {}
    
    try {
      const rawImages = safeGetItem("lb33_images");
      if (rawImages) {
        setImages(JSON.parse(rawImages));
      }
    } catch {}
    
    try {
      const rawPdfs = safeGetItem("lb33_pdfs");
      if (rawPdfs) {
        setPdfs(JSON.parse(rawPdfs));
      }
    } catch {}
    
    try {
      const rawShowUploads = safeGetItem("lb33_show_uploads");
      if (rawShowUploads) {
        setShowUploads(JSON.parse(rawShowUploads));
      }
    } catch {}
    
    try {
      const rawTexts = safeGetItem("lb33_texts");
      if (rawTexts) {
        setTexts(JSON.parse(rawTexts));
      }
    } catch {}
    
    
    
    try {
      const name = safeGetItem("lb33_current_project") || undefined;
      if (name) {
        // Entferne mögliche Escape-Zeichen vom Projektnamen
        const cleanName = name.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        setCurrentProjectName(cleanName);
      } else {
        setCurrentProjectName(undefined);
      }
    } catch {}
    
    try {
      // Lade projectId aus URL-Parametern oder localStorage als Fallback
      const urlProjectId = searchParams.get('projectId');
      let localStorageProjectId = safeGetItem("lb33_current_project_id") || undefined;
      
      // Entferne Anführungszeichen falls vorhanden
      if (localStorageProjectId) {
        localStorageProjectId = localStorageProjectId.replace(/^"(.*)"$/, '$1');
      }
      
      const projectId = urlProjectId || localStorageProjectId;
      
      console.log('Initial load - projectId from URL:', urlProjectId);
      console.log('Initial load - projectId from localStorage:', localStorageProjectId);
      console.log('Initial load - final projectId:', projectId);
      
      setCurrentProjectId(projectId);
    } catch {}
  }, [searchParams]);
  
  useEffect(() => {
    const loadProject = async () => {
      try {
        const autoload = safeGetItem("lb33_autoload");
        const current = safeGetItem("lb33_current_project");
        
        if (!autoload || !current) {
          setShowProjectSelection(true);
          return;
        }
        
        // Lade projectId aus URL-Parametern oder localStorage als Fallback
        const urlProjectId = searchParams.get('projectId');
        let localStorageProjectId = safeGetItem("lb33_current_project_id") || undefined;
        
        // Entferne Anführungszeichen falls vorhanden
        if (localStorageProjectId) {
          localStorageProjectId = localStorageProjectId.replace(/^"(.*)"$/, '$1');
        }
        
        const projectId = urlProjectId || localStorageProjectId;
        
        // Debug: Zeige alle URL-Parameter
        console.log('Alle URL-Parameter:', searchParams.toString());
        console.log('Project load - projectId from URL:', urlProjectId);
        console.log('Project load - projectId from localStorage:', localStorageProjectId);
        console.log('Project load - final projectId:', projectId);
        setCurrentProjectId(projectId || undefined);
        
        // Lade Projekt-Daten wenn autoload aktiv ist
        const raw = safeGetItem("lb33_projects");
        if (raw) {
          const stored = JSON.parse(raw);
          const data = stored[current] as LocalProjectData | undefined;
          if (data) {
            // Aktualisiere die separaten localStorage-Keys mit den Projekt-Daten
            safeSetItem("lb33_cfg_cases", data.cfgCases);
            safeSetItem("lb33_fin_cases", data.finCases);
            safeSetItem("lb33_images", data.images);
            safeSetItem("lb33_pdfs", data.pdfs);
            safeSetItem("lb33_show_uploads", data.showUploads);
            safeSetItem("lb33_texts", data.texts);
          }
        }
        
        // Lade API-Config direkt, wenn projectId verfügbar ist
        if (projectId && token) {
          try {
            console.log('Lade API-Config direkt für projectId:', projectId);
            const fullProject = await fetchProject(token, projectId);
            if (fullProject.config) {
              console.log('API-Config geladen:', fullProject.config);
              
              // Lade die API-Config direkt in die Hauptanwendung
              safeSetItem("lb33_cfg_cases", JSON.stringify({
                base: fullProject.config,
                bear: fullProject.config,
                bull: fullProject.config
              }));
              safeSetItem("lb33_fin_cases", JSON.stringify({
                kaufpreis: fullProject.config.kaufpreis,
                nebenkosten: fullProject.config.nebenkosten,
                ekQuote: fullProject.config.ekQuote,
                tilgung: fullProject.config.tilgung,
                laufzeit: fullProject.config.laufzeit,
                marktMiete: fullProject.config.marktMiete,
                wertSteigerung: fullProject.config.wertSteigerung
              }));
              safeSetItem("lb33_texts", JSON.stringify({
                title: fullProject.name,
                subtitle: fullProject.description || ''
              }));
              
              // Aktualisiere auch den Projektnamen
              setCurrentProjectName(fullProject.name);
              
              // Lade die Projekt-Dateien
              if (fullProject.project_files) {
                setProjectFiles(fullProject.project_files);
                console.log('Projekt-Dateien geladen:', fullProject.project_files);
              }
              
              // Aktualisiere die State-Variablen direkt mit der API-Config
              // Konvertiere ProjectConfig zu Assumptions-Format
              const configAsAssumptions = {
                ...fullProject.config,
                stadtteil: fullProject.config.stadtteil as District,
                objektTyp: fullProject.config.objektTyp as ObjektTyp,
                rechtsform: (fullProject.config as any).rechtsform ?? 'Einzelunternehmen',
              };
              
              setCfgCases({
                base: configAsAssumptions,
                bear: configAsAssumptions,
                bull: configAsAssumptions
              });
              // Lade die Finance-Daten aus der API-Config
              const financeFromConfig = {
                  darlehen: 0,
                zinssatz: fullProject.config.zinssatz ?? 0.03,
                  annuitaet: 0,
                bkM2: fullProject.config.bkM2 ?? 3.0,
                bkWachstum: fullProject.config.bkWachstum ?? 0.02,
                  einnahmenJ1: 0,
                einnahmenWachstum: fullProject.config.einnahmenWachstum ?? 0.02,
                leerstand: fullProject.config.leerstand ?? 0.05,
                steuerRate: fullProject.config.steuerRate ?? 0.25,
                afaRate: fullProject.config.afaRate ?? 0.025,
                gebaeudewertMode: fullProject.config.gebaeudewertMode,
                gebaeudewertPct: fullProject.config.gebaeudewertPct,
                gebaeudewertAbs: fullProject.config.gebaeudewertAbs,
              };
              
              setFinCases({
                base: financeFromConfig,
                bear: financeFromConfig,
                bull: financeFromConfig
              });
              setTexts({
                title: fullProject.name,
                subtitle: fullProject.description || '',
                story: '',
                tipTitle: '',
                tipText: '',
                upsideTitle: '',
                upsideText: ''
              });
              
              console.log('API-Config erfolgreich in Hauptanwendung geladen');
            }
          } catch (error) {
            console.error('Fehler beim Laden der API-Config:', error);
          }
        }
      } catch {
        setShowProjectSelection(true);
      }
    };
    
    loadProject();
  }, [searchParams, token]);

  // Handler für Projektauswahl
  const handleProjectLoad = async (projectId: string) => {
    if (!token) {
      console.error('Nicht authentifiziert');
      return;
    }
    
    try {
      setIsLoadingProject(true);
      
      // Lade das Projekt von der API
      const fullProject = await fetchProject(token, projectId);
      
      // Speichere ALLES im localStorage, BEVOR die Seite neu lädt
      if (fullProject.config) {
        safeSetItem("lb33_cfg_cases", JSON.stringify({
          base: fullProject.config,
          bear: fullProject.config,
          bull: fullProject.config
        }));
        
        // Finance-Daten
        const financeFromConfig = {
          darlehen: 0,
          zinssatz: fullProject.config.zinssatz ?? 0.03,
          annuitaet: 0,
          bkM2: fullProject.config.bkM2 ?? 3.0,
          bkWachstum: fullProject.config.bkWachstum ?? 0.02,
          einnahmenJ1: 0,
          einnahmenWachstum: fullProject.config.einnahmenWachstum ?? 0.02,
          leerstand: fullProject.config.leerstand ?? 0.05,
          steuerRate: fullProject.config.steuerRate ?? 0.25,
          afaRate: fullProject.config.afaRate ?? 0.025,
          gebaeudewertMode: fullProject.config.gebaeudewertMode,
          gebaeudewertPct: fullProject.config.gebaeudewertPct,
          gebaeudewertAbs: fullProject.config.gebaeudewertAbs,
        };
        
        safeSetItem("lb33_fin_cases", JSON.stringify({
          base: financeFromConfig,
          bear: financeFromConfig,
          bull: financeFromConfig
        }));
        
        safeSetItem("lb33_texts", JSON.stringify({
          title: fullProject.name,
          subtitle: fullProject.description || ''
        }));
      }
      
      safeSetItemDirect("lb33_current_project", fullProject.name);
      safeSetItemDirect("lb33_current_project_id", fullProject.id);
      safeSetItemDirect("lb33_autoload", "true");
      
    setCurrentProjectId(projectId);
    setShowProjectSelection(false);
      
    // Lade das Projekt neu
    window.location.reload();
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
      addToast({
        title: "Fehler",
        description: `Fehler beim Laden des Projekts: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        type: "error",
      });
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleNewProject = () => {
    router.push("/wizard");
  };

  const handleProjectSelect = (projectId: string) => {
    handleProjectLoad(projectId);
  };

  // Funktion zum Neuladen der Projekt-Dateien
  const reloadProjectFiles = useCallback(async () => {
    if (!currentProjectId || !token) return;
    
    try {
      const fullProject = await fetchProject(token, currentProjectId);
      if (fullProject.project_files) {
        setProjectFiles(fullProject.project_files);
        console.log('Projekt-Dateien neu geladen:', fullProject.project_files);
      }
    } catch (error) {
      console.error('Fehler beim Neuladen der Projekt-Dateien:', error);
    }
  }, [currentProjectId, token]);
  
  const [scenario, setScenario] = useState<Scenario>("base");
  const [cfgCases, setCfgCases] = useState<Record<Scenario, Assumptions>>(() => {
    try {
      const raw = safeGetItem("lb33_cfg_cases");
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
      const raw = safeGetItem("lb33_fin_cases");
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

  const [images, setImages] = useState<ProjectImage[]>([]);

  const [pdfs, setPdfs] = useState<ProjectPdf[]>([]);

  const [manualChecklist, setManualChecklist] = useState<Record<string, boolean>>({});
  const [isProjectCompleted, setIsProjectCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return safeGetItem('isProjectCompleted') === 'true';
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Wenn das Projekt bereits abgeschlossen ist, starte mit der Komplettübersicht
    if (typeof window !== 'undefined' && safeGetItem('isProjectCompleted') === 'true') {
      return "complete-overview";
    }
    return "overview";
  });
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [reinesVerkaufsszenario, setReinesVerkaufsszenario] = useState<boolean>(false);

  // Tab change handler with smooth transition
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    
    setIsTabTransitioning(true);
    
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Change tab after animation starts
    setTimeout(() => {
      setActiveTab(newTab);
      // End transition after content loads
      setTimeout(() => {
        setIsTabTransitioning(false);
      }, 150);
    }, 100);
  };
  const [exitScenarioInputs, setExitScenarioInputs] = useState<import("@/types/exit-scenarios").ExitScenarioInputs | null>(null);
  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showMobileSwipeHint, setShowMobileSwipeHint] = useState(false);

  // Swipe functionality for tab navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      // Get available tabs based on current configuration
      const allTabs: TabType[] = ["overview", "detail-analysis", "exit-scenarios", "market", "documents", "complete-overview"];
      const availableTabs = reinesVerkaufsszenario 
        ? allTabs.filter(tab => 
            ["exit-scenarios", "documents", "market", "complete-overview"].includes(tab)
          )
        : allTabs;

      const currentIndex = availableTabs.findIndex(tab => tab === activeTab);
      let nextIndex: number;

      if (isLeftSwipe) {
        // Swipe left - go to next tab
        nextIndex = (currentIndex + 1) % availableTabs.length;
      } else {
        // Swipe right - go to previous tab
        nextIndex = currentIndex === 0 ? availableTabs.length - 1 : currentIndex - 1;
      }

      const nextTab = availableTabs[nextIndex];
      if (nextTab) {
        // Check if tab is locked (all tabs except complete-overview when project is completed)
        const isTabLocked = isProjectCompleted && nextTab !== "complete-overview";
        if (!isTabLocked) {
          setActiveTab(nextTab);
        }
      }
    }
  };

  // Projekt abschließen Handler
  const handleProjectComplete = () => {
    setIsProjectCompleted(true);
    safeSetItemDirect('isProjectCompleted', 'true');
    // Wechsle automatisch zur Komplettübersicht
    setActiveTab("complete-overview");
  };

  // Projekt entsperren Handler
  const handleProjectUnlock = () => {
    setIsProjectCompleted(false);
    safeSetItemDirect('isProjectCompleted', 'false');
    setShowPinDialog(false);
  };

  // Gesperrten Tab anklicken Handler
  const handleLockedTabClick = () => {
    setShowPinDialog(true);
  };

  // PIN verifiziert Handler
  const handlePinVerified = (pin: string) => {
    console.log("PIN verifiziert:", pin);
    handleProjectUnlock();
  };


  // API-Projekte laden wenn authentifiziert
  useEffect(() => {
    const loadApiProjects = async () => {
      if (!token || !isAuthenticated) {
        return;
      }

      setIsLoadingProjects(true);
      try {
        const apiProjects = await fetchProjects(token);
        setApiProjects(apiProjects);
        console.log('API-Projekte geladen:', apiProjects);
        setCurrentProjectId(apiProjects[0].id);
      } catch (error) {
        console.error('Fehler beim Laden der API-Projekte:', error);
        addToast({
          title: "Fehler",
          description: "Konnte Projekte nicht von der API laden",
          type: "error",
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadApiProjects();
  }, [token, isAuthenticated, addToast]);

  // Löschfunktionen
  const handleDeleteProject = async (name: string, id: string) => {
    if (!deleteConfirm) return;

    try {
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }
      
      await deleteApiProject(token, id);
      
      // Aktualisiere API-Projekte State
      setApiProjects(prev => prev.filter(p => p.id !== id));
      
      addToast({
        title: "Erfolg",
        description: `Projekt "${name}" wurde gelöscht`,
        type: "success",
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Projekts:', error);
      addToast({
        title: "Fehler",
        description: `Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        type: "error",
      });
    } finally {
      setDeleteConfirm(null);
    }
  };


  // Exit-Szenarien-Eingaben aus Local Storage laden
  useEffect(() => {
    const savedExitInputs = safeGetItem('exitScenarioInputs');
    if (savedExitInputs) {
      try {
        const parsed = JSON.parse(savedExitInputs);
        setExitScenarioInputs(parsed);
        setReinesVerkaufsszenario(parsed.reinesVerkaufsszenario || false);
      } catch (error) {
        console.error('Fehler beim Laden der Exit-Szenarien-Eingaben:', error);
      }
    }
  }, []);

  // Exit-Szenarien-Eingaben in Local Storage speichern
  useEffect(() => {
    if (exitScenarioInputs) {
      safeSetItemDirect('exitScenarioInputs', JSON.stringify(exitScenarioInputs));
    }
  }, [exitScenarioInputs]);

  // Reines Verkaufsszenario-Status in Local Storage speichern
  useEffect(() => {
    safeSetItemDirect('reinesVerkaufsszenario', JSON.stringify(reinesVerkaufsszenario));
  }, [reinesVerkaufsszenario]);

  // Funktion zum Aktualisieren der Exit-Szenarien-Eingaben
  const handleExitScenarioInputsChange = (inputs: import("@/types/exit-scenarios").ExitScenarioInputs) => {
    setExitScenarioInputs(inputs);
  };





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

  const [showUploads, setShowUploads] = useState<boolean>(true);
  const [texts, setTexts] = useState<TextBlocks>({
    title: "",
    subtitle: "",
    story: "",
    tipTitle: "",
    tipText: "",
    upsideTitle: "",
    upsideText: "",
  });

  // Separate texts für CompleteOverviewTab mit dem erwarteten Format
  const [overviewTexts, setOverviewTexts] = useState({
    beschreibung: "",
    lage: "",
    entwicklungspotenzial: "",
    weiteres: ""
  });
  const [apiProjects, setApiProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    name: string;
    id: string;
  } | null>(null);
  // const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [editingStory, setEditingStory] = useState(false);
  const [editingTip, setEditingTip] = useState(false);
  // const [editingUpside, setEditingUpside] = useState(false);
  const [vzYears, setVzYears] = useState<number>(10);
  const [roiYears, setRoiYears] = useState<number>(1);
  const [roeYears, setRoeYears] = useState<number>(0);
  const [currentProjectName, setCurrentProjectName] = useState<string | undefined>(undefined);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [showCardSelector, setShowCardSelector] = useState(false);
  // const [sidebarWidth, setSidebarWidth] = useState(520);
  const [isResizing, setIsResizing] = useState(false);

  // === State: Fehlerbehandlung ===
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [storageCleaned, setStorageCleaned] = useState(false);
  
  // Haushaltsrechnung State
  const [householdInputs, setHouseholdInputs] = useState<HouseholdInputs>(DEFAULT_HOUSEHOLD_INPUTS);
  const [householdResult, setHouseholdResult] = useState<HouseholdCalcResult | null>(null);

  // Haushaltsrechnung Callbacks
  const handleHouseholdSubmit = useCallback((data: HouseholdInputs) => {
    setHouseholdInputs(data);
    saveHouseholdData(data);
    const result = calculateHousehold(data);
    setHouseholdResult(result);
  }, []);

  const handleHouseholdChange = useCallback((data: HouseholdInputs) => {
    setHouseholdInputs(data);
    const result = calculateHousehold(data);
    setHouseholdResult(result);
  }, []);

  const [selectedCards, setSelectedCards] = useState<string[]>([
    'cashflow', 'vermoegenszuwachs', 'roi', 'roe', 'miete', 'marktmiete', 'debug'
  ]);



  useEffect(() => {
    try {
      const name = safeGetItem("lb33_current_project") || undefined;
      if (name) {
        // Entferne mögliche Escape-Zeichen vom Projektnamen
        const cleanName = name.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        setCurrentProjectName(cleanName);
      } else {
        setCurrentProjectName(undefined);
      }
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
    setCfg((c) => {
      if (DISTRICT_PRICES[c.bauart]?.some((d) => d.ort === c.stadtteil)) return c;
      return { ...c, stadtteil: DISTRICT_PRICES[c.bauart]?.[0]?.ort as District || "Innere Stadt" };
    });
  }, [cfg.bauart, setCfg]);

  // Lade Haushaltsdaten beim Start
  useEffect(() => {
    const savedData = loadHouseholdData();
    if (Object.keys(savedData).length > 0) {
      setHouseholdInputs(prev => ({ ...prev, ...savedData }));
      const result = calculateHousehold({ ...DEFAULT_HOUSEHOLD_INPUTS, ...savedData });
      setHouseholdResult(result);
    }
  }, []);

  // Lade Projekt-Dateien beim Öffnen des Dokumente-Tabs
  useEffect(() => {
    if (activeTab === "documents" && currentProjectId && token) {
      reloadProjectFiles();
    }
  }, [activeTab, currentProjectId, token, reloadProjectFiles]);



  useEffect(() => {
    const NKabs = (cfg.kaufpreis || 0) * (cfg.nebenkosten || 0);
    const equityBase = (cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? (cfg.kaufpreis || 0) + NKabs : (cfg.kaufpreis || 0);
    const equityAmount = equityBase * (cfg.ekQuote || 0);
    const loanBase = (cfg.kaufpreis || 0) + ((cfg.nkInLoan ?? true) ? NKabs : 0);
    const darlehen = Math.max(0, loanBase - equityAmount);
    const annuitaet = darlehen * (fin.zinssatz + cfg.tilgung);
    setFinCases((prev) => {
      const cur = prev[scenario];
      if (cur.darlehen === darlehen && cur.annuitaet === annuitaet) return prev;
      return { ...prev, [scenario]: { ...cur, darlehen, annuitaet } };
    });
  }, [cfg.kaufpreis, cfg.nebenkosten, cfg.nkInLoan, cfg.ekQuoteBase, cfg.ekQuote, cfg.tilgung, fin.zinssatz, scenario]);

  useEffect(() => {
    const base = cfg.units?.reduce((sum, u) => sum + u.flaeche * u.miete * 12, 0) || 0;
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

  // Flag um zu verhindern, dass autoSaveProject während onSaveAndClose läuft
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedProject = useRef(false);

  // Zentrale Speicherfunktion für automatisches Speichern


  // Debug: Reagiere auf Änderungen im images State
  useEffect(() => {
    console.log('Images State geändert:', images.length, 'Bilder');
    console.log('Images Details:', images);
  }, [images]);

  const cfPosAb = useMemo(() => {
    const idx = PLAN_30Y.findIndex((r) => r.fcf > 0);
    return idx >= 0 ? idx + 1 : 0;
  }, [PLAN_30Y]);

  // const YEARS_15 = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 1), []);

  const totalFlaeche = useMemo(
    () => cfg.units?.reduce((sum, u) => sum + u.flaeche, 0) || 0,
    [cfg.units]
  );
  const avgMiete = useMemo(
    () =>
      totalFlaeche
        ? cfg.units?.reduce((sum, u) => sum + u.flaeche * u.miete, 0) / totalFlaeche || 0
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

  const PLAN_LAUFZEIT = useMemo(() => PLAN_30Y.slice(0, laufzeitAuto || 30), [PLAN_30Y, laufzeitAuto]);

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
  const investKPplusNK = V0 + NKabs;
  // Eigenkapital wie im Badge berechnet (immer diese Definition verwenden)
  const equityBadge = ((((cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? V0 + NKabs : V0) * (cfg.ekQuote || 0)) + ((cfg.nkInLoan ?? true) ? 0 : NKabs));

  // const startEK = useMemo(() => {
  // return (nkInLoan ? V0 : V0 + NKabs) - L0;
  // }, [nkInLoan, V0, NKabs, L0]);

  const einnahmenByYear = useMemo(() => PLAN_30Y.map(r => r.einnahmen), [PLAN_30Y]);
  // const ausgabenByYear = useMemo(() => PLAN_30Y.map(r => r.ausgaben), [PLAN_30Y]);
  const fcfByYear = useMemo(() => PLAN_30Y.map(r => r.fcf), [PLAN_30Y]);
  // const restBegByYear = useMemo(() => PLAN_30Y.map(r => r.restschuld), [PLAN_30Y]);
  // const tilgungByYear = useMemo(() => PLAN_30Y.map(r => r.tilgung), [PLAN_30Y]);
  // const restEndByYear = useMemo(() => restBegByYear.map((rb, i) => rb - (tilgungByYear[i] || 0)), [restBegByYear, tilgungByYear]);

  // ROI/ROE: nur Jahr 1 (periodisch)

  const roiValue = useMemo(() => {
    if (investKPplusNK <= 0) return null;
    
    // Auf dem Server immer Startwert verwenden, um Hydration-Probleme zu vermeiden
    const currentRoiYears = isClient ? roiYears : 1;
    
    // Spezialfall: Durchschnitt über Laufzeit (roiYears = 0)
    if (currentRoiYears === 0) {
      const years = Math.min(laufzeitAuto || 30, fcfByYear.length);
      if (years <= 0) return null;
      const fcfSum = fcfByYear.slice(0, years).reduce((s, v) => s + (v ?? 0), 0);
      const avgFcf = fcfSum / years;
      return avgFcf / investKPplusNK;
    }
    
    // ROI für das jeweilige Jahr (roiYears - 1, da Array 0-basiert ist)
    const yearIndex = currentRoiYears - 1;
    if (yearIndex < 0 || yearIndex >= fcfByYear.length) return null;
    
    const fcf = fcfByYear[yearIndex] ?? 0;
    return fcf / investKPplusNK;
  }, [investKPplusNK, fcfByYear, roiYears, laufzeitAuto, isClient]);

  const roeValue = useMemo(() => {
    const ekBadge = equityBadge;
    if (ekBadge <= 0) return null;
    
    // Auf dem Server immer Durchschnitt verwenden, um Hydration-Probleme zu vermeiden
    const currentRoeYears = isClient ? roeYears : 0;
    
    // Spezialfall: Durchschnitt über Laufzeit (roeYears = 0)
    if (currentRoeYears === 0) {
      if (!laufzeitAuto || laufzeitAuto <= 0) return null;
      const fcfSum = fcfByYear?.slice(0, laufzeitAuto).reduce((sum, fcf) => sum + (fcf ?? 0), 0) || 0;
      const avgFcf = fcfSum / laufzeitAuto;
      return avgFcf / ekBadge;
    }
    
    // ROE für das jeweilige Jahr (roeYears - 1, da Array 0-basiert ist)
    const yearIndex = currentRoeYears - 1;
    if (yearIndex < 0 || yearIndex >= fcfByYear.length) return null;
    
    const fcf = fcfByYear[yearIndex] ?? 0;
    return fcf / ekBadge;
  }, [equityBadge, fcfByYear, laufzeitAuto, roeYears, isClient]);
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
    const years = isClient ? vzYears : 10;
    const V0 = cfg.kaufpreis;
            // const g = cfg.wertSteigerung || 0;

    // Marktwert nach t Jahren mit Zinseszinseffekt auf V0 (exkl. NK)
    const marktwert10 = V0 * Math.pow(1 + cfg.wertSteigerung, years);
    // Summe FCF 1..t (bereits nach Schuldendienst)
    const cumFcf10 = PLAN_30Y?.slice(0, years).reduce((s, r) => s + r.fcf, 0) || 0;
    // Summe Tilgung 1..t
    const cumTilgung10 = PLAN_30Y?.slice(0, years).reduce((s, r) => s + r.tilgung, 0) || 0;

    // Neue Definition: Tilgung kumuliert + (Wertzuwachs) + kum. FCF bis Jahr 10
    const wertzuwachs10 = marktwert10 - V0;
    const zuwachsFinal = cumTilgung10 + wertzuwachs10 + cumFcf10;
    
    // Eingesetztes Eigenkapital abziehen (EK₀)
    const initialEquity = (nkInLoan ? V0 : V0 + NKabs) - L0;
    const nettoZuwachs = zuwachsFinal - initialEquity;

    const tooltip = "Der kumulierte Wertzuwachs gemeinsam mit kumulierter Tilgung und dem Free Cashflow abzüglich der eingesetzten Eigenmittel ergibt den Netto-Vermögenszuwachs nach dem gewählten Zeitraum";

    return { vermoegensZuwachs10y: nettoZuwachs, vermoegensTooltip: tooltip };
  }, [PLAN_30Y, cfg.kaufpreis, cfg.wertSteigerung, vzYears, nkInLoan, NKabs, L0, isClient]);

  // const PLAN_15Y_CASES = useMemo(() => {
  //   return {
  //     bear: buildPlan(15, finCases.bear, cfgCases.bear),
  //     base: buildPlan(15, finCases.base, cfgCases.base),
  //     bull: buildPlan(15, finCases.bull, cfgCases.bull),
  //   } as Record<Scenario, PlanRow[]>;
  // }, [finCases, cfgCases]);


  const kaufpreisProM2 = cfg.kaufpreis / totalFlaeche;
  const avgPreisStadtteil =
    DISTRICT_PRICES[cfg.bauart]?.find((d) => d.ort === cfg.stadtteil)?.preis ?? 0;
  // const priceBelowMarket = kaufpreisProM2 < avgPreisStadtteil;
  const caseLabel = CASE_INFO[scenario].label;
  // const caseColor = CASE_INFO[scenario].color;

  const defaultTexts = useMemo(
    () => {
      const wohnungen = cfg.units?.filter(u => u.typ === 'wohnung') || [];
      const gewerbe = cfg.units?.filter(u => u.typ === 'gewerbe') || [];
      // const wohnungsFlaeche = wohnungen.reduce((sum, u) => sum + u.flaeche, 0);
      // const gewerbeFlaeche = gewerbe.reduce((sum, u) => sum + u.flaeche, 0);
      
      // Baujahr-Text
      const baujahrText = cfg.baujahr > 0 ? `Das ${cfg.bauart === 'neubau' ? 'neue' : 'bestehende'} Objekt wurde ${isClient && cfg.baujahr === new Date().getFullYear() ? 'in diesem Jahr' : `im Jahr ${cfg.baujahr}`} ${cfg.bauart === 'neubau' ? 'errichtet' : 'gebaut'}` : '';
      
      // Sanierungen-Text
      const sanierungenText = (cfg.sanierungen?.length || 0) > 0 && cfg.sanierungen?.some(s => s.trim() !== '') 
        ? `Wichtige Sanierungen: ${cfg.sanierungen?.filter(s => s.trim() !== '').join(', ')}.` 
        : '';
      
      // Energiewerte-Text
      const energiewerteText = `Energiewerte: HWB ${cfg.energiewerte?.hwb || 'N/A'} kWh/m²a, FGEE ${cfg.energiewerte?.fgee || 'N/A'}, ${cfg.energiewerte?.heizung || 'N/A'}-Heizung, ${cfg.energiewerte?.dachung || 'N/A'}-Dachung, ${cfg.energiewerte?.fenster || 'N/A'}, ${cfg.energiewerte?.waermedaemmung || 'N/A'} Wärmedämmung.`;
      
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
        subtitle: `${(cfg.units?.length || 0) > 0 ? `${cfg.units?.length || 0} Einheiten` : 'Immobilienobjekt'} in ${cfg.stadtteil || 'zentraler Lage'}. ${objektTypText}. ${totalFlaeche > 0 ? `Insgesamt ${totalFlaeche} m² Nutzfläche.` : ''} ${cfg.bauart === 'neubau' ? 'Neubau mit modernen Standards.' : 'Bestandsimmobilie mit Entwicklungspotenzial.'}${upsideState.scenarios.length > 0 ? ` ${upsideState.scenarios.length} Upside-Szenarien identifiziert.` : ''}`,
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
      isClient,
    ]
  );


  const updateAllTextsWithAI = useCallback(() => {
    setTexts(defaultTexts);
  }, [defaultTexts]);

  // Sidebar Resize Functions
  // const handleResizeStart = useCallback((e: React.MouseEvent) => {
  //   e.preventDefault();
  //   setIsResizing(true);
  // }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 300 && newWidth <= 800) {
      // setSidebarWidth(newWidth);
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

  // useEffect für automatische Text-Updates entfernt
  // Texte bleiben leer bei neuen Projekten

  // Mobile swipe hint animation - only on mobile devices
  useEffect(() => {
    const showMobileHint = () => {
      setShowMobileSwipeHint(true);
      setTimeout(() => {
        setShowMobileSwipeHint(false);
      }, 3000); // Show for 3 seconds
    };

    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Show hint immediately on mobile devices
      showMobileHint();
      
      // Set up interval to show hint every 1 minute (60000ms)
      const interval = setInterval(showMobileHint, 60000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  const titleText = texts.title || "";
  // const subtitleText = texts.subtitle || "";
  const storyText = texts.story || "";
  const tipTitle = texts.tipTitle || "";
  const tipText = texts.tipText || "";
  // const upsideTitle = texts.upsideTitle || "";
  // const upsideText = texts.upsideText || "";

  const storyParagraphs = storyText ? storyText.split(/\n\n+/) : [];
  const [tipMain, tipNote = ""] = tipText ? tipText.split(/\n\n+/) : ["", ""];
  // const [upsideMain, upsideNote = ""] = upsideText ? upsideText.split(/\n\n+/) : ["", ""];

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

  // Progress calculation for settings completion
  const progressPercentage = useMemo(() => {
    const totalFields = 15; // Gesamtanzahl der wichtigen Felder
    let filledFields = 0;
    
    // Zähle ausgefüllte Felder
    if (cfg.kaufpreis > 0) filledFields++;
    if (cfg.nebenkosten > 0) filledFields++;
    if (cfg.ekQuote > 0) filledFields++;
    if (cfg.tilgung > 0) filledFields++;
    if (cfg.laufzeit > 0) filledFields++;
    if (cfg.marktMiete > 0) filledFields++;
    if (cfg.wertSteigerung > 0) filledFields++;
    if (cfg.baujahr > 0) filledFields++;
    if ((cfg.energiewerte?.hwb || 0) > 0) filledFields++;
    if ((cfg.energiewerte?.fgee || 0) > 0) filledFields++;
    if (cfg.energiewerte?.heizung && cfg.energiewerte.heizung !== '') filledFields++;
    if (cfg.energiewerte?.dachung && cfg.energiewerte.dachung !== '') filledFields++;
    if (cfg.energiewerte?.fenster && cfg.energiewerte.fenster !== '') filledFields++;
    if (cfg.energiewerte?.waermedaemmung && cfg.energiewerte.waermedaemmung !== '') filledFields++;
    if ((cfg.units?.length || 0) > 0) filledFields++;
    if (cfg.stadtteil) filledFields++;
    
    return Math.round((filledFields / totalFields) * 100);
  }, [
    cfg.kaufpreis,
    cfg.nebenkosten,
    cfg.ekQuote,
    cfg.tilgung,
    cfg.laufzeit,
    cfg.marktMiete,
    cfg.wertSteigerung,
    cfg.baujahr,
    cfg.energiewerte?.hwb || 0,
    cfg.energiewerte?.fgee || 0,
    cfg.energiewerte?.heizung || '',
    cfg.energiewerte?.dachung || '',
    cfg.energiewerte?.fenster || '',
    cfg.energiewerte?.waermedaemmung || '',
    cfg.units?.length || 0,
    cfg.stadtteil,
  ]);

  const scoreNarrative = useMemo(() => {
    const reasons = score.bullets.join(". ");
    return `Mit ${Math.round(score.total)} Punkten (Note ${score.grade}) wird das Objekt bewertet. ${reasons}.`;
  }, [score]);

  const addUnit = () => {
    const nextNumber = (cfg.units?.length || 0) + 1;
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
    setCfg({ ...cfg, units: cfg.units?.map((unit, i) => (i === idx ? u : unit)) || [] });
  const removeUnit = (idx: number) =>
    setCfg({ ...cfg, units: cfg.units?.filter((_, i) => i !== idx) || [] });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Prüfe Dateigröße (max 10MB pro Bild)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`Bild ist zu groß. Maximale Größe: 10MB. Aktuelle Größe: ${formatBytes(file.size)}`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        // Komprimiere Bild für bessere Speichernutzung
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Berechne neue Dimensionen (max 1920px Breite)
        const maxWidth = 1920;
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Zeichne komprimiertes Bild
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedSrc = canvas.toDataURL('image/jpeg', 0.8); // 80% Qualität
        
        const newImage = { 
          src: compressedSrc, 
          caption: "", 
          width: Math.round(width), 
          height: Math.round(height) 
        };
        
        const updatedImages = [...images, newImage];
        
        // Aktualisiere den lokalen State - automatisches Speichern übernimmt den Rest
        setImages(updatedImages);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Prüfe Dateigröße (max 20MB pro PDF)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert(`PDF ist zu groß. Maximale Größe: 20MB. Aktuelle Größe: ${formatBytes(file.size)}`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const newPdf = { src, name: file.name };
      const updatedPdfs = [...pdfs, newPdf];
      
      // Aktualisiere den lokalen State - automatisches Speichern übernimmt den Rest
      setPdfs(updatedPdfs);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateImageCaption = (idx: number, caption: string) => {
    const updatedImages = images.map((img, i) => (i === idx ? { ...img, caption } : img));
    setImages(updatedImages);
    // Automatisches Speichern übernimmt den Rest
  };

  const removeImage = (idx: number) => {
    const updatedImages = images.filter((_, i) => i !== idx);
    setImages(updatedImages);
    // Automatisches Speichern übernimmt den Rest
  };

  // const handleStorageCleanup = () => {
  //   const result = cleanupStorage();
  //   setImages([]);
  //   setPdfs([]);
  //   setUploadError(null);
  //   setShowStorageInfo(false);
  //   
  //   // Zeige Erfolgsmeldung
  //   alert(`Speicher bereinigt! ${result.removed} Elemente entfernt, ${formatBytes(result.freedBytes)} freigegeben.`);
  // };

  const removePdf = (idx: number) => {
    const updatedPdfs = pdfs.filter((_, i) => i !== idx);
    setPdfs(updatedPdfs);
    // Automatisches Speichern übernimmt den Rest
  };

  // const downloadImages = async () => {
  //   if (images.length === 0) return;
  //   const zip = new JSZip();
  //   images.forEach((img, idx) => {
  //     const base64 = img.src.split(",")[1];
  //     const ext = img.src.substring("data:image/".length, img.src.indexOf(";"));
  //     zip.file(`bild${idx + 1}.${ext}`, base64, { base64: true });
  //   });
  //   const blob = await zip.generateAsync({ type: "blob" });
  //   saveAs(blob, "bilder.zip");
  // };

  // const downloadPdfs = async () => {
  //   if (pdfs.length === 0) return;
  //   if (pdfs.length === 1) {
  //     const link = document.createElement("a");
  //     link.href = pdfs[0].src;
  //     link.download = pdfs[0].name;
  //     link.click();
  //     return;
  //   }
  //   const zip = new JSZip();
  //   pdfs.forEach((pdf, idx) => {
  //     const base64 = pdf.src.split(",")[1];
  //     zip.file(pdf.name || `dok${idx + 1}.pdf`, base64, { base64: true });
  //   });
  //   const blob = await zip.generateAsync({ type: "blob" });
  //   saveAs(blob, "pdfs.zip");
  // };

  // const downloadAllZip = async () => {
  //   if (images.length === 0 && pdfs.length === 0) return;
  //   const zip = new JSZip();
  //   images.forEach((img, idx) => {
  //     const base64 = img.src.split(",")[1];
  //     const ext = img.src.substring("data:image/".length, img.src.indexOf(";"));
  //     zip.file(`bild${idx + 1}.${ext}`, base64, { base64: true });
  //   });
  //   pdfs.forEach((pdf, idx) => {
  //     const base64 = pdf.src.split(",")[1];
  //     zip.file(pdf.name || `dok${idx + 1}.pdf`, base64, { base64: true });
  //   });
  //   const blob = await zip.generateAsync({ type: "blob" });
  //   saveAs(blob, "projekt.zip");
  // };

  // === UI: Einstellungs-Panel ===
  const [open, setOpen] = useState(false);
  // const [fullscreen, setFullscreen] = useState(false);
  // const [showCompare, setShowCompare] = useState(false);
  
  const handleProjectNameChange = (newName: string) => {
    if (!newName.trim()) return;
    
    const trimmedName = newName.trim();
    
    
    // Aktualisiere den aktuellen Projektnamen
    setCurrentProjectName(trimmedName);
    
    // Aktualisiere auch die projectId im localStorage, falls sie existiert
    if (currentProjectId) {
      safeSetItemDirect("lb33_current_project_id", currentProjectId);
    }
    
    // Speichere das aktuelle Projekt mit dem neuen Namen
    const currentProjectData = { 
      cfgCases, 
      finCases, 
      images, 
      pdfs, 
      showUploads, 
      texts: texts, 
      upsideScenarios: upsideState.scenarios,
      householdCalculation: {
        inputs: householdInputs as unknown as Record<string, unknown>,
        result: householdResult as Record<string, unknown> | null,
        lastModified: Date.now()
      },
      lastModified: Date.now()
    };
    
    
    // Speichere in localStorage
    const success = safeSetItemDirect("lb33_current_project", trimmedName);
    
    if (!success) {
      console.warn('Fehler beim Speichern des Projektnamens');
      alert("Fehler beim Speichern des Projektnamens. Bitte versuchen Sie es erneut.");
    } else {
      console.log(`Projektname erfolgreich zu "${trimmedName}" geändert`);
      // Lade die Seite neu, um die Änderungen zu reflektieren
      window.location.reload();
    }
  };

  const saveCurrentProject = async () => {
    if (isSaving) {
      console.log('Speichern bereits in Bearbeitung, ignoriere weiteren Aufruf');
      return;
    }

    if (!token || !isAuthenticated) {
      addToast({
        title: "Fehler",
        description: "Bitte logge dich ein, um das Projekt zu speichern.",
        type: "error",
      });
      return;
    }

    if (!currentProjectId) {
      addToast({
        title: "Fehler",
        description: "Keine Projekt-ID verfügbar. Bitte lade das Projekt erneut von der Startseite.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Speichere Projekt mit projectId:', currentProjectId);
      
      // Konvertiere die aktuellen Daten in das API-Format
      const projectConfig = {
        adresse: cfg.adresse,
        stadtteil: cfg.stadtteil,
        bauart: cfg.bauart,
        objektTyp: cfg.objektTyp,
        rechtsform: cfg.rechtsform,
        baujahr: cfg.baujahr,
        sanierungen: cfg.sanierungen,
        energiewerte: cfg.energiewerte,
        units: cfg.units,
        kaufpreis: cfg.kaufpreis,
        nebenkosten: cfg.nebenkosten,
        // Nebenkosten-Details
        nkMakler: cfg.nkMakler,
        nkVertragserrichter: cfg.nkVertragserrichter,
        nkGrunderwerbsteuer: cfg.nkGrunderwerbsteuer,
        nkEintragungsgebuehr: cfg.nkEintragungsgebuehr,
        nkPfandEintragungsgebuehr: cfg.nkPfandEintragungsgebuehr,
        nkMode: cfg.nkMode,
        nkMaklerPct: cfg.nkMaklerPct,
        nkVertragserrichterPct: cfg.nkVertragserrichterPct,
        nkGrunderwerbsteuerPct: cfg.nkGrunderwerbsteuerPct,
        nkEintragungsgebuehrPct: cfg.nkEintragungsgebuehrPct,
        nkPfandEintragungsgebuehrPct: cfg.nkPfandEintragungsgebuehrPct,
        ekQuoteBase: cfg.ekQuoteBase,
        nkInLoan: cfg.nkInLoan,
        ekQuote: cfg.ekQuote,
        tilgung: cfg.tilgung,
        laufzeit: cfg.laufzeit,
        marktMiete: cfg.marktMiete,
        wertSteigerung: cfg.wertSteigerung,
        einnahmenBoostPct: cfg.einnahmenBoostPct,
        showHouseholdCalculation: cfg.showHouseholdCalculation,
        // Finance-Felder
        zinssatz: fin.zinssatz,
        bkM2: fin.bkM2,
        bkWachstum: fin.bkWachstum,
        einnahmenWachstum: fin.einnahmenWachstum,
        leerstand: fin.leerstand,
        steuerRate: fin.steuerRate,
        afaRate: fin.afaRate,
        gebaeudewertMode: fin.gebaeudewertMode,
        gebaeudewertPct: fin.gebaeudewertPct,
        gebaeudewertAbs: fin.gebaeudewertAbs,
      };

      const updateRequest: CreateProjectRequest = {
        name: currentProjectName || "Unbenanntes Projekt",
        description: texts.subtitle || "",
        config: projectConfig,
      };

      // Aktualisiere das Projekt über die API mit der projectId
      await updateProject(token, currentProjectId, updateRequest);
      
      // Aktualisiere auch die lokale Projektliste
      const updatedProjects = await fetchProjects(token);
      setApiProjects(updatedProjects);

      addToast({
        title: "Erfolg",
        description: `Projekt wurde erfolgreich gespeichert.`,
        type: "success",
      });

      console.log('Projekt erfolgreich aktualisiert mit projectId:', currentProjectId);
    } catch (error) {
      console.error('Fehler beim Speichern des Projekts:', error);
      addToast({
        title: "Fehler",
        description: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
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
    // Setze Upside-Szenarien zurück
    upsideState.reset();
    safeRemoveItem("lb33_cfg_cases");
    safeRemoveItem("lb33_fin_cases");
    safeRemoveItem("lb33_images");
    safeRemoveItem("lb33_pdfs");
    safeRemoveItem("lb33_show_uploads");
    safeRemoveItem("lb33_texts");
    safeRemoveItem("lb33_current_project");
  };


  // Export-Funktion entfernt - Download-Funktionen sind deaktiviert

  const importInputRef = useRef<HTMLInputElement>(null);
  const triggerImport = () => importInputRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        
        // Validiere die importierten Daten
        if (!data.cfgCases || !data.finCases) {
          alert("Ungültige Projektdatei: Fehlende Konfigurationsdaten");
          return;
        }
        
        // Lade die Daten in den State
        setCfgCases(data.cfgCases);
        setFinCases(data.finCases);
        setImages(data.images || []);
        setPdfs(data.pdfs || []);
        setShowUploads(data.showUploads !== undefined ? data.showUploads : true);
        setTexts(data.texts || {});
        
        // Lade Upside-Szenarien falls vorhanden
        if (data.upsideScenarios) {
          upsideState.loadScenarios(data.upsideScenarios as UpsideScenario[]);
        }
        
        // Setze den Projektnamen zurück, da es sich um ein importiertes Projekt handelt
        setCurrentProjectName(undefined);
        
        alert("Projekt erfolgreich geladen!");
      } catch (error) {
        console.error('Fehler beim Importieren:', error);
        alert("Ungültige Projektdatei oder Fehler beim Lesen der Datei");
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
          label={`Netto-Vermögenszuwachs nach ${isClient ? vzYears : 10} Jahren`}
          value={fmtEUR(vermoegensZuwachs10y)}
          sub="ΣWertzuwachs + ΣTilgung + ΣFCF - EK₀"
          tooltip={vermoegensTooltip}
        />
      ),
      controls: (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant={isClient && vzYears === 5 ? 'default' : 'secondary'} onClick={() => setVzYears(5)}>5 J</Button>
          <Button size="sm" variant={isClient && vzYears === 10 ? 'default' : 'secondary'} onClick={() => setVzYears(10)}>10 J</Button>
          <Button size="sm" variant={isClient && vzYears === 15 ? 'default' : 'secondary'} onClick={() => setVzYears(15)}>15 J</Button>
        </div>
      )
    },
    roi: {
      title: "ROI",
      tooltip: "Return on Investment (Kapitalrendite) = FCF / (Kaufpreis + Nebenkosten). Zeigt die Rendite auf die Gesamtinvestition (unabhängig von Finanzierung) für das jeweilige Jahr oder den Durchschnitt.",
      content: (
        <Key
          label={!isClient ? 'ROI Startwert' : roiYears === 0 ? 'ROI Durchschnitt über Laufzeit' : roiYears === 1 ? 'ROI Startwert' : `ROI Jahr ${roiYears}`}
          value={roiValue === null ? '—' : formatPercent(roiValue)}
          sub={`Investition (KP + NK): ${fmtEUR(investKPplusNK)}`}
          tooltip={roiValue === null ? 'Eingaben prüfen' : 'ROI = FCF / (Kaufpreis + Nebenkosten)'}
        />
      ),
      controls: (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant={isClient && roiYears === 1 ? 'default' : 'secondary'} onClick={() => setRoiYears(1)}>Startwert</Button>
          <Button size="sm" variant={isClient && roiYears === 0 ? 'default' : 'secondary'} onClick={() => setRoiYears(0)}>∿ Durchschnitt</Button>
        </div>
      )
    },
    roe: {
      title: "ROE (Eigenkapitalrendite)",
      tooltip: "Return on Equity = FCF / eingesetztes Eigenkapital. Zeigt die Rendite auf das tatsächlich eingesetzte Eigenkapital für das jeweilige Jahr oder den Durchschnitt über die Laufzeit.",
      content: (
        <Key
          label={!isClient ? 'ROE Durchschnitt über Laufzeit' : roeYears === 0 ? 'ROE Durchschnitt über Laufzeit' : roeYears === 1 ? 'ROE Startwert' : `ROE Jahr ${roeYears}`}
          value={roeValue === null ? '—' : formatPercent(roeValue)}
          sub={`Basis: EK₀ ${fmtEUR((nkInLoan ? V0 : V0 + NKabs) - L0)}`}
          tooltip={'ROE = FCF / eingesetztes Eigenkapital (EK₀)'}
        />
      ),
      controls: (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant={isClient && roeYears === 1 ? 'default' : 'secondary'} onClick={() => setRoeYears(1)}>Startwert</Button>
          <Button size="sm" variant={isClient && roeYears === 0 ? 'default' : 'secondary'} onClick={() => setRoeYears(0)}>∿ Durchschnitt</Button>
        </div>
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
          sub={`${cfg.units?.length || 0} Einheiten, Ø ${fmt(totalFlaeche / (cfg.units?.length || 1))} m²`}
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
    }
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Lade...</p>
        </div>
      </div>
    );
  }

  // Zeige Projektauswahl wenn kein Projekt geladen ist
  if (showProjectSelection) {
    return (
      <ProtectedRoute>
        <ProjectSelection 
          onProjectLoad={handleProjectLoad}
        />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Einstellungs-Panel - Vollbild */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 z-60 bg-white dark:bg-slate-900 transform transition-all duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Einstellungen
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Case:</span>
              <div className="flex border rounded-lg shadow bg-white dark:bg-slate-800 overflow-hidden">
                {SCENARIOS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    className={`px-3 py-1.5 text-xs ${
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
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {scenario !== "base" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyFromBase}
                className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Aus Base Case übernehmen</span>
                <span className="sm:hidden">Base übernehmen</span>
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
                      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="w-full">
              <SettingsTabs
                tabs={[
                  {
                    id: "objekt",
                    title: "Objekt",
                    icon: Building,
                    content: (
                      <SettingContent 
                        title="Objekt-Details"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
              {/* Rechtsform */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Rechtsform</label>
                <select
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-xs transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  value={cfg.rechtsform}
                  onChange={(e) => setCfg({ ...cfg, rechtsform: e.target.value as Assumptions['rechtsform'] })}
                >
                  {(['Privatperson','Einzelunternehmen','OG','KG','GmbH','GmbH & Co KG','AG','Verein','Stiftung','Sonstige'] as const).map(rf => (
                    <option key={rf} value={rf}>{rf}</option>
                  ))}
                </select>
              </div>

              {/* Adresse */}
               <div className="space-y-2">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Adresse</label>
                 <AddressAutocomplete
                   value={cfg.adresse}
                   onChange={(value) => setCfg({ ...cfg, adresse: value })}
                   placeholder="Adresse eingeben"
                   className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-xs transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                   showValidationStatus={true}
                   onAddressSelect={(address) => {
                     // Optional: Automatische Stadtteil-Erkennung basierend auf der Adresse
                     if (address.address?.city) {
                       const city = address.address.city.toLowerCase();
                       if (city.includes('salzburg')) {
                         // Versuche den Stadtteil basierend auf der Adresse zu erkennen
                         // Dies könnte erweitert werden, um spezifische Stadtteile zu erkennen
                       }
                     }
                   }}
                 />
               </div>
               
               {/* Objekttyp-Auswahl */}
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Objekttyp</label>
                   <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
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
                       <div className="flex items-center gap-2">
                         <label className="text-xs font-medium text-slate-600 dark:text-slate-400">HWB (kWh/m²a)</label>
                         <InfoTooltip content="Heizwärmebedarf: Gibt den jährlichen Heizwärmebedarf pro Quadratmeter Nutzfläche an. Niedrigere Werte bedeuten bessere Energieeffizienz." />
                       </div>
                       <input
                         type="number"
                         value={cfg.energiewerte?.hwb || 0}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, hwb: parseInt(e.target.value) || 0 } 
                         })}
                         className="w-full px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         placeholder="z.B. 120"
                       />
                     </div>
                     <div className="space-y-2">
                       <div className="flex items-center gap-2">
                         <label className="text-xs font-medium text-slate-600 dark:text-slate-400">FGEE</label>
                         <InfoTooltip content="Faktor für Gebäudeheizung: Verhältnis zwischen tatsächlichem und theoretischem Heizwärmebedarf. Werte unter 1.0 zeigen gute Energieeffizienz." />
                       </div>
                       <input
                         type="number"
                         step="0.1"
                         value={cfg.energiewerte?.fgee || 0}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, fgee: parseFloat(e.target.value) || 0 } 
                         })}
                         className="w-full px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         placeholder="z.B. 0.8"
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Heizung</label>
                       <select
                         value={cfg.energiewerte?.heizung || ''}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, heizung: e.target.value } 
                         })}
                         className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                       >
                         <option value="Gas">Gas</option>
                         <option value="Öl">Öl</option>
                         <option value="Fernwärme">Fernwärme</option>
                         <option value="Wärmepumpe">Wärmepumpe</option>
                         <option value="Pellet">Pellet</option>
                         <option value="Sonstiges">Sonstiges</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Dachung</label>
                       <select
                         value={cfg.energiewerte?.dachung || ''}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, dachung: e.target.value } 
                         })}
                         className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
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
                         value={cfg.energiewerte?.fenster || ''}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, fenster: e.target.value } 
                         })}
                         className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                       >
                         <option value="Einfachverglasung">Einfachverglasung</option>
                         <option value="Doppelverglasung">Doppelverglasung</option>
                         <option value="Dreifachverglasung">Dreifachverglasung</option>
                         <option value="Sonstiges">Sonstiges</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Wärmedämmung</label>
                       <select
                         value={cfg.energiewerte?.waermedaemmung || ''}
                         onChange={(e) => setCfg({ 
                           ...cfg, 
                           energiewerte: { ...cfg.energiewerte, waermedaemmung: e.target.value } 
                         })}
                         className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                       >
                         <option value="Keine">Keine</option>
                         <option value="Teilweise">Teilweise</option>
                         <option value="Vollständig">Vollständig</option>
                         <option value="Hochwertig">Hochwertig</option>
                       </select>
                     </div>
                   </div>
                 </div>
                 
                 {/* Sanierungen */}
                 <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                   <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sanierungen</label>
                   <div className="space-y-2">
                     {cfg.sanierungen?.map((sanierung, idx) => (
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
                             const newSanierungen = cfg.sanierungen?.filter((_, i) => i !== idx) || [];
                             setCfg({ ...cfg, sanierungen: newSanierungen });
                           }}
                         >
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
                     <button 
                       onClick={() => setCfg({ ...cfg, sanierungen: [...cfg.sanierungen, ''] })}
                       className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors duration-200 mt-2"
                     >
                       <Plus className="w-4 h-4" /> Sanierung
                     </button>
                   </div>
                   </div>
                 </div>
                 
                 {/* Einheiten-Verwaltung nur bei bestimmten Objekttypen */}
                 {(cfg.objektTyp === 'zinshaus' || cfg.objektTyp === 'hotel' || cfg.objektTyp === 'büro') && (
                   <>
                     <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                       <h4 className="font-medium text-sm mb-3">Einheiten verwalten</h4>
                       <button 
                         onClick={addUnit} 
                         className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors duration-200 mb-4 mt-2"
                       >
                         <Plus className="w-4 h-4" /> Einheit
                       </button>
                       
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
                                 units: cfg.units?.map((u) => ({ ...u, miete: u.miete * factor })) || [],
                               });
                             }}
                           >
                             Anwenden
                           </Button>
                         </div>
                       )}
                       
                <div className="space-y-3">
                  {cfg.units?.map((u, idx) => (
                    <details key={idx} className="group border rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors list-none">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">Top {idx + 1}</div>
                          {u.bezeichnung && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">({u.bezeichnung})</span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {u.flaeche}m² • {u.miete}€/m²
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUnit(idx);
                            }}
                            className="w-8 h-8 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="w-6 h-6 flex items-center justify-center group-open:rotate-180 transition-transform">
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                      </summary>
                      <div className="px-4 pb-4 space-y-3">
                           <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                             <NumField label="m²" value={u.flaeche} onChange={(n) => updateUnit(idx, { ...u, flaeche: n })} />
                             <NumField label="Miete €/m²" value={u.miete} step={0.5} onChange={(n) => updateUnit(idx, { ...u, miete: n })} />
                           </div>
                           <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
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
                           
                           {/* Objektdetails - für Wohnungen und Gewerbe */}
                           {(u.typ === 'wohnung' || u.typ === 'gewerbe') && (
                             <div className="space-y-4 border-t border-slate-200 dark:border-slate-600 pt-4">
                               <h6 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                 {u.typ === 'wohnung' ? 'Wohnungsdetails' : 'Gewerbedetails'}
                               </h6>
                               
                               {/* Grunddaten */}
                               <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                 <NumField 
                                   label={u.typ === 'wohnung' ? 'Zimmer' : 'Räume'} 
                                   value={u.zimmer || 0} 
                                   onChange={(n) => updateUnit(idx, { ...u, zimmer: n })} 
                                 />
                                 {u.typ === 'wohnung' && (
                                   <NumField label="Schlafzimmer" value={u.schlafzimmer || 0} onChange={(n) => updateUnit(idx, { ...u, schlafzimmer: n })} />
                                 )}
                                 <NumField label="WC" value={u.wc || 0} onChange={(n) => updateUnit(idx, { ...u, wc: n })} />
                               </div>
                               
                               {/* Außenbereiche */}
                               <div className="space-y-3">
                                 <div className="flex items-center gap-3">
                                   <input
                                     type="checkbox"
                                     checked={u.balkon || false}
                                     onChange={(e) => updateUnit(idx, { ...u, balkon: e.target.checked })}
                                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                   />
                                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Balkon</label>
                                   {u.balkon && (
                                     <NumField label="m²" value={u.balkonGroesse || 0} step={0.5} onChange={(n) => updateUnit(idx, { ...u, balkonGroesse: n })} />
                                   )}
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                   <input
                                     type="checkbox"
                                     checked={u.terrasse || false}
                                     onChange={(e) => updateUnit(idx, { ...u, terrasse: e.target.checked })}
                                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                   />
                                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Terrasse</label>
                                   {u.terrasse && (
                                     <NumField label="m²" value={u.terrasseGroesse || 0} step={0.5} onChange={(n) => updateUnit(idx, { ...u, terrasseGroesse: n })} />
                                   )}
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                   <input
                                     type="checkbox"
                                     checked={u.garten || false}
                                     onChange={(e) => updateUnit(idx, { ...u, garten: e.target.checked })}
                                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                   />
                                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Garten</label>
                                   {u.garten && (
                                     <NumField label="m²" value={u.gartenGroesse || 0} step={0.5} onChange={(n) => updateUnit(idx, { ...u, gartenGroesse: n })} />
                                   )}
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                   <input
                                     type="checkbox"
                                     checked={u.keller || false}
                                     onChange={(e) => updateUnit(idx, { ...u, keller: e.target.checked })}
                                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                   />
                                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Keller</label>
                                   {u.keller && (
                                     <NumField label="m²" value={u.kellerGroesse || 0} step={0.5} onChange={(n) => updateUnit(idx, { ...u, kellerGroesse: n })} />
                                   )}
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                   <input
                                     type="checkbox"
                                     checked={u.parkplatz || false}
                                     onChange={(e) => updateUnit(idx, { ...u, parkplatz: e.target.checked })}
                                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                   />
                                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Parkplatz</label>
                                   {u.parkplatz && (
                                     <NumField label="Anzahl" value={u.parkplatzAnzahl || 0} onChange={(n) => updateUnit(idx, { ...u, parkplatzAnzahl: n })} />
                                   )}
                                 </div>
                               </div>
                               
                               {/* Ausstattung */}
                               <div className="space-y-2">
                                 <div className="flex items-center gap-3">
                                   <input
                                     type="checkbox"
                                     checked={u.aufzug || false}
                                     onChange={(e) => updateUnit(idx, { ...u, aufzug: e.target.checked })}
                                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                   />
                                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aufzug</label>
                                 </div>
                                 
                                 {u.typ === 'wohnung' && (
                                   <>
                                     <div className="flex items-center gap-3">
                                       <input
                                         type="checkbox"
                                         checked={u.einbaukueche || false}
                                         onChange={(e) => updateUnit(idx, { ...u, einbaukueche: e.target.checked })}
                                         className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                       />
                                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Einbauküche</label>
                                     </div>
                                     
                                     <div className="flex items-center gap-3">
                                       <input
                                         type="checkbox"
                                         checked={u.badewanne || false}
                                         onChange={(e) => updateUnit(idx, { ...u, badewanne: e.target.checked })}
                                         className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                       />
                                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Badewanne</label>
                                     </div>
                                     
                                     <div className="flex items-center gap-3">
                                       <input
                                         type="checkbox"
                                         checked={u.dusche || false}
                                         onChange={(e) => updateUnit(idx, { ...u, dusche: e.target.checked })}
                                         className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                       />
                                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dusche</label>
                                     </div>
                                   </>
                                 )}
                               </div>
                             </div>
                           )}
                      </div>
                    </details>
                ))}
                  </div>
                     </div>
                   </>
                 )}
                 
                 {/* Einzelne Objekte (Wohnung, Gewerbe, etc.) */}
                 {(cfg.objektTyp === 'wohnung' || cfg.objektTyp === 'gewerbe' || cfg.objektTyp === 'lager' || cfg.objektTyp === 'sonstiges') && (
                   <div className="border-t pt-4">
                     <h4 className="font-medium text-sm mb-3">Objekt-Details</h4>
                     <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                       <NumField 
                         label="Gesamtfläche (m²)" 
                         value={(cfg.units?.length || 0) > 0 ? cfg.units[0].flaeche : 0} 
                         onChange={(n) => {
                           if ((cfg.units?.length || 0) > 0) {
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
                         value={(cfg.units?.length || 0) > 0 ? cfg.units[0].miete : avgMiete} 
                         step={0.5} 
                         onChange={(n) => {
                           if ((cfg.units?.length || 0) > 0) {
                             updateUnit(0, { ...cfg.units[0], miete: n });
                           } else {
                             setCfg({ ...cfg, units: [{ 
                               flaeche: (cfg.units?.length || 0) > 0 ? cfg.units[0].flaeche : 0, 
                               miete: n, 
                               typ: cfg.objektTyp === 'wohnung' ? 'wohnung' : 'gewerbe', 
                               stockwerk: 'Objekt', 
                               bezeichnung: cfg.objektTyp.charAt(0).toUpperCase() + cfg.objektTyp.slice(1) 
                             }] });
                           }
                         }} 
                       />
                     </div>
                     
                     {/* Detaillierte Objekteigenschaften für Einzelobjekte */}
                     {(cfg.units?.length || 0) > 0 && (
                       <div className="mt-4 space-y-4 border-t border-slate-200 dark:border-slate-600 pt-4">
                         <h6 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                           {cfg.objektTyp === 'wohnung' ? 'Wohnungsdetails' : 'Gewerbedetails'}
                         </h6>
                         
                         {/* Grunddaten */}
                         <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                           <NumField 
                             label={cfg.objektTyp === 'wohnung' ? 'Zimmer' : 'Räume'} 
                             value={cfg.units[0].zimmer || 0} 
                             onChange={(n) => updateUnit(0, { ...cfg.units[0], zimmer: n })} 
                           />
                           {cfg.objektTyp === 'wohnung' && (
                             <NumField label="Schlafzimmer" value={cfg.units[0].schlafzimmer || 0} onChange={(n) => updateUnit(0, { ...cfg.units[0], schlafzimmer: n })} />
                           )}
                           <NumField label="WC" value={cfg.units[0].wc || 0} onChange={(n) => updateUnit(0, { ...cfg.units[0], wc: n })} />
                         </div>
                         
                         {/* Außenbereiche */}
                         <div className="space-y-3">
                           <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={cfg.units[0].balkon || false}
                               onChange={(e) => updateUnit(0, { ...cfg.units[0], balkon: e.target.checked })}
                               className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Balkon</label>
                             {cfg.units[0].balkon && (
                               <NumField label="m²" value={cfg.units[0].balkonGroesse || 0} step={0.5} onChange={(n) => updateUnit(0, { ...cfg.units[0], balkonGroesse: n })} />
                             )}
                           </div>
                           
                           <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={cfg.units[0].terrasse || false}
                               onChange={(e) => updateUnit(0, { ...cfg.units[0], terrasse: e.target.checked })}
                               className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Terrasse</label>
                             {cfg.units[0].terrasse && (
                               <NumField label="m²" value={cfg.units[0].terrasseGroesse || 0} step={0.5} onChange={(n) => updateUnit(0, { ...cfg.units[0], terrasseGroesse: n })} />
                             )}
                           </div>
                           
                           <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={cfg.units[0].garten || false}
                               onChange={(e) => updateUnit(0, { ...cfg.units[0], garten: e.target.checked })}
                               className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Garten</label>
                             {cfg.units[0].garten && (
                               <NumField label="m²" value={cfg.units[0].gartenGroesse || 0} step={0.5} onChange={(n) => updateUnit(0, { ...cfg.units[0], gartenGroesse: n })} />
                             )}
                           </div>
                           
                           <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={cfg.units[0].keller || false}
                               onChange={(e) => updateUnit(0, { ...cfg.units[0], keller: e.target.checked })}
                               className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Keller</label>
                             {cfg.units[0].keller && (
                               <NumField label="m²" value={cfg.units[0].kellerGroesse || 0} step={0.5} onChange={(n) => updateUnit(0, { ...cfg.units[0], kellerGroesse: n })} />
                             )}
                           </div>
                           
                           <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={cfg.units[0].parkplatz || false}
                               onChange={(e) => updateUnit(0, { ...cfg.units[0], parkplatz: e.target.checked })}
                               className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Parkplatz</label>
                             {cfg.units[0].parkplatz && (
                               <NumField label="Anzahl" value={cfg.units[0].parkplatzAnzahl || 0} onChange={(n) => updateUnit(0, { ...cfg.units[0], parkplatzAnzahl: n })} />
                             )}
                           </div>
                         </div>
                         
                         {/* Ausstattung */}
                         <div className="space-y-2">
                           <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={cfg.units[0].aufzug || false}
                               onChange={(e) => updateUnit(0, { ...cfg.units[0], aufzug: e.target.checked })}
                               className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aufzug</label>
                           </div>
                           
                           {cfg.objektTyp === 'wohnung' && (
                             <>
                               <div className="flex items-center gap-3">
                                 <input
                                   type="checkbox"
                                   checked={cfg.units[0].einbaukueche || false}
                                   onChange={(e) => updateUnit(0, { ...cfg.units[0], einbaukueche: e.target.checked })}
                                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                 />
                                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Einbauküche</label>
                               </div>
                               
                               <div className="flex items-center gap-3">
                                 <input
                                   type="checkbox"
                                   checked={cfg.units[0].badewanne || false}
                                   onChange={(e) => updateUnit(0, { ...cfg.units[0], badewanne: e.target.checked })}
                                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                 />
                                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Badewanne</label>
                               </div>
                               
                               <div className="flex items-center gap-3">
                                 <input
                                   type="checkbox"
                                   checked={cfg.units[0].dusche || false}
                                   onChange={(e) => updateUnit(0, { ...cfg.units[0], dusche: e.target.checked })}
                                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                 />
                                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dusche</label>
                               </div>
                             </>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  },
                  {
                    id: "finanzierung",
                    title: "Finanzierung",
                    icon: PiggyBank,
                    content: (
                      <SettingContent 
                        title="Finanzierungsdetails"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
              <div className="grid grid-cols-2 gap-2">
                <NumField label="Kaufpreis (€)" value={cfg.kaufpreis} step={1000} onChange={(n) => setCfg({ ...cfg, kaufpreis: n })} />
                {/* Nebenkosten-Sektion wird nach unten verschoben */}
                <div className="hidden" />
                <NumField label="EK-Quote %" value={cfg.ekQuote * 100} step={1} onChange={(n) => setCfg({ ...cfg, ekQuote: n / 100 })} suffix="%" />
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={cfg.nkInLoan ?? true}
                      onChange={(e) => setCfg({ ...cfg, nkInLoan: e.target.checked })}
                      className="accent-blue-600"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Nebenkosten im Darlehen mitfinanzieren</span>
                  </label>
                </div>
                <NumField label="Tilgung %" value={cfg.tilgung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, tilgung: n / 100 })} suffix="%" />
                <NumField label="Zins (Darlehen) %" value={fin.zinssatz * 100} step={0.1} onChange={(n) => setFin({ ...fin, zinssatz: n / 100 })} suffix="%" />
              </div>

              {/* Nebenkosten-Sektion unten */}
              <div className="mt-3 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Nebenkosten</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <span>Modus:</span>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="nk-mode"
                          checked={(cfg.nkMode || 'EUR') === 'EUR'}
                          onChange={() => {
                            const next = { ...cfg, nkMode: 'EUR' as const };
                            const sum = (next.nkMakler || 0) + (next.nkVertragserrichter || 0) + (next.nkGrunderwerbsteuer || 0) + (next.nkEintragungsgebuehr || 0) + (next.nkPfandEintragungsgebuehr || 0);
                            const pct = next.kaufpreis > 0 ? Math.round((sum / next.kaufpreis) * 10000) / 10000 : 0;
                            setCfg({ ...next, nebenkosten: pct });
                          }}
                          className="accent-blue-600"
                        />
                        <span>€</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="nk-mode"
                          checked={(cfg.nkMode || 'EUR') === 'PCT'}
                          onChange={() => {
                            const next = { ...cfg, nkMode: 'PCT' as const };
                            const pctSum = ((next.nkMaklerPct || 0) + (next.nkVertragserrichterPct || 0) + (next.nkGrunderwerbsteuerPct || 0) + (next.nkEintragungsgebuehrPct || 0) + (next.nkPfandEintragungsgebuehrPct || 0)) / 100;
                            setCfg({ ...next, nebenkosten: Math.round(pctSum * 10000) / 10000 });
                          }}
                          className="accent-blue-600"
                        />
                        <span>%</span>
                      </label>
                    </div>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">
                      {(() => {
                        const sumAbs = (cfg.nkMode || 'EUR') === 'EUR'
                          ? (cfg.nkMakler || 0) + (cfg.nkVertragserrichter || 0) + (cfg.nkGrunderwerbsteuer || 0) + (cfg.nkEintragungsgebuehr || 0) + (cfg.nkPfandEintragungsgebuehr || 0)
                          : Math.round(((cfg.kaufpreis || 0) * (((cfg.nkMaklerPct || 0) + (cfg.nkVertragserrichterPct || 0) + (cfg.nkGrunderwerbsteuerPct || 0) + (cfg.nkEintragungsgebuehrPct || 0) + (cfg.nkPfandEintragungsgebuehrPct || 0)) / 100)) * 100) / 100;
                        const pct = cfg.kaufpreis > 0 ? Math.round((sumAbs / cfg.kaufpreis) * 1000) / 10 : 0;
                        return `Summe: ${fmtEUR(sumAbs)}${cfg.kaufpreis > 0 ? ` (${pct}%)` : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(cfg.nkMode || 'EUR') === 'EUR' ? (
                    <MoneyField label="Makler" value={cfg.nkMakler || 0} onChange={(n) => {
                      const next = { ...cfg, nkMakler: n };
                      const sum = (next.nkMakler || 0) + (next.nkVertragserrichter || 0) + (next.nkGrunderwerbsteuer || 0) + (next.nkEintragungsgebuehr || 0) + (next.nkPfandEintragungsgebuehr || 0);
                      const pct = next.kaufpreis > 0 ? Math.round((sum / next.kaufpreis) * 10000) / 10000 : 0;
                      setCfg({ ...next, nebenkosten: pct });
                    }} />
                  ) : (
                    <PercentField label="Makler" value={cfg.nkMaklerPct || 0} placeholder={3}
                      onChange={(n) => {
                      const next = { ...cfg, nkMaklerPct: n };
                      const pctSum = ((next.nkMaklerPct || 0) + (next.nkVertragserrichterPct || 0) + (next.nkGrunderwerbsteuerPct || 0) + (next.nkEintragungsgebuehrPct || 0) + (next.nkPfandEintragungsgebuehrPct || 0)) / 100;
                      setCfg({ ...next, nebenkosten: Math.round(pctSum * 10000) / 10000 });
                    }} />
                  )}
                  {(cfg.nkMode || 'EUR') === 'EUR' ? (
                    <MoneyField label="Vertragserrichter" value={cfg.nkVertragserrichter || 0} onChange={(n) => {
                      const next = { ...cfg, nkVertragserrichter: n };
                      const sum = (next.nkMakler || 0) + (next.nkVertragserrichter || 0) + (next.nkGrunderwerbsteuer || 0) + (next.nkEintragungsgebuehr || 0) + (next.nkPfandEintragungsgebuehr || 0);
                      const pct = next.kaufpreis > 0 ? Math.round((sum / next.kaufpreis) * 10000) / 10000 : 0;
                      setCfg({ ...next, nebenkosten: pct });
                    }} />
                  ) : (
                    <PercentField label="Vertragserrichter" value={cfg.nkVertragserrichterPct || 0} placeholder={1}
                      onChange={(n) => {
                      const next = { ...cfg, nkVertragserrichterPct: n };
                      const pctSum = ((next.nkMaklerPct || 0) + (next.nkVertragserrichterPct || 0) + (next.nkGrunderwerbsteuerPct || 0) + (next.nkEintragungsgebuehrPct || 0) + (next.nkPfandEintragungsgebuehrPct || 0)) / 100;
                      setCfg({ ...next, nebenkosten: Math.round(pctSum * 10000) / 10000 });
                    }} />
                  )}
                  {(cfg.nkMode || 'EUR') === 'EUR' ? (
                    <MoneyField label="Grunderwerbsteuer" value={cfg.nkGrunderwerbsteuer || 0} onChange={(n) => {
                      const next = { ...cfg, nkGrunderwerbsteuer: n };
                      const sum = (next.nkMakler || 0) + (next.nkVertragserrichter || 0) + (next.nkGrunderwerbsteuer || 0) + (next.nkEintragungsgebuehr || 0) + (next.nkPfandEintragungsgebuehr || 0);
                      const pct = next.kaufpreis > 0 ? Math.round((sum / next.kaufpreis) * 10000) / 10000 : 0;
                      setCfg({ ...next, nebenkosten: pct });
                    }} />
                  ) : (
                    <PercentField label="Grunderwerbsteuer" value={cfg.nkGrunderwerbsteuerPct || 0} placeholder={3.5}
                      onChange={(n) => {
                      const next = { ...cfg, nkGrunderwerbsteuerPct: n };
                      const pctSum = ((next.nkMaklerPct || 0) + (next.nkVertragserrichterPct || 0) + (next.nkGrunderwerbsteuerPct || 0) + (next.nkEintragungsgebuehrPct || 0) + (next.nkPfandEintragungsgebuehrPct || 0)) / 100;
                      setCfg({ ...next, nebenkosten: Math.round(pctSum * 10000) / 10000 });
                    }} />
                  )}
                  {(cfg.nkMode || 'EUR') === 'EUR' ? (
                    <MoneyField label="Eintragungsgebühr" value={cfg.nkEintragungsgebuehr || 0} onChange={(n) => {
                      const next = { ...cfg, nkEintragungsgebuehr: n };
                      const sum = (next.nkMakler || 0) + (next.nkVertragserrichter || 0) + (next.nkGrunderwerbsteuer || 0) + (next.nkEintragungsgebuehr || 0) + (next.nkPfandEintragungsgebuehr || 0);
                      const pct = next.kaufpreis > 0 ? Math.round((sum / next.kaufpreis) * 10000) / 10000 : 0;
                      setCfg({ ...next, nebenkosten: pct });
                    }} />
                  ) : (
                    <PercentField label="Eintragungsgebühr" value={cfg.nkEintragungsgebuehrPct || 0} placeholder={1.1}
                      onChange={(n) => {
                      const next = { ...cfg, nkEintragungsgebuehrPct: n };
                      const pctSum = ((next.nkMaklerPct || 0) + (next.nkVertragserrichterPct || 0) + (next.nkGrunderwerbsteuerPct || 0) + (next.nkEintragungsgebuehrPct || 0) + (next.nkPfandEintragungsgebuehrPct || 0)) / 100;
                      setCfg({ ...next, nebenkosten: Math.round(pctSum * 10000) / 10000 });
                    }} />
                  )}
                  {(cfg.nkMode || 'EUR') === 'EUR' ? (
                    <MoneyField label="Pfand-Eintragungsgebühr" value={cfg.nkPfandEintragungsgebuehr || 0} onChange={(n) => {
                      const next = { ...cfg, nkPfandEintragungsgebuehr: n };
                      const sum = (next.nkMakler || 0) + (next.nkVertragserrichter || 0) + (next.nkGrunderwerbsteuer || 0) + (next.nkEintragungsgebuehr || 0) + (next.nkPfandEintragungsgebuehr || 0);
                      const pct = next.kaufpreis > 0 ? Math.round((sum / next.kaufpreis) * 10000) / 10000 : 0;
                      setCfg({ ...next, nebenkosten: pct });
                    }} />
                  ) : (
                    <PercentField label="Pfand-Eintragungsgebühr" value={cfg.nkPfandEintragungsgebuehrPct || 0} placeholder={1.2}
                      onChange={(n) => {
                      const next = { ...cfg, nkPfandEintragungsgebuehrPct: n };
                      const pctSum = ((next.nkMaklerPct || 0) + (next.nkVertragserrichterPct || 0) + (next.nkGrunderwerbsteuerPct || 0) + (next.nkEintragungsgebuehrPct || 0) + (next.nkPfandEintragungsgebuehrPct || 0)) / 100;
                      setCfg({ ...next, nebenkosten: Math.round(pctSum * 10000) / 10000 });
                    }} />
                  )}
                </div>
              </div>

              {/* Wichtige Finanzierungs-Tags (außerhalb der Nebenkosten-Sektion) */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="text-sm px-3.5 py-1.5 shadow overflow-visible">
                  Laufzeit: {laufzeitAuto} J
                  <span className="ml-1 cursor-help">
                  <InfoTooltip
                    content={`Berechnung: Jährlich Zinsen = Restschuld × Zinssatz, Tilgung = max(0, Annuität − Zinsen). Restschuld sinkt um die Tilgung. Laufzeit = erstes Jahr mit Restschuld ≤ 0. Aktuell: Darlehen ${fmtEUR(fin.darlehen)}, Zinssatz ${Math.round((fin.zinssatz || 0) * 1000) / 10}%, Tilgungssatz ${Math.round((cfg.tilgung || 0) * 1000) / 10}%, Annuität ${fmtEUR(fin.annuitaet)}.`}
                    asButton={false}
                  />
                  </span>
                </Badge>
                <Badge className="text-sm px-3.5 py-1.5 shadow overflow-visible">
                  Darlehen: {fmtEUR(fin.darlehen)}
                  <span className="ml-1 cursor-help">
                  <InfoTooltip
                    content={`Formel: Darlehen = Kaufpreis ${fmtEUR(cfg.kaufpreis || 0)} + ${(cfg.nkInLoan ?? true) ? `Nebenkosten ${fmtEUR(NKabs)}` : "Nebenkosten 0 €"} − Eigenkapitalanteil ${fmtEUR((((cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? (cfg.kaufpreis || 0) + NKabs : (cfg.kaufpreis || 0)) * (cfg.ekQuote || 0)))}. (Eigenkapitalanteil = Basis × EK-Quote; Basis = ${(cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? 'Kaufpreis + NK' : 'Kaufpreis'}).`}
                    asButton={false}
                  />
                  </span>
                </Badge>
                <Badge className="text-sm px-3.5 py-1.5 shadow overflow-visible">
                  Annuität: {fmtEUR(fin.annuitaet)}
                  <span className="ml-1 cursor-help">
                  <InfoTooltip
                    content={`Formel: Annuität = Darlehen × (Zinssatz + Tilgungssatz). Aktuell: ${fmtEUR(fin.darlehen)} × (${Math.round((fin.zinssatz || 0) * 1000) / 10}% + ${Math.round((cfg.tilgung || 0) * 1000) / 10}%).`}
                    asButton={false}
                  />
                  </span>
                </Badge>
                <Badge className="text-sm px-3.5 py-1.5 shadow overflow-visible">
                  Eigenkapital: {fmtEUR(((((cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? (cfg.kaufpreis || 0) + NKabs : (cfg.kaufpreis || 0)) * (cfg.ekQuote || 0)) + ((cfg.nkInLoan ?? true) ? 0 : NKabs)))}
                  <span className="ml-1 cursor-help">
                  <InfoTooltip
                    content={`Formel: Eigenkapital = (Basis × EK-Quote) ${!(cfg.nkInLoan ?? true) ? '+ Nebenkosten' : '+ 0'}.
Basis = ${(cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? 'Kaufpreis + NK' : 'Kaufpreis'}; EK-Quote = ${Math.round((cfg.ekQuote || 0) * 100)}%.
Aktuell: (${(cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? `${fmtEUR((cfg.kaufpreis || 0) + NKabs)}` : `${fmtEUR(cfg.kaufpreis || 0)}`} × ${Math.round((cfg.ekQuote || 0) * 100)}%) ${!(cfg.nkInLoan ?? true) ? `+ ${fmtEUR(NKabs)}` : '+ 0'} = ${fmtEUR(((((cfg.ekQuoteBase || 'NETTO') === 'BRUTTO' ? (cfg.kaufpreis || 0) + NKabs : (cfg.kaufpreis || 0)) * (cfg.ekQuote || 0)) + ((cfg.nkInLoan ?? true) ? 0 : NKabs)))}.`}
                    asButton={false}
                  />
                  </span>
                </Badge>
              </div>
              
              {/* Haushaltsrechnung Toggle */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Haushaltsrechnung anzeigen</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Aktiviert das Modul für Kredit-Tragfähigkeitsprüfung
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.showHouseholdCalculation || false}
                      onChange={(e) => setCfg({ ...cfg, showHouseholdCalculation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              {/* Haushaltsrechnung - nur anzeigen wenn aktiviert */}
              {cfg.showHouseholdCalculation && (
                <div className="mt-6 space-y-6">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Haushaltsrechnung & Kredit-Tragfähigkeit
                    </h3>
                    
                    {/* Summary Card */}
                    <div className="mb-6">
                      <HouseholdSummaryCard result={householdResult} />
                    </div>
                    
                    {/* Form */}
                    <div className="mb-6">
                      <HouseholdForm
                        initialData={householdInputs}
                        onSubmit={handleHouseholdSubmit}
                        onChange={handleHouseholdChange}
                        // Kreditdaten aus Finanzierungseinstellungen übernehmen
                        loanAmount={fin.darlehen}
                        interestRate={fin.zinssatz}
                        termYears={laufzeitAuto}
                      />
                    </div>
                    
                    {/* Breakdown Table */}
                    {householdResult && (
                      <div className="mb-6">
                        <HouseholdBreakdownTable result={householdResult} />
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="mb-6">
                      <HouseholdActionsBar 
                        result={householdResult} 
                        onReset={() => {
                          if (confirm('Möchten Sie alle Haushaltsdaten zurücksetzen?')) {
                            setHouseholdInputs(DEFAULT_HOUSEHOLD_INPUTS);
                            setHouseholdResult(null);
                            clearHouseholdData();
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  },
                  {
                    id: "steuer",
                    title: "Steuer",
                    icon: Percent,
                    content: (
                      <SettingContent 
                        title="Steuerliche Einstellungen"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
              <div className="grid grid-cols-1 gap-3">
                {/* Sektion: Einkommensteuer */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <NumField label="ESt-Satz %" value={fin.steuerRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, steuerRate: n / 100 })} suffix="%" />
                  <MoneyField label="Grundsteuer (€ p.a.)" value={fin.grundsteuerAnnual || 0} onChange={(n) => setFin({ ...fin, grundsteuerAnnual: n })} />
                </div>
                {/* Sektion: Gebäudewert & AfA‑Satz */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <SelectField
                    label="Gebäudewert-Modus"
                    value={fin.gebaeudewertMode || 'PCT'}
                    options={["PCT", "ABS"]}
                    onChange={(mode) => setFin({ ...fin, gebaeudewertMode: mode as 'PCT' | 'ABS' })}
                  />
                  {fin.gebaeudewertMode !== 'ABS' ? (
                    <NumField label="Gebäudewert % vom KP" value={(fin.gebaeudewertPct ?? 1) * 100} step={1} onChange={(n) => setFin({ ...fin, gebaeudewertPct: n / 100 })} suffix="%" placeholder={60} />
                  ) : (
                    <NumField label="Gebäudewert (€)" value={fin.gebaeudewertAbs || 0} step={1000} onChange={(n) => setFin({ ...fin, gebaeudewertAbs: n })} />
                  )}
                  <NumField label="AfA‑Satz %" value={fin.afaRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, afaRate: n / 100 })} suffix="%" placeholder={1.5} />
                  <NumField label="AfA (€ p.a.)" value={(fin.gebaeudewertMode === 'ABS' ? (fin.gebaeudewertAbs || 0) : (cfg.kaufpreis * (fin.gebaeudewertPct ?? 1))) * fin.afaRate} readOnly />
                  <div className="col-span-full grid grid-cols-1 sm:grid-cols-4 gap-2 mt-1">
                    <MoneyField label="Inventar (€)" value={fin.inventarAmount || 0} onChange={(n) => setFin({ ...fin, inventarAmount: n })} />
                    <NumField label="Restnutzungsdauer (Jahre)" value={fin.inventarRestYears || 0} step={1} onChange={(n) => setFin({ ...fin, inventarRestYears: n })} />
                    <NumField label="AfA Inventar (€ p.a.)" value={(fin.inventarAmount && fin.inventarRestYears && fin.inventarAmount > 0 && fin.inventarRestYears > 0) ? (fin.inventarAmount / fin.inventarRestYears) : 0} readOnly />
                    <NumField label="AfA Inventar %" value={(fin.inventarRestYears && fin.inventarRestYears > 0) ? (100 / fin.inventarRestYears) : 0} readOnly suffix="%" />
                  </div>

                  {(() => {
                    const isResidential = cfg.objektTyp === 'wohnung' || cfg.objektTyp === 'zinshaus';
                    const suggestedAfaRate = isResidential
                      ? (cfg.baujahr > 0 && cfg.baujahr < 1915 ? 0.02 : 0.015)
                      : 0.025;
                    const suggestedLabel = `${(suggestedAfaRate * 100).toFixed(1)}%`;
                    return (
                      <div className="col-span-full mt-2 p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300 dark:bg-amber-900/20 dark:text-amber-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">AfA‑Vorschlag: {suggestedLabel}</div>
                            <div className="text-xs mt-1">
                              Basierend auf Objektart und Baujahr ({isResidential ? 'Wohngebäude' : 'Betrieb/Gewerbe'}; {cfg.baujahr || 'n/a'}).
                              Bitte prüfen, ob Ausnahmen (Gutachten, Denkmalschutz) vorliegen; Steuerberater empfohlen.
                            </div>
                          </div>
                          <button
                            onClick={() => setFin({ ...fin, afaRate: suggestedAfaRate })}
                            className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                          >
                            Vorschlag übernehmen
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* Sektion: Beschleunigte AfA (unten) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                  <div className="col-span-2 md:col-span-3 flex items-center gap-2">
                    <label className="text-xs sm:text-sm">Beschleunigte AfA aktiv</label>
                    <input type="checkbox" checked={!!fin.accelAfaEnabled} onChange={(e) => setFin({ ...fin, accelAfaEnabled: e.target.checked })} />
                    <InfoTooltip asButton={false} content="Für Gebäude nach 30.06.2020: Jahr 1 bis 4,5%, Jahr 2 bis 3,0%, ab Jahr 3 normaler AfA‑Satz." />
                  </div>
                  {(() => {
                    const gebaeudewert = fin.gebaeudewertMode === 'ABS' ? (fin.gebaeudewertAbs || 0) : (cfg.kaufpreis * (fin.gebaeudewertPct ?? 1));
                    const y1 = fin.accelAfaEnabled ? gebaeudewert * Math.min((fin.accelAfaY1Pct ?? 0) / 100, 0.045) : 0;
                    const y2 = fin.accelAfaEnabled ? gebaeudewert * Math.min((fin.accelAfaY2Pct ?? 0) / 100, 0.03) : 0;
                    return (
                      <div className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6 grid grid-cols-1 gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <NumField label="AfA Jahr 1 max %" value={(fin.accelAfaY1Pct ?? 0)} step={0.1} onChange={(n) => setFin({ ...fin, accelAfaY1Pct: n })} suffix="%" readOnly={!fin.accelAfaEnabled} placeholder={0} />
                          <NumField label="AfA Jahr 1 (€)" value={y1} readOnly />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <NumField label="AfA Jahr 2 max %" value={(fin.accelAfaY2Pct ?? 0)} step={0.1} onChange={(n) => setFin({ ...fin, accelAfaY2Pct: n })} suffix="%" readOnly={!fin.accelAfaEnabled} placeholder={0} />
                          <NumField label="AfA Jahr 2 (€)" value={y2} readOnly />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  },
                  {
                    id: "kosten-einnahmen",
                    title: "Kosten & Einnahmen",
                    icon: Wallet,
                    content: (
                      <SettingContent 
                        title="Kosten & Einnahmen"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
              <div className="grid grid-cols-2 gap-2">
                <NumField label="BK €/m²/Monat" value={fin.bkM2} step={0.1} onChange={(n) => setFin({ ...fin, bkM2: n })} />
                <NumField label="BK-Steigerung %" value={fin.bkWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, bkWachstum: n / 100 })} suffix="%" />
                <NumField label="Jährliche Bewirtschaftungskosten (€)" value={bkJ1} readOnly />
                <NumField label="Leerstand %" value={fin.leerstand * 100} step={0.1} onChange={(n) => setFin({ ...fin, leerstand: n / 100 })} suffix="%" />
                <NumField label="Einnahmen J1 (€)" value={fin.einnahmenJ1} readOnly />
                <NumField label="Einnahmen-Wachstum %" value={fin.einnahmenWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, einnahmenWachstum: n / 100 })} suffix="%" />
              </div>
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  },
                  {
                    id: "marktannahmen",
                    title: "Marktannahmen",
                    icon: TrendingUp,
                    content: (
                      <SettingContent 
                        title="Marktannahmen"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                <NumField label="Marktmiete (€/m²)" value={cfg.marktMiete} step={0.5} onChange={(n) => setCfg({ ...cfg, marktMiete: n })} />
                <NumField label="Wertsteigerung %" value={cfg.wertSteigerung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, wertSteigerung: n / 100 })} suffix="%" />
                <SelectField
                  label="Stadtteil"
                  value={cfg.stadtteil}
                  options={DISTRICT_PRICES[cfg.bauart]?.map((d) => d.ort) || []}
                  onChange={(s) => setCfg({ ...cfg, stadtteil: s as District })}
                />
              </div>
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  },
                  {
                    id: "upside-potenzial",
                    title: "Upside-Potenzial",
                    icon: TrendingUp,
                    content: (
                      <SettingContent 
                        title="Upside-Potenzial"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
              <UpsideForm
                scenarios={upsideState.scenarios}
                add={upsideState.add}
                update={upsideState.update}
                duplicate={upsideState.duplicate}
                remove={upsideState.remove}
              />
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  },
                  {
                    id: "projekt-checkliste",
                    title: "Projekt-Checkliste",
                    icon: CheckCircle2,
                    content: (
                      <SettingContent 
                        title="Projekt-Checkliste"
                        headerRight={(
                          (cfg.rechtsform === 'Privatperson' || cfg.rechtsform === 'Verein')
                            ? <div className="px-2 py-1 text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-800">Bitte alle Zahlen Brutto eintragen</div>
                            : <div className="px-2 py-1 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">Bitte alle Zahlen Netto eintragen</div>
                        )}
                      >
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
                        <SettingsButtons
                          onResetProject={resetProject}
                          onSaveProject={saveCurrentProject}
                          onExportProject={undefined}
                          onImportProject={triggerImport}
                          onFinish={() => setOpen(false)}
                          onImportFile={handleImportFile}
                          importInputRef={importInputRef}
                        />
                      </SettingContent>
                    )
                  }
                ]}
                defaultTab="objekt"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projektübersicht */}
      {projOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md shadow-xl w-[min(90%,500px)] space-y-4">
            <h2 className="text-xl font-bold">Projektübersicht</h2>
            
            {/* Projekte */}
            {isAuthenticated ? (
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Meine Projekte {isLoadingProjects && "(Lädt...)"}
                </h3>
                <div className="max-h-[50vh] overflow-y-auto">
                  {apiProjects.length ? (
                    <ul className="space-y-2">
                      {apiProjects.map((project) => (
                        <li key={project.id} className="flex items-center justify-between">
                          <div className="flex-1 mr-2">
                            <div className="font-medium truncate">{project.name}</div>
                            {project.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {project.description}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                // TODO: Implementiere Laden von API-Projekt
                                console.log('Lade API-Projekt:', project);
                                setProjOpen(false);
                              }}
                            >
                              Laden
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteConfirm({ name: project.name, id: project.id })}
                            >
                              Löschen
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : !isLoadingProjects ? (
                    <p className="text-sm text-muted-foreground">Keine Projekte gefunden.</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Bitte logge dich ein, um deine Projekte zu sehen.
                </p>
                <Button onClick={() => router.push('/login')}>
                  Anmelden
                </Button>
              </div>
            )}

            <Button onClick={() => setProjOpen(false)}>Schließen</Button>
          </div>
        </div>
      )}

      {/* Löschbestätigung */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md shadow-xl w-[min(90%,400px)] space-y-4">
            <h2 className="text-xl font-bold text-red-600">Projekt löschen</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Möchtest du das Projekt <strong>&quot;{deleteConfirm.name}&quot;</strong> wirklich löschen?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteProject(deleteConfirm.name, deleteConfirm.id)}
              >
                Löschen
              </Button>
            </div>
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

      {/* Speicher-Bereinigung Benachrichtigung */}
      {storageCleaned && (
        <div className="fixed top-20 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Speicher automatisch bereinigt - alte Daten wurden entfernt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Speicher-Fehler Benachrichtigung */}
      {showStorageInfo && uploadError && (
        <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                Speicherfehler
              </p>
              <p className="text-sm mt-1">
                {uploadError}
              </p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    setShowStorageInfo(false);
                    setUploadError(null);
                  }}
                  className="text-sm bg-red-200 hover:bg-red-300 px-2 py-1 rounded"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header mit Szenario-Navigation - nur anzeigen wenn Projekt nicht gesperrt ist */}
      {!isProjectCompleted && (
        <TopBar
          open={open}
          onToggleSettings={() => setOpen((o) => !o)}
          onShowProjects={() => setProjOpen(true)}
          onCloseApp={() => setShowProjectSelection(true)}
          onSave={saveCurrentProject}
          isSaving={isSaving}
          onSaveAndClose={async () => {
            if (!token || !isAuthenticated) {
              addToast({
                title: "Fehler",
                description: "Bitte logge dich ein, um das Projekt zu speichern.",
                type: "error",
              });
              return;
            }

            console.log('onSaveAndClose - currentProjectId:', currentProjectId);
            console.log('onSaveAndClose - currentProjectName:', currentProjectName);
            console.log('onSaveAndClose - localStorage projectId:', safeGetItem("lb33_current_project_id"));
            
            // Fallback: Versuche projectId aus localStorage zu laden
            let projectIdToUse = currentProjectId;
            if (!projectIdToUse) {
              let storedId = safeGetItem("lb33_current_project_id") || undefined;
              // Entferne Anführungszeichen falls vorhanden
              if (storedId) {
                storedId = storedId.replace(/^"(.*)"$/, '$1');
              }
              projectIdToUse = storedId;
              console.log('Fallback - projectId aus localStorage:', projectIdToUse);
            }
            
            if (!projectIdToUse) {
              console.error('Keine projectId verfügbar!');
              console.error('localStorage projectId:', safeGetItem("lb33_current_project_id"));
              addToast({
                title: "Fehler",
                description: "Keine Projekt-ID verfügbar. Bitte lade das Projekt erneut von der Startseite.",
                type: "error",
              });
              return;
            }

            try {
              console.log('Speichere und schließe Projekt mit projectId:', projectIdToUse);
              
              // Konvertiere die aktuellen Daten in das API-Format
              const projectConfig = {
                adresse: cfg.adresse,
                stadtteil: cfg.stadtteil,
                bauart: cfg.bauart,
                objektTyp: cfg.objektTyp,
                baujahr: cfg.baujahr,
                sanierungen: cfg.sanierungen,
                energiewerte: cfg.energiewerte,
                units: cfg.units,
                kaufpreis: cfg.kaufpreis,
                nebenkosten: cfg.nebenkosten,
                // Nebenkosten-Details
                nkMakler: cfg.nkMakler,
                nkVertragserrichter: cfg.nkVertragserrichter,
                nkGrunderwerbsteuer: cfg.nkGrunderwerbsteuer,
                nkEintragungsgebuehr: cfg.nkEintragungsgebuehr,
                nkPfandEintragungsgebuehr: cfg.nkPfandEintragungsgebuehr,
                nkMode: cfg.nkMode,
                nkMaklerPct: cfg.nkMaklerPct,
                nkVertragserrichterPct: cfg.nkVertragserrichterPct,
                nkGrunderwerbsteuerPct: cfg.nkGrunderwerbsteuerPct,
                nkEintragungsgebuehrPct: cfg.nkEintragungsgebuehrPct,
                nkPfandEintragungsgebuehrPct: cfg.nkPfandEintragungsgebuehrPct,
                ekQuoteBase: cfg.ekQuoteBase,
                nkInLoan: cfg.nkInLoan,
                ekQuote: cfg.ekQuote,
                tilgung: cfg.tilgung,
                laufzeit: cfg.laufzeit,
                marktMiete: cfg.marktMiete,
                wertSteigerung: cfg.wertSteigerung,
                einnahmenBoostPct: cfg.einnahmenBoostPct,
                showHouseholdCalculation: cfg.showHouseholdCalculation,
                // Finance-Felder
                zinssatz: fin.zinssatz,
                bkM2: fin.bkM2,
                bkWachstum: fin.bkWachstum,
                einnahmenWachstum: fin.einnahmenWachstum,
                leerstand: fin.leerstand,
                steuerRate: fin.steuerRate,
                afaRate: fin.afaRate,
                gebaeudewertMode: fin.gebaeudewertMode,
                gebaeudewertPct: fin.gebaeudewertPct,
                gebaeudewertAbs: fin.gebaeudewertAbs,
              };

              const updateRequest: CreateProjectRequest = {
                name: currentProjectName || "Unbenanntes Projekt",
                description: texts.subtitle || "",
                config: projectConfig,
              };

              // Aktualisiere das Projekt über die API mit PATCH
              await updateProject(token, projectIdToUse, updateRequest);
              
              addToast({
                title: "Erfolg",
                description: `Projekt wurde erfolgreich gespeichert und geschlossen.`,
                type: "success",
              });

              console.log('Projekt erfolgreich gespeichert und geschlossen mit projectId:', projectIdToUse);
              
              // Weiterleitung zur Startseite
              router.push("/");
            } catch (error) {
              console.error('Fehler beim Speichern und Schließen des Projekts:', error);
              addToast({
                title: "Fehler",
                description: `Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
                type: "error",
              });
            }
          }}
          scenario={scenario}
          projectName={texts.title || currentProjectName}
          onProjectNameChange={handleProjectNameChange}
          onProjectSelect={handleProjectSelect}
          onNewProject={handleNewProject}
          showProjectSelection={true}
          currentProjectId={currentProjectId}
        />
      )}

      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        progressPercentage={progressPercentage}
        reinesVerkaufsszenario={reinesVerkaufsszenario}
        isProjectCompleted={isProjectCompleted}
        onLockedTabClick={handleLockedTabClick}
        onProjectComplete={handleProjectComplete}
        onProjectUnlock={handleProjectUnlock}
        onToggleSettings={() => setOpen((o) => !o)}
        settingsOpen={open}
      />



      <main 
        className={`pt-35 pb-40 max-w-full overflow-x-hidden relative transition-opacity duration-200 ${
          isTabTransitioning ? 'opacity-50' : 'opacity-100'
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile Swipe Hint - Only on mobile devices */}
        {showMobileSwipeHint && (
          <div className="fixed inset-0 pointer-events-none z-30 md:hidden">
            {/* Right side subtle wave effect */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              {/* Multiple wave layers for depth */}
              <div className="absolute right-0 top-0 w-20 h-20 bg-gradient-to-l from-blue-500/5 to-transparent rounded-full animate-ping"></div>
              <div className="absolute right-2 top-2 w-16 h-16 bg-gradient-to-l from-blue-500/10 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute right-4 top-4 w-12 h-12 bg-gradient-to-l from-blue-500/15 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              {/* Subtle hand gesture indicator */}
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/30 dark:border-gray-700/30">
                  <div className="w-4 h-4 text-blue-500/60 animate-bounce">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.66 1.34 3 3 3s3-1.34 3-3v-1l4.79-3.86c.13.58.21 1.17.21 1.79 0 4.08-3.06 7.44-7 7.93z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Übersicht-Tab Inhalt */}
        {activeTab === "overview" && (
          <>

             {/* Hero - Apple Style */}
       <section id="hero" className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 mt-6 w-full overflow-x-hidden">
         <div className="text-center space-y-6">
           {/* Titel kompakt */}
           <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
               {titleText}
             </h1>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge className={`${CASE_INFO[scenario].color} text-white rounded-full px-2.5 py-0.5 text-xs font-medium`}>{caseLabel}</Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium border-0">{totalFlaeche} m²</Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium border-0">{fmtEUR(cfg.kaufpreis)}</Badge>
              <Badge variant="secondary" className="bg-gray-700 dark:bg-gray-800 text-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium border-0">{fmt(Math.round(kaufpreisProM2))} €/m²</Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium border-0">Ø {cfg.stadtteil}: {fmt(avgPreisStadtteil)} €/m²</Badge>
            </div>

            {/* Map */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 mt-6">
                               <MapComponent 
                   lat={47.8095}
                   lon={13.0550}
                   address={`${cfg.adresse || 'Salzburg'}, Österreich`}
                 />
            </div>
             
                          {/* Objekt-Übersicht - Kompakt */}
             <div className="mt-6 -mx-6 p-6 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
               <div className="max-w-6xl mx-auto">
                 <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Objekt-Übersicht</h4>
               
                 {/* Kompakte Hauptinformationen */}
                 <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Objekttyp</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{cfg.objektTyp}</div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Baujahr</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cfg.baujahr || 'N/A'}</div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bauart</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{cfg.bauart}</div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">HWB</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cfg.energiewerte?.hwb || 'N/A'} kWh/m²a</div>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">FGEE</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cfg.energiewerte?.fgee || 'N/A'}</div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Heizung</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cfg.energiewerte?.heizung || 'N/A'}</div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dachung</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cfg.energiewerte?.dachung || 'N/A'}</div>
                   </div>
                 </div>

                 {/* Dokumenten-Checkliste */}
                 <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 mb-4">
                   <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Dokumenten-Checkliste</h5>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                     {docChecklist.map((doc, index) => (
                       <div key={index} className="flex items-center gap-2 min-w-0">
                         <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                           doc.present ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                         }`}>
                           {doc.present && <CheckCircle2 className="w-3 h-3 text-white" />}
                         </div>
                         <span className={`text-sm truncate min-w-0 ${doc.present ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                           {doc.label}
                         </span>
                       </div>
                     ))}
                   </div>
                   <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                     {docChecklist.filter(d => d.present).length} von {docChecklist.length} Dokumenten vorhanden
                   </div>
                 </div>
                 
                                  {/* Sanierungen */}
                 {(cfg.sanierungen?.length || 0) > 0 && cfg.sanierungen?.some(s => s.trim() !== '') && (
                   <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 mb-6">
                     <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Sanierungen</h5>
                     <div className="space-y-2">
                       {cfg.sanierungen?.filter(s => s.trim() !== '').map((sanierung, index) => (
                         <div key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                           <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                           <span>{sanierung}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                
                                  {/* Einheiten-Übersicht */}
                 {(cfg.objektTyp === 'zinshaus' || cfg.objektTyp === 'hotel' || cfg.objektTyp === 'büro') ? (
                   <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                     <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Einheiten-Übersicht</h5>
                     
                                            {/* Zusammenfassung */}
                       <div className="grid grid-cols-3 gap-4 mb-4">
                         <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                           <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{cfg.units.length}</div>
                           <div className="text-sm text-slate-600 dark:text-slate-400">Gesamt</div>
                         </div>
                         <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                           <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{cfg.units?.filter(u => u.typ === 'wohnung').length || 0}</div>
                           <div className="text-sm text-slate-600 dark:text-slate-400">Wohnungen</div>
                         </div>
                         <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                           <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{cfg.units?.filter(u => u.typ === 'gewerbe').length || 0}</div>
                           <div className="text-sm text-slate-600 dark:text-slate-400">Gewerbe</div>
                         </div>
                       </div>
                     
                     {/* Detaillierte Einheiten */}
                     <div className="space-y-4">
                       {/* Wohnungen */}
                       {(cfg.units?.filter(u => u.typ === 'wohnung').length || 0) > 0 && (
                         <div>
                           <h6 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                             Wohnungen ({cfg.units?.filter(u => u.typ === 'wohnung').length || 0})
                           </h6>
                           <div className="space-y-2">
                             {cfg.units?.filter(u => u.typ === 'wohnung').map((unit, idx) => (
                               <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                                 <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-3">
                                     <span className="font-medium text-slate-900 dark:text-slate-100">{unit.bezeichnung}</span>
                                     <span className="text-sm text-slate-500 dark:text-slate-400">({unit.stockwerk})</span>
                                   </div>
                                   <div className="text-right">
                                     <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{unit.flaeche} m²</div>
                                     <div className="text-xs text-slate-500 dark:text-slate-400">{fmt(unit.miete)} €/m²</div>
                                   </div>
                                 </div>
                                 
                                 {/* Wohnungsdetails */}
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                   {unit.zimmer && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Zimmer:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.zimmer}</span>
                                     </div>
                                   )}
                                   {unit.schlafzimmer && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Schlafzimmer:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.schlafzimmer}</span>
                                     </div>
                                   )}
                                   {unit.balkon && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Balkon:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.balkonGroesse}m²</span>
                                     </div>
                                   )}
                                   {unit.keller && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Keller:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.kellerGroesse}m²</span>
                                     </div>
                                   )}
                                   {unit.parkplatz && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Parkplatz:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.parkplatzAnzahl}</span>
                                     </div>
                                   )}
                                   {unit.terrasse && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Terrasse:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.terrasseGroesse}m²</span>
                                     </div>
                                   )}
                                   {unit.garten && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Garten:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{unit.gartenGroesse}m²</span>
                                     </div>
                                   )}
                                   {unit.aufzug && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Aufzug:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">✓</span>
                                     </div>
                                   )}
                                   {unit.einbaukueche && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Einbauküche:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">✓</span>
                                     </div>
                                   )}
                                   {unit.badewanne && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Badewanne:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">✓</span>
                                     </div>
                                   )}
                                   {unit.dusche && (
                                     <div className="flex items-center gap-1">
                                       <span className="text-slate-500 dark:text-slate-400">Dusche:</span>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">✓</span>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       {/* Gewerbeeinheiten */}
                       {(cfg.units?.filter(u => u.typ === 'gewerbe').length || 0) > 0 && (
                         <div>
                           <h6 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                             Gewerbeeinheiten ({cfg.units?.filter(u => u.typ === 'gewerbe').length || 0})
                           </h6>
                           <div className="space-y-2">
                             {cfg.units?.filter(u => u.typ === 'gewerbe').map((unit, idx) => (
                               <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                                 <div className="flex items-center gap-3">
                                   <span className="font-medium text-slate-900 dark:text-slate-100">{unit.bezeichnung}</span>
                                   <span className="text-sm text-slate-500 dark:text-slate-400">({unit.stockwerk})</span>
                                 </div>
                                 <div className="text-right">
                                   <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{unit.flaeche} m²</div>
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
                   <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                     <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Objekt-Details</h5>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                         <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalFlaeche} m²</div>
                         <div className="text-sm text-slate-600 dark:text-slate-400">Gesamtfläche</div>
                       </div>
                       <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                         <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{fmt(avgMiete)} €/m²</div>
                         <div className="text-sm text-slate-600 dark:text-slate-400">Ø Miete</div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>


         </div>
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
                  <Button size="sm" onClick={() => setEditingStory(false)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 cursor-pointer">Fertig</Button>
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
                  <Button size="sm" onClick={() => setEditingTip(false)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 cursor-pointer">Fertig</Button>
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








      {/* Upside section removed as requested */}




          </>
        )}

      {/* Tab-spezifischer Inhalt */}
      {activeTab === "market" && (
        isProjectCompleted ? (
          <ProjectLockedOverlay onUnlock={handleLockedTabClick} />
        ) : (
          <MarketComparisonTab
            kaufpreis={cfg.kaufpreis}
            totalFlaeche={totalFlaeche}
            stadtteil={cfg.stadtteil}
            onStadtteilChange={(stadtteil) => setCfg({ ...cfg, stadtteil })}
          />
        )
      )}

      {activeTab === "detail-analysis" && (
        isProjectCompleted ? (
          <ProjectLockedOverlay onUnlock={handleLockedTabClick} />
        ) : (
          <DetailAnalysisTab
          chartData={chartData}
          valueGrowthData={valueGrowthData}
          valueGrowthTable={valueGrowthTable}
          fin={fin}
          cfg={cfg}
          assumptions={{
            adresse: cfg.adresse,
            stadtteil: cfg.stadtteil
          }}
          cfPosAb={cfPosAb}
          bkJ1={bkJ1}
          laufzeitAuto={laufzeitAuto}
          PLAN_30Y={PLAN_30Y}
          PLAN_LAUFZEIT={PLAN_LAUFZEIT}
          investUnlevered={investUnlevered}
          nkInLoan={nkInLoan}
          NKabs={NKabs}
          V0={V0}
          L0={L0}
          equityBadge={equityBadge}
          fmtEUR={fmtEUR}
          formatPercent={formatPercent}
          score={score}
          metrics={metrics}
          selectedCards={selectedCards}
          availableCards={AVAILABLE_CARDS}
          showCardSelector={showCardSelector}
          onShowCardSelector={setShowCardSelector}
        />
        )
      )}

      {activeTab === "exit-scenarios" && (
        isProjectCompleted ? (
          <ProjectLockedOverlay onUnlock={handleLockedTabClick} />
        ) : (
          <ExitScenariosTab
          key={`${scenario}-${cfgCases[scenario]?.kaufpreis}-${cfgCases[scenario]?.nebenkosten}-${cfgCases[scenario]?.ekQuote}-${finCases[scenario]?.darlehen}`}
          onReinesVerkaufsszenarioChange={setReinesVerkaufsszenario}
          onExitScenarioInputsChange={handleExitScenarioInputsChange}
          initialInputs={{
            // Verwende immer die aktuellen Werte aus cfgCases und finCases, aber behalte Exit-spezifische Einstellungen
            kaufpreis: cfgCases[scenario]?.kaufpreis || 0,
            nebenkosten: cfgCases[scenario]?.nebenkosten || 0, // Nebenkosten sind bereits ein absoluter Wert
            darlehenStart: finCases[scenario]?.darlehen || 0,
            eigenkapital: ((cfgCases[scenario]?.ekQuoteBase || 'NETTO') === 'BRUTTO'
              ? (cfgCases[scenario]?.kaufpreis || 0) * (1 + (cfgCases[scenario]?.nebenkosten || 0))
              : (cfgCases[scenario]?.kaufpreis || 0)) * (cfgCases[scenario]?.ekQuote || 0),
            wohnflaeche: cfgCases[scenario]?.units?.reduce((sum, unit) => sum + unit.flaeche, 0) || 100, // Summe aller Wohnflächen
            // Exit-spezifische Einstellungen aus gespeicherten Eingaben beibehalten
            exitJahr: exitScenarioInputs?.exitJahr || 10,
            reinesVerkaufsszenario: exitScenarioInputs?.reinesVerkaufsszenario || false,
            verkaufspreisTyp: exitScenarioInputs?.verkaufspreisTyp || "pauschal" as const,
            verkaeuferpreisPauschal: exitScenarioInputs?.verkaeuferpreisPauschal,
            verkaeuferpreisProM2: exitScenarioInputs?.verkaeuferpreisProM2,
            maklerprovision: exitScenarioInputs?.maklerprovision || 5,
            sanierungskosten: exitScenarioInputs?.sanierungskosten || 0,
            notarkosten: exitScenarioInputs?.notarkosten || 0,
            grunderwerbsteuer: exitScenarioInputs?.grunderwerbsteuer || 0,
            weitereKosten: exitScenarioInputs?.weitereKosten || 0,
            // Steuer- und Finanzierungswerte aus aktuellen finCases
            steuersatz: finCases[scenario]?.steuerRate || 25,
            abschreibung: finCases[scenario]?.afaRate || 2,
            // Echte Daten aus der Cashflow-Analyse verwenden (immer aktuell)
            jaehrlicheMieteinnahmen: PLAN_30Y.map(r => r.einnahmen),
            jaehrlicheBetriebskosten: PLAN_30Y.map(r => r.ausgaben - r.zins - r.tilgung), // Betriebskosten = Ausgaben - Zinsen - Tilgung - Steuern
            jaehrlicheTilgung: PLAN_30Y.map(r => r.tilgung),
            jaehrlicheZinsen: PLAN_30Y.map(r => r.zins),
            // Direkt den berechneten FCF aus der Cashflow-Tabelle verwenden
            jaehrlicheFCF: PLAN_30Y.map(r => r.fcf),
            // Marktwert der Immobilie nach X Jahren aus der Detailanalyse (immer aktuell)
            propertyValueByYear: propertyValueByYear, // Alle Marktwerte für dynamische Berechnung
          }}
        />
        )
      )}

      {activeTab === "documents" && (
        isProjectCompleted ? (
          <ProjectLockedOverlay onUnlock={handleLockedTabClick} />
        ) : currentProjectId ? (
          <ProjectFileUpload
            projectId={currentProjectId}
            projectFiles={projectFiles}
            onFilesUpdate={reloadProjectFiles}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Kein Projekt ausgewählt</p>
            <p className="text-sm">Bitte wähle ein Projekt aus der Startseite</p>
          </div>
        )
      )}


              {activeTab === "complete-overview" && (
          <CompleteOverviewTab
            score={score}
            metrics={metrics}
            chartData={chartData}
            valueGrowthData={valueGrowthData}
            valueGrowthTable={valueGrowthTable}
            PLAN_30Y={PLAN_30Y}
            PLAN_LAUFZEIT={PLAN_LAUFZEIT}
            investUnlevered={investUnlevered}
            nkInLoan={nkInLoan}
            NKabs={NKabs}
            reinesVerkaufsszenario={reinesVerkaufsszenario}
            exitScenarioInputs={isExitScenarioCalculated(exitScenarioInputs) ? exitScenarioInputs! : undefined}
            V0={V0}
            L0={L0}
          equityBadge={equityBadge}
            fin={fin}
            cfg={cfg}
            cfPosAb={cfPosAb}
            bkJ1={bkJ1}
            laufzeitAuto={laufzeitAuto}
            fmtEUR={fmtEUR}
            formatPercent={formatPercent}
            selectedCards={selectedCards}
            availableCards={AVAILABLE_CARDS}
            kaufpreis={cfg.kaufpreis}
            totalFlaeche={totalFlaeche}
            stadtteil={cfg.stadtteil}
            onStadtteilChange={(stadtteil) => setCfg({ ...cfg, stadtteil })}
            projectName={currentProjectName || "Unbenanntes Projekt"}
            storyParagraphs={storyParagraphs}
            scenario={scenario}
            assumptions={{
              adresse: cfg.adresse || "",
              stadtteil: cfg.stadtteil,
              bauart: cfg.bauart,
              objektTyp: cfg.objektTyp || "zinshaus",
              baujahr: cfg.baujahr || 0,
              sanierungen: cfg.sanierungen || [],
              energiewerte: cfg.energiewerte || {
                hwb: 0,
                fgee: 0,
                heizung: "",
                dachung: "",
                fenster: "",
                waermedaemmung: "",
              },
              units: cfg.units || [],
              kaufpreis: cfg.kaufpreis,
              nebenkosten: cfg.nebenkosten,
              ekQuote: cfg.ekQuote,
              tilgung: cfg.tilgung,
              laufzeit: cfg.laufzeit,
              marktMiete: cfg.marktMiete,
              wertSteigerung: cfg.wertSteigerung,
            }}
            finCases={finCases}
            pdfs={pdfs}
            images={images}
            texts={overviewTexts}
            showHouseholdCalculation={cfg.showHouseholdCalculation || false}
            householdResult={householdResult}
          />
        )}

      {/* Scenario Tabs */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
        <div className="flex border rounded-lg shadow bg-white dark:bg-slate-800 overflow-hidden">
          {SCENARIOS.map((s) => {
            const isActive = scenario === s;
            const colors = {
              bear: isActive ? "bg-red-500 text-white" : "text-red-600 hover:bg-red-50",
              base: isActive ? "bg-blue-500 text-white" : "text-blue-600 hover:bg-blue-50", 
              bull: isActive ? "bg-green-500 text-white" : "text-green-600 hover:bg-green-50"
            };
            
            return (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? colors[s] + " shadow-md" 
                    : colors[s] + " hover:bg-opacity-10"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>
      </div>


      </main>

      {/* PIN Dialog */}
      <PinDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onPinVerified={handlePinVerified}
        title="Projekt entsperren"
        description="Geben Sie den 4-stelligen PIN ein, um das Projekt wieder zu bearbeiten:"
      />

    </div>
    </ProtectedRoute>
  );
}
