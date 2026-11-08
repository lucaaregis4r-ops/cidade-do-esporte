import { describe, expect, it } from 'vitest';
import { World } from '../World';
import { deserializeWorldInto, serializeWorld, WORLD_SAVE_VERSION } from '../mapSerialization';
import { inspectTile } from '../../engine/inspectTile';

describe('B14/B15 annual city growth and transformation in the campaign World', () => {
  it('applies one deterministic B8 transition at the clock year boundary and persists it', () => {
    const first = new World(24, 24, { worldSeed: 'CM-B14-ANNUAL-GROWTH' });
    const second = new World(24, 24, { worldSeed: 'CM-B14-ANNUAL-GROWTH' });
    expect(first.getCityGrowthState()?.throughYear).toBe(1910);

    expect(first.setElapsedDays(364)).toBe(true);
    expect(second.setElapsedDays(364)).toBe(true);
    first.tick();
    second.tick();

    const growth = first.getCityGrowthState();
    expect(first.getDate()).toEqual({ year: 1911, month: 1, day: 1 });
    expect(growth?.throughYear).toBe(1911);
    expect(growth?.developments.length).toBeGreaterThan(0);
    expect(growth?.developments.length).toBeLessThanOrEqual(2);
    expect(growth).toEqual(second.getCityGrowthState());
    const firstDevelopment = growth!.developments[0];
    const developedParcel = first.getCityParcels1910()!.parcels.find((parcel) => parcel.id === firstDevelopment.parcelId)!;
    expect(inspectTile(first, developedParcel.tiles[0])?.city?.development).toMatchObject({
      kind: firstDevelopment.kind,
      year: 1911,
    });
    const throughBoundary = serializeWorld(first);

    first.tick();
    expect(first.getCityGrowthState()).toEqual(growth);

    const restored = new World(24, 24, { regenerate: false });
    expect(deserializeWorldInto(restored, throughBoundary)).toBe(true);
    expect(restored.getDate()).toEqual({ year: 1911, month: 1, day: 1 });
    expect(restored.getCityGrowthState()).toEqual(growth);
    expect(inspectTile(restored, developedParcel.tiles[0])?.city?.development?.year).toBe(1911);
    expect(JSON.parse(serializeWorld(restored)).v).toBe(WORLD_SAVE_VERSION);
  });

  it('ages saved campaign buildings and exposes the transformation on the main map after reload', () => {
    const world = new World(24, 24, { worldSeed: 'CM-B15-OBSERVABLE-TRANSFORMATION' });
    let daysBeforeNewYear = 364;
    for (let year = 1911; year <= 1959; year++) {
      expect(world.setElapsedDays(daysBeforeNewYear)).toBe(true);
      world.tick();
      daysBeforeNewYear += year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
    }
    expect(world.getDate()).toEqual({ year: 1959, month: 1, day: 1 });

    const transformation = world.getCityTransformationState()!;
    expect(transformation.throughYear).toBe(1959);
    expect(transformation.buildings.some(({ status }) => status !== 'active')).toBe(true);
    expect(transformation.buildings.some(({ densityUnits }) => densityUnits > 1)).toBe(true);
    expect(transformation.centralities.length).toBeGreaterThan(0);
    expect(transformation.avenueUpgrades.length).toBeGreaterThan(0);
    const changedBuilding = transformation.buildings.find(({ status }) => status !== 'active')!;
    const parcel = world.getCityParcels1910()!.parcels.find(({ id }) => id === changedBuilding.parcelId)!;
    expect(inspectTile(world, parcel.tiles[0])?.city?.transformation.buildings).toContainEqual(expect.objectContaining({
      status: changedBuilding.status,
      builtYear: changedBuilding.builtYear,
      demolishedYear: changedBuilding.demolishedYear,
    }));

    const target = new World(24, 24, { regenerate: false });
    expect(deserializeWorldInto(target, serializeWorld(world))).toBe(true);
    expect(target.getCityTransformationState()).toEqual(transformation);
    expect(inspectTile(target, parcel.tiles[0])?.city?.transformation.buildings).toContainEqual(expect.objectContaining({ status: changedBuilding.status }));
  });

  it('migrates v22 without inventing growth before the saved year', () => {
    const source = new World(24, 24, { worldSeed: 'CM-B14-V22-MIGRATION' });
    expect(source.setElapsedDays(365)).toBe(true);
    const legacy = JSON.parse(serializeWorld(source)) as Record<string, unknown>;
    legacy.v = 22;
    delete legacy.cityGrowth;

    const target = new World(24, 24, { regenerate: false });
    expect(deserializeWorldInto(target, JSON.stringify(legacy))).toBe(true);
    expect(target.getDate()).toEqual({ year: 1911, month: 1, day: 1 });
    expect(target.getCityGrowthState()).toMatchObject({
      baselineYear: 1911,
      throughYear: 1911,
      developments: [],
      roadExtensions: [],
      populationUnitsAdded: 0,
      jobUnitsAdded: 0,
    });
  });

  it('rejects a growth ledger pointing at an unknown parcel before mutating the target', () => {
    const source = new World(24, 24, { worldSeed: 'CM-B14-BAD-LEDGER' });
    expect(source.setElapsedDays(364)).toBe(true);
    source.tick();
    const invalid = JSON.parse(serializeWorld(source));
    invalid.cityGrowth.developments[0].parcelId = 'parcel-does-not-exist';

    const target = new World(24, 24, { regenerate: false, worldSeed: 'CM-B14-UNCHANGED' });
    const before = serializeWorld(target);
    expect(deserializeWorldInto(target, JSON.stringify(invalid))).toBe(false);
    expect(serializeWorld(target)).toBe(before);
  });
});
