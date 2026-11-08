import { describe, it, expect } from 'vitest';
import { World } from './World';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';
import { createClub } from './club/Club';
import type { LandOccupancyContract } from './club/ClubLandContract';

describe('World Football Match Simulation & Integration (Alpha E: E7 + E8 + E9 + E10)', () => {
  it('plays a friendly match against 1910 rival, updating squad, finances, match history and interruptions', async () => {
    const world = new World(32, 32, { worldSeed: 'MATCH-WORLD-1910' });
    const city = world.getCityData1910();
    const parcelId = city!.parcels.parcels[0]!.id;

    const contract: LandOccupancyContract = {
      id: 'contract-test-1',
      parcelId,
      clubId: 'club-test-1910',
      type: 'CESSAO_EMPRESARIAL',
      startDate: { year: 1910, month: 1, day: 1 },
      durationYears: 10,
      upfrontCostPpu: 10,
      monthlyCostPpu: 1.5,
      grantorName: 'Estrada de Ferro',
      terms: ['Uso para fins esportivos'],
    };

    const initialClub = createClub({
      id: 'club-test-1910',
      name: 'Clube Atlético da Cidade',
      shortName: 'Atlético',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'students',
      colors: { primary: '#003366', secondary: '#ffffff' },
      crestHistory: [{ startYear: 1910, designId: 'v1', changeReason: 'Inaugural' }],
    });

    const ok = world.foundClubWithParcel(initialClub, parcelId, contract);
    expect(ok).toBe(true);

    const club = world.getClub();
    expect(club).not.toBeNull();
    expect(club!.squad).toBeDefined();
    expect(club!.squad!.footballers.length).toBeGreaterThanOrEqual(11);

    const initialBalance = club!.finances!.balancePPU;

    // Play friendly match against América
    const matchRecord = world.playFriendlyMatch('América Foot-Ball Club', 'festival_taça');
    expect(matchRecord).not.toBeNull();
    expect(matchRecord!.homeScore).toBeGreaterThanOrEqual(0);
    expect(matchRecord!.awayScore).toBeGreaterThanOrEqual(0);
    expect(matchRecord!.attendance).toBeGreaterThan(0);
    expect(matchRecord!.gateReceiptsPPU).toBeGreaterThan(0);

    const updatedClub = world.getClub()!;
    // Match history recorded in club
    expect(updatedClub.matchHistory).toBeDefined();
    expect(updatedClub.matchHistory!.length).toBe(1);
    expect(updatedClub.matchHistory![0]!.id).toBe(matchRecord!.id);

    // Finances updated with revenue and expense (and any tribunal sanctions)
    const tribunalFines = updatedClub.finances!.transactions
      .filter((t) => t.category === 'fine_tribunal')
      .reduce((sum, t) => sum + t.amountPPU, 0);
    const newBalance = updatedClub.finances!.balancePPU;
    expect(newBalance).toBe(initialBalance + matchRecord!.netIncomePPU + tribunalFines);

    const hasMatchRev = updatedClub.finances!.transactions.some((t) => t.category === 'match_revenue');
    const hasMatchExp = updatedClub.finances!.transactions.some((t) => t.category === 'match_expense');
    expect(hasMatchRev).toBe(true);
    expect(hasMatchExp).toBe(true);

    // Participating footballers have appearances and fatigue
    const starter = updatedClub.squad!.footballers[0]!;
    expect(starter.matchHistory.length).toBe(1);
    expect(starter.fatigue).toBeGreaterThan(0);

    // Interruption queue recorded the match result
    const interruptions = world.getInterruptions();
    expect(interruptions.length).toBeGreaterThan(0);
    const matchInterruption = interruptions.find((i) => i.id.startsWith('match-interruption'));
    expect(matchInterruption).toBeDefined();

    // Verify round-trip save persistence preserves match history (E10)
    const serialized = serializeWorld(world);
    const targetWorld = new World(32, 32, { regenerate: false });
    const deserialized = deserializeWorldInto(targetWorld, serialized);
    expect(deserialized).toBe(true);

    const restoredClub = targetWorld.getClub()!;
    expect(restoredClub.matchHistory).toBeDefined();
    expect(restoredClub.matchHistory!.length).toBe(1);
    expect(restoredClub.matchHistory![0]!.id).toBe(matchRecord!.id);
    expect(restoredClub.matchHistory![0]!.homeScore).toBe(matchRecord!.homeScore);
    expect(restoredClub.matchHistory![0]!.awayScore).toBe(matchRecord!.awayScore);
    expect(restoredClub.squad!.footballers[0]!.matchHistory.length).toBe(1);
  });
});
