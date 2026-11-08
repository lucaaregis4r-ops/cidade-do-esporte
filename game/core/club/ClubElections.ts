/**
 * Club Elections & Presidential Mandate (Alpha D: D7, D8, D9).
 * Governs biographical presidential candidates, factional voting, statutory elections,
 * and presidential policy profiles affecting club governance, tolerances, and spending.
 *
 * SPECIFICATION (PLANO MESTRE DE IMPLEMENTAÇÃO):
 * - PresidentProfile:
 *     budgetTolerance: number;
 *     debtTolerance: number;
 *     sportInvestment: number;
 *     socialInvestment: number;
 *     propertyStrategy: number;
 *     professionalismPreference: number;
 *     membershipPricingPreference: number;
 * - Candidate:
 *     id: string;
 *     personId: string;
 *     name: string;
 *     age: number;
 *     clubTenureYears: number;
 *     previousRoles: readonly string[];
 *     factionType: PoliticalFactionType;
 *     factionName: string;
 *     priorities: readonly string[];
 *     profile: PresidentProfile;
 *     biography: string;
 *     votesReceivedBps?: number;
 */

import type { GameDate } from '../HistoricalClock';
import type { Person } from '../person/Person';
import type { ClubPoliticsState, PoliticalFactionType } from './ClubPolitics';
import type { ClubBoardState, BoardMember } from './ClubBoard';
import type { CampaignRng } from '../CampaignRng';

export interface PresidentProfile {
  readonly budgetTolerance: number;                // 0–100 (conservative austerity vs deficit spending)
  readonly debtTolerance: number;                  // 0–100 (debt aversion vs credit leveraged)
  readonly sportInvestment: number;                // 0–100 (focus on pitch, football gear, matches)
  readonly socialInvestment: number;               // 0–100 (focus on headquarters, member balls, conviviality)
  readonly propertyStrategy: number;               // 0–100 (0 = rent/temporary, 100 = land purchase & stadium)
  readonly professionalismPreference: number;      // 0–100 (amateur purity vs professionalization)
  readonly membershipPricingPreference: number;   // 0–100 (0 = popular/subsidized, 100 = exclusive/expensive)
}

export interface ElectionCandidate {
  readonly id: string;
  readonly personId: string;
  readonly name: string;
  readonly age: number;
  readonly clubTenureYears: number;
  readonly previousRoles: readonly string[];
  readonly factionType: PoliticalFactionType;
  readonly factionName: string;
  readonly priorities: readonly string[];
  readonly profile: Readonly<PresidentProfile>;
  readonly biography: string;
  readonly votesReceivedBps: number; // basis points (0–10000)
}

export interface ClubElectionEvent {
  readonly id: string;
  readonly electionDate: Readonly<GameDate>;
  readonly termYears: number;
  readonly candidates: readonly ElectionCandidate[];
  readonly winnerCandidateId: string;
  readonly winnerName: string;
  readonly winnerFactionType: PoliticalFactionType;
  readonly appliedProfile: Readonly<PresidentProfile>;
  readonly turnoutBps: number;
  readonly summaryNarrative: string;
}

export interface GenerateCandidatesInput {
  readonly currentYear: number;
  readonly currentDate: GameDate;
  readonly politics: ClubPoliticsState;
  readonly candidatesPool: readonly Person[];
  readonly currentBoard?: ClubBoardState;
  readonly rng: CampaignRng;
}

/** Predefined archetype profiles by faction */
const FACTION_PROFILES: Readonly<Record<PoliticalFactionType, PresidentProfile>> = Object.freeze({
  fundadores: {
    budgetTolerance: 40,
    debtTolerance: 20,
    sportInvestment: 50,
    socialInvestment: 70,
    propertyStrategy: 60,
    professionalismPreference: 20,
    membershipPricingPreference: 45,
  },
  futebolistas: {
    budgetTolerance: 65,
    debtTolerance: 50,
    sportInvestment: 95,
    socialInvestment: 30,
    propertyStrategy: 70,
    professionalismPreference: 85,
    membershipPricingPreference: 40,
  },
  patrimonialistas: {
    budgetTolerance: 50,
    debtTolerance: 60,
    sportInvestment: 40,
    socialInvestment: 80,
    propertyStrategy: 95,
    professionalismPreference: 35,
    membershipPricingPreference: 65,
  },
  fiscalistas: {
    budgetTolerance: 15,
    debtTolerance: 5,
    sportInvestment: 40,
    socialInvestment: 35,
    propertyStrategy: 45,
    professionalismPreference: 30,
    membershipPricingPreference: 55,
  },
  populares: {
    budgetTolerance: 55,
    debtTolerance: 30,
    sportInvestment: 75,
    socialInvestment: 60,
    propertyStrategy: 50,
    professionalismPreference: 50,
    membershipPricingPreference: 10,
  },
  elitistas: {
    budgetTolerance: 70,
    debtTolerance: 40,
    sportInvestment: 45,
    socialInvestment: 95,
    propertyStrategy: 80,
    professionalismPreference: 40,
    membershipPricingPreference: 95,
  },
  modernizadores: {
    budgetTolerance: 75,
    debtTolerance: 65,
    sportInvestment: 80,
    socialInvestment: 70,
    propertyStrategy: 75,
    professionalismPreference: 90,
    membershipPricingPreference: 60,
  },
  tradicionalistas: {
    budgetTolerance: 30,
    debtTolerance: 15,
    sportInvestment: 45,
    socialInvestment: 65,
    propertyStrategy: 50,
    professionalismPreference: 10,
    membershipPricingPreference: 50,
  },
});

const FACTION_PRIORITIES: Readonly<Record<PoliticalFactionType, readonly string[]>> = Object.freeze({
  fundadores: ['Preservar as cores e a ata inaugural de 1910', 'Homenagear os primeiros patronos do clube'],
  futebolistas: ['Contratar material de primeira linha', 'Qualificar o campo para grandes clássicos'],
  patrimonialistas: ['Construir arquibancadas de madeira cobertas', 'Comprar definitivamente o lote da praça'],
  fiscalistas: ['Equilibrar despesas de manutenção', 'Formar fundo de reserva para contingências'],
  populares: ['Reduzir mensalidade do sócio contribuinte', 'Facilitar entrada de torcedores operários'],
  elitistas: ['Construir salão nobre para bailes da elite', 'Elevar padrão de admissão estatutária'],
  modernizadores: ['Reforma estatuária para mandato bienal', 'Expandir representação em ligas estaduais'],
  tradicionalistas: ['Proibir mudanças nos símbolos solenes', 'Fidelidade estrita aos costumes de fundação'],
});

/**
 * Generates 2 to 3 biographical presidential candidates representing active factions.
 */
export function generateElectionCandidates(input: GenerateCandidatesInput): ElectionCandidate[] {
  const activeFactions = input.politics.factions;
  if (activeFactions.length === 0) return [];

  // Pick top 2 or 3 factions by influence
  const sortedFactions = [...activeFactions].sort((a, b) => b.influenceBps - a.influenceBps);
  const competingFactions = sortedFactions.slice(0, Math.min(3, sortedFactions.length));

  const candidates: ElectionCandidate[] = [];
  const pool = [...input.candidatesPool];

  competingFactions.forEach((faction, idx) => {
    // Pick or create candidate
    let person = pool.find((p) => p.economicClass === faction.dominantClass || p.id === faction.leaderPersonId);
    if (!person && pool.length > 0) {
      person = pool[idx % pool.length];
    }

    const personId = person?.id ?? `cand-${faction.type}-${input.currentYear}`;
    const name = person?.name ?? faction.leaderName;
    const age = person ? Math.max(25, input.currentYear - person.birthDate.year) : 38 + idx * 4;
    const tenure = Math.max(1, input.currentYear - 1910);

    const baseProfile = FACTION_PROFILES[faction.type];
    const priorities = FACTION_PRIORITIES[faction.type];

    candidates.push(Object.freeze({
      id: `candidate-${faction.type}-${input.currentYear}`,
      personId,
      name,
      age,
      clubTenureYears: tenure,
      previousRoles: Object.freeze(person?.clubHistory ? person.clubHistory.map((c) => c.role) : ['Conselheiro']),
      factionType: faction.type,
      factionName: faction.name,
      priorities,
      profile: Object.freeze(baseProfile),
      biography: person?.biography ?? `${name}, dedicado defensor da corrente ${faction.name}.`,
      votesReceivedBps: 0,
    }));
  });

  return candidates;
}

/**
 * Conducts a statutory election where factions vote based on their influence and candidate affinity.
 * The player can also cast their presidential ballot for a specific candidate.
 */
export function conductClubElection(
  candidates: readonly ElectionCandidate[],
  politics: ClubPoliticsState,
  electionDate: GameDate,
  termYears: number,
  playerVotedCandidateId?: string,
): ClubElectionEvent {
  if (candidates.length === 0) {
    throw new Error('Cannot conduct election without candidates');
  }

  // Calculate vote shares in basis points
  const candidateScores: Record<string, number> = {};
  for (const c of candidates) {
    candidateScores[c.id] = 0;
  }

  // Factions allocate votes based on candidate alignment
  for (const faction of politics.factions) {
    let bestCandidate = candidates[0];
    let bestScore = -1;

    for (const cand of candidates) {
      let score = 50;
      if (cand.factionType === faction.type) score += 100;
      if (cand.profile.membershipPricingPreference < 30 && faction.type === 'populares') score += 40;
      if (cand.profile.budgetTolerance < 30 && faction.type === 'fiscalistas') score += 40;
      if (cand.profile.propertyStrategy > 70 && faction.type === 'patrimonialistas') score += 40;
      if (cand.profile.sportInvestment > 70 && faction.type === 'futebolistas') score += 40;

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    candidateScores[bestCandidate.id] += faction.influenceBps;
  }

  // Player vote bonus (+1000 bps / 10% weight from executive board weight)
  if (playerVotedCandidateId && candidateScores[playerVotedCandidateId] !== undefined) {
    candidateScores[playerVotedCandidateId] += 1000;
  }

  // Normalize to 10,000 total bps
  const totalScore = Object.values(candidateScores).reduce((a, b) => a + b, 0);
  const evaluatedCandidates: ElectionCandidate[] = candidates.map((cand) => {
    const rawBps = candidateScores[cand.id] ?? 0;
    const finalBps = totalScore > 0 ? Math.round((rawBps / totalScore) * 10000) : Math.floor(10000 / candidates.length);
    return Object.freeze({
      ...cand,
      votesReceivedBps: finalBps,
    });
  });

  // Determine winner
  const winner = [...evaluatedCandidates].sort((a, b) => b.votesReceivedBps - a.votesReceivedBps)[0];

  const narrative = `Em Assembleia Geral Ordinária, ${winner.name} (${winner.factionName}) foi eleito Presidente da Diretoria para o mandato ${electionDate.year}–${electionDate.year + termYears} com ${(winner.votesReceivedBps / 100).toFixed(1)}% dos votos.`;

  return Object.freeze({
    id: `election-${electionDate.year}-${electionDate.month}`,
    electionDate: Object.freeze({ ...electionDate }),
    termYears,
    candidates: Object.freeze(evaluatedCandidates),
    winnerCandidateId: winner.id,
    winnerName: winner.name,
    winnerFactionType: winner.factionType,
    appliedProfile: winner.profile,
    turnoutBps: 8750, // 87.5% de participação dos sócios votantes
    summaryNarrative: narrative,
  });
}

/**
 * Applies the election results to the club's board and politics state.
 */
export function applyElectionToBoard(
  currentBoard: ClubBoardState,
  election: ClubElectionEvent,
  winnerCandidate: ElectionCandidate,
): ClubBoardState {
  const termEnd: GameDate = {
    year: election.electionDate.year + election.termYears,
    month: election.electionDate.month,
    day: election.electionDate.day,
  };

  const newPresident: BoardMember = {
    id: `dir-${winnerCandidate.personId}`,
    name: winnerCandidate.name,
    role: 'presidente',
    roleLabel: 'Presidente da Diretoria',
    socialClass: winnerCandidate.profile.membershipPricingPreference > 60 ? 'upper_class' : 'middle_class',
    occupation: winnerCandidate.priorities[0] ?? 'Dirigente Esportivo',
    termStart: { ...election.electionDate },
    termEnd,
    biography: winnerCandidate.biography,
  };

  const otherOfficers = currentBoard.members
    .filter((m) => m.role !== 'presidente')
    .map((m) => ({
      ...m,
      termStart: { ...election.electionDate },
      termEnd,
    }));

  return Object.freeze({
    members: Object.freeze([newPresident, ...otherOfficers]),
    electedDate: Object.freeze({ ...election.electionDate }),
    mandateYears: election.termYears,
    deliberationCouncilCount: currentBoard.deliberationCouncilCount,
  });
}

/**
 * Validates deserialized ClubElectionEvent.
 */
export function validateClubElectionEvent(value: unknown): ClubElectionEvent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const e = value as Partial<ClubElectionEvent>;

  if (typeof e.id !== 'string' || e.id.length === 0) return null;
  if (!e.electionDate || typeof e.electionDate.year !== 'number') return null;
  if (typeof e.winnerName !== 'string' || e.winnerName.length === 0) return null;
  if (!Array.isArray(e.candidates) || e.candidates.length === 0) return null;

  return value as ClubElectionEvent;
}
