import { describe, expect, it } from 'vitest';
import {
  FACILITY_TYPES,
  FACILITY_CATALOG,
  generateInitialFacilities,
  decayFacilities,
  createFacility,
  repairFacility,
  validateClubFacility,
  type ClubFacility,
} from './ClubFacilities';

describe('ClubFacilities domain model (C6, C10)', () => {
  const sampleDate = { year: 1910, month: 5, day: 1 };

  it('provides a catalog covering all defined facility types', () => {
    for (const type of FACILITY_TYPES) {
      const def = FACILITY_CATALOG[type];
      expect(def).toBeDefined();
      expect(def.type).toBe(type);
      expect(def.buildCostPPU).toBeGreaterThan(0);
      expect(def.monthlyMaintenancePPU).toBeGreaterThan(0);
    }
  });

  it('generates coherent initial facilities per origin', () => {
    const railwayFacilities = generateInitialFacilities('railway', sampleDate);
    expect(railwayFacilities.length).toBeGreaterThanOrEqual(2);
    expect(railwayFacilities.some((f) => f.type === 'dirt_pitch')).toBe(true);
    expect(railwayFacilities.some((f) => f.type === 'wooden_fence')).toBe(true);

    const eliteFacilities = generateInitialFacilities('elite', sampleDate);
    expect(eliteFacilities.some((f) => f.type === 'clubhouse')).toBe(true);
    expect(eliteFacilities.find((f) => f.type === 'dirt_pitch')?.condition).toBe(95);

    const workersFacilities = generateInitialFacilities('workers', sampleDate);
    expect(workersFacilities.some((f) => f.type === 'locker_room')).toBe(true);
  });

  it('validates facility objects properly', () => {
    const valid = createFacility('dirt_pitch', sampleDate, 1);
    expect(validateClubFacility(valid)).toBe(true);

    expect(validateClubFacility(null)).toBe(false);
    expect(validateClubFacility({ ...valid, condition: 150 })).toBe(false);
    expect(validateClubFacility({ ...valid, type: 'nuclear_reactor' as unknown as import('./ClubFacilities').FacilityType })).toBe(false);
  });


  it('decays facilities according to maintenance payment status', () => {
    const fac: ClubFacility = {
      id: 'test-1',
      type: 'dirt_pitch',
      name: 'Campo',
      builtDate: sampleDate,
      condition: 100,
      capacity: 200,
      monthlyMaintenancePPU: 5,
      valuePPU: 100,
    };

    const decayedWithMaintenance = decayFacilities([fac], true);
    expect(decayedWithMaintenance[0].condition).toBe(99.5);

    const decayedWithoutMaintenance = decayFacilities([fac], false);
    expect(decayedWithoutMaintenance[0].condition).toBe(97);
  });

  it('repairs a facility back to 100% condition', () => {
    const damaged: ClubFacility = {
      id: 'test-1',
      type: 'dirt_pitch',
      name: 'Campo',
      builtDate: sampleDate,
      condition: 45,
      capacity: 200,
      monthlyMaintenancePPU: 5,
      valuePPU: 100,
    };

    const repaired = repairFacility(damaged);
    expect(repaired.condition).toBe(100);
  });
});
