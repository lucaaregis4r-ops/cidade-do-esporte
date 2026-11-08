import { describe, expect, it } from 'vitest';
import {
  TRANSACTION_CATEGORIES,
  createInitialLedger,
  recordTransaction,
  processMonthlyAccounting,
  validateFinancialTransaction,
  validateClubFinancialLedger,
} from './ClubFinances';
import type { ClubFacility } from './ClubFacilities';
import type { LandOccupancyContract } from './ClubLandContract';

describe('ClubFinances domain model (C9, C10)', () => {
  const sampleDate = { year: 1910, month: 5, day: 1 };

  it('defines all required historical transaction categories', () => {
    expect(TRANSACTION_CATEGORIES).toContain('founder_subscription');
    expect(TRANSACTION_CATEGORIES).toContain('facility_maintenance');
    expect(TRANSACTION_CATEGORIES).toContain('land_rent');
    expect(TRANSACTION_CATEGORIES).toContain('donation');
  });

  it('creates an initial ledger with founder subscriptions', () => {
    const ledger = createInitialLedger(250, sampleDate, 'railway');
    expect(ledger.balancePPU).toBe(250);
    expect(ledger.totalIncomePPU).toBe(250);
    expect(ledger.totalExpensesPPU).toBe(0);
    expect(ledger.transactions.length).toBe(1);
    expect(ledger.transactions[0].category).toBe('founder_subscription');
    expect(ledger.transactions[0].amountPPU).toBe(250);
  });

  it('records transactions imutably updating balances and totals', () => {
    const initial = createInitialLedger(100, sampleDate, 'students');
    const afterExpense = recordTransaction(
      initial,
      { year: 1910, month: 5, day: 10 },
      'match_expense',
      -25,
      'Compra de bolas inglesas de couro',
    );

    expect(afterExpense.balancePPU).toBe(75);
    expect(afterExpense.totalExpensesPPU).toBe(25);
    expect(afterExpense.totalIncomePPU).toBe(100);
    expect(afterExpense.transactions.length).toBe(2);

    const afterIncome = recordTransaction(
      afterExpense,
      { year: 1910, month: 5, day: 15 },
      'donation',
      50,
      'Doação de patrono benemérito',
    );

    expect(afterIncome.balancePPU).toBe(125);
    expect(afterIncome.totalIncomePPU).toBe(150);
    expect(afterIncome.totalExpensesPPU).toBe(25);
    expect(afterIncome.transactions.length).toBe(3);
  });

  it('processes monthly accounting with land rent and maintenance', () => {
    const ledger = createInitialLedger(100, sampleDate, 'workers');
    const facilities: ClubFacility[] = [
      {
        id: 'f1',
        type: 'dirt_pitch',
        name: 'Campo',
        builtDate: sampleDate,
        condition: 100,
        capacity: 200,
        monthlyMaintenancePPU: 4,
        valuePPU: 80,
      },
    ];
    const contracts: LandOccupancyContract[] = [
      {
        id: 'c1',
        parcelId: 'p1',
        clubId: 'club-test',
        type: 'ALUGUEL',
        startDate: sampleDate,
        upfrontCostPpu: 0,
        monthlyCostPpu: 6,
        grantorName: 'Proprietário',
        terms: ['Aluguel mensal'],
      },
    ];

    const result = processMonthlyAccounting(
      ledger,
      facilities,
      contracts,
      { year: 1910, month: 6, day: 1 },
    );

    expect(result.maintenancePaid).toBe(true);
    expect(result.rentPaid).toBe(true);
    // 100 - 6 (rent) - 4 (maintenance) = 90
    expect(result.updatedLedger.balancePPU).toBe(90);
    expect(result.updatedLedger.transactions.length).toBe(3);
  });

  it('handles insolvency when balance is insufficient for recurring expenses', () => {
    const poorLedger = createInitialLedger(5, sampleDate, 'workers');
    const contracts: LandOccupancyContract[] = [
      {
        id: 'c1',
        parcelId: 'p1',
        clubId: 'club-test',
        type: 'ALUGUEL',
        startDate: sampleDate,
        upfrontCostPpu: 0,
        monthlyCostPpu: 10,
        grantorName: 'Proprietário',
        terms: ['Aluguel mensal'],
      },
    ];

    const result = processMonthlyAccounting(
      poorLedger,
      [],
      contracts,
      { year: 1910, month: 6, day: 1 },
    );

    expect(result.rentPaid).toBe(false);
    expect(result.updatedLedger.balancePPU).toBe(5); // Not deducted if insufficient
  });

  it('validates ledger and transaction structures', () => {
    const ledger = createInitialLedger(50, sampleDate, 'elite');
    expect(validateClubFinancialLedger(ledger)).toBe(true);
    expect(validateFinancialTransaction(ledger.transactions[0])).toBe(true);

    expect(validateFinancialTransaction(null)).toBe(false);
    expect(validateFinancialTransaction({ ...ledger.transactions[0], amountPPU: 'fifty' as unknown as number })).toBe(false);
    expect(validateClubFinancialLedger({ ...ledger, balancePPU: 'invalid' as unknown as number })).toBe(false);
  });
});

