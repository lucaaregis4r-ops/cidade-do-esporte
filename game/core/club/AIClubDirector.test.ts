import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { generateAIDirectorProfile, validateAIDirectorProfile } from './AIClubDirector';

describe('AIClubDirector', () => {
  it('generates deterministic director profile for different origins', () => {
    const rng1 = new CampaignRng('SEED-DIRECTOR-1');
    const rng2 = new CampaignRng('SEED-DIRECTOR-1');

    const profile1 = generateAIDirectorProfile('elite', rng1, 1910);
    const profile2 = generateAIDirectorProfile('elite', rng2, 1910);

    expect(profile1).toEqual(profile2);
    expect(profile1.presidentName.length).toBeGreaterThan(3);
    expect(profile1.ambition).toBeGreaterThanOrEqual(1);
    expect(profile1.ambition).toBeLessThanOrEqual(100);
    expect(profile1.financialPrudence).toBeGreaterThanOrEqual(1);
    expect(profile1.financialPrudence).toBeLessThanOrEqual(100);
    expect(profile1.amateurPurity).toBeGreaterThanOrEqual(1);
    expect(profile1.amateurPurity).toBeLessThanOrEqual(100);
    expect(profile1.aggressiveness).toBeGreaterThanOrEqual(1);
    expect(profile1.aggressiveness).toBeLessThanOrEqual(100);
  });

  it('validates a valid director profile', () => {
    const valid = {
      presidentName: 'Carlos Drummond',
      archetype: 'aristocratic_exclusive',
      ambition: 70,
      financialPrudence: 80,
      amateurPurity: 90,
      aggressiveness: 40,
    };

    const result = validateAIDirectorProfile(valid);
    expect(result).not.toBeNull();
    expect(result?.presidentName).toBe('Carlos Drummond');
    expect(result?.archetype).toBe('aristocratic_exclusive');
  });

  it('rejects invalid director profiles', () => {
    expect(validateAIDirectorProfile(null)).toBeNull();
    expect(validateAIDirectorProfile({})).toBeNull();
    expect(validateAIDirectorProfile({ presidentName: '', archetype: 'invalid' })).toBeNull();
    expect(validateAIDirectorProfile({
      presidentName: 'Test',
      archetype: 'traditionalist_amateur',
      ambition: 150, // out of range
      financialPrudence: 50,
      amateurPurity: 50,
      aggressiveness: 50,
    })).toBeNull();
  });
});
