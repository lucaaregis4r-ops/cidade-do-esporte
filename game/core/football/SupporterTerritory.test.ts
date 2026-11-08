import { describe, it, expect } from 'vitest';
import {
  computeDistrictDemographicAffinity,
  computeClubSupporterTerritories,
  calculateSupporterTurnout,
  type DistrictSupporterBreakdown,
  type ClubSupporterTerritory,
} from './SupporterTerritory';
import type { SocialSegmentAffinity } from '../club/SocialIdentity';

describe('SupporterTerritory (Alpha G: G3 / Macroetapa 25)', () => {
  const dummyDistricts = [
    { id: 'district-railway-workshops', kind: 'railway-workshops' as const, populationUnits: 1500, centrality: 0.4 },
    { id: 'district-public-square', kind: 'public-square' as const, populationUnits: 2000, centrality: 0.9 },
    { id: 'district-outer-north', kind: 'outer-north' as const, populationUnits: 800, centrality: 0.2 },
  ];

  const workersClubAffinity: SocialSegmentAffinity = {
    workers: 90,
    railway: 85,
    students: 20,
    merchants: 30,
    middleClass: 25,
    elite: 5,
    immigrants: 40,
  };

  const eliteClubAffinity: SocialSegmentAffinity = {
    workers: 10,
    railway: 15,
    students: 60,
    merchants: 70,
    middleClass: 65,
    elite: 95,
    immigrants: 20,
  };

  it('computes higher demographic affinity for workers clubs in railway workshops districts', () => {
    const affinityWorkshops = computeDistrictDemographicAffinity('railway-workshops', workersClubAffinity);
    const affinityEliteNorth = computeDistrictDemographicAffinity('outer-north', workersClubAffinity);

    expect(affinityWorkshops).toBeGreaterThan(affinityEliteNorth);
  });

  it('computes higher demographic affinity for elite clubs in civic/expansion districts', () => {
    const eliteAffinitySquare = computeDistrictDemographicAffinity('public-square', eliteClubAffinity);
    const eliteAffinityWorkshops = computeDistrictDemographicAffinity('railway-workshops', eliteClubAffinity);

    expect(eliteAffinitySquare).toBeGreaterThan(eliteAffinityWorkshops);
  });

  it('distributes supporters across districts causally based on affinities and headquarters location', () => {
    const clubsInput = [
      {
        id: 'club_operario',
        name: 'União Operária F.C.',
        headquartersDistrictId: 'district-railway-workshops',
        socialAffinity: workersClubAffinity,
        reputation: 60,
      },
      {
        id: 'club_aristocratico',
        name: 'Clube Atlético da Cidade',
        headquartersDistrictId: 'district-public-square',
        socialAffinity: eliteClubAffinity,
        reputation: 75,
      },
    ];

    const territories = computeClubSupporterTerritories(clubsInput, dummyDistricts);

    expect(territories).toHaveLength(2);

    const operarioTerritory = territories.find((t) => t.clubId === 'club_operario');
    const eliteTerritory = territories.find((t) => t.clubId === 'club_aristocratico');

    expect(operarioTerritory).toBeDefined();
    expect(eliteTerritory).toBeDefined();

    // Operário should dominate railway workshops district
    const operarioWorkshops = operarioTerritory!.districts.find((d) => d.districtId === 'district-railway-workshops');
    const eliteWorkshops = eliteTerritory!.districts.find((d) => d.districtId === 'district-railway-workshops');

    expect(operarioWorkshops!.totalSupporters).toBeGreaterThan(eliteWorkshops!.totalSupporters);
    expect(operarioTerritory!.dominantDistrictId).toBe('district-railway-workshops');

    // Elite should dominate public square district
    const operarioSquare = operarioTerritory!.districts.find((d) => d.districtId === 'district-public-square');
    const eliteSquare = eliteTerritory!.districts.find((d) => d.districtId === 'district-public-square');

    expect(eliteSquare!.totalSupporters).toBeGreaterThan(operarioSquare!.totalSupporters);
  });

  it('calculates realistic match supporter turnout amplifying attendance during derbies', () => {
    const homeTerritory: ClubSupporterTerritory = {
      clubId: 'club_operario',
      clubName: 'União Operária F.C.',
      totalSupporters: 1200,
      dominantDistrictId: 'district-railway-workshops',
      districts: [],
      homeMatchAttendancePotential: 400,
    };

    const awayTerritory: ClubSupporterTerritory = {
      clubId: 'club_aristocratico',
      clubName: 'Clube Atlético da Cidade',
      totalSupporters: 1500,
      dominantDistrictId: 'district-public-square',
      districts: [],
      homeMatchAttendancePotential: 500,
    };

    const normalMatchTurnout = calculateSupporterTurnout({
      homeTerritory,
      awayTerritory,
      isDerby: false,
      derbyIntensity: 20,
      ticketPricePpu: 10,
      stadiumCapacity: 2000,
    });

    const derbyMatchTurnout = calculateSupporterTurnout({
      homeTerritory,
      awayTerritory,
      isDerby: true,
      derbyIntensity: 85,
      ticketPricePpu: 10,
      stadiumCapacity: 2000,
    });

    expect(derbyMatchTurnout.totalTurnout).toBeGreaterThan(normalMatchTurnout.totalTurnout);
    expect(derbyMatchTurnout.awaySupporters).toBeGreaterThan(normalMatchTurnout.awaySupporters);
    expect(derbyMatchTurnout.totalTurnout).toBeLessThanOrEqual(2000); // capped by stadium capacity
  });
});
