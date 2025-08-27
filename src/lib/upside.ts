export type UpsideType =
  | "Umwidmung_Hotel"
  | "Dachausbau"
  | "Airbnb"
  | "Sanierung_Mietanhebung"
  | "Nachverdichtung"
  | "Sonstiges";

export interface UpsideScenario {
  id: string;
  active: boolean;
  type: UpsideType;
  title: string;
  startYear: number;
  addedSqm: number;
  newRentPerSqm: number;
  occupancyPct: number;
  capex: number;
  capexAfaPct?: number;
  probabilityPct: number;
  remarks?: string;
}

export interface UpsideCalculationResult {
  cashflowsUpside: number[];
  irrUpside: number;
  irrDelta: number;
  pAvg: number;
  pWeighted: number;
  bonus: number; // 0..10 points
}

/** Round a number to one decimal place */
export const roundTo1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Internal Rate of Return via Newton-Raphson.
 * @param cashflows Array of yearly cashflows, index 0 = Jahr 0
 * @param guess Initial guess
 */
export function irr(cashflows: number[], guess = 0.1): number {
  let rate = guess;
  for (let i = 0; i < 1000; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const cf = cashflows[t];
      const denom = Math.pow(1 + rate, t);
      npv += cf / denom;
      dnpv -= (t * cf) / (denom * (1 + rate));
    }
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-7) return newRate;
    rate = newRate;
  }
  return rate;
}

/**
 * Calculate upside cashflows and scoring.
 * @param cashflowsBasis Basis cashflows inkl. Jahr 0
 * @param irrBasis IRR der Basis-cashflows
 * @param scenarios Upside-Szenarien
 */
export function calculateUpside(
  cashflowsBasis: number[],
  irrBasis: number,
  scenarios: UpsideScenario[]
): UpsideCalculationResult {
  const years = cashflowsBasis.length;
  const cashflowsUpside = [...cashflowsBasis];
  const active = scenarios.filter((s) => s.active);

  for (const s of active) {
    const start = Math.max(0, Math.floor(s.startYear));
    if (start >= years) continue;
    if (s.capex > 0) {
      cashflowsUpside[start] -= s.capex;
    }
    if (s.addedSqm > 0 && s.newRentPerSqm > 0) {
      const extra =
        s.addedSqm * s.newRentPerSqm * 12 * (s.occupancyPct / 100);
      for (let y = start; y < years; y++) {
        cashflowsUpside[y] += extra;
      }
    }
  }

  const irrUpside = irr(cashflowsUpside);
  const irrDelta = Math.max(0, irrUpside - irrBasis);
  const pAvg =
    active.length > 0
      ? active.reduce((sum, s) => sum + s.probabilityPct, 0) / active.length
      : 0;
  const pWeighted = irrDelta * (pAvg / 100);
  const bonus = Math.max(0, Math.min(10, (pWeighted / 0.03) * 10));

  return {
    cashflowsUpside,
    irrUpside,
    irrDelta,
    pAvg,
    pWeighted,
    bonus: roundTo1(bonus),
  };
}

export default calculateUpside;
