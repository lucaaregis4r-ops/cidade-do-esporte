import { describe, expect, it } from 'vitest';
import {
  CRUZEIRO_REFORM_DATE,
  HistoricalEconomy,
  REIS_PER_CRUZEIRO,
  formatNominalMoney,
  formatReis,
  getHistoricalCurrency,
  type HistoricalEconomyDataset,
} from './HistoricalEconomy';

const syntheticDataset: HistoricalEconomyDataset = {
  version: 1,
  baseDate: { year: 1910, month: 1 },
  baseNominalReisPerPpu: 1_000,
  costOfLiving: [
    { year: 1910, month: 1, index: 100, references: [{ id: 'test-base', source: 'Synthetic test fixture', notes: 'Not historical data.' }] },
    { year: 1942, month: 10, index: 250, references: [{ id: 'test-before-reform', source: 'Synthetic test fixture', notes: 'Not historical data.' }] },
    { year: 1942, month: 11, index: 250, references: [{ id: 'test-after-reform', source: 'Synthetic test fixture', notes: 'Not historical data.' }] },
    { year: 1959, month: 12, index: 1_500, references: [{ id: 'test-final', source: 'Synthetic test fixture', notes: 'Not historical data.' }] },
  ],
};

describe('HistoricalEconomy', () => {
  it('keeps real PPU stable while nominal amounts follow the supplied price index', () => {
    const economy = new HistoricalEconomy(syntheticDataset);
    const nominal = economy.toNominal(2, { year: 1959, month: 12, day: 31 });
    expect(nominal.currency).toBe('cruzeiro');
    expect(nominal.amount).toBe(30);
    expect(economy.toPpu(nominal.amount, nominal.currency, nominal.date)).toBe(2);
    expect(economy.toPpu(-nominal.amount, nominal.currency, nominal.date)).toBe(-2);
  });

  it('uses réis through October 1942 and cruzeiros from November 1942', () => {
    const economy = new HistoricalEconomy(syntheticDataset);
    const before = economy.toNominal(1, { year: 1942, month: 10, day: 31 });
    const after = economy.toNominal(1, { year: 1942, month: 11, day: 1 });
    expect(CRUZEIRO_REFORM_DATE).toEqual({ year: 1942, month: 11, day: 1 });
    expect(before).toEqual({ amount: 2_500, currency: 'reis', date: { year: 1942, month: 10, day: 31 } });
    expect(after).toEqual({ amount: 2.5, currency: 'cruzeiro', date: { year: 1942, month: 11, day: 1 } });
    expect(REIS_PER_CRUZEIRO).toBe(1_000);
    expect(economy.toPpu(2_500, 'reis', before.date)).toBe(1);
    expect(economy.toPpu(2.5, 'cruzeiro', after.date)).toBe(1);
  });

  it('identifies canonical currency across reform boundaries', () => {
    expect(getHistoricalCurrency({ year: 1910, month: 1, day: 1 })).toBe('reis');
    expect(getHistoricalCurrency({ year: 1942, month: 10, day: 31 })).toBe('reis');
    expect(getHistoricalCurrency({ year: 1942, month: 11, day: 1 })).toBe('cruzeiro');
    expect(getHistoricalCurrency({ year: 1959, month: 12, day: 31 })).toBe('cruzeiro');
    expect(() => getHistoricalCurrency({ year: 1909, month: 12, day: 31 })).toThrow(RangeError);
    expect(() => getHistoricalCurrency({ year: 1960, month: 1, day: 1 })).toThrow(RangeError);
  });

  it('formats historical réis and nominal currency following Brazilian standards', () => {
    expect(formatReis(1_250_000)).toBe('1:250$000');
    expect(formatReis(2_500)).toBe('2$500');
    expect(formatReis(1_000)).toBe('1$000');
    expect(formatReis(50)).toBe('0$050');
    expect(formatReis(0)).toBe('0$000');

    expect(formatNominalMoney({ amount: 1_250_000, currency: 'reis', date: { year: 1910, month: 1, day: 1 } })).toBe('Rs 1:250$000');
    expect(formatNominalMoney({ amount: 2_500, currency: 'reis', date: { year: 1942, month: 10, day: 31 } })).toBe('Rs 2$500');
    expect(formatNominalMoney({ amount: 2.5, currency: 'cruzeiro', date: { year: 1942, month: 11, day: 1 } })).toContain('Cr$');
    expect(formatNominalMoney({ amount: 2.5, currency: 'cruzeiro', date: { year: 1942, month: 11, day: 1 } })).toContain('2,50');
  });

  it('rejects a currency that does not match the date', () => {
    const economy = new HistoricalEconomy(syntheticDataset);
    expect(() => economy.toPpu(1, 'cruzeiro', { year: 1942, month: 10, day: 31 })).toThrow(TypeError);
    expect(() => economy.toPpu(1_000, 'reis', { year: 1942, month: 11, day: 1 })).toThrow(TypeError);
  });

  it('requires exact monthly index data and does not silently interpolate or extrapolate', () => {
    const economy = new HistoricalEconomy(syntheticDataset);
    expect(() => economy.toNominal(1, { year: 1910, month: 2, day: 1 })).toThrow(RangeError);
    expect(() => economy.toNominal(1, { year: 1960, month: 1, day: 1 })).toThrow(RangeError);
  });

  it('rejects non-finite results caused by numeric overflow', () => {
    const economy = new HistoricalEconomy(syntheticDataset);
    const endOfCampaign = { year: 1959, month: 12, day: 31 };
    expect(() => economy.toNominal(Number.MAX_VALUE, endOfCampaign)).toThrow(RangeError);
    expect(() => economy.toPpu(Number.MAX_VALUE, 'cruzeiro', endOfCampaign)).toThrow(RangeError);
  });

  it('rejects unreferenced, duplicated, invalid, or base-less index datasets', () => {
    const noRefs: HistoricalEconomyDataset = {
      ...syntheticDataset,
      costOfLiving: syntheticDataset.costOfLiving.map((entry, index) => index === 0 ? { ...entry, references: [] } : entry),
    };
    expect(() => new HistoricalEconomy(noRefs)).toThrow(TypeError);
    expect(() => new HistoricalEconomy({ ...syntheticDataset, costOfLiving: [...syntheticDataset.costOfLiving, syntheticDataset.costOfLiving[0]] })).toThrow(TypeError);
    expect(() => new HistoricalEconomy({ ...syntheticDataset, costOfLiving: syntheticDataset.costOfLiving.map((entry, index) => index === 0 ? { ...entry, index: 0 } : entry) })).toThrow(RangeError);
    expect(() => new HistoricalEconomy({ ...syntheticDataset, costOfLiving: syntheticDataset.costOfLiving.slice(1) })).toThrow(RangeError);
  });
});
