import { ScoreResult, ContextMetrics } from "@/types/score";

type Unit = { flaeche: number; miete: number };

export interface ScoreInput {
  avgPreisStadtteil: number | null;
  kaufpreisProM2: number;
  marktMiete: number | null;
  avgMiete: number;
  cfPosAb: number;
  finEinnahmenJ1: number;
  finLeerstand: number;
  bkJ1: number;
  annuitaet: number;
  upsideBonus: number;
  upsideTitle?: string;
  irr: number;
  project: {
    adresse: string;
    kaufpreis: number;
    nebenkosten: number;
    ekQuote: number;
    tilgung: number;
    laufzeit: number;
    units: Unit[];
  };
}

export function calculateScore(input: ScoreInput): {
  score: ScoreResult;
  metrics: ContextMetrics;
} {
  const discountPct = input.avgPreisStadtteil
    ? (input.avgPreisStadtteil - input.kaufpreisProM2) / input.avgPreisStadtteil
    : 0;
  const priceDiscount = Math.max(0, Math.min(1, discountPct / 0.2)) * 100;

  const rentDeltaPct = input.marktMiete
    ? (input.marktMiete - input.avgMiete) / input.marktMiete
    : 0;
  const rentDelta = Math.max(0, Math.min(100, 50 + (rentDeltaPct / 0.2) * 50));

  const cashflowStability = input.cfPosAb
    ? Math.max(0, 100 - (input.cfPosAb - 1) * 10)
    : 0;

  const basisDSCR =
    (input.finEinnahmenJ1 * (1 - input.finLeerstand) - input.bkJ1) /
    input.annuitaet;
  const financing =
    basisDSCR <= 1
      ? 0
      : Math.max(0, Math.min(1, (basisDSCR - 1) / 0.5)) * 100;

  const upside = input.upsideBonus * 10;

  const filled = [
    input.project.adresse,
    input.project.kaufpreis,
    input.project.nebenkosten,
    input.project.ekQuote,
    input.project.tilgung,
    input.project.laufzeit,
    input.project.units.length &&
      input.project.units.every((u) => u.flaeche > 0 && u.miete > 0),
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
    `Kaufpreis ${Math.round(Math.abs(discountPct) * 100)} % ${
      discountPct >= 0 ? "unter" : "über"
    } Markt (${discountPct >= 0 ? "Discount" : "Premium"})`,
    `Miete ${Math.round(Math.abs(rentDeltaPct) * 100)} % ${
      rentDeltaPct >= 0 ? "unter" : "über"
    } Marktniveau`,
    input.cfPosAb
      ? `Cashflow ab Jahr ${input.cfPosAb} positiv`
      : "Cashflow bleibt negativ",
  ];
  if (input.upsideBonus > 0 && input.upsideTitle) bullets.push(input.upsideTitle);
  if (dataQuality < 100) bullets.push("Daten teilweise unvollständig");

  const score: ScoreResult = {
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

  const metrics: ContextMetrics = {
    dscr: basisDSCR,
    irr: input.irr,
    priceDiscount: discountPct,
    cfPosAb: input.cfPosAb,
  };

  return { score, metrics };
}
