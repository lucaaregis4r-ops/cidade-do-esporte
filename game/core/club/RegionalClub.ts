import type { GameDate } from '../HistoricalClock';
import type { ClubColors } from './Club';
import type { CrestShape } from './ClubIdentity';
import type { AIDirectorArchetype } from './AIClubDirector';
import type { LocalClubMilestone } from './ClubBirthEngine';

export const MINAS_REGIONS = [
  'Central',
  'Zona da Mata',
  'Sul',
  'Triângulo',
  'Oeste',
  'Norte',
  'Vale',
] as const;

export type MinasRegion = (typeof MINAS_REGIONS)[number];

export type RegionalOrigin =
  | 'railway'
  | 'factory'
  | 'elite'
  | 'miners'
  | 'merchants'
  | 'community'
  | 'students';

export type RegionalAttitude = 'friendly' | 'neutral' | 'distrustful' | 'fierce_rival';

export interface RegionalStadium {
  readonly name: string;
  readonly capacity: number;
  readonly pitchType: 'grass' | 'dirt' | 'macadam';
}

export interface RegionalClubState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly city: string;
  readonly region: MinasRegion;
  readonly foundationYear: number;
  readonly origin: RegionalOrigin;
  readonly colors: ClubColors;
  readonly crestShape: CrestShape;
  readonly finances: {
    readonly annualBudgetPpu: number;
    readonly cashBalancePpu: number;
    readonly stabilityRating: number; // 0–100
  };
  readonly squadSummary: {
    readonly totalPlayers: number;
    readonly averageRating: number; // 0–100
    readonly starPlayerName: string;
  };
  readonly stadium: RegionalStadium;
  readonly supporterBase: number;
  readonly traditionLevel: number; // 1–100
  readonly directorArchetype: AIDirectorArchetype;
  readonly railwayDistanceHours: number; // Train travel time from capital
  readonly attitudeTowardsCapital: RegionalAttitude;
  readonly historicalMilestones: readonly LocalClubMilestone[];
  readonly matchesPlayedAgainstCapital: number;
}

export interface RegionalFriendlyProposal {
  readonly id: string;
  readonly regionalClubId: string;
  readonly regionalClubName: string;
  readonly hostVenue: 'capital' | 'regional_city';
  readonly matchDate: Readonly<GameDate>;
  readonly railwayCostPpu: number;
  readonly hostGuaranteedSharePpu: number;
  readonly description: string;
}

/**
 * Validates and sanitizes a RegionalClubState object.
 */
export function validateRegionalClubState(value: unknown): RegionalClubState | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>;

  if (typeof c.id !== 'string' || c.id.trim().length === 0) return null;
  if (typeof c.name !== 'string' || c.name.trim().length === 0) return null;
  if (typeof c.shortName !== 'string' || c.shortName.trim().length === 0) return null;
  if (typeof c.city !== 'string' || c.city.trim().length === 0) return null;

  if (typeof c.region !== 'string' || !MINAS_REGIONS.includes(c.region as MinasRegion)) return null;
  if (typeof c.foundationYear !== 'number' || c.foundationYear < 1890 || c.foundationYear > 1960) return null;

  const validOrigins: RegionalOrigin[] = ['railway', 'factory', 'elite', 'miners', 'merchants', 'community', 'students'];
  if (typeof c.origin !== 'string' || !validOrigins.includes(c.origin as RegionalOrigin)) return null;

  if (!c.colors || typeof c.colors !== 'object') return null;
  const colors = c.colors as Record<string, unknown>;
  if (typeof colors.primary !== 'string' || typeof colors.secondary !== 'string') return null;

  const validShapes: CrestShape[] = ['swiss', 'circle', 'stripes', 'sash', 'diamond'];
  if (typeof c.crestShape !== 'string' || !validShapes.includes(c.crestShape as CrestShape)) return null;

  if (!c.finances || typeof c.finances !== 'object') return null;
  const fin = c.finances as Record<string, unknown>;
  if (typeof fin.annualBudgetPpu !== 'number' || typeof fin.cashBalancePpu !== 'number' || typeof fin.stabilityRating !== 'number') return null;

  if (!c.squadSummary || typeof c.squadSummary !== 'object') return null;
  const sq = c.squadSummary as Record<string, unknown>;
  if (typeof sq.totalPlayers !== 'number' || typeof sq.averageRating !== 'number' || typeof sq.starPlayerName !== 'string') return null;

  if (!c.stadium || typeof c.stadium !== 'object') return null;
  const st = c.stadium as Record<string, unknown>;
  if (typeof st.name !== 'string' || typeof st.capacity !== 'number' || !['grass', 'dirt', 'macadam'].includes(st.pitchType as string)) return null;

  if (typeof c.supporterBase !== 'number' || typeof c.traditionLevel !== 'number') return null;
  if (typeof c.railwayDistanceHours !== 'number' || c.railwayDistanceHours < 1) return null;

  const validAttitudes: RegionalAttitude[] = ['friendly', 'neutral', 'distrustful', 'fierce_rival'];
  if (typeof c.attitudeTowardsCapital !== 'string' || !validAttitudes.includes(c.attitudeTowardsCapital as RegionalAttitude)) return null;

  const validArchetypes: AIDirectorArchetype[] = [
    'traditionalist_amateur',
    'mercantile_expansionist',
    'community_neighborhood',
    'aristocratic_exclusive',
    'pragmatic_competitive',
  ];
  if (typeof c.directorArchetype !== 'string' || !validArchetypes.includes(c.directorArchetype as AIDirectorArchetype)) return null;

  const historicalMilestones: LocalClubMilestone[] = [];
  if (Array.isArray(c.historicalMilestones)) {
    for (const m of c.historicalMilestones) {
      if (m && typeof m === 'object' && typeof m.title === 'string' && typeof m.description === 'string' && m.date) {
        historicalMilestones.push(Object.freeze({
          date: Object.freeze({ year: m.date.year, month: m.date.month, day: m.date.day }),
          title: m.title,
          description: m.description,
        }));
      }
    }
  }

  return Object.freeze({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    city: c.city,
    region: c.region as MinasRegion,
    foundationYear: Number(c.foundationYear),
    origin: c.origin as RegionalOrigin,
    colors: Object.freeze({ primary: String(colors.primary), secondary: String(colors.secondary) }),
    crestShape: c.crestShape as CrestShape,
    finances: Object.freeze({
      annualBudgetPpu: Number(fin.annualBudgetPpu),
      cashBalancePpu: Number(fin.cashBalancePpu),
      stabilityRating: Number(fin.stabilityRating),
    }),
    squadSummary: Object.freeze({
      totalPlayers: Number(sq.totalPlayers),
      averageRating: Number(sq.averageRating),
      starPlayerName: String(sq.starPlayerName),
    }),
    stadium: Object.freeze({
      name: String(st.name),
      capacity: Number(st.capacity),
      pitchType: st.pitchType as 'grass' | 'dirt' | 'macadam',
    }),
    supporterBase: Number(c.supporterBase),
    traditionLevel: Number(c.traditionLevel),
    directorArchetype: c.directorArchetype as AIDirectorArchetype,
    railwayDistanceHours: Number(c.railwayDistanceHours),
    attitudeTowardsCapital: c.attitudeTowardsCapital as RegionalAttitude,
    historicalMilestones: Object.freeze(historicalMilestones),
    matchesPlayedAgainstCapital: typeof c.matchesPlayedAgainstCapital === 'number' ? c.matchesPlayedAgainstCapital : 0,
  });
}

/**
 * Calculates train travel expenditure in PPU for a team excursion.
 */
export function calculateRailwayTravelCostPpu(distanceHours: number, partySize: number = 14): number {
  // ~1.2 PPU per person per hour of rail journey on historic Minas railways
  return Math.max(10, Math.round(distanceHours * partySize * 1.2));
}

/**
 * Returns the canonical roster of interior Minas Gerais clubs for 1910–1920.
 * Covers all 7 regions: Central, Zona da Mata, Sul, Triângulo, Oeste, Norte, Vale.
 */
export function generateHistoricalRegionalClubs(): readonly RegionalClubState[] {
  const clubs: RegionalClubState[] = [
    // 1. Central: Sabará Sport Club
    {
      id: 'reg_central_sabara',
      name: 'Sabará Sport Club',
      shortName: 'Sabará SC',
      city: 'Sabará do Ouro',
      region: 'Central',
      foundationYear: 1907,
      origin: 'miners',
      colors: { primary: '#D32F2F', secondary: '#212121' },
      crestShape: 'swiss',
      finances: { annualBudgetPpu: 350, cashBalancePpu: 80, stabilityRating: 75 },
      squadSummary: { totalPlayers: 18, averageRating: 54, starPlayerName: 'Quim Preto' },
      stadium: { name: 'Campo da Fábrica Imperial', capacity: 1200, pitchType: 'dirt' },
      supporterBase: 2500,
      traditionLevel: 70,
      directorArchetype: 'community_neighborhood',
      railwayDistanceHours: 2,
      attitudeTowardsCapital: 'friendly',
      historicalMilestones: [
        {
          date: { year: 1907, month: 5, day: 13 },
          title: 'Fundação da Cidade do Ouro',
          description: 'Pioneiro esportivo fundado por operários da siderurgia e da ferrovia em Sabará.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 2. Central: Villa Operária Foot-Ball Club
    {
      id: 'reg_central_villa_operaria',
      name: 'Villa Operária Foot-Ball Club',
      shortName: 'Villa Operária',
      city: 'Nova Lima das Minas',
      region: 'Central',
      foundationYear: 1908,
      origin: 'miners',
      colors: { primary: '#C2185B', secondary: '#FFFFFF' },
      crestShape: 'stripes',
      finances: { annualBudgetPpu: 480, cashBalancePpu: 120, stabilityRating: 85 },
      squadSummary: { totalPlayers: 19, averageRating: 62, starPlayerName: 'George Campbell' },
      stadium: { name: 'Praça de Esportes do Morro Velho', capacity: 2000, pitchType: 'grass' },
      supporterBase: 4200,
      traditionLevel: 80,
      directorArchetype: 'pragmatic_competitive',
      railwayDistanceHours: 3,
      attitudeTowardsCapital: 'fierce_rival',
      historicalMilestones: [
        {
          date: { year: 1908, month: 6, day: 28 },
          title: 'Nascimento sob Influência Britânica',
          description: 'Fundado com apoio de engenheiros ingleses da mineração e artífices mineiros.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 3. Zona da Mata: Tupynambás Foot-Ball Club
    {
      id: 'reg_mata_tupynambas',
      name: 'Tupynambás Foot-Ball Club',
      shortName: 'Tupynambás',
      city: 'Juiz d’El Rei',
      region: 'Zona da Mata',
      foundationYear: 1911,
      origin: 'students',
      colors: { primary: '#D32F2F', secondary: '#FFFFFF' },
      crestShape: 'diamond',
      finances: { annualBudgetPpu: 550, cashBalancePpu: 150, stabilityRating: 80 },
      squadSummary: { totalPlayers: 20, averageRating: 66, starPlayerName: 'Juvenal de Castro' },
      stadium: { name: 'Estádio do Poço Rico', capacity: 2500, pitchType: 'grass' },
      supporterBase: 6500,
      traditionLevel: 82,
      directorArchetype: 'traditionalist_amateur',
      railwayDistanceHours: 8,
      attitudeTowardsCapital: 'fierce_rival',
      historicalMilestones: [
        {
          date: { year: 1911, month: 8, day: 15 },
          title: 'Orgulho do Futebol da Zona da Mata',
          description: 'Erguido na metrópole cafeeira e têxtil de Juiz d’El Rei com forte tradição aristocrática e estudantil.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 4. Zona da Mata: Sport Club Rio Branco
    {
      id: 'reg_mata_rio_branco',
      name: 'Sport Club Rio Branco',
      shortName: 'Rio Branco',
      city: 'Leopoldina Imperial',
      region: 'Zona da Mata',
      foundationYear: 1909,
      origin: 'elite',
      colors: { primary: '#1976D2', secondary: '#FFFFFF' },
      crestShape: 'swiss',
      finances: { annualBudgetPpu: 320, cashBalancePpu: 70, stabilityRating: 70 },
      squadSummary: { totalPlayers: 16, averageRating: 52, starPlayerName: 'Bento Silveira' },
      stadium: { name: 'Campo dos Cafeicultores', capacity: 1000, pitchType: 'dirt' },
      supporterBase: 2100,
      traditionLevel: 65,
      directorArchetype: 'aristocratic_exclusive',
      railwayDistanceHours: 9,
      attitudeTowardsCapital: 'neutral',
      historicalMilestones: [
        {
          date: { year: 1909, month: 4, day: 21 },
          title: 'Pioneirismo Leopoldinense',
          description: 'Clube dos barões do café e da ferrovia Leopoldina Railway.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 5. Sul: Associação Esportiva Sul-Mineira
    {
      id: 'reg_sul_pouso_alegre',
      name: 'Associação Esportiva Sul-Mineira',
      shortName: 'Sul-Mineira',
      city: 'Pouso das Águas',
      region: 'Sul',
      foundationYear: 1913,
      origin: 'merchants',
      colors: { primary: '#388E3C', secondary: '#FBC02D' },
      crestShape: 'circle',
      finances: { annualBudgetPpu: 400, cashBalancePpu: 95, stabilityRating: 72 },
      squadSummary: { totalPlayers: 17, averageRating: 55, starPlayerName: 'Armando D’Angelo' },
      stadium: { name: 'Parque das Estâncias', capacity: 1500, pitchType: 'grass' },
      supporterBase: 3800,
      traditionLevel: 68,
      directorArchetype: 'mercantile_expansionist',
      railwayDistanceHours: 12,
      attitudeTowardsCapital: 'distrustful',
      historicalMilestones: [
        {
          date: { year: 1913, month: 9, day: 7 },
          title: 'Bastião do Sul de Minas',
          description: 'União esportiva com laços mercantis com a praça de São Paulo e o vale do café.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 6. Triângulo: Uberaba Sport Club
    {
      id: 'reg_triangulo_uberaba',
      name: 'Uberaba Sport Club',
      shortName: 'Uberaba SC',
      city: 'Uberaba das Campinas',
      region: 'Triângulo',
      foundationYear: 1917,
      origin: 'elite',
      colors: { primary: '#D32F2F', secondary: '#FFFFFF' },
      crestShape: 'stripes',
      finances: { annualBudgetPpu: 620, cashBalancePpu: 210, stabilityRating: 88 },
      squadSummary: { totalPlayers: 20, averageRating: 64, starPlayerName: 'Tenente Nho-Nhô' },
      stadium: { name: 'Campo da Mogiana', capacity: 3000, pitchType: 'grass' },
      supporterBase: 7000,
      traditionLevel: 78,
      directorArchetype: 'pragmatic_competitive',
      railwayDistanceHours: 18,
      attitudeTowardsCapital: 'distrustful',
      historicalMilestones: [
        {
          date: { year: 1917, month: 7, day: 15 },
          title: 'A Força do Sertão da Farinha',
          description: 'Financiado pelos grandes criadores do Zebu e chefes da Mogiana, com postura de independência da capital.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 7. Oeste: Ferroviário Atlético Clube
    {
      id: 'reg_oeste_divinopolis',
      name: 'Ferroviário Atlético Clube',
      shortName: 'Ferroviário Oeste',
      city: 'Divina Providência',
      region: 'Oeste',
      foundationYear: 1914,
      origin: 'railway',
      colors: { primary: '#212121', secondary: '#E0E0E0' },
      crestShape: 'swiss',
      finances: { annualBudgetPpu: 380, cashBalancePpu: 85, stabilityRating: 75 },
      squadSummary: { totalPlayers: 18, averageRating: 57, starPlayerName: 'Tião Caldeireiro' },
      stadium: { name: 'Pátio das Oficinas EFOM', capacity: 1800, pitchType: 'dirt' },
      supporterBase: 4100,
      traditionLevel: 72,
      directorArchetype: 'community_neighborhood',
      railwayDistanceHours: 5,
      attitudeTowardsCapital: 'friendly',
      historicalMilestones: [
        {
          date: { year: 1914, month: 3, day: 10 },
          title: 'Agremiação das Oficinas Ferroviárias',
          description: 'Fundado pelos maquinistas e operários da Estrada de Ferro Oeste de Minas.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 8. Norte: Montes Claros Foot-Ball Club
    {
      id: 'reg_norte_montes_claros',
      name: 'Montes Claros Foot-Ball Club',
      shortName: 'Montes Claros',
      city: 'Montes Claros do Norte',
      region: 'Norte',
      foundationYear: 1915,
      origin: 'community',
      colors: { primary: '#00796B', secondary: '#FFFFFF' },
      crestShape: 'diamond',
      finances: { annualBudgetPpu: 280, cashBalancePpu: 55, stabilityRating: 65 },
      squadSummary: { totalPlayers: 15, averageRating: 50, starPlayerName: 'Manoel Tropeiro' },
      stadium: { name: 'Largo da Matriz Norte', capacity: 1100, pitchType: 'dirt' },
      supporterBase: 2600,
      traditionLevel: 62,
      directorArchetype: 'traditionalist_amateur',
      railwayDistanceHours: 24,
      attitudeTowardsCapital: 'neutral',
      historicalMilestones: [
        {
          date: { year: 1915, month: 11, day: 15 },
          title: 'Representante do Sertão das Minas',
          description: 'Nascido do entusiasmo cívico e do comércio tropeiro com o vale sanfranciscano.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
    // 9. Vale: Rio Doce Atlético Grêmio
    {
      id: 'reg_vale_rio_doce',
      name: 'Rio Doce Atlético Grêmio',
      shortName: 'Rio Doce Grêmio',
      city: 'Porto de São Francisco do Vale',
      region: 'Vale',
      foundationYear: 1918,
      origin: 'railway',
      colors: { primary: '#1565C0', secondary: '#FF8F00' },
      crestShape: 'sash',
      finances: { annualBudgetPpu: 310, cashBalancePpu: 60, stabilityRating: 68 },
      squadSummary: { totalPlayers: 16, averageRating: 51, starPlayerName: 'Vitorino da Mata' },
      stadium: { name: 'Campo da Estrada de Ferro', capacity: 1300, pitchType: 'dirt' },
      supporterBase: 2800,
      traditionLevel: 60,
      directorArchetype: 'community_neighborhood',
      railwayDistanceHours: 14,
      attitudeTowardsCapital: 'neutral',
      historicalMilestones: [
        {
          date: { year: 1918, month: 8, day: 25 },
          title: 'Desbravamento do Rio Doce',
          description: 'Fundado por colonos e pioneiros da ferrovia de escoamento de minério e café.',
        },
      ],
      matchesPlayedAgainstCapital: 0,
    },
  ];

  return Object.freeze(clubs.map(c => validateRegionalClubState(c)!));
}
