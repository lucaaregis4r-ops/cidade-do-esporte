'use client';

import React, { useState } from 'react';
import type { ClubState } from '@/game/core/club/Club';

export interface FounderQuest {
  id: string;
  era: string;
  yearRange: [number, number];
  title: string;
  description: string;
  reward: string;
  isComplete: (club: ClubState | null, context: QuestContext) => boolean;
  actionLabel: string;
  actionIcon: string;
  onExecute: () => void;
}

export interface QuestContext {
  year: number;
  matchCount: number;
  memberCount: number;
  facilityCount: number;
  hasTrophy: boolean;
}

export interface FounderQuestPanelProps {
  club: ClubState | null;
  currentYear: number;
  matchCount: number;
  memberCount: number;
  facilityCount: number;
  hasTrophy: boolean;
  onOpenMatches: () => void;
  onOpenFacilities: () => void;
  onOpenFootball: () => void;
  onOpenMembers: () => void;
  onOpenCompetitions: () => void;
  onOpenTacaBrasil: () => void;
}

export function FounderQuestPanel({
  club,
  currentYear,
  matchCount,
  memberCount,
  facilityCount,
  hasTrophy,
  onOpenMatches,
  onOpenFacilities,
  onOpenFootball,
  onOpenMembers,
  onOpenCompetitions,
  onOpenTacaBrasil,
}: FounderQuestPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const questContext: QuestContext = {
    year: currentYear,
    matchCount,
    memberCount,
    facilityCount,
    hasTrophy,
  };

  const quests: FounderQuest[] = [
    {
      id: 'quest_foundation',
      era: '1910 · Belle Époque',
      yearRange: [1910, 1912],
      title: 'Ata Inaugural & Identidade',
      description: 'Reunir os fundadores pioneiros, definir os estatutos sociais e as cores sagradas do clube.',
      reward: '+15 Reputação Inicial · Fundação Registrada',
      isComplete: (c) => Boolean(c && c.name && c.foundingStory),
      actionLabel: 'Ver Ata e Brasão',
      actionIcon: '📜',
      onExecute: () => onOpenFootball(),
    },
    {
      id: 'quest_first_ground',
      era: '1910–1912 · Os Primeiros Passos',
      yearRange: [1910, 1912],
      title: 'O Primeiro Pouso Esportivo',
      description: 'Firmar contrato em uma parcela de terra e erguer o primeiro campo de terra batida ou vestiário.',
      reward: '+10 PPU em Valor Patrimonial · Local para Treinos',
      isComplete: (c, ctx) => Boolean(c && c.parcels.length > 0 && ctx.facilityCount >= 1),
      actionLabel: 'Erguer Obra no Campo',
      actionIcon: '🏟️',
      onExecute: onOpenFacilities,
    },
    {
      id: 'quest_first_match',
      era: '1910–1914 · O Batismo de Fogo',
      yearRange: [1910, 1914],
      title: 'O Primeiro Desafio em Campo',
      description: 'Confrontar um rival de época (como o América Foot-Ball Club) em um amistoso ou taça inaugural.',
      reward: 'Bilheteria em PPU · Crônica na Imprensa de Época',
      isComplete: (_, ctx) => ctx.matchCount >= 1,
      actionLabel: 'Desafiar Rival para Amistoso',
      actionIcon: '⚔️',
      onExecute: onOpenMatches,
    },
    {
      id: 'quest_membership',
      era: '1913–1916 · Sustentabilidade',
      yearRange: [1913, 1916],
      title: 'Legião de Sócios Contribuintes',
      description: 'Ampliar o quadro social para pelo menos 10 sócios para sustentar mensalidades e despesas.',
      reward: 'Fluxo Contínuo de Caixa em PPU · Estabilidade Social',
      isComplete: (_, ctx) => ctx.memberCount >= 10,
      actionLabel: 'Admitir Novos Sócios',
      actionIcon: '👥',
      onExecute: onOpenMembers,
    },
    {
      id: 'quest_tactics',
      era: '1915–1920 · A Pirâmide 2-3-5',
      yearRange: [1915, 1920],
      title: 'Disciplina Tática da Pirâmide',
      description: 'Ajustar o regime de treinos e os 11 titulares para as primeiras ligas da Cidade de Minas.',
      reward: 'Entrosamento Tático · Menor Fadiga em Partidas',
      isComplete: (c) => Boolean(c && c.facilities.length >= 2),
      actionLabel: 'Ajustar Escalação e Treinos',
      actionIcon: '⚽',
      onExecute: onOpenFootball,
    },
    {
      id: 'quest_competitions',
      era: '1920–1935 · A Era das Ligas',
      yearRange: [1920, 1935],
      title: 'A Disputa do Campeonato Citadino',
      description: 'Disputar as competições oficiais da liga e perseguir a primeira taça para a sala de troféus.',
      reward: 'Troféu Perpétuo · Glória na Cidade de Minas',
      isComplete: (_, ctx) => ctx.matchCount >= 5 || ctx.hasTrophy,
      actionLabel: 'Ver Tabela e Competições',
      actionIcon: '🏆',
      onExecute: onOpenCompetitions,
    },
    {
      id: 'quest_taca_brasil',
      era: '1959 · O Clímax Nacional',
      yearRange: [1959, 1959],
      title: 'A Glória Suprema: Taça Brasil de 1959',
      description: 'Representar o estado de Minas Gerais no torneio nacional da CBD contra os maiores clubes do país!',
      reward: 'Imortalidade Histórica · Jubileu de Ouro de 50 Anos',
      isComplete: (c) => Boolean(c && currentYear >= 1959 && ctxMatchesFinished(questContext)),
      actionLabel: 'Abrir Chave da Taça Brasil 1959',
      actionIcon: '⭐',
      onExecute: onOpenTacaBrasil,
    },
  ];

  function ctxMatchesFinished(ctx: QuestContext): boolean {
    return ctx.matchCount >= 10;
  }

  // Find active quest: first incomplete quest matching current year or next available
  const activeQuestIndex = quests.findIndex((q) => !q.isComplete(club, questContext));
  const currentQuest = activeQuestIndex !== -1 ? quests[activeQuestIndex] : quests[quests.length - 1];
  const completedCount = quests.filter((q) => q.isComplete(club, questContext)).length;

  return (
    <aside
      aria-label="Diário do Fundador e Missões Históricas"
      style={{
        position: 'fixed',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1050,
        width: 'min(620px, calc(100vw - 32px))',
        backgroundColor: '#000000',
        border: '3px solid #e0aa38',
        boxShadow: '4px 4px 0px #e0aa38',
        color: '#ffffff',
        fontFamily: "'Courier New', monospace",
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#e0aa38',
          color: '#000000',
          padding: '6px 12px',
          fontWeight: 900,
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📜 DIÁRIO DO FUNDADOR · MISSÕES DE ÉPOCA</span>
          <span style={{ fontSize: '10px', backgroundColor: '#000000', color: '#ffffff', padding: '1px 6px' }}>
            {completedCount}/{quests.length} CONCLUÍDAS
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#000000',
            fontWeight: 900,
            cursor: 'pointer',
            fontSize: '12px',
          }}
          aria-label={isExpanded ? 'Minimizar diário' : 'Expandir diário'}
        >
          {isExpanded ? '▲ RECOLHER' : '▼ EXPANDIR'}
        </button>
      </div>

      {/* CONTENT AREA */}
      {isExpanded && (
        <div style={{ padding: '12px 14px', backgroundColor: '#0a0a0a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: '#e0aa38', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                OBJETIVO ATUAL · {currentQuest.era}
              </div>
              <h3 style={{ margin: '4px 0 6px 0', fontSize: '14px', color: '#ffffff', fontWeight: 'bold' }}>
                {currentQuest.title}
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#cccccc', lineHeight: 1.4 }}>
                {currentQuest.description}
              </p>
              <div style={{ fontSize: '10.5px', color: '#a0d468', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎁 Recompensa:</span>
                <span>{currentQuest.reward}</span>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              type="button"
              onClick={currentQuest.onExecute}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2px solid #000000',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                boxShadow: '3px 3px 0px #e0aa38',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0aa38';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#000000';
              }}
            >
              <span>{currentQuest.actionIcon}</span>
              <span>{currentQuest.actionLabel}</span>
            </button>
          </div>

          {/* PROGRESS STEPS BAR */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed #333333',
              display: 'flex',
              gap: '4px',
              overflowX: 'auto',
            }}
          >
            {quests.map((q, idx) => {
              const isDone = q.isComplete(club, questContext);
              const isCurrent = q.id === currentQuest.id;
              return (
                <div
                  key={q.id}
                  title={`${q.title} (${isDone ? 'Concluída' : isCurrent ? 'Em Andamento' : 'Futura'})`}
                  style={{
                    flex: 1,
                    minWidth: '28px',
                    height: '6px',
                    backgroundColor: isDone ? '#a0d468' : isCurrent ? '#e0aa38' : '#222222',
                    border: isCurrent ? '1px solid #ffffff' : '1px solid #444444',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
