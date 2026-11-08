/**
 * Tests for ClubPolitics (Alpha D: D6).
 */

import { describe, it, expect } from 'vitest';
import {
  generateEmergentFactions,
  validateClubPoliticsState,
} from './ClubPolitics';

describe('ClubPolitics (Alpha D: D6)', () => {
  it('generates 3 to 4 emergent factions based on material conditions and founding origin', () => {
    const politicsWorkers = generateEmergentFactions({
      foundingOrigin: 'workers',
      foundingYear: 1910,
      currentYear: 1910,
      leaderId: 'founder-leader-1',
      leaderName: 'Arthur Friedenreich',
      balancePPU: 15,
      monthlyFeePPU: 1.5,
    });

    expect(politicsWorkers.factions.length).toBeGreaterThanOrEqual(3);
    expect(politicsWorkers.factions.length).toBeLessThanOrEqual(4);

    const factionTypes = politicsWorkers.factions.map((f) => f.type);
    expect(factionTypes).toContain('fundadores');
    expect(factionTypes).toContain('populares');
    expect(factionTypes).toContain('futebolistas');
    // Low balance (15 PPU) triggers fiscalistas
    expect(factionTypes).toContain('fiscalistas');

    // Total influence basis points sum to 10,000 (100%)
    const totalBps = politicsWorkers.factions.reduce((acc, f) => acc + f.influenceBps, 0);
    expect(totalBps).toBe(10000);

    // Leader assignment
    const founderFaction = politicsWorkers.factions.find((f) => f.type === 'fundadores');
    expect(founderFaction?.leaderPersonId).toBe('founder-leader-1');
    expect(founderFaction?.leaderName).toBe('Arthur Friedenreich');
  });

  it('generates elite and patrimonial factions for elite origin clubs', () => {
    const politicsElite = generateEmergentFactions({
      foundingOrigin: 'elite',
      foundingYear: 1910,
      currentYear: 1910,
      leaderId: 'founder-leader-2',
      leaderName: 'Eduardo Guinle',
      balancePPU: 100,
      hasLuxuryFacility: true,
    });

    const types = politicsElite.factions.map((f) => f.type);
    expect(types).toContain('fundadores');
    expect(types).toContain('elitistas');
    expect(types).toContain('patrimonialistas');
    expect(types).not.toContain('populares');
  });

  it('validates and defensively freezes deserialized ClubPoliticsState', () => {
    const politics = generateEmergentFactions({
      foundingOrigin: 'students',
      foundingYear: 1910,
      currentYear: 1910,
      leaderId: 'leader-3',
      leaderName: 'Carlos Drummond',
      balancePPU: 40,
    });

    const validated = validateClubPoliticsState(politics);
    expect(validated).not.toBeNull();
    expect(validated?.internalTension).toBe(politics.internalTension);
    expect(validated?.politicalStabilityScore).toBe(politics.politicalStabilityScore);
    expect(validated?.factions.length).toBe(politics.factions.length);
  });

  it('rejects invalid or corrupted politics objects', () => {
    expect(validateClubPoliticsState(null)).toBeNull();
    expect(validateClubPoliticsState({})).toBeNull();
    expect(validateClubPoliticsState({ factions: [], internalTension: 50 })).toBeNull();
    // Invalid faction type
    expect(
      validateClubPoliticsState({
        factions: [
          {
            type: 'aliens',
            name: 'Alienígenas',
            leaderName: 'Zorg',
            influenceBps: 10000,
            loyalty: 80,
          },
        ],
        internalTension: 20,
        politicalStabilityScore: 80,
        lastElectionYear: 1910,
        nextElectionYear: 1911,
      }),
    ).toBeNull();
  });
});
