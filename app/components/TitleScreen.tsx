'use client';

import React from 'react';
import type { ClubState } from '@/game/core/club/Club';
import { CrestBadge } from './CrestBadge';
import type { CrestShape } from '@/game/core/club/ClubIdentity';
import { retroAudio } from '../audio/RetroAudio';

export interface TitleScreenProps {
  club: ClubState | null;
  worldSeed: string;
  currentYear: number;
  onStartNewClub: () => void;
  onContinueGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenBenchmark: () => void;
  onOpenDevInspector: () => void;
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

export function TitleScreen({
  club,
  worldSeed,
  currentYear,
  onStartNewClub,
  onContinueGame,
  onOpenHowToPlay,
  onOpenBenchmark,
  onOpenDevInspector,
}: TitleScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: "'Courier New', 'Lucida Console', Monaco, monospace",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* RETRO ARCADE SCANLINE DECORATION */}
      <div
        className="arcade-scanlines"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '820px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          border: '4px solid #ffffff',
          boxShadow: '8px 8px 0px #ffffff',
          padding: '28px 24px',
          backgroundColor: '#000000',
        }}
      >
        {/* TOP BADGE */}
        <div
          style={{
            display: 'inline-block',
            border: '2px solid #ffffff',
            padding: '4px 14px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            backgroundColor: '#ffffff',
            color: '#000000',
            marginBottom: '16px',
          }}
        >
          ★ FLIPERAMA HISTÓRICO · ALPHA 0.1 ★
        </div>

        {/* ASCII ART TITLE LOGO */}
        <pre
          style={{
            fontFamily: 'monospace',
            fontSize: 'clamp(7px, 1.3vw, 13px)',
            lineHeight: 1.15,
            color: '#ffffff',
            margin: '0 0 12px 0',
            userSelect: 'none',
            letterSpacing: '0.05em',
            textShadow: '0 0 4px rgba(255,255,255,0.8)',
          }}
        >
{`  ████████╗██████╗  █████╗ ██████╗ ██╗ ██████╗ █████╗  ██████╗ 
  ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║██╔════╝██╔══██╗██╔═══██╗
     ██║   ██████╔╝███████║██║  ██║██║██║     ███████║██║   ██║
     ██║   ██╔══██╗██╔══██║██║  ██║██║██║     ██╔══██║██║   ██║
     ██║   ██║  ██║██║  ██║██████╔╝██║╚██████╗██║  ██║╚██████╔╝
     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ 
            E S P O R T E   C L U B E   ·   1 9 1 0`}
        </pre>

        <h2
          style={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: '0 0 14px 0',
            color: '#e0aa38',
            borderBottom: '1px dashed #555555',
            paddingBottom: '8px',
            width: '100%',
          }}
        >
          CIDADE DE MINAS · 50 ANOS DE FUTEBOL E MEMÓRIA (1910–1959)
        </h2>

        {/* HISTORICAL PROLOGUE TEASER */}
        <p
          style={{
            fontSize: 'clamp(11px, 1.4vw, 13px)',
            lineHeight: 1.6,
            maxWidth: '680px',
            color: '#cccccc',
            margin: '0 0 24px 0',
          }}
        >
          No início do século XX, o foot-ball surge nas oficinas da ferrovia e nos colégios de rapazes.
          Assuma a liderança institucional de uma agremiação esportiva pioneira na recém-fundada Cidade de Minas.
          Adquira o primeiro campo de terra, convoque os onze titulares da Pirâmide 2-3-5, dispute festivais
          de taça e guie seu clube pelas transformações do Brasil até a glória da Taça Brasil de 1959.
        </p>

        {/* CURRENT SAVE / CLUB PREVIEW (IF AVAILABLE) */}
        {club && (
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              border: '2px solid #e0aa38',
              backgroundColor: '#111111',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CrestBadge
                shape={getCrestShape(club)}
                primaryColor={club.colors.primary}
                secondaryColor={club.colors.secondary}
                accentColor={club.colors.accent}
                monogram={club.shortName}
                size={40}
              />
              <div>
                <div style={{ fontSize: '10px', color: '#e0aa38', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Campanha Salva · Ano {currentYear}
                </div>
                <strong style={{ fontSize: '15px', color: '#ffffff', display: 'block' }}>
                  {club.name}
                </strong>
                <div style={{ fontSize: '11px', color: '#888888' }}>
                  Caixa: {club.finances ? `${club.finances.balancePPU.toFixed(1)} PPU` : '0 PPU'} · {club.membership?.members.length ?? 0} Sócios
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueGame}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2px solid #000000',
                padding: '8px 16px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '3px 3px 0px #e0aa38',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              ▶ CONTINUAR
            </button>
          </div>
        )}

        {/* MAIN MENU BUTTONS (ARCADE STYLE) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '460px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              retroAudio.playStart();
              onStartNewClub();
            }}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '3px solid #ffffff',
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: '900',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '5px 5px 0px rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '7px 7px 0px #e0aa38';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0px, 0px)';
              e.currentTarget.style.boxShadow = '5px 5px 0px rgba(255,255,255,0.4)';
            }}
          >
            <span>🎮</span> FUNDAR NOVO CLUBE (1910)
          </button>

          {club && (
            <button
              type="button"
              onClick={() => {
                retroAudio.playStart();
                onContinueGame();
              }}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                border: '2px solid #ffffff',
                padding: '12px 20px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '3px 3px 0px #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>▶</span> ENTRAR NA CIDADE / CONTINUAR
            </button>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                retroAudio.playBlip();
                onOpenHowToPlay();
              }}
              style={{
                backgroundColor: '#000000',
                color: '#cccccc',
                border: '1px solid #777777',
                padding: '10px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>❓</span> COMO JOGAR
            </button>

            <button
              type="button"
              onClick={() => {
                retroAudio.playBlip();
                onOpenBenchmark();
              }}
              style={{
                backgroundColor: '#000000',
                color: '#cccccc',
                border: '1px solid #777777',
                padding: '10px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>📊</span> 100 SEEDS
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              retroAudio.playBlip();
              onOpenDevInspector();
            }}
            style={{
              backgroundColor: '#000000',
              color: '#888888',
              border: '1px dashed #444444',
              padding: '8px',
              fontSize: '10px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              marginTop: '4px',
            }}
          >
            🛠️ MODO DESENVOLVEDOR (TELEMETRIA & TIME-TRAVEL)
          </button>
        </div>

        {/* FOOTER METADATA */}
        <div
          style={{
            marginTop: '24px',
            borderTop: '1px dashed #333333',
            paddingTop: '12px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#666666',
          }}
        >
          <span>SEED DA CAMPANHA: {worldSeed || '1910-PADRÃO'}</span>
          <span>MOTOR DETERMINÍSTICO · ZERO MATH.RANDOM()</span>
          <span>CIDADE DE MINAS · 1910–1959</span>
        </div>
      </div>
    </div>
  );
}
