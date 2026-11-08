import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { createClub } from './club/Club';
import type { LandOccupancyContract } from './club/LandOccupancyContract';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';

describe('World Competition Integration (Alpha F: F7 + F8 + F9)', () => {
  let world: World;

  beforeEach(() => {
    world = new World(16, 16);
    world.reset({ regenerate: true });
  });

  it('generates the 1910 inaugural competition on procedural reset', () => {
    const competitions = world.getCompetitions();
    expect(competitions.length).toBeGreaterThan(0);
    const inauguralComp = competitions.find((c) => c.year === 1910);
    expect(inauguralComp).toBeDefined();
    expect(inauguralComp?.name).toContain('Taça Cidade de Minas');
    expect(inauguralComp?.fixtures.length).toBeGreaterThan(0);
    expect(inauguralComp?.standings.length).toBeGreaterThan(0);
  });

  it('updates annual competitions when player club is founded', () => {
    const initialComps = world.getCompetitions();
    expect(initialComps.length).toBe(1);

    const parcel = world.getCityData1910()?.parcels.parcels[0];
    expect(parcel).toBeDefined();

    const contract: LandOccupancyContract = {
      id: 'test-contract-1',
      parcelId: parcel!.id,
      clubId: 'player-athletic-club',
      type: 'COMPRA',
      grantorName: 'Prefeitura',
      startDate: { year: 1910, month: 1, day: 1 },
      upfrontCostPpu: 50,
      monthlyCostPpu: 0,
      terms: ['Aquisição definitiva para instalação da praça de esportes.'],
    };

    const playerClub = createClub({
      id: 'player-athletic-club',
      name: 'Athletic Club de Minas',
      shortName: 'Athletic',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'students',
      foundingStory: 'Fundado por jovens estudantes da capital.',
      colors: { primary: '#000000', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'crest-v1', changeReason: 'Fundação' }],
      founders: [],
      parcels: [],
      facilities: [],
      reputation: 50,
    });

    const founded = world.foundClubWithParcel(playerClub, parcel!.id, contract);
    expect(founded).toBe(true);

    const updatedComps = world.getCompetitions();
    const taca1910 = updatedComps.find((c) => c.year === 1910);
    expect(taca1910).toBeDefined();

    const playerInStandings = taca1910?.standings.some((s) => s.clubId === playerClub.id);
    expect(playerInStandings).toBe(true);

    const playerInFixtures = taca1910?.fixtures.some(
      (f) => f.homeClubId === playerClub.id || f.awayClubId === playerClub.id
    );
    expect(playerInFixtures).toBe(true);
  });

  it('allows playing a competition match and updates standings and club history', () => {
    const parcel = world.getCityData1910()?.parcels.parcels[0];
    const contract: LandOccupancyContract = {
      id: 'test-contract-2',
      parcelId: parcel!.id,
      clubId: 'player-sport-club',
      type: 'COMPRA',
      grantorName: 'Particular',
      startDate: { year: 1910, month: 1, day: 1 },
      upfrontCostPpu: 40,
      monthlyCostPpu: 0,
      terms: ['Aquisição perpétua do terreno.'],
    };

    const playerClub = createClub({
      id: 'player-sport-club',
      name: 'Sport Club Cidade',
      shortName: 'Sport',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'merchants',
      foundingStory: 'Criado pela classe comercial.',
      colors: { primary: '#cc0000', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'crest-v1', changeReason: 'Fundação' }],
      founders: [],
      parcels: [],
      facilities: [],
      reputation: 55,
    });

    world.foundClubWithParcel(playerClub, parcel!.id, contract);

    const comps = world.getCompetitions();
    const comp = comps[0]!;
    const playerFixture = comp.fixtures.find(
      (f) => f.homeClubId === playerClub.id || f.awayClubId === playerClub.id
    );
    expect(playerFixture).toBeDefined();

    const record = world.playCompetitionMatch(comp.id, playerFixture!.id);
    expect(record).not.toBeNull();
    expect(record?.homeScore).toBeGreaterThanOrEqual(0);
    expect(record?.awayScore).toBeGreaterThanOrEqual(0);

    // Verify fixture updated to played
    const updatedComp = world.getCompetitions().find((c) => c.id === comp.id)!;
    const updatedFixture = updatedComp.fixtures.find((f) => f.id === playerFixture!.id)!;
    expect(updatedFixture.status).toBe('played');
    expect(updatedFixture.result).toBeDefined();

    // Verify club match history recorded the game
    const clubHistory = world.getClubMatchHistory();
    expect(clubHistory.length).toBeGreaterThan(0);
    expect(clubHistory[0]?.id).toBe(record?.id);

    // Verify standings updated with points
    const playerStanding = updatedComp.standings.find((s) => s.clubId === playerClub.id)!;
    expect(playerStanding.played).toBe(1);
    expect(playerStanding.goalsFor).toBe(
      playerFixture!.homeClubId === playerClub.id ? record!.homeScore : record!.awayScore
    );
  });

  it('advances calendar and simulates scheduled rounds until season finishes with champion trophy', () => {
    // Advance calendar by ~200 days to simulate through the 1910 competition schedule
    for (let i = 0; i < 200; i++) {
      world.tick();
    }

    const comps = world.getCompetitions();
    const comp1910 = comps.find((c) => c.year === 1910);
    expect(comp1910).toBeDefined();
    expect(comp1910?.status).toBe('completed');
    expect(comp1910?.championClubId).toBeDefined();

    // Check all matches were resolved
    const unplayedMatches = comp1910?.fixtures.filter((f) => f.status === 'scheduled');
    expect(unplayedMatches?.length).toBe(0);

    // Winner club should have trophy awarded
    const winnerId = comp1910!.championClubId!;
    const localWinner = world.getLocalClubs().find((c) => c.id === winnerId);
    if (localWinner) {
      expect(localWinner.trophies?.length).toBeGreaterThan(0);
      expect(localWinner.trophies?.[0]?.competitionId).toBe(comp1910!.id);
    }
  });

  it('persists and hydrates competitions and standings through save envelope v25', () => {
    // Advance a few weeks to simulate some fixtures
    for (let i = 0; i < 35; i++) {
      world.tick();
    }

    const savedJson = serializeWorld(world);
    expect(savedJson).toContain('comp_1910_taca_cidade_minas');

    const targetWorld = new World(16, 16);
    targetWorld.reset({ regenerate: false });

    const success = deserializeWorldInto(targetWorld, savedJson);
    expect(success).toBe(true);

    const targetComps = targetWorld.getCompetitions();
    expect(targetComps.length).toBe(world.getCompetitions().length);

    const originalComp = world.getCompetitions()[0]!;
    const restoredComp = targetComps[0]!;
    expect(restoredComp.id).toBe(originalComp.id);
    expect(restoredComp.status).toBe(originalComp.status);
    expect(restoredComp.fixtures.length).toBe(originalComp.fixtures.length);
    expect(restoredComp.standings.length).toBe(originalComp.standings.length);
    expect(restoredComp.standings[0]?.points).toBe(originalComp.standings[0]?.points);
  });
});
