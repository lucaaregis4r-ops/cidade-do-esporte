import type { CampaignRng } from '../CampaignRng';
import type { GameDate } from '../HistoricalClock';
import type { LocalClubState } from '../club/ClubBirthEngine';
import type { RegionalClubState } from '../club/RegionalClub';
import type { ClubState } from '../club/Club';
import {
  type FederationState,
  type FederationBloc,
  type PresidencyTerm,
  type FederationStatutes,
  type ProfessionalismPolicy,
  type DissidentLeague,
  validateFederationState,
} from './Federation';

export interface FederationEvolutionResult {
  readonly updatedFederation: FederationState;
  readonly eventNotification?: {
    readonly id: string;
    readonly title: string;
    readonly description: string;
  };
}

const HISTORICAL_FEDERATION_PRESIDENTS = [
  'Dr. Celso Porfírio',
  'Alberto Drummond',
  'Dr. Paulo Azeredo',
  'Antônio Prado Guimarães',
  'Major Octávio Lacerda',
  'Ernesto de Oliveira',
  'Dr. Juscelino Resende',
];

/**
 * Deterministically initializes the Federation when conditions are met (~1914–1915).
 */
export function initializeFederation(
  currentDate: Readonly<GameDate>,
  localClubs: readonly LocalClubState[],
  regionalClubs: readonly RegionalClubState[],
  playerClub: ClubState | null,
  rng: CampaignRng
): FederationState {
  const stream = rng.federation;
  const foundingClubIds: string[] = [];

  if (playerClub) {
    foundingClubIds.push(playerClub.id);
  }
  for (const lc of localClubs) {
    if (lc.status === 'active') {
      foundingClubIds.push(lc.id);
    }
  }

  // Include nearby Central regional clubs if active (e.g. Sabará, Villa Nova)
  for (const rc of regionalClubs) {
    if (rc.region === 'Central' && rc.foundationYear <= currentDate.year) {
      foundingClubIds.push(rc.id);
    }
  }

  // Create initial political blocs
  const eliteMembers: string[] = [];
  const popularMembers: string[] = [];
  const pragmaticMembers: string[] = [];

  if (playerClub) {
    if (playerClub.foundingOrigin === 'elite') eliteMembers.push(playerClub.id);
    else if (playerClub.foundingOrigin === 'workers' || playerClub.foundingOrigin === 'railway') popularMembers.push(playerClub.id);
    else pragmaticMembers.push(playerClub.id);
  }

  for (const lc of localClubs) {
    if (lc.directorProfile.archetype === 'aristocratic_exclusive' || lc.origin === 'elite') {
      eliteMembers.push(lc.id);
    } else if (lc.directorProfile.archetype === 'community_neighborhood' || lc.origin === 'workers' || lc.origin === 'railway') {
      popularMembers.push(lc.id);
    } else {
      pragmaticMembers.push(lc.id);
    }
  }

  for (const rc of regionalClubs) {
    if (rc.region === 'Central' && rc.foundationYear <= currentDate.year) {
      if (rc.origin === 'elite') eliteMembers.push(rc.id);
      else popularMembers.push(rc.id);
    }
  }

  const blocs: FederationBloc[] = [
    {
      id: 'bloc_elite',
      name: 'Bancada Aristocrática dos Pioneiros',
      leaderClubId: eliteMembers[0] ?? localClubs[0]?.id ?? 'sport_mineiro',
      memberClubIds: eliteMembers.length > 0 ? eliteMembers : [localClubs[0]?.id ?? 'sport_mineiro'],
      ideology: 'aristocratic_conservation',
      influenceShare: 45,
    },
    {
      id: 'bloc_popular',
      name: 'Frente Popular dos Grêmios Operários e do Interior',
      leaderClubId: popularMembers[0] ?? localClubs[1]?.id ?? 'villa_nova',
      memberClubIds: popularMembers.length > 0 ? popularMembers : [localClubs[1]?.id ?? 'villa_nova'],
      ideology: 'popular_expansion',
      influenceShare: 55,
    },
  ];

  const firstPresName = HISTORICAL_FEDERATION_PRESIDENTS[Math.floor(stream.next() * HISTORICAL_FEDERATION_PRESIDENTS.length)] ?? 'Dr. Celso Porfírio';
  const firstTerm: PresidencyTerm = {
    id: `pres_${currentDate.year}`,
    presidentName: firstPresName,
    clubOfOriginId: foundingClubIds[0] ?? 'america',
    startYear: currentDate.year,
    endYear: currentDate.year + 2,
    platform: 'Organização da 1ª Divisão Oficial e Estatuto de Amadorismo',
    achievements: [
      'Aprovação da Carta Constitutiva da Liga Mineira',
      'Homologação dos campos de jogo com cercamento regulamentar',
    ],
  };

  const statutes: FederationStatutes = {
    votingSystem: 'one_club_one_vote',
    amateurismClause: 'strict_amateur',
    fieldRequirement: 'fenced_pitch_mandatory',
    disputeResolution: 'statutory_tribunal',
  };

  const professionalismPolicy: ProfessionalismPolicy = {
    tier: 'strict_amateur',
    sanctionsForBrownAmateurism: true,
    minimumWageMandatory: false,
  };

  const state: FederationState = {
    id: 'lmdt_oficial',
    name: 'Liga Mineira de Desportos Terrestres (LMDT)',
    shortName: 'LMDT',
    foundingDate: { ...currentDate },
    status: 'active',
    foundingClubs: foundingClubIds,
    affiliatedClubs: [...foundingClubIds],
    presidents: [firstTerm],
    statutes,
    blocs,
    competitions: [`camp_mineiro_${currentDate.year}`],
    professionalismPolicy,
    historicalEvents: [
      `${currentDate.day}/${currentDate.month}/${currentDate.year}: Fundação solene da Liga Mineira de Desportos Terrestres, reunindo as agremiações fundadoras.`,
    ],
  };

  return validateFederationState(state)!;
}

/**
 * Annual simulation step for the Federation.
 * Evaluates presidential elections, political schisms and reunions.
 */
export function stepFederationAnnual(
  federation: FederationState,
  currentDate: Readonly<GameDate>,
  localClubs: readonly LocalClubState[],
  rng: CampaignRng
): FederationEvolutionResult {
  const stream = rng.federation;
  const year = currentDate.year;
  const events = [...federation.historicalEvents];
  let status = federation.status;
  let dissidentLeague = federation.dissidentLeague;
  const presidents = [...federation.presidents];
  let notification: { id: string; title: string; description: string } | undefined;

  // 1. Check if current presidency term expired (every 2 years)
  const currentPresident = presidents[presidents.length - 1];
  if (currentPresident && year >= currentPresident.endYear) {
    // Hold presidential election between blocs
    const blocVoteRoll = stream.next();
    const winningBloc = blocVoteRoll < 0.5 ? federation.blocs[0] : federation.blocs[1];
    const newPresName = HISTORICAL_FEDERATION_PRESIDENTS[Math.floor(stream.next() * HISTORICAL_FEDERATION_PRESIDENTS.length)] ?? 'Dr. Alberto Guimarães';

    const newTerm: PresidencyTerm = {
      id: `pres_${year}`,
      presidentName: newPresName,
      clubOfOriginId: winningBloc?.leaderClubId ?? currentPresident.clubOfOriginId,
      startYear: year,
      endYear: year + 2,
      platform: winningBloc?.ideology === 'aristocratic_conservation'
        ? 'Defesa do rigor estatutário e preservação do amadorismo puro'
        : 'Inclusão de novos grêmios suburbanos e expansão do campeonato',
      achievements: [],
    };
    presidents.push(newTerm);

    const electionEvent = `01/01/${year}: Eleição Federativa — ${newPresName} é eleito presidente com apoio da ${winningBloc?.name ?? 'bancada majoritária'}.`;
    events.push(electionEvent);
    notification = {
      id: `fed_election_${year}`,
      title: `Eleição na Federação: ${newPresName}`,
      description: `Com o voto do Conselho de Clubes, ${newPresName} assume a presidência da ${federation.shortName} para o biênio ${year}–${year + 1}.`,
    };
  }

  // 2. Evaluate political schism (historical 1916 only, never repeats endlessly)
  const hasEverSufferedSchism = events.some((e) => e.includes('AMEA') || e.includes('Cisma Federativo'));
  if (status === 'active' && year === 1916 && !hasEverSufferedSchism) {
    // Schism breaks out strictly once in historical 1916!
    status = 'schism';
    const dissidentClubs = federation.affiliatedClubs.slice(Math.ceil(federation.affiliatedClubs.length / 2));
    const leaderClubId = dissidentClubs[0] ?? 'dissident_leader';

    dissidentLeague = {
      id: `dissident_league_${year}`,
      name: 'Associação Mineira de Esportes Athleticos (AMEA)',
      foundedYear: year,
      memberClubIds: dissidentClubs,
      leaderClubId,
      reason: 'Cisão estatutária motivada por divergências no julgamento de penas e divisão de bilheterias.',
    };

    const schismEvent = `15/03/${year}: Cisma Federativo — Insatisfeita com o tribunal de penas, a ala dissidente liderada pelo ${leaderClubId} rompe e cria a AMEA. Dois campeonatos paralelos são disputados neste ano.`;
    events.push(schismEvent);
    notification = {
      id: `fed_schism_${year}`,
      title: 'Cisma Federativo de 1916: Fundação da AMEA',
      description: `Racha político na Federação! Clubes dissidentes romperam com a ${federation.shortName} e fundaram a AMEA. Dois certames paralelos serão disputados na capital em ${year}!`,
    };
  } else if (status === 'schism' && year >= 1918) {
    // Reunion and peace pact in 1918 (definitive historical reunification)
    status = 'reunified';
    const reunionEvent = `20/04/${year}: Pacificação do Futebol Mineiro — ${federation.shortName} e AMEA assinam pacto solene de unificação, reconhecendo os títulos de ambos os lados e reunindo todos os clubes no mesmo campeonato oficial.`;
    events.push(reunionEvent);
    notification = {
      id: `fed_reunion_${year}`,
      title: 'Reunificação Histórica do Futebol Mineiro',
      description: `Pacto de Paz assinado! A ${federation.shortName} e a dissidente AMEA foram unificadas em definitivo sob uma única bandeira!`,
    };
    dissidentLeague = undefined;
  }

  // 3. Update affiliated clubs with newly born local clubs
  const currentAffiliated = new Set(federation.affiliatedClubs);
  for (const lc of localClubs) {
    if (lc.status === 'active' && !currentAffiliated.has(lc.id)) {
      currentAffiliated.add(lc.id);
      events.push(`Filiação oficial: ${lc.name} é admitido formalmente aos quadros da ${federation.shortName}.`);
    }
  }

  const updatedFederation: FederationState = {
    ...federation,
    status,
    presidents,
    affiliatedClubs: Array.from(currentAffiliated),
    historicalEvents: events,
    ...(dissidentLeague ? { dissidentLeague } : {}),
  };

  return {
    updatedFederation: validateFederationState(updatedFederation)!,
    eventNotification: notification,
  };
}
