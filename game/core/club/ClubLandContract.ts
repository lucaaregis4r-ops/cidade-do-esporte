import { daysInMonth, type GameDate } from '../HistoricalClock';
import type { CityParcel } from '../city/cityParcels';
import type { FoundingOrigin } from './Club';

export type OccupancyType =
  | 'COMPRA'
  | 'ALUGUEL'
  | 'ARRENDAMENTO'
  | 'CESSAO_EMPRESARIAL'
  | 'DOACAO'
  | 'CONCESSAO_PUBLICA'
  | 'USO_COMPARTILHADO';

export const OCCUPANCY_TYPES: readonly OccupancyType[] = Object.freeze([
  'COMPRA',
  'ALUGUEL',
  'ARRENDAMENTO',
  'CESSAO_EMPRESARIAL',
  'DOACAO',
  'CONCESSAO_PUBLICA',
  'USO_COMPARTILHADO',
]);

export interface LandOccupancyContract {
  readonly id: string;
  readonly parcelId: string;
  readonly clubId: string;
  readonly type: OccupancyType;
  readonly startDate: Readonly<GameDate>;
  readonly durationYears?: number; // undefined = perpétuo (compra ou doação)
  readonly upfrontCostPpu: number;
  readonly monthlyCostPpu: number;
  readonly grantorName: string;
  readonly terms: readonly string[];
}

export interface ParcelClubViability {
  readonly parcelId: string;
  readonly viable: boolean;
  readonly suitabilityScore: number; // 0–100
  readonly reasons: readonly string[];
  readonly recommendedOccupancy: readonly OccupancyType[];
  readonly baseLandValuePpu: number;
  readonly estimatedPurchasePricePpu: number;
  readonly estimatedMonthlyRentPpu: number;
}

function assertDate(date: unknown): date is GameDate {
  if (date === null || typeof date !== 'object' || Array.isArray(date)) return false;
  const d = date as Partial<GameDate>;
  if (!Number.isInteger(d.year) || d.year! < 1910 || d.year! > 1959) return false;
  if (!Number.isInteger(d.month) || d.month! < 1 || d.month! > 12) return false;
  if (!Number.isInteger(d.day) || d.day! < 1 || d.day! > daysInMonth(d.year!, d.month!)) return false;
  return true;
}

/**
 * Evaluates whether an inspected city parcel is viable and suitable for a 1910 football club.
 */
export function evaluateParcelForClub(
  parcel: CityParcel,
  hasInstitution: boolean,
  origin: FoundingOrigin,
): ParcelClubViability {
  const reasons: string[] = [];
  const recommended: OccupancyType[] = [];

  if (hasInstitution) {
    return Object.freeze({
      parcelId: parcel.id,
      viable: false,
      suitabilityScore: 0,
      reasons: Object.freeze(['Parcela ocupada por instituição pública municipal ou estadual de 1910.']),
      recommendedOccupancy: Object.freeze([]),
      baseLandValuePpu: 0,
      estimatedPurchasePricePpu: 0,
      estimatedMonthlyRentPpu: 0,
    });
  }

  let score = 50;

  // Area: football grounds in 1910 need at least 2 tiles for pitch and sidelines
  if (parcel.area >= 4) {
    score += 20;
    reasons.push(`Área ampla (${parcel.area} células): comporta campo oficial e instalações.`);
  } else if (parcel.area >= 2) {
    score += 10;
    reasons.push(`Área adequada (${parcel.area} células): suficiente para campo e cerca.`);
  } else {
    score -= 25;
    reasons.push('Área reduzida (1 célula): espaço apertado para praça de esportes completa.');
  }

  // Terrain difficulty: flat ground is much easier to clear and level in 1910
  if (parcel.terrainDifficulty <= 0.2) {
    score += 20;
    reasons.push('Topografia suave: excelente para nivelamento de gramado sem grandes custos.');
  } else if (parcel.terrainDifficulty <= 0.5) {
    score += 5;
    reasons.push('Relevo moderado: exige terraplanagem manual básica.');
  } else {
    score -= 25;
    reasons.push('Relevo acidentado: declive acentuado encarece preparação do campo.');
  }

  // Connectivity and roads
  if (parcel.roadAccess > 0 || parcel.accessibility > 0.4) {
    score += 10;
    reasons.push('Acesso viário consolidado: fácil locomoção de associados e público.');
  } else {
    score -= 10;
    reasons.push('Acesso viário limitado: isolamento inicial.');
  }

  // Origin-specific affinities
  if (origin === 'railway' && parcel.railAccess > 0) {
    score += 25;
    reasons.push('Fronteira com o leito ferroviário: perfeita para identidade e patronato dos ferroviários.');
    recommended.push('CESSAO_EMPRESARIAL', 'ALUGUEL', 'COMPRA');
  } else if (origin === 'elite') {
    if (parcel.centrality > 0.6) {
      score += 20;
      reasons.push('Localização nobre e central: prestigia os sócios da elite local.');
    }
    recommended.push('COMPRA', 'DOACAO', 'ARRENDAMENTO');
  } else if (origin === 'workers') {
    if (parcel.railAccess > 0 || parcel.districtId.includes('industrial') || parcel.districtId.includes('periphery')) {
      score += 15;
      reasons.push('Proximidade das oficinas e vilas operárias: forte mobilização da torcida trabalhadora.');
    }
    recommended.push('CESSAO_EMPRESARIAL', 'ALUGUEL', 'USO_COMPARTILHADO');
  } else if (origin === 'students') {
    recommended.push('USO_COMPARTILHADO', 'ALUGUEL', 'CONCESSAO_PUBLICA');
  } else if (origin === 'merchants') {
    recommended.push('COMPRA', 'ARRENDAMENTO', 'ALUGUEL');
  } else if (origin === 'immigrants') {
    recommended.push('COMPRA', 'ALUGUEL', 'DOACAO');
  }

  if (recommended.length === 0) {
    recommended.push('ALUGUEL', 'COMPRA');
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  const viable = boundedScore >= 25;

  const basePpu = parcel.landValuePpu ?? 10.0;
  const estimatedPurchasePrice = Number((basePpu * parcel.area).toFixed(1));
  const estimatedMonthlyRent = Number((estimatedPurchasePrice * 0.008).toFixed(2));

  return Object.freeze({
    parcelId: parcel.id,
    viable,
    suitabilityScore: boundedScore,
    reasons: Object.freeze(reasons),
    recommendedOccupancy: Object.freeze(Array.from(new Set(recommended))),
    baseLandValuePpu: basePpu,
    estimatedPurchasePricePpu: estimatedPurchasePrice,
    estimatedMonthlyRentPpu: estimatedMonthlyRent,
  });
}

export interface ContractGenerationInput {
  readonly parcel: CityParcel;
  readonly clubId: string;
  readonly origin: FoundingOrigin;
  readonly date: GameDate;
  readonly initialCapitalPpu: number;
}

/**
 * Generates historically grounded contract proposals for occupying the given parcel in 1910.
 */
export function generateContractProposals(
  input: ContractGenerationInput,
): readonly LandOccupancyContract[] {
  if (!assertDate(input.date)) {
    throw new RangeError('Contract start date must be a valid campaign date');
  }

  const { parcel, clubId, origin, date } = input;
  const basePpu = parcel.landValuePpu ?? 10.0;
  const purchasePrice = Number((basePpu * parcel.area).toFixed(1));
  const monthlyRent = Number((purchasePrice * 0.008).toFixed(2));

  const contracts: LandOccupancyContract[] = [];

  // 1. COMPRA (Direct purchase)
  contracts.push(
    Object.freeze({
      id: `contract-${parcel.id}-compra`,
      parcelId: parcel.id,
      clubId,
      type: 'COMPRA',
      startDate: Object.freeze({ ...date }),
      upfrontCostPpu: purchasePrice,
      monthlyCostPpu: 0,
      grantorName: parcel.ownerId ? `Proprietário de ${parcel.id}` : 'Particular / Proprietário Fundiário',
      terms: Object.freeze([
        'Aquisição perpétua da titularidade do imóvel.',
        'Total autonomia para obras, arquibancadas e reformas.',
        'Sem encargos mensais de locação.',
      ]),
    }),
  );

  // 2. ALUGUEL (Monthly lease)
  contracts.push(
    Object.freeze({
      id: `contract-${parcel.id}-aluguel`,
      parcelId: parcel.id,
      clubId,
      type: 'ALUGUEL',
      startDate: Object.freeze({ ...date }),
      durationYears: 5,
      upfrontCostPpu: Number((monthlyRent * 3).toFixed(2)), // 3 months security deposit
      monthlyCostPpu: monthlyRent,
      grantorName: 'Locador Imobiliário Local',
      terms: Object.freeze([
        'Contrato inicial de 5 anos renovável.',
        'Caução inaugural de três mensalidades.',
        'Benfeitorias não indenizáveis em caso de rescisão prévia.',
      ]),
    }),
  );

  // 3. ARRENDAMENTO (Long-term lease)
  contracts.push(
    Object.freeze({
      id: `contract-${parcel.id}-arrendamento`,
      parcelId: parcel.id,
      clubId,
      type: 'ARRENDAMENTO',
      startDate: Object.freeze({ ...date }),
      durationYears: 20,
      upfrontCostPpu: Number((monthlyRent * 12).toFixed(2)), // 1 year advance
      monthlyCostPpu: Number((monthlyRent * 0.75).toFixed(2)),
      grantorName: 'Espólio / Sociedade Proprietária',
      terms: Object.freeze([
        'Prazo firme de 20 anos para exploração esportiva e social.',
        'Desconto de 25% na mensalidade em contrapartida ao compromisso de longo prazo.',
        'Direito de retenção de melhorias permanentes.',
      ]),
    }),
  );

  // 4. Origin-specific special arrangements:
  if (origin === 'railway') {
    contracts.push(
      Object.freeze({
        id: `contract-${parcel.id}-cessao-ferrovia`,
        parcelId: parcel.id,
        clubId,
        type: 'CESSAO_EMPRESARIAL',
        startDate: Object.freeze({ ...date }),
        durationYears: 15,
        upfrontCostPpu: 0,
        monthlyCostPpu: 0.1, // Symbolic token rent
        grantorName: 'Companhia Estrada de Ferro Oeste de Minas',
        terms: Object.freeze([
          'Cessão paternalista de terreno da ferrovia para o lazer dos maquinistas e operários.',
          'Taxa simbólica de manutenção de 0.1 PPU ao mês.',
          'Diretoria da empresa mantém assento consultivo no clube.',
        ]),
      }),
    );
  } else if (origin === 'workers') {
    contracts.push(
      Object.freeze({
        id: `contract-${parcel.id}-cessao-fabril`,
        parcelId: parcel.id,
        clubId,
        type: 'CESSAO_EMPRESARIAL',
        startDate: Object.freeze({ ...date }),
        durationYears: 10,
        upfrontCostPpu: 0,
        monthlyCostPpu: Number((monthlyRent * 0.3).toFixed(2)),
        grantorName: 'Companhia Fabril & Manufatora de Minas',
        terms: Object.freeze([
          'Cessão esportiva para recreação operária.',
          'Aluguel subsidiado a 30% do valor de mercado.',
          'Uniforme e campo exibem menção honrosa à indústria fundadora.',
        ]),
      }),
    );
  } else if (origin === 'elite') {
    contracts.push(
      Object.freeze({
        id: `contract-${parcel.id}-doacao-patrono`,
        parcelId: parcel.id,
        clubId,
        type: 'DOACAO',
        startDate: Object.freeze({ ...date }),
        upfrontCostPpu: 0,
        monthlyCostPpu: 0,
        grantorName: 'Família Patriarcal Benfeitora',
        terms: Object.freeze([
          'Doação perpétua com cláusula de inalienabilidade inicial.',
          'Patrono recebe o título de Presidente de Honra Vitalício.',
          'Campo inaugurado levará o patronímico da família benemérita.',
        ]),
      }),
    );
  } else if (origin === 'students') {
    contracts.push(
      Object.freeze({
        id: `contract-${parcel.id}-uso-compartilhado`,
        parcelId: parcel.id,
        clubId,
        type: 'USO_COMPARTILHADO',
        startDate: Object.freeze({ ...date }),
        durationYears: 5,
        upfrontCostPpu: 0,
        monthlyCostPpu: Number((monthlyRent * 0.25).toFixed(2)),
        grantorName: 'Grêmio Escolar / Diretório Acadêmico',
        terms: Object.freeze([
          'Uso partilhado de várzea escolar aos finais de semana e feriados.',
          'Custos de marcação de cal e redes divididos entre os estudantes.',
        ]),
      }),
    );
  }

  return Object.freeze(contracts);
}

/**
 * Validates arbitrary contract payload into a verified LandOccupancyContract.
 */
export function validateLandContract(value: unknown): LandOccupancyContract | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<LandOccupancyContract>;

  if (typeof raw.id !== 'string' || raw.id.trim().length === 0) return null;
  if (typeof raw.parcelId !== 'string' || raw.parcelId.trim().length === 0) return null;
  if (typeof raw.clubId !== 'string' || raw.clubId.trim().length === 0) return null;
  if (typeof raw.type !== 'string' || !OCCUPANCY_TYPES.includes(raw.type as OccupancyType)) return null;
  if (!assertDate(raw.startDate)) return null;
  if (typeof raw.upfrontCostPpu !== 'number' || !Number.isFinite(raw.upfrontCostPpu) || raw.upfrontCostPpu < 0) return null;
  if (typeof raw.monthlyCostPpu !== 'number' || !Number.isFinite(raw.monthlyCostPpu) || raw.monthlyCostPpu < 0) return null;
  if (typeof raw.grantorName !== 'string' || raw.grantorName.trim().length === 0) return null;
  if (!Array.isArray(raw.terms) || !raw.terms.every((t) => typeof t === 'string' && t.trim().length > 0)) return null;

  return Object.freeze({
    id: raw.id.trim(),
    parcelId: raw.parcelId.trim(),
    clubId: raw.clubId.trim(),
    type: raw.type as OccupancyType,
    startDate: Object.freeze({ ...raw.startDate }),
    ...(raw.durationYears !== undefined ? { durationYears: raw.durationYears } : {}),
    upfrontCostPpu: raw.upfrontCostPpu,
    monthlyCostPpu: raw.monthlyCostPpu,
    grantorName: raw.grantorName.trim(),
    terms: Object.freeze([...raw.terms.map((t) => t.trim())]),
  });
}
