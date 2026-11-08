import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityDistricts1910 } from './cityDistricts';
import { generateCityFoundation1910 } from './cityFoundation';
import { generateCityLandValue1910, type LandValueCalibration } from './cityLandValue';
import { generateCityParcels1910 } from './cityParcels';
import { generateCityTerrain } from './cityTerrain';
import { createCityGrowthState } from './cityGrowth';
import { createCityTransformationState } from './cityTransformation';
import { createCitySnapshot, serializeCitySnapshots } from './citySnapshots';

const landCalibration: LandValueCalibration = {
  id: 'snapshot-test-land', baseLandValuePpuPerTile: 10, minimumMultiplier: 0.5, maximumMultiplier: 2,
  weights: { centrality: 0.15, accessibility: 0.15, railAccess: 0.15, roadAccess: 0.15, commerceAccess: 0.1, industryAccess: 0.1, terrainQuality: 0.1, neighborhoodPopulation: 0.1 },
  references: [{ id: 'fixture', source: 'Snapshot test fixture', notes: 'Synthetic test values only.' }],
  notes: 'Synthetic test calibration only.',
};

function makeSnapshot(seed = 'CM-1910-snapshots') {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, 24, 24);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  const districts = generateCityDistricts1910(city, terrain, foundation, rng);
  const parcels = generateCityParcels1910(city, terrain, districts, foundation);
  const landValue = generateCityLandValue1910(city, parcels, districts, foundation, landCalibration);
  const growth = createCityGrowthState(city);
  const transformation = createCityTransformationState(city);
  return {
    snapshot: createCitySnapshot(city, terrain, foundation, districts, parcels, landValue, growth, transformation),
    terrain, foundation, districts, parcels, landValue, growth, transformation,
  };
}

describe('city review snapshots', () => {
  it('captures a stable 1910 map with parcels, infrastructure, and explicitly baseline-only PPU', () => {
    const { snapshot } = makeSnapshot();
    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.year).toBe(1910);
    expect(snapshot.width).toBe(24);
    expect(snapshot.elevations).toHaveLength(24);
    expect(Object.isFrozen(snapshot.elevations)).toBe(true);
    expect(Object.isFrozen(snapshot.elevations[0])).toBe(true);
    expect(snapshot.center.establishedYear).toBe(1910);
    expect(snapshot.institutions).toHaveLength(5);
    expect(snapshot.institutions.every(({ establishedYear }) => establishedYear === 1910)).toBe(true);
    expect(snapshot.waterMask).toHaveLength(24);
    expect(snapshot.parcels.length).toBeGreaterThan(0);
    expect(snapshot.roads.length).toBeGreaterThan(0);
    expect(snapshot.railwayPath.length).toBeGreaterThan(0);
    expect(snapshot.metrics.landValuePpu).toBeGreaterThan(0);
    expect(snapshot.parcels.every((parcel) => parcel.baselineLandValuePpu !== null)).toBe(true);
    expect(JSON.stringify(snapshot)).toBe(JSON.stringify(makeSnapshot().snapshot));
  });

  it('serializes sorted snapshots deterministically and rejects mixed seeds or duplicate dates', () => {
    const { snapshot } = makeSnapshot();
    const serialized = serializeCitySnapshots([snapshot]);
    expect(serialized).toBe(serializeCitySnapshots([snapshot]));
    expect(JSON.parse(serialized)).toMatchObject({ format: 'cidade-de-minas-city-snapshots', version: 2 });
    expect(() => serializeCitySnapshots([snapshot, { ...snapshot, worldSeed: 'other' }])).toThrow(/one worldSeed/);
    expect(() => serializeCitySnapshots([snapshot, snapshot])).toThrow(/unique years/);
  });

  it('does not project baseline land values into later snapshot years', () => {
    const fixture = makeSnapshot();
    const laterCity = createCityState(fixture.snapshot.worldSeed, { year: 1920, month: 1, day: 1 });
    const later = createCitySnapshot(
      laterCity, fixture.terrain, fixture.foundation, fixture.districts, fixture.parcels, fixture.landValue,
      { ...fixture.growth, throughYear: 1920 }, { ...fixture.transformation, throughYear: 1920 },
    );
    expect(later.metrics.landValuePpu).toBeNull();
    expect(later.parcels.every((parcel) => parcel.baselineLandValuePpu === null)).toBe(true);
  });
});
