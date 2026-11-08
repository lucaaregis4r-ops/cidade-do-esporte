import { describe, it, expect } from 'vitest';
import {
  generateAnnualCompetitions,
  generateRoundRobinFixtures,
  generateRoundDates,
  type ClubParticipantSummary,
} from './CompetitionGenerator';
import { CampaignRng } from '../CampaignRng';
import type { LocalClubState } from '../club/ClubBirthEngine';
import type { RegionalClubState } from '../club/RegionalClub';
import type { FederationState } from '../federation/Federation';
import type { ClubState } from '../club/Club';

describe('CompetitionGenerator - Formats and Era Evolution (Macroetapa 22, F7 + F8)', () => {
  const dummyRng = new CampaignRng('TEST-SEED-COMP');

  const mockLocalClubs: LocalClubState[] = [
    {
      id: 'sport_mineiro',
      name: 'Sport Club Mineiro',
      shortName: 'Sport Mineiro',
      foundationYear: 1904,
      foundationReason: 'elite',
      districtId: 'dist_centro',
      status: 'active',
      colors: { primary: '#000000', secondary: '#ffffff' },
      origin: 'elite',
      directorProfile: {
        personality: 'cautious',
        archetype: 'aristocratic_exclusive',
        financialPrudence: 80,
        aggressiveness: 30,
        youthFocus: 30,
        facilityAmbition: 70,
        historicalAttitude: 'traditional',
      },
      squadSummary: { totalPlayers: 18, averageRating: 62 },
      finances: { cashBalancePpu: 400, annualBudgetPpu: 350 },
    },
    {
      id: 'aa_comercio',
      name: 'Associação Athlética Comércio',
      shortName: 'Comércio',
      foundationYear: 1909,
      foundationReason: 'merchants',
      districtId: 'dist_comercio',
      status: 'active',
      colors: { primary: '#1565c0', secondary: '#ffffff' },
      origin: 'merchants',
      directorProfile: {
        personality: 'pragmatic',
        archetype: 'mercantile_expansionist',
        financialPrudence: 50,
        aggressiveness: 60,
        youthFocus: 50,
        facilityAmbition: 50,
        historicalAttitude: 'modernizing',
      },
      squadSummary: { totalPlayers: 16, averageRating: 58 },
      finances: { cashBalancePpu: 300, annualBudgetPpu: 280 },
    },
    {
      id: 'yale',
      name: 'Yale Athletic Club',
      shortName: 'Yale',
      foundationYear: 1910,
      foundationReason: 'students',
      districtId: 'dist_centro',
      status: 'active',
      colors: { primary: '#d32f2f', secondary: '#ffffff' },
      origin: 'students',
      directorProfile: {
        personality: 'idealist',
        archetype: 'pragmatic_competitive',
        financialPrudence: 40,
        aggressiveness: 70,
        youthFocus: 70,
        facilityAmbition: 60,
        historicalAttitude: 'modernizing',
      },
      squadSummary: { totalPlayers: 17, averageRating: 60 },
      finances: { cashBalancePpu: 250, annualBudgetPpu: 260 },
    },
  ];

  const mockRegionalClubs: RegionalClubState[] = [
    {
      id: 'villa_nova',
      name: 'Villa Nova Athletic Club',
      shortName: 'Villa Nova',
      foundationYear: 1908,
      region: 'Central',
      city: 'Nova Lima',
      railwayDistanceHours: 1,
      colors: { primary: '#B71C1C', secondary: '#FFFFFF' },
      origin: 'miners',
      stadium: { name: 'Campo de Bonfim', capacity: 2500, pitchType: 'grass' },
      fanbaseSize: 4500,
      traditionLevel: 80,
      finances: { cashBalancePpu: 800, annualBudgetPpu: 950 },
      squadSummary: { totalPlayers: 20, averageRating: 68 },
      attitudeTowardsCapital: 'fierce_rival',
      matchesPlayedAgainstCapital: 4,
    },
  ];

  it('generates pre-federation Taça Cidade de Minas in 1910 (single round-robin)', () => {
    const competitions = generateAnnualCompetitions(
      1910,
      mockLocalClubs,
      mockRegionalClubs,
      null,
      null,
      dummyRng
    );

    expect(competitions.length).toBe(1);
    const comp = competitions[0]!;
    expect(comp.id).toBe('comp_1910_taca_cidade_minas');
    expect(comp.format).toBe('single_round_robin');
    expect(comp.organizer).toBe('municipal_clubs');
    expect(comp.tier).toBe('city_cup');
    expect(comp.participatingClubIds.length).toBe(4); // 3 local + 1 nearby regional (Villa Nova)
    expect(comp.standings.length).toBe(4);

    // For 4 clubs in single round-robin: 4*(4-1)/2 = 6 fixtures across 3 rounds
    expect(comp.fixtures.length).toBe(6);
    expect(comp.trophy).toBeDefined();
    expect(comp.trophy?.competitionName).toContain('1910');
  });

  it('generates double round-robin 1º Campeonato da Cidade in 1915 after LMDT founding', () => {
    const mockFederation: FederationState = {
      id: 'lmdt',
      name: 'Liga Mineira de Desportos Terrestres',
      shortName: 'LMDT',
      foundingDate: { year: 1915, month: 3, day: 15 },
      status: 'active',
      foundingClubs: ['sport_mineiro', 'aa_comercio', 'yale', 'villa_nova'],
      affiliatedClubs: ['sport_mineiro', 'aa_comercio', 'yale', 'villa_nova'],
      presidents: [],
      statutes: {
        votingSystem: 'one_club_one_vote',
        amateurismClause: 'strict_amateur',
        fieldRequirement: 'fenced_pitch_mandatory',
        disputeResolution: 'statutory_tribunal',
      },
      blocs: [],
      competitions: [],
      professionalismPolicy: {
        tier: 'strict_amateur',
        sanctionsForBrownAmateurism: true,
        minimumWageMandatory: false,
      },
      historicalEvents: [],
    };

    const competitions = generateAnnualCompetitions(
      1915,
      mockLocalClubs,
      mockRegionalClubs,
      mockFederation,
      null,
      dummyRng
    );

    expect(competitions.length).toBe(1);
    const comp = competitions[0]!;
    expect(comp.id).toBe('comp_1915_campeonato_mineiro');
    expect(comp.format).toBe('double_round_robin');
    expect(comp.organizer).toBe('lmdt');
    expect(comp.tier).toBe('state_first_division');

    // For 4 clubs in double round-robin: 6 * 2 = 12 fixtures across 6 rounds
    expect(comp.fixtures.length).toBe(12);
  });

  it('generates two parallel championships (LMDT and AMEA) during the 1916 historical schism', () => {
    const mockSchismFederation: FederationState = {
      id: 'lmdt',
      name: 'Liga Mineira de Desportos Terrestres',
      shortName: 'LMDT',
      foundingDate: { year: 1915, month: 3, day: 15 },
      status: 'schism',
      foundingClubs: ['sport_mineiro', 'aa_comercio', 'yale', 'villa_nova'],
      affiliatedClubs: ['sport_mineiro', 'aa_comercio', 'yale', 'villa_nova'],
      presidents: [],
      statutes: {
        votingSystem: 'one_club_one_vote',
        amateurismClause: 'strict_amateur',
        fieldRequirement: 'fenced_pitch_mandatory',
        disputeResolution: 'statutory_tribunal',
      },
      blocs: [],
      competitions: [],
      professionalismPolicy: {
        tier: 'strict_amateur',
        sanctionsForBrownAmateurism: true,
        minimumWageMandatory: false,
      },
      historicalEvents: [],
      dissidentLeague: {
        id: 'amea_1916',
        name: 'Associação Mineira de Esportes Athleticos (AMEA)',
        foundedYear: 1916,
        memberClubIds: ['yale', 'villa_nova'], // 2 dissident clubs
        leaderClubId: 'yale',
        reason: 'Cisão estatutária',
      },
    };

    const competitions = generateAnnualCompetitions(
      1916,
      mockLocalClubs,
      mockRegionalClubs,
      mockSchismFederation,
      null,
      dummyRng
    );

    // Must generate 2 championships: LMDT Official + AMEA Dissident!
    expect(competitions.length).toBe(2);

    const lmdtComp = competitions.find((c) => c.organizer === 'lmdt');
    const ameaComp = competitions.find((c) => c.organizer === 'amea');

    expect(lmdtComp).toBeDefined();
    expect(ameaComp).toBeDefined();

    expect(lmdtComp?.participatingClubIds).toEqual(['sport_mineiro', 'aa_comercio']);
    expect(ameaComp?.participatingClubIds).toEqual(['yale', 'villa_nova']);
    expect(lmdtComp?.trophy?.competitionName).toContain('LMDT');
    expect(ameaComp?.trophy?.competitionName).toContain('AMEA');
  });

  it('correctly schedules dates and rounds via Berger algorithm', () => {
    const participants: ClubParticipantSummary[] = [
      { id: 'c1', name: 'Clube 1', shortName: 'C1', isPlayer: true },
      { id: 'c2', name: 'Clube 2', shortName: 'C2', isPlayer: false },
      { id: 'c3', name: 'Clube 3', shortName: 'C3', isPlayer: false },
    ];

    const fixtures = generateRoundRobinFixtures('test_comp', participants, 1910, false, 5);
    // 3 teams with bye -> 3 rounds, 1 match per round = 3 matches
    expect(fixtures.length).toBe(3);
    expect(fixtures[0]!.round).toBe(1);
    expect(fixtures[1]!.round).toBe(2);
    expect(fixtures[2]!.round).toBe(3);
  });
});
