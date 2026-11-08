import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityDistricts1910 } from './cityDistricts';
import { generateCityFoundation1910 } from './cityFoundation';
import { generateCityLandValue1910, type LandValueCalibration } from './cityLandValue';
import { generateCityParcels1910 } from './cityParcels';
import { generateCityTerrain } from './cityTerrain';
import {
  advanceCityGrowthYear,
  createCityGrowthState,
  type CityGrowthCalibration,
} from './cityGrowth';

function makeCity(seed: string) {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, 32, 32);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  const districts = generateCityDistricts1910(city, terrain, foundation, rng);
  const parcels = generateCityParcels1910(city, terrain, districts, foundation);
  return { city, foundation, districts, parcels };
}

const landCalibration: LandValueCalibration = {
  id: 'synthetic-land-calibration',
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
  references: [{ id: 'synthetic-land', source: 'Synthetic test fixture', notes: 'Tests only; not historical evidence.' }],
  notes: 'Synthetic fixture only.',
};

const growthCalibration: CityGrowthCalibration = {
  id: 'synthetic-growth-calibration',
  weights: {
    accessibility: 0.3,
    availableJobs: 0.2,
    nearbyPopulation: 0.2,
    infrastructure: 0.2,
    commercialActivity: 0.1,
    landDemand: 0.2,
    landCost: 0.1,
    terrainDifficulty: 0.1,
    congestion: 0.1,
  },
  railwayInfluence: { 'railway-centered': 0.8, 'road-expansion': 0.3 },
  minimumPressure: -100,
  maximumDevelopmentsPerYear: 4,
  populationUnitsPerDevelopment: 2,
  jobUnitsPerDevelopment: 1,
  references: [{ id: 'synthetic-growth', source: 'Synthetic test fixture', notes: 'Tests the injected growth model only; not historical evidence.' }],
  notes: 'Synthetic fixture only; production weights and rates require approved research.',
};

describe('CityGrowthDirector', () => {
  it('grows autonomously with stable annual decisions and connected road extensions', () => {
    const first = makeCity('CM-1910-growth-deterministic');
    const second = makeCity('CM-1910-growth-deterministic');
    const firstValue = generateCityLandValue1910(first.city, first.parcels, first.districts, first.foundation, landCalibration);
    const secondValue = generateCityLandValue1910(second.city, second.parcels, second.districts, second.foundation, landCalibration);
    const firstInitial = createCityGrowthState(first.city);
    const secondInitial = createCityGrowthState(second.city);
    const firstResult = advanceCityGrowthYear(
      createCityState(first.city.worldSeed, { year: 1911, month: 1, day: 1 }), firstInitial,
      first.parcels, first.districts, first.foundation, firstValue, growthCalibration,
    );
    const secondResult = advanceCityGrowthYear(
      createCityState(second.city.worldSeed, { year: 1911, month: 1, day: 1 }), secondInitial,
      second.parcels, second.districts, second.foundation, secondValue, growthCalibration,
    );

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.decisions).toHaveLength(4);
    expect(firstResult.state.throughYear).toBe(1911);
    expect(firstResult.state.developedParcelIds).toHaveLength(4);
    expect(firstResult.state.populationUnitsAdded).toBe(8);
    expect(firstResult.state.jobUnitsAdded).toBe(4);
    expect(firstResult.state.roadExtensions.length).toBeGreaterThan(0);
    const knownRoadCells = new Set(first.foundation.roads.flatMap(({ path }) => path.map(({ x, y }) => `${x},${y}`)));
    for (const extension of firstResult.state.roadExtensions) {
      expect(extension.path.length).toBeGreaterThan(1);
      expect(knownRoadCells.has(`${extension.path[0].x},${extension.path[0].y}`)).toBe(true);
      expect(first.parcels.parcelByTile[extension.path.at(-1)!.y][extension.path.at(-1)!.x]).toBe(extension.parcelId);
      for (let index = 1; index < extension.path.length; index++) {
        const previous = extension.path[index - 1];
        const current = extension.path[index];
        expect(Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y)).toBe(1);
        expect(first.parcels.parcelByTile[current.y][current.x]).not.toBeNull();
      }
      extension.path.forEach(({ x, y }) => knownRoadCells.add(`${x},${y}`));
    }
    expect(firstInitial.developments).toHaveLength(0);
  });

  it('does not develop the same parcel twice and advances only one year per call', () => {
    const input = makeCity('CM-1910-growth-yearly');
    const landValue = generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, landCalibration);
    const first = advanceCityGrowthYear(
      createCityState(input.city.worldSeed, { year: 1911, month: 1, day: 1 }), createCityGrowthState(input.city),
      input.parcels, input.districts, input.foundation, landValue, growthCalibration,
    );
    const second = advanceCityGrowthYear(
      createCityState(input.city.worldSeed, { year: 1912, month: 1, day: 1 }), first.state,
      input.parcels, input.districts, input.foundation, landValue, growthCalibration,
    );
    expect(second.decisions.some(({ parcelId }) => first.state.developedParcelIds.includes(parcelId))).toBe(false);
    expect(second.state.developments).toHaveLength(first.state.developments.length + second.decisions.length);
    expect(() => advanceCityGrowthYear(
      createCityState(input.city.worldSeed, { year: 1914, month: 1, day: 1 }), second.state,
      input.parcels, input.districts, input.foundation, landValue, growthCalibration,
    )).toThrow(RangeError);
  });

  it('requires explicit, cited assumptions and rejects dates beyond the campaign', () => {
    const input = makeCity('CM-1910-growth-validation');
    const landValue = generateCityLandValue1910(input.city, input.parcels, input.districts, input.foundation, landCalibration);
    const state = createCityGrowthState(input.city);
    expect(() => advanceCityGrowthYear(
      createCityState(input.city.worldSeed, { year: 1911, month: 1, day: 1 }), state,
      input.parcels, input.districts, input.foundation, landValue,
      { ...growthCalibration, references: [] },
    )).toThrow(TypeError);
    expect(() => advanceCityGrowthYear(
      createCityState(input.city.worldSeed, { year: 1960, month: 1, day: 1 }), state,
      input.parcels, input.districts, input.foundation, landValue, growthCalibration,
    )).toThrow(RangeError);
  });
});
