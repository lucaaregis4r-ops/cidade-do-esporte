import { describe, it, expect } from 'vitest';
import {
  NEWSPAPERS_1910,
  ALL_HISTORICAL_OUTLETS,
  getAvailableMediaOutlets,
  generateMatchPressArticles,
  generateTribunalPressArticle,
  generateGeneralPressArticle,
  generateHonorPressArticle,
  validatePressArticle,
} from './HistoricalPress';
import type { MatchRecord } from '../football/MatchEngine';
import type { MatchIncidentEvent } from '../football/MatchIncidents';

describe('HistoricalPress (Alpha G: G4 & G5 / Macroetapas 26, 30 e 31)', () => {
  const dummyDate = { year: 1910, month: 5, day: 15 };

  const dummyMatch: MatchRecord = {
    id: 'match-1910-001',
    date: dummyDate,
    homeClubId: 'club_operario',
    homeClubName: 'União Operária F.C.',
    awayClubId: 'club_aristocratico',
    awayClubName: 'Clube Atlético da Cidade',
    homeScore: 3,
    awayScore: 1,
    attendance: 850,
    ticketRevenuePpu: 85,
    matchCostPpu: 30,
    netRevenuePpu: 55,
    events: [],
    rules: {
      era: '1910_inaugural',
      maxSubstitutions: 0,
      allowYellowRedCards: false,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      offsideRule: 'three_player',
      refereeStyle: 'verbal_warnings_only',
      matchDurationMinutes: 90,
    },
    pitchCondition: 'dirt',
    homeFormation: '2-3-5',
    awayFormation: '2-3-5',
    summaryPt: 'Vitória expressiva do quadro operário.',
  };

  it('defines the 3 canonical 1910 newspapers with distinct editorial postures', () => {
    expect(NEWSPAPERS_1910).toHaveLength(3);

    const gazeta = NEWSPAPERS_1910.find((n) => n.id === 'gazeta');
    const diario = NEWSPAPERS_1910.find((n) => n.id === 'diario');
    const clarim = NEWSPAPERS_1910.find((n) => n.id === 'clarim');

    expect(gazeta?.editorialStance).toBe('conservative_legalist');
    expect(diario?.editorialStance).toBe('capital_sensationalist');
    expect(clarim?.editorialStance).toBe('working_class_polemical');
  });

  it('evolves media outlets across decades (1910s -> 1920s -> 1930s radio -> 1940s mass press)', () => {
    // 1910: 3 outlets
    const outlets1910 = getAvailableMediaOutlets(1910);
    expect(outlets1910).toHaveLength(3);
    expect(outlets1910.map((o) => o.id)).toEqual(['gazeta', 'diario', 'clarim']);

    // 1925: includes O Combate Esportivo (1922)
    const outlets1925 = getAvailableMediaOutlets(1925);
    expect(outlets1925).toHaveLength(4);
    expect(outlets1925.map((o) => o.id)).toContain('combate');

    // 1938: includes Rádio Inconfidência (1936)
    const outlets1938 = getAvailableMediaOutlets(1938);
    expect(outlets1938).toHaveLength(5);
    const radio = outlets1938.find((o) => o.id === 'radio_inconfidencia');
    expect(radio?.mediaType).toBe('radio');
    expect(radio?.reachMultiplier).toBeGreaterThan(2.0);

    // 1950: includes Folha dos Esportes (1945)
    const outlets1950 = getAvailableMediaOutlets(1950);
    expect(outlets1950).toHaveLength(6);
    expect(outlets1950.map((o) => o.id)).toContain('folha');
  });

  it('generates 3 press articles in 1910 and broadcasts on radio in 1938', () => {
    // In 1910
    const articles1910 = generateMatchPressArticles(dummyMatch, {
      derbyName: 'O Dérbi Operário-Aristocrático',
      intensity: 75,
    });
    expect(articles1910).toHaveLength(3);

    // In 1938
    const match1938: MatchRecord = {
      ...dummyMatch,
      id: 'match-1938-100',
      date: { year: 1938, month: 8, day: 20 },
    };
    const articles1938 = generateMatchPressArticles(match1938);
    expect(articles1938.length).toBeGreaterThanOrEqual(5);

    const radioArticle = articles1938.find((a) => a.newspaperId === 'radio_inconfidencia');
    expect(radioArticle).toBeDefined();
    expect(radioArticle?.mediaType).toBe('radio');
    expect(radioArticle?.editorialTone).toBe('radio_broadcast');
    expect(radioArticle?.headline).toContain('AO VIVO NO ÉTER');
  });

  it('generates a tribunal press article reporting federation sanctions', () => {
    const dummyIncident: MatchIncidentEvent = {
      id: 'inc-01',
      date: dummyDate,
      matchId: dummyMatch.id,
      kind: 'pitch_invasion',
      intensity: 70,
      title: 'Invasão da Praça de Esportes pela Assistência',
      descriptionPt: 'A torcida invadiu o campo após marcação duvidosa de impedimento.',
      sanctions: [
        {
          targetClubId: 'club_operario',
          type: 'fine_ppu',
          amount: 50,
          sentencePt: 'Multa de 50 PPU.',
        },
        {
          targetClubId: 'club_operario',
          type: 'stadium_suspension_days',
          amount: 30,
          sentencePt: 'Perda de mando de campo por 30 dias.',
        },
      ],
      interruptedMatch: false,
    };

    const article = generateTribunalPressArticle(dummyIncident, 'União Operária F.C.', 'gazeta');

    expect(validatePressArticle(article)).toBe(true);
    expect(article.category).toBe('tribunal_verdict');
    expect(article.headline).toContain('Tribunal');
    expect(article.bodyText).toContain('50 PPU');
    expect(article.bodyText).toContain('30 dias');
  });

  it('generates institutional honor articles celebrating club legends deterministically', () => {
    const honorArticle = generateHonorPressArticle({
      clubName: 'União Operária F.C.',
      clubId: 'club_operario',
      legendName: 'Severino Silva',
      honorTypeTitlePt: 'Busto Esculpido em Bronze na Sede Social',
      date: { year: 1936, month: 6, day: 1 },
    });

    expect(validatePressArticle(honorArticle)).toBe(true);
    expect(honorArticle.category).toBe('institutional_honor');
    expect(honorArticle.headline).toContain('Severino Silva');
    expect(honorArticle.newspaperId).toBe('radio_inconfidencia'); // Since year >= 1936
    expect(honorArticle.mediaType).toBe('radio');
  });
});
