/**
 * Population Layers (Alpha D: D5).
 * Governs demographic aggregation across the 3 canonical tiers of Cidade de Minas:
 *
 * - L0 Agregada: Total urban population partitioned by district, social class, and age cohort.
 * - L1 Coortes: Statistical socio-demographic cohorts (district × class × age bracket × typical occupation)
 *   governing collective behavior, potential sports interest, and club membership demand.
 * - L2 Materializada: Concretely materialized, biografied historical individuals with genealogy,
 *   stored in PersonRegistry (founders, directors, prominent athletes, and notable members).
 */

import type { CityDistricts1910 } from '../city/cityDistricts';
import type { SocialClass } from './FoundingGroup';
import type { PersonRegistry } from '../person/PersonRegistry';

export type AgeBracket = 'youth' | 'young_adult' | 'adult' | 'elder';

export interface DemographicCohort {
  readonly id: string;
  readonly districtId: string;
  readonly districtKind: string;
  readonly socialClass: SocialClass;
  readonly ageBracket: AgeBracket;
  readonly populationEstimate: number;
  readonly estimatedFootballInterest: number; // 0–100%
  readonly typicalOccupations: readonly string[];
}

export interface Layer0Aggregated {
  readonly totalPopulation: number;
  readonly populationByDistrict: Readonly<Record<string, number>>;
  readonly populationByClass: Readonly<Record<SocialClass, number>>;
  readonly populationByAge: Readonly<Record<AgeBracket, number>>;
}

export interface Layer1Cohorts {
  readonly cohorts: readonly DemographicCohort[];
  readonly totalCohortsCount: number;
  readonly highInterestPopulation: number; // population in cohorts with > 50% football interest
}

export interface Layer2Materialized {
  readonly totalMaterialized: number;
  readonly personsByClass: Readonly<Record<SocialClass, number>>;
  readonly averageReputation: number;
  readonly clubAffiliatedCount: number;
}

export interface UrbanDemographicsSnapshot {
  readonly year: number;
  readonly l0: Layer0Aggregated;
  readonly l1: Layer1Cohorts;
  readonly l2: Layer2Materialized;
}

/** Historical demographic distribution weights for 1910 Cidade de Minas */
const CLASS_WEIGHTS: Readonly<Record<SocialClass, number>> = Object.freeze({
  working_class: 0.52,
  middle_class: 0.28,
  upper_class: 0.15,
  elite: 0.05,
});

const AGE_WEIGHTS: Readonly<Record<AgeBracket, number>> = Object.freeze({
  youth: 0.28,        // 0–15 anos
  young_adult: 0.32,  // 16–30 anos (núcleo esportivo/fundador)
  adult: 0.28,        // 31–55 anos
  elder: 0.12,        // 56+ anos
});

const AGE_INTEREST_MODIFIERS: Readonly<Record<AgeBracket, number>> = Object.freeze({
  youth: 1.25,
  young_adult: 1.45,
  adult: 0.85,
  elder: 0.40,
});

const CLASS_TYPICAL_OCCUPATIONS: Readonly<Record<SocialClass, readonly string[]>> = Object.freeze({
  working_class: ['Ferroviário', 'Operário Têxtil', 'Pedreiro', 'Carpinteiro', 'Artesão', 'Condutor de Bonde'],
  middle_class: ['Escriturário', 'Professor', 'Comerciante', 'Tipógrafo', 'Guarda-Livros', 'Farmacêutico'],
  upper_class: ['Médico', 'Advogado', 'Engenheiro', 'Negociante de Café', 'Magistrado', 'Alto Funcionário Público'],
  elite: ['Capitalista', 'Banqueiro', 'Fazendeiro', 'Deputado Provincial', 'Investidor Imobiliário'],
});

/**
 * Computes the 3-layer urban demographics model for Cidade de Minas.
 * Deterministic and pure function based on city districts, annual growth, and PersonRegistry.
 */
export function computeUrbanDemographics(
  districts: CityDistricts1910 | null,
  growthAddedPopulation: number,
  personRegistry: PersonRegistry,
  currentYear: number,
  clubId?: string,
): UrbanDemographicsSnapshot {
  const baseUnits = districts ? districts.totalPopulationUnits : 1000;
  // Calibration: each abstract population unit roughly represents 50 citizens in 1910–1920
  const POPULATION_PER_UNIT = 50;
  const totalPop = Math.max(5000, Math.round((baseUnits + growthAddedPopulation) * POPULATION_PER_UNIT));

  // L0 Aggregation
  const populationByDistrict: Record<string, number> = {};
  if (districts && districts.districts.length > 0) {
    for (const d of districts.districts) {
      const share = d.populationShareBps / 10000;
      populationByDistrict[d.id] = Math.round(totalPop * share);
    }
  } else {
    populationByDistrict['centro'] = totalPop;
  }

  const populationByClass: Record<SocialClass, number> = {
    working_class: Math.round(totalPop * CLASS_WEIGHTS.working_class),
    middle_class: Math.round(totalPop * CLASS_WEIGHTS.middle_class),
    upper_class: Math.round(totalPop * CLASS_WEIGHTS.upper_class),
    elite: Math.round(totalPop * CLASS_WEIGHTS.elite),
  };

  const populationByAge: Record<AgeBracket, number> = {
    youth: Math.round(totalPop * AGE_WEIGHTS.youth),
    young_adult: Math.round(totalPop * AGE_WEIGHTS.young_adult),
    adult: Math.round(totalPop * AGE_WEIGHTS.adult),
    elder: Math.round(totalPop * AGE_WEIGHTS.elder),
  };

  const l0: Layer0Aggregated = {
    totalPopulation: totalPop,
    populationByDistrict: Object.freeze(populationByDistrict),
    populationByClass: Object.freeze(populationByClass),
    populationByAge: Object.freeze(populationByAge),
  };

  // L1 Cohorts Generation
  const cohorts: DemographicCohort[] = [];
  const districtList = districts ? districts.districts : [{ id: 'centro', kind: 'public-square' as const, populationShareBps: 10000 }];
  const socialClasses: readonly SocialClass[] = ['working_class', 'middle_class', 'upper_class', 'elite'];
  const ageBrackets: readonly AgeBracket[] = ['youth', 'young_adult', 'adult', 'elder'];

  let highInterestPop = 0;

  for (const dist of districtList) {
    const distPop = populationByDistrict[dist.id] ?? Math.round(totalPop / districtList.length);

    for (const sClass of socialClasses) {
      const classShare = CLASS_WEIGHTS[sClass];

      for (const age of ageBrackets) {
        const ageShare = AGE_WEIGHTS[age];
        const cohortPop = Math.max(1, Math.round(distPop * classShare * ageShare));

        // Base football interest in 1910s: high among young adults and railway/students
        let baseInterest = 40;
        if (sClass === 'working_class') baseInterest += 10;
        if (sClass === 'elite') baseInterest -= 5;
        baseInterest = Math.min(95, Math.round(baseInterest * AGE_INTEREST_MODIFIERS[age]));

        if (baseInterest >= 50) {
          highInterestPop += cohortPop;
        }

        cohorts.push(Object.freeze({
          id: `cohort-${dist.id}-${sClass}-${age}`,
          districtId: dist.id,
          districtKind: dist.kind,
          socialClass: sClass,
          ageBracket: age,
          populationEstimate: cohortPop,
          estimatedFootballInterest: baseInterest,
          typicalOccupations: CLASS_TYPICAL_OCCUPATIONS[sClass],
        }));
      }
    }
  }

  const l1: Layer1Cohorts = {
    cohorts: Object.freeze(cohorts),
    totalCohortsCount: cohorts.length,
    highInterestPopulation: highInterestPop,
  };

  // L2 Materialized Aggregation from PersonRegistry
  const allPersons = personRegistry.getAll();
  const materializedByClass: Record<SocialClass, number> = {
    working_class: 0,
    middle_class: 0,
    upper_class: 0,
    elite: 0,
  };

  let totalReputation = 0;
  let clubAffiliated = 0;

  for (const p of allPersons) {
    if (p.economicClass in materializedByClass) {
      materializedByClass[p.economicClass]++;
    }
    totalReputation += p.reputation;
    if (clubId && p.clubAffinities && (p.clubAffinities[clubId] ?? 0) > 30) {
      clubAffiliated++;
    } else if (p.clubHistory && p.clubHistory.length > 0) {
      clubAffiliated++;
    }
  }

  const avgReputation = allPersons.length > 0 ? Math.round(totalReputation / allPersons.length) : 50;

  const l2: Layer2Materialized = {
    totalMaterialized: allPersons.length,
    personsByClass: Object.freeze(materializedByClass),
    averageReputation: avgReputation,
    clubAffiliatedCount: clubAffiliated,
  };

  return Object.freeze({
    year: currentYear,
    l0,
    l1,
    l2,
  });
}
