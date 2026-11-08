import { daysInMonth, type GameDate } from '../HistoricalClock';
import { validateLandContract, type LandOccupancyContract } from './ClubLandContract';
import { validateClubFacility, type ClubFacility } from './ClubFacilities';
import { validateClubFinancialLedger, type ClubFinancialLedger } from './ClubFinances';
import { validateClubMembershipState, type ClubMembershipState } from './ClubMembers';
import { validateClubBoardState, type ClubBoardState } from './ClubBoard';
import { validateSocialIdentityState, type SocialIdentityState } from './SocialIdentity';
import { validateClubPoliticsState, type ClubPoliticsState } from './ClubPolitics';
import { validateClubElectionEvent, type ClubElectionEvent } from './ClubElections';
import { validateFootballSquadState, type FootballSquadState } from '../football/Footballer';
import { validateClubAthleticsPolicyState, type ClubAthleticsPolicyState } from '../football/FootballMarket';
import type { MatchRecord } from '../football/MatchEngine';
import type { ClubTrophy } from '../football/Competition';
import { validateClubLegend, type ClubLegend } from './LegacyScore';
import { validateHonorProposal, type InstitutionalHonorProposal } from './InstitutionalHonors';
import { validateHistoricalEvent, type HistoricalLedgerState } from './HistoricalLedger';

export type FoundingOrigin =
  | 'railway'       // Ferroviários
  | 'students'      // Estudantes
  | 'immigrants'    // Imigrantes
  | 'workers'       // Trabalhadores operários
  | 'merchants'     // Comerciantes
  | 'elite';        // Elite local

export const FOUNDING_ORIGINS: readonly FoundingOrigin[] = Object.freeze([
  'railway',
  'students',
  'immigrants',
  'workers',
  'merchants',
  'elite',
]);

export interface ClubColors {
  readonly primary: string;     // Hex color #rrggbb
  readonly secondary: string;   // Hex color #rrggbb
  readonly accent?: string;     // Optional hex color #rrggbb
}

export interface CrestVersion {
  readonly startYear: number;
  readonly endYear?: number;
  readonly designId: string;
  readonly changeReason: string;
}

export interface ClubState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly foundingDate: Readonly<GameDate>;
  readonly foundingOrigin: FoundingOrigin;
  readonly foundingStory?: string;
  readonly colors: Readonly<ClubColors>;
  readonly crestHistory: readonly CrestVersion[];
  readonly founders: readonly string[];          // IDs de pessoas fundadoras (Person)
  readonly parcels: readonly string[];           // IDs de parcelas sob ocupação do clube
  readonly facilities: readonly string[];        // IDs de instalações esportivas/sociais
  readonly reputation: number;                   // 0–100
  readonly contracts?: readonly LandOccupancyContract[];
  readonly facilityDetails?: readonly ClubFacility[];
  readonly finances?: ClubFinancialLedger;
  readonly membership?: ClubMembershipState;
  readonly board?: ClubBoardState;
  readonly socialIdentity?: SocialIdentityState;
  readonly politics?: ClubPoliticsState;
  readonly electionHistory?: readonly ClubElectionEvent[];
  readonly squad?: FootballSquadState;
  readonly athleticsPolicy?: ClubAthleticsPolicyState;
  readonly matchHistory?: readonly MatchRecord[];
  readonly trophies?: readonly ClubTrophy[];
  readonly clubLegends?: readonly ClubLegend[];
  readonly institutionalHonors?: readonly InstitutionalHonorProposal[];
  readonly historicalLedger?: HistoricalLedgerState;
}

export interface CreateClubInput {
  readonly id: string;
  readonly name: string;
  readonly shortName?: string;
  readonly foundingDate: GameDate;
  readonly foundingOrigin: FoundingOrigin;
  readonly foundingStory?: string;
  readonly colors: ClubColors;
  readonly crestHistory: readonly CrestVersion[];
  readonly founders?: readonly string[];
  readonly parcels?: readonly string[];
  readonly facilities?: readonly string[];
  readonly reputation?: number;
  readonly contracts?: readonly LandOccupancyContract[];
  readonly facilityDetails?: readonly ClubFacility[];
  readonly finances?: ClubFinancialLedger;
  readonly membership?: ClubMembershipState;
  readonly board?: ClubBoardState;
  readonly socialIdentity?: SocialIdentityState;
  readonly politics?: ClubPoliticsState;
  readonly electionHistory?: readonly ClubElectionEvent[];
  readonly squad?: FootballSquadState;
  readonly athleticsPolicy?: ClubAthleticsPolicyState;
  readonly matchHistory?: readonly MatchRecord[];
  readonly trophies?: readonly ClubTrophy[];
  readonly clubLegends?: readonly ClubLegend[];
  readonly institutionalHonors?: readonly InstitutionalHonorProposal[];
  readonly historicalLedger?: HistoricalLedgerState;
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function isValidHexColor(color: unknown): color is string {
  return typeof color === 'string' && HEX_COLOR_REGEX.test(color);
}

function validateDate(date: unknown): date is GameDate {
  if (date === null || typeof date !== 'object' || Array.isArray(date)) return false;
  const d = date as Partial<GameDate>;
  if (!Number.isInteger(d.year) || d.year! < 1910 || d.year! > 1959) return false;
  if (!Number.isInteger(d.month) || d.month! < 1 || d.month! > 12) return false;
  if (!Number.isInteger(d.day) || d.day! < 1 || d.day! > daysInMonth(d.year!, d.month!)) return false;
  return true;
}

function validateCrestVersion(version: unknown): CrestVersion | null {
  if (version === null || typeof version !== 'object' || Array.isArray(version)) return null;
  const v = version as Partial<CrestVersion>;
  if (!Number.isInteger(v.startYear) || v.startYear! < 1910 || v.startYear! > 1959) return null;
  if (v.endYear !== undefined && (!Number.isInteger(v.endYear) || v.endYear < v.startYear! || v.endYear > 1959)) return null;
  if (typeof v.designId !== 'string' || v.designId.trim().length === 0) return null;
  if (typeof v.changeReason !== 'string' || v.changeReason.trim().length === 0) return null;
  return Object.freeze({
    startYear: v.startYear!,
    ...(v.endYear !== undefined ? { endYear: v.endYear } : {}),
    designId: v.designId.trim(),
    changeReason: v.changeReason.trim(),
  });
}

function validateColors(colors: unknown): ClubColors | null {
  if (colors === null || typeof colors !== 'object' || Array.isArray(colors)) return null;
  const c = colors as Partial<ClubColors>;
  if (!isValidHexColor(c.primary) || !isValidHexColor(c.secondary)) return null;
  if (c.accent !== undefined && !isValidHexColor(c.accent)) return null;
  return Object.freeze({
    primary: c.primary,
    secondary: c.secondary,
    ...(c.accent ? { accent: c.accent } : {}),
  });
}

/** Factory to create a validated, defensively frozen ClubState. */
export function createClub(input: CreateClubInput): ClubState {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Club input must be an object');
  }

  if (typeof input.id !== 'string' || input.id.trim().length === 0) {
    throw new TypeError('Club ID must be a non-empty string');
  }

  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    throw new TypeError('Club name must be a non-empty string');
  }

  const shortName = input.shortName ? input.shortName.trim() : input.name.trim().slice(0, 10);
  if (shortName.length === 0) {
    throw new TypeError('Club shortName must be a non-empty string');
  }

  if (!validateDate(input.foundingDate)) {
    throw new RangeError('Club founding date must be a valid campaign date from 1910 through 1959');
  }

  if (!FOUNDING_ORIGINS.includes(input.foundingOrigin)) {
    throw new TypeError(`Invalid founding origin: ${input.foundingOrigin}`);
  }

  const validatedColors = validateColors(input.colors);
  if (!validatedColors) {
    throw new TypeError('Club colors must provide valid 6-digit hex primary and secondary colors');
  }

  if (!Array.isArray(input.crestHistory) || input.crestHistory.length === 0) {
    throw new TypeError('Club must have at least one crest version');
  }

  const crestHistory: CrestVersion[] = [];
  for (const item of input.crestHistory) {
    const validatedCrest = validateCrestVersion(item);
    if (!validatedCrest) throw new TypeError('Invalid crest version entry');
    crestHistory.push(validatedCrest);
  }

  const reputation = input.reputation ?? 10;
  if (!Number.isFinite(reputation) || reputation < 0 || reputation > 100) {
    throw new RangeError('Club reputation must be a finite number between 0 and 100');
  }

  const founders = Array.isArray(input.founders)
    ? input.founders.map((id) => {
        if (typeof id !== 'string' || id.trim().length === 0) throw new TypeError('Founder ID must be non-empty');
        return id.trim();
      })
    : [];

  const parcels = Array.isArray(input.parcels)
    ? input.parcels.map((id) => {
        if (typeof id !== 'string' || id.trim().length === 0) throw new TypeError('Parcel ID must be non-empty');
        return id.trim();
      })
    : [];

  const facilities = Array.isArray(input.facilities)
    ? input.facilities.map((id) => {
        if (typeof id !== 'string' || id.trim().length === 0) throw new TypeError('Facility ID must be non-empty');
        return id.trim();
      })
    : [];

  const contracts = Array.isArray(input.contracts)
    ? input.contracts.map((c) => {
        const validated = validateLandContract(c);
        if (!validated) throw new TypeError('Invalid land contract in club');
        return validated;
      })
    : [];

  const facilityDetails = Array.isArray(input.facilityDetails)
    ? input.facilityDetails.map((f) => {
        if (!validateClubFacility(f)) throw new TypeError('Invalid club facility in club');
        return Object.freeze({ ...f });
      })
    : undefined;

  let finances: ClubFinancialLedger | undefined;
  if (input.finances !== undefined) {
    if (!validateClubFinancialLedger(input.finances)) {
      throw new TypeError('Invalid club finances ledger in club');
    }
    finances = input.finances;
  }

  let membership: ClubMembershipState | undefined;
  if (input.membership !== undefined) {
    if (!validateClubMembershipState(input.membership)) {
      throw new TypeError('Invalid club membership state in club');
    }
    membership = input.membership;
  }

  let board: ClubBoardState | undefined;
  if (input.board !== undefined) {
    if (!validateClubBoardState(input.board)) {
      throw new TypeError('Invalid club board state in club');
    }
    board = input.board;
  }

  let socialIdentity: SocialIdentityState | undefined;
  if (input.socialIdentity !== undefined) {
    if (!validateSocialIdentityState(input.socialIdentity)) {
      throw new TypeError('Invalid social identity state in club');
    }
    socialIdentity = input.socialIdentity;
  }

  let politics: ClubPoliticsState | undefined;
  if (input.politics !== undefined) {
    const valPolitics = validateClubPoliticsState(input.politics);
    if (!valPolitics) {
      throw new TypeError('Invalid club politics state in club');
    }
    politics = valPolitics;
  }

  let squad: FootballSquadState | undefined;
  if (input.squad !== undefined) {
    if (!validateFootballSquadState(input.squad)) {
      throw new TypeError('Invalid football squad state in club');
    }
    squad = input.squad;
  }

  let athleticsPolicy: ClubAthleticsPolicyState | undefined;
  if (input.athleticsPolicy !== undefined) {
    if (!validateClubAthleticsPolicyState(input.athleticsPolicy)) {
      throw new TypeError('Invalid athletics policy state in club');
    }
    athleticsPolicy = input.athleticsPolicy;
  }

  let matchHistory: readonly MatchRecord[] | undefined;
  if (input.matchHistory !== undefined) {
    if (!Array.isArray(input.matchHistory)) {
      throw new TypeError('Invalid match history in club');
    }
    matchHistory = input.matchHistory;
  }

  return Object.freeze({
    id: input.id.trim(),
    name: input.name.trim(),
    shortName,
    foundingDate: Object.freeze({ ...input.foundingDate }),
    foundingOrigin: input.foundingOrigin,
    ...(input.foundingStory ? { foundingStory: input.foundingStory.trim() } : {}),
    colors: validatedColors,
    crestHistory: Object.freeze(crestHistory),
    founders: Object.freeze(founders),
    parcels: Object.freeze(parcels),
    facilities: Object.freeze(facilities),
    reputation,
    ...(contracts.length > 0 ? { contracts: Object.freeze(contracts) } : {}),
    ...(facilityDetails && facilityDetails.length > 0 ? { facilityDetails: Object.freeze(facilityDetails) } : {}),
    ...(finances ? { finances } : {}),
    ...(membership ? { membership } : {}),
    ...(board ? { board } : {}),
    ...(socialIdentity ? { socialIdentity } : {}),
    ...(politics ? { politics } : {}),
    ...(input.electionHistory ? { electionHistory: Object.freeze([...input.electionHistory]) } : {}),
    ...(squad ? { squad } : {}),
    ...(athleticsPolicy ? { athleticsPolicy } : {}),
    ...(matchHistory && matchHistory.length > 0 ? { matchHistory: Object.freeze([...matchHistory]) } : {}),
    ...(input.trophies && input.trophies.length > 0 ? { trophies: Object.freeze([...input.trophies]) } : {}),
    ...(input.clubLegends && input.clubLegends.length > 0 ? { clubLegends: Object.freeze([...input.clubLegends]) } : {}),
    ...(input.institutionalHonors && input.institutionalHonors.length > 0 ? { institutionalHonors: Object.freeze([...input.institutionalHonors]) } : {}),
    ...(input.historicalLedger ? { historicalLedger: input.historicalLedger } : {}),
  });
}

/** Validates arbitrary JSON/storage data into a verified ClubState or null. */
export function validateClubState(value: unknown): ClubState | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<ClubState>;

  if (typeof raw.id !== 'string' || raw.id.trim().length === 0) return null;
  if (typeof raw.name !== 'string' || raw.name.trim().length === 0) return null;
  if (typeof raw.shortName !== 'string' || raw.shortName.trim().length === 0) return null;
  if (!validateDate(raw.foundingDate)) return null;
  if (typeof raw.foundingOrigin !== 'string' || !FOUNDING_ORIGINS.includes(raw.foundingOrigin as FoundingOrigin)) return null;

  const colors = validateColors(raw.colors);
  if (!colors) return null;

  if (!Array.isArray(raw.crestHistory) || raw.crestHistory.length === 0) return null;
  const crestHistory: CrestVersion[] = [];
  for (const item of raw.crestHistory) {
    const validated = validateCrestVersion(item);
    if (!validated) return null;
    crestHistory.push(validated);
  }

  if (typeof raw.reputation !== 'number' || !Number.isFinite(raw.reputation) || raw.reputation < 0 || raw.reputation > 100) {
    return null;
  }

  if (!Array.isArray(raw.founders) || !raw.founders.every((id) => typeof id === 'string' && id.trim().length > 0)) {
    return null;
  }

  if (!Array.isArray(raw.parcels) || !raw.parcels.every((id) => typeof id === 'string' && id.trim().length > 0)) {
    return null;
  }

  if (!Array.isArray(raw.facilities) || !raw.facilities.every((id) => typeof id === 'string' && id.trim().length > 0)) {
    return null;
  }

  if (raw.foundingStory !== undefined && typeof raw.foundingStory !== 'string') return null;

  let validatedContracts: LandOccupancyContract[] | undefined;
  if (Array.isArray(raw.contracts)) {
    validatedContracts = [];
    for (const c of raw.contracts) {
      const val = validateLandContract(c);
      if (!val) return null;
      validatedContracts.push(val);
    }
  }

  let validatedFacilities: ClubFacility[] | undefined;
  if (Array.isArray(raw.facilityDetails)) {
    validatedFacilities = [];
    for (const f of raw.facilityDetails) {
      if (!validateClubFacility(f)) return null;
      validatedFacilities.push(f);
    }
  }

  let validatedFinances: ClubFinancialLedger | undefined;
  if (raw.finances !== undefined) {
    if (!validateClubFinancialLedger(raw.finances)) return null;
    validatedFinances = raw.finances;
  }

  let validatedMembership: ClubMembershipState | undefined;
  if (raw.membership !== undefined) {
    if (!validateClubMembershipState(raw.membership)) return null;
    validatedMembership = raw.membership;
  }

  let validatedBoard: ClubBoardState | undefined;
  if (raw.board !== undefined) {
    if (!validateClubBoardState(raw.board)) return null;
    validatedBoard = raw.board;
  }

  let validatedSocialIdentity: SocialIdentityState | undefined;
  if (raw.socialIdentity !== undefined) {
    if (!validateSocialIdentityState(raw.socialIdentity)) return null;
    validatedSocialIdentity = raw.socialIdentity;
  }

  let validatedPolitics: ClubPoliticsState | undefined;
  if (raw.politics !== undefined) {
    const valPol = validateClubPoliticsState(raw.politics);
    if (!valPol) return null;
    validatedPolitics = valPol;
  }

  let validatedElections: ClubElectionEvent[] | undefined;
  if (Array.isArray(raw.electionHistory)) {
    validatedElections = [];
    for (const ev of raw.electionHistory) {
      const vEv = validateClubElectionEvent(ev);
      if (vEv) validatedElections.push(vEv);
    }
  }

  let validatedSquad: FootballSquadState | undefined;
  if (raw.squad !== undefined) {
    if (!validateFootballSquadState(raw.squad)) return null;
    validatedSquad = raw.squad;
  }

  let validatedAthleticsPolicy: ClubAthleticsPolicyState | undefined;
  if (raw.athleticsPolicy !== undefined) {
    if (!validateClubAthleticsPolicyState(raw.athleticsPolicy)) return null;
    validatedAthleticsPolicy = raw.athleticsPolicy;
  }

  let validatedMatchHistory: readonly MatchRecord[] | undefined;
  if (raw.matchHistory !== undefined) {
    if (!Array.isArray(raw.matchHistory)) return null;
    validatedMatchHistory = raw.matchHistory;
  }

  return Object.freeze({
    id: raw.id.trim(),
    name: raw.name.trim(),
    shortName: raw.shortName.trim(),
    foundingDate: Object.freeze({ ...raw.foundingDate }),
    foundingOrigin: raw.foundingOrigin as FoundingOrigin,
    ...(raw.foundingStory ? { foundingStory: raw.foundingStory.trim() } : {}),
    colors,
    crestHistory: Object.freeze(crestHistory),
    founders: Object.freeze([...raw.founders]),
    parcels: Object.freeze([...raw.parcels]),
    facilities: Object.freeze([...raw.facilities]),
    reputation: raw.reputation,
    ...(validatedContracts && validatedContracts.length > 0 ? { contracts: Object.freeze(validatedContracts) } : {}),
    ...(validatedFacilities && validatedFacilities.length > 0 ? { facilityDetails: Object.freeze(validatedFacilities) } : {}),
    ...(validatedFinances ? { finances: validatedFinances } : {}),
    ...(validatedMembership ? { membership: validatedMembership } : {}),
    ...(validatedBoard ? { board: validatedBoard } : {}),
    ...(validatedSocialIdentity ? { socialIdentity: validatedSocialIdentity } : {}),
    ...(validatedPolitics ? { politics: validatedPolitics } : {}),
    ...(validatedElections && validatedElections.length > 0 ? { electionHistory: Object.freeze(validatedElections) } : {}),
    ...(validatedSquad ? { squad: validatedSquad } : {}),
    ...(validatedAthleticsPolicy ? { athleticsPolicy: validatedAthleticsPolicy } : {}),
    ...(validatedMatchHistory && validatedMatchHistory.length > 0 ? { matchHistory: Object.freeze([...validatedMatchHistory]) } : {}),
    ...(Array.isArray(raw.trophies) && raw.trophies.length > 0 ? { trophies: Object.freeze([...raw.trophies]) } : {}),
    ...(Array.isArray(raw.clubLegends) && raw.clubLegends.length > 0 ? { clubLegends: Object.freeze(raw.clubLegends.filter(validateClubLegend)) } : {}),
    ...(Array.isArray(raw.institutionalHonors) && raw.institutionalHonors.length > 0 ? { institutionalHonors: Object.freeze(raw.institutionalHonors.filter(validateHonorProposal)) } : {}),
    ...(raw.historicalLedger && typeof raw.historicalLedger === 'object' && Array.isArray((raw.historicalLedger as HistoricalLedgerState).events)
      ? {
          historicalLedger: {
            events: Object.freeze(
              (raw.historicalLedger as HistoricalLedgerState).events.filter(validateHistoricalEvent)
            ),
          },
        }
      : {}),
  });
}

/**
 * Awards a new trophy to the club and permanently exposes it in the club trophy room.
 */
export function addTrophyToClub(club: ClubState, trophy: ClubTrophy): ClubState {
  const current = club.trophies ?? [];
  if (current.some((t) => t.id === trophy.id)) return club;
  return createClub({
    ...club,
    reputation: Math.min(100, club.reputation + 10),
    trophies: [...current, trophy],
  });
}
