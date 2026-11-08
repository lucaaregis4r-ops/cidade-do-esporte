'use client';

/**
 * Main game page
 * Minimal React state - only UI display values
 */

import { useCallback, useRef, useState } from 'react';
import { useStatsHistory } from './hooks/useStatsHistory';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD, type ClubTab } from './components/GameHUD';
import { TileInfoPanel } from './components/TileInfoPanel';
import { Toolbar } from './components/Toolbar';
import { ClubCreationModal } from './components/ClubCreationModal';
import { TitleScreen } from './components/TitleScreen';
import { FounderQuestPanel } from './components/FounderQuestPanel';
import { CityNewsTeletype } from './components/CityNewsTeletype';
import { BenchmarkModal } from './components/BenchmarkModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { DevInspectorModal } from './components/DevInspectorModal';
import { MatchScoreboardModal } from './components/MatchScoreboardModal';
import type { MatchRecord } from '@/game/core/football/MatchEngine';
import { getEraVisualTheme } from '@/game/render/EraVisualTheme';
import { Tool } from '@/game/tools';
import type { DataView } from '@/game/render/dataView';
import { STARTING_FUNDS, EMPTY_CITY_HAPPINESS } from '@/game/core/World';
import { EMPTY_CITY_DEMAND } from '@/game/core/Demand';
import type { TileCoord, ScreenCoord } from '@/game/types/coordinates';
import type { TileInfo, TickUpdate } from '@/game/engine';
import { laborStatus } from '@/app/hooks/laborStatus';
import type { Interruption } from '@/game/core/InterruptionQueue';
import { CampaignRng, DEFAULT_WORLD_SEED } from '@/game/core/CampaignRng';
import { createClub, type ClubState } from '@/game/core/club/Club';
import { generateClubIdentity } from '@/game/core/club/ClubIdentity';
import { generateFoundingGroup } from '@/game/core/club/FoundingGroup';
import type { LandOccupancyContract } from '@/game/core/club/ClubLandContract';
import type { FacilityType } from '@/game/core/club/ClubFacilities';
import type { MemberCategory } from '@/game/core/club/ClubMembers';

export default function Home() {
  // Minimal React state: only UI display values
  const [selectedTile, setSelectedTile] = useState<TileCoord | null>(null);
  // Inspector snapshot + the cursor position that anchors its panel.
  const [inspect, setInspect] = useState<{ info: TileInfo; anchor: ScreenCoord } | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [sim, setSim] = useState<TickUpdate>({ worldSeed: '', citySummary: null, club: null, tick: 0, dirt: 0, population: 0, money: STARTING_FUNDS, date: { year: 1910, month: 1, day: 1 }, demand: EMPTY_CITY_DEMAND, happiness: EMPTY_CITY_HAPPINESS, congestion: 0, employed: 0, unemployed: 0, jobsCapacity: 0, cityGrowth: null, cityTransformation: null });
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.SELECT);
  const [resetNonce, setResetNonce] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 4 | 8>(1);
  const [paused, setPaused] = useState(false);
  const [interruption, setInterruption] = useState<Interruption | null>(null);
  // React state is the single source of truth for the active data-view overlay.
  // useState's setter is already stable so no useCallback is needed.
  const [dataView, setDataView] = useState<DataView>('none');
  const [isClubCreationOpen, setIsClubCreationOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isDevInspectorOpen, setIsDevInspectorOpen] = useState(false);
  const [isTitleScreenOpen, setIsTitleScreenOpen] = useState(true);
  const [requestedClubTab, setRequestedClubTab] = useState<{ tab: ClubTab; nonce: number } | null>(null);
  const [activeMatchRecord, setActiveMatchRecord] = useState<MatchRecord | null>(null);

  const handleRequestClubTab = useCallback((tab: ClubTab) => {
    setRequestedClubTab({ tab, nonce: Date.now() });
  }, []);

  const speedCommandRef = useRef<((m: 1 | 2 | 4 | 8) => void) | null>(null);
  const pauseCommandRef = useRef<(() => void) | null>(null);
  const acknowledgeInterruptionCommandRef = useRef<(() => void) | null>(null);
  const focusLatestGrowthCommandRef = useRef<(() => void) | null>(null);
  const focusLatestTransformationCommandRef = useRef<(() => void) | null>(null);
  const focusClubGroundCommandRef = useRef<(() => import('@/game/types/coordinates').TileCoord | null) | null>(null);
  const foundClubWithParcelCommandRef = useRef<((club: ClubState, parcelId: string, contract: LandOccupancyContract) => boolean) | null>(null);
  const getCityParcelsCommandRef = useRef<(() => readonly import('@/game/core/city/cityParcels').CityParcel[]) | null>(null);
  const ensureFoundingClubCommandRef = useRef<(() => ClubState | null) | null>(null);
  const buildFacilityCommandRef = useRef<((type: FacilityType, customName?: string) => boolean) | null>(null);
  const repairFacilityCommandRef = useRef<((facilityId: string) => boolean) | null>(null);
  const admitMemberCommandRef = useRef<((name: string, category: MemberCategory, socialClass: 'working_class' | 'middle_class' | 'upper_class' | 'elite', occupation: string) => boolean) | null>(null);
  const getPersonCommandRef = useRef<((id: string) => import('@/game/core/person/Person').Person | undefined) | null>(null);
  const getFamilyTreeCommandRef = useRef<((id: string) => import('@/game/core/person/PersonRegistry').FamilyTreeNode | undefined) | null>(null);
  const getUrbanDemographicsCommandRef = useRef<(() => import('@/game/core/club/PopulationLayers').UrbanDemographicsSnapshot | undefined) | null>(null);
  const getElectionCandidatesCommandRef = useRef<(() => readonly import('@/game/core/club/ClubElections').ElectionCandidate[]) | null>(null);
  const holdClubElectionCommandRef = useRef<((playerVotedCandidateId?: string) => import('@/game/core/club/ClubElections').ClubElectionEvent | null) | null>(null);
  const getFootballSquadCommandRef = useRef<(() => import('@/game/core/football/Footballer').FootballSquadState | undefined) | null>(null);
  const setSquadTrainingRegimeCommandRef = useRef<((regime: import('@/game/core/football/Footballer').TrainingRegime) => boolean) | null>(null);
  const getClubAthleticsPolicyCommandRef = useRef<(() => import('@/game/core/football/FootballMarket').ClubAthleticsPolicyState | undefined) | null>(null);
  const setClubAthleticsPolicyCommandRef = useRef<((tier: import('@/game/core/football/FootballMarket').ClubPolicyTier) => boolean) | null>(null);
  const getAvailableLocalProspectsCommandRef = useRef<(() => readonly import('@/game/core/person/Person').Person[]) | null>(null);
  const inviteProspectToClubCommandRef = useRef<((personId: string, position: import('@/game/core/football/Footballer').HistoricalPosition, role: import('@/game/core/football/Footballer').SquadRole) => { success: boolean; message: string }) | null>(null);
  const releaseFootballerFromSquadCommandRef = useRef<((footballerId: string) => boolean) | null>(null);
  const promoteOrDemoteFootballerRoleCommandRef = useRef<((footballerId: string, role: import('@/game/core/football/Footballer').SquadRole) => boolean) | null>(null);
  const getLatestRivalInquiriesCommandRef = useRef<(() => readonly import('@/game/core/football/FootballMarket').RivalInquiry[]) | null>(null);
  const getAvailableHistoricalRivalsCommandRef = useRef<(() => readonly import('@/game/core/football/MatchEngine').Historical1910RivalPreset[]) | null>(null);
  const getLocalClubsCommandRef = useRef<(() => readonly import('@/game/core/club/ClubBirthEngine').LocalClubState[]) | null>(null);
  const getRegionalClubsCommandRef = useRef<(() => readonly import('@/game/core/club/RegionalClub').RegionalClubState[]) | null>(null);
  const getFederationCommandRef = useRef<(() => import('@/game/core/federation/Federation').FederationState | null) | null>(null);
  const getClubMatchHistoryCommandRef = useRef<(() => readonly import('@/game/core/football/MatchEngine').MatchRecord[]) | null>(null);
  const getLatestClubMatchCommandRef = useRef<(() => import('@/game/core/football/MatchEngine').MatchRecord | undefined) | null>(null);
  const playFriendlyMatchCommandRef = useRef<((rivalName: string, competitionType?: 'friendly' | 'festival_taça') => import('@/game/core/football/MatchEngine').MatchRecord | null) | null>(null);
  const getCompetitionsCommandRef = useRef<(() => readonly import('@/game/core/football/Competition').CompetitionState[]) | null>(null);
  const playCompetitionMatchCommandRef = useRef<((competitionId: string, fixtureId: string) => import('@/game/core/football/MatchEngine').MatchRecord | null) | null>(null);
  const getRivalriesCommandRef = useRef<(() => readonly import('@/game/core/football/RivalryRelationship').RivalryRelationship[]) | null>(null);
  const getRivalryForClubsCommandRef = useRef<((clubAId: string, clubBId: string) => import('@/game/core/football/RivalryRelationship').RivalryRelationship | undefined) | null>(null);
  const getSupporterTerritoriesCommandRef = useRef<(() => readonly import('@/game/core/football/SupporterTerritory').ClubSupporterTerritory[]) | null>(null);
  const getPressArchiveCommandRef = useRef<(() => readonly import('@/game/core/media/HistoricalPress').PressArticle[]) | null>(null);
  const getAvailableMediaOutletsCommandRef = useRef<(() => readonly import('@/game/core/media/HistoricalPress').NewspaperProfile[]) | null>(null);
  const getClubLegendsCommandRef = useRef<(() => readonly import('@/game/core/club/LegacyScore').ClubLegend[]) | null>(null);
  const getInstitutionalHonorsCommandRef = useRef<(() => readonly import('@/game/core/club/InstitutionalHonors').InstitutionalHonorProposal[]) | null>(null);
  const proposeInstitutionalHonorCommandRef = useRef<((legendId: string, honorType: import('@/game/core/club/InstitutionalHonors').HonorType) => { success: boolean; proposal?: import('@/game/core/club/InstitutionalHonors').InstitutionalHonorProposal; message: string }) | null>(null);
  const voteInstitutionalHonorCommandRef = useRef<((proposalId: string) => { success: boolean; approved: boolean; outcome: string }) | null>(null);
  const getClubTraditionProfileCommandRef = useRef<(() => import('@/game/core/club/TraditionSystem').ClubTraditionProfile | null) | null>(null);
  const getHistoricalLedgerCommandRef = useRef<(() => import('@/game/core/club/HistoricalLedger').HistoricalLedgerState) | null>(null);
  const getCausalChainForEventCommandRef = useRef<((eventId: string) => ReturnType<import('@/game/engine/GameSession').GameSession['getCausalChainForEvent']>) | null>(null);
  const getClubArchiveCommandRef = useRef<(() => import('@/game/core/club/ClubArchive').ClubArchiveData | null) | null>(null);
  const getTacaBrasil1959CommandRef = useRef<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>(null);
  const generateTacaBrasil1959CommandRef = useRef<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>(null);
  const advanceTacaBrasilCommandRef = useRef<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>(null);
  const simulateEntireTacaBrasilCommandRef = useRef<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>(null);
  const getFiftyYearsReportCommandRef = useRef<(() => import('@/game/core/club/FiftyYearsReport').FiftyYearsReportData | null) | null>(null);
  /**
   * Toolbar clicks that arrive before GameCanvas populates the command refs
   * are buffered here and drained inside `handleCommandsReady` (which
   * `GameCanvas.onCommandsReady` invokes after refs go live). Pause uses a
   * toggle COUNT — odd parity flips state, even is a no-op.
   */
  const pendingCommandsRef = useRef<{
    speed: 1 | 2 | 4 | 8 | null;
    pauseToggles: number;
  }>({ speed: null, pauseToggles: 0 });

  const handleCameraUpdate = useCallback((x: number, y: number, zoom: number) => {
    setCamera({ x, y, zoom });
  }, []);

  const handleSimUpdate = useCallback((update: TickUpdate) => {
    setSim(update);
  }, []);

  // A SELECT click sends a snapshot + anchor; a non-SELECT click sends null,
  // which dismisses the panel.
  const handleTileInspect = useCallback((info: TileInfo | null, screen: ScreenCoord) => {
    setInspect(info ? { info, anchor: screen } : null);
  }, []);

  // Dismiss the inspector panel when switching to a non-SELECT tool, so a
  // build tool (even without clicking) hides stale tile info. Shared by the
  // Toolbar and the keyboard tool-change path.
  const handleToolChange = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    if (tool !== Tool.SELECT) setInspect(null);
  }, []);

  const handleSpeedSync = useCallback((m: 1 | 2 | 4 | 8) => setSpeedMultiplier(m), []);
  const handlePauseSync = useCallback((p: boolean) => setPaused(p), []);

  const handleSpeedClick = useCallback((m: 1 | 2 | 4 | 8) => {
    if (speedCommandRef.current) {
      speedCommandRef.current(m);
    } else {
      pendingCommandsRef.current.speed = m;
    }
  }, []);

  const handlePauseClick = useCallback(() => {
    if (pauseCommandRef.current) {
      pauseCommandRef.current();
    } else {
      pendingCommandsRef.current.pauseToggles++;
    }
  }, []);

  const handleCommandsReady = useCallback(() => {
    const pending = pendingCommandsRef.current;
    if (pending.speed !== null && speedCommandRef.current) {
      speedCommandRef.current(pending.speed);
      pending.speed = null;
    }
    if (pending.pauseToggles > 0 && pauseCommandRef.current) {
      const odd = pending.pauseToggles % 2 === 1;
      pending.pauseToggles = 0;
      if (odd) pauseCommandRef.current();
    }
    if (ensureFoundingClubCommandRef.current) {
      const autoClub = ensureFoundingClubCommandRef.current();
      if (autoClub) {
        setSim((prev) => ({ ...prev, club: autoClub }));
      }
    }
  }, []);

  const labor = laborStatus({ employed: sim.employed, unemployed: sim.unemployed, jobsCapacity: sim.jobsCapacity });

  // Accumulate display-only sample history for the StatsPanel charts.
  // labor.rate (0..1) matches the happiness/congestion convention; percent formatting happens in the chart.
  const statsSamples = useStatsHistory(sim.tick, sim.population, sim.money, sim.happiness, sim.congestion, labor.rate);

  const handleNewCity = useCallback(() => {
    if (!window.confirm('Iniciar uma nova campanha? A campanha salva nesta origem será apagada.')) {
      return;
    }
    // Drop any pre-mount Toolbar pause/speed clicks so they cannot replay after the reset clears the engine's queues.
    pendingCommandsRef.current = { speed: null, pauseToggles: 0 };
    setSelectedTile(null);
    setInspect(null);
    setInterruption(null);
    setResetNonce((n) => n + 1);
  }, []);

  const handleFoundClubHere = useCallback((parcelId: string, contract: LandOccupancyContract) => {
    const seed = sim.worldSeed && sim.worldSeed.length > 0 ? sim.worldSeed : DEFAULT_WORLD_SEED;
    const rng = new CampaignRng(seed);
    const origin = 'railway';
    const identity = generateClubIdentity(origin, rng);
    const founding = generateFoundingGroup(origin, rng);

    const clubToCreate = createClub({
      id: `club-${seed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1910`,
      name: identity.name,
      shortName: identity.shortName,
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: origin,
      foundingStory: founding.foundingAta,
      colors: identity.colors,
      crestHistory: [identity.crestVersion],
      founders: founding.members.map((m) => m.id),
      parcels: [parcelId],
      facilities: ['campo-1910'],
      reputation: 15,
      contracts: [contract],
    });

    const success = foundClubWithParcelCommandRef.current?.(clubToCreate, parcelId, contract);
    if (success) {
      setSim((prev) => ({ ...prev, club: clubToCreate }));
      setInspect((prev) => (prev ? {
        ...prev,
        info: {
          ...prev.info,
          city: prev.info.city ? {
            ...prev.info.city,
            parcel: prev.info.city.parcel ? {
              ...prev.info.city.parcel,
              clubOccupancy: {
                clubName: clubToCreate.name,
                contractType: contract.type,
                grantorName: contract.grantorName,
              },
            } : null,
          } : null,
        },
      } : null));
    }
  }, [sim.worldSeed]);

  const handleFoundCustomClub = useCallback((clubToCreate: ClubState, parcelId: string, contract: LandOccupancyContract) => {
    const success = foundClubWithParcelCommandRef.current?.(clubToCreate, parcelId, contract) ?? false;
    if (success) {
      setSim((prev) => ({ ...prev, club: clubToCreate }));
      setIsClubCreationOpen(false);
      setInspect(null);
    }
    return success;
  }, []);

  const handleBuildFacility = useCallback((type: FacilityType, customName?: string) => {
    return buildFacilityCommandRef.current?.(type, customName) ?? false;
  }, []);

  const handleRepairFacility = useCallback((facilityId: string) => {
    return repairFacilityCommandRef.current?.(facilityId) ?? false;
  }, []);

  const handleAdmitMember = useCallback((
    name: string,
    category: MemberCategory,
    socialClass: 'working_class' | 'middle_class' | 'upper_class' | 'elite',
    occupation: string,
  ) => {
    return admitMemberCommandRef.current?.(name, category, socialClass, occupation) ?? false;
  }, []);

  const handleSetSquadTrainingRegime = useCallback((regime: import('@/game/core/football/Footballer').TrainingRegime) => {
    return setSquadTrainingRegimeCommandRef.current?.(regime) ?? false;
  }, []);

  const eraTheme = getEraVisualTheme(sim.date.year);

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${eraTheme.cssClass}`}>
      <div className="era-canvas-wrapper" style={{ filter: eraTheme.canvasFilter, width: '100%', height: '100%' }}>
        <GameCanvas
        onTileClick={setSelectedTile}
        onTileInspect={handleTileInspect}
        onFpsUpdate={setFps}
        onCameraUpdate={handleCameraUpdate}
        onTickUpdate={handleSimUpdate}
        currentTool={currentTool}
        onToolChange={handleToolChange}
        resetNonce={resetNonce}
        commandSpeedRef={speedCommandRef}
        commandPauseRef={pauseCommandRef}
        commandAcknowledgeInterruptionRef={acknowledgeInterruptionCommandRef}
        commandFocusLatestGrowthRef={focusLatestGrowthCommandRef}
        commandFocusLatestTransformationRef={focusLatestTransformationCommandRef}
        commandFocusClubGroundRef={focusClubGroundCommandRef}
        commandFoundClubWithParcelRef={foundClubWithParcelCommandRef}
        commandGetCityParcelsRef={getCityParcelsCommandRef}
        commandEnsureFoundingClubRef={ensureFoundingClubCommandRef}
        commandBuildFacilityRef={buildFacilityCommandRef}
        commandRepairFacilityRef={repairFacilityCommandRef}
        commandAdmitMemberRef={admitMemberCommandRef}
        commandGetPersonRef={getPersonCommandRef}
        commandGetFamilyTreeRef={getFamilyTreeCommandRef}
        commandGetUrbanDemographicsRef={getUrbanDemographicsCommandRef}
        commandGetElectionCandidatesRef={getElectionCandidatesCommandRef}
        commandHoldClubElectionRef={holdClubElectionCommandRef}
        commandGetFootballSquadRef={getFootballSquadCommandRef}
        commandSetSquadTrainingRegimeRef={setSquadTrainingRegimeCommandRef}
        commandGetClubAthleticsPolicyRef={getClubAthleticsPolicyCommandRef}
        commandSetClubAthleticsPolicyRef={setClubAthleticsPolicyCommandRef}
        commandGetAvailableLocalProspectsRef={getAvailableLocalProspectsCommandRef}
        commandInviteProspectToClubRef={inviteProspectToClubCommandRef}
        commandReleaseFootballerFromSquadRef={releaseFootballerFromSquadCommandRef}
        commandPromoteOrDemoteFootballerRoleRef={promoteOrDemoteFootballerRoleCommandRef}
        commandGetLatestRivalInquiriesRef={getLatestRivalInquiriesCommandRef}
        commandGetAvailableHistoricalRivalsRef={getAvailableHistoricalRivalsCommandRef}
        commandGetLocalClubsRef={getLocalClubsCommandRef}
        commandGetRegionalClubsRef={getRegionalClubsCommandRef}
        commandGetFederationRef={getFederationCommandRef}
        commandGetClubMatchHistoryRef={getClubMatchHistoryCommandRef}
        commandGetLatestClubMatchRef={getLatestClubMatchCommandRef}
        commandPlayFriendlyMatchRef={playFriendlyMatchCommandRef}
        commandGetCompetitionsRef={getCompetitionsCommandRef}
        commandPlayCompetitionMatchRef={playCompetitionMatchCommandRef}
        commandGetRivalriesRef={getRivalriesCommandRef}
        commandGetRivalryForClubsRef={getRivalryForClubsCommandRef}
        commandGetSupporterTerritoriesRef={getSupporterTerritoriesCommandRef}
        commandGetPressArchiveRef={getPressArchiveCommandRef}
        commandGetAvailableMediaOutletsRef={getAvailableMediaOutletsCommandRef}
        commandGetClubLegendsRef={getClubLegendsCommandRef}
        commandGetInstitutionalHonorsRef={getInstitutionalHonorsCommandRef}
        commandProposeInstitutionalHonorRef={proposeInstitutionalHonorCommandRef}
        commandVoteInstitutionalHonorRef={voteInstitutionalHonorCommandRef}
        commandGetClubTraditionProfileRef={getClubTraditionProfileCommandRef}
        commandGetHistoricalLedgerRef={getHistoricalLedgerCommandRef}
        commandGetCausalChainForEventRef={getCausalChainForEventCommandRef}
        commandGetClubArchiveRef={getClubArchiveCommandRef}
        commandGetTacaBrasil1959Ref={getTacaBrasil1959CommandRef}
        commandGenerateTacaBrasil1959Ref={generateTacaBrasil1959CommandRef}
        commandAdvanceTacaBrasilRef={advanceTacaBrasilCommandRef}
        commandSimulateEntireTacaBrasilRef={simulateEntireTacaBrasilCommandRef}
        commandGetFiftyYearsReportRef={getFiftyYearsReportCommandRef}
        onCommandsReady={handleCommandsReady}
        onSpeedChange={handleSpeedSync}
        onPauseChange={handlePauseSync}
        onInterruption={setInterruption}
        dataView={dataView}
      />
      </div>
      <GameHUD
        worldSeed={sim.worldSeed}
        club={sim.club}
        citySummary={sim.citySummary}
        onOpenClubCreation={() => setIsClubCreationOpen(true)}
        onOpenTitleScreen={() => setIsTitleScreenOpen(true)}
        requestedClubTab={requestedClubTab}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenDevInspector={() => setIsDevInspectorOpen(true)}
        onEnsureFoundingClub={() => {
          const c = ensureFoundingClubCommandRef.current?.();
          if (c) setSim((prev) => ({ ...prev, club: c }));
          return c ?? null;
        }}
        onNewCity={handleNewCity}
        onMenuOpen={() => setInspect(null)}
        onFocusLatestGrowth={() => focusLatestGrowthCommandRef.current?.()}
        onFocusLatestTransformation={() => focusLatestTransformationCommandRef.current?.()}
        onFocusClubGround={() => focusClubGroundCommandRef.current?.()}
        onBuildFacility={handleBuildFacility}
        onRepairFacility={handleRepairFacility}
        onAdmitMember={handleAdmitMember}
        onGetPerson={(id) => getPersonCommandRef.current?.(id)}
        onGetFamilyTree={(id) => getFamilyTreeCommandRef.current?.(id)}
        onGetUrbanDemographics={() => getUrbanDemographicsCommandRef.current?.()}
        onGetElectionCandidates={() => getElectionCandidatesCommandRef.current?.() ?? []}
        onHoldClubElection={(candId) => holdClubElectionCommandRef.current?.(candId) ?? null}
        onGetFootballSquad={() => getFootballSquadCommandRef.current?.()}
        onSetSquadTrainingRegime={handleSetSquadTrainingRegime}
        onGetClubAthleticsPolicy={() => getClubAthleticsPolicyCommandRef.current?.()}
        onSetClubAthleticsPolicy={(tier) => setClubAthleticsPolicyCommandRef.current?.(tier) ?? false}
        onGetAvailableLocalProspects={() => getAvailableLocalProspectsCommandRef.current?.() ?? []}
        onInviteProspectToClub={(personId, pos, role) => inviteProspectToClubCommandRef.current?.(personId, pos, role) ?? { success: false, message: 'Indisponível' }}
        onReleaseFootballerFromSquad={(id) => releaseFootballerFromSquadCommandRef.current?.(id) ?? false}
        onPromoteOrDemoteFootballerRole={(id, role) => promoteOrDemoteFootballerRoleCommandRef.current?.(id, role) ?? false}
        onGetLatestRivalInquiries={() => getLatestRivalInquiriesCommandRef.current?.() ?? []}
        onGetAvailableHistoricalRivals={() => getAvailableHistoricalRivalsCommandRef.current?.() ?? []}
        onGetLocalClubs={() => getLocalClubsCommandRef.current?.() ?? []}
        onGetRegionalClubs={() => getRegionalClubsCommandRef.current?.() ?? []}
        onGetFederation={() => getFederationCommandRef.current?.() ?? null}
        onGetClubMatchHistory={() => getClubMatchHistoryCommandRef.current?.() ?? []}
        onGetLatestClubMatch={() => getLatestClubMatchCommandRef.current?.()}
        onPlayFriendlyMatch={(rivalName, compType) => {
          const res = playFriendlyMatchCommandRef.current?.(rivalName, compType) ?? null;
          if (res) setActiveMatchRecord(res);
          return res;
        }}
        onGetCompetitions={() => getCompetitionsCommandRef.current?.() ?? []}
        onPlayCompetitionMatch={(compId, fixId) => {
          const res = playCompetitionMatchCommandRef.current?.(compId, fixId) ?? null;
          if (res) setActiveMatchRecord(res);
          return res;
        }}
        onGetRivalries={() => getRivalriesCommandRef.current?.() ?? []}
        onGetRivalryForClubs={(a, b) => getRivalryForClubsCommandRef.current?.(a, b)}
        onGetSupporterTerritories={() => getSupporterTerritoriesCommandRef.current?.() ?? []}
        onGetPressArchive={() => getPressArchiveCommandRef.current?.() ?? []}
        onGetAvailableMediaOutlets={() => getAvailableMediaOutletsCommandRef.current?.() ?? []}
        onGetClubLegends={() => getClubLegendsCommandRef.current?.() ?? []}
        onGetInstitutionalHonors={() => getInstitutionalHonorsCommandRef.current?.() ?? []}
        onProposeInstitutionalHonor={(legendId, honorType) => proposeInstitutionalHonorCommandRef.current?.(legendId, honorType) ?? { success: false, message: 'Indisponível' }}
        onVoteInstitutionalHonor={(proposalId) => voteInstitutionalHonorCommandRef.current?.(proposalId) ?? { success: false, approved: false, outcome: 'Indisponível' }}
        onGetClubTraditionProfile={() => getClubTraditionProfileCommandRef.current?.() ?? null}
        onGetHistoricalLedger={() => getHistoricalLedgerCommandRef.current?.() ?? { events: [] }}
        onGetCausalChainForEvent={(eventId) => getCausalChainForEventCommandRef.current?.(eventId) ?? { rootCauses: [], downstreamConsequences: [] }}
        onGetClubArchive={() => getClubArchiveCommandRef.current?.() ?? null}
        onGetTacaBrasil1959={() => getTacaBrasil1959CommandRef.current?.() ?? null}
        onGenerateTacaBrasil1959={() => generateTacaBrasil1959CommandRef.current?.() ?? null}
        onAdvanceTacaBrasil={() => advanceTacaBrasilCommandRef.current?.() ?? null}
        onSimulateEntireTacaBrasil={() => simulateEntireTacaBrasilCommandRef.current?.() ?? null}
        onGetFiftyYearsReport={() => getFiftyYearsReportCommandRef.current?.() ?? null}
        selectedTile={selectedTile}

        fps={fps}
        cameraX={camera.x}
        cameraY={camera.y}
        cameraZoom={camera.zoom}
        tick={sim.tick}
        dirt={sim.dirt}
        population={sim.population}
        money={sim.money}
        date={sim.date}
        demand={sim.demand}
        happiness={sim.happiness}
        currentTool={currentTool}
        speedMultiplier={speedMultiplier}
        paused={paused}
        statsSamples={statsSamples}
        labor={labor}
        cityGrowth={sim.cityGrowth}
        cityTransformation={sim.cityTransformation}
        dataView={dataView}
        onDataViewChange={setDataView}
      />
      <TileInfoPanel
        info={inspect?.info ?? null}
        anchor={inspect?.anchor ?? null}
        club={sim.club}
        onFoundClubHere={handleFoundClubHere}
        onClose={() => setInspect(null)}
      />
      <Toolbar
        currentTool={currentTool}
        onToolChange={handleToolChange}
        paused={paused}
        speedMultiplier={speedMultiplier}
        onPauseToggle={handlePauseClick}
        onSpeedChange={handleSpeedClick}
      />
      <ClubCreationModal
        isOpen={isClubCreationOpen}
        onClose={() => setIsClubCreationOpen(false)}
        worldSeed={sim.worldSeed}
        parcels={getCityParcelsCommandRef.current?.() ?? []}
        onFoundClub={handleFoundCustomClub}
        currentClub={sim.club}
      />
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        currentFps={fps}
      />
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        onOpenClubCreation={() => setIsClubCreationOpen(true)}
      />
      <DevInspectorModal
        isOpen={isDevInspectorOpen}
        onClose={() => setIsDevInspectorOpen(false)}
        worldSeed={sim.worldSeed}
        currentYear={sim.date.year}
      />
      <MatchScoreboardModal
        match={activeMatchRecord}
        onClose={() => setActiveMatchRecord(null)}
        protagonistClub={sim.club}
      />
      <div className="arcade-scanlines" aria-hidden="true" />
      {/* DIÁRIO DO FUNDADOR & MISSÕES HISTÓRICAS (GAMEPLAY LOOP) */}
      {!isTitleScreenOpen && (
        <FounderQuestPanel
          club={sim.club}
          currentYear={sim.date.year}
          matchCount={getClubMatchHistoryCommandRef.current?.()?.length ?? 0}
          memberCount={sim.club?.membership?.members?.length ?? 0}
          facilityCount={sim.club?.facilityDetails?.length ?? 0}
          hasTrophy={(sim.club?.trophies?.length ?? 0) > 0}
          onOpenMatches={() => handleRequestClubTab('matches')}
          onOpenFacilities={() => handleRequestClubTab('facilities')}
          onOpenFootball={() => handleRequestClubTab('football')}
          onOpenMembers={() => handleRequestClubTab('members')}
          onOpenCompetitions={() => handleRequestClubTab('competitions')}
          onOpenTacaBrasil={() => handleRequestClubTab('competitions')}
        />
      )}
      {/* TELETIPO HISTÓRICO DA CIDADE DE MINAS */}
      {!isTitleScreenOpen && (
        <CityNewsTeletype
          date={sim.date}
          onOpenArchive={() => handleRequestClubTab('archive')}
        />
      )}
      {/* TELA DE ABERTURA RETRO ARCADE (TITLE SCREEN) */}
      {isTitleScreenOpen && (
        <TitleScreen
          club={sim.club}
          worldSeed={sim.worldSeed}
          currentYear={sim.date.year}
          onStartNewClub={() => {
            setIsTitleScreenOpen(false);
            setIsClubCreationOpen(true);
          }}
          onContinueGame={() => setIsTitleScreenOpen(false)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenBenchmark={() => setIsBenchmarkOpen(true)}
          onOpenDevInspector={() => setIsDevInspectorOpen(true)}
        />
      )}
      {interruption && (
        <section
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(440px, calc(100vw - 32px))',
            padding: '16px',
            border: '2px solid rgba(224, 170, 56, 0.95)',
            borderRadius: '8px',
            backgroundColor: 'rgba(24, 20, 14, 0.95)',
            color: 'white',
            fontFamily: 'monospace',
            zIndex: 1100,
          }}
        >
          <div style={{ opacity: 0.7, fontSize: '12px', textTransform: 'uppercase' }}>
            {interruption.kind.replaceAll('_', ' ')} · {String(interruption.date.day).padStart(2, '0')}/{String(interruption.date.month).padStart(2, '0')}/{interruption.date.year}
          </div>
          <h2 style={{ margin: '8px 0', fontSize: '18px' }}>{interruption.title}</h2>
          {interruption.description && <p style={{ margin: '0 0 12px', lineHeight: 1.4 }}>{interruption.description}</p>}
          <button
            onClick={() => acknowledgeInterruptionCommandRef.current?.()}
            style={{
              padding: '6px 12px',
              border: '1px solid rgba(224, 170, 56, 0.95)',
              borderRadius: '4px',
              backgroundColor: 'rgba(90, 68, 20, 0.9)',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Acknowledge
          </button>
        </section>
      )}
    </div>
  );
}
