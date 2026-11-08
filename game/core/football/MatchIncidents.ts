/**
 * Match Incidents and Disciplinary Consequences (Macroetapa 24, G2).
 * Handles conflicts, brawls, pitch invasions, and referee disputes emerging during high-tension derbies,
 * and enforces strict penalties from the Tribunal de Penas of the Federação (LMDT).
 *
 * CANONICAL INVARIANTS:
 * - "Não gamificar violência como benefício. Violência sem benefício."
 *   Incidents result strictly in disciplinary sanctions, pecuniary fines (PPU), stadium bans,
 *   player suspensions, and points deduction.
 * - Determinism: consumes exclusively CampaignRng (stream `events` or `football`), never unseeded randomness.
 */

import type { GameDate } from '../HistoricalClock';
import type { CampaignRng } from '../CampaignRng';
import type { MatchRecord } from './MatchEngine';
import type { RivalryRelationship, RivalryIncidentSummary } from './RivalryRelationship';

export type MatchIncidentType =
  | 'pitch_invasion'
  | 'player_brawl'
  | 'referee_protest'
  | 'field_abandonment'
  | 'bench_clash';

export interface DisciplinarySanction {
  readonly clubId: string;
  readonly clubName: string;
  readonly finePpu: number;
  readonly stadiumBanMatches: number;
  readonly suspendedPlayerIds: readonly string[];
  readonly suspendedPlayerNames: readonly string[];
  readonly pointsDeduction: number;
  readonly sentencePt: string;
}

export interface MatchIncidentEvent {
  readonly id: string;
  readonly matchId: string;
  readonly date: Readonly<GameDate>;
  readonly type: MatchIncidentType;
  readonly title: string;
  readonly descriptionPt: string;
  readonly homeClubId: string;
  readonly awayClubId: string;
  readonly sanctions: readonly DisciplinarySanction[];
}

export interface EvaluateIncidentParams {
  readonly matchRecord: MatchRecord;
  readonly rivalry?: RivalryRelationship;
  readonly isPlayoffOrFinal?: boolean;
  readonly rng: CampaignRng;
}

/**
 * Deterministically evaluates whether a match experiences an incident and calculates
 * the subsequent disciplinary rulings from the Tribunal de Penas.
 */
export function evaluateMatchIncidents(params: EvaluateIncidentParams): MatchIncidentEvent | null {
  const { matchRecord, rivalry, isPlayoffOrFinal, rng } = params;
  const stream = rng.events;

  const intensity = rivalry?.intensity ?? 20;

  // 1. Calculate incident probability based on rivalry tier and match heat
  let probability = 0.02; // Baseline 2%
  if (intensity >= 75) {
    probability = 0.35; // Deadly derby has high potential for incidents
  } else if (intensity >= 50) {
    probability = 0.18; // Fierce rivalry
  } else if (intensity >= 25) {
    probability = 0.05; // Traditional rivalry
  }

  if (isPlayoffOrFinal) {
    probability += 0.15;
  }

  const expulsions = matchRecord.events.filter((e) => e.type === 'expulsion');
  if (expulsions.length > 0) {
    probability += 0.15;
  }

  const goalDiff = Math.abs(matchRecord.homeScore - matchRecord.awayScore);
  if (goalDiff >= 4) {
    probability += 0.10; // Humiliating blowout
  }

  const roll = stream.next();
  if (roll > probability) {
    return null; // No incident occurred
  }

  // 2. Determine incident type
  let incidentType: MatchIncidentType;
  const typeRoll = stream.next();

  if (expulsions.length > 0 || typeRoll < 0.35) {
    incidentType = 'player_brawl';
  } else if (goalDiff >= 4 && typeRoll > 0.70) {
    incidentType = 'field_abandonment';
  } else if (typeRoll < 0.65) {
    incidentType = 'referee_protest';
  } else if (typeRoll < 0.85) {
    incidentType = 'pitch_invasion';
  } else {
    incidentType = 'bench_clash';
  }

  const incidentId = `inc_${matchRecord.id}_${incidentType}`;
  const homeName = matchRecord.homeClubName;
  const awayName = matchRecord.awayClubName;

  let title = '';
  let descriptionPt = '';
  const sanctions: DisciplinarySanction[] = [];

  const fineBase = Math.round(50 + stream.next() * 70); // 50–120 PPU

  switch (incidentType) {
    case 'player_brawl': {
      title = `Conflito Campal & Pugilato no Clássico`;
      descriptionPt = `Aos ânimos inflamados do prélio entre ${homeName} e ${awayName}, uma falta ríspida desencadeou agressões físicas generalizadas entre os atletas de ambos os quadros, forçando a intervenção dos dirigentes e da força pública.`;

      // Identify suspended players
      const homeSuspended: string[] = [];
      const homeSuspendedNames: string[] = [];
      const awaySuspended: string[] = [];
      const awaySuspendedNames: string[] = [];

      if (matchRecord.homeLineup.length > 0) {
        const pHome = matchRecord.homeLineup[Math.floor(stream.next() * matchRecord.homeLineup.length)]!;
        homeSuspended.push(pHome.footballerId);
        homeSuspendedNames.push(pHome.name);
      }
      if (matchRecord.awayLineup.length > 0) {
        const pAway = matchRecord.awayLineup[Math.floor(stream.next() * matchRecord.awayLineup.length)]!;
        awaySuspended.push(pAway.footballerId);
        awaySuspendedNames.push(pAway.name);
      }

      sanctions.push({
        clubId: matchRecord.homeClubId,
        clubName: homeName,
        finePpu: fineBase,
        stadiumBanMatches: 1,
        suspendedPlayerIds: Object.freeze(homeSuspended),
        suspendedPlayerNames: Object.freeze(homeSuspendedNames),
        pointsDeduction: 0,
        sentencePt: `Tribunal de Penas: Multa de ${fineBase} PPU por conduta antidesportiva, interdição do campo por 1 prélio e suspensão de atleta (${homeSuspendedNames.join(', ')}).`,
      });

      sanctions.push({
        clubId: matchRecord.awayClubId,
        clubName: awayName,
        finePpu: fineBase,
        stadiumBanMatches: 0,
        suspendedPlayerIds: Object.freeze(awaySuspended),
        suspendedPlayerNames: Object.freeze(awaySuspendedNames),
        pointsDeduction: 0,
        sentencePt: `Tribunal de Penas: Multa de ${fineBase} PPU e suspensão de atleta (${awaySuspendedNames.join(', ')}).`,
      });
      break;
    }

    case 'referee_protest': {
      title = `Cerco Hostil à Arbitragem & Paralisação`;
      descriptionPt = `Após decisão controversa do juiz da partida, atletas e fiscais do ${homeName} cercaram a arbitragem em veementes protestos e ameaças, suspendendo o jogo momentaneamente.`;

      sanctions.push({
        clubId: matchRecord.homeClubId,
        clubName: homeName,
        finePpu: fineBase + 30,
        stadiumBanMatches: 1,
        suspendedPlayerIds: Object.freeze([]),
        suspendedPlayerNames: Object.freeze([]),
        pointsDeduction: 0,
        sentencePt: `Tribunal de Penas: Multa agravada de ${fineBase + 30} PPU ao clube mandante e advertência solene contra desacato à autoridade arbitral.`,
      });
      break;
    }

    case 'pitch_invasion': {
      title = `Invasão de Campo por Populares`;
      descriptionPt = `A massa de torcedores nas cercanias do relvado rompeu os tapumes de madeira e invadiu o campo de jogo em protesto, paralisando as ações e provocando correria generalizada.`;

      sanctions.push({
        clubId: matchRecord.homeClubId,
        clubName: homeName,
        finePpu: fineBase + 50,
        stadiumBanMatches: 2,
        suspendedPlayerIds: Object.freeze([]),
        suspendedPlayerNames: Object.freeze([]),
        pointsDeduction: 0,
        sentencePt: `Tribunal de Penas: Perda de mando de campo por 2 partidas e multa de ${fineBase + 50} PPU por falha grave de segurança no estádio.`,
      });
      break;
    }

    case 'field_abandonment': {
      title = `Abandono de Campo em Sinal de Protesto`;
      descriptionPt = `Em desacordo insolúvel com os rumos do encontro, a diretoria e capitão do ${awayName} ordenaram a retirada definitiva do seu esquadrão de campo antes do apito final.`;

      sanctions.push({
        clubId: matchRecord.awayClubId,
        clubName: awayName,
        finePpu: fineBase + 60,
        stadiumBanMatches: 0,
        suspendedPlayerIds: Object.freeze([]),
        suspendedPlayerNames: Object.freeze([]),
        pointsDeduction: 1,
        sentencePt: `Tribunal de Penas: Perda de 1 ponto na tabela, multa exemplar de ${fineBase + 60} PPU e suspensão temporária do capitão por abandono de certame.`,
      });
      break;
    }

    case 'bench_clash':
    default: {
      title = `Tumulto de Dirigentes à Beira do Gramado`;
      descriptionPt = `Áspera contenda verbal entre membros das diretorias de ${homeName} e ${awayName} nas linhas laterais, com insultos trocados e tentativa de agressão mútua.`;

      sanctions.push({
        clubId: matchRecord.homeClubId,
        clubName: homeName,
        finePpu: 40,
        stadiumBanMatches: 0,
        suspendedPlayerIds: Object.freeze([]),
        suspendedPlayerNames: Object.freeze([]),
        pointsDeduction: 0,
        sentencePt: `Tribunal de Penas: Advertência pública aos diretores e multa de 40 PPU.`,
      });
      sanctions.push({
        clubId: matchRecord.awayClubId,
        clubName: awayName,
        finePpu: 40,
        stadiumBanMatches: 0,
        suspendedPlayerIds: Object.freeze([]),
        suspendedPlayerNames: Object.freeze([]),
        pointsDeduction: 0,
        sentencePt: `Tribunal de Penas: Advertência pública aos diretores e multa de 40 PPU.`,
      });
      break;
    }
  }

  return Object.freeze({
    id: incidentId,
    matchId: matchRecord.id,
    date: matchRecord.date,
    type: incidentType,
    title,
    descriptionPt,
    homeClubId: matchRecord.homeClubId,
    awayClubId: matchRecord.awayClubId,
    sanctions: Object.freeze(sanctions),
  });
}

/**
 * Summarizes an incident event into a RivalryIncidentSummary for historical storage.
 */
export function summarizeIncidentForRivalry(incident: MatchIncidentEvent): RivalryIncidentSummary {
  const sanctionsSummary = incident.sanctions
    .map((s) => `${s.clubName}: ${s.finePpu} PPU de multa` + (s.stadiumBanMatches > 0 ? `, ${s.stadiumBanMatches} jogo(s) de perda de mando` : ''))
    .join(' | ');

  return Object.freeze({
    id: incident.id,
    date: incident.date,
    matchId: incident.matchId,
    type: incident.type,
    title: incident.title,
    descriptionPt: incident.descriptionPt,
    sanctionsSummary,
  });
}

/**
 * Validates a MatchIncidentEvent defensibly.
 */
export function validateMatchIncidentEvent(data: unknown): MatchIncidentEvent | null {
  if (!data || typeof data !== 'object') return null;
  const i = data as Partial<MatchIncidentEvent>;

  if (typeof i.id !== 'string' || i.id.trim().length === 0) return null;
  if (typeof i.matchId !== 'string' || typeof i.title !== 'string') return null;
  if (typeof i.type !== 'string' || typeof i.descriptionPt !== 'string') return null;
  if (!Array.isArray(i.sanctions)) return null;

  return Object.freeze({
    id: i.id,
    matchId: i.matchId,
    date: i.date ?? { year: 1910, month: 1, day: 1 },
    type: i.type as MatchIncidentType,
    title: i.title,
    descriptionPt: i.descriptionPt,
    homeClubId: i.homeClubId ?? '',
    awayClubId: i.awayClubId ?? '',
    sanctions: Object.freeze(i.sanctions as DisciplinarySanction[]),
  });
}
