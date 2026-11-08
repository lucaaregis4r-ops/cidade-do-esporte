import { describe, it, expect } from 'vitest';
import { buildClubArchive, CANONICAL_DECADE_MAPS } from './ClubArchive';
import { createClub } from './Club';
import { buildClubTraditionProfile } from './TraditionSystem';
import { createEmptyHistoricalLedger, recordHistoricalEvent } from './HistoricalLedger';

describe('ClubArchive (Macroetapa 34 / Alpha G Fechamento)', () => {
  it('consolidates 50-year canonical archive data with all 11 sections', () => {
    const club = createClub({
      id: 'club-test',
      name: 'União Sport Club',
      shortName: 'USC',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'workers',
      colors: { primary: '#111111', secondary: '#f8f8f8', accent: '#cccccc' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'swiss-1910-111111-f8f8f8',
          changeReason: 'Escudo de fundação',
        },
      ],
      parcels: ['p-1'],
    });

    let ledger = createEmptyHistoricalLedger();
    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-fundacao',
      date: { year: 1910, month: 1, day: 1 },
      category: 'FUNDACAO',
      importance: 100,
      title: 'Ata Inaugural',
      description: 'Fundação do clube em 1910',
      clubs: ['club-test'],
      causes: [],
      tags: ['fundacao'],
    });

    const tradition = buildClubTraditionProfile({
      clubId: club.id,
      clubName: club.name,
      foundingOrigin: club.foundingOrigin,
      colors: club.colors,
      foundationYear: 1910,
      currentYear: 1959,
      titlesCount: 5,
      matchesCount: 120,
    });

    const archive = buildClubArchive({
      club,
      currentYear: 1959,
      historicalLedger: ledger,
      tradition,
      legends: [],
      honors: [],
      rivalries: [],
    });

    expect(archive.clubId).toBe('club-test');
    expect(archive.clubName).toBe('União Sport Club');
    expect(archive.foundationYear).toBe(1910);
    expect(archive.currentYear).toBe(1959);
    expect(archive.timeline.length).toBe(1);
    expect(archive.timeline[0].id).toBe('ev-fundacao');
    expect(archive.tradition.traditionStrength).toBeGreaterThan(0);
    expect(archive.comparativeMaps.length).toBe(6); // 1910, 1920, 1930, 1940, 1950, 1959
    expect(archive.comparativeMaps[0].year).toBe(1910);
    expect(archive.comparativeMaps[5].year).toBe(1959);
  });

  it('exposes canonical decade maps from 1910 to 1959', () => {
    expect(CANONICAL_DECADE_MAPS.length).toBe(6);
    const years = CANONICAL_DECADE_MAPS.map((m) => m.year);
    expect(years).toEqual([1910, 1920, 1930, 1940, 1950, 1959]);
  });
});
