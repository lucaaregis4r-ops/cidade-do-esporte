import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createCityState } from './CityState';
import { generateCityDistricts1910 } from './cityDistricts';
import { generateCityFoundation1910 } from './cityFoundation';
import { generateCityParcels1910, recordParcelPurchase } from './cityParcels';
import { generateCityTerrain } from './cityTerrain';

function generate(seed: string, width = 32, height = 32) {
  const city = createCityState(seed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(seed);
  const terrain = generateCityTerrain(city, rng, width, height);
  const foundation = generateCityFoundation1910(city, terrain, rng);
  const districts = generateCityDistricts1910(city, terrain, foundation, rng);
  const parcels = generateCityParcels1910(city, terrain, districts, foundation);
  return { city, terrain, foundation, districts, parcels };
}

function isConnected(tiles: readonly { x: number; y: number }[]): boolean {
  if (tiles.length === 0) return false;
  const remaining = new Set(tiles.map(({ x, y }) => `${x},${y}`));
  const first = tiles[0];
  const queue = [first];
  remaining.delete(`${first.x},${first.y}`);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const neighbor of [
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
    ]) {
      if (!remaining.delete(`${neighbor.x},${neighbor.y}`)) continue;
      queue.push(neighbor);
    }
  }
  return remaining.size === 0;
}

describe('generateCityParcels1910', () => {
  it('partitions each dry tile exactly once into connected parcels within its district', () => {
    const { terrain, districts, parcels } = generate('CM-1910-parcels');
    const dryCount = terrain.waterMask.flat().filter((isWater) => !isWater).length;
    expect(parcels.totalLandArea).toBe(dryCount);
    expect(parcels.parcels.reduce((sum, parcel) => sum + parcel.area, 0)).toBe(dryCount);
    expect(parcels.parcels.every((parcel) => parcel.area > 0 && parcel.area <= 6 && isConnected(parcel.tiles))).toBe(true);
    for (const parcel of parcels.parcels) {
      expect(districts.districts.some((district) => district.id === parcel.districtId)).toBe(true);
      for (const tile of parcel.tiles) {
        expect(terrain.waterMask[tile.y][tile.x]).toBe(false);
        expect(districts.districtByTile[tile.y][tile.x]).toBe(parcel.districtId);
        expect(parcels.parcelByTile[tile.y][tile.x]).toBe(parcel.id);
      }
    }
    for (let y = 0; y < terrain.height; y++) {
      for (let x = 0; x < terrain.width; x++) {
        expect(parcels.parcelByTile[y][x] === null).toBe(terrain.waterMask[y][x]);
      }
    }
  });

  it('creates stable parcel IDs and finite terrain/access metrics without inventing owners or prices', () => {
    const first = generate('CM-1910-stable-parcels');
    const second = generate('CM-1910-stable-parcels');
    expect(first.parcels).toEqual(second.parcels);
    for (const parcel of first.parcels.parcels) {
      for (const value of [parcel.terrainDifficulty, parcel.centrality, parcel.accessibility, parcel.railAccess, parcel.roadAccess]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
      expect(parcel.ownerId).toBeUndefined();
      expect(parcel.landValuePpu).toBeUndefined();
      expect(parcel.purchaseHistory).toEqual([]);
      expect(parcel.historicalEvents).toHaveLength(1);
    }
  });

  it('preserves purchase history and biography as ownership changes', () => {
    const { parcels } = generate('CM-1910-biography');
    const parcel = parcels.parcels[0];
    const firstPurchase = recordParcelPurchase(parcel, {
      id: 'transaction-1',
      date: { year: 1911, month: 3, day: 4 },
      pricePpu: 120,
      sellerId: null,
      buyerId: 'household-a',
    });
    const resale = recordParcelPurchase(firstPurchase, {
      id: 'transaction-2',
      date: { year: 1920, month: 7, day: 8 },
      pricePpu: 250,
      sellerId: 'household-a',
      buyerId: 'institution-b',
    });
    expect(parcel.ownerId).toBeUndefined();
    expect(parcel.purchaseHistory).toHaveLength(0);
    expect(resale.ownerId).toBe('institution-b');
    expect(resale.purchaseHistory.map(({ id }) => id)).toEqual(['transaction-1', 'transaction-2']);
    expect(resale.historicalEvents.map(({ kind }) => kind)).toEqual([
      'parcel-established',
      'ownership-transferred',
      'ownership-transferred',
    ]);
  });

  it('rejects invalid, duplicate, out-of-order, and wrong-owner transactions', () => {
    const { parcels } = generate('CM-1910-invalid-transaction');
    const parcel = recordParcelPurchase(parcels.parcels[0], {
      id: 'transaction-current',
      date: { year: 1911, month: 1, day: 1 },
      pricePpu: 10,
      sellerId: null,
      buyerId: 'owner-a',
    });
    const transaction = { id: 'transaction-next', date: { year: 1912, month: 1, day: 1 }, pricePpu: 20, sellerId: 'owner-a', buyerId: 'owner-b' };
    expect(() => recordParcelPurchase(parcel, { ...transaction, sellerId: 'wrong-owner' })).toThrow(TypeError);
    expect(() => recordParcelPurchase(parcel, { ...transaction, pricePpu: Number.NaN })).toThrow(RangeError);
    expect(() => recordParcelPurchase(parcel, { ...transaction, id: 'transaction-current' })).toThrow(TypeError);
    expect(() => recordParcelPurchase(parcel, { ...transaction, date: { year: 1910, month: 1, day: 1 } })).toThrow(RangeError);
  });

  it('rejects non-1910 parcel inputs', () => {
    const { city, terrain, districts, foundation } = generate('CM-1910-parcel-date');
    const laterCity = createCityState(city.worldSeed, { year: 1911, month: 1, day: 1 });
    expect(() => generateCityParcels1910(laterCity, terrain, districts, foundation)).toThrow(RangeError);
  });

  it('partitions a range of generated seeds without gaps or overlaps', () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = generate(`CM-1910-b5-${seed}`);
      const dry = result.terrain.waterMask.flat().filter((isWater) => !isWater).length;
      expect(result.parcels.totalLandArea).toBe(dry);
    }
  });
});
