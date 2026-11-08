import { CampaignRng } from '../CampaignRng';
import { Terrain, SEA_LEVEL, projectTileHeightsToVertexHeights } from '../Terrain';
import type { CityFoundation1910 } from './cityFoundation';
import { generateCityFoundation1910 } from './cityFoundation';
import { createCityState } from './CityState';
import { generateCityTerrain } from './cityTerrain';
import { generateCityDistricts1910, type CityDistricts1910 } from './cityDistricts';
import { generateCityParcels1910, type CityParcels1910 } from './cityParcels';

export interface CityCampaignData1910 {
  readonly foundation: CityFoundation1910;
  readonly districts: CityDistricts1910;
  readonly parcels: CityParcels1910;
}

export interface CampaignCity1910 {
  readonly terrain: Terrain;
  readonly data: CityCampaignData1910;
}

/** Build the deterministic 1910 city foundation using the campaign's city RNG stream. */
export function generateCampaignCity1910(
  rng: CampaignRng,
  width: number,
  height: number,
): CampaignCity1910 {
  const city = createCityState(rng.worldSeed, { year: 1910, month: 1, day: 1 });
  const cityTerrain = generateCityTerrain(city, rng, width, height);
  const vertexHeights = projectTileHeightsToVertexHeights(cityTerrain.elevations.map((row) => [...row]));
  const terrain = new Terrain(width, height);
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) terrain.unsafeSetVertexHeight(x, y, vertexHeights[y][x]);
  }

  // CityFoundation's water mask must match the vertex-based rule used by World.isWater.
  // The tile-height generator can produce a shoreline cell whose shared vertex touches water.
  const foundationElevations = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const elevation = terrain.getTileMinCornerHeight(x, y);
      return elevation <= SEA_LEVEL ? SEA_LEVEL : elevation;
    }),
  );
  const foundationWaterMask = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => terrain.getTileMinCornerHeight(x, y) <= SEA_LEVEL),
  );
  const foundationTerrain = Object.freeze({
    width,
    height,
    elevations: Object.freeze(foundationElevations.map((row) => Object.freeze(row))),
    waterMask: Object.freeze(foundationWaterMask.map((row) => Object.freeze(row))),
  });
  const foundation = generateCityFoundation1910(city, foundationTerrain, rng);
  const districts = generateCityDistricts1910(city, foundationTerrain, foundation, rng);
  const parcels = generateCityParcels1910(city, foundationTerrain, districts, foundation);
  return Object.freeze({
    terrain,
    data: Object.freeze({ foundation, districts, parcels }),
  });
}
