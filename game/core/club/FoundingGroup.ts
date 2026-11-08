import { CampaignRng, hashSeed } from '../CampaignRng';
import { type FoundingOrigin, FOUNDING_ORIGINS } from './Club';

export type SocialClass = 'working_class' | 'middle_class' | 'upper_class' | 'elite';

export type FoundingRole =
  | 'president'
  | 'secretary'
  | 'treasurer'
  | 'captain'
  | 'counselor'
  | 'benefactor';

export interface FoundingMember {
  readonly id: string;
  readonly name: string;
  readonly role: FoundingRole;
  readonly roleLabel: string;
  readonly socialClass: SocialClass;
  readonly occupation: string;
  readonly capitalContributionPPU: number;
  readonly biography: string;
}

export interface FoundingGroupProfile {
  readonly origin: FoundingOrigin;
  readonly originLabel: string;
  readonly originDescription: string;
  readonly typicalDistrict: string;
  readonly socialIdentityFocus: string;
  readonly baseCapitalPPU: number;
  readonly baseReputation: number;
}

export interface FoundingGroup {
  readonly origin: FoundingOrigin;
  readonly originLabel: string;
  readonly foundingYear: number;
  readonly profile: Readonly<FoundingGroupProfile>;
  readonly members: readonly FoundingMember[];
  readonly leader: Readonly<FoundingMember>;
  readonly totalInitialCapitalPPU: number;
  readonly foundingAta: string;
}

export interface GenerateFoundingGroupOptions {
  readonly foundingYear?: number;
  readonly memberCount?: number;
}

interface OriginDefinition {
  readonly origin: FoundingOrigin;
  readonly label: string;
  readonly description: string;
  readonly typicalDistrict: string;
  readonly socialIdentityFocus: string;
  readonly baseCapitalPPU: number;
  readonly baseReputation: number;
  readonly meetingPlaceTemplate: string;
  readonly occupations: readonly string[];
  readonly firstNames: readonly string[];
  readonly lastNames: readonly string[];
  readonly allowedClasses: readonly SocialClass[];
  readonly contributionRange: readonly [min: number, max: number];
}

const ORIGIN_DEFINITIONS: Readonly<Record<FoundingOrigin, OriginDefinition>> = {
  railway: {
    origin: 'railway',
    label: 'Ferroviários',
    description:
      'Fundado por maquinistas, telegrafistas e operários da Estrada de Ferro Central do Brasil e oficinas ferroviárias.',
    typicalDistrict: 'station',
    socialIdentityFocus: 'Comunidade ferroviária e trabalhadores dos trilhos',
    baseCapitalPPU: 15.0,
    baseReputation: 12,
    meetingPlaceTemplate: 'no barracão das oficinas da Estrada de Ferro, junto à estação de trens',
    occupations: [
      'Maquinista de locomotiva',
      'Fogista de caldeira',
      'Agente de estação',
      'Telegrafista da ferrovia',
      'Caldeireiro das oficinas',
      'Ajustador mecânico',
      'Guarda-freios da linha',
      'Mestre de turma de via permanente',
    ],
    firstNames: ['Antônio', 'Manoel', 'Joaquim', 'Benedito', 'Francisco', 'Sebastião', 'José', 'Geraldo', 'Raimundo', 'Aníbal'],
    lastNames: ['Pereira', 'dos Santos', 'Ferreira', 'de Souza', 'Ramos', 'Silveira', 'Custódio', 'Alvarenga', 'Nascimento', 'Pinheiro'],
    allowedClasses: ['working_class', 'working_class', 'working_class', 'middle_class'],
    contributionRange: [1.0, 3.5],
  },
  students: {
    origin: 'students',
    label: 'Estudantes',
    description:
      'Criado por jovens acadêmicos, universitários de Direito, Medicina e Farmácia e rapazes do Ginásio da cidade.',
    typicalDistrict: 'central',
    socialIdentityFocus: 'Juventude acadêmica, idealismo desportivo e círculos intelectuais',
    baseCapitalPPU: 25.0,
    baseReputation: 15,
    meetingPlaceTemplate: 'no salão de leitura do Grêmio Acadêmico, no centro cívico',
    occupations: [
      'Estudante de Ciências Jurídicas',
      'Acadêmico de Medicina',
      'Estudante de Farmácia',
      'Bacharelando em Letras',
      'Tipógrafo da Gazeta Estudantil',
      'Professor adjunto do Ginásio',
      'Secretário do Diretório Acadêmico',
      'Auxiliar de cartório e estudante',
    ],
    firstNames: ['Carlos', 'Álvaro', 'Otávio', 'Eduardo', 'Fernando', 'Milton', 'Paulo', 'Renato', 'Heitor', 'Raul'],
    lastNames: ['Mendes', 'de Castro', 'Alencar', 'Paes Leme', 'Prado', 'Vasconcelos', 'de Abreu', 'Magalhães', 'Carneiro', 'Fonseca'],
    allowedClasses: ['middle_class', 'middle_class', 'upper_class'],
    contributionRange: [2.5, 6.0],
  },
  immigrants: {
    origin: 'immigrants',
    label: 'Imigrantes',
    description:
      'Articulado por artesãos, mestres de obras e comerciantes de famílias de imigrantes recém-estabelecidos.',
    typicalDistrict: 'commercial',
    socialIdentityFocus: 'Colônias de imigrantes, socorro mútuo e solidariedade étnica',
    baseCapitalPPU: 20.0,
    baseReputation: 14,
    meetingPlaceTemplate: 'na sede social da Sociedade Beneficente dos Imigrantes',
    occupations: [
      'Mestre de obras e construtor',
      'Alfaiate de corte fino',
      'Padeiro e confeiteiro',
      'Funileiro industrial',
      'Comerciante de secos e molhados',
      'Mecânico de veículos',
      'Sapateiro e seleiro',
      'Marceneiro entalhador',
    ],
    firstNames: ['Giovanni', 'Luigi', 'Giuseppe', 'Antonio', 'Vicente', 'Pietro', 'Enrico', 'Matteo', 'Angelo', 'Salvatore'],
    lastNames: ['Rossi', 'Bianchi', 'Bonfanti', 'Moretti', 'Ferri', 'De Angelis', 'Bellini', 'Donatelli', 'Lombardi', 'Marchetti'],
    allowedClasses: ['working_class', 'middle_class', 'middle_class'],
    contributionRange: [2.0, 5.0],
  },
  workers: {
    origin: 'workers',
    label: 'Trabalhadores Operários',
    description:
      'Nascido no seio do operariado fabril das tecelagens, oficinas mecânicas e fábricas dos arrabaldes da cidade.',
    typicalDistrict: 'industrial',
    socialIdentityFocus: 'Base popular operária, bairros fabris e solidariedade de classe',
    baseCapitalPPU: 10.0,
    baseReputation: 10,
    meetingPlaceTemplate: 'no galpão operário de lazer contíguo à vila fabril da fiação',
    occupations: [
      'Tecelão fabril',
      'Fiandeiro de algodão',
      'Operário metalúrgico',
      'Ferreiro de fundição',
      'Carpinteiro de andaimes',
      'Curtidor de couros',
      'Trabalhador de olaria',
      'Carregador de armazém',
    ],
    firstNames: ['Raimundo', 'Sebastião', 'José', 'Severino', 'Claudionor', 'Valdemar', 'Benedito', 'João', 'Anacleto', 'Zacarias'],
    lastNames: ['Nonato', 'Galdino', 'Firmino', 'Dias', 'Alves', 'Gomes', 'da Silva', 'Marcolino', 'Vieira', 'Macedo'],
    allowedClasses: ['working_class'],
    contributionRange: [0.8, 2.2],
  },
  merchants: {
    origin: 'merchants',
    label: 'Comerciantes',
    description:
      'Organizado por comerciantes de armazéns, negociantes de café e lojistas de fazendas de tecido.',
    typicalDistrict: 'commercial',
    socialIdentityFocus: 'Burguesia comercial urbana, prestígio lojista e redes mercantis',
    baseCapitalPPU: 35.0,
    baseReputation: 18,
    meetingPlaceTemplate: 'na sala de assembleias da Associação Comercial da cidade',
    occupations: [
      'Atacadista de café e cereais',
      'Armazenista de mercadorias',
      'Lojista de fazendas e tecidos',
      'Guarda-livros de casa bancária',
      'Despachante comercial',
      'Representante de firmas da capital',
      'Farmacêutico proprietário',
      'Joalheiro e relojoeiro',
    ],
    firstNames: ['Afonso', 'Valdemar', 'Henrique', 'Olavo', 'Arthur', 'Tobias', 'Cândido', 'Belmiro', 'Firmino', 'Laurindo'],
    lastNames: ['Guimarães', 'Sampaio', 'Bastos', 'Nogueira', 'Coelho', 'Viana', 'Meireles', 'Cardoso', 'Barcellos', 'Macedo'],
    allowedClasses: ['middle_class', 'upper_class', 'upper_class'],
    contributionRange: [4.0, 9.0],
  },
  elite: {
    origin: 'elite',
    label: 'Elite Local',
    description:
      'Fundado por membros de famílias tradicionais, proprietários rurais, advogados de renome e autoridades cívicas.',
    typicalDistrict: 'central',
    socialIdentityFocus: 'Alta sociedade urbana, aristocracia rural e distinção de costumes',
    baseCapitalPPU: 60.0,
    baseReputation: 25,
    meetingPlaceTemplate: 'no salão nobre de recepções do Clube dos Cavalheiros da cidade',
    occupations: [
      'Fazendeiro e produtor de café',
      'Advogado e conselheiro forense',
      'Médico e lente de academia',
      'Diretor do Banco Provincial',
      'Engenheiro-chefe de obras públicas',
      'Magistrado e tabelião régio',
      'Capitalista e investidor urbano',
      'Deputado e bacharel em leis',
    ],
    firstNames: ['Eduardo', 'Arthur', 'Rodrigo', 'Henrique', 'Octávio', 'Paulo', 'Gustavo', 'Caio', 'Bernardo', 'Gastão'],
    lastNames: ['de Prado', 'Silveira da Mota', 'de Carvalho e Souza', 'Antunes da Rocha', 'Peixoto de Resende', 'Cerqueira', 'Cunha Bueno', 'de Toledo', 'Ribeiro de Andrada', 'Pacheco'],
    allowedClasses: ['upper_class', 'elite', 'elite'],
    contributionRange: [8.0, 18.0],
  },
};

const ROLE_LABELS: Readonly<Record<FoundingRole, string>> = {
  president: 'Presidente Provisório',
  secretary: '1º Secretário',
  treasurer: 'Tesoureiro',
  captain: '1º Capitão de Campo',
  counselor: 'Conselheiro Fundador',
  benefactor: 'Sócio Benfeitor',
};

export function getAllFoundingOrigins(): readonly FoundingOrigin[] {
  return FOUNDING_ORIGINS;
}

export function getFoundingGroupProfile(origin: FoundingOrigin): FoundingGroupProfile {
  if (!FOUNDING_ORIGINS.includes(origin)) {
    throw new TypeError(`Invalid founding origin: ${origin}`);
  }
  const def = ORIGIN_DEFINITIONS[origin];
  return Object.freeze({
    origin: def.origin,
    originLabel: def.label,
    originDescription: def.description,
    typicalDistrict: def.typicalDistrict,
    socialIdentityFocus: def.socialIdentityFocus,
    baseCapitalPPU: def.baseCapitalPPU,
    baseReputation: def.baseReputation,
  });
}

/** Generates a deterministic FoundingGroup for a given origin using the campaign's club stream. */
export function generateFoundingGroup(
  origin: FoundingOrigin,
  rng: CampaignRng,
  options: GenerateFoundingGroupOptions = {},
): FoundingGroup {
  if (!FOUNDING_ORIGINS.includes(origin)) {
    throw new TypeError(`Invalid founding origin: ${origin}`);
  }
  if (!rng || typeof rng !== 'object' || !rng.club) {
    throw new TypeError('CampaignRng with a valid club stream is required');
  }

  const foundingYear = options.foundingYear ?? 1910;
  if (!Number.isInteger(foundingYear) || foundingYear < 1910 || foundingYear > 1959) {
    throw new RangeError('Founding year must be between 1910 and 1959');
  }

  const def = ORIGIN_DEFINITIONS[origin];
  const memberCount = options.memberCount ?? 6;
  if (!Number.isInteger(memberCount) || memberCount < 5 || memberCount > 10) {
    throw new RangeError('memberCount must be an integer between 5 and 10');
  }

  // Draw deterministic elements using ONLY rng.club
  const pick = <T>(list: readonly T[]): T => {
    const idx = Math.floor(rng.club.next() * list.length) % list.length;
    return list[idx];
  };

  const randPPU = (min: number, max: number): number => {
    const value = min + rng.club.next() * (max - min);
    return Math.round(value * 10) / 10;
  };

  // Fixed role distribution
  const roles: FoundingRole[] = ['president', 'secretary', 'treasurer', 'captain'];
  for (let i = 4; i < memberCount; i++) {
    roles.push(origin === 'elite' || origin === 'merchants' ? 'benefactor' : 'counselor');
  }

  const members: FoundingMember[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < memberCount; i++) {
    let fullName = '';
    let attempts = 0;
    while ((!fullName || usedNames.has(fullName)) && attempts < 20) {
      const first = pick(def.firstNames);
      const last = pick(def.lastNames);
      fullName = `${first} ${last}`;
      attempts++;
    }
    if (usedNames.has(fullName)) {
      fullName = `${fullName} Filho`;
    }
    usedNames.add(fullName);

    const role = roles[i];
    const roleLabel = ROLE_LABELS[role];
    const occupation = pick(def.occupations);
    const socialClass = pick(def.allowedClasses);
    const contributionPPU = randPPU(def.contributionRange[0], def.contributionRange[1]);
    const idHash = hashSeed(`${rng.worldSeed}-${origin}-${i}-${fullName}`).toString(16);
    const id = `founder-${origin}-${i + 1}-${idHash}`;

    let biography: string;
    switch (role) {
      case 'president':
        biography = `${occupation}. Eleito para conduzir a assembleia de fundação e redigir as primeiras bases regimentais do clube.`;
        break;
      case 'secretary':
        biography = `${occupation}. Responsável pela lavratura da ata de fundação e comunicação aos jornais e autoridades.`;
        break;
      case 'treasurer':
        biography = `${occupation}. Encarregado da guarda das primeiras subscrições e do livro de tesouraria do grêmio.`;
        break;
      case 'captain':
        biography = `${occupation}. Encarregado de adquirir a primeira bola de couro e organizar o primeiro quadro de atletas.`;
        break;
      case 'benefactor':
        biography = `${occupation}. Contribuiu com subscrição expressiva para a garantia dos primeiros compromissos do clube.`;
        break;
      default:
        biography = `${occupation}. Presente à reunião inaugural, subscrevendo seu nome no termo inaugural de fundação.`;
        break;
    }

    members.push(
      Object.freeze({
        id,
        name: fullName,
        role,
        roleLabel,
        socialClass,
        occupation,
        capitalContributionPPU: contributionPPU,
        biography,
      }),
    );
  }

  const leader = members[0];
  const membersSumPPU = members.reduce((sum, m) => sum + m.capitalContributionPPU, 0);
  const totalInitialCapitalPPU = Math.round((def.baseCapitalPPU + membersSumPPU) * 10) / 10;

  // Build formal founding ata
  const otherMembersList = members
    .slice(1)
    .map((m) => `${m.name} (${m.roleLabel}, ${m.occupation}, subscrição de ${m.capitalContributionPPU.toFixed(1)} PPU)`)
    .join(', ');

  const foundingAta =
    `Aos primeiros dias do ano de ${foundingYear}, na Cidade de Minas, reuniram-se ${def.meetingPlaceTemplate} ` +
    `os cidadãos entusiastas do desporto pedestre, sob a presidência provisória de ${leader.name} (${leader.occupation}). ` +
    `Assumindo os trabalhos, deliberou-se pela fundação de uma nova agremiação desportiva com raízes na comunidade de ${def.label.toLowerCase()}. ` +
    `Fizeram-se presentes e assinaram a ata inaugural: ${otherMembersList}. ` +
    `O fundo inicial apurado entre o pecúlio comum e as subscrições dos fundadores alcançou a quantia de ${totalInitialCapitalPPU.toFixed(1)} PPU, ` +
    `sendo lavrada a presente ata para constar na memória institucional da novel associação.`;

  const profile = getFoundingGroupProfile(origin);

  return Object.freeze({
    origin,
    originLabel: def.label,
    foundingYear,
    profile,
    members: Object.freeze(members),
    leader,
    totalInitialCapitalPPU,
    foundingAta,
  });
}

/** Defensive validator for FoundingGroup objects from storage or network. */
export function validateFoundingGroup(value: unknown): FoundingGroup | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<FoundingGroup>;

  if (typeof raw.origin !== 'string' || !FOUNDING_ORIGINS.includes(raw.origin as FoundingOrigin)) return null;
  if (typeof raw.originLabel !== 'string' || raw.originLabel.trim().length === 0) return null;
  if (!Number.isInteger(raw.foundingYear) || raw.foundingYear! < 1910 || raw.foundingYear! > 1959) return null;
  if (typeof raw.totalInitialCapitalPPU !== 'number' || !Number.isFinite(raw.totalInitialCapitalPPU) || raw.totalInitialCapitalPPU < 0) {
    return null;
  }
  if (typeof raw.foundingAta !== 'string' || raw.foundingAta.trim().length === 0) return null;

  if (!raw.profile || typeof raw.profile !== 'object' || raw.profile.origin !== raw.origin) return null;

  if (!Array.isArray(raw.members) || raw.members.length < 5) return null;

  const validatedMembers: FoundingMember[] = [];
  for (const m of raw.members) {
    if (!m || typeof m !== 'object') return null;
    if (typeof m.id !== 'string' || m.id.trim().length === 0) return null;
    if (typeof m.name !== 'string' || m.name.trim().length === 0) return null;
    if (typeof m.role !== 'string' || !(m.role in ROLE_LABELS)) return null;
    if (typeof m.roleLabel !== 'string' || m.roleLabel.trim().length === 0) return null;
    if (typeof m.occupation !== 'string' || m.occupation.trim().length === 0) return null;
    if (typeof m.capitalContributionPPU !== 'number' || !Number.isFinite(m.capitalContributionPPU) || m.capitalContributionPPU < 0) {
      return null;
    }
    if (typeof m.biography !== 'string' || m.biography.trim().length === 0) return null;

    validatedMembers.push(
      Object.freeze({
        id: m.id.trim(),
        name: m.name.trim(),
        role: m.role,
        roleLabel: m.roleLabel.trim(),
        socialClass: m.socialClass,
        occupation: m.occupation.trim(),
        capitalContributionPPU: m.capitalContributionPPU,
        biography: m.biography.trim(),
      }),
    );
  }

  const leader = validatedMembers[0];
  if (!leader || leader.role !== 'president') return null;

  return Object.freeze({
    origin: raw.origin as FoundingOrigin,
    originLabel: raw.originLabel.trim(),
    foundingYear: raw.foundingYear!,
    profile: Object.freeze({ ...raw.profile }),
    members: Object.freeze(validatedMembers),
    leader,
    totalInitialCapitalPPU: raw.totalInitialCapitalPPU,
    foundingAta: raw.foundingAta.trim(),
  });
}
