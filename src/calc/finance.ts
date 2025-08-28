export interface FinanceInputs {
  V0: number; // Kaufpreis exkl. NK
  g: number; // Rate p.a.
  nebenkostenPct: number; // 0..1
  nkInLoan: boolean;
  L0: number; // Darlehen Start
  fcfByYear: number[]; // FCF nach Schuldendienst je Jahr
  restBegByYear?: number[]; // optional, Beginn-Salden
  tilgungByYear?: number[]; // optional, Tilgung je Jahr
  einnahmenByYear?: number[]; // optional
  ausgabenByYear?: number[]; // optional
}

export function computeNK(V0: number, nebenkostenPct: number): number {
  return V0 * (nebenkostenPct || 0);
}

export function computeEquity0({ V0, nebenkostenPct, nkInLoan, L0 }: Pick<FinanceInputs, "V0" | "nebenkostenPct" | "nkInLoan" | "L0">): number {
  const NK = computeNK(V0, nebenkostenPct);
  return (nkInLoan ? V0 : V0 + NK) - L0;
}

export function computeVt(V0: number, g: number, t: number): number {
  return V0 * Math.pow(1 + (g || 0), t);
}

export function restEndAt(t: number, restBegByYear?: number[], tilgungByYear?: number[]): number | null {
  if (!restBegByYear || !tilgungByYear) return null;
  const idx = t - 1;
  const beg = restBegByYear[idx] ?? 0;
  const tilg = tilgungByYear[idx] ?? 0;
  return beg - tilg;
}

function sumFirstN(values: number[] | undefined, n: number): number {
  if (!values || values.length === 0) return 0;
  const len = Math.min(n, values.length);
  let s = 0;
  for (let i = 0; i < len; i++) s += values[i] || 0;
  return s;
}

export function computeRoeY1(inputs: FinanceInputs): number | null {
  const ek0 = computeEquity0(inputs);
  if (ek0 <= 0) return null;
  const fcf1 = inputs.fcfByYear?.[0] ?? 0;
  return fcf1 / ek0;
}

export function computeRoe10Pa(inputs: FinanceInputs): number | null {
  const ek0 = computeEquity0(inputs);
  if (ek0 <= 0) return null;
  const avgFcf10 = sumFirstN(inputs.fcfByYear, 10) / 10;
  return avgFcf10 / ek0;
}

export function computeRoe10Cum(inputs: FinanceInputs): number | null {
  const ek0 = computeEquity0(inputs);
  if (ek0 <= 0) return null;
  const sumFcf10 = sumFirstN(inputs.fcfByYear, 10);
  return sumFcf10 / ek0;
}

export function computeRoiY1(inputs: FinanceInputs): number | null {
  const invest = inputs.V0 + (inputs.nkInLoan ? 0 : computeNK(inputs.V0, inputs.nebenkostenPct));
  if (invest <= 0) return null;
  const e = inputs.einnahmenByYear?.[0] ?? 0;
  const a = inputs.ausgabenByYear?.[0] ?? 0;
  return (e - a) / invest;
}

export function computeRoi10Cum(inputs: FinanceInputs): number | null {
  const invest = inputs.V0 + (inputs.nkInLoan ? 0 : computeNK(inputs.V0, inputs.nebenkostenPct));
  if (invest <= 0) return null;
  const eSum = sumFirstN(inputs.einnahmenByYear, 10);
  const aSum = sumFirstN(inputs.ausgabenByYear, 10);
  return (eSum - aSum) / invest;
}

export function sumFcfFirst10(inputs: FinanceInputs): number {
  return sumFirstN(inputs.fcfByYear, 10);
}


