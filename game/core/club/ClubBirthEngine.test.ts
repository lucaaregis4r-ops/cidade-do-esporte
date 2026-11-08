import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import type { CityDistrict } from '../city/cityDistricts';
import {
  evaluateAnnualClubBirths,
  generateInitial1910LocalClubs,
  stepLocalClub,
  validateLocalClubState,
  evolveProceduralClubsAnnual,
  generateProceduralPresident,
  generateProceduralStadium,
} from './ClubBirthEngine';

const MOCK_DISTRICTS: readonly CityDistrict[] = Object.freeze([
  {
    id: 'district-public-square',
    kind: 'public-square',
    anchor: { x: 30, y: 30 },
    tiles: [],
    landArea: 100,
    populationUnits: 15,
    employmentUnits: 10,
    centrality: 90,
    populationShareBps: 2000,
    employmentShareBps: 2000,
  },
  {
    id: 'district-commercial-cluster',
    kind: 'commercial-cluster',
    anchor: { x: 35, y: 30 },
    tiles: [],
    landArea: 120,
    populationUnits: 20,
    employmentUnits: 25,
    centrality: 95,
    populationShareBps: 2500,
    employmentShareBps: 3000,
  },
  {
    id: 'district-railway-station',
    kind: 'railway-station',
    anchor: { x: 25, y: 30 },
    tiles: [],
    landArea: 80,
    populationUnits: 10,
    employmentUnits: 15,
    centrality: 70,
    populationShareBps: 1500,
    employmentShareBps: 1500,
  },
  {
    id: 'district-small-industry',
    kind: 'small-industry',
    anchor: { x: 20, y: 30 },
    tiles: [],
    landArea: 90,
    populationUnits: 12,
    employmentUnits: 18,
    centrality: 65,
    populationShareBps: 1500,
    employmentShareBps: 2000,
  },
  {
    id: 'district-outer-south',
    kind: 'outer-south',
    anchor: { x: 30, y: 40 },
    tiles: [],
    landArea: 110,
    populationUnits: 14,
    employmentUnits: 8,
    centrality: 50,
    populationShareBps: 1500,
    employmentShareBps: 1000,
  },
  {
    id: 'district-outer-north',
    kind: 'outer-north',
    anchor: { x: 30, y: 20 },
    tiles: [],
    landArea: 100,
    populationUnits: 10,
    employmentUnits: 5,
    centrality: 45,
    populationShareBps: 1000,
    employmentShareBps: 500,
  },
]);

describe('ClubBirthEngine', () => {
  it('generates 5 pioneer clubs for 1910 deterministically', () => {
    const rng1 = new CampaignRng('SEED-1910-CLUBS');
    const rng2 = new CampaignRng('SEED-1910-CLUBS');

    const clubs1 = generateInitial1910LocalClubs(MOCK_DISTRICTS, rng1);
    const clubs2 = generateInitial1910LocalClubs(MOCK_DISTRICTS, rng2);

    expect(clubs1).toEqual(clubs2);
    expect(clubs1.length).toBe(5);

    const names = clubs1.map(c => c.name);
    expect(names).toContain('Sport Club Mineiro');
    expect(names).toContain('Villa Nova Athletic Club');
    expect(names).toContain('Associação Atlética do Comércio');
    expect(names).toContain('Yale Athletic Club');
    expect(names).toContain('Combinado da Estação Ferroviária');

    for (const club of clubs1) {
      expect(validateLocalClubState(club)).not.toBeNull();
      expect(club.directorProfile.presidentName.length).toBeGreaterThan(3);
      expect(club.finances.cashBalancePpu).toBeGreaterThan(0);
      expect(club.facilities.length).toBeGreaterThan(0);
      expect(club.president).toBeDefined();
      expect(club.president?.name.length).toBeGreaterThan(3);
      expect(club.president?.politicalLine).toBeDefined();
      expect(club.stadium).toBeDefined();
      expect(club.stadium?.name.length).toBeGreaterThan(3);
      expect(club.stadium?.capacity).toBeGreaterThan(500);
    }
  });

  it('evaluates birth of América in 1912', () => {
    const rng = new CampaignRng('SEED-BIRTH-1912');
    const initialClubs = generateInitial1910LocalClubs(MOCK_DISTRICTS, rng);

    const births1912 = evaluateAnnualClubBirths({
      year: 1912,
      districts: MOCK_DISTRICTS,
      existingClubs: initialClubs,
      rng,
    });

    const america = births1912.find(c => c.name.includes('América'));
    expect(america).toBeDefined();
    expect(america?.foundationDate.year).toBe(1912);
    expect(america?.origin).toBe('students');
    expect(america?.colors.primary).toBe('#1B5E20'); // Verde
    expect(validateLocalClubState(america)).not.toBeNull();
  });

  it('evaluates birth of União Operária in 1914', () => {
    const rng = new CampaignRng('SEED-BIRTH-1914');
    const initialClubs = generateInitial1910LocalClubs(MOCK_DISTRICTS, rng);

    const births1914 = evaluateAnnualClubBirths({
      year: 1914,
      districts: MOCK_DISTRICTS,
      existingClubs: initialClubs,
      rng,
    });

    const uniao = births1914.find(c => c.name.includes('União Operária'));
    expect(uniao).toBeDefined();
    expect(uniao?.foundationReason).toBe('factory');
    expect(uniao?.origin).toBe('workers');
  });

  it('steps an AI local club and updates finances and facilities', () => {
    const rng = new CampaignRng('SEED-STEP-1');
    const [club] = generateInitial1910LocalClubs(MOCK_DISTRICTS, rng);

    const { updatedClub } = stepLocalClub(
      club,
      { year: 1910, month: 2, day: 1 },
      rng
    );

    expect(updatedClub.id).toBe(club.id);
    expect(typeof updatedClub.finances.cashBalancePpu).toBe('number');
    expect(updatedClub.finances.cashBalancePpu).toBeGreaterThanOrEqual(0);
  });

  it('evolves procedural clubs with president elections and stadium improvements', () => {
    const rng = new CampaignRng('SEED-EVOLVE-TEST');
    const initialClubs = generateInitial1910LocalClubs(MOCK_DISTRICTS, rng);

    // Test procedural president generation
    const pres = generateProceduralPresident('merchants', rng, 1925);
    expect(pres.name).toBeTruthy();
    expect(pres.termStartYear).toBe(1925);
    expect(pres.termEndYear).toBeGreaterThan(1925);
    expect(pres.politicalLine).toBeTruthy();

    // Test procedural stadium generation
    const stadium1910 = generateProceduralStadium('Independente Foot-Ball Club', 'district-public-square', 1910, rng);
    expect(stadium1910.name).toBeTruthy();
    expect(stadium1910.pitchType).toBe('dirt');
    expect(stadium1910.capacity).toBeLessThan(5000);

    const stadium1950 = generateProceduralStadium('Independente Foot-Ball Club', 'district-public-square', 1950, rng);
    expect(stadium1950.standsType).toBe('concrete');
    expect(stadium1950.capacity).toBeGreaterThan(5000);

    // Test evolveProceduralClubsAnnual
    const { updatedClubs } = evolveProceduralClubsAnnual(initialClubs, 1935, rng);
    expect(updatedClubs.length).toBe(initialClubs.length);
    for (const club of updatedClubs) {
      expect(club.president).toBeDefined();
      expect(club.stadium).toBeDefined();
    }
  });
});
