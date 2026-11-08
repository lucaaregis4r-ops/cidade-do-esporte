import { describe, it, expect } from 'vitest';
import {
  createPerson,
  generateGenealogyForPerson,
  validatePerson,
} from './Person';

import { PersonRegistry } from './PersonRegistry';
import { CampaignRng } from '../CampaignRng';
import { generateFoundingGroup } from '../club/FoundingGroup';

describe('Person domain model and genealogy (Alpha D: D1, D2)', () => {
  it('creates an immutable person matching canonical requirements', () => {
    const person = createPerson({
      id: 'per-test-1',
      name: 'Arthur Santos',
      birthDate: { year: 1888, month: 5, day: 12 },
      districtId: 'Centro',
      occupation: 'Tipógrafo',
      economicClass: 'working_class',
      wealthIndex: 45,
      footballInterest: 90,
      traits: { leadership: 75, ambition: 80 },
    });

    expect(person.id).toBe('per-test-1');
    expect(person.name).toBe('Arthur Santos');
    expect(person.birthDate.year).toBe(1888);
    expect(person.traits.leadership).toBe(75);
    expect(person.traits.honesty).toBe(50); // Default applied
    expect(validatePerson(person)).toBe(true);
    expect(Object.isFrozen(person)).toBe(true);
  });

  it('validates person entity defensively', () => {
    expect(validatePerson(null)).toBe(false);
    expect(validatePerson({})).toBe(false);
    expect(validatePerson({ id: '', name: 'No Id' })).toBe(false);
  });

  it('generates genealogical ancestors (parents) deterministically before 1910', () => {
    const rng = new CampaignRng('SEED-PERSON-TEST');
    const stream = rng.population;

    const person = createPerson({
      id: 'per-founder-1',
      name: 'Vicente Drumond',
      birthDate: { year: 1885, month: 3, day: 14 },
      districtId: 'Savassi',
      occupation: 'Estudante de Engenharia',
      economicClass: 'upper_class',
    });

    const parents = generateGenealogyForPerson(person, stream);
    expect(parents.length).toBe(2);

    const [father, mother] = parents;
    expect(father.birthDate.year).toBeLessThan(1885);
    expect(mother.birthDate.year).toBeLessThan(1885);
    expect(father.children).toContain(person.id);
    expect(mother.children).toContain(person.id);
    expect(father.partnerId).toBe(mother.id);
    expect(mother.partnerId).toBe(father.id);
  });

  it('bootstraps founders into PersonRegistry with parents and genealogy', () => {
    const rng = new CampaignRng('SEED-REGISTRY-TEST');
    const foundingGroup = generateFoundingGroup('railway', rng);

    const registry = new PersonRegistry();
    registry.bootstrapFounders(foundingGroup, rng);

    const materializedPeople = registry.getAll();
    expect(materializedPeople.length).toBeGreaterThan(foundingGroup.members.length);

    // Check that leader is registered
    const leaderPerson = registry.get(foundingGroup.leader.id);
    expect(leaderPerson).toBeDefined();
    expect(leaderPerson!.name).toBe(foundingGroup.leader.name);
    expect(leaderPerson!.parents.length).toBe(2);

    // Check that parents exist in registry
    const father = registry.get(leaderPerson!.parents[0]);
    const mother = registry.get(leaderPerson!.parents[1]);
    expect(father).toBeDefined();
    expect(mother).toBeDefined();
    expect(father!.children).toContain(leaderPerson!.id);
  });

  it('serializes and restores PersonRegistry state accurately', () => {
    const rng = new CampaignRng('SEED-SERIALIZE-TEST');
    const foundingGroup = generateFoundingGroup('students', rng);

    const registry = new PersonRegistry();
    registry.bootstrapFounders(foundingGroup, rng);
    const serialized = registry.serialize();

    const restoredRegistry = new PersonRegistry(serialized);
    expect(restoredRegistry.getAll().length).toBe(registry.getAll().length);

    const leaderOriginal = registry.get(foundingGroup.leader.id)!;
    const leaderRestored = restoredRegistry.get(foundingGroup.leader.id)!;
    expect(leaderRestored.name).toBe(leaderOriginal.name);
    expect(leaderRestored.birthDate).toEqual(leaderOriginal.birthDate);
  });

  it('builds navigable family tree (parents, partner, children, siblings) with generational transmission (D3)', () => {
    const rng = new CampaignRng('SEED-FAMILY-TREE-TEST');
    const foundingGroup = generateFoundingGroup('workers', rng);

    const registry = new PersonRegistry();
    registry.bootstrapFounders(foundingGroup, rng);

    // Test family tree retrieval
    const leaderId = foundingGroup.leader.id;
    const tree = registry.getFamilyTree(leaderId);
    expect(tree).toBeDefined();
    expect(tree!.person.id).toBe(leaderId);
    expect(tree!.parents.length).toBe(2);

    // If adult founder has partner or children or siblings, check connections
    if (tree!.children.length > 0) {
      for (const child of tree!.children) {
        expect(child.parents).toContain(leaderId);
        // Children inherit club loyalty
        expect(child.clubAffinities['club-main']).toBeDefined();
        expect(child.clubAffinities['club-main']).toBeGreaterThan(60);
      }
    }

    if (tree!.siblings.length > 0) {
      for (const sib of tree!.siblings) {
        // Siblings share at least one parent
        const sharesParent = sib.parents.some((pId) => tree!.person.parents.includes(pId));
        expect(sharesParent).toBe(true);
      }
    }
  });
});

