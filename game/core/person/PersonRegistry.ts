/**
 * Person Registry & Store (Alpha D: D1, D2).
 * Manages materialized L2 people in the campaign, indexation by ID,
 * family relationships, and integration with World state.
 */

import type { GameDate } from '../HistoricalClock';
import type { FoundingGroup } from '../club/FoundingGroup';
import type { CampaignRng } from '../CampaignRng';
import {
  type Person,
  createPerson,
  generateGenealogyForPerson,
  generateFamilyForFounder,
  validatePerson,
} from './Person';

export interface FamilyTreeNode {
  readonly person: Person;
  readonly parents: readonly Person[];
  readonly partner?: Person;
  readonly children: readonly Person[];
  readonly siblings: readonly Person[];
}

export interface PersonRegistryState {
  readonly persons: Readonly<Record<string, Person>>;
  readonly count: number;
}

export class PersonRegistry {
  private persons: Map<string, Person> = new Map();

  constructor(initialState?: PersonRegistryState) {
    if (initialState) {
      for (const [id, p] of Object.entries(initialState.persons)) {
        if (validatePerson(p)) {
          this.persons.set(id, p);
        }
      }
    }
  }

  get(id: string): Person | undefined {
    return this.persons.get(id);
  }

  has(id: string): boolean {
    return this.persons.has(id);
  }

  getAll(): readonly Person[] {
    return Array.from(this.persons.values());
  }

  register(person: Person): void {
    this.persons.set(person.id, person);
  }

  /**
   * Retrieves the comprehensive family tree for a person (D3: Family & Generational Transmission).
   * Locates parents, partner, biological children, and siblings sharing parents.
   */
  getFamilyTree(personId: string): FamilyTreeNode | undefined {
    const person = this.persons.get(personId);
    if (!person) return undefined;

    const parents: Person[] = [];
    for (const parentId of person.parents) {
      const parent = this.persons.get(parentId);
      if (parent) parents.push(parent);
    }

    let partner: Person | undefined;
    if (person.partnerId) {
      partner = this.persons.get(person.partnerId);
    }
    if (!partner) {
      for (const p of this.persons.values()) {
        if (p.partnerId === person.id) {
          partner = p;
          break;
        }
      }
    }

    const children: Person[] = [];
    for (const childId of person.children) {
      const ch = this.persons.get(childId);
      if (ch) children.push(ch);
    }
    // Also check people whose parents list includes this person
    for (const p of this.persons.values()) {
      if (p.parents.includes(person.id) && !children.some((c) => c.id === p.id)) {
        children.push(p);
      }
    }

    const siblings: Person[] = [];
    if (person.parents.length > 0) {
      for (const p of this.persons.values()) {
        if (p.id !== person.id) {
          const sharesParent = p.parents.some((parentId) => person.parents.includes(parentId));
          if (sharesParent) {
            siblings.push(p);
          }
        }
      }
    }

    return Object.freeze({
      person,
      parents: Object.freeze(parents),
      partner,
      children: Object.freeze(children),
      siblings: Object.freeze(siblings),
    });
  }

  /**
   * Initializes the registry by materializing the club's FoundingGroup members
   * along with their parent genealogies and family networks (D1, D3).
   */
  bootstrapFounders(foundingGroup: FoundingGroup, rng: CampaignRng): void {
    const stream = rng.population;

    for (const fm of foundingGroup.members) {
      if (this.persons.has(fm.id)) continue;

      // Estimate age of founder in 1910 (between 18 and 38)
      const ageIn1910 = 18 + Math.floor(stream.next() * 20);
      const birthYear = foundingGroup.foundingYear - ageIn1910;
      const birthDate: GameDate = {
        year: birthYear,
        month: 1 + Math.floor(stream.next() * 12),
        day: 1 + Math.floor(stream.next() * 28),
      };

      const fatherId = `per-gen-${fm.id}-father`;
      const motherId = `per-gen-${fm.id}-mother`;

      const founderPerson = createPerson({
        id: fm.id,
        name: fm.name,
        birthDate,
        parents: [fatherId, motherId],
        districtId: foundingGroup.profile.typicalDistrict,
        occupation: fm.occupation,
        economicClass: fm.socialClass,
        wealthIndex: Math.min(100, Math.round(fm.capitalContributionPPU * 2.5) + 30),
        footballInterest: 95,
        clubAffinities: { 'club-main': 95 },
        reputation: 60,
        biography: fm.biography,
        clubHistory: [
          {
            clubId: 'club-main',
            role: fm.roleLabel,
            startYear: foundingGroup.foundingYear,
          },
        ],
      });

      this.register(founderPerson);

      // 1. Generate parents for genealogy
      const parents = generateGenealogyForPerson(founderPerson, stream);
      for (const parent of parents) {
        this.register(parent);
      }

      // 2. Generate extended family (partner, children, siblings) for founders in 1910 (D3)
      const familyBundle = generateFamilyForFounder(founderPerson, parents, stream);

      // If partner was generated, register partner
      if (familyBundle.partner) {
        this.register(familyBundle.partner);
      }

      // Register children
      for (const child of familyBundle.children) {
        this.register(child);
      }

      // Register siblings
      for (const sibling of familyBundle.siblings) {
        this.register(sibling);
      }

      // Update founder person with bidirectional links to partner and children
      const updatedFounder = createPerson({
        ...founderPerson,
        partnerId: familyBundle.partner?.id,
        children: familyBundle.children.map((c) => c.id),
      });

      this.register(updatedFounder);
    }
  }

  serialize(): PersonRegistryState {
    const personsRecord: Record<string, Person> = {};
    for (const [id, p] of this.persons.entries()) {
      personsRecord[id] = p;
    }
    return {
      persons: Object.freeze(personsRecord),
      count: this.persons.size,
    };
  }
}

