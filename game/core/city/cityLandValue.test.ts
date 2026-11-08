import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityDistricts1910 } from './cityDistricts';
import { generateCityFoundation1910 } from './cityFoundation';
import { generateCityLandValue1910, type LandValueCalibration } from './cityLandValue';
import { generateCityParcels1910 } from './cityParcels';
import { generateCityTerrain } from './cityTerrain';
import { HistoricalEconomy, type HistoricalEconomyDataset } from '../economy/HistoricalEconomy';

function makeCity(seed: string) {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, 32, 32);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  const districts = generateCityDistricts1910(city, terrain, foundation, rng);
  const parcels = generateCityParcels1910(city, terrain, districts, foundation);
  return { city, foundation, districts, parcels };
}

const calibration: LandValueCalibration = {
  id: 'synthetic-calibration-for-tests',
  baseLandValuePpuPerTile: 10,
  minimumMultiplier: 0.5,
  maximumMultiplier: 2,
  weights: {
    centrality: 0.15,
    accessibility: 0.15,
    railAccess: 0.15,
    roadAccess: 0.15,
    commerceAccess: 0.1,
    industryAccess: 0.1,
    terrainQuality: 0.1,
    neighborhoodPopulation: 0.1,
  },
  references: [{ id: 'synthetic-land-fixture', source: 'Synthetic test fixture', notes: 'Not historical evidence; tests the injected model contract only.' }],
  notes: 'Synthetic test calibration; never use for production valuation.',
};

const syntheticEconomy = new HistoricalEconomy({
  version: 1,
  baseDate: { year: 1910, month: 1 },
  baseNominalReisPerPpu: 100,
  costOfLiving: [{
    year: 1910,
    month: 1,
    index: 100,
    references: [{ id: 'synthetic-index', source: 'Synthetic test fixture', notes: 'Not historical data.' }],
  }],
} satisfies HistoricalEconomyDataset);

describe('generateCityLandValue1910', () => {
  it('produces deterministic, explainable PPU values without mutating the parcel ledger', () => {
    const firstInput = makeCity('CM-1910-land-value');
    const secondInput = makeCity('CM-1910-land-value');
    const first = generateCityLandValue1910(firstInput.city, firstInput.parcels, firstInput.districts, firstInput.foundation, calibration);
    const second = generateCityLandValue1910(secondInput.city, secondInput.parcels, secondInput.districts, secondInput.foundation, calibration);
    expect(first).toEqual(second);
    expect(first.parcels).toHaveLength(firstInput.parcels.parcels.length);
    expect(first.references).toEqual(calibration.references);
    expect(first.totalLandValuePpu).toBe(first.parcels.reduce((sum, parcel) => sum + parcel.landValuePpu, 0));
    for (const value of first.parcels) {
      expect(Number.isFinite(value.landValuePpu)).toBe(true);
      expect(value.landValuePpu).toBeGreaterThan(0);
      expect(value.relativeScore).toBeCloseTo(Object.values(value.factors).reduce((sum, factor) => sum + factor.contribution, 0));
      expect(Object.keys(value.factors)).toHaveLength(8);
      expect(value.nominalValue).toBeUndefined();
    }
    expect(firstInput.parcels.parcels[0].landValuePpu).toBeUndefined();
  });

  it('applies the explicit formula and can expose a nominal quote through HistoricalEconomy', () => {
    const input = makeCity('CM-1910-land-formula');
    const result = generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, calibration, syntheticEconomy);
    const value = result.parcels[0];
    const parcel = input.parcels.parcels.find(({ id }) => id === value.parcelId)!;
    const multiplier = calibration.minimumMultiplier +
      (calibration.maximumMultiplier - calibration.minimumMultiplier) * value.relativeScore / 100;
    expect(value.landValuePpu).toBeCloseTo(parcel.area * calibration.baseLandValuePpuPerTile * multiplier);
    expect(value.nominalValue?.currency).toBe('reis');
    expect(syntheticEconomy.toPpu(value.nominalValue!.amount, value.nominalValue!.currency, value.nominalValue!.date)).toBeCloseTo(value.landValuePpu);
  });

  it('returns available and deferred overlays with reasons and units', () => {
    const input = makeCity('CM-1910-land-overlays');
    const result = generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, calibration);
    const overlays = result.parcels[0].overlays;
    for (const id of ['price', 'population', 'transport', 'railway', 'commerce', 'industry', 'topography'] as const) {
      expect(overlays[id].status).toBe('available');
      expect(Number.isFinite(overlays[id].value)).toBe(true);
      expect(overlays[id].unit.length).toBeGreaterThan(0);
    }
    for (const id of ['income', 'clubs', 'appreciation'] as const) {
      expect(overlays[id].status).toBe('deferred');
      expect(overlays[id].value).toBeNull();
      expect(overlays[id].reason?.length).toBeGreaterThan(0);
    }
  });

  it('rejects an index gap when nominal conversion is requested', () => {
    const input = makeCity('CM-1910-land-missing-index');
    const laterCity = createCityState(input.city.worldSeed, { year: 1910, month: 2, day: 1 });
    expect(() => generateCityLandValue1910(laterCity, input.parcels, input.districts, input.foundation, calibration, syntheticEconomy)).toThrow(RangeError);
  });

  it('rejects missing references, non-finite prices, and weights that do not sum to one', () => {
    const input = makeCity('CM-1910-land-invalid-calibration');
    expect(() => generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, {
      ...calibration,
      references: [],
    })).toThrow(TypeError);
    expect(() => generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, {
      ...calibration,
      baseLandValuePpuPerTile: Number.NaN,
    })).toThrow(RangeError);
    expect(() => generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, {
      ...calibration,
      weights: { ...calibration.weights, centrality: 0.2 },
    })).toThrow(RangeError);
  });

  it('rejects non-1910 city inputs', () => {
    const input = makeCity('CM-1910-land-wrong-year');
    const laterCity = createCityState(input.city.worldSeed, { year: 1911, month: 1, day: 1 });
    expect(() => generateCityLandValue1910(laterCity, input.parcels, input.districts, input.foundation, calibration)).toThrow(RangeError);
  });
});
