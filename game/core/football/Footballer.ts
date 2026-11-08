/**
 * Footballer Contract, Historical Attributes, and Athlete Emergence (Alpha E: E1 + E2).
 * Governs historical footballers, positions of the era (1910 pyramid/2-3-5),
 * multi-dimensional attribute profile (technical, physical, mental, personality),
 * and athlete emergence from the materialized urban population (Person).
 *
 * SPECIFICATION (PLANO MESTRE DE IMPLEMENTAÇÃO):
 * - TechnicalAttributes: shooting, passing, ballControl, dribbling, tackling, aerial, goalkeeping (0–100)
 * - PhysicalAttributes: pace, stamina, strength, agility (0–100)
 * - MentalAttributes: decision, positioning, composure, courage, discipline (0–100)
 * - FootballPersonality: leadership, professionalism, pressure, ambition, sportsmanship, temperament (0–100)
 * - Position (Era 1910–1920s):
 *     'GK' (Goalkeeper / Goleiro / Guardião)
 *     'FB_R' (Right Back / Zagueiro Direito)
 *     'FB_L' (Left Back / Zagueiro Esquerdo)
 *     'HB_R' (Right Half / Médio Direito)
 *     'CH'   (Centre Half / Médio Centro)
 *     'HB_L' (Left Half / Médio Esquerdo)
 *     'FW_OR' (Outside Right / Ponta Direita)
 *     'FW_IR' (Inside Right / Meia-Direita)
 *     'CF'    (Centre Forward / Centroavante)
 *     'FW_IL' (Inside Left / Meia-Esquerda)
 *     'FW_OL' (Outside Left / Ponta Esquerda)
 * - Footballer:
 *     personId: string
 *     positions: readonly HistoricalPosition[]
 *     preferredFoot: 'left' | 'right' | 'both'
 *     technical: TechnicalAttributes
 *     physical: PhysicalAttributes
 *     mental: MentalAttributes
 *     personality: FootballPersonality
 *     potential: number (0–100)
 *     reputation: number (0–100)
 *     condition: number (0–100)
 *     injuryRisk: number (0–100)
 *     policyTier: 'amateur' | 'assisted_amateur' | 'semi_pro' | 'professional'
 *     squadRole: 'starter' | 'substitute' | 'reserve' | 'prospect'
 *     clubHistory: readonly PlayerClubSpell[]
 *     matchHistory: readonly PlayerMatchRecord[]
 *     achievements: readonly string[]
 *
 * REGRA CANÔNICA DO PLANO:
 * "Não usar overall único no motor. A UI pode resumir, o motor não."
 */

import type { GameDate } from '../HistoricalClock';
import { createPerson, type Person } from '../person/Person';
import type { CampaignRng } from '../CampaignRng';

export type HistoricalPosition =
  | 'GK'    // Goalkeeper (Goleiro)
  | 'FB_R'  // Right Back (Zagueiro Direito)
  | 'FB_L'  // Left Back (Zagueiro Esquerdo)
  | 'HB_R'  // Right Half (Médio Direito)
  | 'CH'    // Centre Half (Médio Centro)
  | 'HB_L'  // Left Half (Médio Esquerdo)
  | 'FW_OR' // Outside Right (Ponta Direita)
  | 'FW_IR' // Inside Right (Meia-Direita)
  | 'CF'    // Centre Forward (Centroavante)
  | 'FW_IL' // Inside Left (Meia-Esquerda)
  | 'FW_OL'; // Outside Left (Ponta Esquerda)

export const HISTORICAL_POSITIONS: readonly HistoricalPosition[] = Object.freeze([
  'GK',
  'FB_R',
  'FB_L',
  'HB_R',
  'CH',
  'HB_L',
  'FW_OR',
  'FW_IR',
  'CF',
  'FW_IL',
  'FW_OL',
]);

export const POSITION_LABELS: Readonly<Record<HistoricalPosition, { nameEn: string; namePt: string; line: 'GK' | 'DEF' | 'MID' | 'ATT' }>> = Object.freeze({
  GK: { nameEn: 'Goalkeeper', namePt: 'Guardião / Goleiro', line: 'GK' },
  FB_R: { nameEn: 'Right Back', namePt: 'Zagueiro Direito', line: 'DEF' },
  FB_L: { nameEn: 'Left Back', namePt: 'Zagueiro Esquerdo', line: 'DEF' },
  HB_R: { nameEn: 'Right Half', namePt: 'Médio Direito', line: 'MID' },
  CH: { nameEn: 'Centre Half', namePt: 'Médio Centro', line: 'MID' },
  HB_L: { nameEn: 'Left Half', namePt: 'Médio Esquerdo', line: 'MID' },
  FW_OR: { nameEn: 'Outside Right', namePt: 'Ponta Direita', line: 'ATT' },
  FW_IR: { nameEn: 'Inside Right', namePt: 'Meia-Direita', line: 'ATT' },
  CF: { nameEn: 'Centre Forward', namePt: 'Centroavante', line: 'ATT' },
  FW_IL: { nameEn: 'Inside Left', namePt: 'Meia-Esquerda', line: 'ATT' },
  FW_OL: { nameEn: 'Outside Left', namePt: 'Ponta Esquerda', line: 'ATT' },
});

export interface TechnicalAttributes {
  readonly shooting: number;       // Finalização / Chute
  readonly passing: number;        // Passe
  readonly ballControl: number;    // Domínio de bola
  readonly dribbling: number;      // Drible
  readonly tackling: number;       // Desarme
  readonly aerial: number;         // Cabeceio / Jogo Aéreo
  readonly goalkeeping: number;    // Defesas / Reflexos de Goleiro
}

export interface PhysicalAttributes {
  readonly pace: number;           // Velocidade / Arranque
  readonly stamina: number;        // Resistência / Fôlego
  readonly strength: number;       // Força física
  readonly agility: number;        // Agilidade / Equilíbrio
}

export interface MentalAttributes {
  readonly decision: number;       // Tomada de decisão
  readonly positioning: number;    // Posicionamento tático
  readonly composure: number;      // Frieza / Concentração sob pressão
  readonly courage: number;        // Valentia / Bravura em divididas
  readonly discipline: number;     // Disciplina tática
}

export interface FootballPersonality {
  readonly leadership: number;     // Liderança em campo
  readonly professionalism: number; // Dedicação / Espírito esportivo
  readonly ambition: number;       // Ambição competitiva
  readonly temperament: number;    // Temperamento (calmo vs explosivo)
  readonly loyalty: number;        // Lealdade à camisa
}

export type AthleteContractPolicy = 'amateur' | 'assisted_amateur' | 'semi_pro' | 'professional';
export type SquadRole = 'starter' | 'substitute' | 'reserve' | 'prospect';

export interface PlayerClubSpell {
  readonly clubId: string;
  readonly clubName: string;
  readonly startYear: number;
  readonly endYear?: number;
  readonly appearances: number;
  readonly goals: number;
}

export interface PlayerMatchRecord {
  readonly matchId: string;
  readonly date: Readonly<GameDate>;
  readonly minutesPlayed: number;
  readonly rating: number; // 0–10
  readonly goals: number;
}

export interface PlayerInjury {
  readonly id: string;
  readonly type: 'contusion' | 'sprain' | 'strain' | 'fracture';
  readonly description: string;
  readonly occurredDate: Readonly<GameDate>;
  readonly expectedWeeks: number;
  readonly weeksRemaining: number;
  readonly severity: 'minor' | 'moderate' | 'severe';
}

export type HistoricalTrainingType =
  | 'recreational'               // Bate-bola livre aos sábados (Pelada amadora)
  | 'tactical_pyramid'           // Ensaio de linhas da Pirâmide 2-3-5 com o Capitão
  | 'physical_calisthenics'      // Calistenia e corridas rústicas
  | 'scrimmage_first_vs_second'; // Coletivo Primeiro vs Segundo Quadro

export interface TrainingRegime {
  readonly type: HistoricalTrainingType;
  readonly intensity: 'light' | 'moderate' | 'intense';
  readonly weeklySessions: number; // 1 or 2 in 1910
  readonly focus: 'balanced' | 'physical' | 'technical' | 'tactical';
}

export const DEFAULT_1910_TRAINING_REGIME: Readonly<TrainingRegime> = Object.freeze({
  type: 'recreational',
  intensity: 'light',
  weeklySessions: 1,
  focus: 'balanced',
});

export interface Footballer {
  readonly id: string;
  readonly personId: string;
  readonly name: string;
  readonly age: number;
  readonly preferredFoot: 'left' | 'right' | 'both';
  readonly positions: readonly HistoricalPosition[];
  readonly technical: Readonly<TechnicalAttributes>;
  readonly physical: Readonly<PhysicalAttributes>;
  readonly mental: Readonly<MentalAttributes>;
  readonly personality: Readonly<FootballPersonality>;
  readonly potential: number;    // 0–100
  readonly reputation: number;   // 0–100
  readonly condition: number;    // 0–100 (current physical shape)
  readonly fatigue?: number;     // 0–100 (accumulated physical fatigue)
  readonly injuryRisk: number;   // 0–100
  readonly currentInjury?: Readonly<PlayerInjury>;
  readonly policyTier: AthleteContractPolicy;
  readonly squadRole: SquadRole;
  readonly joinedDate: Readonly<GameDate>;
  readonly clubHistory: readonly PlayerClubSpell[];
  readonly matchHistory: readonly PlayerMatchRecord[];
  readonly achievements: readonly string[];
}

export interface FootballSquadState {
  readonly footballers: readonly Footballer[];
  readonly formationTactic: '2-3-5'; // Historical 1910s Pyramid
  readonly captainFootballerId?: string;
  readonly viceCaptainFootballerId?: string;
  readonly trainingRegime?: Readonly<TrainingRegime>;
}

/**
 * Validates a single Footballer instance.
 */
export function validateFootballer(f: unknown): f is Footballer {
  if (f === null || typeof f !== 'object' || Array.isArray(f)) return false;
  const p = f as Partial<Footballer>;

  if (typeof p.id !== 'string' || p.id.trim().length === 0) return false;
  if (typeof p.personId !== 'string' || p.personId.trim().length === 0) return false;
  if (typeof p.name !== 'string' || p.name.trim().length === 0) return false;
  if (typeof p.age !== 'number' || p.age < 12 || p.age > 60) return false;
  if (p.preferredFoot !== 'left' && p.preferredFoot !== 'right' && p.preferredFoot !== 'both') return false;

  if (!Array.isArray(p.positions) || p.positions.length === 0) return false;
  for (const pos of p.positions) {
    if (!HISTORICAL_POSITIONS.includes(pos)) return false;
  }

  // Validate technical attributes
  if (!p.technical || typeof p.technical !== 'object') return false;
  const techKeys: (keyof TechnicalAttributes)[] = ['shooting', 'passing', 'ballControl', 'dribbling', 'tackling', 'aerial', 'goalkeeping'];
  for (const k of techKeys) {
    const val = p.technical[k];
    if (typeof val !== 'number' || val < 0 || val > 100) return false;
  }

  // Validate physical attributes
  if (!p.physical || typeof p.physical !== 'object') return false;
  const physKeys: (keyof PhysicalAttributes)[] = ['pace', 'stamina', 'strength', 'agility'];
  for (const k of physKeys) {
    const val = p.physical[k];
    if (typeof val !== 'number' || val < 0 || val > 100) return false;
  }

  // Validate mental attributes
  if (!p.mental || typeof p.mental !== 'object') return false;
  const mentKeys: (keyof MentalAttributes)[] = ['decision', 'positioning', 'composure', 'courage', 'discipline'];
  for (const k of mentKeys) {
    const val = p.mental[k];
    if (typeof val !== 'number' || val < 0 || val > 100) return false;
  }

  // Validate personality
  if (!p.personality || typeof p.personality !== 'object') return false;
  const persKeys: (keyof FootballPersonality)[] = ['leadership', 'professionalism', 'ambition', 'temperament', 'loyalty'];
  for (const k of persKeys) {
    const val = p.personality[k];
    if (typeof val !== 'number' || val < 0 || val > 100) return false;
  }

  if (typeof p.potential !== 'number' || p.potential < 0 || p.potential > 100) return false;
  if (typeof p.reputation !== 'number' || p.reputation < 0 || p.reputation > 100) return false;
  if (typeof p.condition !== 'number' || p.condition < 0 || p.condition > 100) return false;
  if (p.fatigue !== undefined && (typeof p.fatigue !== 'number' || p.fatigue < 0 || p.fatigue > 100)) return false;
  if (typeof p.injuryRisk !== 'number' || p.injuryRisk < 0 || p.injuryRisk > 100) return false;
  if (p.currentInjury !== undefined && !validateInjury(p.currentInjury)) return false;

  const validTiers: AthleteContractPolicy[] = ['amateur', 'assisted_amateur', 'semi_pro', 'professional'];
  if (!p.policyTier || !validTiers.includes(p.policyTier)) return false;

  const validRoles: SquadRole[] = ['starter', 'substitute', 'reserve', 'prospect'];
  if (!p.squadRole || !validRoles.includes(p.squadRole)) return false;

  if (!p.joinedDate || typeof p.joinedDate !== 'object' || typeof p.joinedDate.year !== 'number') return false;
  if (!Array.isArray(p.clubHistory)) return false;
  if (!Array.isArray(p.matchHistory)) return false;
  if (!Array.isArray(p.achievements)) return false;

  return true;
}

export function validateInjury(inj: unknown): inj is PlayerInjury {
  if (inj === null || typeof inj !== 'object' || Array.isArray(inj)) return false;
  const i = inj as Partial<PlayerInjury>;
  if (typeof i.id !== 'string' || i.id.length === 0) return false;
  const validTypes = ['contusion', 'sprain', 'strain', 'fracture'];
  if (!i.type || !validTypes.includes(i.type)) return false;
  if (typeof i.description !== 'string' || i.description.length === 0) return false;
  if (!i.occurredDate || typeof i.occurredDate !== 'object' || typeof i.occurredDate.year !== 'number') return false;
  if (typeof i.expectedWeeks !== 'number' || i.expectedWeeks < 1) return false;
  if (typeof i.weeksRemaining !== 'number' || i.weeksRemaining < 0) return false;
  const validSeverities = ['minor', 'moderate', 'severe'];
  if (!i.severity || !validSeverities.includes(i.severity)) return false;
  return true;
}

export function validateTrainingRegime(r: unknown): r is TrainingRegime {
  if (r === null || typeof r !== 'object' || Array.isArray(r)) return false;
  const reg = r as Partial<TrainingRegime>;
  const validTypes = ['recreational', 'tactical_pyramid', 'physical_calisthenics', 'scrimmage_first_vs_second'];
  if (!reg.type || !validTypes.includes(reg.type)) return false;
  const validIntensities = ['light', 'moderate', 'intense'];
  if (!reg.intensity || !validIntensities.includes(reg.intensity)) return false;
  if (typeof reg.weeklySessions !== 'number' || reg.weeklySessions < 1 || reg.weeklySessions > 7) return false;
  const validFocuses = ['balanced', 'physical', 'technical', 'tactical'];
  if (!reg.focus || !validFocuses.includes(reg.focus)) return false;
  return true;
}

/**
 * Validates a squad state.
 */
export function validateFootballSquadState(s: unknown): s is FootballSquadState {
  if (s === null || typeof s !== 'object' || Array.isArray(s)) return false;
  const state = s as Partial<FootballSquadState>;

  if (state.formationTactic !== '2-3-5') return false;
  if (!Array.isArray(state.footballers)) return false;

  for (const f of state.footballers) {
    if (!validateFootballer(f)) return false;
  }

  if (state.captainFootballerId !== undefined && typeof state.captainFootballerId !== 'string') return false;
  if (state.viceCaptainFootballerId !== undefined && typeof state.viceCaptainFootballerId !== 'string') return false;
  if (state.trainingRegime !== undefined && !validateTrainingRegime(state.trainingRegime)) return false;

  return true;
}

/**
 * Helper to calculate perceived positional strength without violating the canonical
 * rule "Não usar overall único no motor". This is purely for UI display summaries.
 */
export function calculatePositionalRatingDisplay(f: Footballer, pos: HistoricalPosition): number {
  if (pos === 'GK') {
    return Math.round(
      f.technical.goalkeeping * 0.45 +
      f.physical.agility * 0.20 +
      f.mental.composure * 0.15 +
      f.mental.positioning * 0.20
    );
  }

  const isDef = pos === 'FB_R' || pos === 'FB_L';
  if (isDef) {
    return Math.round(
      f.technical.tackling * 0.35 +
      f.technical.aerial * 0.20 +
      f.physical.strength * 0.20 +
      f.mental.positioning * 0.15 +
      f.mental.courage * 0.10
    );
  }

  const isMid = pos === 'HB_R' || pos === 'CH' || pos === 'HB_L';
  if (isMid) {
    return Math.round(
      f.technical.passing * 0.30 +
      f.technical.tackling * 0.20 +
      f.physical.stamina * 0.25 +
      f.mental.decision * 0.15 +
      f.technical.ballControl * 0.10
    );
  }

  // Attackers (FW_OR, FW_IR, CF, FW_IL, FW_OL)
  return Math.round(
    f.technical.shooting * 0.35 +
    f.technical.dribbling * 0.25 +
    f.physical.pace * 0.20 +
    f.mental.decision * 0.10 +
    f.technical.ballControl * 0.10
  );
}

/**
 * Emergence of athlete from a materialized Person (E2).
 * Calibrates attributes deterministically from personality, age, class, and football passion.
 */
export function emergeFootballerFromPerson(
  person: Person,
  primaryPosition: HistoricalPosition,
  joinedDate: GameDate,
  rng: CampaignRng,
  tier: AthleteContractPolicy = 'amateur'
): Footballer {
  const stream = rng.football;

  const age = joinedDate.year - person.birthDate.year;
  const isGoalkeeper = primaryPosition === 'GK';

  // Base range depending on passion and potential
  const baseRating = Math.round(30 + (person.footballInterest ?? 50) * 0.35 + stream.next() * 20);

  // Footedness
  const footRoll = stream.next();
  const preferredFoot = footRoll < 0.15 ? 'left' : footRoll < 0.85 ? 'right' : 'both';

  // Secondary position logic
  const positions: HistoricalPosition[] = [primaryPosition];
  if (!isGoalkeeper && stream.next() < 0.40) {
    if (primaryPosition === 'FB_R') positions.push('HB_R');
    else if (primaryPosition === 'FB_L') positions.push('HB_L');
    else if (primaryPosition === 'FW_OR') positions.push('FW_IR');
    else if (primaryPosition === 'FW_OL') positions.push('FW_IL');
    else if (primaryPosition === 'CF') positions.push('FW_IR');
    else if (primaryPosition === 'CH') positions.push('HB_R');
  }

  // Technical attributes
  const tech: TechnicalAttributes = {
    shooting: isGoalkeeper ? Math.round(10 + stream.next() * 15) : Math.round(clamp(baseRating + (stream.next() * 25 - 10), 10, 95)),
    passing: Math.round(clamp(baseRating + (stream.next() * 20 - 10), 15, 95)),
    ballControl: Math.round(clamp(baseRating + (stream.next() * 22 - 11), 15, 95)),
    dribbling: isGoalkeeper ? Math.round(10 + stream.next() * 15) : Math.round(clamp(baseRating + (stream.next() * 24 - 12), 15, 95)),
    tackling: isGoalkeeper ? Math.round(10 + stream.next() * 15) : Math.round(clamp(baseRating + (stream.next() * 24 - 12), 15, 95)),
    aerial: Math.round(clamp(baseRating + (stream.next() * 20 - 10), 15, 95)),
    goalkeeping: isGoalkeeper ? Math.round(clamp(baseRating + 25 + stream.next() * 25, 45, 98)) : Math.round(10 + stream.next() * 15),
  };

  // Physical attributes
  const phys: PhysicalAttributes = {
    pace: Math.round(clamp(40 + stream.next() * 45, 20, 95)),
    stamina: Math.round(clamp(35 + stream.next() * 50, 25, 98)),
    strength: Math.round(clamp(35 + stream.next() * 45, 20, 95)),
    agility: Math.round(clamp(35 + stream.next() * 45, 20, 95)),
  };

  // Mental attributes
  const mental: MentalAttributes = {
    decision: Math.round(clamp(30 + stream.next() * 50, 20, 95)),
    positioning: Math.round(clamp(30 + stream.next() * 50, 20, 95)),
    composure: Math.round(clamp(25 + stream.next() * 50, 20, 95)),
    courage: Math.round(clamp(person.traits.traditionalism > 50 ? 55 + stream.next() * 35 : 40 + stream.next() * 40, 20, 98)),
    discipline: Math.round(clamp(person.traits.honesty * 0.7 + stream.next() * 30, 20, 95)),
  };

  // Personality
  const personality: FootballPersonality = {
    leadership: person.traits?.leadership ?? 50,
    professionalism: Math.round(clamp((person.traits?.traditionalism ?? 50) * 0.5 + (person.traits?.honesty ?? 50) * 0.5, 20, 95)),
    ambition: person.traits?.ambition ?? 50,
    temperament: Math.round(clamp(100 - (person.traits?.passion ?? 50) * 0.5 + stream.next() * 20, 10, 95)),
    loyalty: Math.round(clamp((person.clubAffinities?.['club-main'] ?? 70) * 0.8 + stream.next() * 20, 30, 100)),
  };

  const potential = Math.round(clamp(baseRating + (stream.next() * 30 - 5), baseRating, 98));
  const reputation = Math.round(clamp(person.reputation * 0.6 + (person.footballInterest ?? 50) * 0.4, 15, 95));

  const footballer: Footballer = Object.freeze({
    id: `fb-${person.id}`,
    personId: person.id,
    name: person.name,
    age,
    preferredFoot,
    positions: Object.freeze(positions),
    technical: Object.freeze(tech),
    physical: Object.freeze(phys),
    mental: Object.freeze(mental),
    personality: Object.freeze(personality),
    potential,
    reputation,
    condition: 100,
    fatigue: 0,
    injuryRisk: Math.round(10 + stream.next() * 20),
    policyTier: tier,
    squadRole: 'starter',
    joinedDate: Object.freeze({ ...joinedDate }),
    clubHistory: Object.freeze([
      Object.freeze({
        clubId: 'club-main',
        clubName: 'Cidade de Minas Foot-Ball Club',
        startYear: joinedDate.year,
        appearances: 0,
        goals: 0,
      }),
    ]),
    matchHistory: Object.freeze([]),
    achievements: Object.freeze(['Quadro Titular Inaugural de 1910']),
  });

  return footballer;
}

/**
 * Generates the historical 1910 inaugural starting 11 (Pyramid 2-3-5) + reserves
 * from materialized persons in the club/city.
 */
export function generateInauguralFootballSquad(
  clubName: string,
  foundingDate: GameDate,
  availablePersons: readonly Person[],
  rng: CampaignRng
): FootballSquadState {

  // Filter or sort candidates by age (16 to 34) and high footballInterest
  let candidates = [...availablePersons]
    .filter((p) => {
      const age = foundingDate.year - p.birthDate.year;
      return age >= 16 && age <= 34;
    })
    .sort((a, b) => (b.footballInterest ?? 50) - (a.footballInterest ?? 50));

  if (candidates.length === 0) {
    const fallbackPersons: Person[] = [];
    for (let i = 0; i < 15; i++) {
      fallbackPersons.push(createPerson({
        id: `person-inaugural-athlete-${i + 1}`,
        name: `Atleta Fundador ${i + 1}`,
        birthDate: { year: foundingDate.year - (18 + (i % 10)), month: 1, day: 1 },
        districtId: 'centro',
        economicClass: 'working_class',
        occupation: 'Operário da Estrada de Ferro',
        traits: { leadership: 50, ambition: 50, sociability: 50, honesty: 50, passion: 80, traditionalism: 50 },
        biography: 'Atleta do quadro fundador de 1910.',
        reputation: 50,
        footballInterest: 80,
      }));
    }
    candidates = fallbackPersons;
  }

  // 11 distinct positions for 2-3-5 Pyramid
  const starterPositions: HistoricalPosition[] = [
    'GK',
    'FB_R',
    'FB_L',
    'HB_R',
    'CH',
    'HB_L',
    'FW_OR',
    'FW_IR',
    'CF',
    'FW_IL',
    'FW_OL',
  ];

  const footballers: Footballer[] = [];

  // Create starting 11
  for (let i = 0; i < starterPositions.length; i++) {
    const pos = starterPositions[i];
    const candidate = candidates[i % candidates.length];
    const fb = emergeFootballerFromPerson(candidate, pos, foundingDate, rng, 'amateur');
    footballers.push(fb);
  }

  // Add 3-4 reserves / prospects
  const reservePositions: HistoricalPosition[] = ['GK', 'HB_R', 'CF', 'FB_R'];
  for (let j = 0; j < reservePositions.length; j++) {
    const pos = reservePositions[j];
    const candidateIdx = (starterPositions.length + j) % candidates.length;
    const candidate = candidates[candidateIdx];
    const fbRaw = emergeFootballerFromPerson(candidate, pos, foundingDate, rng, 'amateur');
    const fb = Object.freeze({
      ...fbRaw,
      id: `fb-res-${candidate.id}-${j}`,
      squadRole: 'reserve' as SquadRole,
      achievements: Object.freeze(['Quadro Reserva Inaugural de 1910']),
    });
    footballers.push(fb);
  }

  // Captain is the highest leadership starter
  const captainCandidate = [...footballers]
    .filter((f) => f.squadRole === 'starter')
    .sort((a, b) => b.personality.leadership - a.personality.leadership)[0];

  const viceCandidate = [...footballers]
    .filter((f) => f.squadRole === 'starter' && f.id !== captainCandidate?.id)
    .sort((a, b) => b.personality.leadership - a.personality.leadership)[0];

  return Object.freeze({
    footballers: Object.freeze(footballers),
    formationTactic: '2-3-5',
    captainFootballerId: captainCandidate?.id,
    viceCaptainFootballerId: viceCandidate?.id,
    trainingRegime: DEFAULT_1910_TRAINING_REGIME,
  });
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
