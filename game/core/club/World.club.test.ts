import { describe, expect, it } from 'vitest';
import { World } from '../World';
import { createClub } from './Club';
import type { LandOccupancyContract } from './ClubLandContract';

describe('World club facilities and finances integration (Sprint 2: C6, C9, C10)', () => {
  function createTestWorld(): World {
    return new World(32, 32, { worldSeed: 'CM-1910-TEST-SPRINT2' });
  }

  function getDryParcelId(world: World): string {
    const city = world.getCityData1910();
    expect(city).not.toBeNull();
    return city!.parcels.parcels[0].id;
  }

  const sampleContract: LandOccupancyContract = {
    id: 'contract-test-1',
    parcelId: 'parcel-1',
    clubId: 'club-test-1910',
    type: 'CESSAO_EMPRESARIAL',
    startDate: { year: 1910, month: 1, day: 1 },
    durationYears: 10,
    upfrontCostPpu: 10,
    monthlyCostPpu: 1.5,
    grantorName: 'Companhia Paulista',
    terms: ['Uso para fins esportivos'],
  };

  it('initializes facilities and finances when founding club with parcel', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    const success = world.foundClubWithParcel(club, parcelId, sampleContract);
    expect(success).toBe(true);

    const worldClub = world.getClub();
    expect(worldClub).not.toBeNull();
    expect(worldClub!.facilityDetails).toBeDefined();
    expect(worldClub!.facilityDetails!.length).toBeGreaterThanOrEqual(2);
    expect(worldClub!.finances).toBeDefined();
    // Started with 250 PPU capital, minus 10 PPU upfront cost = 240 PPU
    expect(worldClub!.finances!.balancePPU).toBe(240);
    expect(worldClub!.finances!.transactions.length).toBe(2);
  });

  it('builds new facilities and debits cost from finances', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    world.foundClubWithParcel(club, parcelId, sampleContract);
    const initialBalance = world.getClub()!.finances!.balancePPU;
    const initialFacCount = world.getClub()!.facilityDetails!.length;

    // Build wooden stands (buildCostPPU: 120)
    const built = world.buildClubFacility('wooden_stands', 'Pavilhão Principal');
    expect(built).toBe(true);

    const updatedClub = world.getClub()!;
    expect(updatedClub.facilityDetails!.length).toBe(initialFacCount + 1);
    expect(updatedClub.finances!.balancePPU).toBe(initialBalance - 120);
    expect(updatedClub.facilityDetails!.some((f) => f.name === 'Pavilhão Principal')).toBe(true);
  });

  it('repairs damaged facilities and updates condition to 100%', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
      facilityDetails: [
        {
          id: 'fac-damaged',
          type: 'dirt_pitch',
          name: 'Campo Desgastado',
          builtDate: { year: 1910, month: 1, day: 1 },
          condition: 60,
          capacity: 200,
          monthlyMaintenancePPU: 4,
          valuePPU: 80,
        },
      ],
      finances: {
        balancePPU: 100,
        totalIncomePPU: 100,
        totalExpensesPPU: 0,
        transactions: [],
      },
    });

    world.foundClubWithParcel(club, parcelId, sampleContract);
    const repaired = world.repairClubFacility('fac-damaged');
    expect(repaired).toBe(true);

    const facility = world.getClub()!.facilityDetails!.find((f) => f.id === 'fac-damaged')!;
    expect(facility.condition).toBe(100);
    expect(world.getClub()!.finances!.balancePPU).toBeLessThan(100);
  });

  it('processes recurring monthly accounting during simulation ticks', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const rentContract: LandOccupancyContract = {
      ...sampleContract,
      type: 'ALUGUEL',
      monthlyCostPpu: 5.0,
      upfrontCostPpu: 0,
    };

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'students',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    world.foundClubWithParcel(club, parcelId, rentContract);
    const balanceBeforeMonth = world.getClub()!.finances!.balancePPU;

    // Advance 31 days (to 01/02/1910 - triggers cadence.monthly)
    for (let day = 0; day < 31; day++) {
      world.tick();
    }

    const clubAfterMonth = world.getClub()!;
    // Monthly maintenance + rent deducted
    expect(clubAfterMonth.finances!.balancePPU).toBeLessThan(balanceBeforeMonth);
    expect(clubAfterMonth.finances!.transactions.some((t) => t.category === 'facility_maintenance')).toBe(true);
  });

  it('initializes membership and collects dues into finances on monthly tick (Sprint 3: C7, C8)', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'merchants',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    world.foundClubWithParcel(club, parcelId, sampleContract);
    const worldClub = world.getClub()!;
    expect(worldClub.membership).toBeDefined();
    expect(worldClub.membership!.members.length).toBeGreaterThan(15);
    expect(worldClub.membership!.activeCount).toBe(worldClub.membership!.members.length);

    // Advance 31 days to 01/02/1910
    for (let day = 0; day < 31; day++) {
      world.tick();
    }

    const clubAfterMonth = world.getClub()!;
    expect(clubAfterMonth.finances!.transactions.some((t) => t.category === 'membership_dues')).toBe(true);
  });

  it('admits a new member and records admission fee transaction', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    world.foundClubWithParcel(club, parcelId, sampleContract);
    const initialMemberCount = world.getClub()!.membership!.members.length;
    const initialBalance = world.getClub()!.finances!.balancePPU;

    const admitted = world.admitClubMember('Manoel Ferreira', 'contribuinte', 'working_class', 'Foguista de locomotiva');
    expect(admitted).toBe(true);

    const clubAfterAdmission = world.getClub()!;
    expect(clubAfterAdmission.membership!.members.length).toBe(initialMemberCount + 1);
    expect(clubAfterAdmission.membership!.members.some((m) => m.name === 'Manoel Ferreira')).toBe(true);
    expect(clubAfterAdmission.finances!.balancePPU).toBeGreaterThan(initialBalance);
  });

  it('initializes statutory board with elected 1910 roles on club foundation (Sprint 4: C11, C12)', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'students',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    world.foundClubWithParcel(club, parcelId, sampleContract);
    const foundedClub = world.getClub()!;

    expect(foundedClub.board).toBeDefined();
    expect(foundedClub.board!.electedDate.year).toBe(1910);
    expect(foundedClub.board!.mandateYears).toBe(1);
    expect(foundedClub.board!.members.length).toBe(7);

    const president = foundedClub.board!.members.find((m) => m.role === 'presidente');
    expect(president).toBeDefined();
    expect(president!.name).toBeTruthy();
    expect(president!.roleLabel).toBe('Presidente da Diretoria');

    const captain = foundedClub.board!.members.find((m) => m.role === 'capitao_geral');
    expect(captain).toBeDefined();
    expect(captain!.roleLabel).toBe('1º Capitão Geral de Campo');
  });

  it('materializes L2 persons with ancestors into person registry upon foundation (Alpha D: D1, D2)', () => {
    const world = createTestWorld();
    const parcelId = getDryParcelId(world);

    const club = createClub({
      id: 'club-test-1910',
      name: 'Sport Club Cidade',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'merchants',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    world.foundClubWithParcel(club, parcelId, sampleContract);
    const persons = world.getAllPersons();

    expect(persons.length).toBeGreaterThan(15);
    const firstFounder = persons[0];
    expect(firstFounder.name).toBeTruthy();
    expect(firstFounder.birthDate.year).toBeLessThan(1910);
    expect(firstFounder.parents.length).toBe(2);

    const father = world.getPerson(firstFounder.parents[0]);
    const mother = world.getPerson(firstFounder.parents[1]);
    expect(father).toBeDefined();
    expect(mother).toBeDefined();
    expect(father!.children).toContain(firstFounder.id);
  });
});



