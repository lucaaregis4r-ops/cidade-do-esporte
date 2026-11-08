/**
 * World.tacaBrasil.test.ts
 *
 * Testes unitários e de integração para a Taça Brasil de 1959 no World.
 * (Macroetapa 36 - Alpha H).
 */

import { describe, expect, it } from 'vitest';
import { World } from './World';
import { createClub } from './club/Club';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';
import type { LandOccupancyContract } from './club/ClubLandContract';

describe('World - Taça Brasil de 1959', () => {
  const sampleContract: LandOccupancyContract = {
    id: 'contract-test-1910',
    parcelId: 'parcel-1',
    clubId: 'club-test-1910',
    type: 'CONCESSAO_PUBLICA',
    startDate: { year: 1910, month: 1, day: 1 },
    durationYears: 10,
    monthlyCostPpu: 0,
    upfrontCostPpu: 0,
    grantorName: 'Prefeitura',
    terms: ['Uso esportivo'],
  };

  it('determina representante de Minas Gerais e gera a Taça Brasil de 1959', () => {
    const world = new World(20, 20, { worldSeed: 'taca-brasil-world-seed' });
    const parcels = world.getCityData1910()?.parcels?.parcels ?? [];
    const parcelId = parcels[0]?.id ?? 'p-0-0';

    const contract = { ...sampleContract, parcelId };
    const playerClub = createClub({
      id: 'club-tradicao-1910',
      name: 'Tradição Esporte Clube',
      shortName: 'Tradição E.C.',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      foundingStory: 'Ata de fundação',
      colors: { primary: '#003366', secondary: '#FFFFFF', accent: '#D4AF37' },
      crestHistory: [{ designId: 'swiss-1910', startYear: 1910, changeReason: 'Inaugural' }],
      founders: ['person-1'],
      parcels: [parcelId],
      facilities: ['campo-1910'],
      reputation: 92,
      trophies: [
        {
          id: 'trophy-estadual-1958',
          competitionId: 'comp-estadual-1958',
          competitionName: 'Campeonato Mineiro de 1958',
          year: 1958,
          date: { year: 1958, month: 11, day: 15 },
          tier: 'state_first_division',
          description: 'Campeão Estadual de Minas Gerais',
        },
      ],
    });

    world.foundClubWithParcel(playerClub, parcelId, contract);

    const rep = world.getMinasRepresentativeFor1959();
    expect(rep).toBeDefined();
    expect(rep.name).toBe('Tradição Esporte Clube');
    expect(rep.isPlayerClub).toBe(true);

    const tournament = world.generateTacaBrasil1959();
    expect(tournament).toBeDefined();
    expect(tournament.seasonYear).toBe(1959);
    expect(tournament.status).toBe('not_started');
    expect(world.getTacaBrasil1959()).toBe(tournament);
  });

  it('avança fases e simula integralmente a Taça Brasil com concessão de troféu e ledger', () => {
    const world = new World(20, 20, { worldSeed: 'taca-brasil-sim-seed' });
    const parcels = world.getCityData1910()?.parcels?.parcels ?? [];
    const parcelId = parcels[0]?.id ?? 'p-0-0';

    const contract = { ...sampleContract, parcelId };
    const playerClub = createClub({
      id: 'club-tradicao-1910',
      name: 'Tradição Esporte Clube',
      shortName: 'Tradição E.C.',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: 'railway',
      foundingStory: 'Ata de fundação',
      colors: { primary: '#003366', secondary: '#FFFFFF', accent: '#D4AF37' },
      crestHistory: [{ designId: 'swiss-1910', startYear: 1910, changeReason: 'Inaugural' }],
      founders: ['person-1'],
      parcels: [parcelId],
      facilities: ['campo-1910'],
      reputation: 98, // time forte
    });

    world.foundClubWithParcel(playerClub, parcelId, contract);
    world.generateTacaBrasil1959();

    const completed = world.simulateEntireTacaBrasil();
    expect(completed.status).toBe('completed');
    expect(completed.champion).toBeDefined();
    expect(completed.runnerUp).toBeDefined();

    // Se o time do jogador foi campeão, o troféu e evento histórico foram registrados
    if (completed.champion?.isPlayerClub) {
      const club = world.getClub()!;
      expect(club.trophies?.some((t) => t.id === 'trophy-taca-brasil-1959')).toBe(true);
      const ledger = world.getHistoricalLedger();
      expect(ledger.events.some((e) => e.id === 'ev-taca-brasil-1959')).toBe(true);
    }
  });

  it('preserva a Taça Brasil de 1959 no ciclo de serialização e deserialização do save v25', () => {
    const world = new World(20, 20, { worldSeed: 'taca-brasil-save-seed' });
    const tournament = world.generateTacaBrasil1959();

    const serialized = serializeWorld(world);
    expect(serialized).toContain('tacaBrasil1959');

    const restoredWorld = new World(20, 20, { regenerate: false, worldSeed: 'taca-brasil-save-seed' });
    const success = deserializeWorldInto(restoredWorld, serialized);
    expect(success).toBe(true);

    const restoredTournament = restoredWorld.getTacaBrasil1959();
    expect(restoredTournament).toBeDefined();
    expect(restoredTournament?.seasonYear).toBe(1959);
    expect(restoredTournament?.minasRepresentative.name).toBe(tournament.minasRepresentative.name);
  });
});
