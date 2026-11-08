import type { GameDate } from '../HistoricalClock';

export type VotingSystem =
  | 'one_club_one_vote'
  | 'weighted_by_seniority'
  | 'capital_hegemony';

export type AmateurismClause =
  | 'strict_amateur'
  | 'assisted_allowed'
  | 'open_amateur';

export type FieldRequirement =
  | 'fenced_pitch_mandatory'
  | 'basic_pitch_allowed';

export type DisputeResolution =
  | 'statutory_tribunal'
  | 'presidential_decree'
  | 'arbitration_board';

export interface FederationStatutes {
  readonly votingSystem: VotingSystem;
  readonly amateurismClause: AmateurismClause;
  readonly fieldRequirement: FieldRequirement;
  readonly disputeResolution: DisputeResolution;
}

export type BlocIdeology =
  | 'aristocratic_conservation'
  | 'popular_expansion'
  | 'regional_autonomy'
  | 'mercantile_pragmatism';

export interface FederationBloc {
  readonly id: string;
  readonly name: string;
  readonly leaderClubId: string;
  readonly memberClubIds: readonly string[];
  readonly ideology: BlocIdeology;
  readonly influenceShare: number; // 0–100
}

export interface PresidencyTerm {
  readonly id: string;
  readonly presidentName: string;
  readonly clubOfOriginId: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly platform: string;
  readonly achievements: readonly string[];
}

export type ProfessionalismTier =
  | 'strict_amateur'
  | 'assisted_amateur'
  | 'semi_professional'
  | 'professional';

export interface ProfessionalismPolicy {
  readonly tier: ProfessionalismTier;
  readonly sanctionsForBrownAmateurism: boolean;
  readonly minimumWageMandatory: boolean;
}

export interface DissidentLeague {
  readonly id: string;
  readonly name: string;
  readonly foundedYear: number;
  readonly memberClubIds: readonly string[];
  readonly leaderClubId: string;
  readonly reason: string;
}

export type FederationStatus = 'forming' | 'active' | 'schism' | 'reunified';

export interface FederationState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly foundingDate: Readonly<GameDate>;
  readonly status: FederationStatus;
  readonly foundingClubs: readonly string[];
  readonly affiliatedClubs: readonly string[];
  readonly presidents: readonly PresidencyTerm[];
  readonly statutes: FederationStatutes;
  readonly blocs: readonly FederationBloc[];
  readonly competitions: readonly string[];
  readonly professionalismPolicy: ProfessionalismPolicy;
  readonly historicalEvents: readonly string[];
  readonly dissidentLeague?: DissidentLeague;
}

/**
 * Validates and freezes a FederationState object defensiveliy.
 */
export function validateFederationState(value: unknown): FederationState | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>;

  if (typeof c.id !== 'string' || c.id.trim().length === 0) return null;
  if (typeof c.name !== 'string' || c.name.trim().length === 0) return null;
  if (typeof c.shortName !== 'string' || c.shortName.trim().length === 0) return null;

  if (!c.foundingDate || typeof c.foundingDate !== 'object') return null;
  const fDate = c.foundingDate as Record<string, unknown>;
  if (typeof fDate.year !== 'number' || typeof fDate.month !== 'number' || typeof fDate.day !== 'number') return null;

  const validStatuses: FederationStatus[] = ['forming', 'active', 'schism', 'reunified'];
  if (typeof c.status !== 'string' || !validStatuses.includes(c.status as FederationStatus)) return null;

  if (!Array.isArray(c.foundingClubs) || !Array.isArray(c.affiliatedClubs)) return null;
  if (!Array.isArray(c.presidents) || !Array.isArray(c.blocs) || !Array.isArray(c.competitions) || !Array.isArray(c.historicalEvents)) return null;

  if (!c.statutes || typeof c.statutes !== 'object') return null;
  const st = c.statutes as Record<string, unknown>;
  const validVoting: VotingSystem[] = ['one_club_one_vote', 'weighted_by_seniority', 'capital_hegemony'];
  if (typeof st.votingSystem !== 'string' || !validVoting.includes(st.votingSystem as VotingSystem)) return null;

  if (!c.professionalismPolicy || typeof c.professionalismPolicy !== 'object') return null;
  const pp = c.professionalismPolicy as Record<string, unknown>;
  const validTiers: ProfessionalismTier[] = ['strict_amateur', 'assisted_amateur', 'semi_professional', 'professional'];
  if (typeof pp.tier !== 'string' || !validTiers.includes(pp.tier as ProfessionalismTier)) return null;

  const presidents: PresidencyTerm[] = [];
  for (const p of c.presidents) {
    if (p && typeof p === 'object' && typeof (p as any).presidentName === 'string') {
      presidents.push(Object.freeze({
        id: String((p as any).id),
        presidentName: String((p as any).presidentName),
        clubOfOriginId: String((p as any).clubOfOriginId),
        startYear: Number((p as any).startYear),
        endYear: Number((p as any).endYear),
        platform: String((p as any).platform),
        achievements: Array.isArray((p as any).achievements) ? Object.freeze([...(p as any).achievements.map(String)]) : Object.freeze([]),
      }));
    }
  }

  const blocs: FederationBloc[] = [];
  for (const b of c.blocs) {
    if (b && typeof b === 'object' && typeof (b as any).name === 'string') {
      blocs.push(Object.freeze({
        id: String((b as any).id),
        name: String((b as any).name),
        leaderClubId: String((b as any).leaderClubId),
        memberClubIds: Array.isArray((b as any).memberClubIds) ? Object.freeze([...(b as any).memberClubIds.map(String)]) : Object.freeze([]),
        ideology: (b as any).ideology as BlocIdeology,
        influenceShare: Number((b as any).influenceShare),
      }));
    }
  }

  let dissidentLeague: DissidentLeague | undefined;
  if (c.dissidentLeague && typeof c.dissidentLeague === 'object') {
    const dl = c.dissidentLeague as Record<string, unknown>;
    dissidentLeague = Object.freeze({
      id: String(dl.id),
      name: String(dl.name),
      foundedYear: Number(dl.foundedYear),
      memberClubIds: Array.isArray(dl.memberClubIds) ? Object.freeze([...dl.memberClubIds.map(String)]) : Object.freeze([]),
      leaderClubId: String(dl.leaderClubId),
      reason: String(dl.reason),
    });
  }

  return Object.freeze({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    foundingDate: Object.freeze({ year: Number(fDate.year), month: Number(fDate.month), day: Number(fDate.day) }),
    status: c.status as FederationStatus,
    foundingClubs: Object.freeze([...c.foundingClubs.map(String)]),
    affiliatedClubs: Object.freeze([...c.affiliatedClubs.map(String)]),
    presidents: Object.freeze(presidents),
    statutes: Object.freeze({
      votingSystem: st.votingSystem as VotingSystem,
      amateurismClause: st.amateurismClause as AmateurismClause,
      fieldRequirement: st.fieldRequirement as FieldRequirement,
      disputeResolution: st.disputeResolution as DisputeResolution,
    }),
    blocs: Object.freeze(blocs),
    competitions: Object.freeze([...c.competitions.map(String)]),
    professionalismPolicy: Object.freeze({
      tier: pp.tier as ProfessionalismTier,
      sanctionsForBrownAmateurism: Boolean(pp.sanctionsForBrownAmateurism),
      minimumWageMandatory: Boolean(pp.minimumWageMandatory),
    }),
    historicalEvents: Object.freeze([...c.historicalEvents.map(String)]),
    ...(dissidentLeague ? { dissidentLeague } : {}),
  });
}
