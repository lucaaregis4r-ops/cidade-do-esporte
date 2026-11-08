/**
 * LegacyScore and Club Legends domain model (Alpha G: G6 / Macroetapa 30).
 * Evaluates the historical legacy of players, presidents, and founders.
 *
 * CANONICAL RULES:
 * - Deterministic: 100% causal, zero unseeded randomness or uncontrolled PRNG.
 * - Canonical categories: MEMORAVEL / IDOLO / LENDA / FIGURA_FUNDADORA.
 * - Score based on authentic historical factors:
 *   years of service, official titles, decisive matches/derbies, loyalty,
 *   institutional impact, and founding status.
 */

import type { GameDate } from '../HistoricalClock';
import type { Footballer } from '../football/Footballer';
import type { Person } from '../person/Person';
import type { ClubState } from './Club';

export type LegendCategory = 'MEMORAVEL' | 'IDOLO' | 'LENDA' | 'FIGURA_FUNDADORA';
export type LegendRole = 'player' | 'president' | 'founder';

export interface LegacyScoreBreakdown {
  readonly yearsDedicationScore: number;
  readonly titlesScore: number;
  readonly matchesScore: number;
  readonly decisiveMomentsScore: number;
  readonly loyaltyScore: number;
  readonly institutionalImpactScore: number;
  readonly founderBonusScore: number;
  readonly totalScore: number;
}

export interface ClubLegend {
  readonly id: string;
  readonly personId: string;
  readonly name: string;
  readonly role: LegendRole;
  readonly category: LegendCategory;
  readonly legacyScore: number;
  readonly breakdown: LegacyScoreBreakdown;
  readonly yearsActivePt: string;
  readonly titlesCount: number;
  readonly matchesCount: number;
  readonly isFounder: boolean;
  readonly isLiving: boolean;
  readonly biography: string;
  readonly achievementsPt: readonly string[];
  readonly honorsReceived: readonly string[];
}

/**
 * Calculates legacy score for a footballer.
 */
export function calculatePlayerLegacyScore(input: {
  readonly player: Readonly<Footballer>;
  readonly titlesCount: number;
  readonly matchesCount: number;
  readonly yearsAtClub: number;
  readonly decisiveMomentsCount: number;
  readonly isLoyal: boolean;
  readonly isFounder: boolean;
  readonly currentYear: number;
}): ClubLegend {
  const yearsDedicationScore = Math.min(40, input.yearsAtClub * 5);
  const titlesScore = input.titlesCount * 25;
  const matchesScore = Math.min(30, Math.floor(input.matchesCount / 3));
  const decisiveMomentsScore = Math.min(25, input.decisiveMomentsCount * 8);
  const loyaltyScore = input.isLoyal ? 15 : 0;
  const institutionalImpactScore = 0;
  const founderBonusScore = input.isFounder ? 35 : 0;

  const totalScore =
    yearsDedicationScore +
    titlesScore +
    matchesScore +
    decisiveMomentsScore +
    loyaltyScore +
    founderBonusScore;

  let category: LegendCategory = 'MEMORAVEL';
  if (input.isFounder) {
    category = totalScore >= 80 ? 'LENDA' : 'FIGURA_FUNDADORA';
  } else if (totalScore >= 80) {
    category = 'LENDA';
  } else if (totalScore >= 50) {
    category = 'IDOLO';
  } else {
    category = 'MEMORAVEL';
  }

  const startYear = Math.max(1910, input.currentYear - input.yearsAtClub);
  const yearsActivePt = `${startYear}–${input.currentYear}`;

  const achievements: string[] = [];
  if (input.isFounder) achievements.push('Membro fundador do clube na pioneira reunião de 1910');
  if (input.titlesCount > 0) achievements.push(`Campeão de ${input.titlesCount} certame(s) oficial(is)`);
  if (input.matchesCount >= 10) achievements.push(`Mais de ${input.matchesCount} prélio(s) defendendo o pavilhão`);
  if (input.decisiveMomentsCount > 0) achievements.push(`${input.decisiveMomentsCount} atuação(ões) decisiva(s) em dérbis capitais`);
  if (input.isLoyal) achievements.push('Fidelidade inabalável: jamais aceitou propostas dos rivais da capital');

  const posName = input.player.positions && input.player.positions.length > 0 ? input.player.positions[0] : 'atleta';
  const biography = `${input.player.name} consagrou-se como ${posName} da esquadra, disputando ${input.matchesCount} prélio(s) e erguendo ${input.titlesCount} taça(s). Sua têmpera e amor ao manto forjaram sua imortalidade no clube.`;

  return Object.freeze({
    id: `legend-${input.player.id}`,
    personId: input.player.personId,
    name: input.player.name,
    role: 'player',
    category,
    legacyScore: totalScore,
    breakdown: Object.freeze({
      yearsDedicationScore,
      titlesScore,
      matchesScore,
      decisiveMomentsScore,
      loyaltyScore,
      institutionalImpactScore,
      founderBonusScore,
      totalScore,
    }),
    yearsActivePt,
    titlesCount: input.titlesCount,
    matchesCount: input.matchesCount,
    isFounder: input.isFounder,
    isLiving: true,
    biography,
    achievementsPt: Object.freeze(achievements),
    honorsReceived: Object.freeze([]),
  });
}

/**
 * Calculates legacy score for a president or director.
 */
export function calculatePresidentLegacyScore(input: {
  readonly person: Readonly<Person> | { readonly id: string; readonly name: string; readonly deathDate?: Readonly<GameDate> };
  readonly mandateYears: number;
  readonly titlesCount: number;
  readonly facilitiesBuiltCount: number;
  readonly isFounder: boolean;
  readonly currentYear: number;
}): ClubLegend {
  const yearsDedicationScore = Math.min(35, input.mandateYears * 7);
  const titlesScore = input.titlesCount * 25;
  const matchesScore = 0;
  const decisiveMomentsScore = 0;
  const loyaltyScore = 15;
  const institutionalImpactScore = Math.min(30, input.facilitiesBuiltCount * 10);
  const founderBonusScore = input.isFounder ? 35 : 0;

  const totalScore =
    yearsDedicationScore +
    titlesScore +
    loyaltyScore +
    institutionalImpactScore +
    founderBonusScore;

  let category: LegendCategory = 'MEMORAVEL';
  if (input.isFounder) {
    category = totalScore >= 75 ? 'LENDA' : 'FIGURA_FUNDADORA';
  } else if (totalScore >= 75) {
    category = 'LENDA';
  } else if (totalScore >= 45) {
    category = 'IDOLO';
  } else {
    category = 'MEMORAVEL';
  }

  const startYear = Math.max(1910, input.currentYear - input.mandateYears);
  const yearsActivePt = `${startYear}–${input.currentYear}`;

  const achievements: string[] = [];
  if (input.isFounder) achievements.push('Pioneiro na redação da ata inaugural do clube em 1910');
  if (input.mandateYears > 0) achievements.push(`${input.mandateYears} ano(s) na presidência executiva`);
  if (input.titlesCount > 0) achievements.push(`${input.titlesCount} título(s) conquistados durante a gestão`);
  if (input.facilitiesBuiltCount > 0) achievements.push(`${input.facilitiesBuiltCount} grande(s) obra(s) e melhoria(s) patrimonial(is) inaugurada(s)`);

  const biography = `${input.person.name} liderou os destinos institucionais do clube com retidão e zelo cívico. Sob seu comando, o clube ergueu patrimônio e glórias que ecoarão pelas gerações futuras.`;

  return Object.freeze({
    id: `legend-${input.person.id}`,
    personId: input.person.id,
    name: input.person.name,
    role: input.isFounder ? 'founder' : 'president',
    category,
    legacyScore: totalScore,
    breakdown: Object.freeze({
      yearsDedicationScore,
      titlesScore,
      matchesScore,
      decisiveMomentsScore,
      loyaltyScore,
      institutionalImpactScore,
      founderBonusScore,
      totalScore,
    }),
    yearsActivePt,
    titlesCount: input.titlesCount,
    matchesCount: 0,
    isFounder: input.isFounder,
    isLiving: !input.person.deathDate,
    biography,
    achievementsPt: Object.freeze(achievements),
    honorsReceived: Object.freeze([]),
  });
}

/**
 * Evaluates the full club state and derives all eligible club legends.
 * Preserves previously granted institutional honors.
 */
export function evaluateClubLegends(
  club: Readonly<ClubState>,
  currentYear: number,
  existingLegends: readonly ClubLegend[] = []
): readonly ClubLegend[] {
  const result: ClubLegend[] = [];
  const honorsMap = new Map<string, string[]>();
  for (const ex of existingLegends) {
    if (ex.honorsReceived.length > 0) {
      honorsMap.set(ex.id, [...ex.honorsReceived]);
    }
  }

  const titlesCount = club.trophies?.length ?? 0;
  const facilitiesCount = club.facilities?.length ?? 1;

  // 1. Process current board president
  const presMember = club.board?.members.find((m) => m.role === 'presidente');
  if (presMember) {
    const personId = presMember.id;
    const isFounder = club.founders ? club.founders.includes(personId) : false;
    const yearsMandate = Math.max(1, currentYear - club.foundingDate.year);
    const presLegend = calculatePresidentLegacyScore({
      person: { id: personId, name: presMember.name },
      mandateYears: yearsMandate,
      titlesCount,
      facilitiesBuiltCount: facilitiesCount,
      isFounder,
      currentYear,
    });

    if (presLegend.legacyScore >= 25) {
      const existingHonors = honorsMap.get(presLegend.id) ?? [];
      result.push(
        Object.freeze({
          ...presLegend,
          honorsReceived: Object.freeze(existingHonors),
        })
      );
    }
  }

  // 2. Process squad players
  const footballers = club.squad?.footballers ?? [];
  if (footballers.length > 0) {
    const totalSquadMatches = club.matchHistory?.length ?? 0;
    for (const player of footballers) {
      const isFounder = club.founders ? club.founders.includes(player.personId) : false;
      const yearsAtClub = Math.max(1, currentYear - club.foundingDate.year);
      // Deterministic estimates based on role and squad status
      const matchesCount = player.squadRole === 'starter' ? Math.max(3, totalSquadMatches) : Math.floor(totalSquadMatches / 2);
      const isForward = player.positions.some((p) => p.includes('FW') || p === 'CF');
      const decisiveMomentsCount = isForward ? Math.floor(matchesCount / 2) : 1;

      const playerLegend = calculatePlayerLegacyScore({
        player,
        titlesCount,
        matchesCount,
        yearsAtClub,
        decisiveMomentsCount,
        isLoyal: true,
        isFounder,
        currentYear,
      });

      if (playerLegend.legacyScore >= 25) {
        const existingHonors = honorsMap.get(playerLegend.id) ?? [];
        result.push(
          Object.freeze({
            ...playerLegend,
            honorsReceived: Object.freeze(existingHonors),
          })
        );
      }
    }
  }

  // Sort by legacy score descending
  return Object.freeze(result.sort((a, b) => b.legacyScore - a.legacyScore));
}

/**
 * Validates a ClubLegend object defensivel.
 */
export function validateClubLegend(obj: unknown): obj is ClubLegend {
  if (!obj || typeof obj !== 'object') return false;
  const l = obj as Partial<ClubLegend>;
  const validCategories: LegendCategory[] = ['MEMORAVEL', 'IDOLO', 'LENDA', 'FIGURA_FUNDADORA'];
  return (
    typeof l.id === 'string' &&
    typeof l.name === 'string' &&
    typeof l.legacyScore === 'number' &&
    validCategories.includes(l.category as LegendCategory) &&
    Array.isArray(l.achievementsPt) &&
    Array.isArray(l.honorsReceived)
  );
}
