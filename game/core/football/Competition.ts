import type { GameDate } from '../HistoricalClock';

export type CompetitionFormat =
  | 'single_round_robin'   // Turno único (1910–1914)
  | 'double_round_robin'   // Turno e returno (1915+)
  | 'knockout'             // Taça eliminatória
  | 'playoff_tiebreaker';  // Match de desempate por título

export type CompetitionOrganizer =
  | 'municipal_clubs'      // Torneio citadino organizado pelos clubes (1910–1914)
  | 'lmdt'                 // Liga Mineira de Desportos Terrestres (1915+)
  | 'amea'                 // Liga dissidente Associação Mineira de Esportes Athleticos (1916)
  | 'fmf';                 // Federação Mineira de Futebol (anos posteriores)

export type CompetitionTier =
  | 'national_championship' // Taça Brasil / Campeonato Brasileiro (1959)
  | 'state_first_division' // Campeonato da Cidade / Campeonato Mineiro 1ª Divisão
  | 'city_cup'             // Taça Cidade de Minas / Torneio Início
  | 'interior_cup';        // Taça Minas Gerais / Campeões do Interior

export type CompetitionStatus = 'scheduled' | 'in_progress' | 'completed';

export interface CompetitionFixture {
  readonly id: string;
  readonly round: number;
  readonly scheduledDate: Readonly<GameDate>;
  readonly homeClubId: string;
  readonly homeClubName: string;
  readonly awayClubId: string;
  readonly awayClubName: string;
  readonly status: 'scheduled' | 'played';
  readonly result?: {
    readonly homeScore: number;
    readonly awayScore: number;
    readonly matchRecordId?: string;
  };
}

export interface StandingsEntry {
  readonly clubId: string;
  readonly clubName: string;
  readonly played: number;
  readonly won: number;
  readonly drawn: number;
  readonly lost: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDifference: number;
  /**
   * 1910-era rules: 2 points for a win, 1 point for a draw, 0 for a loss.
   */
  readonly points: number;
}

export interface ClubTrophy {
  readonly id: string;
  readonly competitionId: string;
  readonly competitionName: string;
  readonly year: number;
  readonly date: Readonly<GameDate>;
  readonly tier: CompetitionTier;
  readonly description: string;
}

export interface CompetitionState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly year: number;
  readonly organizer: CompetitionOrganizer;
  readonly tier: CompetitionTier;
  readonly format: CompetitionFormat;
  readonly status: CompetitionStatus;
  readonly participatingClubIds: readonly string[];
  readonly fixtures: readonly CompetitionFixture[];
  readonly standings: readonly StandingsEntry[];
  readonly championClubId?: string;
  readonly championClubName?: string;
  readonly runnerUpClubId?: string;
  readonly runnerUpClubName?: string;
  readonly trophy?: ClubTrophy;
  readonly tiebreakerPlayoffScheduled?: boolean;
}

/**
 * Sorts standings table according to 1910s sporting criteria:
 * 1. Points (2 pts per win, 1 per draw)
 * 2. Goal difference
 * 3. Goals scored (goalsFor)
 * 4. Club name alphabetically
 */
export function sortStandings(entries: readonly StandingsEntry[]): StandingsEntry[] {
  return [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.clubName.localeCompare(b.clubName);
  });
}

/**
 * Validates and freezes a CompetitionState object defensiveliy.
 */
export function validateCompetitionState(value: unknown): CompetitionState | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>;

  if (typeof c.id !== 'string' || !c.id.trim()) return null;
  if (typeof c.name !== 'string' || !c.name.trim()) return null;
  if (typeof c.shortName !== 'string' || !c.shortName.trim()) return null;
  if (typeof c.year !== 'number' || c.year < 1910 || c.year > 1959) return null;

  const validFormats: readonly CompetitionFormat[] = [
    'single_round_robin',
    'double_round_robin',
    'knockout',
    'playoff_tiebreaker',
  ];
  if (!validFormats.includes(c.format as CompetitionFormat)) return null;

  const validOrganizers: readonly CompetitionOrganizer[] = [
    'municipal_clubs',
    'lmdt',
    'amea',
    'fmf',
  ];
  if (!validOrganizers.includes(c.organizer as CompetitionOrganizer)) return null;

  const validTiers: readonly CompetitionTier[] = [
    'national_championship',
    'state_first_division',
    'city_cup',
    'interior_cup',
  ];
  if (!validTiers.includes(c.tier as CompetitionTier)) return null;

  const validStatuses: readonly CompetitionStatus[] = ['scheduled', 'in_progress', 'completed'];
  if (!validStatuses.includes(c.status as CompetitionStatus)) return null;

  if (!Array.isArray(c.participatingClubIds)) return null;
  if (!Array.isArray(c.fixtures)) return null;
  if (!Array.isArray(c.standings)) return null;

  const validatedFixtures: CompetitionFixture[] = [];
  for (const item of c.fixtures) {
    if (!item || typeof item !== 'object') return null;
    const f = item as Record<string, unknown>;
    if (typeof f.id !== 'string') return null;
    if (typeof f.round !== 'number') return null;
    if (typeof f.homeClubId !== 'string' || typeof f.awayClubId !== 'string') return null;
    if (typeof f.homeClubName !== 'string' || typeof f.awayClubName !== 'string') return null;
    if (f.status !== 'scheduled' && f.status !== 'played') return null;

    let res: CompetitionFixture['result'] = undefined;
    if (f.result && typeof f.result === 'object') {
      const r = f.result as Record<string, unknown>;
      if (typeof r.homeScore === 'number' && typeof r.awayScore === 'number') {
        res = Object.freeze({
          homeScore: r.homeScore,
          awayScore: r.awayScore,
          ...(typeof r.matchRecordId === 'string' ? { matchRecordId: r.matchRecordId } : {}),
        });
      }
    }

    const sDate = f.scheduledDate as Record<string, unknown>;
    if (!sDate || typeof sDate.year !== 'number') return null;

    validatedFixtures.push(
      Object.freeze({
        id: f.id,
        round: f.round,
        scheduledDate: Object.freeze({
          year: sDate.year as number,
          month: sDate.month as number,
          day: sDate.day as number,
        }),
        homeClubId: f.homeClubId,
        homeClubName: f.homeClubName,
        awayClubId: f.awayClubId,
        awayClubName: f.awayClubName,
        status: f.status,
        ...(res ? { result: res } : {}),
      })
    );
  }

  const validatedStandings: StandingsEntry[] = [];
  for (const item of c.standings) {
    if (!item || typeof item !== 'object') return null;
    const s = item as Record<string, unknown>;
    if (typeof s.clubId !== 'string' || typeof s.clubName !== 'string') return null;
    validatedStandings.push(
      Object.freeze({
        clubId: s.clubId,
        clubName: s.clubName,
        played: typeof s.played === 'number' ? s.played : 0,
        won: typeof s.won === 'number' ? s.won : 0,
        drawn: typeof s.drawn === 'number' ? s.drawn : 0,
        lost: typeof s.lost === 'number' ? s.lost : 0,
        goalsFor: typeof s.goalsFor === 'number' ? s.goalsFor : 0,
        goalsAgainst: typeof s.goalsAgainst === 'number' ? s.goalsAgainst : 0,
        goalDifference: typeof s.goalDifference === 'number' ? s.goalDifference : 0,
        points: typeof s.points === 'number' ? s.points : 0,
      })
    );
  }

  let trophy: ClubTrophy | undefined = undefined;
  if (c.trophy && typeof c.trophy === 'object') {
    const t = c.trophy as Record<string, unknown>;
    const tDate = t.date as Record<string, unknown>;
    if (typeof t.id === 'string' && typeof t.competitionName === 'string') {
      trophy = Object.freeze({
        id: t.id,
        competitionId: typeof t.competitionId === 'string' ? t.competitionId : (c.id as string),
        competitionName: t.competitionName,
        year: typeof t.year === 'number' ? t.year : (c.year as number),
        date: Object.freeze({
          year: typeof tDate?.year === 'number' ? tDate.year : (c.year as number),
          month: typeof tDate?.month === 'number' ? tDate.month : 11,
          day: typeof tDate?.day === 'number' ? tDate.day : 15,
        }),
        tier: validTiers.includes(t.tier as CompetitionTier) ? (t.tier as CompetitionTier) : 'state_first_division',
        description: typeof t.description === 'string' ? t.description : 'Troféu oficial de campeão.',
      });
    }
  }

  return Object.freeze({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    year: c.year,
    organizer: c.organizer as CompetitionOrganizer,
    tier: c.tier as CompetitionTier,
    format: c.format as CompetitionFormat,
    status: c.status as CompetitionStatus,
    participatingClubIds: Object.freeze([...c.participatingClubIds]),
    fixtures: Object.freeze(validatedFixtures),
    standings: Object.freeze(validatedStandings),
    ...(typeof c.championClubId === 'string' ? { championClubId: c.championClubId } : {}),
    ...(typeof c.championClubName === 'string' ? { championClubName: c.championClubName } : {}),
    ...(typeof c.runnerUpClubId === 'string' ? { runnerUpClubId: c.runnerUpClubId } : {}),
    ...(typeof c.runnerUpClubName === 'string' ? { runnerUpClubName: c.runnerUpClubName } : {}),
    ...(trophy ? { trophy } : {}),
    ...(typeof c.tiebreakerPlayoffScheduled === 'boolean' ? { tiebreakerPlayoffScheduled: c.tiebreakerPlayoffScheduled } : {}),
  });
}
