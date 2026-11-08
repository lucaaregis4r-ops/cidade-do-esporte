import { describe, it, expect } from 'vitest';
import { World } from './World';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';
import { createClub } from './club/Club';
import { MINAS_REGIONS } from './club/RegionalClub';
import type { LandOccupancyContract } from './club/ClubLandContract';

describe('World - Regional Clubs and Dissidences (Alpha F: F3 + F4)', () => {
  it('initializes canonical regional clubs covering all 7 Minas regions on reset', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'CM-TEST-F3F4' });
    const regClubs = world.getRegionalClubs();

    expect(regClubs.length).toBeGreaterThanOrEqual(7);

    const regionsCovered = new Set(regClubs.map((c) => c.region));
    for (const region of MINAS_REGIONS) {
      expect(regionsCovered.has(region)).toBe(true);
    }

    const sabara = world.getRegionalClubById('reg_central_sabara');
    expect(sabara).toBeDefined();
    expect(sabara?.city).toBe('Sabará do Ouro');
    expect(sabara?.railwayDistanceHours).toBe(2);
  });

  it('preserves regional clubs through world save serialization and deserialization', () => {
    const world1 = new World(32, 32, { regenerate: true, worldSeed: 'CM-SAVE-REG-1' });
    const originalRegionalClubs = world1.getRegionalClubs();
    expect(originalRegionalClubs.length).toBeGreaterThan(0);

    const serialized = serializeWorld(world1);
    expect(serialized).toContain('"regionalClubs"');

    const world2 = new World(32, 32, { regenerate: false });
    const ok = deserializeWorldInto(world2, serialized);
    expect(ok).toBe(true);

    const restoredRegionalClubs = world2.getRegionalClubs();
    expect(restoredRegionalClubs.length).toBe(originalRegionalClubs.length);
    expect(restoredRegionalClubs[0].id).toBe(originalRegionalClubs[0].id);
    expect(restoredRegionalClubs[0].city).toBe(originalRegionalClubs[0].city);
    expect(restoredRegionalClubs[0].stadium.capacity).toBe(originalRegionalClubs[0].stadium.capacity);
  });

  it('exposes regional rivals in getAvailableHistoricalRivals', () => {
    const world = new World(32, 32, { regenerate: true, worldSeed: 'CM-RIVAL-TEST' });
    const rivals = world.getAvailableHistoricalRivals();

    // Must include both local clubs and regional clubs
    const sabaraRival = rivals.find((r) => r.name.includes('Sabará Sport Club'));
    expect(sabaraRival).toBeDefined();
    expect(sabaraRival?.description).toContain('interior mineiro');
    expect(sabaraRival?.description).toContain('Central');
  });

  it('updates regional club records when playing a friendly match against an interior team', () => {
    const world = new World(32, 32, { worldSeed: 'MATCH-WORLD-REG-1' });
    const city = world.getCityData1910();
    const parcelId = city!.parcels.parcels[0]!.id;

    const contract: LandOccupancyContract = {
      id: 'contract-reg-test',
      parcelId,
      clubId: 'club-test-reg',
      type: 'CESSAO_EMPRESARIAL',
      startDate: { year: 1910, month: 1, day: 1 },
      durationYears: 10,
      upfrontCostPpu: 10,
      monthlyCostPpu: 1.5,
      grantorName: 'Estrada de Ferro Central do Brasil',
      terms: ['Uso para fins esportivos'],
    };

    const initialClub = createClub({
      id: 'club-test-reg',
      name: 'Clube Atlético da Cidade',
      shortName: 'Atlético',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'students',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    const ok = world.foundClubWithParcel(initialClub, parcelId, contract);
    expect(ok).toBe(true);

    const sabara = world.getRegionalClubById('reg_central_sabara');
    expect(sabara).toBeDefined();
    expect(sabara?.matchesPlayedAgainstCapital).toBe(0);

    const record = world.playFriendlyMatch('Sabará Sport Club', 'friendly');
    expect(record).not.toBeNull();

    const updatedSabara = world.getRegionalClubById('reg_central_sabara');
    expect(updatedSabara?.matchesPlayedAgainstCapital).toBe(1);
    expect(updatedSabara?.historicalMilestones.length).toBeGreaterThanOrEqual(2);
    expect(updatedSabara?.historicalMilestones[updatedSabara.historicalMilestones.length - 1].title).toContain('Prélio Intermunicipal');
  });
});
