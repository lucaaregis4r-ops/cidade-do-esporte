import { describe, expect, it } from 'vitest';
import {
  createClub,
  validateClubState,
  FOUNDING_ORIGINS,
  type CreateClubInput,
  type ClubState,
  type FoundingOrigin,
} from './Club';

describe('Club domain model (C1)', () => {
  const validSampleInput: CreateClubInput = {
    id: 'club-uniao-ferroviarios-1910',
    name: 'União Ferroviários Foot-ball Club',
    shortName: 'Ferroviários',
    foundingDate: { year: 1910, month: 5, day: 1 },
    foundingOrigin: 'railway',
    foundingStory: 'Fundado por trabalhadores da oficina ferroviária de Cidade de Minas.',
    colors: { primary: '#003366', secondary: '#ffffff' },
    crestHistory: [
      { startYear: 1910, designId: 'crest-v1-locomotive', changeReason: 'Escudo original de fundação' },
    ],
    founders: ['person-1', 'person-2'],
    parcels: ['parcel-railway-1'],
    facilities: ['facility-pitch-1'],
    reputation: 15,
  };

  it('creates a validated, frozen ClubState from valid input', () => {
    const club = createClub(validSampleInput);

    expect(club.id).toBe('club-uniao-ferroviarios-1910');
    expect(club.name).toBe('União Ferroviários Foot-ball Club');
    expect(club.shortName).toBe('Ferroviários');
    expect(club.foundingDate).toEqual({ year: 1910, month: 5, day: 1 });
    expect(club.foundingOrigin).toBe('railway');
    expect(club.colors.primary).toBe('#003366');
    expect(club.colors.secondary).toBe('#ffffff');
    expect(club.crestHistory).toHaveLength(1);
    expect(club.founders).toEqual(['person-1', 'person-2']);
    expect(club.parcels).toEqual(['parcel-railway-1']);
    expect(club.facilities).toEqual(['facility-pitch-1']);
    expect(club.reputation).toBe(15);

    // Defensive immutability
    expect(Object.isFrozen(club)).toBe(true);
    expect(Object.isFrozen(club.foundingDate)).toBe(true);
    expect(Object.isFrozen(club.colors)).toBe(true);
    expect(Object.isFrozen(club.crestHistory)).toBe(true);
    expect(Object.isFrozen(club.founders)).toBe(true);
  });

  it('rejects empty or whitespace-only names and IDs', () => {
    expect(() => createClub({ ...validSampleInput, id: '' })).toThrow(TypeError);
    expect(() => createClub({ ...validSampleInput, id: '   ' })).toThrow(TypeError);
    expect(() => createClub({ ...validSampleInput, name: '' })).toThrow(TypeError);
    expect(() => createClub({ ...validSampleInput, name: '   ' })).toThrow(TypeError);
  });

  it('rejects dates outside the 1910–1959 campaign or invalid calendar days', () => {
    expect(() => createClub({ ...validSampleInput, foundingDate: { year: 1909, month: 12, day: 31 } })).toThrow(RangeError);
    expect(() => createClub({ ...validSampleInput, foundingDate: { year: 1960, month: 1, day: 1 } })).toThrow(RangeError);
    expect(() => createClub({ ...validSampleInput, foundingDate: { year: 1910, month: 2, day: 29 } })).toThrow(RangeError);
  });

  it('rejects invalid hex colors', () => {
    expect(() => createClub({ ...validSampleInput, colors: { primary: 'blue', secondary: '#ffffff' } })).toThrow(TypeError);
    expect(() => createClub({ ...validSampleInput, colors: { primary: '#123', secondary: '#ffffff' } })).toThrow(TypeError);
    expect(() => createClub({ ...validSampleInput, colors: { primary: '#003366', secondary: '#zzzzzz' } })).toThrow(TypeError);
  });

  it('rejects invalid founding origins and accepts all 6 canonical origins', () => {
    expect(() => createClub({ ...validSampleInput, foundingOrigin: 'alien' as unknown as FoundingOrigin })).toThrow(TypeError);

    for (const origin of FOUNDING_ORIGINS) {
      const club = createClub({ ...validSampleInput, foundingOrigin: origin });
      expect(club.foundingOrigin).toBe(origin);
    }
  });

  it('rejects clubs with empty crest history', () => {
    expect(() => createClub({ ...validSampleInput, crestHistory: [] })).toThrow(TypeError);
  });

  it('rejects out-of-bounds reputation values', () => {
    expect(() => createClub({ ...validSampleInput, reputation: -1 })).toThrow(RangeError);
    expect(() => createClub({ ...validSampleInput, reputation: 101 })).toThrow(RangeError);
    expect(() => createClub({ ...validSampleInput, reputation: NaN })).toThrow(RangeError);
  });

  describe('validateClubState', () => {
    it('round-trips valid serialized club data and returns a frozen ClubState', () => {
      const club = createClub(validSampleInput);
      const json = JSON.parse(JSON.stringify(club));

      const validated = validateClubState(json);
      expect(validated).toEqual(club);
      expect(Object.isFrozen(validated)).toBe(true);
    });

    it('returns null on corrupted or missing fields', () => {
      expect(validateClubState(null)).toBeNull();
      expect(validateClubState(undefined)).toBeNull();
      expect(validateClubState('not-an-object')).toBeNull();
      expect(validateClubState([])).toBeNull();
      expect(validateClubState({})).toBeNull();

      const validJson = JSON.parse(JSON.stringify(createClub(validSampleInput))) as Partial<ClubState>;

      expect(validateClubState({ ...validJson, id: '' })).toBeNull();
      expect(validateClubState({ ...validJson, name: '' })).toBeNull();
      expect(validateClubState({ ...validJson, foundingDate: { year: 1900, month: 1, day: 1 } })).toBeNull();
      expect(validateClubState({ ...validJson, foundingOrigin: 'corrupted' })).toBeNull();
      expect(validateClubState({ ...validJson, colors: { primary: 'invalid' } })).toBeNull();
      expect(validateClubState({ ...validJson, crestHistory: [] })).toBeNull();
      expect(validateClubState({ ...validJson, reputation: -5 })).toBeNull();
      expect(validateClubState({ ...validJson, founders: [''] })).toBeNull();
    });

    it('round-trips club with land contracts and preserves them frozen', () => {
      const clubWithContract = createClub({
        ...validSampleInput,
        contracts: [
          {
            id: 'contract-railway-1',
            parcelId: 'parcel-railway-1',
            clubId: 'club-uniao-ferroviarios-1910',
            type: 'CESSAO_EMPRESARIAL',
            startDate: { year: 1910, month: 5, day: 1 },
            durationYears: 15,
            upfrontCostPpu: 0,
            monthlyCostPpu: 0.1,
            grantorName: 'Estrada de Ferro',
            terms: ['Termo A', 'Termo B'],
          },
        ],
      });

      expect(clubWithContract.contracts).toBeDefined();
      expect(clubWithContract.contracts).toHaveLength(1);
      expect(Object.isFrozen(clubWithContract.contracts)).toBe(true);

      const json = JSON.parse(JSON.stringify(clubWithContract));
      const validated = validateClubState(json);
      expect(validated).toEqual(clubWithContract);
    });

    it('round-trips club with facilities and finances ledger', () => {
      const clubWithAll = createClub({
        ...validSampleInput,
        facilityDetails: [
          {
            id: 'fac-1',
            type: 'dirt_pitch',
            name: 'Campo da Estação',
            builtDate: { year: 1910, month: 5, day: 1 },
            condition: 90,
            capacity: 300,
            monthlyMaintenancePPU: 4,
            valuePPU: 80,
          },
        ],
        finances: {
          balancePPU: 150,
          totalIncomePPU: 150,
          totalExpensesPPU: 0,
          transactions: [
            {
              id: 'tx-1',
              date: { year: 1910, month: 5, day: 1 },
              category: 'founder_subscription',
              amountPPU: 150,
              description: 'Subscrição inicial',
            },
          ],
        },
      });

      expect(clubWithAll.facilityDetails).toBeDefined();
      expect(clubWithAll.facilityDetails).toHaveLength(1);
      expect(clubWithAll.finances?.balancePPU).toBe(150);

      const json = JSON.parse(JSON.stringify(clubWithAll));
      const validated = validateClubState(json);
      expect(validated).toEqual(clubWithAll);
    });

    it('round-trips club with membership state', () => {
      const clubWithMembership = createClub({
        ...validSampleInput,
        membership: {
          members: [
            {
              id: 'mem-1',
              name: 'Dr. Afonso',
              category: 'fundador',
              socialClass: 'upper_class',
              occupation: 'Advogado',
              joinedDate: { year: 1910, month: 5, day: 1 },
              monthlyDuesPPU: 1.0,
              totalPaidPPU: 50.0,
              isDelinquent: false,
            },
          ],
          settings: {
            monthlyDuesPPU: {
              fundador: 1.0,
              contribuinte: 1.0,
              atleta: 0.2,
              benemerito: 5.0,
            },
            admissionFeePPU: 2.0,
          },
          monthlyCollectionPPU: 1.0,
          activeCount: 1,
          delinquentCount: 0,
        },
      });

      expect(clubWithMembership.membership).toBeDefined();
      expect(clubWithMembership.membership?.members).toHaveLength(1);

      const json = JSON.parse(JSON.stringify(clubWithMembership));
      const validated = validateClubState(json);
      expect(validated).toEqual(clubWithMembership);
    });

    it('round-trips club with board state', () => {
      const clubWithBoard = createClub({
        ...validSampleInput,
        board: {
          members: [
            {
              id: 'dir-1',
              name: 'Dr. Afonso',
              role: 'presidente',
              roleLabel: 'Presidente da Diretoria',
              socialClass: 'upper_class',
              occupation: 'Advogado',
              termStart: { year: 1910, month: 5, day: 1 },
              termEnd: { year: 1911, month: 5, day: 1 },
            },
          ],
          electedDate: { year: 1910, month: 5, day: 1 },
          mandateYears: 1,
          deliberationCouncilCount: 5,
        },
      });

      expect(clubWithBoard.board).toBeDefined();
      expect(clubWithBoard.board?.members).toHaveLength(1);

      const json = JSON.parse(JSON.stringify(clubWithBoard));
      const validated = validateClubState(json);
      expect(validated).toEqual(clubWithBoard);
    });
  });
});
