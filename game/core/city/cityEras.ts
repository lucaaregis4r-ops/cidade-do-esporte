/** Era-level city parameters derived from the product plan, not calibrated history. */

export const CITY_ERA_PROFILES = [
  {
    id: 'railway-centered',
    startYear: 1910,
    endYear: 1930,
    railwayInfluence: 'high',
  },
  {
    id: 'road-expansion',
    startYear: 1931,
    endYear: 1959,
    railwayInfluence: 'moderate',
  },
] as const;

export type CityEraProfile = (typeof CITY_ERA_PROFILES)[number];
export type CityEraId = CityEraProfile['id'];

export function getCityEraProfile(year: number): CityEraProfile {
  if (!Number.isInteger(year)) {
    throw new RangeError(`City era year must be an integer: ${year}`);
  }

  const profile = CITY_ERA_PROFILES.find(
    (candidate) => year >= candidate.startYear && year <= candidate.endYear,
  );

  if (!profile) {
    throw new RangeError(`City era year must be between 1910 and 1959: ${year}`);
  }

  return profile;
}
