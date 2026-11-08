import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityDistricts1910 } from './cityDistricts';
import { generateCityFoundation1910 } from './cityFoundation';
import { generateCityLandValue1910, type LandValueCalibration } from './cityLandValue';
import { generateCityParcels1910 } from './cityParcels';
import { generateCityTerrain } from './cityTerrain';
import { advanceCityGrowthYear, createCityGrowthState, type CityGrowthCalibration } from './cityGrowth';
import {
  advanceCityTransformationYear,
  createCityTransformationState,
  type CityTransformationCalibration,
} from './cityTransformation';

const landCalibration: LandValueCalibration = {
  id: 'test-land', baseLandValuePpuPerTile: 10, minimumMultiplier: 0.5, maximumMultiplier: 2,
  weights: { centrality: 0.15, accessibility: 0.15, railAccess: 0.15, roadAccess: 0.15, commerceAccess: 0.1, industryAccess: 0.1, terrainQuality: 0.1, neighborhoodPopulation: 0.1 },
  references: [{ id: 'fixture', source: 'Test fixture', notes: 'Synthetic values for unit tests only.' }], notes: 'Test-only calibration.',
};
const growthCalibration: CityGrowthCalibration = {
  id: 'test-growth', weights: { accessibility: 0.3, availableJobs: 0.2, nearbyPopulation: 0.2, infrastructure: 0.2, commercialActivity: 0.1, landDemand: 0.2, landCost: 0.1, terrainDifficulty: 0.1, congestion: 0.1 },
  railwayInfluence: { 'railway-centered': 0.8, 'road-expansion': 0.3 }, minimumPressure: -100, maximumDevelopmentsPerYear: 4,
  populationUnitsPerDevelopment: 2, jobUnitsPerDevelopment: 1,
  references: [{ id: 'fixture', source: 'Test fixture', notes: 'Synthetic values for unit tests only.' }], notes: 'Test-only calibration.',
};
const transformationCalibration: CityTransformationCalibration = {
  id: 'test-transformation', annualConditionLoss: 100, demolitionConditionThreshold: 0,
  redevelopmentAttractivenessThreshold: 0, densityIncreasePerRedevelopment: 2, maximumDensityUnits: 5,
  centralityThreshold: 0, avenueActivityThreshold: 0,
  references: [{ id: 'fixture', source: 'Test fixture', notes: 'Synthetic values for unit tests only.' }], notes: 'Test-only calibration.',
};

function makeWorld(seed: string) {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, 32, 32);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  const districts = generateCityDistricts1910(city, terrain, foundation, rng);
  const parcels = generateCityParcels1910(city, terrain, districts, foundation);
  const landValue = generateCityLandValue1910(city, parcels, districts, foundation, landCalibration);
  return { city, foundation, districts, parcels, landValue, growthState: createCityGrowthState(city), transformationState: createCityTransformationState(city) };
}

function growYear(world: ReturnType<typeof makeWorld>, year: number) {
  const city = createCityState(world.city.worldSeed, { year, month: 1, day: 1 });
  return advanceCityGrowthYear(city, world.growthState, world.parcels, world.districts, world.foundation, world.landValue, growthCalibration);
}

describe('City transformation history', () => {
  it('ages, demolishes, replaces and densifies without erasing building history', () => {
    const world = makeWorld('CM-1910-transformation-history');
    const firstCity = createCityState(world.city.worldSeed, { year: 1911, month: 1, day: 1 });
    const firstGrowth = growYear(world, 1911);
    const first = advanceCityTransformationYear(firstCity, world.transformationState, firstGrowth, world.parcels, world.foundation, transformationCalibration);
    const secondCity = createCityState(world.city.worldSeed, { year: 1912, month: 1, day: 1 });
    const secondGrowth = advanceCityGrowthYear(secondCity, firstGrowth.state, world.parcels, world.districts, world.foundation, world.landValue, growthCalibration);
    const second = advanceCityTransformationYear(secondCity, first.state, secondGrowth, world.parcels, world.foundation, transformationCalibration);

    expect(second.demolitions.length).toBeGreaterThan(0);
    expect(second.replacements.length).toBeGreaterThan(0);
    for (const id of second.demolitions) expect(second.state.buildings.find((building) => building.id === id)?.status).toBe('replaced');
    for (const id of second.replacements) {
      const replacement = second.state.buildings.find((building) => building.id === id)!;
      expect(replacement.densityUnits).toBe(3);
      expect(second.state.buildings.find((building) => building.id === replacement.predecessorId)?.replacementId).toBe(id);
    }
  });

  it('records emergent centralities and avenue upgrades as durable dated histories', () => {
    const world = makeWorld('CM-1910-transformation-centers');
    const city = createCityState(world.city.worldSeed, { year: 1911, month: 1, day: 1 });
    const baseGrowth = growYear(world, 1911);
    const commercialDistrict = world.districts.districts.find(({ kind }) => kind === 'commercial-cluster')!;
    const commercialParcel = world.parcels.parcels.find(({ districtId }) => districtId === commercialDistrict.id)!;
    const growth = {
      ...baseGrowth,
      decisions: Object.freeze([Object.freeze({
        id: 'fixture-commercial-development', parcelId: commercialParcel.id, districtId: commercialDistrict.id,
        kind: 'commercial' as const, year: 1911, pressure: 100, populationUnitsAdded: 0, jobUnitsAdded: 1,
      })]),
    };
    const result = advanceCityTransformationYear(city, world.transformationState, growth, world.parcels, world.foundation, transformationCalibration);
    expect(result.newCentralities.length).toBeGreaterThan(0);
    expect(result.newAvenues.length).toBeGreaterThan(0);
    expect(result.state.centralities.every((center) => center.establishedYear === 1911 && center.lastActiveYear === 1911)).toBe(true);
    expect(result.state.avenueUpgrades.every((avenue) => avenue.upgradedYear === 1911 && avenue.path.length > 0)).toBe(true);
  });

  it('requires explicit calibration hypotheses and advances only one matching year', () => {
    const world = makeWorld('CM-1910-transformation-validation');
    const city = createCityState(world.city.worldSeed, { year: 1911, month: 1, day: 1 });
    const growth = growYear(world, 1911);
    expect(() => advanceCityTransformationYear(city, world.transformationState, growth, world.parcels, world.foundation, { ...transformationCalibration, references: [] })).toThrow(/requires an ID, notes/);
    expect(() => advanceCityTransformationYear(createCityState(world.city.worldSeed, { year: 1912, month: 1, day: 1 }), world.transformationState, growth, world.parcels, world.foundation, transformationCalibration)).toThrow(/advances once per January/);
  });
});
