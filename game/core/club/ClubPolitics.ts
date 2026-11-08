/**
 * Club Politics & Emerging Factions (Alpha D: D6).
 * Governs internal political factions, statute rules, political influence,
 * tensions, and board elections.
 *
 * CANONICAL RULE: Factions are emergent and NEVER static or all active at once.
 * They emerge from the club's real material and institutional interests:
 * - Fundadores: Protect historical heritage and founding identity.
 * - Futebolistas: Prioritize sports performance, pitch quality, and matches.
 * - Patrimonialistas: Focus on physical infrastructure, clubhouse, and land ownership.
 * - Fiscalistas: Demand budgetary discipline, cash surplus, and low debt.
 * - Populares: Defend low membership dues and working-class inclusion.
 * - Elitistas: Favor exclusivity, prestigious facilities, and elite social status.
 * - Modernizadores: Push for structural reforms, expansion, and innovation.
 * - Tradicionalistas: Resist changes to statutes, uniforms, colors, and customs.
 */

import type { FoundingOrigin } from './Club';
import type { SocialClass } from './FoundingGroup';

export type PoliticalFactionType =
  | 'fundadores'
  | 'futebolistas'
  | 'patrimonialistas'
  | 'fiscalistas'
  | 'populares'
  | 'elitistas'
  | 'modernizadores'
  | 'tradicionalistas';

export const ALL_FACTION_TYPES: readonly PoliticalFactionType[] = Object.freeze([
  'fundadores',
  'futebolistas',
  'patrimonialistas',
  'fiscalistas',
  'populares',
  'elitistas',
  'modernizadores',
  'tradicionalistas',
]);

export interface PoliticalFaction {
  readonly type: PoliticalFactionType;
  readonly name: string;
  readonly description: string;
  readonly leaderPersonId?: string;
  readonly leaderName: string;
  readonly influenceBps: number; // 0–10000 basis points (sum = 10000 across active factions)
  readonly loyalty: number;      // 0–100 satisfaction with current board
  readonly coreDemands: readonly string[];
  readonly dominantClass: SocialClass;
}

export interface ClubPoliticsState {
  readonly factions: readonly PoliticalFaction[];
  readonly internalTension: number; // 0–100 (high tension triggers electoral challenges or dissent)
  readonly activeBlocCount: number;
  readonly lastElectionYear: number;
  readonly nextElectionYear: number;
  readonly politicalStabilityScore: number; // 0–100
}

export interface GenerateFactionsInput {
  readonly foundingOrigin: FoundingOrigin;
  readonly foundingYear: number;
  readonly currentYear: number;
  readonly leaderId: string;
  readonly leaderName: string;
  readonly balancePPU: number;
  readonly hasLuxuryFacility?: boolean;
  readonly monthlyFeePPU?: number;
  readonly memberCount?: number;
}

const FACTION_DETAILS: Readonly<Record<PoliticalFactionType, { name: string; desc: string; demand: string; dominantClass: SocialClass }>> = Object.freeze({
  fundadores: {
    name: 'Guarda Fundadora',
    desc: 'Zeladores da ata inaugural e das tradições originais do clube.',
    demand: 'Preservar a ata de fundação e os símbolos históricos.',
    dominantClass: 'middle_class',
  },
  futebolistas: {
    name: 'Ala dos Boleiros',
    desc: 'Atletas e aficionados focados na competitividade em campo.',
    demand: 'Investimentos em gramado, bolas de couro e uniformes.',
    dominantClass: 'working_class',
  },
  patrimonialistas: {
    name: 'Liga Patrimonialista',
    desc: 'Defensores de instalações sólidas, sede social e títulos de posse da terra.',
    demand: 'Construir arquibancadas de madeira e sede digna.',
    dominantClass: 'upper_class',
  },
  fiscalistas: {
    name: 'Comissão Fiscal Austera',
    desc: 'Focados em responsabilidade orçamentária e solvência financeira.',
    demand: 'Manter caixa com superávit e coibir gastos excessivos.',
    dominantClass: 'middle_class',
  },
  populares: {
    name: 'Frente Popular',
    desc: 'Membros operários e defensores de mensalidades acessíveis ao povo.',
    demand: 'Mensalidades módicas e livre acesso aos trabalhadores.',
    dominantClass: 'working_class',
  },
  elitistas: {
    name: 'Círculo Distinto',
    desc: 'Sócios de alta renda que exigem exclusividade e refinamento social.',
    demand: 'Filtrar associados e construir instalações aristocráticas.',
    dominantClass: 'elite',
  },
  modernizadores: {
    name: 'Renovação Institucional',
    desc: 'Jovens entusiastas que desejam modernizar os estatutos e expandir o clube.',
    demand: 'Atualizar estatuto, ampliar quadro social e atrair imprensa.',
    dominantClass: 'middle_class',
  },
  tradicionalistas: {
    name: 'Tradição & Moral',
    desc: 'Conservadores que rejeitam desvios dos hábitos do início do século.',
    demand: 'Proibir inovações levianas e manter as regras solenes.',
    dominantClass: 'upper_class',
  },
});

/**
 * Deterministically generates active political factions for a club based on real material conditions.
 * Only 3 to 4 factions emerge at a time, reflecting actual club tensions.
 */
export function generateEmergentFactions(input: GenerateFactionsInput): ClubPoliticsState {
  const chosenTypes: PoliticalFactionType[] = [];

  // 1. In early years (1910–1915), Fundadores are always active
  if (input.currentYear - input.foundingYear <= 5) {
    chosenTypes.push('fundadores');
  } else {
    chosenTypes.push('tradicionalistas');
  }

  // 2. Class/Origin alignment
  if (input.foundingOrigin === 'workers' || input.foundingOrigin === 'railway') {
    chosenTypes.push('populares');
    chosenTypes.push('futebolistas');
  } else if (input.foundingOrigin === 'elite') {
    chosenTypes.push('elitistas');
    chosenTypes.push('patrimonialistas');
  } else {
    // students / merchants
    chosenTypes.push('modernizadores');
    chosenTypes.push('futebolistas');
  }

  // 3. Financial context
  if (input.balancePPU < 30) {
    if (!chosenTypes.includes('fiscalistas')) {
      chosenTypes.push('fiscalistas');
    }
  } else if (input.hasLuxuryFacility && !chosenTypes.includes('patrimonialistas')) {
    chosenTypes.push('patrimonialistas');
  } else if (!chosenTypes.includes('fiscalistas')) {
    chosenTypes.push('fiscalistas');
  }

  // Limit to 3 or 4 factions
  const activeTypes = chosenTypes.slice(0, 4);

  // Allocate influence basis points (sum = 10000)
  const baseWeightPerFaction = Math.floor(10000 / activeTypes.length);
  const remainder = 10000 - baseWeightPerFaction * activeTypes.length;

  const factions: PoliticalFaction[] = activeTypes.map((type, index) => {
    const meta = FACTION_DETAILS[type];
    const weight = baseWeightPerFaction + (index === 0 ? remainder : 0);

    // Initial loyalty is healthy for founders, cautious for fiscalists/opponents
    let loyalty = 75;
    if (type === 'fiscalistas' && input.balancePPU < 20) loyalty = 45;
    if (type === 'populares' && (input.monthlyFeePPU ?? 2.0) > 3.0) loyalty = 50;

    return Object.freeze({
      type,
      name: meta.name,
      description: meta.desc,
      leaderName: index === 0 ? input.leaderName : `Conselheiro da ${meta.name}`,
      ...(index === 0 ? { leaderPersonId: input.leaderId } : {}),
      influenceBps: weight,
      loyalty,
      coreDemands: Object.freeze([meta.demand]),
      dominantClass: meta.dominantClass,
    });
  });

  const avgLoyalty = Math.round(factions.reduce((acc, f) => acc + f.loyalty, 0) / factions.length);
  const internalTension = Math.max(0, Math.min(100, 100 - avgLoyalty));
  const stability = Math.max(0, Math.min(100, avgLoyalty - Math.round(internalTension * 0.2)));

  return Object.freeze({
    factions: Object.freeze(factions),
    internalTension,
    activeBlocCount: factions.length,
    lastElectionYear: input.foundingYear,
    nextElectionYear: input.foundingYear + 1, // Statutory 1-year mandate in 1910
    politicalStabilityScore: stability,
  });
}

/**
 * Validates deserialized ClubPoliticsState.
 */
export function validateClubPoliticsState(value: unknown): ClubPoliticsState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Partial<ClubPoliticsState>;

  if (!Number.isFinite(v.internalTension) || v.internalTension! < 0 || v.internalTension! > 100) return null;
  if (!Number.isFinite(v.politicalStabilityScore) || v.politicalStabilityScore! < 0 || v.politicalStabilityScore! > 100) return null;
  if (!Number.isInteger(v.lastElectionYear) || v.lastElectionYear! < 1910 || v.lastElectionYear! > 1959) return null;
  if (!Number.isInteger(v.nextElectionYear) || v.nextElectionYear! < 1910 || v.nextElectionYear! > 1965) return null;
  if (!Array.isArray(v.factions) || v.factions.length === 0) return null;

  let totalBps = 0;
  const validatedFactions: PoliticalFaction[] = [];

  for (const f of v.factions) {
    if (!f || typeof f !== 'object') return null;
    const faction = f as Partial<PoliticalFaction>;
    if (typeof faction.name !== 'string' || faction.name.length === 0) return null;
    if (typeof faction.leaderName !== 'string' || faction.leaderName.length === 0) return null;
    if (!Number.isFinite(faction.influenceBps) || faction.influenceBps! < 0) return null;
    if (!Number.isFinite(faction.loyalty) || faction.loyalty! < 0 || faction.loyalty! > 100) return null;
    if (!ALL_FACTION_TYPES.includes(faction.type as PoliticalFactionType)) return null;

    totalBps += faction.influenceBps!;
    validatedFactions.push(Object.freeze({
      type: faction.type as PoliticalFactionType,
      name: faction.name.trim(),
      description: faction.description?.trim() ?? '',
      ...(faction.leaderPersonId ? { leaderPersonId: faction.leaderPersonId } : {}),
      leaderName: faction.leaderName.trim(),
      influenceBps: faction.influenceBps!,
      loyalty: faction.loyalty!,
      coreDemands: Array.isArray(faction.coreDemands) ? Object.freeze([...faction.coreDemands]) : Object.freeze([]),
      dominantClass: faction.dominantClass ?? 'middle_class',
    }));
  }

  // Defensively allow 9990–10010 due to rounding
  if (totalBps < 9900 || totalBps > 10100) return null;

  return Object.freeze({
    factions: Object.freeze(validatedFactions),
    internalTension: Math.round(v.internalTension!),
    activeBlocCount: validatedFactions.length,
    lastElectionYear: v.lastElectionYear!,
    nextElectionYear: v.nextElectionYear!,
    politicalStabilityScore: Math.round(v.politicalStabilityScore!),
  });
}
