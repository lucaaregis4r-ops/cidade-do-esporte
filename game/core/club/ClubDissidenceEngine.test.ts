import { describe, it, expect } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import { evaluateClubDissidence } from './ClubDissidenceEngine';
import type { LocalClubState } from './ClubBirthEngine';
import type { GameDate } from '../HistoricalClock';

describe('ClubDissidenceEngine', () => {
  const baseDate1910: GameDate = { year: 1910, month: 1, day: 1 };
  const baseDate1914: GameDate = { year: 1914, month: 6, day: 15 };

  const mockAristocraticClub: LocalClubState = {
    id: 'mock_aristocrat',
    name: 'Sport Club Aristocrata',
    shortName: 'Aristocrata',
    foundationDate: baseDate1910,
    foundationReason: 'elite',
    districtId: 'centro',
    origin: 'elite',
    colors: { primary: '#ffffff', secondary: '#000000' },
    crestShape: 'swiss',
    reputation: 60,
    status: 'active',
    finances: { cashBalancePpu: 1000, monthlyBudgetPpu: 150 },
    facilities: ['Campo Cercado', 'Sede Social'],
    directorProfile: {
      archetype: 'aristocratic_exclusive',
      presidentName: 'Dr. Afonso Pena Filho',
      ambition: 80,
      financialPrudence: 20, // baixa prudência favorece cisma
      amateurPurity: 95,
      aggressiveness: 85, // alta agressividade favorece cisma
    },
    squadSummary: { totalPlayers: 16, averageRating: 55 },
    historicalMilestones: [],
  };

  it('does not trigger dissidence if club is too young (< 2 years)', () => {
    const rng = new CampaignRng('test_seed_1');
    const existingIds = new Set<string>(['mock_aristocrat']);
    const date1911: GameDate = { year: 1911, month: 3, day: 1 };

    const result = evaluateClubDissidence(mockAristocraticClub, date1911, rng, existingIds);
    expect(result.dissidenceOccurred).toBe(false);
  });

  it('triggers dissidence when conditions and RNG align, creating new club linked to parent', () => {
    // We can iterate seeds to find one that triggers dissidence with certainty
    let triggered = false;
    let foundResult = null;

    for (let s = 1; s <= 20; s++) {
      const rng = new CampaignRng(`seed_schism_${s}`);
      const existingIds = new Set<string>(['mock_aristocrat']);
      const res = evaluateClubDissidence(mockAristocraticClub, baseDate1914, rng, existingIds);
      if (res.dissidenceOccurred && res.newClub && res.updatedParentMilestone) {
        triggered = true;
        foundResult = res;
        break;
      }
    }

    expect(triggered).toBe(true);
    expect(foundResult).not.toBeNull();
    if (!foundResult || !foundResult.newClub || !foundResult.updatedParentMilestone) return;

    expect(foundResult.newClub.foundationReason).toBe('dissidence');
    expect(foundResult.newClub.parentClubId).toBe('mock_aristocrat');
    expect(foundResult.newClub.dissidenceCause).toBeDefined();
    expect(foundResult.newClub.historicalMilestones.length).toBe(1);
    expect(foundResult.newClub.historicalMilestones[0].title).toBe('Fundação por Dissidência Histórica');

    // Check parent milestone
    expect(foundResult.updatedParentMilestone.title).toContain('Cisma Interno');
    expect(foundResult.updatedParentMilestone.description).toContain(foundResult.newClub.name);
  });

  it('remains strictly deterministic for identical RNG seed and inputs', () => {
    const seed = 'determinism_test_dissidence';
    const rng1 = new CampaignRng(seed);
    const rng2 = new CampaignRng(seed);
    const existingIds = new Set<string>(['mock_aristocrat']);

    const res1 = evaluateClubDissidence(mockAristocraticClub, baseDate1914, rng1, existingIds);
    const res2 = evaluateClubDissidence(mockAristocraticClub, baseDate1914, rng2, existingIds);

    expect(res1.dissidenceOccurred).toBe(res2.dissidenceOccurred);
    if (res1.dissidenceOccurred && res2.dissidenceOccurred) {
      expect(res1.newClub?.id).toBe(res2.newClub?.id);
      expect(res1.newClub?.name).toBe(res2.newClub?.name);
      expect(res1.dissidence?.cause).toBe(res2.dissidence?.cause);
      expect(res1.dissidence?.leaderName).toBe(res2.dissidence?.leaderName);
    }
  });
});
