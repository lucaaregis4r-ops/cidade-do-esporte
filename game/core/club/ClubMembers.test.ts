import { describe, it, expect } from 'vitest';
import {
  generateInitialMembership,
  collectMonthlyDues,
  admitMember,
  getDefaultMembershipSettings,
  validateClubMember,
  validateClubMembershipState,
} from './ClubMembers';
import { generateFoundingGroup } from './FoundingGroup';
import { CampaignRng } from '../CampaignRng';

describe('ClubMembers Domain Model (C7, C8)', () => {
  const seed = 'TEST-SEED-MEMBERSHIP-1910';
  const campaignRng = new CampaignRng(seed);
  const foundingGroup = generateFoundingGroup('railway', campaignRng, { foundingYear: 1910 });
  const foundingDate = { year: 1910, month: 1, day: 1 };

  it('generates initial membership from founding group and adds cohort of associates', () => {
    const membership = generateInitialMembership(foundingGroup, foundingDate, seed, 15);

    expect(membership.members.length).toBe(foundingGroup.members.length + 15);
    expect(membership.activeCount).toBe(membership.members.length);
    expect(membership.delinquentCount).toBe(0);
    expect(membership.monthlyCollectionPPU).toBeGreaterThan(0);

    // First members must be founders
    const founders = membership.members.filter((m) => m.category === 'fundador');
    expect(founders.length).toBe(foundingGroup.members.length);
    expect(founders[0].name).toBe(foundingGroup.members[0].name);

    // Contribuintes and atletas must be present
    const athletes = membership.members.filter((m) => m.category === 'atleta');
    expect(athletes.length).toBeGreaterThanOrEqual(4);
  });

  it('collects monthly dues and updates finances deterministically', () => {
    const membership = generateInitialMembership(foundingGroup, foundingDate, seed, 10);
    const rng = new CampaignRng('TEST-SEED-DUES-COLLECTION');
    const febDate = { year: 1910, month: 2, day: 1 };

    const result = collectMonthlyDues(membership, febDate, rng);

    expect(result.totalCollectedPPU).toBeGreaterThan(0);
    expect(result.payingCount + result.delinquentCount).toBe(membership.members.length);
    expect(result.updatedMembership.delinquentCount).toBe(result.delinquentCount);
    expect(result.updatedMembership.activeCount).toBe(result.payingCount);
  });

  it('admits a new member and updates ledger counts and fees', () => {
    const membership = generateInitialMembership(foundingGroup, foundingDate, seed, 5);
    const joinDate = { year: 1910, month: 3, day: 15 };

    const { updatedMembership, newMember, admissionFeePPU } = admitMember(
      membership,
      'Sebastião de Andrade',
      'contribuinte',
      'middle_class',
      'Guarda-livros',
      joinDate,
    );

    expect(updatedMembership.members.length).toBe(membership.members.length + 1);
    expect(newMember.name).toBe('Sebastião de Andrade');
    expect(newMember.category).toBe('contribuinte');
    expect(admissionFeePPU).toBeGreaterThan(0);
    expect(newMember.totalPaidPPU).toBe(admissionFeePPU);
  });

  it('validates membership state defensively', () => {
    const membership = generateInitialMembership(foundingGroup, foundingDate, seed, 5);
    expect(validateClubMembershipState(membership)).toBe(true);

    expect(validateClubMembershipState(null)).toBe(false);
    expect(validateClubMembershipState({ members: 'invalid' })).toBe(false);
    expect(validateClubMember(membership.members[0])).toBe(true);
    expect(validateClubMember({ id: '' })).toBe(false);
  });

  it('provides different calibrated settings for distinct origins', () => {
    const railwaySettings = getDefaultMembershipSettings('railway');
    const eliteSettings = getDefaultMembershipSettings('elite');

    expect(eliteSettings.monthlyDuesPPU.contribuinte).toBeGreaterThan(railwaySettings.monthlyDuesPPU.contribuinte);
    expect(eliteSettings.admissionFeePPU).toBeGreaterThan(railwaySettings.admissionFeePPU);
  });
});
