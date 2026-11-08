import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityFoundation1910 } from './cityFoundation';
import { generateCityDistricts1910 } from './cityDistricts';
import { generateCityTerrain } from './cityTerrain';

function generate(seed: string, width = 32, height = 32) {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, width, height);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  const districts = generateCityDistricts1910(city, terrain, foundation, rng);
  return { city, rng, terrain, foundation, districts };
}

describe('generateCityDistricts1910', () => {
  it('partitions every dry tile and leaves water unassigned', () => {
    const { terrain, districts } = generate('CM-1910-districts');
    const assigned = districts.districts.reduce((sum, district) => sum + district.landArea, 0);
    const dry = terrain.waterMask.flat().filter((isWater) => !isWater).length;
    expect(assigned).toBe(dry);
    expect(districts.totalLandArea).toBe(dry);
    for (let y = 0; y < terrain.height; y++) {
      for (let x = 0; x < terrain.width; x++) {
        const districtId = districts.districtByTile[y][x];
        if (terrain.waterMask[y][x]) expect(districtId).toBeNull();
        else expect(typeof districtId).toBe('string');
      }
    }
    expect(districts.districts.every((district) => district.landArea > 0)).toBe(true);
  });

  it('closes population, employment, and normalized shares with finite centrality', () => {
    const { districts } = generate('CM-1910-totals');
    expect(districts.totalPopulationUnits).toBe(districts.districts.reduce((sum, district) => sum + district.populationUnits, 0));
    expect(districts.totalEmploymentUnits).toBe(districts.districts.reduce((sum, district) => sum + district.employmentUnits, 0));
    expect(districts.districts.reduce((sum, district) => sum + district.populationShareBps, 0)).toBe(10_000);
    expect(districts.districts.reduce((sum, district) => sum + district.employmentShareBps, 0)).toBe(10_000);
    for (const district of districts.districts) {
      expect(Number.isFinite(district.centrality)).toBe(true);
      expect(district.centrality).toBeGreaterThanOrEqual(0);
      expect(district.centrality).toBeLessThanOrEqual(100);
      expect(district.populationUnits).toBeGreaterThan(0);
      expect(district.employmentUnits).toBeGreaterThan(0);
    }
  });

  it('repeats from the same seed and consumes only the population stream', () => {
    const first = generate('CM-1910-repeatable');
    const second = generate('CM-1910-repeatable');
    expect(first.districts).toEqual(second.districts);
    expect(first.rng.snapshot()).toEqual(second.rng.snapshot());
    const seed = 'CM-1910-stream-baseline';
    const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
    const rng = new CampaignRng(seed);
    const terrain = generateCityTerrain(city, rng, 32, 32);
    const foundation = generateCityFoundation1910(city, terrain, rng);
    const initial = rng.snapshot();
    generateCityDistricts1910(city, terrain, foundation, rng);
    const final = rng.snapshot();
    expect(final.streams.population).not.toBe(initial.streams.population);
    for (const domain of ['city', 'club', 'football', 'politics', 'federation', 'events', 'media'] as const) {
      expect(final.streams[domain]).toBe(initial.streams[domain]);
    }
  });

  it('rejects a different seed and non-1910 city', () => {
    const { city, terrain, foundation, rng } = generate('CM-1910-validation');
    expect(() => generateCityDistricts1910(city, terrain, foundation, new CampaignRng('other-seed'))).toThrow(TypeError);
    const laterCity = createCityState(city.worldSeed, { year: 1911, month: 1, day: 1 });
    expect(() => generateCityDistricts1910(laterCity, terrain, foundation, rng)).toThrow(RangeError);
  });

  it('keeps a stable partition across varied generated cities', () => {
    for (let seed = 0; seed < 12; seed++) {
      const result = generate(`CM-1910-b4-${seed}`);
      expect(result.districts.totalLandArea).toBe(result.terrain.waterMask.flat().filter((isWater) => !isWater).length);
      expect(result.districts.districts).toHaveLength(9);
    }
  });
});
