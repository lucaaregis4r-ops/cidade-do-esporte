/**
 * TraditionSystem domain model (Alpha G: G8 / Macroetapa 32).
 * Governs the immutable and evolving cultural heritage, symbols,
 * rituals, playing styles, and identity markers of a football club (1910–1959).
 *
 * CANONICAL OBJECTS:
 * - escudo / cores / estádio / bairro / origem / estilo / rivalidade / nomes / rituais
 *
 * CANONICAL RULES:
 * - Deterministic: purely causal, zero unseeded randomness or uncontrolled PRNG.
 * - Authenticity: reflects Brazilian club culture from 1910 to 1959.
 */

import type { FoundingOrigin, ClubColors, CrestVersion } from './Club';
import type { GameDate } from '../HistoricalClock';

export type PlayingStyle =
  | 'valente_combate'    // Força, fibra e raça proletária
  | 'escola_tecnica'     // Passe refinado e futebol acadêmico
  | 'rigor_defensivo'    // Linha média implacável e zaga intransponível
  | 'ataque_demolidor';  // Fúria ofensiva e pontas velozes

export interface ClubTraditionItem {
  readonly id: string;
  readonly namePt: string;
  readonly category: 'ritual' | 'nickname' | 'anthem' | 'symbol' | 'ground';
  readonly yearEstablished: number;
  readonly descriptionPt: string;
  readonly importanceScore: number; // 1-100
}

export interface ClubTraditionProfile {
  readonly clubId: string;
  readonly clubName: string;
  readonly foundingOrigin: FoundingOrigin;
  readonly homeNeighborhoodName: string;
  readonly currentColors: Readonly<ClubColors>;
  readonly currentStadiumName: string;
  readonly primaryPlayingStyle: PlayingStyle;
  readonly traditionalNicknames: readonly string[];
  readonly historicRituals: readonly ClubTraditionItem[];
  readonly traditionStrength: number; // 0-100
}

/**
 * Derives authentic traditional nicknames based on origin and colors.
 */
export function deriveTraditionalNicknames(
  origin: FoundingOrigin,
  clubName: string,
  colors: Readonly<ClubColors>
): readonly string[] {
  const nicknames: string[] = [];

  // Origin-based nicknames
  switch (origin) {
    case 'railway':
      nicknames.push('O Trem de Ferro', 'O Grêmio dos Trilhos', 'O Expresso da Central');
      break;
    case 'workers':
      nicknames.push('O Leão da Fábrica', 'O Brioso Operário', 'A Vanguarda Popular');
      break;
    case 'students':
      nicknames.push('O Alvinegro Acadêmico', 'Os Doutores da Bola', 'A Mocidade');
      break;
    case 'immigrants':
      nicknames.push('A Força Peninsular', 'Os Conquistadores', 'O Tricolor da Colônia');
      break;
    case 'merchants':
      nicknames.push('O Clube Comercial', 'Os Mascates da Capital', 'O Onze Central');
      break;
    case 'elite':
      nicknames.push('O Aristocrático', 'Os Nobres da Praça da Liberdade', 'O Decano');
      break;
  }

  // General historical nicknames
  nicknames.push(`O Glorioso de Minas`, `O Brioso da Capital`);

  return Object.freeze(nicknames);
}

/**
 * Derives traditional rituals and ceremonies that developed over the club's history.
 */
export function deriveTraditionalRituals(
  origin: FoundingOrigin,
  foundationYear: number,
  currentYear: number
): readonly ClubTraditionItem[] {
  const rituals: ClubTraditionItem[] = [];

  // 1. Foundation ritual (1910)
  rituals.push(
    Object.freeze({
      id: 'rit-inaugural',
      namePt: 'Cortejo Inaugural e Bênção do Estandarte',
      category: 'ritual',
      yearEstablished: foundationYear,
      descriptionPt: 'Desfile solene dos fundadores da sede até o gramado com o estandarte bordado a ouro.',
      importanceScore: 85,
    })
  );

  // 2. Marching ritual (1915+)
  if (currentYear >= 1915) {
    rituals.push(
      Object.freeze({
        id: 'rit-cortejo-torcida',
        namePt: 'Caminhada da Praça da Estação ao Campo',
        category: 'ritual',
        yearEstablished: 1915,
        descriptionPt: 'Concentração festiva com foguetes e gaitas partindo da gare central até os portões da praça de esportes.',
        importanceScore: 75,
      })
    );
  }

  // 3. Era of Radio & Matchday Anthem (1930+)
  if (currentYear >= 1930) {
    rituals.push(
      Object.freeze({
        id: 'rit-hino-grafofone',
        namePt: 'Execução do Hino no Alto-Falante da Arquibancada',
        category: 'anthem',
        yearEstablished: 1932,
        descriptionPt: 'Execução solene da marcha do clube gravada em disco de 78 rotações antes do pontapé inicial.',
        importanceScore: 80,
      })
    );
  }

  // 4. Clássicos and Grand Fireworks (1940+)
  if (currentYear >= 1940) {
    rituals.push(
      Object.freeze({
        id: 'rit-festa-classico',
        namePt: 'A Grande Queima de Vivas no Dérbi da Capital',
        category: 'symbol',
        yearEstablished: 1941,
        descriptionPt: 'Tradição pirotécnica com serpentinas alvinegras e salva de morteiros anunciando a entrada da equipe.',
        importanceScore: 90,
      })
    );
  }

  return Object.freeze(rituals);
}

/**
 * Calculates overall tradition strength based on years of existence, titles, facilities, and rituals.
 */
export function calculateTraditionStrength(input: {
  readonly foundationYear: number;
  readonly currentYear: number;
  readonly titlesCount: number;
  readonly matchesCount: number;
  readonly hasHistoricStadium: boolean;
}): number {
  const yearsAge = Math.max(0, input.currentYear - input.foundationYear);
  const ageScore = Math.min(40, yearsAge * 0.9);
  const titlesScore = Math.min(30, input.titlesCount * 10);
  const matchesScore = Math.min(20, Math.floor(input.matchesCount / 4));
  const stadiumBonus = input.hasHistoricStadium ? 10 : 0;

  return Math.min(100, Math.round(ageScore + titlesScore + matchesScore + stadiumBonus));
}

/**
 * Builds the full tradition profile of a club.
 */
export function buildClubTraditionProfile(input: {
  readonly clubId: string;
  readonly clubName: string;
  readonly foundingOrigin: FoundingOrigin;
  readonly homeNeighborhoodName?: string;
  readonly colors: Readonly<ClubColors>;
  readonly currentStadiumName?: string;
  readonly foundationYear: number;
  readonly currentYear: number;
  readonly titlesCount: number;
  readonly matchesCount: number;
}): ClubTraditionProfile {
  const nicknames = deriveTraditionalNicknames(input.foundingOrigin, input.clubName, input.colors);
  const rituals = deriveTraditionalRituals(input.foundingOrigin, input.foundationYear, input.currentYear);
  const traditionStrength = calculateTraditionStrength({
    foundationYear: input.foundationYear,
    currentYear: input.currentYear,
    titlesCount: input.titlesCount,
    matchesCount: input.matchesCount,
    hasHistoricStadium: !!input.currentStadiumName,
  });

  // Determine playing style based on founding origin
  let primaryPlayingStyle: PlayingStyle = 'escola_tecnica';
  if (input.foundingOrigin === 'workers' || input.foundingOrigin === 'railway') {
    primaryPlayingStyle = 'valente_combate';
  } else if (input.foundingOrigin === 'immigrants' || input.foundingOrigin === 'merchants') {
    primaryPlayingStyle = 'ataque_demolidor';
  } else if (input.foundingOrigin === 'elite') {
    primaryPlayingStyle = 'rigor_defensivo';
  }

  return Object.freeze({
    clubId: input.clubId,
    clubName: input.clubName,
    foundingOrigin: input.foundingOrigin,
    homeNeighborhoodName: input.homeNeighborhoodName ?? 'Distrito Central',
    currentColors: input.colors,
    currentStadiumName: input.currentStadiumName ?? 'Praça de Esportes Municipal',
    primaryPlayingStyle,
    traditionalNicknames: nicknames,
    historicRituals: rituals,
    traditionStrength,
  });
}
