import { describe, it, expect } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import {
  initializeFederation,
  stepFederationAnnual,
} from './FederationFormationEngine';
import type { LocalClubState } from '../club/ClubBirthEngine';
import type { RegionalClubState } from '../club/RegionalClub';
import type { ClubState } from '../club/Club';
import type { GameDate } from '../HistoricalClock';

describe('FederationFormationEngine', () => {
  const baseDate1915: GameDate = { year: 1915, month: 3, day: 5 };

  const mockLocalClubs: LocalClubState[] = [
    {
      id: 'local_sport_mineiro',
      name: 'Sport Club Mineiro',
      shortName: 'Sport Mineiro',
      foundationDate: { year: 1904, month: 3, day: 1 },
      foundationReason: 'elite',
      districtId: 'centro',
      origin: 'elite',
      colors: { primary: '#000', secondary: '#fff' },
      crestShape: 'swiss',
      reputation: 60,
      status: 'active',
      finances: { cashBalancePpu: 50, monthlyBudgetPpu: 10 },
      facilities: ['dirt_pitch'],
      directorProfile: {
        archetype: 'aristocratic_exclusive',
        presidentName: 'Dr. Afonso Pena',
        ambition: 70,
        financialPrudence: 50,
        amateurPurity: 90,
        aggressiveness: 40,
      },
      squadSummary: { totalPlayers: 15, averageRating: 50 },
      historicalMilestones: [],
    },
    {
      id: 'local_america',
      name: 'América Foot-Ball Club',
      shortName: 'América',
      foundationDate: { year: 1912, month: 4, day: 30 },
      foundationReason: 'students',
      districtId: 'centro',
      origin: 'students',
      colors: { primary: '#008000', secondary: '#fff' },
      crestShape: 'diamond',
      reputation: 65,
      status: 'active',
      finances: { cashBalancePpu: 80, monthlyBudgetPpu: 15 },
      facilities: ['dirt_pitch'],
      directorProfile: {
        archetype: 'pragmatic_competitive',
        presidentName: 'Adolfo Valadares',
        ambition: 85,
        financialPrudence: 60,
        amateurPurity: 50,
        aggressiveness: 75,
      },
      squadSummary: { totalPlayers: 18, averageRating: 60 },
      historicalMilestones: [],
    },
  ];

  const mockRegionalClubs: RegionalClubState[] = [
    {
      id: 'reg_central_villa_operaria',
      name: 'Villa Operária Foot-Ball Club',
      shortName: 'Villa Operária',
      city: 'Nova Lima das Minas',
      region: 'Central',
      foundationYear: 1908,
      origin: 'miners',
      colors: { primary: '#C2185B', secondary: '#FFFFFF' },
      crestShape: 'stripes',
      finances: { annualBudgetPpu: 480, cashBalancePpu: 120, stabilityRating: 85 },
      squadSummary: { totalPlayers: 19, averageRating: 62, starPlayerName: 'George Campbell' },
      stadium: { name: 'Praça de Esportes do Morro Velho', capacity: 2000, pitchType: 'grass' },
      supporterBase: 4200,
      traditionLevel: 80,
      directorArchetype: 'pragmatic_competitive',
      railwayDistanceHours: 3,
      attitudeTowardsCapital: 'fierce_rival',
      historicalMilestones: [],
      matchesPlayedAgainstCapital: 0,
    },
  ];

  const mockPlayerClub = {
    id: 'player_club',
    name: 'Clube Atlético da Cidade',
    shortName: 'Atlético',
    foundingOrigin: 'students',
  } as ClubState;

  it('initializes Federation with founding clubs, presidency and political blocs', () => {
    const rng = new CampaignRng('test_seed_fed_init');
    const fed = initializeFederation(baseDate1915, mockLocalClubs, mockRegionalClubs, mockPlayerClub, rng);

    expect(fed).toBeDefined();
    expect(fed.id).toBe('lmdt_oficial');
    expect(fed.shortName).toBe('LMDT');
    expect(fed.status).toBe('active');
    expect(fed.foundingClubs).toContain('player_club');
    expect(fed.foundingClubs).toContain('local_sport_mineiro');
    expect(fed.foundingClubs).toContain('reg_central_villa_operaria');
    expect(fed.presidents.length).toBe(1);
    expect(fed.blocs.length).toBe(2);
    expect(fed.statutes.votingSystem).toBe('one_club_one_vote');
    expect(fed.historicalEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('evaluates presidential elections and schisms deterministically', () => {
    const rng = new CampaignRng('test_seed_fed_step');
    const initialFed = initializeFederation(baseDate1915, mockLocalClubs, mockRegionalClubs, mockPlayerClub, rng);

    // Advance to 1916 (historic year of tension and schism)
    const date1916: GameDate = { year: 1916, month: 1, day: 1 };
    const stepResult = stepFederationAnnual(initialFed, date1916, mockLocalClubs, rng);

    expect(stepResult.updatedFederation).toBeDefined();
    expect(stepResult.updatedFederation.status).toBe('schism');
    expect(stepResult.updatedFederation.dissidentLeague).toBeDefined();
    expect(stepResult.updatedFederation.dissidentLeague?.name).toContain('AMEA');
    expect(stepResult.eventNotification).toBeDefined();
    expect(stepResult.eventNotification?.title).toContain('Cisma');
  });

  it('remains strictly deterministic for identical RNG seed and inputs', () => {
    const seed = 'determinism_test_fed';
    const rng1 = new CampaignRng(seed);
    const rng2 = new CampaignRng(seed);

    const fed1 = initializeFederation(baseDate1915, mockLocalClubs, mockRegionalClubs, mockPlayerClub, rng1);
    const fed2 = initializeFederation(baseDate1915, mockLocalClubs, mockRegionalClubs, mockPlayerClub, rng2);

    expect(fed1.presidents[0].presidentName).toBe(fed2.presidents[0].presidentName);
    expect(fed1.blocs[0].leaderClubId).toBe(fed2.blocs[0].leaderClubId);

    const date1916: GameDate = { year: 1916, month: 1, day: 1 };
    const step1 = stepFederationAnnual(fed1, date1916, mockLocalClubs, rng1);
    const step2 = stepFederationAnnual(fed2, date1916, mockLocalClubs, rng2);

    expect(step1.updatedFederation.status).toBe(step2.updatedFederation.status);
    expect(step1.updatedFederation.historicalEvents.length).toBe(step2.updatedFederation.historicalEvents.length);
  });
});
