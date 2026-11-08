/**
 * Match Engine for Historical Football Simulation (Macroetapa 21, E7 + E8 + E9 + E10).
 * Simulates 1910-era association football matches deterministically using the Pyramid formation (2-3-5).
 *
 * CANONICAL INVARIANTS:
 * 1. "Não usar overall único no motor. A UI pode resumir, o motor não."
 *    Match resolution evaluates positional, multi-dimensional attributes across attack, midfield,
 *    defense, and goalkeeping without ever collapsing players into a single overall number.
 * 2. Determinism: Consumes exclusively the `football` stream from `CampaignRng`.
 * 3. 1910 Rules (E8):
 *    - 0 substitutions allowed. Injured or expelled players leave the pitch; the team plays with fewer men.
 *    - No colored cards (verbal warnings and direct expulsions only).
 *    - 2 points for a win, 1 for a draw, 0 for a loss.
 *    - 3-player offside rule.
 * 4. Matchday Finances (E9):
 *    - Gate receipts and festival expenses recorded in PPU for ledger accounting.
 * 5. Player Wear & Career Records (E10):
 *    - Match stamina depletion, accumulated fatigue, match records, and appearance/goal tracking.
 */

import type { GameDate } from '../HistoricalClock';
import type { CampaignRng } from '../CampaignRng';
import type {
  Footballer,
  FootballSquadState,
  HistoricalPosition,
  PlayerMatchRecord,
  PlayerInjury,
  PlayerClubSpell,
} from './Footballer';
import { getFootballRulesForEra, type FootballEraRules } from './FootballRulesByEra';
import type { FinancialTransaction } from '../club/ClubFinances';

export type MatchEventType =
  | 'kickoff'
  | 'halftime'
  | 'fulltime'
  | 'goal'
  | 'shot_saved'
  | 'shot_missed'
  | 'foul'
  | 'verbal_caution'
  | 'expulsion'
  | 'injury';

export interface MatchEvent {
  readonly minute: number; // 1 to 90
  readonly type: MatchEventType;
  readonly team: 'home' | 'away';
  readonly descriptionPt: string;
  readonly primaryPlayerId?: string;
  readonly primaryPlayerName?: string;
  readonly secondaryPlayerId?: string;
  readonly secondaryPlayerName?: string;
}

export interface MatchParticipant {
  readonly footballerId: string;
  readonly personId: string;
  readonly name: string;
  readonly position: HistoricalPosition;
  readonly minutesPlayed: number;
  readonly rating: number; // 1.0 to 10.0
  readonly goals: number;
  readonly assists: number;
  readonly shots: number;
  readonly tackles: number;
  readonly saves: number;
  readonly fouls: number;
  readonly injured: boolean;
  readonly expelled: boolean;
  readonly conditionBefore: number;
  readonly conditionAfter: number;
  readonly fatigueAccumulated: number;
}

export interface MatchRecord {
  readonly id: string;
  readonly date: Readonly<GameDate>;
  readonly competitionType: 'friendly' | 'festival_taça';
  readonly competitionName: string;
  readonly homeClubId: string;
  readonly homeClubName: string;
  readonly awayClubId: string;
  readonly awayClubName: string;
  readonly homeScore: number;
  readonly awayScore: number;
  readonly attendance: number;
  readonly gateReceiptsPPU: number;
  readonly matchExpensesPPU: number;
  readonly netIncomePPU: number;
  readonly homeLineup: readonly MatchParticipant[];
  readonly awayLineup: readonly MatchParticipant[];
  readonly events: readonly MatchEvent[];
  readonly rules: Readonly<FootballEraRules>;
  readonly pitchCondition: 'dirt' | 'grass' | 'modest';
  readonly homeFormation: '2-3-5';
  readonly awayFormation: '2-3-5';
  readonly summaryPt: string;
}

export interface MatchTeamInput {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly colors: { readonly primary: string; readonly secondary: string };
  readonly squad: readonly Footballer[];
  readonly tacticalOrientation?: 'balanced' | 'attacking' | 'defensive';
}

export interface SimulateMatchInput {
  readonly matchId: string;
  readonly date: GameDate;
  readonly competitionType: 'friendly' | 'festival_taça';
  readonly competitionName: string;
  readonly homeTeam: MatchTeamInput;
  readonly awayTeam: MatchTeamInput;
  readonly rng: CampaignRng;
  readonly pitchCondition?: 'dirt' | 'grass' | 'modest';
  readonly stadiumCapacity?: number;
  readonly hasGrandstand?: boolean;
}

export interface MatchSimulationResult {
  readonly record: MatchRecord;
  readonly updatedHomeSquad: FootballSquadState;
  readonly newHomeInjuries: readonly PlayerInjury[];
  readonly matchRevenueTransaction?: FinancialTransaction;
  readonly matchExpenseTransaction?: FinancialTransaction;
}

/**
 * 1910s Historical Rival Clubs in Minas Gerais.
 */
export interface Historical1910RivalPreset {
  readonly name: string;
  readonly shortName: string;
  readonly foundationYear: number;
  readonly colors: { readonly primary: string; readonly secondary: string };
  readonly reputation: number; // 0–100
  readonly description: string;
}

export const HISTORICAL_1910_RIVALS: readonly Historical1910RivalPreset[] = Object.freeze([
  {
    name: 'América Foot-Ball Club',
    shortName: 'América',
    foundationYear: 1912,
    colors: { primary: '#1B5E20', secondary: '#FFFFFF' },
    reputation: 65,
    description: 'Tradicional grêmio de estudantes e rapazes da elite letrada da capital.',
  },
  {
    name: 'Villa Nova Athletic Club',
    shortName: 'Villa Nova',
    foundationYear: 1908,
    colors: { primary: '#B71C1C', secondary: '#FFFFFF' },
    reputation: 70,
    description: 'Pioneiros de Nova Lima ligados à Saint John Del Rey Mining Company e técnicos britânicos.',
  },
  {
    name: 'Yale Athletic Club',
    shortName: 'Yale',
    foundationYear: 1910,
    colors: { primary: '#0D47A1', secondary: '#FFD700' },
    reputation: 60,
    description: 'Clube dos círculos comerciais e de jovens da colônia ítalo-mineira.',
  },
  {
    name: 'Sport Club Mineiro',
    shortName: 'Sport',
    foundationYear: 1904,
    colors: { primary: '#212121', secondary: '#FFFFFF' },
    reputation: 55,
    description: 'Decano dos campos de Cidade de Minas, pioneiro do futebol amador na virada do século.',
  },
  {
    name: 'Combinado da Estação Ferroviária',
    shortName: 'Combinado EF',
    foundationYear: 1910,
    colors: { primary: '#E65100', secondary: '#212121' },
    reputation: 45,
    description: 'Aguerrido quadro operário formado por maquinistas e foguistas da Estrada de Ferro.',
  },
  {
    name: 'Associação Atlética do Comércio',
    shortName: 'A.A. Comércio',
    foundationYear: 1909,
    colors: { primary: '#4A148C', secondary: '#FFFFFF' },
    reputation: 50,
    description: 'Quadro amadorista fundado por caixeiros-viajantes e lojistas do centro urbano.',
  },
]);

/**
 * Generates an authentic 1910 opponent squad arranged in 2-3-5 formation.
 */
export function generate1910RivalTeam(
  preset: Historical1910RivalPreset,
  date: GameDate,
  rng: CampaignRng
): MatchTeamInput {
  const stream = rng.football;

  const firstNames = [
    'Arthur', 'Oscar', 'Mario', 'Henrique', 'Alberto', 'Raul', 'Waldemar',
    'Eduardo', 'Gastão', 'Affonso', 'Plínio', 'Vicente', 'Manoel', 'Hermes',
    'Cláudio', 'Bento', 'Octavio', 'Juvenal', 'Alvaro', 'Anísio', 'Djalma',
  ];
  const lastNames = [
    'Albuquerque', 'Brandão', 'Carvalho', 'Drummond', 'Esteves', 'Fonseca',
    'Guedes', 'Homem de Mello', 'Magalhães', 'Nogueira', 'Pacheco', 'Queiroz',
    'Rezende', 'Silveira', 'Teixeira', 'Vasconcellos', 'Xavier',
  ];

  const positions: HistoricalPosition[] = [
    'GK', 'FB_R', 'FB_L', 'HB_R', 'CH', 'HB_L',
    'FW_OR', 'FW_IR', 'CF', 'FW_IL', 'FW_OL',
  ];

  const footballers: Footballer[] = positions.map((pos, idx) => {
    const fName = firstNames[Math.floor(stream.next() * firstNames.length)]!;
    const lName = lastNames[Math.floor(stream.next() * lastNames.length)]!;
    const name = `${fName} ${lName}`;
    const baseSkill = 40 + Math.round(preset.reputation * 0.35 + stream.next() * 20);

    const technical = {
      shooting: pos.startsWith('FW') || pos === 'CF' ? baseSkill + 10 : Math.max(10, baseSkill - 15),
      passing: pos.startsWith('HB') || pos === 'CH' ? baseSkill + 10 : baseSkill,
      ballControl: baseSkill + Math.round((stream.next() - 0.5) * 10),
      dribbling: pos.startsWith('FW') ? baseSkill + 8 : Math.max(10, baseSkill - 10),
      tackling: pos.startsWith('FB') || pos.startsWith('HB') || pos === 'CH' ? baseSkill + 12 : Math.max(10, baseSkill - 20),
      aerial: pos === 'CF' || pos.startsWith('FB') || pos === 'CH' ? baseSkill + 8 : baseSkill,
      goalkeeping: pos === 'GK' ? baseSkill + 25 : 5,
    };

    const physical = {
      pace: 45 + Math.round(stream.next() * 35),
      stamina: 50 + Math.round(stream.next() * 35),
      strength: 45 + Math.round(stream.next() * 35),
      agility: 45 + Math.round(stream.next() * 35),
    };

    const mental = {
      decision: 40 + Math.round(stream.next() * 30),
      positioning: 40 + Math.round(stream.next() * 35),
      composure: 40 + Math.round(stream.next() * 30),
      courage: 50 + Math.round(stream.next() * 35),
      discipline: 45 + Math.round(stream.next() * 30),
    };

    const personality = {
      leadership: 40 + Math.round(stream.next() * 30),
      professionalism: 50 + Math.round(stream.next() * 30),
      ambition: 40 + Math.round(stream.next() * 40),
      temperament: 40 + Math.round(stream.next() * 40),
      loyalty: 60 + Math.round(stream.next() * 30),
    };

    return Object.freeze({
      id: `rival-${preset.shortName.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}`,
      personId: `rival-person-${preset.shortName.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}`,
      name,
      birthYear: date.year - (18 + Math.floor(stream.next() * 12)),
      age: 18 + Math.floor(stream.next() * 12),
      positions: [pos],
      preferredFoot: stream.next() > 0.25 ? 'right' : 'left',
      technical: Object.freeze(technical),
      physical: Object.freeze(physical),
      mental: Object.freeze(mental),
      personality: Object.freeze(personality),
      potential: baseSkill + 10,
      reputation: preset.reputation - 5 + Math.round(stream.next() * 10),
      condition: 85 + Math.round(stream.next() * 15),
      fatigue: Math.round(stream.next() * 15),
      injuryRisk: 5,
      policyTier: 'amateur',
      squadRole: 'starter',
      joinedDate: Object.freeze({ ...date }),
      clubHistory: Object.freeze([]),
      matchHistory: Object.freeze([]),
      achievements: Object.freeze([]),
    });
  });

  return Object.freeze({
    id: `rival-${preset.shortName.toLowerCase().replace(/\s+/g, '-')}`,
    name: preset.name,
    shortName: preset.shortName,
    colors: preset.colors,
    squad: Object.freeze(footballers),
    tacticalOrientation: 'balanced',
  });
}

/**
 * Calculates matchday attendance, gate receipts, and operational expenses in PPU.
 */
export function calculate1910MatchdayFinances(
  homeReputation: number,
  awayReputation: number,
  stadiumCapacity = 600,
  hasGrandstand = false,
  isFestival = false,
  rng: CampaignRng
): { attendance: number; gateReceiptsPPU: number; matchExpensesPPU: number; netIncomePPU: number } {
  const stream = rng.football;

  // Base interest in 1910: between 150 and 600 people for normal amateur matches
  const prestigeBonus = (homeReputation + awayReputation) * 2.5;
  const festivalMultiplier = isFestival ? 1.4 : 1.0;
  const variance = 0.85 + stream.next() * 0.30;

  const rawAttendance = Math.round((120 + prestigeBonus) * festivalMultiplier * variance);
  const maxCapacity = hasGrandstand ? Math.max(stadiumCapacity, 1500) : stadiumCapacity;
  const attendance = Math.min(rawAttendance, maxCapacity);

  // 1910 amateur ticket price ~ 0.05 to 0.10 PPU (approx. 1$000 to 2$000 réis)
  const ticketPricePPU = 0.08;
  const gateReceiptsPPU = Math.round(attendance * ticketPricePPU);

  // Expenses: field preparation (cal, capina), ball, visiting team bonde fare, music band for festival
  const baseExpenses = isFestival ? 12 : 5;
  const matchExpensesPPU = Math.round(baseExpenses + stream.next() * 4);
  const netIncomePPU = gateReceiptsPPU - matchExpensesPPU;

  return {
    attendance,
    gateReceiptsPPU,
    matchExpensesPPU,
    netIncomePPU,
  };
}

interface MutableTracker {
  goals: number;
  assists: number;
  shots: number;
  tackles: number;
  saves: number;
  fouls: number;
  injured: boolean;
  expelled: boolean;
  minutesPlayed: number;
  duelsWon: number;
  duelsTotal: number;
}

/**
 * Core Match Simulation Engine for 1910 (E7).
 * Strictly avoids overall rating: resolves specific duels by line and position.
 */
export function simulateHistoricalMatch(input: SimulateMatchInput): MatchSimulationResult {
  const { matchId, date, competitionType, competitionName, homeTeam, awayTeam, rng } = input;
  const stream = rng.football;
  const rules = getFootballRulesForEra(date.year);
  const pitchCondition = input.pitchCondition ?? 'dirt';

  // Extract starting XI for both teams (fallback to first 11 if squad is large)
  const homeStarters = homeTeam.squad.slice(0, 11);
  const awayStarters = awayTeam.squad.slice(0, 11);

  const homeTrackers = new Map<string, MutableTracker>();
  const awayTrackers = new Map<string, MutableTracker>();

  for (const f of homeStarters) {
    homeTrackers.set(f.id, {
      goals: 0,
      assists: 0,
      shots: 0,
      tackles: 0,
      saves: 0,
      fouls: 0,
      injured: false,
      expelled: false,
      minutesPlayed: 90,
      duelsWon: 0,
      duelsTotal: 0,
    });
  }

  for (const f of awayStarters) {
    awayTrackers.set(f.id, {
      goals: 0,
      assists: 0,
      shots: 0,
      tackles: 0,
      saves: 0,
      fouls: 0,
      injured: false,
      expelled: false,
      minutesPlayed: 90,
      duelsWon: 0,
      duelsTotal: 0,
    });
  }

  const events: MatchEvent[] = [];
  const newHomeInjuries: PlayerInjury[] = [];

  // Match timeline kickoff
  events.push({
    minute: 1,
    type: 'kickoff',
    team: 'home',
    descriptionPt: `O juiz de campo soa o apito inicial sob aplausos do público na praça de esportes. Começa o prélio entre ${homeTeam.name} e ${awayTeam.name}!`,
  });

  let homeScore = 0;
  let awayScore = 0;

  let homeActiveMen = homeStarters.length;
  let awayActiveMen = awayStarters.length;

  // We simulate 14 attacking phase opportunities distributed across 90 minutes
  const keyMinutes = [6, 14, 21, 28, 35, 42, 48, 55, 62, 69, 75, 82, 86, 89];

  // Helper getters for tactical lines
  const getLine = (squad: readonly Footballer[], prefixes: string[]) =>
    squad.filter((f) => prefixes.some((p) => f.positions.some((pos) => pos.startsWith(p) || pos === p)));

  const homeGK = homeStarters.find((f) => f.positions.includes('GK')) ?? homeStarters[0]!;
  const awayGK = awayStarters.find((f) => f.positions.includes('GK')) ?? awayStarters[0]!;

  const homeHalves = getLine(homeStarters, ['HB', 'CH']);
  const awayHalves = getLine(awayStarters, ['HB', 'CH']);

  const homeBacks = getLine(homeStarters, ['FB', 'CH']);
  const awayBacks = getLine(awayStarters, ['FB', 'CH']);

  const homeForwards = getLine(homeStarters, ['FW', 'CF']);
  const awayForwards = getLine(awayStarters, ['FW', 'CF']);

  let halfTimeRecorded = false;

  for (const minute of keyMinutes) {
    if (minute > 45 && !halfTimeRecorded) {
      events.push({
        minute: 45,
        type: 'halftime',
        team: 'home',
        descriptionPt: `Fim do primeiro tempo! O juiz apita o intervalo. Placar parcial: ${homeTeam.shortName} ${homeScore} x ${awayScore} ${awayTeam.shortName}.`,
      });
      halfTimeRecorded = true;
    }

    // Midfield duel: Halves passing + tackling + stamina + positioning
    const evalMidfield = (halves: Footballer[], activeCount: number, isHomeSide: boolean) => {
      if (halves.length === 0) return 30;
      const avg = halves.reduce((sum, h) =>
        sum + (h.technical.passing * 0.35 + h.technical.tackling * 0.25 + h.physical.stamina * 0.2 + h.mental.positioning * 0.2), 0) / halves.length;
      const manAdvantage = activeCount / 11;
      const homeAdvantage = isHomeSide ? 1.05 : 1.0;
      return avg * manAdvantage * homeAdvantage;
    };

    const homeMidPower = evalMidfield(homeHalves, homeActiveMen, true) + (stream.next() * 25 - 12.5);
    const awayMidPower = evalMidfield(awayHalves, awayActiveMen, false) + (stream.next() * 25 - 12.5);

    const attackingSide: 'home' | 'away' = homeMidPower >= awayMidPower ? 'home' : 'away';
    const attackingForwards = attackingSide === 'home' ? homeForwards : awayForwards;
    const defendingBacks = attackingSide === 'home' ? awayBacks : homeBacks;
    const defendingGK = attackingSide === 'home' ? awayGK : homeGK;
    const attackingClub = attackingSide === 'home' ? homeTeam : awayTeam;
    const defendingClub = attackingSide === 'home' ? awayTeam : homeTeam;
    const attackingTrackers = attackingSide === 'home' ? homeTrackers : awayTrackers;
    const defendingTrackers = attackingSide === 'home' ? awayTrackers : homeTrackers;

    if (attackingForwards.length === 0 || defendingBacks.length === 0) continue;

    // Pick a forward and a defender for the contest
    const attacker = attackingForwards[Math.floor(stream.next() * attackingForwards.length)]!;
    const defender = defendingBacks[Math.floor(stream.next() * defendingBacks.length)]!;
    const attTrack = attackingTrackers.get(attacker.id);
    const defTrack = defendingTrackers.get(defender.id);

    if (attTrack) attTrack.duelsTotal++;
    if (defTrack) defTrack.duelsTotal++;

    // Duel: Attacker pace/dribbling/positioning vs Defender tackling/strength/positioning
    const attackRoll = (attacker.physical.pace * 0.35 + attacker.technical.dribbling * 0.35 + attacker.mental.positioning * 0.3) + stream.next() * 30;
    const defenseRoll = (defender.technical.tackling * 0.45 + defender.physical.strength * 0.3 + defender.mental.positioning * 0.25) + stream.next() * 30;

    // Check for hard foul or tackle
    if (defenseRoll < attackRoll - 20 && stream.next() < 0.22) {
      if (defTrack) {
        defTrack.fouls++;
      }

      // 1910 Disciplinary: Verbal warning or direct expulsion (no yellow/red cards)
      if (stream.next() < 0.15 && !defTrack?.expelled) {
        if (defTrack) defTrack.expelled = true;
        if (attackingSide === 'home') awayActiveMen--;
        else homeActiveMen--;

        events.push({
          minute,
          type: 'expulsion',
          team: attackingSide === 'home' ? 'away' : 'home',
          primaryPlayerId: defender.id,
          primaryPlayerName: defender.name,
          descriptionPt: `Jogada ríspida! O zagueiro ${defender.name} (${defendingClub.shortName}) comete falta violenta. O juiz de campo repreende asperamente e determina sua imediata EXPULSÃO do gramado! Sem substituições na era de 1910, a equipe jogará com dez homens!`,
        });
      } else {
        events.push({
          minute,
          type: 'verbal_caution',
          team: attackingSide === 'home' ? 'away' : 'home',
          primaryPlayerId: defender.id,
          primaryPlayerName: defender.name,
          descriptionPt: `Falta de jogo! ${defender.name} entra firme na dividida e recebe severa advertência verbal do árbitro.`,
        });
      }

      // Possibility of in-match injury due to violent play or dirt pitch
      if (pitchCondition === 'dirt' && stream.next() < 0.20 && !attTrack?.injured) {
        if (attTrack) attTrack.injured = true;
        if (attackingSide === 'home') {
          homeActiveMen--;
          const injury: PlayerInjury = {
            id: `inj-match-${attacker.id}-${date.year}-${minute}`,
            type: stream.next() > 0.5 ? 'contusion' : 'sprain',
            description: `Contusão severa na perna em dividida no jogo contra ${awayTeam.shortName}`,
            occurredDate: date,
            expectedWeeks: Math.round(2 + stream.next() * 4),
            weeksRemaining: Math.round(2 + stream.next() * 4),
            severity: 'moderate',
          };
          newHomeInjuries.push(injury);
        } else {
          awayActiveMen--;
        }

        events.push({
          minute,
          type: 'injury',
          team: attackingSide,
          primaryPlayerId: attacker.id,
          primaryPlayerName: attacker.name,
          descriptionPt: `Preocupação no gramado! O atacante ${attacker.name} (${attackingClub.shortName}) torce a perna e não reúne condições de voltar ao campo. O clube segue o prélio com um homem a menos!`,
        });
      }

      continue;
    }

    if (defenseRoll >= attackRoll) {
      // Defender successfully intercepts or tackles
      if (defTrack) {
        defTrack.tackles++;
        defTrack.duelsWon++;
      }
      continue;
    }

    // Attacker broke through! Attacker creates shot opportunity
    if (attTrack) {
      attTrack.shots++;
      attTrack.duelsWon++;
    }

    // Finishing vs Goalkeeper
    const gkTrack = defendingTrackers.get(defendingGK.id);
    const finishRating = (attacker.technical.shooting * 0.5 + attacker.mental.composure * 0.3 + attacker.technical.ballControl * 0.2) + stream.next() * 25;
    const gkRating = (defendingGK.technical.goalkeeping * 0.5 + defendingGK.physical.agility * 0.3 + defendingGK.mental.positioning * 0.2) + stream.next() * 25;

    if (finishRating > gkRating + 8) {
      // GOAL!
      if (attTrack) attTrack.goals++;
      if (attackingSide === 'home') homeScore++;
      else awayScore++;

      // Pick an assistant from another forward or half
      const otherForwards = attackingForwards.filter((f) => f.id !== attacker.id);
      const assistant = otherForwards.length > 0 ? otherForwards[Math.floor(stream.next() * otherForwards.length)] : undefined;
      if (assistant) {
        const asstTrack = attackingTrackers.get(assistant.id);
        if (asstTrack) asstTrack.assists++;
      }

      const assistNarrative = assistant ? ` após formoso passe cruzado de ${assistant.name}` : ' em arremate individual certeiro';

      events.push({
        minute,
        type: 'goal',
        team: attackingSide,
        primaryPlayerId: attacker.id,
        primaryPlayerName: attacker.name,
        secondaryPlayerId: assistant?.id,
        secondaryPlayerName: assistant?.name,
        descriptionPt: `GOL! Sensacional tento de ${attacker.name} (${attackingClub.shortName})${assistNarrative}! A bola vai ao fundo das redes sem chances para o guardião! Placar: ${homeTeam.shortName} ${homeScore} x ${awayScore} ${awayTeam.shortName}!`,
      });
    } else if (gkRating >= finishRating - 8) {
      // Great save by Goalkeeper
      if (gkTrack) {
        gkTrack.saves++;
        gkTrack.duelsWon++;
      }
      events.push({
        minute,
        type: 'shot_saved',
        team: attackingSide,
        primaryPlayerId: attacker.id,
        primaryPlayerName: attacker.name,
        secondaryPlayerId: defendingGK.id,
        secondaryPlayerName: defendingGK.name,
        descriptionPt: `Defesa milagrosa! ${attacker.name} finaliza forte, mas o guardião ${defendingGK.name} (${defendingClub.shortName}) se agiganta e espalma a pelota pela linha de fundo!`,
      });
    } else {
      // Shot missed / wide / woodwork
      events.push({
        minute,
        type: 'shot_missed',
        team: attackingSide,
        primaryPlayerId: attacker.id,
        primaryPlayerName: attacker.name,
        descriptionPt: `Oportunidade perdida! ${attacker.name} finta a zaga e chuta colocado, mas a bola raspa a trave de madeira e sai em tiro de meta.`,
      });
    }
  }

  // Fulltime event
  events.push({
    minute: 90,
    type: 'fulltime',
    team: 'home',
    descriptionPt: `Fim do segundo tempo! O árbitro apita o encerramento do encontro esportivo. Resultado final: ${homeTeam.name} ${homeScore} x ${awayScore} ${awayTeam.name}.`,
  });

  // Calculate Match Participant outputs & Ratings (1.0 to 10.0 scale)
  const buildLineup = (starters: Footballer[], trackers: Map<string, MutableTracker>): MatchParticipant[] =>
    starters.map((f) => {
      const t = trackers.get(f.id) ?? {
        goals: 0,
        assists: 0,
        shots: 0,
        tackles: 0,
        saves: 0,
        fouls: 0,
        injured: false,
        expelled: false,
        minutesPlayed: 90,
        duelsWon: 0,
        duelsTotal: 0,
      };

      // Base rating starts around 6.0
      let calcRating = 6.0;
      calcRating += t.goals * 1.5;
      calcRating += t.assists * 0.9;
      calcRating += t.saves * 0.7;
      calcRating += t.tackles * 0.4;
      calcRating -= t.fouls * 0.2;
      if (t.expelled) calcRating -= 2.0;

      const finalRating = Math.max(3.0, Math.min(10.0, Math.round(calcRating * 10) / 10));

      // Post-match condition exhaustion (10–22 pts) and fatigue accumulation (12–25 pts)
      const staminaFactor = Math.max(0.6, (120 - f.physical.stamina) / 100);
      const conditionLoss = Math.round((14 + stream.next() * 8) * staminaFactor);
      const fatigueGain = Math.round((16 + stream.next() * 10) * staminaFactor);

      const conditionAfter = Math.max(10, f.condition - conditionLoss);

      return Object.freeze({
        footballerId: f.id,
        personId: f.personId,
        name: f.name,
        position: f.positions[0]!,
        minutesPlayed: t.minutesPlayed,
        rating: finalRating,
        goals: t.goals,
        assists: t.assists,
        shots: t.shots,
        tackles: t.tackles,
        saves: t.saves,
        fouls: t.fouls,
        injured: t.injured,
        expelled: t.expelled,
        conditionBefore: f.condition,
        conditionAfter,
        fatigueAccumulated: fatigueGain,
      });
    });

  const homeLineup = Object.freeze(buildLineup(homeStarters, homeTrackers));
  const awayLineup = Object.freeze(buildLineup(awayStarters, awayTrackers));

  // Match Finances
  const isFestival = competitionType === 'festival_taça';
  const finance = calculate1910MatchdayFinances(
    homeTeam.squad[0]?.reputation ?? 50,
    awayTeam.squad[0]?.reputation ?? 50,
    input.stadiumCapacity,
    input.hasGrandstand,
    isFestival,
    rng
  );

  const summaryPt = `${homeTeam.name} ${homeScore} x ${awayScore} ${awayTeam.name} (${events.filter((e) => e.type === 'goal').length} gols, ${finance.attendance} espectadores na praça de esportes).`;

  const record: MatchRecord = Object.freeze({
    id: matchId,
    date: Object.freeze({ ...date }),
    competitionType,
    competitionName,
    homeClubId: homeTeam.id,
    homeClubName: homeTeam.name,
    awayClubId: awayTeam.id,
    awayClubName: awayTeam.name,
    homeScore,
    awayScore,
    attendance: finance.attendance,
    gateReceiptsPPU: finance.gateReceiptsPPU,
    matchExpensesPPU: finance.matchExpensesPPU,
    netIncomePPU: finance.netIncomePPU,
    homeLineup,
    awayLineup,
    events: Object.freeze(events),
    rules,
    pitchCondition,
    homeFormation: '2-3-5',
    awayFormation: '2-3-5',
    summaryPt,
  });

  // Financial transactions for ledger
  const matchRevenueTransaction: FinancialTransaction = {
    id: `tx-match-rev-${matchId}`,
    date,
    category: 'match_revenue',
    amountPPU: finance.gateReceiptsPPU,
    description: `Bilheteria do encontro esportivo: ${homeTeam.shortName} x ${awayTeam.shortName} (${finance.attendance} torcedores)`,
  };

  const matchExpenseTransaction: FinancialTransaction = {
    id: `tx-match-exp-${matchId}`,
    date,
    category: 'match_expense',
    amountPPU: -finance.matchExpensesPPU,
    description: `Despesas de jogo (cal, transporte do ${awayTeam.shortName}, juiz e festa esportiva)`,
  };

  // Update home squad condition, fatigue, injuries, and match records
  const updatedFootballers = homeTeam.squad.map((f) => {
    const participant = homeLineup.find((p) => p.footballerId === f.id);
    if (!participant) return f;

    const newMatchRecord: PlayerMatchRecord = Object.freeze({
      matchId,
      date: Object.freeze({ ...date }),
      minutesPlayed: participant.minutesPlayed,
      rating: participant.rating,
      goals: participant.goals,
    });

    const updatedMatchHistory = Object.freeze([...f.matchHistory, newMatchRecord]);

    // Update club spells appearance / goal tally
    const currentSpell = f.clubHistory.find((c) => c.clubId === homeTeam.id) ?? {
      clubId: homeTeam.id,
      clubName: homeTeam.name,
      startYear: date.year,
      appearances: 0,
      goals: 0,
    };

    const updatedSpell: PlayerClubSpell = Object.freeze({
      ...currentSpell,
      appearances: currentSpell.appearances + 1,
      goals: currentSpell.goals + participant.goals,
    });

    const updatedClubHistory = Object.freeze([
      ...f.clubHistory.filter((c) => c.clubId !== homeTeam.id),
      updatedSpell,
    ]);

    // Check if player was injured during match
    const matchInjury = newHomeInjuries.find((i) => i.id.includes(f.id));
    const currentInjury = matchInjury ?? f.currentInjury;

    return Object.freeze({
      ...f,
      condition: participant.conditionAfter,
      fatigue: Math.min(100, (f.fatigue ?? 0) + participant.fatigueAccumulated),
      ...(currentInjury ? { currentInjury } : {}),
      clubHistory: updatedClubHistory,
      matchHistory: updatedMatchHistory,
    });
  });

  const updatedHomeSquad: FootballSquadState = Object.freeze({
    footballers: Object.freeze(updatedFootballers),
    formationTactic: '2-3-5',
    captainFootballerId: homeStarters[0]?.id,
    viceCaptainFootballerId: homeStarters[1]?.id,
  });

  return {
    record,
    updatedHomeSquad,
    newHomeInjuries: Object.freeze(newHomeInjuries),
    matchRevenueTransaction,
    matchExpenseTransaction,
  };
}
