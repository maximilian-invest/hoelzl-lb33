/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SettingSection } from "@/components/SettingSection";
import { NumField } from "@/components/ui/num-field";
import { SelectField } from "@/components/ui/select-field";
import type { ProjectImage, ProjectPdf } from "./DocumentUploads";
import type { Finance } from "../page";
import {
  Building,
  PiggyBank,
  Percent,
  Wallet,
  TrendingUp,
  Upload,
  Plus,
  X,
  ImagePlus,
  FilePlus,
  FileDown,
  CheckCircle2,
  Circle,
  RotateCcw,
} from "lucide-react";
import { DISTRICT_PRICES } from "@/lib/constants";

type Unit = { flaeche: number; miete: number };

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  scenario: string;
  cfg: any;
  setCfg: React.Dispatch<React.SetStateAction<any>>;
  fin: Finance;
  setFin: (v: Finance) => void;
  addUnit: () => void;
  updateUnit: (idx: number, u: Unit) => void;
  removeUnit: (idx: number) => void;
  bkJ1: number;
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateImageCaption: (idx: number, caption: string) => void;
  removeImage: (idx: number) => void;
  removePdf: (idx: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  docsPercent: number;
  docChecklist: { key: string; label: string; present: boolean }[];
  resetProject: () => void;
  saveProject: () => void;
  exportProject: () => void;
  triggerImport: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  copyFromBase: () => void;
}

export function SettingsDialog(props: Props) {
  const {
    open,
    setOpen,
    scenario,
    cfg,
    setCfg,
    fin,
    setFin,
    addUnit,
    updateUnit,
    removeUnit,
    bkJ1,
    images,
    pdfs,
    handleImageUpload,
    handlePdfUpload,
    updateImageCaption,
    removeImage,
    removePdf,
    fileInputRef,
    pdfInputRef,
    docsPercent,
    docChecklist,
    resetProject,
    saveProject,
    exportProject,
    triggerImport,
    importInputRef,
    handleImportFile,
    copyFromBase,
  } = props;

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setOpen(false)} />}
      <div
        className={`fixed inset-y-0 left-0 z-60 w-[420px] max-w-[95vw] border-r bg-white dark:bg-slate-800 dark:border-slate-700 p-4 shadow-xl transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
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
          <SettingSection title="Einheiten" icon={Building}>
            <Button variant="outline" size="sm" onClick={addUnit} className="gap-1">
              <Plus className="w-4 h-4" /> Einheit
            </Button>
              {(cfg.units as Unit[]).map((u: Unit, idx: number) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                <div className="text-sm font-medium mb-2">Top {idx + 1}</div>
                <NumField label="m²" value={u.flaeche} onChange={(n) => updateUnit(idx, { ...u, flaeche: n })} />
                <NumField label="Miete €/m²" value={u.miete} step={0.5} onChange={(n) => updateUnit(idx, { ...u, miete: n })} />
                <Button variant="ghost" size="icon" onClick={() => removeUnit(idx)} className="mb-2">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </SettingSection>

          <SettingSection title="Finanzierung" icon={PiggyBank}>
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
              <NumField label="Laufzeit (J)" value={cfg.laufzeit} onChange={(n) => setCfg({ ...cfg, laufzeit: n })} />
              <NumField label="Zins (Darlehen) %" value={fin.zinssatz * 100} step={0.1} onChange={(n) => setFin({ ...fin, zinssatz: n / 100 })} suffix="%" />
              <NumField label="Darlehen (€)" value={fin.darlehen} readOnly />
              <NumField label="Annuität (€ p.a.)" value={fin.annuitaet} readOnly />
            </div>
          </SettingSection>

          <SettingSection title="Steuer" icon={Percent}>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="ESt-Satz %" value={fin.steuerRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, steuerRate: n / 100 })} suffix="%" />
              <NumField label="AfA % vom KP" value={fin.afaRate * 100} step={0.1} onChange={(n) => setFin({ ...fin, afaRate: n / 100 })} suffix="%" />
              <NumField label="AfA (€ p.a.)" value={cfg.kaufpreis * fin.afaRate} readOnly />
            </div>
          </SettingSection>

          <SettingSection title="Kosten & Einnahmen" icon={Wallet}>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="BK €/m²/Monat" value={fin.bkM2} step={0.1} onChange={(n) => setFin({ ...fin, bkM2: n })} />
              <NumField label="BK-Steigerung %" value={fin.bkWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, bkWachstum: n / 100 })} suffix="%" />
              <NumField label="Jährliche Bewirtschaftungskosten (€)" value={bkJ1} readOnly />
              <NumField label="Leerstand %" value={fin.leerstand * 100} step={0.1} onChange={(n) => setFin({ ...fin, leerstand: n / 100 })} suffix="%" />
              <NumField label="Einnahmen J1 (€)" value={fin.einnahmenJ1} readOnly />
              <NumField label="Einnahmen-Wachstum %" value={fin.einnahmenWachstum * 100} step={0.1} onChange={(n) => setFin({ ...fin, einnahmenWachstum: n / 100 })} suffix="%" />
            </div>
          </SettingSection>

          <SettingSection title="Marktannahmen" icon={TrendingUp}>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Marktmiete (€/m²)" value={cfg.marktMiete} step={0.5} onChange={(n) => setCfg({ ...cfg, marktMiete: n })} />
              <NumField label="Wertsteigerung %" value={cfg.wertSteigerung * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, wertSteigerung: n / 100 })} suffix="%" />
              <NumField label="Inflation %" value={cfg.inflation * 100} step={0.1} onChange={(n) => setCfg({ ...cfg, inflation: n / 100 })} suffix="%" />
              <SelectField
                label="Stadtteil"
                value={cfg.stadtteil}
                options={(
                  DISTRICT_PRICES as Record<string, { ort: string }[]>
                )[cfg.bauart]?.map((d) => d.ort) ?? []}
                  onChange={(s) => setCfg({ ...cfg, stadtteil: s as string })}
              />
            </div>
          </SettingSection>

          <SettingSection title="Uploads" icon={Upload}>
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

              <div>
                <h4 className="font-semibold text-sm mb-2">PDF</h4>
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
                    <div key={idx} className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
                      <span className="truncate flex-1">{pdf.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => removePdf(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Checkliste ({docsPercent}%)</h4>
                <ul className="space-y-1">
                  {docChecklist.map((doc) => (
                    <li key={doc.key} className="flex items-center gap-2 text-sm">
                      {doc.present ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
                      <span>{doc.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SettingSection>

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
    </>
  );
}
