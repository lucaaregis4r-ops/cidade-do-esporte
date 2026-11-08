import type { CityState } from './CityState';
import type { CityFoundation1910 } from './cityFoundation';
import type { CityGrowthState, CityGrowthYearResult } from './cityGrowth';
import type { CityParcels1910 } from './cityParcels';
import type { TileCoord } from '../../types/coordinates';
import type { HistoricalReference } from '../economy/HistoricalEconomy';

export interface CityTransformationCalibration {
  readonly id: string;
  readonly annualConditionLoss: number;
  readonly demolitionConditionThreshold: number;
  readonly redevelopmentAttractivenessThreshold: number;
  readonly densityIncreasePerRedevelopment: number;
  readonly maximumDensityUnits: number;
  readonly centralityThreshold: number;
  readonly avenueActivityThreshold: number;
  readonly references: readonly HistoricalReference[];
  readonly notes: string;
}

export interface CityBuildingRecord {
  readonly id: string;
  readonly parcelId: string;
  readonly kind: CityGrowthYearResult['decisions'][number]['kind'];
  readonly builtYear: number;
  readonly condition: number;
  readonly densityUnits: number;
  readonly status: 'active' | 'demolished' | 'replaced';
  readonly demolishedYear?: number;
  readonly replacementId?: string;
  readonly predecessorId?: string;
}

export interface CityCentrality {
  readonly id: string;
  readonly parcelId: string;
  readonly establishedYear: number;
  readonly lastActiveYear: number;
  readonly score: number;
}

export interface CityAvenueUpgrade {
  readonly roadId: string;
  readonly upgradedYear: number;
  readonly path: readonly Readonly<TileCoord>[];
  readonly activityScore: number;
}

export interface CityTransformationState {
  readonly worldSeed: string;
  readonly throughYear: number;
  readonly buildings: readonly CityBuildingRecord[];
  readonly centralities: readonly CityCentrality[];
  readonly avenueUpgrades: readonly CityAvenueUpgrade[];
}

export interface CityTransformationYearResult {
  readonly state: CityTransformationState;
  readonly demolitions: readonly string[];
  readonly replacements: readonly string[];
  readonly newCentralities: readonly CityCentrality[];
  readonly newAvenues: readonly CityAvenueUpgrade[];
}

const NEIGHBORS: readonly Readonly<TileCoord>[] = [
  { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
];

function validateCalibration(calibration: CityTransformationCalibration): void {
  if (!calibration?.id?.trim() || !calibration.notes?.trim() || !calibration.references?.length ||
      calibration.references.some((reference) => !reference.id?.trim() || !reference.source?.trim() || !reference.notes?.trim())) {
    throw new TypeError('City transformation calibration requires an ID, notes, and cited sources or explicit hypotheses');
  }
  for (const [name, value] of Object.entries({
    annualConditionLoss: calibration.annualConditionLoss,
    demolitionConditionThreshold: calibration.demolitionConditionThreshold,
    redevelopmentAttractivenessThreshold: calibration.redevelopmentAttractivenessThreshold,
    centralityThreshold: calibration.centralityThreshold,
    avenueActivityThreshold: calibration.avenueActivityThreshold,
  })) {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${name} must be between 0 and 100`);
  }
  if (!Number.isInteger(calibration.densityIncreasePerRedevelopment) || calibration.densityIncreasePerRedevelopment < 1 ||
      !Number.isInteger(calibration.maximumDensityUnits) || calibration.maximumDensityUnits < 1 ||
      calibration.densityIncreasePerRedevelopment > calibration.maximumDensityUnits) {
    throw new RangeError('Density values must be positive integers and fit the configured maximum');
  }
}

export function createCityTransformationState(city: CityState, throughYear = 1910): CityTransformationState {
  if (city.asOf.year !== 1910 || city.asOf.month !== 1 || city.asOf.day !== 1) {
    throw new RangeError('City transformation state must start on 01/01/1910');
  }
  if (!Number.isInteger(throughYear) || throughYear < 1910 || throughYear > 1959) throw new RangeError('Transformation baseline year must be between 1910 and 1959');
  return Object.freeze({ worldSeed: city.worldSeed, throughYear, buildings: Object.freeze([]), centralities: Object.freeze([]), avenueUpgrades: Object.freeze([]) });
}

function getParcelActivity(
  parcels: CityParcels1910,
  activeByParcel: ReadonlyMap<string, CityBuildingRecord>,
): Map<string, number> {
  const activity = new Map<string, number>();
  const parcelAt = new Map<string, string>();
  for (const parcel of parcels.parcels) for (const tile of parcel.tiles) parcelAt.set(`${tile.x},${tile.y}`, parcel.id);
  for (const parcel of parcels.parcels) {
    let adjacent = 0;
    for (const tile of parcel.tiles) for (const offset of NEIGHBORS) {
      const neighborId = parcelAt.get(`${tile.x + offset.x},${tile.y + offset.y}`);
      if (neighborId && neighborId !== parcel.id) adjacent += activeByParcel.get(neighborId)?.densityUnits ?? 0;
    }
    activity.set(parcel.id, adjacent);
  }
  return activity;
}

function avenueCandidates(
  foundation: CityFoundation1910,
  growth: CityGrowthYearResult,
): readonly { id: string; path: readonly Readonly<TileCoord>[] }[] {
  return [
    ...foundation.roads.map(({ id, path }) => ({ id, path })),
    ...growth.state.roadExtensions.map(({ id, path }) => ({ id, path })),
  ];
}

/** Advances deterministic building life cycles, infill centers, and road capacity one year. */
export function advanceCityTransformationYear(
  city: CityState,
  state: CityTransformationState,
  growth: CityGrowthYearResult,
  parcels: CityParcels1910,
  foundation: CityFoundation1910,
  calibration: CityTransformationCalibration,
): CityTransformationYearResult {
  validateCalibration(calibration);
  const year = city.asOf.year;
  if (city.worldSeed !== state.worldSeed || city.worldSeed !== growth.state.worldSeed) throw new TypeError('City transformation inputs must share one worldSeed');
  if (city.asOf.month !== 1 || city.asOf.day !== 1 || year !== state.throughYear + 1 || growth.state.throughYear !== year) {
    throw new RangeError('City transformation advances once per January after the matching growth year');
  }
  if (year < 1911 || year > 1959 || parcels.year !== 1910 || foundation.year !== 1910) throw new RangeError('City transformation is bounded by the 1910–1959 baseline');

  const records = state.buildings.map((building) => ({ ...building }));
  const previousIds = new Set(records.map(({ id }) => id));
  const demolitions: string[] = [];
  const replacements: string[] = [];
  for (const decision of growth.decisions) {
    if (decision.year !== year || previousIds.has(decision.id)) throw new TypeError('Growth decisions must be unique and belong to the current year');
    records.push({ id: decision.id, parcelId: decision.parcelId, kind: decision.kind, builtYear: year, condition: 100, densityUnits: 1, status: 'active' });
    previousIds.add(decision.id);
  }

  const activeByParcel = new Map<string, CityBuildingRecord>();
  for (const building of records) if (building.status === 'active') activeByParcel.set(building.parcelId, building);
  const activity = getParcelActivity(parcels, activeByParcel);
  const parcelById = new Map(parcels.parcels.map((parcel) => [parcel.id, parcel]));
  for (let index = 0; index < records.length; index++) {
    const building = records[index];
    if (building.status !== 'active' || building.builtYear === year) continue;
    const condition = Math.max(0, building.condition - calibration.annualConditionLoss);
    const parcel = parcelById.get(building.parcelId);
    if (!parcel) throw new TypeError(`Unknown parcel in building history: ${building.parcelId}`);
    const attractiveness = Math.min(100, Math.round((parcel.centrality + parcel.accessibility + parcel.roadAccess + (activity.get(parcel.id) ?? 0) * 5) / 3));
    const shouldDemolish = condition <= calibration.demolitionConditionThreshold;
    if (!shouldDemolish) {
      records[index] = { ...building, condition };
      continue;
    }
    const shouldRedevelop = attractiveness >= calibration.redevelopmentAttractivenessThreshold;
    if (!shouldRedevelop) {
      records[index] = { ...building, condition, status: 'demolished', demolishedYear: year };
      activeByParcel.delete(building.parcelId);
      demolitions.push(building.id);
      continue;
    }
    const replacementId = `redevelopment-${year}-${building.parcelId}-${building.id}`;
    records[index] = { ...building, condition, status: 'replaced', demolishedYear: year, replacementId };
    const replacement: CityBuildingRecord = {
      id: replacementId,
      parcelId: building.parcelId,
      kind: building.kind,
      builtYear: year,
      condition: 100,
      densityUnits: Math.min(calibration.maximumDensityUnits, building.densityUnits + calibration.densityIncreasePerRedevelopment),
      status: 'active',
      predecessorId: building.id,
    };
    records.push(replacement);
    activeByParcel.set(building.parcelId, replacement);
    demolitions.push(building.id);
    replacements.push(replacementId);
  }

  const finalActive = new Map(records.filter(({ status }) => status === 'active').map((building) => [building.parcelId, building]));
  const finalActivity = getParcelActivity(parcels, finalActive);
  const oldCentralities = new Map(state.centralities.map((center) => [center.parcelId, center]));
  const nextCentralities = [...oldCentralities.values()];
  const newCentralities: CityCentrality[] = [];
  for (const [parcelId, building] of [...finalActive].sort(([a], [b]) => a.localeCompare(b))) {
    if (building.kind !== 'commercial' && building.kind !== 'services') continue;
    const parcel = parcelById.get(parcelId)!;
    const score = Math.min(100, Math.round((parcel.centrality + parcel.accessibility + parcel.roadAccess + (finalActivity.get(parcelId) ?? 0) * 5) / 3));
    if (score < calibration.centralityThreshold) continue;
    const existing = oldCentralities.get(parcelId);
    if (existing) {
      const index = nextCentralities.findIndex(({ parcelId: id }) => id === parcelId);
      nextCentralities[index] = Object.freeze({ ...existing, lastActiveYear: year, score });
    } else {
      const center = Object.freeze({ id: `centrality-${parcelId}`, parcelId, establishedYear: year, lastActiveYear: year, score });
      nextCentralities.push(center);
      newCentralities.push(center);
    }
  }

  const alreadyUpgraded = new Set(state.avenueUpgrades.map(({ roadId }) => roadId));
  const newAvenues: CityAvenueUpgrade[] = [];
  const allRoads = avenueCandidates(foundation, growth);
  const parcelAt = new Map<string, string>();
  for (const parcel of parcels.parcels) for (const tile of parcel.tiles) parcelAt.set(`${tile.x},${tile.y}`, parcel.id);
  for (const road of allRoads) {
    if (alreadyUpgraded.has(road.id)) continue;
    const adjacentParcels = new Set<string>();
    for (const tile of road.path) for (const offset of NEIGHBORS) {
      const parcelId = parcelAt.get(`${tile.x + offset.x},${tile.y + offset.y}`);
      if (parcelId) adjacentParcels.add(parcelId);
    }
    const activityScore = [...adjacentParcels].reduce((sum, parcelId) => sum + (finalActive.get(parcelId)?.densityUnits ?? 0), 0);
    if (activityScore < calibration.avenueActivityThreshold) continue;
    const upgrade = Object.freeze({ roadId: road.id, upgradedYear: year, path: Object.freeze(road.path.map((tile) => Object.freeze({ ...tile }))), activityScore });
    newAvenues.push(upgrade);
    alreadyUpgraded.add(road.id);
  }

  const nextState: CityTransformationState = Object.freeze({
    worldSeed: state.worldSeed,
    throughYear: year,
    buildings: Object.freeze(records.map((building) => Object.freeze(building))),
    centralities: Object.freeze(nextCentralities),
    avenueUpgrades: Object.freeze([...state.avenueUpgrades, ...newAvenues]),
  });
  return Object.freeze({ state: nextState, demolitions: Object.freeze(demolitions), replacements: Object.freeze(replacements), newCentralities: Object.freeze(newCentralities), newAvenues: Object.freeze(newAvenues) });
}

/** Rebuilds transformation history from persisted growth decisions without inventing growth. */
export function replayCityTransformationHistory(
  city: CityState,
  growth: CityGrowthState,
  parcels: CityParcels1910,
  foundation: CityFoundation1910,
  calibration: CityTransformationCalibration,
): CityTransformationState {
  if (growth.worldSeed !== city.worldSeed || growth.throughYear < growth.baselineYear) throw new TypeError('Growth history is incompatible with the transformation replay');
  let state = createCityTransformationState(city, growth.baselineYear);
  for (let year = growth.baselineYear + 1; year <= growth.throughYear; year++) {
    const developments = growth.developments.filter((item) => item.year <= year);
    const roadExtensions = growth.roadExtensions.filter((item) => item.year <= year);
    const growthAtYear: CityGrowthState = Object.freeze({
      ...growth,
      throughYear: year,
      developments: Object.freeze(developments),
      roadExtensions: Object.freeze(roadExtensions),
      developedParcelIds: Object.freeze(developments.map(({ parcelId }) => parcelId)),
      populationUnitsAdded: developments.reduce((sum, item) => sum + item.populationUnitsAdded, 0),
      jobUnitsAdded: developments.reduce((sum, item) => sum + item.jobUnitsAdded, 0),
    });
    const result: CityGrowthYearResult = Object.freeze({
      state: growthAtYear,
      decisions: Object.freeze(developments.filter((item) => item.year === year)),
      pressureByParcel: Object.freeze({}),
    });
    state = advanceCityTransformationYear(
      { ...city, asOf: Object.freeze({ year, month: 1, day: 1 }) },
      state,
      result,
      parcels,
      foundation,
      calibration,
    ).state;
  }
  return state;
}
