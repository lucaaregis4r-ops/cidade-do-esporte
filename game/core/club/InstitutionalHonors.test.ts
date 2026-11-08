import { describe, it, expect } from 'vitest';
import {
  CANONICAL_HONOR_TYPES,
  isLegendEligibleForHonor,
  createHonorProposal,
  voteOnHonorProposal,
  validateHonorProposal,
} from './InstitutionalHonors';
import type { ClubLegend } from './LegacyScore';

describe('InstitutionalHonors (Alpha G: G7 / Macroetapa 31)', () => {
  const dummyDate = { year: 1912, month: 6, day: 20 };

  const dummyLegend: ClubLegend = {
    id: 'legend-p1',
    personId: 'p1',
    name: 'Sebastião Ferramenta',
    role: 'founder',
    category: 'FIGURA_FUNDADORA',
    legacyScore: 78,
    breakdown: {
      yearsDedicationScore: 10,
      titlesScore: 25,
      matchesScore: 5,
      decisiveMomentsScore: 8,
      loyaltyScore: 15,
      institutionalImpactScore: 0,
      founderBonusScore: 35,
      totalScore: 98,
    },
    yearsActivePt: '1910–1912',
    titlesCount: 1,
    matchesCount: 12,
    isFounder: true,
    isLiving: true,
    biography: 'Fundador ilustre e zagueiro destemido.',
    achievementsPt: ['Membro fundador'],
    honorsReceived: [],
  };

  it('defines the 5 canonical honor types with costs and minimum categories', () => {
    expect(CANONICAL_HONOR_TYPES).toHaveLength(5);
    const estatua = CANONICAL_HONOR_TYPES.find((h) => h.type === 'estatua');
    const busto = CANONICAL_HONOR_TYPES.find((h) => h.type === 'busto');

    expect(estatua?.costPpu).toBe(120);
    expect(estatua?.minimumCategory).toBe('LENDA');

    expect(busto?.costPpu).toBe(50);
    expect(busto?.minimumCategory).toBe('IDOLO');
  });

  it('validates eligibility based on legend category', () => {
    // FIGURA_FUNDADORA can receive busto, nome_setor, titulo_benemerito
    expect(isLegendEligibleForHonor('FIGURA_FUNDADORA', 'busto')).toBe(true);
    expect(isLegendEligibleForHonor('FIGURA_FUNDADORA', 'titulo_benemerito')).toBe(true);
    expect(isLegendEligibleForHonor('FIGURA_FUNDADORA', 'estatua')).toBe(false); // requires LENDA

    // LENDA can receive all
    expect(isLegendEligibleForHonor('LENDA', 'estatua')).toBe(true);

    // MEMORAVEL can only receive titulo_benemerito
    expect(isLegendEligibleForHonor('MEMORAVEL', 'busto')).toBe(false);
    expect(isLegendEligibleForHonor('MEMORAVEL', 'titulo_benemerito')).toBe(true);
  });

  it('creates an institutional honor proposal in pending status', () => {
    const proposal = createHonorProposal({
      legend: dummyLegend,
      honorType: 'busto',
      date: dummyDate,
    });

    expect(validateHonorProposal(proposal)).toBe(true);
    expect(proposal.status).toBe('pending');
    expect(proposal.costPpu).toBe(50);
    expect(proposal.legendName).toBe('Sebastião Ferramenta');
  });

  it('rejects proposal when treasury balance is insufficient', () => {
    const proposal = createHonorProposal({
      legend: dummyLegend,
      honorType: 'busto',
      date: dummyDate,
    });

    const outcome = voteOnHonorProposal({
      proposal,
      treasuryPpu: 20, // Less than 50
      legendScore: 78,
      resolutionDate: dummyDate,
      rngSample: 0.9,
    });

    expect(outcome.approved).toBe(false);
    expect(outcome.updatedProposal.status).toBe('rejected');
    expect(outcome.resolutionTextPt).toContain('indisponibilidade orçamentária');
    expect(outcome.costPpu).toBe(0);
  });

  it('approves proposal when treasury is sufficient and Council votes in favor', () => {
    const proposal = createHonorProposal({
      legend: dummyLegend,
      honorType: 'busto',
      date: dummyDate,
    });

    const outcome = voteOnHonorProposal({
      proposal,
      treasuryPpu: 200,
      legendScore: 85,
      resolutionDate: dummyDate,
      rngSample: 0.8,
    });

    expect(outcome.approved).toBe(true);
    expect(outcome.votesInFavor).toBeGreaterThan(outcome.votesAgainst);
    expect(outcome.updatedProposal.status).toBe('approved');
    expect(outcome.costPpu).toBe(50);
    expect(outcome.resolutionTextPt).toContain('Aprovado por maioria');
  });
});
