import { daysInMonth, type GameDate } from '../HistoricalClock';
import { getCityEraProfile, type CityEraId } from './cityEras';

/** Minimal campaign identity and date contract for the city domain. */
export interface CityState {
  readonly worldSeed: string;
  readonly asOf: Readonly<GameDate>;
  readonly eraId: CityEraId;
}

export function createCityState(worldSeed: string, asOf: GameDate): CityState {
  if (typeof worldSeed !== 'string' || worldSeed.trim().length === 0) {
    throw new TypeError('worldSeed must be a non-empty string');
  }

  if (
    asOf === null ||
    typeof asOf !== 'object' ||
    !Number.isInteger(asOf.year) ||
    asOf.year < 1910 ||
    asOf.year > 1959 ||
    !Number.isInteger(asOf.month) ||
    asOf.month < 1 ||
    asOf.month > 12 ||
    !Number.isInteger(asOf.day) ||
    asOf.day < 1
  ) {
    throw new RangeError('City date must be a valid campaign date from 1910 through 1959');
  }

  if (asOf.day > daysInMonth(asOf.year, asOf.month)) {
    throw new RangeError('City date must be a valid campaign date from 1910 through 1959');
  }

  const era = getCityEraProfile(asOf.year);
  return Object.freeze({
    worldSeed,
    asOf: Object.freeze({ ...asOf }),
    eraId: era.id,
  });
}
