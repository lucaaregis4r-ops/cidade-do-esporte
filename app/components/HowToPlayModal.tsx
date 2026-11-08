'use client';

import React, { useState } from 'react';

export interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClubCreation?: () => void;
}

export function HowToPlayModal({ isOpen, onClose, onOpenClubCreation }: HowToPlayModalProps) {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Courier New', 'Lucida Console', Monaco, monospace",
      }}
    >
      <div
        style={{
          width: 'min(780px, 95vw)',
          maxHeight: '90vh',
          backgroundColor: '#000000',
          border: '2px solid #ffffff',
          boxShadow: '6px 6px 0px #ffffff',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '2px solid #ffffff',
            backgroundColor: '#ffffff',
            color: '#000000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <span>🕹️ GUIA DO JOGADOR · MANUAL OFICIAL TRADIÇÃO E.C.</span>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '1px solid #000000',
              cursor: 'pointer',
              fontWeight: 800,
              padding: '2px 8px',
              textTransform: 'uppercase',
            }}
          >
            [ X FECHAR ]
          </button>
        </div>

        {/* NAVEGAÇÃO DE PASSOS */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #ffffff',
            backgroundColor: '#111111',
          }}
        >
          {[
            { step: 1, label: '1. Fundação (1910)' },
            { step: 2, label: '2. Tática 2-3-5' },
            { step: 3, label: '3. Jogos & Finanças' },
            { step: 4, label: '4. Taça Brasil (1959)' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderRight: '1px solid #333333',
                backgroundColor: activeStep === item.step ? '#ffffff' : '#000000',
                color: activeStep === item.step ? '#000000' : '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: '11px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CORPO DO GUIA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeStep === 1 && (
            <div style={{ display: 'grid', gap: '14px', fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px dashed #ffffff', paddingBottom: '6px' }}>
                🏛️ PASSO 1: A FUNDAÇÃO EM 01 DE JANEIRO DE 1910
              </div>
              <p>
                Bem-vindo a <strong>Cidade de Minas</strong>! Em 1910, o foot-ball é uma febre recente que contagia as oficinas, faculdades e os arrabaldes da nova capital.
              </p>
              <div style={{ border: '1px solid #ffffff', padding: '12px', backgroundColor: '#080808' }}>
                <strong style={{ display: 'block', marginBottom: '6px' }}>📋 COMO COMEÇAR:</strong>
                <ol style={{ paddingLeft: '20px', margin: 0, display: 'grid', gap: '6px' }}>
                  <li>Clique no botão <strong>[ 🎮 CRIAR MEU CLUBE ]</strong> no topo da tela.</li>
                  <li>Escolha o nome e a <strong>Origem Social</strong> (Ferroviários, Estudantes, Operários, Comerciantes, Imigrantes ou Elite). Isso define seus fundadores, dinheiro inicial e prestígio!</li>
                  <li>Escolha o formato do seu <strong>Escudo Heráldico</strong> e as cores alvinegras clássicas.</li>
                  <li>Veja os nomes e profissões dos <strong>Sócios Fundadores</strong> gerados pelo jogo.</li>
                  <li>Assine o contrato de comodato ou aluguel da sua <strong>Praça de Esportes inaugural</strong>.</li>
                </ol>
              </div>
              {onOpenClubCreation && (
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenClubCreation();
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      border: '2px solid #ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      boxShadow: '2px 2px 0px #888888',
                    }}
                  >
                    🎮 ABRIR MENU DE CRIAÇÃO DO CLUBE AGORA
                  </button>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div style={{ display: 'grid', gap: '14px', fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px dashed #ffffff', paddingBottom: '6px' }}>
                ⚽ PASSO 2: A PIRÂMIDE TÁTICA BRITÂNICA 2-3-5
              </div>
              <p>
                Em 1910 não existia 4-4-2 ou 4-3-3! O futebol era ofensivo e jogado na formação clássica britânica conhecida como <strong>A Pirâmide (2-3-5)</strong>:
              </p>
              <div style={{ border: '1px solid #ffffff', padding: '12px', backgroundColor: '#080808', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', color: '#aaaaaa', marginBottom: '8px' }}>[ CAMPO ADVERSÁRIO ]</div>
                <div style={{ textAlign: 'center', fontWeight: 700, margin: '6px 0' }}>
                  (Ponta E.) · (Meia E.) · (Centroavante) · (Meia D.) · (Ponta D.)
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#888888', margin: '4px 0' }}>
                  ▲ ▲ ▲ CINCO ATACANTES DE FRENTE ▲ ▲ ▲
                </div>
                <div style={{ textAlign: 'center', fontWeight: 700, margin: '10px 0' }}>
                  (Half Esquerdo) · (Centre-Half Distribuidor) · (Half Direito)
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#888888', margin: '4px 0' }}>
                  ▲ ▲ A LINHA MÉDIA DE COMBATE ▲ ▲
                </div>
                <div style={{ textAlign: 'center', fontWeight: 700, margin: '10px 0' }}>
                  (Back Esquerdo) · (Back Direito)
                </div>
                <div style={{ textAlign: 'center', fontWeight: 700, margin: '8px 0' }}>
                  (GOLEIRO)
                </div>
                <div style={{ textAlign: 'center', color: '#aaaaaa', marginTop: '8px' }}>[ SUA META ]</div>
              </div>
              <div style={{ border: '1px solid #ffffff', padding: '10px', backgroundColor: '#111111' }}>
                <strong>⚠️ REGRA HISTÓRICA VITAL:</strong> Não existem substituições na época de 1910! Se um jogador se machucar, seu clube atuará com 10 jogadores até o fim da partida. Dose os treinos semanais na aba <em>Futebol</em> para poupar o elenco!
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div style={{ display: 'grid', gap: '14px', fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px dashed #ffffff', paddingBottom: '6px' }}>
                ⚔️ PASSO 3: AMISTOSOS, DÉRBIS E ECONOMIA REAL
              </div>
              <p>
                Como clube de 1910, você precisa manter a instituição viva e solvente:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ border: '1px solid #ffffff', padding: '10px' }}>
                  <strong>🏟️ DISPUTAR PARTIDAS:</strong>
                  <p style={{ margin: '6px 0 0', color: '#cccccc' }}>
                    Abra o menu <strong>[ ⚔️ Partidas ]</strong> para desafiar o <em>América</em>, <em>Villa Nova</em> ou <em>Yale</em>. Acompanhe a súmula, crônica esportiva e a arrecadação de bilheteria em PPU e Réis!
                  </p>
                </div>
                <div style={{ border: '1px solid #ffffff', padding: '10px' }}>
                  <strong>💰 LIVRO-CAIXA & SÓCIOS:</strong>
                  <p style={{ margin: '6px 0 0', color: '#cccccc' }}>
                    Cada associado paga mensalidade na virada do mês. Mantenha os reparos da cerca e da arquibancada do campo em dia para não sofrer interdição pelo Tribunal de Penas da Federação!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div style={{ display: 'grid', gap: '14px', fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px dashed #ffffff', paddingBottom: '6px' }}>
                🏆 PASSO 4: A GLÓRIA DE 1959 E O EPÍLOGO DOS 50 ANOS
              </div>
              <p>
                A campanha de <strong>Tradição Esporte Clube</strong> acompanha meio século ininterrupto da história brasileira, de 1910 a 1959:
              </p>
              <div style={{ border: '1px solid #ffffff', padding: '12px', backgroundColor: '#080808' }}>
                <ul style={{ paddingLeft: '18px', margin: 0, display: 'grid', gap: '6px' }}>
                  <li><strong>A Chegada da Federação (1915):</strong> Fundação da Liga Mineira e disputa de campeonatos oficiais de pontos corridos.</li>
                  <li><strong>O Dérbi & A Imprensa:</strong> Acompanhe as manchetes dos jornais de época e rivalidades acirradas com torcidas por bairros.</li>
                  <li><strong>A Taça Brasil de 1959:</strong> O primeiro campeonato nacional unificado do país! Dispute a fase mineira e as finais inter-regionais contra os gigantes do futebol brasileiro.</li>
                  <li><strong>O Relatório Jubilar de 50 Anos:</strong> Em 31/12/1959, veja a crônica comemorativa imutável gravando presidentes, lendas, taças e a evolução do seu patrimônio!</li>
                </ul>
              </div>

              {/* ATALHOS */}
              <div style={{ border: '1px dashed #ffffff', padding: '10px', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <span>⌨️ <strong>[Espaço]</strong> Pausa</span>
                <span>⚡ <strong>[1, 2, 3, 4]</strong> Velocidade (1x–8x)</span>
                <span>🔍 <strong>[S]</strong> Inspecionar Terrenos</span>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '2px solid #ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0a0a0a',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveStep((prev) => Math.max(prev - 1, 1))}
              disabled={activeStep === 1}
              style={{
                padding: '4px 10px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '1px solid #ffffff',
                cursor: activeStep === 1 ? 'not-allowed' : 'pointer',
                opacity: activeStep === 1 ? 0.4 : 1,
              }}
            >
              &lt; Anterior
            </button>
            <button
              onClick={() => setActiveStep((prev) => Math.min(prev + 1, 4))}
              disabled={activeStep === 4}
              style={{
                padding: '4px 10px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '1px solid #ffffff',
                cursor: activeStep === 4 ? 'not-allowed' : 'pointer',
                opacity: activeStep === 4 ? 0.4 : 1,
              }}
            >
              Próximo &gt;
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #ffffff',
              cursor: 'pointer',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            Entendido, Vamos Jogar!
          </button>
        </div>
      </div>
    </div>
  );
}
