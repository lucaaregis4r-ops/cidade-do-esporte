/**
 * Club Members and Membership domain model for 1910-era sports clubs (C7, C8).
 * Governs membership categories, dues, admission fees, social book (livro de sócios),
 * determinism via CampaignRng stream 'club', and monthly dues collection.
 */

import type { GameDate } from '../HistoricalClock';
import type { FoundingOrigin } from './Club';
import type { FoundingGroup, SocialClass } from './FoundingGroup';
import { CampaignRng } from '../CampaignRng';

export const MEMBER_CATEGORIES = [
  'fundador',      // Sócios Fundadores (assinaram a ata, isentos de jóia, mensalidade voluntária/plena, voto garantido)
  'contribuinte',  // Sócios Contribuintes (pagam jóia de admissão e mensalidade regular, núcleo pagante)
  'atleta',        // Sócios Atletas (jogadores do quadro de futebol, isentos ou cota reduzida, sem direitos políticos plenos)
  'benemerito',    // Sócios Beneméritos / Honorários (ilustres, doações substanciais, alto prestígio social)
] as const;

export type MemberCategory = (typeof MEMBER_CATEGORIES)[number];

export const MEMBER_CATEGORY_LABELS: Readonly<Record<MemberCategory, string>> = Object.freeze({
  fundador: 'Sócio Fundador',
  contribuinte: 'Sócio Contribuinte',
  atleta: 'Sócio Atleta',
  benemerito: 'Sócio Benemérito',
});

export interface ClubMember {
  readonly id: string;
  readonly name: string;
  readonly category: MemberCategory;
  readonly socialClass: SocialClass;
  readonly occupation: string;
  readonly joinedDate: Readonly<GameDate>;
  readonly monthlyDuesPPU: number;
  readonly duesPaidUpTo?: Readonly<GameDate>;
  readonly totalPaidPPU: number;
  readonly isDelinquent: boolean;
}

export interface MembershipSettings {
  readonly monthlyDuesPPU: Record<MemberCategory, number>;
  readonly admissionFeePPU: number;
}

export interface ClubMembershipState {
  readonly members: readonly ClubMember[];
  readonly settings: Readonly<MembershipSettings>;
  readonly monthlyCollectionPPU: number;
  readonly activeCount: number;
  readonly delinquentCount: number;
}

/**
 * Historical dues structure calibrated in PPU by club origin (1910 context).
 * Working class / railway clubs have low dues to ensure accessibility.
 * Merchants and Elite clubs have substantially higher dues and admission fees.
 */
export function getDefaultMembershipSettings(origin: FoundingOrigin): MembershipSettings {
  switch (origin) {
    case 'railway':
    case 'workers':
      return {
        monthlyDuesPPU: {
          fundador: 0.2,
          contribuinte: 0.2,
          atleta: 0.1,
          benemerito: 0.5,
        },
        admissionFeePPU: 0.5,
      };
    case 'students':
      return {
        monthlyDuesPPU: {
          fundador: 0.3,
          contribuinte: 0.3,
          atleta: 0.1,
          benemerito: 1.0,
        },
        admissionFeePPU: 1.0,
      };
    case 'immigrants':
      return {
        monthlyDuesPPU: {
          fundador: 0.4,
          contribuinte: 0.4,
          atleta: 0.2,
          benemerito: 1.5,
        },
        admissionFeePPU: 1.5,
      };
    case 'merchants':
      return {
        monthlyDuesPPU: {
          fundador: 0.8,
          contribuinte: 0.8,
          atleta: 0.3,
          benemerito: 3.0,
        },
        admissionFeePPU: 3.0,
      };
    case 'elite':
      return {
        monthlyDuesPPU: {
          fundador: 2.0,
          contribuinte: 2.0,
          atleta: 0.5,
          benemerito: 8.0,
        },
        admissionFeePPU: 10.0,
      };
    default:
      return {
        monthlyDuesPPU: {
          fundador: 0.3,
          contribuinte: 0.3,
          atleta: 0.1,
          benemerito: 1.0,
        },
        admissionFeePPU: 1.0,
      };
  }
}

/**
 * First and last name pools for generating historical 1910 club associates.
 */
const ASSOCIATE_FIRST_NAMES = [
  'Antônio', 'Benedito', 'Carlos', 'Domingos', 'Francisco', 'Geraldo', 'Henrique', 'Joaquim',
  'José', 'Luiz', 'Manoel', 'Nelson', 'Otávio', 'Paulo', 'Sebastião', 'Vicente', 'Waldemar',
];

const ASSOCIATE_LAST_NAMES = [
  'Alves', 'Barroso', 'Cardoso', 'Dias', 'Ferreira', 'Gomes', 'Lima', 'Machado',
  'Nunes', 'Oliveira', 'Pereira', 'Ramos', 'Santana', 'Teixeira', 'Vieira',
];

/**
 * Generates initial membership ledger from a FoundingGroup and adds initial cohort of associates.
 */
export function generateInitialMembership(
  foundingGroup: FoundingGroup,
  foundingDate: GameDate,
  campaignSeed: string,
  extraMemberCount = 15,
): ClubMembershipState {
  const origin = foundingGroup.origin;
  const settings = getDefaultMembershipSettings(origin);
  const rng = new CampaignRng(`${campaignSeed}:membership:${foundingDate.year}`);

  const members: ClubMember[] = [];

  // 1. Founders become founding members (Sócio Fundador)
  for (let i = 0; i < foundingGroup.members.length; i++) {
    const fm = foundingGroup.members[i];
    members.push({
      id: `mem-${fm.id}`,
      name: fm.name,
      category: 'fundador',
      socialClass: fm.socialClass,
      occupation: fm.occupation,
      joinedDate: { ...foundingDate },
      monthlyDuesPPU: settings.monthlyDuesPPU.fundador,
      duesPaidUpTo: { ...foundingDate },
      totalPaidPPU: fm.capitalContributionPPU,
      isDelinquent: false,
    });
  }

  // 2. Generate initial regular associates (Sócios Contribuintes e Atletas)
  for (let i = 0; i < extraMemberCount; i++) {
    const firstName = ASSOCIATE_FIRST_NAMES[Math.floor(rng.club.next() * ASSOCIATE_FIRST_NAMES.length)];
    const lastName = ASSOCIATE_LAST_NAMES[Math.floor(rng.club.next() * ASSOCIATE_LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const isAthlete = i < 4; // First 4 are squad athletes
    const category: MemberCategory = isAthlete ? 'atleta' : 'contribuinte';
    const dues = settings.monthlyDuesPPU[category];

    members.push({
      id: `mem-contrib-${foundingDate.year}-${i + 1}`,
      name,
      category,
      socialClass: isAthlete ? 'working_class' : (foundingGroup.members[0].socialClass || 'middle_class'),
      occupation: isAthlete ? 'Futebolista / Tipógrafo' : 'Comerciário e esportista',
      joinedDate: { ...foundingDate },
      monthlyDuesPPU: dues,
      duesPaidUpTo: { ...foundingDate },
      totalPaidPPU: Math.round((dues + settings.admissionFeePPU) * 10) / 10,
      isDelinquent: false,
    });
  }

  // Calculate monthly total expected collection
  const monthlyCollectionPPU = Math.round(
    members.reduce((sum, m) => sum + m.monthlyDuesPPU, 0) * 10,
  ) / 10;

  return {
    members: Object.freeze(members),
    settings: Object.freeze(settings),
    monthlyCollectionPPU,
    activeCount: members.length,
    delinquentCount: 0,
  };
}

export interface CollectionResult {
  readonly updatedMembership: ClubMembershipState;
  readonly totalCollectedPPU: number;
  readonly payingCount: number;
  readonly delinquentCount: number;
}

/**
 * Monthly membership dues collection processed at the beginning of each month.
 * Deterministic delinquency rate based on CampaignRng club stream (historical delinquency 5% - 15%).
 */
export function collectMonthlyDues(
  state: ClubMembershipState,
  currentDate: GameDate,
  campaignRng: CampaignRng,
): CollectionResult {
  const updatedMembers: ClubMember[] = [];
  let totalCollected = 0;
  let payingCount = 0;
  let delinquentCount = 0;

  for (const m of state.members) {
    // Delinquency check: ~10% probability of missing payment in a given month
    // Athletes and benefactors are usually regular; working-class may face occasional arrears
    const roll = Math.floor(campaignRng.club.next() * 100);
    const isDelinquentThisMonth = roll < 10;

    if (isDelinquentThisMonth) {
      delinquentCount++;
      updatedMembers.push({
        ...m,
        isDelinquent: true,
      });
    } else {
      payingCount++;
      totalCollected += m.monthlyDuesPPU;
      updatedMembers.push({
        ...m,
        duesPaidUpTo: { ...currentDate },
        totalPaidPPU: Math.round((m.totalPaidPPU + m.monthlyDuesPPU) * 10) / 10,
        isDelinquent: false,
      });
    }
  }

  const roundedTotalCollected = Math.round(totalCollected * 10) / 10;

  const nextState: ClubMembershipState = {
    members: Object.freeze(updatedMembers),
    settings: state.settings,
    monthlyCollectionPPU: state.monthlyCollectionPPU,
    activeCount: updatedMembers.length - delinquentCount,
    delinquentCount,
  };

  return {
    updatedMembership: nextState,
    totalCollectedPPU: roundedTotalCollected,
    payingCount,
    delinquentCount,
  };
}

/**
 * Admits a new member to the club, charging admission fee (jóia) and setting up dues.
 */
export function admitMember(
  state: ClubMembershipState,
  name: string,
  category: MemberCategory,
  socialClass: SocialClass,
  occupation: string,
  joinDate: GameDate,
): { updatedMembership: ClubMembershipState; newMember: ClubMember; admissionFeePPU: number } {
  const settings = state.settings;
  const dues = settings.monthlyDuesPPU[category];
  const fee = category === 'fundador' ? 0 : settings.admissionFeePPU;
  const id = `mem-${joinDate.year}${String(joinDate.month).padStart(2, '0')}-${state.members.length + 1}`;

  const newMember: ClubMember = {
    id,
    name: name.trim(),
    category,
    socialClass,
    occupation: occupation.trim(),
    joinedDate: { ...joinDate },
    monthlyDuesPPU: dues,
    duesPaidUpTo: { ...joinDate },
    totalPaidPPU: fee,
    isDelinquent: false,
  };

  const updatedMembers = [...state.members, newMember];
  const nextCollection = Math.round((state.monthlyCollectionPPU + dues) * 10) / 10;

  return {
    updatedMembership: {
      members: Object.freeze(updatedMembers),
      settings,
      monthlyCollectionPPU: nextCollection,
      activeCount: state.activeCount + 1,
      delinquentCount: state.delinquentCount,
    },
    newMember,
    admissionFeePPU: fee,
  };
}

/**
 * Defensive validator for ClubMember.
 */
export function validateClubMember(member: unknown): member is ClubMember {
  if (!member || typeof member !== 'object') return false;
  const m = member as Partial<ClubMember>;
  if (typeof m.id !== 'string' || m.id.trim().length === 0) return false;
  if (typeof m.name !== 'string' || m.name.trim().length === 0) return false;
  if (!m.category || !MEMBER_CATEGORIES.includes(m.category)) return false;
  if (typeof m.monthlyDuesPPU !== 'number' || m.monthlyDuesPPU < 0) return false;
  if (!m.joinedDate || typeof m.joinedDate.year !== 'number') return false;
  return true;
}

/**
 * Defensive validator for ClubMembershipState.
 */
export function validateClubMembershipState(state: unknown): state is ClubMembershipState {
  if (!state || typeof state !== 'object') return false;
  const s = state as Partial<ClubMembershipState>;
  if (!Array.isArray(s.members)) return false;
  if (typeof s.monthlyCollectionPPU !== 'number' || s.monthlyCollectionPPU < 0) return false;
  if (typeof s.activeCount !== 'number' || s.activeCount < 0) return false;
  if (typeof s.delinquentCount !== 'number' || s.delinquentCount < 0) return false;
  if (!s.settings || typeof s.settings !== 'object') return false;
  return s.members.every(validateClubMember);
}
