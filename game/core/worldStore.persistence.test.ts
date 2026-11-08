import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { World } from './World';
import { serializeWorld } from './mapSerialization';
import { clearSave, getPersistenceNotice, getWorld, LEGACY_STORAGE_KEY, PREVIOUS_STORAGE_KEY, V20_STORAGE_KEY, V22_STORAGE_KEY, V23_STORAGE_KEY, saveWorld, STORAGE_KEY } from './worldStore';

const cache = globalThis as unknown as { __cimulityWorld?: World; __cimulityWorldGuard?: string };
let data: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> };

beforeEach(() => {
  delete cache.__cimulityWorld;
  delete cache.__cimulityWorldGuard;
  data = new Map();
  storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    removeItem: vi.fn((key: string) => data.delete(key)),
  };
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  delete cache.__cimulityWorld;
  delete cache.__cimulityWorldGuard;
  vi.unstubAllGlobals();
});

function legacySave(): string {
  const source = new World(64, 64, { regenerate: false });
  source.setElapsedDays(31);
  source.setMoney(4321);
  const value = JSON.parse(serializeWorld(source));
  value.v = 19;
  delete value.campaign;
  return JSON.stringify(value);
}

function previousSave(): string {
  const source = new World(64, 64, { regenerate: false });
  source.setElapsedDays(12);
  const value = JSON.parse(serializeWorld(source));
  value.v = 20;
  delete value.campaign.decisions;
  return JSON.stringify(value);
}

function v22Save(): string {
  const source = new World(64, 64, { worldSeed: 'CM-B14-V22-STORE' });
  source.setElapsedDays(365);
  const value = JSON.parse(serializeWorld(source));
  value.v = 22;
  delete value.cityGrowth;
  return JSON.stringify(value);
}

describe('persistent campaign safety', { timeout: 20000 }, () => {
  it('loads v19, reports migration, writes v25 and preserves original bytes', () => {
    const original = legacySave();
    data.set(LEGACY_STORAGE_KEY, original);
    const world = getWorld();
    expect(world.getMoney()).toBe(4321);
    expect(world.getElapsedDays()).toBe(31);
    expect(getPersistenceNotice()).toContain('v19 migrated');
    expect(saveWorld(world)).toBe(true);
    expect(JSON.parse(data.get(STORAGE_KEY)!).v).toBe(25);
    expect(data.get(LEGACY_STORAGE_KEY)).toBe(original);
  });

  it('loads v20, preserves its bytes and refuses a false complete replay history', () => {
    const original = previousSave();
    data.set(V20_STORAGE_KEY, original);
    const world = getWorld();
    expect(world.getElapsedDays()).toBe(12);
    expect(world.getDecisionLog()).toEqual({ version: 1, completeFromStart: false, entries: [] });
    expect(getPersistenceNotice()).toContain('v20 migrated');
    expect(saveWorld(world)).toBe(true);
    expect(JSON.parse(data.get(STORAGE_KEY)!).v).toBe(25);
    expect(data.get(V20_STORAGE_KEY)).toBe(original);
  });

  it('loads v22, starts an empty growth ledger in its saved year and preserves the source', () => {
    const original = v22Save();
    data.set(V22_STORAGE_KEY, original);
    const world = getWorld();
    expect(world.getDate()).toEqual({ year: 1911, month: 1, day: 1 });
    expect(world.getCityGrowthState()).toMatchObject({ baselineYear: 1911, throughYear: 1911, developments: [] });
    expect(getPersistenceNotice()).toContain('v22 migrated');
    expect(saveWorld(world)).toBe(true);
    expect(JSON.parse(data.get(STORAGE_KEY)!).v).toBe(25);
    expect(data.get(V22_STORAGE_KEY)).toBe(original);
  });

  it('loads v23, reconstructs only transformations supported by the saved B14 growth ledger', () => {
    const source = new World(64, 64, { worldSeed: 'CM-B15-V23-STORE' });
    source.setElapsedDays(364);
    source.tick();
    const value = JSON.parse(serializeWorld(source));
    value.v = 23;
    delete value.cityTransformation;
    const original = JSON.stringify(value);
    data.set(V23_STORAGE_KEY, original);

    const world = getWorld();
    expect(world.getCityGrowthState()?.throughYear).toBe(1911);
    expect(world.getCityTransformationState()?.throughYear).toBe(1911);
    expect(world.getCityTransformationState()?.buildings.length).toBe(world.getCityGrowthState()?.developments.length);
    expect(getPersistenceNotice()).toContain('v23 migrated');
    expect(saveWorld(world)).toBe(true);
    expect(JSON.parse(data.get(STORAGE_KEY)!).v).toBe(25);
    expect(data.get(V23_STORAGE_KEY)).toBe(original);
  });

  it('loads v24, migrates to v25 with empty club state and preserves the source', () => {
    const source = new World(64, 64, { worldSeed: 'CM-B16-V24-STORE' });
    const value = JSON.parse(serializeWorld(source));
    value.v = 24;
    delete value.club;
    const original = JSON.stringify(value);
    data.set(PREVIOUS_STORAGE_KEY, original);

    const world = getWorld();
    expect(world.getClub()).toBeNull();
    expect(getPersistenceNotice()).toContain('v24 migrated');
    expect(saveWorld(world)).toBe(true);
    expect(JSON.parse(data.get(STORAGE_KEY)!).v).toBe(25);
    expect(data.get(PREVIOUS_STORAGE_KEY)).toBe(original);
  });

  it.each(['{broken', '', JSON.stringify({ v: 999 })])('protects unreadable current save %s from autosave', (raw) => {
    data.set(STORAGE_KEY, raw);
    data.set(LEGACY_STORAGE_KEY, legacySave());
    const world = getWorld();
    expect(getPersistenceNotice()).toContain('autosave is blocked');
    expect(saveWorld(world)).toBe(false);
    expect(data.get(STORAGE_KEY)).toBe(raw);
    expect(world.getMoney()).not.toBe(4321); // no silent fallback to a different campaign
    clearSave(); // explicit New City is the only destructive reset path
    expect(data.has(STORAGE_KEY)).toBe(false);
    expect(data.has(LEGACY_STORAGE_KEY)).toBe(false);
    expect(saveWorld(world)).toBe(true);
  });

  it('preserves corrupt legacy data without writing a replacement', () => {
    data.set(LEGACY_STORAGE_KEY, '{bad');
    expect(saveWorld(getWorld())).toBe(false);
    expect(data.get(LEGACY_STORAGE_KEY)).toBe('{bad');
    expect(data.has(STORAGE_KEY)).toBe(false);
  });

  it('keeps overwrite protection and its warning across a module reload', async () => {
    data.set(STORAGE_KEY, '{bad');
    const fallback = getWorld();
    vi.resetModules();
    const reloaded = await import('./worldStore');
    expect(reloaded.getWorld()).toBe(fallback);
    expect(reloaded.saveWorld(fallback)).toBe(false);
    expect(reloaded.getPersistenceNotice()).toContain('autosave is blocked');
    expect(data.get(STORAGE_KEY)).toBe('{bad');
  });

  it('surfaces quota failures and leaves the prior save intact', () => {
    const world = getWorld();
    expect(saveWorld(world)).toBe(true);
    const previous = data.get(STORAGE_KEY);
    storage.setItem.mockImplementation(() => { throw new Error('QuotaExceeded'); });
    world.tick();
    expect(saveWorld(world)).toBe(false);
    expect(data.get(STORAGE_KEY)).toBe(previous);
    expect(getPersistenceNotice()).toContain('Saving failed');
  });

  it('blocks writes after storage read failure', () => {
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError'); });
    const world = getWorld();
    expect(saveWorld(world)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(getPersistenceNotice()).toContain('unavailable');
  });

  it('reloads the current version rather than the retained legacy backup', () => {
    data.set(LEGACY_STORAGE_KEY, legacySave());
    const world = getWorld();
    world.setMoney(9000);
    saveWorld(world);
    delete cache.__cimulityWorld;
    delete cache.__cimulityWorldGuard;
    expect(getWorld().getMoney()).toBe(9000);
    expect(getPersistenceNotice()).toBeNull();
  });
});
