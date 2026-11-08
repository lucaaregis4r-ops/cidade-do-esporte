import { describe, it, expect } from 'vitest';
import { World } from './World';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';
import { initializeFederation } from './federation/FederationFormationEngine';

describe('World - Federation Formation and Political Cycle (Alpha F: F5 + F6)', () => {
  it('has no federation in 1910 initially', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'FED-TEST-1910' });
    expect(world.getFederation()).toBeNull();
  });

  it('forms LMDT federation when advancing into 1915', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'FED-TEST-1915' });
    expect(world.getFederation()).toBeNull();

    // Advance year-by-year until 1915
    let daysBeforeNewYear = 364;
    for (let year = 1911; year <= 1915; year++) {
      expect(world.setElapsedDays(daysBeforeNewYear)).toBe(true);
      world.tick();
      daysBeforeNewYear += (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365);
    }

    expect(world.getDate()).toEqual({ year: 1915, month: 1, day: 1 });
    const fed = world.getFederation();
    expect(fed).not.toBeNull();
    expect(fed?.name).toBe('Liga Mineira de Desportos Terrestres (LMDT)');
    expect(fed?.foundingDate.year).toBe(1915);
    expect(fed?.presidents.length).toBe(1);
    expect(fed?.statutes.amateurismClause).toBe('strict_amateur');
    expect(fed?.statutes.fieldRequirement).toBe('fenced_pitch_mandatory');
    expect(fed?.blocs.length).toBe(2);

    // Check interruption queue received the founding notification
    const interruptions = world.getInterruptions();
    const foundEvt = interruptions.find((i) => i.id === 'fed-founding-1915');
    expect(foundEvt).toBeDefined();
    expect(foundEvt?.title).toContain('Liga Mineira de Desportos Terrestres');
  });

  it('preserves federation state across save serialization and deserialization', () => {
    const world1 = new World(32, 32, { regenerate: true, worldSeed: 'FED-SAVE-TEST' });
    // Initialize federation manually or via clock
    const fedState = initializeFederation(
      { year: 1915, month: 3, day: 15 },
      world1.getLocalClubs(),
      world1.getRegionalClubs(),
      null,
      world1['rng']
    );
    world1.setFederation(fedState);

    const serialized = serializeWorld(world1);
    expect(serialized).toContain('"federation"');
    expect(serialized).toContain('Liga Mineira de Desportos Terrestres (LMDT)');

    const world2 = new World(32, 32, { regenerate: false });
    const ok = deserializeWorldInto(world2, serialized);
    expect(ok).toBe(true);

    const restoredFed = world2.getFederation();
    expect(restoredFed).not.toBeNull();
    expect(restoredFed?.name).toBe('Liga Mineira de Desportos Terrestres (LMDT)');
    expect(restoredFed?.foundingDate.year).toBe(1915);
    expect(restoredFed?.presidents[0].name).toBe(fedState.presidents[0].name);
    expect(restoredFed?.statutes.votingSystem).toBe('one_club_one_vote');
    expect(restoredFed?.blocs.length).toBe(2);
    expect(restoredFed?.historicalEvents.length).toBeGreaterThan(0);
  });

  it('triggers historical schism (AMEA) in 1916 annual step', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'FED-SCHISM-TEST' });

    // Advance year-by-year until 1915
    let daysBeforeNewYear = 364;
    for (let year = 1911; year <= 1915; year++) {
      expect(world.setElapsedDays(daysBeforeNewYear)).toBe(true);
      world.tick();
      daysBeforeNewYear += (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365);
    }

    expect(world.getDate()).toEqual({ year: 1915, month: 1, day: 1 });
    expect(world.getFederation()).not.toBeNull();
    expect(world.getFederation()?.dissidentLeague).toBeUndefined();

    // Advance to Jan 1, 1916
    expect(world.setElapsedDays(daysBeforeNewYear)).toBe(true);
    world.tick();
    expect(world.getDate()).toEqual({ year: 1916, month: 1, day: 1 });

    const fed1916 = world.getFederation();
    expect(fed1916).not.toBeNull();
    expect(fed1916?.status).toBe('schism');
    expect(fed1916?.dissidentLeague).toBeDefined();
    expect(fed1916?.dissidentLeague?.name).toContain('AMEA');
    expect(fed1916?.dissidentLeague?.memberClubIds.length).toBeGreaterThan(0);

    // Check interruption queue received the schism notification
    const interruptions = world.getInterruptions();
    const schismEvt = interruptions.find((i) => i.id === 'fed_schism_1916');
    expect(schismEvt).toBeDefined();
    expect(schismEvt?.title).toContain('AMEA');
  });
});
