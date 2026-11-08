import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import {
  evaluateMatchIncidents,
  summarizeIncidentForRivalry,
  validateMatchIncidentEvent,
} from './MatchIncidents';
import type { MatchRecord } from './MatchEngine';
import type { RivalryRelationship } from './RivalryRelationship';

describe('MatchIncidents domain model & Tribunal de Penas', () => {
  const dummyMatch: MatchRecord = {
    id: 'm-1910-derby',
    date: { year: 1910, month: 6, day: 12 },
    competitionType: 'festival_taça',
    competitionName: 'Taça Cidade de Minas',
    homeClubId: 'club_operario',
    homeClubName: 'Operário F.C.',
    awayClubId: 'club_elite',
    awayClubName: 'Elite Club',
    homeScore: 3,
    awayScore: 2,
    attendance: 1200,
    gateReceiptsPPU: 150,
    matchExpensesPPU: 30,
    netIncomePPU: 120,
    homeLineup: [
      {
        footballerId: 'f_home_1',
        personId: 'p_home_1',
        name: 'Carlos Zagueiro',
        position: 'FB_R',
        minutesPlayed: 90,
        rating: 6.5,
        goals: 0,
        assists: 0,
        shots: 0,
        tackles: 4,
        saves: 0,
        fouls: 2,
        injured: false,
        expelled: false,
        conditionBefore: 100,
        conditionAfter: 85,
        fatigueAccumulated: 15,
      },
    ],
    awayLineup: [
      {
        footballerId: 'f_away_1',
        personId: 'p_away_1',
        name: 'Eduardo Médio',
        position: 'CH',
        minutesPlayed: 90,
        rating: 6.0,
        goals: 0,
        assists: 1,
        shots: 1,
        tackles: 3,
        saves: 0,
        fouls: 3,
        injured: false,
        expelled: false,
        conditionBefore: 100,
        conditionAfter: 80,
        fatigueAccumulated: 20,
      },
    ],
    events: [
      {
        minute: 88,
        type: 'expulsion',
        team: 'away',
        descriptionPt: 'Expulso de campo após falta violenta.',
      },
    ],
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
    summaryPt: 'Partida tensa e disputada.',
  };

  const highTensionRivalry: RivalryRelationship = {
    id: 'riv_club_elite_club_operario',
    clubs: ['club_elite', 'club_operario'],
    clubNames: ['Elite Club', 'Operário F.C.'],
    derbyName: 'O Choque de Classes',
    factors: {
      geographic: 80,
      sporting: 90,
      social: 85,
      political: 80,
      supporter: 85,
      historical: 70,
    },
    intensity: 85,
    tier: 'deadly_derby',
    headToHead: {
      totalMatches: 5,
      winsClubA: 2,
      draws: 1,
      winsClubB: 2,
      goalsClubA: 8,
      goalsClubB: 8,
    },
    majorMatches: [],
    incidents: [],
    historicalEvents: [],
  };

  it('generates disciplinary incident deterministically with sanctions in deadly derbies with expulsions', () => {
    const rng = new CampaignRng('seed-derby-incident-test');
    const incident = evaluateMatchIncidents({
      matchRecord: dummyMatch,
      rivalry: highTensionRivalry,
      isPlayoffOrFinal: true,
      rng,
    });

    expect(incident).not.toBeNull();
    expect(incident?.sanctions.length).toBeGreaterThan(0);

    // Rule: "Violência sem benefício" - must have fines in PPU and/or stadium bans
    const totalFines = incident!.sanctions.reduce((sum, s) => sum + s.finePpu, 0);
    expect(totalFines).toBeGreaterThan(0);
    expect(incident!.sanctions[0]!.sentencePt).toContain('Tribunal de Penas');
  });

  it('rarely or never triggers incident in friendly, low-tension matches without events', () => {
    const peacefulMatch: MatchRecord = {
      ...dummyMatch,
      homeScore: 1,
      awayScore: 0,
      events: [],
    };
    const friendlyRivalry: RivalryRelationship = {
      ...highTensionRivalry,
      intensity: 10,
      tier: 'friendly',
      factors: {
        geographic: 10,
        sporting: 10,
        social: 10,
        political: 10,
        supporter: 10,
        historical: 10,
      },
    };

    let incidentCount = 0;
    for (let i = 0; i < 20; i++) {
      const rng = new CampaignRng(`peaceful-seed-${i}`);
      const res = evaluateMatchIncidents({
        matchRecord: peacefulMatch,
        rivalry: friendlyRivalry,
        isPlayoffOrFinal: false,
        rng,
      });
      if (res) incidentCount++;
    }

    expect(incidentCount).toBe(0);
  });

  it('summarizes incident and validates cleanly', () => {
    const rng = new CampaignRng('test-summary');
    const incident = evaluateMatchIncidents({
      matchRecord: dummyMatch,
      rivalry: highTensionRivalry,
      isPlayoffOrFinal: true,
      rng,
    })!;

    const summary = summarizeIncidentForRivalry(incident);
    expect(summary.id).toBe(incident.id);
    expect(summary.sanctionsSummary).toContain('PPU');

    const validated = validateMatchIncidentEvent(incident);
    expect(validated).not.toBeNull();
    expect(validated?.id).toBe(incident.id);
  });
});
