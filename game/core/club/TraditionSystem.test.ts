import { describe, it, expect } from 'vitest';
import {
  deriveTraditionalNicknames,
  deriveTraditionalRituals,
  calculateTraditionStrength,
  buildClubTraditionProfile,
} from './TraditionSystem';

describe('TraditionSystem (Alpha G: G8 / Macroetapa 32)', () => {
  const dummyColors = { primary: '#1a3a60', secondary: '#ffffff' };

  it('derives authentic nicknames according to social origins and colors', () => {
    const railwayNicknames = deriveTraditionalNicknames('railway', 'Clube da Estação', dummyColors);
    expect(railwayNicknames).toContain('O Trem de Ferro');
    expect(railwayNicknames).toContain('O Grêmio dos Trilhos');

    const workerNicknames = deriveTraditionalNicknames('workers', 'União Operária', dummyColors);
    expect(workerNicknames).toContain('O Leão da Fábrica');
    expect(workerNicknames).toContain('O Brioso Operário');

    const eliteNicknames = deriveTraditionalNicknames('elite', 'América Mineiro', dummyColors);
    expect(eliteNicknames).toContain('O Aristocrático');
  });

  it('evolves traditional rituals across the decades (1910s -> 1930s radio anthem -> 1940s dérbi fireworks)', () => {
    // In 1910
    const rituals1910 = deriveTraditionalRituals('workers', 1910, 1910);
    expect(rituals1910).toHaveLength(1);
    expect(rituals1910[0].id).toBe('rit-inaugural');

    // In 1918
    const rituals1918 = deriveTraditionalRituals('workers', 1910, 1918);
    expect(rituals1918).toHaveLength(2);
    expect(rituals1918.map((r) => r.id)).toContain('rit-cortejo-torcida');

    // In 1935 (includes gramophone anthem)
    const rituals1935 = deriveTraditionalRituals('workers', 1910, 1935);
    expect(rituals1935).toHaveLength(3);
    expect(rituals1935.map((r) => r.id)).toContain('rit-hino-grafofone');

    // In 1945 (includes grand derby fireworks)
    const rituals1945 = deriveTraditionalRituals('workers', 1910, 1945);
    expect(rituals1945).toHaveLength(4);
    expect(rituals1945.map((r) => r.id)).toContain('rit-festa-classico');
  });

  it('calculates tradition strength accumulating over decades of existence and trophies', () => {
    // 1910: young club, no trophies
    const strength1910 = calculateTraditionStrength({
      foundationYear: 1910,
      currentYear: 1910,
      titlesCount: 0,
      matchesCount: 2,
      hasHistoricStadium: false,
    });
    expect(strength1910).toBeLessThan(15);

    // 1940: 30 years old, 3 titles, stadium
    const strength1940 = calculateTraditionStrength({
      foundationYear: 1910,
      currentYear: 1940,
      titlesCount: 3,
      matchesCount: 60,
      hasHistoricStadium: true,
    });
    expect(strength1940).toBeGreaterThanOrEqual(75);
    expect(strength1940).toBeLessThanOrEqual(100);
  });

  it('builds a complete club tradition profile with playing style', () => {
    const profile = buildClubTraditionProfile({
      clubId: 'club-op-1',
      clubName: 'União Operária F.C.',
      foundingOrigin: 'workers',
      homeNeighborhoodName: 'Bairro Operário da Estação',
      colors: dummyColors,
      currentStadiumName: 'Estádio dos Eucaliptos',
      foundationYear: 1910,
      currentYear: 1935,
      titlesCount: 2,
      matchesCount: 40,
    });

    expect(profile.clubName).toBe('União Operária F.C.');
    expect(profile.primaryPlayingStyle).toBe('valente_combate');
    expect(profile.traditionalNicknames.length).toBeGreaterThanOrEqual(2);
    expect(profile.historicRituals.length).toBeGreaterThanOrEqual(3);
    expect(profile.traditionStrength).toBeGreaterThanOrEqual(45);
  });
});
