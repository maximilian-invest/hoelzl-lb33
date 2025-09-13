// Jest tests for household calculations
import { calculateAnnuity, calculateMaxLoan, calculateHousehold } from '../household-calculations';
import { HouseholdInputs, DEFAULT_HOUSEHOLD_INPUTS } from '../../types/household';

describe('Household Calculations', () => {
  describe('calculateAnnuity', () => {
    it('should calculate annuity with 0% interest correctly', () => {
      const result = calculateAnnuity(300000, 0, 30);
      // Bei 0% Zinsen: 300000 / (30 * 12) = 833.33
      expect(result).toBeCloseTo(833.33, 2);
    });

    it('should calculate annuity with positive interest correctly', () => {
      const result = calculateAnnuity(300000, 3.5, 30);
      // Annuität bei 3.5% über 30 Jahre
      expect(result).toBeCloseTo(1347.13, 2);
    });

    it('should handle zero loan amount', () => {
      const result = calculateAnnuity(0, 3.5, 30);
      expect(result).toBe(0);
    });

    it('should handle negative interest gracefully', () => {
      const result = calculateAnnuity(300000, -1, 30);
      // Sollte wie 0% behandelt werden
      expect(result).toBeCloseTo(833.33, 2);
    });
  });

  describe('calculateMaxLoan', () => {
    it('should calculate max loan with 0% interest correctly', () => {
      const result = calculateMaxLoan(1000, 0, 30);
      // Bei 0% Zinsen: 1000 * 30 * 12 = 360000
      expect(result).toBeCloseTo(360000, 2);
    });

    it('should calculate max loan with positive interest correctly', () => {
      const result = calculateMaxLoan(1347.13, 3.5, 30);
      // Sollte ungefähr 300000 ergeben (inverse zur Annuität)
      expect(result).toBeCloseTo(300000, -1);
    });

    it('should handle zero max annuity', () => {
      const result = calculateMaxLoan(0, 3.5, 30);
      expect(result).toBe(0);
    });

    it('should be symmetric with calculateAnnuity', () => {
      const loanAmount = 300000;
      const interestRate = 3.5;
      const termYears = 30;
      
      const annuity = calculateAnnuity(loanAmount, interestRate, termYears);
      const maxLoan = calculateMaxLoan(annuity, interestRate, termYears);
      
      expect(maxLoan).toBeCloseTo(loanAmount, 0);
    });
  });

  describe('calculateHousehold', () => {
    it('should calculate basic household correctly', () => {
      const result = calculateHousehold(DEFAULT_HOUSEHOLD_INPUTS);

      // Sollte keine Fehler werfen und sinnvolle Werte zurückgeben
      expect(result.computed.adjustedIncome).toBeGreaterThan(0);
      expect(result.computed.fixedCosts).toBeGreaterThan(0);
      expect(result.computed.annuity).toBeGreaterThan(0);
      expect(result.computed.annuityStress).toBeGreaterThan(result.computed.annuity);
      expect(result.computed.dscr).toBeGreaterThanOrEqual(-10); // DSCR kann negativ sein
      expect(result.computed.maxLoan).toBeGreaterThanOrEqual(0);
      
      // Struktur sollte korrekt sein
      expect(result.inputs).toBeDefined();
      expect(result.assumptions).toBeDefined();
      expect(result.timestampISO).toBeDefined();
      expect(new Date(result.timestampISO)).toBeInstanceOf(Date);
    });

    it('should apply haircuts correctly for different employment types', () => {
      const inputs: HouseholdInputs = {
        ...DEFAULT_HOUSEHOLD_INPUTS,
        employmentIncomes: [
          { label: 'Angestellter', netMonthly: 2000, employmentType: 'employee' },
          { label: 'Selbständiger', netMonthly: 1500, employmentType: 'selfEmployed' },
          { label: 'Pension', netMonthly: 1000, employmentType: 'pension' }
        ],
        rentalIncomes: [{ label: 'Miete', netMonthly: 500 }],
        otherIncomes: [{ label: 'Sonstiges', netMonthly: 200 }],
        haircut: { selfEmployedPct: 20, rentalPct: 30, otherPct: 20 },
        rentOrHousingCost: 0,
        utilitiesEnergy: 0,
        telecomInternet: 0,
        insurance: 0,
        transportLeases: 0,
        alimony: 0,
        otherFixedExpenses: 0,
        existingLoans: [],
        pauschalePerAdult: 0,
        pauschalePerChild: 0,
        targetLoanAmount: 0,
        nominalInterestPct: 0,
        termYears: 1,
        repaymentType: 'annuity',
        stressInterestAddPct: 0,
        minMonthlyBuffer: 0
      };

      const result = calculateHousehold(inputs);

      // Angepasstes Einkommen:
      // Angestellter: 2000 * (1 - 0) = 2000
      // Selbständiger: 1500 * (1 - 0.20) = 1200
      // Pension: 1000 * (1 - 0) = 1000
      // Miete: 500 * (1 - 0.30) = 350
      // Sonstiges: 200 * (1 - 0.20) = 160
      // Gesamt: 2000 + 1200 + 1000 + 350 + 160 = 4710
      expect(result.computed.adjustedIncome).toBe(4710);
    });

    it('should handle stress test correctly', () => {
      const inputs: HouseholdInputs = {
        ...DEFAULT_HOUSEHOLD_INPUTS,
        employmentIncomes: [{ label: 'Hauptverdiener', netMonthly: 4000, employmentType: 'employee' }],
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
        targetLoanAmount: 300000,
        nominalInterestPct: 3.5,
        termYears: 30,
        repaymentType: 'annuity',
        stressInterestAddPct: 3.0,
        minMonthlyBuffer: 300
      };

      const result = calculateHousehold(inputs);

      // Stress-Test Zinssatz: 3.5% + 3.0% = 6.5%
      const stressInterestRate = 3.5 + 3.0;
      
      // Annuität Stress-Test sollte höher sein als nominal
      expect(result.computed.annuityStress).toBeGreaterThan(result.computed.annuity);
      
      // Puffer nach Stress-Test sollte niedriger sein
      expect(result.computed.bufferAfterStress).toBeLessThan(result.computed.bufferAfterNominal);
    });

    it('should calculate max loan correctly', () => {
      const inputs: HouseholdInputs = {
        ...DEFAULT_HOUSEHOLD_INPUTS,
        employmentIncomes: [{ label: 'Hauptverdiener', netMonthly: 5000, employmentType: 'employee' }],
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
        targetLoanAmount: 300000,
        nominalInterestPct: 3.5,
        termYears: 30,
        repaymentType: 'annuity',
        stressInterestAddPct: 3.0,
        minMonthlyBuffer: 300
      };

      const result = calculateHousehold(inputs);

      // Überschuss: 5000 - 2700 = 2300
      // Max. Annuität: 2300 - 300 = 2000
      // Max. Kredit sollte > 0 sein
      expect(result.computed.maxLoan).toBeGreaterThan(0);
      
      // Max. Kredit sollte realistisch sein (nicht unrealistisch hoch)
      expect(result.computed.maxLoan).toBeLessThan(10000000);
    });

    it('should handle existing loans correctly', () => {
      const inputs: HouseholdInputs = {
        ...DEFAULT_HOUSEHOLD_INPUTS,
        existingLoans: [
          { label: 'Bestehender Kredit', monthlyPayment: 500, remainingBalance: 50000 }
        ]
      };

      const result = calculateHousehold(inputs);
      const resultWithoutLoan = calculateHousehold(DEFAULT_HOUSEHOLD_INPUTS);

      // Fixkosten sollten höher sein als ohne bestehenden Kredit
      expect(result.computed.fixedCosts).toBeGreaterThan(resultWithoutLoan.computed.fixedCosts);
      
      // Überschuss sollte niedriger sein als ohne bestehenden Kredit
      expect(result.computed.surplus).toBeLessThan(resultWithoutLoan.computed.surplus);
    });

    it('should validate input assumptions', () => {
      const inputs: HouseholdInputs = {
        ...DEFAULT_HOUSEHOLD_INPUTS,
        employmentIncomes: [{ label: 'Hauptverdiener', netMonthly: 3000, employmentType: 'employee' }],
        rentalIncomes: [],
        otherIncomes: [],
        rentOrHousingCost: 0,
        utilitiesEnergy: 0,
        telecomInternet: 0,
        insurance: 0,
        transportLeases: 0,
        alimony: 0,
        otherFixedExpenses: 0,
        existingLoans: [],
        pauschalePerAdult: 0,
        pauschalePerChild: 0,
        targetLoanAmount: 0,
        nominalInterestPct: 0,
        termYears: 1,
        repaymentType: 'annuity',
        stressInterestAddPct: 0,
        minMonthlyBuffer: 0
      };

      const result = calculateHousehold(inputs);

      // Annahmen sollten korrekt übertragen werden
      expect(result.assumptions.pauschalePerAdult).toBe(0);
      expect(result.assumptions.pauschalePerChild).toBe(0);
      expect(result.assumptions.stressInterestAddPct).toBe(0);
      expect(result.assumptions.minMonthlyBuffer).toBe(0);
      expect(result.assumptions.termYears).toBe(1);
      expect(result.assumptions.nominalInterestPct).toBe(0);
      
      // Timestamp sollte gesetzt sein
      expect(result.timestampISO).toBeDefined();
      expect(new Date(result.timestampISO)).toBeInstanceOf(Date);
    });

    it('should handle edge cases gracefully', () => {
      const inputs: HouseholdInputs = {
        ...DEFAULT_HOUSEHOLD_INPUTS,
        adults: 0,
        children: 0,
        employmentIncomes: [],
        rentalIncomes: [],
        otherIncomes: [],
        rentOrHousingCost: 0,
        utilitiesEnergy: 0,
        telecomInternet: 0,
        insurance: 0,
        transportLeases: 0,
        alimony: 0,
        otherFixedExpenses: 0,
        existingLoans: [],
        pauschalePerAdult: 0,
        pauschalePerChild: 0,
        targetLoanAmount: 0,
        nominalInterestPct: 0,
        termYears: 1,
        repaymentType: 'annuity',
        stressInterestAddPct: 0,
        minMonthlyBuffer: 0
      };

      const result = calculateHousehold(inputs);

      // Sollte keine Fehler werfen und sinnvolle Werte zurückgeben
      expect(result.computed.adjustedIncome).toBe(0);
      expect(result.computed.fixedCosts).toBe(0);
      expect(result.computed.surplus).toBe(0);
      expect(result.computed.annuity).toBe(0);
      expect(result.computed.annuityStress).toBe(0);
      expect(result.computed.dscr).toBe(0);
      expect(result.computed.maxLoan).toBe(0);
      // Bei 0 Kredit ist die Tragfähigkeit immer true (da keine Belastung)
      expect(result.computed.passNominal).toBe(true);
      expect(result.computed.passStress).toBe(true);
      expect(result.computed.overallPass).toBe(true);
    });
  });
});
