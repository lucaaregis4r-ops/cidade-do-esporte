/**
 * TacaBrasil1959.ts
 *
 * Modelo de domínio puro para a Taça Brasil de 1959 (Macroetapa 36 - Alpha H).
 * Primeira competição nacional de clubes do futebol brasileiro.
 *
 * Disciplina operacional:
 * - Pureza de domínio, estritamente determinístico, zero PRNG descontrolado.
 * - Toda aleatoriedade consome a stream `football` de CampaignRng.
 * - Suporta o formato histórico de zonas (Norte-Nordeste e Centro-Sul),
 *   semifinais (entrada de Santos e Vasco) e finalíssima.
 */

import type { CampaignRng } from '../CampaignRng';
import { getNationalClubById } from './NationalAbstractClub';

export type TacaBrasilPhase = 'zona_norte_nordeste' | 'zona_centro_sul' | 'semifinal' | 'final';

export interface MinasRepresentative {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly isPlayerClub: boolean;
  readonly qualifyingTitle: string;
}

export interface TacaBrasilParticipant {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly state: string;
  readonly isPlayerClub?: boolean;
}

export interface TacaBrasilMatch {
  readonly id: string;
  readonly phase: TacaBrasilPhase;
  readonly leg: 1 | 2 | 3; // 1: Ida, 2: Volta, 3: Desempate (se necessário)
  readonly date: { readonly year: 1959; readonly month: number; readonly day: number };
  readonly homeTeam: TacaBrasilParticipant;
  readonly awayTeam: TacaBrasilParticipant;
  readonly played: boolean;
  readonly homeScore?: number;
  readonly awayScore?: number;
  readonly chronicle?: string;
}

export interface TacaBrasilTie {
  readonly id: string;
  readonly phase: TacaBrasilPhase;
  readonly name: string;
  readonly teamA: TacaBrasilParticipant;
  readonly teamB: TacaBrasilParticipant;
  readonly matches: readonly TacaBrasilMatch[];
  readonly winnerId?: string;
  readonly winnerName?: string;
}

export interface TacaBrasilTournament {
  readonly seasonYear: 1959;
  readonly minasRepresentative: MinasRepresentative;
  readonly status: 'not_started' | 'in_progress' | 'completed';
  readonly ties: readonly TacaBrasilTie[];
  readonly champion?: TacaBrasilParticipant;
  readonly runnerUp?: TacaBrasilParticipant;
  readonly historicalSummary?: string;
}

/**
 * Cria a estrutura inicial da Taça Brasil de 1959 com base no representante de Minas Gerais.
 */
export function createTacaBrasil1959(minasRep: MinasRepresentative): TacaBrasilTournament {
  const bahia = getNationalClubById('club-nac-bahia')!;
  const csa = getNationalClubById('club-nac-csa')!;
  const sport = getNationalClubById('club-nac-sport')!;
  const ceara = getNationalClubById('club-nac-ceara')!;
  const atleticoPr = getNationalClubById('club-nac-atletico-pr')!;
  const gremio = getNationalClubById('club-nac-gremio')!;
  const hercilioLuz = getNationalClubById('club-nac-hercilio-luz')!;

  const minasParticipant: TacaBrasilParticipant = {
    id: minasRep.id,
    name: minasRep.name,
    shortName: minasRep.shortName,
    state: 'MG',
    isPlayerClub: minasRep.isPlayerClub,
  };

  // 1. ZONA NORTE-NORDESTE (Fase Inicial)
  const tieNorteNordeste1: TacaBrasilTie = {
    id: 'tie-nn-1',
    phase: 'zona_norte_nordeste',
    name: 'Zona Norte-Nordeste — Grupo Nordeste (Bahia x CSA)',
    teamA: { id: bahia.id, name: bahia.name, shortName: bahia.shortName, state: bahia.state },
    teamB: { id: csa.id, name: csa.name, shortName: csa.shortName, state: csa.state },
    matches: [
      {
        id: 'match-nn-1-ida',
        phase: 'zona_norte_nordeste',
        leg: 1,
        date: { year: 1959, month: 8, day: 23 },
        homeTeam: { id: csa.id, name: csa.name, shortName: csa.shortName, state: csa.state },
        awayTeam: { id: bahia.id, name: bahia.name, shortName: bahia.shortName, state: bahia.state },
        played: false,
      },
      {
        id: 'match-nn-1-volta',
        phase: 'zona_norte_nordeste',
        leg: 2,
        date: { year: 1959, month: 8, day: 30 },
        homeTeam: { id: bahia.id, name: bahia.name, shortName: bahia.shortName, state: bahia.state },
        awayTeam: { id: csa.id, name: csa.name, shortName: csa.shortName, state: csa.state },
        played: false,
      },
    ],
  };

  const tieNorteNordeste2: TacaBrasilTie = {
    id: 'tie-nn-2',
    phase: 'zona_norte_nordeste',
    name: 'Zona Norte-Nordeste — Grupo Norte (Sport x Ceará)',
    teamA: { id: sport.id, name: sport.name, shortName: sport.shortName, state: sport.state },
    teamB: { id: ceara.id, name: ceara.name, shortName: ceara.shortName, state: ceara.state },
    matches: [
      {
        id: 'match-nn-2-ida',
        phase: 'zona_norte_nordeste',
        leg: 1,
        date: { year: 1959, month: 8, day: 23 },
        homeTeam: { id: ceara.id, name: ceara.name, shortName: ceara.shortName, state: ceara.state },
        awayTeam: { id: sport.id, name: sport.name, shortName: sport.shortName, state: sport.state },
        played: false,
      },
      {
        id: 'match-nn-2-volta',
        phase: 'zona_norte_nordeste',
        leg: 2,
        date: { year: 1959, month: 8, day: 30 },
        homeTeam: { id: sport.id, name: sport.name, shortName: sport.shortName, state: sport.state },
        awayTeam: { id: ceara.id, name: ceara.name, shortName: ceara.shortName, state: ceara.state },
        played: false,
      },
    ],
  };

  // 2. ZONA CENTRO-SUL (Fase Inicial)
  const tieCentroSulMinas: TacaBrasilTie = {
    id: 'tie-cs-minas',
    phase: 'zona_centro_sul',
    name: `Zona Centro-Sul — Grupo Central (${minasParticipant.shortName} x Atlético-PR)`,
    teamA: minasParticipant,
    teamB: { id: atleticoPr.id, name: atleticoPr.name, shortName: atleticoPr.shortName, state: atleticoPr.state },
    matches: [
      {
        id: 'match-cs-minas-ida',
        phase: 'zona_centro_sul',
        leg: 1,
        date: { year: 1959, month: 9, day: 6 },
        homeTeam: { id: atleticoPr.id, name: atleticoPr.name, shortName: atleticoPr.shortName, state: atleticoPr.state },
        awayTeam: minasParticipant,
        played: false,
      },
      {
        id: 'match-cs-minas-volta',
        phase: 'zona_centro_sul',
        leg: 2,
        date: { year: 1959, month: 9, day: 13 },
        homeTeam: minasParticipant,
        awayTeam: { id: atleticoPr.id, name: atleticoPr.name, shortName: atleticoPr.shortName, state: atleticoPr.state },
        played: false,
      },
    ],
  };

  const tieCentroSulSul: TacaBrasilTie = {
    id: 'tie-cs-sul',
    phase: 'zona_centro_sul',
    name: 'Zona Centro-Sul — Grupo Sul (Grêmio x Hercílio Luz)',
    teamA: { id: gremio.id, name: gremio.name, shortName: gremio.shortName, state: gremio.state },
    teamB: { id: hercilioLuz.id, name: hercilioLuz.name, shortName: hercilioLuz.shortName, state: hercilioLuz.state },
    matches: [
      {
        id: 'match-cs-sul-ida',
        phase: 'zona_centro_sul',
        leg: 1,
        date: { year: 1959, month: 9, day: 6 },
        homeTeam: { id: hercilioLuz.id, name: hercilioLuz.name, shortName: hercilioLuz.shortName, state: hercilioLuz.state },
        awayTeam: { id: gremio.id, name: gremio.name, shortName: gremio.shortName, state: gremio.state },
        played: false,
      },
      {
        id: 'match-cs-sul-volta',
        phase: 'zona_centro_sul',
        leg: 2,
        date: { year: 1959, month: 9, day: 13 },
        homeTeam: { id: gremio.id, name: gremio.name, shortName: gremio.shortName, state: gremio.state },
        awayTeam: { id: hercilioLuz.id, name: hercilioLuz.name, shortName: hercilioLuz.shortName, state: hercilioLuz.state },
        played: false,
      },
    ],
  };

  return {
    seasonYear: 1959,
    minasRepresentative: minasRep,
    status: 'not_started',
    ties: [tieNorteNordeste1, tieNorteNordeste2, tieCentroSulMinas, tieCentroSulSul],
  };
}

/**
 * Calcula os gols esperados determinísticos entre dois participantes.
 */
function simulateMatchGoals(
  home: TacaBrasilParticipant,
  away: TacaBrasilParticipant,
  rng: CampaignRng
): { homeGoals: number; awayGoals: number } {
  const homeClubData = getNationalClubById(home.id);
  const awayClubData = getNationalClubById(away.id);

  // Reputação base (se for o clube do jogador ou outro mineiro, baseline 88)
  const homeRep = homeClubData?.reputation ?? (home.isPlayerClub ? 90 : 86);
  const awayRep = awayClubData?.reputation ?? (away.isPlayerClub ? 90 : 86);

  // Mando de campo dá ligeira vantagem
  const repDiff = (homeRep + 4) - awayRep;

  // 3 chamadas determinísticas da stream rng.football
  const roll1 = (rng.football.next() % 100) / 100;
  const roll2 = (rng.football.next() % 100) / 100;
  const variance = ((rng.football.next() % 7) - 3) * 0.1;

  let expectedHome = 1.3 + (repDiff * 0.04) + variance;
  let expectedAway = 1.0 - (repDiff * 0.03) - variance;

  if (expectedHome < 0) expectedHome = 0.2;
  if (expectedAway < 0) expectedAway = 0.2;

  const homeGoals = Math.max(0, Math.round(expectedHome + (roll1 * 1.5 - 0.5)));
  const awayGoals = Math.max(0, Math.round(expectedAway + (roll2 * 1.5 - 0.5)));

  return { homeGoals, awayGoals };
}

/**
 * Simula um confronto eliminatório de ida e volta (e desempate se houver empate em pontos).
 */
export function simulateTacaBrasilTie(
  tie: TacaBrasilTie,
  rng: CampaignRng,
  playerScoreOverride?: { homeScore: number; awayScore: number }
): TacaBrasilTie {
  if (tie.winnerId) return tie;

  const updatedMatches: TacaBrasilMatch[] = [];

  // Jogo 1 (Ida)
  const m1 = tie.matches[0];
  let m1HomeScore = m1.homeScore;
  let m1AwayScore = m1.awayScore;

  if (!m1.played) {
    if (m1.homeTeam.isPlayerClub || m1.awayTeam.isPlayerClub) {
      if (playerScoreOverride) {
        m1HomeScore = playerScoreOverride.homeScore;
        m1AwayScore = playerScoreOverride.awayScore;
      } else {
        const sim = simulateMatchGoals(m1.homeTeam, m1.awayTeam, rng);
        m1HomeScore = sim.homeGoals;
        m1AwayScore = sim.awayGoals;
      }
    } else {
      const sim = simulateMatchGoals(m1.homeTeam, m1.awayTeam, rng);
      m1HomeScore = sim.homeGoals;
      m1AwayScore = sim.awayGoals;
    }

    updatedMatches.push({
      ...m1,
      played: true,
      homeScore: m1HomeScore,
      awayScore: m1AwayScore,
      chronicle: `${m1.homeTeam.name} ${m1HomeScore} x ${m1AwayScore} ${m1.awayTeam.name} em prélio de ida da Taça Brasil.`,
    });
  } else {
    updatedMatches.push(m1);
  }

  // Jogo 2 (Volta)
  const m2 = tie.matches[1];
  let m2HomeScore = m2.homeScore;
  let m2AwayScore = m2.awayScore;

  if (!m2.played) {
    const sim = simulateMatchGoals(m2.homeTeam, m2.awayTeam, rng);
    m2HomeScore = sim.homeGoals;
    m2AwayScore = sim.awayGoals;

    updatedMatches.push({
      ...m2,
      played: true,
      homeScore: m2HomeScore,
      awayScore: m2AwayScore,
      chronicle: `${m2.homeTeam.name} ${m2HomeScore} x ${m2AwayScore} ${m2.awayTeam.name} em confronto decisivo de volta.`,
    });
  } else {
    updatedMatches.push(m2);
  }

  // Regra histórica da Taça Brasil de 1959:
  // Pontos ganhos: Vitória = 2 pontos, Empate = 1 ponto.
  let pointsA = 0;
  let pointsB = 0;

  // No jogo 1: m1.homeTeam é teamB ou teamA?
  // Em nosso gerador, Ida tem teamB como mandante e teamA como visitante
  if (m1HomeScore! > m1AwayScore!) {
    pointsB += 2;
  } else if (m1HomeScore! < m1AwayScore!) {
    pointsA += 2;
  } else {
    pointsA += 1;
    pointsB += 1;
  }

  // No jogo 2: m2.homeTeam é teamA e m2.awayTeam é teamB
  if (m2HomeScore! > m2AwayScore!) {
    pointsA += 2;
  } else if (m2HomeScore! < m2AwayScore!) {
    pointsB += 2;
  } else {
    pointsA += 1;
    pointsB += 1;
  }

  // Saldo de gols agregado (desempate moderno/decisivo)
  const totalGoalsA = (m1.awayTeam.id === tie.teamA.id ? m1AwayScore! : m1HomeScore!) +
    (m2.homeTeam.id === tie.teamA.id ? m2HomeScore! : m2AwayScore!);
  const totalGoalsB = (m1.homeTeam.id === tie.teamB.id ? m1HomeScore! : m1AwayScore!) +
    (m2.awayTeam.id === tie.teamB.id ? m2AwayScore! : m2HomeScore!);

  let winnerId: string;
  let winnerName: string;

  if (pointsA > pointsB) {
    winnerId = tie.teamA.id;
    winnerName = tie.teamA.name;
  } else if (pointsB > pointsA) {
    winnerId = tie.teamB.id;
    winnerName = tie.teamB.name;
  } else {
    // Empate em pontos -> Jogo Desempate (ou vantagem por saldo de gols)
    if (totalGoalsA > totalGoalsB) {
      winnerId = tie.teamA.id;
      winnerName = tie.teamA.name;
    } else if (totalGoalsB > totalGoalsA) {
      winnerId = tie.teamB.id;
      winnerName = tie.teamB.name;
    } else {
      // Prélio Desempate extra
      const desempateSim = simulateMatchGoals(tie.teamA, tie.teamB, rng);
      let dHome = desempateSim.homeGoals;
      let dAway = desempateSim.awayGoals;
      if (dHome === dAway) {
        // Desempate por prorrogação histórica (quem tem maior reputação ou sorteio determinístico)
        if (rng.football.next() % 2 === 0) {
          dHome += 1;
        } else {
          dAway += 1;
        }
      }

      updatedMatches.push({
        id: `${tie.id}-desempate`,
        phase: tie.phase,
        leg: 3,
        date: { year: 1959, month: 9, day: 20 },
        homeTeam: tie.teamA,
        awayTeam: tie.teamB,
        played: true,
        homeScore: dHome,
        awayScore: dAway,
        chronicle: `Partida de desempate emocionante em campo neutro: ${tie.teamA.name} ${dHome} x ${dAway} ${tie.teamB.name}.`,
      });

      if (dHome > dAway) {
        winnerId = tie.teamA.id;
        winnerName = tie.teamA.name;
      } else {
        winnerId = tie.teamB.id;
        winnerName = tie.teamB.name;
      }
    }
  }

  return {
    ...tie,
    matches: updatedMatches,
    winnerId,
    winnerName,
  };
}

/**
 * Avança a Taça Brasil de 1959 para a próxima fase.
 */
export function advanceTacaBrasilTournament(
  tournament: TacaBrasilTournament,
  rng: CampaignRng
): TacaBrasilTournament {
  if (tournament.status === 'completed') return tournament;

  const ties = [...tournament.ties];

  // Fase 1: Finalizar confrontos de zonas
  const zoneTies = ties.filter((t) => t.phase === 'zona_norte_nordeste' || t.phase === 'zona_centro_sul');
  const allZoneFinished = zoneTies.every((t) => Boolean(t.winnerId));

  if (!allZoneFinished) {
    // Simula as zonas pendentes
    const updatedTies = ties.map((t) => {
      if ((t.phase === 'zona_norte_nordeste' || t.phase === 'zona_centro_sul') && !t.winnerId) {
        return simulateTacaBrasilTie(t, rng);
      }
      return t;
    });

    // Se agora todas as 4 semifinais de zona terminaram, criar as finais de zona
    const nn1 = updatedTies.find((t) => t.id === 'tie-nn-1');
    const nn2 = updatedTies.find((t) => t.id === 'tie-nn-2');
    const csMinas = updatedTies.find((t) => t.id === 'tie-cs-minas');
    const csSul = updatedTies.find((t) => t.id === 'tie-cs-sul');

    const hasFinalNN = updatedTies.some((t) => t.id === 'tie-final-nn');
    const hasFinalCS = updatedTies.some((t) => t.id === 'tie-final-cs');

    if (nn1?.winnerId && nn2?.winnerId && !hasFinalNN) {
      const winnerNN1: TacaBrasilParticipant = nn1.winnerId === nn1.teamA.id ? nn1.teamA : nn1.teamB;
      const winnerNN2: TacaBrasilParticipant = nn2.winnerId === nn2.teamA.id ? nn2.teamA : nn2.teamB;

      updatedTies.push({
        id: 'tie-final-nn',
        phase: 'zona_norte_nordeste',
        name: `Final da Zona Norte-Nordeste (${winnerNN1.shortName} x ${winnerNN2.shortName})`,
        teamA: winnerNN1,
        teamB: winnerNN2,
        matches: [
          {
            id: 'match-fnn-ida',
            phase: 'zona_norte_nordeste',
            leg: 1,
            date: { year: 1959, month: 9, day: 27 },
            homeTeam: winnerNN2,
            awayTeam: winnerNN1,
            played: false,
          },
          {
            id: 'match-fnn-volta',
            phase: 'zona_norte_nordeste',
            leg: 2,
            date: { year: 1959, month: 10, day: 4 },
            homeTeam: winnerNN1,
            awayTeam: winnerNN2,
            played: false,
          },
        ],
      });
    }

    if (csMinas?.winnerId && csSul?.winnerId && !hasFinalCS) {
      const winnerCSMinas: TacaBrasilParticipant = csMinas.winnerId === csMinas.teamA.id ? csMinas.teamA : csMinas.teamB;
      const winnerCSSul: TacaBrasilParticipant = csSul.winnerId === csSul.teamA.id ? csSul.teamA : csSul.teamB;

      updatedTies.push({
        id: 'tie-final-cs',
        phase: 'zona_centro_sul',
        name: `Final da Zona Centro-Sul (${winnerCSMinas.shortName} x ${winnerCSSul.shortName})`,
        teamA: winnerCSMinas,
        teamB: winnerCSSul,
        matches: [
          {
            id: 'match-fcs-ida',
            phase: 'zona_centro_sul',
            leg: 1,
            date: { year: 1959, month: 9, day: 27 },
            homeTeam: winnerCSSul,
            awayTeam: winnerCSMinas,
            played: false,
          },
          {
            id: 'match-fcs-volta',
            phase: 'zona_centro_sul',
            leg: 2,
            date: { year: 1959, month: 10, day: 4 },
            homeTeam: winnerCSMinas,
            awayTeam: winnerCSSul,
            played: false,
          },
        ],
      });
    }

    return {
      ...tournament,
      status: 'in_progress',
      ties: updatedTies,
    };
  }

  // Fase 2: Simular finais de zona se pendentes
  const finalNN = ties.find((t) => t.id === 'tie-final-nn');
  const finalCS = ties.find((t) => t.id === 'tie-final-cs');

  if (finalNN && !finalNN.winnerId) {
    const updatedNN = simulateTacaBrasilTie(finalNN, rng);
    const updatedTies = ties.map((t) => (t.id === 'tie-final-nn' ? updatedNN : t));
    return { ...tournament, status: 'in_progress', ties: updatedTies };
  }

  if (finalCS && !finalCS.winnerId) {
    const updatedCS = simulateTacaBrasilTie(finalCS, rng);
    const updatedTies = ties.map((t) => (t.id === 'tie-final-cs' ? updatedCS : t));
    return { ...tournament, status: 'in_progress', ties: updatedTies };
  }

  // Fase 3: Semifinais Nacionais (Entram Santos e Vasco da Gama)
  const hasSemifinais = ties.some((t) => t.phase === 'semifinal');
  if (!hasSemifinais && finalNN?.winnerId && finalCS?.winnerId) {
    const championNN: TacaBrasilParticipant = finalNN.winnerId === finalNN.teamA.id ? finalNN.teamA : finalNN.teamB;
    const championCS: TacaBrasilParticipant = finalCS.winnerId === finalCS.teamA.id ? finalCS.teamA : finalCS.teamB;

    const vasco = getNationalClubById('club-nac-vasco')!;
    const santos = getNationalClubById('club-nac-santos')!;

    const semi1: TacaBrasilTie = {
      id: 'tie-semi-1',
      phase: 'semifinal',
      name: `Semifinal Nacional 1 (${championNN.shortName} x Vasco da Gama)`,
      teamA: championNN,
      teamB: { id: vasco.id, name: vasco.name, shortName: vasco.shortName, state: vasco.state },
      matches: [
        {
          id: 'match-semi1-ida',
          phase: 'semifinal',
          leg: 1,
          date: { year: 1959, month: 10, day: 18 },
          homeTeam: { id: vasco.id, name: vasco.name, shortName: vasco.shortName, state: vasco.state },
          awayTeam: championNN,
          played: false,
        },
        {
          id: 'match-semi1-volta',
          phase: 'semifinal',
          leg: 2,
          date: { year: 1959, month: 10, day: 25 },
          homeTeam: championNN,
          awayTeam: { id: vasco.id, name: vasco.name, shortName: vasco.shortName, state: vasco.state },
          played: false,
        },
      ],
    };

    const semi2: TacaBrasilTie = {
      id: 'tie-semi-2',
      phase: 'semifinal',
      name: `Semifinal Nacional 2 (${championCS.shortName} x Santos)`,
      teamA: championCS,
      teamB: { id: santos.id, name: santos.name, shortName: santos.shortName, state: santos.state },
      matches: [
        {
          id: 'match-semi2-ida',
          phase: 'semifinal',
          leg: 1,
          date: { year: 1959, month: 10, day: 18 },
          homeTeam: { id: santos.id, name: santos.name, shortName: santos.shortName, state: santos.state },
          awayTeam: championCS,
          played: false,
        },
        {
          id: 'match-semi2-volta',
          phase: 'semifinal',
          leg: 2,
          date: { year: 1959, month: 10, day: 25 },
          homeTeam: championCS,
          awayTeam: { id: santos.id, name: santos.name, shortName: santos.shortName, state: santos.state },
          played: false,
        },
      ],
    };

    return {
      ...tournament,
      status: 'in_progress',
      ties: [...ties, semi1, semi2],
    };
  }

  // Simula semifinais se existirem e estiverem pendentes
  const semiTies = ties.filter((t) => t.phase === 'semifinal');
  const pendingSemi = semiTies.find((t) => !t.winnerId);
  if (pendingSemi) {
    const updatedSemi = simulateTacaBrasilTie(pendingSemi, rng);
    const updatedTies = ties.map((t) => (t.id === pendingSemi.id ? updatedSemi : t));
    return { ...tournament, status: 'in_progress', ties: updatedTies };
  }

  // Fase 4: Finalíssima Nacional
  const hasFinal = ties.some((t) => t.phase === 'final');
  const semi1 = ties.find((t) => t.id === 'tie-semi-1');
  const semi2 = ties.find((t) => t.id === 'tie-semi-2');

  if (!hasFinal && semi1?.winnerId && semi2?.winnerId) {
    const finalist1: TacaBrasilParticipant = semi1.winnerId === semi1.teamA.id ? semi1.teamA : semi1.teamB;
    const finalist2: TacaBrasilParticipant = semi2.winnerId === semi2.teamA.id ? semi2.teamA : semi2.teamB;

    const finalTie: TacaBrasilTie = {
      id: 'tie-grand-final',
      phase: 'final',
      name: `Grande Finalíssima da Taça Brasil de 1959 (${finalist1.shortName} x ${finalist2.shortName})`,
      teamA: finalist1,
      teamB: finalist2,
      matches: [
        {
          id: 'match-final-ida',
          phase: 'final',
          leg: 1,
          date: { year: 1959, month: 11, day: 15 },
          homeTeam: finalist2,
          awayTeam: finalist1,
          played: false,
        },
        {
          id: 'match-final-volta',
          phase: 'final',
          leg: 2,
          date: { year: 1959, month: 11, day: 22 },
          homeTeam: finalist1,
          awayTeam: finalist2,
          played: false,
        },
      ],
    };

    return {
      ...tournament,
      status: 'in_progress',
      ties: [...ties, finalTie],
    };
  }

  // Simular a grande final
  const grandFinal = ties.find((t) => t.phase === 'final');
  if (grandFinal && !grandFinal.winnerId) {
    const updatedFinal = simulateTacaBrasilTie(grandFinal, rng);
    const champion: TacaBrasilParticipant = updatedFinal.winnerId === updatedFinal.teamA.id ? updatedFinal.teamA : updatedFinal.teamB;
    const runnerUp: TacaBrasilParticipant = updatedFinal.winnerId === updatedFinal.teamA.id ? updatedFinal.teamB : updatedFinal.teamA;

    const summary = `${champion.name} sagra-se Campeão da Taça Brasil de 1959 após superar o ${runnerUp.name} na grande decisão nacional!`;

    const updatedTies = ties.map((t) => (t.id === grandFinal.id ? updatedFinal : t));

    return {
      ...tournament,
      status: 'completed',
      ties: updatedTies,
      champion,
      runnerUp,
      historicalSummary: summary,
    };
  }

  return tournament;
}

/**
 * Simula a Taça Brasil integralmente do início ao fim deterministamente.
 */
export function simulateEntireTacaBrasil(
  tournament: TacaBrasilTournament,
  rng: CampaignRng
): TacaBrasilTournament {
  let curr = tournament;
  let safety = 0;
  while (curr.status !== 'completed' && safety < 10) {
    safety++;
    curr = advanceTacaBrasilTournament(curr, rng);
  }
  return curr;
}
