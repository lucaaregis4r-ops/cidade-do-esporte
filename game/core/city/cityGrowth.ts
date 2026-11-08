import type { CityState } from './CityState';
import type { CityDistricts1910, CityDistrictKind } from './cityDistricts';
import type { CityFoundation1910 } from './cityFoundation';
import type { CityLandValue1910 } from './cityLandValue';
import type { CityParcels1910, CityParcel } from './cityParcels';
import type { TileCoord } from '../../types/coordinates';
import type { HistoricalReference } from '../economy/HistoricalEconomy';
import { CAMPAIGN_GROWTH_PROFILE } from './campaignGrowthProfile';

export type CityDevelopmentKind = 'residential' | 'commercial' | 'industrial' | 'services';
export type GrowthPressureFactor =
  | 'accessibility'
  | 'availableJobs'
  | 'nearbyPopulation'
  | 'infrastructure'
  | 'commercialActivity'
  | 'landDemand'
  | 'landCost'
  | 'terrainDifficulty'
  | 'congestion';

export interface CityGrowthCalibration {
  readonly id: string;
  readonly weights: Readonly<Record<GrowthPressureFactor, number>>;
  readonly railwayInfluence: Readonly<Record<'railway-centered' | 'road-expansion', number>>;
  readonly minimumPressure: number;
  readonly maximumDevelopmentsPerYear: number;
  readonly populationUnitsPerDevelopment: number;
  readonly jobUnitsPerDevelopment: number;
  readonly references: readonly HistoricalReference[];
  readonly notes: string;
}

export interface CityDevelopment {
  readonly id: string;
  readonly parcelId: string;
  readonly districtId: string;
  readonly kind: CityDevelopmentKind;
  readonly year: number;
  readonly pressure: number;
  readonly populationUnitsAdded: number;
  readonly jobUnitsAdded: number;
}

export interface CityRoadExtension {
  readonly id: string;
  readonly year: number;
  readonly parcelId: string;
  /** Land-only path from the existing road network to a newly developed parcel. */
  readonly path: readonly Readonly<TileCoord>[];
}

export interface CityGrowthState {
  readonly worldSeed: string;
  /** First year represented by this ledger; v22 migrations rebase to their saved year. */
  readonly baselineYear: number;
  /** Growth profile identity used for this ledger, null until the first transition. */
  readonly calibrationId: string | null;
  readonly throughYear: number;
  readonly developments: readonly CityDevelopment[];
  readonly roadExtensions: readonly CityRoadExtension[];
  readonly developedParcelIds: readonly string[];
  readonly populationUnitsAdded: number;
  readonly jobUnitsAdded: number;
}

export interface CityGrowthYearResult {
  readonly state: CityGrowthState;
  readonly decisions: readonly CityDevelopment[];
  readonly pressureByParcel: Readonly<Record<string, number>>;
}

interface GrowthFeatures {
  readonly parcel: CityParcel;
  readonly accessibility: number;
  readonly availableJobs: number;
  readonly nearbyPopulation: number;
  readonly infrastructure: number;
  readonly commercialActivity: number;
  readonly landDemand: number;
  readonly landCost: number;
  readonly terrainDifficulty: number;
  readonly congestion: number;
}

const FACTORS: readonly GrowthPressureFactor[] = [
  'accessibility', 'availableJobs', 'nearbyPopulation', 'infrastructure',
  'commercialActivity', 'landDemand', 'landCost', 'terrainDifficulty', 'congestion',
];
const NEIGHBORS: readonly Readonly<TileCoord>[] = [
  { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
];

function validateCalibration(calibration: CityGrowthCalibration): void {
  if (!calibration || !calibration.id?.trim() || !calibration.notes?.trim()) {
    throw new TypeError('City growth calibration requires an ID and explanatory notes');
  }
  if (!calibration.references?.length || calibration.references.some((reference) =>
    !reference.id?.trim() || !reference.source?.trim() || !reference.notes?.trim())) {
    throw new TypeError('City growth calibration requires cited sources or explicit model hypotheses');
  }
  if (!calibration.weights) throw new TypeError('City growth calibration requires factor weights');
  let positiveWeight = 0;
  for (const factor of FACTORS) {
    const weight = calibration.weights[factor];
    if (!Number.isFinite(weight) || weight < 0) throw new RangeError(`Invalid growth pressure weight for ${factor}`);
    if (factor === 'landCost' || factor === 'terrainDifficulty' || factor === 'congestion') {
      if (weight > 0) positiveWeight += weight;
    } else positiveWeight += weight;
  }
  if (positiveWeight === 0) throw new RangeError('City growth needs at least one nonzero pressure weight');
  for (const era of ['railway-centered', 'road-expansion'] as const) {
    const weight = calibration.railwayInfluence[era];
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new RangeError(`Railway influence for ${era} must be between 0 and 1`);
  }
  if (!Number.isFinite(calibration.minimumPressure) || calibration.minimumPressure < -900 || calibration.minimumPressure > 900) {
    throw new RangeError('Minimum growth pressure must be finite and in range');
  }
  if (!Number.isInteger(calibration.maximumDevelopmentsPerYear) || calibration.maximumDevelopmentsPerYear < 0) {
    throw new RangeError('Maximum annual developments must be a non-negative integer');
  }
  for (const [name, value] of Object.entries({
    populationUnitsPerDevelopment: calibration.populationUnitsPerDevelopment,
    jobUnitsPerDevelopment: calibration.jobUnitsPerDevelopment,
  })) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative`);
  }
}

function validateInputs(
  city: CityState,
  state: CityGrowthState,
  parcels: CityParcels1910,
  districts: CityDistricts1910,
  foundation: CityFoundation1910,
  landValue: CityLandValue1910,
): void {
  if (city.worldSeed !== state.worldSeed) throw new TypeError('City state and growth state must have the same worldSeed');
  if (city.asOf.year !== state.throughYear + 1 || city.asOf.month !== 1 || city.asOf.day !== 1) {
    throw new RangeError('City growth advances exactly one year at a time, on January 1');
  }
  if (city.asOf.year < 1911 || parcels.year !== 1910 || districts.year !== 1910 || foundation.year !== 1910 || landValue.year !== 1910) {
    throw new RangeError('City growth requires the 1910 baseline and a campaign date from 1911 through 1959');
  }
  if (city.asOf.year > 1959 || state.throughYear < 1910 || state.throughYear >= 1959) {
    throw new RangeError('City growth is bounded by the 1910–1959 campaign');
  }
  const parcelIds = new Set(parcels.parcels.map(({ id }) => id));
  if (landValue.parcels.length !== parcelIds.size || landValue.parcels.some(({ parcelId }) => !parcelIds.has(parcelId))) {
    throw new TypeError('Land valuation must cover every baseline parcel exactly once');
  }
  if (state.developedParcelIds.some((id) => !parcelIds.has(id)) || new Set(state.developedParcelIds).size !== state.developedParcelIds.length) {
    throw new TypeError('Growth state contains unknown or duplicate developed parcel IDs');
  }
}

/** Starts the autonomous growth ledger from the verified 1910 city baseline. */
export function createCityGrowthState(city: CityState, throughYear = 1910): CityGrowthState {
  if (city.asOf.year !== 1910 || city.asOf.month !== 1 || city.asOf.day !== 1) {
    throw new RangeError('City growth state must start on 01/01/1910');
  }
  if (!Number.isInteger(throughYear) || throughYear < 1910 || throughYear > 1959) {
    throw new RangeError('City growth baseline year must be between 1910 and 1959');
  }
  return Object.freeze({
    worldSeed: city.worldSeed,
    baselineYear: throughYear,
    calibrationId: null,
    throughYear,
    developments: Object.freeze([]),
    roadExtensions: Object.freeze([]),
    developedParcelIds: Object.freeze([]),
    populationUnitsAdded: 0,
    jobUnitsAdded: 0,
  });
}

function getFeatures(
  parcels: CityParcels1910,
  districts: CityDistricts1910,
  landValue: CityLandValue1910,
  state: CityGrowthState,
  railwayWeight: number,
): readonly GrowthFeatures[] {
  const parcelById = new Map(parcels.parcels.map((parcel) => [parcel.id, parcel]));
  const addedPopulationByDistrict = new Map<string, number>();
  const addedJobsByDistrict = new Map<string, number>();
  for (const development of state.developments) {
    addedPopulationByDistrict.set(
      development.districtId,
      (addedPopulationByDistrict.get(development.districtId) ?? 0) + development.populationUnitsAdded,
    );
    addedJobsByDistrict.set(
      development.districtId,
      (addedJobsByDistrict.get(development.districtId) ?? 0) + development.jobUnitsAdded,
    );
  }
  const maxJobs = Math.max(1, ...districts.districts.map(({ id, employmentUnits }) =>
    employmentUnits + (addedJobsByDistrict.get(id) ?? 0)));
  const maxPopulation = Math.max(1, ...districts.districts.map(({ id, populationUnits }) =>
    populationUnits + (addedPopulationByDistrict.get(id) ?? 0)));
  const maxLandValue = Math.max(1, ...landValue.parcels.map(({ relativeScore }) => relativeScore));
  const valueById = new Map(landValue.parcels.map((value) => [value.parcelId, value]));
  const districtById = new Map(districts.districts.map((district) => [district.id, district]));
  const developed = new Set(state.developedParcelIds);
  const commerceDistricts = new Set(['commercial-cluster', 'small-industry', 'railway-workshops']);

  return parcels.parcels.map((parcel) => {
    const district = districtById.get(parcel.districtId);
    const value = valueById.get(parcel.id);
    if (!district || !value) throw new TypeError(`Missing district or land value for ${parcel.id}`);
    let nearbyDevelopments = 0;
    const adjacentDistrictIds = new Set<string>();
    for (const tile of parcel.tiles) {
      for (const offset of NEIGHBORS) {
        const x = tile.x + offset.x;
        const y = tile.y + offset.y;
        const id = parcels.parcelByTile[y]?.[x];
        if (id && id !== parcel.id) {
          adjacentDistrictIds.add(id);
          if (developed.has(id)) nearbyDevelopments++;
        }
      }
    }
    const adjacentDistricts = [...adjacentDistrictIds]
      .map((id) => parcelById.get(id)?.districtId)
      .filter((id): id is string => id !== undefined);
    const localAddedPopulation = [...adjacentDistrictIds].reduce((sum, id) => {
      const districtId = parcelById.get(id)?.districtId;
      return sum + (districtId ? (addedPopulationByDistrict.get(districtId) ?? 0) : 0);
    }, 0);
    const commercialActivity = Math.min(100, Math.round(
      (commerceDistricts.has(district.kind) ? 45 : 0) +
      (district.kind === 'commercial-cluster' ? 55 : 0) +
      (adjacentDistricts.some((id) => commerceDistricts.has(districtById.get(id)?.kind ?? '')) ? 20 : 0),
    ));
    const builtShare = state.developedParcelIds.length / Math.max(1, parcels.parcels.length);
    return {
      parcel,
      accessibility: Math.min(100, Math.round(parcel.accessibility * 0.6 + parcel.roadAccess * 0.4)),
      availableJobs: Math.round(100 * (district.employmentUnits + (addedJobsByDistrict.get(district.id) ?? 0)) / maxJobs),
      nearbyPopulation: Math.round(100 * (parcel.neighborhoodPopulation + localAddedPopulation) / maxPopulation),
      infrastructure: Math.round(parcel.roadAccess * (1 - railwayWeight) + parcel.railAccess * railwayWeight),
      commercialActivity,
      landDemand: Math.round(Math.min(100, 30 + builtShare * 140 + (state.jobUnitsAdded > state.populationUnitsAdded ? 15 : 0))),
      landCost: Math.round(100 * value.relativeScore / maxLandValue),
      terrainDifficulty: parcel.terrainDifficulty,
      congestion: Math.min(100, nearbyDevelopments * 20),
    };
  });
}

function score(features: GrowthFeatures, weights: CityGrowthCalibration['weights']): number {
  return Math.round(FACTORS.reduce((total, factor) => {
    const raw = features[factor];
    const signed = factor === 'landCost' || factor === 'terrainDifficulty' || factor === 'congestion' ? -raw : raw;
    return total + signed * weights[factor];
  }, 0));
}

function developmentKind(kind: CityDistrictKind, railAccess: number, railwayWeight: number): CityDevelopmentKind {
  if (kind === 'small-industry' || kind === 'railway-workshops' || (railAccess >= 70 && railwayWeight >= 0.5)) return 'industrial';
  if (kind === 'commercial-cluster' || kind === 'railway-station') return 'commercial';
  if (kind === 'public-square') return 'services';
  return 'residential';
}

function landPathToExistingRoad(
  parcel: CityParcel,
  parcels: CityParcels1910,
  roads: readonly (readonly Readonly<TileCoord>[])[],
): readonly Readonly<TileCoord>[] | null {
  const height = parcels.parcelByTile.length;
  const width = parcels.parcelByTile[0]?.length ?? 0;
  const roadCells = new Set(roads.flatMap((road) => road.map(({ x, y }) => y * width + x)));
  if (roadCells.size === 0) return null;
  const queue: TileCoord[] = [];
  const previous = new Map<number, number | null>();
  for (const tile of parcel.tiles) {
    const index = tile.y * width + tile.x;
    queue.push({ ...tile });
    previous.set(index, null);
  }
  let target: number | null = null;
  for (let head = 0; head < queue.length && target === null; head++) {
    const current = queue[head];
    const currentIndex = current.y * width + current.x;
    if (roadCells.has(currentIndex)) { target = currentIndex; break; }
    for (const offset of NEIGHBORS) {
      const x = current.x + offset.x;
      const y = current.y + offset.y;
      if (x < 0 || x >= width || y < 0 || y >= height || parcels.parcelByTile[y][x] === null) continue;
      const index = y * width + x;
      if (previous.has(index)) continue;
      previous.set(index, currentIndex);
      queue.push({ x, y });
    }
  }
  if (target === null) return null;
  const path: TileCoord[] = [];
  let cursor: number | null = target;
  while (cursor !== null) {
    path.push({ x: cursor % width, y: Math.floor(cursor / width) });
    cursor = previous.get(cursor) ?? null;
  }
  return Object.freeze(path.map((tile) => Object.freeze(tile)));
}

/** Deterministically grows one campaign year using explicit, inspectable model hypotheses. */
export function advanceCityGrowthYear(
  city: CityState,
  state: CityGrowthState,
  parcels: CityParcels1910,
  districts: CityDistricts1910,
  foundation: CityFoundation1910,
  landValue: CityLandValue1910,
  calibration: CityGrowthCalibration,
): CityGrowthYearResult {
  validateCalibration(calibration);
  validateInputs(city, state, parcels, districts, foundation, landValue);
  if (state.calibrationId !== null && state.calibrationId !== calibration.id) {
    throw new TypeError('Growth state uses another calibration profile');
  }
  const eraId = city.eraId;
  const railwayWeight = calibration.railwayInfluence[eraId];
  const availableFeatures = getFeatures(parcels, districts, landValue, state, railwayWeight)
    .filter(({ parcel }) => !state.developedParcelIds.includes(parcel.id));
  const ranked = availableFeatures.map((features) => ({ features, pressure: score(features, calibration.weights) }))
    .filter(({ pressure }) => pressure >= calibration.minimumPressure)
    .sort((a, b) => b.pressure - a.pressure || a.features.parcel.id.localeCompare(b.features.parcel.id))
    .slice(0, calibration.maximumDevelopmentsPerYear);

  const allRoads = [...foundation.roads.map(({ path }) => path), ...state.roadExtensions.map(({ path }) => path)];
  const decisions: CityDevelopment[] = [];
  const roadExtensions: CityRoadExtension[] = [];
  const pressureByParcel: Record<string, number> = {};
  const alreadyBuilt = new Set(state.developedParcelIds);
  for (const item of availableFeatures) pressureByParcel[item.parcel.id] = score(item, calibration.weights);

  for (const { features, pressure } of ranked) {
    const { parcel } = features;
    const id = `development-${city.asOf.year}-${parcel.id}`;
    const district = districts.districts.find(({ id: districtId }) => districtId === parcel.districtId)!;
    const development = Object.freeze({
      id,
      parcelId: parcel.id,
      districtId: parcel.districtId,
      kind: developmentKind(district.kind, parcel.railAccess, railwayWeight),
      year: city.asOf.year,
      pressure,
      populationUnitsAdded: calibration.populationUnitsPerDevelopment,
      jobUnitsAdded: calibration.jobUnitsPerDevelopment,
    });
    decisions.push(development);
    alreadyBuilt.add(parcel.id);
    const path = landPathToExistingRoad(parcel, parcels, allRoads);
    if (path && path.length > 1) {
      const road = Object.freeze({
        id: `road-extension-${city.asOf.year}-${parcel.id}`,
        year: city.asOf.year,
        parcelId: parcel.id,
        path,
      });
      roadExtensions.push(road);
      allRoads.push(path);
    }
  }

  const allDevelopments = Object.freeze([...state.developments, ...decisions]);
  const allRoadExtensions = Object.freeze([...state.roadExtensions, ...roadExtensions]);
  const nextState: CityGrowthState = Object.freeze({
    worldSeed: state.worldSeed,
    baselineYear: state.baselineYear,
    calibrationId: calibration.id,
    throughYear: city.asOf.year,
    developments: allDevelopments,
    roadExtensions: allRoadExtensions,
    developedParcelIds: Object.freeze([...alreadyBuilt]),
    populationUnitsAdded: state.populationUnitsAdded + decisions.reduce((sum, item) => sum + item.populationUnitsAdded, 0),
    jobUnitsAdded: state.jobUnitsAdded + decisions.reduce((sum, item) => sum + item.jobUnitsAdded, 0),
  });
  return Object.freeze({
    state: nextState,
    decisions: Object.freeze(decisions),
    pressureByParcel: Object.freeze(pressureByParcel),
  });
}

/** Validate the persisted growth ledger before it can be installed in a live World. */
export function validateCityGrowthState(
  value: unknown,
  worldSeed: string,
  currentYear: number,
  parcels: CityParcels1910,
  districts: CityDistricts1910,
  foundation: CityFoundation1910,
): CityGrowthState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const state = value as CityGrowthState;
  if (state.worldSeed !== worldSeed || state.throughYear !== currentYear ||
      !Number.isInteger(state.baselineYear) || state.baselineYear < 1910 || state.baselineYear > currentYear ||
      !(state.calibrationId === null || typeof state.calibrationId === 'string') ||
      !Array.isArray(state.developments) || !Array.isArray(state.roadExtensions) ||
      !Array.isArray(state.developedParcelIds) || !Number.isFinite(state.populationUnitsAdded) ||
      !Number.isFinite(state.jobUnitsAdded)) return null;
  const parcelById = new Map(parcels.parcels.map((parcel) => [parcel.id, parcel]));
  const districtIds = new Set(districts.districts.map((district) => district.id));
  const seenParcels = new Set<string>();
  let population = 0;
  let jobs = 0;
  const developmentsPerYear = new Map<number, number>();
  for (const development of state.developments) {
    if (!development || !parcelById.has(development.parcelId) || !districtIds.has(development.districtId) ||
        parcelById.get(development.parcelId)?.districtId !== development.districtId ||
        !['residential', 'commercial', 'industrial', 'services'].includes(development.kind) ||
        !Number.isInteger(development.year) || development.year <= state.baselineYear || development.year > currentYear ||
        development.id !== `development-${development.year}-${development.parcelId}` ||
        !Number.isFinite(development.pressure) || !Number.isFinite(development.populationUnitsAdded) ||
        development.populationUnitsAdded < 0 || !Number.isFinite(development.jobUnitsAdded) || development.jobUnitsAdded < 0 ||
        seenParcels.has(development.parcelId)) return null;
    seenParcels.add(development.parcelId);
    developmentsPerYear.set(development.year, (developmentsPerYear.get(development.year) ?? 0) + 1);
    population += development.populationUnitsAdded;
    jobs += development.jobUnitsAdded;
  }
  if (state.developedParcelIds.length !== seenParcels.size ||
      new Set(state.developedParcelIds).size !== state.developedParcelIds.length ||
      state.developedParcelIds.some((id) => !seenParcels.has(id)) ||
      population !== state.populationUnitsAdded || jobs !== state.jobUnitsAdded ||
      (state.calibrationId === null && (state.developments.length > 0 || state.roadExtensions.length > 0)) ||
      (state.calibrationId !== null && state.calibrationId !== CAMPAIGN_GROWTH_PROFILE.id) ||
      [...developmentsPerYear.values()].some((count) => count > CAMPAIGN_GROWTH_PROFILE.maximumDevelopmentsPerYear)) return null;
  const roads: Map<string, readonly Readonly<TileCoord>[]> = new Map([...foundation.roads.map(({ id, path }) => [id, path] as const),
    ...state.roadExtensions.map(({ id, path }) => [id, path] as const)]);
  const seenRoadIds = new Set<string>();
  for (const road of state.roadExtensions) {
    if (!road || !parcelById.has(road.parcelId) || road.year <= state.baselineYear || road.year > currentYear ||
        road.id !== `road-extension-${road.year}-${road.parcelId}` || seenRoadIds.has(road.id) ||
        !Array.isArray(road.path) || road.path.length < 2) return null;
    seenRoadIds.add(road.id);
    for (let index = 0; index < road.path.length; index++) {
      const tile = road.path[index];
      if (!Number.isInteger(tile.x) || !Number.isInteger(tile.y) || tile.x < 0 || tile.y < 0 ||
          tile.y >= parcels.parcelByTile.length || tile.x >= parcels.parcelByTile[0].length ||
          parcels.parcelByTile[tile.y][tile.x] === null) return null;
      if (index > 0) {
        const previous = road.path[index - 1];
        if (Math.abs(tile.x - previous.x) + Math.abs(tile.y - previous.y) !== 1) return null;
      }
    }
    const parcel = parcelById.get(road.parcelId)!;
    const first = road.path[0];
    const last = road.path[road.path.length - 1];
    if (!parcel.tiles.some(({ x, y }) => x === last.x && y === last.y)) return null;
    const priorRoadCells = new Set([...roads.entries()].filter(([id]) => id !== road.id)
      .flatMap(([, path]) => path.map(({ x, y }) => `${x},${y}`)));
    if (!priorRoadCells.has(`${first.x},${first.y}`)) return null;
  }
  return Object.freeze({
    ...state,
    developments: Object.freeze(state.developments.map((item) => Object.freeze({ ...item }))),
    roadExtensions: Object.freeze(state.roadExtensions.map((road) => Object.freeze({
      ...road, path: Object.freeze(road.path.map((tile: Readonly<TileCoord>) => Object.freeze({ ...tile }))),
    }))),
    developedParcelIds: Object.freeze([...state.developedParcelIds]),
  });
}
