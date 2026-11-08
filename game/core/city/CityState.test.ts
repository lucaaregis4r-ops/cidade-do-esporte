import { describe, expect, it } from 'vitest';
import { createCityState } from './CityState';
import { CITY_ERA_PROFILES, getCityEraProfile } from './cityEras';

describe('city era profiles', () => {
  it('cover the complete campaign without gaps or overlaps', () => {
    expect(CITY_ERA_PROFILES[0].startYear).toBe(1910);
    expect(CITY_ERA_PROFILES.at(-1)?.endYear).toBe(1959);
    expect(CITY_ERA_PROFILES[0].endYear + 1).toBe(CITY_ERA_PROFILES[1].startYear);
  });

  it('keeps railway influence stronger through 1930 and reduces it afterward', () => {
    expect(getCityEraProfile(1910).railwayInfluence).toBe('high');
    expect(getCityEraProfile(1930).railwayInfluence).toBe('high');
    expect(getCityEraProfile(1931).railwayInfluence).toBe('moderate');
    expect(getCityEraProfile(1959).railwayInfluence).toBe('moderate');
  });

  it('rejects years outside the campaign and non-integer years', () => {
    expect(() => getCityEraProfile(1909)).toThrow(RangeError);
    expect(() => getCityEraProfile(1960)).toThrow(RangeError);
    expect(() => getCityEraProfile(1910.5)).toThrow(RangeError);
  });
});

describe('createCityState', () => {
  it('creates an immutable state with a defensive copy of its date', () => {
    const date = { year: 1931, month: 4, day: 8 };
    const state = createCityState('CM-1910-example', date);
    date.day = 9;

    expect(state).toEqual({
      worldSeed: 'CM-1910-example',
      asOf: { year: 1931, month: 4, day: 8 },
      eraId: 'road-expansion',
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.asOf)).toBe(true);
  });

  it('assigns the railway-centered era to the beginning of the campaign', () => {
    expect(createCityState('seed', { year: 1910, month: 1, day: 1 }).eraId).toBe(
      'railway-centered',
    );
  });

  it('rejects an empty seed', () => {
    expect(() => createCityState('  ', { year: 1910, month: 1, day: 1 })).toThrow(TypeError);
  });

  it.each([
    { year: 1909, month: 12, day: 31 },
    { year: 1960, month: 1, day: 1 },
    { year: 1910, month: 0, day: 1 },
    { year: 1910, month: 13, day: 1 },
    { year: 1910, month: 2, day: 29 },
    { year: 1912, month: 2, day: 30 },
  ])('rejects invalid campaign date $year-$month-$day', (date) => {
    expect(() => createCityState('seed', date)).toThrow(RangeError);
  });

  it('accepts leap day in a leap year', () => {
    expect(createCityState('seed', { year: 1912, month: 2, day: 29 }).asOf).toEqual({
      year: 1912,
      month: 2,
      day: 29,
    });
  });
});
