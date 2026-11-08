import { describe, it, expect } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { createPerson } from '../person/Person';
import { createClub } from '../club/Club';
import {
  generateInauguralFootballSquad,
  validateFootballSquadState,
} from './Footballer';
import {
  DEFAULT_1910_ATHLETICS_POLICY,
  POLICY_TIER_DETAILS,
  validateClubAthleticsPolicyState,
  changeClubAthleticsPolicy,
  computeMonthlyAthleticsCost,
  getAvailableLocalProspects,
  inviteProspectToClub,
  releaseFootballerFromSquad,
  promoteOrDemoteFootballerRole,
  generateMonthlyRivalInquiries,
} from './FootballMarket';

describe('Football Market, Scouting, Invitations & Club Policy (Alpha E: E5 + E6)', () => {
  const rng = new CampaignRng('market-test-seed-1910');

  const person1 = createPerson({
    id: 'p-operario-1',
    name: 'José Ferreira da Silva',
    birthDate: { year: 1891, month: 4, day: 10 },
    parents: ['p-father', 'p-mother'],
    children: [],
    districtId: 'barro_preto',
    socialClass: 'working_class',
    occupation: 'Torneiro Mecânico',
    traits: {
      leadership: 70,
      ambition: 85,
      traditionalism: 30,
      sociability: 80,
      honesty: 85,
      passion: 95,
    },
    biography: 'Operário mecânico com chute potente.',
    reputation: 60,
    clubAffinities: { 'club-main': 90 },
    footballInterest: 92,
  });

  const person2 = createPerson({
    id: 'p-estudante-2',
    name: 'Eduardo Guimarães',
    birthDate: { year: 1893, month: 8, day: 22 },
    parents: ['p-father-2', 'p-mother-2'],
    children: [],
    districtId: 'funcionarios',
    socialClass: 'elite',
    occupation: 'Estudante de Direito',
    traits: {
      leadership: 85,
      ambition: 70,
      traditionalism: 80,
      sociability: 75,
      honesty: 90,
      passion: 85,
    },
    biography: 'Jovem acadêmico e entusiasta da bola inglesa.',
    reputation: 70,
    clubAffinities: { 'club-main': 85 },
    footballInterest: 88,
  });

  const baseSquad = generateInauguralFootballSquad(
    'Cidade de Minas Foot-Ball Club',
    { year: 1910, month: 1, day: 1 },
    [person1, person2],
    rng
  );

  const baseClub = createClub({
    id: 'club-main',
    name: 'Cidade de Minas Foot-Ball Club',
    foundingDate: { year: 1910, month: 1, day: 1 },
    foundingOrigin: 'workers',
    colors: { primary: '#1a1a1a', secondary: '#ffffff' },
    crestHistory: [{ startYear: 1910, designId: 'classic-crest', changeReason: 'Fundação' }],
    founders: ['p-operario-1'],
    squad: baseSquad,
    athleticsPolicy: DEFAULT_1910_ATHLETICS_POLICY,
  });

  it('validates default 1910 athletics policy (Strict Amateurism)', () => {
    expect(validateClubAthleticsPolicyState(DEFAULT_1910_ATHLETICS_POLICY)).toBe(true);
    expect(DEFAULT_1910_ATHLETICS_POLICY.currentTier).toBe('strict_amateur');
    expect(DEFAULT_1910_ATHLETICS_POLICY.stipendPPUPerAthlete).toBe(0);
    expect(computeMonthlyAthleticsCost(baseClub)).toBe(0);
  });

  it('changes club athletics policy to assisted amateurism and updates squad footballer tiers', () => {
    const updatedClub = changeClubAthleticsPolicy(
      baseClub,
      'assisted_amateur',
      { year: 1910, month: 3, day: 1 },
      'Votação da Diretoria para auxílio de transporte aos operários'
    );

    expect(updatedClub.athleticsPolicy?.currentTier).toBe('assisted_amateur');
    expect(updatedClub.athleticsPolicy?.stipendPPUPerAthlete).toBe(POLICY_TIER_DETAILS.assisted_amateur.defaultStipendPPU);
    expect(updatedClub.athleticsPolicy?.history.length).toBe(1);

    // Footballers now have assisted_amateur policy tier
    for (const f of updatedClub.squad!.footballers) {
      expect(f.policyTier).toBe('assisted_amateur');
    }

    // Monthly cost is positive (stipend per starter)
    const cost = computeMonthlyAthleticsCost(updatedClub);
    expect(cost).toBeGreaterThan(0);
  });

  it('filters available local prospects from city citizens who are not yet in the squad', () => {
    const prospectPerson = createPerson({
      id: 'p-prospect-novo',
      name: 'Benedito da Silva',
      birthDate: { year: 1892, month: 5, day: 10 },
      parents: ['p-1', 'p-2'],
      children: [],
      districtId: 'lagoinha',
      socialClass: 'working_class',
      occupation: 'Sapateiro',
      traits: { leadership: 50, ambition: 75, traditionalism: 40, sociability: 60, honesty: 80, passion: 90 },
      biography: 'Ponta veloz nos campos de várzea da Lagoinha.',
      reputation: 50,
      clubAffinities: { 'club-main': 80 },
      footballInterest: 90,
    });

    const prospects = getAvailableLocalProspects(
      [person1, person2, prospectPerson],
      baseClub.squad!.footballers
    );

    // person1 and person2 are already footballers in baseClub
    expect(prospects.some((p) => p.id === person1.id)).toBe(false);
    expect(prospects.some((p) => p.id === person2.id)).toBe(false);
    expect(prospects.some((p) => p.id === prospectPerson.id)).toBe(true);
  });

  it('invites a local prospect to join the squad as reserve or starter', () => {
    const prospectPerson = createPerson({
      id: 'p-prospect-inv',
      name: 'Alcindo Guanabara',
      birthDate: { year: 1890, month: 9, day: 12 },
      parents: ['p-1', 'p-2'],
      children: [],
      districtId: 'floresta',
      socialClass: 'middle_class',
      occupation: 'Tipógrafo',
      traits: { leadership: 60, ambition: 80, traditionalism: 50, sociability: 70, honesty: 85, passion: 90 },
      biography: 'Médio combativo do bairro Floresta.',
      reputation: 55,
      clubAffinities: { 'club-main': 95 },
      footballInterest: 95,
    });

    const initialCount = baseClub.squad!.footballers.length;

    const result = inviteProspectToClub(
      baseClub,
      prospectPerson,
      'HB_R',
      'reserve',
      { year: 1910, month: 4, day: 15 },
      rng
    );

    expect(result.success).toBe(true);
    expect(result.updatedClub.squad!.footballers.length).toBe(initialCount + 1);
    expect(validateFootballSquadState(result.updatedClub.squad)).toBe(true);

    const added = result.updatedClub.squad!.footballers.find((f) => f.personId === prospectPerson.id);
    expect(added).toBeDefined();
    expect(added?.squadRole).toBe('reserve');
    expect(added?.positions).toContain('HB_R');
  });

  it('releases an athlete from the squad and maintains valid state', () => {
    const athleteToRelease = baseClub.squad!.footballers[0];

    const result = releaseFootballerFromSquad(baseClub, athleteToRelease.id);

    expect(result.success).toBe(true);
    expect(result.updatedClub.squad!.footballers.some((f) => f.id === athleteToRelease.id)).toBe(false);
    expect(validateFootballSquadState(result.updatedClub.squad)).toBe(true);
  });

  it('promotes or demotes an athlete between starting 11 and reserves', () => {
    const starterAthlete = baseClub.squad!.footballers.find((f) => f.squadRole === 'starter')!;

    const demotedClub = promoteOrDemoteFootballerRole(baseClub, starterAthlete.id, 'reserve');
    const demoted = demotedClub.squad!.footballers.find((f) => f.id === starterAthlete.id)!;
    expect(demoted.squadRole).toBe('reserve');

    const promotedClub = promoteOrDemoteFootballerRole(demotedClub, starterAthlete.id, 'starter');
    const promoted = promotedClub.squad!.footballers.find((f) => f.id === starterAthlete.id)!;
    expect(promoted.squadRole).toBe('starter');
  });

  it('generates deterministic rival inquiries for high reputation/potential footballers', () => {
    const testRng = new CampaignRng('rival-inquiry-seed');

    // Run multiple months until an inquiry triggers
    let inquiries: ReturnType<typeof generateMonthlyRivalInquiries> = [];
    for (let month = 1; month <= 12; month++) {
      const generated = generateMonthlyRivalInquiries(
        baseClub,
        { year: 1910, month, day: 1 },
        testRng
      );
      if (generated.length > 0) {
        inquiries = generated;
        break;
      }
    }

    expect(inquiries.length).toBeGreaterThan(0);
    const inq = inquiries[0];
    expect(inq.rivalClubName).toBeDefined();
    expect(inq.compensationPPU).toBeGreaterThan(0);
    expect(inq.footballerName).toBeDefined();
  });
});
