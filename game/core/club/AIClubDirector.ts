import type { CampaignRng } from '../CampaignRng';
import type { GameDate } from '../HistoricalClock';
import type { FoundingOrigin } from './Club';

export type AIDirectorArchetype =
  | 'traditionalist_amateur'  // Defende o amadorismo puro, avesso a gastos, foca em festivais locais
  | 'mercantile_expansionist' // Busca rendas altas, ingressos, bicho para atletas, almeja estádio
  | 'community_neighborhood'  // Enraizado no bairro, promove jovens da vizinhança, desafios locais
  | 'aristocratic_exclusive'  // Mensalidades caras, clube fechado, esnobe com classes populares
  | 'pragmatic_competitive';  // Focado em vitórias, contrata os melhores quadros que o caixa permite

export interface AIDirectorProfile {
  readonly presidentName: string;
  readonly archetype: AIDirectorArchetype;
  readonly ambition: number;          // 1–100
  readonly financialPrudence: number;  // 1–100
  readonly amateurPurity: number;     // 1–100
  readonly aggressiveness: number;    // 1–100
}

export interface FriendlyChallengeOffer {
  readonly id: string;
  readonly challengerClubId: string;
  readonly challengerClubName: string;
  readonly challengedClubId: string;
  readonly date: Readonly<GameDate>;
  readonly venue: 'home' | 'away';
  readonly estimatedAttendance: number;
  readonly estimatedRevenuePpu: number;
  readonly status: 'pending' | 'accepted' | 'declined' | 'expired';
  readonly message: string;
}

export interface AIClubDirectorDecision {
  readonly type: 'budget_adjustment' | 'facility_expansion' | 'challenge_issued' | 'player_inquiry' | 'policy_shift';
  readonly description: string;
  readonly costPpu?: number;
}

const HISTORICAL_FIRST_NAMES = [
  'Arthur', 'Affonso', 'Alberto', 'Bernardo', 'Carlos', 'Eduardo', 'Ernesto',
  'Francisco', 'Guilherme', 'Henrique', 'Joaquim', 'Mário', 'Octávio', 'Raul',
  'Rodrigo', 'Sebastião', 'Vicente', 'Waldemar', 'Zacarias', 'Américo'
];

const HISTORICAL_LAST_NAMES = [
  'Alvares', 'Barbosa', 'Castello Branco', 'Drummond', 'Esteves', 'Fontes',
  'Guimarães', 'Lacerda', 'Macedo', 'Nogueira', 'Oliveira', 'Pacheco',
  'Queiroz', 'Resende', 'Silveira', 'Teixeira', 'Vasconcellos', 'Xavier'
];

/**
 * Deterministically generates an AI Director profile for a given club origin and era.
 */
export function generateAIDirectorProfile(
  origin: FoundingOrigin,
  rng: CampaignRng,
  _year: number = 1910
): AIDirectorProfile {
  const stream = rng.club;
  const firstName = HISTORICAL_FIRST_NAMES[Math.floor(stream.next() * HISTORICAL_FIRST_NAMES.length)];
  const lastName = HISTORICAL_LAST_NAMES[Math.floor(stream.next() * HISTORICAL_LAST_NAMES.length)];
  const presidentName = `${firstName} ${lastName}`;

  let archetype: AIDirectorArchetype;
  const roll = stream.next();

  switch (origin) {
    case 'elite':
      archetype = roll < 0.55 ? 'aristocratic_exclusive' : roll < 0.85 ? 'traditionalist_amateur' : 'pragmatic_competitive';
      break;
    case 'students':
      archetype = roll < 0.50 ? 'traditionalist_amateur' : roll < 0.80 ? 'mercantile_expansionist' : 'pragmatic_competitive';
      break;
    case 'merchants':
      archetype = roll < 0.60 ? 'mercantile_expansionist' : roll < 0.85 ? 'pragmatic_competitive' : 'traditionalist_amateur';
      break;
    case 'workers':
    case 'railway':
      archetype = roll < 0.55 ? 'community_neighborhood' : roll < 0.80 ? 'traditionalist_amateur' : 'pragmatic_competitive';
      break;
    case 'immigrants':
    default:
      archetype = roll < 0.45 ? 'community_neighborhood' : roll < 0.75 ? 'mercantile_expansionist' : 'pragmatic_competitive';
      break;
  }

  let ambition = Math.round(40 + stream.next() * 50);
  let financialPrudence = Math.round(40 + stream.next() * 50);
  let amateurPurity = Math.round(40 + stream.next() * 50);
  let aggressiveness = Math.round(30 + stream.next() * 50);

  // Archetype adjustments
  if (archetype === 'traditionalist_amateur') {
    amateurPurity = Math.min(100, amateurPurity + 30);
    financialPrudence = Math.min(100, financialPrudence + 20);
    ambition = Math.max(10, ambition - 15);
  } else if (archetype === 'mercantile_expansionist') {
    ambition = Math.min(100, ambition + 25);
    aggressiveness = Math.min(100, aggressiveness + 20);
    amateurPurity = Math.max(10, amateurPurity - 30);
  } else if (archetype === 'aristocratic_exclusive') {
    amateurPurity = Math.min(100, amateurPurity + 25);
    financialPrudence = Math.min(100, financialPrudence + 15);
    aggressiveness = Math.max(10, aggressiveness - 10);
  } else if (archetype === 'pragmatic_competitive') {
    ambition = Math.min(100, ambition + 30);
    aggressiveness = Math.min(100, aggressiveness + 25);
    financialPrudence = Math.max(20, financialPrudence - 15);
  }

  return Object.freeze({
    presidentName,
    archetype,
    ambition,
    financialPrudence,
    amateurPurity,
    aggressiveness,
  });
}

/**
 * Validates whether an unknown value is a valid AIDirectorProfile.
 */
export function validateAIDirectorProfile(value: unknown): AIDirectorProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;

  if (typeof candidate.presidentName !== 'string' || candidate.presidentName.trim().length === 0) return null;
  const validArchetypes: AIDirectorArchetype[] = [
    'traditionalist_amateur',
    'mercantile_expansionist',
    'community_neighborhood',
    'aristocratic_exclusive',
    'pragmatic_competitive',
  ];
  if (!validArchetypes.includes(candidate.archetype as AIDirectorArchetype)) return null;

  const ambition = typeof candidate.ambition === 'number' ? candidate.ambition : -1;
  const financialPrudence = typeof candidate.financialPrudence === 'number' ? candidate.financialPrudence : -1;
  const amateurPurity = typeof candidate.amateurPurity === 'number' ? candidate.amateurPurity : -1;
  const aggressiveness = typeof candidate.aggressiveness === 'number' ? candidate.aggressiveness : -1;

  if (ambition < 0 || ambition > 100) return null;
  if (financialPrudence < 0 || financialPrudence > 100) return null;
  if (amateurPurity < 0 || amateurPurity > 100) return null;
  if (aggressiveness < 0 || aggressiveness > 100) return null;

  return Object.freeze({
    presidentName: candidate.presidentName,
    archetype: candidate.archetype as AIDirectorArchetype,
    ambition,
    financialPrudence,
    amateurPurity,
    aggressiveness,
  });
}
