import { describe, expect, it } from 'vitest';
import { generateFiftyYearsReport } from './FiftyYearsReport';
import { createClub } from './Club';
import { createEmptyHistoricalLedger } from './HistoricalLedger';
import { buildClubTraditionProfile } from './TraditionSystem';

describe('FiftyYearsReport (Alpha H: H4 & H5)', () => {
  const sampleClub = createClub({
    id: 'club-tradicao',
    name: 'Tradição Esporte Clube',
    shortName: 'Tradição',
    foundingDate: { year: 1910, month: 1, day: 1 },
    foundingOrigin: 'railway',
    colors: { primary: '#1A365D', secondary: '#E2E8F0' },
    crestHistory: [
      {
        startYear: 1910,
        designId: 'crest-1910-shield',
        changeReason: 'Escudo fundacional pioneiro de 1910',
      },
    ],
    founders: ['founder-1', 'founder-2'],
    parcels: ['parcel-headquarters-1910'],
    facilities: ['fac-stadium-1948'],
    reputation: 85,
    trophies: [
      {
        id: 'trophy-taca-brasil-1959',
        competitionId: 'taca-brasil-1959',
        competitionName: 'Taça Brasil de 1959',
        year: 1959,
        awardedDate: { year: 1959, month: 12, day: 20 },
        title: 'Campeão da Taça Brasil de 1959',
        tier: 'national_championship',
      },
    ],
  });

  const sampleTradition = buildClubTraditionProfile({
    clubId: sampleClub.id,
    clubName: sampleClub.name,
    foundingOrigin: sampleClub.foundingOrigin,
    colors: sampleClub.colors,
    currentStadiumName: 'Estádio da Ferrovia',
    foundationYear: 1910,
    currentYear: 1959,
    titlesCount: 1,
    matchesCount: 50,
  });
  const sampleLedger = createEmptyHistoricalLedger();

  it('generates the 50-year jubilee report with all canonical required fields', () => {
    const report = generateFiftyYearsReport({
      club: sampleClub,
      worldSeed: 'SEED-JUBILEE-1959',
      currentDate: { year: 1959, month: 12, day: 31 },
      historicalLedger: sampleLedger,
      tradition: sampleTradition,
      legends: [
        {
          personId: 'legend-1',
          personName: 'Álvaro Mendes',
          category: 'LENDA',
          score: 185,
          breakdown: {
            dedicationYearsPoints: 50,
            titlesPoints: 50,
            matchesPoints: 30,
            derbyHeroPoints: 20,
            rivalryLoyaltyBonus: 15,
            patrimonyImpactPoints: 20,
            founderBonus: 35,
          },
          matchesCount: 140,
          titlesCount: 3,
        },
      ],
      honors: [],
      rivalries: [
        {
          clubAId: 'club-tradicao',
          clubAName: 'Tradição Esporte Clube',
          rivalClubId: 'club-sport',
          rivalClubName: 'Sport Club Mineiro',
          classicName: 'O Clássico Tradicional',
          geographicDistanceMeters: 450,
          tier: 'fierce',
          intensityScore: 92,
          factors: {
            geographicProximity: 80,
            sportingParity: 90,
            socialClassContrast: 85,
            politicalFactionalism: 70,
            historicalGrievances: 95,
          },
          headToHead: { wins: 12, draws: 6, losses: 8, totalMatches: 26 },
          historicalMilestones: [],
          lastEncounterDate: { year: 1959, month: 11, day: 15 },
        },
      ],
    });

    // 1. Cidade inicial vs final
    expect(report.cityUrbanEvolution.initial1910.populationEstimate).toBe(35000);
    expect(report.cityUrbanEvolution.final1959.populationEstimate).toBe(520000);
    expect(report.cityUrbanEvolution.growthRatio).toBeGreaterThan(10);

    // 2. Fundadores e Presidentes
    expect(report.foundersAndPresidents.foundingDate.year).toBe(1910);
    expect(report.foundersAndPresidents.originType).toBe('railway');

    // 3. Associados
    expect(report.membersEvolution.initialCount).toBeGreaterThan(0);
    expect(report.membersEvolution.finalCount).toBeGreaterThan(0);

    // 4. Patrimônio e Estádio
    expect(report.heritageAndStadium.headquartersParcelId).toBe('parcel-headquarters-1910');
    expect(report.heritageAndStadium.stadiumCapacity).toBeGreaterThan(10000);

    // 5. Títulos e Lendas
    expect(report.trophiesAndLegends.wonTacaBrasil1959).toBe(true);
    expect(report.trophiesAndLegends.totalTrophiesCount).toBe(1);
    expect(report.trophiesAndLegends.legends.length).toBe(1);

    // 6. Maior Rival e Clássico
    expect(report.rivalryAndClassic.primaryRivalName).toBe('Sport Club Mineiro');
    expect(report.rivalryAndClassic.classicName).toBe('O Clássico Tradicional');
    expect(report.rivalryAndClassic.headToHead.totalMatches).toBe(26);

    // 7. Jogos Notáveis
    expect(report.notableMatches.biggestWin).toBeDefined();
    expect(report.notableMatches.biggestDefeat).toBeDefined();
    expect(report.notableMatches.mostImportantMatch.title).toContain('Taça Brasil');

    // 8. Pessoas e Famílias
    expect(report.prominentFigures.mostImportantPerson.name).toBe('Álvaro Mendes');
    expect(report.prominentFigures.mostInfluentialFamily.familySurname).toBe('Mendes');

    // 9. Crise e Obra
    expect(report.crisisAndGreatWork.greatestCrisis.year).toBe(1932);
    expect(report.crisisAndGreatWork.greatestWork.costPpu).toBeGreaterThan(0);

    // 10. Escudos e Valorização dos Terrenos
    expect(report.crestsAndLandValuation.crests.length).toBe(1);
    expect(report.crestsAndLandValuation.landValuation.appreciationRatio).toBeGreaterThan(2);

    // Narrativa Histórica (Seção 14 do Plano Mestre)
    expect(report.narrativeChroniclePt).toContain('Tradição Esporte Clube');
    expect(report.narrativeChroniclePt).toContain('1910');
    expect(report.narrativeChroniclePt).toContain('Taça Brasil');
  });
});
