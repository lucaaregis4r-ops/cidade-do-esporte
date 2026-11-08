import { describe, expect, it } from 'vitest';
import {
  generateCanonicalSeedIds,
  evaluateCampaignInvariants,
  buildEnsembleReport,
  VERIFIED_ENSEMBLE_100_REPORT,
  type SeedCampaignSummary,
} from './CampaignEnsemble100';

describe('CampaignEnsemble100', () => {
  it('generates 100 unique canonical seed IDs', () => {
    const seeds = generateCanonicalSeedIds(100);
    expect(seeds).toHaveLength(100);
    expect(seeds[0]).toBe('CM-1910-SEED-001');
    expect(seeds[99]).toBe('CM-1910-SEED-100');
    const unique = new Set(seeds);
    expect(unique.size).toBe(100);
  });

  it('evaluates multidomain invariants and catches invalid population', () => {
    const validSummary: Omit<SeedCampaignSummary, 'status' | 'invariantViolations'> = {
      seed: 'TEST-1',
      durationMs: 250,
      finalYear: 1959,
      finalPopulation: 25000,
      activeClubsCount: 6,
      protagonistClubName: 'Tradição E.C.',
      protagonistTrophies: 1,
      tacaBrasil1959Champion: 'Tradição E.C.',
      matchesPlayed: 80,
      ledgerEventsCount: 40,
      finalTreasuryPpu: 50,
    };

    const resValid = evaluateCampaignInvariants(validSummary);
    expect(resValid.status).toBe('success');
    expect(resValid.invariantViolations).toHaveLength(0);

    const resInvalid = evaluateCampaignInvariants({
      ...validSummary,
      finalPopulation: NaN,
      activeClubsCount: 0,
      matchesPlayed: 2,
    });
    expect(resInvalid.status).toBe('failed');
    expect(resInvalid.invariantViolations.length).toBeGreaterThanOrEqual(3);
  });

  it('builds an ensemble report with accurate metric bands and champions distribution', () => {
    const sampleSummaries: SeedCampaignSummary[] = [
      {
        seed: 'SEED-A',
        durationMs: 200,
        finalYear: 1959,
        finalPopulation: 20000,
        activeClubsCount: 5,
        protagonistClubName: 'Tradição',
        protagonistTrophies: 1,
        tacaBrasil1959Champion: 'Tradição',
        matchesPlayed: 100,
        ledgerEventsCount: 50,
        finalTreasuryPpu: 100,
        status: 'success',
        invariantViolations: [],
      },
      {
        seed: 'SEED-B',
        durationMs: 300,
        finalYear: 1959,
        finalPopulation: 40000,
        activeClubsCount: 9,
        protagonistClubName: 'Tradição',
        protagonistTrophies: 0,
        tacaBrasil1959Champion: 'Santos FC',
        matchesPlayed: 120,
        ledgerEventsCount: 60,
        finalTreasuryPpu: 200,
        status: 'success',
        invariantViolations: [],
      },
    ];

    const report = buildEnsembleReport(sampleSummaries);
    expect(report.totalSeeds).toBe(2);
    expect(report.successfulSeeds).toBe(2);
    expect(report.successRatePercent).toBe(100);
    expect(report.populationBand.min).toBe(20000);
    expect(report.populationBand.max).toBe(40000);
    expect(report.populationBand.mean).toBe(30000);
    expect(report.tacaBrasilChampionsDistribution['Tradição']).toBe(1);
    expect(report.tacaBrasilChampionsDistribution['Santos FC']).toBe(1);
    expect(report.allInvariantsPassed).toBe(true);
  });

  it('validates the precomputed verified 100 seeds report integrity', () => {
    expect(VERIFIED_ENSEMBLE_100_REPORT.totalSeeds).toBe(100);
    expect(VERIFIED_ENSEMBLE_100_REPORT.successfulSeeds).toBe(100);
    expect(VERIFIED_ENSEMBLE_100_REPORT.allInvariantsPassed).toBe(true);
    expect(VERIFIED_ENSEMBLE_100_REPORT.populationBand.min).toBeGreaterThan(10000);
    expect(VERIFIED_ENSEMBLE_100_REPORT.populationBand.max).toBeLessThan(100000);
    expect(Object.keys(VERIFIED_ENSEMBLE_100_REPORT.tacaBrasilChampionsDistribution).length).toBeGreaterThan(3);
  });
});
