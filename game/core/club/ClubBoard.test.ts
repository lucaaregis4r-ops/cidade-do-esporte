import { describe, it, expect } from 'vitest';
import {
  generateInitialBoard,
  validateBoardMember,
  validateClubBoardState,
  BOARD_ROLES,
  BOARD_ROLE_LABELS,
} from './ClubBoard';
import { generateFoundingGroup } from './FoundingGroup';
import { CampaignRng } from '../CampaignRng';

describe('ClubBoard Domain Model (C11)', () => {
  const seed = 'TEST-SEED-BOARD-1910';
  const rng = new CampaignRng(seed);
  const foundingGroup = generateFoundingGroup('elite', rng, { foundingYear: 1910 });
  const foundingDate = { year: 1910, month: 1, day: 1 };

  it('generates inaugural provisional board from founding group', () => {
    const board = generateInitialBoard(foundingGroup, foundingDate, 1);

    expect(board.members.length).toBeGreaterThanOrEqual(6);
    expect(board.mandateYears).toBe(1);
    expect(board.electedDate).toEqual(foundingDate);

    // President must match founding leader
    const president = board.members.find((m) => m.role === 'presidente');
    expect(president).toBeDefined();
    expect(president!.name).toBe(foundingGroup.leader.name);
    expect(president!.roleLabel).toBe(BOARD_ROLE_LABELS.presidente);
    expect(president!.termStart).toEqual(foundingDate);
    expect(president!.termEnd).toEqual({ year: 1911, month: 1, day: 1 });

    // Statutory offices must exist
    expect(board.members.some((m) => m.role === 'primeiro_secretario')).toBe(true);
    expect(board.members.some((m) => m.role === 'primeiro_tesoureiro')).toBe(true);
    expect(board.members.some((m) => m.role === 'capitao_geral')).toBe(true);
  });

  it('validates board state and members defensively', () => {
    const board = generateInitialBoard(foundingGroup, foundingDate, 1);
    expect(validateClubBoardState(board)).toBe(true);

    expect(validateClubBoardState(null)).toBe(false);
    expect(validateClubBoardState({ members: [] })).toBe(false);
    expect(validateBoardMember(board.members[0])).toBe(true);
    expect(validateBoardMember({ role: 'invalid_role' })).toBe(false);
  });

  it('covers all statutory board roles definitions', () => {
    expect(BOARD_ROLES).toContain('presidente');
    expect(BOARD_ROLES).toContain('capitao_geral');
    expect(BOARD_ROLES).toContain('diretor_patrimonio');
  });
});
