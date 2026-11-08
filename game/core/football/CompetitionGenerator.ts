import type { GameDate } from '../HistoricalClock';
import type { CampaignRng } from '../CampaignRng';
import type { LocalClubState } from '../club/ClubBirthEngine';
import type { RegionalClubState } from '../club/RegionalClub';
import type { FederationState } from '../federation/Federation';
import type { ClubState } from '../club/Club';
import {
  validateCompetitionState,
  type CompetitionState,
  type CompetitionFixture,
  type StandingsEntry,
  type CompetitionOrganizer,
  type CompetitionTier,
  type CompetitionFormat,
} from './Competition';

export interface ClubParticipantSummary {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly isPlayer: boolean;
  readonly isDissident?: boolean;
}

/**
 * Generates regular Sunday match dates for rounds.
 * Starts in initialMonth and spaces rounds by roundIntervalDays (e.g. 7 or 14 days).
 */
export function generateRoundDates(
  year: number,
  roundCount: number,
  initialMonth = 5,
  initialDay = 7,
  roundIntervalDays = 7
): GameDate[] {
  const dates: GameDate[] = [];
  let currentMonth = initialMonth;
  let currentDay = initialDay;

  for (let r = 0; r < roundCount; r++) {
    dates.push({ year, month: currentMonth, day: currentDay });

    // Advance by interval
    currentDay += roundIntervalDays;
    const maxDays = (currentMonth === 2 ? (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28) : (currentMonth === 4 || currentMonth === 6 || currentMonth === 9 || currentMonth === 11 ? 30 : 31));
    if (currentDay > maxDays) {
      currentDay -= maxDays;
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 12;
        currentDay = 31;
      }
    }
  }

  return dates;
}

/**
 * Standard Berger / Circle algorithm for round-robin scheduling.
 */
export function generateRoundRobinFixtures(
  competitionId: string,
  participants: readonly ClubParticipantSummary[],
  year: number,
  doubleRound = false,
  initialMonth = 5
): CompetitionFixture[] {
  if (participants.length < 2) return [];

  const clubs = [...participants];
  const hasDummy = clubs.length % 2 !== 0;
  if (hasDummy) {
    clubs.push({
      id: '__bye__',
      name: 'Folga',
      shortName: 'Folga',
      isPlayer: false,
    });
  }

  const n = clubs.length;
  const singleRoundsCount = n - 1;
  const totalRounds = doubleRound ? singleRoundsCount * 2 : singleRoundsCount;
  const roundDates = generateRoundDates(year, totalRounds, initialMonth, 7, 7);

  const fixtures: CompetitionFixture[] = [];
  let fixtureSeq = 1;

  // First round-robin (Turno)
  for (let r = 0; r < singleRoundsCount; r++) {
    const roundDate = roundDates[r] ?? { year, month: 5, day: 7 + r * 7 };
    const roundNumber = r + 1;

    for (let i = 0; i < n / 2; i++) {
      const homeIdx = (r + i) % (n - 1);
      let awayIdx = (n - 1 - i + r) % (n - 1);
      if (i === 0) awayIdx = n - 1;

      const home = clubs[homeIdx]!;
      const away = clubs[awayIdx]!;

      // Skip bye match
      if (home.id === '__bye__' || away.id === '__bye__') continue;

      // Alternate home/away to balance field advantage
      const [finalHome, finalAway] = (r + i) % 2 === 0 ? [home, away] : [away, home];

      fixtures.push({
        id: `fix_${competitionId}_r${roundNumber}_${fixtureSeq++}`,
        round: roundNumber,
        scheduledDate: roundDate,
        homeClubId: finalHome.id,
        homeClubName: finalHome.name,
        awayClubId: finalAway.id,
        awayClubName: finalAway.name,
        status: 'scheduled',
      });
    }
  }

  // Second round-robin (Returno) if requested
  if (doubleRound) {
    for (let r = 0; r < singleRoundsCount; r++) {
      const roundDate = roundDates[singleRoundsCount + r] ?? { year, month: 8, day: 7 + r * 7 };
      const roundNumber = singleRoundsCount + r + 1;

      for (let i = 0; i < n / 2; i++) {
        const homeIdx = (r + i) % (n - 1);
        let awayIdx = (n - 1 - i + r) % (n - 1);
        if (i === 0) awayIdx = n - 1;

        const home = clubs[homeIdx]!;
        const away = clubs[awayIdx]!;

        if (home.id === '__bye__' || away.id === '__bye__') continue;

        // Invert home/away from first round-robin
        const [finalHome, finalAway] = (r + i) % 2 === 0 ? [away, home] : [home, away];

        fixtures.push({
          id: `fix_${competitionId}_r${roundNumber}_${fixtureSeq++}`,
          round: roundNumber,
          scheduledDate: roundDate,
          homeClubId: finalHome.id,
          homeClubName: finalHome.name,
          awayClubId: finalAway.id,
          awayClubName: finalAway.name,
          status: 'scheduled',
        });
      }
    }
  }

  return fixtures;
}

/**
 * Builds initial clean standings for all competing clubs.
 */
export function createInitialStandings(participants: readonly ClubParticipantSummary[]): StandingsEntry[] {
  return participants.map((p) => ({
    clubId: p.id,
    clubName: p.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
}

/**
 * Deterministically generates official competitions for the year according to era and federation status.
 *
 * CANONICAL RULES:
 * 1. 1910–1914 (Pre-Federation):
 *    - "Taça Cidade de Minas" organized municipally by local clubs + nearby regional invitee (Villa Nova).
 *    - Format: Turno Único (single round-robin).
 * 2. 1915 (Federation Inauguration):
 *    - "Campeonato da Cidade de 1915 (LMDT)" — Official state first division.
 *    - Format: Turno e Returno (double round-robin).
 * 3. 1916 (Federation Schism - AMEA):
 *    - Two parallel championships:
 *      a) LMDT Official Championship (loyalist clubs);
 *      b) AMEA Dissident Championship (dissident clubs);
 *    - Both crown their respective champions!
 * 4. 1917+ (Reunified era):
 *    - Unified LMDT State Championship.
 */
export function generateAnnualCompetitions(
  year: number,
  localClubs: readonly LocalClubState[],
  regionalClubs: readonly RegionalClubState[],
  arg4: FederationState | ClubState | null | undefined,
  arg5: ClubState | FederationState | null | undefined,
  rng: CampaignRng
): CompetitionState[] {
  let federation: FederationState | null = null;
  let playerClub: ClubState | null = null;

  if (arg4 && typeof arg4 === 'object' && 'affiliatedClubs' in arg4) {
    federation = arg4 as FederationState;
    if (arg5 && typeof arg5 === 'object' && 'foundingOrigin' in arg5) {
      playerClub = arg5 as ClubState;
    }
  } else if (arg4 && typeof arg4 === 'object' && 'foundingOrigin' in arg4) {
    playerClub = arg4 as ClubState;
    if (arg5 && typeof arg5 === 'object' && 'affiliatedClubs' in arg5) {
      federation = arg5 as FederationState;
    }
  } else {
    if (arg5 && typeof arg5 === 'object' && 'affiliatedClubs' in arg5) {
      federation = arg5 as FederationState;
    } else if (arg5 && typeof arg5 === 'object' && 'foundingOrigin' in arg5) {
      playerClub = arg5 as ClubState;
    }
  }

  const stream = rng.football;
  const competitions: CompetitionState[] = [];

  // Gather active participating clubs
  const activeLocal = localClubs.filter((c) => {
    if (c.status !== 'active') return false;
    const fYear = c.foundationDate?.year ?? (c as any).foundationYear ?? 1910;
    return fYear <= year;
  });
  const activeNearbyRegional = regionalClubs.filter(
    (c) => c.region === 'Central' && c.foundationYear <= year && c.railwayDistanceHours <= 2
  );

  const baseParticipants: ClubParticipantSummary[] = [];

  if (playerClub) {
    baseParticipants.push({
      id: playerClub.id,
      name: playerClub.name,
      shortName: playerClub.shortName,
      isPlayer: true,
    });
  }

  for (const lc of activeLocal) {
    baseParticipants.push({
      id: lc.id,
      name: lc.name,
      shortName: lc.shortName,
      isPlayer: false,
    });
  }

  for (const rc of activeNearbyRegional) {
    baseParticipants.push({
      id: rc.id,
      name: rc.name,
      shortName: rc.shortName,
      isPlayer: false,
    });
  }

  // Need at least 2 clubs to organize a competition
  if (baseParticipants.length < 2) return [];

  // --- Scenario 1: Pre-LMDT Era (1910 to 1914) ---
  if (year < 1915) {
    const compId = `comp_${year}_taca_cidade_minas`;
    const fixtures = generateRoundRobinFixtures(compId, baseParticipants, year, false, 5);
    const standings = createInitialStandings(baseParticipants);

    const comp: CompetitionState = {
      id: compId,
      name: `Taça Cidade de Minas de ${year}`,
      shortName: 'Taça Cidade de Minas',
      year,
      organizer: 'municipal_clubs',
      tier: 'city_cup',
      format: 'single_round_robin',
      status: 'scheduled',
      participatingClubIds: baseParticipants.map((p) => p.id),
      fixtures,
      standings,
      trophy: {
        id: `trophy_${compId}`,
        competitionId: compId,
        competitionName: `Taça Cidade de Minas de ${year}`,
        year,
        date: { year, month: 10, day: 15 },
        tier: 'city_cup',
        description: `Troféu de prata cinzelada conferido ao campeão municipal de Cidade de Minas em ${year}.`,
      },
    };

    const validated = validateCompetitionState(comp);
    if (validated) competitions.push(validated);
    return competitions;
  }

  // --- Scenario 2: 1916 Historical Schism (LMDT vs AMEA) ---
  if (year === 1916 && federation?.status === 'schism' && federation.dissidentLeague) {
    const dissidentIds = new Set(federation.dissidentLeague.memberClubIds);

    const lmdtParticipants = baseParticipants.filter((p) => !dissidentIds.has(p.id));
    const ameaParticipants = baseParticipants.filter((p) => dissidentIds.has(p.id));

    // Ensure at least 2 clubs in each league (if one side is empty, rebalance)
    if (lmdtParticipants.length >= 2) {
      const lmdtId = `comp_${year}_campeonato_lmdt`;
      const lmdtFixtures = generateRoundRobinFixtures(lmdtId, lmdtParticipants, year, true, 4);
      const lmdtStandings = createInitialStandings(lmdtParticipants);

      const lmdtComp: CompetitionState = {
        id: lmdtId,
        name: `Campeonato da Cidade de 1916 (LMDT Oficial)`,
        shortName: 'Camp. Mineiro LMDT',
        year,
        organizer: 'lmdt',
        tier: 'state_first_division',
        format: 'double_round_robin',
        status: 'scheduled',
        participatingClubIds: lmdtParticipants.map((p) => p.id),
        fixtures: lmdtFixtures,
        standings: lmdtStandings,
        trophy: {
          id: `trophy_${lmdtId}`,
          competitionId: lmdtId,
          competitionName: `Campeonato da Cidade de 1916 (LMDT)`,
          year,
          date: { year, month: 11, day: 26 },
          tier: 'state_first_division',
          description: `Taça Oficial da Liga Mineira de Desportos Terrestres de 1916.`,
        },
      };
      const vLmdt = validateCompetitionState(lmdtComp);
      if (vLmdt) competitions.push(vLmdt);
    }

    if (ameaParticipants.length >= 2) {
      const ameaId = `comp_${year}_campeonato_amea`;
      const ameaFixtures = generateRoundRobinFixtures(ameaId, ameaParticipants, year, true, 4);
      const ameaStandings = createInitialStandings(ameaParticipants);

      const ameaComp: CompetitionState = {
        id: ameaId,
        name: `Campeonato Oficial da AMEA de 1916 (Dissidente)`,
        shortName: 'Camp. Mineiro AMEA',
        year,
        organizer: 'amea',
        tier: 'state_first_division',
        format: 'double_round_robin',
        status: 'scheduled',
        participatingClubIds: ameaParticipants.map((p) => p.id),
        fixtures: ameaFixtures,
        standings: ameaStandings,
        trophy: {
          id: `trophy_${ameaId}`,
          competitionId: ameaId,
          competitionName: `Campeonato da AMEA de 1916`,
          year,
          date: { year, month: 11, day: 26 },
          tier: 'state_first_division',
          description: `Taça da Associação Mineira de Esportes Athleticos de 1916.`,
        },
      };
      const vAmea = validateCompetitionState(ameaComp);
      if (vAmea) competitions.push(vAmea);
    }

    return competitions;
  }

  // --- Scenario 3: Standard Federation Era (1915 and 1917+) ---
  const stateCompId = `comp_${year}_campeonato_mineiro`;
  const stateFixtures = generateRoundRobinFixtures(stateCompId, baseParticipants, year, true, 4);
  const stateStandings = createInitialStandings(baseParticipants);

  const stateComp: CompetitionState = {
    id: stateCompId,
    name: year === 1915 ? `1º Campeonato da Cidade de 1915 (LMDT)` : `Campeonato Mineiro da LMDT de ${year}`,
    shortName: year === 1915 ? '1º Camp. Cidade (LMDT)' : 'Campeonato Mineiro',
    year,
    organizer: 'lmdt',
    tier: 'state_first_division',
    format: 'double_round_robin',
    status: 'scheduled',
    participatingClubIds: baseParticipants.map((p) => p.id),
    fixtures: stateFixtures,
    standings: stateStandings,
    trophy: {
      id: `trophy_${stateCompId}`,
      competitionId: stateCompId,
      competitionName: year === 1915 ? `1º Campeonato da Cidade de 1915 (LMDT)` : `Campeonato Mineiro da LMDT de ${year}`,
      year,
      date: { year, month: 11, day: 20 },
      tier: 'state_first_division',
      description: `Troféu Perpétuo da Liga Mineira de Desportos Terrestres ofertado ao campeão de ${year}.`,
    },
  };

  const vState = validateCompetitionState(stateComp);
  if (vState) competitions.push(vState);

  return competitions;
}
