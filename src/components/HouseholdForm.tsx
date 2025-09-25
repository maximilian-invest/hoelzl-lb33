"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { HouseholdInputs } from '@/types/household';
import { InfoTooltip } from './InfoTooltip';

// Zod Schema für Validierung
const employmentIncomeSchema = z.object({
  label: z.string().min(1, 'Beschreibung ist erforderlich'),
  netMonthly: z.number().min(0, 'Betrag muss positiv sein'),
  employmentType: z.enum(['employee', 'selfEmployed', 'pension'])
});

const simpleIncomeSchema = z.object({
  label: z.string().min(1, 'Beschreibung ist erforderlich'),
  netMonthly: z.number().min(0, 'Betrag muss positiv sein')
});

const existingLoanSchema = z.object({
  label: z.string().min(1, 'Beschreibung ist erforderlich'),
  monthlyPayment: z.number().min(0, 'Rate muss positiv sein'),
  remainingBalance: z.number().min(0, 'Restschuld muss positiv sein'),
  interestPct: z.number().optional()
});

const haircutConfigSchema = z.object({
  selfEmployedPct: z.number().min(0).max(100, 'Prozentsatz muss zwischen 0 und 100 liegen'),
  rentalPct: z.number().min(0).max(100, 'Prozentsatz muss zwischen 0 und 100 liegen'),
  otherPct: z.number().min(0).max(100, 'Prozentsatz muss zwischen 0 und 100 liegen')
});

const householdInputsSchema = z.object({
  adults: z.number().min(1, 'Mindestens 1 Erwachsener erforderlich'),
  children: z.number().min(0, 'Anzahl Kinder darf nicht negativ sein'),
  employmentIncomes: z.array(employmentIncomeSchema).min(1, 'Mindestens ein Einkommen erforderlich'),
  rentalIncomes: z.array(simpleIncomeSchema),
  otherIncomes: z.array(simpleIncomeSchema),
  rentOrHousingCost: z.number().min(0, 'Betrag muss positiv sein'),
  utilitiesEnergy: z.number().min(0, 'Betrag muss positiv sein'),
  telecomInternet: z.number().min(0, 'Betrag muss positiv sein'),
  insurance: z.number().min(0, 'Betrag muss positiv sein'),
  transportLeases: z.number().min(0, 'Betrag muss positiv sein'),
  alimony: z.number().min(0, 'Betrag muss positiv sein'),
  otherFixedExpenses: z.number().min(0, 'Betrag muss positiv sein'),
  existingLoans: z.array(existingLoanSchema),
  pauschalePerAdult: z.number().min(0, 'Pauschale muss positiv sein'),
  pauschalePerChild: z.number().min(0, 'Pauschale muss positiv sein'),
  haircut: haircutConfigSchema,
  targetLoanAmount: z.number().min(0, 'Kreditbetrag muss positiv sein'),
  nominalInterestPct: z.number().min(0, 'Zinssatz muss positiv sein').max(20, 'Zinssatz unrealistisch hoch'),
  termYears: z.number().min(1, 'Laufzeit muss mindestens 1 Jahr betragen').max(50, 'Laufzeit unrealistisch lang'),
  repaymentType: z.literal('annuity'),
  stressInterestAddPct: z.number().min(0, 'Stress-Add muss positiv sein'),
  minMonthlyBuffer: z.number().min(0, 'Puffer muss positiv sein')
});

interface HouseholdFormProps {
  initialData?: Partial<HouseholdInputs>;
  onSubmit: (data: HouseholdInputs) => void;
  onChange?: (data: HouseholdInputs) => void;
  // Kreditdaten aus Finanzierungseingaben
  loanAmount?: number;
  interestRate?: number;
  termYears?: number;
}

export function HouseholdForm({ initialData, onSubmit, onChange, loanAmount, interestRate, termYears }: HouseholdFormProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<HouseholdInputs>({
    resolver: zodResolver(householdInputsSchema),
    defaultValues: {
      adults: 2,
      children: 0,
      employmentIncomes: [{ label: "Hauptverdiener", netMonthly: 3000, employmentType: "employee" }],
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
      haircut: { selfEmployedPct: 20, rentalPct: 30, otherPct: 20 },
      targetLoanAmount: 300000,
      nominalInterestPct: 3.5,
      termYears: 30,
      repaymentType: 'annuity',
      stressInterestAddPct: 3.0,
      minMonthlyBuffer: 300,
      ...initialData
    }
  });

  const { fields: employmentFields, append: appendEmployment, remove: removeEmployment } = useFieldArray({
    control,
    name: 'employmentIncomes'
  });

  const { fields: rentalFields, append: appendRental, remove: removeRental } = useFieldArray({
    control,
    name: 'rentalIncomes'
  });

  const { fields: otherFields, append: appendOther, remove: removeOther } = useFieldArray({
    control,
    name: 'otherIncomes'
  });

  const { fields: loanFields, append: appendLoan, remove: removeLoan } = useFieldArray({
    control,
    name: 'existingLoans'
  });

  // Synchronisiere Kreditdaten aus Finanzierungseingaben (nur bei Änderungen)
  const [lastSyncValues, setLastSyncValues] = useState({
    loanAmount: undefined as number | undefined,
    interestRate: undefined as number | undefined,
    termYears: undefined as number | undefined,
  });

  useEffect(() => {
    // Prüfe ob sich die Werte tatsächlich geändert haben
    const hasChanges = 
      loanAmount !== lastSyncValues.loanAmount ||
      interestRate !== lastSyncValues.interestRate ||
      termYears !== lastSyncValues.termYears;

    if (hasChanges) {
      if (loanAmount !== undefined) {
        setValue('targetLoanAmount', loanAmount);
      }
      if (interestRate !== undefined) {
        setValue('nominalInterestPct', interestRate * 100);
      }
      if (termYears !== undefined) {
        setValue('termYears', termYears);
      }
      
      setLastSyncValues({ loanAmount, interestRate, termYears });
    }
  }, [loanAmount, interestRate, termYears, setValue, lastSyncValues]);

  // Live-Update für onChange - mit Debouncing
  const watchedData = watch();
  const [debouncedData, setDebouncedData] = useState(watchedData);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedData(watchedData);
    }, 150);
    return () => clearTimeout(timer);
  }, [watchedData]);

  useEffect(() => {
    if (onChange && isValid) {
      onChange(debouncedData);
    }
  }, [debouncedData, onChange, isValid]);

  const onSubmitHandler = (data: HouseholdInputs) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
      {/* Haushaltsdaten */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Haushaltsdaten
          <InfoTooltip content="Anzahl der Personen im Haushalt" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Erwachsene</label>
            <input
              type="number"
              min="1"
              {...register('adults', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.adults && <p className="text-red-500 text-sm mt-1">{errors.adults.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Kinder</label>
            <input
              type="number"
              min="0"
              {...register('children', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.children && <p className="text-red-500 text-sm mt-1">{errors.children.message}</p>}
          </div>
        </div>
      </div>

      {/* Einkommen */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Einkommen</h3>
        
        {/* Erwerbseinkommen */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Erwerbseinkommen</h4>
            <button
              type="button"
              onClick={() => appendEmployment({ label: '', netMonthly: 0, employmentType: 'employee' })}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>
          {employmentFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                placeholder="Beschreibung"
                {...register(`employmentIncomes.${index}.label`)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Netto/Monat (€)"
                {...register(`employmentIncomes.${index}.netMonthly`, { valueAsNumber: true })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <select
                {...register(`employmentIncomes.${index}.employmentType`)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="employee">Angestellter</option>
                <option value="selfEmployed">Selbständig</option>
                <option value="pension">Pension</option>
              </select>
              <button
                type="button"
                onClick={() => removeEmployment(index)}
                className="flex items-center justify-center text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {errors.employmentIncomes && (
            <p className="text-red-500 text-sm">{errors.employmentIncomes.message}</p>
          )}
        </div>

        {/* Mieteinkommen */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Mieteinkommen</h4>
            <button
              type="button"
              onClick={() => appendRental({ label: '', netMonthly: 0 })}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>
          {rentalFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                placeholder="Beschreibung"
                {...register(`rentalIncomes.${index}.label`)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Netto/Monat (€)"
                {...register(`rentalIncomes.${index}.netMonthly`, { valueAsNumber: true })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeRental(index)}
                className="flex items-center justify-center text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Sonstige Einkommen */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Sonstige Einkommen</h4>
            <button
              type="button"
              onClick={() => appendOther({ label: '', netMonthly: 0 })}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>
          {otherFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                placeholder="Beschreibung"
                {...register(`otherIncomes.${index}.label`)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Netto/Monat (€)"
                {...register(`otherIncomes.${index}.netMonthly`, { valueAsNumber: true })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeOther(index)}
                className="flex items-center justify-center text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Haircuts */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Haircuts (Bank-Pauschalen)
          <InfoTooltip content="Prozentuale Abschläge, die Banken bei verschiedenen Einkommensarten anwenden" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Selbständige (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('haircut.selfEmployedPct', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mieteinkommen (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('haircut.rentalPct', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sonstige (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('haircut.otherPct', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Ausgaben */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Ausgaben</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Miete/Wohnkosten (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('rentOrHousingCost', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nebenkosten/Energie (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('utilitiesEnergy', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telekom/Internet (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('telecomInternet', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Versicherungen (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('insurance', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Transport/Leasing (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('transportLeases', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unterhalt (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('alimony', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Sonstige Fixkosten (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('otherFixedExpenses', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Bestehende Kredite */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bestehende Kredite</h3>
          <button
            type="button"
            onClick={() => appendLoan({ label: '', monthlyPayment: 0, remainingBalance: 0 })}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
        </div>
        {loanFields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <input
              placeholder="Beschreibung"
              {...register(`existingLoans.${index}.label`)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Rate/Monat (€)"
              {...register(`existingLoans.${index}.monthlyPayment`, { valueAsNumber: true })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Restschuld (€)"
              {...register(`existingLoans.${index}.remainingBalance`, { valueAsNumber: true })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => removeLoan(index)}
              className="flex items-center justify-center text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Pauschalen */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Bank-Pauschalen
          <InfoTooltip content="Monatliche Pauschalen, die Banken für Lebenshaltungskosten ansetzen" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pro Erwachsener (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('pauschalePerAdult', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pro Kind (€/Monat)</label>
            <input
              type="number"
              step="0.01"
              {...register('pauschalePerChild', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Neuer Kredit */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Neuer Kredit
          <InfoTooltip content="Kreditdaten werden automatisch aus den Finanzierungseingaben übernommen" />
        </h3>
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Automatische Synchronisation:</strong> Die Kreditdaten werden automatisch aus den Finanzierungseingaben übernommen und bei Änderungen aktualisiert.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kreditbetrag (€)</label>
            <input
              type="number"
              step="1000"
              {...register('targetLoanAmount', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nominalzins (% p.a.)</label>
            <input
              type="number"
              step="0.01"
              {...register('nominalInterestPct', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Laufzeit (Jahre)</label>
            <input
              type="number"
              min="1"
              {...register('termYears', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tilgungsart</label>
            <select
              {...register('repaymentType')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="annuity">Annuität</option>
            </select>
          </div>
        </div>
      </div>

      {/* Annahmen */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Annahmen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Stress-Zins-Add (% p.a.)
              <InfoTooltip content="Zusätzlicher Zinssatz für den Stress-Test" />
            </label>
            <input
              type="number"
              step="0.1"
              {...register('stressInterestAddPct', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Mindestpuffer (€/Monat)
              <InfoTooltip content="Minimaler monatlicher Puffer nach Kreditrate" />
            </label>
            <input
              type="number"
              step="0.01"
              {...register('minMonthlyBuffer', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
