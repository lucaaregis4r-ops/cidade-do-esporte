'use client';

/**
 * GameCanvas component: thin React shell that mounts/disposes a GameSession
 *
 * React StrictMode Safety:
 * - useEffect cleanup disposes the GameSession (GameSession's disposed flag
 *   discards an in-flight async init)
 * - sessionRef prevents double-initialization
 */

import { useEffect, useRef, useState } from 'react';
import { GameSession } from '@/game/engine';
import type { TileInfo, TickUpdate } from '@/game/engine';
import { Tool } from '@/game/tools';
import type { DataView } from '@/game/render/dataView';
import type { TileCoord, ScreenCoord } from '@/game/types/coordinates';
import type { Interruption } from '@/game/core/InterruptionQueue';
import type { ClubState } from '@/game/core/club/Club';
import type { LandOccupancyContract } from '@/game/core/club/ClubLandContract';
import type { FacilityType } from '@/game/core/club/ClubFacilities';
import type { MemberCategory } from '@/game/core/club/ClubMembers';

export interface GameCanvasProps {
  onTileHover?: (tile: TileCoord | null) => void;
  onTileClick: (tile: TileCoord) => void;
  /** SELECT-click tile snapshot (null when a non-SELECT tool clicks); `screen` anchors the panel. */
  onTileInspect?: (info: TileInfo | null, screen: ScreenCoord) => void;
  onFpsUpdate: (fps: number) => void;
  onCameraUpdate: (x: number, y: number, zoom: number) => void;
  onTickUpdate?: (update: TickUpdate) => void;
  currentTool?: Tool;
  onToolChange?: (tool: Tool) => void;
  /** Bump to trigger a "New City" reset on the live session. */
  resetNonce?: number;
  /** Engine → React mirror callback for the authoritative speed tier. */
  onSpeedChange?: (multiplier: 1 | 2 | 4 | 8) => void;
  /** Engine → React mirror callback for the authoritative paused flag. */
  onPauseChange?: (paused: boolean) => void;
  /** Engine → React notification for the interruption currently requiring attention. */
  onInterruption?: (interruption: Interruption | null) => void;
  /** Page-supplied ref; GameCanvas populates with a speed commander after mount. */
  commandSpeedRef?: React.RefObject<((m: 1 | 2 | 4 | 8) => void) | null>;
  /** Page-supplied ref; GameCanvas populates with a pause-toggle commander after mount. */
  commandPauseRef?: React.RefObject<(() => void) | null>;
  /** Page-supplied ref for acknowledging the current interruption. */
  commandAcknowledgeInterruptionRef?: React.RefObject<(() => void) | null>;
  /** Read-only camera command for the latest saved B14 occupation. */
  commandFocusLatestGrowthRef?: React.RefObject<(() => void) | null>;
  /** Read-only camera command for the latest saved B15 transformation. */
  commandFocusLatestTransformationRef?: React.RefObject<(() => void) | null>;
  /** Command to center camera on the club's official ground and stadium. */
  commandFocusClubGroundRef?: React.RefObject<(() => import('@/game/types/coordinates').TileCoord | null) | null>;
  /** Command for founding a club with an initial occupied parcel. */
  commandFoundClubWithParcelRef?: React.RefObject<((club: ClubState, parcelId: string, contract: LandOccupancyContract) => boolean) | null>;
  /** Command for getting 1910 city parcels. */
  commandGetCityParcelsRef?: React.RefObject<(() => readonly import('@/game/core/city/cityParcels').CityParcel[]) | null>;
  /** Command for ensuring the protagonist club is founded. */
  commandEnsureFoundingClubRef?: React.RefObject<(() => ClubState | null) | null>;
  /** Command for building a new club facility. */
  commandBuildFacilityRef?: React.RefObject<((type: FacilityType, customName?: string) => boolean) | null>;
  /** Command for repairing a club facility. */
  commandRepairFacilityRef?: React.RefObject<((facilityId: string) => boolean) | null>;
  /** Command for admitting a new club member. */
  commandAdmitMemberRef?: React.RefObject<((name: string, category: MemberCategory, socialClass: 'working_class' | 'middle_class' | 'upper_class' | 'elite', occupation: string) => boolean) | null>;
  /** Command for getting a materialized Person by ID. */
  commandGetPersonRef?: React.RefObject<((id: string) => import('@/game/core/person/Person').Person | undefined) | null>;
  /** Command for getting a Person's full family tree by ID. */
  commandGetFamilyTreeRef?: React.RefObject<((id: string) => import('@/game/core/person/PersonRegistry').FamilyTreeNode | undefined) | null>;
  /** Command for getting the current 3-layer urban demographics snapshot (L0, L1, L2). */
  commandGetUrbanDemographicsRef?: React.RefObject<(() => import('@/game/core/club/PopulationLayers').UrbanDemographicsSnapshot | undefined) | null>;
  /** Command for getting election candidates. */
  commandGetElectionCandidatesRef?: React.RefObject<(() => readonly import('@/game/core/club/ClubElections').ElectionCandidate[]) | null>;
  /** Command for holding a statutory club election. */
  commandHoldClubElectionRef?: React.RefObject<((playerVotedCandidateId?: string) => import('@/game/core/club/ClubElections').ClubElectionEvent | null) | null>;
  /** Command for getting current football squad. */
  commandGetFootballSquadRef?: React.RefObject<(() => import('@/game/core/football/Footballer').FootballSquadState | undefined) | null>;
  /** Command for updating active football training regime. */
  commandSetSquadTrainingRegimeRef?: React.RefObject<((regime: import('@/game/core/football/Footballer').TrainingRegime) => boolean) | null>;
  /** Command for getting club athletics policy state. */
  commandGetClubAthleticsPolicyRef?: React.RefObject<(() => import('@/game/core/football/FootballMarket').ClubAthleticsPolicyState | undefined) | null>;
  /** Command for setting club athletics policy tier. */
  commandSetClubAthleticsPolicyRef?: React.RefObject<((tier: import('@/game/core/football/FootballMarket').ClubPolicyTier) => boolean) | null>;
  /** Command for getting available local prospects in city. */
  commandGetAvailableLocalProspectsRef?: React.RefObject<(() => readonly import('@/game/core/person/Person').Person[]) | null>;
  /** Command for inviting a prospect to the squad. */
  commandInviteProspectToClubRef?: React.RefObject<((personId: string, position: import('@/game/core/football/Footballer').HistoricalPosition, role: import('@/game/core/football/Footballer').SquadRole) => { success: boolean; message: string }) | null>;
  /** Command for releasing a footballer from squad. */
  commandReleaseFootballerFromSquadRef?: React.RefObject<((footballerId: string) => boolean) | null>;
  /** Command for promoting or demoting a footballer between starters and reserves. */
  commandPromoteOrDemoteFootballerRoleRef?: React.RefObject<((footballerId: string, role: import('@/game/core/football/Footballer').SquadRole) => boolean) | null>;
  /** Command for getting latest rival inquiries. */
  commandGetLatestRivalInquiriesRef?: React.RefObject<(() => readonly import('@/game/core/football/FootballMarket').RivalInquiry[]) | null>;
  /** Command for getting available historical rival presets for matches. */
  commandGetAvailableHistoricalRivalsRef?: React.RefObject<(() => readonly import('@/game/core/football/MatchEngine').Historical1910RivalPreset[]) | null>;
  /** Command for getting active local clubs in Cidade de Minas (Alpha F). */
  commandGetLocalClubsRef?: React.RefObject<(() => readonly import('@/game/core/club/ClubBirthEngine').LocalClubState[]) | null>;
  /** Command for getting regional interior clubs in Minas Gerais (Alpha F). */
  commandGetRegionalClubsRef?: React.RefObject<(() => readonly import('@/game/core/club/RegionalClub').RegionalClubState[]) | null>;
  /** Command for getting federation state (Alpha F). */
  commandGetFederationRef?: React.RefObject<(() => import('@/game/core/federation/Federation').FederationState | null) | null>;
  /** Command for getting club match history. */
  commandGetClubMatchHistoryRef?: React.RefObject<(() => readonly import('@/game/core/football/MatchEngine').MatchRecord[]) | null>;
  /** Command for getting latest match. */
  commandGetLatestClubMatchRef?: React.RefObject<(() => import('@/game/core/football/MatchEngine').MatchRecord | undefined) | null>;
  /** Command for scheduling and playing a friendly match or festival. */
  commandPlayFriendlyMatchRef?: React.RefObject<((rivalName: string, competitionType?: 'friendly' | 'festival_taça') => import('@/game/core/football/MatchEngine').MatchRecord | null) | null>;
  /** Command for getting annual competitions. */
  commandGetCompetitionsRef?: React.RefObject<(() => readonly import('@/game/core/football/Competition').CompetitionState[]) | null>;
  /** Command for playing a scheduled competition fixture. */
  commandPlayCompetitionMatchRef?: React.RefObject<((competitionId: string, fixtureId: string) => import('@/game/core/football/MatchEngine').MatchRecord | null) | null>;
  /** Command for getting all rivalry relationships. */
  commandGetRivalriesRef?: React.RefObject<(() => readonly import('@/game/core/football/RivalryRelationship').RivalryRelationship[]) | null>;
  /** Command for getting rivalry relationship between two clubs. */
  commandGetRivalryForClubsRef?: React.RefObject<((clubAId: string, clubBId: string) => import('@/game/core/football/RivalryRelationship').RivalryRelationship | undefined) | null>;
  /** Command for getting club supporter territorial distribution by district. */
  commandGetSupporterTerritoriesRef?: React.RefObject<(() => readonly import('@/game/core/football/SupporterTerritory').ClubSupporterTerritory[]) | null>;
  /** Command for getting the 1910 historical press archive. */
  commandGetPressArchiveRef?: React.RefObject<(() => readonly import('@/game/core/media/HistoricalPress').PressArticle[]) | null>;
  /** Command for getting period available media outlets. */
  commandGetAvailableMediaOutletsRef?: React.RefObject<(() => readonly import('@/game/core/media/HistoricalPress').NewspaperProfile[]) | null>;
  /** Command for getting club legends and historical figures. */
  commandGetClubLegendsRef?: React.RefObject<(() => readonly import('@/game/core/club/LegacyScore').ClubLegend[]) | null>;
  /** Command for getting institutional honor proposals. */
  commandGetInstitutionalHonorsRef?: React.RefObject<(() => readonly import('@/game/core/club/InstitutionalHonors').InstitutionalHonorProposal[]) | null>;
  /** Command for submitting an institutional honor proposal. */
  commandProposeInstitutionalHonorRef?: React.RefObject<((legendId: string, honorType: import('@/game/core/club/InstitutionalHonors').HonorType) => { success: boolean; proposal?: import('@/game/core/club/InstitutionalHonors').InstitutionalHonorProposal; message: string }) | null>;
  /** Command for voting on an institutional honor proposal. */
  commandVoteInstitutionalHonorRef?: React.RefObject<((proposalId: string) => { success: boolean; approved: boolean; outcome: string }) | null>;
  /** Command for getting the club tradition profile. */
  commandGetClubTraditionProfileRef?: React.RefObject<(() => import('@/game/core/club/TraditionSystem').ClubTraditionProfile | null) | null>;
  /** Command for getting the club causal historical ledger. */
  commandGetHistoricalLedgerRef?: React.RefObject<(() => import('@/game/core/club/HistoricalLedger').HistoricalLedgerState) | null>;
  /** Command for getting the causal chain of an event. */
  commandGetCausalChainForEventRef?: React.RefObject<((eventId: string) => ReturnType<import('@/game/engine/GameSession').GameSession['getCausalChainForEvent']>) | null>;
  /** Command for getting the 50-year club archive. */
  commandGetClubArchiveRef?: React.RefObject<(() => import('@/game/core/club/ClubArchive').ClubArchiveData | null) | null>;
  /** Command for getting Taça Brasil 1959 tournament. */
  commandGetTacaBrasil1959Ref?: React.RefObject<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>;
  /** Command for generating Taça Brasil 1959 tournament. */
  commandGenerateTacaBrasil1959Ref?: React.RefObject<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>;
  /** Command for advancing Taça Brasil 1959 tournament. */
  commandAdvanceTacaBrasilRef?: React.RefObject<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>;
  /** Command for simulating entire Taça Brasil 1959 tournament. */
  commandSimulateEntireTacaBrasilRef?: React.RefObject<(() => import('@/game/core/football/TacaBrasil1959').TacaBrasilTournament | null) | null>;
  /** Command for getting the 50-year jubilee report (1910–1959). */
  commandGetFiftyYearsReportRef?: React.RefObject<(() => import('@/game/core/club/FiftyYearsReport').FiftyYearsReportData | null) | null>;
  /** Fires AFTER commandSpeedRef/commandPauseRef are populated, so the page can drain any pre-mount Toolbar clicks. */
  onCommandsReady?: () => void;
  /** Controlled overlay view; synced to the engine on mount and on every change. */
  dataView?: DataView;
}

export function GameCanvas({
  onTileHover,
  onTileClick,
  onTileInspect,
  onFpsUpdate,
  onCameraUpdate,
  onTickUpdate,
  currentTool = Tool.SELECT,
  onToolChange,
  resetNonce = 0,
  onSpeedChange,
  onPauseChange,
  onInterruption,
  commandSpeedRef,
  commandPauseRef,
  commandAcknowledgeInterruptionRef,
  commandFocusLatestGrowthRef,
  commandFocusLatestTransformationRef,
  commandFocusClubGroundRef,
  commandFoundClubWithParcelRef,
  commandGetCityParcelsRef,
  commandEnsureFoundingClubRef,
  commandBuildFacilityRef,
  commandRepairFacilityRef,
  commandAdmitMemberRef,
  commandGetPersonRef,
  commandGetFamilyTreeRef,
  commandGetUrbanDemographicsRef,
  commandGetElectionCandidatesRef,
  commandHoldClubElectionRef,
  commandGetFootballSquadRef,
  commandSetSquadTrainingRegimeRef,
  commandGetClubAthleticsPolicyRef,
  commandSetClubAthleticsPolicyRef,
  commandGetAvailableLocalProspectsRef,
  commandInviteProspectToClubRef,
  commandReleaseFootballerFromSquadRef,
  commandPromoteOrDemoteFootballerRoleRef,
  commandGetLatestRivalInquiriesRef,
  commandGetAvailableHistoricalRivalsRef,
  commandGetLocalClubsRef,
  commandGetRegionalClubsRef,
  commandGetFederationRef,
  commandGetClubMatchHistoryRef,
  commandGetLatestClubMatchRef,
  commandPlayFriendlyMatchRef,
  commandGetCompetitionsRef,
  commandPlayCompetitionMatchRef,
  commandGetRivalriesRef,
  commandGetRivalryForClubsRef,
  commandGetSupporterTerritoriesRef,
  commandGetPressArchiveRef,
  commandGetAvailableMediaOutletsRef,
  commandGetClubLegendsRef,
  commandGetInstitutionalHonorsRef,
  commandProposeInstitutionalHonorRef,
  commandVoteInstitutionalHonorRef,
  commandGetClubTraditionProfileRef,
  commandGetHistoricalLedgerRef,
  commandGetCausalChainForEventRef,
  commandGetClubArchiveRef,
  commandGetTacaBrasil1959Ref,
  commandGenerateTacaBrasil1959Ref,
  commandAdvanceTacaBrasilRef,
  commandSimulateEntireTacaBrasilRef,
  commandGetFiftyYearsReportRef,
  onCommandsReady,
  dataView = 'none',
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [persistenceNotice, setPersistenceNotice] = useState<string | null>(null);
  const sessionRef = useRef<GameSession | null>(null);

  // Latest prop callbacks, refreshed every render so stable forwarders below
  // always reach the current callbacks without recreating the session.
  const callbacksRef = useRef({
    onTileHover,
    onTileClick,
    onTileInspect,
    onFpsUpdate,
    onCameraUpdate,
    onTickUpdate,
    onToolChange,
    onSpeedChange,
    onPauseChange,
    onInterruption,
  });

  // Stable forwarders: identity never changes; read callbacksRef at call time.
  const stableForwarders = useRef({
    onPersistenceNotice: (notice: string | null) => setPersistenceNotice(notice),
    onTileHover: (t: TileCoord | null) => callbacksRef.current.onTileHover?.(t),
    onTileClick: (t: TileCoord) => callbacksRef.current.onTileClick(t),
    onTileInspect: (info: TileInfo | null, screen: ScreenCoord) =>
      callbacksRef.current.onTileInspect?.(info, screen),
    onFpsUpdate: (fps: number) => callbacksRef.current.onFpsUpdate(fps),
    onCameraUpdate: (x: number, y: number, zoom: number) =>
      callbacksRef.current.onCameraUpdate(x, y, zoom),
    onTickUpdate: (update: TickUpdate) => callbacksRef.current.onTickUpdate?.(update),
    onToolChange: (tool: Tool) => callbacksRef.current.onToolChange?.(tool),
    onSpeedChange: (multiplier: 1 | 2 | 4 | 8) => callbacksRef.current.onSpeedChange?.(multiplier),
    onPauseChange: (paused: boolean) => callbacksRef.current.onPauseChange?.(paused),
    onInterruption: (interruption: Interruption | null) => callbacksRef.current.onInterruption?.(interruption),
  });

  // Track current tool so the mount effect can read the initial tool without
  // closing over `currentTool` (avoids an exhaustive-deps warning).
  const currentToolRef = useRef(currentTool);
  // Track current data view so the mount effect can read the initial view
  // without closing over `dataView` (mirrors currentToolRef pattern).
  const dataViewRef = useRef(dataView);

  // Refresh refs after every commit (no deps array). Declared before the
  // mount effect so refs are current when the mount effect first reads them.
  useEffect(() => {
    callbacksRef.current = {
      onTileHover,
      onTileClick,
      onTileInspect,
      onFpsUpdate,
      onCameraUpdate,
      onTickUpdate,
      onToolChange,
      onSpeedChange,
      onPauseChange,
      onInterruption,
    };
    currentToolRef.current = currentTool;
    dataViewRef.current = dataView;
  });

  // Sync external tool changes to the session (subsequent changes only;
  // the mount effect already did the initial sync).
  useEffect(() => {
    sessionRef.current?.setTool(currentTool);
  }, [currentTool]);

  // Sync data-view changes to the session (subsequent changes only;
  // the mount effect + start() flush cover the initial sync).
  useEffect(() => {
    sessionRef.current?.setDataView(dataView);
  }, [dataView]);

  // "New City": run on bump only, never on the initial mount (which would
  // wipe the just-hydrated save).
  const resetMounted = useRef(false);
  useEffect(() => {
    if (!resetMounted.current) {
      resetMounted.current = true;
      return;
    }
    sessionRef.current?.resetWorld();
  }, [resetNonce]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double initialization in StrictMode
    if (sessionRef.current) return;

    const container = containerRef.current;

    const session = new GameSession(stableForwarders.current);
    sessionRef.current = session;
    // Apply a non-default initial tool even if the [currentTool] effect's
    // first run preceded sessionRef.current being set.
    session.setTool(currentToolRef.current);
    // Buffer the initial data-view so start() can flush it to PixiApp once
    // init() resolves (pixiApp is null at this point in the mount sequence).
    session.setDataView(dataViewRef.current);
    if (commandSpeedRef) {
      commandSpeedRef.current = (m) => sessionRef.current?.setSpeedMultiplier(m);
    }
    if (commandPauseRef) {
      commandPauseRef.current = () => sessionRef.current?.togglePaused();
    }
    if (commandAcknowledgeInterruptionRef) {
      commandAcknowledgeInterruptionRef.current = () => sessionRef.current?.acknowledgeInterruption();
    }
    if (commandFocusLatestGrowthRef) {
      commandFocusLatestGrowthRef.current = () => sessionRef.current?.focusLatestCityDevelopment();
    }
    if (commandFocusLatestTransformationRef) {
      commandFocusLatestTransformationRef.current = () => sessionRef.current?.focusLatestCityTransformation();
    }
    if (commandFocusClubGroundRef) {
      commandFocusClubGroundRef.current = () => sessionRef.current?.focusClubGround() ?? null;
    }
    if (commandFoundClubWithParcelRef) {
      commandFoundClubWithParcelRef.current = (club, parcelId, contract) =>
        sessionRef.current?.foundClubWithParcel(club, parcelId, contract) ?? false;
    }
    if (commandGetCityParcelsRef) {
      commandGetCityParcelsRef.current = () =>
        sessionRef.current?.getCityParcels() ?? [];
    }
    if (commandEnsureFoundingClubRef) {
      commandEnsureFoundingClubRef.current = () =>
        sessionRef.current?.ensureFoundingClub() ?? null;
    }
    if (commandBuildFacilityRef) {
      commandBuildFacilityRef.current = (type, customName) =>
        sessionRef.current?.buildClubFacility(type, customName) ?? false;
    }
    if (commandRepairFacilityRef) {
      commandRepairFacilityRef.current = (facilityId) =>
        sessionRef.current?.repairClubFacility(facilityId) ?? false;
    }
    if (commandAdmitMemberRef) {
      commandAdmitMemberRef.current = (name, category, socialClass, occupation) =>
        sessionRef.current?.admitClubMember(name, category, socialClass, occupation) ?? false;
    }
    if (commandGetPersonRef) {
      commandGetPersonRef.current = (id: string) => sessionRef.current?.getPerson(id);
    }
    if (commandGetFamilyTreeRef) {
      commandGetFamilyTreeRef.current = (id: string) => sessionRef.current?.getFamilyTree(id);
    }
    if (commandGetUrbanDemographicsRef) {
      commandGetUrbanDemographicsRef.current = () => sessionRef.current?.getUrbanDemographics();
    }
    if (commandGetElectionCandidatesRef) {
      commandGetElectionCandidatesRef.current = () => sessionRef.current?.getElectionCandidates() ?? [];
    }
    if (commandHoldClubElectionRef) {
      commandHoldClubElectionRef.current = (playerVotedCandidateId?: string) =>
        sessionRef.current?.holdClubElection(playerVotedCandidateId) ?? null;
    }
    if (commandGetFootballSquadRef) {
      commandGetFootballSquadRef.current = () => sessionRef.current?.getFootballSquad();
    }
    if (commandSetSquadTrainingRegimeRef) {
      commandSetSquadTrainingRegimeRef.current = (regime) =>
        sessionRef.current?.setSquadTrainingRegime(regime) ?? false;
    }
    if (commandGetClubAthleticsPolicyRef) {
      commandGetClubAthleticsPolicyRef.current = () => sessionRef.current?.getClubAthleticsPolicy();
    }
    if (commandSetClubAthleticsPolicyRef) {
      commandSetClubAthleticsPolicyRef.current = (tier) =>
        sessionRef.current?.setClubAthleticsPolicy(tier) ?? false;
    }
    if (commandGetAvailableLocalProspectsRef) {
      commandGetAvailableLocalProspectsRef.current = () =>
        sessionRef.current?.getAvailableLocalProspects() ?? [];
    }
    if (commandInviteProspectToClubRef) {
      commandInviteProspectToClubRef.current = (personId, position, role) =>
        sessionRef.current?.inviteProspectToClub(personId, position, role) ?? { success: false, message: 'Indisponível' };
    }
    if (commandReleaseFootballerFromSquadRef) {
      commandReleaseFootballerFromSquadRef.current = (footballerId) =>
        sessionRef.current?.releaseFootballerFromSquad(footballerId) ?? false;
    }
    if (commandPromoteOrDemoteFootballerRoleRef) {
      commandPromoteOrDemoteFootballerRoleRef.current = (footballerId, role) =>
        sessionRef.current?.promoteOrDemoteFootballerRole(footballerId, role) ?? false;
    }
    if (commandGetLatestRivalInquiriesRef) {
      commandGetLatestRivalInquiriesRef.current = () =>
        sessionRef.current?.getLatestRivalInquiries() ?? [];
    }
    if (commandGetAvailableHistoricalRivalsRef) {
      commandGetAvailableHistoricalRivalsRef.current = () =>
        sessionRef.current?.getAvailableHistoricalRivals() ?? [];
    }
    if (commandGetLocalClubsRef) {
      commandGetLocalClubsRef.current = () =>
        sessionRef.current?.getLocalClubs() ?? [];
    }
    if (commandGetRegionalClubsRef) {
      commandGetRegionalClubsRef.current = () =>
        sessionRef.current?.getRegionalClubs() ?? [];
    }
    if (commandGetFederationRef) {
      commandGetFederationRef.current = () =>
        sessionRef.current?.getFederation() ?? null;
    }
    if (commandGetClubMatchHistoryRef) {
      commandGetClubMatchHistoryRef.current = () =>
        sessionRef.current?.getClubMatchHistory() ?? [];
    }
    if (commandGetLatestClubMatchRef) {
      commandGetLatestClubMatchRef.current = () =>
        sessionRef.current?.getLatestClubMatch();
    }
    if (commandPlayFriendlyMatchRef) {
      commandPlayFriendlyMatchRef.current = (rivalName, compType) =>
        sessionRef.current?.playFriendlyMatch(rivalName, compType) ?? null;
    }
    if (commandGetCompetitionsRef) {
      commandGetCompetitionsRef.current = () =>
        sessionRef.current?.getCompetitions() ?? [];
    }
    if (commandPlayCompetitionMatchRef) {
      commandPlayCompetitionMatchRef.current = (compId, fixId) =>
        sessionRef.current?.playCompetitionMatch(compId, fixId) ?? null;
    }
    if (commandGetRivalriesRef) {
      commandGetRivalriesRef.current = () =>
        sessionRef.current?.getRivalries() ?? [];
    }
    if (commandGetRivalryForClubsRef) {
      commandGetRivalryForClubsRef.current = (clubAId, clubBId) =>
        sessionRef.current?.getRivalryForClubs(clubAId, clubBId);
    }
    if (commandGetSupporterTerritoriesRef) {
      commandGetSupporterTerritoriesRef.current = () =>
        sessionRef.current?.getSupporterTerritories() ?? [];
    }
    if (commandGetPressArchiveRef) {
      commandGetPressArchiveRef.current = () =>
        sessionRef.current?.getPressArchive() ?? [];
    }
    if (commandGetAvailableMediaOutletsRef) {
      commandGetAvailableMediaOutletsRef.current = () =>
        sessionRef.current?.getAvailableMediaOutlets() ?? [];
    }
    if (commandGetClubLegendsRef) {
      commandGetClubLegendsRef.current = () =>
        sessionRef.current?.getClubLegends() ?? [];
    }
    if (commandGetInstitutionalHonorsRef) {
      commandGetInstitutionalHonorsRef.current = () =>
        sessionRef.current?.getInstitutionalHonors() ?? [];
    }
    if (commandProposeInstitutionalHonorRef) {
      commandProposeInstitutionalHonorRef.current = (legendId, honorType) =>
        sessionRef.current?.proposeInstitutionalHonor(legendId, honorType) ?? {
          success: false,
          message: 'Mundo indisponível.',
        };
    }
    if (commandVoteInstitutionalHonorRef) {
      commandVoteInstitutionalHonorRef.current = (proposalId) =>
        sessionRef.current?.voteInstitutionalHonor(proposalId) ?? {
          success: false,
          approved: false,
          outcome: 'Mundo indisponível.',
        };
    }
    if (commandGetClubTraditionProfileRef) {
      commandGetClubTraditionProfileRef.current = () =>
        sessionRef.current?.getClubTraditionProfile() ?? null;
    }
    if (commandGetHistoricalLedgerRef) {
      commandGetHistoricalLedgerRef.current = () =>
        sessionRef.current?.getHistoricalLedger() ?? { events: [] };
    }
    if (commandGetCausalChainForEventRef) {
      commandGetCausalChainForEventRef.current = (eventId: string) =>
        sessionRef.current?.getCausalChainForEvent(eventId) ?? {
          rootCauses: [],
          downstreamConsequences: [],
        };
    }
    if (commandGetClubArchiveRef) {
      commandGetClubArchiveRef.current = () =>
        sessionRef.current?.getClubArchive() ?? null;
    }
    if (commandGetTacaBrasil1959Ref) {
      commandGetTacaBrasil1959Ref.current = () =>
        sessionRef.current?.getTacaBrasil1959() ?? null;
    }
    if (commandGenerateTacaBrasil1959Ref) {
      commandGenerateTacaBrasil1959Ref.current = () =>
        sessionRef.current?.generateTacaBrasil1959() ?? null;
    }
    if (commandAdvanceTacaBrasilRef) {
      commandAdvanceTacaBrasilRef.current = () =>
        sessionRef.current?.advanceTacaBrasil() ?? null;
    }
    if (commandSimulateEntireTacaBrasilRef) {
      commandSimulateEntireTacaBrasilRef.current = () =>
        sessionRef.current?.simulateEntireTacaBrasil() ?? null;
    }
    if (commandGetFiftyYearsReportRef) {
      commandGetFiftyYearsReportRef.current = () =>
        sessionRef.current?.getFiftyYearsReport() ?? null;
    }

    // Notify the page that the command refs are live, so it can drain any pre-mount
    // Toolbar clicks queued in pendingCommandsRef. Calls into the refs above resolve
    // to GameSession.setSpeedMultiplier/togglePaused, which queue internally until
    // gameLoop is constructed in start() — so no input is silently dropped (after hydration).
    onCommandsReady?.();
    void session.start(container, window.innerWidth, window.innerHeight);

    // Handle window resize
    const handleResize = () => {
      sessionRef.current?.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (commandSpeedRef) commandSpeedRef.current = null;
      if (commandPauseRef) commandPauseRef.current = null;
      if (commandAcknowledgeInterruptionRef) commandAcknowledgeInterruptionRef.current = null;
      if (commandFocusLatestGrowthRef) commandFocusLatestGrowthRef.current = null;
      if (commandFocusLatestTransformationRef) commandFocusLatestTransformationRef.current = null;
      if (commandFoundClubWithParcelRef) commandFoundClubWithParcelRef.current = null;
      if (commandGetCityParcelsRef) commandGetCityParcelsRef.current = null;
      if (commandEnsureFoundingClubRef) commandEnsureFoundingClubRef.current = null;
      if (commandBuildFacilityRef) commandBuildFacilityRef.current = null;
      if (commandRepairFacilityRef) commandRepairFacilityRef.current = null;
      if (commandAdmitMemberRef) commandAdmitMemberRef.current = null;
      if (commandGetPersonRef) commandGetPersonRef.current = null;
      if (commandGetFamilyTreeRef) commandGetFamilyTreeRef.current = null;
      if (commandGetUrbanDemographicsRef) commandGetUrbanDemographicsRef.current = null;
      if (commandGetElectionCandidatesRef) commandGetElectionCandidatesRef.current = null;
      if (commandHoldClubElectionRef) commandHoldClubElectionRef.current = null;
      if (commandGetFootballSquadRef) commandGetFootballSquadRef.current = null;
      if (commandSetSquadTrainingRegimeRef) commandSetSquadTrainingRegimeRef.current = null;
      if (commandGetClubAthleticsPolicyRef) commandGetClubAthleticsPolicyRef.current = null;
      if (commandSetClubAthleticsPolicyRef) commandSetClubAthleticsPolicyRef.current = null;
      if (commandGetAvailableLocalProspectsRef) commandGetAvailableLocalProspectsRef.current = null;
      if (commandInviteProspectToClubRef) commandInviteProspectToClubRef.current = null;
      if (commandReleaseFootballerFromSquadRef) commandReleaseFootballerFromSquadRef.current = null;
      if (commandPromoteOrDemoteFootballerRoleRef) commandPromoteOrDemoteFootballerRoleRef.current = null;
      if (commandGetLatestRivalInquiriesRef) commandGetLatestRivalInquiriesRef.current = null;
      if (commandGetAvailableHistoricalRivalsRef) commandGetAvailableHistoricalRivalsRef.current = null;
      if (commandGetClubMatchHistoryRef) commandGetClubMatchHistoryRef.current = null;
      if (commandGetLatestClubMatchRef) commandGetLatestClubMatchRef.current = null;
      if (commandPlayFriendlyMatchRef) commandPlayFriendlyMatchRef.current = null;
      if (commandGetCompetitionsRef) commandGetCompetitionsRef.current = null;
      if (commandPlayCompetitionMatchRef) commandPlayCompetitionMatchRef.current = null;
      if (commandGetRivalriesRef) commandGetRivalriesRef.current = null;
      if (commandGetRivalryForClubsRef) commandGetRivalryForClubsRef.current = null;
      if (commandGetSupporterTerritoriesRef) commandGetSupporterTerritoriesRef.current = null;
      if (commandGetPressArchiveRef) commandGetPressArchiveRef.current = null;
      if (commandGetAvailableMediaOutletsRef) commandGetAvailableMediaOutletsRef.current = null;
      if (commandGetClubLegendsRef) commandGetClubLegendsRef.current = null;
      if (commandGetInstitutionalHonorsRef) commandGetInstitutionalHonorsRef.current = null;
      if (commandProposeInstitutionalHonorRef) commandProposeInstitutionalHonorRef.current = null;
      if (commandVoteInstitutionalHonorRef) commandVoteInstitutionalHonorRef.current = null;
      if (commandGetClubTraditionProfileRef) commandGetClubTraditionProfileRef.current = null;
      if (commandGetHistoricalLedgerRef) commandGetHistoricalLedgerRef.current = null;
      if (commandGetCausalChainForEventRef) commandGetCausalChainForEventRef.current = null;
      if (commandGetClubArchiveRef) commandGetClubArchiveRef.current = null;
      if (commandGetTacaBrasil1959Ref) commandGetTacaBrasil1959Ref.current = null;
      if (commandGenerateTacaBrasil1959Ref) commandGenerateTacaBrasil1959Ref.current = null;
      if (commandAdvanceTacaBrasilRef) commandAdvanceTacaBrasilRef.current = null;
      if (commandSimulateEntireTacaBrasilRef) commandSimulateEntireTacaBrasilRef.current = null;
      if (commandGetFiftyYearsReportRef) commandGetFiftyYearsReportRef.current = null;
      session.dispose();
      sessionRef.current = null;
    };
  }, [
    commandSpeedRef,
    commandPauseRef,
    commandAcknowledgeInterruptionRef,
    commandFocusLatestGrowthRef,
    commandFocusLatestTransformationRef,
    commandFoundClubWithParcelRef,
    commandGetCityParcelsRef,
    commandEnsureFoundingClubRef,
    commandBuildFacilityRef,
    commandRepairFacilityRef,
    commandAdmitMemberRef,
    commandGetPersonRef,
    commandGetFamilyTreeRef,
    commandGetUrbanDemographicsRef,
    commandGetElectionCandidatesRef,
    commandHoldClubElectionRef,
    commandGetFootballSquadRef,
    commandSetSquadTrainingRegimeRef,
    commandGetClubAthleticsPolicyRef,
    commandSetClubAthleticsPolicyRef,
    commandGetAvailableLocalProspectsRef,
    commandInviteProspectToClubRef,
    commandReleaseFootballerFromSquadRef,
    commandPromoteOrDemoteFootballerRoleRef,
    commandGetLatestRivalInquiriesRef,
    commandGetAvailableHistoricalRivalsRef,
    commandGetClubMatchHistoryRef,
    commandGetLatestClubMatchRef,
    commandPlayFriendlyMatchRef,
    commandGetCompetitionsRef,
    commandPlayCompetitionMatchRef,
    commandGetRivalriesRef,
    commandGetRivalryForClubsRef,
    commandGetSupporterTerritoriesRef,
    commandGetPressArchiveRef,
    commandGetAvailableMediaOutletsRef,
    commandGetClubLegendsRef,
    commandGetInstitutionalHonorsRef,
    commandProposeInstitutionalHonorRef,
    commandVoteInstitutionalHonorRef,
    commandGetClubTraditionProfileRef,
    commandGetHistoricalLedgerRef,
    commandGetCausalChainForEventRef,
    commandGetClubArchiveRef,
    commandGetTacaBrasil1959Ref,
    commandGenerateTacaBrasil1959Ref,
    commandAdvanceTacaBrasilRef,
    commandSimulateEntireTacaBrasilRef,
    commandGetFiftyYearsReportRef,
    onCommandsReady,
  ]);


  return (
    <>
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
    {persistenceNotice && (
      <div role="alert" style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 100, padding: 12, background: '#542d0b', color: '#fff', border: '1px solid #eab308', borderRadius: 8 }}>
        {persistenceNotice}
      </div>
    )}
    </>
  );
}
