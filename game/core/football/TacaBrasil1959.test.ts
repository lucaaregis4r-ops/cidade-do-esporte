/**
 * TacaBrasil1959.test.ts
 *
 * Testes unitários para o torneio eliminatório da Taça Brasil de 1959.
 */

import { describe, expect, it } from 'vitest';
import { CampaignRng } from '../CampaignRng';
import {
  advanceTacaBrasilTournament,
  createTacaBrasil1959,
  type MinasRepresentative,
  simulateEntireTacaBrasil,
  simulateTacaBrasilTie,
} from './TacaBrasil1959';

describe('TacaBrasil1959', () => {
  const minasRepPlayer: MinasRepresentative = {
    id: 'club-tradicao-1910',
    name: 'Tradição Esporte Clube',
    shortName: 'Tradição E.C.',
    isPlayerClub: true,
    qualifyingTitle: 'Campeão da Cidade de Minas de 1958',
  };

  const minasRepRival: MinasRepresentative = {
    id: 'club-america-1910',
    name: 'América Futebol Clube',
    shortName: 'América-MG',
    isPlayerClub: false,
    qualifyingTitle: 'Campeão da Cidade de Minas de 1958',
  };

  it('inicializa o torneio com o representante de Minas Gerais e confrontos de zonas', () => {
    const tournament = createTacaBrasil1959(minasRepPlayer);

    expect(tournament.seasonYear).toBe(1959);
    expect(tournament.status).toBe('not_started');
    expect(tournament.minasRepresentative.name).toBe('Tradição Esporte Clube');
    expect(tournament.minasRepresentative.isPlayerClub).toBe(true);

    // 4 confrontos de zona iniciais (2 no Norte-Nordeste, 2 no Centro-Sul)
    expect(tournament.ties.length).toBe(4);

    const minasTie = tournament.ties.find((t) => t.id === 'tie-cs-minas');
    expect(minasTie).toBeDefined();
    expect(minasTie?.phase).toBe('zona_centro_sul');
    expect(minasTie?.teamA.name).toBe('Tradição Esporte Clube');
    expect(minasTie?.teamB.name).toBe('Clube Atlético Paranaense');
    expect(minasTie?.matches.length).toBe(2); // Ida e volta
  });

  it('simula um confronto eliminatório deterministamente', () => {
    const rngA = new CampaignRng('taca-brasil-seed-1959');
    const rngB = new CampaignRng('taca-brasil-seed-1959');

    const tournamentA = createTacaBrasil1959(minasRepPlayer);
    const tournamentB = createTacaBrasil1959(minasRepPlayer);

    const tieA = tournamentA.ties[0];
    const tieB = tournamentB.ties[0];

    const resultA = simulateTacaBrasilTie(tieA, rngA);
    const resultB = simulateTacaBrasilTie(tieB, rngB);

    expect(resultA.winnerId).toBeDefined();
    expect(resultA.winnerId).toBe(resultB.winnerId);
    expect(resultA.matches.every((m) => m.played)).toBe(true);
    expect(resultA.matches[0].homeScore).toBe(resultB.matches[0].homeScore);
    expect(resultA.matches[0].awayScore).toBe(resultB.matches[0].awayScore);
  });

  it('avança as fases sucessivas até a grande final com entrada de Santos e Vasco', () => {
    const rng = new CampaignRng('taca-brasil-championship-seed');
    let tournament = createTacaBrasil1959(minasRepPlayer);

    // Avança Zonas
    tournament = advanceTacaBrasilTournament(tournament, rng);
    expect(tournament.status).toBe('in_progress');

    // Finais de Zona criadas
    const finalsZone = tournament.ties.filter((t) => t.id === 'tie-final-nn' || t.id === 'tie-final-cs');
    expect(finalsZone.length).toBe(2);

    // Simula as finais de zona e avança para Semifinais
    tournament = advanceTacaBrasilTournament(tournament, rng);
    tournament = advanceTacaBrasilTournament(tournament, rng);

    const semiTies = tournament.ties.filter((t) => t.phase === 'semifinal');
    expect(semiTies.length).toBe(2);

    // Verifica que Santos e Vasco estão nas semifinais
    const allSemiTeams = semiTies.flatMap((s) => [s.teamA.id, s.teamB.id]);
    expect(allSemiTeams).toContain('club-nac-santos');
    expect(allSemiTeams).toContain('club-nac-vasco');
  });

  it('simula integralmente o torneio e coroa campeão e vice-campeão nacionais', () => {
    const rng = new CampaignRng('taca-brasil-full-1959');
    const tournament = createTacaBrasil1959(minasRepRival);

    const completed = simulateEntireTacaBrasil(tournament, rng);

    expect(completed.status).toBe('completed');
    expect(completed.champion).toBeDefined();
    expect(completed.runnerUp).toBeDefined();
    expect(completed.champion?.id).not.toBe(completed.runnerUp?.id);
    expect(completed.historicalSummary).toContain('Campeão da Taça Brasil de 1959');

    // Todos os confrontos finalizados com vencedor
    for (const tie of completed.ties) {
      expect(tie.winnerId).toBeDefined();
      expect(tie.winnerName).toBeDefined();
      for (const m of tie.matches) {
        expect(m.played).toBe(true);
        expect(m.homeScore).toBeDefined();
        expect(m.awayScore).toBeDefined();
      }
    }
  });
});
