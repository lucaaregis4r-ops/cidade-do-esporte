import { describe, expect, it } from 'vitest';
import { World } from './World';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';
import { DEFAULT_WORLD_SEED, RNG_DOMAINS } from './CampaignRng';
import { MAX_CAMPAIGN_ELAPSED_DAYS } from './HistoricalClock';
import { InterruptionQueue } from './InterruptionQueue';
import { createTile, TileType } from './Tile';

function campaign() {
  const world = new World(8, 8, { regenerate: false, worldSeed: 'CM-A8-test' });
  world.setElapsedDays(59);
  world.enqueueInterruption({ id: 'claimed', kind: 'election', title: 'Election' });
  world.claimAutoPauseInterruption();
  world.setAutoPause('incident', false);
  world.enqueueInterruption({ id: 'disabled', kind: 'incident', title: 'Incident' });
  world.enqueueInterruption({ id: 'pending', kind: 'proposal', title: 'Proposal' });
  RNG_DOMAINS.forEach((domain, index) => {
    for (let n = 0; n <= index; n++) world.getRngStreams()[domain].next();
  });
  return world;
}

describe('campaign save v25', () => {
  it('restores seed, all streams, calendar, FIFO, policy and one-shot claims', () => {
    const source = campaign();
    const json = serializeWorld(source);
    const target = new World(8, 8, { worldSeed: 'different-target' });
    expect(deserializeWorldInto(target, json)).toBe(true);
    expect(serializeWorld(target)).toBe(json);
    expect(target.getDate()).toEqual(source.getDate());
    expect(target.claimAutoPauseInterruption()?.id).toBe('pending');
    expect(target.claimAutoPauseInterruption()).toBeNull();
    for (const domain of RNG_DOMAINS) {
      for (let i = 0; i < 20; i++) expect(target.getRngStreams()[domain].next()).toBe(source.getRngStreams()[domain].next());
    }
  });

  it('continues the same world through daily and monthly ticks after loading', () => {
    const source = campaign();
    source.getMap().setTile(0, 0, createTile(0, 0, TileType.ROAD));
    source.getMap().setTile(1, 0, createTile(1, 0, TileType.ZONE_RESIDENTIAL));
    source.markLaborDirty();
    source.markLandValueDirty();
    const target = new World(8, 8, { regenerate: false });
    expect(deserializeWorldInto(target, serializeWorld(source))).toBe(true);
    for (let day = 0; day < 90; day++) {
      source.getRngStreams().events.next();
      target.getRngStreams().events.next();
      expect(target.tick()).toEqual(source.tick());
      expect(serializeWorld(target)).toBe(serializeWorld(source));
    }
  });

  it('preserves deleted entity ID counters instead of reusing old IDs', () => {
    const source = campaign();
    source.getMap().getBuildings().setNextIdFloor(87);
    source.getStructureMap().setNextIdFloor(63);
    const target = new World(8, 8, { regenerate: false });
    expect(deserializeWorldInto(target, serializeWorld(source))).toBe(true);
    expect(target.getMap().getBuildings().getNextId()).toBe(88);
    expect(target.getStructureMap().getNextId()).toBe(64);
  });

  it.each([
    'missing', 'seed', 'foreignRng', 'rngState', 'clock', 'beyondEnd',
    'queue', 'duplicate', 'handled', 'config', 'futureDate', 'counter', 'decisions',
  ])('rejects corrupt %s atomically', (kind) => {
    const data = JSON.parse(serializeWorld(campaign()));
    const c = data.campaign;
    switch (kind) {
      case 'missing': delete data.campaign; break;
      case 'seed': c.worldSeed = ''; break;
      case 'foreignRng': c.rng.worldSeed = 'another-seed'; break;
      case 'rngState': c.rng.streams.football = -1; break;
      case 'clock': c.clock.elapsedDays++; break;
      case 'beyondEnd': data.d = c.clock.elapsedDays = MAX_CAMPAIGN_ELAPSED_DAYS + 1; break;
      case 'queue': c.interruptions = null; break;
      case 'duplicate': c.interruptions.entries.push(c.interruptions.entries[0]); break;
      case 'handled': c.interruptions.entries[0].autoPauseHandled = 'yes'; break;
      case 'config': delete c.interruptions.autoPauseConfig.final; break;
      case 'futureDate': c.interruptions.entries[0].interruption.date.year = 1959; break;
      case 'counter': c.nextIds.buildings = -1; break;
      case 'decisions': c.decisions.completeFromStart = 'yes'; break;
    }
    const target = campaign();
    const before = serializeWorld(target);
    expect(deserializeWorldInto(target, JSON.stringify(data))).toBe(false);
    expect(serializeWorld(target)).toBe(before);
  });

  it('migrates genuine v19 shape with explicit defaults without modifying its bytes', () => {
    const old = JSON.parse(serializeWorld(campaign()));
    old.v = 19;
    delete old.campaign;
    const bytes = JSON.stringify(old);
    const target = new World(8, 8, { regenerate: false, worldSeed: 'not-used' });
    expect(deserializeWorldInto(target, bytes)).toBe(true);
    expect(target.getWorldSeed()).toBe(DEFAULT_WORLD_SEED);
    expect(target.getElapsedDays()).toBe(59);
    expect(target.getInterruptions()).toEqual([]);
    expect(JSON.stringify(old)).toBe(bytes);
    const second = new World(8, 8, { regenerate: false });
    expect(deserializeWorldInto(second, serializeWorld(target))).toBe(true);
    expect(serializeWorld(second)).toBe(serializeWorld(target));
  });

  it.each([18, 26, 999])('rejects unsupported version %s', (v) => {
    const target = campaign();
    const before = serializeWorld(target);
    const data = { ...JSON.parse(before), v };
    expect(deserializeWorldInto(target, JSON.stringify(data))).toBe(false);
    expect(serializeWorld(target)).toBe(before);
  });

  it('does not expose mutable queue entries through snapshots', () => {
    const world = campaign();
    const state = world.getInterruptionState();
    state.entries[0].interruption.date.year = 1950;
    expect(world.getInterruptions()[0].date.year).toBe(1910);
    expect(world.restoreInterruptionState({})).toBe(false);
    expect(world.getInterruptions()).toHaveLength(3);
  });

  it('persists the decision log and its exact continuation', () => {
    const source = campaign();
    expect(source.recordDecision({
      day: source.getElapsedDays(),
      kind: 'click',
      tool: 'road',
      start: { x: 1, y: 1 },
      end: { x: 1, y: 1 },
    })).toBe(true);
    const target = campaign();
    expect(deserializeWorldInto(target, serializeWorld(source))).toBe(true);
    expect(target.getDecisionLog()).toEqual(source.getDecisionLog());
    expect(target.recordDecision({
      day: target.getElapsedDays(),
      kind: 'click',
      tool: 'road',
      start: { x: 2, y: 1 },
      end: { x: 2, y: 1 },
    })).toBe(true);
    expect(target.getDecisionLog().entries).toHaveLength(2);
  });

  it('migrates v20 with an explicitly empty decision log', () => {
    const old = JSON.parse(serializeWorld(campaign()));
    old.v = 20;
    delete old.campaign.decisions;
    const target = campaign();
    expect(deserializeWorldInto(target, JSON.stringify(old))).toBe(true);
    expect(target.getDecisionLog()).toEqual({ version: 1, completeFromStart: false, entries: [] });
  });

  it('migrates v24 with explicit club: null without modifying original bytes', () => {
    const old = JSON.parse(serializeWorld(campaign()));
    old.v = 24;
    delete old.club;
    const bytes = JSON.stringify(old);
    const target = campaign();
    expect(deserializeWorldInto(target, bytes)).toBe(true);
    expect(target.getClub()).toBeNull();
    expect(JSON.stringify(old)).toBe(bytes);
  });

  it.each([undefined, [], null, { version: 1, entries: [], autoPauseConfig: {} }])('rejects malformed queue snapshot %j', (value) => {
    expect(InterruptionQueue.fromSnapshot(value)).toBeNull();
  });
});
