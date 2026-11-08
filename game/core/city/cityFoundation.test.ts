import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityTerrain } from './cityTerrain';
import { generateCityFoundation1910 } from './cityFoundation';

function makeFoundation(seed: string, width = 32, height = 32) {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, width, height);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  return { city, rng, terrain, foundation };
}

function expectDryPath(path: readonly { x: number; y: number }[], waterMask: readonly (readonly boolean[])[]) {
  expect(path.length).toBeGreaterThan(0);
  for (let index = 0; index < path.length; index++) {
    const point = path[index];
    expect(waterMask[point.y][point.x]).toBe(false);
    if (index > 0) {
      const previous = path[index - 1];
      expect(Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y)).toBe(1);
    }
  }
}

describe('generateCityFoundation1910', () => {
  it('produces a deterministic compact foundation from the same seed and starting snapshot', () => {
    const first = makeFoundation('CM-1910-foundation');
    const second = makeFoundation('CM-1910-foundation');

    expect(first.foundation).toEqual(second.foundation);
    expect(first.rng.snapshot()).toEqual(second.rng.snapshot());
    expect(first.foundation.year).toBe(1910);
    expect(first.foundation.institutions.map(({ kind }) => kind)).toEqual([
      'railway-station',
      'public-square',
      'commercial-cluster',
      'railway-workshops',
      'small-industry',
    ]);
  });

  it('keeps every road and railway route on dry, in-bounds terrain', () => {
    const { terrain, foundation } = makeFoundation('CM-1910-routes', 40, 36);
    for (const road of foundation.roads) expectDryPath(road.path, terrain.waterMask);
    expectDryPath(foundation.railway.path, terrain.waterMask);
    expect(foundation.railway.path).toContainEqual(foundation.railway.station);
    if (foundation.railway.axis === 'east-west') {
      expect(foundation.railway.path[0].x).toBe(0);
      expect(foundation.railway.path.at(-1)?.x).toBe(terrain.width - 1);
    } else {
      expect(foundation.railway.path[0].y).toBe(0);
      expect(foundation.railway.path.at(-1)?.y).toBe(terrain.height - 1);
    }
    expect(foundation.roads[0].path[0]).toEqual(foundation.railway.station);
    expect(foundation.roads[0].path.at(-1)).toEqual(foundation.center.coordinate);
    for (const institution of foundation.institutions) {
      expect(institution.coordinate.x).toBeGreaterThanOrEqual(0);
      expect(institution.coordinate.x).toBeLessThan(terrain.width);
      expect(institution.coordinate.y).toBeGreaterThanOrEqual(0);
      expect(institution.coordinate.y).toBeLessThan(terrain.height);
      expect(terrain.waterMask[institution.coordinate.y][institution.coordinate.x]).toBe(false);
    }
  });

  it('preserves the city-stream boundary and deeply freezes the generated records', () => {
    const { foundation, rng } = makeFoundation('CM-1910-isolated-stream');
    const initial = new CampaignRng('CM-1910-isolated-stream').snapshot();
    const final = rng.snapshot();
    expect(final.streams.city).not.toBe(initial.streams.city);
    for (const domain of ['population', 'club', 'football', 'politics', 'federation', 'events', 'media'] as const) {
      expect(final.streams[domain]).toBe(initial.streams[domain]);
    }
    expect(Object.isFrozen(foundation)).toBe(true);
    expect(Object.isFrozen(foundation.roads)).toBe(true);
    expect(Object.isFrozen(foundation.roads[0].path[0])).toBe(true);
    expect(Object.isFrozen(foundation.institutions[0])).toBe(true);
  });

  it('rejects other campaign years, a mismatched seed and undersized maps', () => {
    const { city, terrain, rng } = makeFoundation('CM-1910-validation');
    const otherYear = createCityState(city.worldSeed, { year: 1911, month: 1, day: 1 });
    expect(() => generateCityFoundation1910(otherYear, terrain, rng)).toThrow(RangeError);
    expect(() => generateCityFoundation1910(city, terrain, new CampaignRng('other-seed'))).toThrow(TypeError);
    expect(() => makeFoundation('CM-1910-small-map', 8, 8)).toThrow(RangeError);
  });

  it('finds a compact center and rail corridor across a range of fictional seeds', () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = makeFoundation(`CM-1910-b3-${seed}`, 32, 32);
      expect(result.foundation.center.coordinate.x).toBeGreaterThan(0);
      expect(result.foundation.center.coordinate.x).toBeLessThan(31);
      expect(result.foundation.center.coordinate.y).toBeGreaterThan(0);
      expect(result.foundation.center.coordinate.y).toBeLessThan(31);
    }
  });
});
