'use client';

import React, { useState, useEffect } from 'react';
import type { WorldDate } from '@/game/core/World';

export interface CityNewsTeletypeProps {
  date: WorldDate;
  onOpenArchive?: () => void;
}

const HISTORICAL_CHRONICLES: { yearMin: number; yearMax: number; headlines: string[] }[] = [
  {
    yearMin: 1910,
    yearMax: 1914,
    headlines: [
      'CIDADE DE MINAS: Os trens da Central do Brasil trazem entusiasmo desportivo e novas famílias à capital.',
      'FOOT-BALL: Rapazes da elite e artífices ferroviários organizam os primeiros rachas de terra batida nos arrabaldes.',
      'MERCADO: Lojas do centro anunciam a chegada de bolas de couro inglês e chuteiras com travas de sola.',
      'SOCIEDADE: As gazetas locais elogiam a moral sadia do foot-ball como antídoto aos vícios da mocidade.',
    ],
  },
  {
    yearMin: 1915,
    yearMax: 1919,
    headlines: [
      'FEDERAÇÃO (1915): Dirigentes desportivos fundam a Liga Mineira de Desportos Terrestres (LMDT).',
      'CISMA DA AMEA (1916): Dissidência aristocrática rompe com a Liga oficial e organiza campeonato paralelo.',
      'URBANISMO: Bairros operários expandem-se rapidamente em torno das oficinas e tecelagens.',
      'SAÚDE PÚBLICA (1918): A gripe espanhola suspende temporariamente os festivais desportivos e concentrações.',
    ],
  },
  {
    yearMin: 1920,
    yearMax: 1929,
    headlines: [
      'TRANSPORTE: Bondes elétricos conectam a Praça da Estação aos novos bairros desportivos.',
      'PATRIMÔNIO: Clubes da cidade erguem arquibancadas de madeira de lei para acomodar torcidas crescentes.',
      'MODERNISMO: O foot-ball firma-se como a principal paixão dos domingos mineiros.',
      'CLUBE SOCIAL: Bailes de carnaval e noites de orfeão movimentam as sedes das agremiações.',
    ],
  },
  {
    yearMin: 1930,
    yearMax: 1939,
    headlines: [
      'RADIALISMO: Os primeiros alto-falantes e receptores a válvula transmitem os clássicos da cidade pelo éter.',
      'PROFISSIONALISMO: Clubes debatem intensamente a concessão de ordenados e luvas aos melhores craques.',
      'ESTADO NOVO: Festivais cívicos e desfiles da juventude ocupam os campos desportivos municipais.',
      'ARRECADAÇÃO: Recordes de bilheteria e assistência nos derbys da capital.',
    ],
  },
  {
    yearMin: 1940,
    yearMax: 1949,
    headlines: [
      'MOEDA (1942): Decreto federal institui o Cruzeiro (Cr$ 1,00) substituindo os antigos Mil-Réis.',
      'GUERRA: A imprensa acompanha as notícias dos pracinhas na Itália e os festivais patrióticos nos campos.',
      'INFRAESTRUTURA: Obras de saneamento e abertura de grandes avenidas modernizam a Cidade de Minas.',
      'CATEGORIAS DE BASE: Torneios de aspirantes e juvenis revelam prodígios nos bairros periféricos.',
    ],
  },
  {
    yearMin: 1950,
    yearMax: 1959,
    headlines: [
      'ERA DO CONCRETO: Estádios imponentes de cimento armado substituem os antigos tablados de madeira.',
      'ANOS DOURADOS: Minas Gerais pulsa ao som da Bossa Nova, do rádio de pilha e do futebol refinado.',
      'CBD (1959): A Confederação Brasileira de Desportos cria a TAÇA BRASIL unificando os campeões estaduais!',
      'JUBILEU DE OURO (1959): 50 anos de história gloriosa do foot-ball e da Cidade de Minas!',
    ],
  },
];

export function CityNewsTeletype({ date, onOpenArchive }: CityNewsTeletypeProps) {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const eraGroup =
    HISTORICAL_CHRONICLES.find((g) => date.year >= g.yearMin && date.year <= g.yearMax) ??
    HISTORICAL_CHRONICLES[HISTORICAL_CHRONICLES.length - 1];

  const currentHeadline = eraGroup.headlines[headlineIndex % eraGroup.headlines.length];

  // Rotate headline every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % eraGroup.headlines.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [eraGroup.headlines.length]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '52px',
        left: '14px',
        right: '14px',
        zIndex: 900,
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        border: '1px solid #777777',
        boxShadow: '2px 2px 0px #ffffff',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        color: '#ffffff',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
      aria-label="Teletipo da Cidade de Minas"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <span
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '9.5px',
            padding: '1px 6px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          TELEGRAMA {date.year}
        </span>

        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#f7f6ed',
            letterSpacing: '0.02em',
          }}
        >
          {currentHeadline}
        </span>
      </div>

      {onOpenArchive && (
        <button
          type="button"
          onClick={onOpenArchive}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #555555',
            color: '#e0aa38',
            fontSize: '10px',
            padding: '2px 8px',
            cursor: 'pointer',
            marginLeft: '12px',
            flexShrink: 0,
            textTransform: 'uppercase',
          }}
        >
          📜 Arquivo
        </button>
      )}
    </div>
  );
}
