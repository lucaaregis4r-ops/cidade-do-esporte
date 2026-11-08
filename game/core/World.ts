/**
 * Central world state container
 * Holds all game state but doesn't manage rendering
 */

import { GameMap } from './Map';
import { TileType, createTile, isZoneType } from './Tile';
import type { BuildingType } from './Building';
import { LandValueMap } from './LandValueMap';
import { Demand, DENSITY_DEMAND_THRESHOLD, GROWTH_DEMAND_THRESHOLD } from './Demand';
import type { DemandVector } from './Demand';
import { Terrain, SEA_LEVEL, projectTileHeightsToVertexHeights } from './Terrain';
import * as terrainGenerator from './terrainGenerator';
import { PowerMap, isBuildingPowered } from './PowerMap';
import { WaterMap, isBuildingWatered } from './WaterMap';
import { ServiceCoverageMap, isAnchorCovered } from './ServiceCoverageMap';
import { FireCoverageMap, isFireAnchorCovered } from './FireCoverageMap';
import { HospitalCoverageMap, isHospitalAnchorCovered } from './HospitalCoverageMap';
import { SchoolCoverageMap, isSchoolAnchorCovered } from './SchoolCoverageMap';
import { TrafficMap } from './TrafficMap';
import { LaborMarketMap } from './LaborMarketMap';
import { StructureMap } from './StructureMap';
import {
  pickSeedFrontage,
  greedyDepthLot,
  initialStructureRect,
  footprintCells,
  hasFrontageRoadAccess,
  canExtendStructure,
  extendStructureToward,
  maxDensityForLot,
  isUnderSupported,
} from './zoneGrowth';
import { lotBboxOf } from './buildingFootprint';
import { GROWTH_COOLDOWN_INTERVALS, stagger, LEVEL_THRESHOLDS, ZONE_MAX_LEVEL } from './growthConstants';
import { canMerge, mergedBuildingShape } from './mergePolicy';
import { buildingCapacity } from './buildingCapacity';
import {
  CampaignRng,
  DEFAULT_WORLD_SEED,
  worldSeedFromNumber,
} from './CampaignRng';
import { HistoricalClock } from './HistoricalClock';
import type { GameDate } from './HistoricalClock';
import { InterruptionQueue } from './InterruptionQueue';
import { DecisionLog } from './DecisionLog';
import type { CampaignDecision, DecisionLogState } from './DecisionLog';
import type {
  AutoPauseConfig,
  Interruption,
  InterruptionInput,
  InterruptionKind,
} from './InterruptionQueue';
import { generateCampaignCity1910 } from './city/campaignCity';
import type { CityFoundation1910 } from './city/cityFoundation';
import type { CityDistricts1910 } from './city/cityDistricts';
import {
  recordParcelPurchase,
  type CityParcels1910,
  type ParcelHistoricalEvent,
  type ParcelTransaction,
} from './city/cityParcels';
import type { CityCampaignData1910 } from './city/campaignCity';
import { createCityState } from './city/CityState';
import { createCityGrowthState, advanceCityGrowthYear } from './city/cityGrowth';
import type { CityGrowthState } from './city/cityGrowth';
import { createCityTransformationState, advanceCityTransformationYear } from './city/cityTransformation';
import type { CityTransformationState } from './city/cityTransformation';
import { generateCityLandValue1910 } from './city/cityLandValue';
import { CAMPAIGN_GROWTH_PROFILE, CAMPAIGN_LAND_VALUE_PROFILE, CAMPAIGN_TRANSFORMATION_PROFILE } from './city/campaignGrowthProfile';
import { createClub, type ClubState, type FoundingOrigin } from './club/Club';
import { generateClubIdentity } from './club/ClubIdentity';
import { generateContractProposals, type LandOccupancyContract } from './club/ClubLandContract';
import {
  generateInitialFacilities,
  decayFacilities,
  createFacility,
  repairFacility,
  FACILITY_CATALOG,
  type FacilityType,
} from './club/ClubFacilities';
import {
  createInitialLedger,
  recordTransaction,
  processMonthlyAccounting,
} from './club/ClubFinances';
import {
  generateInitialMembership,
  collectMonthlyDues,
  admitMember,
  type MemberCategory,
} from './club/ClubMembers';
import { generateFoundingGroup } from './club/FoundingGroup';
import { generateInitialBoard } from './club/ClubBoard';
import {
  createInitialSocialIdentity,
  evolveSocialIdentity,
} from './club/SocialIdentity';
import {
  generateEmergentFactions,
} from './club/ClubPolitics';
import {
  generateElectionCandidates,
  conductClubElection,
  applyElectionToBoard,
  type ElectionCandidate,
  type ClubElectionEvent,
} from './club/ClubElections';
import {
  computeUrbanDemographics,
  type UrbanDemographicsSnapshot,
} from './club/PopulationLayers';
import {
  generateInauguralFootballSquad,
  type FootballSquadState,
  type Footballer,
  type TrainingRegime,
  type HistoricalPosition,
  type SquadRole,
} from './football/Footballer';
import {
  processWeeklyTrainingAndCondition,
  processAnnualPlayerAging,
  setSquadTrainingRegime,
} from './football/FootballTraining';
import {
  createDefaultClubAthleticsPolicy,
  changeClubAthleticsPolicy,
  computeMonthlyAthleticsCost,
  getAvailableLocalProspects,
  inviteProspectToClub,
  releaseFootballerFromSquad,
  promoteOrDemoteFootballerRole,
  generateMonthlyRivalInquiries,
  type ClubAthleticsPolicyState,
  type ClubPolicyTier,
  type RivalInquiry,
} from './football/FootballMarket';
import {
  HISTORICAL_1910_RIVALS,
  generate1910RivalTeam,
  simulateHistoricalMatch,
  type Historical1910RivalPreset,
  type MatchRecord,
  type MatchTeamInput,
} from './football/MatchEngine';
import {
  generateInitial1910LocalClubs,
  evaluateAnnualClubBirths,
  evolveProceduralClubsAnnual,
  stepLocalClub,
  addTrophyToLocalClub,
  type LocalClubState,
} from './club/ClubBirthEngine';
import { evaluateClubDissidence } from './club/ClubDissidenceEngine';
import {
  generateHistoricalRegionalClubs,
  calculateRailwayTravelCostPpu,
  type RegionalClubState,
} from './club/RegionalClub';
import {
  initializeFederation,
  stepFederationAnnual,
} from './federation/FederationFormationEngine';
import type { FederationState } from './federation/Federation';
import {
  PersonRegistry,
  type PersonRegistryState,
  type FamilyTreeNode,
} from './person/PersonRegistry';
import type { Person } from './person/Person';
import {
  generateAnnualCompetitions,
} from './football/CompetitionGenerator';
import {
  stepCompetitionsForDate,
  buildClubLookup,
  resolveCompetitionFixture,
  updateStandingsWithFixtureResult,
} from './football/CompetitionEngine';
import {
  validateCompetitionState,
  type CompetitionState,
  type ClubTrophy,
} from './football/Competition';
import {
  createTacaBrasil1959,
  advanceTacaBrasilTournament,
  simulateEntireTacaBrasil,
  type TacaBrasilTournament,
  type MinasRepresentative,
} from './football/TacaBrasil1959';
import { addTrophyToClub } from './club/Club';
import {
  makeRivalryId,
  initializeRivalryBetweenClubs,
  updateRivalryAfterMatch,
  type RivalryRelationship,
  type ClubSeedInfo,
  type RivalryIncidentSummary,
} from './football/RivalryRelationship';
import {
  evaluateMatchIncidents,
  summarizeIncidentForRivalry,
} from './football/MatchIncidents';
import {
  computeClubSupporterTerritories,
  type ClubSupporterTerritory,
  type ClubTerritoryInput,
} from './football/SupporterTerritory';
import {
  generateMatchPressArticles,
  generateTribunalPressArticle,
  generateGeneralPressArticle,
  generateHonorPressArticle,
  getAvailableMediaOutlets,
  type PressArticle,
  type NewspaperProfile,
} from './media/HistoricalPress';
import {
  evaluateClubLegends,
  validateClubLegend,
  type ClubLegend,
} from './club/LegacyScore';
import {
  createHonorProposal,
  voteOnHonorProposal,
  isLegendEligibleForHonor,
  CANONICAL_HONOR_TYPES,
  type InstitutionalHonorProposal,
  type HonorType,
} from './club/InstitutionalHonors';
import {
  buildClubTraditionProfile,
  type ClubTraditionProfile,
} from './club/TraditionSystem';
import {
  generateFiftyYearsReport,
  type FiftyYearsReportData,
} from './club/FiftyYearsReport';
import {
  recordHistoricalEvent,
  createEmptyHistoricalLedger,
  getCausalChain,
  getEventsByDecade,
  type HistoricalLedgerState,
  type HistoricalEvent,
} from './club/HistoricalLedger';
import {
  buildClubArchive,
  type ClubArchiveData,
  type DecadeUrbanSummary,
  CANONICAL_DECADE_MAPS,
} from './club/ClubArchive';
export { GROWTH_COOLDOWN_INTERVALS, stagger, LEVEL_THRESHOLDS, ZONE_MAX_LEVEL, POPULATION_PER_LEVEL } from './growthConstants';

export const DEFAULT_NEWCITY_SEED = terrainGenerator.DEFAULT_NEWCITY_SEED;

/** Ticks between each zone growth step. tickCount is post-increment (≥1), so first growth fires at tick === ZONE_GROWTH_INTERVAL, not 0. */
export const ZONE_GROWTH_INTERVAL = 8;
/**
 * Periodic force-recompute cadence for land value.
 * Future-proof conservative cadence: today the dirty-mark covers every input
 * that changes the influence map (roads/zones via CommandDispatcher). A periodic
 * force-recompute is a defense-in-depth catch for any future influence input we
 * forget to dirty-mark.
 */
export const LAND_VALUE_INTERVAL = 16;
/**
 * Defense-in-depth periodic force-recompute cadence for power, mirrors LAND_VALUE_INTERVAL.
 */
export const POWER_INTERVAL = 16;
/**
 * Defense-in-depth periodic force-recompute cadence for water, mirrors POWER_INTERVAL.
 */
export const WATER_INTERVAL = 16;
/**
 * Defense-in-depth periodic force-recompute cadence for service coverage, mirrors POWER_INTERVAL.
 */
export const SERVICE_INTERVAL = 16;
/**
 * Defense-in-depth periodic force-recompute cadence for traffic.
 *
 * MUST stay a multiple of LAND_VALUE_INTERVAL. Land value reads the traffic snapshot, and
 * recomputeTraffic deliberately does NOT dirty land value (cascades fire on mark, never on
 * recompute), so a cadence-forced congestion refresh only reaches land value on a tick where
 * the land-value cadence also fires. At e.g. TRAFFIC_INTERVAL = 8 the refreshed congestion
 * would sit unread for up to 8 ticks. This is the binding constraint — not SERVICE_INTERVAL,
 * which traffic merely happens to equal. Enforced by the "traffic cadence constants" guard
 * test in World.test.ts, so editing this value cannot silently break the rule.
 */
export const TRAFFIC_INTERVAL = 16;
/**
 * Minimum growth-opportunity count (age) before a building may gain density.
 * Unit: growth opportunities (same as GROWTH_COOLDOWN_INTERVALS).
 */
export const DENSITY_COOLDOWN_INTERVALS = 24;
/** Initial city treasury balance. */
export const STARTING_FUNDS = 10000;
/** Land-value contribution weight for city happiness (W_LAND + W_JOBS + W_BUDGET = 1.0). */
export const HAPPINESS_W_LAND = 0.5;
/** Jobs-balance contribution weight for city happiness. */
export const HAPPINESS_W_JOBS = 0.3;
/** Budget-health contribution weight for city happiness. */
export const HAPPINESS_W_BUDGET = 0.2;
/**
 * Congestion penalty weight for city happiness — SUBTRACTED from the three positive terms,
 * mirroring the additive-park / subtractive-congestion asymmetry in LandValueMap.
 * The three positive weights still sum to 1.0, so congestion-free cities keep their
 * pre-feedback scores. 0.15 is deliberately modest: congestion already reaches happiness
 * indirectly through residential land value (HAPPINESS_W_LAND × the land-value penalty), and
 * this direct term is the city-wide signal on top of that, not a double-count amplifier.
 */
export const HAPPINESS_W_TRAFFIC = 0.15;
/** Initial/empty-city happiness value returned when no residential or jobs buildings exist. */
export const EMPTY_CITY_HAPPINESS = 0.5;
/** Tax revenue per population point per day. */
export const TAX_PER_POP = 1;
/** Cost to place one ROAD tile. */
export const ROAD_COST = 10;
/** Cost to place one zone (R/C/I) tile. */
export const ZONE_COST = 5;
/** Cost to bulldoze one tile. */
export const BULLDOZE_COST = 2;
/**
 * Cost to place a power plant (2×2 footprint). 10% of STARTING_FUNDS by design.
 */
export const POWER_PLANT_COST = 1000;
/**
 * Cost to place a water tower (2×2). Slightly cheaper than POWER_PLANT_COST=1000
 * so "place power + water before zoning" is affordable from STARTING_FUNDS=10000.
 */
export const WATER_TOWER_COST = 800;
/**
 * Cost to place a police station (2×2). Matches WATER_TOWER_COST=800 so "place
 * power + water + police before zoning" stays affordable from STARTING_FUNDS=10000.
 */
export const POLICE_STATION_COST = 800;
/**
 * Cost to place a fire station (2×2). Matches POLICE_STATION_COST=800 so "place
 * power + water + police + fire before zoning" stays affordable from STARTING_FUNDS=10000.
 */
export const FIRE_STATION_COST = 800;
/**
 * Cost to place a hospital (2×2). Mirrors FIRE_STATION_COST=800 / POLICE_STATION_COST=800 so
 * "place power + water + police + fire + hospital before zoning" stays affordable from
 * STARTING_FUNDS=10000. Tunable independently as balance requires.
 */
export const HOSPITAL_COST = 800;
/**
 * Cost to place a school (2×2). Mirrors HOSPITAL_COST=800 / FIRE_STATION_COST=800 so
 * "place power + water + police + fire + hospital + school before zoning" stays affordable from
 * STARTING_FUNDS=10000. Tunable independently as balance requires.
 */
export const SCHOOL_COST = 800;
/** Cost to place a 1×1 park — cheaper than the 800 service blocks; a small amenity; tunable. */
export const PARK_COST = 100;
/** Stable accounting unit retained by the legacy city economy; calendar months are Gregorian. */
export const DAYS_PER_MONTH = 30;
/** Number of Gregorian months; retained for consumers that reason about annual totals. */
export const MONTHS_PER_YEAR = 12;

/**
 * Result returned by World.tick().
 *
 * Invariant: `changed === changedTiles.length` — always. `changed` is derived at
 * construction as `changedTiles.length`; it is never independently assigned.
 *
 * Every state mutation (tile write, building create, building level-up, building
 * density bump, abandonment-state flip) MUST push at least one entry into
 * `changedTiles` so that save-scheduling and render-invalidation stay correct.
 * `changed` is a count-only convenience; `changedTiles` is the canonical delta.
 *
 * Corollary: if `changedBuildingIds.length > 0` then `changedTiles.length > 0`.
 * `changedBuildingIds` is an additional channel for building-keyed render lookup —
 * it is NEVER the sole signal of change.
 *
 * Utilities (power, water), the four coverage maps, traffic (which force-refreshes the
 * labor market inside `recomputeTraffic`), and land value are all recomputed — if dirty or
 * on their periodic cadence — in that order, as frozen snapshots before the growth pass.
 * The order matters: land value now reads traffic congestion, so traffic must resolve first.
 * The growth pass reads but does not mutate any of those maps; the building changes it makes
 * only call `markLaborDirty()` at the END of the tick, deferring re-resolution to the next tick.
 */
export interface WorldTickResult {
  /** Canonical per-tile delta: one entry per tile mutated this tick (DIRT→GRASS heals + zone level-ups + density bumps + abandonment-state flips). */
  changedTiles: ReadonlyArray<{ x: number; y: number }>;
  /** Count-only convenience — always equals `changedTiles.length`. */
  changed: number;
  /** IDs of buildings created, levelled-up, density-bumped, or abandonment-flipped this tick (from the zone growth pass). */
  changedBuildingIds: ReadonlyArray<number>;
}

export type WorldDate = GameDate;

/** Clamp x to [0, 1]. Mirrors the Demand.ts idiom. */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export class World {
  private map: GameMap;
  private terrain!: Terrain;
  private terrainRev: number = 0;
  private tickCount: number = 0;
  private money: number = STARTING_FUNDS;
  private clock: HistoricalClock = new HistoricalClock();
  private interruptions: InterruptionQueue = new InterruptionQueue();
  private decisions: DecisionLog = new DecisionLog();
  /** Lazily allocated on first getLandValue() call. */
  private landValue: LandValueMap | null = null;
  /** True when the influence map inputs have changed since last recompute. */
  private landValueDirty: boolean = false;
  /** Derived display-only KPI; dirty/lazy like land value. NOT persisted. Read only by the HUD/tests — never feeds growth/demand/level-up. */
  private happiness: number = EMPTY_CITY_HAPPINESS;
  private happinessDirty: boolean = false;
  private demand: Demand | null = null;
  private demandDirty: boolean = true;
  private structures!: StructureMap;
  private power: PowerMap | null = null;
  private powerDirty: boolean = false;
  private water: WaterMap | null = null;
  private waterDirty: boolean = false;
  private service: ServiceCoverageMap | null = null;
  private serviceDirty: boolean = false;
  private fire: FireCoverageMap | null = null;
  private fireDirty: boolean = false;
  private hospital: HospitalCoverageMap | null = null;
  private hospitalDirty: boolean = false;
  private school: SchoolCoverageMap | null = null;
  private schoolDirty: boolean = false;
  private traffic: TrafficMap | null = null;
  private trafficDirty: boolean = false;
  private labor: LaborMarketMap | null = null;
  private laborDirty: boolean = false;
  private rng: CampaignRng;
  private city1910: CityCampaignData1910 | null = null;
  private cityGrowth: CityGrowthState | null = null;
  private cityTransformation: CityTransformationState | null = null;
  private club: ClubState | null = null;
  private localClubs: readonly LocalClubState[] = [];
  private regionalClubs: readonly RegionalClubState[] = [];
  private federation: FederationState | null = null;
  private competitions: readonly CompetitionState[] = [];
  private tacaBrasil1959: TacaBrasilTournament | null = null;
  private rivalries: readonly RivalryRelationship[] = [];
  private personRegistry: PersonRegistry = new PersonRegistry();
  private latestRivalInquiries: readonly RivalInquiry[] = [];
  private pressArchive: readonly PressArticle[] = [];
  private fiftyYearsReport: FiftyYearsReportData | null = null;
  private fiftyYearsJubileeAnnounced = false;

  constructor(mapWidth: number, mapHeight: number, opts?: { regenerate?: boolean; worldSeed?: string }) {
    this.rng = new CampaignRng(opts?.worldSeed ?? DEFAULT_WORLD_SEED);
    this.map = new GameMap(mapWidth, mapHeight);
    this.structures = new StructureMap(this.map.getWidth(), this.map.getHeight());
    // Step 1: install a flat terrain so the field is never null.
    // installTerrain must come AFTER this.map is set so map.getWidth/Height() are available.
    this.installTerrain(new Terrain(this.map.getWidth(), this.map.getHeight()));
    // Step 2: if regenerate (default true), run procedural generation via reset().
    const regenerate = opts?.regenerate ?? true;
    if (regenerate) {
      this.reset({ regenerate: true });
    }
  }

  getMap(): GameMap {
    return this.map;
  }

  getWorldSeed(): string {
    return this.rng.worldSeed;
  }

  getRngStreams(): CampaignRng {
    return this.rng;
  }

  getCityFoundation1910(): CityFoundation1910 | null {
    return this.city1910?.foundation ?? null;
  }

  getCityDistricts1910(): CityDistricts1910 | null {
    return this.city1910?.districts ?? null;
  }

  getCityParcels1910(): CityParcels1910 | null {
    return this.city1910?.parcels ?? null;
  }

  getCityData1910(): CityCampaignData1910 | null {
    return this.city1910;
  }

  getCityGrowthState(): CityGrowthState | null {
    return this.cityGrowth;
  }

  setCityGrowthState(state: CityGrowthState | null): void {
    this.cityGrowth = state;
  }

  getCityTransformationState(): CityTransformationState | null {
    return this.cityTransformation;
  }

  setCityTransformationState(state: CityTransformationState | null): void {
    this.cityTransformation = state;
  }

  getClub(): ClubState | null {
    return this.club;
  }

  setClub(club: ClubState | null): void {
    this.club = club;
  }

  getLocalClubs(): readonly LocalClubState[] {
    return this.localClubs;
  }

  setLocalClubs(clubs: readonly LocalClubState[]): void {
    this.localClubs = Object.freeze([...clubs]);
  }

  getLocalClubById(id: string): LocalClubState | undefined {
    return this.localClubs.find((c) => c.id === id);
  }

  getRegionalClubs(): readonly RegionalClubState[] {
    return this.regionalClubs;
  }

  setRegionalClubs(clubs: readonly RegionalClubState[]): void {
    this.regionalClubs = Object.freeze([...clubs]);
  }

  getRegionalClubById(id: string): RegionalClubState | undefined {
    return this.regionalClubs.find((c) => c.id === id);
  }

  getFederation(): FederationState | null {
    return this.federation;
  }

  setFederation(federation: FederationState | null): void {
    this.federation = federation;
  }

  getCompetitions(): readonly CompetitionState[] {
    return this.competitions;
  }

  getActiveCompetitions(): readonly CompetitionState[] {
    return this.competitions.filter((c) => c.status !== 'completed');
  }

  setCompetitions(competitions: readonly CompetitionState[]): void {
    this.competitions = competitions;
  }

  getTacaBrasil1959(): TacaBrasilTournament | null {
    return this.tacaBrasil1959;
  }

  setTacaBrasil1959(tournament: TacaBrasilTournament | null): void {
    this.tacaBrasil1959 = tournament;
  }

  getMinasRepresentativeFor1959(): MinasRepresentative {
    // 1. Check if the player club has a state/city title or high prestige
    const hasPlayerTitle = (this.club?.trophies ?? []).some(
      (t) => t.tier === 'national_championship' || t.tier === 'state_first_division' || t.tier === 'city_cup'
    );
    const completedMineiro = this.competitions.find(
      (c) => c.status === 'completed' && (c.id.includes('campeonato') || c.id.includes('taca'))
    );
    const isPlayerChampion = completedMineiro?.standings[0]?.clubId === this.club?.id || hasPlayerTitle;

    if (this.club && isPlayerChampion) {
      return {
        id: this.club.id,
        name: this.club.name,
        shortName: this.club.shortName,
        isPlayerClub: true,
        qualifyingTitle: 'Campeão da Federação Mineira de Futebol',
      };
    }

    // 2. Otherwise pick from local or regional clubs
    const localChampion = this.localClubs.find((c) => (c.trophies?.length ?? 0) > 0) ?? this.localClubs[0];
    if (localChampion) {
      return {
        id: localChampion.id,
        name: localChampion.name,
        shortName: localChampion.shortName,
        isPlayerClub: false,
        qualifyingTitle: 'Campeão Estadual de Minas Gerais',
      };
    }

    // 3. Fallback to player club if present
    if (this.club) {
      return {
        id: this.club.id,
        name: this.club.name,
        shortName: this.club.shortName,
        isPlayerClub: true,
        qualifyingTitle: 'Representante da Federação Mineira',
      };
    }

    return {
      id: 'club-rep-minas-1959',
      name: 'América Futebol Clube',
      shortName: 'América-MG',
      isPlayerClub: false,
      qualifyingTitle: 'Campeão Mineiro de 1958',
    };
  }

  generateTacaBrasil1959(): TacaBrasilTournament {
    if (this.tacaBrasil1959) return this.tacaBrasil1959;
    const rep = this.getMinasRepresentativeFor1959();
    const tournament = createTacaBrasil1959(rep);
    this.tacaBrasil1959 = tournament;
    return tournament;
  }

  advanceTacaBrasil(): TacaBrasilTournament {
    if (!this.tacaBrasil1959) {
      this.generateTacaBrasil1959();
    }
    const updated = advanceTacaBrasilTournament(this.tacaBrasil1959!, this.rng);
    this.tacaBrasil1959 = updated;

    if (updated.status === 'completed') {
      if (updated.champion?.isPlayerClub && this.club) {
        const nationalTrophy: ClubTrophy = {
          id: 'trophy-taca-brasil-1959',
          competitionId: 'taca-brasil-1959',
          competitionName: 'Taça Brasil de 1959 (Primeiro Campeão Nacional)',
          year: 1959,
          date: { year: 1959, month: 11, day: 29 },
          tier: 'national_championship',
          description: 'Troféu oficial de primeiro campeão da Taça Brasil de 1959.',
        };
        const clubWithTrophy = addTrophyToClub(this.club, nationalTrophy);
        const ledger = clubWithTrophy.historicalLedger ?? createEmptyHistoricalLedger();
        const event: HistoricalEvent = {
          id: 'ev-taca-brasil-1959',
          date: { year: 1959, month: 11, day: 29 },
          category: 'TITULO',
          importance: 100,
          title: 'Campeão da Taça Brasil de 1959',
          description: `${clubWithTrophy.name} conquista a Taça Brasil de 1959, sagrando-se o primeiro campeão nacional de clubes da história do futebol brasileiro!`,
          people: [],
          clubs: [clubWithTrophy.id],
          facilities: [],
          competitionId: 'taca-brasil-1959',
          causes: ['ev-fundacao-' + clubWithTrophy.id],
          consequences: [
            'Consagração nacional definitiva do clube nos anais esportivos',
            'Eternização da geração histórica de 1959',
          ],
          tags: ['taca_brasil', 'titulo_nacional', '1959'],
        };
        const updatedLedger = recordHistoricalEvent(ledger, event);
        this.setClub({
          ...clubWithTrophy,
          historicalLedger: updatedLedger,
          reputation: Math.min(100, clubWithTrophy.reputation + 30),
        });
      }

      this.enqueueInterruption({
        id: 'taca-brasil-1959-completed',
        kind: 'final',
        title: 'Taça Brasil de 1959: Campeão Nacional Definido!',
        description: updated.historicalSummary ?? 'Encerramento épico da primeira Taça Brasil da história!',
      });
    }

    return this.tacaBrasil1959;
  }

  simulateEntireTacaBrasil(): TacaBrasilTournament {
    if (!this.tacaBrasil1959) {
      this.generateTacaBrasil1959();
    }
    const completed = simulateEntireTacaBrasil(this.tacaBrasil1959!, this.rng);
    this.tacaBrasil1959 = completed;

    if (completed.champion?.isPlayerClub && this.club) {
      const nationalTrophy: ClubTrophy = {
        id: 'trophy-taca-brasil-1959',
        competitionId: 'taca-brasil-1959',
        competitionName: 'Taça Brasil de 1959 (Primeiro Campeão Nacional)',
        year: 1959,
        date: { year: 1959, month: 11, day: 29 },
        tier: 'national_championship',
        description: 'Troféu oficial de primeiro campeão da Taça Brasil de 1959.',
      };
      const clubWithTrophy = addTrophyToClub(this.club, nationalTrophy);
      const ledger = clubWithTrophy.historicalLedger ?? createEmptyHistoricalLedger();
      const event: HistoricalEvent = {
        id: 'ev-taca-brasil-1959',
        date: { year: 1959, month: 11, day: 29 },
        category: 'TITULO',
        importance: 100,
        title: 'Campeão da Taça Brasil de 1959',
        description: `${clubWithTrophy.name} conquista a Taça Brasil de 1959, sagrando-se o primeiro campeão nacional de clubes da história do futebol brasileiro!`,
        people: [],
        clubs: [clubWithTrophy.id],
        facilities: [],
        competitionId: 'taca-brasil-1959',
        causes: ['ev-fundacao-' + clubWithTrophy.id],
        consequences: [
          'Consagração nacional definitiva do clube nos anais esportivos',
          'Eternização da geração histórica de 1959',
        ],
        tags: ['taca_brasil', 'titulo_nacional', '1959'],
      };
      const updatedLedger = recordHistoricalEvent(ledger, event);
      this.setClub({
        ...clubWithTrophy,
        historicalLedger: updatedLedger,
        reputation: Math.min(100, clubWithTrophy.reputation + 30),
      });
    }

    return this.tacaBrasil1959;
  }

  getFiftyYearsReport(): FiftyYearsReportData | null {
    if (this.fiftyYearsReport) {
      return this.fiftyYearsReport;
    }
    if (!this.club) return null;
    const tradition = this.getClubTraditionProfile() ?? buildClubTraditionProfile({
      clubId: this.club.id,
      clubName: this.club.name,
      foundingOrigin: this.club.foundingOrigin,
      colors: this.club.colors,
      foundationYear: this.club.foundingDate.year,
      currentYear: this.clock.getDate().year,
      titlesCount: this.club.trophies?.length ?? 0,
      matchesCount: this.club.matchHistory?.length ?? 0,
    });

    this.fiftyYearsReport = generateFiftyYearsReport({
      club: this.club,
      worldSeed: this.rng.worldSeed,
      currentDate: this.clock.getDate(),
      cityData: this.city1910,
      cityGrowth: this.cityGrowth,
      cityTransformation: this.cityTransformation,
      historicalLedger: this.getHistoricalLedger(),
      tradition,
      legends: this.getClubLegends(),
      honors: this.getInstitutionalHonors(),
      rivalries: this.getRivalries(),
      tacaBrasil1959: this.tacaBrasil1959,
    });
    return this.fiftyYearsReport;
  }

  getRivalries(): readonly RivalryRelationship[] {
    return this.rivalries;
  }

  setRivalries(rivalries: readonly RivalryRelationship[]): void {
    this.rivalries = Object.freeze([...rivalries]);
  }

  getRivalryForClubs(clubAId: string, clubBId: string): RivalryRelationship | undefined {
    const id = makeRivalryId(clubAId, clubBId);
    return this.rivalries.find((r) => r.id === id);
  }

  playCompetitionMatch(competitionId: string, fixtureId: string): MatchRecord | null {
    if (!this.club) return null;
    const compIdx = this.competitions.findIndex((c) => c.id === competitionId);
    if (compIdx === -1) return null;
    const comp = this.competitions[compIdx]!;
    const fixIdx = comp.fixtures.findIndex((f) => f.id === fixtureId);
    if (fixIdx === -1) return null;
    const fixture = comp.fixtures[fixIdx]!;
    if (fixture.status === 'played') return null;

    const clubLookup = buildClubLookup(this.club, this.localClubs, this.regionalClubs);
    const homeData = clubLookup.get(fixture.homeClubId) ?? {
      id: fixture.homeClubId,
      name: fixture.homeClubName,
      shortName: fixture.homeClubName,
      colors: { primary: '#333333', secondary: '#ffffff' },
      reputation: 50,
    };
    const awayData = clubLookup.get(fixture.awayClubId) ?? {
      id: fixture.awayClubId,
      name: fixture.awayClubName,
      shortName: fixture.awayClubName,
      colors: { primary: '#666666', secondary: '#ffffff' },
      reputation: 50,
    };

    const res = resolveCompetitionFixture(comp, fixture, homeData, awayData, this.rng);
    const updatedFixtures = [...comp.fixtures];
    updatedFixtures[fixIdx] = res.updatedFixture;
    const updatedStandings = updateStandingsWithFixtureResult(comp.standings, res.updatedFixture);

    const updatedComp = validateCompetitionState({
      ...comp,
      status: 'in_progress',
      fixtures: updatedFixtures,
      standings: updatedStandings,
    })!;

    const nextCompetitions = [...this.competitions];
    nextCompetitions[compIdx] = updatedComp;
    this.competitions = Object.freeze(nextCompetitions);

    // Record in club match history
    const isPlayerInvolved = fixture.homeClubId === this.club.id || fixture.awayClubId === this.club.id;
    if (isPlayerInvolved) {
      const currentHistory = this.club.matchHistory ?? [];
      let updatedLedger = this.club.historicalLedger;
      if (updatedLedger && currentHistory.length === 0) {
        // First official match!
        updatedLedger = recordHistoricalEvent(updatedLedger, {
          id: `ev-primeiro-jogo-${res.matchRecord.id}`,
          date: res.matchRecord.date,
          category: 'PRIMEIRO_JOGO',
          importance: 85,
          title: `Batismo nos Gramados: Primeiro Prélio Oficial`,
          description: `O ${this.club.name} disputa sua primeira partida oficial contra o ${res.matchRecord.awayClubName} (${res.matchRecord.homeScore} x ${res.matchRecord.awayScore}).`,
          clubs: [this.club.id, res.matchRecord.awayClubId],
          causes: [`ev-fundacao-${this.club.id}`],
          tags: ['primeiro_jogo', 'estreia', 'futebol'],
        });
      }
      this.club = createClub({
        ...this.club,
        matchHistory: [res.matchRecord, ...currentHistory],
        ...(updatedLedger ? { historicalLedger: updatedLedger } : {}),
      });
    }

    this.handlePostMatchRivalryAndIncidents(res.matchRecord, comp.format === 'playoff_tiebreaker');

    return res.matchRecord;
  }

  ensureRivalriesInitialized(): void {
    const allClubs = this.collectAllClubsSeedInfo();
    const existingMap = new Map<string, RivalryRelationship>();
    for (const r of this.rivalries) {
      existingMap.set(r.id, r);
    }

    const nextRivalries = [...this.rivalries];
    let changed = false;

    for (let i = 0; i < allClubs.length; i++) {
      for (let j = i + 1; j < allClubs.length; j++) {
        const c1 = allClubs[i]!;
        const c2 = allClubs[j]!;
        const id = makeRivalryId(c1.id, c2.id);
        if (!existingMap.has(id)) {
          const newRiv = initializeRivalryBetweenClubs(c1, c2);
          nextRivalries.push(newRiv);
          existingMap.set(id, newRiv);
          changed = true;
        }
      }
    }

    if (changed) {
      this.rivalries = Object.freeze(nextRivalries);
    }
  }

  private collectAllClubsSeedInfo(): ClubSeedInfo[] {
    const list: ClubSeedInfo[] = [];
    if (this.club) {
      let districtId: string | undefined = undefined;
      if (this.city1910 && this.club.parcels.length > 0) {
        const p = this.city1910.parcels.parcels.find((item) => item.id === this.club!.parcels[0]);
        districtId = p?.districtId;
      }
      list.push({
        id: this.club.id,
        name: this.club.name,
        origin: this.club.foundingOrigin,
        districtId,
      });
    }
    for (const lc of this.localClubs) {
      list.push({
        id: lc.id,
        name: lc.name,
        origin: lc.origin,
        districtId: lc.districtId,
        isDissidence: lc.foundationReason === 'dissidence',
        parentClubId: lc.parentClubId,
      });
    }
    for (const rc of this.regionalClubs) {
      list.push({
        id: rc.id,
        name: rc.name,
        origin: rc.origin,
        isRegional: true,
      });
    }
    return list;
  }

  private handlePostMatchRivalryAndIncidents(
    matchRecord: MatchRecord,
    isPlayoffOrFinal: boolean = false
  ): void {
    this.ensureRivalriesInitialized();

    const homeId = matchRecord.homeClubId;
    const awayId = matchRecord.awayClubId;
    const rivId = makeRivalryId(homeId, awayId);
    let rivalry = this.rivalries.find((r) => r.id === rivId);

    if (!rivalry) {
      const allClubs = this.collectAllClubsSeedInfo();
      const c1 = allClubs.find((c) => c.id === homeId) ?? { id: homeId, name: matchRecord.homeClubName };
      const c2 = allClubs.find((c) => c.id === awayId) ?? { id: awayId, name: matchRecord.awayClubName };
      rivalry = initializeRivalryBetweenClubs(c1, c2);
    }

    // Evaluate potential match incidents and disciplinary sanctions
    const incident = evaluateMatchIncidents({
      matchRecord,
      rivalry,
      isPlayoffOrFinal,
      rng: this.rng,
    });

    const incidentSummaries: RivalryIncidentSummary[] = [];

    if (incident) {
      const summary = summarizeIncidentForRivalry(incident);
      incidentSummaries.push(summary);

      // Process sanctions (fines in PPU, bans, etc.)
      for (const sanction of incident.sanctions) {
        if (this.club && sanction.clubId === this.club.id && sanction.finePpu > 0 && this.club.finances) {
          const updatedLedger = recordTransaction(
            this.club.finances,
            this.clock.getDate(),
            'fine_tribunal',
            -sanction.finePpu,
            `Multa do Tribunal de Penas da Federação por incidentes no prélio contra ${matchRecord.homeClubId === this.club.id ? matchRecord.awayClubName : matchRecord.homeClubName}`
          );
          this.club = createClub({
            ...this.club,
            finances: updatedLedger,
          });
        } else {
          // If local club fined
          const lc = this.localClubs.find((c) => c.id === sanction.clubId);
          if (lc && sanction.finePpu > 0) {
            this.localClubs = Object.freeze(
              this.localClubs.map((club) => {
                if (club.id !== lc.id) return club;
                return Object.freeze({
                  ...club,
                  finances: Object.freeze({
                    cashBalancePpu: Math.max(0, club.finances.cashBalancePpu - sanction.finePpu),
                    monthlyBudgetPpu: club.finances.monthlyBudgetPpu,
                  }),
                });
              })
            );
          }
        }
      }

      // Notify user via InterruptionQueue
      this.enqueueInterruption({
        id: `tribunal-${incident.id}`,
        kind: 'incident',
        title: `⚖️ ${incident.title}`,
        description: `${incident.descriptionPt} Decisão do Tribunal de Penas: ${incident.sanctions.map((s) => s.sentencePt).join(' ')}`,
      });
    }

    const updatedRivalry = updateRivalryAfterMatch(rivalry, {
      matchId: matchRecord.id,
      date: matchRecord.date,
      homeClubId: matchRecord.homeClubId,
      awayClubId: matchRecord.awayClubId,
      homeScore: matchRecord.homeScore,
      awayScore: matchRecord.awayScore,
      isPlayoffOrFinal,
      incidentsOccurred: incidentSummaries.length > 0 ? incidentSummaries : undefined,
    });

    const otherRivalries = this.rivalries.filter((r) => r.id !== rivId);
    this.rivalries = Object.freeze([...otherRivalries, updatedRivalry]);

    // Generate historic press chronicles for the match across newspapers
    const derbyInfo = updatedRivalry
      ? { derbyName: updatedRivalry.derbyName, intensity: updatedRivalry.intensity }
      : undefined;
    const pressArticles = generateMatchPressArticles(matchRecord, derbyInfo);
    for (const article of pressArticles) {
      this.addPressArticle(article);
    }

    // If an incident occurred and tribunal judged, generate a tribunal press article
    if (incident) {
      const targetClubName = incident.sanctions[0]?.clubName ?? matchRecord.homeClubName;
      const tribunalArticle = generateTribunalPressArticle(incident, targetClubName, 'gazeta');
      this.addPressArticle(tribunalArticle);

      if (this.club && (matchRecord.homeClubId === this.club.id || matchRecord.awayClubId === this.club.id) && this.club.historicalLedger) {
        const tribunalLedger = recordHistoricalEvent(this.club.historicalLedger, {
          id: `ev-tribunal-${incident.id}`,
          date: matchRecord.date,
          category: 'TRIBUNAL',
          importance: 75,
          title: `Tribunal de Penas: Julgamento no Dérbi`,
          description: `${incident.title}: ${incident.descriptionPt}. Penas: ${incident.sanctions.map((s) => s.sentencePt).join(', ')}`,
          clubs: [this.club.id],
          causes: [`ev-fundacao-${this.club.id}`],
          tags: ['tribunal', 'disciplina', 'derbi'],
        });
        this.club = createClub({
          ...this.club,
          historicalLedger: tribunalLedger,
        });
      }
    }
  }

  getPressArchive(): readonly PressArticle[] {
    return this.pressArchive;
  }

  setPressArchive(articles: readonly PressArticle[]): void {
    this.pressArchive = Object.freeze([...articles]);
  }

  addPressArticle(article: PressArticle): void {
    this.pressArchive = Object.freeze([article, ...this.pressArchive].slice(0, 100));
  }

  getAvailableMediaOutlets(): readonly NewspaperProfile[] {
    return getAvailableMediaOutlets(this.clock.getDate().year);
  }

  getClubLegends(): readonly ClubLegend[] {
    if (!this.club) return [];
    return evaluateClubLegends(this.club, this.clock.getDate().year, this.club.clubLegends ?? []);
  }

  getInstitutionalHonors(): readonly InstitutionalHonorProposal[] {
    return this.club?.institutionalHonors ?? [];
  }

  proposeInstitutionalHonor(
    legendId: string,
    honorType: HonorType
  ): { success: boolean; proposal?: InstitutionalHonorProposal; message: string } {
    if (!this.club) {
      return { success: false, message: 'Nenhum clube fundado na campanha.' };
    }
    const legends = this.getClubLegends();
    const legend = legends.find((l) => l.id === legendId);
    if (!legend) {
      return { success: false, message: 'Figura histórica ou lenda não encontrada.' };
    }

    if (!isLegendEligibleForHonor(legend.category, honorType)) {
      return {
        success: false,
        message: `Esta honraria exige uma categoria de legado superior (a categoria atual é ${legend.category}).`,
      };
    }

    const currentHonors = this.club.institutionalHonors ?? [];
    const alreadyApproved = currentHonors.some(
      (h) => h.legendId === legendId && h.honorType === honorType && h.status === 'approved'
    );
    if (alreadyApproved) {
      return {
        success: false,
        message: `Esta homenagem já foi outorgada e aprovada pelo Conselho para ${legend.name}.`,
      };
    }

    const proposal = createHonorProposal({
      legend,
      honorType,
      date: this.clock.getDate(),
      sequenceIndex: currentHonors.length + 1,
    });

    const updatedHonors = Object.freeze([proposal, ...currentHonors]);
    this.club = createClub({
      ...this.club,
      institutionalHonors: updatedHonors,
      clubLegends: legends,
    });

    return {
      success: true,
      proposal,
      message: `Proposta de "${proposal.honorNamePt}" para ${legend.name} apresentada com sucesso à Mesa do Conselho Deliberativo!`,
    };
  }

  voteInstitutionalHonor(
    proposalId: string
  ): { success: boolean; approved: boolean; outcome: string } {
    if (!this.club || !this.club.institutionalHonors) {
      return { success: false, approved: false, outcome: 'Nenhuma proposta pendente no clube.' };
    }

    const proposal = this.club.institutionalHonors.find((p) => p.id === proposalId && p.status === 'pending');
    if (!proposal) {
      return { success: false, approved: false, outcome: 'Proposta não encontrada ou já deliberada.' };
    }

    const treasury = this.club.finances?.balancePPU ?? 0;
    const rngSample = this.rng.events.next();
    const voteOutcome = voteOnHonorProposal({
      proposal,
      politics: this.club.politics,
      treasuryPpu: treasury,
      legendScore: 80,
      resolutionDate: this.clock.getDate(),
      rngSample,
    });

    const updatedHonors = this.club.institutionalHonors.map((p) =>
      p.id === proposalId ? voteOutcome.updatedProposal : p
    );

    let updatedClub = createClub({
      ...this.club,
      institutionalHonors: Object.freeze(updatedHonors),
    });

    if (voteOutcome.approved) {
      // 1. Debit treasury if cost > 0
      if (voteOutcome.costPpu > 0 && updatedClub.finances) {
        const txDate = this.clock.getDate();
        const newLedger = recordTransaction(
          updatedClub.finances,
          txDate,
          'honor_tribute',
          -voteOutcome.costPpu,
          `Confecção da homenagem: ${proposal.honorNamePt} a ${proposal.legendName}`
        );
        updatedClub = createClub({
          ...updatedClub,
          finances: newLedger,
          reputation: Math.min(100, updatedClub.reputation + 5),
        });
      }

      if (updatedClub.historicalLedger) {
        const honorLedger = recordHistoricalEvent(updatedClub.historicalLedger, {
          id: `ev-homenagem-${proposal.id}`,
          date: this.clock.getDate(),
          category: 'HOMENAGEM',
          importance: 80,
          title: `Conselho Aprova: ${proposal.honorNamePt} a ${proposal.legendName}`,
          description: `Em sessão solene e sob aclamação dos conselheiros, ${updatedClub.name} eterniza o legado de ${proposal.legendName}.`,
          clubs: [updatedClub.id],
          people: [proposal.legendId],
          causes: [`ev-fundacao-${updatedClub.id}`],
          tags: ['homenagem', 'conselho', 'legado'],
        });
        updatedClub = createClub({
          ...updatedClub,
          historicalLedger: honorLedger,
        });
      }

      // 2. Generate press/radio article celebrating the honor
      const honorArticle = generateHonorPressArticle({
        clubName: updatedClub.name,
        clubId: updatedClub.id,
        legendName: proposal.legendName,
        honorTypeTitlePt: proposal.honorNamePt,
        date: this.clock.getDate(),
      });
      this.addPressArticle(honorArticle);

      // 3. Notify through InterruptionQueue
      this.interruptions.enqueue({
        id: `event-honor-${proposal.id}`,
        kind: 'proposal',
        date: this.clock.getDate(),
        title: `Consagração Histórica: ${proposal.honorNamePt}`,
        description: `O Conselho Deliberativo aprovou em sessão solene a concessão de ${proposal.honorNamePt} a ${proposal.legendName}!`,
      });
    }

    this.club = updatedClub;
    return {
      success: true,
      approved: voteOutcome.approved,
      outcome: voteOutcome.resolutionTextPt,
    };
  }

  getClubTraditionProfile(): ClubTraditionProfile | null {
    if (!this.club) return null;
    const stadium = this.club.facilityDetails?.find(
      (f) => f.type === 'wooden_stands' || f.type === 'dirt_pitch'
    );
    return buildClubTraditionProfile({
      clubId: this.club.id,
      clubName: this.club.name,
      foundingOrigin: this.club.foundingOrigin,
      colors: this.club.colors,
      currentStadiumName: stadium?.name,
      foundationYear: this.club.foundingDate.year,
      currentYear: this.clock.getDate().year,
      titlesCount: this.club.trophies?.length ?? 0,
      matchesCount: this.club.matchHistory?.length ?? 0,
    });
  }

  getHistoricalLedger(): HistoricalLedgerState {
    return this.club?.historicalLedger ?? createEmptyHistoricalLedger();
  }

  getCausalChainForEvent(eventId: string) {
    const ledger = this.getHistoricalLedger();
    return getCausalChain(ledger, eventId);
  }

  getClubArchive(): ClubArchiveData | null {
    if (!this.club) return null;
    const tradition = this.getClubTraditionProfile();
    if (!tradition) return null;
    const ledger = this.getHistoricalLedger();
    const legends = this.getClubLegends();
    const honors = this.getInstitutionalHonors();
    const rivalries = this.getRivalries();
    return buildClubArchive({
      club: this.club,
      tradition,
      historicalLedger: ledger,
      legends,
      honors,
      rivalries,
      currentYear: this.clock.getDate().year,
    });
  }

  getSupporterTerritories(): readonly ClubSupporterTerritory[] {
    if (!this.city1910 || !this.city1910.districts) return [];
    const clubsInput: ClubTerritoryInput[] = [];

    if (this.club) {
      const socialAffinity = this.club.socialIdentity?.segments ?? createInitialSocialIdentity(this.club.foundingOrigin, 'd-centro').segments;
      const headquartersDistrictId = this.club.parcels.length > 0 && this.city1910.parcels
        ? this.city1910.parcels.parcels.find((p) => p.id === this.club!.parcels[0])?.districtId
        : undefined;

      clubsInput.push({
        id: this.club.id,
        name: this.club.name,
        headquartersDistrictId,
        socialAffinity,
        reputation: this.club.reputation ?? 50,
      });
    }

    for (const lc of this.localClubs) {
      const socialAffinity = createInitialSocialIdentity(lc.origin, lc.districtId).segments;
      clubsInput.push({
        id: lc.id,
        name: lc.name,
        headquartersDistrictId: lc.districtId,
        socialAffinity,
        reputation: lc.reputation ?? 40,
      });
    }

    return computeClubSupporterTerritories(clubsInput, this.city1910.districts.districts);
  }

  getPersonRegistry(): PersonRegistry {
    return this.personRegistry;
  }

  getPerson(id: string): Person | undefined {
    return this.personRegistry.get(id);
  }

  getFamilyTree(personId: string): FamilyTreeNode | undefined {
    return this.personRegistry.getFamilyTree(personId);
  }

  getAllPersons(): readonly Person[] {
    return this.personRegistry.getAll();
  }

  getUrbanDemographics(): UrbanDemographicsSnapshot {
    const growthAdded = this.cityGrowth?.populationUnitsAdded ?? 0;
    const districts = this.city1910?.districts ?? null;
    return computeUrbanDemographics(
      districts,
      growthAdded,
      this.personRegistry,
      this.clock.getDate().year,
      this.club?.id,
    );
  }

  getElectionCandidates(): readonly ElectionCandidate[] {
    if (!this.club || !this.club.politics) return [];
    return generateElectionCandidates({
      currentYear: this.clock.getDate().year,
      currentDate: this.clock.getDate(),
      politics: this.club.politics,
      candidatesPool: this.personRegistry.getAll(),
      currentBoard: this.club.board,
      rng: this.rng,
    });
  }

  holdClubElection(playerVotedCandidateId?: string): ClubElectionEvent | null {
    if (!this.club || !this.club.politics || !this.club.board) return null;
    const candidates = this.getElectionCandidates();
    if (candidates.length === 0) return null;

    const termYears = this.club.board.mandateYears ?? 1;
    const election = conductClubElection(
      candidates,
      this.club.politics,
      this.clock.getDate(),
      termYears,
      playerVotedCandidateId,
    );

    const winner = election.candidates.find((c) => c.id === election.winnerCandidateId)!;
    const updatedBoard = applyElectionToBoard(this.club.board, election, winner);

    // Apply president profile consequence: alter politics tension & stability
    const prevElections = this.club.electionHistory ?? [];
    const updatedPolitics = {
      ...this.club.politics,
      lastElectionYear: election.electionDate.year,
      nextElectionYear: election.electionDate.year + termYears,
      internalTension: Math.max(0, Math.min(100, Math.round(this.club.politics.internalTension * 0.7))), // election relieves tension
      politicalStabilityScore: Math.min(100, this.club.politics.politicalStabilityScore + 15),
    };

    let updatedLedger = this.club.historicalLedger;
    if (updatedLedger) {
      updatedLedger = recordHistoricalEvent(updatedLedger, {
        id: `ev-eleicao-${election.id}`,
        date: election.electionDate,
        category: 'ELEICAO',
        importance: 70,
        title: `Eleição Presidencial: ${winner.name} eleito`,
        description: `Chapa de ${winner.name} sagra-se vencedora no pleito com ${winner.votesReceivedBps / 100}% dos votos para mandato de ${termYears} ano(s).`,
        clubs: [this.club.id],
        people: [winner.id],
        causes: [`ev-fundacao-${this.club.id}`],
        tags: ['eleicao', 'democracia', 'presidencia'],
      });
    }

    const updatedClub = createClub({
      ...this.club,
      board: updatedBoard,
      politics: updatedPolitics,
      electionHistory: [...prevElections, election],
      ...(updatedLedger ? { historicalLedger: updatedLedger } : {}),
    });

    this.setClub(updatedClub);
    return election;
  }

  getFootballSquad(): FootballSquadState | undefined {
    return this.club?.squad;
  }

  getFootballers(): readonly Footballer[] {
    return this.club?.squad?.footballers ?? [];
  }

  setSquadTrainingRegime(regime: TrainingRegime): boolean {
    if (!this.club || !this.club.squad) return false;
    const updatedSquad = setSquadTrainingRegime(this.club.squad, regime);
    this.club = createClub({
      ...this.club,
      squad: updatedSquad,
    });
    return true;
  }

  getClubAthleticsPolicy(): ClubAthleticsPolicyState | undefined {
    return this.club?.athleticsPolicy;
  }

  setClubAthleticsPolicy(tier: ClubPolicyTier): boolean {
    if (!this.club) return false;
    const updatedClub = changeClubAthleticsPolicy(this.club, tier, this.clock.getDate());
    this.club = updatedClub;
    return true;
  }

  getAvailableLocalProspects(): readonly Person[] {
    return getAvailableLocalProspects(this.personRegistry.getAll(), this.club?.squad?.footballers ?? []);
  }

  inviteProspectToClub(
    personId: string,
    position: HistoricalPosition,
    role: SquadRole
  ): { success: boolean; message: string; footballer?: Footballer } {
    if (!this.club) return { success: false, message: 'Clube não fundado' };
    const person = this.personRegistry.get(personId);
    if (!person) return { success: false, message: 'Cidadão não encontrado no registro civil.' };
    const result = inviteProspectToClub(
      this.club,
      person,
      position,
      role,
      this.clock.getDate(),
      this.rng
    );
    if (result.success) {
      this.club = result.updatedClub;
    }
    return { success: result.success, message: result.message, footballer: result.footballer };
  }

  releaseFootballerFromSquad(footballerId: string): boolean {
    if (!this.club) return false;
    const result = releaseFootballerFromSquad(this.club, footballerId);
    if (result.success) {
      this.club = result.updatedClub;
      return true;
    }
    return false;
  }

  promoteOrDemoteFootballerRole(footballerId: string, role: SquadRole): boolean {
    if (!this.club) return false;
    const updatedClub = promoteOrDemoteFootballerRole(this.club, footballerId, role);
    this.club = updatedClub;
    return true;
  }

  getLatestRivalInquiries(): readonly RivalInquiry[] {
    return this.latestRivalInquiries;
  }

  getAvailableHistoricalRivals(): readonly Historical1910RivalPreset[] {
    const list: Historical1910RivalPreset[] = [];
    if (this.localClubs.length > 0) {
      for (const club of this.localClubs) {
        list.push({
          name: club.name,
          shortName: club.shortName,
          foundationYear: club.foundationDate.year,
          colors: { primary: club.colors.primary, secondary: club.colors.secondary },
          reputation: club.reputation,
          description: club.directorProfile
            ? `Presidido por ${club.directorProfile.presidentName}. ${club.historicalMilestones[0]?.description ?? ''}`
            : 'Grêmio tradicional de Cidade de Minas.',
        });
      }
    }
    const currentYear = this.clock.getDate().year;
    for (const reg of this.regionalClubs) {
      if (reg.foundationYear <= currentYear) {
        list.push({
          name: `${reg.name} (${reg.city})`,
          shortName: reg.shortName,
          foundationYear: reg.foundationYear,
          colors: { primary: reg.colors.primary, secondary: reg.colors.secondary },
          reputation: reg.traditionLevel,
          description: `Clube do interior mineiro (${reg.region} - ${reg.city}). Estádio: ${reg.stadium.name} (${reg.stadium.capacity} lug.). Viagem: ${reg.railwayDistanceHours}h de trem.`,
        });
      }
    }
    if (list.length > 0) return list;
    return HISTORICAL_1910_RIVALS;
  }

  getClubMatchHistory(): readonly MatchRecord[] {
    return this.club?.matchHistory ?? [];
  }

  getLatestClubMatch(): MatchRecord | undefined {
    const history = this.club?.matchHistory;
    if (!history || history.length === 0) return undefined;
    return history[history.length - 1];
  }

  playFriendlyMatch(
    rivalPresetName: string,
    competitionType: 'friendly' | 'festival_taça' = 'friendly'
  ): MatchRecord | null {
    if (!this.club || !this.club.squad || this.club.squad.footballers.length < 11) {
      return null;
    }

    const rivalPreset =
      this.getAvailableHistoricalRivals().find(
        (r) => r.name === rivalPresetName || r.shortName === rivalPresetName || r.name.startsWith(rivalPresetName)
      ) ??
      HISTORICAL_1910_RIVALS[0]!;

    const matchedLocalClub = this.localClubs.find(
      (c) => c.name === rivalPreset.name || c.shortName === rivalPreset.shortName
    );
    const matchedRegionalClub = this.regionalClubs.find(
      (rc) => rc.name === rivalPreset.name || rc.shortName === rivalPreset.shortName || rivalPreset.name.startsWith(rc.name)
    );

    const baseRivalTeam = generate1910RivalTeam(rivalPreset, this.clock.getDate(), this.rng);
    const rivalTeam: MatchTeamInput = {
      ...baseRivalTeam,
      id: matchedLocalClub?.id ?? matchedRegionalClub?.id ?? baseRivalTeam.id,
      name: matchedLocalClub?.name ?? matchedRegionalClub?.name ?? baseRivalTeam.name,
      shortName: matchedLocalClub?.shortName ?? matchedRegionalClub?.shortName ?? baseRivalTeam.shortName,
    };

    const hasGrandstand = this.club.facilityDetails?.some((f) => f.type === 'wooden_stands') ?? false;
    const hasField = this.club.facilityDetails?.some((f) => f.type === 'dirt_pitch') ?? false;
    const pitchCondition = hasField ? 'dirt' : 'modest';

    const homeTeam: MatchTeamInput = {
      id: this.club.id,
      name: this.club.name,
      shortName: this.club.shortName,
      colors: this.club.colors,
      squad: this.club.squad.footballers,
    };

    const matchId = `match-${this.clock.getDate().year}-${this.clock.getDate().month}-${this.clock.getDate().day}-${this.tickCount}`;
    const competitionName = competitionType === 'festival_taça'
      ? `Grande Festival Esportivo de 1910`
      : `Amistoso Intermunicipal de 1910`;

    const simResult = simulateHistoricalMatch({
      matchId,
      date: this.clock.getDate(),
      competitionType,
      competitionName,
      homeTeam,
      awayTeam: rivalTeam,
      rng: this.rng,
      pitchCondition,
      hasGrandstand,
    });

    let currentFinances = this.club.finances;
    if (currentFinances) {
      let balance = currentFinances.balancePPU;
      let income = currentFinances.totalIncomePPU;
      let expenses = currentFinances.totalExpensesPPU;
      const txs = [...currentFinances.transactions];

      if (simResult.matchRevenueTransaction) {
        txs.push(simResult.matchRevenueTransaction);
        balance += simResult.matchRevenueTransaction.amountPPU;
        income += simResult.matchRevenueTransaction.amountPPU;
      }

      if (simResult.matchExpenseTransaction) {
        txs.push(simResult.matchExpenseTransaction);
        balance += simResult.matchExpenseTransaction.amountPPU;
        expenses += Math.abs(simResult.matchExpenseTransaction.amountPPU);
      }

      currentFinances = {
        balancePPU: balance,
        totalIncomePPU: income,
        totalExpensesPPU: expenses,
        transactions: Object.freeze(txs),
      };
    }

    const previousHistory = this.club.matchHistory ?? [];
    const updatedMatchHistory = Object.freeze([...previousHistory, simResult.record]);

    this.club = createClub({
      ...this.club,
      squad: simResult.updatedHomeSquad,
      ...(currentFinances ? { finances: currentFinances } : {}),
      matchHistory: updatedMatchHistory,
    });

    // Notify interruption queue of the match result
    this.enqueueInterruption({
      id: `match-interruption-${matchId}`,
      kind: 'final',
      title: `${this.club.shortName} ${simResult.record.homeScore} x ${simResult.record.awayScore} ${rivalPreset.shortName}`,
      description: simResult.record.summaryPt,
    });

    if (matchedLocalClub) {
      const milestone = Object.freeze({
        date: Object.freeze({ ...this.clock.getDate() }),
        title: `Amistoso contra ${this.club.shortName}`,
        description: `Partida amistosa em ${this.clock.getDate().year}: ${simResult.record.homeScore} x ${simResult.record.awayScore}. Renda rateada amistosamente.`,
      });
      const updatedLocalClubs = this.localClubs.map((lc) => {
        if (lc.id !== matchedLocalClub.id) return lc;
        const awayRevenueShare = Math.round((simResult.record.gateReceiptsPPU ?? 0) * 0.4);
        return Object.freeze({
          ...lc,
          finances: Object.freeze({
            cashBalancePpu: lc.finances.cashBalancePpu + awayRevenueShare,
            monthlyBudgetPpu: lc.finances.monthlyBudgetPpu,
          }),
          historicalMilestones: Object.freeze([...lc.historicalMilestones, milestone]),
        });
      });
      this.localClubs = Object.freeze(updatedLocalClubs);
    }

    if (matchedRegionalClub) {
      const milestone = Object.freeze({
        date: Object.freeze({ ...this.clock.getDate() }),
        title: `Prélio Intermunicipal contra ${this.club.shortName}`,
        description: `Encontro interestadual/intermunicipal em ${this.clock.getDate().year}: ${this.club.shortName} ${simResult.record.homeScore} x ${simResult.record.awayScore} ${matchedRegionalClub.shortName}.`,
      });
      const updatedRegionalClubs = this.regionalClubs.map((rc) => {
        if (rc.id !== matchedRegionalClub.id) return rc;
        const awayRevenueShare = Math.round((simResult.record.gateReceiptsPPU ?? 0) * 0.4);
        return Object.freeze({
          ...rc,
          matchesPlayedAgainstCapital: rc.matchesPlayedAgainstCapital + 1,
          finances: Object.freeze({
            ...rc.finances,
            cashBalancePpu: rc.finances.cashBalancePpu + awayRevenueShare,
          }),
          historicalMilestones: Object.freeze([...rc.historicalMilestones, milestone]),
        });
      });
      this.regionalClubs = Object.freeze(updatedRegionalClubs);
    }

    this.handlePostMatchRivalryAndIncidents(simResult.record, competitionType === 'festival_taça');

    return simResult.record;
  }

  setPersonRegistryState(state?: PersonRegistryState): void {
    this.personRegistry = new PersonRegistry(state);
  }

  foundClubWithParcel(club: ClubState, parcelId: string, contract: LandOccupancyContract): boolean {
    if (!this.city1910) return false;
    const parcelIndex = this.city1910.parcels.parcels.findIndex((p) => p.id === parcelId);
    if (parcelIndex === -1) return false;

    const parcel = this.city1910.parcels.parcels[parcelIndex];
    let updatedParcel = parcel;

    if (contract.type === 'COMPRA' || contract.type === 'DOACAO') {
      const transaction: ParcelTransaction = {
        id: `tx-${contract.id}`,
        date: contract.startDate,
        pricePpu: contract.type === 'COMPRA' ? contract.upfrontCostPpu : 0,
        sellerId: parcel.ownerId ?? null,
        buyerId: club.id,
      };
      updatedParcel = recordParcelPurchase(parcel, transaction);
    } else {
      const event: ParcelHistoricalEvent = {
        id: `ev-${contract.id}`,
        date: contract.startDate,
        kind: 'ownership-transferred',
        description: `Ocupação por ${club.name} sob regime de ${contract.type} (${contract.grantorName}).`,
      };
      updatedParcel = Object.freeze({
        ...parcel,
        historicalEvents: Object.freeze([...parcel.historicalEvents, event]),
      });
    }

    const newParcelsList = [...this.city1910.parcels.parcels];
    newParcelsList[parcelIndex] = updatedParcel;
    this.city1910 = Object.freeze({
      ...this.city1910,
      parcels: Object.freeze({
        ...this.city1910.parcels,
        parcels: Object.freeze(newParcelsList),
      }),
    });

    const parcels = club.parcels.includes(parcelId) ? club.parcels : [...club.parcels, parcelId];
    const contracts = club.contracts ? [...club.contracts, contract] : [contract];

    const facilityDetails = club.facilityDetails ?? generateInitialFacilities(club.foundingOrigin, club.foundingDate);
    const facilities = facilityDetails.map((f) => f.id);

    let finances = club.finances ?? createInitialLedger(250, club.foundingDate, club.foundingOrigin);
    if (contract.upfrontCostPpu && contract.upfrontCostPpu > 0) {
      finances = recordTransaction(
        finances,
        contract.startDate,
        contract.type === 'COMPRA' ? 'land_purchase' : 'land_rent',
        -contract.upfrontCostPpu,
        `Pagamento inicial da parcela da sede (${contract.type})`,
      );
    }

    const foundingGroup = generateFoundingGroup(club.foundingOrigin, this.rng, { foundingYear: club.foundingDate.year });
    const membership = club.membership ?? generateInitialMembership(foundingGroup, club.foundingDate, this.rng.worldSeed);
    const board = club.board ?? generateInitialBoard(foundingGroup, club.foundingDate, 1);

    // Bootstrap founders into the materialized PersonRegistry (Alpha D: D1, D2, D3)
    this.personRegistry.bootstrapFounders(foundingGroup, this.rng);

    const parcelDistrictId = parcel.districtId ?? 'd-centro';
    const socialIdentity = club.socialIdentity ?? createInitialSocialIdentity(club.foundingOrigin, parcelDistrictId);

    const politics = club.politics ?? generateEmergentFactions({
      foundingOrigin: club.foundingOrigin,
      foundingYear: club.foundingDate.year,
      currentYear: this.clock.getDate().year,
      leaderId: foundingGroup.leader.id,
      leaderName: foundingGroup.leader.name,
      balancePPU: finances.balancePPU,
      monthlyFeePPU: membership.settings.monthlyDuesPPU.contribuinte,
      hasLuxuryFacility: facilityDetails.some((f) => f.type === 'clubhouse' || f.type === 'wooden_stands'),
      memberCount: membership.members.length,
    });

    // Form the inaugural football squad in 1910 Pyramid 2-3-5 formation (Alpha E: E1 + E2)
    const availablePersons = this.personRegistry.getAll();
    const squad = club.squad ?? generateInauguralFootballSquad(
      club.name,
      club.foundingDate,
      availablePersons,
      this.rng
    );

    const athleticsPolicy = club.athleticsPolicy ?? createDefaultClubAthleticsPolicy(club.foundingDate);

    const foundingLedger = club.historicalLedger ?? recordHistoricalEvent(createEmptyHistoricalLedger(), {
      id: `ev-fundacao-${club.id}`,
      date: club.foundingDate,
      category: 'FUNDACAO',
      importance: 100,
      title: `Fundação Solene do ${club.name}`,
      description: `Reunião magna de fundação promovida pelo segmento ${club.foundingOrigin} no arrabalde de ${parcelDistrictId}.`,
      clubs: [club.id],
      people: club.founders,
      facilities,
      causes: [],
      tags: ['fundacao', 'marcoalfa', club.foundingOrigin],
    });

    const updatedClub: ClubState = createClub({
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      foundingDate: club.foundingDate,
      foundingOrigin: club.foundingOrigin,
      foundingStory: club.foundingStory,
      colors: club.colors,
      crestHistory: club.crestHistory,
      founders: club.founders,
      parcels,
      facilities,
      reputation: club.reputation,
      contracts,
      facilityDetails,
      finances,
      membership,
      board,
      socialIdentity,
      politics,
      squad,
      athleticsPolicy,
      trophies: club.trophies,
      historicalLedger: foundingLedger,
    });

    this.setClub(updatedClub);
    if (this.competitions.length === 0 || this.competitions.every((c) => c.status === 'scheduled')) {
      this.competitions = generateAnnualCompetitions(
        this.clock.getDate().year,
        this.localClubs,
        this.regionalClubs,
        updatedClub,
        this.federation,
        this.rng
      );
    }
    this.ensureRivalriesInitialized();

    // Inaugural press article published in O Diário da Manhã
    const inauguralArticle = generateGeneralPressArticle({
      newspaperId: 'diario',
      date: updatedClub.foundingDate,
      category: 'club_founding',
      headline: `Surge em Cidade de Minas o ${updatedClub.name}!`,
      subheadline: `Entusiastas do esporte bretão fundam nova agremiação no bairro ${parcelDistrictId}`,
      bodyText: `Com grande júbilo dos aficionados pelo foot-ball, foi formalmente fundado em nossa urbe o ${updatedClub.name}. A novel agremiação nasce com o propósito de elevar a prática atlética e congregar os cidadãos em torno das mais nobres disputas esportivas. Fixando sua sede e praça de exercícios no distrito de ${parcelDistrictId}, a diretoria provisória promete organizar em breve o quadro de sócios e os primeiros festivais de bola entre os rapazes da capital.`,
      relatedClubIds: [updatedClub.id],
    });
    this.addPressArticle(inauguralArticle);

    return true;
  }

  /**
   * Ensures the campaign's protagonist club (Tradição Esporte Clube) is founded in 1910
   * on the primary parcel of Cidade de Minas, establishing its grounds, board, squad, and social book.
   */
  ensureFoundingClub(): ClubState | null {
    if (this.club) return this.club;
    if (!this.city1910 || this.city1910.parcels.parcels.length === 0) return null;

    const primaryParcel = this.city1910.parcels.parcels[0];
    const seed = this.rng.worldSeed;
    const origin: FoundingOrigin = 'railway';
    const founding = generateFoundingGroup(origin, this.rng, { foundingYear: 1910 });
    const clubId = `club-${seed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1910`;

    const contractProposals = generateContractProposals({
      parcel: primaryParcel,
      clubId,
      origin,
      date: { year: 1910, month: 1, day: 1 },
      initialCapitalPpu: founding.profile.baseCapitalPPU,
    });
    const contract = contractProposals.find((c) => c.type === 'CESSAO_EMPRESARIAL') ?? contractProposals[0];

    const initialClub = createClub({
      id: clubId,
      name: 'Tradição Esporte Clube',
      shortName: 'Tradição',
      foundingDate: { year: 1910, month: 1, day: 1 },
      foundingOrigin: origin,
      foundingStory: founding.foundingAta,
      colors: { primary: '#1A365D', secondary: '#F7FAFC', accent: '#E2E8F0' },
      crestHistory: [
        {
          startYear: 1910,
          designId: 'crest-1910-shield',
          changeReason: 'Escudo fundacional pioneiro de 1910',
        },
      ],
      founders: founding.members.map((m) => m.id),
      parcels: [primaryParcel.id],
      facilities: ['campo-1910'],
      reputation: 35,
      contracts: [contract],
    });

    this.foundClubWithParcel(initialClub, primaryParcel.id, contract);
    return this.club;
  }

  /** Constructs a new facility for the club, debiting its build cost from finances. */
  buildClubFacility(type: FacilityType, customName?: string): boolean {
    if (!this.club || !this.club.finances) return false;
    const def = FACILITY_CATALOG[type];
    if (this.club.finances.balancePPU < def.buildCostPPU) return false;

    const existingFacilities = this.club.facilityDetails ?? [];
    const newFacility = createFacility(type, this.clock.getDate(), existingFacilities.length + 1, customName);

    const updatedFinances = recordTransaction(
      this.club.finances,
      this.clock.getDate(),
      'facility_construction',
      -def.buildCostPPU,
      `Construção de nova instalação: ${newFacility.name}`,
    );

    let updatedLedger = this.club.historicalLedger;
    if (updatedLedger) {
      updatedLedger = recordHistoricalEvent(updatedLedger, {
        id: `ev-obra-${newFacility.id}`,
        date: this.clock.getDate(),
        category: 'OBRA',
        importance: 60,
        title: `Patrimônio Erguido: ${newFacility.name}`,
        description: `Conclusão das obras da instalação ${newFacility.name} (${def.defaultName}), agregando infraestrutura à praça de esportes.`,
        clubs: [this.club.id],
        facilities: [newFacility.id],
        causes: [`ev-fundacao-${this.club.id}`],
        tags: ['patrimonio', 'obra', newFacility.type],
      });
    }

    const nextFacilityDetails = [...existingFacilities, newFacility];
    const updatedClub = createClub({
      ...this.club,
      facilities: nextFacilityDetails.map((f) => f.id),
      facilityDetails: nextFacilityDetails,
      finances: updatedFinances,
      ...(updatedLedger ? { historicalLedger: updatedLedger } : {}),
    });

    this.setClub(updatedClub);
    return true;
  }

  /** Repairs a damaged club facility back to 100% condition. */
  repairClubFacility(facilityId: string): boolean {
    if (!this.club || !this.club.finances || !this.club.facilityDetails) return false;
    const facility = this.club.facilityDetails.find((f) => f.id === facilityId);
    if (!facility || facility.condition >= 100) return false;

    const repairCost = Math.round(facility.valuePPU * ((100 - facility.condition) / 100) * 0.4);
    if (this.club.finances.balancePPU < repairCost) return false;

    const updatedFinances = recordTransaction(
      this.club.finances,
      this.clock.getDate(),
      'facility_maintenance',
      -repairCost,
      `Reforma e restauração da instalação: ${facility.name}`,
    );

    const nextFacilityDetails = this.club.facilityDetails.map((f) => (f.id === facilityId ? repairFacility(f) : f));
    const updatedClub = createClub({
      ...this.club,
      facilityDetails: nextFacilityDetails,
      finances: updatedFinances,
    });

    this.setClub(updatedClub);
    return true;
  }

  /** Admits a new member to the club, collecting admission fee into the ledger. */
  admitClubMember(
    name: string,
    category: MemberCategory,
    socialClass: 'working_class' | 'middle_class' | 'upper_class' | 'elite',
    occupation: string,
  ): boolean {
    if (!this.club || !this.club.membership || !this.club.finances) return false;

    const { updatedMembership, newMember, admissionFeePPU } = admitMember(
      this.club.membership,
      name,
      category,
      socialClass,
      occupation,
      this.clock.getDate(),
    );

    let updatedFinances = this.club.finances;
    if (admissionFeePPU > 0) {
      updatedFinances = recordTransaction(
        updatedFinances,
        this.clock.getDate(),
        'membership_dues',
        admissionFeePPU,
        `Jóia de admissão de novo sócio: ${newMember.name} (${category})`,
      );
    }

    const updatedClub = createClub({
      ...this.club,
      membership: updatedMembership,
      finances: updatedFinances,
    });

    this.setClub(updatedClub);
    return true;
  }

  /** Install validated, seed-derived city metadata during save hydration. */
  setCityData1910(city: CityCampaignData1910 | null): void {
    this.city1910 = city;
    if (city && this.localClubs.length === 0) {
      this.localClubs = generateInitial1910LocalClubs(city.districts.districts, this.rng);
    }
    if (city && this.regionalClubs.length === 0) {
      this.regionalClubs = generateHistoricalRegionalClubs();
    }
  }

  getDecisionLog(): DecisionLogState {
    return this.decisions.snapshot();
  }

  recordDecision(decision: CampaignDecision): boolean {
    if (decision.day !== this.clock.getElapsedDays()) return false;
    return this.decisions.append(decision);
  }

  restoreDecisionLog(state: unknown): boolean {
    const decisions = DecisionLog.fromSnapshot(state);
    if (!decisions) return false;
    if (decisions.snapshot().entries.some((entry) => entry.day > this.clock.getElapsedDays())) return false;
    this.decisions = decisions;
    return true;
  }

  getTerrain(): Terrain {
    return this.terrain;
  }

  getTerrainRevision(): number {
    return this.terrainRev;
  }

  /**
   * Atomically swap in a new Terrain instance and wire the mutation callback.
   *
   * EXACT ordering — do NOT reorder these steps:
   *   1. Dimension validation FIRST (throws before any state change on mismatch).
   *   2. Clear the previous terrain's callback (if a previous terrain exists).
   *   3. Assign the new terrain.
   *   4. Wire the new terrain's onMutate callback to bump terrainRev.
   *   5. Bump terrainRev once for the install itself.
   *
   * Callers: constructor (initial install), World.reset(), save deserialization.
   */
  installTerrain(t: Terrain): void {
    // Step 1: validate dimensions BEFORE any state mutation.
    if (t.getWidth() !== this.map.getWidth() || t.getHeight() !== this.map.getHeight()) {
      throw new Error(
        `installTerrain: dimension mismatch — terrain (${t.getWidth()}×${t.getHeight()}) does not match map (${this.map.getWidth()}×${this.map.getHeight()})`
      );
    }
    // Step 2: clear the previous instance's callback (only if one exists — during the
    // constructor's first call, this.terrain is undefined).
    if (this.terrain !== undefined) {
      this.terrain.setOnMutate(null);
    }
    // Step 3: assign.
    this.terrain = t;
    // Step 4: wire.
    t.setOnMutate(() => { this.terrainRev++; });
    // Step 5: bump for the install itself.
    this.terrainRev++;
  }

  /**
   * Water is derived: a cell is water iff in-bounds and any corner is at/below SEA_LEVEL.
   * Out-of-bounds coordinates return false.
   */
  isWater(x: number, y: number): boolean {
    if (this.map.getTile(x, y) === null) return false;
    return this.terrain.getTileMinCornerHeight(x, y) <= SEA_LEVEL;
  }

  /**
   * True iff the w×h footprint at (x,y) is buildable.
   * Delegates to Terrain, injecting this.isWater as the water predicate.
   */
  canBuildAt(x: number, y: number, w: number, h: number): boolean {
    return this.terrain.canBuildAt(x, y, w, h, (xx, yy) => this.isWater(xx, yy));
  }

  /**
   * True iff a road can be placed at (x,y).
   * Delegates to Terrain, injecting this.isWater as the water predicate.
   */
  canBuildRoadAt(x: number, y: number): boolean {
    return this.terrain.canBuildRoadAt(x, y, (xx, yy) => this.isWater(xx, yy));
  }

  getTick(): number {
    return this.tickCount;
  }

  getMoney(): number {
    return this.money;
  }

  /** Historical campaign date, beginning on 01/01/1910. */
  getDate(): WorldDate {
    return this.clock.getDate();
  }

  getElapsedDays(): number {
    return this.clock.getElapsedDays();
  }

  isCampaignComplete(): boolean {
    return this.clock.isComplete();
  }

  /** Queue a decision-worthy event at the authoritative campaign date. */
  enqueueInterruption(input: Omit<InterruptionInput, 'date'>): boolean {
    return this.interruptions.enqueue({ ...input, date: this.clock.getDate() });
  }

  getInterruptions(): ReadonlyArray<Interruption> {
    return this.interruptions.getAll();
  }

  getInterruptionState(): ReturnType<InterruptionQueue['snapshot']> {
    return this.interruptions.snapshot();
  }

  restoreInterruptionState(state: unknown): boolean {
    const queue = InterruptionQueue.fromSnapshot(state);
    if (!queue) return false;
    this.interruptions = queue;
    return true;
  }

  acknowledgeInterruption(id?: string): Interruption | null {
    return id === undefined ? this.interruptions.dequeue() : this.interruptions.acknowledge(id);
  }

  setAutoPause(kind: InterruptionKind, enabled: boolean): boolean {
    return this.interruptions.setAutoPause(kind, enabled);
  }

  getAutoPauseConfig(): AutoPauseConfig {
    return this.interruptions.getAutoPauseConfig();
  }

  /** GameLoop-only handshake: each eligible item can trigger pause once. */
  claimAutoPauseInterruption(): Interruption | null {
    return this.interruptions.claimAutoPause();
  }

  /**
   * Restore elapsed days to a specific count. For serialization use only —
   * do not call this in normal gameplay logic; tick() advances the calendar.
   */
  setElapsedDays(n: number): boolean {
    if (!this.clock.setElapsedDays(n)) return false;
    // 1 tick = 1 day: set both so getTick()/getDate() stay consistent by construction.
    this.tickCount = n;
    return true;
  }

  /** Money is always whole non-negative units; this guard enforces that invariant for all mutators. */
  private isValidMoneyAmount(n: number): boolean {
    return Number.isInteger(n) && n >= 0;
  }

  trySpend(amount: number): boolean {
    if (!this.isValidMoneyAmount(amount) || this.money < amount) return false;
    this.money -= amount;
    this.markHappinessDirty();
    return true;
  }

  earn(amount: number): void {
    if (!this.isValidMoneyAmount(amount)) return;
    this.money += amount;
    this.markHappinessDirty();
  }

  /**
   * Restore the treasury to a specific amount. For serialization use only —
   * do not call this in normal gameplay logic; use trySpend/earn instead.
   */
  setMoney(amount: number): boolean {
    if (!this.isValidMoneyAmount(amount)) return false;
    this.money = amount;
    this.markHappinessDirty();
    return true;
  }

  /** Lazy-allocate and return the LandValueMap instance. */
  getLandValue(): LandValueMap {
    if (this.landValue === null) {
      this.landValue = new LandValueMap(this.map.getWidth(), this.map.getHeight());
    }
    return this.landValue;
  }

  /** Recompute land value only if dirty; clears the flag. */
  recomputeLandValueIfDirty(): void {
    if (!this.landValueDirty) return;
    this.recomputeLandValue();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputeLandValue(): void {
    // B2 — freshness drain: land value reads the four coverage maps AND traffic congestion,
    // so drain every one of those inputs FIRST. This guarantees land value always reads
    // FRESH inputs regardless of caller. getTrafficMap() is the traffic drain (it recomputes
    // if dirty, which force-refreshes labor inside recomputeTraffic), so congestion is never
    // a tick stale. The drain chain only points UPSTREAM (land value → traffic → labor);
    // nothing in it reads or dirties land value, so there is no re-entrancy.
    this.recomputeServiceIfDirty();
    this.recomputeFireIfDirty();
    this.recomputeHospitalIfDirty();
    this.recomputeSchoolIfDirty();
    const lv = this.getLandValue();
    lv.recompute(this.map, this.structures, {
      police: this.getServiceCoverageMap(),
      fire: this.getFireCoverageMap(),
      hospital: this.getHospitalCoverageMap(),
      school: this.getSchoolCoverageMap(),
    }, this.getTrafficMap());
    this.landValueDirty = false;
    // Happiness reads land value; refreshing land value invalidates the derived happiness cache.
    this.happinessDirty = true;
  }

  /** Mark land value as needing recomputation on the next recomputeLandValueIfDirty() call. */
  markLandValueDirty(): void {
    this.dirtyLandValueAndHappiness();
  }

  /** ONE place the land-value→happiness cascade lives. Set both dirty flags together so no mutation can dirty land value without also dirtying happiness. */
  private dirtyLandValueAndHappiness(): void {
    this.landValueDirty = true;
    this.happinessDirty = true;
  }

  private markHappinessDirty(): void {
    this.happinessDirty = true;
  }

  getStructureMap(): StructureMap {
    return this.structures;
  }

  /** Lazy-allocate and return the PowerMap instance. */
  getPowerMap(): PowerMap {
    if (this.power === null) this.power = new PowerMap(this.map.getWidth(), this.map.getHeight());
    return this.power;
  }

  markPowerDirty(): void {
    this.powerDirty = true;
  }

  /** Recompute power only if dirty; clears the flag. */
  recomputePowerIfDirty(): void {
    if (!this.powerDirty) return;
    this.recomputePower();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputePower(): void {
    const pm = this.getPowerMap();
    pm.recompute(this.map, this.structures);
    this.powerDirty = false;
  }

  /** Lazy-allocate and return the WaterMap instance. */
  getWaterMap(): WaterMap {
    if (this.water === null) this.water = new WaterMap(this.map.getWidth(), this.map.getHeight());
    return this.water;
  }

  markWaterDirty(): void {
    this.waterDirty = true;
  }

  /** Recompute water only if dirty; clears the flag. */
  recomputeWaterIfDirty(): void {
    if (!this.waterDirty) return;
    this.recomputeWater();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputeWater(): void {
    const wm = this.getWaterMap();
    wm.recompute(this.map, this.structures);
    this.waterDirty = false;
  }

  /** Lazy-allocate and return the ServiceCoverageMap instance. */
  getServiceCoverageMap(): ServiceCoverageMap {
    if (this.service === null) this.service = new ServiceCoverageMap(this.map.getWidth(), this.map.getHeight());
    return this.service;
  }

  markServiceDirty(): void {
    this.serviceDirty = true;
    // B1 — dirty cascade: land value reads the four coverage maps, so any coverage
    // change must also dirty land value and happiness. Route through the shared helper.
    this.dirtyLandValueAndHappiness();
  }

  /** Recompute service coverage only if dirty; clears the flag. */
  recomputeServiceIfDirty(): void {
    if (!this.serviceDirty) return;
    this.recomputeService();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputeService(): void {
    const svc = this.getServiceCoverageMap();
    svc.recompute(this.map, this.structures);
    this.serviceDirty = false;
  }

  /** Lazy-allocate and return the FireCoverageMap instance. */
  getFireCoverageMap(): FireCoverageMap {
    if (this.fire === null) this.fire = new FireCoverageMap(this.map.getWidth(), this.map.getHeight());
    return this.fire;
  }

  markFireDirty(): void {
    this.fireDirty = true;
    this.dirtyLandValueAndHappiness(); // B1 cascade — see markServiceDirty.
  }

  /** Recompute fire coverage only if dirty; clears the flag. */
  recomputeFireIfDirty(): void {
    if (!this.fireDirty) return;
    this.recomputeFire();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputeFire(): void {
    const fireSvc = this.getFireCoverageMap();
    fireSvc.recompute(this.map, this.structures);
    this.fireDirty = false;
  }

  /** Lazy-allocate and return the HospitalCoverageMap instance. */
  getHospitalCoverageMap(): HospitalCoverageMap {
    if (this.hospital === null) this.hospital = new HospitalCoverageMap(this.map.getWidth(), this.map.getHeight());
    return this.hospital;
  }

  markHospitalDirty(): void {
    this.hospitalDirty = true;
    this.dirtyLandValueAndHappiness(); // B1 cascade — see markServiceDirty.
  }

  /** Recompute hospital coverage only if dirty; clears the flag. */
  recomputeHospitalIfDirty(): void {
    if (!this.hospitalDirty) return;
    this.recomputeHospital();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputeHospital(): void {
    const hospitalSvc = this.getHospitalCoverageMap();
    hospitalSvc.recompute(this.map, this.structures);
    this.hospitalDirty = false;
  }

  /** Lazy-allocate and return the SchoolCoverageMap instance. */
  getSchoolCoverageMap(): SchoolCoverageMap {
    if (this.school === null) this.school = new SchoolCoverageMap(this.map.getWidth(), this.map.getHeight());
    return this.school;
  }

  markSchoolDirty(): void {
    this.schoolDirty = true;
    this.dirtyLandValueAndHappiness(); // B1 cascade — see markServiceDirty.
  }

  /** Recompute school coverage only if dirty; clears the flag. */
  recomputeSchoolIfDirty(): void {
    if (!this.schoolDirty) return;
    this.recomputeSchool();
  }

  /** Unconditional force-recompute; also clears the dirty flag. */
  recomputeSchool(): void {
    const schoolSvc = this.getSchoolCoverageMap();
    schoolSvc.recompute(this.map, this.structures);
    this.schoolDirty = false;
  }

  /**
   * Lazy-allocate and return the TrafficMap instance, draining dirtiness before returning.
   *
   * NOTE: this getter DRAINS (calls recomputeTrafficIfDirty) — unlike the non-draining
   * coverage getters (e.g. getFireCoverageMap). This is the stale-free read contract:
   * callers always get a fresh snapshot without needing to manually recompute first.
   */
  getTrafficMap(): TrafficMap {
    if (this.traffic === null) this.traffic = new TrafficMap(this.map.getWidth(), this.map.getHeight());
    // Drain-on-read: coverage getters do NOT drain; traffic inverts this contract.
    this.recomputeTrafficIfDirty();
    return this.traffic;
  }

  /**
   * Mark traffic as needing recomputation on the next recomputeTrafficIfDirty() or getTrafficMap() call.
   *
   * Traffic is a simulation INPUT: it feeds land value (the proximity-weighted congestion
   * penalty) and happiness (the city-wide congestion index). Its dirtiness therefore cascades
   * exactly like coverage dirtiness — see markServiceDirty. Cascading on MARK (never on
   * recompute) is what keeps a drain-on-read frame — e.g. the data-view overlay calling
   * getTrafficMap() between ticks — from silently clearing land value's need to refresh.
   */
  markTrafficDirty(): void {
    this.trafficDirty = true;
    this.dirtyLandValueAndHappiness();
  }

  /** Recompute traffic only if dirty; clears the flag. */
  recomputeTrafficIfDirty(): void {
    if (!this.trafficDirty) return;
    this.recomputeTraffic();
  }

  /**
   * Unconditional force-recompute; also clears the dirty flag.
   *
   * IMPORTANT: must NOT call getTrafficMap() — that drains (calls recomputeTrafficIfDirty →
   * recomputeTraffic) and would cause infinite recursion. Allocate the field directly here.
   */
  recomputeTraffic(): void {
    // Force-refresh labor FIRST (not the IfDirty variant): recompute always reflects
    // current buildings, and the cadence force-recompute path must never feed stale or
    // empty flows. recomputeLabor never calls back into traffic, so no cycle.
    this.recomputeLabor();
    // Allocate directly — never via getTrafficMap() to avoid re-entering recomputeTrafficIfDirty.
    if (this.traffic === null) this.traffic = new TrafficMap(this.map.getWidth(), this.map.getHeight());
    this.traffic.recompute(this.map, this.structures, this.getLaborMarket().getFlows());
    this.trafficDirty = false;
  }

  /**
   * Lazy-allocate and return the LaborMarketMap instance, draining dirtiness before returning.
   *
   * Mirrors getTrafficMap's drain-on-read contract: callers always get a fresh snapshot
   * without needing to manually recompute first.
   */
  getLaborMarket(): LaborMarketMap {
    if (this.labor === null) this.labor = new LaborMarketMap();
    // Drain-on-read.
    this.recomputeLaborIfDirty();
    return this.labor;
  }

  /**
   * Mark the labor market as needing recomputation on the next recomputeLaborIfDirty()
   * or getLaborMarket() call. Cascades to traffic (traffic consumes labor flows — and
   * traffic in turn cascades to land value and happiness) and to demand (demand is derived
   * from the labor-market scalars).
   */
  markLaborDirty(): void {
    this.laborDirty = true;
    // Traffic consumes labor flows (recomputeTraffic calls getLaborMarket().getFlows()),
    // so stale labor means stale traffic — cascade the invalidation down-dependency.
    // Route through markTrafficDirty() rather than setting the flag: the onward
    // traffic → land value → happiness cascade lives in ONE place.
    this.markTrafficDirty();
    // Demand is derived from the labor market — stale labor means stale demand.
    this.markDemandDirty();
  }

  /** Recompute the labor market only if dirty; clears the flag. */
  recomputeLaborIfDirty(): void {
    if (!this.laborDirty) return;
    this.recomputeLabor();
  }

  /**
   * Unconditional force-recompute; also clears the dirty flag.
   *
   * IMPORTANT: must NOT call getLaborMarket() — that drains (calls recomputeLaborIfDirty →
   * recomputeLabor) and would cause infinite recursion. Allocate the field directly here.
   */
  recomputeLabor(): void {
    // Allocate directly — never via getLaborMarket() to avoid re-entering recomputeLaborIfDirty.
    if (this.labor === null) this.labor = new LaborMarketMap();
    this.labor.recompute(this.map, this.structures, this.map.getBuildings());
    this.laborDirty = false;
  }

  /** Workers that found a job (drains labor on read). */
  getEmployed(): number {
    return this.getLaborMarket().getEmployed();
  }

  /** Workers with no job (drains labor on read). */
  getUnemployed(): number {
    return this.getLaborMarket().getUnemployed();
  }

  /** Total jobs that exist (drains labor on read). */
  getJobsCapacity(): number {
    return this.getLaborMarket().getJobsCapacity();
  }

  markDemandDirty(): void {
    this.demandDirty = true;
  }

  getDemand(): DemandVector {
    if (this.demand === null) {
      this.demand = new Demand();
    }
    if (this.demandDirty) {
      // Force-refresh labor before reading scalars — mirrors recomputeTraffic's force-refresh
      // pattern; no cycle since recomputeLabor never calls getDemand.
      this.recomputeLabor();
      const labor = this.getLaborMarket();
      this.demand.recompute(this.map.getBuildings(), {
        employed: labor.getEmployed(),
        unemployed: labor.getUnemployed(),
        reachableUnfilledJobs: labor.getReachableUnfilledJobs(),
        jobsCapacity: labor.getJobsCapacity(),
      });
      this.demandDirty = false;
    }
    return this.demand.get();
  }

  /** Count DIRT tiles currently on the map. */
  countDirt(): number {
    let count = 0;
    for (const tile of this.map.iterateTiles()) {
      if (tile.type === TileType.DIRT) count++;
    }
    return count;
  }

  /**
   * City-wide happiness scalar in [0, 1]. Display-only KPI — never feeds growth/demand/level-up.
   * Lazy: recomputes only when inputs (land value, money, buildings, traffic) have changed
   * since last read.
   */
  getHappiness(): number {
    this.recomputeHappinessIfDirty();
    return this.happiness;
  }

  private recomputeHappinessIfDirty(): void {
    if (!this.happinessDirty) return;
    this.recomputeHappiness();
  }

  private recomputeHappiness(): void {
    // Drain land value FIRST so anchor reads are fresh — mirrors recomputeLandValue draining coverage.
    this.recomputeLandValueIfDirty();

    let capacitySumR = 0;
    let capacitySumC = 0;
    let capacitySumI = 0;
    let residentialCount = 0;
    let residentialLandValueSum = 0;

    for (const b of this.map.getBuildings().iterBuildings()) {
      if (b.abandoned) continue;
      if (b.type === 'residential') {
        capacitySumR += buildingCapacity(b);
        residentialCount++;
        residentialLandValueSum += this.getLandValue().getValue(b.anchor.x, b.anchor.y);
      } else if (b.type === 'commercial') {
        capacitySumC += buildingCapacity(b);
      } else {
        capacitySumI += buildingCapacity(b);
      }
    }

    const jobsCapacitySum = capacitySumC + capacitySumI;

    if (residentialCount === 0 && jobsCapacitySum === 0) {
      this.happiness = EMPTY_CITY_HAPPINESS;
      this.happinessDirty = false;
      return;
    }

    const landScore = residentialCount > 0 ? clamp01(residentialLandValueSum / residentialCount) : 0;
    const jobsBalance = clamp01(1 - Math.abs(jobsCapacitySum - capacitySumR) / Math.max(jobsCapacitySum + capacitySumR, 1));
    const budgetHealth = clamp01(this.money / STARTING_FUNDS);
    // Traffic drains on read; the land-value drain above already refreshed it whenever traffic
    // was dirty (markTrafficDirty dirties land value too), so this is a plain read in practice.
    const congestionIndex = this.getTrafficMap().getCongestionIndex();

    this.happiness = clamp01(HAPPINESS_W_LAND * landScore + HAPPINESS_W_JOBS * jobsBalance + HAPPINESS_W_BUDGET * budgetHealth - HAPPINESS_W_TRAFFIC * congestionIndex);
    this.happinessDirty = false;
  }

  /** Sum of buildingCapacity(building) across all non-abandoned buildings. Population now lives on buildings, not tiles. */
  getPopulation(): number {
    let sum = 0;
    for (const building of this.map.getBuildings().iterBuildings()) {
      if (building.abandoned) continue;
      sum += buildingCapacity(building);
    }
    return sum;
  }

  /**
   * Reset to a blank city: clear the map, the tick counter, the calendar, and the treasury.
   * Also clears the StructureMap and zeroes the PowerMap backing array so subsequent
   * `isPowered` reads start clean.
   * installTerrain creates a fresh Terrain and bumps terrainRev — SelectionRenderer's
   * lastRev will differ from the world rev on the next frame and forceRedraw() fires once.
   *
   * @param opts.regenerate - When true (default), runs procedural terrain generation.
   *   Pass `{ regenerate: false }` to restore a flat all-MIN_LAND_ELEVATION terrain (used by
   *   deserialization hydration paths so loaded terrain is not overwritten).
   *   Water is derived from elevation — no flat canvas contains water by default.
   *   Power and water maps are both cleared and their dirty flags reset.
   * @param opts.worldSeed - Campaign seed used to reset every independent RNG stream.
   * @param opts.seed - Legacy numeric alias used by terrain/dev callers. It is normalized into
   *   a campaign worldSeed and cannot be combined with opts.worldSeed.
   */
  reset(opts?: { regenerate?: boolean; seed?: number; worldSeed?: string }): void {
    const regenerate = opts?.regenerate ?? true;
    if (opts?.seed !== undefined && opts.worldSeed !== undefined) {
      throw new Error('World.reset cannot combine seed and worldSeed');
    }
    const worldSeed = opts?.worldSeed ??
      (opts?.seed !== undefined ? worldSeedFromNumber(opts.seed) : this.rng.worldSeed);
    this.rng = new CampaignRng(worldSeed);
    this.city1910 = null;
    this.cityGrowth = null;
    this.cityTransformation = null;
    this.localClubs = [];
    this.regionalClubs = [];
    this.federation = null;
    this.competitions = [];
    this.tacaBrasil1959 = null;
    this.rivalries = [];
    this.pressArchive = [];

    this.demandDirty = true;
    this.map.reset();
    this.structures.clear();
    if (this.power !== null) this.power.clear();
    this.powerDirty = false;
    if (this.water !== null) this.water.clear();
    this.waterDirty = false;
    if (this.service !== null) this.service.clear();
    this.serviceDirty = false;
    if (this.fire !== null) this.fire.clear();
    this.fireDirty = false;
    if (this.hospital !== null) this.hospital.clear();
    this.hospitalDirty = false;
    if (this.school !== null) this.school.clear();
    this.schoolDirty = false;
    if (this.traffic !== null) this.traffic.clear();
    this.trafficDirty = false;
    if (this.labor !== null) this.labor.clear();
    this.laborDirty = false;
    this.tickCount = 0;
    this.clock.reset();
    this.interruptions.clear();
    this.decisions = new DecisionLog();
    this.money = STARTING_FUNDS;
    this.landValueDirty = false;

    if (!regenerate) {
      // Flat default terrain — used by deserialization paths.
      this.installTerrain(new Terrain(this.map.getWidth(), this.map.getHeight()));
      this.recomputePowerIfDirty();
      this.recomputeWaterIfDirty();
      this.recomputeServiceIfDirty();
      this.recomputeFireIfDirty();
      this.recomputeHospitalIfDirty();
      this.recomputeSchoolIfDirty();
      // B1' — land value depends on coverage, which is now cleared/zero. Recompute
      // last so the already-allocated LandValueMap drops any stale pre-reset values.
      this.recomputeLandValue();
      // Mark happiness dirty so the next read re-derives from the fresh reset state.
      this.markHappinessDirty();
      return;
    }

    // Procedural terrain generation.
    const W = this.map.getWidth();
    const H = this.map.getHeight();
    if (W >= 16 && H >= 16) {
      const city = generateCampaignCity1910(this.rng, W, H);
      this.city1910 = city.data;
      const baselineCity = createCityState(this.rng.worldSeed, { year: 1910, month: 1, day: 1 });
      this.cityGrowth = createCityGrowthState(baselineCity);
      this.cityTransformation = createCityTransformationState(baselineCity);
      this.installTerrain(city.terrain);
      this.localClubs = generateInitial1910LocalClubs(city.data.districts.districts, this.rng);
      this.regionalClubs = generateHistoricalRegionalClubs();
      this.competitions = generateAnnualCompetitions(
        1910,
        this.localClubs,
        this.regionalClubs,
        this.club,
        this.federation,
        this.rng
      );
      this.ensureRivalriesInitialized();
    } else {
      // Small maps are retained for focused Core simulations and fixtures.
      const { elevations } = terrainGenerator.generateTerrain(W, H, this.rng.city.nextUint32());
      const terrain = new Terrain(W, H);
      const vertexHeights = projectTileHeightsToVertexHeights(elevations);
      for (let vy = 0; vy <= H; vy++) {
        for (let vx = 0; vx <= W; vx++) terrain.unsafeSetVertexHeight(vx, vy, vertexHeights[vy][vx]);
      }
      this.installTerrain(terrain);
    }
    this.recomputePowerIfDirty();
    this.recomputeWaterIfDirty();
    this.recomputeServiceIfDirty();
    this.recomputeFireIfDirty();
    this.recomputeHospitalIfDirty();
    this.recomputeSchoolIfDirty();
    // B1' — land value depends on coverage, which is now cleared/zero. Recompute
    // last so the already-allocated LandValueMap drops any stale pre-reset values.
    this.recomputeLandValue();
    // Mark happiness dirty so the next read re-derives from the fresh reset state.
    this.markHappinessDirty();
  }

  /**
   * Re-run procedural terrain generation with the given seed, replacing the entire world state.
   *
   * @remarks This RESETS the entire world (map, buildings, treasury, calendar).
   * @param seed - Legacy numeric campaign seed. When absent, the current worldSeed is reused.
   */
  regenerateTerrain(seed?: number): void {
    this.reset({ regenerate: true, seed });
  }

  /**
   * Advance simulation by one tick.
   * Rules:
   *   1. tickCount is incremented first (post-increment means first growth fires at tick === ZONE_GROWTH_INTERVAL, not 0).
   *   2. HistoricalClock advances one Gregorian day; a completed campaign does not tick further.
   *   3. Derived fields are resolved BEFORE growth, each if dirty or on its cadence, in
   *      dependency order: utilities (power, water) → coverage (police, fire, hospital,
   *      school) → traffic (which force-refreshes the labor market inside recomputeTraffic)
   *      → land value (which reads the traffic snapshot). Every one of them is then a frozen
   *      read-only snapshot for the rest of the tick.
   *   4. DIRT heals to GRASS; each heal contributes to `changed`.
   *   5. Monthly tax settlement: when HistoricalClock enters the first day of a month,
   *      tax is settled for the actual number of days in the completed month, pre-growth.
   *   6. Zone growth: gated on tickCount % ZONE_GROWTH_INTERVAL === 0.
   *      Growth reads `landValue` as a frozen snapshot recomputed at the start of this
   *      tick (when dirty or on cadence). The growth pass mutates Building.level/density/age
   *      but NOT `landValue` or any influence input. If a future rule mutates influence
   *      inputs (roads/zones) MID-TICK, this invariant breaks — recompute or split into
   *      two passes.
   *   7. The traffic → land value → growth → buildings → labor → traffic loop is
   *      therefore ACROSS ticks, never within one: the buildings growth changes only set dirty
   *      flags (markLaborDirty at the end of this tick), which resolve at step 3 of the NEXT
   *      tick. One-tick lag, bounded work per tick.
   *      ABANDONMENT is deliberately OUTSIDE that loop: only growth decides on congestion,
   *      and the sweep reads the uncongested land value instead, so no edge runs from
   *      traffic to the verdict's land-value input. That acyclicity is the property this
   *      design buys; the argument for it is at the sweep in the growth pass below.
   */
  tick(): WorldTickResult {
    const changedTiles: { x: number; y: number }[] = [];
    const changedBuildingIds: number[] = [];
    const cadence = this.clock.advanceOneDay();
    if (!cadence.advanced) {
      if (this.isCampaignComplete() && !this.fiftyYearsJubileeAnnounced) {
        this.fiftyYearsJubileeAnnounced = true;
        this.getFiftyYearsReport();
        this.enqueueInterruption({
          id: 'fifty-years-jubilee-1959',
          kind: 'final',
          title: 'Cinquentenário de Ouro (1910–1959): Conclusão da Campanha',
          description: `Em 31 de dezembro de 1959, Cidade de Minas e o ${this.club?.name ?? 'Tradição Esporte Clube'} completam 50 anos de história! O Relatório Jubilar oficial está disponível para consulta no Arquivo Histórico.`,
        });
      }
      return { changedTiles, changed: 0, changedBuildingIds };
    }
    this.tickCount++;

    if (this.isCampaignComplete() && !this.fiftyYearsJubileeAnnounced) {
      this.fiftyYearsJubileeAnnounced = true;
      this.getFiftyYearsReport();
      this.enqueueInterruption({
        id: 'fifty-years-jubilee-1959',
        kind: 'final',
        title: 'Cinquentenário de Ouro (1910–1959): Conclusão da Campanha',
        description: `Em 31 de dezembro de 1959, Cidade de Minas e o ${this.club?.name ?? 'Tradição Esporte Clube'} completam 50 anos de história! O Relatório Jubilar oficial está disponível para consulta no Arquivo Histórico.`,
      });
    }

    // B14: exactly one autonomous city-growth transition at each January 1
    // emitted by the campaign clock. Legacy saves rebase their empty ledger to
    // the saved year, so only future annual boundaries produce new history.
    if (cadence.annual && this.city1910 && this.cityGrowth) {
      const city = createCityState(this.rng.worldSeed, this.clock.getDate());
      const baseline = createCityState(this.rng.worldSeed, { year: 1910, month: 1, day: 1 });
      const landValue = generateCityLandValue1910(
        baseline,
        this.city1910.parcels,
        this.city1910.districts,
        this.city1910.foundation,
        CAMPAIGN_LAND_VALUE_PROFILE,
      );
      const growthResult = advanceCityGrowthYear(
        city,
        this.cityGrowth,
        this.city1910.parcels,
        this.city1910.districts,
        this.city1910.foundation,
        landValue,
        CAMPAIGN_GROWTH_PROFILE,
      );
      this.cityGrowth = growthResult.state;
      if (this.cityTransformation) {
        this.cityTransformation = advanceCityTransformationYear(
          city,
          this.cityTransformation,
          growthResult,
          this.city1910.parcels,
          this.city1910.foundation,
          CAMPAIGN_TRANSFORMATION_PROFILE,
        ).state;
      }
    }

    // Alpha E: E4 - Annual footballer aging on January 1st
    if (cadence.annual && this.club?.squad) {
      const agingResult = processAnnualPlayerAging(
        this.club.squad,
        this.clock.getDate().year,
        this.rng,
      );
      this.club = createClub({
        ...this.club,
        squad: agingResult.squad,
      });
    }

    // Alpha F: F1 - Annual evaluation of organic club births
    if (cadence.annual && this.city1910?.districts?.districts) {
      const newlyBorn = evaluateAnnualClubBirths({
        year: this.clock.getDate().year,
        districts: this.city1910.districts.districts,
        existingClubs: this.localClubs,
        rng: this.rng,
      });
      if (newlyBorn.length > 0) {
        this.localClubs = Object.freeze([...this.localClubs, ...newlyBorn]);
        for (const newClub of newlyBorn) {
          this.enqueueInterruption({
            id: `birth-${newClub.id}-${this.clock.getDate().year}`,
            kind: 'final',
            title: `Novo Clube Fundado: ${newClub.name}`,
            description: `Em ${this.clock.getDate().year}, nasce o ${newClub.name} em Cidade de Minas (${newClub.foundationReason}).`,
          });
        }
      }
    }

    // Evolução procedural contínua dos clubes locais (eleição de presidentes e obras nos estádios)
    if (cadence.annual && this.localClubs.length > 0) {
      const evolution = evolveProceduralClubsAnnual(
        this.localClubs,
        this.clock.getDate().year,
        this.rng
      );
      this.localClubs = evolution.updatedClubs;
      for (const ev of evolution.events) {
        this.enqueueInterruption({
          id: `club-event-${this.clock.getDate().year}-${Math.abs(this.clock.getDate().year * 31).toString(16)}`,
          kind: 'final',
          title: ev.title,
          description: ev.description,
        });
      }
    }

    // Alpha F: F3 - Annual evaluation of club dissidences / internal schisms
    if (cadence.annual && this.localClubs.length > 0) {
      const existingClubIds = new Set(this.localClubs.map((c) => c.id));
      const nextLocalClubs: LocalClubState[] = [];
      const newlyFormedDissidents: LocalClubState[] = [];

      for (const club of this.localClubs) {
        const dissidenceRes = evaluateClubDissidence(club, this.clock.getDate(), this.rng, existingClubIds);
        if (dissidenceRes.dissidenceOccurred && dissidenceRes.newClub && dissidenceRes.updatedParentMilestone && dissidenceRes.dissidence) {
          existingClubIds.add(dissidenceRes.newClub.id);
          newlyFormedDissidents.push(dissidenceRes.newClub);
          nextLocalClubs.push(
            Object.freeze({
              ...club,
              historicalMilestones: Object.freeze([...club.historicalMilestones, dissidenceRes.updatedParentMilestone]),
            })
          );
          this.enqueueInterruption({
            id: `dissidence-${dissidenceRes.dissidence.parentClubId}-${this.clock.getDate().year}`,
            kind: 'final',
            title: `Cisma Clubístico: Nasce o ${dissidenceRes.newClub.name}`,
            description: `Racha histórico no ${dissidenceRes.dissidence.parentClubName}: a ala liderada por ${dissidenceRes.dissidence.leaderName} rompeu com o conselho em virtude de divergências internas, fundando o rival ${dissidenceRes.newClub.name}!`,
          });
        } else {
          nextLocalClubs.push(club);
        }
      }
      if (newlyFormedDissidents.length > 0) {
        this.localClubs = Object.freeze([...nextLocalClubs, ...newlyFormedDissidents]);
      }
    }

    // Alpha F: F5 + F6 - Annual Federation formation and political cycle (~1915+)
    if (cadence.annual && this.clock.getDate().year >= 1915) {
      if (!this.federation) {
        this.federation = initializeFederation(
          this.clock.getDate(),
          this.localClubs,
          this.regionalClubs,
          this.club,
          this.rng
        );
        this.enqueueInterruption({
          id: `fed-founding-${this.clock.getDate().year}`,
          kind: 'final',
          title: 'Fundação da Liga Mineira de Desportos Terrestres (LMDT)',
          description: `Em memorável assembleia geral no centro de Cidade de Minas, as agremiações fundadoras proclamaram a criação da Liga Mineira (LMDT), elegendo sua primeira presidência e aprovando o estatuto de amadorismo!`,
        });
      } else {
        const stepResult = stepFederationAnnual(
          this.federation,
          this.clock.getDate(),
          this.localClubs,
          this.rng
        );
        this.federation = stepResult.updatedFederation;
        if (stepResult.eventNotification) {
          this.enqueueInterruption({
            id: stepResult.eventNotification.id,
            kind: 'final',
            title: stepResult.eventNotification.title,
            description: stepResult.eventNotification.description,
          });
        }
      }
    }

    // Alpha F: F7 + F8 + F9 - Annual competition schedule generation
    if (cadence.annual) {
      this.ensureRivalriesInitialized();
      const annualComps = generateAnnualCompetitions(
        this.clock.getDate().year,
        this.localClubs,
        this.regionalClubs,
        this.club,
        this.federation,
        this.rng
      );
      if (annualComps.length > 0) {
        // Retain past completed competitions and append newly generated ones for the new year
        const pastComps = this.competitions.filter((c) => c.status === 'completed' || c.year < this.clock.getDate().year);
        this.competitions = Object.freeze([...pastComps, ...annualComps]);
        for (const comp of annualComps) {
          this.enqueueInterruption({
            id: `comp-announced-${comp.id}`,
            kind: 'final',
            title: `Calendário Esportivo: ${comp.name}`,
            description: `Aberto o calendário de ${comp.year} para a disputa da ${comp.name} com ${comp.fixtures.length} jogos programados!`,
          });
        }
      }

      // Alpha H: Macroetapa 36 - Anúncio da Taça Brasil de 1959
      if (this.clock.getDate().year === 1959 && !this.tacaBrasil1959) {
        const tournament = this.generateTacaBrasil1959();
        this.enqueueInterruption({
          id: 'taca-brasil-1959-announced',
          kind: 'final',
          title: 'Edição Histórica: Taça Brasil de 1959 Anunciada!',
          description: `A CBD cria a primeira edição da Taça Brasil para apontar o campeão nacional. Representante de Minas Gerais: ${tournament.minasRepresentative.name}.`,
        });
      }
    }

    // Power: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % POWER_INTERVAL === 0) {
      this.recomputePower();
    } else {
      this.recomputePowerIfDirty();
    }

    // Water: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % WATER_INTERVAL === 0) {
      this.recomputeWater();
    } else {
      this.recomputeWaterIfDirty();
    }

    // Service coverage: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % SERVICE_INTERVAL === 0) {
      this.recomputeService();
    } else {
      this.recomputeServiceIfDirty();
    }

    // Fire coverage: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % SERVICE_INTERVAL === 0) {
      this.recomputeFire();
    } else {
      this.recomputeFireIfDirty();
    }

    // Hospital coverage: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % SERVICE_INTERVAL === 0) {
      this.recomputeHospital();
    } else {
      this.recomputeHospitalIfDirty();
    }

    // School coverage: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % SERVICE_INTERVAL === 0) {
      this.recomputeSchool();
    } else {
      this.recomputeSchoolIfDirty();
    }

    // Traffic: recompute if dirty, or force on periodic cadence (defense-in-depth).
    // Runs BEFORE land value, which reads the congestion snapshot produced here. The
    // cadence-forced branch only reaches land value because TRAFFIC_INTERVAL is a multiple
    // of LAND_VALUE_INTERVAL — see TRAFFIC_INTERVAL for why that must stay true.
    // recomputeTraffic force-refreshes the labor market first, so labor resolves here too.
    // No "traffic has never been allocated" skip: traffic is a simulation input now, so an
    // unread map is no longer a reason to skip the cadence force-recompute.
    if (this.tickCount % TRAFFIC_INTERVAL === 0) {
      this.recomputeTraffic();
    } else {
      this.recomputeTrafficIfDirty();
    }

    // Land value: recompute if dirty, or force on periodic cadence (defense-in-depth).
    if (this.tickCount % LAND_VALUE_INTERVAL === 0) {
      this.recomputeLandValue();
    } else {
      this.recomputeLandValueIfDirty();
    }

    // Alpha F: F9 - Step competitions on the historical calendar date
    if (this.competitions.length > 0) {
      const stepRes = stepCompetitionsForDate(
        this.competitions,
        this.clock.getDate(),
        this.club,
        this.localClubs,
        this.regionalClubs,
        this.rng
      );
      this.competitions = stepRes.updatedCompetitions;
      for (const m of stepRes.matchesPlayed) {
        this.handlePostMatchRivalryAndIncidents(m, false);
      }
      for (const t of stepRes.trophiesAwarded) {
        if (this.club && this.club.id === t.clubId) {
          this.club = addTrophyToClub(this.club, t.trophy);
          if (this.club.historicalLedger) {
            const updatedLedger = recordHistoricalEvent(this.club.historicalLedger, {
              id: `ev-trofeu-${t.trophy.id}`,
              date: t.trophy.date,
              category: 'TITULO',
              importance: 95,
              title: `Glória Histórica: Conquista do(a) ${t.trophy.competitionName}`,
              description: `O ${this.club.name} sagra-se campeão incontestável em ${t.trophy.year}, gravando seu nome na posteridade.`,
              clubs: [this.club.id],
              competitionId: t.trophy.competitionId,
              causes: [`ev-fundacao-${this.club.id}`],
              tags: ['campeao', 'trofeu', 'futebol'],
            });
            this.club = createClub({
              ...this.club,
              historicalLedger: updatedLedger,
            });
          }
        } else {
          this.localClubs = Object.freeze(
            this.localClubs.map((lc) => (lc.id === t.clubId ? addTrophyToLocalClub(lc, t.trophy) : lc))
          );
        }
      }
      for (const notif of stepRes.notifications) {
        this.enqueueInterruption({
          id: notif.id,
          kind: 'final',
          title: notif.title,
          description: notif.description,
        });
      }
    }

    // Pass 1: DIRT→GRASS heal (unchanged behavior).
    for (const tile of this.map.iterateTiles()) {
      if (tile.type === TileType.DIRT) {
        this.map.setTile(tile.x, tile.y, createTile(tile.x, tile.y, TileType.GRASS));
        changedTiles.push({ x: tile.x, y: tile.y });
      }
    }

    // Monthly tax settlement (no per-day bucket): on a month-boundary day, settle
    // a whole month at the pre-growth population. Settled before zone growth so a
    // coincident growth+boundary tick's level-up is taxed next month. Intra-month
    // population changes are not prorated — accepted MVP tolerance.
    if (cadence.monthly) {
      this.money += Math.floor(this.getPopulation() * TAX_PER_POP) * cadence.completedMonthDays!;

      // C10: Club monthly accounting (recurring rent and facility maintenance)
      if (this.club?.finances && this.club?.facilityDetails) {
        let currentFinances = this.club.finances;
        let currentMembership = this.club.membership;

        // C8: Collect monthly membership dues from associates
        if (currentMembership) {
          const duesResult = collectMonthlyDues(currentMembership, this.clock.getDate(), this.rng);
          currentMembership = duesResult.updatedMembership;
          if (duesResult.totalCollectedPPU > 0) {
            currentFinances = recordTransaction(
              currentFinances,
              this.clock.getDate(),
              'membership_dues',
              duesResult.totalCollectedPPU,
              `Arrecadação mensal de mensalidades (${duesResult.payingCount} sócios adimplentes)`,
            );
          }
        }

        const accounting = processMonthlyAccounting(
          currentFinances,
          this.club.facilityDetails,
          this.club.contracts ?? [],
          this.clock.getDate(),
        );
        const updatedFacilities = decayFacilities(this.club.facilityDetails, accounting.maintenancePaid);

        // Alpha D: D4 - Dynamic SocialIdentity evolution
        let updatedSocialIdentity = this.club.socialIdentity;
        if (updatedSocialIdentity) {
          const primaryParcelId = this.club.parcels[0];
          const primaryParcel = primaryParcelId && this.city1910
            ? this.city1910.parcels.parcels.find((p) => p.id === primaryParcelId)
            : undefined;

          const monthlyFee = currentMembership?.settings.monthlyDuesPPU.contribuinte ?? 2.0;
          const hasLuxury = updatedFacilities.some((f) => f.type === 'clubhouse' || f.type === 'wooden_stands');
          const hasBasic = updatedFacilities.some((f) => f.type === 'dirt_pitch' || f.type === 'lantern_lighting');

          updatedSocialIdentity = evolveSocialIdentity(updatedSocialIdentity, {
            currentYear: this.clock.getDate().year,
            currentMonth: this.clock.getDate().month,
            monthlyFeePPU: monthlyFee,
            parcelDistrictId: primaryParcel?.districtId,
            hasLuxuryFacility: hasLuxury,
            hasBasicFacility: hasBasic,
          });
        }

        let updatedFinances = accounting.updatedLedger;

        // Alpha E: E5 + E6 - Monthly athletics stipends (tram fares, boots, match stipends)
        const athleticsCost = computeMonthlyAthleticsCost(this.club);
        if (athleticsCost > 0) {
          updatedFinances = recordTransaction(
            updatedFinances,
            this.clock.getDate(),
            'athletic_stipends',
            -athleticsCost,
            'Auxílio de transporte, chuteiras e gratificações do quadro de futebol'
          );
        }

        this.club = createClub({
          ...this.club,
          facilityDetails: updatedFacilities,
          finances: updatedFinances,
          ...(currentMembership ? { membership: currentMembership } : {}),
          ...(updatedSocialIdentity ? { socialIdentity: updatedSocialIdentity } : {}),
        });
      }

      // Alpha E: E5 + E6 - Monthly rival scouting and inquiries
      if (this.club?.squad) {
        this.latestRivalInquiries = generateMonthlyRivalInquiries(this.club, this.clock.getDate(), this.rng);
      }

      // Alpha F: F2 - Monthly autonomous AI director simulation for local clubs
      if (this.localClubs.length > 0) {
        const nextLocalClubs: LocalClubState[] = [];
        for (const lc of this.localClubs) {
          const stepResult = stepLocalClub(lc, this.clock.getDate(), this.rng);
          nextLocalClubs.push(stepResult.updatedClub);
          if (stepResult.challengeOffer && this.club) {
            this.enqueueInterruption({
              id: `challenge-${stepResult.challengeOffer.id}`,
              kind: 'final',
              title: `Desafio Amistoso: ${stepResult.challengeOffer.challengerClubName}`,
              description: stepResult.challengeOffer.message,
            });
          }
        }
        this.localClubs = Object.freeze(nextLocalClubs);
      }
    }

    // Alpha E: E3 + E4 - Weekly football squad training, recovery, and condition wear
    if (cadence.weekly && this.club?.squad) {
      const weeklyTraining = processWeeklyTrainingAndCondition(
        this.club.squad,
        this.clock.getDate(),
        this.rng,
        this.club.facilityDetails,
      );
      this.club = createClub({
        ...this.club,
        squad: weeklyTraining.squad,
      });
    }

    // Pass 2: Zone growth — only on growth ticks.
    if (this.tickCount % ZONE_GROWTH_INTERVAL === 0) {
      // processedBuildingIds guards multi-tile footprints so each building is
      // processed at most once per tick even if the loop visits multiple of its tiles.
      const processedBuildingIds = new Set<number>();
      const buildings = this.map.getBuildings();
      const lv = this.getLandValue();
      const pw = this.getPowerMap();
      const wm = this.getWaterMap();
      const svc = this.getServiceCoverageMap();
      const fireSvc = this.getFireCoverageMap();
      const hospitalSvc = this.getHospitalCoverageMap();
      const schoolSvc = this.getSchoolCoverageMap();

      // Abandonment sweep: runs BEFORE demand/growth so the same-tick growth reads
      // demand that already excludes the just-derelict, and so a building that
      // recovers this tick is frozen from also growing this tick. `frozenThisTick`
      // captures every building that is abandoned at sweep entry (so a re-occupied
      // building — abandoned === false after the flip — is still skipped by the
      // growth and merge loops, which a plain `abandoned` check would miss).
      //
      // The verdict reads the UNCONGESTED land value — NOT the congested `lv.getValue` every
      // growth gate below reads. Congestion is the one land-value input that `abandoned`
      // feeds back into: condemning a building deletes its commuters, which deletes their
      // congestion, which CAN raise the very value that condemned it — only can, because the
      // congestion score is max-wins over a radius (LandValueMap.ts), so one building's trips
      // may move a given anchor by nothing at all. Whenever that raise does happen and is
      // enough to cross back over the threshold, the verdict has removed its own cause and
      // the building alternates derelict/occupied indefinitely — measured in a playtest as
      // 67 flips in 134 consecutive samples, and reproduced in World.abandonment.test.ts;
      // the TRAFFIC_CAPACITY JSDoc in trafficAssignment.ts records an earlier occurrence
      // that was closed by retuning a scalar. The remaining inputs — road, diversity,
      // service, park — are all things the flag cannot change, so reading only those makes
      // the verdict unable to alter its own next input, whatever the margins happen to be.
      // Congestion keeps its bite by FREEZING growth at the congested `anchorLandValue`
      // gates below; it never condemns.
      const frozenThisTick = new Set<number>();
      for (const b of buildings.iterBuildings()) {
        // One read feeds BOTH directions, so abandon and recover can never disagree about
        // the same anchor in the same tick.
        const lvAt = lv.getUncongestedValue(b.anchor.x, b.anchor.y);
        const under = isUnderSupported(b.level, lvAt);
        if (b.abandoned) {
          // Frozen regardless of whether it re-occupies this tick.
          frozenThisTick.add(b.id);
          if (!under) {
            // Was abandoned, land value now supports the level → recover.
            b.abandoned = false;
            changedBuildingIds.push(b.id);
            for (const cell of b.footprint) {
              changedTiles.push({ x: cell.x, y: cell.y });
            }
          }
        } else if (under) {
          // Land value no longer supports the level → abandon.
          b.abandoned = true;
          frozenThisTick.add(b.id);
          changedBuildingIds.push(b.id);
          for (const cell of b.footprint) {
            changedTiles.push({ x: cell.x, y: cell.y });
          }
        }
      }

      this.markDemandDirty();
      const demandVec = this.getDemand();

      for (const tile of this.map.iterateTiles()) {
        if (!isZoneType(tile.type)) continue;
        const { x, y } = tile;

        const existing = buildings.getBuildingAt(x, y);

        if (existing === null) {
          // Branch A: spawn — frontage-first greedy-depth lot selection.
          const bType = tile.type.replace('zone_', '') as BuildingType;
          // No demand for this type → no spawn. At GROWTH_DEMAND_THRESHOLD the labor
          // imbalance is inside the deadband and no in-migration is pulling; let zones sit
          // empty until pressure returns.
          if (demandVec[bType] <= GROWTH_DEMAND_THRESHOLD) continue;
          // Spawn uses the seed tile directly — lot/footprint do not exist yet.
          if (!pw.isPowered(x, y)) continue;
          const frontage = pickSeedFrontage({ x, y }, this);
          if (frontage === null) continue;
          const lot = greedyDepthLot({ x, y }, frontage, tile.type, this);
          if (lot === null) continue;
          const structureRect = initialStructureRect(lot, frontage);
          const created = buildings.addBuilding({
            type: bType,
            footprint: footprintCells(lot),
            anchor: { x: lot.x, y: lot.y },
            level: 1,
            density: 0,
            age: 0,
            abandoned: false,
            frontage,
            structureRect,
          });
          if (created !== null) {
            processedBuildingIds.add(created.id);
            changedBuildingIds.push(created.id);
            for (const cell of created.footprint) {
              changedTiles.push({ x: cell.x, y: cell.y });
            }
          }
          continue;
        }

        // Branch B: building exists — de-duplicate multi-tile footprints.
        if (processedBuildingIds.has(existing.id)) continue;
        processedBuildingIds.add(existing.id);

        // Road-access gate: buildings that lose frontage road access do not age or grow.
        if (!hasFrontageRoadAccess(existing, this)) continue;
        if (!isBuildingPowered(existing, pw)) continue;

        // Age every building once per growth-opportunity (this tick).
        existing.age += 1;

        // Abandonment freeze: a derelict (or just-re-occupied) building does not GROW this
        // tick — this skip precedes every growth mutation below, and the merge loop skips
        // the same set. `frozenThisTick` (not `existing.abandoned`) is required: a building
        // re-occupied THIS tick is `abandoned === false` but must still be frozen.
        // It sits AFTER the age++ deliberately: aging is eligibility, not growth. A derelict
        // that kept its road and power keeps accruing that eligibility, so a building coming
        // out of a long dereliction no longer has to re-earn its cooldown from zero before
        // the growth and merge gates will consider it. A building with no road or no power
        // still does not age at all — those two gates are above and unchanged.
        if (frozenThisTick.has(existing.id)) continue;

        const anchorLandValue = lv.getValue(existing.anchor.x, existing.anchor.y);
        const lot = lotBboxOf(existing.footprint);

        // Shared growth gate: demand, land value threshold, age cooldown, water, and the four
        // service-coverage anchors — feeds BOTH structure-grow and level-up below, at any level.
        // At GROWTH_DEMAND_THRESHOLD there is no imbalance beyond the deadband and no
        // in-migration for this type → no structure-grow, no level-up.
        // The lookahead level is clamped to ZONE_MAX_LEVEL: LEVEL_THRESHOLDS only has indices
        // 0..ZONE_MAX_LEVEL, so an unclamped `existing.level + 1` reads undefined at max level —
        // `landValue >= undefined` is always false, which would silently make max-level
        // structure-grow dead code below (the trap this reorder exists to avoid).
        const threshold = LEVEL_THRESHOLDS[Math.min(existing.level + 1, ZONE_MAX_LEVEL)];
        const cooldown = GROWTH_COOLDOWN_INTERVALS + stagger(existing.id);
        // Power gates spawn AND existing-building aging/growth (the isBuildingPowered check above
        // runs before age++). Water gates the level-up / structure-grow / density / merge
        // MUTATIONS — an unwatered but powered building still ages, it just can't grow
        // (SimCity 2000/4 'city starts, density limited'). Police AND fire AND hospital AND school
        // coverage gate this gated branch's mutations ONLY (the level-up bump AND the structure-grow
        // below, at any level); not spawn, density, or merge.
        // Graded fields (land value, coverage) gate at the ANCHOR; binary fields (power, water)
        // scan the FOOTPRINT — any powered/watered cell satisfies the gate. This is the intended split.
        const growthGate = demandVec[existing.type] > GROWTH_DEMAND_THRESHOLD && anchorLandValue >= threshold && existing.age >= cooldown && isBuildingWatered(existing, wm) && isAnchorCovered(existing.anchor, svc) && isFireAnchorCovered(existing.anchor, fireSvc) && isHospitalAnchorCovered(existing.anchor, hospitalSvc) && isSchoolAnchorCovered(existing.anchor, schoolSvc);

        if (canExtendStructure(existing.structureRect, lot, existing.frontage)) {
          // Branch B' — structure-grow, reachable at ANY level now, not just below max.
          // Below max this already preceded level-up (bit-identical behaviour there). At max
          // level this is the one new path: it makes a merged lot's raised depth cap
          // (max(MIN_STRUCTURE_DEPTH_CAP, frontage-axis width)) reachable, which the old
          // level-gated routing could never reach. The gain is keyed on that WIDTH, not on merge
          // generation: a 2-wide lot's cap is still max(2, 2) = 2, so nothing to spend, while
          // every lot 3 wide and up carries a cap above the floor. Now that the merge shape gate
          // frees the width axis (widths run 1 → 2 → 3 → 4 rather than doubling), 3-wide is a
          // reachable shape at all, so ODD runs — which used to strand their leftover — reach the
          // headroom too, not just runs whose length is a power of two. Getting past width 2 still
          // takes two merge generations, because greedyDepthLot walks only the depth axis and so
          // every UNMERGED lot is exactly 1 wide: 1+1 → 2, then 2+1 → 3. And the headroom is only
          // spendable on land deep enough to spend it — a structure already filling its lot's
          // depth can never extend however high the cap goes.
          if (growthGate) {
            const grown = extendStructureToward(existing.structureRect, lot, existing.frontage);
            if (grown !== null) {
              existing.structureRect = grown;
              existing.age = 0;
              changedBuildingIds.push(existing.id);
              for (const coord of existing.footprint) {
                changedTiles.push({ x: coord.x, y: coord.y });
              }
            }
          }
        } else if (existing.level < ZONE_MAX_LEVEL) {
          // Branch B — structure cannot grow further (lot filled or cap hit); level up.
          if (growthGate) {
            existing.level += 1;
            existing.age = 0;
            changedBuildingIds.push(existing.id);
            for (const coord of existing.footprint) {
              changedTiles.push({ x: coord.x, y: coord.y });
            }
          }
        } else {
          // Density-bump branch: building is at max level and its structure already fills its
          // depth cap (the canExtendStructure check above was false); advance density tier.
          // Gains the same four service-coverage anchors as growthGate above, PLUS the same
          // congested land-value threshold. That check WAS dead code while the sweep read the
          // same congested value against this same frozen snapshot — nothing below
          // LEVEL_THRESHOLDS[ZONE_MAX_LEVEL] could survive the sweep to reach here. The sweep
          // now reads the UNCONGESTED value, so a level-5 building whose anchor is suppressed
          // purely by traffic survives the sweep and can reach this branch below the threshold.
          // Two independent reasons it is gated. Freeze semantics: congestion freezes growth,
          // and density is a growth rung, so it reads the congested value exactly like the
          // level-up and structure-grow rungs above. And feedback: a bump here raises the
          // building's worker or job capacity, which CAN deepen the congestion that suppressed
          // the anchor in the first place — conditionally, since the added capacity only loads
          // roads once it is actually filled. The freeze reason stands on its own and does not
          // depend on whether that second loop closes in a given city.
          // The tier ceiling is keyed on lot width along the frontage: a 1-wide (unmerged) lot
          // stops at tier 1, only an assembled >=2-wide lot reaches tier 2 — assembling land, not
          // waiting, unlocks the top tier. This gate blocks INCREASES only, but no SIMULATION path
          // can ever exceed the cap: spawns start at density 0, this gate blocks every increase,
          // and a merge output's cap is never below its inputs' (mergePolicy.test.ts). A save
          // carrying an over-cap building (from before this cap existed) is rejected at load —
          // both the envelope version (WORLD_SAVE_VERSION 19) and, independently, the per-building
          // density-vs-lot-width check in mapSerialization.ts. The dev-only devApi seeding path can
          // still construct an over-cap building directly in memory, as it can construct any other
          // otherwise-unreachable state; this gate does not and cannot guard against that.
          if (
            demandVec[existing.type] >= DENSITY_DEMAND_THRESHOLD &&
            anchorLandValue >= LEVEL_THRESHOLDS[ZONE_MAX_LEVEL] &&
            existing.age >= DENSITY_COOLDOWN_INTERVALS &&
            existing.density < maxDensityForLot(lot, existing.frontage) &&
            isBuildingWatered(existing, wm) &&
            isAnchorCovered(existing.anchor, svc) &&
            isFireAnchorCovered(existing.anchor, fireSvc) &&
            isHospitalAnchorCovered(existing.anchor, hospitalSvc) &&
            isSchoolAnchorCovered(existing.anchor, schoolSvc)
          ) {
            existing.density += 1 as 0 | 1 | 2;
            existing.age = 0;
            changedBuildingIds.push(existing.id);
            for (const coord of existing.footprint) {
              changedTiles.push({ x: coord.x, y: coord.y });
            }
          }
        }
      }

      // Branch B'' (merge): pairwise width-axis lot consolidation.
      // Multiple disjoint pairs may merge in a single growth tick — `usedThisTick`
      // ensures each building participates in at most one merge.
      const candidates = [...buildings.iterBuildings()];
      const usedThisTick = new Set<number>();
      for (let i = 0; i < candidates.length; i++) {
        const a = candidates[i];
        if (usedThisTick.has(a.id)) continue;
        if (frozenThisTick.has(a.id)) continue; // derelict / just-re-occupied — no merge this tick
        if (!hasFrontageRoadAccess(a, this)) continue;
        if (!isBuildingPowered(a, pw)) continue;
        if (!isBuildingWatered(a, wm)) continue;
        for (let j = i + 1; j < candidates.length; j++) {
          const b = candidates[j];
          if (usedThisTick.has(b.id)) continue;
          if (frozenThisTick.has(b.id)) continue; // derelict / just-re-occupied — no merge this tick
          if (!hasFrontageRoadAccess(b, this)) continue;
          if (!isBuildingPowered(b, pw)) continue;
          if (!isBuildingWatered(b, wm)) continue;
          if (!canMerge(a, b, demandVec)) continue;

          const shape = mergedBuildingShape(a, b);
          buildings.removeBuilding(a.id);
          buildings.removeBuilding(b.id);
          const merged = buildings.addBuilding(shape);
          if (merged === null) {
            throw new Error(
              `merge invariant violated: addBuilding(merged) returned null for ` +
              `a=${a.id} b=${b.id}`,
            );
          }

          usedThisTick.add(a.id);
          usedThisTick.add(b.id);
          changedBuildingIds.push(a.id, b.id, merged.id);
          for (const c of merged.footprint) changedTiles.push({ x: c.x, y: c.y });
          break; // a is used; move to next i
        }
      }

      if (changedBuildingIds.length > 0) {
        // markLaborDirty cascades to trafficDirty and markDemandDirty — single call is sufficient.
        this.markLaborDirty();
      }
    }

    // Mark happiness dirty at the END of the tick — after tax settlement (money changed) and
    // after growth/merge (building levels changed). Happiness is a display OUTPUT read lazily
    // after the tick; land value is a growth INPUT recomputed fresh before the growth pass above.
    this.markHappinessDirty();

    return { changedTiles, changed: changedTiles.length, changedBuildingIds };
  }
}
