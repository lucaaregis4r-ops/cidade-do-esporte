import { describe, it, expect } from 'vitest';
import {
  generateHistoricalRegionalClubs,
  validateRegionalClubState,
  calculateRailwayTravelCostPpu,
  MINAS_REGIONS,
  type RegionalClubState,
} from './RegionalClub';

describe('RegionalClub', () => {
  it('covers all 7 canonical Minas Gerais regions', () => {
    const clubs = generateHistoricalRegionalClubs();
    expect(clubs.length).toBeGreaterThanOrEqual(7);

    const representedRegions = new Set(clubs.map(c => c.region));
    for (const region of MINAS_REGIONS) {
      expect(representedRegions.has(region)).toBe(true);
    }
  });

  it('validates and freezes canonical regional clubs accurately', () => {
    const clubs = generateHistoricalRegionalClubs();
    for (const club of clubs) {
      const validated = validateRegionalClubState(club);
      expect(validated).not.toBeNull();
      expect(validated?.id).toBe(club.id);
      expect(validated?.city.length).toBeGreaterThan(0);
      expect(validated?.railwayDistanceHours).toBeGreaterThanOrEqual(1);
      expect(validated?.stadium.capacity).toBeGreaterThanOrEqual(500);
      expect(validated?.finances.annualBudgetPpu).toBeGreaterThan(0);
    }
  });

  it('rejects invalid or corrupted regional club states', () => {
    expect(validateRegionalClubState(null)).toBeNull();
    expect(validateRegionalClubState({})).toBeNull();
    expect(
      validateRegionalClubState({
        id: 'bad',
        name: 'Bad Club',
        shortName: 'Bad',
        city: 'Vila Inexistente',
        region: 'Região Fantasma', // Região inválida
      })
    ).toBeNull();
  });

  it('calculates rail travel costs proportionally to distance and party size', () => {
    // Sabará (2h): 2 * 14 * 1.2 = ~34 PPU
    const shortTrip = calculateRailwayTravelCostPpu(2, 14);
    // Montes Claros (24h): 24 * 14 * 1.2 = ~403 PPU
    const longTrip = calculateRailwayTravelCostPpu(24, 14);

    expect(shortTrip).toBeGreaterThan(0);
    expect(longTrip).toBeGreaterThan(shortTrip);
    expect(shortTrip).toBe(34);
    expect(longTrip).toBe(403);
  });
});
