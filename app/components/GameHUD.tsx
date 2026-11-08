'use client';

/**
 * Game HUD overlay for Cidade de Minas
 * Displays: Top campaign bar, club management panels (14 tabs), city demographics, and dev diagnostics.
 */

import React, { useState } from 'react';
import type { TileCoord } from '@/game/types/coordinates';
import type { WorldDate } from '@/game/core/World';
import type { DemandVector } from '@/game/core/Demand';
import { Tool } from '@/game/tools';
import type { DataView } from '@/game/render/dataView';
import type { StatsSample } from '@/app/hooks/sampleStats';
import type { LaborStatus } from '@/app/hooks/laborStatus';
import { StatsPanel } from './StatsPanel';
import { DataViewPanel } from './DataViewPanel';
import { CrestBadge } from './CrestBadge';
import { HISTORICAL_1910_RIVALS } from '@/game/core/football/MatchEngine';
import type { ClubState } from '@/game/core/club/Club';
import type { FacilityType } from '@/game/core/club/ClubFacilities';
import type { MemberCategory } from '@/game/core/club/ClubMembers';
import type { TrainingRegime, HistoricalPosition, SquadRole } from '@/game/core/football/Footballer';
import type { ClubPolicyTier } from '@/game/core/football/FootballMarket';
import type { HonorType } from '@/game/core/club/InstitutionalHonors';
import type { ClubTraditionProfile } from '@/game/core/club/TraditionSystem';
import type { HistoricalLedgerState, HistoricalEvent } from '@/game/core/club/HistoricalLedger';
import type { ClubArchiveData } from '@/game/core/club/ClubArchive';
import type { FiftyYearsReportData } from '@/game/core/club/FiftyYearsReport';
import type { CrestShape } from '@/game/core/club/ClubIdentity';
import { getEraVisualTheme } from '@/game/render/EraVisualTheme';
import { retroAudio } from '../audio/RetroAudio';

export interface GameHUDProps {
  worldSeed: string;
  club: ClubState | null;
  citySummary: { districts: number; parcels: number; institutions: number } | null;
  onOpenClubCreation?: () => void;
  onOpenTitleScreen?: () => void;
  requestedClubTab?: { tab: ClubTab; nonce: number } | null;
  onOpenBenchmark?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenDevInspector?: () => void;
  onEnsureFoundingClub?: () => ClubState | null;
  onNewCity: () => void;
  onMenuOpen: () => void;
  onFocusLatestGrowth: () => void;
  onFocusLatestTransformation: () => void;
  onFocusClubGround?: () => void;
  onBuildFacility: (type: FacilityType, customName?: string) => boolean;
  onRepairFacility: (facilityId: string) => boolean;
  onAdmitMember: (name: string, category: MemberCategory, socialClass: 'working_class' | 'middle_class' | 'upper_class' | 'elite', occupation: string) => boolean;
  onGetPerson: (id: string) => any;
  onGetFamilyTree: (id: string) => any;
  onGetUrbanDemographics: () => any;
  onGetElectionCandidates: () => readonly any[];
  onHoldClubElection: (playerVotedCandidateId?: string) => any;
  onGetFootballSquad: () => any;
  onSetSquadTrainingRegime: (regime: TrainingRegime) => boolean;
  onGetClubAthleticsPolicy: () => any;
  onSetClubAthleticsPolicy: (tier: ClubPolicyTier) => boolean;
  onGetAvailableLocalProspects: () => readonly any[];
  onInviteProspectToClub: (personId: string, position: HistoricalPosition, role: SquadRole) => { success: boolean; message: string };
  onReleaseFootballerFromSquad: (footballerId: string) => boolean;
  onPromoteOrDemoteFootballerRole: (footballerId: string, role: SquadRole) => boolean;
  onGetLatestRivalInquiries: () => readonly any[];
  onGetAvailableHistoricalRivals: () => readonly any[];
  onGetLocalClubs: () => readonly any[];
  onGetRegionalClubs: () => readonly any[];
  onGetFederation: () => any;
  onGetClubMatchHistory: () => readonly any[];
  onGetLatestClubMatch: () => any;
  onPlayFriendlyMatch: (rivalName: string, competitionType?: 'friendly' | 'festival_taça') => any;
  onGetCompetitions: () => readonly any[];
  onPlayCompetitionMatch: (competitionId: string, fixtureId: string) => any;
  onGetRivalries: () => readonly any[];
  onGetRivalryForClubs: (clubAId: string, clubBId: string) => any;
  onGetSupporterTerritories: () => readonly any[];
  onGetPressArchive: () => readonly any[];
  onGetAvailableMediaOutlets: () => readonly any[];
  onGetClubLegends: () => readonly any[];
  onGetInstitutionalHonors: () => readonly any[];
  onProposeInstitutionalHonor: (legendId: string, honorType: HonorType) => { success: boolean; proposal?: any; message: string };
  onVoteInstitutionalHonor: (proposalId: string) => { success: boolean; approved: boolean; outcome: string };
  onGetClubTraditionProfile?: () => ClubTraditionProfile | null;
  onGetHistoricalLedger?: () => HistoricalLedgerState;
  onGetCausalChainForEvent?: (eventId: string) => { rootCauses: readonly HistoricalEvent[]; downstreamConsequences: readonly HistoricalEvent[] };
  onGetClubArchive?: () => ClubArchiveData | null;
  onGetTacaBrasil1959?: () => any;
  onGenerateTacaBrasil1959?: () => any;
  onAdvanceTacaBrasil?: () => any;
  onSimulateEntireTacaBrasil?: () => any;
  onGetFiftyYearsReport?: () => FiftyYearsReportData | null;
  selectedTile: TileCoord | null;
  fps: number;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
  tick: number;
  dirt: number;
  population: number;
  money: number;
  date: WorldDate;
  demand: DemandVector;
  happiness: number;
  currentTool?: Tool;
  speedMultiplier: 1 | 2 | 4 | 8;
  paused: boolean;
  statsSamples: StatsSample[];
  labor: LaborStatus;
  cityGrowth: any;
  cityTransformation: any;
  dataView: DataView;
  onDataViewChange: (v: DataView) => void;
}

function formatDate(d: WorldDate): string {
  return `${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}`;
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

const HISTORICAL_REGIMES: { id: string; label: string; regime: TrainingRegime }[] = [
  { id: 'recreational', label: 'Pelada aos Sábados', regime: { type: 'recreational', intensity: 'light', weeklySessions: 1, focus: 'balanced' } },
  { id: 'tactical_pyramid', label: 'Ensaio da Pirâmide 2-3-5', regime: { type: 'tactical_pyramid', intensity: 'moderate', weeklySessions: 2, focus: 'tactical' } },
  { id: 'physical_calisthenics', label: 'Calistenia Rústica', regime: { type: 'physical_calisthenics', intensity: 'moderate', weeklySessions: 2, focus: 'physical' } },
];

type DialogType = 'none' | 'stages' | 'club' | 'demographics' | 'layers' | 'legacy';
export type ClubTab =
  | 'overview'
  | 'facilities'
  | 'finances'
  | 'members'
  | 'football'
  | 'matches'
  | 'competitions'
  | 'board'
  | 'social'
  | 'politics'
  | 'ecosystem'
  | 'press'
  | 'legends'
  | 'archive';

export function GameHUD({
  worldSeed,
  club,
  citySummary,
  onOpenClubCreation,
  onOpenTitleScreen,
  requestedClubTab,
  onOpenBenchmark,
  onOpenHowToPlay,
  onOpenDevInspector,
  onEnsureFoundingClub,
  onNewCity,
  onMenuOpen,
  onFocusLatestGrowth,
  onFocusLatestTransformation,
  onFocusClubGround,
  onBuildFacility,
  onRepairFacility,
  onAdmitMember,
  onGetPerson,
  onGetFamilyTree,
  onGetUrbanDemographics,
  onGetElectionCandidates,
  onHoldClubElection,
  onGetFootballSquad,
  onSetSquadTrainingRegime,
  onGetClubAthleticsPolicy,
  onSetClubAthleticsPolicy,
  onGetAvailableLocalProspects,
  onInviteProspectToClub,
  onReleaseFootballerFromSquad,
  onPromoteOrDemoteFootballerRole,
  onGetLatestRivalInquiries,
  onGetAvailableHistoricalRivals,
  onGetLocalClubs,
  onGetRegionalClubs,
  onGetFederation,
  onGetClubMatchHistory,
  onGetLatestClubMatch,
  onPlayFriendlyMatch,
  onGetCompetitions,
  onPlayCompetitionMatch,
  onGetRivalries,
  onGetRivalryForClubs,
  onGetSupporterTerritories,
  onGetPressArchive,
  onGetAvailableMediaOutlets,
  onGetClubLegends,
  onGetInstitutionalHonors,
  onProposeInstitutionalHonor,
  onVoteInstitutionalHonor,
  onGetClubTraditionProfile,
  onGetHistoricalLedger,
  onGetCausalChainForEvent,
  onGetClubArchive,
  onGetTacaBrasil1959,
  onGenerateTacaBrasil1959,
  onAdvanceTacaBrasil,
  onSimulateEntireTacaBrasil,
  onGetFiftyYearsReport,
  selectedTile,
  fps,
  cameraX,
  cameraY,
  cameraZoom,
  tick,
  dirt,
  population,
  money,
  date,
  demand,
  happiness,
  currentTool,
  speedMultiplier,
  paused,
  statsSamples,
  labor,
  cityGrowth,
  cityTransformation,
  dataView,
  onDataViewChange,
}: GameHUDProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>('none');
  const [activeClubTab, setActiveClubTab] = useState<ClubTab>('overview');
  const [soundMuted, setSoundMuted] = useState(() => retroAudio.isMuted());

  React.useEffect(() => {
    if (requestedClubTab) {
      setActiveClubTab(requestedClubTab.tab);
      onMenuOpen();
      setActiveDialog('club');
    }
  }, [requestedClubTab, onMenuOpen]);

  // Archive sub-states
  const [archiveSubTab, setArchiveSubTab] = useState<'timeline' | 'traditions' | 'decades'>('timeline');
  const [selectedHistoricalEventId, setSelectedHistoricalEventId] = useState<string | null>(null);
  const [selectedDecadeYear, setSelectedDecadeYear] = useState<number>(1910);

  // 50-Year Jubilee Report state (Alpha H: H4 & H5)
  const [showJubileeModal, setShowJubileeModal] = useState(false);
  const [jubileeTab, setJubileeTab] = useState<'geral' | 'cidade' | 'patrimonio' | 'futebol' | 'figuras' | 'cronica'>('geral');

  // Match / friendly state
  const [selectedRivalName, setSelectedRivalName] = useState<string>(HISTORICAL_1910_RIVALS[0]?.name ?? 'América Foot-Ball Club');
  const [friendlyCompetitionType, setFriendlyCompetitionType] = useState<'friendly' | 'festival_taça'>('friendly');
  const [lastMatchResult, setLastMatchResult] = useState<any>(null);

  // Member admission state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCategory, setNewMemberCategory] = useState<MemberCategory>('contribuinte');
  const [newMemberClass, setNewMemberClass] = useState<'working_class' | 'middle_class' | 'upper_class' | 'elite'>('middle_class');
  const [newMemberOccupation, setNewMemberOccupation] = useState('Comerciário');

  // Facilities build state
  const [newFacilityType, setNewFacilityType] = useState<FacilityType>('dirt_pitch');

  // Football recruit state
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [prospectPosition, setProspectPosition] = useState<HistoricalPosition>('CF');
  const [prospectRole, setProspectRole] = useState<SquadRole>('starter');

  // Board election state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Legends state
  const [selectedLegendId, setSelectedLegendId] = useState<string | null>(null);
  const [selectedHonorType, setSelectedHonorType] = useState<HonorType>('busto');

  // Ecosystem sub-tab
  const [ecosystemSubTab, setEcosystemSubTab] = useState<'local' | 'regional' | 'federation'>('local');

  const toggleDialog = (d: DialogType) => {
    if (activeDialog !== d) {
      onMenuOpen();
    }
    setActiveDialog(activeDialog === d ? 'none' : d);
  };

  const openClubTab = (tab: ClubTab) => {
    setActiveClubTab(tab);
    if (activeDialog !== 'club') {
      onMenuOpen();
      setActiveDialog('club');
    }
  };

  const handleDisputeFriendly = () => {
    const res = onPlayFriendlyMatch(selectedRivalName, friendlyCompetitionType);
    setLastMatchResult(res);
  };

  const handleDisputeCompetitionMatch = (compId: string, fixtureId: string) => {
    const res = onPlayCompetitionMatch(compId, fixtureId);
    setLastMatchResult(res);
  };

  const handleAdmit = () => {
    if (!newMemberName.trim()) return;
    const ok = onAdmitMember(newMemberName.trim(), newMemberCategory, newMemberClass, newMemberOccupation);
    if (ok) setNewMemberName('');
  };

  const handleProposeHonor = (legendId: string) => {
    const res = onProposeInstitutionalHonor(legendId, selectedHonorType);
    if (res.success && res.proposal) {
      onVoteInstitutionalHonor(res.proposal.id);
    }
  };

  const squad = onGetFootballSquad?.();
  const athleticsPolicy = onGetClubAthleticsPolicy?.();
  const candidates = onGetElectionCandidates?.() ?? [];
  const prospects = onGetAvailableLocalProspects?.() ?? [];
  const localClubs = onGetLocalClubs?.() ?? [];
  const regionalClubs = onGetRegionalClubs?.() ?? [];
  const federation = onGetFederation?.();
  const matchHistory = onGetClubMatchHistory?.() ?? [];
  const competitions = onGetCompetitions?.() ?? [];
  const pressArticles = onGetPressArchive?.() ?? [];
  const legends = onGetClubLegends?.() ?? [];
  const honors = onGetInstitutionalHonors?.() ?? [];
  const demographics = onGetUrbanDemographics?.();

  // Archive data
  const ledgerState = onGetHistoricalLedger?.() ?? club?.historicalLedger ?? { events: [] };
  const allHistoricalEvents = ledgerState.events ?? [];
  const traditionProfile = onGetClubTraditionProfile?.() ?? null;
  const archiveData = onGetClubArchive?.() ?? null;
  const tacaBrasil = onGetTacaBrasil1959?.() ?? null;
  const jubileeReport = onGetFiftyYearsReport?.() ?? null;
  const causalChain = selectedHistoricalEventId ? onGetCausalChainForEvent?.(selectedHistoricalEventId) : null;
  const selectedEvent = selectedHistoricalEventId ? allHistoricalEvents.find(e => e.id === selectedHistoricalEventId) : null;
  const activeDecadeInfo = archiveData?.comparativeMaps?.find(m => m.year === selectedDecadeYear) ?? null;
  const eraTheme = getEraVisualTheme(date.year);

  return (
    <>
      {/* BARRA SUPERIOR DE RESUMO DA CAMPANHA */}
      <section className="campaign-summary" aria-label="Campanha atual">
        <div className="campaign-eyebrow">Alpha 0.1 · Cidade de Minas</div>
        <h1>Tradição Esporte Clube</h1>
        <div className="campaign-date">{formatDate(date)}</div>
        <div className="campaign-seed" title={worldSeed || 'Carregando campanha'}>
          Seed: {worldSeed || 'carregando...'}
        </div>

        {/* BANNER DINÂMICO DE ÉPOCA (EVOLUÇÃO HISTÓRICA 1910s a 1950s) */}
        <div
          style={{
            margin: '8px 0',
            padding: '6px 8px',
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            border: `1px solid ${eraTheme.accentColor}`,
            boxShadow: `2px 2px 0px ${eraTheme.accentColor}`,
          }}
        >
          <div style={{ color: eraTheme.accentColor, fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {eraTheme.headerBadge} · {eraTheme.currencyBadge}
          </div>
          <div style={{ color: '#fff5d8', fontSize: '9.5px', fontStyle: 'italic', marginTop: '2px', lineHeight: 1.3 }}>
            {eraTheme.quoteText}
          </div>
        </div>

        {club && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
              padding: '6px 8px',
              backgroundColor: 'rgba(24, 32, 28, 0.75)',
              borderRadius: '6px',
              border: '1px solid #738548',
            }}
          >
            <CrestBadge
              shape={getCrestShape(club)}
              primaryColor={club.colors.primary}
              secondaryColor={club.colors.secondary}
              accentColor={club.colors.accent}
              monogram={club.shortName}
              size={32}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong
                style={{
                  color: '#fff5d8',
                  fontSize: '12px',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {club.name}
              </strong>
              <div style={{ fontSize: '10px', color: '#c9d7cb', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>{club.parcels.length > 0 ? `Sede: ${club.parcels[0]}` : 'Sem sede'}</span>
                <span>·</span>
                <span style={{ color: '#f2d994' }}>Caixa: {club.finances ? `${club.finances.balancePPU.toFixed(1)} PPU` : '0 PPU'}</span>
                <span>·</span>
                <span>{club.facilityDetails ? `${club.facilityDetails.length} inst.` : '0 inst.'}</span>
              </div>
            </div>
          </div>
        )}

        {club && (
          <>
            <button
              type="button"
              onClick={() => {
                retroAudio.playClick();
                onFocusClubGround?.();
              }}
              style={{
                marginTop: '6px',
                padding: '7px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: '1px solid #eab308',
                backgroundColor: 'rgba(161, 98, 7, 0.4)',
                color: '#fef08a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                boxShadow: '0 2px 8px rgba(234, 179, 8, 0.25)',
              }}
            >
              📍 LOCALIZAR NOSSO CAMPO NO MAPA
            </button>
            <button
              type="button"
              onClick={() => openClubTab('overview')}
              style={{
                marginTop: '6px',
                padding: '7px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: '1px solid #738548',
                backgroundColor: 'rgba(90, 101, 69, 0.9)',
                color: '#fff5d8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              🏛️ Abrir Gestão do Clube (14 Abas)
            </button>
            <button
              type="button"
              onClick={() => setShowJubileeModal(true)}
              style={{
                marginTop: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: '1px solid #f2d994',
                backgroundColor: date.year === 1959 ? 'rgba(218, 165, 32, 0.4)' : 'rgba(30, 40, 35, 0.85)',
                color: '#f2d994',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                boxShadow: date.year === 1959 ? '0 0 10px rgba(242, 217, 148, 0.3)' : 'none',
              }}
            >
              <span>📜</span> Relatório dos 50 Anos (1910–1959)
              {date.year === 1959 && (
                <span style={{ fontSize: '9px', backgroundColor: '#f2d994', color: '#161c18', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                  JUBILEU DE OURO
                </span>
              )}
            </button>
          </>
        )}

        {citySummary && (
          <>
            <div className="campaign-divider" />
            <div className="campaign-metric">
              <strong>{citySummary.districts}</strong> distritos <span>·</span> <strong>{citySummary.parcels}</strong> parcelas
            </div>
            <div className="campaign-metric">
              <strong>{citySummary.institutions}</strong> instituições de 1910 <span>·</span> centro e ferrovia no mapa
            </div>
          </>
        )}
      </section>

      {/* MENU SUPERIOR DE NAVEGAÇÃO PROEMINENTE (RETRO ARCADE) */}
      <nav className="campaign-menu" aria-label="Menu da campanha">
        {onOpenTitleScreen && (
          <button
            type="button"
            onClick={onOpenTitleScreen}
            title="Tela Inicial / Menu Principal"
            style={{
              backgroundColor: '#000000',
              color: '#e0aa38',
              border: '2px solid #e0aa38',
              fontWeight: 700,
              boxShadow: '3px 3px 0px #e0aa38',
              letterSpacing: '0.05em',
            }}
          >
            🏠 MENU INICIAL
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const isMuted = retroAudio.toggleMute();
            setSoundMuted(isMuted);
          }}
          title="Alternar Efeitos Sonoros Arcade"
          style={{
            backgroundColor: '#000000',
            color: soundMuted ? '#888888' : '#a0d468',
            border: soundMuted ? '1px solid #555555' : '2px solid #a0d468',
            fontWeight: 700,
            boxShadow: soundMuted ? 'none' : '2px 2px 0px #a0d468',
            letterSpacing: '0.05em',
          }}
        >
          {soundMuted ? '🔇 MUDO' : '🔊 SOM ON'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (onOpenClubCreation) onOpenClubCreation();
          }}
          title="Criar / Customizar Clube (Fundação 1910)"
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            fontWeight: 700,
            boxShadow: '3px 3px 0px #ffffff',
            letterSpacing: '0.05em',
          }}
        >
          🎮 {club ? 'CUSTOMIZAR CLUBE' : 'CRIAR MEU CLUBE (1910)'}
        </button>

        <button
          type="button"
          aria-expanded={activeDialog === 'club'}
          onClick={() => {
            if (!club && onOpenClubCreation) {
              onOpenClubCreation();
            } else {
              toggleDialog('club');
            }
          }}
          style={{
            backgroundColor: activeDialog === 'club' ? '#ffffff' : '#000000',
            color: activeDialog === 'club' ? '#000000' : '#ffffff',
            border: '2px solid #ffffff',
            fontWeight: 700,
            boxShadow: '2px 2px 0px #ffffff',
          }}
        >
          🏛️ {club ? (club.shortName || 'Tradição E.C.') : 'Fundar Clube (1910)'}
        </button>

        {club && (
          <>
            <button
              type="button"
              onClick={() => openClubTab('football')}
              title="Escalação e pirâmide tática 2-3-5"
              style={{
                border: activeDialog === 'club' && activeClubTab === 'football' ? '1px solid #f2d994' : '1px solid #738548',
                backgroundColor: activeDialog === 'club' && activeClubTab === 'football' ? '#5a6545' : 'rgba(32, 40, 37, 0.94)',
                fontWeight: activeDialog === 'club' && activeClubTab === 'football' ? 'bold' : 'normal',
              }}
            >
              ⚽ Futebol (2-3-5)
            </button>
            <button
              type="button"
              onClick={() => openClubTab('matches')}
              title="Disputar amistosos e festivais de 1910"
              style={{
                border: activeDialog === 'club' && activeClubTab === 'matches' ? '1px solid #f2d994' : '1px solid #738548',
                backgroundColor: activeDialog === 'club' && activeClubTab === 'matches' ? '#5a6545' : 'rgba(32, 40, 37, 0.94)',
                fontWeight: activeDialog === 'club' && activeClubTab === 'matches' ? 'bold' : 'normal',
              }}
            >
              ⚔️ Partidas
            </button>
            <button
              type="button"
              onClick={() => openClubTab('competitions')}
              title="Campeonatos oficiais e Taça Brasil de 1959"
              style={{
                border: activeDialog === 'club' && activeClubTab === 'competitions' ? '1px solid #f2d994' : '1px solid #738548',
                backgroundColor: activeDialog === 'club' && activeClubTab === 'competitions' ? '#5a6545' : 'rgba(32, 40, 37, 0.94)',
                fontWeight: activeDialog === 'club' && activeClubTab === 'competitions' ? 'bold' : 'normal',
              }}
            >
              🏆 Taça Brasil & Ligas
            </button>
            <button
              type="button"
              onClick={() => openClubTab('archive')}
              title="Arquivo dos 50 Anos e Timeline Causal"
              style={{
                border: activeDialog === 'club' && activeClubTab === 'archive' ? '1px solid #f2d994' : '1px solid #738548',
                backgroundColor: activeDialog === 'club' && activeClubTab === 'archive' ? '#5a6545' : 'rgba(32, 40, 37, 0.94)',
                fontWeight: activeDialog === 'club' && activeClubTab === 'archive' ? 'bold' : 'normal',
              }}
            >
              📜 Arquivo 50 Anos
            </button>
            <button
              type="button"
              onClick={() => setShowJubileeModal(true)}
              title="Relatório comemorativo oficial de meio século (1910–1959)"
              style={{
                border: '1px solid #f2d994',
                color: '#f2d994',
                backgroundColor: 'rgba(50, 40, 20, 0.95)',
                fontWeight: 'bold',
              }}
            >
              🏆 Cinquentenário (1910–1959)
            </button>
          </>
        )}

        <button
          type="button"
          aria-expanded={activeDialog === 'demographics'}
          onClick={() => toggleDialog('demographics')}
        >
          🏙️ Demografia (L0–L2)
        </button>
        <button
          type="button"
          onClick={onOpenHowToPlay}
          title="Manual do Jogador e Instruções Rápidas"
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            fontWeight: 700,
            boxShadow: '2px 2px 0px #ffffff',
          }}
        >
          ❓ COMO JOGAR
        </button>
        <button
          type="button"
          onClick={onOpenBenchmark}
          title="Benchmark das 100 Seeds e Telemetria L0/L1/L2"
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            fontWeight: 700,
            boxShadow: '2px 2px 0px #ffffff',
          }}
        >
          📊 100 SEEDS
        </button>
        <button
          type="button"
          onClick={onOpenDevInspector}
          title="Central DEV: Time-Travel, Streams RNG e Calibração Histórica"
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            fontWeight: 700,
            boxShadow: '2px 2px 0px #ffffff',
          }}
        >
          🛠️ MODO DEV
        </button>
        <button
          type="button"
          aria-expanded={activeDialog === 'layers'}
          onClick={() => toggleDialog('layers')}
        >
          Camadas
        </button>
        <button
          type="button"
          aria-expanded={activeDialog === 'legacy'}
          onClick={() => toggleDialog('legacy')}
        >
          Diagnóstico Base
        </button>
      </nav>

      {/* PAINEL PRINCIPAL DO CLUBE */}
      {activeDialog === 'club' && (
        <section
          className="campaign-panel"
          style={{
            position: 'fixed',
            top: '80px',
            left: '16px',
            width: 'min(980px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            backgroundColor: 'rgba(20, 24, 22, 0.96)',
            border: '2px solid #e0aa38',
            borderRadius: '8px',
            padding: '16px',
            color: '#fff',
            zIndex: 1000,
          }}
          aria-label="Gestão do Clube"
        >
          {/* CABEÇALHO DO MODAL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {club && (
                <CrestBadge
                  shape={getCrestShape(club)}
                  primaryColor={club.colors.primary}
                  secondaryColor={club.colors.secondary}
                  accentColor={club.colors.accent}
                  monogram={club.shortName}
                  size={48}
                />
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#f2d994' }}>{club?.name ?? 'Fundação do Clube (1910)'}</h2>
                <span style={{ fontSize: '11px', color: '#aaa' }}>
                  {club ? `Fundado em ${formatDate(club.foundingDate)} · Cidade de Minas` : 'Escolha uma parcela no mapa para fundar o clube.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveDialog('none')}
              style={{ padding: '4px 10px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✕ Fechar
            </button>
          </div>

          {club ? (
            <>
              {/* NAVEGAÇÃO DE ABAS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderBottom: '1px solid #444', paddingBottom: '8px', marginBottom: '14px' }}>
                {[
                  { id: 'overview', label: '🏛️ Geral' },
                  { id: 'facilities', label: '🏟️ Instalações' },
                  { id: 'finances', label: '💰 Finanças' },
                  { id: 'members', label: '👥 Sócios' },
                  { id: 'football', label: '⚽ Futebol' },
                  { id: 'matches', label: '⚔️ Partidas' },
                  { id: 'competitions', label: '🏆 Competições' },
                  { id: 'board', label: '👔 Diretoria' },
                  { id: 'social', label: '🌐 Identidade' },
                  { id: 'politics', label: '⚖️ Política' },
                  { id: 'ecosystem', label: '🏙️ Outros Clubes' },
                  { id: 'press', label: '📰 Imprensa' },
                  { id: 'legends', label: '⭐ Lendas' },
                  { id: 'archive', label: '📜 Arquivo 50 Anos' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveClubTab(tab.id as ClubTab)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: activeClubTab === tab.id ? '1px solid #f2d994' : '1px solid #5a6545',
                      backgroundColor: activeClubTab === tab.id ? '#5a6545' : 'transparent',
                      color: activeClubTab === tab.id ? '#fff5d8' : '#aaa',
                      cursor: 'pointer',
                      fontWeight: activeClubTab === tab.id ? 'bold' : 'normal',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ABA 1: GERAL */}
              {activeClubTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Saldo em Caixa</span>
                      <strong style={{ fontSize: '16px', color: '#f2d994' }}>{club.finances?.balancePPU.toFixed(1)} PPU</strong>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Quadro Social</span>
                      <strong style={{ fontSize: '16px', color: '#fff' }}>{club.membership?.members.length ?? 0} sócios</strong>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Instalações Esportivas</span>
                      <strong style={{ fontSize: '16px', color: '#fff' }}>{club.facilityDetails?.length ?? 0} ativas</strong>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Sala de Conquistas</span>
                      <strong style={{ fontSize: '16px', color: '#ffd700' }}>{club.trophies?.length ?? 0} troféus</strong>
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #444' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '13px' }}>Ata Inaugural & Identidade</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>
                      {club.foundingStory ?? 'Fundação solene realizada no ano de 1910 em assembleia histórica de sócios.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 2: INSTALAÇÕES */}
              {activeClubTab === 'facilities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Praça de Esportes & Patrimônio (Macroetapas 27 e 28)</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={newFacilityType}
                        onChange={e => setNewFacilityType(e.target.value as FacilityType)}
                        style={{ padding: '4px 8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '11px' }}
                      >
                        <option value="dirt_pitch">Campo de Terra Batida</option>
                        <option value="wooden_fence">Tapume de Madeira</option>
                        <option value="locker_room">Vestiário Rudimentar</option>
                        <option value="clubhouse">Sede Social Alugada</option>
                        <option value="wooden_stands">Arquibancada de Madeira</option>
                        <option value="lantern_lighting">Lampiões de Gás</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => onBuildFacility(newFacilityType)}
                        style={{ padding: '4px 10px', background: '#5a6545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        + Erguer Obra
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {(club.facilityDetails ?? []).map(fac => (
                      <div key={fac.id} style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.85)', borderRadius: '6px', border: '1px solid #444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#fff', fontSize: '12px' }}>{fac.name}</strong>
                          <span style={{ fontSize: '11px', color: fac.condition > 60 ? '#98e49b' : '#e07a5f' }}>
                            {Math.round(fac.condition)}% conservação
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#aaa', margin: '4px 0 8px 0' }}>
                          Instalado em {formatDate(fac.builtDate)} · Manutenção: {fac.monthlyMaintenancePPU.toFixed(1)} PPU/mês
                        </div>
                        <button
                          type="button"
                          onClick={() => onRepairFacility(fac.id)}
                          style={{ padding: '3px 8px', background: '#334', border: '1px solid #556', color: '#eee', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                        >
                          🛠️ Fazer Reparos
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 3: FINANÇAS */}
              {activeClubTab === 'finances' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Livro-Caixa & Balanço Geral (Macroetapa 29)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Saldo Disponível</span>
                      <strong style={{ fontSize: '16px', color: '#f2d994' }}>{club.finances?.balancePPU.toFixed(1)} PPU</strong>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Receitas Acumuladas</span>
                      <strong style={{ fontSize: '16px', color: '#98e49b' }}>+{club.finances?.totalIncomePPU.toFixed(1)} PPU</strong>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #444' }}>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Despesas Acumuladas</span>
                      <strong style={{ fontSize: '16px', color: '#e07a5f' }}>-{club.finances?.totalExpensesPPU.toFixed(1)} PPU</strong>
                    </div>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #444', borderRadius: '4px', padding: '8px', backgroundColor: 'rgba(18, 22, 20, 0.85)' }}>
                    <h5 style={{ margin: '0 0 6px 0', color: '#aaa', fontSize: '11px' }}>ÚLTIMOS LANÇAMENTOS DO LIVRO-CAIXA:</h5>
                    {(club.finances?.transactions ?? []).slice(-10).reverse().map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #333', fontSize: '11px' }}>
                        <span>{formatDate(tx.date)} · {tx.description}</span>
                        <strong style={{ color: tx.amountPPU >= 0 ? '#98e49b' : '#e07a5f' }}>
                          {tx.amountPPU >= 0 ? `+${tx.amountPPU.toFixed(1)}` : tx.amountPPU.toFixed(1)} PPU
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 4: SÓCIOS */}
              {activeClubTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Quadro Social & Associados (Macroetapas 11 e 12)</h3>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>Total de Sócios: <strong>{club.membership?.members.length ?? 0}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.85)', borderRadius: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Nome do novo associado..."
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      style={{ flex: 1, padding: '5px 8px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '11px' }}
                    />
                    <select
                      value={newMemberCategory}
                      onChange={e => setNewMemberCategory(e.target.value as MemberCategory)}
                      style={{ padding: '5px 8px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '11px' }}
                    >
                      <option value="contribuinte">Contribuinte</option>
                      <option value="atleta">Atleta</option>
                      <option value="benemerito">Benemérito</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAdmit}
                      style={{ padding: '5px 12px', background: '#5a6545', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Admitir Sócio
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 5: FUTEBOL 2-3-5 */}
              {activeClubTab === 'football' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Futebol & Primeiro Quadro · Tática Pirâmide 2-3-5 (Macroetapa 15)</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {HISTORICAL_REGIMES.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSetSquadTrainingRegime(item.regime)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '10px',
                            backgroundColor: squad?.trainingRegime?.type === item.regime.type ? '#5a6545' : '#222',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {(squad?.footballers ?? []).map((f: any) => (
                      <div key={f.id} style={{ padding: '8px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '4px', border: '1px solid #444', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{f.positions?.[0] ?? 'FW'} · {f.name}</strong>
                          <span style={{ color: '#ffd700' }}>Condição: {f.condition}/100</span>
                        </div>
                        <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>
                          Passe: {f.technical?.passing ?? 50} · Finalização: {f.technical?.shooting ?? 50} · Fôlego: {f.physical?.stamina ?? 50}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 6: PARTIDAS */}
              {activeClubTab === 'matches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Desafios Esportivos & Prélios de 1910 (Macroetapas 17 e 18)</h3>
                  <div style={{ display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.85)', borderRadius: '6px', alignItems: 'center' }}>
                    <select
                      value={selectedRivalName}
                      onChange={e => setSelectedRivalName(e.target.value)}
                      style={{ flex: 1, padding: '5px 8px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '11px' }}
                    >
                      {HISTORICAL_1910_RIVALS.map(r => (
                        <option key={r.name} value={r.name}>{r.name} ({r.shortName})</option>
                      ))}
                    </select>
                    <select
                      value={friendlyCompetitionType}
                      onChange={e => setFriendlyCompetitionType(e.target.value as any)}
                      style={{ padding: '5px 8px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '11px' }}
                    >
                      <option value="friendly">Amistoso Festivo</option>
                      <option value="festival_taça">Taça de Inauguração</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleDisputeFriendly}
                      style={{ padding: '5px 12px', background: '#e0aa38', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      ⚔️ Disputar Prélio!
                    </button>
                  </div>

                  {lastMatchResult && (
                    <div style={{ padding: '10px', backgroundColor: 'rgba(38, 30, 20, 0.9)', border: '1px solid #e0aa38', borderRadius: '6px', fontSize: '12px' }}>
                      <strong style={{ color: '#f2d994' }}>SÚMULA DO JOGO: {lastMatchResult.homeClubName} {lastMatchResult.homeScore} x {lastMatchResult.awayScore} {lastMatchResult.awayClubName}</strong>
                      <div style={{ color: '#ccc', fontSize: '11px', marginTop: '4px' }}>
                        Público: {lastMatchResult.attendance?.toLocaleString('pt-BR')} torcedores · Renda: {lastMatchResult.grossGatePpu?.toFixed(1)} PPU
                      </div>
                      <div style={{ maxHeight: '100px', overflowY: 'auto', marginTop: '6px', fontSize: '10px', color: '#aaa' }}>
                        {(lastMatchResult.chronicle ?? []).map((line: string, idx: number) => (
                          <div key={idx}>· {line}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #444', borderRadius: '4px', padding: '6px' }}>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#aaa' }}>HISTÓRICO RECENTE DE PARTIDAS:</h5>
                    {matchHistory.map((m: any) => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed #333', fontSize: '10px' }}>
                        <span>{formatDate(m.date)} · {m.homeClubName} {m.homeScore} x {m.awayScore} {m.awayClubName}</span>
                        <span style={{ color: '#f2d994' }}>{m.competitionType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 7: COMPETIÇÕES */}
              {activeClubTab === 'competitions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Competições da Época & Sala de Troféus (Macroetapas 19 e 20)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {competitions.map((c: any) => (
                      <div key={c.id} style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.85)', borderRadius: '6px', border: '1px solid #444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#fff', fontSize: '12px' }}>{c.name} ({c.year})</strong>
                          <span style={{ fontSize: '10px', color: c.status === 'completed' ? '#ffd700' : '#98e49b' }}>{c.status}</span>
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          {(c.fixtures ?? []).slice(0, 3).map((fix: any) => (
                            <div key={fix.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0' }}>
                              <span>{fix.homeClubName} x {fix.awayClubName}</span>
                              {fix.played ? (
                                <span style={{ color: '#f2d994' }}>{fix.homeScore} x {fix.awayScore}</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDisputeCompetitionMatch(c.id, fix.id)}
                                  style={{ padding: '1px 5px', background: '#5a6545', border: 'none', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                  Jogar
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TAÇA BRASIL DE 1959 - MACROETAPA 36 */}
                  <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(20, 26, 22, 0.95)', borderRadius: '8px', border: '1px solid #d4af37' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(212, 175, 55, 0.4)', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🇧🇷</span>
                        <div>
                          <strong style={{ color: '#f2d994', fontSize: '13px', display: 'block' }}>Taça Brasil de 1959 (Campeonato Nacional da CBD)</strong>
                          <span style={{ fontSize: '10px', color: '#aaa' }}>Macroetapa 36 · O Clímax do Futebol Brasileiro dos Anos 50</span>
                        </div>
                      </div>
                      {!tacaBrasil ? (
                        <button
                          type="button"
                          onClick={() => onGenerateTacaBrasil1959?.()}
                          style={{ padding: '4px 10px', background: '#d4af37', border: 'none', color: '#111', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          ⚡ Inaugurar Taça Brasil de 1959
                        </button>
                      ) : tacaBrasil.status !== 'completed' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onAdvanceTacaBrasil?.()}
                            style={{ padding: '4px 8px', background: '#5a6545', border: '1px solid #738548', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ⚔️ Avançar Fase
                          </button>
                          <button
                            type="button"
                            onClick={() => onSimulateEntireTacaBrasil?.()}
                            style={{ padding: '4px 8px', background: '#846d29', border: '1px solid #d4af37', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ⚡ Simular Até a Final
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#ffd700', fontWeight: 'bold' }}>🏆 TORNEIO CONCLUÍDO</span>
                      )}
                    </div>

                    {tacaBrasil ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Banner do Representante Mineiro */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'rgba(35, 45, 38, 0.9)', borderRadius: '6px', border: '1px solid #738548' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#888', display: 'block' }}>REPRESENTANTE DE MINAS GERAIS:</span>
                            <strong style={{ color: tacaBrasil.minasRepresentative.isPlayerClub ? '#ffd700' : '#fff', fontSize: '12px' }}>
                              {tacaBrasil.minasRepresentative.name} ({tacaBrasil.minasRepresentative.shortName})
                            </strong>
                          </div>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: tacaBrasil.minasRepresentative.isPlayerClub ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255, 255, 255, 0.1)', color: tacaBrasil.minasRepresentative.isPlayerClub ? '#ffd700' : '#bbb' }}>
                            {tacaBrasil.minasRepresentative.isPlayerClub ? '⭐ Seu Clube Classificado!' : 'Participante da Federação Mineira'}
                          </span>
                        </div>

                        {/* Card do Campeão se concluído */}
                        {tacaBrasil.status === 'completed' && tacaBrasil.champion && (
                          <div style={{ padding: '10px', backgroundColor: 'rgba(45, 35, 15, 0.95)', border: '1px solid #ffd700', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', marginBottom: '4px' }}>🏆 🇧🇷 🏆</div>
                            <strong style={{ color: '#ffd700', fontSize: '14px', display: 'block' }}>
                              {tacaBrasil.champion.name} ({tacaBrasil.champion.state})
                            </strong>
                            <div style={{ fontSize: '11px', color: '#fff', marginTop: '2px' }}>
                              Primeiro Campeão Brasileiro da História do Futebol!
                            </div>
                            {tacaBrasil.historicalSummary && (
                              <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#ddd', fontStyle: 'italic' }}>
                                "{tacaBrasil.historicalSummary}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Chaves Eliminatórias */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          {tacaBrasil.ties.map((tie: any) => (
                            <div key={tie.id} style={{ padding: '8px', backgroundColor: 'rgba(24, 30, 26, 0.85)', borderRadius: '4px', border: '1px solid #3d4a3e', fontSize: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#aaa', fontSize: '9px', textTransform: 'uppercase' }}>{tie.name.split('(')[0]}</span>
                                {tie.winnerName && <span style={{ color: '#ffd700', fontWeight: 'bold' }}>✓ {tie.winnerName}</span>}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {tie.matches.map((m: any) => (
                                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', color: m.played ? '#fff' : '#777', padding: '2px 0', borderBottom: '1px dotted rgba(255,255,255,0.1)' }}>
                                    <span>{m.homeTeam.shortName} x {m.awayTeam.shortName} ({m.leg === 1 ? 'Ida' : m.leg === 2 ? 'Volta' : 'Desempate'})</span>
                                    {m.played ? (
                                      <strong style={{ color: '#f2d994' }}>{m.homeScore} x {m.awayScore}</strong>
                                    ) : (
                                      <span style={{ color: '#666' }}>A disputar</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.6)', borderRadius: '6px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                        A primeira edição nacional da Taça Brasil reúne os campeões de cada estado (Santos de Pelé, Bahia, Vasco, Grêmio, Sport, etc.). O campeão de Minas Gerais representa o estado nas eliminatórias!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 8: DIRETORIA */}
              {activeClubTab === 'board' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Diretoria Estatutária & Governança (Macroetapa 14)</h3>
                    <button
                      type="button"
                      onClick={() => onHoldClubElection(selectedCandidateId ?? undefined)}
                      style={{ padding: '4px 10px', background: '#5a6545', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      🗳️ Realizar Eleição Estatutária
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {(club.board?.members ?? []).map(member => (
                      <div key={member.id} style={{ padding: '8px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '4px', border: '1px solid #444', fontSize: '11px' }}>
                        <span style={{ color: '#888', display: 'block', fontSize: '10px' }}>{member.role.toUpperCase()}</span>
                        <strong style={{ color: '#fff' }}>{member.name}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 9: IDENTIDADE SOCIAL */}
              {activeClubTab === 'social' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Identidade Social & Inserção Urbana (Macroetapa 12)</h3>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #444', fontSize: '12px' }}>
                    <p style={{ margin: 0, color: '#ccc', lineHeight: '1.4' }}>
                      O clube consolida sua identidade histórica ancorado nas tradições esportivas de sua fundação em Cidade de Minas.
                    </p>
                    <div style={{ marginTop: '8px', color: '#f2d994', fontSize: '11px' }}>
                      Reputação Urbana Geral: <strong>{club.socialIdentity?.cityWideReputation ?? 50}/100</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 10: POLÍTICA */}
              {activeClubTab === 'politics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Política Interna & Facções do Clube (Macroetapa 14)</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>
                    Facções e tendências ideológicas dos associados moldam as decisões assembleares e assembleias gerais de prestação de contas.
                  </p>
                </div>
              )}

              {/* ABA 11: OUTROS CLUBES & FEDERAÇÃO */}
              {activeClubTab === 'ecosystem' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Ecossistema Esportivo & Federação (Macroetapas 21–24)</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['local', 'regional', 'federation'] as const).map(sub => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setEcosystemSubTab(sub)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '10px',
                            backgroundColor: ecosystemSubTab === sub ? '#5a6545' : '#222',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          {sub.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ecosystemSubTab === 'local' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {localClubs.map((lc: any) => {
                        const pres = lc.president ?? {
                          name: lc.directorProfile?.presidentName ?? 'Diretoria Provisória',
                          termStartYear: lc.foundationDate?.year ?? 1910,
                          termEndYear: (lc.foundationDate?.year ?? 1910) + 4,
                          politicalLine: lc.origin === 'elite' ? 'aristocratic' : lc.origin === 'workers' ? 'popular_labor' : 'mercantile',
                          biography: 'Dirigente respeitado pela comunidade clubística.',
                        };
                        const stad = lc.stadium ?? {
                          name: `Praça de Esportes do ${lc.shortName ?? 'Clube'}`,
                          capacity: 1500,
                          pitchType: 'dirt',
                          standsType: 'none',
                          hasFloodlights: false,
                        };
                        const polBadge = {
                          aristocratic: { label: '🎩 Aristocrática', bg: '#2b1b17', text: '#ffd54f' },
                          popular_labor: { label: '⚙️ Popular/Operária', bg: '#1c2833', text: '#e74c3c' },
                          mercantile: { label: '💼 Mercantil/Comércio', bg: '#142820', text: '#2ecc71' },
                          academic: { label: '🎓 Acadêmica/Estudantil', bg: '#1a237e', text: '#64b5f6' },
                          community: { label: '🏘️ Bairrista/Comunitária', bg: '#332211', text: '#f39c12' },
                        }[pres.politicalLine as string] ?? { label: 'Institucional', bg: '#222', text: '#fff' };

                        return (
                          <div
                            key={lc.id}
                            style={{
                              padding: '10px',
                              backgroundColor: 'rgba(20, 24, 22, 0.95)',
                              borderRadius: '4px',
                              border: '1px solid #555',
                              fontSize: '11px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: '#fff', fontSize: '12px' }}>
                                {lc.name}
                              </strong>
                              <span style={{ fontSize: '9px', padding: '1px 5px', backgroundColor: polBadge.bg, color: polBadge.text, border: `1px solid ${polBadge.text}`, fontWeight: 'bold' }}>
                                {polBadge.label}
                              </span>
                            </div>

                            <div style={{ color: '#aaa', fontSize: '10px' }}>
                              Fundação: <strong>{lc.foundationDate?.year ?? lc.foundationYear}</strong> · Reputação: <strong>{lc.reputation ?? 50}/100</strong>
                            </div>

                            {/* Presidente e Linha Política */}
                            <div style={{ padding: '4px 6px', backgroundColor: '#111', borderLeft: '2px solid #e0aa38', fontSize: '10px' }}>
                              <div style={{ color: '#f2d994', fontWeight: 'bold' }}>
                                🏛️ Pres. {pres.name} ({pres.termStartYear}–{pres.termEndYear})
                              </div>
                              <div style={{ color: '#ccc', fontStyle: 'italic', fontSize: '9px', marginTop: '1px' }}>
                                {pres.biography}
                              </div>
                            </div>

                            {/* Estádio Próprio */}
                            <div style={{ padding: '4px 6px', backgroundColor: '#111', borderLeft: '2px solid #81c784', fontSize: '10px' }}>
                              <div style={{ color: '#81c784', fontWeight: 'bold' }}>
                                🏟️ {stad.name}
                              </div>
                              <div style={{ color: '#bbb', fontSize: '9px', marginTop: '1px' }}>
                                {stad.capacity?.toLocaleString('pt-BR')} lugares · {stad.pitchType === 'grass' ? '🌿 Gramado' : '🟤 Terra Batida'} · {stad.hasFloodlights ? '💡 Refletores' : '☀️ Luz Diurna'}
                              </div>
                            </div>

                            {/* Botão de Desafio Direto */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRivalName(lc.name);
                                openClubTab('matches');
                              }}
                              style={{
                                marginTop: '4px',
                                padding: '4px 8px',
                                backgroundColor: '#000',
                                color: '#ffffff',
                                border: '1px solid #ffffff',
                                fontWeight: 'bold',
                                fontSize: '10px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                              }}
                            >
                              ⚔️ Desafiar para Amistoso
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {ecosystemSubTab === 'regional' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {regionalClubs.map((rc: any) => (
                        <div key={rc.id} style={{ padding: '8px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '4px', border: '1px solid #444', fontSize: '11px' }}>
                          <strong>{rc.name}</strong>
                          <div style={{ color: '#888', fontSize: '10px' }}>{rc.city} · Viagem de trem: {rc.railwayTravelHours}h ({rc.travelCostPpu.toFixed(1)} PPU)</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {ecosystemSubTab === 'federation' && (
                    <div style={{ padding: '12px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #444', fontSize: '11px' }}>
                      {federation ? (
                        <div>
                          <strong style={{ color: '#f2d994', fontSize: '13px' }}>{federation.name}</strong>
                          <div style={{ color: '#aaa', margin: '4px 0' }}>Fundada em {formatDate(federation.foundingDate)} · {federation.affiliatedClubs.length} clubes filiados</div>
                        </div>
                      ) : (
                        <div style={{ color: '#aaa' }}>Liga Mineira em processo de articulação institucional prévia a 1915.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 12: IMPRENSA */}
              {activeClubTab === 'press' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Crônica & Imprensa Esportiva Histórica (Macroetapa 37)</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pressArticles.map((art: any) => (
                      <div key={art.id} style={{ padding: '8px', backgroundColor: 'rgba(28, 34, 30, 0.85)', borderRadius: '4px', border: '1px solid #444', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f2d994', fontSize: '10px' }}>
                          <span>{art.outletName} · {formatDate(art.date)}</span>
                          <span>{art.tone}</span>
                        </div>
                        <strong style={{ color: '#fff', display: 'block', margin: '2px 0' }}>{art.headline}</strong>
                        <p style={{ margin: 0, color: '#ccc', fontSize: '10px' }}>{art.bodyText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 13: LENDAS & HOMENAGENS */}
              {activeClubTab === 'legends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Galeria de Lendas & Homenagens do Clube (Macroetapas 30 e 31)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {legends.map((leg: any) => (
                      <div key={leg.id} style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.85)', borderRadius: '6px', border: '1px solid #444', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#fff' }}>{leg.name}</strong>
                          <span style={{ fontSize: '10px', color: '#ffd700' }}>{leg.tier}</span>
                        </div>
                        <div style={{ color: '#aaa', fontSize: '10px', margin: '2px 0 6px 0' }}>
                          {leg.role} · {leg.yearsOfService} anos de clube · Legado: {leg.legacyPoints} pts
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {(['busto', 'medalha_honra', 'nome_tribuna'] as HonorType[]).map(ht => (
                            <button
                              key={ht}
                              type="button"
                              onClick={() => { setSelectedLegendId(leg.id); setSelectedHonorType(ht); handleProposeHonor(leg.id); }}
                              style={{ padding: '2px 6px', fontSize: '9px', background: '#334', border: '1px solid #556', color: '#fff', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              Propor {ht.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 14: ARQUIVO DOS 50 ANOS (1910–1959) */}
              {activeClubTab === 'archive' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* SUB-MENU DO ARQUIVO */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(28, 34, 30, 0.95)', borderRadius: '6px', border: '1px solid #f2d994' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', color: '#f2d994', fontSize: '13px' }}>📜 Memorial & Arquivo dos 50 Anos (1910–1959)</h4>
                      <span style={{ fontSize: '11px', color: '#ccc' }}>Registro causal integral de marcos, causas, consequências e transformações institucionais (Macroetapas 32, 33 e 34).</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowJubileeModal(true)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          border: '1px solid #f2d994',
                          backgroundColor: 'rgba(242, 217, 148, 0.25)',
                          color: '#f2d994',
                          cursor: 'pointer',
                        }}
                      >
                        ⭐ Relatório Jubilar (1910–1959)
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveSubTab('timeline')}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: archiveSubTab === 'timeline' ? '1px solid #f2d994' : '1px solid #5a6545',
                          backgroundColor: archiveSubTab === 'timeline' ? '#5a6545' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Timeline Causal
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveSubTab('traditions')}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: archiveSubTab === 'traditions' ? '1px solid #f2d994' : '1px solid #5a6545',
                          backgroundColor: archiveSubTab === 'traditions' ? '#5a6545' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Tradições
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveSubTab('decades')}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: archiveSubTab === 'decades' ? '1px solid #f2d994' : '1px solid #5a6545',
                          backgroundColor: archiveSubTab === 'decades' ? '#5a6545' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Panorama Decenal
                      </button>
                    </div>
                  </div>

                  {/* SUB-VISÃO 1: TIMELINE CAUSAL */}
                  {archiveSubTab === 'timeline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#aaa' }}>
                        Selecione qualquer evento histórico para inspecionar sua cadeia de causalidade (causas pregressas e consequências geradas).
                      </div>

                      {/* INSPETOR CAUSAL */}
                      {selectedEvent && causalChain && (
                        <div style={{ padding: '12px', backgroundColor: 'rgba(34, 26, 18, 0.95)', borderRadius: '6px', border: '1px solid #e0aa38' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ color: '#f2d994', fontSize: '12px' }}>🔍 Inspetor Causal: {selectedEvent.title}</strong>
                            <button
                              type="button"
                              onClick={() => setSelectedHistoricalEventId(null)}
                              style={{ padding: '2px 6px', fontSize: '10px', background: '#443', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              Fechar
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px' }}>
                            <div style={{ backgroundColor: 'rgba(20, 16, 12, 0.8)', padding: '8px', borderRadius: '4px' }}>
                              <span style={{ color: '#ffaa66', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>⬅️ Causas Raiz Antecedentes:</span>
                              {causalChain.rootCauses.length === 0 ? (
                                <span style={{ color: '#777' }}>Marco inaugural sem causas pregressas.</span>
                              ) : (
                                causalChain.rootCauses.map(cause => (
                                  <div key={cause.id} style={{ borderBottom: '1px dashed #443', padding: '4px 0' }}>
                                    <strong style={{ color: '#eee' }}>{cause.title}</strong>
                                    <span style={{ color: '#888', display: 'block', fontSize: '10px' }}>{formatDate(cause.date)} · {cause.description}</span>
                                  </div>
                                ))
                              )}
                            </div>
                            <div style={{ backgroundColor: 'rgba(20, 16, 12, 0.8)', padding: '8px', borderRadius: '4px' }}>
                              <span style={{ color: '#66ccff', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>➡️ Consequências Derivadas Futuras:</span>
                              {causalChain.downstreamConsequences.length === 0 ? (
                                <span style={{ color: '#777' }}>Sem consequências derivadas registradas até o momento.</span>
                              ) : (
                                causalChain.downstreamConsequences.map(cons => (
                                  <div key={cons.id} style={{ borderBottom: '1px dashed #443', padding: '4px 0' }}>
                                    <strong style={{ color: '#eee' }}>{cons.title}</strong>
                                    <span style={{ color: '#888', display: 'block', fontSize: '10px' }}>{formatDate(cons.date)} · {cons.description}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* LISTA DE EVENTOS DO HISTORICAL LEDGER */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
                        {allHistoricalEvents.length === 0 ? (
                          <div style={{ padding: '12px', color: '#888' }}>Nenhum evento registrado no Ledger Histórico.</div>
                        ) : (
                          allHistoricalEvents.map(ev => (
                            <div
                              key={ev.id}
                              style={{
                                padding: '8px 10px',
                                backgroundColor: selectedHistoricalEventId === ev.id ? 'rgba(50, 40, 20, 0.9)' : 'rgba(24, 28, 26, 0.85)',
                                borderRadius: '4px',
                                border: selectedHistoricalEventId === ev.id ? '1px solid #f2d994' : '1px solid #444',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '10px', color: '#f2d994', fontWeight: 'bold' }}>{formatDate(ev.date)}</span>
                                  <span style={{ fontSize: '10px', padding: '1px 5px', backgroundColor: '#333', borderRadius: '3px', color: '#bbb' }}>{ev.category}</span>
                                  <strong style={{ fontSize: '12px', color: '#fff' }}>{ev.title}</strong>
                                </div>
                                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#aaa' }}>{ev.description}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedHistoricalEventId(ev.id)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  backgroundColor: 'rgba(224, 170, 56, 0.2)',
                                  border: '1px solid #e0aa38',
                                  borderRadius: '3px',
                                  color: '#f2d994',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🔍 Inspecionar Grafo
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-VISÃO 2: TRADIÇÕES */}
                  {archiveSubTab === 'traditions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(24, 28, 26, 0.85)', borderRadius: '6px', border: '1px solid #5a6545' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: '#f2d994', fontSize: '13px' }}>🏛️ Perfil de Tradições Consagradas (Macroetapa 32)</strong>
                          <span style={{ fontSize: '12px', color: '#ffd700', fontWeight: 'bold' }}>
                            Índice de Tradição: {traditionProfile?.traditionStrength ?? 50}/100
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                          <div style={{ width: `${traditionProfile?.traditionStrength ?? 50}%`, height: '100%', backgroundColor: '#ffd700' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '11px' }}>
                          <div style={{ padding: '8px', backgroundColor: 'rgba(18, 22, 20, 0.75)', borderRadius: '4px' }}>
                            <span style={{ color: '#888', display: 'block' }}>Alcunha Tradicional:</span>
                            <strong style={{ color: '#fff', fontSize: '12px' }}>{traditionProfile?.traditionalNicknames?.[0] ?? 'O Decano Mineiro'}</strong>
                          </div>
                          <div style={{ padding: '8px', backgroundColor: 'rgba(18, 22, 20, 0.75)', borderRadius: '4px' }}>
                            <span style={{ color: '#888', display: 'block' }}>Bairro Tradicional & Estádio:</span>
                            <strong style={{ color: '#fff', fontSize: '12px' }}>
                              {traditionProfile?.currentStadiumName ?? 'Praça de Esportes'} · {traditionProfile?.homeNeighborhoodName ?? 'Centro'}
                            </strong>
                          </div>
                          <div style={{ padding: '8px', backgroundColor: 'rgba(18, 22, 20, 0.75)', borderRadius: '4px' }}>
                            <span style={{ color: '#888', display: 'block' }}>Estilo Tático Consagrado:</span>
                            <strong style={{ color: '#fff', fontSize: '12px' }}>{traditionProfile?.primaryPlayingStyle ?? 'pyramid_2_3_5'}</strong>
                          </div>
                          <div style={{ padding: '8px', backgroundColor: 'rgba(18, 22, 20, 0.75)', borderRadius: '4px' }}>
                            <span style={{ color: '#888', display: 'block' }}>Cores e Manto:</span>
                            <strong style={{ color: '#fff', fontSize: '12px' }}>
                              {club.colors?.primary ? `${club.colors.primary} e ${club.colors.secondary}` : 'Alvinegro'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-VISÃO 3: PANORAMA DECENAL */}
                  {archiveSubTab === 'decades' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[1910, 1920, 1930, 1940, 1950, 1959].map(yr => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setSelectedDecadeYear(yr)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: selectedDecadeYear === yr ? '1px solid #f2d994' : '1px solid #444',
                              backgroundColor: selectedDecadeYear === yr ? '#5a6545' : 'rgba(20, 24, 22, 0.8)',
                              color: selectedDecadeYear === yr ? '#fff5d8' : '#aaa',
                              cursor: 'pointer',
                              fontWeight: selectedDecadeYear === yr ? 'bold' : 'normal',
                            }}
                          >
                            Década de {yr}
                          </button>
                        ))}
                      </div>

                      {activeDecadeInfo ? (
                        <div style={{ padding: '12px', backgroundColor: 'rgba(24, 28, 26, 0.9)', borderRadius: '6px', border: '1px solid #5a6545' }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#f2d994', fontSize: '13px' }}>Panorama Histórico · Ano {selectedDecadeYear} ({activeDecadeInfo.eraLabel})</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px', marginBottom: '10px' }}>
                            <div style={{ padding: '6px', backgroundColor: 'rgba(16, 20, 18, 0.8)', borderRadius: '3px' }}>
                              <span style={{ color: '#888', display: 'block' }}>População Urbana Estimada:</span>
                              <strong style={{ color: '#fff' }}>{activeDecadeInfo.populationEstimate.toLocaleString('pt-BR')} hab.</strong>
                            </div>
                            <div style={{ padding: '6px', backgroundColor: 'rgba(16, 20, 18, 0.8)', borderRadius: '3px' }}>
                              <span style={{ color: '#888', display: 'block' }}>Distritos Formados:</span>
                              <strong style={{ color: '#fff' }}>{activeDecadeInfo.districtCount} distritos</strong>
                            </div>
                          </div>
                          <div style={{ padding: '8px', backgroundColor: 'rgba(16, 20, 18, 0.8)', borderRadius: '3px', fontSize: '11px' }}>
                            <span style={{ color: '#888', display: 'block', marginBottom: '2px' }}>Contexto Histórico e Transformação Urbana:</span>
                            <p style={{ margin: 0, color: '#ccc', lineHeight: '1.4' }}>{activeDecadeInfo.summaryPt}</p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '12px', color: '#888' }}>Dados comparáveis da década em consolidação.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: '#ccc', backgroundColor: 'rgba(16, 20, 18, 0.95)', borderRadius: '6px', border: '1px solid #738548' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#f2d994', fontSize: '18px' }}>🏛️ Bem-vindo ao Tradição Esporte Clube</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
                A campanha de 50 anos (1910–1959) em <strong>Cidade de Minas</strong> aguarda a ata inaugural do clube.
              </p>
              <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 20px 0' }}>
                Você pode fundar imediatamente o <strong>Tradição Esporte Clube</strong> nas terras da ferrovia para liberar todas as 14 abas de gestão, o esquadrão 2-3-5, amistosos, Taça Brasil e a contabilidade histórica.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onEnsureFoundingClub) {
                    onEnsureFoundingClub();
                  }
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#738548',
                  border: '1px solid #96aa62',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                ⚽ Fundar Tradição Esporte Clube Agora & Iniciar Campanha (1910)
              </button>
            </div>
          )}
        </section>
      )}

      {/* PAINEL DE DEMOGRAFIA (L0–L2) */}
      {activeDialog === 'demographics' && (
        <section
          className="campaign-panel"
          style={{
            position: 'fixed',
            top: '80px',
            left: '16px',
            width: 'min(500px, calc(100vw - 32px))',
            backgroundColor: 'rgba(20, 24, 22, 0.95)',
            border: '2px solid #738548',
            borderRadius: '8px',
            padding: '16px',
            color: '#fff',
            zIndex: 1000,
          }}
          aria-label="Demografia Urbana"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#f2d994' }}>Demografia Urbana de Cidade de Minas (D5)</h3>
            <button
              type="button"
              onClick={() => setActiveDialog('none')}
              style={{ padding: '2px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          {demographics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ padding: '8px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '4px' }}>
                <span style={{ color: '#f2d994', fontWeight: 'bold' }}>CAMADA L0 · População Total:</span>
                <strong style={{ marginLeft: '6px', color: '#fff' }}>{demographics.l0?.totalPopulation?.toLocaleString('pt-BR')} hab.</strong>
              </div>
              <div style={{ padding: '8px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '4px' }}>
                <span style={{ color: '#f2d994', fontWeight: 'bold' }}>CAMADA L1 · Coortes Sociodemográficas:</span>
                <span style={{ marginLeft: '6px', color: '#ccc' }}>{demographics.l1?.totalCohortsCount} grupos</span>
              </div>
              <div style={{ padding: '8px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '4px' }}>
                <span style={{ color: '#f2d994', fontWeight: 'bold' }}>CAMADA L2 · Cidadãos Materializados:</span>
                <span style={{ marginLeft: '6px', color: '#ccc' }}>{demographics.l2?.totalMaterialized} biografados</span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#888', fontSize: '11px' }}>Dados demográficos em geração pela simulação.</p>
          )}
        </section>
      )}

      {/* PAINEL DE CAMADAS */}
      {activeDialog === 'layers' && (
        <DataViewPanel active={dataView} onSelect={onDataViewChange} />
      )}

      {/* PAINEL DE DIAGNÓSTICO BASE */}
      {activeDialog === 'legacy' && (
        <StatsPanel samples={statsSamples} />
      )}

      {/* MODAL SOLENE DO CINQUENTENÁRIO (1910–1959) - ALPHA H (H4 + H5) */}
      {showJubileeModal && jubileeReport && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 8, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#161c18',
              border: '2px solid #f2d994',
              borderRadius: '8px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85)',
              color: '#e6ede8',
            }}
          >
            {/* CABEÇALHO SOLENE */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(242, 217, 148, 0.35)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(28, 34, 30, 0.95)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#f2d994', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  Cinquentenário de Ouro · 1910–1959 · Relatório Jubilar Oficial
                </div>
                <h2 style={{ margin: '2px 0 0 0', color: '#fff5d8', fontSize: '19px' }}>
                  🏛️ {jubileeReport.clubName} — Meio Século de Glórias
                </h2>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                  Cidade de Minas · Seed: <code style={{ color: '#f2d994' }}>{jubileeReport.worldSeed}</code> · Conclusão em 31/12/1959
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJubileeModal(false)}
                style={{
                  background: 'none',
                  border: '1px solid #738548',
                  borderRadius: '4px',
                  color: '#ccc',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕ Fechar
              </button>
            </div>

            {/* ABAS DE NAVEGAÇÃO INTERNA */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '8px 20px',
                backgroundColor: 'rgba(20, 25, 22, 0.9)',
                borderBottom: '1px solid #2a332d',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'geral', label: '📜 Crônica de 50 Anos' },
                { id: 'cidade', label: '🏙️ Cidade: 1910 vs 1959' },
                { id: 'patrimonio', label: '🏟️ Patrimônio & Terrenos' },
                { id: 'futebol', label: '🏆 Futebol, Títulos & Rival' },
                { id: 'figuras', label: '⭐ Fundadores, Sócios & Lendas' },
                { id: 'cronica', label: '⚠️ Crise & Maior Obra' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setJubileeTab(tab.id as any)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: jubileeTab === tab.id ? 'bold' : 'normal',
                    backgroundColor: jubileeTab === tab.id ? '#738548' : 'rgba(35, 43, 38, 0.6)',
                    color: jubileeTab === tab.id ? '#fff' : '#bbb',
                    border: '1px solid',
                    borderColor: jubileeTab === tab.id ? '#96aa62' : '#2a332d',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CONTEÚDO SCROLLÁVEL */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* ABA 1: CRÔNICA GERAL */}
              {jubileeTab === 'geral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '14px', backgroundColor: 'rgba(242, 217, 148, 0.08)', borderRadius: '6px', border: '1px solid rgba(242, 217, 148, 0.25)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#f2d994', fontSize: '15px' }}>
                      📜 O Testemunho Vivo de Cinquenta Anos (1910–1959)
                    </h3>
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.65', fontSize: '13px', color: '#e0e7e1' }}>
                      {jubileeReport.narrativeChroniclePt}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase' }}>Crescimento da Cidade</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#f2d994', marginTop: '2px' }}>
                        {jubileeReport.cityUrbanEvolution.growthRatio}x
                      </strong>
                      <span style={{ fontSize: '11px', color: '#ccc' }}>35 mil → 520 mil habitantes</span>
                    </div>

                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase' }}>Corpo Associativo</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#f2d994', marginTop: '2px' }}>
                        {jubileeReport.membersEvolution.finalCount} associados
                      </strong>
                      <span style={{ fontSize: '11px', color: '#ccc' }}>{jubileeReport.membersEvolution.payingMembersCount} ativos e pagantes</span>
                    </div>

                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase' }}>Estádio Principal</span>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#f2d994', marginTop: '4px' }}>
                        {jubileeReport.heritageAndStadium.finalStadiumName}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#ccc' }}>{jubileeReport.heritageAndStadium.stadiumCapacity.toLocaleString('pt-BR')} torcedores</span>
                    </div>

                    <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase' }}>Taça Brasil de 1959</span>
                      <strong style={{ display: 'block', fontSize: '15px', color: jubileeReport.trophiesAndLegends.wonTacaBrasil1959 ? '#f2d994' : '#8fa89b', marginTop: '4px' }}>
                        {jubileeReport.trophiesAndLegends.wonTacaBrasil1959 ? '🏆 Campeão Nacional!' : 'Representação Estadual'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#ccc' }}>{jubileeReport.trophiesAndLegends.totalTrophiesCount} títulos oficiais</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: CIDADE DE MINAS */}
              {jubileeTab === 'cidade' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '14px' }}>
                      🏙️ Evolução Urbana e Demográfica de Cidade de Minas
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
                      {jubileeReport.cityUrbanEvolution.summaryPt}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'rgba(24, 30, 26, 0.9)', borderRadius: '6px', border: '1px solid #445448' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#96aa62', fontSize: '13px' }}>
                        📍 Cidade Inicial (1910)
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li><strong>População:</strong> ~{jubileeReport.cityUrbanEvolution.initial1910.populationEstimate.toLocaleString('pt-BR')} habitantes</li>
                        <li><strong>Distritos:</strong> {jubileeReport.cityUrbanEvolution.initial1910.districtCount} distritos pioneiros</li>
                        <li><strong>Ocupações urbanas:</strong> {jubileeReport.cityUrbanEvolution.initial1910.occupiedParcelsCount} lotes edificados</li>
                        <li><strong>Cenário:</strong> Centro histórico, ferrovia e iluminação a lampiões de gás.</li>
                      </ul>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'rgba(24, 30, 26, 0.9)', borderRadius: '6px', border: '1px solid #f2d994' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#f2d994', fontSize: '13px' }}>
                        🌆 Cidade Final (1959)
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li><strong>População:</strong> ~{jubileeReport.cityUrbanEvolution.final1959.populationEstimate.toLocaleString('pt-BR')} habitantes ({jubileeReport.cityUrbanEvolution.growthRatio}x)</li>
                        <li><strong>Distritos:</strong> {jubileeReport.cityUrbanEvolution.final1959.districtCount} distritos consolidados</li>
                        <li><strong>Ocupações urbanas:</strong> {jubileeReport.cityUrbanEvolution.final1959.occupiedParcelsCount} parcelas transformadas</li>
                        <li><strong>Cenário:</strong> Metrópole industrial, bondes elétricos, estádios de concreto e grandes avenidas.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: PATRIMÔNIO & TERRENOS */}
              {jubileeTab === 'patrimonio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '14px' }}>
                      🏟️ Evolução Patrimonial e Valorização dos Terrenos
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
                      {jubileeReport.heritageAndStadium.summaryPt}
                    </p>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'rgba(24, 30, 26, 0.9)', borderRadius: '6px', border: '1px solid #738548' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '13px' }}>
                      📈 Valorização Imobiliária da Sede do Clube
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ccc' }}>
                      {jubileeReport.crestsAndLandValuation.landValuation.explanationPt}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                      <span><strong>Valor 1910:</strong> {jubileeReport.crestsAndLandValuation.landValuation.initialPpu1910.toFixed(1)} PPU</span>
                      <span>→</span>
                      <span><strong>Valor 1959:</strong> {jubileeReport.crestsAndLandValuation.landValuation.finalEstimatedPpu1959.toFixed(1)} PPU</span>
                      <span>(<strong>+{Math.round((jubileeReport.crestsAndLandValuation.landValuation.appreciationRatio - 1) * 100)}%</strong> real)</span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#fff5d8', fontSize: '13px' }}>
                      🛡️ Evolução Heráldica dos Escudos (1910–1959)
                    </h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {jubileeReport.crestsAndLandValuation.crests.map((crest) => (
                        <div key={crest.version} style={{ padding: '8px 12px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #445448', fontSize: '11px' }}>
                          <span style={{ color: '#f2d994', fontWeight: 'bold' }}>Versão {crest.version} ({crest.startYear}{crest.endYear ? `–${crest.endYear}` : ''})</span>
                          <div style={{ color: '#ccc', marginTop: '2px' }}>{crest.changeReason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: FUTEBOL, TÍTULOS & RIVAL */}
              {jubileeTab === 'futebol' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '14px' }}>
                      🏆 Sala de Troféus e Desempenho Histórico
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
                      {jubileeReport.trophiesAndLegends.summaryPt}
                    </p>
                  </div>

                  {jubileeReport.trophiesAndLegends.trophies.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '13px' }}>
                        Galeria Oficial de Conquistas
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                        {jubileeReport.trophiesAndLegends.trophies.map((trophy) => (
                          <div key={trophy.id} style={{ padding: '8px 10px', backgroundColor: 'rgba(242, 217, 148, 0.1)', borderRadius: '6px', border: '1px solid #f2d994' }}>
                            <strong style={{ color: '#f2d994', fontSize: '12px' }}>🏆 {trophy.title}</strong>
                            <div style={{ fontSize: '11px', color: '#bbb' }}>Ano: {trophy.year} · Tier: {trophy.tier}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '12px', backgroundColor: 'rgba(24, 30, 26, 0.9)', borderRadius: '6px', border: '1px solid #a84242' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#f29494', fontSize: '13px' }}>
                      ⚔️ O Maior Rival: {jubileeReport.rivalryAndClassic.primaryRivalName}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ccc' }}>
                      {jubileeReport.rivalryAndClassic.memorableMatchSummaryPt}
                    </p>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                      <span><strong>Dérbi:</strong> {jubileeReport.rivalryAndClassic.classicName}</span>
                      <span>·</span>
                      <span><strong>Vitórias:</strong> {jubileeReport.rivalryAndClassic.headToHead.wins}</span>
                      <span>·</span>
                      <span><strong>Empates:</strong> {jubileeReport.rivalryAndClassic.headToHead.draws}</span>
                      <span>·</span>
                      <span><strong>Derrotas:</strong> {jubileeReport.rivalryAndClassic.headToHead.losses}</span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#fff5d8', fontSize: '13px' }}>
                      ⚽ Jogos Notáveis de Meio Século
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #738548' }}>
                        <span style={{ color: '#96aa62', fontSize: '11px', fontWeight: 'bold' }}>MAIOR GOLEADA</span>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#fff', marginTop: '2px' }}>
                          {jubileeReport.notableMatches.biggestWin.score} vs {jubileeReport.notableMatches.biggestWin.opponent}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#bbb' }}>{jubileeReport.notableMatches.biggestWin.datePt} — {jubileeReport.notableMatches.biggestWin.descriptionPt}</span>
                      </div>

                      <div style={{ padding: '10px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #a84242' }}>
                        <span style={{ color: '#f29494', fontSize: '11px', fontWeight: 'bold' }}>MAIOR REVÉS</span>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#fff', marginTop: '2px' }}>
                          {jubileeReport.notableMatches.biggestDefeat.score} vs {jubileeReport.notableMatches.biggestDefeat.opponent}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#bbb' }}>{jubileeReport.notableMatches.biggestDefeat.datePt} — {jubileeReport.notableMatches.biggestDefeat.descriptionPt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: FUNDADORES, SÓCIOS & LENDAS */}
              {jubileeTab === 'figuras' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '13px' }}>
                        🏛️ Origem & Fundadores (1910)
                      </h4>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#ccc' }}>
                        Vertente: <strong>{jubileeReport.foundersAndPresidents.originLabelPt}</strong> ({jubileeReport.foundersAndPresidents.foundersCount} pioneiros)
                      </p>
                      <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {jubileeReport.foundersAndPresidents.prominentFounders.map((f, i) => (
                          <span key={i}>• {f.name} ({f.rolePt} · {f.occupation})</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'rgba(28, 34, 30, 0.8)', borderRadius: '6px', border: '1px solid #334036' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#f2d994', fontSize: '13px' }}>
                        👔 Dinastia de Presidentes ({jubileeReport.foundersAndPresidents.totalPresidentsCount})
                      </h4>
                      <div style={{ fontSize: '11px', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {jubileeReport.foundersAndPresidents.presidentsList.map((p, i) => (
                          <span key={i}>• <strong>{p.name}</strong> ({p.termPt}) — {p.occupation}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'rgba(24, 30, 26, 0.9)', borderRadius: '6px', border: '1px solid #738548' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#96aa62', fontSize: '13px' }}>
                        ⭐ Figura Histórica Mais Notável
                      </h4>
                      <strong style={{ fontSize: '14px', color: '#fff5d8' }}>
                        {jubileeReport.prominentFigures.mostImportantPerson.name}
                      </strong>
                      <div style={{ fontSize: '11px', color: '#f2d994', marginTop: '2px' }}>
                        {jubileeReport.prominentFigures.mostImportantPerson.roleOrTitlePt}
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#ccc' }}>
                        {jubileeReport.prominentFigures.mostImportantPerson.scoreOrReasonPt}
                      </p>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'rgba(24, 30, 26, 0.9)', borderRadius: '6px', border: '1px solid #738548' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#96aa62', fontSize: '13px' }}>
                        👪 Família Mais Influente
                      </h4>
                      <strong style={{ fontSize: '14px', color: '#fff5d8' }}>
                        Família {jubileeReport.prominentFigures.mostInfluentialFamily.familySurname}
                      </strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#ccc' }}>
                        {jubileeReport.prominentFigures.mostInfluentialFamily.descriptionPt}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 6: CRISE & MAIOR OBRA */}
              {jubileeTab === 'cronica' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '14px', backgroundColor: 'rgba(168, 66, 66, 0.12)', borderRadius: '6px', border: '1px solid #a84242' }}>
                    <div style={{ fontSize: '11px', color: '#f29494', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Momento Mais Difícil da História
                    </div>
                    <h3 style={{ margin: '4px 0 8px 0', color: '#ffb3b3', fontSize: '15px' }}>
                      ⚠️ {jubileeReport.crisisAndGreatWork.greatestCrisis.title} ({jubileeReport.crisisAndGreatWork.greatestCrisis.year})
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#e0caca', lineHeight: '1.6' }}>
                      {jubileeReport.crisisAndGreatWork.greatestCrisis.descriptionPt}
                    </p>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: 'rgba(115, 133, 72, 0.12)', borderRadius: '6px', border: '1px solid #738548' }}>
                    <div style={{ fontSize: '11px', color: '#96aa62', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Maior Intervenção Patrimonial
                    </div>
                    <h3 style={{ margin: '4px 0 8px 0', color: '#fff5d8', fontSize: '15px' }}>
                      🏗️ {jubileeReport.crisisAndGreatWork.greatestWork.name} ({jubileeReport.crisisAndGreatWork.greatestWork.year})
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#e0e7e1', lineHeight: '1.6' }}>
                      {jubileeReport.crisisAndGreatWork.greatestWork.descriptionPt}
                    </p>
                    <div style={{ fontSize: '12px', color: '#f2d994' }}>
                      Investimento consolidado: <strong>{jubileeReport.crisisAndGreatWork.greatestWork.costPpu} PPU</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RODAPÉ SOLENE COM EXPORTAÇÃO */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #2a332d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(20, 25, 22, 0.95)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#aaa' }}>
                A campanha de 50 anos concluiu seu ciclo temporal. O mundo e save permanecem 100% consultáveis em todas as telas.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jubileeReport, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `relatorio-50-anos-${jubileeReport.worldSeed}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'rgba(242, 217, 148, 0.25)',
                    border: '1px solid #f2d994',
                    borderRadius: '4px',
                    color: '#f2d994',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  💾 Exportar Relatório (.json)
                </button>
                <button
                  type="button"
                  onClick={() => setShowJubileeModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#738548',
                    border: '1px solid #96aa62',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Concluir & Continuar Consultando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GameHUD;