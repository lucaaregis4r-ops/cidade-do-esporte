import { describe, expect, it } from 'vitest';
import { World } from './World';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';

describe('World - Local Clubs & AI Director (Alpha F: F1 + F2)', () => {
  it('initializes pioneer 1910 local clubs when city is generated', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'SEED-WORLD-CLUBS-1' });
    const localClubs = world.getLocalClubs();

    expect(localClubs.length).toBe(5);
    const names = localClubs.map(c => c.name);
    expect(names).toContain('Sport Club Mineiro');
    expect(names).toContain('Villa Nova Athletic Club');
    expect(names).toContain('Associação Atlética do Comércio');
    expect(names).toContain('Yale Athletic Club');
    expect(names).toContain('Combinado da Estação Ferroviária');

    const rivals = world.getAvailableHistoricalRivals();
    expect(rivals.length).toBeGreaterThanOrEqual(5);
    expect(rivals[0]?.name).toBe('Sport Club Mineiro');
  });

  it('preserves localClubs across serialization and deserialization round-trip', () => {
    const world1 = new World(32, 32, { regenerate: true, worldSeed: 'SEED-WORLD-CLUBS-SAVE' });
    const clubs1 = world1.getLocalClubs();
    expect(clubs1.length).toBe(5);

    const serialized = serializeWorld(world1);
    const world2 = new World(32, 32, { regenerate: false });
    const success = deserializeWorldInto(world2, serialized);

    expect(success).toBe(true);
    const clubs2 = world2.getLocalClubs();
    expect(clubs2.length).toBe(5);
    expect(clubs2[0]?.id).toBe(clubs1[0]?.id);
    expect(clubs2[0]?.directorProfile.presidentName).toBe(clubs1[0]?.directorProfile.presidentName);
  });

  it('evaluates annual club birth when tick advances past January 1st 1912', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'SEED-BIRTH-TICK' });
    expect(world.getLocalClubs().length).toBe(5);

    // Fast-forward ticks to reach 1912 (365 days in 1910 + 365 in 1911 = 730 days)
    for (let day = 0; day < 735; day++) {
      world.tick();
    }

    const clubsIn1912 = world.getLocalClubs();
    const america = clubsIn1912.find(c => c.name.includes('América'));
    expect(america).toBeDefined();
    expect(america?.foundationDate.year).toBe(1912);
  });
});
