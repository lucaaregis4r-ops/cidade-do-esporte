/**
 * Tests for ClubElections (Alpha D: D7, D8, D9).
 */

import { describe, it, expect } from 'vitest';
import {
  generateElectionCandidates,
  conductClubElection,
  applyElectionToBoard,
  validateClubElectionEvent,
} from './ClubElections';
import { generateEmergentFactions } from './ClubPolitics';
import { createPerson } from '../person/Person';
import { CampaignRng } from '../CampaignRng';
import type { ClubBoardState } from './ClubBoard';

describe('ClubElections (Alpha D: D7, D8, D9)', () => {
  const rng = new CampaignRng('test-election-seed');

  const politics = generateEmergentFactions({
    foundingOrigin: 'workers',
    foundingYear: 1910,
    currentYear: 1911,
    leaderId: 'founder-1',
    leaderName: 'Arthur Friedenreich',
    balancePPU: 25,
  });

  const candidatesPool = [
    createPerson({
      id: 'founder-1',
      name: 'Arthur Friedenreich',
      birthDate: { year: 1885, month: 3, day: 1 },
      districtId: 'dist-1',
      occupation: 'Tipógrafo',
      economicClass: 'working_class',
    }),
    createPerson({
      id: 'cand-2',
      name: 'Bernardo de Souza',
      birthDate: { year: 1878, month: 7, day: 12 },
      districtId: 'dist-2',
      occupation: 'Contador',
      economicClass: 'middle_class',
    }),
  ];

  it('generates biographical presidential candidates with factional priorities and policy profiles', () => {
    const candidates = generateElectionCandidates({
      currentYear: 1911,
      currentDate: { year: 1911, month: 1, day: 15 },
      politics,
      candidatesPool,
      rng,
    });

    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates[0].name).toBeDefined();
    expect(candidates[0].factionName).toBeDefined();
    expect(candidates[0].priorities.length).toBeGreaterThan(0);

    // Profile check
    expect(candidates[0].profile.sportInvestment).toBeGreaterThanOrEqual(0);
    expect(candidates[0].profile.sportInvestment).toBeLessThanOrEqual(100);
    expect(candidates[0].profile.budgetTolerance).toBeGreaterThanOrEqual(0);
  });

  it('conducts a club election based on factional influence and elects a winner', () => {
    const candidates = generateElectionCandidates({
      currentYear: 1911,
      currentDate: { year: 1911, month: 1, day: 15 },
      politics,
      candidatesPool,
      rng,
    });

    const election = conductClubElection(
      candidates,
      politics,
      { year: 1911, month: 1, day: 15 },
      1,
      candidates[0].id, // Player votes for candidate 0
    );

    expect(election.winnerCandidateId).toBeDefined();
    expect(election.winnerName).toBeDefined();
    expect(election.appliedProfile).toBeDefined();
    expect(election.turnoutBps).toBe(8750);
    expect(election.summaryNarrative).toContain(election.winnerName);

    // Validates event format
    expect(validateClubElectionEvent(election)).not.toBeNull();
  });

  it('updates the ClubBoardState with the newly elected president', () => {
    const initialBoard: ClubBoardState = {
      members: [
        {
          id: 'dir-old',
          name: 'Presidente Antigo',
          role: 'presidente',
          roleLabel: 'Presidente da Diretoria',
          socialClass: 'middle_class',
          occupation: 'Comerciante',
          termStart: { year: 1910, month: 1, day: 1 },
          termEnd: { year: 1911, month: 1, day: 1 },
        },
        {
          id: 'dir-sec',
          name: 'Secretário Fiel',
          role: 'primeiro_secretario',
          roleLabel: '1º Secretário',
          socialClass: 'working_class',
          occupation: 'Ferroviário',
          termStart: { year: 1910, month: 1, day: 1 },
          termEnd: { year: 1911, month: 1, day: 1 },
        },
      ],
      electedDate: { year: 1910, month: 1, day: 1 },
      mandateYears: 1,
      deliberationCouncilCount: 8,
    };

    const candidates = generateElectionCandidates({
      currentYear: 1911,
      currentDate: { year: 1911, month: 1, day: 15 },
      politics,
      candidatesPool,
      rng,
    });

    const election = conductClubElection(
      candidates,
      politics,
      { year: 1911, month: 1, day: 15 },
      1,
    );

    const winner = election.candidates.find((c) => c.id === election.winnerCandidateId)!;
    const newBoard = applyElectionToBoard(initialBoard, election, winner);

    const newPresident = newBoard.members.find((m) => m.role === 'presidente');
    expect(newPresident?.name).toBe(winner.name);
    expect(newPresident?.termStart.year).toBe(1911);
    expect(newPresident?.termEnd.year).toBe(1912);

    // Other officers preserved
    expect(newBoard.members.length).toBe(2);
  });
});
