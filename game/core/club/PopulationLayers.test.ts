/**
 * Tests for PopulationLayers (Alpha D: D5).
 */

import { describe, it, expect } from 'vitest';
import { computeUrbanDemographics } from './PopulationLayers';
import { PersonRegistry } from '../person/PersonRegistry';
import { createPerson } from '../person/Person';
import type { CityDistricts1910 } from '../city/cityDistricts';

describe('PopulationLayers (Alpha D: D5)', () => {
  const dummyDistricts: CityDistricts1910 = {
    year: 1910,
    totalLandArea: 100,
    totalPopulationUnits: 200,
    totalEmploymentUnits: 150,
    districtByTile: [],
    districts: [
      {
        id: 'dist-centro',
        kind: 'public-square',
        anchor: { x: 10, y: 10 },
        tiles: [{ x: 10, y: 10 }],
        landArea: 40,
        populationUnits: 120,
        employmentUnits: 100,
        centrality: 100,
        populationShareBps: 6000,
        employmentShareBps: 6000,
      },
      {
        id: 'dist-estacao',
        kind: 'railway-station',
        anchor: { x: 20, y: 10 },
        tiles: [{ x: 20, y: 10 }],
        landArea: 60,
        populationUnits: 80,
        employmentUnits: 50,
        centrality: 70,
        populationShareBps: 4000,
        employmentShareBps: 4000,
      },
    ],
  };

  it('aggregates L0 population accurately from districts and growth', () => {
    const registry = new PersonRegistry();
    const demo = computeUrbanDemographics(dummyDistricts, 50, registry, 1910);

    expect(demo.year).toBe(1910);
    // (200 + 50) * 50 = 12500
    expect(demo.l0.totalPopulation).toBe(12500);
    expect(demo.l0.populationByDistrict['dist-centro']).toBe(7500); // 60%
    expect(demo.l0.populationByDistrict['dist-estacao']).toBe(5000); // 40%

    // Class partition
    expect(demo.l0.populationByClass.working_class).toBeGreaterThan(demo.l0.populationByClass.elite);
    // Age partition
    expect(demo.l0.populationByAge.young_adult).toBeGreaterThan(0);
  });

  it('generates consistent L1 cohorts for each district, class, and age bracket', () => {
    const registry = new PersonRegistry();
    const demo = computeUrbanDemographics(dummyDistricts, 0, registry, 1910);

    // 2 districts × 4 classes × 4 age brackets = 32 cohorts
    expect(demo.l1.totalCohortsCount).toBe(32);
    expect(demo.l1.cohorts.length).toBe(32);

    const youthWorker = demo.l1.cohorts.find(
      (c) => c.districtId === 'dist-centro' && c.socialClass === 'working_class' && c.ageBracket === 'young_adult',
    );
    expect(youthWorker).toBeDefined();
    expect(youthWorker?.estimatedFootballInterest).toBeGreaterThan(60);
    expect(youthWorker?.typicalOccupations).toContain('Ferroviário');
    expect(demo.l1.highInterestPopulation).toBeGreaterThan(0);
  });

  it('summarizes materialized L2 people from PersonRegistry', () => {
    const registry = new PersonRegistry();
    const person1 = createPerson({
      id: 'p-1',
      name: 'Alberto Santos',
      birthDate: { year: 1880, month: 5, day: 10 },
      districtId: 'dist-centro',
      occupation: 'Engenheiro',
      economicClass: 'upper_class',
      wealthIndex: 75,
      footballInterest: 90,
      clubAffinities: { 'club-1': 80 },
      reputation: 85,
    });
    const person2 = createPerson({
      id: 'p-2',
      name: 'José da Silva',
      birthDate: { year: 1892, month: 2, day: 14 },
      districtId: 'dist-estacao',
      occupation: 'Maquinista',
      economicClass: 'working_class',
      wealthIndex: 30,
      footballInterest: 95,
      clubAffinities: { 'club-1': 60 },
      reputation: 60,
    });

    registry.register(person1);
    registry.register(person2);

    const demo = computeUrbanDemographics(dummyDistricts, 0, registry, 1910, 'club-1');

    expect(demo.l2.totalMaterialized).toBe(2);
    expect(demo.l2.personsByClass.upper_class).toBe(1);
    expect(demo.l2.personsByClass.working_class).toBe(1);
    expect(demo.l2.personsByClass.elite).toBe(0);
    expect(demo.l2.averageReputation).toBe(Math.round((85 + 60) / 2));
    expect(demo.l2.clubAffiliatedCount).toBe(2);
  });
});
