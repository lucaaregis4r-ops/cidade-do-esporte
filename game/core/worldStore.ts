/**
 * Process-wide World singleton + localStorage persistence.
 *
 * The instance is stashed on globalThis so it survives HMR / Fast Refresh
 * (which re-runs the GameCanvas effect and would otherwise build a fresh
 * World, discarding placed tiles). On first creation the world is hydrated
 * from localStorage, so a full page reload (F5) now restores the saved
 * city instead of resetting. "New City" clears the save explicitly.
 *
 * Cache reuse requires TWO checks to pass:
 *   1. `hasCurrentWorldApi` — structural backstop that verifies every
 *      load-bearing method is present on the stashed instance.
 *   2. `WORLD_SINGLETON_GUARD` sentinel — version string that is bumped
 *      whenever the stash format changes, catching HMR singletons that
 *      predate an API addition not yet covered by the method probe.
 * Either check failing discards the cached World and rebuilds fresh.
 */

import { World } from './World';
import { serializeWorld, deserializeWorldInto } from './mapSerialization';

const MAP_WIDTH = 64;
const MAP_HEIGHT = 64;
// Native v25 writes never overwrite retained migration sources.
export const STORAGE_KEY = 'cimulity:save:v25';
export const PREVIOUS_STORAGE_KEY = 'cimulity:save:v24';
export const V23_STORAGE_KEY = 'cimulity:save:v23';
export const V22_STORAGE_KEY = 'cimulity:save:v22';
export const V21_STORAGE_KEY = 'cimulity:save:v21';
export const V20_STORAGE_KEY = 'cimulity:save:v20';
export const LEGACY_STORAGE_KEY = 'cimulity:save:v19';
let readFailed = false;

export function getPersistenceNotice(): string | null {
  return store.__cimulityPersistenceNotice ?? null;
}

// A8 adds queue snapshot APIs and entity counters required by persistence.
const WORLD_SINGLETON_GUARD = 'cidade-save-v25' as const;

const store = globalThis as unknown as {
  __cimulityWorld?: World;
  __cimulityWorldGuard?: string;
  __cimulityPersistenceNotice?: string | null;
  __cimulityBlockedWorld?: World | null;
};

function readSave(): string | null {
  readFailed = false;
  try {
    return typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(PREVIOUS_STORAGE_KEY) ?? localStorage.getItem(V23_STORAGE_KEY) ?? localStorage.getItem(V22_STORAGE_KEY) ?? localStorage.getItem(V21_STORAGE_KEY) ?? localStorage.getItem(V20_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    readFailed = true;
    store.__cimulityPersistenceNotice = 'Save storage is unavailable. Your existing save has not been changed.';
    return null;
  }
}

/**
 * First of two cache-reuse checks (paired with `WORLD_SINGLETON_GUARD`).
 *
 * A singleton that survived HMR/Fast Refresh may predate any API surface
 * the session/dispatcher/render layer relies on. We check every
 * load-bearing method on `World`, `GameMap`, `BuildingMap`, and `StructureMap` —
 * checking only a subset leaves stale singletons that have e.g. `iterBuildings`
 * but lack `addExistingBuilding`, which would silently no-op save-hydration.
 *
 * **Update this guard whenever a load-bearing method is added to `World`,
 * `GameMap`, `BuildingMap`, or `StructureMap` — stale HMR singletons missing
 * the method break the app.**
 *
 * Checked methods (as of cidade-save-v24).
 * v16, v17 and v18 were behavioural `World.tick` bumps that added no method to this surface — but
 * the stamp tracks the guard so a reader can tell at a glance that it was reviewed against the
 * current sentinel:
 *   World: getMoney, trySpend, setMoney, getDate, getElapsedDays, setElapsedDays,
 *          getMap, getLandValue, markLandValueDirty, recomputeLandValueIfDirty,
 *          recomputeLandValue, getHappiness, getTerrain, installTerrain, getTerrainRevision,
 *          isWater, canBuildAt, canBuildRoadAt, regenerateTerrain,
 *          getDemand, markDemandDirty,
 *          getPowerMap, markPowerDirty, recomputePowerIfDirty, recomputePower,
 *          getWaterMap, markWaterDirty, recomputeWaterIfDirty, recomputeWater,
 *          getServiceCoverageMap, markServiceDirty, recomputeServiceIfDirty, recomputeService,
 *          getFireCoverageMap, markFireDirty, recomputeFireIfDirty, recomputeFire,
 *          getHospitalCoverageMap, markHospitalDirty, recomputeHospitalIfDirty, recomputeHospital,
 *          getSchoolCoverageMap, markSchoolDirty, recomputeSchoolIfDirty, recomputeSchool,
 *          getTrafficMap, markTrafficDirty, recomputeTrafficIfDirty, recomputeTraffic,
 *          getLaborMarket, markLaborDirty, recomputeLaborIfDirty, recomputeLabor,
 *          getEmployed, getUnemployed, getJobsCapacity,
 *          getStructureMap, getWorldSeed, getRngStreams, isCampaignComplete,
 *          enqueueInterruption, getInterruptions, acknowledgeInterruption,
 *          setAutoPause, getAutoPauseConfig, claimAutoPauseInterruption
 *   GameMap: getBuildings, setTileAndReconcile
 *   BuildingMap: getBuildingAt, getBuilding, iterBuildings, getAllBuildings,
 *                addBuilding, addExistingBuilding, removeBuilding, setNextIdFloor, clear
 *   StructureMap: getStructureAt, getStructure, iterStructures, getAllStructures,
 *                 addStructure, addExistingStructure, removeStructure, setNextIdFloor, clear
 *   Building.frontage: required Frontage field (added v9)
 */
function hasCurrentWorldApi(world: World): boolean {
  if (
    typeof world.getWorldSeed !== 'function' ||
    typeof world.getCityFoundation1910 !== 'function' ||
    typeof world.getCityDistricts1910 !== 'function' ||
    typeof world.getCityParcels1910 !== 'function' ||
    typeof world.getCityGrowthState !== 'function' ||
    typeof world.setCityGrowthState !== 'function' ||
    typeof world.getCityTransformationState !== 'function' ||
    typeof world.setCityTransformationState !== 'function' ||
    typeof world.setCityData1910 !== 'function' ||
    typeof world.getClub !== 'function' ||
    typeof world.setClub !== 'function' ||
    typeof world.getRngStreams !== 'function' ||
    typeof world.getDecisionLog !== 'function' ||
    typeof world.recordDecision !== 'function' ||
    typeof world.restoreDecisionLog !== 'function' ||
    typeof world.isCampaignComplete !== 'function' ||
    typeof world.enqueueInterruption !== 'function' ||
    typeof world.getInterruptions !== 'function' ||
    typeof world.getInterruptionState !== 'function' ||
    typeof world.restoreInterruptionState !== 'function' ||
    typeof world.acknowledgeInterruption !== 'function' ||
    typeof world.setAutoPause !== 'function' ||
    typeof world.getAutoPauseConfig !== 'function' ||
    typeof world.claimAutoPauseInterruption !== 'function'
  ) {
    return false;
  }
  // World economy + calendar APIs (existing).
  if (
    typeof world.getMoney !== 'function' ||
    typeof world.trySpend !== 'function' ||
    typeof world.setMoney !== 'function' ||
    typeof world.getDate !== 'function' ||
    typeof world.getElapsedDays !== 'function' ||
    typeof world.setElapsedDays !== 'function'
  ) {
    return false;
  }
  // GameMap (added in Task 10): atomic tile/building reconcile + buildings access.
  if (typeof world.getMap !== 'function') return false;
  const map = world.getMap();
  if (
    typeof map.getBuildings !== 'function' ||
    typeof map.setTileAndReconcile !== 'function'
  ) {
    return false;
  }
  // BuildingMap (added in Task 9): all load-bearing methods used by render/save/growth.
  const buildings = map.getBuildings();
  if (
    typeof buildings.getBuildingAt !== 'function' ||
    typeof buildings.getBuilding !== 'function' ||
    typeof buildings.iterBuildings !== 'function' ||
    typeof buildings.getAllBuildings !== 'function' ||
    typeof buildings.addBuilding !== 'function' ||
    typeof buildings.addExistingBuilding !== 'function' ||
    typeof buildings.removeBuilding !== 'function' ||
    typeof buildings.setNextIdFloor !== 'function' ||
    typeof buildings.getNextId !== 'function' ||
    typeof buildings.clear !== 'function'
  ) {
    return false;
  }
  // LandValueMap integration (added in Task 14): derived influence field + dirty-mark.
  if (
    typeof world.getLandValue !== 'function' ||
    typeof world.markLandValueDirty !== 'function' ||
    typeof world.recomputeLandValueIfDirty !== 'function' ||
    typeof world.recomputeLandValue !== 'function'
  ) {
    return false;
  }
  // Happiness KPI (added service-v7): derives from land value but is its own public read surface.
  if (typeof world.getHappiness !== 'function') return false;
  // Terrain integration (added in Task 4): elevation r/w, install, revision, water/build predicates.
  if (
    typeof world.getTerrain !== 'function' ||
    typeof world.installTerrain !== 'function' ||
    typeof world.getTerrainRevision !== 'function' ||
    typeof world.isWater !== 'function' ||
    typeof world.canBuildAt !== 'function' ||
    typeof world.canBuildRoadAt !== 'function'
  ) {
    return false;
  }
  // Procedural terrain API (added in Task 7): full regeneration entry-point.
  if (typeof world.regenerateTerrain !== 'function') {
    return false;
  }
  // Demand API (added in Task 2): demand snapshot + dirty-mark.
  if (typeof world.getDemand !== 'function' || typeof world.markDemandDirty !== 'function') {
    return false;
  }
  // PowerMap API (added in Task 4 / v11): derived power field + dirty-mark + recompute.
  if (
    typeof world.getPowerMap !== 'function' ||
    typeof world.markPowerDirty !== 'function' ||
    typeof world.recomputePowerIfDirty !== 'function' ||
    typeof world.recomputePower !== 'function'
  ) {
    return false;
  }
  // WaterMap API (added in Task 3 / water): derived water field + dirty-mark + recompute.
  if (
    typeof world.getWaterMap !== 'function' ||
    typeof world.markWaterDirty !== 'function' ||
    typeof world.recomputeWaterIfDirty !== 'function' ||
    typeof world.recomputeWater !== 'function'
  ) {
    return false;
  }
  // ServiceCoverageMap API (added in service / v13): derived coverage field + dirty-mark + recompute.
  if (
    typeof world.getServiceCoverageMap !== 'function' ||
    typeof world.markServiceDirty !== 'function' ||
    typeof world.recomputeServiceIfDirty !== 'function' ||
    typeof world.recomputeService !== 'function'
  ) {
    return false;
  }
  // FireCoverageMap API (added in service-v2 / v14): derived fire coverage field + dirty-mark + recompute.
  if (
    typeof world.getFireCoverageMap !== 'function' ||
    typeof world.markFireDirty !== 'function' ||
    typeof world.recomputeFireIfDirty !== 'function' ||
    typeof world.recomputeFire !== 'function'
  ) {
    return false;
  }
  // HospitalCoverageMap API (added in service-v3 / v15): derived hospital coverage field + dirty-mark + recompute.
  if (
    typeof world.getHospitalCoverageMap !== 'function' ||
    typeof world.markHospitalDirty !== 'function' ||
    typeof world.recomputeHospitalIfDirty !== 'function' ||
    typeof world.recomputeHospital !== 'function'
  ) {
    return false;
  }
  // SchoolCoverageMap API (added in service-v4 / v16): derived school coverage field + dirty-mark + recompute.
  if (
    typeof world.getSchoolCoverageMap !== 'function' ||
    typeof world.markSchoolDirty !== 'function' ||
    typeof world.recomputeSchoolIfDirty !== 'function' ||
    typeof world.recomputeSchool !== 'function'
  ) {
    return false;
  }
  // TrafficMap API (added in traffic task / v18): derived congestion field + dirty-mark + recompute.
  if (
    typeof world.getTrafficMap !== 'function' ||
    typeof world.markTrafficDirty !== 'function' ||
    typeof world.recomputeTrafficIfDirty !== 'function' ||
    typeof world.recomputeTraffic !== 'function'
  ) {
    return false;
  }
  // LaborMarketMap API (added in labor-market task): derived labor result + dirty-mark + recompute + thin reads.
  if (
    typeof world.getLaborMarket !== 'function' ||
    typeof world.markLaborDirty !== 'function' ||
    typeof world.recomputeLaborIfDirty !== 'function' ||
    typeof world.recomputeLabor !== 'function' ||
    typeof world.getEmployed !== 'function' ||
    typeof world.getUnemployed !== 'function' ||
    typeof world.getJobsCapacity !== 'function'
  ) {
    return false;
  }
  // StructureMap API (added in Task 2 / v11): all load-bearing methods used by save/dispatch/render.
  if (typeof world.getStructureMap !== 'function') return false;
  const structures = world.getStructureMap();
  if (
    typeof structures.getStructureAt !== 'function' ||
    typeof structures.getStructure !== 'function' ||
    typeof structures.iterStructures !== 'function' ||
    typeof structures.getAllStructures !== 'function' ||
    typeof structures.addStructure !== 'function' ||
    typeof structures.addExistingStructure !== 'function' ||
    typeof structures.removeStructure !== 'function' ||
    typeof structures.setNextIdFloor !== 'function' ||
    typeof structures.getNextId !== 'function' ||
    typeof structures.clear !== 'function'
  ) {
    return false;
  }
  return true;
}

export function getWorld(): World {
  if (
    !store.__cimulityWorld ||
    !hasCurrentWorldApi(store.__cimulityWorld) ||
    store.__cimulityWorldGuard !== WORLD_SINGLETON_GUARD
  ) {
    store.__cimulityPersistenceNotice = null;
    const save = readSave();
    let world: World;
    if (save !== null) {
      // Save present: construct without procedural generation, then hydrate.
      world = new World(MAP_WIDTH, MAP_HEIGHT, { regenerate: false });
      const ok = deserializeWorldInto(world, save);
      if (!ok) {
        store.__cimulityBlockedWorld = world;
        store.__cimulityPersistenceNotice = 'Save could not be loaded. Original data is preserved; autosave is blocked. Back up browser storage before choosing New City.';
        // Bad/corrupt save — fall back to procedural generation.
        world.reset({ regenerate: true });
        world.recomputePowerIfDirty();
        world.recomputeWaterIfDirty();
        world.recomputeServiceIfDirty();
        world.recomputeFireIfDirty();
        world.recomputeHospitalIfDirty();
        world.recomputeSchoolIfDirty();
      } else if (JSON.parse(save).v === 19) {
        store.__cimulityPersistenceNotice = 'Save v19 migrated. Original retained in cimulity:save:v19. Missing seed, RNG, queue and decision state received explicit defaults; elapsed days are interpreted from 1 January 1910.';
      } else if (JSON.parse(save).v === 20) {
        store.__cimulityPersistenceNotice = 'Save v20 migrated. Original retained in cimulity:save:v20; its decision log starts empty because v20 did not record decisions.';
      } else if (JSON.parse(save).v === 21) {
        store.__cimulityPersistenceNotice = 'Save v21 migrated. Original retained in cimulity:save:v21; city generation metadata is absent, so the saved map was preserved without generating a city over it.';
      } else if (JSON.parse(save).v === 22) {
        store.__cimulityPersistenceNotice = 'Save v22 migrated. Original retained in cimulity:save:v22; the city baseline was preserved and annual growth begins from the saved year.';
      } else if (JSON.parse(save).v === 23) {
        store.__cimulityPersistenceNotice = 'Save v23 migrated. Original retained in cimulity:save:v23; B15 history was reconstructed from the recorded B14 growth ledger.';
      } else if (JSON.parse(save).v === 24) {
        store.__cimulityPersistenceNotice = 'Save v24 migrated. Original retained in cimulity:save:v24; club state starts empty.';
      }
    } else {
      // No save — fresh procedural world.
      world = new World(MAP_WIDTH, MAP_HEIGHT, { regenerate: true });
    }
    if (readFailed) store.__cimulityBlockedWorld = world;
    store.__cimulityWorld = world;
    store.__cimulityWorldGuard = WORLD_SINGLETON_GUARD;
  }
  return store.__cimulityWorld;
}

/** Persist the current map. Best-effort: storage may be full or blocked. */
export function saveWorld(world: World): boolean {
  if (store.__cimulityBlockedWorld === world) return false;
  try {
    if (typeof localStorage === 'undefined') {
      store.__cimulityPersistenceNotice = 'Save storage is unavailable; progress has not been saved.';
      return false;
    }
    localStorage.setItem(STORAGE_KEY, serializeWorld(world));
    if (getPersistenceNotice()?.startsWith('Saving failed') || getPersistenceNotice()?.startsWith('Save storage is unavailable')) store.__cimulityPersistenceNotice = null;
    return true;
  } catch {
    store.__cimulityPersistenceNotice = 'Saving failed (storage full or unavailable). The previous save is unchanged.';
    return false;
  }
}

/** Remove the persisted save (used by "New City"). */
export function clearSave(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREVIOUS_STORAGE_KEY);
    localStorage.removeItem(V23_STORAGE_KEY);
    localStorage.removeItem(V22_STORAGE_KEY);
    localStorage.removeItem(V21_STORAGE_KEY);
    localStorage.removeItem(V20_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    store.__cimulityBlockedWorld = null;
    store.__cimulityPersistenceNotice = null;
  } catch {
    store.__cimulityPersistenceNotice = 'Could not clear the saved campaign. Storage is unavailable.';
  }
}
