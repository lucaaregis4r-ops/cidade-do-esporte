import type { CampaignRng } from '../CampaignRng';
import type { GameDate } from '../HistoricalClock';
import type { CityDistrict } from '../city/cityDistricts';
import type { ClubColors, FoundingOrigin } from './Club';
import type { CrestShape } from './ClubIdentity';
import {
  type AIDirectorProfile,
  generateAIDirectorProfile,
  validateAIDirectorProfile,
} from './AIClubDirector';

export type ClubFoundationReason =
  | 'neighborhood'
  | 'railway'
  | 'factory'
  | 'students'
  | 'immigrants'
  | 'elite'
  | 'workers'
  | 'dissidence';

export type LocalClubStatus = 'active' | 'amateur' | 'dormant' | 'defunct';

export type PoliticalIdeology =
  | 'aristocratic'
  | 'popular_labor'
  | 'mercantile'
  | 'academic'
  | 'community';

export interface LocalClubPresident {
  readonly id: string;
  readonly name: string;
  readonly termStartYear: number;
  readonly termEndYear: number;
  readonly politicalLine: PoliticalIdeology;
  readonly biography: string;
}

export interface LocalClubStadium {
  readonly name: string;
  readonly capacity: number;
  readonly pitchType: 'dirt' | 'grass';
  readonly standsType: 'none' | 'wooden' | 'concrete';
  readonly hasFloodlights: boolean;
  readonly inaugurationYear: number;
}

export interface LocalClubMilestone {
  readonly date: Readonly<GameDate>;
  readonly title: string;
  readonly description: string;
}

export interface LocalClubState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly foundationDate: Readonly<GameDate>;
  readonly foundationReason: ClubFoundationReason;
  readonly districtId: string;
  readonly origin: FoundingOrigin;
  readonly colors: ClubColors;
  readonly crestShape: CrestShape;
  readonly reputation: number; // 0–100
  readonly status: LocalClubStatus;
  readonly finances: {
    readonly cashBalancePpu: number;
    readonly monthlyBudgetPpu: number;
  };
  readonly facilities: readonly string[];
  readonly directorProfile: AIDirectorProfile;
  readonly squadSummary: {
    readonly totalPlayers: number;
    readonly averageRating: number;
  };
  readonly historicalMilestones: readonly LocalClubMilestone[];
  readonly trophies?: readonly import('../football/Competition').ClubTrophy[];
  readonly parentClubId?: string;
  readonly dissidenceCause?: string;
  readonly president?: LocalClubPresident;
  readonly stadium?: LocalClubStadium;
}

/**
 * Awards an official trophy to a local club and adds a milestone to its historical record.
 */
export function addTrophyToLocalClub(
  club: LocalClubState,
  trophy: import('../football/Competition').ClubTrophy
): LocalClubState {
  const current = club.trophies ?? [];
  if (current.some((t) => t.id === trophy.id)) return club;
  const milestone: LocalClubMilestone = {
    date: trophy.date,
    title: `🏆 Campeão da ${trophy.competitionName}`,
    description: `Conquistou o troféu oficial da ${trophy.competitionName} em ${trophy.year}.`,
  };
  return Object.freeze({
    ...club,
    reputation: Math.min(100, club.reputation + 10),
    trophies: Object.freeze([...current, trophy]),
    historicalMilestones: Object.freeze([...club.historicalMilestones, milestone]),
  });
}

/**
 * Validates and sanitizes a LocalClubState object.
 */
export function validateLocalClubState(value: unknown): LocalClubState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) return null;
  if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) return null;
  if (typeof candidate.shortName !== 'string' || candidate.shortName.trim().length === 0) return null;

  if (!candidate.foundationDate || typeof candidate.foundationDate !== 'object') return null;
  const fDate = candidate.foundationDate as Record<string, unknown>;
  if (typeof fDate.year !== 'number' || typeof fDate.month !== 'number' || typeof fDate.day !== 'number') return null;

  const validReasons: ClubFoundationReason[] = [
    'neighborhood', 'railway', 'factory', 'students', 'immigrants', 'elite', 'workers', 'dissidence'
  ];
  if (!validReasons.includes(candidate.foundationReason as ClubFoundationReason)) return null;

  if (typeof candidate.districtId !== 'string') return null;

  const validOrigins: FoundingOrigin[] = ['railway', 'students', 'immigrants', 'workers', 'merchants', 'elite'];
  if (!validOrigins.includes(candidate.origin as FoundingOrigin)) return null;

  if (!candidate.colors || typeof candidate.colors !== 'object') return null;
  const colors = candidate.colors as Record<string, unknown>;
  if (typeof colors.primary !== 'string' || typeof colors.secondary !== 'string') return null;

  const validShapes: CrestShape[] = ['swiss', 'circle', 'stripes', 'sash', 'diamond'];
  if (!validShapes.includes(candidate.crestShape as CrestShape)) return null;

  const reputation = typeof candidate.reputation === 'number' ? candidate.reputation : -1;
  if (reputation < 0 || reputation > 100) return null;

  const validStatuses: LocalClubStatus[] = ['active', 'amateur', 'dormant', 'defunct'];
  if (!validStatuses.includes(candidate.status as LocalClubStatus)) return null;

  if (!candidate.finances || typeof candidate.finances !== 'object') return null;
  const finances = candidate.finances as Record<string, unknown>;
  if (typeof finances.cashBalancePpu !== 'number' || typeof finances.monthlyBudgetPpu !== 'number') return null;

  if (!Array.isArray(candidate.facilities)) return null;

  const directorProfile = validateAIDirectorProfile(candidate.directorProfile);
  if (!directorProfile) return null;

  if (!candidate.squadSummary || typeof candidate.squadSummary !== 'object') return null;
  const squad = candidate.squadSummary as Record<string, unknown>;
  if (typeof squad.totalPlayers !== 'number' || typeof squad.averageRating !== 'number') return null;

  const historicalMilestones: LocalClubMilestone[] = [];
  if (Array.isArray(candidate.historicalMilestones)) {
    for (const m of candidate.historicalMilestones) {
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
    id: candidate.id,
    name: candidate.name,
    shortName: candidate.shortName,
    foundationDate: Object.freeze({ year: Number(fDate.year), month: Number(fDate.month), day: Number(fDate.day) }),
    foundationReason: candidate.foundationReason as ClubFoundationReason,
    districtId: candidate.districtId,
    origin: candidate.origin as FoundingOrigin,
    colors: Object.freeze({ primary: colors.primary, secondary: colors.secondary }),
    crestShape: candidate.crestShape as CrestShape,
    reputation,
    status: candidate.status as LocalClubStatus,
    finances: Object.freeze({
      cashBalancePpu: Number(finances.cashBalancePpu),
      monthlyBudgetPpu: Number(finances.monthlyBudgetPpu),
    }),
    facilities: Object.freeze([...candidate.facilities]),
    directorProfile,
    squadSummary: Object.freeze({
      totalPlayers: Number(squad.totalPlayers),
      averageRating: Number(squad.averageRating),
    }),
    ...(candidate.president && typeof candidate.president === 'object' ? { president: candidate.president as LocalClubPresident } : {}),
    ...(candidate.stadium && typeof candidate.stadium === 'object' ? { stadium: candidate.stadium as LocalClubStadium } : {}),
    historicalMilestones: Object.freeze(historicalMilestones),
    ...(Array.isArray(candidate.trophies) ? { trophies: Object.freeze([...candidate.trophies]) } : {}),
    ...(typeof candidate.parentClubId === 'string' ? { parentClubId: candidate.parentClubId } : {}),
    ...(typeof candidate.dissidenceCause === 'string' ? { dissidenceCause: candidate.dissidenceCause } : {}),
  });
}

function resolveDistrictId(districts: readonly CityDistrict[], preferredKind: string, fallbackId: string): string {
  const match = districts.find(d => d.kind === preferredKind || d.id.includes(preferredKind));
  return match ? match.id : fallbackId;
}

/**
 * Generates the initial pioneer local clubs existing in Cidade de Minas at the start of 1910.
 */
export function generateInitial1910LocalClubs(
  districts: readonly CityDistrict[],
  rng: CampaignRng
): readonly LocalClubState[] {
  const clubs: LocalClubState[] = [];

  // 1. Sport Club Mineiro (1904) - Decano pioneiro da elite/centro
  const sportDistrict = resolveDistrictId(districts, 'public-square', 'district-public-square');
  const sportDirector = generateAIDirectorProfile('elite', rng, 1910);
  clubs.push(Object.freeze({
    id: 'local-club-sport-mineiro',
    name: 'Sport Club Mineiro',
    shortName: 'Sport',
    foundationDate: Object.freeze({ year: 1904, month: 6, day: 10 }),
    foundationReason: 'elite',
    districtId: sportDistrict,
    origin: 'elite',
    colors: Object.freeze({ primary: '#212121', secondary: '#FFFFFF' }),
    crestShape: 'diamond',
    reputation: 60,
    status: 'active',
    finances: Object.freeze({ cashBalancePpu: 45, monthlyBudgetPpu: 8 }),
    facilities: Object.freeze(['dirt_pitch', 'wooden_fence', 'wooden_stands']),
    directorProfile: sportDirector,
    squadSummary: Object.freeze({ totalPlayers: 14, averageRating: 6.2 }),
    president: Object.freeze({
      id: 'pres-sport-1910',
      name: 'Dr. Celso Porfírio de Araújo',
      termStartYear: 1908,
      termEndYear: 1912,
      politicalLine: 'aristocratic' as PoliticalIdeology,
      biography: 'Jurista ilustre e pioneiro do foot-ball entre a mocidade acadêmica de Cidade de Minas.',
    }),
    stadium: Object.freeze({
      name: 'Praça de Esportes do Prado',
      capacity: 2200,
      pitchType: 'dirt' as const,
      standsType: 'wooden' as const,
      hasFloodlights: false,
      inaugurationYear: 1906,
    }),
    historicalMilestones: Object.freeze([
      {
        date: Object.freeze({ year: 1904, month: 6, day: 10 }),
        title: 'Fundação Histórica',
        description: 'Fundado por rapazes e cavalheiros pioneiros do foot-ball em Cidade de Minas.',
      },
    ]),
  }));

  // 2. Villa Nova Athletic Club (1908) - Operários e técnicos de Nova Lima / periferia
  const villaDistrict = resolveDistrictId(districts, 'outer-south', 'district-outer-south');
  const villaDirector = generateAIDirectorProfile('workers', rng, 1910);
  clubs.push(Object.freeze({
    id: 'local-club-villa-nova',
    name: 'Villa Nova Athletic Club',
    shortName: 'Villa Nova',
    foundationDate: Object.freeze({ year: 1908, month: 6, day: 28 }),
    foundationReason: 'workers',
    districtId: villaDistrict,
    origin: 'workers',
    colors: Object.freeze({ primary: '#B71C1C', secondary: '#FFFFFF' }),
    crestShape: 'stripes',
    reputation: 68,
    status: 'active',
    finances: Object.freeze({ cashBalancePpu: 60, monthlyBudgetPpu: 12 }),
    facilities: Object.freeze(['dirt_pitch', 'wooden_fence', 'wooden_stands']),
    directorProfile: villaDirector,
    squadSummary: Object.freeze({ totalPlayers: 15, averageRating: 6.8 }),
    president: Object.freeze({
      id: 'pres-villa-1910',
      name: 'Manoel Ferreira dos Santos',
      termStartYear: 1908,
      termEndYear: 1913,
      politicalLine: 'popular_labor' as PoliticalIdeology,
      biography: 'Mestre da oficina mecânica e pioneiro operário com ligações com engenheiros britânicos.',
    }),
    stadium: Object.freeze({
      name: 'Campo da Várzea do Castor',
      capacity: 3500,
      pitchType: 'dirt' as const,
      standsType: 'wooden' as const,
      hasFloodlights: false,
      inaugurationYear: 1908,
    }),
    historicalMilestones: Object.freeze([
      {
        date: Object.freeze({ year: 1908, month: 6, day: 28 }),
        title: 'Fundação Operária Britânica',
        description: 'Fundado por mineiros e trabalhadores fabris com apoio de engenheiros britânicos.',
      },
    ]),
  }));

  // 3. Associação Atlética do Comércio (1909) - Caixeiros e comerciantes do centro comercial
  const comercioDistrict = resolveDistrictId(districts, 'commercial-cluster', 'district-commercial-cluster');
  const comercioDirector = generateAIDirectorProfile('merchants', rng, 1910);
  clubs.push(Object.freeze({
    id: 'local-club-aa-comercio',
    name: 'Associação Atlética do Comércio',
    shortName: 'A.A. Comércio',
    foundationDate: Object.freeze({ year: 1909, month: 9, day: 15 }),
    foundationReason: 'workers',
    districtId: comercioDistrict,
    origin: 'merchants',
    colors: Object.freeze({ primary: '#4A148C', secondary: '#FFFFFF' }),
    crestShape: 'circle',
    reputation: 52,
    status: 'active',
    finances: Object.freeze({ cashBalancePpu: 35, monthlyBudgetPpu: 7 }),
    facilities: Object.freeze(['dirt_pitch', 'wooden_fence']),
    directorProfile: comercioDirector,
    squadSummary: Object.freeze({ totalPlayers: 13, averageRating: 5.7 }),
    president: Object.freeze({
      id: 'pres-comercio-1910',
      name: 'Alberto Drummond da Silveira',
      termStartYear: 1909,
      termEndYear: 1912,
      politicalLine: 'mercantile' as PoliticalIdeology,
      biography: 'Guarda-livros de grandes armazéns e incentivador dos caixeiros desportistas da capital.',
    }),
    stadium: Object.freeze({
      name: 'Campo da Alameda do Comércio',
      capacity: 1500,
      pitchType: 'dirt' as const,
      standsType: 'wooden' as const,
      hasFloodlights: false,
      inaugurationYear: 1909,
    }),
    historicalMilestones: Object.freeze([
      {
        date: Object.freeze({ year: 1909, month: 9, day: 15 }),
        title: 'Fundação Comercial',
        description: 'Criado pela mocidade do comércio, caixeiros e guarda-livros da capital.',
      },
    ]),
  }));

  // 4. Yale Athletic Club (1910) - Imigrantes ítalo-mineiros e comércio
  const yaleDistrict = resolveDistrictId(districts, 'outer-west', 'district-outer-west');
  const yaleDirector = generateAIDirectorProfile('immigrants', rng, 1910);
  clubs.push(Object.freeze({
    id: 'local-club-yale',
    name: 'Yale Athletic Club',
    shortName: 'Yale',
    foundationDate: Object.freeze({ year: 1910, month: 7, day: 4 }),
    foundationReason: 'immigrants',
    districtId: yaleDistrict,
    origin: 'immigrants',
    colors: Object.freeze({ primary: '#0D47A1', secondary: '#FFD700' }),
    crestShape: 'swiss',
    reputation: 58,
    status: 'active',
    finances: Object.freeze({ cashBalancePpu: 40, monthlyBudgetPpu: 9 }),
    facilities: Object.freeze(['dirt_pitch', 'wooden_fence']),
    directorProfile: yaleDirector,
    squadSummary: Object.freeze({ totalPlayers: 14, averageRating: 6.0 }),
    president: Object.freeze({
      id: 'pres-yale-1910',
      name: 'Vicente Rao',
      termStartYear: 1910,
      termEndYear: 1914,
      politicalLine: 'community' as PoliticalIdeology,
      biography: 'Empresário e artífice respeitado pela colônia italiana de Cidade de Minas.',
    }),
    stadium: Object.freeze({
      name: 'Campo da Estação Oeste',
      capacity: 1800,
      pitchType: 'dirt' as const,
      standsType: 'none' as const,
      hasFloodlights: false,
      inaugurationYear: 1910,
    }),
    historicalMilestones: Object.freeze([
      {
        date: Object.freeze({ year: 1910, month: 7, day: 4 }),
        title: 'Fundação Ítalo-Mineira',
        description: 'Fundado por membros entusiastas da colônia italiana e jovens esportistas.',
      },
    ]),
  }));

  // 5. Combinado da Estação Ferroviária (1910) - Maquinistas e ferroviários
  const railwayDistrict = resolveDistrictId(districts, 'railway-station', 'district-railway-station');
  const railwayDirector = generateAIDirectorProfile('railway', rng, 1910);
  clubs.push(Object.freeze({
    id: 'local-club-combinado-ef',
    name: 'Combinado da Estação Ferroviária',
    shortName: 'Combinado EF',
    foundationDate: Object.freeze({ year: 1910, month: 8, day: 20 }),
    foundationReason: 'railway',
    districtId: railwayDistrict,
    origin: 'railway',
    colors: Object.freeze({ primary: '#E65100', secondary: '#212121' }),
    crestShape: 'sash',
    reputation: 48,
    status: 'active',
    finances: Object.freeze({ cashBalancePpu: 25, monthlyBudgetPpu: 6 }),
    facilities: Object.freeze(['dirt_pitch']),
    directorProfile: railwayDirector,
    squadSummary: Object.freeze({ totalPlayers: 13, averageRating: 5.5 }),
    president: Object.freeze({
      id: 'pres-comb-1910',
      name: 'Joaquim "Quim" Teodoro',
      termStartYear: 1910,
      termEndYear: 1913,
      politicalLine: 'popular_labor' as PoliticalIdeology,
      biography: 'Maquinista chefe da Central do Brasil e entusiasta das pelejas de sábado entre foguistas.',
    }),
    stadium: Object.freeze({
      name: 'Ground da Central Ferroviária',
      capacity: 1200,
      pitchType: 'dirt' as const,
      standsType: 'none' as const,
      hasFloodlights: false,
      inaugurationYear: 1910,
    }),
    historicalMilestones: Object.freeze([
      {
        date: Object.freeze({ year: 1910, month: 8, day: 20 }),
        title: 'Fundação dos Ferroviários',
        description: 'Organizado por maquinistas, telegrafistas e operários da Estrada de Ferro.',
      },
    ]),
  }));

  return Object.freeze(clubs);
}

/**
 * Evaluates annual club births in Cidade de Minas.
 * Governed by historical milestones (e.g. América in 1912, União Operária in 1914, Palestra in 1918, Sete de Setembro in 1921).
 */
export function evaluateAnnualClubBirths(input: {
  year: number;
  districts: readonly CityDistrict[];
  existingClubs: readonly LocalClubState[];
  rng: CampaignRng;
}): readonly LocalClubState[] {
  const { year, districts, existingClubs, rng } = input;
  const stream = rng.club;
  const newlyBorn: LocalClubState[] = [];

  const existingIds = new Set(existingClubs.map(c => c.id));

  // 1912: América Foot-Ball Club (Estudantes da elite letrada)
  if (year === 1912 && !existingIds.has('local-club-america')) {
    const districtId = resolveDistrictId(districts, 'public-square', 'district-public-square');
    const directorProfile = generateAIDirectorProfile('students', rng, 1912);
    newlyBorn.push(Object.freeze({
      id: 'local-club-america',
      name: 'América Foot-Ball Club',
      shortName: 'América',
      foundationDate: Object.freeze({ year: 1912, month: 4, day: 30 }),
      foundationReason: 'students',
      districtId,
      origin: 'students',
      colors: Object.freeze({ primary: '#1B5E20', secondary: '#FFFFFF' }),
      crestShape: 'swiss',
      reputation: 66,
      status: 'active',
      finances: Object.freeze({ cashBalancePpu: 55, monthlyBudgetPpu: 11 }),
      facilities: Object.freeze(['dirt_pitch', 'wooden_fence', 'wooden_stands']),
      directorProfile,
      squadSummary: Object.freeze({ totalPlayers: 15, averageRating: 6.6 }),
      president: Object.freeze({
        id: 'pres-america-1912',
        name: 'Dr. Afonso Pena Júnior',
        termStartYear: 1912,
        termEndYear: 1916,
        politicalLine: 'academic' as PoliticalIdeology,
        biography: 'Estudioso entusiasta do Ginásio de Minas e patrono do amadorismo disciplinado.',
      }),
      stadium: Object.freeze({
        name: 'Estádio da Alameda Travessia',
        capacity: 4500,
        pitchType: 'dirt' as const,
        standsType: 'wooden' as const,
        hasFloodlights: false,
        inaugurationYear: 1912,
      }),
      historicalMilestones: Object.freeze([
        {
          date: Object.freeze({ year: 1912, month: 4, day: 30 }),
          title: 'Fundação Estudantil',
          description: 'Fundado no centro da cidade por jovens estudantes do Ginásio de Minas.',
        },
      ]),
    }));
  }

  // 1914: União Operária Futebol Clube (Expansão fabril)
  if (year === 1914 && !existingIds.has('local-club-uniao-operaria')) {
    const districtId = resolveDistrictId(districts, 'small-industry', 'district-small-industry');
    const directorProfile = generateAIDirectorProfile('workers', rng, 1914);
    newlyBorn.push(Object.freeze({
      id: 'local-club-uniao-operaria',
      name: 'União Operária Futebol Clube',
      shortName: 'União Operária',
      foundationDate: Object.freeze({ year: 1914, month: 5, day: 1 }),
      foundationReason: 'factory',
      districtId,
      origin: 'workers',
      colors: Object.freeze({ primary: '#C62828', secondary: '#212121' }),
      crestShape: 'stripes',
      reputation: 54,
      status: 'active',
      finances: Object.freeze({ cashBalancePpu: 30, monthlyBudgetPpu: 7 }),
      facilities: Object.freeze(['dirt_pitch', 'wooden_fence']),
      directorProfile,
      squadSummary: Object.freeze({ totalPlayers: 14, averageRating: 5.8 }),
      president: Object.freeze({
        id: 'pres-uniao-1914',
        name: 'Benedito Ramos da Silva',
        termStartYear: 1914,
        termEndYear: 1918,
        politicalLine: 'popular_labor' as PoliticalIdeology,
        biography: 'Mestre artífice têxtil e capitão combativo da defesa dos direitos dos operários.',
      }),
      stadium: Object.freeze({
        name: 'Campo da Vila Operária',
        capacity: 2000,
        pitchType: 'dirt' as const,
        standsType: 'none' as const,
        hasFloodlights: false,
        inaugurationYear: 1914,
      }),
      historicalMilestones: Object.freeze([
        {
          date: Object.freeze({ year: 1914, month: 5, day: 1 }),
          title: 'Fundação Operária de 1º de Maio',
          description: 'Fundado por operários de fiações e tecelagens no feriado do trabalho.',
        },
      ]),
    }));
  }

  // 1918: Palestra Itália Foot-Ball Club (Colônia italiana emergente)
  if (year === 1918 && !existingIds.has('local-club-palestra-italia')) {
    const districtId = resolveDistrictId(districts, 'outer-south', 'district-outer-south');
    const directorProfile = generateAIDirectorProfile('immigrants', rng, 1918);
    newlyBorn.push(Object.freeze({
      id: 'local-club-palestra-italia',
      name: 'Palestra Itália Foot-Ball Club',
      shortName: 'Palestra Itália',
      foundationDate: Object.freeze({ year: 1918, month: 1, day: 2 }),
      foundationReason: 'immigrants',
      districtId,
      origin: 'immigrants',
      colors: Object.freeze({ primary: '#2E7D32', secondary: '#D32F2F' }),
      crestShape: 'circle',
      reputation: 64,
      status: 'active',
      finances: Object.freeze({ cashBalancePpu: 50, monthlyBudgetPpu: 10 }),
      facilities: Object.freeze(['dirt_pitch', 'wooden_fence']),
      directorProfile,
      squadSummary: Object.freeze({ totalPlayers: 15, averageRating: 6.5 }),
      president: Object.freeze({
        id: 'pres-palestra-1918',
        name: 'Comendador Mário Penna',
        termStartYear: 1918,
        termEndYear: 1922,
        politicalLine: 'community' as PoliticalIdeology,
        biography: 'Líder da Sociedade de Mútuo Socorro da colônia e comerciante influente.',
      }),
      stadium: Object.freeze({
        name: 'Estádio do Barro Preto',
        capacity: 5500,
        pitchType: 'dirt' as const,
        standsType: 'wooden' as const,
        hasFloodlights: false,
        inaugurationYear: 1918,
      }),
      historicalMilestones: Object.freeze([
        {
          date: Object.freeze({ year: 1918, month: 1, day: 2 }),
          title: 'Fundação da Colônia Italiana',
          description: 'Criado pela comunidade italiana de artífices, pedreiros e comerciantes.',
        },
      ]),
    }));
  }

  // 1921: Sete de Setembro Foot-Ball Club (Bairro operário da zona norte)
  if (year === 1921 && !existingIds.has('local-club-sete-setembro')) {
    const districtId = resolveDistrictId(districts, 'outer-north', 'district-outer-north');
    const directorProfile = generateAIDirectorProfile('workers', rng, 1921);
    newlyBorn.push(Object.freeze({
      id: 'local-club-sete-setembro',
      name: 'Sete de Setembro Foot-Ball Club',
      shortName: 'Sete de Setembro',
      foundationDate: Object.freeze({ year: 1921, month: 9, day: 7 }),
      foundationReason: 'neighborhood',
      districtId,
      origin: 'workers',
      colors: Object.freeze({ primary: '#FFFFFF', secondary: '#212121' }),
      crestShape: 'stripes',
      reputation: 56,
      status: 'active',
      finances: Object.freeze({ cashBalancePpu: 35, monthlyBudgetPpu: 8 }),
      facilities: Object.freeze(['dirt_pitch', 'wooden_fence']),
      directorProfile,
      squadSummary: Object.freeze({ totalPlayers: 14, averageRating: 6.0 }),
      president: Object.freeze({
        id: 'pres-sete-1921',
        name: 'Sebastião Alvarenga',
        termStartYear: 1921,
        termEndYear: 1925,
        politicalLine: 'popular_labor' as PoliticalIdeology,
        biography: 'Comerciante de armarinho e incentivador do foot-ball entre rapazes da Zona Norte.',
      }),
      stadium: Object.freeze({
        name: 'Campo da Zona Norte',
        capacity: 2500,
        pitchType: 'dirt' as const,
        standsType: 'none' as const,
        hasFloodlights: false,
        inaugurationYear: 1921,
      }),
      historicalMilestones: Object.freeze([
        {
          date: Object.freeze({ year: 1921, month: 9, day: 7 }),
          title: 'Fundação Cívica do Bairro Norte',
          description: 'Nascido no Dia da Pátria por moradores e esportistas do bairro operário.',
        },
      ]),
    }));
  }

  // Procedural births across the decades (1922 to 1959) up to 16 clubs in Cidade de Minas
  if (existingClubs.length < 16 && stream.next() < 0.28) {
    const unrepresentedDistricts = districts.filter(d => !existingClubs.some(c => c.districtId === d.id));
    const targetDistrict = unrepresentedDistricts.length > 0
      ? unrepresentedDistricts[Math.floor(stream.next() * unrepresentedDistricts.length)]
      : districts[Math.floor(stream.next() * districts.length)];

    if (targetDistrict) {
      // Pick a candidate template not yet existing
      const availableTemplate = PROCEDURAL_CLUB_TEMPLATES.find(t => !existingClubs.some(c => c.name === t.name));
      if (availableTemplate) {
        const proceduralId = `local-club-${availableTemplate.short.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}`;
        if (!existingIds.has(proceduralId)) {
          const directorProfile = generateAIDirectorProfile(availableTemplate.origin, rng, year);
          const president = generateProceduralPresident(availableTemplate.origin, rng, year);
          const stadium = generateProceduralStadium(availableTemplate.name, targetDistrict.id, year, rng);

          newlyBorn.push(Object.freeze({
            id: proceduralId,
            name: availableTemplate.name,
            shortName: availableTemplate.short,
            foundationDate: Object.freeze({ year, month: 3 + Math.floor(stream.next() * 6), day: 1 + Math.floor(stream.next() * 25) }),
            foundationReason: availableTemplate.reason,
            districtId: targetDistrict.id,
            origin: availableTemplate.origin,
            colors: Object.freeze({ primary: availableTemplate.primary, secondary: availableTemplate.secondary }),
            crestShape: availableTemplate.shape,
            reputation: 46 + Math.floor(stream.next() * 14),
            status: 'active',
            finances: Object.freeze({ cashBalancePpu: 30 + Math.floor(stream.next() * 20), monthlyBudgetPpu: 6 + Math.floor(stream.next() * 4) }),
            facilities: Object.freeze(['dirt_pitch', 'wooden_fence']),
            directorProfile,
            squadSummary: Object.freeze({ totalPlayers: 13, averageRating: 5.4 + stream.next() * 0.8 }),
            president,
            stadium,
            historicalMilestones: Object.freeze([
              {
                date: Object.freeze({ year, month: 3, day: 15 }),
                title: 'Fundação Orgânica',
                description: `O ${availableTemplate.name} foi fundado em ${year} por moradores e trabalhadores do distrito ${targetDistrict.id}.`,
              },
            ]),
          }));
        }
      }
    }
  }

  return Object.freeze(newlyBorn);
}

/**
 * Monthly step for an AI-managed local club.
 */
export function stepLocalClub(
  club: LocalClubState,
  currentDate: GameDate,
  rng: CampaignRng
): {
  readonly updatedClub: LocalClubState;
  readonly challengeOffer: {
    readonly id: string;
    readonly challengerClubId: string;
    readonly challengerClubName: string;
    readonly message: string;
  } | null;
} {
  const stream = rng.club;
  let cash = club.finances.cashBalancePpu;

  // Monthly dues simulated income based on reputation and director profile
  const duesMultiplier = club.directorProfile.archetype === 'mercantile_expansionist' ? 1.3 :
    club.directorProfile.archetype === 'aristocratic_exclusive' ? 1.2 : 1.0;
  const income = Math.round((club.reputation / 10) * duesMultiplier * (0.8 + stream.next() * 0.4));
  const expense = Math.round(club.facilities.length * 2 + (club.directorProfile.archetype === 'pragmatic_competitive' ? 3 : 1));

  cash = Math.max(0, cash + income - expense);

  // Facility upgrade if wealthy and ambitious
  const facilities = [...club.facilities];
  if (cash > 50 && club.directorProfile.ambition > 65 && !facilities.includes('wooden_stands')) {
    facilities.push('wooden_stands');
    cash -= 25;
  } else if (cash > 30 && !facilities.includes('wooden_fence')) {
    facilities.push('wooden_fence');
    cash -= 15;
  }

  // Challenge offer generation (approx 10% chance per month if active)
  let challengeOffer = null;
  if (club.status === 'active' && stream.next() < 0.12) {
    challengeOffer = {
      id: `challenge-${club.id}-${currentDate.year}-${currentDate.month}`,
      challengerClubId: club.id,
      challengerClubName: club.name,
      message: `A Diretoria do ${club.name} formaliza convite para uma festiva partida amistosa de foot-ball!`,
    };
  }

  const updatedClub: LocalClubState = Object.freeze({
    ...club,
    finances: Object.freeze({
      cashBalancePpu: cash,
      monthlyBudgetPpu: club.finances.monthlyBudgetPpu,
    }),
    facilities: Object.freeze(facilities),
  });

  return { updatedClub, challengeOffer };
}

export const HISTORICAL_PRESIDENT_TEMPLATES: readonly { name: string; line: PoliticalIdeology; bio: string }[] = Object.freeze([
  { name: 'Dr. Celso Porfírio de Araújo', line: 'aristocratic', bio: 'Jurista ilustre e decano da alta sociedade da capital.' },
  { name: 'Dr. Afonso Pena Júnior', line: 'aristocratic', bio: 'Homem público de estirpe republicana e incentivador dos desportos.' },
  { name: 'Antônio Prado Guimarães', line: 'aristocratic', bio: 'Proprietário urbano e defensor do amadorismo clássico estatutário.' },
  { name: 'Manoel Ferreira dos Santos', line: 'popular_labor', bio: 'Mestre da oficina mecânica da ferrovia e líder operário comunitário.' },
  { name: 'Joaquim "Quim" Teodoro', line: 'popular_labor', bio: 'Trabalhador têxtil combativo, fundador de associações de socorro mútuo.' },
  { name: 'Benedito Ramos da Silva', line: 'popular_labor', bio: 'Artesão popular e capitão dos festivais operários de domingo.' },
  { name: 'Guilherme Silveira', line: 'mercantile', bio: 'Comerciante atacadista dinâmico da Av. Afonso Pena, visionário de obras.' },
  { name: 'Alberto Drummond da Silveira', line: 'mercantile', bio: 'Guarda-livros de grandes firmas e entusiasta do crescimento da praça.' },
  { name: 'Octacílio Negrão de Lima', line: 'mercantile', bio: 'Engenheiro e financista com projetos de expansão patrimonial e alvenaria.' },
  { name: 'Álvaro Mendes', line: 'academic', bio: 'Estudante entusiasta do Ginásio e redator dos estatutos históricos.' },
  { name: 'Prof. Paulo Azeredo', line: 'academic', bio: 'Educador e formulador dos primeiros regulamentos de campeonatos escolares.' },
  { name: 'Dr. Juscelino Resende', line: 'academic', bio: 'Médico higienista e incentivador da preparação atlética dos jovens.' },
  { name: 'Capitão José Ignácio de Alencar', line: 'community', bio: 'Oficial da reserva e líder benquisto dos desportistas suburbanos.' },
  { name: 'Vicente Rao', line: 'community', bio: 'Artífice da colônia italiana e benemérito das praças esportivas populares.' },
  { name: 'Sebastião Alvarenga', line: 'community', bio: 'Farmacêutico respeitado e árbitro das pelejas de bairro da capital.' },
]);

export function generateProceduralPresident(
  origin: FoundingOrigin,
  rng: CampaignRng,
  year: number
): LocalClubPresident {
  const stream = rng.club;
  const idx = Math.floor(stream.next() * HISTORICAL_PRESIDENT_TEMPLATES.length);
  const template = HISTORICAL_PRESIDENT_TEMPLATES[idx] ?? HISTORICAL_PRESIDENT_TEMPLATES[0];
  const termLength = 2 + Math.floor(stream.next() * 3); // 2 a 4 anos
  return Object.freeze({
    id: `pres-${year}-${idx}`,
    name: template.name,
    termStartYear: year,
    termEndYear: year + termLength,
    politicalLine: template.line,
    biography: template.bio,
  });
}

export function generateProceduralStadium(
  clubName: string,
  districtId: string,
  year: number,
  rng: CampaignRng
): LocalClubStadium {
  const stream = rng.club;
  const isEarly = year < 1930;
  const isMid = year >= 1930 && year < 1945;

  let stadiumName: string;
  let capacity: number;
  let pitchType: 'dirt' | 'grass' = isEarly ? 'dirt' : 'grass';
  let standsType: 'none' | 'wooden' | 'concrete' = isEarly ? (stream.next() < 0.5 ? 'wooden' : 'none') : isMid ? 'wooden' : 'concrete';
  let hasFloodlights = year >= 1935 && stream.next() < 0.6;

  const baseName = clubName.replace(/Foot-Ball Club|Futebol Clube|Athletic Club|Esporte Clube/gi, '').trim();

  if (isEarly) {
    const prefixes = ['Campo da Várzea do', 'Praça de Esportes do', 'Ground de', 'Campo da Estação de'];
    const p = prefixes[Math.floor(stream.next() * prefixes.length)];
    stadiumName = `${p} ${baseName}`;
    capacity = 800 + Math.floor(stream.next() * 1800);
  } else if (isMid) {
    const prefixes = ['Estádio das Laranjeiras do', 'Parque Esportivo do', 'Estádio Alameda de'];
    const p = prefixes[Math.floor(stream.next() * prefixes.length)];
    stadiumName = `${p} ${baseName}`;
    capacity = 3000 + Math.floor(stream.next() * 4500);
  } else {
    const prefixes = ['Estádio Municipal de', 'Arena Presidente', 'Estádio Monumental do'];
    const p = prefixes[Math.floor(stream.next() * prefixes.length)];
    stadiumName = `${p} ${baseName}`;
    capacity = 8000 + Math.floor(stream.next() * 14000);
  }

  return Object.freeze({
    name: stadiumName.trim(),
    capacity,
    pitchType,
    standsType,
    hasFloodlights,
    inaugurationYear: year,
  });
}

export const PROCEDURAL_CLUB_TEMPLATES: readonly {
  name: string;
  short: string;
  origin: FoundingOrigin;
  shape: CrestShape;
  primary: string;
  secondary: string;
  reason: ClubFoundationReason;
}[] = Object.freeze([
  { name: 'Fluminense Foot-Ball Club da Lagoinha', short: 'Fluminense-MG', origin: 'workers', shape: 'stripes', primary: '#800020', secondary: '#006400', reason: 'neighborhood' },
  { name: 'Bonsucesso Foot-Ball Club', short: 'Bonsucesso', origin: 'workers', shape: 'sash', primary: '#1A237E', secondary: '#FFFFFF', reason: 'workers' },
  { name: 'Estrela do Prado Esporte Clube', short: 'Estrela do Prado', origin: 'merchants', shape: 'diamond', primary: '#F57F17', secondary: '#212121', reason: 'neighborhood' },
  { name: 'Grêmio Ferroviário Esperança', short: 'Grêmio EF', origin: 'railway', shape: 'stripes', primary: '#BF360C', secondary: '#212121', reason: 'railway' },
  { name: 'Democrata Foot-Ball Club da Estação', short: 'Democrata', origin: 'merchants', shape: 'circle', primary: '#311B92', secondary: '#FFFFFF', reason: 'neighborhood' },
  { name: 'Atlético Operário do Barro Preto', short: 'Operário BP', origin: 'workers', shape: 'swiss', primary: '#B71C1C', secondary: '#FFFFFF', reason: 'factory' },
  { name: 'Comercial Atlético Clube', short: 'Comercial AC', origin: 'merchants', shape: 'circle', primary: '#004D40', secondary: '#FFD700', reason: 'workers' },
  { name: 'Independente Foot-Ball Club', short: 'Independente', origin: 'students', shape: 'diamond', primary: '#0D47A1', secondary: '#ECEFF1', reason: 'students' },
  { name: 'União Sportiva Santa Tereza', short: 'União ST', origin: 'merchants', shape: 'swiss', primary: '#1B5E20', secondary: '#FFD700', reason: 'neighborhood' },
  { name: 'Metalúrgica Esporte Clube', short: 'Metalúrgica', origin: 'workers', shape: 'stripes', primary: '#37474F', secondary: '#D32F2F', reason: 'factory' },
  { name: 'Ideal Foot-Ball Club', short: 'Ideal FC', origin: 'merchants', shape: 'sash', primary: '#4A148C', secondary: '#ECEFF1', reason: 'workers' },
  { name: 'Tupi Foot-Ball Club da Floresta', short: 'Tupi Floresta', origin: 'workers', shape: 'stripes', primary: '#212121', secondary: '#FFFFFF', reason: 'neighborhood' },
  { name: 'Associação Atlética Renascença', short: 'A.A. Renascença', origin: 'elite', shape: 'circle', primary: '#006064', secondary: '#FFFFFF', reason: 'elite' },
  { name: 'Cruzeiro do Sul Foot-Ball Club', short: 'Cruzeiro do Sul', origin: 'students', shape: 'diamond', primary: '#01579B', secondary: '#FFFFFF', reason: 'students' },
  { name: 'Nacional Atlético Clube', short: 'Nacional AC', origin: 'merchants', shape: 'swiss', primary: '#880E4F', secondary: '#FFFFFF', reason: 'neighborhood' },
]);

export function evolveProceduralClubsAnnual(
  clubs: readonly LocalClubState[],
  currentYear: number,
  rng: CampaignRng
): {
  readonly updatedClubs: readonly LocalClubState[];
  readonly events: readonly { title: string; description: string }[];
} {
  const stream = rng.club;
  const events: { title: string; description: string }[] = [];

  const updatedClubs = clubs.map((club) => {
    let president = club.president;
    let stadium = club.stadium;
    const milestones = [...club.historicalMilestones];
    let reputation = club.reputation;

    // 1. Eleição / Mudança de Presidente ao término do mandato
    if (president && currentYear >= president.termEndYear) {
      const newPres = generateProceduralPresident(club.origin, rng, currentYear);
      events.push({
        title: `Eleição no ${club.name}: ${newPres.name}`,
        description: `Em assembleia de associados, ${newPres.name} foi eleito presidente do ${club.name} para mandato até ${newPres.termEndYear}. Linha política: ${newPres.politicalLine}.`,
      });
      milestones.push({
        date: Object.freeze({ year: currentYear, month: 1, day: 15 }),
        title: `Nova Diretoria: ${newPres.name}`,
        description: `Posse solene do presidente ${newPres.name} (${newPres.politicalLine}).`,
      });
      president = newPres;
    } else if (!president) {
      president = generateProceduralPresident(club.origin, rng, currentYear);
    }

    // 2. Evolução e modernização do Estádio conforme os anos avançam
    if (stadium) {
      let upgraded = false;
      let newCapacity = stadium.capacity;
      let newStands = stadium.standsType;
      let newPitch = stadium.pitchType;
      let newLights = stadium.hasFloodlights;

      if (currentYear >= 1930 && newPitch === 'dirt' && stream.next() < 0.35) {
        newPitch = 'grass';
        upgraded = true;
      }
      if (currentYear >= 1935 && !newLights && stream.next() < 0.3) {
        newLights = true;
        upgraded = true;
        events.push({
          title: `Refletores no ${stadium.name}`,
          description: `O ${club.name} instalou iluminação elétrica moderna no ${stadium.name}, permitindo prélio noturno!`,
        });
      }
      if (currentYear >= 1942 && newStands !== 'concrete' && stream.next() < 0.35) {
        newStands = 'concrete';
        newCapacity = Math.round(newCapacity * 1.4);
        upgraded = true;
        events.push({
          title: `Arquibancadas de Concreto no ${stadium.name}`,
          description: `O ${club.name} modernizou o ${stadium.name} com arquibancadas de concreto armado para ${newCapacity.toLocaleString()} torcedores!`,
        });
      }

      if (upgraded) {
        stadium = Object.freeze({
          ...stadium,
          capacity: newCapacity,
          standsType: newStands,
          pitchType: newPitch,
          hasFloodlights: newLights,
        });
        reputation = Math.min(100, reputation + 3);
      }
    } else {
      stadium = generateProceduralStadium(club.name, club.districtId, currentYear, rng);
    }

    return Object.freeze({
      ...club,
      reputation,
      president,
      stadium,
      historicalMilestones: Object.freeze(milestones),
    });
  });

  return { updatedClubs: Object.freeze(updatedClubs), events: Object.freeze(events) };
}
