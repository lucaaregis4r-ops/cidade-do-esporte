import { describe, it, expect } from 'vitest';
import {
  stepCompetitionsForDate,
  updateStandingsWithFixtureResult,
  buildClubLookup,
  type ClubLookupData,
} from './CompetitionEngine';
import type { CompetitionState, CompetitionFixture, StandingsEntry } from './Competition';
import { CampaignRng } from '../CampaignRng';

describe('CompetitionEngine - Season Simulation and Standings (Macroetapa 22, F9)', () => {
  const rng = new CampaignRng('TEST-SEED-ENGINE');

  const initialStandings: StandingsEntry[] = [
    {
      clubId: 'c1',
      clubName: 'Sport Club Mineiro',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    },
    {
      clubId: 'c2',
      clubName: 'América Foot-Ball Club',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    },
  ];

  it('correctly awards 2 points for a win and 0 for a loss in updateStandingsWithFixtureResult', () => {
    const fixture: CompetitionFixture = {
      id: 'fix_1',
      round: 1,
      scheduledDate: { year: 1910, month: 5, day: 8 },
      homeClubId: 'c1',
      homeClubName: 'Sport Club Mineiro',
      awayClubId: 'c2',
      awayClubName: 'América Foot-Ball Club',
      status: 'played',
      result: {
        homeScore: 3,
        awayScore: 1,
      },
    };

    const updated = updateStandingsWithFixtureResult(initialStandings, fixture);
    const home = updated.find((e) => e.clubId === 'c1');
    const away = updated.find((e) => e.clubId === 'c2');

    expect(home?.points).toBe(2);
    expect(home?.played).toBe(1);
    expect(home?.won).toBe(1);
    expect(home?.goalsFor).toBe(3);
    expect(home?.goalsAgainst).toBe(1);
    expect(home?.goalDifference).toBe(2);

    expect(away?.points).toBe(0);
    expect(away?.played).toBe(1);
    expect(away?.lost).toBe(1);
    expect(away?.goalsFor).toBe(1);
    expect(away?.goalsAgainst).toBe(3);
    expect(away?.goalDifference).toBe(-2);
  });

  it('correctly awards 1 point to each club for a draw', () => {
    const fixture: CompetitionFixture = {
      id: 'fix_draw',
      round: 1,
      scheduledDate: { year: 1910, month: 5, day: 8 },
      homeClubId: 'c1',
      homeClubName: 'Sport Club Mineiro',
      awayClubId: 'c2',
      awayClubName: 'América Foot-Ball Club',
      status: 'played',
      result: {
        homeScore: 2,
        awayScore: 2,
      },
    };

    const updated = updateStandingsWithFixtureResult(initialStandings, fixture);
    const home = updated.find((e) => e.clubId === 'c1');
    const away = updated.find((e) => e.clubId === 'c2');

    expect(home?.points).toBe(1);
    expect(home?.drawn).toBe(1);
    expect(away?.points).toBe(1);
    expect(away?.drawn).toBe(1);
  });

  it('steps competitions and simulates scheduled matches for the day, crowning the champion at the end', () => {
    const mockComp: CompetitionState = {
      id: 'comp_test_1910',
      name: 'Taça Teste 1910',
      shortName: 'Taça Teste',
      year: 1910,
      organizer: 'municipal_clubs',
      tier: 'city_cup',
      format: 'single_round_robin',
      status: 'scheduled',
      participatingClubIds: ['c1', 'c2'],
      fixtures: [
        {
          id: 'f1',
          round: 1,
          scheduledDate: { year: 1910, month: 5, day: 15 },
          homeClubId: 'c1',
          homeClubName: 'Sport Club Mineiro',
          awayClubId: 'c2',
          awayClubName: 'América Foot-Ball Club',
          status: 'scheduled',
        },
      ],
      standings: initialStandings,
      trophy: {
        id: 't_test',
        competitionId: 'comp_test_1910',
        competitionName: 'Taça Teste 1910',
        year: 1910,
        date: { year: 1910, month: 5, day: 15 },
        tier: 'city_cup',
        description: 'Troféu de teste',
      },
    };

    const clubLookup = new Map<string, ClubLookupData>([
      [
        'c1',
        {
          id: 'c1',
          name: 'Sport Club Mineiro',
          shortName: 'Sport Mineiro',
          colors: { primary: '#000000', secondary: '#ffffff' },
          reputation: 60,
        },
      ],
      [
        'c2',
        {
          id: 'c2',
          name: 'América Foot-Ball Club',
          shortName: 'América',
          colors: { primary: '#1B5E20', secondary: '#FFFFFF' },
          reputation: 60,
        },
      ],
    ]);

    // Step on a day before the match: nothing happens
    const beforeResult = stepCompetitionsForDate([mockComp], { year: 1910, month: 5, day: 10 }, clubLookup, null, rng);
    expect(beforeResult.matchesPlayed.length).toBe(0);
    expect(beforeResult.updatedCompetitions[0]!.status).toBe('scheduled');

    // Step on matchday: match is played and competition concludes
    const matchDayResult = stepCompetitionsForDate([mockComp], { year: 1910, month: 5, day: 15 }, clubLookup, null, rng);
    expect(matchDayResult.matchesPlayed.length).toBe(1);
    expect(matchDayResult.trophiesAwarded.length).toBe(1);
    expect(matchDayResult.notifications.length).toBe(1);

    const updatedComp = matchDayResult.updatedCompetitions[0]!;
    expect(updatedComp.status).toBe('completed');
    expect(updatedComp.championClubId).toBeDefined();
    expect(updatedComp.fixtures[0]!.status).toBe('played');
    expect(updatedComp.fixtures[0]!.result).toBeDefined();
  });
});
