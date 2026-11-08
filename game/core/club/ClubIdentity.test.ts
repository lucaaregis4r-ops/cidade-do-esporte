import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { FOUNDING_ORIGINS } from './Club';
import {
  generateClubIdentity,
  getAvailableCrestShapes,
  getAvailableNamesForOrigin,
  getAvailablePalettes,
} from './ClubIdentity';

describe('ClubIdentity', () => {
  it('generates a valid, frozen identity for each founding origin', () => {
    const rng = new CampaignRng('test-identity-seed');

    for (const origin of FOUNDING_ORIGINS) {
      const identity = generateClubIdentity(origin, rng);

      expect(identity.name).toBeTruthy();
      expect(identity.shortName).toBeTruthy();
      expect(identity.shortName.length).toBeGreaterThanOrEqual(2);
      expect(identity.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(identity.colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(getAvailableCrestShapes()).toContain(identity.crestShape);

      expect(identity.crestVersion.startYear).toBe(1910);
      expect(identity.crestVersion.endYear).toBeUndefined();
      expect(identity.crestVersion.designId).toContain('1910');
      expect(identity.crestVersion.changeReason).toBeTruthy();

      expect(Object.isFrozen(identity)).toBe(true);
      expect(Object.isFrozen(identity.crestVersion)).toBe(true);
    }
  });

  it('is strictly deterministic for identical seeds', () => {
    const rngA = new CampaignRng('reproducible-seed-1910');
    const rngB = new CampaignRng('reproducible-seed-1910');

    const idA = generateClubIdentity('railway', rngA);
    const idB = generateClubIdentity('railway', rngB);

    expect(idA).toEqual(idB);
    expect(idA.name).toBe(idB.name);
    expect(idA.colors).toEqual(idB.colors);
    expect(idA.crestShape).toBe(idB.crestShape);
  });

  it('only consumes the club RNG stream without touching other streams', () => {
    const rng = new CampaignRng('stream-isolation-test');
    const cityStateBefore = rng.city.getState();
    const footballStateBefore = rng.football.getState();

    generateClubIdentity('students', rng);

    expect(rng.city.getState()).toBe(cityStateBefore);
    expect(rng.football.getState()).toBe(footballStateBefore);
  });

  it('exposes palettes and shapes with valid configurations', () => {
    const palettes = getAvailablePalettes();
    expect(palettes.length).toBeGreaterThan(4);
    for (const p of palettes) {
      expect(p.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(p.colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    const shapes = getAvailableCrestShapes();
    expect(shapes).toContain('swiss');
    expect(shapes).toContain('circle');
    expect(shapes).toContain('stripes');
    expect(shapes).toContain('diamond');
    expect(shapes).toContain('sash');

    const names = getAvailableNamesForOrigin('railway');
    expect(names.some((n) => n.name.includes('Ferroviário'))).toBe(true);
  });
});
