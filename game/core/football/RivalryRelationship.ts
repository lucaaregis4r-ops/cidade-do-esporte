/**
 * Rivalry Relationship domain model for historical football simulation (Macroetapa 23, G1).
 * Rivalries are never assigned by random lottery: they emerge causally from 5 structural axes:
 * 1. Geographic (proximity of urban districts in Cidade de Minas or regional origins);
 * 2. Sporting (head-to-head records, titles, decisive playoffs, blowouts);
 * 3. Social (clash of social classes, e.g. workers/railway vs elite/merchants);
 * 4. Political (competing federative blocs in LMDT, e.g. Aristocratic vs Popular/Interior);
 * 5. Historical (cismas, dissidences, and memorable past clashes).
 *
 * CANONICAL INVARIANTS:
 * - Determinism: no unseeded PRNG; all variance uses CampaignRng streams.
 * - Score bounds: all factors and global intensity strictly within [0, 100].
 */

import type { GameDate } from '../HistoricalClock';

export type RivalryTier = 'friendly' | 'traditional' | 'fierce' | 'deadly_derby';

export interface RivalryFactorScores {
  readonly geographic: number; // 0–100
  readonly sporting: number;   // 0–100
  readonly social: number;     // 0–100
  readonly political: number;  // 0–100
  readonly supporter: number;  // 0–100
  readonly historical: number; // 0–100
}

export interface HeadToHeadRecord {
  readonly totalMatches: number;
  readonly winsClubA: number;
  readonly draws: number;
  readonly winsClubB: number;
  readonly goalsClubA: number;
  readonly goalsClubB: number;
}

export interface RivalryIncidentSummary {
  readonly id: string;
  readonly date: Readonly<GameDate>;
  readonly matchId: string;
  readonly type: string;
  readonly title: string;
  readonly descriptionPt: string;
  readonly sanctionsSummary: string;
}

export interface RivalryRelationship {
  readonly id: string; // e.g. "riv_club1_club2" (sorted IDs)
  readonly clubs: readonly [string, string]; // sorted IDs
  readonly clubNames: readonly [string, string];
  readonly derbyName: string;
  readonly factors: Readonly<RivalryFactorScores>;
  readonly intensity: number; // 0–100
  readonly tier: RivalryTier;
  readonly headToHead: Readonly<HeadToHeadRecord>;
  readonly firstMatchDate?: Readonly<GameDate>;
  readonly majorMatches: readonly string[];
  readonly incidents: readonly RivalryIncidentSummary[];
  readonly historicalEvents: readonly string[];
}

/**
 * Creates a canonical, sorted rivalry identifier for two club IDs.
 */
export function makeRivalryId(clubAId: string, clubBId: string): string {
  const [first, second] = clubAId < clubBId ? [clubAId, clubBId] : [clubBId, clubAId];
  return `riv_${first}_${second}`;
}

/**
 * Classifies the rivalry tier based on intensity (0–100).
 */
export function classifyRivalryTier(intensity: number): RivalryTier {
  if (intensity >= 75) return 'deadly_derby';
  if (intensity >= 50) return 'fierce';
  if (intensity >= 25) return 'traditional';
  return 'friendly';
}

/**
 * Computes global rivalry intensity from its 6 constituent factors.
 * Weights:
 * - Sporting: 30%
 * - Geographic: 20%
 * - Social: 15%
 * - Political: 15%
 * - Historical: 10%
 * - Supporter: 10%
 */
export function computeRivalryIntensity(factors: RivalryFactorScores): number {
  const raw =
    factors.sporting * 0.30 +
    factors.geographic * 0.20 +
    factors.social * 0.15 +
    factors.political * 0.15 +
    factors.historical * 0.10 +
    factors.supporter * 0.10;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Procedurally generates an authentic, historical derby press title based on club origins and factors.
 */
export function generateDerbyName(
  clubAName: string,
  clubBName: string,
  originA?: string,
  originB?: string,
  factors?: Partial<RivalryFactorScores>,
  isRegional: boolean = false
): string {
  if (isRegional) {
    return 'O Choque Capital-Interior';
  }

  const hist = factors?.historical ?? 0;
  const soc = factors?.social ?? 0;
  const geo = factors?.geographic ?? 0;

  if (hist >= 70) {
    return 'O Dérbi da Dissidência';
  }

  const isLabor = (o?: string) => o === 'railway' || o === 'workers';
  const isElite = (o?: string) => o === 'elite' || o === 'merchants';
  const isAcad = (o?: string) => o === 'students';

  if (isLabor(originA) && isLabor(originB)) {
    return 'O Dérbi Operário-Ferroviário';
  }

  if ((isLabor(originA) && isElite(originB)) || (isLabor(originB) && isElite(originA))) {
    return 'O Choque de Classes';
  }

  if (isAcad(originA) || isAcad(originB)) {
    return 'O Dérbi Acadêmico';
  }

  if (geo >= 70) {
    return 'O Dérbi da Estação & Centro';
  }

  if (soc >= 50) {
    return 'O Clássico das Multidões';
  }

  return `O Clássico Municipal`;
}

export interface ClubSeedInfo {
  readonly id: string;
  readonly name: string;
  readonly origin?: string;
  readonly districtId?: string;
  readonly isDissidence?: boolean;
  readonly parentClubId?: string;
  readonly politicalBloc?: 'aristocratic' | 'popular' | 'independent';
  readonly isRegional?: boolean;
}

/**
 * Initializes a new RivalryRelationship causally from the structural attributes of two clubs.
 */
export function initializeRivalryBetweenClubs(
  clubA: ClubSeedInfo,
  clubB: ClubSeedInfo
): RivalryRelationship {
  const isSorted = clubA.id < clubB.id;
  const first = isSorted ? clubA : clubB;
  const second = isSorted ? clubB : clubA;

  const id = makeRivalryId(first.id, second.id);

  // 1. Geographic factor
  let geographic = 30; // Base municipal proximity
  if (first.isRegional || second.isRegional) {
    geographic = 20; // Intermunicipal
  } else if (first.districtId && second.districtId) {
    if (first.districtId === second.districtId) {
      geographic = 85; // Same district!
    } else {
      geographic = 50; // Different districts of Cidade de Minas
    }
  }

  // 2. Social factor
  let social = 25;
  const isLabor = (o?: string) => o === 'railway' || o === 'workers';
  const isElite = (o?: string) => o === 'elite' || o === 'merchants';
  if ((isLabor(first.origin) && isElite(second.origin)) || (isLabor(second.origin) && isElite(first.origin))) {
    social = 75; // Sharp class contrast
  } else if (first.origin && second.origin && first.origin === second.origin) {
    social = 20; // Shared origin
  } else {
    social = 40;
  }

  // 3. Political factor
  let political = 20;
  if (
    (first.politicalBloc === 'aristocratic' && second.politicalBloc === 'popular') ||
    (first.politicalBloc === 'popular' && second.politicalBloc === 'aristocratic')
  ) {
    political = 80;
  }

  // 4. Historical factor & Dissidence impact
  let historical = 15;
  let sporting = 15;
  let supporter = Math.round((geographic + social) / 2 * 0.6);

  const isDissidence =
    (first.isDissidence && first.parentClubId === second.id) ||
    (second.isDissidence && second.parentClubId === first.id);
  if (isDissidence) {
    historical = 85; // Splinter clubs have immense historical friction
    sporting = 40;   // Immediate competitive urge to prove legitimacy
    supporter = 70;  // Fans and members are split and intensely partisan
  }

  const factors: RivalryFactorScores = Object.freeze({
    geographic,
    sporting,
    social,
    political,
    supporter,
    historical,
  });

  const intensity = computeRivalryIntensity(factors);
  const tier = classifyRivalryTier(intensity);

  const derbyName = generateDerbyName(
    first.name,
    second.name,
    first.origin,
    second.origin,
    factors,
    Boolean(first.isRegional || second.isRegional)
  );

  const initialNotes: string[] = [];
  if (isDissidence) {
    initialNotes.push(`Rivalidade originada em cisma institucional e racha de quadro esportivo.`);
  }
  if (social >= 70) {
    initialNotes.push(`Marcada pelo contraste social entre suas bases associativas.`);
  }

  return Object.freeze({
    id,
    clubs: Object.freeze([first.id, second.id] as [string, string]),
    clubNames: Object.freeze([first.name, second.name] as [string, string]),
    derbyName,
    factors,
    intensity,
    tier,
    headToHead: Object.freeze({
      totalMatches: 0,
      winsClubA: 0,
      draws: 0,
      winsClubB: 0,
      goalsClubA: 0,
      goalsClubB: 0,
    }),
    majorMatches: Object.freeze([]),
    incidents: Object.freeze([]),
    historicalEvents: Object.freeze(initialNotes),
  });
}

export interface MatchUpdateInput {
  readonly matchId: string;
  readonly date: Readonly<GameDate>;
  readonly homeClubId: string;
  readonly awayClubId: string;
  readonly homeScore: number;
  readonly awayScore: number;
  readonly isPlayoffOrFinal?: boolean;
  readonly incidentsOccurred?: readonly RivalryIncidentSummary[];
}

/**
 * Updates a RivalryRelationship after a match is concluded between the two clubs.
 */
export function updateRivalryAfterMatch(
  rivalry: RivalryRelationship,
  match: MatchUpdateInput
): RivalryRelationship {
  const [firstId] = rivalry.clubs;
  const isHomeFirst = match.homeClubId === firstId;

  const scoreA = isHomeFirst ? match.homeScore : match.awayScore;
  const scoreB = isHomeFirst ? match.awayScore : match.homeScore;

  const winsA = scoreA > scoreB ? 1 : 0;
  const winsB = scoreB > scoreA ? 1 : 0;
  const draws = scoreA === scoreB ? 1 : 0;

  const prevH2H = rivalry.headToHead;
  const nextH2H: HeadToHeadRecord = Object.freeze({
    totalMatches: prevH2H.totalMatches + 1,
    winsClubA: prevH2H.winsClubA + winsA,
    draws: prevH2H.draws + draws,
    winsClubB: prevH2H.winsClubB + winsB,
    goalsClubA: prevH2H.goalsClubA + scoreA,
    goalsClubB: prevH2H.goalsClubB + scoreB,
  });

  // Calculate sporting escalation
  let sportingInc = 2; // +2 for each game played
  const goalDiff = Math.abs(scoreA - scoreB);
  if (goalDiff >= 3) {
    sportingInc += 8; // Blowout / goleada
  } else if (goalDiff === 0) {
    sportingInc += 3; // Tight draw
  }
  if (match.isPlayoffOrFinal) {
    sportingInc += 15; // Decisive playoff
  }

  // If incident occurred, increase historical and supporter tension
  const newIncidents = match.incidentsOccurred ?? [];
  const incidentScoreInc = newIncidents.length * 6;

  const nextFactors: RivalryFactorScores = Object.freeze({
    geographic: rivalry.factors.geographic,
    social: rivalry.factors.social,
    political: rivalry.factors.political,
    sporting: Math.min(100, rivalry.factors.sporting + sportingInc),
    supporter: Math.min(100, rivalry.factors.supporter + Math.round(sportingInc * 0.5) + (newIncidents.length > 0 ? 5 : 0)),
    historical: Math.min(100, rivalry.factors.historical + incidentScoreInc),
  });

  const nextIntensity = computeRivalryIntensity(nextFactors);
  const nextTier = classifyRivalryTier(nextIntensity);

  const majorMatches = [...rivalry.majorMatches];
  if (match.isPlayoffOrFinal) {
    majorMatches.push(
      `Decisão em ${match.date.day}/${match.date.month}/${match.date.year}: ${rivalry.clubNames[0]} ${scoreA} x ${scoreB} ${rivalry.clubNames[1]}`
    );
  } else if (goalDiff >= 3) {
    majorMatches.push(
      `Goleada em ${match.date.day}/${match.date.month}/${match.date.year}: ${rivalry.clubNames[0]} ${scoreA} x ${scoreB} ${rivalry.clubNames[1]}`
    );
  }

  const allIncidents = Object.freeze([...rivalry.incidents, ...newIncidents]);

  return Object.freeze({
    ...rivalry,
    factors: nextFactors,
    intensity: nextIntensity,
    tier: nextTier,
    headToHead: nextH2H,
    firstMatchDate: rivalry.firstMatchDate ?? match.date,
    majorMatches: Object.freeze(majorMatches),
    incidents: allIncidents,
  });
}

/**
 * Validates a RivalryRelationship object defensibly.
 */
export function validateRivalryRelationship(data: unknown): RivalryRelationship | null {
  if (!data || typeof data !== 'object') return null;
  const r = data as Partial<RivalryRelationship>;

  if (typeof r.id !== 'string' || r.id.trim().length === 0) return null;
  if (!Array.isArray(r.clubs) || r.clubs.length !== 2) return null;
  if (!Array.isArray(r.clubNames) || r.clubNames.length !== 2) return null;
  if (typeof r.derbyName !== 'string') return null;
  if (typeof r.intensity !== 'number' || !Number.isFinite(r.intensity)) return null;

  const f = r.factors as Partial<RivalryFactorScores> | undefined;
  if (!f || typeof f !== 'object') return null;
  if (
    typeof f.geographic !== 'number' ||
    typeof f.sporting !== 'number' ||
    typeof f.social !== 'number' ||
    typeof f.political !== 'number' ||
    typeof f.supporter !== 'number' ||
    typeof f.historical !== 'number'
  ) {
    return null;
  }

  const h2h = r.headToHead as Partial<HeadToHeadRecord> | undefined;
  if (!h2h || typeof h2h !== 'object') return null;

  return Object.freeze({
    id: r.id,
    clubs: Object.freeze([r.clubs[0], r.clubs[1]] as [string, string]),
    clubNames: Object.freeze([r.clubNames[0], r.clubNames[1]] as [string, string]),
    derbyName: r.derbyName,
    factors: Object.freeze({
      geographic: Math.max(0, Math.min(100, f.geographic)),
      sporting: Math.max(0, Math.min(100, f.sporting)),
      social: Math.max(0, Math.min(100, f.social)),
      political: Math.max(0, Math.min(100, f.political)),
      supporter: Math.max(0, Math.min(100, f.supporter)),
      historical: Math.max(0, Math.min(100, f.historical)),
    }),
    intensity: Math.max(0, Math.min(100, r.intensity)),
    tier: classifyRivalryTier(r.intensity),
    headToHead: Object.freeze({
      totalMatches: h2h.totalMatches ?? 0,
      winsClubA: h2h.winsClubA ?? 0,
      draws: h2h.draws ?? 0,
      winsClubB: h2h.winsClubB ?? 0,
      goalsClubA: h2h.goalsClubA ?? 0,
      goalsClubB: h2h.goalsClubB ?? 0,
    }),
    firstMatchDate: r.firstMatchDate,
    majorMatches: Array.isArray(r.majorMatches) ? Object.freeze([...r.majorMatches]) : Object.freeze([]),
    incidents: Array.isArray(r.incidents) ? Object.freeze([...r.incidents]) : Object.freeze([]),
    historicalEvents: Array.isArray(r.historicalEvents) ? Object.freeze([...r.historicalEvents]) : Object.freeze([]),
  });
}
