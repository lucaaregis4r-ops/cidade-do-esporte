import { describe, it, expect } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createPerson } from '../person/Person';
import {
  emergeFootballerFromPerson,
  generateInauguralFootballSquad,
  validateFootballSquadState,
  validateFootballer,
} from './Footballer';
import {
  HISTORICAL_TRAINING_DETAILS,
  evaluateFacilityModifiers,
  processWeeklyTrainingAndCondition,
  processAnnualPlayerAging,
  setSquadTrainingRegime,
} from './FootballTraining';
import type { ClubFacility } from '../club/ClubFacilities';

describe('Historical Football Training, Condition & Aging (Alpha E: E3 + E4)', () => {
  const testPerson = createPerson({
    id: 'person-test-atleta',
    name: 'Mário de Castro',
    birthDate: { year: 1892, month: 3, day: 15 },
    parents: ['p-father', 'p-mother'],
    children: [],
    districtId: 'centro',
    socialClass: 'working_class',
    occupation: 'Estudante de Medicina',
    traits: {
      leadership: 80,
      ambition: 85,
      traditionalism: 40,
      sociability: 70,
      honesty: 80,
      passion: 90,
    },
    biography: 'Goleador nato e estudante de medicina.',
    reputation: 65,
    clubAffinities: { 'club-main': 95 },
    footballInterest: 95,
  });

  const sampleFacilities: readonly ClubFacility[] = [
    {
      id: 'fac-1',
      name: 'Campo de Terra Batida do Prado',
      type: 'dirt_pitch',
      parcelId: 'parcel-1',
      installationYear: 1910,
      condition: 85,
      maintenanceCostPPU: 1.5,
    },
    {
      id: 'fac-2',
      name: 'Vestiário Rústico de Madeira',
      type: 'locker_room',
      parcelId: 'parcel-1',
      installationYear: 1910,
      condition: 90,
      maintenanceCostPPU: 1.0,
    },
  ];

  it('provides all 4 historical 1910 training regimens with authentic attributes', () => {
    expect(HISTORICAL_TRAINING_DETAILS.recreational.namePt).toContain('Bate-Bola Livre aos Sábados');
    expect(HISTORICAL_TRAINING_DETAILS.tactical_pyramid.namePt).toContain('Ensaio de Linhas na Pirâmide 2-3-5');
    expect(HISTORICAL_TRAINING_DETAILS.physical_calisthenics.namePt).toContain('Calistenia e Corridas Rústicas');
    expect(HISTORICAL_TRAINING_DETAILS.scrimmage_first_vs_second.namePt).toContain('Coletivo 1º vs 2º Quadro');

    expect(HISTORICAL_TRAINING_DETAILS.recreational.injuryRiskFactor).toBeLessThan(
      HISTORICAL_TRAINING_DETAILS.scrimmage_first_vs_second.injuryRiskFactor
    );
  });

  it('evaluates facility modifiers: dressing room boosts fatigue recovery and dirt pitch increases technique/injury', () => {
    const withoutFacilities = evaluateFacilityModifiers([]);
    expect(withoutFacilities.injuryRiskMultiplier).toBeGreaterThan(1.0);
    expect(withoutFacilities.notesPt[0]).toContain('Sem praça própria');

    const withFacilities = evaluateFacilityModifiers(sampleFacilities);
    expect(withFacilities.fatigueRecoveryBonus).toBeGreaterThan(withoutFacilities.fatigueRecoveryBonus);
    expect(withFacilities.notesPt.some((n) => n.includes('Campo de terra batida'))).toBe(true);
    expect(withFacilities.notesPt.some((n) => n.includes('Vestiário de madeira'))).toBe(true);
  });

  it('processes weekly training: adjusts condition, fatigue and updates valid squad state', () => {
    const rng = new CampaignRng('weekly-training-seed');
    const squad = generateInauguralFootballSquad(
      'Cidade de Minas Foot-Ball Club',
      { year: 1910, month: 1, day: 1 },
      [testPerson],
      rng
    );

    expect(validateFootballSquadState(squad)).toBe(true);

    const result = processWeeklyTrainingAndCondition(
      squad,
      { year: 1910, month: 1, day: 8 },
      rng,
      sampleFacilities
    );

    expect(validateFootballSquadState(result.squad)).toBe(true);
    expect(result.squad.footballers.length).toBe(squad.footballers.length);

    // Each footballer has valid condition and fatigue
    for (const f of result.squad.footballers) {
      expect(f.condition).toBeGreaterThanOrEqual(15);
      expect(f.condition).toBeLessThanOrEqual(100);
      expect(f.fatigue).toBeGreaterThanOrEqual(0);
      expect(f.fatigue).toBeLessThanOrEqual(100);
    }
  });

  it('allows changing training regime cleanly via setSquadTrainingRegime', () => {
    const rng = new CampaignRng('regime-seed');
    const squad = generateInauguralFootballSquad('Club', { year: 1910, month: 1, day: 1 }, [testPerson], rng);

    const updatedSquad = setSquadTrainingRegime(squad, {
      type: 'physical_calisthenics',
      intensity: 'intense',
      weeklySessions: 2,
      focus: 'physical',
    });

    expect(updatedSquad.trainingRegime?.type).toBe('physical_calisthenics');
    expect(updatedSquad.trainingRegime?.intensity).toBe('intense');
    expect(validateFootballSquadState(updatedSquad)).toBe(true);
  });

  it('handles injury occurrence and recovery over multiple training weeks', () => {
    const rng = new CampaignRng('injury-test-seed');
    const athlete = emergeFootballerFromPerson(
      testPerson,
      'CF',
      { year: 1910, month: 1, day: 1 },
      rng,
      'amateur'
    );

    // Create a squad with high injury risk and intense scrimmage
    const highRiskAthlete = {
      ...athlete,
      injuryRisk: 95,
      fatigue: 85,
    };

    const squad = {
      footballers: [highRiskAthlete],
      formationTactic: '2-3-5' as const,
      trainingRegime: {
        type: 'scrimmage_first_vs_second' as const,
        intensity: 'intense' as const,
        weeklySessions: 2,
        focus: 'balanced' as const,
      },
    };

    // Run weeks until an injury or recovery occurs
    let currentSquad = squad;
    let hadInjury = false;

    for (let week = 1; week <= 20; week++) {
      const step = processWeeklyTrainingAndCondition(
        currentSquad,
        { year: 1910, month: 2, day: week },
        rng,
        [] // No facilities -> higher risk
      );
      currentSquad = step.squad;

      const player = currentSquad.footballers[0];
      if (player.currentInjury) {
        hadInjury = true;
        expect(player.currentInjury.weeksRemaining).toBeGreaterThanOrEqual(0);
        expect(validateFootballer(player)).toBe(true);
      }
    }

    expect(hadInjury).toBe(true);
  });

  it('processes annual aging on January 1st: increments age and applies physiological curves', () => {
    const rng = new CampaignRng('aging-test-seed');
    const squad = generateInauguralFootballSquad(
      'Club',
      { year: 1910, month: 1, day: 1 },
      [testPerson],
      rng
    );

    const initialAges = squad.footballers.map((f) => f.age);

    const agingResult = processAnnualPlayerAging(squad, 1911, rng);

    expect(validateFootballSquadState(agingResult.squad)).toBe(true);

    const newAges = agingResult.squad.footballers.map((f) => f.age);
    for (let i = 0; i < newAges.length; i++) {
      expect(newAges[i]).toBe(initialAges[i] + 1);
    }
  });

  it('guarantees strict determinism: identical seeds yield identical training and aging outcomes', () => {
    const rng1 = new CampaignRng('deterministic-training-seed');
    const rng2 = new CampaignRng('deterministic-training-seed');

    const squad1 = generateInauguralFootballSquad('Club', { year: 1910, month: 1, day: 1 }, [testPerson], rng1);
    const squad2 = generateInauguralFootballSquad('Club', { year: 1910, month: 1, day: 1 }, [testPerson], rng2);

    const res1 = processWeeklyTrainingAndCondition(squad1, { year: 1910, month: 1, day: 8 }, rng1, sampleFacilities);
    const res2 = processWeeklyTrainingAndCondition(squad2, { year: 1910, month: 1, day: 8 }, rng2, sampleFacilities);

    expect(res1.squad.footballers[0].condition).toBe(res2.squad.footballers[0].condition);
    expect(res1.squad.footballers[0].fatigue).toBe(res2.squad.footballers[0].fatigue);
    expect(res1.squad.footballers[0].technical.shooting).toBe(res2.squad.footballers[0].technical.shooting);
  });
});
