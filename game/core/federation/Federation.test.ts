import { describe, it, expect } from 'vitest';
import { validateFederationState, type FederationState } from './Federation';

describe('Federation', () => {
  const mockFed: FederationState = {
    id: 'lmdt_1915',
    name: 'Liga Mineira de Desportos Terrestres',
    shortName: 'LMDT',
    foundingDate: { year: 1915, month: 3, day: 5 },
    status: 'active',
    foundingClubs: ['sport_mineiro', 'villa_nova', 'america', 'aa_comercio', 'yale'],
    affiliatedClubs: ['sport_mineiro', 'villa_nova', 'america', 'aa_comercio', 'yale'],
    presidents: [
      {
        id: 'pres_1915',
        presidentName: 'Dr. Celso Porfírio',
        clubOfOriginId: 'america',
        startYear: 1915,
        endYear: 1917,
        platform: 'Organização do 1º Campeonato Oficial de Cidade de Minas',
        achievements: ['Aprovação do Estatuto Geral', 'Regulamentação da 1ª e 2ª Divisões'],
      },
    ],
    statutes: {
      votingSystem: 'one_club_one_vote',
      amateurismClause: 'strict_amateur',
      fieldRequirement: 'fenced_pitch_mandatory',
      disputeResolution: 'statutory_tribunal',
    },
    blocs: [
      {
        id: 'bloc_elite',
        name: 'Bancada Aristocrática',
        leaderClubId: 'sport_mineiro',
        memberClubIds: ['sport_mineiro', 'yale'],
        ideology: 'aristocratic_conservation',
        influenceShare: 45,
      },
      {
        id: 'bloc_popular',
        name: 'Frente Popular e do Interior',
        leaderClubId: 'villa_nova',
        memberClubIds: ['villa_nova', 'america', 'aa_comercio'],
        ideology: 'popular_expansion',
        influenceShare: 55,
      },
    ],
    competitions: ['camp_mineiro_1915'],
    professionalismPolicy: {
      tier: 'strict_amateur',
      sanctionsForBrownAmateurism: true,
      minimumWageMandatory: false,
    },
    historicalEvents: [
      '05/03/1915: Fundação solene da Liga Mineira de Desportos Terrestres no centro da capital.',
    ],
  };

  it('validates and freezes a compliant FederationState', () => {
    const validated = validateFederationState(mockFed);
    expect(validated).not.toBeNull();
    expect(validated?.id).toBe('lmdt_1915');
    expect(validated?.presidents.length).toBe(1);
    expect(validated?.blocs.length).toBe(2);
    expect(validated?.statutes.votingSystem).toBe('one_club_one_vote');
    expect(Object.isFrozen(validated)).toBe(true);
  });

  it('rejects invalid or corrupted federation objects', () => {
    expect(validateFederationState(null)).toBeNull();
    expect(validateFederationState({})).toBeNull();
    expect(validateFederationState({ ...mockFed, status: 'invalid_status' })).toBeNull();
    expect(validateFederationState({ ...mockFed, statutes: null })).toBeNull();
  });
});
