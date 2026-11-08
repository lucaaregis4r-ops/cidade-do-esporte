import { describe, expect, it } from 'vitest';
import type { CityParcel } from '../city/cityParcels';
import {
  evaluateParcelForClub,
  generateContractProposals,
  OCCUPANCY_TYPES,
  validateLandContract,
} from './ClubLandContract';

function createMockParcel(overrides?: Partial<CityParcel>): CityParcel {
  return {
    id: 'parcel-10-12',
    tiles: [{ x: 10, y: 12 }, { x: 10, y: 13 }, { x: 11, y: 12 }],
    area: 3,
    terrainDifficulty: 0.15,
    districtId: 'railway-hub',
    centrality: 0.5,
    accessibility: 0.7,
    railAccess: 0.8,
    roadAccess: 0.6,
    neighborhoodPopulation: 120,
    landValuePpu: 14.5,
    purchaseHistory: [],
    historicalEvents: [
      {
        id: 'est-1',
        date: { year: 1910, month: 1, day: 1 },
        kind: 'parcel-established',
        description: 'Established',
      },
    ],
    ...overrides,
  };
}

describe('ClubLandContract', () => {
  it('rejects parcels with public institutions', () => {
    const parcel = createMockParcel();
    const evaluation = evaluateParcelForClub(parcel, true, 'railway');

    expect(evaluation.viable).toBe(false);
    expect(evaluation.suitabilityScore).toBe(0);
    expect(evaluation.reasons[0]).toContain('instituição pública');
  });

  it('rewards railway affinity for parcels with rail access', () => {
    const parcel = createMockParcel({ railAccess: 0.9, terrainDifficulty: 0.1 });
    const railwayEval = evaluateParcelForClub(parcel, false, 'railway');
    const merchantEval = evaluateParcelForClub(parcel, false, 'merchants');

    expect(railwayEval.viable).toBe(true);
    expect(railwayEval.suitabilityScore).toBeGreaterThan(merchantEval.suitabilityScore);
    expect(railwayEval.recommendedOccupancy).toContain('CESSAO_EMPRESARIAL');
  });

  it('generates historically consistent contract proposals', () => {
    const parcel = createMockParcel();
    const proposals = generateContractProposals({
      parcel,
      clubId: 'club-test',
      origin: 'railway',
      date: { year: 1910, month: 3, day: 15 },
      initialCapitalPpu: 35.0,
    });

    expect(proposals.length).toBeGreaterThanOrEqual(3);

    const compra = proposals.find((p) => p.type === 'COMPRA');
    expect(compra).toBeDefined();
    expect(compra!.monthlyCostPpu).toBe(0);
    expect(compra!.upfrontCostPpu).toBeGreaterThan(0);

    const aluguel = proposals.find((p) => p.type === 'ALUGUEL');
    expect(aluguel).toBeDefined();
    expect(aluguel!.monthlyCostPpu).toBeGreaterThan(0);

    const cessao = proposals.find((p) => p.type === 'CESSAO_EMPRESARIAL');
    expect(cessao).toBeDefined();
    expect(cessao!.grantorName).toContain('Estrada de Ferro');
  });

  it('validates and defensively freezes contract objects', () => {
    const valid = {
      id: 'c-1',
      parcelId: 'p-1',
      clubId: 'cl-1',
      type: 'ALUGUEL',
      startDate: { year: 1910, month: 5, day: 1 },
      durationYears: 5,
      upfrontCostPpu: 2.5,
      monthlyCostPpu: 0.8,
      grantorName: 'Locador Teste',
      terms: ['Termo 1', 'Termo 2'],
    };

    const validated = validateLandContract(valid);
    expect(validated).not.toBeNull();
    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(validated!.terms)).toBe(true);

    expect(validateLandContract({ ...valid, upfrontCostPpu: -10 })).toBeNull();
    expect(validateLandContract({ ...valid, type: 'INVALID' })).toBeNull();
  });

  it('covers all defined occupancy types', () => {
    expect(OCCUPANCY_TYPES).toContain('COMPRA');
    expect(OCCUPANCY_TYPES).toContain('ALUGUEL');
    expect(OCCUPANCY_TYPES).toContain('ARRENDAMENTO');
    expect(OCCUPANCY_TYPES).toContain('CESSAO_EMPRESARIAL');
    expect(OCCUPANCY_TYPES).toContain('DOACAO');
    expect(OCCUPANCY_TYPES).toContain('CONCESSAO_PUBLICA');
    expect(OCCUPANCY_TYPES).toContain('USO_COMPARTILHADO');
  });
});
