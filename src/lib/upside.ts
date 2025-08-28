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
  mode: "add_area" | "rent_increase";
  addedSqm: number;
  newRentPerSqm: number;
  existingSqm: number;
  rentIncreasePerSqm: number;
  occupancyPct: number;
  capex: number;
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
    if (dnpv === 0) break;
    const newRate = rate - npv / dnpv;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < 1e-7) return newRate;
    rate = newRate;
  }
  return isFinite(rate) ? rate : 0;
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

  // Aggregate CAPEX and expected annual extra income for payback assessment
  let totalCapex = 0;
  let expectedAnnualExtra = 0; // probability-weighted extra per year

  for (const s of active) {
    const start = Math.max(0, Math.floor(s.startYear));
    if (start >= years) continue;
    if (s.capex > 0) {
      cashflowsUpside[start] -= s.capex;
      totalCapex += s.capex;
    }
    let extra = 0;
    if (s.mode === "add_area") {
      if (s.addedSqm > 0 && s.newRentPerSqm > 0) {
        extra =
          s.addedSqm * s.newRentPerSqm * 12 * (s.occupancyPct / 100);
      }
    } else {
      if (s.existingSqm > 0 && s.rentIncreasePerSqm > 0) {
        extra =
          s.existingSqm * s.rentIncreasePerSqm * 12 * (s.occupancyPct / 100);
      }
    }
    if (extra > 0) {
      expectedAnnualExtra += extra * (s.probabilityPct / 100);
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
  const weightedPP = pWeighted * 100;

  // Payback assessment: favor fast payback of CAPEX through expected extra income
  let paybackYears = Infinity;
  if (expectedAnnualExtra > 0 && totalCapex > 0) {
    paybackYears = totalCapex / expectedAnnualExtra;
  }
  let paybackFactor = 1; // multiplier 0..1
  if (!isFinite(paybackYears)) {
    paybackFactor = 0.2;
  } else if (paybackYears <= 5) {
    paybackFactor = 1;
  } else if (paybackYears <= 10) {
    // linearly down to 0.5 at 10 years
    const over = paybackYears - 5;
    paybackFactor = 1 - (over / 10) * 0.5; // 5y -> 1.0, 10y -> 0.5
  } else {
    paybackFactor = 0.3;
  }

  // Core score from probability-weighted IRR uplift (in pp)
  let bonusCore: number;
  if (weightedPP >= 15) {
    bonusCore = 10;
  } else if (weightedPP >= 10) {
    bonusCore = 6 + ((weightedPP - 10) / 5) * 4; // 10..15pp -> 6..10
  } else if (weightedPP >= 5) {
    bonusCore = 3 + ((weightedPP - 5) / 5) * 3; // 5..10pp -> 3..6
  } else {
    bonusCore = (weightedPP / 5) * 3; // 0..5pp -> 0..3
  }

  const bonus = bonusCore * paybackFactor;

  return {
    cashflowsUpside,
    irrUpside,
    irrDelta,
    pAvg,
    pWeighted,
    bonus: roundTo1(Math.max(0, Math.min(10, bonus))),
  };
}

export default calculateUpside;
