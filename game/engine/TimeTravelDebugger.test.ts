import { describe, it, expect } from 'vitest';
import {
  TIME_TRAVEL_MILESTONES,
  buildReproducibleSeedPackage,
  getMilestoneByYear,
} from './TimeTravelDebugger';

describe('TimeTravelDebugger (Macroetapa 40)', () => {
  it('contém os 7 marcos temporais canônicos ordenados cronologicamente', () => {
    expect(TIME_TRAVEL_MILESTONES.length).toBe(7);

    const years = TIME_TRAVEL_MILESTONES.map((m) => m.year);
    expect(years).toEqual([1910, 1915, 1916, 1930, 1933, 1942, 1959]);

    for (const milestone of TIME_TRAVEL_MILESTONES) {
      expect(milestone.title).toBeTruthy();
      expect(milestone.era).toBeTruthy();
      expect(milestone.contextDescription).toBeTruthy();
      expect(milestone.keyRules.length).toBeGreaterThan(0);
      expect(milestone.footballStatus).toBeTruthy();
      expect(milestone.urbanStatus).toBeTruthy();
    }
  });

  it('retorna o marco correto via getMilestoneByYear', () => {
    const m1910 = getMilestoneByYear(1910);
    expect(m1910?.title).toContain('Fundação');
    expect(m1910?.monetarySystem).toBe('REIS');

    const m1942 = getMilestoneByYear(1942);
    expect(m1942?.monetarySystem).toBe('CRUZEIRO');
    expect(m1942?.title).toContain('Cruzeiro');

    const m1959 = getMilestoneByYear(1959);
    expect(m1959?.title).toContain('Taça Brasil');

    expect(getMilestoneByYear(1925)).toBeUndefined();
  });

  it('empacota pacote de replay determinístico com checksum e decisionLog', () => {
    const pkg = buildReproducibleSeedPackage('CM-TEST-1910', [
      { day: 1, action: 'found_club' },
      { day: 15, action: 'sign_parcel' },
    ]);

    expect(pkg.version).toBe('25.0.0');
    expect(pkg.worldSeed).toBe('CM-TEST-1910');
    expect(pkg.totalDecisionsLogged).toBe(2);
    expect(pkg.gameChecksum).toContain('REP-v25-');
    expect(pkg.decisionLog.length).toBe(2);
  });
});
