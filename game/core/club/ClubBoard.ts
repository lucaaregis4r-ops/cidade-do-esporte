/**
 * Club Board of Directors (Diretoria Estatutária de 1910) domain model (C11).
 * Governs elected and provisional officers, statutory terms (mandatos),
 * internal club governance and executive roles.
 */

import type { GameDate } from '../HistoricalClock';
import type { FoundingGroup, FoundingMember, SocialClass } from './FoundingGroup';

export const BOARD_ROLES = [
  'presidente',            // Presidente da Diretoria
  'vice_presidente',       // Vice-Presidente
  'primeiro_secretario',   // 1º Secretário (atas, correspondência oficial)
  'segundo_secretario',    // 2º Secretário (livro de sócios, matrículas)
  'primeiro_tesoureiro',   // 1º Tesoureiro (guarda do caixa, balancetes)
  'segundo_tesoureiro',    // 2º Tesoureiro (arrecadação e cobranças)
  'capitao_geral',         // Capitão Geral / Diretor de Futebol de Campo
  'diretor_patrimonio',    // Diretor de Campo e Patrimônio (zeladoria da sede)
] as const;

export type BoardRole = (typeof BOARD_ROLES)[number];

export const BOARD_ROLE_LABELS: Readonly<Record<BoardRole, string>> = Object.freeze({
  presidente: 'Presidente da Diretoria',
  vice_presidente: 'Vice-Presidente',
  primeiro_secretario: '1º Secretário',
  segundo_secretario: '2º Secretário',
  primeiro_tesoureiro: '1º Tesoureiro',
  segundo_tesoureiro: '2º Tesoureiro',
  capitao_geral: '1º Capitão Geral de Campo',
  diretor_patrimonio: 'Diretor de Campo e Patrimônio',
});

export interface BoardMember {
  readonly id: string;
  readonly name: string;
  readonly role: BoardRole;
  readonly roleLabel: string;
  readonly socialClass: SocialClass;
  readonly occupation: string;
  readonly termStart: Readonly<GameDate>;
  readonly termEnd: Readonly<GameDate>;
  readonly biography?: string;
}

export interface ClubBoardState {
  readonly members: readonly BoardMember[];
  readonly electedDate: Readonly<GameDate>;
  readonly mandateYears: number;
  readonly deliberationCouncilCount: number;
}

/**
 * Creates the inaugural provisional board (Diretoria Provisória de 1910) from the club's FoundingGroup.
 * The leadership mandate established at the inaugural assembly typically lasts 1 year.
 */
export function generateInitialBoard(
  foundingGroup: FoundingGroup,
  foundingDate: GameDate,
  mandateYears = 1,
): ClubBoardState {
  const termEnd: GameDate = {
    year: foundingDate.year + mandateYears,
    month: foundingDate.month,
    day: foundingDate.day,
  };

  const members: BoardMember[] = [];
  const fm = foundingGroup.members;

  // 1. Presidente (Leader of the group)
  const leader = foundingGroup.leader;
  members.push({
    id: `dir-${leader.id}`,
    name: leader.name,
    role: 'presidente',
    roleLabel: BOARD_ROLE_LABELS.presidente,
    socialClass: leader.socialClass,
    occupation: leader.occupation,
    termStart: { ...foundingDate },
    termEnd: { ...termEnd },
    biography: leader.biography,
  });

  // 2. Assign other statutory roles from founding members
  const rolesAssignment: Array<{ role: BoardRole; fallbackMemberIdx: number }> = [
    { role: 'vice_presidente', fallbackMemberIdx: 1 },
    { role: 'primeiro_secretario', fallbackMemberIdx: 2 },
    { role: 'segundo_secretario', fallbackMemberIdx: 3 },
    { role: 'primeiro_tesoureiro', fallbackMemberIdx: 4 },
    { role: 'capitao_geral', fallbackMemberIdx: 5 },
    { role: 'diretor_patrimonio', fallbackMemberIdx: 6 },
  ];

  for (const { role, fallbackMemberIdx } of rolesAssignment) {
    const member: FoundingMember = fm[fallbackMemberIdx] || fm[fallbackMemberIdx % fm.length];
    members.push({
      id: `dir-${member.id}-${role}`,
      name: member.name,
      role,
      roleLabel: BOARD_ROLE_LABELS[role],
      socialClass: member.socialClass,
      occupation: member.occupation,
      termStart: { ...foundingDate },
      termEnd: { ...termEnd },
      biography: member.biography,
    });
  }

  return {
    members: Object.freeze(members),
    electedDate: Object.freeze({ ...foundingDate }),
    mandateYears,
    deliberationCouncilCount: Math.max(5, fm.length),
  };
}

/**
 * Defensive validator for BoardMember.
 */
export function validateBoardMember(member: unknown): member is BoardMember {
  if (!member || typeof member !== 'object') return false;
  const m = member as Partial<BoardMember>;
  if (typeof m.id !== 'string' || m.id.trim().length === 0) return false;
  if (typeof m.name !== 'string' || m.name.trim().length === 0) return false;
  if (!m.role || !BOARD_ROLES.includes(m.role)) return false;
  if (typeof m.roleLabel !== 'string' || m.roleLabel.trim().length === 0) return false;
  if (!m.termStart || typeof m.termStart.year !== 'number') return false;
  if (!m.termEnd || typeof m.termEnd.year !== 'number') return false;
  return true;
}

/**
 * Defensive validator for ClubBoardState.
 */
export function validateClubBoardState(board: unknown): board is ClubBoardState {
  if (!board || typeof board !== 'object') return false;
  const b = board as Partial<ClubBoardState>;
  if (!Array.isArray(b.members) || b.members.length === 0) return false;
  if (!b.electedDate || typeof b.electedDate.year !== 'number') return false;
  if (typeof b.mandateYears !== 'number' || b.mandateYears < 1) return false;
  if (typeof b.deliberationCouncilCount !== 'number' || b.deliberationCouncilCount < 0) return false;
  return b.members.every(validateBoardMember);
}
