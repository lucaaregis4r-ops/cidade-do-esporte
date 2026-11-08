'use client';

import React, { useEffect } from 'react';
import type { MatchRecord } from '@/game/core/football/MatchEngine';
import type { ClubState } from '@/game/core/club/Club';
import { CrestBadge } from './CrestBadge';
import type { CrestShape } from '@/game/core/club/ClubIdentity';
import { retroAudio } from '../audio/RetroAudio';

export interface MatchScoreboardModalProps {
  match: MatchRecord | null;
  onClose: () => void;
  protagonistClub: ClubState | null;
}

function getCrestShape(club: ClubState | null): CrestShape {
  if (!club || !club.crestHistory || club.crestHistory.length === 0) return 'swiss';
  const designId = club.crestHistory[club.crestHistory.length - 1].designId;
  const shape = designId.split('-')[0];
  if (['swiss', 'circle', 'stripes', 'sash', 'diamond'].includes(shape)) {
    return shape as CrestShape;
  }
  return 'swiss';
}

export function MatchScoreboardModal({
  match,
  onClose,
  protagonistClub,
}: MatchScoreboardModalProps) {
  const isHomeProtagonist = protagonistClub?.id === match?.homeClubId || protagonistClub?.name === match?.homeClubName;
  const protagonistScore = match ? (isHomeProtagonist ? match.homeScore : match.awayScore) : 0;
  const rivalScore = match ? (isHomeProtagonist ? match.awayScore : match.homeScore) : 0;
  const isVictory = protagonistScore > rivalScore;
  const isDraw = protagonistScore === rivalScore;

  useEffect(() => {
    if (match) {
      retroAudio.playWhistle();
      if (isVictory) {
        const timer = setTimeout(() => retroAudio.playFanfare(), 350);
        return () => clearTimeout(timer);
      }
    }
  }, [match, isVictory]);

  if (!match) return null;

  const resultTitle = isVictory ? '★ VITÓRIA HISTÓRICA ★' : isDraw ? 'EMPATE DISPUTADO' : 'REVÉS EM CAMPO';
  const resultColor = isVictory ? '#a0d468' : isDraw ? '#e0aa38' : '#ed5565';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        fontFamily: "'Courier New', monospace",
        boxSizing: 'border-box',
      }}
    >
      <div
        className="arcade-scanlines"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#000000',
          border: '4px solid #ffffff',
          boxShadow: '8px 8px 0px #ffffff',
          padding: '24px',
          color: '#ffffff',
          textAlign: 'center',
        }}
      >
        {/* MATCH BANNER HEADER */}
        <div
          style={{
            display: 'inline-block',
            backgroundColor: resultColor,
            color: '#000000',
            fontWeight: 900,
            fontSize: '12px',
            padding: '4px 14px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {resultTitle}
        </div>

        <div style={{ fontSize: '11px', color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {match.competitionName || (match.competitionType === 'festival_taça' ? 'Taça de Inauguração' : 'Amistoso Histórico')} · 1910
        </div>

        {/* RETRO SCOREBOARD DISPLAY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '16px',
            margin: '20px 0',
            padding: '16px 12px',
            border: '2px solid #e0aa38',
            backgroundColor: '#0d0d0d',
          }}
        >
          {/* HOME TEAM */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {isHomeProtagonist && protagonistClub ? (
              <CrestBadge
                shape={getCrestShape(protagonistClub)}
                primaryColor={protagonistClub.colors.primary}
                secondaryColor={protagonistClub.colors.secondary}
                accentColor={protagonistClub.colors.accent}
                monogram={protagonistClub.shortName}
                size={48}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  backgroundColor: '#222222',
                }}
              >
                ⚽
              </div>
            )}
            <strong style={{ fontSize: '14px', color: '#ffffff', textTransform: 'uppercase' }}>
              {match.homeClubName}
            </strong>
          </div>

          {/* BIG RETRO FLIP SCORE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: 'clamp(32px, 5vw, 44px)',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              color: '#ffffff',
              padding: '6px 16px',
              border: '2px solid #ffffff',
              backgroundColor: '#000000',
              boxShadow: '3px 3px 0px #ffffff',
            }}
          >
            <span>{match.homeScore}</span>
            <span style={{ fontSize: '24px', color: '#888888' }}>x</span>
            <span>{match.awayScore}</span>
          </div>

          {/* AWAY TEAM */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {!isHomeProtagonist && protagonistClub ? (
              <CrestBadge
                shape={getCrestShape(protagonistClub)}
                primaryColor={protagonistClub.colors.primary}
                secondaryColor={protagonistClub.colors.secondary}
                accentColor={protagonistClub.colors.accent}
                monogram={protagonistClub.shortName}
                size={48}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  backgroundColor: '#222222',
                }}
              >
                ⚔️
              </div>
            )}
            <strong style={{ fontSize: '14px', color: '#ffffff', textTransform: 'uppercase' }}>
              {match.awayClubName}
            </strong>
          </div>
        </div>

        {/* CROWD & FINANCIAL SUMMARY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ padding: '8px', border: '1px solid #444444', backgroundColor: '#111111' }}>
            <span style={{ fontSize: '10px', color: '#888888', display: 'block' }}>PÚBLICO ESTIMADO</span>
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>
              {match.attendance ? match.attendance.toLocaleString('pt-BR') : 'Sem registro'}
            </strong>
          </div>
          <div style={{ padding: '8px', border: '1px solid #444444', backgroundColor: '#111111' }}>
            <span style={{ fontSize: '10px', color: '#888888', display: 'block' }}>RENDA BRUTA</span>
            <strong style={{ fontSize: '14px', color: '#f2d994' }}>
              {match.gateReceiptsPPU !== undefined ? `${match.gateReceiptsPPU.toFixed(1)} PPU` : '0.0 PPU'}
            </strong>
          </div>
          <div style={{ padding: '8px', border: '1px solid #444444', backgroundColor: '#111111' }}>
            <span style={{ fontSize: '10px', color: '#888888', display: 'block' }}>SALDO LÍQUIDO</span>
            <strong
              style={{
                fontSize: '14px',
                color: match.netIncomePPU >= 0 ? '#a0d468' : '#ed5565',
              }}
            >
              {match.netIncomePPU !== undefined ? `${match.netIncomePPU > 0 ? '+' : ''}${match.netIncomePPU.toFixed(1)} PPU` : '0.0 PPU'}
            </strong>
          </div>
        </div>

        {/* HISTORICAL NEWSPAPER CHRONICLE HEADLINE */}
        <div
          style={{
            padding: '12px',
            border: '1px solid #e0aa38',
            backgroundColor: '#141410',
            textAlign: 'left',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '10px', color: '#e0aa38', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
            📰 Gazeta de Notícias de Minas (Edição do Dia Seguinte)
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#dedede', lineHeight: 1.5, fontStyle: 'italic' }}>
            &ldquo;{match.summaryPt || 'O prélio de foot-ball transcorreu sob enorme interesse de cavalheiros e famílias da sociedade local, demonstrando os brios e a técnica viril dos quadros em disputa.'}&rdquo;
          </p>
        </div>

        {/* MATCH EVENTS TIMELINE */}
        {match.events && match.events.length > 0 && (
          <div
            style={{
              textAlign: 'left',
              border: '1px solid #333333',
              padding: '10px 14px',
              backgroundColor: '#0a0a0a',
              marginBottom: '20px',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '10px', color: '#888888', textTransform: 'uppercase', marginBottom: '6px' }}>
              LANCES CAPITAIS DA PARTIDA (PIRÂMIDE 2-3-5)
            </div>
            {match.events.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '11px',
                  color: evt.type === 'goal' ? '#f2d994' : '#cccccc',
                  padding: '3px 0',
                  borderBottom: '1px dashed #222222',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <span style={{ fontWeight: 'bold', color: '#e0aa38', minWidth: '28px' }}>{evt.minute}&apos;</span>
                <span>{evt.type === 'goal' ? '⚽ GOL!' : evt.type === 'shot_saved' ? '🧤 DEFESA:' : '⚡ LANCE:'}</span>
                <span>{evt.descriptionPt}</span>
              </div>
            ))}
          </div>
        )}

        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={() => {
            retroAudio.playBlip();
            onClose();
          }}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '3px solid #000000',
            padding: '12px 28px',
            fontSize: '13px',
            fontWeight: 900,
            cursor: 'pointer',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            boxShadow: '4px 4px 0px #e0aa38',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e0aa38';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          🏆 REGISTRAR NA HISTÓRIA & CONTINUAR
        </button>
      </div>
    </div>
  );
}
