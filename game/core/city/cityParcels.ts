import { daysInMonth, type GameDate } from '../HistoricalClock';
import type { TileCoord } from '../../types/coordinates';
import type { CityState } from './CityState';
import type { CityDistricts1910 } from './cityDistricts';
import type { CityFoundation1910 } from './cityFoundation';
import type { CityTerrain } from './cityTerrain';

export interface ParcelTransaction {
  readonly id: string;
  readonly date: Readonly<GameDate>;
  /** Nominal internal purchasing-power units; no 1910 prices are invented here. */
  readonly pricePpu: number;
  /** Null records that the historical seller is unknown. */
  readonly sellerId: string | null;
  readonly buyerId: string;
}

export type ParcelEventKind = 'parcel-established' | 'ownership-transferred';

export interface ParcelHistoricalEvent {
  readonly id: string;
  readonly date: Readonly<GameDate>;
  readonly kind: ParcelEventKind;
  readonly description: string;
}

export interface CityParcel {
  readonly id: string;
  readonly tiles: readonly Readonly<TileCoord>[];
  readonly area: number;
  readonly terrainDifficulty: number;
  readonly districtId: string;
  readonly ownerId?: string;
  /** Filled only after the historical economy and land-value systems are implemented. */
  readonly landValuePpu?: number;
  readonly centrality: number;
  readonly accessibility: number;
  readonly railAccess: number;
  readonly roadAccess: number;
  /** Abstract district units, not calibrated historical residents. */
  readonly neighborhoodPopulation: number;
  /** Deferred until there is an approved historical income model. */
  readonly neighborhoodIncomeIndex?: number;
  readonly prestige?: number;
  readonly developmentPressure?: number;
  readonly purchaseHistory: readonly ParcelTransaction[];
  readonly historicalEvents: readonly ParcelHistoricalEvent[];
}

export interface CityParcels1910 {
  readonly year: 1910;
  readonly parcels: readonly CityParcel[];
  /** Null denotes water. Every dry tile belongs to exactly one parcel. */
  readonly parcelByTile: readonly (readonly (string | null)[])[];
  readonly totalLandArea: number;
}

const MAX_PARCEL_TILES = 6;
const NEIGHBORS: readonly Readonly<TileCoord>[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

function assertDate(date: GameDate): void {
  if (
    !date || !Number.isInteger(date.year) || date.year < 1910 || date.year > 1959 ||
    !Number.isInteger(date.month) || date.month < 1 || date.month > 12 ||
    !Number.isInteger(date.day) || date.day < 1 || date.day > daysInMonth(date.year, date.month)
  ) throw new RangeError('Parcel event date must be a valid campaign date from 1910 through 1959');
}

function compareDates(a: GameDate, b: GameDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

function validateInputs(city: CityState, terrain: CityTerrain, districts: CityDistricts1910, foundation: CityFoundation1910): void {
  if (city.asOf.year !== 1910 || districts.year !== 1910 || foundation.year !== 1910) {
    throw new RangeError('1910 parcels require a 1910 city, districts, and foundation');
  }
  if (terrain.width < 16 || terrain.height < 16 || terrain.elevations.length !== terrain.height || terrain.waterMask.length !== terrain.height) {
    throw new RangeError('1910 parcels require matching terrain grids of at least 16×16');
  }
  if (districts.districtByTile.length !== terrain.height || districts.districtByTile.some((row) => row.length !== terrain.width)) {
    throw new RangeError('District map dimensions must match city terrain');
  }
  for (let y = 0; y < terrain.height; y++) {
    if (terrain.elevations[y].length !== terrain.width || terrain.waterMask[y].length !== terrain.width) {
      throw new RangeError('City terrain rows must match the declared width');
    }
  }
}

function terrainDifficulty(tiles: readonly TileCoord[], terrain: CityTerrain): number {
  let totalRelief = 0;
  for (const tile of tiles) {
    const neighbors = NEIGHBORS
      .map(({ x, y }) => ({ x: tile.x + x, y: tile.y + y }))
      .filter(({ x, y }) => x >= 0 && x < terrain.width && y >= 0 && y < terrain.height && !terrain.waterMask[y][x]);
    if (neighbors.length === 0) continue;
    const elevation = terrain.elevations[tile.y][tile.x];
    const meanDifference = neighbors.reduce((sum, point) => sum + Math.abs(elevation - terrain.elevations[point.y][point.x]), 0) / neighbors.length;
    totalRelief += meanDifference;
  }
  return Math.max(0, Math.min(100, Math.round((totalRelief / tiles.length) * 25)));
}

function proximityAccess(tiles: readonly TileCoord[], routes: readonly (readonly Readonly<TileCoord>[])[], width: number, height: number): number {
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const tile of tiles) {
    for (const route of routes) {
      for (const point of route) {
        nearestDistance = Math.min(nearestDistance, Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y));
      }
    }
  }
  const maxDistance = width + height - 2;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - nearestDistance / maxDistance))));
}

function buildParcelsForDistrict(
  districtId: string,
  districtTiles: readonly Readonly<TileCoord>[],
  terrain: CityTerrain,
  city: CityState,
  centrality: number,
  neighborhoodPopulation: number,
  roadRoutes: readonly (readonly Readonly<TileCoord>[])[],
  railRoutes: readonly (readonly Readonly<TileCoord>[])[],
): CityParcel[] {
  const districtIndices = new Set(districtTiles.map(({ x, y }) => y * terrain.width + x));
  const visited = new Set<number>();
  const tilesByParcel: TileCoord[][] = [];
  for (const seed of [...districtTiles].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const seedIndex = seed.y * terrain.width + seed.x;
    if (visited.has(seedIndex)) continue;
    const queue: TileCoord[] = [seed as TileCoord];
    const group: TileCoord[] = [];
    visited.add(seedIndex);
    for (let head = 0; head < queue.length && group.length < MAX_PARCEL_TILES; head++) {
      const current = queue[head];
      group.push(current);
      for (const offset of NEIGHBORS) {
        const x = current.x + offset.x;
        const y = current.y + offset.y;
        const index = y * terrain.width + x;
        if (x < 0 || x >= terrain.width || y < 0 || y >= terrain.height || !districtIndices.has(index) || visited.has(index)) continue;
        if (group.length + queue.length - head - 1 >= MAX_PARCEL_TILES) continue;
        visited.add(index);
        queue.push({ x, y });
      }
    }
    tilesByParcel.push(group);
  }

  return tilesByParcel.map((tiles) => {
    const sortedTiles = tiles.sort((a, b) => a.y - b.y || a.x - b.x);
    const first = sortedTiles[0];
    const parcelId = `parcel-1910-${districtId}-${first.x}-${first.y}`;
    const events: ParcelHistoricalEvent[] = [Object.freeze({
      id: `${parcelId}-established`,
      date: Object.freeze({ ...city.asOf }),
      kind: 'parcel-established',
      description: 'Parcel boundary recorded in the 1910 city baseline.',
    })];
    return Object.freeze({
      id: parcelId,
      tiles: Object.freeze(sortedTiles.map((tile) => Object.freeze(tile))),
      area: sortedTiles.length,
      terrainDifficulty: terrainDifficulty(sortedTiles, terrain),
      districtId,
      centrality,
      accessibility: Math.round((proximityAccess(sortedTiles, roadRoutes, terrain.width, terrain.height) + proximityAccess(sortedTiles, railRoutes, terrain.width, terrain.height)) / 2),
      railAccess: proximityAccess(sortedTiles, railRoutes, terrain.width, terrain.height),
      roadAccess: proximityAccess(sortedTiles, roadRoutes, terrain.width, terrain.height),
      neighborhoodPopulation,
      purchaseHistory: Object.freeze([]),
      historicalEvents: Object.freeze(events),
    });
  });
}

/** Partitions every dry 1910 tile into stable, connected parcels without inventing ownership or prices. */
export function generateCityParcels1910(
  city: CityState,
  terrain: CityTerrain,
  districts: CityDistricts1910,
  foundation: CityFoundation1910,
): CityParcels1910 {
  validateInputs(city, terrain, districts, foundation);
  const roads = foundation.roads.map(({ path }) => path);
  const rails = [foundation.railway.path];
  const parcels = districts.districts.flatMap((district) =>
    buildParcelsForDistrict(
      district.id,
      district.tiles,
      terrain,
      city,
      district.centrality,
      district.populationUnits,
      roads,
      rails,
    ),
  );
  const parcelByTile: (string | null)[][] = Array.from({ length: terrain.height }, () => Array(terrain.width).fill(null));
  for (const parcel of parcels) {
    for (const { x, y } of parcel.tiles) {
      if (parcelByTile[y][x] !== null) throw new Error(`Overlapping city parcels at (${x}, ${y})`);
      parcelByTile[y][x] = parcel.id;
    }
  }
  for (let y = 0; y < terrain.height; y++) {
    for (let x = 0; x < terrain.width; x++) {
      if (terrain.waterMask[y][x] !== (parcelByTile[y][x] === null)) {
        throw new Error(`City parcel partition mismatch at (${x}, ${y})`);
      }
    }
  }
  return Object.freeze({
    year: 1910 as const,
    parcels: Object.freeze(parcels),
    parcelByTile: Object.freeze(parcelByTile.map((row) => Object.freeze(row))),
    totalLandArea: parcels.reduce((sum, parcel) => sum + parcel.area, 0),
  });
}

/** Record a purchase without erasing earlier transactions or events. */
export function recordParcelPurchase(parcel: CityParcel, transaction: ParcelTransaction): CityParcel {
  assertDate(transaction.date);
  if (!transaction.id || !transaction.buyerId || (transaction.sellerId !== null && !transaction.sellerId)) {
    throw new TypeError('Parcel transaction requires an ID, buyer, and explicit seller or null');
  }
  if (!Number.isFinite(transaction.pricePpu) || transaction.pricePpu < 0) throw new RangeError('Parcel transaction price must be a finite non-negative PPU amount');
  if (transaction.date.year < parcel.historicalEvents[0].date.year) throw new RangeError('Parcel transaction predates its establishment');
  if (parcel.purchaseHistory.some(({ id }) => id === transaction.id)) throw new TypeError('Parcel transaction IDs must be unique');
  if (parcel.ownerId !== undefined && transaction.sellerId !== parcel.ownerId) throw new TypeError('Parcel seller must match the current owner');
  if (parcel.ownerId === undefined && transaction.sellerId !== null) throw new TypeError('An unassigned parcel requires a null historical seller');
  if (parcel.ownerId === transaction.buyerId) throw new TypeError('Parcel buyer must differ from its current owner');
  const previousDate = parcel.purchaseHistory.at(-1)?.date ?? parcel.historicalEvents.at(-1)?.date;
  if (previousDate && compareDates(transaction.date, previousDate) < 0) throw new RangeError('Parcel transactions must be chronological');
  const frozenTransaction = Object.freeze({ ...transaction, date: Object.freeze({ ...transaction.date }) });
  const event = Object.freeze({
    id: `${transaction.id}-ownership-event`,
    date: frozenTransaction.date,
    kind: 'ownership-transferred' as const,
    description: `Ownership transferred to ${transaction.buyerId}.`,
  });
  return Object.freeze({
    ...parcel,
    ownerId: transaction.buyerId,
    purchaseHistory: Object.freeze([...parcel.purchaseHistory, frozenTransaction]),
    historicalEvents: Object.freeze([...parcel.historicalEvents, event]),
  });
}
