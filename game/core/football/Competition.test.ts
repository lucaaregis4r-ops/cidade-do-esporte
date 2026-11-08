import { describe, it, expect } from 'vitest';
import {
  sortStandings,
  validateCompetitionState,
  type CompetitionState,
  type StandingsEntry,
} from './Competition';

describe('Competition - Contracts and Validation (Macroetapa 22, F7)', () => {
  it('sorts standings by points (2 pts per win), then goal difference, then goals scored', () => {
    const entries: StandingsEntry[] = [
      {
        clubId: 'club_b',
        clubName: 'Sport Club Mineiro',
        played: 4,
        won: 2,
        drawn: 1,
        lost: 1,
        goalsFor: 6,
        goalsAgainst: 4,
        goalDifference: 2,
        points: 5, // 2*2 + 1 = 5
      },
      {
        clubId: 'club_a',
        clubName: 'América',
        played: 4,
        won: 3,
        drawn: 0,
        lost: 1,
        goalsFor: 8,
        goalsAgainst: 3,
        goalDifference: 5,
        points: 6, // 3*2 = 6
      },
      {
        clubId: 'club_c',
        clubName: 'Villa Nova',
        played: 4,
        won: 2,
        drawn: 1,
        lost: 1,
        goalsFor: 7,
        goalsAgainst: 5,
        goalDifference: 2,
        points: 5, // tied on points with club_b, but more goalsFor (7 > 6)
      },
    ];

    const sorted = sortStandings(entries);
    expect(sorted[0]!.clubId).toBe('club_a'); // 6 pts
    expect(sorted[1]!.clubId).toBe('club_c'); // 5 pts, 7 GF
    expect(sorted[2]!.clubId).toBe('club_b'); // 5 pts, 6 GF
  });

  it('validates and freezes valid competition state', () => {
    const raw: CompetitionState = {
      id: 'comp_1910_taca_cidade_minas',
      name: 'Taça Cidade de Minas de 1910',
      shortName: 'Taça Cidade de Minas',
      year: 1910,
      organizer: 'municipal_clubs',
      tier: 'city_cup',
      format: 'single_round_robin',
      status: 'scheduled',
      participatingClubIds: ['club-main', 'sport_mineiro', 'villa_nova'],
      fixtures: [
        {
          id: 'fix_1',
          round: 1,
          scheduledDate: { year: 1910, month: 5, day: 8 },
          homeClubId: 'club-main',
          homeClubName: 'Clube Atlético',
          awayClubId: 'sport_mineiro',
          awayClubName: 'Sport Club Mineiro',
          status: 'scheduled',
        },
      ],
      standings: [
        {
          clubId: 'club-main',
          clubName: 'Clube Atlético',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ],
    };

    const validated = validateCompetitionState(raw);
    expect(validated).not.toBeNull();
    expect(validated?.name).toBe('Taça Cidade de Minas de 1910');
    expect(validated?.fixtures.length).toBe(1);
    expect(validated?.standings.length).toBe(1);
    expect(Object.isFrozen(validated)).toBe(true);
  });

  it('rejects invalid competition state with missing fields', () => {
    expect(validateCompetitionState(null)).toBeNull();
    expect(validateCompetitionState({})).toBeNull();
    expect(validateCompetitionState({ id: 'comp_1', year: 1800 })).toBeNull();
  });
});
