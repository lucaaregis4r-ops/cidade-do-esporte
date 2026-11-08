'use client';

import React, { useState, useMemo } from 'react';
import { CampaignRng, DEFAULT_WORLD_SEED } from '@/game/core/CampaignRng';
import { createClub, type ClubState, type FoundingOrigin, type ClubColors } from '@/game/core/club/Club';
import type { CrestShape } from '@/game/core/club/ClubIdentity';
import { generateFoundingGroup } from '@/game/core/club/FoundingGroup';
import { generateContractProposals, type LandOccupancyContract } from '@/game/core/club/ClubLandContract';
import type { CityParcel } from '@/game/core/city/cityParcels';
import { CrestBadge } from './CrestBadge';

export interface ClubCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldSeed: string;
  parcels: readonly CityParcel[];
  onFoundClub: (club: ClubState, parcelId: string, contract: LandOccupancyContract) => boolean;
  currentClub?: ClubState | null;
}

interface RetroTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

const RETRO_PALETTES: readonly RetroTheme[] = [
  { id: 'classic_bw', name: 'Alvinegro Clássico', primary: '#000000', secondary: '#ffffff', accent: '#ffffff' },
  { id: 'inverted_bw', name: 'Branco & Preto Invertido', primary: '#ffffff', secondary: '#000000', accent: '#000000' },
  { id: 'charcoal_ivory', name: 'Carvão & Marfim', primary: '#1a1a1a', secondary: '#f7f6ed', accent: '#d5d4c8' },
  { id: 'ebony_silver', name: 'Ébano & Prata', primary: '#0f0f12', secondary: '#e2e2ec', accent: '#9fa0b2' },
  { id: 'ink_newsprint', name: 'Tinta & Papel Jornal', primary: '#141414', secondary: '#ede9df', accent: '#7c7972' },
];

const HISTORICAL_NAMES: Record<FoundingOrigin, readonly { name: string; short: string; mono: string }[]> = {
  railway: [
    { name: 'Tradição Esporte Clube', short: 'Tradição', mono: 'TEC' },
    { name: 'Ferroviário Atlético Clube', short: 'Ferroviário', mono: 'FAC' },
    { name: 'Central de Minas Foot-Ball Club', short: 'Central', mono: 'CMFC' },
    { name: 'Locomotiva Futebol Clube', short: 'Locomotiva', mono: 'LFC' },
    { name: 'Leopoldina Athletic Club', short: 'Leopoldina', mono: 'LAC' },
    { name: 'Oficinas Atlético Clube', short: 'Oficinas', mono: 'OAC' },
  ],
  students: [
    { name: 'Acadêmico Foot-Ball Club', short: 'Acadêmico', mono: 'AFC' },
    { name: 'Estudantes Futebol Clube', short: 'Estudantes', mono: 'EFC' },
    { name: 'Gymnasial Atlético Clube', short: 'Gymnasial', mono: 'GAC' },
    { name: 'Universitário Sport Club', short: 'Universitário', mono: 'USC' },
    { name: 'Minerva Futebol Clube', short: 'Minerva', mono: 'MFC' },
  ],
  workers: [
    { name: 'Operário Esporte Clube', short: 'Operário', mono: 'OEC' },
    { name: 'União Operária Futebol Clube', short: 'União Operária', mono: 'UOFC' },
    { name: 'Proletário Foot-Ball Club', short: 'Proletário', mono: 'PFC' },
    { name: 'Trabalho e Sport Club', short: 'Trabalho & Sport', mono: 'TSC' },
    { name: 'Força Operária Atlético Clube', short: 'Força Operária', mono: 'FOAC' },
  ],
  merchants: [
    { name: 'Comercial Atlético Clube', short: 'Comercial', mono: 'CAC' },
    { name: 'Associação Mercantil Esporte Clube', short: 'Mercantil', mono: 'AMEC' },
    { name: 'Pauliceia Foot-Ball Club', short: 'Pauliceia', mono: 'PFC' },
    { name: 'União Comercial Futebol Clube', short: 'União Comercial', mono: 'UCFC' },
  ],
  immigrants: [
    { name: 'Palestra Esporte Clube', short: 'Palestra', mono: 'PEC' },
    { name: 'Circolo Esportivo Mineiro', short: 'Circolo', mono: 'CEM' },
    { name: 'Sociedade Ibérica Foot-Ball Club', short: 'Ibérica', mono: 'SIFC' },
    { name: 'Esperança Internacional FC', short: 'Internacional', mono: 'EIFC' },
  ],
  elite: [
    { name: 'Clube Atlético Mineiro de Minas', short: 'Atlético', mono: 'CAMM' },
    { name: 'Grêmio Recreativo da Fidalguia', short: 'Grêmio', mono: 'GRF' },
    { name: 'Aristocrático Foot-Ball Club', short: 'Aristocrático', mono: 'AFBC' },
    { name: 'Sociedade Hípica e Foot-Ball Club', short: 'Hípica', mono: 'SHFC' },
    { name: 'Nobreza Sport Club', short: 'Nobreza', mono: 'NSC' },
  ],
};

const CREST_SHAPES: readonly { id: CrestShape; label: string; icon: string }[] = [
  { id: 'swiss', label: 'Suíço Tradicional', icon: '🛡️' },
  { id: 'circle', label: 'Círculo Clássico', icon: '⚪' },
  { id: 'stripes', label: 'Listras Verticais', icon: '🏁' },
  { id: 'sash', label: 'Faixa Diagonal', icon: '⚡' },
  { id: 'diamond', label: 'Losango Britânico', icon: '🔷' },
];

const ORIGIN_LABELS: Record<FoundingOrigin, { label: string; icon: string; desc: string }> = {
  railway: {
    label: 'Ferroviária',
    icon: '🚂',
    desc: 'Maquinistas, fogueiros e artífices da Estrada de Ferro Central do Brasil. Tradição operária férrea e ligação com as oficinas urbanas.',
  },
  students: {
    label: 'Estudantil',
    icon: '🎓',
    desc: 'Alunos do Ginásio e da Faculdade de Direito. Espírito cavalheiresco, vocabulário empolado e disciplina tática acadêmica.',
  },
  workers: {
    label: 'Operária',
    icon: '🏭',
    desc: 'Trabalhadores das tecelagens, marcenarias e olarias. Vigor físico extremo, raça proletária e apoio massivo dos arrabaldes.',
  },
  merchants: {
    label: 'Comercial',
    icon: '🏛️',
    desc: 'Lojistas, caixeiros-viajantes e donos de armazéns centrais. Finanças sólidas, visão de negócios e captação de sócios.',
  },
  immigrants: {
    label: 'Colônia / Imigrantes',
    icon: '🌐',
    desc: 'Artífices e famílias imigrantes italianas, ibéricas e sírio-libanesas. Técnicas refinadas de confecção de chuteiras e espírito comunitário.',
  },
  elite: {
    label: 'Elite Tradicional',
    icon: '👑',
    desc: 'Bacharéis, fazendeiros de café e famílias abastadas do centro. Recursos vultosos, ternos de linho e rigor estatutário.',
  },
};

export function ClubCreationModal({
  isOpen,
  onClose,
  worldSeed,
  parcels,
  onFoundClub,
  currentClub,
}: ClubCreationModalProps) {
  const [activeTab, setActiveTab] = useState<'identity' | 'crest' | 'founders' | 'story' | 'ground'>('identity');
  const [origin, setOrigin] = useState<FoundingOrigin>(currentClub?.foundingOrigin ?? 'railway');
  const [name, setName] = useState<string>(currentClub?.name ?? 'Tradição Esporte Clube');
  const [shortName, setShortName] = useState<string>(currentClub?.shortName ?? 'Tradição');
  const [monogram, setMonogram] = useState<string>('TEC');
  const [crestShape, setCrestShape] = useState<CrestShape>('swiss');
  const [paletteId, setPaletteId] = useState<string>('classic_bw');
  const [proceduralNonce, setProceduralNonce] = useState<number>(0);
  const [selectedContractIndex, setSelectedContractIndex] = useState<number>(0);
  const [customStory, setCustomStory] = useState<string | null>(null);
  const [nameNonce, setNameNonce] = useState<number>(0);

  // Deterministic procedural generation of founders and ATA based on seed + origin + nonce
  const selectedPalette = useMemo(() => {
    return RETRO_PALETTES.find((p) => p.id === paletteId) ?? RETRO_PALETTES[0];
  }, [paletteId]);

  const clubColors: ClubColors = useMemo(() => {
    return {
      primary: selectedPalette.primary,
      secondary: selectedPalette.secondary,
      accent: selectedPalette.accent,
    };
  }, [selectedPalette]);

  const foundingData = useMemo(() => {
    const seed = `${worldSeed || DEFAULT_WORLD_SEED}-creator-${origin}-${proceduralNonce}`;
    const rng = new CampaignRng(seed);
    const group = generateFoundingGroup(origin, rng, { foundingYear: 1910 });
    return group;
  }, [worldSeed, origin, proceduralNonce]);

  const defaultParcel: CityParcel = useMemo(() => {
    if (parcels && parcels.length > 0) return parcels[0];
    return {
      id: 'parcela-central-ferrovia',
      tiles: [{ x: 8, y: 8 }],
      area: 6,
      terrainDifficulty: 1,
      districtId: 'district-railway-workshops',
      centrality: 80,
      accessibility: 90,
      railAccess: 95,
      roadAccess: 70,
      neighborhoodPopulation: 120,
      landValuePpu: 12.0,
      purchaseHistory: [],
      historicalEvents: [],
    };
  }, [parcels]);

  const availableContracts = useMemo(() => {
    const seed = worldSeed || DEFAULT_WORLD_SEED;
    const clubId = `club-${seed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1910`;
    try {
      const proposals = generateContractProposals({
        parcel: defaultParcel,
        clubId,
        origin,
        date: { year: 1910, month: 1, day: 1 },
        initialCapitalPpu: foundingData.profile?.baseCapitalPPU ?? 15,
      });
      return proposals;
    } catch {
      return [
        {
          id: `contract-${defaultParcel.id}-cessao`,
          parcelId: defaultParcel.id,
          clubId,
          type: 'CESSAO_EMPRESARIAL' as const,
          startDate: { year: 1910, month: 1, day: 1 },
          durationYears: 15,
          upfrontCostPpu: 0,
          monthlyCostPpu: 0.1,
          grantorName: 'Companhia Estrada de Ferro Oeste de Minas',
          terms: ['Cessão para praça de esportes dos operários.', 'Taxa simbólica de 0.1 PPU/mês.'],
        },
      ];
    }
  }, [defaultParcel, origin, worldSeed]);

  const currentContract = availableContracts[selectedContractIndex] ?? availableContracts[0];

  const handleRandomizeName = () => {
    const list = HISTORICAL_NAMES[origin];
    const nextIdx = (nameNonce + 1) % list.length;
    setNameNonce(nextIdx);
    const item = list[nextIdx] ?? list[0];
    setName(item.name);
    setShortName(item.short);
    setMonogram(item.mono);
  };

  const handleRerollFounders = () => {
    setProceduralNonce((prev) => prev + 1);
    setCustomStory(null);
  };

  const handleConfirmFounding = () => {
    const seed = worldSeed || DEFAULT_WORLD_SEED;
    const clubId = `club-${seed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1910`;

    const finalStory = customStory || foundingData.foundingAta;

    const clubToCreate = createClub({
      id: clubId,
      name: name.trim() || 'Tradição Esporte Clube',
      shortName: shortName.trim() || 'Tradição',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: origin,
      foundingStory: finalStory,
      colors: clubColors,
      crestHistory: [
        {
          startYear: 1910,
          designId: `crest-1910-${crestShape}`,
          changeReason: 'Escudo fundacional lavrado em ata inaugural (1910)',
        },
      ],
      founders: foundingData.members.map((m) => m.id),
      parcels: [defaultParcel.id],
      facilities: ['campo-1910'],
      reputation: 35,
      contracts: [currentContract],
    });

    const success = onFoundClub(clubToCreate, defaultParcel.id, currentContract);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Criação de Clube 1910"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Courier New', Courier, Monaco, monospace",
      }}
    >
      {/* ARCADE CABINET CONTAINER */}
      <div
        style={{
          width: 'min(980px, 98vw)',
          maxHeight: '94vh',
          backgroundColor: '#0a0a0a',
          border: '3px solid #ffffff',
          boxShadow: '0 0 0 2px #000000, 6px 6px 0px #ffffff, 0 10px 40px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff',
          overflow: 'hidden',
          borderRadius: '2px',
        }}
      >
        {/* ARCADE HEADER BAR */}
        <header
          style={{
            backgroundColor: '#000000',
            borderBottom: '2px solid #ffffff',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '2px 8px',
                fontWeight: 'bold',
                fontSize: '11px',
                letterSpacing: '1px',
              }}
            >
              1P · INSERT COIN
            </span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              ★ CIDADE DE MINAS · 1910 ★ FUNDAÇÃO DO CLUBE PROTAGONISTA
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#888', letterSpacing: '1px' }}>ERA: AMADORISMO PIONEIRO</span>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #ffffff',
                color: '#ffffff',
                padding: '2px 8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              title="Fechar (ESC)"
            >
              [X]
            </button>
          </div>
        </header>

        {/* ARCADE STEP TABS */}
        <nav
          style={{
            display: 'flex',
            borderBottom: '2px solid #333',
            backgroundColor: '#111',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'identity', label: '1. IDENTIDADE' },
            { id: 'crest', label: '2. ESCUDO' },
            { id: 'founders', label: '3. FUNDADORES' },
            { id: 'story', label: '4. ATA HISTÓRICA' },
            { id: 'ground', label: '5. PRAÇA DE ESPORTES' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: isActive ? '#ffffff' : '#111111',
                  color: isActive ? '#000000' : '#888888',
                  border: 'none',
                  borderRight: '1px solid #333',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 'bold',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.1s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* MODAL MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#0d0d0d' }}>
          {/* TAB 1: IDENTIDADE & ORIGEM SOCIAL */}
          {activeTab === 'identity' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#ffffff', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
                  [ NOME DA AGREMIAÇÃO ]
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Nome Oficial do Clube (1910)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={40}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#000000',
                        border: '2px solid #ffffff',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                      placeholder="Ex: Tradição Esporte Clube"
                    />
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#222',
                        border: '2px solid #ffffff',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🎲 RANDOM
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Nome Curto / Alcunha
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      maxLength={20}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#000000',
                        border: '1px solid #888',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                      placeholder="Ex: Tradição"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Sigla / Monograma (2 a 4 letras)
                    </label>
                    <input
                      type="text"
                      value={monogram}
                      onChange={(e) => setMonogram(e.target.value.toUpperCase().slice(0, 4))}
                      maxLength={4}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#000000',
                        border: '1px solid #888',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                      }}
                      placeholder="TEC"
                    />
                  </div>
                </div>

                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffffff', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
                  [ ORIGEM SOCIAL & RAÍZES HISTÓRICAS ]
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {(['railway', 'students', 'workers', 'merchants', 'immigrants'] as FoundingOrigin[]).map((org) => {
                    const info = ORIGIN_LABELS[org];
                    const isSelected = origin === org;
                    return (
                      <div
                        key={org}
                        onClick={() => {
                          setOrigin(org);
                          const list = HISTORICAL_NAMES[org];
                          if (list && list[0]) {
                            setName(list[0].name);
                            setShortName(list[0].short);
                            setMonogram(list[0].mono);
                          }
                          setProceduralNonce((prev) => prev + 1);
                        }}
                        style={{
                          padding: '10px 14px',
                          border: isSelected ? '2px solid #ffffff' : '1px solid #444',
                          backgroundColor: isSelected ? '#1c1c1c' : '#050505',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{info.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px', color: isSelected ? '#ffffff' : '#ccc' }}>
                              {info.label.toUpperCase()}
                            </strong>
                            {isSelected && (
                              <span style={{ fontSize: '10px', backgroundColor: '#fff', color: '#000', padding: '1px 6px', fontWeight: 'bold' }}>
                                SELECIONADO
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#888', lineHeight: '1.3' }}>
                            {info.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CARD DE VISUALIZAÇÃO RETRO */}
              <div
                style={{
                  backgroundColor: '#000000',
                  border: '2px solid #444',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', marginBottom: '14px', textTransform: 'uppercase' }}>
                  PRÉ-VISUALIZAÇÃO DO ESCUDO
                </div>
                <div style={{ padding: '16px', border: '1px dashed #555', backgroundColor: '#090909', marginBottom: '16px' }}>
                  <CrestBadge
                    shape={crestShape}
                    primaryColor={clubColors.primary}
                    secondaryColor={clubColors.secondary}
                    accentColor={clubColors.accent}
                    monogram={monogram || 'TEC'}
                    size={96}
                  />
                </div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff', letterSpacing: '1px' }}>
                  {name || 'TRADIÇÃO ESPORTE CLUBE'}
                </h2>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
                  {shortName} · Fundado em 01/01/1910
                </div>
                <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #222', paddingTop: '10px', width: '100%' }}>
                  Origem: <strong>{ORIGIN_LABELS[origin].label}</strong> · {foundingData.members.length} Fundadores Notáveis
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESCUDO HISTÓRICO & PALETAS */}
          {activeTab === 'crest' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#ffffff', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
                  [ FORMATO GEOMÉTRICO DO BRASÃO ]
                </h3>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '22px' }}>
                  {CREST_SHAPES.map((shape) => {
                    const isSelected = crestShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setCrestShape(shape.id)}
                        style={{
                          padding: '10px 14px',
                          border: isSelected ? '2px solid #ffffff' : '1px solid #333',
                          backgroundColor: isSelected ? '#ffffff' : '#000000',
                          color: isSelected ? '#000000' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 'bold',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{shape.icon}</span>
                        <span style={{ fontSize: '13px' }}>{shape.label.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>

                <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#ffffff', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
                  [ PALETAS RETRO PRETO & BRANCO ]
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {RETRO_PALETTES.map((pal) => {
                    const isSelected = paletteId === pal.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setPaletteId(pal.id)}
                        style={{
                          padding: '8px 12px',
                          border: isSelected ? '2px solid #ffffff' : '1px solid #444',
                          backgroundColor: isSelected ? '#222' : '#050505',
                          color: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontFamily: "'Courier New', monospace",
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: isSelected ? 'bold' : 'normal' }}>
                          {pal.name.toUpperCase()}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: pal.primary, border: '1px solid #888' }} />
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: pal.secondary, border: '1px solid #888' }} />
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: pal.accent, border: '1px solid #888' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE CREST DISPLAY */}
              <div
                style={{
                  backgroundColor: '#000000',
                  border: '2px solid #ffffff',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1.5px', marginBottom: '20px', textTransform: 'uppercase' }}>
                  ESCUDO OFICIAL DE 1910
                </div>
                <div style={{ padding: '24px', border: '2px dashed #444', backgroundColor: '#080808', marginBottom: '20px' }}>
                  <CrestBadge
                    shape={crestShape}
                    primaryColor={clubColors.primary}
                    secondaryColor={clubColors.secondary}
                    accentColor={clubColors.accent}
                    monogram={monogram || 'TEC'}
                    size={128}
                  />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px' }}>
                  {name}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                  Monograma: <strong>{monogram}</strong> · Formato: <strong>{crestShape.toUpperCase()}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUNDADORES PROCEDURAIS */}
          {activeTab === 'founders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #444', paddingBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', letterSpacing: '1px' }}>
                    [ DIRETORIA & FUNDADORES PIONEIROS (1910) ]
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                    Gerados deterministicamente para a origem <strong>{ORIGIN_LABELS[origin].label}</strong>. Cidadãos históricos de Cidade de Minas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRerollFounders}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#111',
                    border: '2px solid #ffffff',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  🎲 RERROLAR FUNDADORES
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {foundingData.members.map((member) => {
                  const isLeader = member.id === foundingData.leader.id;
                  return (
                    <div
                      key={member.id}
                      style={{
                        padding: '12px',
                        border: isLeader ? '2px solid #ffffff' : '1px solid #444',
                        backgroundColor: isLeader ? '#181818' : '#050505',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            backgroundColor: isLeader ? '#ffffff' : '#333',
                            color: isLeader ? '#000000' : '#fff',
                            padding: '1px 6px',
                            fontWeight: 'bold',
                          }}
                        >
                          {member.roleLabel.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>
                          Cota: <strong>{member.capitalContributionPPU} PPU</strong>
                        </span>
                      </div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#ffffff', marginBottom: '2px' }}>
                        {member.name}
                      </strong>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px' }}>
                        Profissão: <em>{member.occupation}</em>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                        {member.biography}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ATA HISTÓRICA DE FUNDAÇÃO */}
          {activeTab === 'story' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #444', paddingBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', letterSpacing: '1px' }}>
                    [ ATA DE FUNDAÇÃO HISTÓRICA · 01 DE JANEIRO DE 1910 ]
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                    Documento histórico lavrado e registrado no livro oficial da agremiação.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRerollFounders}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#111',
                    border: '2px solid #ffffff',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  🎲 REGERAR ATA PROCEDURAL
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#000000',
                  border: '2px solid #555',
                  padding: '20px',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#e0e0e0',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #666', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#ffffff', letterSpacing: '1.5px' }}>
                    {name.toUpperCase()}
                  </h2>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    CIDADE DE MINAS · ESTADO DE MINAS GERAIS · REPÚBLICA DOS ESTADOS UNIDOS DO BRASIL
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    TERMO DE POSSE & LAVRATURA DA PRIMEIRA DIRECTORIA
                  </div>
                </div>

                <p style={{ margin: '0 0 14px 0', textAlign: 'justify', textIndent: '24px' }}>
                  {customStory || foundingData.foundingAta}
                </p>

                <div style={{ marginTop: '24px', borderTop: '1px dashed #666', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                  <div>
                    <div style={{ borderBottom: '1px solid #444', width: '80%', margin: '0 auto 6px auto' }} />
                    <strong style={{ fontSize: '11px', display: 'block', color: '#fff' }}>{foundingData.leader.name}</strong>
                    <span style={{ fontSize: '10px', color: '#777' }}>Presidente Eleito</span>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid #444', width: '80%', margin: '0 auto 6px auto' }} />
                    <strong style={{ fontSize: '11px', display: 'block', color: '#fff' }}>
                      {foundingData.members.find((m) => m.role === 'secretary')?.name ?? 'Secretário'}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#777' }}>1º Secretário Geral</span>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid #444', width: '80%', margin: '0 auto 6px auto' }} />
                    <strong style={{ fontSize: '11px', display: 'block', color: '#fff' }}>
                      {foundingData.members.find((m) => m.role === 'captain')?.name ?? 'Capitão'}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#777' }}>Capitão do Quadro</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRAÇA DE ESPORTES INAUGURAL */}
          {activeTab === 'ground' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#ffffff', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
                  [ PARCELA & TERRENO DA FUNDAÇÃO ]
                </h3>
                <div style={{ padding: '14px', border: '1px solid #444', backgroundColor: '#000000', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>ID DA PARCELA:</span>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>{defaultParcel.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>ÁREA DE OCUPAÇÃO:</span>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>{defaultParcel.area} células (Campo Oficial)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>ACESSIBILIDADE:</span>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>Ferrovia & Ruas Centrais</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>VALOR VENAL:</span>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>{defaultParcel.landValuePpu ?? 10} PPU/célula</strong>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#ffffff', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
                  [ CONTRATO DE OCUPAÇÃO (1910) ]
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {availableContracts.map((contract, idx) => {
                    const isSelected = selectedContractIndex === idx;
                    return (
                      <div
                        key={contract.id}
                        onClick={() => setSelectedContractIndex(idx)}
                        style={{
                          padding: '12px',
                          border: isSelected ? '2px solid #ffffff' : '1px solid #333',
                          backgroundColor: isSelected ? '#1c1c1c' : '#050505',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: isSelected ? '#ffffff' : '#ccc' }}>
                            {contract.type.replace(/_/g, ' ')}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#fff', backgroundColor: '#333', padding: '1px 6px' }}>
                            {contract.monthlyCostPpu} PPU/mês
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                          Cedente: <strong>{contract.grantorName}</strong>
                        </div>
                        <div style={{ fontSize: '10px', color: '#777' }}>
                          {contract.terms.join(' · ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RESUMO GERAL ANTES DE FUNDAR */}
              <div
                style={{
                  backgroundColor: '#000000',
                  border: '2px solid #ffffff',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1.5px', marginBottom: '14px', textTransform: 'uppercase' }}>
                    RESUMO DA FUNDAÇÃO
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', borderBottom: '1px solid #333', paddingBottom: '14px' }}>
                    <CrestBadge
                      shape={crestShape}
                      primaryColor={clubColors.primary}
                      secondaryColor={clubColors.secondary}
                      accentColor={clubColors.accent}
                      monogram={monogram}
                      size={64}
                    />
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', color: '#fff' }}>{name}</h3>
                      <div style={{ fontSize: '12px', color: '#aaa' }}>{shortName} ({monogram})</div>
                      <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                        Origem: {ORIGIN_LABELS[origin].label}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#ccc', marginBottom: '16px' }}>
                    <div>• <strong>Presidente:</strong> {foundingData.leader.name} ({foundingData.leader.occupation})</div>
                    <div>• <strong>Quadro de Sócios:</strong> {foundingData.members.length} fundadores pioneiros</div>
                    <div>• <strong>Praça de Esportes:</strong> {defaultParcel.id}</div>
                    <div>• <strong>Regime Contratual:</strong> {currentContract.type} ({currentContract.monthlyCostPpu} PPU/mês)</div>
                    <div>• <strong>Esquadrão Inaugural:</strong> Pirâmide 2-3-5 de terra batida (11 titulares)</div>
                  </div>
                </div>

                <div style={{ borderTop: '2px solid #333', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleConfirmFounding}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      border: '2px solid #ffffff',
                      fontFamily: "'Courier New', Courier, Monaco, monospace",
                      fontWeight: 'bold',
                      fontSize: '14px',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      boxShadow: '4px 4px 0px #000000, 0 0 15px rgba(255,255,255,0.4)',
                    }}
                  >
                    ⚔️ PRESS START · LAVRAR ATA & INICIAR CAMPANHA (1910) ⚔️
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ARCADE FOOTER CONTROLS */}
        <footer
          style={{
            backgroundColor: '#000000',
            borderTop: '2px solid #ffffff',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'identity' && (
              <button
                type="button"
                onClick={() => {
                  const steps: ('identity' | 'crest' | 'founders' | 'story' | 'ground')[] = ['identity', 'crest', 'founders', 'story', 'ground'];
                  const idx = steps.indexOf(activeTab);
                  if (idx > 0) setActiveTab(steps[idx - 1]);
                }}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#111',
                  border: '1px solid #ffffff',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ◀ VOLTAR
              </button>
            )}
            {activeTab !== 'ground' && (
              <button
                type="button"
                onClick={() => {
                  const steps: ('identity' | 'crest' | 'founders' | 'story' | 'ground')[] = ['identity', 'crest', 'founders', 'story', 'ground'];
                  const idx = steps.indexOf(activeTab);
                  if (idx < steps.length - 1) setActiveTab(steps[idx + 1]);
                }}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#222',
                  border: '1px solid #ffffff',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                AVANÇAR ▶
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleConfirmFounding}
              style={{
                padding: '8px 20px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2px solid #ffffff',
                fontFamily: "'Courier New', Courier, Monaco, monospace",
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
            >
              ★ FUNDAR {name.toUpperCase()} AGORA (1910) ★
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
