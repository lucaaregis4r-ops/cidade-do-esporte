import type { TileCoord } from '../../types/coordinates';
import type { CityState } from './CityState';
import type { CityDistricts1910 } from './cityDistricts';
import type { CityFoundation1910, CityInstitution } from './cityFoundation';
import type { CityGrowthState } from './cityGrowth';
import type { CityLandValue1910 } from './cityLandValue';
import type { CityParcels1910 } from './cityParcels';
import type { CityTerrain } from './cityTerrain';
import type { CityTransformationState } from './cityTransformation';

export const CITY_SNAPSHOT_YEARS = Object.freeze([1910, 1920, 1930, 1940, 1950, 1959] as const);
export type CitySnapshotYear = (typeof CITY_SNAPSHOT_YEARS)[number];

export interface CitySnapshotRoad {
  readonly id: string;
  readonly kind: 'street' | 'avenue';
  readonly establishedYear: number;
  readonly path: readonly Readonly<TileCoord>[];
}

export interface CitySnapshotParcel {
  readonly id: string;
  readonly districtId: string;
  readonly anchor: Readonly<TileCoord>;
  readonly tiles: readonly Readonly<TileCoord>[];
  readonly centrality: number;
  readonly accessibility: number;
  /** Only measured by the injected 1910 baseline profile; not projected into later years. */
  readonly baselineLandValuePpu: number | null;
  readonly baselineRelativeScore: number | null;
}

export interface CitySnapshotBuilding {
  readonly id: string;
  readonly parcelId: string;
  readonly kind: 'residential' | 'commercial' | 'industrial' | 'services';
  readonly builtYear: number;
  readonly condition: number;
  readonly densityUnits: number;
  readonly status: 'active' | 'demolished' | 'replaced';
  readonly demolishedYear?: number;
  readonly predecessorId?: string;
  readonly replacementId?: string;
}

export interface CitySnapshot {
  readonly schemaVersion: 2;
  readonly worldSeed: string;
  readonly year: CitySnapshotYear;
  readonly width: number;
  readonly height: number;
  readonly elevations: readonly (readonly number[])[];
  readonly waterMask: readonly (readonly boolean[])[];
  readonly districtByTile: readonly (readonly (string | null)[])[];
  readonly parcelByTile: readonly (readonly (string | null)[])[];
  readonly districts: readonly { readonly id: string; readonly kind: string; readonly anchor: Readonly<TileCoord> }[];
  readonly center: Readonly<{ coordinate: Readonly<TileCoord>; establishedYear: number }>;
  readonly institutions: readonly CityInstitution[];
  readonly parcels: readonly CitySnapshotParcel[];
  readonly railwayPath: readonly Readonly<TileCoord>[];
  readonly roads: readonly CitySnapshotRoad[];
  readonly buildings: readonly CitySnapshotBuilding[];
  readonly centralities: CityTransformationState['centralities'];
  readonly metrics: Readonly<{
    populationUnits: number;
    employmentUnits: number;
    activeBuildings: number;
    developedParcels: number;
    averageCondition: number;
    centralities: number;
    avenues: number;
    landValuePpu: number | null;
  }>;
}

function freezeGrid<T>(grid: readonly (readonly T[])[]): readonly (readonly T[])[] {
  return Object.freeze(grid.map((row) => Object.freeze([...row])));
}

/** Captures one immutable, presentation-ready state without deriving historical facts. */
export function createCitySnapshot(
  city: CityState,
  terrain: CityTerrain,
  foundation: CityFoundation1910,
  districts: CityDistricts1910,
  parcels: CityParcels1910,
  landValue: CityLandValue1910,
  growth: CityGrowthState,
  transformation: CityTransformationState,
): CitySnapshot {
  const year = city.asOf.year as CitySnapshotYear;
  if (!CITY_SNAPSHOT_YEARS.includes(year)) throw new RangeError(`Unsupported city snapshot year: ${city.asOf.year}`);
  if (city.asOf.month !== 1 || city.asOf.day !== 1) throw new RangeError('City snapshots use January 1 states');
  if ([city.worldSeed, growth.worldSeed, transformation.worldSeed].some((seed) => seed !== city.worldSeed)) {
    throw new TypeError('City snapshot inputs must share one worldSeed');
  }
  if (terrain.width < 1 || terrain.height < 1 || terrain.waterMask.length !== terrain.height ||
      terrain.elevations.length !== terrain.height || terrain.waterMask.some((row) => row.length !== terrain.width) ||
      terrain.elevations.some((row) => row.length !== terrain.width)) {
    throw new RangeError('City snapshot terrain grids must match their declared dimensions');
  }
  if (foundation.year !== 1910 || districts.year !== 1910 || parcels.year !== 1910 || landValue.year !== 1910) {
    throw new RangeError('City snapshot requires the complete 1910 baseline');
  }
  if (districts.districtByTile.length !== terrain.height || parcels.parcelByTile.length !== terrain.height ||
      districts.districtByTile.some((row) => row.length !== terrain.width) || parcels.parcelByTile.some((row) => row.length !== terrain.width)) {
    throw new RangeError('District and parcel grids must match city terrain');
  }
  if (growth.throughYear !== year || transformation.throughYear !== year) {
    throw new RangeError(`Growth and transformation states must both be advanced through ${year}`);
  }
  if (growth.developments.some(({ year: builtYear }) => builtYear > year) ||
      transformation.buildings.some(({ builtYear, demolishedYear }) => builtYear > year || (demolishedYear !== undefined && demolishedYear > year))) {
    throw new RangeError('City snapshot cannot include future development history');
  }

  const valueByParcel = new Map(landValue.parcels.map(({ parcelId, landValuePpu, relativeScore }) => [parcelId, { landValuePpu, relativeScore }]));
  const roadsById = new Map<string, CitySnapshotRoad>();
  for (const road of foundation.roads) {
    roadsById.set(road.id, Object.freeze({ id: road.id, kind: 'street', establishedYear: road.establishedYear, path: road.path }));
  }
  const avenueById = new Map(transformation.avenueUpgrades.filter(({ upgradedYear }) => upgradedYear <= year).map((upgrade) => [upgrade.roadId, upgrade]));
  for (const extension of growth.roadExtensions.filter(({ year: builtYear }) => builtYear <= year)) {
    const upgrade = avenueById.get(extension.id);
    roadsById.set(extension.id, Object.freeze({ id: extension.id, kind: upgrade ? 'avenue' : 'street', establishedYear: extension.year, path: upgrade?.path ?? extension.path }));
  }
  for (const [id, road] of roadsById) {
    const upgrade = avenueById.get(id);
    if (upgrade) roadsById.set(id, Object.freeze({ ...road, kind: 'avenue', path: upgrade.path }));
  }

  const buildings = Object.freeze(transformation.buildings
    .filter(({ builtYear }) => builtYear <= year)
    .map((building) => Object.freeze({ ...building }))
    .sort((a, b) => a.parcelId.localeCompare(b.parcelId) || a.builtYear - b.builtYear || a.id.localeCompare(b.id)));
  const activeBuildings = buildings.filter(({ status }) => status === 'active');
  const centralities = Object.freeze(transformation.centralities.filter(({ establishedYear }) => establishedYear <= year)
    .map((center) => Object.freeze({ ...center }))
    .sort((a, b) => a.parcelId.localeCompare(b.parcelId)));
  const snapshotParcels = Object.freeze(parcels.parcels.map((parcel) => {
    const value = year === 1910 ? valueByParcel.get(parcel.id) : undefined;
    return Object.freeze({
      id: parcel.id,
      districtId: parcel.districtId,
      anchor: Object.freeze({ ...parcel.tiles[0] }),
      tiles: parcel.tiles,
      centrality: parcel.centrality,
      accessibility: parcel.accessibility,
      baselineLandValuePpu: value?.landValuePpu ?? null,
      baselineRelativeScore: value?.relativeScore ?? null,
    });
  }).sort((a, b) => a.id.localeCompare(b.id)));
  const allRoads = [...roadsById.values()].sort((a, b) => a.id.localeCompare(b.id));
  const averageCondition = activeBuildings.length === 0 ? 0 : Math.round(activeBuildings.reduce((sum, building) => sum + building.condition, 0) / activeBuildings.length);
  const state: CitySnapshot = {
    schemaVersion: 2,
    worldSeed: city.worldSeed,
    year,
    width: terrain.width,
    height: terrain.height,
    elevations: freezeGrid(terrain.elevations),
    waterMask: freezeGrid(terrain.waterMask),
    districtByTile: freezeGrid(districts.districtByTile),
    parcelByTile: freezeGrid(parcels.parcelByTile),
    districts: Object.freeze(districts.districts.map(({ id, kind, anchor }) => Object.freeze({ id, kind, anchor }))),
    center: Object.freeze({
      coordinate: Object.freeze({ ...foundation.center.coordinate }),
      establishedYear: foundation.center.establishedYear,
    }),
    institutions: Object.freeze(foundation.institutions.map((institution) => Object.freeze({
      ...institution,
      coordinate: Object.freeze({ ...institution.coordinate }),
    }))),
    parcels: snapshotParcels,
    railwayPath: Object.freeze(foundation.railway.path.map((tile) => Object.freeze({ ...tile }))),
    roads: Object.freeze(allRoads),
    buildings,
    centralities,
    metrics: Object.freeze({
      populationUnits: districts.totalPopulationUnits + growth.populationUnitsAdded,
      employmentUnits: districts.totalEmploymentUnits + growth.jobUnitsAdded,
      activeBuildings: activeBuildings.length,
      developedParcels: new Set(activeBuildings.map(({ parcelId }) => parcelId)).size,
      averageCondition,
      centralities: centralities.length,
      avenues: allRoads.filter(({ kind }) => kind === 'avenue').length,
      landValuePpu: year === 1910 ? landValue.totalLandValuePpu : null,
    }),
  };
  return Object.freeze(state);
}

/** Stable JSON envelope used by review artifacts and later campaign archive integration. */
export function serializeCitySnapshots(snapshots: readonly CitySnapshot[]): string {
  if (snapshots.length === 0) throw new RangeError('At least one city snapshot is required');
  const sorted = [...snapshots].sort((a, b) => a.year - b.year);
  const seed = sorted[0].worldSeed;
  if (sorted.some((snapshot, index) => snapshot.worldSeed !== seed || (index > 0 && snapshot.year === sorted[index - 1].year))) {
    throw new TypeError('City snapshots must have one worldSeed and unique years');
  }
  return JSON.stringify({ format: 'cidade-de-minas-city-snapshots', version: 2, worldSeed: seed, snapshots: sorted });
}
