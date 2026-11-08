import type { CampaignRng } from '../CampaignRng';
import type { TileCoord } from '../../types/coordinates';
import type { CityState } from './CityState';
import type { CityFoundation1910, CityInstitutionKind } from './cityFoundation';
import type { CityTerrain } from './cityTerrain';

export type CityDistrictKind = CityInstitutionKind | 'outer-north' | 'outer-east' | 'outer-south' | 'outer-west';

export interface CityDistrict {
  readonly id: string;
  readonly kind: CityDistrictKind;
  readonly anchor: Readonly<TileCoord>;
  readonly tiles: readonly Readonly<TileCoord>[];
  readonly landArea: number;
  /** Abstract model units, not calibrated historical residents. */
  readonly populationUnits: number;
  /** Abstract model units, not calibrated historical jobs. */
  readonly employmentUnits: number;
  readonly centrality: number;
  readonly populationShareBps: number;
  readonly employmentShareBps: number;
}

export interface CityDistricts1910 {
  readonly year: 1910;
  readonly districts: readonly CityDistrict[];
  /** Null denotes water. Every dry tile belongs to exactly one district. */
  readonly districtByTile: readonly (readonly (string | null)[])[];
  readonly totalLandArea: number;
  readonly totalPopulationUnits: number;
  readonly totalEmploymentUnits: number;
}

interface DistrictAnchor {
  id: string;
  kind: CityDistrictKind;
  coordinate: TileCoord;
}

const INSTITUTION_POPULATION_WEIGHT: Record<CityInstitutionKind, number> = {
  'railway-station': 1.2,
  'public-square': 1.1,
  'commercial-cluster': 1.5,
  'railway-workshops': 0.9,
  'small-industry': 0.8,
};

const INSTITUTION_EMPLOYMENT_WEIGHT: Record<CityInstitutionKind, number> = {
  'railway-station': 1.2,
  'public-square': 0.3,
  'commercial-cluster': 1.5,
  'railway-workshops': 1.4,
  'small-industry': 1.3,
};

function validateInputs(city: CityState, terrain: CityTerrain, foundation: CityFoundation1910, rng: CampaignRng): void {
  if (city.asOf.year !== 1910 || foundation.year !== 1910) {
    throw new RangeError('1910 districts require a 1910 city and foundation');
  }
  if (rng.worldSeed !== city.worldSeed) throw new TypeError('City state and campaign RNG must use the same worldSeed');
  if (terrain.width < 16 || terrain.height < 16 || terrain.elevations.length !== terrain.height || terrain.waterMask.length !== terrain.height) {
    throw new RangeError('1910 districts require matching terrain grids of at least 16×16');
  }
  for (let y = 0; y < terrain.height; y++) {
    if (terrain.elevations[y].length !== terrain.width || terrain.waterMask[y].length !== terrain.width) {
      throw new RangeError('City terrain rows must match the declared width');
    }
  }
}

function nearestLand(terrain: CityTerrain, target: TileCoord, occupied: Set<number>): TileCoord {
  let best: TileCoord | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let y = 0; y < terrain.height; y++) {
    for (let x = 0; x < terrain.width; x++) {
      const index = y * terrain.width + x;
      if (terrain.waterMask[y][x] || occupied.has(index)) continue;
      const distance = Math.abs(x - target.x) + Math.abs(y - target.y);
      if (distance < bestDistance) {
        best = { x, y };
        bestDistance = distance;
      }
    }
  }
  if (!best) throw new RangeError('City terrain does not contain enough dry tiles for districts');
  occupied.add(best.y * terrain.width + best.x);
  return best;
}

function buildAnchors(terrain: CityTerrain, foundation: CityFoundation1910): DistrictAnchor[] {
  const anchors: DistrictAnchor[] = foundation.institutions.map((institution) => ({
    id: `district-${institution.id}`,
    kind: institution.kind,
    coordinate: { ...institution.coordinate },
  }));
  const occupied = new Set(anchors.map(({ coordinate }) => coordinate.y * terrain.width + coordinate.x));
  const targets: { kind: CityDistrictKind; coordinate: TileCoord }[] = [
    { kind: 'outer-north', coordinate: { x: Math.floor((terrain.width - 1) / 2), y: 0 } },
    { kind: 'outer-east', coordinate: { x: terrain.width - 1, y: Math.floor((terrain.height - 1) / 2) } },
    { kind: 'outer-south', coordinate: { x: Math.floor((terrain.width - 1) / 2), y: terrain.height - 1 } },
    { kind: 'outer-west', coordinate: { x: 0, y: Math.floor((terrain.height - 1) / 2) } },
  ];
  for (const target of targets) {
    anchors.push({ id: `district-${target.kind}`, kind: target.kind, coordinate: nearestLand(terrain, target.coordinate, occupied) });
  }
  return anchors;
}

function getRoleWeight(kind: CityDistrictKind, weights: Record<CityInstitutionKind, number>): number {
  return kind in weights ? weights[kind as CityInstitutionKind] : 1;
}

function allocateShares(districts: readonly { weight: number }[]): number[] {
  const total = districts.reduce((sum, district) => sum + district.weight, 0);
  if (total <= 0) return districts.map(() => 0);
  const exact = districts.map(({ weight }) => (weight / total) * 10_000);
  const shares = exact.map(Math.floor);
  const remainder = 10_000 - shares.reduce((sum, share) => sum + share, 0);
  const order = exact.map((value, index) => ({ index, fraction: value - shares[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index++) shares[order[index].index]++;
  return shares;
}

/** Assigns the 1910 dry map to deterministic districts with abstract, uncalibrated totals. */
export function generateCityDistricts1910(
  city: CityState,
  terrain: CityTerrain,
  foundation: CityFoundation1910,
  campaignRng: CampaignRng,
): CityDistricts1910 {
  validateInputs(city, terrain, foundation, campaignRng);
  const anchors = buildAnchors(terrain, foundation);
  const tileLists = anchors.map((): TileCoord[] => []);
  const districtByTile: (string | null)[][] = [];
  for (let y = 0; y < terrain.height; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < terrain.width; x++) {
      if (terrain.waterMask[y][x]) {
        row.push(null);
        continue;
      }
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < anchors.length; index++) {
        const anchor = anchors[index].coordinate;
        const distance = Math.abs(x - anchor.x) + Math.abs(y - anchor.y);
        if (distance < nearestDistance) {
          nearestIndex = index;
          nearestDistance = distance;
        }
      }
      tileLists[nearestIndex].push({ x, y });
      row.push(anchors[nearestIndex].id);
    }
    districtByTile.push(row);
  }

  const districts = anchors.flatMap((anchor, index) => {
    const tiles = tileLists[index];
    if (tiles.length === 0) return [];
    const landArea = tiles.length;
    const populationWeight = getRoleWeight(anchor.kind, INSTITUTION_POPULATION_WEIGHT);
    const employmentWeight = getRoleWeight(anchor.kind, INSTITUTION_EMPLOYMENT_WEIGHT);
    const variation = 0.9 + campaignRng.population.next() * 0.2;
    const populationUnits = Math.max(1, Math.round(landArea * populationWeight * variation));
    const employmentUnits = Math.max(1, Math.round(landArea * employmentWeight * (0.9 + campaignRng.population.next() * 0.2)));
    const meanDistance = tiles.reduce((sum, tile) => sum + Math.abs(tile.x - foundation.center.coordinate.x) + Math.abs(tile.y - foundation.center.coordinate.y), 0) / landArea;
    return [{
      ...anchor,
      anchor: Object.freeze({ ...anchor.coordinate }),
      tiles: Object.freeze(tiles.map((tile) => Object.freeze(tile))),
      landArea,
      populationUnits,
      employmentUnits,
      centrality: Math.max(0, Math.min(100, Math.round(100 - meanDistance * (100 / (terrain.width + terrain.height))))),
      populationShareBps: 0,
      employmentShareBps: 0,
    }];
  });

  const populationShares = allocateShares(districts.map(({ populationUnits }) => ({ weight: populationUnits })));
  const employmentShares = allocateShares(districts.map(({ employmentUnits }) => ({ weight: employmentUnits })));
  const frozenDistricts = districts.map((district, index) => Object.freeze({
    id: district.id,
    kind: district.kind,
    anchor: district.anchor,
    tiles: district.tiles,
    landArea: district.landArea,
    populationUnits: district.populationUnits,
    employmentUnits: district.employmentUnits,
    centrality: district.centrality,
    populationShareBps: populationShares[index],
    employmentShareBps: employmentShares[index],
  }));

  return Object.freeze({
    year: 1910 as const,
    districts: Object.freeze(frozenDistricts),
    districtByTile: Object.freeze(districtByTile.map((row) => Object.freeze(row))),
    totalLandArea: frozenDistricts.reduce((sum, district) => sum + district.landArea, 0),
    totalPopulationUnits: frozenDistricts.reduce((sum, district) => sum + district.populationUnits, 0),
    totalEmploymentUnits: frozenDistricts.reduce((sum, district) => sum + district.employmentUnits, 0),
  });
}
