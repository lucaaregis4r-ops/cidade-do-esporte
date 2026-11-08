import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { FOUNDING_ORIGINS, type FoundingOrigin } from './Club';
import {
  generateFoundingGroup,
  getAllFoundingOrigins,
  getFoundingGroupProfile,
  validateFoundingGroup,
} from './FoundingGroup';

describe('FoundingGroup domain model (C2)', () => {
  const TEST_SEED = 'CM-1910-TEST-SEED';

  it('exposes all 6 canonical historical origins', () => {
    const origins = getAllFoundingOrigins();
    expect(origins).toHaveLength(6);
    expect(origins).toEqual(FOUNDING_ORIGINS);
    expect(origins).toContain('railway');
    expect(origins).toContain('students');
    expect(origins).toContain('immigrants');
    expect(origins).toContain('workers');
    expect(origins).toContain('merchants');
    expect(origins).toContain('elite');
  });

  it('returns valid profiles for all 6 origins with distinct typical districts and labels', () => {
    for (const origin of FOUNDING_ORIGINS) {
      const profile = getFoundingGroupProfile(origin);
      expect(profile.origin).toBe(origin);
      expect(profile.originLabel.length).toBeGreaterThan(0);
      expect(profile.originDescription.length).toBeGreaterThan(0);
      expect(profile.typicalDistrict).toMatch(/^(station|central|commercial|industrial)$/);
      expect(profile.baseCapitalPPU).toBeGreaterThan(0);
      expect(profile.baseReputation).toBeGreaterThanOrEqual(10);
      expect(Object.isFrozen(profile)).toBe(true);
    }
  });

  it('generates a frozen FoundingGroup deterministically from CampaignRng', () => {
    const rng1 = new CampaignRng(TEST_SEED);
    const rng2 = new CampaignRng(TEST_SEED);

    const group1 = generateFoundingGroup('railway', rng1);
    const group2 = generateFoundingGroup('railway', rng2);

    expect(group1).toEqual(group2);
    expect(Object.isFrozen(group1)).toBe(true);
    expect(Object.isFrozen(group1.members)).toBe(true);
    expect(Object.isFrozen(group1.leader)).toBe(true);
    expect(group1.members.length).toBeGreaterThanOrEqual(5);
    expect(group1.leader.role).toBe('president');
  });

  it('produces different founding groups for different campaign seeds', () => {
    const rngA = new CampaignRng('CM-1910-SEED-ALPHA');
    const rngB = new CampaignRng('CM-1910-SEED-BETA');

    const groupA = generateFoundingGroup('students', rngA);
    const groupB = generateFoundingGroup('students', rngB);

    expect(groupA.leader.name).not.toBe(groupB.leader.name);
    expect(groupA.totalInitialCapitalPPU).not.toBe(groupB.totalInitialCapitalPPU);
  });

  it('enforces socioeconomic hierarchy in initial capital across origins', () => {
    // Workers should have the lowest baseline capital, elite the highest
    const workersProfile = getFoundingGroupProfile('workers');
    const railwayProfile = getFoundingGroupProfile('railway');
    const immigrantsProfile = getFoundingGroupProfile('immigrants');
    const studentsProfile = getFoundingGroupProfile('students');
    const merchantsProfile = getFoundingGroupProfile('merchants');
    const eliteProfile = getFoundingGroupProfile('elite');

    expect(workersProfile.baseCapitalPPU).toBeLessThan(railwayProfile.baseCapitalPPU);
    expect(railwayProfile.baseCapitalPPU).toBeLessThan(studentsProfile.baseCapitalPPU);
    expect(immigrantsProfile.baseCapitalPPU).toBeLessThan(merchantsProfile.baseCapitalPPU);
    expect(merchantsProfile.baseCapitalPPU).toBeLessThan(eliteProfile.baseCapitalPPU);
  });

  it('computes total initial capital PPU exactly matching base plus member contributions', () => {
    for (const origin of FOUNDING_ORIGINS) {
      const rng = new CampaignRng(`${TEST_SEED}-${origin}`);
      const group = generateFoundingGroup(origin, rng);

      const sumContributions = group.members.reduce((acc, m) => acc + m.capitalContributionPPU, 0);
      const expectedTotal = Math.round((group.profile.baseCapitalPPU + sumContributions) * 10) / 10;

      expect(group.totalInitialCapitalPPU).toBeCloseTo(expectedTotal, 1);
      expect(group.totalInitialCapitalPPU).toBeGreaterThan(group.profile.baseCapitalPPU);
    }
  });

  it('cites all founding members by name in the founding ata text', () => {
    for (const origin of FOUNDING_ORIGINS) {
      const rng = new CampaignRng(`${TEST_SEED}-ata-${origin}`);
      const group = generateFoundingGroup(origin, rng);

      expect(group.foundingAta).toContain(group.leader.name);
      for (const member of group.members) {
        expect(group.foundingAta).toContain(member.name);
      }
      expect(group.foundingAta).toContain(group.totalInitialCapitalPPU.toFixed(1));
    }
  });

  it('generates role-appropriate social classes and occupations per origin', () => {
    const rngWorkers = new CampaignRng(`${TEST_SEED}-workers`);
    const workersGroup = generateFoundingGroup('workers', rngWorkers);
    for (const member of workersGroup.members) {
      expect(member.socialClass).toBe('working_class');
    }

    const rngElite = new CampaignRng(`${TEST_SEED}-elite`);
    const eliteGroup = generateFoundingGroup('elite', rngElite);
    for (const member of eliteGroup.members) {
      expect(['upper_class', 'elite']).toContain(member.socialClass);
    }

    const rngRailway = new CampaignRng(`${TEST_SEED}-railway`);
    const railwayGroup = generateFoundingGroup('railway', rngRailway);
    expect(railwayGroup.profile.typicalDistrict).toBe('station');
    for (const member of railwayGroup.members) {
      expect(['working_class', 'middle_class']).toContain(member.socialClass);
    }
  });

  it('rejects invalid inputs to generateFoundingGroup', () => {
    const rng = new CampaignRng(TEST_SEED);

    expect(() => generateFoundingGroup('invalid' as unknown as FoundingOrigin, rng)).toThrow(TypeError);
    expect(() => generateFoundingGroup('railway', null as unknown as CampaignRng)).toThrow(TypeError);
    expect(() => generateFoundingGroup('railway', rng, { foundingYear: 1890 })).toThrow(RangeError);
    expect(() => generateFoundingGroup('railway', rng, { foundingYear: 1965 })).toThrow(RangeError);
    expect(() => generateFoundingGroup('railway', rng, { memberCount: 3 })).toThrow(RangeError);
    expect(() => generateFoundingGroup('railway', rng, { memberCount: 15 })).toThrow(RangeError);
  });

  describe('validateFoundingGroup', () => {
    it('round-trips a valid generated FoundingGroup and keeps it frozen', () => {
      const rng = new CampaignRng(TEST_SEED);
      const original = generateFoundingGroup('merchants', rng);

      const serialized = JSON.parse(JSON.stringify(original));
      const validated = validateFoundingGroup(serialized);

      expect(validated).not.toBeNull();
      expect(validated).toEqual(original);
      expect(Object.isFrozen(validated)).toBe(true);
      expect(Object.isFrozen(validated!.members)).toBe(true);
    });

    it('returns null on invalid or corrupted data', () => {
      expect(validateFoundingGroup(null)).toBeNull();
      expect(validateFoundingGroup('string')).toBeNull();
      expect(validateFoundingGroup({})).toBeNull();

      const rng = new CampaignRng(TEST_SEED);
      const valid = generateFoundingGroup('students', rng);

      expect(validateFoundingGroup({ ...valid, origin: 'unknown' })).toBeNull();
      expect(validateFoundingGroup({ ...valid, foundingYear: 1905 })).toBeNull();
      expect(validateFoundingGroup({ ...valid, totalInitialCapitalPPU: -10 })).toBeNull();
      expect(validateFoundingGroup({ ...valid, members: [] })).toBeNull();
      expect(validateFoundingGroup({ ...valid, foundingAta: '' })).toBeNull();
    });
  });
});
