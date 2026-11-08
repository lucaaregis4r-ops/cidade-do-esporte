/**
 * Football Market, Athlete Scouting, Invitations and Club Athletics Policy (Alpha E: E5 + E6).
 * Governs historical amateur player movement of the 1910s era (scouting local talents, inviting
 * materialized citizens to the squad, releasing players, handling rival club inquiries),
 * and the club athletics policy (Strict Amateurism vs Assisted Amateurism / "Bicho").
 *
 * SPECIFICATION & CANONICAL RULES (PLANO MESTRE DE IMPLEMENTAÇÃO):
 * - E5: ClubPolicy — STRICT_AMATEUR → ASSISTED_AMATEUR → SEMI_PRO → PROFESSIONAL
 *   - Strict Amateur: preserves tradition, 0 stipend cost, higher risk of losing players to rivals.
 *   - Assisted Amateur: stipend aids (transportation, meals, gear, job placement), small monthly PPU cost.
 * - E6: Market — proposals, movements, invitations from city population (Person L2).
 *   - No modern transfer fees in 1910; movement operates via invitations, voluntary joins, and rival inquiries.
 * - Determinism: all RNG consumes CampaignRng stream `football`. Never use non-deterministic randomness.
 * - "Não usar overall único no motor. A UI pode resumir, o motor não."
 */

import type { GameDate } from '../HistoricalClock';
import type { CampaignRng } from '../CampaignRng';
import type { Person } from '../person/Person';
import type { ClubState } from '../club/Club';
import { createClub } from '../club/Club';
import type {
  Footballer,
  FootballSquadState,
  HistoricalPosition,
  SquadRole,
  AthleteContractPolicy,
} from './Footballer';
import {
  emergeFootballerFromPerson,
} from './Footballer';

export type ClubPolicyTier = 'strict_amateur' | 'assisted_amateur' | 'semi_pro' | 'professional';

export interface PolicyChangeEvent {
  readonly date: Readonly<GameDate>;
  readonly previousTier: ClubPolicyTier;
  readonly newTier: ClubPolicyTier;
  readonly reason: string;
}

export interface ClubAthleticsPolicyState {
  readonly currentTier: ClubPolicyTier;
  readonly stipendPPUPerAthlete: number;
  readonly adoptedDate: Readonly<GameDate>;
  readonly history: readonly PolicyChangeEvent[];
}

export const DEFAULT_1910_ATHLETICS_POLICY: Readonly<ClubAthleticsPolicyState> = Object.freeze({
  currentTier: 'strict_amateur',
  stipendPPUPerAthlete: 0,
  adoptedDate: Object.freeze({ year: 1910, month: 1, day: 1 }),
  history: Object.freeze([]),
});

export function createDefaultClubAthleticsPolicy(adoptedDate: GameDate = { year: 1910, month: 1, day: 1 }): ClubAthleticsPolicyState {
  return Object.freeze({
    currentTier: 'strict_amateur',
    stipendPPUPerAthlete: 0,
    adoptedDate: Object.freeze({ ...adoptedDate }),
    history: Object.freeze([]),
  });
}

export const POLICY_TIER_DETAILS: Readonly<Record<ClubPolicyTier, {
  readonly namePt: string;
  readonly descriptionPt: string;
  readonly historicalContextPt: string;
  readonly defaultStipendPPU: number;
  readonly playerRetentionBonus: number; // percentage
  readonly traditionalistSatisfactionDelta: number;
}>> = Object.freeze({
  strict_amateur: Object.freeze({
    namePt: 'Amadorismo Puro',
    descriptionPt: 'O esporte bretão praticado exclusivamente por amor à camisa. Nenhum atleta recebe auxílio pecuniário; chuteiras, uniforme e transporte correm por conta do próprio jogador.',
    historicalContextPt: 'Em 1910, a moral dominante da elite e das ligas impõe o amadorismo puro como preceito ético de cavalheirismo esportivo.',
    defaultStipendPPU: 0,
    playerRetentionBonus: 0,
    traditionalistSatisfactionDelta: 10,
  }),
  assisted_amateur: Object.freeze({
    namePt: 'Amadorismo Assistido (Bicho & Auxílio)',
    descriptionPt: 'O clube concede pequenas ajudas de custo para passagens de bonde, alimentação nos dias de jogo e indicação para empregos nominais em oficinas ou casas comerciais.',
    historicalContextPt: 'Prática histórica clandestina das primeiras décadas: fornecimento de calçados, bonde e "bichos" aos operários e ferroviários.',
    defaultStipendPPU: 0.5,
    playerRetentionBonus: 35,
    traditionalistSatisfactionDelta: -5,
  }),
  semi_pro: Object.freeze({
    namePt: 'Semi-Profissionalismo (Gratificações Fixas)',
    descriptionPt: 'Prêmios regulares por vitórias e contratos formais de gratificação. Transição típica das décadas de 1920 e 1930.',
    historicalContextPt: 'Fase de transição com gratificações e empregos simulados antes da profissionalização legal dos anos 1930.',
    defaultStipendPPU: 2.0,
    playerRetentionBonus: 60,
    traditionalistSatisfactionDelta: -20,
  }),
  professional: Object.freeze({
    namePt: 'Profissionalismo Pleno',
    descriptionPt: 'Atletas sob contrato de trabalho formal e folha salarial federativa, após a regulamentação do futebol.',
    historicalContextPt: 'Adoção oficial do regime remunerado e carteira profissional, legalizado nos anos 1930.',
    defaultStipendPPU: 6.0,
    playerRetentionBonus: 85,
    traditionalistSatisfactionDelta: -30,
  }),
});

export function validateClubAthleticsPolicyState(p: unknown): p is ClubAthleticsPolicyState {
  if (p === null || typeof p !== 'object' || Array.isArray(p)) return false;
  const pol = p as Partial<ClubAthleticsPolicyState>;

  const validTiers: ClubPolicyTier[] = ['strict_amateur', 'assisted_amateur', 'semi_pro', 'professional'];
  if (!pol.currentTier || !validTiers.includes(pol.currentTier)) return false;
  if (typeof pol.stipendPPUPerAthlete !== 'number' || pol.stipendPPUPerAthlete < 0) return false;
  if (!pol.adoptedDate || typeof pol.adoptedDate !== 'object' || typeof pol.adoptedDate.year !== 'number') return false;
  if (!Array.isArray(pol.history)) return false;

  return true;
}

/**
 * Changes the club's athletic contract policy (E5).
 * Modulates the policyTier of all active footballers in the squad.
 */
export function changeClubAthleticsPolicy(
  club: ClubState,
  newTier: ClubPolicyTier,
  date: GameDate,
  reason = 'Deliberação da Diretoria Estatutária'
): ClubState {
  const current = club.athleticsPolicy ?? DEFAULT_1910_ATHLETICS_POLICY;
  if (current.currentTier === newTier) return club;

  const details = POLICY_TIER_DETAILS[newTier];
  const newEvent: PolicyChangeEvent = Object.freeze({
    date: Object.freeze({ ...date }),
    previousTier: current.currentTier,
    newTier,
    reason,
  });

  const updatedPolicy: ClubAthleticsPolicyState = Object.freeze({
    currentTier: newTier,
    stipendPPUPerAthlete: details.defaultStipendPPU,
    adoptedDate: Object.freeze({ ...date }),
    history: Object.freeze([...current.history, newEvent]),
  });

  const athleteContractMap: Record<ClubPolicyTier, AthleteContractPolicy> = {
    strict_amateur: 'amateur',
    assisted_amateur: 'assisted_amateur',
    semi_pro: 'semi_pro',
    professional: 'professional',
  };

  const newAthleteTier = athleteContractMap[newTier];

  // Update footballers in squad
  let updatedSquad = club.squad;
  if (updatedSquad) {
    const updatedFootballers = updatedSquad.footballers.map((f) =>
      Object.freeze({
        ...f,
        policyTier: newAthleteTier,
      })
    );
    updatedSquad = Object.freeze({
      ...updatedSquad,
      footballers: Object.freeze(updatedFootballers),
    });
  }

  return createClub({
    ...club,
    athleticsPolicy: updatedPolicy,
    ...(updatedSquad ? { squad: updatedSquad } : {}),
  });
}

/**
 * Calculates monthly stipends / assistance expenses in PPU to be deducted in monthly accounting.
 */
export function computeMonthlyAthleticsCost(club: ClubState): number {
  const policy = club.athleticsPolicy ?? DEFAULT_1910_ATHLETICS_POLICY;
  if (policy.stipendPPUPerAthlete <= 0 || !club.squad) return 0;

  // In amateur era, stipends are typically provided to active starters
  const startersCount = club.squad.footballers.filter((f) => f.squadRole === 'starter').length;
  return Number((policy.stipendPPUPerAthlete * startersCount).toFixed(2));
}

/**
 * Returns available local prospects from materialized citizens (Person L2)
 * who are not currently active in the club's football squad.
 */
export function getAvailableLocalProspects(
  cityPersons: readonly Person[],
  existingFootballers: readonly Footballer[],
  minAge = 16,
  maxAge = 32
): readonly Person[] {
  const existingPersonIds = new Set(existingFootballers.map((f) => f.personId));

  return cityPersons
    .filter((p) => {
      if (existingPersonIds.has(p.id)) return false;
      const age = 1910 - p.birthDate.year; // Approximate era age
      return age >= minAge && age <= maxAge && (p.footballInterest ?? 0) >= 30;
    })
    .sort((a, b) => (b.footballInterest ?? 0) - (a.footballInterest ?? 0));
}

export interface InvitationResult {
  readonly success: boolean;
  readonly updatedClub: ClubState;
  readonly footballer?: Footballer;
  readonly message: string;
}

/**
 * Invites a materialized citizen from the city to join the club's football squad (E6).
 * Deterministically evaluates athlete acceptance based on personality, class, policy, and affinity.
 */
export function inviteProspectToClub(
  club: ClubState,
  person: Person,
  position: HistoricalPosition,
  role: SquadRole,
  date: GameDate,
  rng: CampaignRng
): InvitationResult {
  if (!club.squad) {
    return {
      success: false,
      updatedClub: club,
      message: 'O clube não possui esquadrão de futebol ativo para receber convites.',
    };
  }

  const stream = rng.football;
  const policy = club.athleticsPolicy ?? DEFAULT_1910_ATHLETICS_POLICY;

  // Calculate willingness to join
  const clubAffinity = person.clubAffinities['club-main'] ?? 50;
  const interest = person.footballInterest ?? 50;
  let acceptanceScore = (clubAffinity * 0.4) + (interest * 0.4);

  // Policy bonus / friction
  if (policy.currentTier === 'assisted_amateur') {
    acceptanceScore += 25; // Aid attracts workers and students
  } else if (policy.currentTier === 'strict_amateur') {
    if (person.economicClass === 'working_class') {
      acceptanceScore -= 10; // Difficult to afford boot repairs and train on Saturdays
    } else {
      acceptanceScore += 10; // Traditional gentlemen favor pure amateurism
    }
  }

  const roll = stream.next() * 100;
  const accepted = roll < acceptanceScore;

  if (!accepted) {
    return {
      success: false,
      updatedClub: club,
      message: `${person.name} agradeceu a lembrança, mas declinou do convite devido a compromissos de trabalho e família.`,
    };
  }

  // Acceptance! Emerge athlete
  const contractTier: AthleteContractPolicy =
    policy.currentTier === 'assisted_amateur' ? 'assisted_amateur' : 'amateur';

  const newFootballerRaw = emergeFootballerFromPerson(person, position, date, rng, contractTier);
  const newFootballer: Footballer = Object.freeze({
    ...newFootballerRaw,
    squadRole: role,
    achievements: Object.freeze([`Admitido no Quadro em ${date.year}`]),
  });

  const updatedFootballers = [...club.squad.footballers, newFootballer];
  const updatedSquad: FootballSquadState = Object.freeze({
    ...club.squad,
    footballers: Object.freeze(updatedFootballers),
  });

  const updatedClub = createClub({
    ...club,
    squad: updatedSquad,
  });

  return {
    success: true,
    updatedClub,
    footballer: newFootballer,
    message: `${person.name} aceitou o convite com entusiasmo e vestirá as cores do clube como ${role === 'starter' ? 'titular' : 'aspirante'}!`,
  };
}

export interface ReleaseResult {
  readonly success: boolean;
  readonly updatedClub: ClubState;
  readonly message: string;
}

/**
 * Releases an athlete from the football squad (dispensa / desligamento amador).
 */
export function releaseFootballerFromSquad(
  club: ClubState,
  footballerId: string
): ReleaseResult {
  if (!club.squad) {
    return { success: false, updatedClub: club, message: 'Clube sem elenco de futebol.' };
  }

  const athlete = club.squad.footballers.find((f) => f.id === footballerId);
  if (!athlete) {
    return { success: false, updatedClub: club, message: 'Atleta não encontrado no elenco.' };
  }

  const updatedFootballers = club.squad.footballers.filter((f) => f.id !== footballerId);
  const updatedSquad: FootballSquadState = Object.freeze({
    ...club.squad,
    footballers: Object.freeze(updatedFootballers),
    captainFootballerId: club.squad.captainFootballerId === footballerId ? undefined : club.squad.captainFootballerId,
    viceCaptainFootballerId: club.squad.viceCaptainFootballerId === footballerId ? undefined : club.squad.viceCaptainFootballerId,
  });

  return {
    success: true,
    updatedClub: createClub({ ...club, squad: updatedSquad }),
    message: `${athlete.name} foi desligado amigavelmente do quadro de futebolistas do clube.`,
  };
}

/**
 * Promotes or demotes an athlete between starting 11 and reserves.
 */
export function promoteOrDemoteFootballerRole(
  club: ClubState,
  footballerId: string,
  newRole: SquadRole
): ClubState {
  if (!club.squad) return club;

  const updatedFootballers = club.squad.footballers.map((f) => {
    if (f.id === footballerId) {
      return Object.freeze({
        ...f,
        squadRole: newRole,
      });
    }
    return f;
  });

  const updatedSquad: FootballSquadState = Object.freeze({
    ...club.squad,
    footballers: Object.freeze(updatedFootballers),
  });

  return createClub({
    ...club,
    squad: updatedSquad,
  });
}

export interface RivalInquiry {
  readonly id: string;
  readonly rivalClubName: string;
  readonly footballerId: string;
  readonly footballerName: string;
  readonly offeredPolicy: AthleteContractPolicy;
  readonly compensationPPU: number;
  readonly date: Readonly<GameDate>;
}

export const HISTORICAL_RIVAL_CLUBS = Object.freeze([
  'Sport Club Mineiro',
  'América Foot-Ball Club',
  'Villa Nova Athletic Club',
  'Yale Athletic Club',
  'Sete de Setembro Foot-Ball Club',
]);

/**
 * Generates monthly inquiries from rival clubs attempting to entice players (E6).
 */
export function generateMonthlyRivalInquiries(
  club: ClubState,
  currentDate: GameDate,
  rng: CampaignRng
): readonly RivalInquiry[] {
  if (!club.squad || club.squad.footballers.length === 0) return [];

  const stream = rng.football;
  // ~20% chance of an inquiry occurring each month
  if (stream.next() > 0.20) return [];

  const policy = club.athleticsPolicy ?? DEFAULT_1910_ATHLETICS_POLICY;

  // Rivals target high reputation or potential players
  const eligibleTargets = club.squad.footballers.filter(
    (f) => f.reputation > 50 || f.potential > 70
  );
  if (eligibleTargets.length === 0) return [];

  const target = eligibleTargets[Math.floor(stream.next() * eligibleTargets.length)];
  const rivalName = HISTORICAL_RIVAL_CLUBS[Math.floor(stream.next() * HISTORICAL_RIVAL_CLUBS.length)];

  // If we are strict amateur, rival often offers assisted amateur or bicho
  const offeredPolicy: AthleteContractPolicy =
    policy.currentTier === 'strict_amateur' ? 'assisted_amateur' : 'amateur';
  const compensationPPU = Math.round(5 + stream.next() * 15); // Friendly indemnification

  const inquiry: RivalInquiry = Object.freeze({
    id: `inq-${target.id}-${currentDate.year}-${currentDate.month}`,
    rivalClubName: rivalName,
    footballerId: target.id,
    footballerName: target.name,
    offeredPolicy,
    compensationPPU,
    date: Object.freeze({ ...currentDate }),
  });

  return Object.freeze([inquiry]);
}
