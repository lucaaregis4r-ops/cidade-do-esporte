/**
 * Person domain model (Alpha D: D1, D2).
 * Contract according to PLANO MESTRE DE IMPLEMENTAÇÃO.
 * Represents materialized individuals (L2) in Cidade de Minas with genealogy,
 * social traits, occupation, biographical history, and club affinities.
 */

import type { GameDate } from '../HistoricalClock';
import type { SocialClass } from '../club/FoundingGroup';
import type { RngStream } from '../CampaignRng';

export interface PersonTraits {
  readonly leadership: number;      // 0–100
  readonly ambition: number;        // 0–100
  readonly traditionalism: number;  // 0–100 (conservative vs modernizer)
  readonly sociability: number;     // 0–100
  readonly honesty: number;         // 0–100
  readonly passion: number;         // 0–100
}

export interface CareerEntry {
  readonly startYear: number;
  readonly endYear?: number;
  readonly title: string;
  readonly organization: string;
  readonly description?: string;
}

export interface ClubRoleEntry {
  readonly clubId: string;
  readonly role: string;
  readonly startYear: number;
  readonly endYear?: number;
}

export interface PersonRelationship {
  readonly targetPersonId: string;
  readonly relationshipType: 'friend' | 'rival' | 'colleague' | 'protege' | 'patron';
  readonly strength: number; // 0–100
}

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly birthDate: Readonly<GameDate>;
  readonly deathDate?: Readonly<GameDate>;
  readonly parents: readonly string[]; // IDs of Person
  readonly children: readonly string[]; // IDs of Person
  readonly partnerId?: string;
  readonly districtId: string;
  readonly occupation: string;
  readonly economicClass: SocialClass;
  readonly wealthIndex: number; // 0–100
  readonly footballInterest: number; // 0–100
  readonly clubAffinities: Readonly<Record<string, number>>; // clubId -> 0–100
  readonly reputation: number; // 0–100
  readonly traits: Readonly<PersonTraits>;
  readonly relationships: readonly PersonRelationship[];
  readonly careerHistory: readonly CareerEntry[];
  readonly clubHistory: readonly ClubRoleEntry[];
  readonly eventHistory: readonly string[]; // IDs in HistoricalLedger
  readonly biography: string;
}

export interface CreatePersonInput {
  id: string;
  name: string;
  birthDate: GameDate;
  deathDate?: GameDate;
  parents?: readonly string[];
  children?: readonly string[];
  partnerId?: string;
  districtId: string;
  occupation: string;
  economicClass: SocialClass;
  wealthIndex?: number;
  footballInterest?: number;
  clubAffinities?: Readonly<Record<string, number>>;
  reputation?: number;
  traits?: Partial<PersonTraits>;
  relationships?: readonly PersonRelationship[];
  careerHistory?: readonly CareerEntry[];
  clubHistory?: readonly ClubRoleEntry[];
  eventHistory?: readonly string[];
  biography?: string;
}

/**
 * Validates a Person entity defensively.
 */
export function validatePerson(person: unknown): person is Person {
  if (!person || typeof person !== 'object') return false;
  const p = person as Record<string, unknown>;

  if (typeof p.id !== 'string' || p.id.trim() === '') return false;
  if (typeof p.name !== 'string' || p.name.trim() === '') return false;
  if (!p.birthDate || typeof p.birthDate !== 'object') return false;
  const bd = p.birthDate as Record<string, unknown>;
  if (typeof bd.year !== 'number' || typeof bd.month !== 'number' || typeof bd.day !== 'number') return false;

  if (!Array.isArray(p.parents)) return false;
  if (!Array.isArray(p.children)) return false;
  if (typeof p.districtId !== 'string') return false;
  if (typeof p.occupation !== 'string') return false;
  if (typeof p.wealthIndex !== 'number' || p.wealthIndex < 0 || p.wealthIndex > 100) return false;
  if (typeof p.footballInterest !== 'number' || p.footballInterest < 0 || p.footballInterest > 100) return false;
  if (!p.traits || typeof p.traits !== 'object') return false;

  return true;
}

/**
 * Factory for creating immutable Person instances.
 */
export function createPerson(input: CreatePersonInput): Person {
  const p: Person = {
    id: input.id,
    name: input.name,
    birthDate: Object.freeze({ ...input.birthDate }),
    deathDate: input.deathDate ? Object.freeze({ ...input.deathDate }) : undefined,
    parents: Object.freeze(input.parents ? [...input.parents] : []),
    children: Object.freeze(input.children ? [...input.children] : []),
    partnerId: input.partnerId,
    districtId: input.districtId,
    occupation: input.occupation,
    economicClass: input.economicClass,
    wealthIndex: Math.max(0, Math.min(100, input.wealthIndex ?? 50)),
    footballInterest: Math.max(0, Math.min(100, input.footballInterest ?? 50)),
    clubAffinities: Object.freeze({ ...(input.clubAffinities ?? {}) }),
    reputation: Math.max(0, Math.min(100, input.reputation ?? 50)),
    traits: Object.freeze({
      leadership: Math.max(0, Math.min(100, input.traits?.leadership ?? 50)),
      ambition: Math.max(0, Math.min(100, input.traits?.ambition ?? 50)),
      traditionalism: Math.max(0, Math.min(100, input.traits?.traditionalism ?? 50)),
      sociability: Math.max(0, Math.min(100, input.traits?.sociability ?? 50)),
      honesty: Math.max(0, Math.min(100, input.traits?.honesty ?? 50)),
      passion: Math.max(0, Math.min(100, input.traits?.passion ?? 50)),
    }),
    relationships: Object.freeze(input.relationships ? [...input.relationships] : []),
    careerHistory: Object.freeze(input.careerHistory ? [...input.careerHistory] : []),
    clubHistory: Object.freeze(input.clubHistory ? [...input.clubHistory] : []),
    eventHistory: Object.freeze(input.eventHistory ? [...input.eventHistory] : []),
    biography: input.biography ?? `${input.name}, morador de ${input.districtId}, atuando como ${input.occupation}.`,
  };

  if (!validatePerson(p)) {
    throw new Error(`Invalid Person data for id ${input.id}`);
  }

  return Object.freeze(p);
}

const HISTORICAL_SURNAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos',
  'Guimarães', 'Barreto', 'Magalhães', 'Drummond', 'Brandão', 'Lacerda', 'Macedo',
];

const HISTORICAL_FIRST_NAMES_M = [
  'Antônio', 'José', 'João', 'Francisco', 'Manoel', 'Pedro', 'Carlos', 'Luiz',
  'Sebastião', 'Paulo', 'Joaquim', 'Benedito', 'Arthur', 'Vicente', 'Affonso',
  'Raul', 'Alberto', 'Henrique', 'Eduardo', 'Octavio', 'Gastão', 'Bernardo',
];

const HISTORICAL_FIRST_NAMES_F = [
  'Maria', 'Ana', 'Francisca', 'Antônia', 'Rita', 'Benedita', 'Conceição',
  'Helena', 'Alice', 'Laura', 'Amélia', 'Carmem', 'Guiomar', 'Judith', 'Zulmira',
];

/**
 * Creates parent records for a person to establish genealogies prior to 1910 (D1).
 * All generations use the CampaignRng population stream deterministically.
 */
export function generateGenealogyForPerson(
  person: Person,
  rng: RngStream,
): readonly Person[] {
  const result: Person[] = [];

  // Determine father's surname from person's name or pick one
  const nameParts = person.name.split(' ');
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Silva';

  const fatherBirthYear = person.birthDate.year - (24 + Math.floor(rng.next() * 12));
  const motherBirthYear = person.birthDate.year - (20 + Math.floor(rng.next() * 10));

  const fatherFirstName = HISTORICAL_FIRST_NAMES_M[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_M.length)];
  const motherFirstName = HISTORICAL_FIRST_NAMES_F[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_F.length)];
  const motherMaidenName = HISTORICAL_SURNAMES[Math.floor(rng.next() * HISTORICAL_SURNAMES.length)];

  const fatherId = `per-gen-${person.id}-father`;
  const motherId = `per-gen-${person.id}-mother`;

  // Determine if parents are still living in 1910
  const fatherDeathYear = fatherBirthYear + (50 + Math.floor(rng.next() * 25));
  const motherDeathYear = motherBirthYear + (52 + Math.floor(rng.next() * 28));

  const fatherDeathDate: GameDate | undefined = fatherDeathYear <= 1910
    ? { year: fatherDeathYear, month: 1 + Math.floor(rng.next() * 12), day: 1 + Math.floor(rng.next() * 28) }
    : undefined;

  const motherDeathDate: GameDate | undefined = motherDeathYear <= 1910
    ? { year: motherDeathYear, month: 1 + Math.floor(rng.next() * 12), day: 1 + Math.floor(rng.next() * 28) }
    : undefined;

  const father = createPerson({
    id: fatherId,
    name: `${fatherFirstName} ${surname}`,
    birthDate: { year: fatherBirthYear, month: 1 + Math.floor(rng.next() * 12), day: 1 + Math.floor(rng.next() * 28) },
    deathDate: fatherDeathDate,
    children: [person.id],
    partnerId: motherId,
    districtId: person.districtId,
    occupation: person.economicClass === 'elite' ? 'Fazendeiro e capitalista' : 'Comerciante e chefe de família',
    economicClass: person.economicClass,
    wealthIndex: person.wealthIndex,
    footballInterest: Math.floor(rng.next() * 30), // Elders in 1910 had lower interest
    reputation: 60,
    biography: `Pai de ${person.name}, patriarca estabelecido na região antes da fundação da capital.`,
  });

  const mother = createPerson({
    id: motherId,
    name: `${motherFirstName} ${motherMaidenName} ${surname}`,
    birthDate: { year: motherBirthYear, month: 1 + Math.floor(rng.next() * 12), day: 1 + Math.floor(rng.next() * 28) },
    deathDate: motherDeathDate,
    children: [person.id],
    partnerId: fatherId,
    districtId: person.districtId,
    occupation: 'Prendas domésticas e matriarca',
    economicClass: person.economicClass,
    wealthIndex: person.wealthIndex,
    footballInterest: Math.floor(rng.next() * 20),
    reputation: 55,
    biography: `Mãe de ${person.name}, responsável pela gestão do lar e raízes familiares em Minas Gerais.`,
  });

  result.push(father, mother);
  return Object.freeze(result);
}

export interface GeneratedFamilyBundle {
  readonly parents: readonly Person[];
  readonly partner?: Person;
  readonly children: readonly Person[];
  readonly siblings: readonly Person[];
}

/**
 * Generates generational transmission of club affinities and football passion (D3).
 * Children inherit club loyalty and cultural habits from parents, with slight variance.
 */
export function transmitGenerationalClubAffinities(
  parentAffinities: readonly Readonly<Record<string, number>>[],
  rng: RngStream,
): Record<string, number> {
  const result: Record<string, number> = {};
  const clubIds = new Set<string>();

  for (const affs of parentAffinities) {
    for (const clubId of Object.keys(affs)) {
      clubIds.add(clubId);
    }
  }

  for (const clubId of clubIds) {
    let sum = 0;
    let count = 0;
    for (const affs of parentAffinities) {
      if (affs[clubId] !== undefined) {
        sum += affs[clubId];
        count++;
      }
    }
    const baseAffinity = count > 0 ? sum / count : 50;
    // Slight generational divergence (-10 to +10)
    const variance = Math.floor(rng.next() * 21) - 10;
    result[clubId] = Math.max(0, Math.min(100, Math.round(baseAffinity + variance)));
  }

  return result;
}

/**
 * Creates extended family (partner, children, siblings) for founders who are adults in 1910 (D3).
 * Implements bidirectional linkages and generational transmission of club loyalty.
 */
export function generateFamilyForFounder(
  founder: Person,
  parents: readonly Person[],
  rng: RngStream,
): GeneratedFamilyBundle {
  const children: Person[] = [];
  const siblings: Person[] = [];
  let partner: Person | undefined;

  const founderAgeIn1910 = 1910 - founder.birthDate.year;
  const nameParts = founder.name.split(' ');
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Silva';

  // 1. Generate partner if adult (>= 23 years old)
  if (founderAgeIn1910 >= 23) {
    const partnerId = `per-gen-${founder.id}-partner`;
    const partnerBirthYear = founder.birthDate.year + (Math.floor(rng.next() * 5) - 2);
    const partnerFirstName = HISTORICAL_FIRST_NAMES_F[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_F.length)];
    const partnerMaidenName = HISTORICAL_SURNAMES[Math.floor(rng.next() * HISTORICAL_SURNAMES.length)];

    partner = createPerson({
      id: partnerId,
      name: `${partnerFirstName} ${partnerMaidenName} ${surname}`,
      birthDate: {
        year: partnerBirthYear,
        month: 1 + Math.floor(rng.next() * 12),
        day: 1 + Math.floor(rng.next() * 28),
      },
      partnerId: founder.id,
      districtId: founder.districtId,
      occupation: founder.economicClass === 'elite' ? 'Dona de terras e prendas finas' : 'Prendas domésticas e comércio',
      economicClass: founder.economicClass,
      wealthIndex: founder.wealthIndex,
      footballInterest: Math.max(10, Math.round(founder.footballInterest * 0.6)),
      clubAffinities: { ...(founder.clubAffinities ?? { 'club-main': 80 }) },
      reputation: Math.round(founder.reputation * 0.9),
      biography: `Esposa de ${founder.name}, incentivadora da vida associativa e das reuniões do clube.`,
    });

    // 2. Generate children if married and age >= 25
    if (founderAgeIn1910 >= 25) {
      const numChildren = 1 + Math.floor(rng.next() * 2); // 1 to 2 children
      for (let i = 0; i < numChildren; i++) {
        const childId = `per-gen-${founder.id}-child-${i + 1}`;
        const childBirthYear = founder.birthDate.year + 22 + (i * 2) + Math.floor(rng.next() * 3);
        if (childBirthYear <= 1910) {
          const isBoy = rng.next() > 0.5;
          const firstName = isBoy
            ? HISTORICAL_FIRST_NAMES_M[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_M.length)]
            : HISTORICAL_FIRST_NAMES_F[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_F.length)];

          const inheritedAffinities = transmitGenerationalClubAffinities(
            [founder.clubAffinities, partner.clubAffinities],
            rng,
          );

          const child = createPerson({
            id: childId,
            name: `${firstName} ${surname}`,
            birthDate: {
              year: childBirthYear,
              month: 1 + Math.floor(rng.next() * 12),
              day: 1 + Math.floor(rng.next() * 28),
            },
            parents: [founder.id, partnerId],
            districtId: founder.districtId,
            occupation: isBoy && childBirthYear <= 1895 ? 'Aprendiz e estudante' : 'Estudante',
            economicClass: founder.economicClass,
            wealthIndex: founder.wealthIndex,
            footballInterest: Math.max(30, Math.min(100, Math.round(founder.footballInterest * 0.85 + (rng.next() * 20 - 10)))),
            clubAffinities: inheritedAffinities,
            reputation: 40,
            biography: `Filho(a) de ${founder.name}. Cresceu acompanhando os primeiros passos do clube em Belo Horizonte.`,
          });
          children.push(child);
        }
      }
    }
  }

  // 3. Generate a sibling from same parents
  if (parents.length >= 2) {
    const father = parents[0];
    const mother = parents[1];
    const siblingId = `per-gen-${founder.id}-sibling-1`;
    const siblingBirthYear = founder.birthDate.year + (rng.next() > 0.5 ? 2 : -2);
    const isBrother = rng.next() > 0.5;
    const sibFirstName = isBrother
      ? HISTORICAL_FIRST_NAMES_M[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_M.length)]
      : HISTORICAL_FIRST_NAMES_F[Math.floor(rng.next() * HISTORICAL_FIRST_NAMES_F.length)];

    const sibling = createPerson({
      id: siblingId,
      name: `${sibFirstName} ${surname}`,
      birthDate: {
        year: siblingBirthYear,
        month: 1 + Math.floor(rng.next() * 12),
        day: 1 + Math.floor(rng.next() * 28),
      },
      parents: [father.id, mother.id],
      districtId: founder.districtId,
      occupation: founder.occupation,
      economicClass: founder.economicClass,
      wealthIndex: founder.wealthIndex,
      footballInterest: Math.max(20, Math.round(founder.footballInterest * 0.75)),
      clubAffinities: { ...(founder.clubAffinities ?? { 'club-main': 75 }) },
      reputation: 50,
      biography: `Irmão/irmã de ${founder.name}, membro da família que acompanhou a fundação da agremiação.`,
    });
    siblings.push(sibling);
  }

  return Object.freeze({
    parents,
    partner,
    children: Object.freeze(children),
    siblings: Object.freeze(siblings),
  });
}
