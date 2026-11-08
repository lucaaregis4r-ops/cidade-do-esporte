import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { MAX_ELEVATION, MIN_LAND_ELEVATION, SEA_LEVEL } from '../Terrain';
import { createCityState } from './CityState';
import { generateCityTerrain } from './cityTerrain';

describe('generateCityTerrain', () => {
  const city = createCityState('CM-1910-city-terrain', { year: 1910, month: 1, day: 1 });

  it('produces the same terrain and RNG snapshot for the same seed', () => {
    const firstRng = new CampaignRng(city.worldSeed);
    const secondRng = new CampaignRng(city.worldSeed);

    const first = generateCityTerrain(city, firstRng, 32, 24);
    const second = generateCityTerrain(city, secondRng, 32, 24);

    expect(first).toEqual(second);
    expect(firstRng.snapshot()).toEqual(secondRng.snapshot());
  });

  it('consumes only the campaign city stream', () => {
    const rng = new CampaignRng(city.worldSeed);
    const initial = rng.snapshot();
    generateCityTerrain(city, rng, 16, 16);
    const final = rng.snapshot();

    expect(final.streams.city).not.toBe(initial.streams.city);
    for (const domain of ['population', 'club', 'football', 'politics', 'federation', 'events', 'media'] as const) {
      expect(final.streams[domain]).toBe(initial.streams[domain]);
    }
  });

  it('rejects a campaign RNG from another seed without consuming it', () => {
    const rng = new CampaignRng('different-seed');
    const before = rng.snapshot();

    expect(() => generateCityTerrain(city, rng, 16, 16)).toThrow(TypeError);
    expect(rng.snapshot()).toEqual(before);
  });

  it('validates dimensions before consuming the city stream', () => {
    const rng = new CampaignRng(city.worldSeed);
    const before = rng.snapshot();

    expect(() => generateCityTerrain(city, rng, 0, 16)).toThrow(RangeError);
    expect(rng.snapshot()).toEqual(before);
  });

  it('returns matching dimensions, finite elevations and water-level invariants', () => {
    const terrain = generateCityTerrain(city, new CampaignRng(city.worldSeed), 20, 12);

    expect(terrain.width).toBe(20);
    expect(terrain.height).toBe(12);
    expect(terrain.elevations).toHaveLength(12);
    expect(terrain.waterMask).toHaveLength(12);
    for (let y = 0; y < terrain.height; y++) {
      expect(terrain.elevations[y]).toHaveLength(terrain.width);
      expect(terrain.waterMask[y]).toHaveLength(terrain.width);
      for (let x = 0; x < terrain.width; x++) {
        const elevation = terrain.elevations[y][x];
        expect(Number.isFinite(elevation)).toBe(true);
        expect(Number.isInteger(elevation)).toBe(true);
        expect(elevation).toBeGreaterThanOrEqual(0);
        expect(elevation).toBeLessThanOrEqual(MAX_ELEVATION);
        if (terrain.waterMask[y][x]) {
          expect(elevation).toBe(SEA_LEVEL);
        } else {
          expect(elevation).toBeGreaterThanOrEqual(MIN_LAND_ELEVATION);
          expect(elevation).toBeGreaterThan(SEA_LEVEL);
        }
      }
    }
  });

  it('returns deeply immutable terrain grids', () => {
    const terrain = generateCityTerrain(city, new CampaignRng(city.worldSeed), 8, 8);

    expect(Object.isFrozen(terrain)).toBe(true);
    expect(Object.isFrozen(terrain.elevations)).toBe(true);
    expect(Object.isFrozen(terrain.elevations[0])).toBe(true);
    expect(Object.isFrozen(terrain.waterMask)).toBe(true);
    expect(Object.isFrozen(terrain.waterMask[0])).toBe(true);
  });
});
