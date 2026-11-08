/**
 * GameSession: composition root for World/PixiApp/handlers/dispatch
 *
 * Owns execution state (ToolManager, World, Pixi, input handlers). React
 * keeps only mount/unmount + the tool bridge and passes stable forwarder
 * callbacks so the session never holds a stale prop closure.
 */

import { PixiApp } from '../render/PixiApp';
import type { DataView } from '../render/dataView';
import { getWorld, saveWorld, clearSave, getPersistenceNotice } from '../core/worldStore';
import { PointerHandler } from '../input/PointerHandler';
import { CameraController } from '../input/CameraController';
import { ToolManager } from '../input/ToolManager';
import { Tool } from '../tools/Tool';
import { KeyboardHandler } from '../input/KeyboardHandler';
import { executeClick, executeDrag, previewDrag, previewClick } from './CommandDispatcher';
import { inspectTile } from './inspectTile';
import type { TileInfo } from './inspectTile';
import { GameLoop, DEFAULT_SPEED_MULTIPLIER } from '../core/GameLoop';
import type { World, WorldDate } from '../core/World';
import type { DemandVector } from '../core/Demand';
import { STARTING_FUNDS, EMPTY_CITY_HAPPINESS } from '../core/World';
import { EMPTY_CITY_DEMAND } from '../core/Demand';
import type { TileCoord, ScreenCoord } from '../types/coordinates';
import type { ToolResult, ToolPreview } from '../tools';
import type { GameLoopTickInfo, SpeedMultiplier } from '../core/GameLoop';
import type { Interruption } from '../core/InterruptionQueue';
import { encodeReplayPackage } from '../core/DecisionLog';
import type { DecisionTool } from '../core/DecisionLog';
import { TILE_COLORS } from '../render/visuals/palette';
import { installDevApi, uninstallDevApi } from './devApi';
import type { ClubState } from '../core/club/Club';
import type { LandOccupancyContract } from '../core/club/ClubLandContract';
import type { FacilityType } from '../core/club/ClubFacilities';
import type { MemberCategory } from '../core/club/ClubMembers';
import type { CityParcel } from '../core/city/cityParcels';

// Drag-preview colors sourced from the shared palette so there's one source of truth.
const DRAG_PREVIEW_COLORS: Partial<Record<Tool, number>> = {
  [Tool.ZONE_RESIDENTIAL]: TILE_COLORS['zone_residential'],
  [Tool.ZONE_COMMERCIAL]: TILE_COLORS['zone_commercial'],
  [Tool.ZONE_INDUSTRIAL]: TILE_COLORS['zone_industrial'],
  [Tool.BULLDOZE]: 0xff3b30,
  [Tool.TERRAIN_UP]: 0x6dd06d,
  [Tool.TERRAIN_DOWN]: 0x6db0e0,
  [Tool.POWER_PLANT]: TILE_COLORS['power_plant'],
  [Tool.WATER_TOWER]: TILE_COLORS['water_tower'],
  [Tool.POLICE_STATION]: TILE_COLORS['police_station'],
  [Tool.FIRE_STATION]: TILE_COLORS['fire_station'],
  [Tool.HOSPITAL]: TILE_COLORS['hospital'],
  [Tool.SCHOOL]: TILE_COLORS['school'],
  [Tool.PARK]: TILE_COLORS['park'],
};

/**
 * Snapshot passed to `onTickUpdate`. Bundled into one object rather than positional
 * args: it is 11 fields fanned out across four engine-internal emit sites plus the
 * hand-written `stableForwarders` wrapper in GameCanvas, and same-typed neighbors
 * (happiness, congestion) would silently swap under a positional list with no compiler
 * error. TypeScript also accepts a SHORTER-arity callback for a longer signature, so a
 * forwarder left un-updated would have dropped the new field at runtime, unflagged.
 */
export interface TickUpdate {
  worldSeed: string;
  citySummary: { districts: number; parcels: number; institutions: number } | null;
  club: ClubState | null;
  tick: number;
  dirt: number;
  population: number;
  money: number;
  date: WorldDate;
  demand: DemandVector;
  happiness: number;
  /** City-wide congestion index in [0, 1]; same value getHappiness() subtracts via HAPPINESS_W_TRAFFIC. */
  congestion: number;
  employed: number;
  unemployed: number;
  /** Non-abandoned C/I capacity INCLUDING road-less buildings that can never fill (see `LaborResult` in laborMarket.ts). */
  jobsCapacity: number;
  cityGrowth: { throughYear: number; developments: number; populationUnits: number; jobUnits: number } | null;
  cityTransformation: { throughYear: number; activeBuildings: number; pastBuildings: number; centralities: number; avenues: number } | null;
}

export interface GameSessionCallbacks {
  onTileHover?: (tile: TileCoord | null) => void;
  onTileClick: (tile: TileCoord) => void;
  /**
   * Fires on a SELECT-tool click with a snapshot of the inspected tile, or
   * null when a non-SELECT tool clicks (which dismisses the info panel). The
   * snapshot is captured once at click time — it does not live-update.
   * `screen` is the viewport-relative click position used to anchor the panel.
   */
  onTileInspect?: (info: TileInfo | null, screen: ScreenCoord) => void;
  onFpsUpdate: (fps: number) => void;
  onCameraUpdate: (x: number, y: number, zoom: number) => void;
  onToolChange?: (tool: Tool) => void;
  onTickUpdate?: (update: TickUpdate) => void;
  /**
   * React-state mirror callbacks. Fire after the session has accepted/applied
   * the authoritative pause/speed value — either via the GameLoop on a
   * Toolbar/keyboard command, or directly from `resetWorld()` to push the
   * post-New-City defaults even when `gameLoop` is still null. React MUST NOT
   * push state back into the engine.
   */
  onSpeedChange?: (multiplier: SpeedMultiplier) => void;
  onPauseChange?: (paused: boolean) => void;
  /** Fires when an eligible queued event causes the simulation to pause. */
  onInterruption?: (interruption: Interruption | null) => void;
  onPersistenceNotice?: (notice: string | null) => void;
}

export class GameSession {
  private callbacks: GameSessionCallbacks;
  private toolManager = new ToolManager();
  private pixiApp: PixiApp | null = null;
  private world: World | null = null;
  private pointerHandler: PointerHandler | null = null;
  private cameraController: CameraController | null = null;
  private keyboardHandler: KeyboardHandler | null = null;
  private gameLoop: GameLoop | null = null;
  /**
   * Pause/speed commands received before `gameLoop` exists are queued here and
   * replayed when the loop is constructed in `start()`. Speed: last-write-wins
   * (only the most recent tier needs to apply). Pause: parity matters (odd
   * toggles flip state, even toggles are a no-op).
   */
  private pendingSpeedMultiplier: SpeedMultiplier | null = null;
  private pendingPauseToggleCount = 0;
  private activeInterruptionId: string | null = null;
  // Buffers the requested view so setDataView() calls before pixiApp exists survive.
  private pendingDataView: DataView = 'none';
  private disposed = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncedMoney: number | null = null;
  private lastSyncedElapsedDays: number | null = null;

  constructor(callbacks: GameSessionCallbacks) {
    this.callbacks = callbacks;
  }

  setTool(tool: Tool): void {
    this.toolManager.setTool(tool);
    // Clear the stale hover ghost from the previous tool; next mouse-move repaints for the new tool.
    this.pixiApp?.getSelectionRenderer()?.clearDragPreview();
  }

  setDataView(view: DataView): void {
    // Always record the latest request so start() can flush it once PixiApp is live.
    this.pendingDataView = view;
    // Apply live if PixiApp already exists (post-init subsequent changes).
    this.pixiApp?.setDataView(view);
  }

  // Both are command entry points (Toolbar AND keyboard both reach the engine through here).
  setSpeedMultiplier(multiplier: SpeedMultiplier): void {
    if (!this.gameLoop) {
      // Queue: last-write-wins for speed (a later valid tier overwrites the pending value).
      // We do NOT validate here — GameLoop.setSpeedMultiplier will validate at flush time.
      this.pendingSpeedMultiplier = multiplier;
      return;
    }
    // No-op if engine is already at this tier — avoid a redundant onSpeedChange emit.
    if (this.gameLoop.getSpeedMultiplier() === multiplier) return;
    if (this.gameLoop.setSpeedMultiplier(multiplier)) {
      this.callbacks.onSpeedChange?.(multiplier);
    }
  }

  togglePaused(): void {
    if (!this.gameLoop) {
      // Queue the toggle parity; flush applies the net effect once the loop exists.
      this.pendingPauseToggleCount++;
      return;
    }
    const next = !this.gameLoop.isPaused();
    this.gameLoop.setPaused(next);
    this.callbacks.onPauseChange?.(next);
  }

  acknowledgeInterruption(): void {
    if (this.activeInterruptionId !== null) this.world?.acknowledgeInterruption(this.activeInterruptionId);
    this.activeInterruptionId = null;
    this.callbacks.onInterruption?.(null);
    this.saveNow();
  }

  focusLatestCityDevelopment(): void {
    const development = this.world?.getCityGrowthState()?.developments.at(-1);
    if (!development) return;
    const parcel = this.world?.getCityParcels1910()?.parcels.find((item) => item.id === development.parcelId);
    const tile = parcel?.tiles[0];
    if (tile) this.pixiApp?.focusCampaignTile(tile);
  }

  focusLatestCityTransformation(): void {
    const state = this.world?.getCityTransformationState();
    if (!state) return;
    const latestBuilding = [...state.buildings].reverse().find(({ status }) => status !== 'active');
    const parcelId = latestBuilding?.parcelId ?? state.centralities.at(-1)?.parcelId;
    if (parcelId) {
      const parcel = this.world?.getCityParcels1910()?.parcels.find((item) => item.id === parcelId);
      if (parcel?.tiles[0]) {
        this.pixiApp?.focusCampaignTile(parcel.tiles[0]);
        return;
      }
    }
    const avenue = state.avenueUpgrades.at(-1);
    if (avenue?.path[0]) this.pixiApp?.focusCampaignTile(avenue.path[0]);
  }

  focusClubGround(): TileCoord | null {
    const club = this.world?.getClub();
    if (!club || !club.parcels || club.parcels.length === 0) return null;
    const parcelId = club.parcels[0];
    const parcel = this.world?.getCityParcels1910()?.parcels.find((item) => item.id === parcelId);
    const tile = parcel?.tiles[0];
    if (tile) {
      this.pixiApp?.focusCampaignTile(tile);
      this.pixiApp?.setSelectedTile(tile);
      return tile;
    }
    return null;
  }

  getClubGroundTile(): TileCoord | null {
    const club = this.world?.getClub();
    if (!club || !club.parcels || club.parcels.length === 0) return null;
    const parcelId = club.parcels[0];
    const parcel = this.world?.getCityParcels1910()?.parcels.find((item) => item.id === parcelId);
    return parcel?.tiles[0] ?? null;
  }

  // Redraw tiles only if a tool command actually changed core state,
  // and debounce-persist so rapid drags coalesce into one write.
  private markIfChanged(result: ToolResult): boolean {
    if (result.changedTiles.length === 0) return false;
    this.pixiApp?.getTileRenderer()?.markDirty();
    const tr = this.pixiApp?.getTileRenderer();
    if (tr) {
      tr.markBuildingsChanged(result.removedBuildingIds);
      tr.markTilesChanged(result.affectedTiles);
    }
    this.scheduleSave();
    // Sync HUD immediately so Dirt: jumps on bulldoze without waiting for next tick.
    const money = this.world!.getMoney();
    // Read happiness before congestion: getHappiness() drains traffic dirtiness via its
    // land-value cascade, so the getTrafficMap() read below never forces its own recompute.
    const happiness = this.world!.getHappiness();
    // demand: below force-refreshes labor when demandDirty (which markLaborDirty always sets
    // alongside laborDirty), so employed/unemployed/jobsCapacity here are always plain reads.
    this.callbacks.onTickUpdate?.({
      worldSeed: this.world!.getWorldSeed(),
      citySummary: this.world!.getCityData1910() ? {
        districts: this.world!.getCityData1910()!.districts.districts.length,
        parcels: this.world!.getCityData1910()!.parcels.parcels.length,
        institutions: this.world!.getCityData1910()!.foundation.institutions.length,
      } : null,
      club: this.world!.getClub(),
      tick: this.world!.getTick(),
      dirt: this.world!.countDirt(),
      population: this.world!.getPopulation(),
      money,
      date: this.world!.getDate(),
      demand: this.world!.getDemand(),
      happiness,
      congestion: this.world!.getTrafficMap().getCongestionIndex(),
      employed: this.world!.getEmployed(),
      unemployed: this.world!.getUnemployed(),
      jobsCapacity: this.world!.getJobsCapacity(),
      cityGrowth: this.world!.getCityGrowthState() ? {
        throughYear: this.world!.getCityGrowthState()!.throughYear,
        developments: this.world!.getCityGrowthState()!.developments.length,
        populationUnits: this.world!.getCityGrowthState()!.populationUnitsAdded,
        jobUnits: this.world!.getCityGrowthState()!.jobUnitsAdded,
      } : null,
      cityTransformation: this.world!.getCityTransformationState() ? {
        throughYear: this.world!.getCityTransformationState()!.throughYear,
        activeBuildings: this.world!.getCityTransformationState()!.buildings.filter(({ status }) => status === 'active').length,
        pastBuildings: this.world!.getCityTransformationState()!.buildings.filter(({ status }) => status !== 'active').length,
        centralities: this.world!.getCityTransformationState()!.centralities.length,
        avenues: this.world!.getCityTransformationState()!.avenueUpgrades.length,
      } : null,
    });
    // Keep tracker in sync; tool mutation already scheduled a save via scheduleSave above.
    this.lastSyncedMoney = money;
    this.lastSyncedElapsedDays = this.world!.getElapsedDays();
    return true;
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveNow();
    }, 500);
  }

  /** Bypasses the debounce and writes the world to localStorage immediately. */
  saveNow(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.world) saveWorld(this.world);
    this.callbacks.onPersistenceNotice?.(getPersistenceNotice());
  }

  private performDestructiveReset(opts: { seed?: number; clearSaveAfter: boolean; regenerate?: boolean }): void {
    // Step 1: cancel pending save timer.
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    // Step 2: reset world (regenerate defaults to true for existing callers).
    const regenerate = opts.regenerate ?? true;
    this.world?.reset({ regenerate, seed: regenerate ? opts.seed : undefined });
    // Step 3: conditionally clear the persisted save.
    if (opts.clearSaveAfter) {
      clearSave();
      this.callbacks.onPersistenceNotice?.(getPersistenceNotice());
    }
    // Step 4: reset loop/pause/speed mirrors.
    this.gameLoop?.reset();
    // Drop any queued pause/speed commands so a "New City" pressed during the
    // pre-`gameLoop` window cannot replay stale toggles after defaults are restored.
    this.pendingSpeedMultiplier = null;
    this.pendingPauseToggleCount = 0;
    this.activeInterruptionId = null;
    this.gameLoop?.setPaused(false);
    this.gameLoop?.setSpeedMultiplier(DEFAULT_SPEED_MULTIPLIER);
    // Step 5: emit tick HUD sync.
    // Mirror callbacks fire even when gameLoop is null so React HUD/Toolbar snap back to defaults immediately.
    this.callbacks.onPauseChange?.(false);
    this.callbacks.onInterruption?.(null);
    this.callbacks.onSpeedChange?.(DEFAULT_SPEED_MULTIPLIER);
    // Read post-reset money (reset already set STARTING_FUNDS; avoids ordering coupling).
    const m = this.world ? this.world.getMoney() : STARTING_FUNDS;
    this.callbacks.onTickUpdate?.({
      worldSeed: this.world?.getWorldSeed() ?? '',
      citySummary: this.world?.getCityData1910() ? {
        districts: this.world.getCityData1910()!.districts.districts.length,
        parcels: this.world.getCityData1910()!.parcels.parcels.length,
        institutions: this.world.getCityData1910()!.foundation.institutions.length,
      } : null,
      club: this.world?.getClub() ?? null,
      tick: 0,
      dirt: 0,
      population: 0,
      money: m,
      date: this.world ? this.world.getDate() : { year: 1910, month: 1, day: 1 },
      demand: this.world ? this.world.getDemand() : EMPTY_CITY_DEMAND,
      happiness: this.world ? this.world.getHappiness() : EMPTY_CITY_HAPPINESS,
      // reset() already sets trafficDirty = false and clears the map, so this is a plain read.
      congestion: this.world ? this.world.getTrafficMap().getCongestionIndex() : 0,
      employed: this.world ? this.world.getEmployed() : 0,
      unemployed: this.world ? this.world.getUnemployed() : 0,
      jobsCapacity: this.world ? this.world.getJobsCapacity() : 0,
      cityGrowth: this.world?.getCityGrowthState() ? {
        throughYear: this.world.getCityGrowthState()!.throughYear,
        developments: this.world.getCityGrowthState()!.developments.length,
        populationUnits: this.world.getCityGrowthState()!.populationUnitsAdded,
        jobUnits: this.world.getCityGrowthState()!.jobUnitsAdded,
      } : null,
      cityTransformation: this.world?.getCityTransformationState() ? {
        throughYear: this.world.getCityTransformationState()!.throughYear,
        activeBuildings: this.world.getCityTransformationState()!.buildings.filter(({ status }) => status === 'active').length,
        pastBuildings: this.world.getCityTransformationState()!.buildings.filter(({ status }) => status !== 'active').length,
        centralities: this.world.getCityTransformationState()!.centralities.length,
        avenues: this.world.getCityTransformationState()!.avenueUpgrades.length,
      } : null,
    });
    this.lastSyncedMoney = m;
    this.lastSyncedElapsedDays = this.world ? this.world.getElapsedDays() : 0;
    // Step 6: clear selected/hover.
    this.pixiApp?.setSelectedTile(null);
    this.pixiApp?.setHoverTile(null, undefined);
    // Step 7: mark renderer dirty.
    this.pixiApp?.getTileRenderer()?.markDirty();
  }

  /**
   * New-city semantics — clears the save so getWorld() will regenerate from default seed on reload.
   */
  resetWorld(): void {
    this.performDestructiveReset({ clearSaveAfter: true });
  }

  /**
   * Reset to an all-MIN_LAND_ELEVATION, all-grass canvas. TEST/DEBUG only —
   * production new-city uses regenerateTerrain via resetWorld.
   * Water is derived from elevation — no flat canvas contains water by default.
   */
  resetFlat(): void {
    this.performDestructiveReset({ regenerate: false, clearSaveAfter: true });
  }

  /**
   * Destructive reset — terrain is foundational; shares cleanup with resetWorld().
   * Policy diff: regenerated state is saved immediately, not cleared.
   */
  regenerateTerrain(seed?: number): void {
    this.performDestructiveReset({ seed, clearSaveAfter: false });
    this.saveNow();
  }

  /**
   * Translates a ToolPreview into a SelectionRenderer setDragPreview call.
   * Shared by drag preview and single-tile hover preview so there is one
   * mapping between the two.
   */
  private applyToolPreview(preview: ToolPreview, tool: Tool): void {
    const selectionRenderer = this.pixiApp?.getSelectionRenderer();
    if (!selectionRenderer) return;
    if (preview.pathTiles.length === 0) {
      selectionRenderer.clearDragPreview();
      return;
    }
    const rejectedKeys = new Set(preview.rejected.map((t) => `${t.x},${t.y}`));
    const standardTiles = preview.pathTiles.filter(
      (t) => !rejectedKeys.has(`${t.x},${t.y}`)
    );
    const buildings = this.world!.getMap().getBuildings();
    const affectedFootprintTiles: TileCoord[] = [];
    for (const id of preview.affectedBuildingIds) {
      const b = buildings.getBuilding(id);
      if (b !== null) affectedFootprintTiles.push(...b.footprint);
    }
    selectionRenderer.setDragPreview({
      standardTiles,
      rejectedTiles: [...preview.rejected],
      affectedFootprintTiles,
      muted: preview.allOrNothingBlocked,
      standardColor: DRAG_PREVIEW_COLORS[tool] ?? 0x4a4a4a,
    });
  }

  async start(container: HTMLElement, width: number, height: number): Promise<void> {
    console.log('GameCanvas: Initializing world...');
    // Attach keyboard FIRST so early key presses during async Pixi init are captured.
    // GameSession.setSpeedMultiplier/togglePaused queue when gameLoop is still null.
    const keyboardHandler = new KeyboardHandler({
      enableMunicipalTools: false,
      onToolChange: (tool) => {
        this.setTool(tool);
        this.callbacks.onToolChange?.(tool);
      },
      onSpeedChange: (tier) => this.setSpeedMultiplier(tier),
      onPauseToggle: () => this.togglePaused(),
    });
    this.keyboardHandler = keyboardHandler;
    // Reuse the process-wide World so HMR/Fast Refresh keeps placed tiles
    const world = getWorld();
    this.world = world;
    if (!world.getClub()) {
      world.ensureFoundingClub();
    }
    this.callbacks.onPersistenceNotice?.(getPersistenceNotice());
    const pending = world.getInterruptions()[0] ?? null;
    this.activeInterruptionId = pending?.id ?? null;
    this.callbacks.onInterruption?.(pending);
    console.log('GameCanvas: World created');

    // Initialize PixiJS app
    const pixiApp = new PixiApp(world, {
      onTileHover: (tile) => {
        const owner = tile ? world.getMap().getBuildings().getBuildingAt(tile.x, tile.y) : null;
        const footprintCells = owner ? owner.footprint : undefined;
        pixiApp.setHoverTile(tile, footprintCells);
        this.callbacks.onTileHover?.(tile);
      },
      onTileClick: (tile) => {
        pixiApp.setSelectedTile(tile);
        this.callbacks.onTileClick(tile);
      },
      onFpsUpdate: (fps) => this.callbacks.onFpsUpdate(fps),
      onCameraUpdate: (x, y, zoom) => this.callbacks.onCameraUpdate(x, y, zoom),
    });
    this.pixiApp = pixiApp;

    // Keyboard listener was attached above for race-safety; if Pixi init fails or returns
    // early, detach it so the dead session does not intercept window keystrokes.
    try {
    // Initialize PixiJS (async)
    await pixiApp.init(container, width, height);

    // Cleanup already ran while init() was pending — discard this app.
    if (this.disposed) {
      pixiApp.destroy();
      this.keyboardHandler?.detach();
      this.keyboardHandler = null;
      return;
    }

    const camera = pixiApp.getCamera();
    const canvas = pixiApp.getCanvas();
    if (!camera || !canvas) {
      pixiApp.destroy();
      this.keyboardHandler?.detach();
      this.keyboardHandler = null;
      return;
    }

    // Dev-only injection surface for Playwright / browser-console testing.
    // Installed AFTER pixiApp.init() succeeds and camera/canvas are confirmed
    // present — otherwise `setCameraTile` / `markDirty` would silently no-op.
    // No-op in production builds (see devApi.ts).
    installDevApi(world, pixiApp, {
      resetWorld: () => this.resetWorld(),
      saveNow: () => this.saveNow(),
      regenerateTerrain: (seed?: number) => this.regenerateTerrain(seed),
      resetFlat: () => this.resetFlat(),
      exportReplayPackage: () => encodeReplayPackage(world.getWorldSeed(), world.getDecisionLog()),
    });

    // Flush data-view selection buffered before start() (e.g. mount effect ran
    // before PixiApp was constructed). Mirrors the pending speed/pause flush below.
    pixiApp.setDataView(this.pendingDataView);

    // Setup input handlers
    const refreshHover = (tile: TileCoord | null) => {
      const owner = tile ? world.getMap().getBuildings().getBuildingAt(tile.x, tile.y) : null;
      pixiApp.setHoverTile(tile, owner ? owner.footprint : undefined);
    };

    const pointerHandler = new PointerHandler(canvas, camera, world, {
      onTileHover: (tile) => {
        refreshHover(tile);
        const tool = this.toolManager.getCurrentTool();
        if (tile === null) {
          pixiApp.getSelectionRenderer()?.clearDragPreview();
        } else {
          this.applyToolPreview(previewClick(tool, tile, world), tool);
        }
        this.callbacks.onTileHover?.(tile);
      },
      onTileClick: (tile, screen) => {
        // Single-tile execution goes through the dispatcher, same as drags
        const tool = this.toolManager.getCurrentTool();
        if (this.markIfChanged(executeClick(tool, tile, world))) {
          world.recordDecision({
            day: world.getElapsedDays(),
            kind: 'click',
            tool: tool as DecisionTool,
            start: { ...tile },
            end: { ...tile },
          });
        }
        refreshHover(tile);
        // Reapply the hover ghost for the post-click world state (e.g. a freshly
        // placed road now classifies differently on the next hover pass).
        this.applyToolPreview(previewClick(tool, tile, world), tool);
        pixiApp.setSelectedTile(tile);
        this.callbacks.onTileClick(tile);
        // SELECT clicks emit a one-shot info snapshot anchored at the cursor;
        // other tools clear the panel.
        this.callbacks.onTileInspect?.(
          tool === Tool.SELECT ? inspectTile(world, tile) : null,
          screen
        );
      },
      onTileDrag: (start, end) => {
        // Resolve path with the current tool at drag time
        const tool = this.toolManager.getCurrentTool();
        if (this.markIfChanged(executeDrag(tool, start, end, world))) {
          world.recordDecision({
            day: world.getElapsedDays(),
            kind: 'drag',
            tool: tool as DecisionTool,
            start: { ...start },
            end: { ...end },
          });
        }
        refreshHover(end);
      },
      onDragPreview: (start, end) => {
        const tool = this.toolManager.getCurrentTool();
        if (end === null) {
          pixiApp.getSelectionRenderer()?.clearDragPreview();
          return;
        }
        this.applyToolPreview(previewDrag(tool, start, end, world), tool);
      },
    });
    this.pointerHandler = pointerHandler;

    const cameraController = new CameraController(canvas, camera, {
      onCameraUpdate: (x, y, zoom) => this.callbacks.onCameraUpdate(x, y, zoom),
    });
    this.cameraController = cameraController;

    // Start fixed-timestep simulation loop; render/persist are gated on
    // changed > 0, but onTickUpdate fires every drained pump for the HUD.
    const gameLoop = new GameLoop(world, (agg: GameLoopTickInfo) => {
      const money = world.getMoney();
      const economyDirty = this.lastSyncedMoney !== null && money !== this.lastSyncedMoney;
      const elapsedDays = world.getElapsedDays();
      const calendarDirty = this.lastSyncedElapsedDays !== null && elapsedDays !== this.lastSyncedElapsedDays;
      if (agg.changedTiles.length > 0) {
        // Incremental update: only re-render the tiles that changed this pump.
        // Tool-driven changes still call markDirty() for a full redraw.
        const tr = this.pixiApp?.getTileRenderer();
        if (tr) {
          tr.markTilesChanged(agg.changedTiles);
          tr.markBuildingsChanged(agg.changedBuildingIds);
        }
        this.scheduleSave();
      }
      // Tax-only/date-only change still persists, debounced. Guard by changedTiles.length to avoid
      // double-schedule (WorldTickResult contract from Task 4: changed === changedTiles.length).
      if (agg.changedTiles.length === 0 && (economyDirty || calendarDirty)) {
        this.scheduleSave();
      }
      // Read happiness before congestion: getHappiness() drains traffic dirtiness via its
      // land-value cascade, so the getTrafficMap() read below never forces its own recompute.
      const happiness = world.getHappiness();
      this.callbacks.onTickUpdate?.({
        worldSeed: world.getWorldSeed(),
        citySummary: world.getCityData1910() ? {
          districts: world.getCityData1910()!.districts.districts.length,
          parcels: world.getCityData1910()!.parcels.parcels.length,
          institutions: world.getCityData1910()!.foundation.institutions.length,
        } : null,
        club: world.getClub(),
        tick: agg.tick,
        dirt: world.countDirt(),
        population: world.getPopulation(),
        money,
        date: world.getDate(),
        demand: world.getDemand(),
        happiness,
        congestion: world.getTrafficMap().getCongestionIndex(),
        employed: world.getEmployed(),
        unemployed: world.getUnemployed(),
        jobsCapacity: world.getJobsCapacity(),
        cityGrowth: world.getCityGrowthState() ? {
          throughYear: world.getCityGrowthState()!.throughYear,
          developments: world.getCityGrowthState()!.developments.length,
          populationUnits: world.getCityGrowthState()!.populationUnitsAdded,
          jobUnits: world.getCityGrowthState()!.jobUnitsAdded,
        } : null,
        cityTransformation: world.getCityTransformationState() ? {
          throughYear: world.getCityTransformationState()!.throughYear,
          activeBuildings: world.getCityTransformationState()!.buildings.filter(({ status }) => status === 'active').length,
          pastBuildings: world.getCityTransformationState()!.buildings.filter(({ status }) => status !== 'active').length,
          centralities: world.getCityTransformationState()!.centralities.length,
          avenues: world.getCityTransformationState()!.avenueUpgrades.length,
        } : null,
      });
      this.lastSyncedMoney = money;
      this.lastSyncedElapsedDays = elapsedDays;
    }, undefined, undefined, (interruption) => {
      this.activeInterruptionId = interruption.id;
      this.callbacks.onPauseChange?.(true);
      this.callbacks.onInterruption?.(interruption);
      this.saveNow();
    });
    // Sync HUD to the world's current state before the first tick, so a
    // hydrated/reused world with persisted DIRT shows the real count instead
    // of staying at 0 until the first tick heals it away.
    // Read happiness before congestion: getHappiness() drains traffic dirtiness via its
    // land-value cascade, so the getTrafficMap() read below never forces its own recompute.
    const initialHappiness = world.getHappiness();
    this.callbacks.onTickUpdate?.({
      worldSeed: world.getWorldSeed(),
      citySummary: world.getCityData1910() ? {
        districts: world.getCityData1910()!.districts.districts.length,
        parcels: world.getCityData1910()!.parcels.parcels.length,
        institutions: world.getCityData1910()!.foundation.institutions.length,
      } : null,
      club: world.getClub(),
      tick: world.getTick(),
      dirt: world.countDirt(),
      population: world.getPopulation(),
      money: world.getMoney(),
      date: world.getDate(),
      demand: world.getDemand(),
      happiness: initialHappiness,
      congestion: world.getTrafficMap().getCongestionIndex(),
      employed: world.getEmployed(),
      unemployed: world.getUnemployed(),
      jobsCapacity: world.getJobsCapacity(),
      cityGrowth: world.getCityGrowthState() ? {
        throughYear: world.getCityGrowthState()!.throughYear,
        developments: world.getCityGrowthState()!.developments.length,
        populationUnits: world.getCityGrowthState()!.populationUnitsAdded,
        jobUnits: world.getCityGrowthState()!.jobUnitsAdded,
      } : null,
      cityTransformation: world.getCityTransformationState() ? {
        throughYear: world.getCityTransformationState()!.throughYear,
        activeBuildings: world.getCityTransformationState()!.buildings.filter(({ status }) => status === 'active').length,
        pastBuildings: world.getCityTransformationState()!.buildings.filter(({ status }) => status !== 'active').length,
        centralities: world.getCityTransformationState()!.centralities.length,
        avenues: world.getCityTransformationState()!.avenueUpgrades.length,
      } : null,
    });
    this.lastSyncedMoney = world.getMoney();
    this.lastSyncedElapsedDays = world.getElapsedDays();
    // Closes the race window between `sessionRef.current = session` and `await session.start()`.
    // Flush any pause/speed commands received before the loop existed.
    // We deliberately do NOT emit onSpeedChange/onPauseChange here — the
    // unconditional initial-sync emit below covers both flushed and default cases
    // with a single fan-out, avoiding the noisy "flush emit + initial sync emit" double-fire.
    if (this.pendingSpeedMultiplier !== null) {
      gameLoop.setSpeedMultiplier(this.pendingSpeedMultiplier); // validated; invalid values silently ignored
      this.pendingSpeedMultiplier = null;
    }
    if (this.pendingPauseToggleCount % 2 === 1) {
      // Odd parity: one net toggle. Even parity: net no-op (still drain the count).
      gameLoop.setPaused(true); // initial paused is always false, so odd count ⇒ paused=true.
    }
    this.pendingPauseToggleCount = 0;
    // Single initial-sync emit covers both the flushed and the default case in one fan-out (no duplicate emits).
    this.callbacks.onSpeedChange?.(gameLoop.getSpeedMultiplier());
    this.callbacks.onPauseChange?.(gameLoop.isPaused());
    this.gameLoop = gameLoop;
    gameLoop.start();
    } catch (err) {
      pixiApp.destroy();
      this.keyboardHandler?.detach();
      this.keyboardHandler = null;
      throw err;
    }
  }

  /**
   * Handle window resize
   */
  resize(width: number, height: number): void {
    this.pixiApp?.resize(width, height);
  }

  getClub(): ClubState | null {
    return this.world?.getClub() ?? null;
  }

  ensureFoundingClub(): ClubState | null {
    if (!this.world) return null;
    const club = this.world.ensureFoundingClub();
    if (club) {
      this.pixiApp?.getTileRenderer()?.markDirty();
      this.scheduleSave();
    }
    return club;
  }

  foundClubWithParcel(club: ClubState, parcelId: string, contract: LandOccupancyContract): boolean {
    if (!this.world) return false;
    const success = this.world.foundClubWithParcel(club, parcelId, contract);
    if (success) {
      this.pixiApp?.getTileRenderer()?.markDirty();
      this.scheduleSave();
      return true;
    }
    return false;
  }

  getCityParcels(): readonly CityParcel[] {
    return this.world?.getCityParcels1910()?.parcels ?? [];
  }

  buildClubFacility(type: FacilityType, customName?: string): boolean {
    if (!this.world) return false;
    const success = this.world.buildClubFacility(type, customName);
    if (success) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  repairClubFacility(facilityId: string): boolean {
    if (!this.world) return false;
    const success = this.world.repairClubFacility(facilityId);
    if (success) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  admitClubMember(
    name: string,
    category: MemberCategory,
    socialClass: 'working_class' | 'middle_class' | 'upper_class' | 'elite',
    occupation: string,
  ): boolean {
    if (!this.world) return false;
    const success = this.world.admitClubMember(name, category, socialClass, occupation);
    if (success) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  getPerson(id: string): import('../core/person/Person').Person | undefined {
    return this.world?.getPerson(id);
  }

  getFamilyTree(personId: string): import('../core/person/PersonRegistry').FamilyTreeNode | undefined {
    return this.world?.getFamilyTree(personId);
  }

  getAllPersons(): readonly import('../core/person/Person').Person[] {
    return this.world?.getAllPersons() ?? [];
  }

  getUrbanDemographics(): import('../core/club/PopulationLayers').UrbanDemographicsSnapshot | undefined {
    return this.world?.getUrbanDemographics();
  }

  getElectionCandidates(): readonly import('../core/club/ClubElections').ElectionCandidate[] {
    return this.world?.getElectionCandidates() ?? [];
  }

  holdClubElection(playerVotedCandidateId?: string): import('../core/club/ClubElections').ClubElectionEvent | null {
    if (!this.world) return null;
    const election = this.world.holdClubElection(playerVotedCandidateId);
    if (election) {
      this.scheduleSave();
      return election;
    }
    return null;
  }

  getFootballSquad(): import('../core/football/Footballer').FootballSquadState | undefined {
    return this.world?.getFootballSquad();
  }

  getFootballers(): readonly import('../core/football/Footballer').Footballer[] {
    return this.world?.getFootballers() ?? [];
  }

  setSquadTrainingRegime(regime: import('../core/football/Footballer').TrainingRegime): boolean {
    if (!this.world) return false;
    const ok = this.world.setSquadTrainingRegime(regime);
    if (ok) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  getClubAthleticsPolicy(): import('../core/football/FootballMarket').ClubAthleticsPolicyState | undefined {
    return this.world?.getClubAthleticsPolicy();
  }

  setClubAthleticsPolicy(tier: import('../core/football/FootballMarket').ClubPolicyTier): boolean {
    if (!this.world) return false;
    const ok = this.world.setClubAthleticsPolicy(tier);
    if (ok) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  getAvailableLocalProspects(): readonly import('../core/person/Person').Person[] {
    return this.world?.getAvailableLocalProspects() ?? [];
  }

  inviteProspectToClub(
    personId: string,
    position: import('../core/football/Footballer').HistoricalPosition,
    role: import('../core/football/Footballer').SquadRole
  ): { success: boolean; message: string; footballer?: import('../core/football/Footballer').Footballer } {
    if (!this.world) return { success: false, message: 'Mundo não carregado' };
    const res = this.world.inviteProspectToClub(personId, position, role);
    if (res.success) {
      this.scheduleSave();
    }
    return res;
  }

  releaseFootballerFromSquad(footballerId: string): boolean {
    if (!this.world) return false;
    const ok = this.world.releaseFootballerFromSquad(footballerId);
    if (ok) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  promoteOrDemoteFootballerRole(footballerId: string, role: import('../core/football/Footballer').SquadRole): boolean {
    if (!this.world) return false;
    const ok = this.world.promoteOrDemoteFootballerRole(footballerId, role);
    if (ok) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  getLatestRivalInquiries(): readonly import('../core/football/FootballMarket').RivalInquiry[] {
    return this.world?.getLatestRivalInquiries() ?? [];
  }

  getLocalClubs(): readonly import('../core/club/ClubBirthEngine').LocalClubState[] {
    return this.world?.getLocalClubs() ?? [];
  }

  getRegionalClubs(): readonly import('../core/club/RegionalClub').RegionalClubState[] {
    return this.world?.getRegionalClubs() ?? [];
  }

  getFederation(): import('../core/federation/Federation').FederationState | null {
    return this.world?.getFederation() ?? null;
  }

  getAvailableHistoricalRivals(): readonly import('../core/football/MatchEngine').Historical1910RivalPreset[] {
    return this.world?.getAvailableHistoricalRivals() ?? [];
  }

  getClubMatchHistory(): readonly import('../core/football/MatchEngine').MatchRecord[] {
    return this.world?.getClubMatchHistory() ?? [];
  }

  getLatestClubMatch(): import('../core/football/MatchEngine').MatchRecord | undefined {
    return this.world?.getLatestClubMatch();
  }

  playFriendlyMatch(
    rivalPresetName: string,
    competitionType: 'friendly' | 'festival_taça' = 'friendly'
  ): import('../core/football/MatchEngine').MatchRecord | null {
    if (!this.world) return null;
    const record = this.world.playFriendlyMatch(rivalPresetName, competitionType);
    if (record) {
      this.scheduleSave();
    }
    return record;
  }

  getCompetitions(): readonly import('../core/football/Competition').CompetitionState[] {
    return this.world?.getCompetitions() ?? [];
  }

  getActiveCompetitions(): readonly import('../core/football/Competition').CompetitionState[] {
    return this.world?.getActiveCompetitions() ?? [];
  }

  playCompetitionMatch(
    competitionId: string,
    fixtureId: string
  ): import('../core/football/MatchEngine').MatchRecord | null {
    if (!this.world) return null;
    const record = this.world.playCompetitionMatch(competitionId, fixtureId);
    if (record) {
      this.scheduleSave();
    }
    return record;
  }

  getRivalries(): readonly import('../core/football/RivalryRelationship').RivalryRelationship[] {
    return this.world?.getRivalries() ?? [];
  }

  getRivalryForClubs(
    clubAId: string,
    clubBId: string
  ): import('../core/football/RivalryRelationship').RivalryRelationship | undefined {
    return this.world?.getRivalryForClubs(clubAId, clubBId);
  }

  getSupporterTerritories(): readonly import('../core/football/SupporterTerritory').ClubSupporterTerritory[] {
    return this.world?.getSupporterTerritories() ?? [];
  }

  getPressArchive(): readonly import('../core/media/HistoricalPress').PressArticle[] {
    return this.world?.getPressArchive() ?? [];
  }

  getAvailableMediaOutlets(): readonly import('../core/media/HistoricalPress').NewspaperProfile[] {
    return this.world?.getAvailableMediaOutlets() ?? [];
  }

  getClubLegends(): readonly import('../core/club/LegacyScore').ClubLegend[] {
    return this.world?.getClubLegends() ?? [];
  }

  getInstitutionalHonors(): readonly import('../core/club/InstitutionalHonors').InstitutionalHonorProposal[] {
    return this.world?.getInstitutionalHonors() ?? [];
  }

  proposeInstitutionalHonor(
    legendId: string,
    honorType: import('../core/club/InstitutionalHonors').HonorType
  ): { success: boolean; proposal?: import('../core/club/InstitutionalHonors').InstitutionalHonorProposal; message: string } {
    return (
      this.world?.proposeInstitutionalHonor(legendId, honorType) ?? {
        success: false,
        message: 'Mundo indisponível.',
      }
    );
  }

  voteInstitutionalHonor(
    proposalId: string
  ): { success: boolean; approved: boolean; outcome: string } {
    return (
      this.world?.voteInstitutionalHonor(proposalId) ?? {
        success: false,
        approved: false,
        outcome: 'Mundo indisponível.',
      }
    );
  }

  getClubTraditionProfile(): import('../core/club/TraditionSystem').ClubTraditionProfile | null {
    return this.world?.getClubTraditionProfile() ?? null;
  }

  getHistoricalLedger(): import('../core/club/HistoricalLedger').HistoricalLedgerState {
    return this.world?.getHistoricalLedger() ?? { events: [] };
  }

  getCausalChainForEvent(eventId: string) {
    return this.world?.getCausalChainForEvent(eventId) ?? {
      rootCauses: [],
      downstreamConsequences: [],
    };
  }

  getClubArchive(): import('../core/club/ClubArchive').ClubArchiveData | null {
    return this.world?.getClubArchive() ?? null;
  }

  getTacaBrasil1959(): import('../core/football/TacaBrasil1959').TacaBrasilTournament | null {
    return this.world?.getTacaBrasil1959() ?? null;
  }

  generateTacaBrasil1959(): import('../core/football/TacaBrasil1959').TacaBrasilTournament | null {
    if (!this.world) return null;
    const tournament = this.world.generateTacaBrasil1959();
    this.scheduleSave();
    return tournament;
  }

  advanceTacaBrasil(): import('../core/football/TacaBrasil1959').TacaBrasilTournament | null {
    if (!this.world) return null;
    const updated = this.world.advanceTacaBrasil();
    this.scheduleSave();
    return updated;
  }

  simulateEntireTacaBrasil(): import('../core/football/TacaBrasil1959').TacaBrasilTournament | null {
    if (!this.world) return null;
    const updated = this.world.simulateEntireTacaBrasil();
    this.scheduleSave();
    return updated;
  }

  getFiftyYearsReport(): import('../core/club/FiftyYearsReport').FiftyYearsReportData | null {
    return this.world?.getFiftyYearsReport() ?? null;
  }

  dispose(): void {
    this.disposed = true;

    // Flush a pending debounced save so a quick refresh/navigation within
    // the debounce window doesn't drop the last mutation.
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      if (this.world) saveWorld(this.world);
    }
    this.gameLoop?.stop();
    this.gameLoop = null;
    this.pointerHandler?.detach();
    this.cameraController?.detach();
    this.keyboardHandler?.detach();
    // Clear the dev injection BEFORE destroying pixiApp so any in-flight
    // browser-console reference is severed cleanly.
    uninstallDevApi();
    this.pixiApp?.destroy();

    this.pixiApp = null;
    this.pointerHandler = null;
    this.cameraController = null;
    this.keyboardHandler = null;
    this.world = null;
  }
}
