import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";
import { fmtEUR } from "@/lib/format";

interface Props {
  chartData: unknown[];
  valueGrowthData: unknown[];
  cfg: Record<string, unknown>;
  fin: Record<string, unknown>;
  bkJ1: number;
  cfPosAb: number | null;
  startEK: number;
  PLAN_30Y: unknown[];
  equityAt: (p: number) => number;
  compareFcfData: unknown[];
  compareEquityData: unknown[];
  showCompare: boolean;
}

export function ChartsSection({
  chartData,
  valueGrowthData,
  cfg,
  fin,
  bkJ1,
  cfPosAb,
  startEK,
  PLAN_30Y,
  equityAt,
  compareFcfData,
  compareEquityData,
  showCompare,
}: Props) {
  return (
    <>
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
            <p className="text-xs text-muted-foreground mt-2">Positiver Cashflow ab Jahr {cfPosAb || "–"} (Einnahmen-Wachstum {Math.round(fin.einnahmenWachstum * 100)}% p.a., Annuität {fmtEUR(fin.annuitaet)}, BK {fmtEUR(bkJ1)} p.a.).</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Wertzuwachs der Immobilie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={valueGrowthData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Jahr" />
                  <YAxis tickFormatter={(v) => fmtEUR(typeof v === "number" ? v : Number(v))} width={80} />
                  <Tooltip formatter={(val) => fmtEUR(typeof val === "number" ? val : Number(val))} />
                  <Line type="monotone" dataKey="Wert" stroke="#16a34a" name="Immobilienwert" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(cfg.wertSteigerung * 100)}% jährlicher Wertzuwachs über {cfg.laufzeit} Jahre.
            </p>
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
                <CardTitle>5 / 10 / 15 Jahre – Equity & Zuwachs Vergleich</CardTitle>
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
                <p className="text-xs text-muted-foreground mt-2">
                  Definition: Equity = Marktwert − Restschuld + kumulierter Cashflow,
                  Zuwachs = Equity − Start‑EK ({fmtEUR(startEK)}).
                </p>
              </CardContent>
            </Card>
          );
        })()}
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
          </>
        )}
      </section>
    </>
  );
}
