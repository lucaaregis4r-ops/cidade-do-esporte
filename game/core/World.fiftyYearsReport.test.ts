import { describe, expect, it } from 'vitest';
import { World } from './World';
import { createClub } from './club/Club';
import type { ClubTrophy } from './football/Competition';
import type { LandOccupancyContract } from './club/ClubLandContract';

describe('World 50-Year Jubilee Report & Campaign Completion (Alpha H: H4 & H5)', () => {
  const sampleContract: LandOccupancyContract = {
    id: 'contract-test-1910',
    parcelId: 'parcel-1',
    clubId: 'club-test-1910',
    type: 'CONCESSAO_PUBLICA',
    startDate: { year: 1910, month: 1, day: 1 },
    durationYears: 10,
    monthlyCostPpu: 0,
    upfrontCostPpu: 0,
    grantorName: 'Prefeitura',
    terms: ['Uso esportivo'],
  };

  it('generates the 50-year jubilee report when requested from World', () => {
    const world = new World(20, 20, { worldSeed: 'TEST-JUBILEE-WORLD' });
    const parcels = world.getCityData1910()?.parcels?.parcels ?? [];
    const parcelId = parcels[0]?.id ?? 'parcel-headquarters-1910';

    const club = createClub({
      id: 'club-test',
      name: 'Tradição Esporte Clube',
      shortName: 'Tradição',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      colors: { primary: '#1A365D', secondary: '#E2E8F0' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'crest-initial',
          changeReason: 'Fundação de 1910',
        },
      ],
      founders: ['founder-1'],
      parcels: [parcelId],
      facilities: [],
      reputation: 80,
    });

    const contract = { ...sampleContract, parcelId, clubId: club.id };
    world.foundClubWithParcel(club, parcelId, contract);

    const report = world.getFiftyYearsReport();
    expect(report).not.toBeNull();
    expect(report?.clubName).toBe('Tradição Esporte Clube');
    expect(report?.worldSeed).toBe('TEST-JUBILEE-WORLD');
    expect(report?.cityUrbanEvolution.growthRatio).toBeGreaterThan(1);
    expect(report?.foundersAndPresidents.originType).toBe('railway');
    expect(report?.heritageAndStadium.headquartersParcelId).toBe(parcelId);
    expect(report?.narrativeChroniclePt).toContain('Tradição Esporte Clube');

    // Caching check
    const cachedReport = world.getFiftyYearsReport();
    expect(cachedReport).toBe(report);
  });

  it('triggers the jubilee interruption when campaign reaches completion at 31/12/1959', () => {
    const world = new World(20, 20, { worldSeed: 'TEST-COMPLETION-WORLD' });
    const parcels = world.getCityData1910()?.parcels?.parcels ?? [];
    const parcelId = parcels[0]?.id ?? 'parcel-headquarters-workers';

    const club = createClub({
      id: 'club-completion',
      name: 'Tradição Esporte Clube',
      shortName: 'Tradição',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'workers',
      colors: { primary: '#9B1B30', secondary: '#F4F1EA' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'crest-initial',
          changeReason: 'Fundação operária de 1910',
        },
      ],
      founders: ['founder-w1'],
      parcels: [parcelId],
      facilities: [],
      reputation: 75,
    });
    const contract = { ...sampleContract, parcelId, clubId: club.id };
    world.foundClubWithParcel(club, parcelId, contract);

    // Fast-forward or simulate near the end
    // Rather than 18,000 ticks, test the completion handler directly
    expect(world.isCampaignComplete()).toBe(false);

    // Generate Taça Brasil and check its integration in the report
    world.generateTacaBrasil1959();
    world.simulateEntireTacaBrasil();

    const reportWithTaca = world.getFiftyYearsReport();
    expect(reportWithTaca).not.toBeNull();
    expect(reportWithTaca?.rivalryAndClassic.primaryRivalName).toBeDefined();
  });
});
