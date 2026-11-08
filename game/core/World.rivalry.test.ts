import { describe, expect, it } from 'vitest';
import { World } from './World';
import { createClub } from './club/Club';
import { LandOccupancyContract } from './club/ClubLandContract';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';

describe('World rivalry and incidents integration (Macroetapa 23 & 24)', () => {
  it('initializes rivalries between 1910 local clubs and regional clubs on reset', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'rivalry-test-seed' });
    const rivalries = world.getRivalries();

    expect(rivalries.length).toBeGreaterThan(0);
    // Every rivalry has valid factors, intensity between 0 and 100, and a derby name
    for (const riv of rivalries) {
      expect(riv.intensity).toBeGreaterThanOrEqual(0);
      expect(riv.intensity).toBeLessThanOrEqual(100);
      expect(riv.derbyName.length).toBeGreaterThan(0);
      expect(riv.factors.sporting).toBeGreaterThanOrEqual(0);
      expect(riv.factors.geographic).toBeGreaterThanOrEqual(0);
    }
  });

  it('generates rivalries for the player club when founded with parcel', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'player-rivalry-seed' });
    const parcel = world.getCityData1910()?.parcels.parcels[0];
    expect(parcel).toBeDefined();

    const initialRivCount = world.getRivalries().length;

    const club = createClub({
      id: 'club_player',
      name: 'Sport Club União',
      shortName: 'União',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'workers',
      colors: { primary: '#cc0000', secondary: '#ffffff' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'crest_1910',
          changeReason: 'Fundação',
        },
      ],
    });

    const contract: LandOccupancyContract = {
      id: 'ctr-1',
      parcelId: parcel!.id,
      clubId: club.id,
      type: 'ALUGUEL',
      startDate: { year: 1910, month: 1, day: 1 },
      upfrontCostPpu: 0,
      monthlyCostPpu: 15,
      grantorName: 'Cia. Estrada de Ferro',
      terms: ['Uso para praça desportiva'],
    };

    const success = world.foundClubWithParcel(club, parcel!.id, contract);
    expect(success).toBe(true);

    const updatedRivs = world.getRivalries();
    expect(updatedRivs.length).toBeGreaterThan(initialRivCount);

    // Player club must have rivalries with all local clubs
    const playerRivs = updatedRivs.filter(
      (r) => r.clubs[0] === 'club_player' || r.clubs[1] === 'club_player'
    );
    expect(playerRivs.length).toBeGreaterThanOrEqual(world.getLocalClubs().length);
  });

  it('updates rivalry head-to-head and sporting score after a friendly match', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'friendly-rivalry-seed' });
    const parcel = world.getCityData1910()?.parcels.parcels[0];

    const club = createClub({
      id: 'club_player',
      name: 'Sport Club União',
      shortName: 'União',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'workers',
      colors: { primary: '#cc0000', secondary: '#ffffff' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'crest_1910',
          changeReason: 'Fundação',
        },
      ],
    });

    const contract: LandOccupancyContract = {
      id: 'ctr-1',
      parcelId: parcel!.id,
      clubId: club.id,
      type: 'ALUGUEL',
      startDate: { year: 1910, month: 1, day: 1 },
      upfrontCostPpu: 0,
      monthlyCostPpu: 10,
      grantorName: 'Cia. Estrada de Ferro',
      terms: ['Aluguel'],
    };

    world.foundClubWithParcel(club, parcel!.id, contract);

    const localClubs = world.getLocalClubs();
    expect(localClubs.length).toBeGreaterThan(0);
    const rival = localClubs[0]!;

    const rivBefore = world.getRivalryForClubs(club.id, rival.id);
    expect(rivBefore).toBeDefined();
    expect(rivBefore!.headToHead.totalMatches).toBe(0);

    const matchRecord = world.playFriendlyMatch(rival.name, 'festival_taça');

    expect(matchRecord).not.toBeNull();

    const rivAfter = world.getRivalryForClubs(club.id, rival.id);
    expect(rivAfter).toBeDefined();
    expect(rivAfter!.headToHead.totalMatches).toBe(1);
    expect(rivAfter!.factors.sporting).toBeGreaterThan(rivBefore!.factors.sporting);
  });

  it('round-trips rivalries through serializeWorld and deserializeWorldInto', () => {
    const world1 = new World(32, 32, { regenerate: true, worldSeed: 'roundtrip-rivalry-seed' });
    const parcel = world1.getCityData1910()?.parcels.parcels[0];

    const club = createClub({
      id: 'club_roundtrip',
      name: 'Clube Atlético Teste',
      shortName: 'Atlético',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'students',
      colors: { primary: '#0033aa', secondary: '#ffffff' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'crest_1910',
          changeReason: 'Fundação',
        },
      ],
    });

    const contract: LandOccupancyContract = {
      id: 'ctr-rt',
      parcelId: parcel!.id,
      clubId: club.id,
      type: 'ALUGUEL',
      startDate: { year: 1910, month: 1, day: 1 },
      upfrontCostPpu: 0,
      monthlyCostPpu: 10,
      grantorName: 'Cia. Estrada de Ferro',
      terms: ['Aluguel'],
    };

    world1.foundClubWithParcel(club, parcel!.id, contract);
    const json = serializeWorld(world1);

    const world2 = new World(32, 32, { regenerate: false });
    const success = deserializeWorldInto(world2, json);
    expect(success).toBe(true);

    const rivs1 = world1.getRivalries();
    const rivs2 = world2.getRivalries();
    expect(rivs2.length).toBe(rivs1.length);
    expect(rivs2[0]?.id).toBe(rivs1[0]?.id);
    expect(rivs2[0]?.intensity).toBe(rivs1[0]?.intensity);
  });
});
