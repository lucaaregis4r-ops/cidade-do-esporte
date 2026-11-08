import type { GameDate } from '../HistoricalClock';
import type { CampaignRng } from '../CampaignRng';
import type { LocalClubState } from '../club/ClubBirthEngine';
import type { RegionalClubState } from '../club/RegionalClub';
import type { ClubState } from '../club/Club';
import {
  sortStandings,
  validateCompetitionState,
  type CompetitionState,
  type CompetitionStatus,
  type CompetitionFixture,
  type StandingsEntry,
  type ClubTrophy,
} from './Competition';
import {
  simulateHistoricalMatch,
  type MatchRecord,
  type MatchTeamInput,
} from './MatchEngine';
import type { Footballer } from './Footballer';

export interface ClubLookupData {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly colors: { readonly primary: string; readonly secondary: string };
  readonly reputation: number;
  readonly squad?: readonly Footballer[];
}

export interface CompetitionStepResult {
  readonly updatedCompetitions: readonly CompetitionState[];
  readonly matchesPlayed: readonly MatchRecord[];
  readonly trophiesAwarded: readonly { readonly clubId: string; readonly trophy: ClubTrophy }[];
  readonly notifications: readonly { readonly id: string; readonly title: string; readonly description: string }[];
}

/**
 * Creates fallback mock squad for AI clubs that don't have a materialized L2 squad yet.
 */
function createSquadForClub(clubId: string, clubName: string, avgQuality: number, rng: CampaignRng): Footballer[] {
  const stream = rng.football;
  const positions = ['GK', 'FB_R', 'FB_L', 'HB_R', 'CH', 'HB_L', 'FW_OR', 'FW_IR', 'CF', 'FW_IL', 'FW_OL'] as const;
  const squad: Footballer[] = [];

  for (let i = 0; i < 11; i++) {
    const pos = positions[i]!;
    const variance = (stream.next() * 12 - 6);
    const q = Math.max(30, Math.min(95, Math.round(avgQuality + variance)));

    squad.push({
      id: `f_${clubId}_${i + 1}`,
      personId: `p_${clubId}_${i + 1}`,
      name: `Atleta ${clubName} #${i + 1}`,
      age: 22 + (i % 8),
      preferredFoot: stream.next() > 0.8 ? 'left' : 'right',
      positions: [pos],
      technical: {
        shooting: q,
        passing: q,
        ballControl: q,
        dribbling: q,
        tackling: q,
        aerial: q,
        goalkeeping: pos === 'GK' ? q : 20,
      },
      physical: {
        pace: q,
        stamina: q,
        strength: q,
        agility: q,
      },
      mental: {
        decision: q,
        positioning: q,
        composure: q,
        courage: q,
        discipline: q,
      },
      personality: {
        leadership: 50,
        professionalism: 70,
        ambition: 60,
        temperament: 60,
        loyalty: 80,
      },
      potential: q + 5,
      reputation: q,
      condition: 100,
      fatigue: 0,
      injuryRisk: 10,
      policyTier: 'amateur',
      squadRole: 'starter',
      joinedDate: { year: 1910, month: 1, day: 1 },
      clubHistory: [
        {
          clubId,
          clubName,
          startYear: 1910,
          appearances: 0,
          goals: 0,
        },
      ],
      matchHistory: [],
      achievements: [],
    });
  }

  return squad;
}

/**
 * Resolves one competition match between two clubs deterministically.
 */
export function resolveCompetitionFixture(
  comp: CompetitionState,
  fixture: CompetitionFixture,
  homeClubData: ClubLookupData,
  awayClubData: ClubLookupData,
  rng: CampaignRng
): { updatedFixture: CompetitionFixture; matchRecord: MatchRecord } {
  const stream = rng.football;

  const homeSquad = homeClubData.squad && homeClubData.squad.length >= 11
    ? homeClubData.squad
    : createSquadForClub(homeClubData.id, homeClubData.name, homeClubData.reputation || 55, rng);

  const awaySquad = awayClubData.squad && awayClubData.squad.length >= 11
    ? awayClubData.squad
    : createSquadForClub(awayClubData.id, awayClubData.name, awayClubData.reputation || 55, rng);

  const homeTeamInput: MatchTeamInput = {
    id: homeClubData.id,
    name: homeClubData.name,
    shortName: homeClubData.shortName,
    colors: homeClubData.colors,
    squad: homeSquad,
  };

  const awayTeamInput: MatchTeamInput = {
    id: awayClubData.id,
    name: awayClubData.name,
    shortName: awayClubData.shortName,
    colors: awayClubData.colors,
    squad: awaySquad,
  };

  const simResult = simulateHistoricalMatch({
    matchId: `match_${fixture.id}`,
    date: fixture.scheduledDate,
    competitionType: 'festival_taça',
    competitionName: comp.name,
    homeTeam: homeTeamInput,
    awayTeam: awayTeamInput,
    rng,
    pitchCondition: 'dirt',
  });

  const updatedFixture: CompetitionFixture = {
    ...fixture,
    status: 'played',
    result: {
      homeScore: simResult.record.homeScore,
      awayScore: simResult.record.awayScore,
      matchRecordId: simResult.record.id,
    },
  };

  return {
    updatedFixture,
    matchRecord: simResult.record,
  };
}

/**
 * Updates standings table after a completed fixture.
 * Enforces 1910s 2-point rule (2 pts win, 1 pt draw, 0 loss).
 */
export function updateStandingsWithFixtureResult(
  standings: readonly StandingsEntry[],
  fixture: CompetitionFixture
): StandingsEntry[] {
  if (!fixture.result) return [...standings];

  const { homeScore, awayScore } = fixture.result;
  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;
  const draw = homeScore === awayScore;

  const updated = standings.map((entry) => {
    if (entry.clubId === fixture.homeClubId) {
      return {
        ...entry,
        played: entry.played + 1,
        won: entry.won + (homeWin ? 1 : 0),
        drawn: entry.drawn + (draw ? 1 : 0),
        lost: entry.lost + (awayWin ? 1 : 0),
        goalsFor: entry.goalsFor + homeScore,
        goalsAgainst: entry.goalsAgainst + awayScore,
        goalDifference: entry.goalDifference + (homeScore - awayScore),
        points: entry.points + (homeWin ? 2 : draw ? 1 : 0),
      };
    }
    if (entry.clubId === fixture.awayClubId) {
      return {
        ...entry,
        played: entry.played + 1,
        won: entry.won + (awayWin ? 1 : 0),
        drawn: entry.drawn + (draw ? 1 : 0),
        lost: entry.lost + (homeWin ? 1 : 0),
        goalsFor: entry.goalsFor + awayScore,
        goalsAgainst: entry.goalsAgainst + homeScore,
        goalDifference: entry.goalDifference + (awayScore - homeScore),
        points: entry.points + (awayWin ? 2 : draw ? 1 : 0),
      };
    }
    return entry;
  });

  return sortStandings(updated);
}

/**
 * Helper to build club lookup map from all available entities in the world.
 */
export function buildClubLookup(
  playerClub: ClubState | null,
  localClubs: readonly LocalClubState[],
  regionalClubs: readonly RegionalClubState[]
): Map<string, ClubLookupData> {
  const map = new Map<string, ClubLookupData>();

  if (playerClub) {
    map.set(playerClub.id, {
      id: playerClub.id,
      name: playerClub.name,
      shortName: playerClub.shortName,
      colors: playerClub.colors,
      reputation: playerClub.reputation,
      squad: playerClub.squad?.footballers,
    });
  }

  for (const lc of localClubs) {
    map.set(lc.id, {
      id: lc.id,
      name: lc.name,
      shortName: lc.shortName,
      colors: lc.colors,
      reputation: lc.squadSummary.averageRating,
    });
  }

  for (const rc of regionalClubs) {
    map.set(rc.id, {
      id: rc.id,
      name: rc.name,
      shortName: rc.shortName,
      colors: rc.colors,
      reputation: rc.squadSummary.averageRating,
    });
  }

  return map;
}

/**
 * Main simulation step for all active competitions on the given historical date.
 * Resolves matches on their scheduled day, updates tables and handles playoffs / championship crowns.
 */
export function stepCompetitionsForDate(
  competitions: readonly CompetitionState[],
  currentDate: Readonly<GameDate>,
  playerClubOrLookup: ClubState | null | undefined | Map<string, ClubLookupData>,
  localClubsOrPlayerId: readonly LocalClubState[] | string | null,
  regionalClubsOrRng?: readonly RegionalClubState[] | CampaignRng,
  maybeRng?: CampaignRng
): CompetitionStepResult {
  const activeComps = competitions.filter((c) => c.status !== 'completed');
  if (activeComps.length === 0) {
    return {
      updatedCompetitions: competitions as CompetitionState[],
      matchesPlayed: [],
      trophiesAwarded: [],
      notifications: [],
    };
  }

  const hasDueFixture = activeComps.some((c) =>
    c.fixtures.some(
      (f) =>
        f.status === 'scheduled' &&
        (f.scheduledDate.year < currentDate.year ||
          (f.scheduledDate.year === currentDate.year &&
            (f.scheduledDate.month < currentDate.month ||
              (f.scheduledDate.month === currentDate.month && f.scheduledDate.day <= currentDate.day))))
    )
  );

  if (!hasDueFixture) {
    return {
      updatedCompetitions: competitions as CompetitionState[],
      matchesPlayed: [],
      trophiesAwarded: [],
      notifications: [],
    };
  }

  let clubLookup: Map<string, ClubLookupData>;
  let playerClubId: string | null = null;
  let rng: CampaignRng;

  if (playerClubOrLookup instanceof Map) {
    clubLookup = playerClubOrLookup;
    playerClubId = localClubsOrPlayerId as string | null;
    rng = regionalClubsOrRng as CampaignRng;
  } else {
    const localClubs = (localClubsOrPlayerId ?? []) as readonly LocalClubState[];
    const regionalClubs = (regionalClubsOrRng ?? []) as readonly RegionalClubState[];
    clubLookup = buildClubLookup(playerClubOrLookup ?? null, localClubs, regionalClubs);
    playerClubId = playerClubOrLookup?.id ?? null;
    rng = maybeRng!;
  }

  const updatedCompetitions: CompetitionState[] = [];
  const matchesPlayed: MatchRecord[] = [];
  const trophiesAwarded: { clubId: string; trophy: ClubTrophy }[] = [];
  const notifications: { id: string; title: string; description: string }[] = [];

  for (const comp of competitions) {
    if (comp.status === 'completed') {
      updatedCompetitions.push(comp);
      continue;
    }

    let compStatus: CompetitionStatus = comp.status;
    let fixtures = [...comp.fixtures];
    let standings = [...comp.standings];
    let fixturesChanged = false;

    // 1. Process fixtures scheduled for today (or past due that are still scheduled)
    for (let i = 0; i < fixtures.length; i++) {
      const f = fixtures[i]!;
      if (f.status === 'scheduled') {
        const isScheduledToday =
          f.scheduledDate.year === currentDate.year &&
          f.scheduledDate.month === currentDate.month &&
          f.scheduledDate.day === currentDate.day;

        const isPastDue =
          f.scheduledDate.year < currentDate.year ||
          (f.scheduledDate.year === currentDate.year &&
            (f.scheduledDate.month < currentDate.month ||
              (f.scheduledDate.month === currentDate.month && f.scheduledDate.day < currentDate.day)));

        if (isScheduledToday || isPastDue) {
          const homeData = clubLookup.get(f.homeClubId) ?? {
            id: f.homeClubId,
            name: f.homeClubName,
            shortName: f.homeClubName,
            colors: { primary: '#333333', secondary: '#ffffff' },
            reputation: 50,
          };

          const awayData = clubLookup.get(f.awayClubId) ?? {
            id: f.awayClubId,
            name: f.awayClubName,
            shortName: f.awayClubName,
            colors: { primary: '#666666', secondary: '#ffffff' },
            reputation: 50,
          };

          const result = resolveCompetitionFixture(comp, f, homeData, awayData, rng);
          fixtures[i] = result.updatedFixture;
          matchesPlayed.push(result.matchRecord);
          standings = updateStandingsWithFixtureResult(standings, result.updatedFixture);
          fixturesChanged = true;
          compStatus = 'in_progress';
        }
      }
    }

    // 2. Check if all regular fixtures are played
    const allPlayed = fixtures.every((f) => f.status === 'played');
    let championId = comp.championClubId;
    let championName = comp.championClubName;
    let runnerUpId = comp.runnerUpClubId;
    let runnerUpName = comp.runnerUpClubName;
    let playoffScheduled = comp.tiebreakerPlayoffScheduled;

    if (allPlayed && fixtures.length > 0) {
      const first = standings[0];
      const second = standings[1];

      // Check if there is a point tie at the top (1910s rule: tie in points requires Match de Desempate)
      if (first && second && first.points === second.points && !playoffScheduled) {
        // Schedule a playoff match 7 days later
        const playoffDate: GameDate = {
          year: currentDate.year,
          month: currentDate.month,
          day: Math.min(28, currentDate.day + 7),
        };

        const playoffFixture: CompetitionFixture = {
          id: `fix_${comp.id}_playoff_final`,
          round: fixtures.length + 1,
          scheduledDate: playoffDate,
          homeClubId: first.clubId,
          homeClubName: first.clubName,
          awayClubId: second.clubId,
          awayClubName: second.clubName,
          status: 'scheduled',
        };

        fixtures.push(playoffFixture);
        playoffScheduled = true;
        fixturesChanged = true;

        notifications.push({
          id: `tiebreaker_${comp.id}`,
          title: `Match de Desempate: ${first.clubName} x ${second.clubName}!`,
          description: `Empate histórico em pontos na liderança da ${comp.shortName}! Conforme o estatuto esportivo da época, o certame será decidido em prélio extra de desempate!`,
        });
      } else if (first) {
        // Championship concluded!
        compStatus = 'completed';
        championId = first.clubId;
        championName = first.clubName;
        runnerUpId = second?.clubId;
        runnerUpName = second?.clubName;

        if (comp.trophy) {
          trophiesAwarded.push({
            clubId: championId,
            trophy: comp.trophy,
          });
        }

        notifications.push({
          id: `champion_${comp.id}`,
          title: `🏆 ${championName} é o Campeão de ${comp.year}!`,
          description: `Fim do certame! Com memorável campanha, o ${championName} conquista a ${comp.name}${runnerUpName ? ` tendo o ${runnerUpName} como vice-campeão` : ''}! Viva o campeão!`,
        });
      }
    }

    const updatedComp: CompetitionState = {
      ...comp,
      status: compStatus,
      fixtures,
      standings,
      ...(championId ? { championClubId: championId } : {}),
      ...(championName ? { championClubName: championName } : {}),
      ...(runnerUpId ? { runnerUpClubId: runnerUpId } : {}),
      ...(runnerUpName ? { runnerUpClubName: runnerUpName } : {}),
      ...(playoffScheduled !== undefined ? { tiebreakerPlayoffScheduled: playoffScheduled } : {}),
    };

    updatedCompetitions.push(validateCompetitionState(updatedComp)!);
  }

  return {
    updatedCompetitions,
    matchesPlayed,
    trophiesAwarded,
    notifications,
  };
}
