import type { CampaignRng } from '../CampaignRng';
import { generateTerrain } from '../terrainGenerator';
import type { CityState } from './CityState';

export interface CityTerrain {
  readonly width: number;
  readonly height: number;
  readonly elevations: readonly (readonly number[])[];
  readonly waterMask: readonly (readonly boolean[])[];
}

/** Generate city relief using only the campaign's named city RNG stream. */
export function generateCityTerrain(
  city: CityState,
  campaignRng: CampaignRng,
  width: number,
  height: number,
): CityTerrain {
  if (campaignRng.worldSeed !== city.worldSeed) {
    throw new TypeError('City state and campaign RNG must use the same worldSeed');
  }
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new RangeError(`City terrain width and height must be positive integers, got width=${width} height=${height}`);
  }

  const { elevations, waterMask } = generateTerrain(width, height, campaignRng.city.nextUint32());
  return Object.freeze({
    width,
    height,
    elevations: Object.freeze(elevations.map((row) => Object.freeze(row))),
    waterMask: Object.freeze(waterMask.map((row) => Object.freeze(row))),
  });
}
