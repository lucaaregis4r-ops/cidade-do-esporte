import type { CityState } from './CityState';
import type { CityDistricts1910 } from './cityDistricts';
import type { CityFoundation1910, CityInstitutionKind } from './cityFoundation';
import type { CityParcels1910, CityParcel } from './cityParcels';
import type { TileCoord } from '../../types/coordinates';
import type { HistoricalEconomy, HistoricalReference, NominalMoney } from '../economy/HistoricalEconomy';

export type LandValueFactor =
  | 'centrality'
  | 'accessibility'
  | 'railAccess'
  | 'roadAccess'
  | 'commerceAccess'
  | 'industryAccess'
  | 'terrainQuality'
  | 'neighborhoodPopulation';

export interface LandValueCalibration {
  readonly id: string;
  /** Hypothesis or researched real land value per tile, expressed in stable PPU. */
  readonly baseLandValuePpuPerTile: number;
  readonly minimumMultiplier: number;
  readonly maximumMultiplier: number;
  readonly weights: Readonly<Record<LandValueFactor, number>>;
  readonly references: readonly HistoricalReference[];
  readonly notes: string;
}

export type LandOverlayId =
  | 'price'
  | 'population'
  | 'income'
  | 'transport'
  | 'railway'
  | 'commerce'
  | 'industry'
  | 'topography'
  | 'clubs'
  | 'appreciation';

export interface LandOverlayValue {
  readonly status: 'available' | 'deferred';
  readonly value: number | null;
  readonly unit: string;
  readonly reason?: string;
}

export interface ValuedParcel {
  readonly parcelId: string;
  readonly landValuePpu: number;
  readonly nominalValue?: NominalMoney;
  readonly relativeScore: number;
  readonly factors: Readonly<Record<LandValueFactor, { readonly score: number; readonly contribution: number }>>;
  readonly overlays: Readonly<Record<LandOverlayId, LandOverlayValue>>;
}

export interface CityLandValue1910 {
  readonly year: 1910;
  readonly calibrationId: string;
  readonly parcels: readonly ValuedParcel[];
  readonly totalLandValuePpu: number;
  readonly references: readonly HistoricalReference[];
}

const LAND_VALUE_FACTORS: readonly LandValueFactor[] = [
  'centrality',
  'accessibility',
  'railAccess',
  'roadAccess',
  'commerceAccess',
  'industryAccess',
  'terrainQuality',
  'neighborhoodPopulation',
];

const DEFERRED_OVERLAYS: Readonly<Record<'income' | 'clubs' | 'appreciation', string>> = Object.freeze({
  income: 'Historical neighborhood income data is not calibrated; see Macroetapa 41.',
  clubs: 'Club locations and their influence are not implemented yet.',
  appreciation: 'Historical snapshots are not implemented yet; appreciation requires a time comparison.',
});

function validateCalibration(calibration: LandValueCalibration): void {
  if (!calibration || typeof calibration.id !== 'string' || calibration.id.trim().length === 0) {
    throw new TypeError('Land value calibration requires a stable ID');
  }
  if (!Number.isFinite(calibration.baseLandValuePpuPerTile) || calibration.baseLandValuePpuPerTile <= 0) {
    throw new RangeError('Base land value per tile must be finite and positive PPU');
  }
  if (
    !Number.isFinite(calibration.minimumMultiplier) || calibration.minimumMultiplier <= 0 ||
    !Number.isFinite(calibration.maximumMultiplier) || calibration.maximumMultiplier < calibration.minimumMultiplier
  ) throw new RangeError('Land value multipliers must be finite, positive, and ordered');
  if (!calibration.weights || !calibration.references || calibration.references.length === 0) {
    throw new TypeError('Land value calibration requires factor weights and source or hypothesis references');
  }
  let sum = 0;
  for (const factor of LAND_VALUE_FACTORS) {
    const weight = calibration.weights[factor];
    if (!Number.isFinite(weight) || weight < 0) throw new RangeError(`Invalid land value weight for ${factor}`);
    sum += weight;
  }
  if (Math.abs(sum - 1) > 1e-9) throw new RangeError('Land value factor weights must sum to 1');
  for (const reference of calibration.references) {
    if (
      !reference || !reference.id?.trim() || !reference.source?.trim() || !reference.notes?.trim()
    ) throw new TypeError('Every land value calibration reference requires an ID, source, and interpretation/limitation notes');
  }
  if (typeof calibration.notes !== 'string' || calibration.notes.trim().length === 0) {
    throw new TypeError('Land value calibration must explain its interpretation and limits');
  }
}

function validateInputs(
  city: CityState,
  parcels: CityParcels1910,
  districts: CityDistricts1910,
  foundation: CityFoundation1910,
): void {
  if (city.asOf.year !== 1910 || parcels.year !== 1910 || districts.year !== 1910 || foundation.year !== 1910) {
    throw new RangeError('Initial land valuation requires a 1910 city, parcels, districts, and foundation');
  }
}

function proximityScore(parcel: CityParcel, sites: readonly Readonly<TileCoord>[], width: number, height: number): number {
  if (sites.length === 0) return 0;
  let nearest = Number.POSITIVE_INFINITY;
  for (const tile of parcel.tiles) {
    for (const site of sites) nearest = Math.min(nearest, Math.abs(tile.x - site.x) + Math.abs(tile.y - site.y));
  }
  const maxDistance = width + height - 2;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - nearest / maxDistance))));
}

function makeOverlay(status: 'available' | 'deferred', value: number | null, unit: string, reason?: string): LandOverlayValue {
  return Object.freeze({ status, value, unit, ...(reason ? { reason } : {}) });
}

function valueParcel(
  parcel: CityParcel,
  city: CityState,
  parcels: CityParcels1910,
  maxDistrictPopulation: number,
  commerceSites: readonly Readonly<TileCoord>[],
  industrySites: readonly Readonly<TileCoord>[],
  calibration: LandValueCalibration,
  economy?: HistoricalEconomy,
): ValuedParcel {
  const rawScores: Record<LandValueFactor, number> = {
    centrality: parcel.centrality,
    accessibility: parcel.accessibility,
    railAccess: parcel.railAccess,
    roadAccess: parcel.roadAccess,
    commerceAccess: proximityScore(parcel, commerceSites, parcels.parcelByTile[0].length, parcels.parcelByTile.length),
    industryAccess: proximityScore(parcel, industrySites, parcels.parcelByTile[0].length, parcels.parcelByTile.length),
    terrainQuality: 100 - parcel.terrainDifficulty,
    neighborhoodPopulation: maxDistrictPopulation === 0 ? 0 : Math.round(100 * parcel.neighborhoodPopulation / maxDistrictPopulation),
  };
  const factors = Object.freeze(Object.fromEntries(LAND_VALUE_FACTORS.map((factor) => [factor, Object.freeze({
    score: rawScores[factor],
    contribution: rawScores[factor] * calibration.weights[factor],
  })])) as Record<LandValueFactor, { readonly score: number; readonly contribution: number }>);
  const relativeScore = Math.max(0, Math.min(100, LAND_VALUE_FACTORS.reduce((sum, factor) => sum + factors[factor].contribution, 0)));
  const multiplier = calibration.minimumMultiplier +
    (calibration.maximumMultiplier - calibration.minimumMultiplier) * (relativeScore / 100);
  const landValuePpu = parcel.area * calibration.baseLandValuePpuPerTile * multiplier;
  if (!Number.isFinite(landValuePpu)) throw new RangeError(`Land value overflow for parcel ${parcel.id}`);

  const nominalValue = economy?.toNominal(landValuePpu, city.asOf);
  const overlays: Record<LandOverlayId, LandOverlayValue> = {
    price: makeOverlay('available', landValuePpu, 'PPU'),
    population: makeOverlay('available', parcel.neighborhoodPopulation, 'abstract district population units'),
    income: makeOverlay('deferred', null, 'unavailable', DEFERRED_OVERLAYS.income),
    transport: makeOverlay('available', parcel.accessibility, 'access index (0–100)'),
    railway: makeOverlay('available', parcel.railAccess, 'rail access index (0–100)'),
    commerce: makeOverlay('available', rawScores.commerceAccess, 'commerce access index (0–100)'),
    industry: makeOverlay('available', rawScores.industryAccess, 'industry access index (0–100)'),
    topography: makeOverlay('available', parcel.terrainDifficulty, 'terrain difficulty index (0–100; lower is easier)'),
    clubs: makeOverlay('deferred', null, 'unavailable', DEFERRED_OVERLAYS.clubs),
    appreciation: makeOverlay('deferred', null, 'unavailable', DEFERRED_OVERLAYS.appreciation),
  };
  return Object.freeze({
    parcelId: parcel.id,
    landValuePpu,
    ...(nominalValue ? { nominalValue } : {}),
    relativeScore,
    factors,
    overlays: Object.freeze(overlays),
  });
}

/** Explainable PPU valuation. All monetary anchors and factor weights are explicit injected hypotheses/data. */
export function generateCityLandValue1910(
  city: CityState,
  parcels: CityParcels1910,
  districts: CityDistricts1910,
  foundation: CityFoundation1910,
  calibration: LandValueCalibration,
  economy?: HistoricalEconomy,
): CityLandValue1910 {
  validateInputs(city, parcels, districts, foundation);
  validateCalibration(calibration);
  const districtPopulations = districts.districts.map(({ populationUnits }) => populationUnits);
  const maxDistrictPopulation = Math.max(0, ...districtPopulations);
  const sitesOfKind = (kinds: readonly CityInstitutionKind[]) => foundation.institutions
    .filter(({ kind }) => kinds.includes(kind))
    .map(({ coordinate }) => coordinate);
  const commerceSites = sitesOfKind(['commercial-cluster']);
  const industrySites = sitesOfKind(['railway-workshops', 'small-industry']);
  const valuedParcels = parcels.parcels.map((parcel) => valueParcel(
    parcel,
    city,
    parcels,
    maxDistrictPopulation,
    commerceSites,
    industrySites,
    calibration,
    economy,
  ));
  const totalLandValuePpu = valuedParcels.reduce((sum, parcel) => sum + parcel.landValuePpu, 0);
  if (!Number.isFinite(totalLandValuePpu)) throw new RangeError('Total city land value overflow');
  return Object.freeze({
    year: 1910 as const,
    calibrationId: calibration.id,
    parcels: Object.freeze(valuedParcels),
    totalLandValuePpu,
    references: Object.freeze(calibration.references.map((reference) => Object.freeze({ ...reference }))),
  });
}
