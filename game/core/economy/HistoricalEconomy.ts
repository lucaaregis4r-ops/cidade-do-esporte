import { daysInMonth, type GameDate } from '../HistoricalClock';

export type HistoricalCurrency = 'reis' | 'cruzeiro';

export interface HistoricalReference {
  readonly id: string;
  readonly source: string;
  readonly year?: number;
  readonly notes: string;
}

export interface CostOfLivingObservation {
  readonly year: number;
  readonly month: number;
  /** Relative price-level index; units are defined by the dataset's base observation. */
  readonly index: number;
  readonly references: readonly HistoricalReference[];
}

export interface HistoricalEconomyDataset {
  readonly version: 1;
  readonly baseDate: Readonly<Pick<GameDate, 'year' | 'month'>>;
  /** Number of pre-reform réis representing one PPU at the index base date. */
  readonly baseNominalReisPerPpu: number;
  readonly costOfLiving: readonly CostOfLivingObservation[];
}

export interface NominalMoney {
  readonly amount: number;
  readonly currency: HistoricalCurrency;
  readonly date: Readonly<GameDate>;
}

export const CRUZEIRO_REFORM_DATE: Readonly<GameDate> = Object.freeze({ year: 1942, month: 11, day: 1 });
export const REIS_PER_CRUZEIRO = 1_000;

function validateDate(date: GameDate): void {
  if (
    date === null || typeof date !== 'object' ||
    !Number.isInteger(date.year) || date.year < 1910 || date.year > 1959 ||
    !Number.isInteger(date.month) || date.month < 1 || date.month > 12 ||
    !Number.isInteger(date.day) || date.day < 1 || date.day > daysInMonth(date.year, date.month)
  ) throw new RangeError('Economic date must be a valid campaign date from 1910 through 1959');
}

function dateKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function isCurrencyDate(date: GameDate, currency: HistoricalCurrency): boolean {
  const isCruzeiroEra = date.year > 1942 || (date.year === 1942 && date.month >= 11);
  return currency === (isCruzeiroEra ? 'cruzeiro' : 'reis');
}

function validateReference(reference: HistoricalReference): void {
  if (
    !reference || typeof reference.id !== 'string' || reference.id.trim().length === 0 ||
    typeof reference.source !== 'string' || reference.source.trim().length === 0 ||
    typeof reference.notes !== 'string' || reference.notes.trim().length === 0 ||
    (reference.year !== undefined && (!Number.isInteger(reference.year) || reference.year < 1))
  ) throw new TypeError('Every historical index reference requires an ID, source, and notes');
}

/** Returns the canonical currency ('reis' or 'cruzeiro') for a given campaign date. */
export function getHistoricalCurrency(date: GameDate): HistoricalCurrency {
  validateDate(date);
  return isCurrencyDate(date, 'cruzeiro') ? 'cruzeiro' : 'reis';
}

/** Formats a numerical amount of réis in traditional notation (e.g. 1:250$000 or 2$500). */
export function formatReis(amount: number): string {
  const isNegative = amount < 0;
  const rounded = Math.round(Math.abs(amount));
  const contos = Math.floor(rounded / 1_000_000);
  const milReis = Math.floor((rounded % 1_000_000) / 1_000);
  const reis = rounded % 1_000;

  const prefix = isNegative ? '-' : '';
  if (contos > 0) {
    return `${prefix}${contos}:${String(milReis).padStart(3, '0')}$${String(reis).padStart(3, '0')}`;
  }
  return `${prefix}${milReis}$${String(reis).padStart(3, '0')}`;
}

/** Formats a nominal money value according to Brazilian historical standards. */
export function formatNominalMoney(money: NominalMoney): string {
  if (money.currency === 'cruzeiro') {
    const isNegative = money.amount < 0;
    const formatted = Math.abs(money.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${isNegative ? '-Cr$ ' : 'Cr$ '}${formatted}`;
  }
  return `Rs ${formatReis(money.amount)}`;
}

/**
 * Converts stable real purchasing-power units to the campaign's canonical nominal denomination.
 * A calibrated, fully cited monthly index series is required; there is no fabricated fallback data.
 */
export class HistoricalEconomy {
  private readonly indexByMonth: ReadonlyMap<string, CostOfLivingObservation>;
  private readonly baseIndex: number;

  constructor(readonly dataset: HistoricalEconomyDataset) {
    if (!dataset || dataset.version !== 1 || !dataset.baseDate || !Array.isArray(dataset.costOfLiving)) {
      throw new TypeError('Historical economy dataset must use schema version 1 and provide monthly observations');
    }
    if (!Number.isFinite(dataset.baseNominalReisPerPpu) || dataset.baseNominalReisPerPpu <= 0) {
      throw new RangeError('Base nominal réis per PPU must be a finite positive amount');
    }
    if (
      !Number.isInteger(dataset.baseDate.year) || dataset.baseDate.year < 1910 || dataset.baseDate.year > 1959 ||
      !Number.isInteger(dataset.baseDate.month) || dataset.baseDate.month < 1 || dataset.baseDate.month > 12
    ) throw new RangeError('Economic base date must be a campaign month from 1910 through 1959');

    const byMonth = new Map<string, CostOfLivingObservation>();
    for (const observation of dataset.costOfLiving) {
      if (
        !Number.isInteger(observation.year) || observation.year < 1910 || observation.year > 1959 ||
        !Number.isInteger(observation.month) || observation.month < 1 || observation.month > 12
      ) throw new RangeError('Cost-of-living observations must use campaign months from 1910 through 1959');
      if (!Number.isFinite(observation.index) || observation.index <= 0) {
        throw new RangeError('Cost-of-living index must be finite and positive');
      }
      if (!Array.isArray(observation.references) || observation.references.length === 0) {
        throw new TypeError('Every cost-of-living observation requires at least one historical reference');
      }
      observation.references.forEach(validateReference);
      const key = dateKey(observation.year, observation.month);
      if (byMonth.has(key)) throw new TypeError(`Duplicate cost-of-living observation for ${key}`);
      byMonth.set(key, Object.freeze({
        year: observation.year,
        month: observation.month,
        index: observation.index,
        references: Object.freeze(observation.references.map((reference: HistoricalReference) => Object.freeze({ ...reference }))),
      }));
    }

    const base = byMonth.get(dateKey(dataset.baseDate.year, dataset.baseDate.month));
    if (!base) throw new RangeError('Cost-of-living observations must include the declared base month');
    this.indexByMonth = byMonth;
    this.baseIndex = base.index;
    this.dataset = Object.freeze({
      version: 1,
      baseDate: Object.freeze({ ...dataset.baseDate }),
      baseNominalReisPerPpu: dataset.baseNominalReisPerPpu,
      costOfLiving: Object.freeze([...byMonth.values()]),
    });
  }

  currencyForDate(date: GameDate): HistoricalCurrency {
    return getHistoricalCurrency(date);
  }

  /** Convert stable PPU into nominal réis or cruzeiros for a month with cited index data. */
  toNominal(amountPpu: number, date: GameDate): NominalMoney {
    if (!Number.isFinite(amountPpu)) throw new RangeError('PPU amount must be finite');
    const observation = this.getObservation(date);
    const nominalReis = amountPpu * this.dataset.baseNominalReisPerPpu * (observation.index / this.baseIndex);
    const currency = this.currencyForDate(date);
    const amount = currency === 'cruzeiro' ? nominalReis / REIS_PER_CRUZEIRO : nominalReis;
    if (!Number.isFinite(amount)) throw new RangeError('Nominal conversion result is outside the finite numeric range');
    return Object.freeze({ amount, currency, date: Object.freeze({ ...date }) });
  }

  /** Convert a nominal amount back to stable PPU, requiring the currency valid on that date. */
  toPpu(amount: number, currency: HistoricalCurrency, date: GameDate): number {
    if (!Number.isFinite(amount)) throw new RangeError('Nominal amount must be finite');
    if (currency !== 'reis' && currency !== 'cruzeiro') throw new TypeError('Unsupported historical currency');
    const expectedCurrency = this.currencyForDate(date);
    if (currency !== expectedCurrency) {
      throw new TypeError(`Currency ${currency} is not valid on ${dateKey(date.year, date.month)}`);
    }
    const observation = this.getObservation(date);
    const nominalReis = currency === 'cruzeiro' ? amount * REIS_PER_CRUZEIRO : amount;
    const amountPpu = nominalReis / (this.dataset.baseNominalReisPerPpu * (observation.index / this.baseIndex));
    if (!Number.isFinite(amountPpu)) throw new RangeError('PPU conversion result is outside the finite numeric range');
    return amountPpu;
  }

  private getObservation(date: GameDate): CostOfLivingObservation {
    validateDate(date);
    const observation = this.indexByMonth.get(dateKey(date.year, date.month));
    if (!observation) throw new RangeError(`No cited cost-of-living index for ${dateKey(date.year, date.month)}`);
    return observation;
  }
}
