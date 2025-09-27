"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DISTRICT_PRICES, type District } from "@/types/districts";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, type CreateProjectRequest } from "@/lib/project-api";
import {
  Building,
  PiggyBank,
  Percent,
  Wallet,
  TrendingUp,
  Upload,
  CheckCircle2,
  Circle,
  Plus,
  X,
  ChevronDown,
  ImagePlus,
  FilePlus,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// Erweiterte Typen für Wizard-Daten
type WizardData = {
  // Objekt-Daten
  adresse: string;
  objektTyp: 'zinshaus' | 'wohnung' | 'gewerbe' | 'hotel' | 'büro' | 'lager' | 'sonstiges';
  baujahr: number;
  bauart: 'bestand' | 'neubau';
  stadtteil: District;
  energiewerte: {
    hwb: number;
    fgee: number;
    heizung: string;
    dachung: string;
    fenster: string;
    waermedaemmung: string;
  };
  sanierungen: string[];
  units: Array<{
    flaeche: number;
    miete: number;
    typ: 'wohnung' | 'gewerbe';
    stockwerk: string;
    bezeichnung: string;
    zimmer?: number;
    schlafzimmer?: number;
    wc?: number;
    balkon?: boolean;
    balkonGroesse?: number;
    terrasse?: boolean;
    terrasseGroesse?: number;
    garten?: boolean;
    gartenGroesse?: number;
    keller?: boolean;
    kellerGroesse?: number;
    parkplatz?: boolean;
    parkplatzAnzahl?: number;
    aufzug?: boolean;
    einbaukueche?: boolean;
    badewanne?: boolean;
    dusche?: boolean;
  }>;
  
  // Finanzierung
  kaufpreis: number;
  nebenkosten: number;
  ekQuoteBase?: 'NETTO' | 'BRUTTO';
  ekQuote: number;
  tilgung: number;
  laufzeit: number;
  zinssatz: number;
  
  // Steuern
  steuerRate: number;
  afaRate: number;
  
  // Kosten & Einnahmen
  bkM2: number;
  bkWachstum: number;
  leerstand: number;
  einnahmenWachstum: number;
  
  // Marktannahmen
  marktMiete: number;
  wertSteigerung: number;
  
  // Upside-Potenzial
  upsideScenarios: Array<{
    id: string;
    name: string;
    description: string;
    investment: number;
    return: number;
  }>;
  
  // Uploads
  images: Array<{ src: string; caption: string; width: number; height: number }>;
  pdfs: Array<{ src: string; name: string }>;
  
  // Projekt-Checkliste
  documents: Record<string, boolean>;
  
  // Investmentstory
  title: string;
  subtitle: string;
  story: string;
  tipTitle: string;
  tipText: string;
  upsideTitle: string;
  upsideText: string;
};

const DEFAULT_WIZARD_DATA: WizardData = {
  adresse: "",
  objektTyp: "zinshaus",
  baujahr: 1990,
  bauart: "bestand",
  stadtteil: "Riedenburg",
  energiewerte: {
    hwb: 120,
    fgee: 0.8,
    heizung: "Gas",
    dachung: "Ziegel",
    fenster: "Doppelverglasung",
    waermedaemmung: "Teilweise",
  },
  sanierungen: [],
  units: [],
  kaufpreis: 0,
  nebenkosten: 0,
  ekQuoteBase: 'NETTO',
  ekQuote: 0.2,
  tilgung: 0.02,
  laufzeit: 0,
  zinssatz: 0.03,
  steuerRate: 0.25,
  afaRate: 0.02,
  bkM2: 3.5,
  bkWachstum: 0.02,
  leerstand: 0.05,
  einnahmenWachstum: 0.02,
  marktMiete: 0,
  wertSteigerung: 0.02,
  upsideScenarios: [],
  images: [],
  pdfs: [],
  documents: {},
  title: "",
  subtitle: "",
  story: "",
  tipTitle: "",
  tipText: "",
  upsideTitle: "",
  upsideText: "",
};

export default function WizardPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [wizardData, setWizardData] = useState<WizardData>(DEFAULT_WIZARD_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const total = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const percent = Math.round(((step + 1) / total) * 100);

  const next = () => setStep((s) => (s < (total - 1) ? ((s + 1) as Step) : s));
  const prev = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));

  // Hilfsfunktionen für Wizard-Daten
  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const addUnit = () => {
    const nextNumber = wizardData.units.length + 1;
    const defaultTyp = wizardData.objektTyp === 'wohnung' ? 'wohnung' : 'gewerbe';
    const defaultStockwerk = `${nextNumber}. OG`;
    let defaultBezeichnung = `Wohnung ${nextNumber}`;
    
    if (wizardData.objektTyp === 'hotel') {
      defaultBezeichnung = `Zimmer ${nextNumber}`;
    } else if (wizardData.objektTyp === 'büro') {
      defaultBezeichnung = `Büro ${nextNumber}`;
    }
    
    updateWizardData({
      units: [...wizardData.units, {
        flaeche: 0,
        miete: wizardData.marktMiete || 15,
        typ: defaultTyp,
        stockwerk: defaultStockwerk,
        bezeichnung: defaultBezeichnung
      }]
    });
  };

  const updateUnit = (idx: number, unit: Partial<WizardData['units'][0]>) => {
    const newUnits = [...wizardData.units];
    newUnits[idx] = { ...newUnits[idx], ...unit };
    updateWizardData({ units: newUnits });
  };

  const removeUnit = (idx: number) => {
    updateWizardData({
      units: wizardData.units.filter((_, i) => i !== idx)
    });
  };

  const addSanierung = () => {
    updateWizardData({
      sanierungen: [...wizardData.sanierungen, '']
    });
  };

  const updateSanierung = (idx: number, value: string) => {
    const newSanierungen = [...wizardData.sanierungen];
    newSanierungen[idx] = value;
    updateWizardData({ sanierungen: newSanierungen });
  };

  const removeSanierung = (idx: number) => {
    updateWizardData({
      sanierungen: wizardData.sanierungen.filter((_, i) => i !== idx)
    });
  };

  const addUpsideScenario = () => {
    const newScenario = {
      id: Date.now().toString(),
      name: '',
      description: '',
      investment: 0,
      return: 0
    };
    updateWizardData({
      upsideScenarios: [...wizardData.upsideScenarios, newScenario]
    });
  };

  const updateUpsideScenario = (idx: number, updates: Partial<WizardData['upsideScenarios'][0]>) => {
    const newScenarios = [...wizardData.upsideScenarios];
    newScenarios[idx] = { ...newScenarios[idx], ...updates };
    updateWizardData({ upsideScenarios: newScenarios });
  };

  const removeUpsideScenario = (idx: number) => {
    updateWizardData({
      upsideScenarios: wizardData.upsideScenarios.filter((_, i) => i !== idx)
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        updateWizardData({
          images: [...wizardData.images, {
            src,
            caption: '',
            width: img.width,
            height: img.height
          }]
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      updateWizardData({
        pdfs: [...wizardData.pdfs, { src, name: file.name }]
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    updateWizardData({
      images: wizardData.images.filter((_, i) => i !== idx)
    });
  };

  const removePdf = (idx: number) => {
    updateWizardData({
      pdfs: wizardData.pdfs.filter((_, i) => i !== idx)
    });
  };

  const updateImageCaption = (idx: number, caption: string) => {
    const newImages = [...wizardData.images];
    newImages[idx] = { ...newImages[idx], caption };
    updateWizardData({ images: newImages });
  };

  const toggleDocument = (key: string) => {
    updateWizardData({
      documents: {
        ...wizardData.documents,
        [key]: !wizardData.documents[key]
      }
    });
  };

  const finish = async () => {
    if (!token || !isAuthenticated) {
      alert('Bitte logge dich ein, um ein Projekt zu erstellen.');
      return;
    }

    setIsCreating(true);

    try {
      // Konvertiere Wizard-Daten in das API-Format
      const projectConfig = {
        adresse: wizardData.adresse,
        stadtteil: wizardData.stadtteil,
        bauart: wizardData.bauart,
        objektTyp: wizardData.objektTyp,
        baujahr: wizardData.baujahr,
        sanierungen: wizardData.sanierungen,
        energiewerte: wizardData.energiewerte,
        units: wizardData.units,
        kaufpreis: wizardData.kaufpreis,
        nebenkosten: wizardData.nebenkosten,
        ekQuote: wizardData.ekQuote,
        tilgung: wizardData.tilgung,
        laufzeit: wizardData.laufzeit,
        marktMiete: wizardData.marktMiete,
        wertSteigerung: wizardData.wertSteigerung,
      };

      const createProjectRequest: CreateProjectRequest = {
        name: wizardData.title || "Neues Projekt",
        description: wizardData.subtitle || "",
        config: projectConfig,
      };

      // Erstelle Projekt über API
      const createdProject = await createProject(token, createProjectRequest);
      console.log('Projekt erfolgreich erstellt:', createdProject);

      console.log('Projekt erfolgreich in der Cloud erstellt');
      
      router.push("/");
    } catch (error) {
      console.error('Fehler beim Erstellen des Projekts:', error);
      alert(`Fehler beim Erstellen des Projekts: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const skipWizard = () => {
    // Leite zur Startseite weiter, da lokale Projekte nicht mehr unterstützt werden
    router.push("/start");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight mb-4">Neues Projekt – Assistent</h1>

        {/* Fortschritt */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
          <div className="h-2 bg-indigo-600" style={{ width: `${percent}%` }} />
        </div>

        {/* Schritte */}
        {step === 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">1) Projekt-Übersicht</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Gib grundlegende Projektinformationen ein.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Projekttitel</label>
                <input 
                  className="w-full border rounded-md px-3 py-2" 
                  placeholder="z.B. Mehrfamilienhaus Riedenburg" 
                  value={wizardData.title}
                  onChange={(e) => updateWizardData({ title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Untertitel</label>
                <input 
                  className="w-full border rounded-md px-3 py-2" 
                  placeholder="z.B. Sanierungspotenzial mit 6 Wohneinheiten" 
                  value={wizardData.subtitle}
                  onChange={(e) => updateWizardData({ subtitle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
                <AddressAutocomplete
                  value={wizardData.adresse}
                  onChange={(value) => updateWizardData({ adresse: value })}
                  placeholder="Vollständige Adresse des Objekts"
                  className="w-full border rounded-md px-3 py-2"
                  showValidationStatus={true}
                  onValidationChange={(isValid, confidence) => {
                    // Optional: Speichere Validierungsstatus für weitere Verwendung
                    console.log(`Adresse validiert: ${isValid}, Vertrauen: ${confidence}%`);
                  }}
                />
              </div>
            </div>
          </section>
        )}
        {step === 1 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">2) Objekttyp & Grunddaten</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Wähle den Objekttyp und gib grundlegende Daten ein.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Objekttyp</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['zinshaus', 'wohnung', 'gewerbe', 'hotel', 'büro', 'lager', 'sonstiges'] as const).map((typ) => (
                    <button
                      key={typ}
                      onClick={() => updateWizardData({ objektTyp: typ })}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                        wizardData.objektTyp === typ
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {typ.charAt(0).toUpperCase() + typ.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Baujahr</label>
                  <input
                    type="number"
                    value={wizardData.baujahr}
                    onChange={(e) => updateWizardData({ baujahr: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="z.B. 1990"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bauart</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['bestand', 'neubau'] as const).map((art) => (
                      <button
                        key={art}
                        onClick={() => updateWizardData({ bauart: art })}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                          wizardData.bauart === art
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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stadtteil</label>
                <select
                  value={wizardData.stadtteil}
                  onChange={(e) => updateWizardData({ stadtteil: e.target.value as District })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {DISTRICT_PRICES[wizardData.bauart]?.map((d) => (
                    <option key={d.ort} value={d.ort}>{d.ort}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}
        {step === 2 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">3) Finanzierung</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Konfiguriere die Finanzierungsparameter.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kaufpreis (€)</label>
                <input
                  type="number"
                  step="1000"
                  value={wizardData.kaufpreis}
                  onChange={(e) => updateWizardData({ kaufpreis: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nebenkosten (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.nebenkosten * 100}
                  onChange={(e) => updateWizardData({ nebenkosten: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">EK-Quote (%)</label>
                <input
                  type="number"
                  step="1"
                  value={wizardData.ekQuote * 100}
                  onChange={(e) => updateWizardData({ ekQuote: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tilgung (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.tilgung * 100}
                  onChange={(e) => updateWizardData({ tilgung: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Laufzeit (Jahre)</label>
                <input
                  type="number"
                  value={wizardData.laufzeit}
                  onChange={(e) => updateWizardData({ laufzeit: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zinssatz (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.zinssatz * 100}
                  onChange={(e) => updateWizardData({ zinssatz: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 3"
                />
              </div>
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">4) Steuern</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Konfiguriere die Steuerparameter.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ESt-Satz (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.steuerRate * 100}
                  onChange={(e) => updateWizardData({ steuerRate: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">AfA-Satz (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.afaRate * 100}
                  onChange={(e) => updateWizardData({ afaRate: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 2"
                />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>AfA (Abschreibung):</strong> {Math.round(wizardData.kaufpreis * wizardData.afaRate).toLocaleString('de-AT')} € pro Jahr
              </p>
            </div>
          </section>
        )}
        {step === 4 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">5) Kosten & Einnahmen</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Definiere Betriebskosten und Einnahmenparameter.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">BK (€/m²/Monat)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.bkM2}
                  onChange={(e) => updateWizardData({ bkM2: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 3.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">BK-Steigerung (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.bkWachstum * 100}
                  onChange={(e) => updateWizardData({ bkWachstum: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leerstand (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.leerstand * 100}
                  onChange={(e) => updateWizardData({ leerstand: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Einnahmen-Wachstum (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wizardData.einnahmenWachstum * 100}
                  onChange={(e) => updateWizardData({ einnahmenWachstum: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="z.B. 2"
                />
              </div>
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

        {step === 6 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">7) Upside-Potenzial</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Definiere mögliche Wertsteigerungsszenarien.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">Szenarien</h3>
                <Button variant="outline" size="sm" onClick={addUpsideScenario} className="gap-1">
                  <Plus className="w-4 h-4" /> Szenario hinzufügen
                </Button>
              </div>
              
              {wizardData.upsideScenarios.map((scenario, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">Szenario {idx + 1}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUpsideScenario(idx)}
                      className="w-8 h-8 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
                      <input
                        value={scenario.name}
                        onChange={(e) => updateUpsideScenario(idx, { name: e.target.value })}
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="z.B. Dachgeschossausbau"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Investition (€)</label>
                      <input
                        type="number"
                        step="1000"
                        value={scenario.investment}
                        onChange={(e) => updateUpsideScenario(idx, { investment: parseInt(e.target.value) || 0 })}
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="z.B. 50000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Beschreibung</label>
                    <textarea
                      value={scenario.description}
                      onChange={(e) => updateUpsideScenario(idx, { description: e.target.value })}
                      className="w-full border rounded-md px-2 py-1 text-sm"
                      rows={2}
                      placeholder="Beschreibung des Szenarios..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 7 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">8) Uploads</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Lade Bilder und Dokumente hoch.</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-sm mb-2">Bilder</h3>
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
                  {wizardData.images.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img
                        src={img.src}
                        alt={img.caption || `Bild ${idx + 1}`}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <input
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
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
                <h3 className="font-medium text-sm mb-2">PDFs</h3>
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
                  {wizardData.pdfs.map((pdf, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 border rounded-lg text-sm"
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
          </section>
        )}

        {step === 8 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">9) Projekt-Checkliste</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Markiere vorhandene Dokumente.</p>
            
            <div className="space-y-3">
              {[
                { key: "bk", label: "BK Abrechnung" },
                { key: "eigentuemer", label: "Eigentümerabrechnung" },
                { key: "nutzwert", label: "Nutzwertliste" },
                { key: "plaene", label: "Pläne & Grundrisse" },
                { key: "energieausweis", label: "Energieausweis" },
                { key: "grundbuch", label: "Grundbuchauszug" },
                { key: "kataster", label: "Katasterplan" },
              ].map((doc) => (
                <button
                  key={doc.key}
                  onClick={() => toggleDocument(doc.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    wizardData.documents[doc.key]
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    wizardData.documents[doc.key]
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }`}>
                    {wizardData.documents[doc.key] ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    wizardData.documents[doc.key]
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {doc.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 9 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">10) Investmentstory</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Erstelle eine aussagekräftige Projektbeschreibung.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Projektbeschreibung</label>
                <textarea
                  value={wizardData.story}
                  onChange={(e) => updateWizardData({ story: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows={4}
                  placeholder="Beschreibe das Projekt, seine Besonderheiten und das Investmentpotenzial..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipp-Titel</label>
                  <input
                    value={wizardData.tipTitle}
                    onChange={(e) => updateWizardData({ tipTitle: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="z.B. Sanierungspotenzial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upside-Titel</label>
                  <input
                    value={wizardData.upsideTitle}
                    onChange={(e) => updateWizardData({ upsideTitle: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="z.B. Wertsteigerung"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipp-Text</label>
                <textarea
                  value={wizardData.tipText}
                  onChange={(e) => updateWizardData({ tipText: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Gib einen hilfreichen Tipp zum Projekt..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upside-Text</label>
                <textarea
                  value={wizardData.upsideText}
                  onChange={(e) => updateWizardData({ upsideText: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Beschreibe das Upside-Potenzial..."
                />
              </div>
            </div>
          </section>
        )}

        {step === 10 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">11) Zusammenfassung</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Überprüfe deine Eingaben vor dem Abschluss.</p>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Projekt-Übersicht</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Titel:</strong> {wizardData.title || "Nicht angegeben"}</div>
                  <div><strong>Adresse:</strong> {wizardData.adresse || "Nicht angegeben"}</div>
                  <div><strong>Objekttyp:</strong> {wizardData.objektTyp}</div>
                  <div><strong>Baujahr:</strong> {wizardData.baujahr}</div>
                  <div><strong>Kaufpreis:</strong> {wizardData.kaufpreis.toLocaleString('de-AT')} €</div>
                  <div><strong>EK-Quote:</strong> {(wizardData.ekQuote * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Einheiten</h3>
                <div className="text-sm">
                  {wizardData.units.length > 0 ? (
                    <div className="space-y-1">
                      {wizardData.units.map((unit, idx) => (
                        <div key={idx}>
                          {unit.bezeichnung}: {unit.flaeche}m², {unit.miete}€/m²
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>Keine Einheiten definiert</div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Uploads</h3>
                <div className="text-sm">
                  <div>Bilder: {wizardData.images.length}</div>
                  <div>PDFs: {wizardData.pdfs.length}</div>
                  <div>Dokumente: {Object.values(wizardData.documents).filter(Boolean).length} von 7</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 11 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">12) Projekt erstellen</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Dein Projekt ist bereit zur Erstellung!</p>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-2 text-green-800 dark:text-green-200">Bereit zur Erstellung</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Alle wichtigen Daten wurden erfasst. Klicke auf &quot;Projekt erstellen&quot;, um dein neues Immobilienprojekt zu starten.
              </p>
            </div>
          </section>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={prev} disabled={step === 0}>Zurück</Button>
            <Button 
              variant="outline" 
              onClick={skipWizard}
              className="text-slate-600 hover:text-slate-800"
            >
              Einrichtung überspringen
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Schritt {step + 1} von {total}
            </span>
            {step < (total - 1) ? (
              <Button onClick={next}>Weiter</Button>
            ) : (
              <Button 
                onClick={finish} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isCreating}
              >
                {isCreating ? "Erstelle Projekt..." : "Projekt erstellen"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
    </ProtectedRoute>
  );
}


