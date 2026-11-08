import type { CampaignRng } from '../CampaignRng';
import { MAX_ELEVATION, SEA_LEVEL } from '../Terrain';
import type { TileCoord } from '../../types/coordinates';
import type { CityState } from './CityState';
import type { CityTerrain } from './cityTerrain';

export type RailwayAxis = 'east-west' | 'north-south';

export interface HistoricalCenter {
  readonly id: 'historical-center-1910';
  readonly coordinate: Readonly<TileCoord>;
  readonly establishedYear: 1910;
}

export interface CityRailway {
  readonly id: 'railway-1910';
  readonly axis: RailwayAxis;
  readonly station: Readonly<TileCoord>;
  readonly path: readonly Readonly<TileCoord>[];
  readonly operationalYear: 1910;
}

export type CityRoadKind = 'main-street' | 'commercial-street' | 'workshop-access' | 'industrial-access';

export interface CityRoad {
  readonly id: string;
  readonly kind: CityRoadKind;
  readonly path: readonly Readonly<TileCoord>[];
  readonly establishedYear: 1910;
}

export type CityInstitutionKind =
  | 'railway-station'
  | 'public-square'
  | 'commercial-cluster'
  | 'railway-workshops'
  | 'small-industry';

export interface CityInstitution {
  readonly id: string;
  readonly kind: CityInstitutionKind;
  readonly coordinate: Readonly<TileCoord>;
  readonly establishedYear: 1910;
}

export interface CityFoundation1910 {
  readonly year: 1910;
  readonly center: HistoricalCenter;
  readonly railway: CityRailway;
  readonly roads: readonly CityRoad[];
  readonly institutions: readonly CityInstitution[];
}

type EdgeDirection = 'west' | 'east' | 'north' | 'south';

const NEIGHBORS: readonly Readonly<TileCoord>[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

function validateCityTerrain(terrain: CityTerrain): void {
  if (
    !Number.isInteger(terrain.width) ||
    !Number.isInteger(terrain.height) ||
    terrain.width < 16 ||
    terrain.height < 16 ||
    terrain.elevations.length !== terrain.height ||
    terrain.waterMask.length !== terrain.height
  ) {
    throw new RangeError('1910 city foundation requires matching terrain grids of at least 16×16');
  }

  for (let y = 0; y < terrain.height; y++) {
    if (terrain.elevations[y].length !== terrain.width || terrain.waterMask[y].length !== terrain.width) {
      throw new RangeError('City terrain rows must match the declared width');
    }
    for (let x = 0; x < terrain.width; x++) {
      const elevation = terrain.elevations[y][x];
      if (!Number.isInteger(elevation) || elevation < 0 || elevation > MAX_ELEVATION) {
        throw new RangeError(`Invalid terrain elevation at (${x}, ${y})`);
      }
      if (terrain.waterMask[y][x] ? elevation !== SEA_LEVEL : elevation <= SEA_LEVEL) {
        throw new RangeError(`Terrain water/elevation mismatch at (${x}, ${y})`);
      }
    }
  }
}

function isLand(terrain: CityTerrain, x: number, y: number): boolean {
  return x >= 0 && x < terrain.width && y >= 0 && y < terrain.height && !terrain.waterMask[y][x];
}

function findLandPath(
  terrain: CityTerrain,
  start: TileCoord,
  goal: (coordinate: TileCoord) => boolean,
): TileCoord[] | null {
  const width = terrain.width;
  const startIndex = start.y * width + start.x;
  const previous = new Int32Array(width * terrain.height).fill(-2);
  const queue = new Int32Array(width * terrain.height);
  let head = 0;
  let tail = 0;
  queue[tail++] = startIndex;
  previous[startIndex] = -1;

  while (head < tail) {
    const index = queue[head++];
    const coordinate = { x: index % width, y: Math.floor(index / width) };
    if (goal(coordinate)) {
      const path: TileCoord[] = [];
      let cursor = index;
      while (cursor >= 0) {
        path.push({ x: cursor % width, y: Math.floor(cursor / width) });
        cursor = previous[cursor];
      }
      return path.reverse();
    }

    for (const offset of NEIGHBORS) {
      const x = coordinate.x + offset.x;
      const y = coordinate.y + offset.y;
      if (!isLand(terrain, x, y)) continue;
      const neighborIndex = y * width + x;
      if (previous[neighborIndex] !== -2) continue;
      previous[neighborIndex] = index;
      queue[tail++] = neighborIndex;
    }
  }

  return null;
}

function getCenterCandidates(terrain: CityTerrain): TileCoord[] {
  const candidates: TileCoord[] = [];
  for (let y = 1; y < terrain.height - 1; y++) {
    for (let x = 1; x < terrain.width - 1; x++) {
      let minElevation: number = MAX_ELEVATION;
      let maxElevation: number = 0;
      let neighborhoodIsLand = true;
      for (let dy = -1; dy <= 1 && neighborhoodIsLand; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (!isLand(terrain, nx, ny)) {
            neighborhoodIsLand = false;
            break;
          }
          const elevation = terrain.elevations[ny][nx];
          minElevation = Math.min(minElevation, elevation);
          maxElevation = Math.max(maxElevation, elevation);
        }
      }
      if (neighborhoodIsLand && maxElevation - minElevation <= 1) candidates.push({ x, y });
    }
  }
  return candidates;
}

function edgeGoal(direction: EdgeDirection, width: number, height: number): (coordinate: TileCoord) => boolean {
  switch (direction) {
    case 'west': return ({ x }) => x === 0;
    case 'east': return ({ x }) => x === width - 1;
    case 'north': return ({ y }) => y === 0;
    case 'south': return ({ y }) => y === height - 1;
  }
}

function buildRailway(
  terrain: CityTerrain,
  center: TileCoord,
  campaignRng: CampaignRng,
): { axis: RailwayAxis; station: TileCoord; path: TileCoord[] } {
  const preferredAxis: RailwayAxis = campaignRng.city.next() < 0.5 ? 'east-west' : 'north-south';
  const axes: RailwayAxis[] = [preferredAxis, preferredAxis === 'east-west' ? 'north-south' : 'east-west'];

  for (const axis of axes) {
    const candidates: TileCoord[] = [];
    for (let y = 1; y < terrain.height - 1; y++) {
      for (let x = 1; x < terrain.width - 1; x++) {
        const distance = Math.abs(x - center.x) + Math.abs(y - center.y);
        if (distance < 2 || distance > 8 || !isLand(terrain, x, y)) continue;
        if (axis === 'east-west' ? y !== center.y : x !== center.x) continue;
        candidates.push({ x, y });
      }
    }
    candidates.sort((a, b) =>
      Math.abs(a.x - center.x) + Math.abs(a.y - center.y) -
        (Math.abs(b.x - center.x) + Math.abs(b.y - center.y)) ||
      a.y - b.y || a.x - b.x,
    );

    for (const station of candidates) {
      const firstDirection: EdgeDirection = axis === 'east-west' ? 'west' : 'north';
      const secondDirection: EdgeDirection = axis === 'east-west' ? 'east' : 'south';
      const firstPath = findLandPath(terrain, station, edgeGoal(firstDirection, terrain.width, terrain.height));
      if (!firstPath) continue;
      const secondPath = findLandPath(terrain, station, edgeGoal(secondDirection, terrain.width, terrain.height));
      if (!secondPath) continue;
      const centerPath = findLandPath(terrain, station, (coordinate) => coordinate.x === center.x && coordinate.y === center.y);
      if (!centerPath) continue;
      const path = [...firstPath.reverse(), ...secondPath.slice(1)];
      return { axis, station, path };
    }
  }

  throw new Error('Unable to route a 1910 railway through connected dry terrain');
}

function findInstitutionSite(
  terrain: CityTerrain,
  origin: TileCoord,
  minDistance: number,
  maxDistance: number,
  occupied: Set<number>,
): TileCoord {
  const candidates: TileCoord[] = [];
  for (let y = 0; y < terrain.height; y++) {
    for (let x = 0; x < terrain.width; x++) {
      const distance = Math.abs(x - origin.x) + Math.abs(y - origin.y);
      if (distance < minDistance || distance > maxDistance || !isLand(terrain, x, y)) continue;
      const key = y * terrain.width + x;
      if (!occupied.has(key)) candidates.push({ x, y });
    }
  }
  candidates.sort((a, b) =>
    Math.abs(a.x - origin.x) + Math.abs(a.y - origin.y) -
      (Math.abs(b.x - origin.x) + Math.abs(b.y - origin.y)) ||
    a.y - b.y || a.x - b.x,
  );
  const site = candidates[0];
  if (!site) throw new Error('Unable to place a 1910 city institution on dry terrain');
  occupied.add(site.y * terrain.width + site.x);
  return site;
}

function immutableCoordinate(coordinate: TileCoord): Readonly<TileCoord> {
  return Object.freeze({ x: coordinate.x, y: coordinate.y });
}

function immutablePath(path: readonly TileCoord[]): readonly Readonly<TileCoord>[] {
  return Object.freeze(path.map(immutableCoordinate));
}

function makeInstitution(kind: CityInstitutionKind, coordinate: TileCoord): CityInstitution {
  return Object.freeze({
    id: `city-institution-1910-${kind}`,
    kind,
    coordinate: immutableCoordinate(coordinate),
    establishedYear: 1910,
  });
}

function connectRoad(
  terrain: CityTerrain,
  id: string,
  kind: CityRoadKind,
  start: TileCoord,
  end: TileCoord,
): CityRoad {
  const path = findLandPath(terrain, start, (coordinate) => coordinate.x === end.x && coordinate.y === end.y);
  if (!path) throw new Error(`Unable to route city road ${id} over dry terrain`);
  return Object.freeze({ id, kind, path: immutablePath(path), establishedYear: 1910 });
}

/** Build the compact fictional urban core that exists when the campaign starts in 1910. */
export function generateCityFoundation1910(
  city: CityState,
  terrain: CityTerrain,
  campaignRng: CampaignRng,
): CityFoundation1910 {
  if (city.asOf.year !== 1910) throw new RangeError('Initial city foundation can only be generated in 1910');
  if (campaignRng.worldSeed !== city.worldSeed) {
    throw new TypeError('City state and campaign RNG must use the same worldSeed');
  }
  validateCityTerrain(terrain);

  const candidates = getCenterCandidates(terrain);
  if (candidates.length === 0) throw new Error('Terrain has no flat, dry site for the historical center');
  const midpoint = { x: (terrain.width - 1) / 2, y: (terrain.height - 1) / 2 };
  candidates.sort((a, b) =>
    Math.abs(a.x - midpoint.x) + Math.abs(a.y - midpoint.y) -
      (Math.abs(b.x - midpoint.x) + Math.abs(b.y - midpoint.y)) ||
    a.y - b.y || a.x - b.x,
  );
  const nearestDistance = Math.abs(candidates[0].x - midpoint.x) + Math.abs(candidates[0].y - midpoint.y);
  const centralCandidates = candidates.filter(
    (candidate) => Math.abs(candidate.x - midpoint.x) + Math.abs(candidate.y - midpoint.y) <= nearestDistance + 2,
  );
  const centerCoordinate = centralCandidates[Math.floor(campaignRng.city.next() * centralCandidates.length)];
  const railway = buildRailway(terrain, centerCoordinate, campaignRng);

  const occupied = new Set<number>([
    centerCoordinate.y * terrain.width + centerCoordinate.x,
    railway.station.y * terrain.width + railway.station.x,
  ]);
  const commerce = findInstitutionSite(terrain, centerCoordinate, 1, 4, occupied);
  const workshops = findInstitutionSite(terrain, railway.station, 1, 3, occupied);
  const industry = findInstitutionSite(terrain, railway.station, 4, 8, occupied);
  const centerPath = findLandPath(terrain, railway.station, (coordinate) =>
    coordinate.x === centerCoordinate.x && coordinate.y === centerCoordinate.y,
  );
  if (!centerPath) throw new Error('Historical center must be connected to the railway station');

  const roads = [
    Object.freeze({ id: 'road-1910-station-to-center', kind: 'main-street' as const, path: immutablePath(centerPath), establishedYear: 1910 as const }),
    connectRoad(terrain, 'road-1910-center-to-commerce', 'commercial-street', centerCoordinate, commerce),
    connectRoad(terrain, 'road-1910-station-to-workshops', 'workshop-access', railway.station, workshops),
    connectRoad(terrain, 'road-1910-station-to-industry', 'industrial-access', railway.station, industry),
  ];

  const institutions = [
    makeInstitution('railway-station', railway.station),
    makeInstitution('public-square', centerCoordinate),
    makeInstitution('commercial-cluster', commerce),
    makeInstitution('railway-workshops', workshops),
    makeInstitution('small-industry', industry),
  ];

  const center: HistoricalCenter = Object.freeze({
    id: 'historical-center-1910',
    coordinate: immutableCoordinate(centerCoordinate),
    establishedYear: 1910,
  });
  const railwayRecord: CityRailway = Object.freeze({
    id: 'railway-1910',
    axis: railway.axis,
    station: immutableCoordinate(railway.station),
    path: immutablePath(railway.path),
    operationalYear: 1910,
  });

  return Object.freeze({
    year: 1910,
    center,
    railway: railwayRecord,
    roads: Object.freeze(roads),
    institutions: Object.freeze(institutions),
  });
}
