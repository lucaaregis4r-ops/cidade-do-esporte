import { describe, it, expect } from 'vitest';
import {
  calculatePlayerLegacyScore,
  calculatePresidentLegacyScore,
  evaluateClubLegends,
  validateClubLegend,
  type ClubLegend,
} from './LegacyScore';
import type { Footballer } from '../football/Footballer';
import type { Person } from '../person/Person';
import type { ClubState } from './Club';

describe('LegacyScore (Alpha G: G6 / Macroetapa 30)', () => {
  const dummyPlayer: Footballer = {
    id: 'f-101',
    personId: 'p-101',
    name: 'Arthur Friedenreich Mineiro',
    age: 20,
    preferredFoot: 'right',
    positions: ['CF'],
    technical: { ballControl: 85, passing: 70, shooting: 90, tackling: 40, dribbling: 80, aerial: 80, goalkeeping: 10 },
    physical: { pace: 80, stamina: 75, strength: 70, agility: 85 },
    mental: { decision: 80, positioning: 88, composure: 85, courage: 75, discipline: 80 },
    personality: { leadership: 60, professionalism: 80, pressure: 70, ambition: 70, sportsmanship: 80, temperament: 70 },
    potential: 85,
    reputation: 60,
    condition: 100,
    fatigue: 0,
    injuryRisk: 10,
    policyTier: 'strict_amateur',
    squadRole: 'starter',
    joinedDate: { year: 1910, month: 1, day: 1 },
    clubHistory: [],
    matchHistory: [],
    achievements: [],
  };

  const dummyPresident: Person = {
    id: 'p-pres',
    name: 'Dr. Cincinato da Silva',
    birthDate: { year: 1870, month: 3, day: 10 },
    socialClass: 'elite',
    occupationPt: 'Advogado e Magistrado',
    biographyPt: 'Ilustre homem público da capital.',
    personality: {
      ambition: 70,
      leadership: 85,
      sociability: 80,
      loyaltyToClub: 90,
      traditionalism: 75,
    },
    clubAffinities: { club_default: 90 },
    footballInterest: 85,
  };

  it('calculates player legacy score and classifies into canonical categories', () => {
    // 1. Moderate player: MEMORAVEL
    const playerLow = calculatePlayerLegacyScore({
      player: dummyPlayer,
      titlesCount: 0,
      matchesCount: 15,
      yearsAtClub: 2,
      decisiveMomentsCount: 1,
      isLoyal: true,
      isFounder: false,
      currentYear: 1912,
    });
    expect(playerLow.category).toBe('MEMORAVEL');
    expect(playerLow.legacyScore).toBeGreaterThanOrEqual(25);
    expect(playerLow.legacyScore).toBeLessThan(50);
    expect(validateClubLegend(playerLow)).toBe(true);

    // 2. High performing player: IDOLO
    const playerIdolo = calculatePlayerLegacyScore({
      player: dummyPlayer,
      titlesCount: 1,
      matchesCount: 15,
      yearsAtClub: 3,
      decisiveMomentsCount: 1,
      isLoyal: true,
      isFounder: false,
      currentYear: 1913,
    });
    expect(playerIdolo.category).toBe('IDOLO');
    expect(playerIdolo.legacyScore).toBeGreaterThanOrEqual(50);
    expect(playerIdolo.legacyScore).toBeLessThan(80);

    // 3. Historic champion and multi-titlist: LENDA
    const playerLenda = calculatePlayerLegacyScore({
      player: dummyPlayer,
      titlesCount: 3,
      matchesCount: 60,
      yearsAtClub: 8,
      decisiveMomentsCount: 5,
      isLoyal: true,
      isFounder: false,
      currentYear: 1920,
    });
    expect(playerLenda.category).toBe('LENDA');
    expect(playerLenda.legacyScore).toBeGreaterThanOrEqual(80);
    expect(playerLenda.breakdown.titlesScore).toBe(75);
  });

  it('recognizes founding figures with FIGURA_FUNDADORA category', () => {
    const founderLegend = calculatePlayerLegacyScore({
      player: dummyPlayer,
      titlesCount: 0,
      matchesCount: 10,
      yearsAtClub: 2,
      decisiveMomentsCount: 0,
      isLoyal: true,
      isFounder: true,
      currentYear: 1912,
    });

    expect(founderLegend.isFounder).toBe(true);
    expect(founderLegend.category).toBe('FIGURA_FUNDADORA');
    expect(founderLegend.achievementsPt).toContain(
      'Membro fundador do clube na pioneira reunião de 1910'
    );
  });

  it('calculates president legacy score based on institutional impact and titles', () => {
    const presLegend = calculatePresidentLegacyScore({
      person: dummyPresident,
      mandateYears: 4,
      titlesCount: 2,
      facilitiesBuiltCount: 3,
      isFounder: true,
      currentYear: 1914,
    });

    expect(presLegend.role).toBe('founder');
    expect(presLegend.legacyScore).toBeGreaterThanOrEqual(80);
    expect(presLegend.category).toBe('LENDA');
    expect(presLegend.achievementsPt).toContain('2 título(s) conquistados durante a gestão');
    expect(presLegend.achievementsPt).toContain('3 grande(s) obra(s) e melhoria(s) patrimonial(is) inaugurada(s)');
  });

  it('evaluates full club state and derives sorted legends with honors preservation', () => {
    const dummyClub: ClubState = {
      id: 'club_sample',
      name: 'Sport Club Cidade de Minas',
      shortName: 'Cidade de Minas',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'workers',
      colors: { primary: '#1a3a60', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'crest-1', changeReason: 'Inaugural' }],
      founders: [dummyPresident.id, dummyPlayer.personId],
      parcels: [],
      facilities: ['fac-1'],
      reputation: 60,
      board: {
        members: [
          {
            id: dummyPresident.id,
            name: dummyPresident.name,
            role: 'presidente',
            roleLabel: 'Presidente da Diretoria',
            socialClass: 'elite',
            occupation: 'Advogado',
            termStart: { year: 1910, month: 1, day: 1 },
            termEnd: { year: 1911, month: 1, day: 1 },
          },
        ],
        electedDate: { year: 1910, month: 1, day: 1 },
        mandateYears: 1,
        deliberationCouncilCount: 12,
      },
      squad: { footballers: [dummyPlayer] },
      trophies: [{ id: 'tr-1', competitionId: 'comp-1', competitionName: 'Taça Cidade de Minas 1910', seasonYear: 1910, awardedDate: { year: 1910, month: 11, day: 15 }, trophyTier: 'state' }],
      matchHistory: [],
      institutionalHonors: [],
      clubLegends: [],
    };

    const existingHonors: ClubLegend[] = [
      {
        id: `legend-${dummyPresident.id}`,
        personId: dummyPresident.id,
        name: dummyPresident.name,
        role: 'founder',
        category: 'LENDA',
        legacyScore: 90,
        breakdown: {
          yearsDedicationScore: 20,
          titlesScore: 25,
          matchesScore: 0,
          decisiveMomentsScore: 0,
          loyaltyScore: 15,
          institutionalImpactScore: 10,
          founderBonusScore: 35,
          totalScore: 105,
        },
        yearsActivePt: '1910–1912',
        titlesCount: 1,
        matchesCount: 0,
        isFounder: true,
        isLiving: true,
        biography: 'Bio',
        achievementsPt: [],
        honorsReceived: ['honor-busto-1'],
      },
    ];

    const legends = evaluateClubLegends(dummyClub, 1912, existingHonors);

    expect(legends.length).toBeGreaterThanOrEqual(2);
    // Preserves honors received
    const presInResults = legends.find((l) => l.personId === dummyPresident.id);
    expect(presInResults?.honorsReceived).toContain('honor-busto-1');
  });
});
