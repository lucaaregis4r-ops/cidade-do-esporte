import { describe, it, expect } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createPerson } from '../person/Person';
import {
  HISTORICAL_POSITIONS,
  POSITION_LABELS,
  validateFootballer,
  validateFootballSquadState,
  emergeFootballerFromPerson,
  generateInauguralFootballSquad,
  calculatePositionalRatingDisplay,
} from './Footballer';

describe('Footballer & Athlete Emergence (Alpha E: E1 + E2)', () => {
  const rng = new CampaignRng('test-seed-1910');

  const testPerson = createPerson({
    id: 'person-test-1',
    name: 'Arthur Friedenreich da Silva',
    birthDate: { year: 1892, month: 7, day: 18 },
    parents: ['p-father', 'p-mother'],
    children: [],
    districtId: 'centro',
    socialClass: 'working_class',
    occupation: 'Ferroviário',
    traits: {
      leadership: 85,
      ambition: 90,
      traditionalism: 40,
      sociability: 75,
      honesty: 80,
      passion: 95,
    },
    biography: 'Jovem operário apaixonado pelo esporte bretão.',
    reputation: 60,
    clubAffinities: { 'club-main': 90 },
    footballInterest: 95,
  });

  it('emerges a valid historical footballer with multi-dimensional attributes', () => {
    const footballer = emergeFootballerFromPerson(
      testPerson,
      'CF',
      { year: 1910, month: 5, day: 1 },
      rng,
      'amateur'
    );

    expect(validateFootballer(footballer)).toBe(true);
    expect(footballer.name).toBe('Arthur Friedenreich da Silva');
    expect(footballer.age).toBe(18); // 1910 - 1892
    expect(footballer.positions).toContain('CF');
    expect(footballer.policyTier).toBe('amateur');

    // Technical attributes check
    expect(footballer.technical.shooting).toBeGreaterThan(15);
    expect(footballer.technical.goalkeeping).toBeLessThan(35); // Not a goalkeeper

    // Physical attributes check
    expect(footballer.physical.pace).toBeGreaterThan(20);
    expect(footballer.physical.stamina).toBeGreaterThan(25);

    // Mental attributes check
    expect(footballer.mental.courage).toBeGreaterThan(20);

    // Personality
    expect(footballer.personality.leadership).toBe(85);
    expect(footballer.personality.loyalty).toBeGreaterThan(70);
  });

  it('calculates positional rating display for UI without overall leak to engine', () => {
    const footballer = emergeFootballerFromPerson(
      testPerson,
      'CF',
      { year: 1910, month: 5, day: 1 },
      rng,
      'amateur'
    );

    const strikerRating = calculatePositionalRatingDisplay(footballer, 'CF');
    const gkRating = calculatePositionalRatingDisplay(footballer, 'GK');

    expect(strikerRating).toBeGreaterThan(gkRating);
    expect(strikerRating).toBeGreaterThanOrEqual(10);
    expect(strikerRating).toBeLessThanOrEqual(100);
  });

  it('generates a complete inaugural squad in the 1910 Pyramid 2-3-5 formation', () => {
    const personsPool = Array.from({ length: 15 }, (_, i) =>
      createPerson({
        id: `person-${i}`,
        name: `Jogador Histórico ${i}`,
        birthDate: { year: 1888 + (i % 6), month: 1 + (i % 12), day: 1 },
        parents: [],
        children: [],
        districtId: 'centro',
        socialClass: 'working_class',
        occupation: 'Operário',
        traits: {
          leadership: 50 + i * 2,
          ambition: 60,
          traditionalism: 50,
          sociability: 60,
          honesty: 70,
          passion: 80,
        },
        biography: 'Atleta do quadro fundador.',
        reputation: 50,
        clubAffinities: { 'club-main': 80 },
        footballInterest: 85,
      })
    );

    const squad = generateInauguralFootballSquad(
      'Cidade de Minas Foot-Ball Club',
      { year: 1910, month: 5, day: 1 },
      personsPool,
      rng
    );

    expect(validateFootballSquadState(squad)).toBe(true);
    expect(squad.formationTactic).toBe('2-3-5');
    expect(squad.footballers.length).toBeGreaterThanOrEqual(14); // 11 starters + reserves

    const starters = squad.footballers.filter((f) => f.squadRole === 'starter');
    expect(starters.length).toBe(11);

    // Verify all 11 positions of the 2-3-5 pyramid are covered
    const starterPositions = starters.map((s) => s.positions[0]);
    for (const pos of HISTORICAL_POSITIONS) {
      expect(starterPositions).toContain(pos);
    }

    // Verify captain and vice-captain were selected
    expect(squad.captainFootballerId).toBeDefined();
    expect(squad.viceCaptainFootballerId).toBeDefined();
    expect(squad.captainFootballerId).not.toBe(squad.viceCaptainFootballerId);
  });

  it('has valid labels and lines for all 11 historical positions', () => {
    for (const pos of HISTORICAL_POSITIONS) {
      const def = POSITION_LABELS[pos];
      expect(def).toBeDefined();
      expect(def.nameEn.length).toBeGreaterThan(0);
      expect(def.namePt.length).toBeGreaterThan(0);
      expect(['GK', 'DEF', 'MID', 'ATT']).toContain(def.line);
    }
  });
});
