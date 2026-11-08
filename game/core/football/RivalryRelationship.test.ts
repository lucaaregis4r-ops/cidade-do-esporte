import { describe, expect, it } from 'vitest';
import {
  makeRivalryId,
  classifyRivalryTier,
  computeRivalryIntensity,
  generateDerbyName,
  initializeRivalryBetweenClubs,
  updateRivalryAfterMatch,
  validateRivalryRelationship,
  type RivalryFactorScores,
} from './RivalryRelationship';

describe('RivalryRelationship domain model', () => {
  it('makes canonical sorted rivalry ID regardless of club argument order', () => {
    expect(makeRivalryId('club_beta', 'club_alpha')).toBe('riv_club_alpha_club_beta');
    expect(makeRivalryId('club_alpha', 'club_beta')).toBe('riv_club_alpha_club_beta');
  });

  it('classifies rivalry tiers accurately by intensity thresholds', () => {
    expect(classifyRivalryTier(15)).toBe('friendly');
    expect(classifyRivalryTier(25)).toBe('traditional');
    expect(classifyRivalryTier(49)).toBe('traditional');
    expect(classifyRivalryTier(50)).toBe('fierce');
    expect(classifyRivalryTier(74)).toBe('fierce');
    expect(classifyRivalryTier(75)).toBe('deadly_derby');
    expect(classifyRivalryTier(100)).toBe('deadly_derby');
  });

  it('computes weighted rivalry intensity bounded to [0, 100]', () => {
    const factors: RivalryFactorScores = {
      sporting: 80,    // 80 * 0.30 = 24
      geographic: 90,  // 90 * 0.20 = 18
      social: 70,      // 70 * 0.15 = 10.5
      political: 60,   // 60 * 0.15 = 9
      historical: 50,  // 50 * 0.10 = 5
      supporter: 40,   // 40 * 0.10 = 4
    };
    // Sum = 24 + 18 + 10.5 + 9 + 5 + 4 = 70.5 => 71
    expect(computeRivalryIntensity(factors)).toBe(71);

    const zeroFactors: RivalryFactorScores = {
      sporting: 0,
      geographic: 0,
      social: 0,
      political: 0,
      historical: 0,
      supporter: 0,
    };
    expect(computeRivalryIntensity(zeroFactors)).toBe(0);
  });

  it('initializes rivalry with high historical score for dissidence clubs', () => {
    const clubMatriz = {
      id: 'club_matriz',
      name: 'Sport Club Mineiro',
      origin: 'workers',
      districtId: 'dist_centro',
    };
    const clubRacha = {
      id: 'club_racha',
      name: 'União Dissidente',
      origin: 'workers',
      districtId: 'dist_centro',
      isDissidence: true,
      parentClubId: 'club_matriz',
    };

    const riv = initializeRivalryBetweenClubs(clubMatriz, clubRacha);
    expect(riv.factors.historical).toBe(85);
    expect(riv.factors.geographic).toBe(85); // Same district
    expect(riv.intensity).toBeGreaterThanOrEqual(45);
    expect(riv.derbyName).toBe('O Dérbi da Dissidência');
  });

  it('initializes rivalry with high social score for class contrast (workers vs elite)', () => {
    const clubOperario = {
      id: 'club_operario',
      name: 'Operário F.C.',
      origin: 'workers',
      districtId: 'dist_industrial',
      politicalBloc: 'popular' as const,
    };
    const clubAristocrata = {
      id: 'club_elite',
      name: 'Aristocrático Club',
      origin: 'elite',
      districtId: 'dist_sul',
      politicalBloc: 'aristocratic' as const,
    };

    const riv = initializeRivalryBetweenClubs(clubOperario, clubAristocrata);
    expect(riv.factors.social).toBe(75);
    expect(riv.factors.political).toBe(80);
    expect(riv.derbyName).toBe('O Choque de Classes');
  });

  it('updates head-to-head, sporting intensity, and major matches after a match', () => {
    const clubA = { id: 'club_a', name: 'Clube Alpha' };
    const clubB = { id: 'club_b', name: 'Clube Beta' };
    const initialRiv = initializeRivalryBetweenClubs(clubA, clubB);

    const updatedRiv = updateRivalryAfterMatch(initialRiv, {
      matchId: 'm-1',
      date: { year: 1910, month: 5, day: 15 },
      homeClubId: 'club_a',
      awayClubId: 'club_b',
      homeScore: 4,
      awayScore: 0,
      isPlayoffOrFinal: true,
    });

    expect(updatedRiv.headToHead.totalMatches).toBe(1);
    expect(updatedRiv.headToHead.winsClubA).toBe(1);
    expect(updatedRiv.headToHead.winsClubB).toBe(0);
    expect(updatedRiv.headToHead.goalsClubA).toBe(4);
    // Sporting increased by base (2) + blowout (8) + final (15) = 25
    expect(updatedRiv.factors.sporting).toBe(initialRiv.factors.sporting + 25);
    expect(updatedRiv.majorMatches.length).toBe(1);
    expect(updatedRiv.majorMatches[0]).toContain('Decisão em 15/5/1910');
  });

  it('validates and serializes/deserializes rivalry data safely', () => {
    const clubA = { id: 'club_1', name: 'Time 1' };
    const clubB = { id: 'club_2', name: 'Time 2' };
    const riv = initializeRivalryBetweenClubs(clubA, clubB);

    const validated = validateRivalryRelationship(riv);
    expect(validated).not.toBeNull();
    expect(validated?.id).toBe(riv.id);
    expect(validated?.tier).toBe(riv.tier);

    expect(validateRivalryRelationship(null)).toBeNull();
    expect(validateRivalryRelationship({ id: 'bad' })).toBeNull();
  });
});
