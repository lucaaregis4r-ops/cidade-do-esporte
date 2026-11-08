import { describe, it, expect } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { getFootballRulesForEra } from './FootballRulesByEra';
import {
  simulateHistoricalMatch,
  generate1910RivalTeam,
  calculate1910MatchdayFinances,
  HISTORICAL_1910_RIVALS,
  type MatchTeamInput,
} from './MatchEngine';
import { generateInauguralFootballSquad } from './Footballer';

describe('FootballRulesByEra (E8)', () => {
  it('enforces 1910 amateur rules strictly: 0 substitutions, 2 pts for win, verbal cautions, 3-player offside', () => {
    const rules1910 = getFootballRulesForEra(1910);
    expect(rules1910.maxSubstitutions).toBe(0);
    expect(rules1910.pointsForWin).toBe(2);
    expect(rules1910.pointsForDraw).toBe(1);
    expect(rules1910.pointsForLoss).toBe(0);
    expect(rules1910.disciplinaryStyle).toBe('verbal_expulsion');
    expect(rules1910.offsideRule).toBe('three_player');
    expect(rules1910.formationConvention).toBe('2-3-5');
    expect(rules1910.matchDurationMinutes).toBe(90);
  });

  it('updates rules for 1959 Taça Brasil era', () => {
    const rules1959 = getFootballRulesForEra(1959);
    expect(rules1959.maxSubstitutions).toBe(1);
    expect(rules1959.offsideRule).toBe('two_player');
    expect(rules1959.formationConvention).toBe('4-2-4');
  });
});

describe('MatchEngine (E7 + E8 + E9 + E10)', () => {
  const seed = 'MATCH-TEST-SEED-1910';
  const date = { year: 1910, month: 5, day: 15 };

  it('generates an authentic 1910 rival team in 2-3-5 formation', () => {
    const rng = new CampaignRng(seed);
    const preset = HISTORICAL_1910_RIVALS[0]!; // América Foot-Ball Club
    const team = generate1910RivalTeam(preset, date, rng);

    expect(team.name).toBe('América Foot-Ball Club');
    expect(team.shortName).toBe('América');
    expect(team.squad).toHaveLength(11);
    expect(team.squad[0]!.positions).toContain('GK');
    expect(team.squad[8]!.positions).toContain('CF');
  });

  it('calculates 1910 matchday attendance and finances in PPU', () => {
    const rng = new CampaignRng(seed);
    const finance = calculate1910MatchdayFinances(60, 65, 600, false, false, rng);

    expect(finance.attendance).toBeGreaterThan(150);
    expect(finance.attendance).toBeLessThanOrEqual(600);
    expect(finance.gateReceiptsPPU).toBeGreaterThan(0);
    expect(finance.matchExpensesPPU).toBeGreaterThan(0);
    expect(finance.netIncomePPU).toBe(finance.gateReceiptsPPU - finance.matchExpensesPPU);
  });

  it('simulates a 1910 match deterministically without single overall rating', () => {
    const rng1 = new CampaignRng(seed);
    const rng2 = new CampaignRng(seed);

    // Generate home squad from Footballer
    const homeSquad = generateInauguralFootballSquad('Mineiro Football Club', date, [], rng1);
    const rivalPreset = HISTORICAL_1910_RIVALS[1]!; // Villa Nova
    const awayTeam = generate1910RivalTeam(rivalPreset, date, rng1);

    const homeTeam: MatchTeamInput = {
      id: 'club-1',
      name: 'Mineiro Football Club',
      shortName: 'Mineiro',
      colors: { primary: '#000000', secondary: '#FFFFFF' },
      squad: homeSquad.footballers,
    };

    const simResult1 = simulateHistoricalMatch({
      matchId: 'match-1910-05-15',
      date,
      competitionType: 'festival_taça',
      competitionName: 'Taça Cidade de Minas 1910',
      homeTeam,
      awayTeam,
      rng: rng1,
      pitchCondition: 'dirt',
    });

    // Replay with identical seed
    const homeSquad2 = generateInauguralFootballSquad('Mineiro Football Club', date, [], rng2);
    const awayTeam2 = generate1910RivalTeam(rivalPreset, date, rng2);
    const homeTeam2: MatchTeamInput = {
      id: 'club-1',
      name: 'Mineiro Football Club',
      shortName: 'Mineiro',
      colors: { primary: '#000000', secondary: '#FFFFFF' },
      squad: homeSquad2.footballers,
    };

    const simResult2 = simulateHistoricalMatch({
      matchId: 'match-1910-05-15',
      date,
      competitionType: 'festival_taça',
      competitionName: 'Taça Cidade de Minas 1910',
      homeTeam: homeTeam2,
      awayTeam: awayTeam2,
      rng: rng2,
      pitchCondition: 'dirt',
    });

    // Exact deterministic reproduction
    expect(simResult1.record.homeScore).toBe(simResult2.record.homeScore);
    expect(simResult1.record.awayScore).toBe(simResult2.record.awayScore);
    expect(simResult1.record.attendance).toBe(simResult2.record.attendance);
    expect(simResult1.record.events.length).toBe(simResult2.record.events.length);
    expect(simResult1.record.summaryPt).toBe(simResult2.record.summaryPt);

    // Verify 1910 rules in match record
    expect(simResult1.record.rules.maxSubstitutions).toBe(0);
    expect(simResult1.record.rules.pointsForWin).toBe(2);
    expect(simResult1.record.pitchCondition).toBe('dirt');

    // Verify events include kickoff and fulltime
    expect(simResult1.record.events[0]!.type).toBe('kickoff');
    expect(simResult1.record.events[simResult1.record.events.length - 1]!.type).toBe('fulltime');

    // Verify player fatigue and condition wear occurred
    const homePlayerAfter = simResult1.updatedHomeSquad.footballers[0]!;
    expect(homePlayerAfter.condition).toBeLessThan(100);
    expect(homePlayerAfter.fatigue).toBeGreaterThan(0);
    expect(homePlayerAfter.matchHistory.length).toBeGreaterThan(0);
    expect(homePlayerAfter.matchHistory[0]!.matchId).toBe('match-1910-05-15');

    // Verify financial transactions produced
    expect(simResult1.matchRevenueTransaction).toBeDefined();
    expect(simResult1.matchRevenueTransaction!.category).toBe('match_revenue');
    expect(simResult1.matchExpenseTransaction).toBeDefined();
    expect(simResult1.matchExpenseTransaction!.category).toBe('match_expense');
  });

  it('accumulates appearances and records across consecutive matches (E10)', () => {
    const rng = new CampaignRng(seed);
    const squad = generateInauguralFootballSquad('Mineiro Football Club', date, [], rng);
    const rival1 = generate1910RivalTeam(HISTORICAL_1910_RIVALS[0]!, date, rng);
    const rival2 = generate1910RivalTeam(HISTORICAL_1910_RIVALS[1]!, date, rng);

    const homeTeam: MatchTeamInput = {
      id: 'club-main',
      name: 'Mineiro Football Club',
      shortName: 'Mineiro',
      colors: { primary: '#000000', secondary: '#FFFFFF' },
      squad: squad.footballers,
    };

    const match1 = simulateHistoricalMatch({
      matchId: 'match-1',
      date: { year: 1910, month: 5, day: 1 },
      competitionType: 'friendly',
      competitionName: 'Amistoso Interestadual',
      homeTeam,
      awayTeam: rival1,
      rng,
    });

    const homeTeamAfterM1: MatchTeamInput = {
      ...homeTeam,
      squad: match1.updatedHomeSquad.footballers,
    };

    const match2 = simulateHistoricalMatch({
      matchId: 'match-2',
      date: { year: 1910, month: 5, day: 22 },
      competitionType: 'festival_taça',
      competitionName: 'Grande Festival Beneficente',
      homeTeam: homeTeamAfterM1,
      awayTeam: rival2,
      rng,
    });

    const starter = match2.updatedHomeSquad.footballers[0]!;
    expect(starter.matchHistory.length).toBe(2);
    expect(starter.matchHistory[0]!.matchId).toBe('match-1');
    expect(starter.matchHistory[1]!.matchId).toBe('match-2');

    const clubSpell = starter.clubHistory.find((c) => c.clubId === 'club-main');
    expect(clubSpell).toBeDefined();
    expect(clubSpell!.appearances).toBe(2);
  });
});
