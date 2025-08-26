"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Building2, Hotel, FileDown, Printer } from "lucide-react";
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

// --- Annahmen & Eckdaten ---
const ASSUMPTIONS = {
  adresse: "Linzer Bundesstraße 33, 5020 Salzburg (Gnigl)",
  flaeche: 700, // knapp 700 m² gesamt
  kaufpreis: 2_800_000,
  ekQuote: 0.2,
  zinssatz: 0.032,
  tilgung: 0.02,
  laufzeit: 30,
  mieteNetto: 15, // €/m²
  marktMiete: 16, // konservativ
  mietenSteigerung: 0.03,
  wertSteigerung: 0.02,
  inflation: 0.03,
  avgPreisGnigl: 5055, // €/m²
};

// Daten aus deinem Excel-Screenshot (Jahre 1–15)
const YEARS = Array.from({ length: 15 }, (_, i) => i + 1);
const restschuld = [
  2430000,
  2381400,
  2331245,
  2279485,
  2226068,
  2170942,
  2114053,
  2055342,
  1994753,
  1932225,
  1867696,
  1801103,
  1732378,
  1661548,
  1588261,
];
const fcf = [
  -22320,
  -19124,
  -15830,
  -12435,
  -8937,
  5331,
  1615,
  2214,
  6160,
  10227,
  14419,
  18738,
  23189,
  27777,
  32504,
];

// Immobilienwert-Entwicklung (konservativ 2% p.a. auf Kaufpreis)
const valueSeries = YEARS.map((y) => ASSUMPTIONS.kaufpreis * Math.pow(1 + ASSUMPTIONS.wertSteigerung, y));

const chartData = YEARS.map((y, idx) => ({
  Jahr: y,
  Restschuld: restschuld[idx],
  Immobilienwert: valueSeries[idx],
  FCF: fcf[idx],
}));

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

export default function InvestmentCaseLB33() {
  const kaufpreisProM2 = ASSUMPTIONS.kaufpreis / ASSUMPTIONS.flaeche;
  const cfPosAb = 6; // positiv ab Jahr 6
  const vermoegensZuwachs10y = 700_000; // konservativer Textwert

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* Topbar mit Logo */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Lege deine Datei unter public/logo.png ab */}
            <img src="/logo.png" alt="Hölzl Investments Logo" className="h-8 w-auto" />
            <Badge variant="secondary" className="hidden sm:inline">LB33</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Drucken / PDF</Button>
            <Button className="gap-2" onClick={() => alert("Bankpackage auf Anfrage – inkl. Excel & Detailmemo.")}> <FileDown className="w-4 h-4" /> Bankpackage</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-start gap-4">
          <Building2 className="w-10 h-10" />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Investment Case – Linzer Bundesstraße 33, Salzburg</h1>
            <p className="mt-2 text-slate-600 max-w-3xl">
              Zinshaus in zentraler Lage (Gnigl) mit zwei Gewerbeeinheiten im EG und drei Wohnungen in den oberen Geschossen – ergänzt durch Kellerflächen. Konservativer, banktauglicher Case mit
              Upside durch mögliche Umwidmung in ein Hotel.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{ASSUMPTIONS.flaeche} m² gesamt</Badge>
              <Badge variant="secondary">{fmtEUR(ASSUMPTIONS.kaufpreis)} Kaufpreis</Badge>
              <Badge variant="secondary">{fmt(kaufpreisProM2)} €/m² Kaufpreis</Badge>
              <Badge variant="secondary">Ø Lagepreis Gnigl: {fmt(ASSUMPTIONS.avgPreisGnigl)} €/m²</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cashflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key label="Positiv ab Jahr" value={`ab Jahr ${cfPosAb}`} sub="konservativ gerechnet" />
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
              <Key label="Unterstellt (ORS)" value={`${ASSUMPTIONS.mieteNetto} €/m² netto kalt`} sub="100% Auslastung, kein Leerstandsrisiko" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Marktmiete Salzburg</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Key label="Konservativ" value={`${ASSUMPTIONS.marktMiete} €/m²`} sub="tatsächlich häufig darüber" />
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
              Die Liegenschaft befindet sich in zentraler Stadtlage von Salzburg-Gnigl. Im Erdgeschoß sind zwei Gewerbeeinheiten situiert, darüber in drei Obergeschoßen drei Wohnungen; Kellerflächen runden das
              Angebot ab. Insgesamt stehen knapp {ASSUMPTIONS.flaeche} m² Nutzfläche zur Verfügung.
            </p>
            <p>
              Die Kalkulation wurde konservativ angesetzt und vom Steuerberater verifiziert. Bei einer Nettokaltmiete von nur {ASSUMPTIONS.mieteNetto} €/m² – und damit unter dem salzburger Marktniveau – wird ab dem {cfPosAb}.
              Jahr ein positiver Cashflow erzielt. Grundlage ist eine Finanzierung mit {Math.round(ASSUMPTIONS.ekQuote * 100)} % Eigenkapital, {Math.round(ASSUMPTIONS.zinssatz * 1000) / 10}% Zinsen, {Math.round(ASSUMPTIONS.tilgung * 100)} % Tilgung
              und {ASSUMPTIONS.laufzeit} Jahren Laufzeit sowie Annahmen von 3% Mietsteigerung, 2% Wertsteigerung und 3% Inflation p.a.
            </p>
            <p>
              Im Zehnjahreszeitraum ergibt sich ein konservativer Vermögenszuwachs von über {fmtEUR(vermoegensZuwachs10y)} aus laufenden Überschüssen, Tilgung und Wertsteigerung. Der Einstiegspreis liegt mit {fmt(kaufpreisProM2)} €/m² deutlich unter dem
              durchschnittlichen Lagepreis von {fmt(ASSUMPTIONS.avgPreisGnigl)} €/m².
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Vermietung (Konservativ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Unterstellt wird eine Vollvermietung an <b>ORS</b> mit {ASSUMPTIONS.mieteNetto} €/m² netto kalt. Damit wird eine <b>100% Auslastung ohne Leerstandsrisiko</b> angenommen – bewusst konservativ
              unter der marktüblichen Miete von {ASSUMPTIONS.marktMiete} €/m² in Salzburg.
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
            <p className="text-xs text-muted-foreground mt-2">Positiver Cashflow ab Jahr {cfPosAb} (konservativer Ansatz).</p>
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
            <p className="text-xs text-muted-foreground mt-2">Wertsteigerung konservativ 2% p.a. auf Kaufpreis unterstellt.</p>
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

      {/* Footer */}
      <section className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          * Alle Angaben ohne Gewähr, konservative Annahmen; Zahlen teils gerundet. Bank- & steuerberatertaugliche Detailunterlagen auf Anfrage.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Drucken / PDF</Button>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Bankpackage auf Anfrage – inkl. Excel & Detailmemo."); }}>
            <Button className="gap-2"><FileDown className="w-4 h-4" /> Bankpackage anfordern</Button>
          </a>
        </div>
      </section>
    </div>
  );
}
