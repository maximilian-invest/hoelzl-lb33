import { HouseholdInputs, HouseholdCalcResult } from '@/types/household';

/**
 * Berechnet die monatliche Annuität für einen Kredit
 * @param loanAmount Kreditbetrag
 * @param annualInterestRate Jährlicher Zinssatz (in Prozent, z.B. 3.5 für 3.5%)
 * @param termYears Laufzeit in Jahren
 * @returns Monatliche Annuität
 */
export function calculateAnnuity(
  loanAmount: number,
  annualInterestRate: number,
  termYears: number
): number {
  if (loanAmount <= 0) return 0;
  if (annualInterestRate <= 0) return loanAmount / (termYears * 12);
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return loanAmount / totalPayments;
  }
  
  return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
         (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

/**
 * Berechnet den maximalen Kreditbetrag basierend auf maximaler Annuität
 * @param maxAnnuity Maximale monatliche Annuität
 * @param annualInterestRate Jährlicher Zinssatz (in Prozent)
 * @param termYears Laufzeit in Jahren
 * @returns Maximaler Kreditbetrag
 */
export function calculateMaxLoan(
  maxAnnuity: number,
  annualInterestRate: number,
  termYears: number
): number {
  if (maxAnnuity <= 0) return 0;
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return maxAnnuity * totalPayments;
  }
  
  return maxAnnuity * (Math.pow(1 + monthlyRate, totalPayments) - 1) / 
         (monthlyRate * Math.pow(1 + monthlyRate, totalPayments));
}

/**
 * Berechnet das angepasste Einkommen mit Haircuts
 */
function calculateAdjustedIncome(inputs: HouseholdInputs): number {
  let adjustedIncome = 0;
  
  // Einkommen aus Anstellung
  for (const income of inputs.employmentIncomes) {
    let haircutPct = 0;
    
    switch (income.employmentType) {
      case 'employee':
        haircutPct = 0; // Kein Haircut für Angestellte
        break;
      case 'selfEmployed':
        haircutPct = inputs.haircut.selfEmployedPct;
        break;
      case 'pension':
        haircutPct = 0; // Kein Haircut für Pensionen
        break;
    }
    
    adjustedIncome += income.netMonthly * (1 - haircutPct / 100);
  }
  
  // Mieteinkommen mit Haircut
  for (const income of inputs.rentalIncomes) {
    adjustedIncome += income.netMonthly * (1 - inputs.haircut.rentalPct / 100);
  }
  
  // Sonstige Einkommen mit Haircut
  for (const income of inputs.otherIncomes) {
    adjustedIncome += income.netMonthly * (1 - inputs.haircut.otherPct / 100);
  }
  
  return adjustedIncome;
}

/**
 * Berechnet die Fixkosten inklusive Pauschalen
 */
function calculateFixedCosts(inputs: HouseholdInputs): number {
  let fixedCosts = 0;
  
  // Direkte Fixkosten
  fixedCosts += inputs.rentOrHousingCost;
  fixedCosts += inputs.utilitiesEnergy;
  fixedCosts += inputs.telecomInternet;
  fixedCosts += inputs.insurance;
  fixedCosts += inputs.transportLeases;
  fixedCosts += inputs.alimony;
  fixedCosts += inputs.otherFixedExpenses;
  
  // Bestehende Kredite
  for (const loan of inputs.existingLoans) {
    fixedCosts += loan.monthlyPayment;
  }
  
  // Pauschalen
  fixedCosts += inputs.adults * inputs.pauschalePerAdult;
  fixedCosts += inputs.children * inputs.pauschalePerChild;
  
  return fixedCosts;
}

/**
 * Hauptfunktion für die Haushaltsberechnung
 */
export function calculateHousehold(inputs: HouseholdInputs): HouseholdCalcResult {
  const adjustedIncome = calculateAdjustedIncome(inputs);
  const fixedCosts = calculateFixedCosts(inputs);
  const surplus = adjustedIncome - fixedCosts;
  
  // Neue Kreditrate berechnen
  const annuity = calculateAnnuity(
    inputs.targetLoanAmount,
    inputs.nominalInterestPct,
    inputs.termYears
  );
  
  // Stress-Test: Zinssatz + Stress-Add
  const stressInterestRate = inputs.nominalInterestPct + inputs.stressInterestAddPct;
  const annuityStress = calculateAnnuity(
    inputs.targetLoanAmount,
    stressInterestRate,
    inputs.termYears
  );
  
  // Puffer berechnen
  const bufferAfterNominal = surplus - annuity;
  const bufferAfterStress = surplus - annuityStress;
  
  // Tragfähigkeitsprüfung
  const passNominal = bufferAfterNominal >= inputs.minMonthlyBuffer;
  const passStress = bufferAfterStress >= 0;
  const overallPass = passNominal && passStress;
  
  // DSCR (Debt Service Coverage Ratio)
  const dscr = annuity > 0 ? surplus / annuity : 0;
  
  // Anteile berechnen
  const debtServiceShare = adjustedIncome > 0 ? (annuity / adjustedIncome) * 100 : 0;
  const fixedCostShare = adjustedIncome > 0 ? (fixedCosts / adjustedIncome) * 100 : 0;
  
  // Maximaler Kreditbetrag
  const maxAnnuity = surplus - inputs.minMonthlyBuffer;
  const maxLoan = maxAnnuity > 0 ? calculateMaxLoan(
    maxAnnuity,
    inputs.nominalInterestPct,
    inputs.termYears
  ) : 0;
  
  return {
    inputs,
    computed: {
      adjustedIncome,
      fixedCosts,
      surplus,
      annuity,
      annuityStress,
      dscr: Math.round(dscr * 100) / 100, // 2 Nachkommastellen
      debtServiceShare: Math.round(debtServiceShare * 100) / 100,
      fixedCostShare: Math.round(fixedCostShare * 100) / 100,
      bufferAfterNominal,
      bufferAfterStress,
      maxLoan,
      passNominal,
      passStress,
      overallPass
    },
    assumptions: {
      pauschalePerAdult: inputs.pauschalePerAdult,
      pauschalePerChild: inputs.pauschalePerChild,
      haircut: inputs.haircut,
      stressInterestAddPct: inputs.stressInterestAddPct,
      minMonthlyBuffer: inputs.minMonthlyBuffer,
      termYears: inputs.termYears,
      nominalInterestPct: inputs.nominalInterestPct
    },
    timestampISO: new Date().toISOString()
  };
}
