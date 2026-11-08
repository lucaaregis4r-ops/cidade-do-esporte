import { describe, expect, it } from 'vitest';
import {
  CampaignRng,
  DEFAULT_WORLD_SEED,
  RNG_DOMAINS,
  worldSeedFromNumber,
} from './CampaignRng';

describe('CampaignRng', () => {
  it('repeats every named stream for the same world seed', () => {
    const a = new CampaignRng('CM-1910-839174');
    const b = new CampaignRng('CM-1910-839174');
    for (const domain of RNG_DOMAINS) {
      expect([a[domain].next(), a[domain].next()]).toEqual([
        b[domain].next(),
        b[domain].next(),
      ]);
    }
  });

  it('isolates domains so consuming media cannot change football', () => {
    const control = new CampaignRng(DEFAULT_WORLD_SEED);
    const changed = new CampaignRng(DEFAULT_WORLD_SEED);
    changed.media.next();
    changed.media.next();
    expect(changed.football.next()).toBe(control.football.next());
  });

  it('gives different domains different sequences', () => {
    const rng = new CampaignRng(DEFAULT_WORLD_SEED);
    expect(rng.city.next()).not.toBe(rng.population.next());
  });

  it('snapshots to JSON and restores the exact continuation', () => {
    const source = new CampaignRng('CM-1910-RESTORE');
    source.club.next();
    source.events.next();
    const encoded = JSON.stringify(source.snapshot());
    const expected = RNG_DOMAINS.map((domain) => source[domain].next());

    const restored = new CampaignRng('CM-1910-RESTORE');
    expect(restored.restore(JSON.parse(encoded))).toBe(true);
    expect(RNG_DOMAINS.map((domain) => restored[domain].next())).toEqual(expected);
  });

  it('rejects invalid state atomically', () => {
    const rng = new CampaignRng(DEFAULT_WORLD_SEED);
    const before = rng.snapshot();
    const invalid = structuredClone(before);
    invalid.streams.city = -1;
    expect(rng.restore(invalid)).toBe(false);
    expect(rng.snapshot()).toEqual(before);
  });

  it('normalizes the legacy numeric terrain seed into the campaign format', () => {
    expect(worldSeedFromNumber(0xc15a1e11)).toBe(DEFAULT_WORLD_SEED);
  });
});
