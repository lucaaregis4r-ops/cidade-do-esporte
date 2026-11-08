import { describe, expect, it } from 'vitest';
import { runCityHistoryEnsemble, serializeCityHistoryEnsemble } from './CityHistoryEnsemble';

const SEEDS = ['CM-B11-SEED-C', 'CM-B11-SEED-A', 'CM-B11-SEED-B'] as const;

describe('headless autonomous city ensemble', () => {
  it('produces reproducible statistic bands for every snapshot year', () => {
    const first = runCityHistoryEnsemble(SEEDS);
    const second = runCityHistoryEnsemble(SEEDS);

    expect(first).toEqual(second);
    expect(serializeCityHistoryEnsemble(first)).toBe(serializeCityHistoryEnsemble(second));
    expect(first.seedIds).toEqual([...SEEDS].sort());
    expect(first.sampleCount).toBe(3);
    expect(first.years.map(({ year }) => year)).toEqual([1910, 1920, 1930, 1940, 1950, 1959]);
    expect(first.years[0].metrics.baselineLandValuePpu).not.toBeNull();
    expect(first.years[1].metrics.baselineLandValuePpu).toBeNull();
    for (const year of first.years) {
      for (const band of Object.values(year.metrics)) {
        if (band === null) continue;
        expect(band.minimum).toBeLessThanOrEqual(band.mean);
        expect(band.mean).toBeLessThanOrEqual(band.maximum);
      }
    }
  }, 60_000);

  it('canonicalizes seed order and changes bands when the seed set changes', () => {
    const ordered = runCityHistoryEnsemble(SEEDS);
    const reversed = runCityHistoryEnsemble([...SEEDS].reverse());
    const different = runCityHistoryEnsemble(['CM-B11-SEED-A', 'CM-B11-SEED-B', 'CM-B11-SEED-D']);

    expect(serializeCityHistoryEnsemble(ordered)).toBe(serializeCityHistoryEnsemble(reversed));
    expect(serializeCityHistoryEnsemble(ordered)).not.toBe(serializeCityHistoryEnsemble(different));
  }, 60_000);

  it('rejects invalid or repeated seed sets', () => {
    expect(() => runCityHistoryEnsemble([])).toThrow(/at least two/);
    expect(() => runCityHistoryEnsemble(['one'])).toThrow(/at least two/);
    expect(() => runCityHistoryEnsemble(['one', 'one'])).toThrow(/unique/);
    expect(() => runCityHistoryEnsemble(['one', '  '])).toThrow(/non-empty/);
  });
});
