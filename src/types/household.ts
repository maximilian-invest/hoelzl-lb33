export type EmploymentType = 'employee' | 'selfEmployed' | 'pension';

export interface EmploymentIncome {
  label: string;
  netMonthly: number;
  employmentType: EmploymentType;
}

export interface SimpleIncome {
  label: string;
  netMonthly: number;
}

export interface ExistingLoan {
  label: string;
  monthlyPayment: number;
  remainingBalance: number;
  interestPct?: number;
}

export interface HaircutConfig {
  selfEmployedPct: number;
  rentalPct: number;
  otherPct: number;
}

export interface HouseholdInputs {
  adults: number;
  children: number;
  employmentIncomes: EmploymentIncome[];
  rentalIncomes: SimpleIncome[];
  otherIncomes: SimpleIncome[];
  rentOrHousingCost: number;
  utilitiesEnergy: number;
  telecomInternet: number;
  insurance: number;
  transportLeases: number;
  alimony: number;
  otherFixedExpenses: number;
  existingLoans: ExistingLoan[];
  pauschalePerAdult: number;
  pauschalePerChild: number;
  haircut: HaircutConfig;
  targetLoanAmount: number;
  nominalInterestPct: number;
  termYears: number;
  repaymentType: 'annuity';
  stressInterestAddPct: number;
  minMonthlyBuffer: number;
}

export interface HouseholdCalcResult {
  inputs: HouseholdInputs;
  computed: {
    adjustedIncome: number;
    fixedCosts: number;
    surplus: number;
    annuity: number;
    annuityStress: number;
    dscr: number;
    debtServiceShare: number;
    fixedCostShare: number;
    bufferAfterNominal: number;
    bufferAfterStress: number;
    maxLoan: number;
    passNominal: boolean;
    passStress: boolean;
    overallPass: boolean;
  };
  assumptions: {
    pauschalePerAdult: number;
    pauschalePerChild: number;
    haircut: HaircutConfig;
    stressInterestAddPct: number;
    minMonthlyBuffer: number;
    termYears: number;
    nominalInterestPct: number;
  };
  timestampISO: string;
}

// Default-Werte für die Haushaltsrechnung
export const DEFAULT_HOUSEHOLD_INPUTS: HouseholdInputs = {
  adults: 2,
  children: 0,
  employmentIncomes: [
    {
      label: "Hauptverdiener",
      netMonthly: 3000,
      employmentType: "employee"
    }
  ],
  rentalIncomes: [],
  otherIncomes: [],
  rentOrHousingCost: 800,
  utilitiesEnergy: 150,
  telecomInternet: 50,
  insurance: 200,
  transportLeases: 0,
  alimony: 0,
  otherFixedExpenses: 200,
  existingLoans: [],
  pauschalePerAdult: 1100,
  pauschalePerChild: 350,
  haircut: {
    selfEmployedPct: 20,
    rentalPct: 30,
    otherPct: 20
  },
  targetLoanAmount: 300000,
  nominalInterestPct: 3.5,
  termYears: 30,
  repaymentType: 'annuity',
  stressInterestAddPct: 3.0,
  minMonthlyBuffer: 300
};
