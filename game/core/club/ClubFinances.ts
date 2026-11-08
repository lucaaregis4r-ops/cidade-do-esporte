/**
 * Club Financial domain model and transaction ledger for 1910-era club accounting (C9, C10).
 * All amounts are tracked in Purchasing Power Units (PPU) and converted to nominal currency for display.
 */

import type { GameDate } from '../HistoricalClock';
import type { FoundingOrigin } from './Club';
import type { ClubFacility } from './ClubFacilities';
import type { LandOccupancyContract } from './ClubLandContract';

export const TRANSACTION_CATEGORIES = [
  'founder_subscription',   // Cotas de subscrição da ata de fundação
  'membership_dues',        // Mensalidades do quadro social
  'facility_construction',  // Obras e construção de instalações
  'facility_maintenance',   // Manutenção, cal, capina e reparos
  'land_rent',              // Aluguel ou foro de arrendamento do terreno
  'land_purchase',          // Aquisição definitiva da parcela
  'donation',               // Doações e auxílios de beneméritos
  'match_revenue',          // Bilheteria de jogos e festivais
  'match_expense',          // Despesas com bolas, uniformes e árbitro
  'administrative',         // Livros de ata, impressos e taxas
  'athletic_stipends',      // Auxílio de transporte, chuteiras e bicho a atletas amadores assistidos
  'fine_tribunal',          // Multas disciplinares aplicadas pelo Tribunal de Penas da Federação
  'honor_tribute',          // Custos com confecção de homenagens, bustos e estátuas de lendas
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface FinancialTransaction {
  readonly id: string;
  readonly date: GameDate;
  readonly category: TransactionCategory;
  readonly amountPPU: number; // Positive = credit/income, Negative = debit/expense
  readonly description: string;
}

export interface ClubFinancialLedger {
  readonly balancePPU: number;
  readonly totalIncomePPU: number;
  readonly totalExpensesPPU: number;
  readonly transactions: readonly FinancialTransaction[];
}

export function validateFinancialTransaction(tx: unknown): tx is FinancialTransaction {
  if (!tx || typeof tx !== 'object') return false;
  const t = tx as Partial<FinancialTransaction>;
  if (typeof t.id !== 'string' || t.id.trim().length === 0) return false;
  if (!t.category || !TRANSACTION_CATEGORIES.includes(t.category)) return false;
  if (typeof t.amountPPU !== 'number' || !Number.isFinite(t.amountPPU)) return false;
  if (typeof t.description !== 'string' || t.description.trim().length === 0) return false;
  if (!t.date || typeof t.date.year !== 'number') return false;
  return true;
}

export function validateClubFinancialLedger(ledger: unknown): ledger is ClubFinancialLedger {
  if (!ledger || typeof ledger !== 'object') return false;
  const l = ledger as Partial<ClubFinancialLedger>;
  if (typeof l.balancePPU !== 'number' || !Number.isFinite(l.balancePPU)) return false;
  if (typeof l.totalIncomePPU !== 'number' || l.totalIncomePPU < 0) return false;
  if (typeof l.totalExpensesPPU !== 'number' || l.totalExpensesPPU < 0) return false;
  if (!Array.isArray(l.transactions)) return false;
  return l.transactions.every(validateFinancialTransaction);
}

/**
 * Creates an initial ledger for a newly established club, crediting founder subscriptions.
 */
export function createInitialLedger(
  initialCapitalPPU: number,
  foundingDate: GameDate,
  origin: FoundingOrigin,
): ClubFinancialLedger {
  const capital = Math.max(0, Math.round(initialCapitalPPU * 10) / 10);
  const initialTransaction: FinancialTransaction = {
    id: `tx-init-${foundingDate.year}${String(foundingDate.month).padStart(2, '0')}-0`,
    date: { ...foundingDate },
    category: 'founder_subscription',
    amountPPU: capital,
    description: `Subscrição inicial de quotas pelos sócios fundadores (${origin})`,
  };

  return {
    balancePPU: capital,
    totalIncomePPU: capital,
    totalExpensesPPU: 0,
    transactions: Object.freeze([initialTransaction]),
  };
}

/**
 * Immutably records a financial transaction, updating ledger balance and totals.
 */
export function recordTransaction(
  ledger: ClubFinancialLedger,
  date: GameDate,
  category: TransactionCategory,
  amountPPU: number,
  description: string,
  sequence?: number,
): ClubFinancialLedger {
  const roundedAmount = Math.round(amountPPU * 10) / 10;
  const seq = sequence ?? (ledger.transactions.length + 1);
  const id = `tx-${date.year}${String(date.month).padStart(2, '0')}-${seq}`;

  const newTx: FinancialTransaction = {
    id,
    date: { ...date },
    category,
    amountPPU: roundedAmount,
    description: description.trim(),
  };

  const nextBalance = Math.round((ledger.balancePPU + roundedAmount) * 10) / 10;
  const nextIncome = roundedAmount > 0
    ? Math.round((ledger.totalIncomePPU + roundedAmount) * 10) / 10
    : ledger.totalIncomePPU;
  const nextExpenses = roundedAmount < 0
    ? Math.round((ledger.totalExpensesPPU + Math.abs(roundedAmount)) * 10) / 10
    : ledger.totalExpensesPPU;

  return {
    balancePPU: nextBalance,
    totalIncomePPU: nextIncome,
    totalExpensesPPU: nextExpenses,
    transactions: Object.freeze([...ledger.transactions, newTx]),
  };
}

export interface MonthlyAccountingResult {
  readonly updatedLedger: ClubFinancialLedger;
  readonly maintenancePaid: boolean;
  readonly rentPaid: boolean;
}

/**
 * Calculates and processes monthly recurring obligations (land rent and facility maintenance).
 */
export function processMonthlyAccounting(
  ledger: ClubFinancialLedger,
  facilities: readonly ClubFacility[],
  contracts: readonly LandOccupancyContract[],
  currentDate: GameDate,
): MonthlyAccountingResult {
  let currentLedger = ledger;
  let maintenancePaid = false;
  let rentPaid = false;

  // 1. Process active lease/rent obligations
  const activeRental = contracts.find((c) => (c.type === 'ALUGUEL' || c.type === 'ARRENDAMENTO' || c.monthlyCostPpu > 0) && c.monthlyCostPpu > 0);
  if (activeRental && activeRental.monthlyCostPpu > 0) {
    const rentAmount = activeRental.monthlyCostPpu;
    if (currentLedger.balancePPU >= rentAmount) {
      currentLedger = recordTransaction(
        currentLedger,
        currentDate,
        'land_rent',
        -rentAmount,
        `Pagamento de aluguel mensal da sede (${activeRental.type})`,
      );
      rentPaid = true;
    } else {
      // Incur arrears or partial payment
      rentPaid = false;
    }
  } else {
    rentPaid = true; // No rent owed
  }

  // 2. Process facility maintenance
  const totalMaintenance = facilities.reduce((sum, f) => sum + f.monthlyMaintenancePPU, 0);
  if (totalMaintenance > 0) {
    if (currentLedger.balancePPU >= totalMaintenance) {
      currentLedger = recordTransaction(
        currentLedger,
        currentDate,
        'facility_maintenance',
        -totalMaintenance,
        `Manutenção e conservação das instalações esportivas`,
      );
      maintenancePaid = true;
    } else {
      // Club couldn't pay full maintenance
      maintenancePaid = false;
    }
  } else {
    maintenancePaid = true;
  }

  return {
    updatedLedger: currentLedger,
    maintenancePaid,
    rentPaid,
  };
}
