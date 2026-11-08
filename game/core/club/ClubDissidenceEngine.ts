import type { CampaignRng } from '../CampaignRng';
import type { GameDate } from '../HistoricalClock';
import type { CrestShape } from './ClubIdentity';
import type { ClubColors, FoundingOrigin } from './Club';
import type { LocalClubState, LocalClubMilestone } from './ClubBirthEngine';
import { generateAIDirectorProfile } from './AIClubDirector';

export type DissidenceCause =
  | 'aristocratic_elitism'
  | 'professionalism_dispute'
  | 'election_schism'
  | 'statute_rebellion'
  | 'athletic_mutiny';

export interface DissidenceContext {
  readonly parentClubId: string;
  readonly parentClubName: string;
  readonly cause: DissidenceCause;
  readonly date: Readonly<GameDate>;
  readonly leaderName: string;
  readonly reasonText: string;
}

export interface DissidenceResult {
  readonly dissidenceOccurred: boolean;
  readonly dissidence?: DissidenceContext;
  readonly newClub?: LocalClubState;
  readonly updatedParentMilestone?: LocalClubMilestone;
}

const DISSIDENCE_DESCRIPTIONS: Record<DissidenceCause, { title: string; desc: string }> = {
  aristocratic_elitism: {
    title: 'Cisma contra o Elitismo Aristocrático',
    desc: 'Um grupo combativo de sócios operários e estudantes rompeu com a diretoria aristocrática após restrições classistas, deliberando pela criação imediata de uma nova agremiação verdadeiramente popular.',
  },
  professionalism_dispute: {
    title: 'Racha pela Ajuda de Custo aos Atletas',
    desc: 'Divergência irreconciliável sobre indenizações financeiras e estipêndios a jogadores operários causou o rompimento formal da ala pragmática com a bancada do amadorismo estrito.',
  },
  election_schism: {
    title: 'Cisão Estatutária Pós-Eleitoral',
    desc: 'Acusações veementes de manipulação na contagem de votos da assembleia geral provocaram a retirada em massa da chapa opositora, que jurou fundar um clube rival autêntico.',
  },
  statute_rebellion: {
    title: 'Revolta contra Reforma Estatutária',
    desc: 'Tentativa da presidência de restringir o direito de voto aos sócios fundadores detonou revolta interna e a debandada de dezenas de associados para criar um novo grêmio.',
  },
  athletic_mutiny: {
    title: 'Motim do Quadro de Atletas',
    desc: 'Insatisfeitos com o tratamento da comissão e exigindo melhores condições de campo e uniforme, os principais futebolistas do primeiro quadro racharam com o clube matriz.',
  },
};

const DISSIDENCE_PREFIXES = [
  'Sport Club',
  'Grêmio Esportivo',
  'União',
  'Comercial',
  'Operário',
  'Atlético Clube',
  'Independente',
];

/**
 * Deterministically evaluates whether a local club experiences an internal dissidence.
 */
export function evaluateClubDissidence(
  parentClub: LocalClubState,
  currentDate: Readonly<GameDate>,
  rng: CampaignRng,
  existingClubIds: ReadonlySet<string>
): DissidenceResult {
  // A club can only experience a schism if it's in the early era (<= 1925), active,
  // has existed for at least 3 years, has never suffered a prior dissidence,
  // and the city has not reached the local club cap (12) or experienced another dissidence.
  if (currentDate.year > 1925 || existingClubIds.size >= 12) {
    return { dissidenceOccurred: false };
  }

  const ageYears = currentDate.year - parentClub.foundationDate.year;
  if (ageYears < 3 || parentClub.status !== 'active') {
    return { dissidenceOccurred: false };
  }

  const hasPriorDissidence = parentClub.historicalMilestones.some(
    (m) => m.title.toLowerCase().includes('cisma') || m.description.toLowerCase().includes('rompeu')
  );
  if (hasPriorDissidence) {
    return { dissidenceOccurred: false };
  }

  const stream = rng.club;

  // Check propensity based on director archetype & reputation (realistic historical 2-8% rate)
  let schismChancePercent = 0.02;
  if (parentClub.directorProfile.archetype === 'aristocratic_exclusive') {
    schismChancePercent += 0.03;
  } else if (parentClub.directorProfile.archetype === 'traditionalist_amateur') {
    schismChancePercent += 0.02;
  }

  if (parentClub.directorProfile.aggressiveness > 70) {
    schismChancePercent += 0.02;
  }
  if (parentClub.directorProfile.financialPrudence < 35) {
    schismChancePercent += 0.01;
  }

  // Base threshold test
  const roll = stream.next();
  if (roll > schismChancePercent) {
    return { dissidenceOccurred: false };
  }

  // Determine cause
  const causes: DissidenceCause[] = [
    'aristocratic_elitism',
    'professionalism_dispute',
    'election_schism',
    'statute_rebellion',
    'athletic_mutiny',
  ];
  const causeIndex = Math.floor(stream.next() * causes.length);
  const cause = causes[causeIndex] ?? 'election_schism';

  // Deterministic leader name
  const firstNames = ['Alberto', 'Artur', 'Dante', 'Ernesto', 'Guilherme', 'Horácio', 'Mário', 'Octávio', 'Raul', 'Waldemar'];
  const lastNames = ['Drummond', 'Guimarães', 'Lacerda', 'Menezes', 'Nogueira', 'Peixoto', 'Resende', 'Silveira', 'Teixeira'];
  const leaderFirstName = firstNames[Math.floor(stream.next() * firstNames.length)] ?? 'Alberto';
  const leaderLastName = lastNames[Math.floor(stream.next() * lastNames.length)] ?? 'Menezes';
  const leaderName = `${leaderFirstName} ${leaderLastName}`;

  const info = DISSIDENCE_DESCRIPTIONS[cause];

  // Derive new club details
  const prefix = DISSIDENCE_PREFIXES[Math.floor(stream.next() * DISSIDENCE_PREFIXES.length)] ?? 'Independente';
  const baseName = parentClub.name.replace(/^(Sport Club|Associação Atlética|Clube Atlético|Villa Nova|Combinado|Grêmio) /i, '').trim();
  const rawNewName = `${prefix} ${baseName}`;
  const shortName = `${prefix.slice(0, 3)}. ${baseName}`.slice(0, 18);

  // Generate safe unique ID
  let candidateId = `club_diss_${parentClub.id}_${currentDate.year}`;
  let suffixCounter = 1;
  while (existingClubIds.has(candidateId)) {
    candidateId = `club_diss_${parentClub.id}_${currentDate.year}_${suffixCounter}`;
    suffixCounter += 1;
  }

  // Colors: invert or contrast parent
  const contrastColors: ClubColors[] = [
    { primary: '#b71c1c', secondary: '#ffffff' }, // Vermelho e Branco
    { primary: '#0d47a1', secondary: '#ffffff' }, // Azul e Branco
    { primary: '#1b5e20', secondary: '#ffffff' }, // Verde e Branco
    { primary: '#212121', secondary: '#ffb300' }, // Preto e Dourado
    { primary: '#4a148c', secondary: '#ffffff' }, // Roxo e Branco
  ];
  const colorIndex = Math.floor(stream.next() * contrastColors.length);
  const colors = contrastColors[colorIndex] ?? { primary: '#b71c1c', secondary: '#ffffff' };

  const shapes: CrestShape[] = ['stripes', 'diamond', 'circle', 'swiss', 'sash'];
  const crestShape = shapes[Math.floor(stream.next() * shapes.length)] ?? 'diamond';

  // Origins: dissidents often represent workers or students
  const origins: FoundingOrigin[] = ['workers', 'students', 'merchants'];
  const origin = origins[Math.floor(stream.next() * origins.length)] ?? 'workers';

  // New club director
  const directorProfile = generateAIDirectorProfile(origin, rng, currentDate.year);

  const newClubMilestone: LocalClubMilestone = {
    date: { ...currentDate },
    title: 'Fundação por Dissidência Histórica',
    description: `Agremiação fundada por ala dissidente liderada por ${leaderName}, rompida com o ${parentClub.name}. Causa: ${info.desc}`,
  };

  const updatedParentMilestone: LocalClubMilestone = {
    date: { ...currentDate },
    title: `Cisma Interno: Fundação do ${rawNewName}`,
    description: `Em grave assembleia, a ala liderada por ${leaderName} rompeu com o conselho em virtude de divergências sobre ${info.title.toLowerCase()}, fundando o rival ${rawNewName}.`,
  };

  const newClub: LocalClubState = {
    id: candidateId,
    name: rawNewName,
    shortName,
    foundationDate: { ...currentDate },
    foundationReason: 'dissidence',
    districtId: parentClub.districtId,
    origin,
    colors,
    crestShape,
    reputation: Math.max(15, Math.floor(parentClub.reputation * 0.65)),
    status: 'active',
    finances: {
      cashBalancePpu: Math.max(200, Math.floor(parentClub.finances.cashBalancePpu * 0.25)),
      monthlyBudgetPpu: Math.max(40, Math.floor(parentClub.finances.monthlyBudgetPpu * 0.35)),
    },
    facilities: ['Campo de Terra Batida'],
    directorProfile,
    squadSummary: {
      totalPlayers: 13,
      averageRating: Math.max(30, parentClub.squadSummary.averageRating - 4),
    },
    historicalMilestones: [newClubMilestone],
    parentClubId: parentClub.id,
    dissidenceCause: cause,
  };

  const dissidenceContext: DissidenceContext = {
    parentClubId: parentClub.id,
    parentClubName: parentClub.name,
    cause,
    date: { ...currentDate },
    leaderName,
    reasonText: info.desc,
  };

  return {
    dissidenceOccurred: true,
    dissidence: dissidenceContext,
    newClub,
    updatedParentMilestone,
  };
}
