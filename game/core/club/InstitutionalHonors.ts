/**
 * InstitutionalHonors domain model (Alpha G: G7 / Macroetapa 31).
 * Governs official club tributes, statues, busts, sector naming,
 * and political deliberation by the club's Deliberative Council.
 *
 * CANONICAL RULES:
 * - Deterministic: purely causal, zero unseeded randomness or uncontrolled PRNG.
 * - Political friction: honors must be debated and voted on by the Council factions.
 * - Non-arbitrary: requires sufficient legacy tier (MEMORAVEL, IDOLO, LENDA, FIGURA_FUNDADORA)
 *   and available treasury PPU.
 */

import type { GameDate } from '../HistoricalClock';
import type { ClubLegend, LegendCategory } from './LegacyScore';
import type { ClubPoliticsState } from './ClubPolitics';

export type HonorType =
  | 'estatua'
  | 'busto'
  | 'nome_setor'
  | 'titulo_benemerito'
  | 'camisa_aposentada';

export interface HonorTypeDefinition {
  readonly type: HonorType;
  readonly namePt: string;
  readonly descriptionPt: string;
  readonly costPpu: number;
  readonly minimumCategory: LegendCategory;
  readonly moralBonus: number;
}

export const CANONICAL_HONOR_TYPES: readonly HonorTypeDefinition[] = Object.freeze([
  {
    type: 'estatua',
    namePt: 'Estátua de Bronze na Alameda do Clube',
    descriptionPt: 'Monumento perpétuo em bronze fundido imortalizando a figura perante a assistência e sócios.',
    costPpu: 120,
    minimumCategory: 'LENDA',
    moralBonus: 25,
  },
  {
    type: 'busto',
    namePt: 'Busto Esculpido no Salão Nobre',
    descriptionPt: 'Escultura fidedigna em mármore ou bronze instalada na galeria nobre da sede social.',
    costPpu: 50,
    minimumCategory: 'IDOLO',
    moralBonus: 15,
  },
  {
    type: 'nome_setor',
    namePt: 'Batismo de Setor ou Pavilhão da Praça de Esportes',
    descriptionPt: 'Denominação solene de uma arquibancada, pavilhão social ou vestiário com o nome do homenageado.',
    costPpu: 30,
    minimumCategory: 'IDOLO',
    moralBonus: 12,
  },
  {
    type: 'titulo_benemerito',
    namePt: 'Diploma de Sócio Benemérito / Grande Benfeitor',
    descriptionPt: 'Concessão do mais alto galardão honorário estatutário com diploma de pergaminho solene.',
    costPpu: 10,
    minimumCategory: 'MEMORAVEL',
    moralBonus: 8,
  },
  {
    type: 'camisa_aposentada',
    namePt: 'Quadro Perpétuo na Sala de Troféus',
    descriptionPt: 'Eterna menção de honra ao mérito desportivo imortalizada na sala de troféus do clube.',
    costPpu: 5,
    minimumCategory: 'IDOLO',
    moralBonus: 6,
  },
]);

export interface InstitutionalHonorProposal {
  readonly id: string;
  readonly legendId: string;
  readonly personId: string;
  readonly legendName: string;
  readonly legendCategory: LegendCategory;
  readonly honorType: HonorType;
  readonly honorNamePt: string;
  readonly costPpu: number;
  readonly proposingFactionId: string;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly dateProposed: Readonly<GameDate>;
  readonly dateResolved?: Readonly<GameDate>;
  readonly votesInFavor?: number;
  readonly votesAgainst?: number;
  readonly abstentions?: number;
  readonly resolutionTextPt?: string;
}

export interface HonorVoteOutcome {
  readonly approved: boolean;
  readonly votesInFavor: number;
  readonly votesAgainst: number;
  readonly abstentions: number;
  readonly resolutionTextPt: string;
  readonly costPpu: number;
  readonly updatedProposal: InstitutionalHonorProposal;
}

/**
 * Checks whether a legend meets the minimum category requirement for an honor.
 */
export function isLegendEligibleForHonor(
  legendCategory: LegendCategory,
  honorType: HonorType
): boolean {
  const def = CANONICAL_HONOR_TYPES.find((h) => h.type === honorType);
  if (!def) return false;

  const categoryRank: Record<LegendCategory, number> = {
    MEMORAVEL: 1,
    IDOLO: 2,
    FIGURA_FUNDADORA: 3,
    LENDA: 4,
  };

  return categoryRank[legendCategory] >= categoryRank[def.minimumCategory];
}

/**
 * Creates an institutional honor proposal for the Council to vote on.
 */
export function createHonorProposal(input: {
  readonly legend: Readonly<ClubLegend>;
  readonly honorType: HonorType;
  readonly date: Readonly<GameDate>;
  readonly proposingFactionId?: string;
  readonly sequenceIndex?: number;
}): InstitutionalHonorProposal {
  const def = CANONICAL_HONOR_TYPES.find((h) => h.type === input.honorType);
  if (!def) {
    throw new Error(`Tipo de homenagem desconhecido: ${input.honorType}`);
  }

  const seq = input.sequenceIndex ?? 1;
  const proposalId = `prop-honor-${input.legend.id}-${input.honorType}-${input.date.year}${String(input.date.month).padStart(2, '0')}-${seq}`;

  return Object.freeze({
    id: proposalId,
    legendId: input.legend.id,
    personId: input.legend.personId,
    legendName: input.legend.name,
    legendCategory: input.legend.category,
    honorType: input.honorType,
    honorNamePt: def.namePt,
    costPpu: def.costPpu,
    proposingFactionId: input.proposingFactionId ?? 'fundadores',
    status: 'pending',
    dateProposed: input.date,
  });
}

/**
 * Deliberates and votes on an honor proposal by the Deliberative Council.
 * Deterministic calculation based on political factions, treasury balance, and legend score.
 */
export function voteOnHonorProposal(input: {
  readonly proposal: Readonly<InstitutionalHonorProposal>;
  readonly politics?: Readonly<ClubPoliticsState>;
  readonly treasuryPpu: number;
  readonly legendScore: number;
  readonly resolutionDate: Readonly<GameDate>;
  readonly rngSample: number; // [0, 1) deterministic sample from CampaignRng
}): HonorVoteOutcome {
  const def = CANONICAL_HONOR_TYPES.find((h) => h.type === input.proposal.honorType)!;
  const councilSize = 12; // 12 canonical council members

  // If treasury cannot afford it, council rejects on fiscal responsibility
  if (input.treasuryPpu < def.costPpu) {
    const votesInFavor = 2;
    const votesAgainst = 9;
    const abstentions = 1;
    const resolutionTextPt = `O Conselho Deliberativo rejeitou a proposição por indisponibilidade orçamentária: o saldo de ${input.treasuryPpu} PPU é insuficiente para arcar com os ${def.costPpu} PPU da obra.`;

    return {
      approved: false,
      votesInFavor,
      votesAgainst,
      abstentions,
      resolutionTextPt,
      costPpu: 0,
      updatedProposal: Object.freeze({
        ...input.proposal,
        status: 'rejected',
        dateResolved: input.resolutionDate,
        votesInFavor,
        votesAgainst,
        abstentions,
        resolutionTextPt,
      }),
    };
  }

  // Faction alignment weights
  let favorWeight = 0.55;
  if (input.proposal.legendCategory === 'LENDA') favorWeight += 0.25;
  if (input.proposal.legendCategory === 'FIGURA_FUNDADORA') favorWeight += 0.20;
  if (input.proposal.legendCategory === 'IDOLO') favorWeight += 0.10;

  // Modulated by legend score
  favorWeight += Math.min(0.15, (input.legendScore - 40) * 0.002);

  // Modulated by RNG variance [-0.10, +0.10]
  const variance = (input.rngSample - 0.5) * 0.20;
  const finalFavorRatio = Math.max(0.15, Math.min(0.95, favorWeight + variance));

  const rawFavor = Math.round(councilSize * finalFavorRatio);
  const abstentions = Math.min(2, Math.floor(councilSize * 0.1));
  const remaining = councilSize - abstentions;
  const votesInFavor = Math.min(remaining, Math.max(1, rawFavor));
  const votesAgainst = Math.max(0, remaining - votesInFavor);

  const approved = votesInFavor > votesAgainst;

  let resolutionTextPt = '';
  if (approved) {
    resolutionTextPt = `Aprovado por maioria com ${votesInFavor} votos favoráveis contra ${votesAgainst} contrários. A Diretoria Executiva fica autorizada a lavrar os atos solenes e executar as obras orçadas em ${def.costPpu} PPU.`;
  } else {
    resolutionTextPt = `Rejeitado em plenário: a bancada opositora reuniu ${votesAgainst} votos contrários contra ${votesInFavor} favoráveis, arquivando a matéria.`;
  }

  return {
    approved,
    votesInFavor,
    votesAgainst,
    abstentions,
    resolutionTextPt,
    costPpu: approved ? def.costPpu : 0,
    updatedProposal: Object.freeze({
      ...input.proposal,
      status: approved ? 'approved' : 'rejected',
      dateResolved: input.resolutionDate,
      votesInFavor,
      votesAgainst,
      abstentions,
      resolutionTextPt,
    }),
  };
}

/**
 * Validates an institutional honor proposal defensivel.
 */
export function validateHonorProposal(obj: unknown): obj is InstitutionalHonorProposal {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Partial<InstitutionalHonorProposal>;
  const validTypes: HonorType[] = ['estatua', 'busto', 'nome_setor', 'titulo_benemerito', 'camisa_aposentada'];
  return (
    typeof p.id === 'string' &&
    typeof p.legendId === 'string' &&
    typeof p.legendName === 'string' &&
    validTypes.includes(p.honorType as HonorType) &&
    typeof p.costPpu === 'number' &&
    (p.status === 'pending' || p.status === 'approved' || p.status === 'rejected') &&
    !!p.dateProposed
  );
}
