import { describe, it, expect } from 'vitest';
import {
  createInitialSocialIdentity,
  evolveSocialIdentity,
  getDominantSegment,
  validateSocialIdentityState,
  type SocialSegmentAffinity,
} from './SocialIdentity';

describe('SocialIdentity domain model (Alpha D: D4)', () => {
  it('creates initial social identity based on founding origin', () => {
    const railwayIdentity = createInitialSocialIdentity('railway', 'd-estacao');
    expect(validateSocialIdentityState(railwayIdentity)).toBe(true);
    expect(railwayIdentity.segments.railway).toBe(90);
    expect(railwayIdentity.segments.workers).toBe(80);
    expect(railwayIdentity.segments.elite).toBe(10);
    expect(railwayIdentity.districts['d-estacao']).toBe(75);
    expect(getDominantSegment(railwayIdentity.segments)).toBe('railway');

    const eliteIdentity = createInitialSocialIdentity('elite', 'd-centro');
    expect(eliteIdentity.segments.elite).toBe(90);
    expect(eliteIdentity.segments.workers).toBe(10);
    expect(getDominantSegment(eliteIdentity.segments)).toBe('elite');
  });

  it('evolves social identity over time and does NOT freeze by origin', () => {
    const initial = createInitialSocialIdentity('elite', 'd-centro');
    expect(initial.segments.workers).toBe(10);
    expect(initial.segments.elite).toBe(90);

    // Club adopts popular pricing and opens basic facilities in an industrial district
    const evolvedYear1 = evolveSocialIdentity(initial, {
      currentYear: 1911,
      currentMonth: 1,
      monthlyFeePPU: 1.0, // Low, accessible pricing
      parcelDistrictId: 'd-barroca',
      hasBasicFacility: true,
      memberClassDistribution: { working_class: 40, middle_class: 10, elite: 2 },
    });

    expect(evolvedYear1.segments.workers).toBeGreaterThan(10);
    expect(evolvedYear1.segments.elite).toBeLessThan(90);
    expect(evolvedYear1.districts['d-barroca']).toBeDefined();
    expect(evolvedYear1.history.length).toBe(2);
  });

  it('correctly identifies dominant segment', () => {
    const segments: SocialSegmentAffinity = {
      workers: 20,
      railway: 15,
      students: 85,
      merchants: 40,
      middleClass: 60,
      elite: 30,
      immigrants: 25,
    };
    expect(getDominantSegment(segments)).toBe('students');
  });

  it('validates state defensively', () => {
    expect(validateSocialIdentityState(null)).toBe(false);
    expect(validateSocialIdentityState({})).toBe(false);
    expect(validateSocialIdentityState({
      segments: { workers: 50 },
      districts: {},
      cityWideReputation: 50,
      history: [],
    })).toBe(false);
  });
});
