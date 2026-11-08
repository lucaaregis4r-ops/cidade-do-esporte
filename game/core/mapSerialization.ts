/**
 * World-envelope (de)serialization.
 *
 * v24 is native; v19-v23 migrate explicitly. Older/unknown versions are rejected
 * without mutating the target. `t[]` accepts only
 * the current `TileType` enum; coherence (water ⇒ GRASS && no building footprint) is checked after
 * staging validation and before commit. `serializeWorld` does NOT validate coherence —
 * it serializes the in-memory `World` as-is; `devApi.seedScene` is the only legitimate
 * producer of incoherent worlds and the load-side rejection is the safety net.
 */

import { TileType, createTile, isZoneType } from './Tile';
import { ZONE_MAX_LEVEL } from './World';
import type { World } from './World';
import { isBuildingType, tileTypeFromBuildingType } from './Building';
import { isCanonicalFootprintRect, isStructureRectInLot, lotBboxOf } from './buildingFootprint';
import { maxDensityForLot } from './zoneGrowth';
import type { Frontage, Rect } from './buildingFootprint';
import type { Building } from './Building';
import { Terrain, SEA_LEVEL } from './Terrain';
import { isStructureType, structureFootprintSize } from './StructureMap';
import type { Structure, StructureType } from './StructureMap';
import { WORLD_SAVE_VERSION, migrateSaveEnvelope, validateCampaignSave } from './campaignSave';
import { validateClubState, type ClubState } from './club/Club';
import { validateLocalClubState, type LocalClubState } from './club/ClubBirthEngine';
import { validateRegionalClubState, type RegionalClubState } from './club/RegionalClub';
import { validateFederationState, type FederationState } from './federation/Federation';
import { validateCompetitionState, type CompetitionState } from './football/Competition';
import { validateRivalryRelationship, type RivalryRelationship } from './football/RivalryRelationship';
import { CampaignRng } from './CampaignRng';
import { generateCampaignCity1910 } from './city/campaignCity';
import { createCityState } from './city/CityState';
import { createCityGrowthState, validateCityGrowthState } from './city/cityGrowth';
import type { CityGrowthState } from './city/cityGrowth';
import { replayCityTransformationHistory } from './city/cityTransformation';
import type { CityTransformationState } from './city/cityTransformation';
import { CAMPAIGN_TRANSFORMATION_PROFILE } from './city/campaignGrowthProfile';
import { HistoricalClock } from './HistoricalClock';
import { recordParcelPurchase } from './city/cityParcels';
export { WORLD_SAVE_VERSION } from './campaignSave';

/**
 * Version 24 adds persistent annual city transformation. Versions 19-23 are migrated in
 * campaignSave; pre-v19 density/terrain schemas remain unsupported.
 */

/**
 * Maps a StructureType to its corresponding TileType — single source of truth so
 * validateStructuresArray and any future consumers never hard-code the mapping.
 */
function structureTileType(type: StructureType): TileType {
  switch (type) {
    case 'power_plant': return TileType.POWER_PLANT;
    case 'water_tower': return TileType.WATER_TOWER;
    case 'police_station': return TileType.POLICE_STATION;
    case 'fire_station': return TileType.FIRE_STATION;
    case 'hospital': return TileType.HOSPITAL;
    case 'school': return TileType.SCHOOL;
    case 'park': return TileType.PARK;
  }
}

/** All tile types that belong exclusively to a structure footprint; used by orphan-tile sweep.
 *  Must stay in sync with structureTileType() — every StructureType must have its tile here. */
const STRUCTURE_TILE_TYPES = new Set([TileType.POWER_PLANT, TileType.WATER_TOWER, TileType.POLICE_STATION, TileType.FIRE_STATION, TileType.HOSPITAL, TileType.SCHOOL, TileType.PARK]);

const VALID_TILE_TYPES = new Set<string>(Object.values(TileType));

/**
 * Wire format for one structure entry in `s[]`.
 * Compact tuple-array style: { id, type, foot: [[x,y],...], anc: [x,y] }.
 */
interface StructureSaveEntry {
  id: number;
  type: string;             // 'power_plant' | 'water_tower' | 'police_station' | 'fire_station' | 'hospital' | 'school' | 'park' (v17 native)
  foot: [number, number][]; // exactly 4 cells for a 2x2 (or 1 cell for 1x1 structures such as water_tower/park)
  anc: [number, number];
}

/**
 * Wire format for one building entry in `b[]`.
 * Compact tuple-array style: { id, type, foot: [[x,y],...], anc: [x,y], lvl, den, age, f, sr: [x,y,w,h], ab }.
 */
interface BuildingSaveEntry {
  id: number;
  type: string;
  foot: [number, number][];
  anc: [number, number];
  lvl: number;
  den: number;
  age: number;
  f: Frontage;
  sr: [number, number, number, number]; // [x, y, w, h] of structureRect
  ab: boolean;                          // abandoned flag (v18+)
}

/**
 * Serialize the full world state to a JSON string.
 * Always emits the current `WORLD_SAVE_VERSION`.
 * Does NOT validate coherence — the in-memory world is serialized as-is.
 *
 * `b[]` and `s[]` are both sorted by id ascending for deterministic byte-equality across round-trips.
 */
export function serializeWorld(world: World): string {
  const map = world.getMap();
  const buildings = map.getBuildings();

  const w = map.getWidth();
  const h = map.getHeight();
  const tiles = [...map.iterateTiles()];
  const t = tiles.map((tile) => tile.type);
  const l = tiles.map((tile) => {
    if (!isZoneType(tile.type)) return 0;
    const building = buildings.getBuildingAt(tile.x, tile.y);
    return building !== null ? building.level : 0;
  });

  const allBuildings = [...buildings.getAllBuildings()].sort((a, b) => a.id - b.id);
  const b: BuildingSaveEntry[] = allBuildings.map((building) => ({
    id: building.id,
    type: building.type,
    foot: building.footprint.map(({ x, y }) => [x, y] as [number, number]),
    anc: [building.anchor.x, building.anchor.y],
    lvl: building.level,
    den: building.density,
    age: building.age,
    f: building.frontage,
    sr: [building.structureRect.x, building.structureRect.y, building.structureRect.w, building.structureRect.h] as [number, number, number, number],
    ab: building.abandoned,
  }));

  const allStructures = [...world.getStructureMap().getAllStructures()].sort((a, b) => a.id - b.id);
  const s: StructureSaveEntry[] = allStructures.map((structure) => ({
    id: structure.id,
    type: structure.type,
    foot: structure.footprint.map(({ x, y }) => [x, y] as [number, number]),
    anc: [structure.anchor.x, structure.anchor.y],
  }));

  const data = {
    v: WORLD_SAVE_VERSION,
    w,
    h,
    t,
    l,
    m: world.getMoney(),
    d: world.getElapsedDays(),
    b,
    s,
    terrain: world.getTerrain().toJSON(),
    campaign: {
      worldSeed: world.getWorldSeed(),
      rng: world.getRngStreams().snapshot(),
      clock: { version: 1, elapsedDays: world.getElapsedDays() },
      interruptions: world.getInterruptionState(),
      nextIds: { buildings: buildings.getNextId(), structures: world.getStructureMap().getNextId() },
      decisions: world.getDecisionLog(),
    },
    city: world.getCityData1910(),
    cityGrowth: world.getCityGrowthState(),
    cityTransformation: world.getCityTransformationState(),
    club: world.getClub(),
    persons: world.getPersonRegistry().serialize(),
    localClubs: world.getLocalClubs(),
    regionalClubs: world.getRegionalClubs(),
    federation: world.getFederation(),
    competitions: world.getCompetitions(),
    tacaBrasil1959: world.getTacaBrasil1959(),
    rivalries: world.getRivalries(),
    pressArchive: world.getPressArchive(),
  };
  return JSON.stringify(data);
}


interface WorldSaveData {
  v: number;
  w: number;
  h: number;
  t: TileType[];
  l: number[];
  m: number;
  d: number;
  b: unknown[];
  s: unknown[];
  terrain: unknown;
  campaign: unknown;
  city: unknown;
  cityGrowth: unknown;
  cityTransformation: unknown;
  transformationNeedsMigration?: boolean;
  club?: unknown;
  persons?: unknown;
  localClubs?: unknown;
  regionalClubs?: unknown;
  federation?: unknown;
  competitions?: unknown;
  tacaBrasil1959?: unknown;
  rivalries?: unknown;
  pressArchive?: unknown;
}


/**
 * Validate the `b[]` array against the staged tile array and stage Building objects.
 * Returns the staged Building[] on success, or null on any validation failure.
 * Mutates `occupiedIndices` in place with the indices of all validated footprint cells.
 * Pure validation: no world mutation. Callers must run the elevation-coherence check
 * separately against the staged footprints.
 */
function validateBuildingsArray(
  data: WorldSaveData,
  w: number,
  h: number,
  occupiedIndices: Set<number>,
): Building[] | null {
  if (!Array.isArray(data.b)) return null;

  const seenIds = new Set<number>();
  const staging: Building[] = [];

  for (const entry of data.b) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const e = entry as BuildingSaveEntry;

    if (!Number.isInteger(e.id) || e.id < 0) return null;
    if (seenIds.has(e.id)) return null;
    seenIds.add(e.id);

    if (typeof e.type !== 'string' || !isBuildingType(e.type)) return null;
    if (!Number.isInteger(e.lvl) || e.lvl < 0 || e.lvl > ZONE_MAX_LEVEL) return null;
    if (!Number.isInteger(e.den) || (e.den !== 0 && e.den !== 1 && e.den !== 2)) return null;
    if (!Number.isInteger(e.age) || e.age < 0) return null;
    if (e.f !== 'N' && e.f !== 'S' && e.f !== 'E' && e.f !== 'W') return null;
    if (typeof e.ab !== 'boolean') return null;
    if (!Array.isArray(e.foot) || e.foot.length === 0) return null;

    const footprintIndices = new Set<number>();
    const footprint: { x: number; y: number }[] = [];
    for (const coord of e.foot) {
      if (!Array.isArray(coord) || coord.length < 2) return null;
      const cx = coord[0];
      const cy = coord[1];
      if (!Number.isInteger(cx) || !Number.isInteger(cy)) return null;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) return null;
      const idx = cy * w + cx;
      if (footprintIndices.has(idx)) return null;
      footprintIndices.add(idx);
      footprint.push({ x: cx, y: cy });
    }

    if (!Array.isArray(e.anc) || e.anc.length < 2) return null;
    const ax = e.anc[0];
    const ay = e.anc[1];
    if (!Number.isInteger(ax) || !Number.isInteger(ay)) return null;
    const ancInFootprint = footprint.some((c) => c.x === ax && c.y === ay);
    if (!ancInFootprint) return null;

    // Footprint must be a canonical NW-anchored rectangle, W and H in {1..4}.
    if (!isCanonicalFootprintRect(footprint, { x: ax, y: ay })) return null;

    const expectedTileType = tileTypeFromBuildingType(e.type);
    for (const c of footprint) {
      const tileType = data.t[c.y * w + c.x];
      if (tileType !== expectedTileType) return null;
    }

    for (const idx of footprintIndices) {
      if (occupiedIndices.has(idx)) return null;
      occupiedIndices.add(idx);
    }

    const lot = lotBboxOf(footprint);

    // Density is capped by lot width (maxDensityForLot), not just the 0..2 enum range checked
    // above — a native v19 save can still be hand-crafted (e.g. via devApi, the one legitimate
    // producer of otherwise-unreachable states) with a one-wide lot at density 2, which would
    // recreate the mixed-density merge deadlock the lot-width cap exists to prevent. Reject it
    // here rather than clamp it: clamping would silently rewrite the save's data, the exact
    // transitional arm CLAUDE.md forbids.
    if (e.den > maxDensityForLot(lot, e.f)) return null;

    if (!Array.isArray(e.sr) || e.sr.length !== 4) return null;
    const [srx, sry, srw, srh] = e.sr;
    if (!Number.isInteger(srx) || srx < 0) return null;
    if (!Number.isInteger(sry) || sry < 0) return null;
    if (!Number.isInteger(srw) || srw < 0) return null;
    if (!Number.isInteger(srh) || srh < 0) return null;
    const sr: Rect = { x: srx, y: sry, w: srw, h: srh };
    if (!isStructureRectInLot(sr, lot, e.f)) return null;

    staging.push({
      id: e.id,
      type: e.type,
      footprint,
      anchor: { x: ax, y: ay },
      level: e.lvl,
      density: e.den as 0 | 1 | 2,
      age: e.age,
      abandoned: e.ab,
      frontage: e.f,
      structureRect: sr,
    });
  }

  return staging;
}

/**
 * Validate the `s[]` array against the staged tile array and stage Structure objects.
 * Returns the staged Structure[] on success, or null on any validation failure.
 * Mutates `occupiedIndices` in place with the indices of all validated footprint cells,
 * catching overlap with both buildings (already in the set) and other structures.
 */
function validateStructuresArray(
  data: WorldSaveData,
  w: number,
  h: number,
  occupiedIndices: Set<number>,
): Structure[] | null {
  if (!Array.isArray(data.s)) return null;

  const seenIds = new Set<number>();
  const staging: Structure[] = [];

  for (const entry of data.s) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const e = entry as StructureSaveEntry;

    if (!Number.isInteger(e.id) || e.id < 0) return null;
    if (seenIds.has(e.id)) return null;
    seenIds.add(e.id);

    if (typeof e.type !== 'string' || !isStructureType(e.type)) return null;

    if (!Array.isArray(e.foot) || e.foot.length === 0) return null;
    const footprintIndices = new Set<number>();
    const footprint: { x: number; y: number }[] = [];
    for (const coord of e.foot) {
      if (!Array.isArray(coord) || coord.length < 2) return null;
      const cx = coord[0];
      const cy = coord[1];
      if (!Number.isInteger(cx) || !Number.isInteger(cy)) return null;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) return null;
      const idx = cy * w + cx;
      if (footprintIndices.has(idx)) return null;
      footprintIndices.add(idx);
      footprint.push({ x: cx, y: cy });
    }

    if (!Array.isArray(e.anc) || e.anc.length < 2) return null;
    const ax = e.anc[0];
    const ay = e.anc[1];
    if (!Number.isInteger(ax) || !Number.isInteger(ay)) return null;
    if (!footprint.some((c) => c.x === ax && c.y === ay)) return null;

    // Footprint must be canonical NW-anchored rectangle AND exactly the size for this type.
    if (!isCanonicalFootprintRect(footprint, { x: ax, y: ay })) return null;
    const { w: sw, h: sh } = structureFootprintSize(e.type);
    const maxX = Math.max(...footprint.map((c) => c.x));
    const maxY = Math.max(...footprint.map((c) => c.y));
    if (maxX - ax + 1 !== sw || maxY - ay + 1 !== sh) return null;

    // Every footprint cell's tile must match the structure type (e.g. POWER_PLANT or WATER_TOWER).
    const expectedTile = structureTileType(e.type);
    for (const c of footprint) {
      if (data.t[c.y * w + c.x] !== expectedTile) return null;
    }

    // No overlap with buildings or prior structures.
    for (const idx of footprintIndices) {
      if (occupiedIndices.has(idx)) return null;
      occupiedIndices.add(idx);
    }

    staging.push({
      id: e.id,
      type: e.type,
      footprint,
      anchor: { x: ax, y: ay },
    });
  }

  return staging;
}

/**
 * Apply a native v24 or migrated v19–v23 envelope onto an existing World instance.
 * @returns true if the full world state was committed; false (without mutating) on any failure.
 *
 * Ordering: parse → migrate → dims → campaign/m/d → tiles/entities → terrain/coherence → commit.
 * Full staging-then-commit: every invariant is checked before any world mutation.
 */
export function deserializeWorldInto(world: World, json: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return false;
  }

  // Shape-guard: must be a non-null, non-array object with a numeric v.
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    typeof (parsed as { v?: unknown }).v !== 'number'
  ) {
    return false;
  }

  const migrated = migrateSaveEnvelope(parsed);
  if (!migrated) return false;
  const data = migrated as unknown as WorldSaveData;

  // Dims must match the target world.
  const map = world.getMap();
  const w = map.getWidth();
  const h = map.getHeight();
  if (data.w !== w || data.h !== h) return false;

  // Money + day: both required, whole non-negative integers.
  if (!Number.isInteger(data.m) || data.m < 0) return false;
  if (!Number.isInteger(data.d) || data.d < 0) return false;
  const campaign = validateCampaignSave(data.campaign, data.d);
  if (!campaign) return false;
  let stagingCity = null as ReturnType<typeof generateCampaignCity1910>['data'] | null;
  let stagingGrowth = null as CityGrowthState | null;
  let stagingTransformation = null as CityTransformationState | null;
  let stagingClub = null as ClubState | null;
  if (data.club !== undefined && data.club !== null) {
    stagingClub = validateClubState(data.club);
    if (!stagingClub) return false;
  }
  let stagingLocalClubs: readonly LocalClubState[] = [];
  if (Array.isArray(data.localClubs)) {
    const parsed: LocalClubState[] = [];
    for (const item of data.localClubs) {
      const valid = validateLocalClubState(item);
      if (valid) parsed.push(valid);
    }
    stagingLocalClubs = Object.freeze(parsed);
  }
  let stagingRegionalClubs: readonly RegionalClubState[] = [];
  if (Array.isArray(data.regionalClubs)) {
    const parsedReg: RegionalClubState[] = [];
    for (const item of data.regionalClubs) {
      const valid = validateRegionalClubState(item);
      if (valid) parsedReg.push(valid);
    }
    stagingRegionalClubs = Object.freeze(parsedReg);
  }
  let stagingFederation: FederationState | null = null;
  if (data.federation !== undefined && data.federation !== null) {
    stagingFederation = validateFederationState(data.federation);
  }
  let stagingCompetitions: readonly CompetitionState[] = [];
  if (Array.isArray(data.competitions)) {
    const parsedComps: CompetitionState[] = [];
    for (const comp of data.competitions) {
      const validated = validateCompetitionState(comp);
      if (!validated) return false;
      parsedComps.push(validated);
    }
    stagingCompetitions = Object.freeze(parsedComps);
  }
  let stagingRivalries: readonly RivalryRelationship[] = [];
  if (Array.isArray(data.rivalries)) {
    const parsedRivalries: RivalryRelationship[] = [];
    for (const item of data.rivalries) {
      const validated = validateRivalryRelationship(item);
      if (validated) parsedRivalries.push(validated);
    }
    stagingRivalries = Object.freeze(parsedRivalries);
  }
  if (data.city !== null) {
    try {
      let expectedCity = generateCampaignCity1910(new CampaignRng(campaign.worldSeed), w, h).data;
      if (stagingClub && stagingClub.contracts) {
        for (const contract of stagingClub.contracts) {
          const parcelIndex = expectedCity.parcels.parcels.findIndex((p) => p.id === contract.parcelId);
          if (parcelIndex !== -1) {
            const parcel = expectedCity.parcels.parcels[parcelIndex];
            let updatedParcel = parcel;
            if (contract.type === 'COMPRA' || contract.type === 'DOACAO') {
              updatedParcel = recordParcelPurchase(parcel, {
                id: `tx-${contract.id}`,
                date: contract.startDate,
                pricePpu: contract.type === 'COMPRA' ? contract.upfrontCostPpu : 0,
                sellerId: parcel.ownerId ?? null,
                buyerId: stagingClub.id,
              });
            } else {
              updatedParcel = {
                ...parcel,
                historicalEvents: [...parcel.historicalEvents, {
                  id: `ev-${contract.id}`,
                  date: contract.startDate,
                  kind: 'ownership-transferred',
                  description: `Ocupação por ${stagingClub.name} sob regime de ${contract.type} (${contract.grantorName}).`,
                }],
              };
            }
            const newParcelsList = [...expectedCity.parcels.parcels];
            newParcelsList[parcelIndex] = updatedParcel;
            expectedCity = {
              ...expectedCity,
              parcels: {
                ...expectedCity.parcels,
                parcels: newParcelsList,
              },
            };
          }
        }
      }
      if (JSON.stringify(data.city) !== JSON.stringify(expectedCity)) {
        return false;
      }
      stagingCity = expectedCity;
      const clock = new HistoricalClock();
      if (!clock.setElapsedDays(data.d)) return false;
      if (data.cityGrowth === null) {
        // v22 had no annual city-growth history. Rebase an empty ledger to its
        // saved year so only future clock boundaries create visible changes.
        stagingGrowth = createCityGrowthState(
          createCityState(campaign.worldSeed, { year: 1910, month: 1, day: 1 }),
          clock.getDate().year,
        );
      } else {
        stagingGrowth = validateCityGrowthState(
          data.cityGrowth,
          campaign.worldSeed,
          clock.getDate().year,
          expectedCity.parcels,
          expectedCity.districts,
          expectedCity.foundation,
        );
        if (!stagingGrowth) return false;
      }
      if (data.cityTransformation === null && data.transformationNeedsMigration === true) {
        stagingTransformation = replayCityTransformationHistory(
          createCityState(campaign.worldSeed, { year: 1910, month: 1, day: 1 }),
          stagingGrowth,
          expectedCity.parcels,
          expectedCity.foundation,
          CAMPAIGN_TRANSFORMATION_PROFILE,
        );
      } else {
        if (data.cityTransformation === null) return false;
        stagingTransformation = replayCityTransformationHistory(
          createCityState(campaign.worldSeed, { year: 1910, month: 1, day: 1 }),
          stagingGrowth,
          expectedCity.parcels,
          expectedCity.foundation,
          CAMPAIGN_TRANSFORMATION_PROFILE,
        );
        if (JSON.stringify(data.cityTransformation) !== JSON.stringify(stagingTransformation)) return false;
      }
    } catch {
      return false;
    }
  } else if (data.cityGrowth !== null || data.cityTransformation !== null) {
    return false;
  }

  // t[]: required array of length w*h with every entry in the current TileType enum.
  const size = w * h;
  if (
    !Array.isArray(data.t) ||
    data.t.length !== size ||
    !data.t.every((type) => VALID_TILE_TYPES.has(type))
  ) {
    return false;
  }

  // l[]: required array; non-zone tiles must be 0, zone tiles in [0, ZONE_MAX_LEVEL].
  if (!Array.isArray(data.l) || data.l.length !== size) return false;
  for (let i = 0; i < size; i++) {
    const lvl = data.l[i];
    const typ = data.t[i];
    if (!Number.isInteger(lvl)) return false;
    if (isZoneType(typ)) {
      if (lvl < 0 || lvl > ZONE_MAX_LEVEL) return false;
    } else {
      if (lvl !== 0) return false;
    }
  }

  // Shared occupancy set: populated by both building and structure validators.
  const occupiedIndices = new Set<number>();

  // b[]: staged Building objects, fully validated.
  const stagingBuildings = validateBuildingsArray(data, w, h, occupiedIndices);
  if (stagingBuildings === null) return false;

  // s[]: staged Structure objects, fully validated (shares occupiedIndices with buildings).
  const stagingStructures = validateStructuresArray(data, w, h, occupiedIndices);
  if (stagingStructures === null) return false;
  if (stagingBuildings.some((building) => building.id >= campaign.nextIds.buildings)) return false;
  if (stagingStructures.some((structure) => structure.id >= campaign.nextIds.structures)) return false;

  // Orphan-structure-tile check: every structure tile type (POWER_PLANT, WATER_TOWER,
  // POLICE_STATION, FIRE_STATION, HOSPITAL, SCHOOL, PARK — see STRUCTURE_TILE_TYPES) in t[] must be covered by a staged structure;
  // an uncovered cell is a coherence violation.
  for (let i = 0; i < size; i++) {
    if (STRUCTURE_TILE_TYPES.has(data.t[i]) && !occupiedIndices.has(i)) return false;
  }

  // terrain: native v8 DTO parsed directly.
  let candidateTerrain: Terrain;
  try {
    candidateTerrain = Terrain.fromData(data.terrain);
  } catch {
    return false;
  }
  if (candidateTerrain.getWidth() !== w || candidateTerrain.getHeight() !== h) return false;

  // Coherence: water cells must be GRASS and uncovered; ROAD/zone cells must be
  // coplanar (single plane) above sea level; building-footprint cells must additionally
  // be strict-flat (mirrors World.tick spawn — building visuals are not tilted-ready).
  const footprintIndices = new Set<number>();
  for (const building of stagingBuildings) {
    for (const c of building.footprint) {
      footprintIndices.add(c.y * w + c.x);
    }
  }
  for (const structure of stagingStructures) {
    for (const c of structure.footprint) {
      footprintIndices.add(c.y * w + c.x);
    }
  }
  const isWater = (cx: number, cy: number) =>
    candidateTerrain.getTileMinCornerHeight(cx, cy) <= SEA_LEVEL;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (candidateTerrain.getTileMinCornerHeight(x, y) <= SEA_LEVEL) {
        if (data.t[i] !== TileType.GRASS) return false;
        if (footprintIndices.has(i)) return false;
      }
      const isRoadOrZone = data.t[i] === TileType.ROAD || isZoneType(data.t[i]);
      if (isRoadOrZone && !candidateTerrain.isCoplanarTile(x, y, isWater)) {
        return false;
      }
      if (footprintIndices.has(i) && !candidateTerrain.isFlatTile(x, y, isWater)) {
        return false;
      }
    }
  }

  // Defensive: for canonical rectangles (validated separately), per-cell isFlatTile already implies same renderHeight in vertex-smooth mode. This check guards (1) legacy non-canonical footprints in the existing arm, and (2) future terrain modes that may decouple per-cell flatness from cross-cell height equality.
  for (const b of stagingBuildings) {
    const expectedH = candidateTerrain.getRenderHeight(b.anchor.x, b.anchor.y);
    for (const c of b.footprint) {
      if (candidateTerrain.getRenderHeight(c.x, c.y) !== expectedH) return false;
    }
  }

  // Per-structure terrain check: use isFlatArea (not per-cell isFlatTile) so that
  // four individually-flat cells that don't share vertex heights are also rejected.
  // structureFootprintSize is the single source of truth — covers both power_plant and water_tower.
  for (const structure of stagingStructures) {
    const { w: sw, h: sh } = structureFootprintSize(structure.type);
    if (!candidateTerrain.isFlatArea(structure.anchor.x, structure.anchor.y, sw, sh, isWater)) {
      return false;
    }
  }

  // All validation passed — commit. regenerate: false so procedural terrain does not
  // overwrite the hydrated data we are about to install.
  world.reset({ regenerate: false, worldSeed: campaign.worldSeed });
  world.setCityData1910(stagingCity);
  world.setCityGrowthState(stagingGrowth);
  world.setCityTransformationState(stagingTransformation);
  world.setClub(stagingClub);
  if (stagingLocalClubs.length > 0) {
    world.setLocalClubs(stagingLocalClubs);
  }
  if (stagingRegionalClubs.length > 0) {
    world.setRegionalClubs(stagingRegionalClubs);
  }
  world.setFederation(stagingFederation);
  if (stagingCompetitions.length > 0) {
    world.setCompetitions(stagingCompetitions);
  }
  if (data.tacaBrasil1959) {
    world.setTacaBrasil1959(data.tacaBrasil1959 as any);
  }
  if (data.persons && typeof data.persons === 'object' && 'persons' in (data.persons as Record<string, unknown>)) {
    world.setPersonRegistryState(data.persons as import('./person/PersonRegistry').PersonRegistryState);
  }
  if (stagingRivalries.length > 0) {
    world.setRivalries(stagingRivalries);
  } else {
    world.ensureRivalriesInitialized();
  }
  if (Array.isArray(data.pressArchive)) {
    world.setPressArchive(data.pressArchive as any);
  }


  for (let i = 0; i < size; i++) {
    const x = i % w;
    const y = Math.floor(i / w);
    map.setTile(x, y, createTile(x, y, data.t[i], data.l[i]));
  }

  const buildings = map.getBuildings();
  let maxId = -1;
  for (const building of stagingBuildings) {
    buildings.addExistingBuilding(building);
    if (building.id > maxId) maxId = building.id;
  }
  if (maxId >= 0) buildings.setNextIdFloor(maxId);

  const structureMap = world.getStructureMap();
  let maxStructureId = -1;
  for (const structure of stagingStructures) {
    structureMap.addExistingStructure(structure);
    if (structure.id > maxStructureId) maxStructureId = structure.id;
  }
  if (maxStructureId >= 0) structureMap.setNextIdFloor(maxStructureId);
  if (campaign.nextIds.buildings > 0) buildings.setNextIdFloor(campaign.nextIds.buildings - 1);
  if (campaign.nextIds.structures > 0) structureMap.setNextIdFloor(campaign.nextIds.structures - 1);

  world.installTerrain(candidateTerrain);

  world.setMoney(data.m);
  world.setElapsedDays(data.d);
  world.getRngStreams().restore(campaign.rng);
  world.restoreInterruptionState(campaign.interruptions);
  world.restoreDecisionLog(campaign.decisions);

  // Land value and service coverage are not persisted — mark dirty so the first tick after load recomputes.
  // Demand is dirtied via the markLaborDirty() cascade below.
  world.markLandValueDirty();
  world.markPowerDirty();
  // Drain power dirty here so the first render frame after load never sees a stale snapshot — `World.tick` recompute is defense-in-depth, not the only path.
  world.recomputePowerIfDirty();
  world.markWaterDirty();
  // Drain water dirty here so the first render frame after load never sees a stale snapshot — `World.tick` recompute is defense-in-depth, not the only path.
  world.recomputeWaterIfDirty();
  world.markServiceDirty();
  // Drain service coverage dirty here so the first frame/gate after load never reads a stale snapshot — `World.tick` recompute is defense-in-depth, not the only path.
  world.recomputeServiceIfDirty();
  world.markFireDirty();
  // Drain fire coverage dirty here so the first frame/gate after load never reads a stale snapshot — `World.tick` recompute is defense-in-depth, not the only path.
  world.recomputeFireIfDirty();
  world.markHospitalDirty();
  // Drain hospital coverage dirty here so the first frame/gate after load never reads a stale snapshot — `World.tick` recompute is defense-in-depth, not the only path.
  world.recomputeHospitalIfDirty();
  world.markSchoolDirty();
  // Drain school coverage dirty here so the first frame/gate after load never reads a stale snapshot — `World.tick` recompute is defense-in-depth, not the only path.
  world.recomputeSchoolIfDirty();
  // Traffic is mark-only on deserialization — getTrafficMap() drains on read.
  world.markTrafficDirty();
  // Labor is mark-only on deserialization — getLaborMarket()/recomputeTraffic() drain on read.
  world.markLaborDirty();

  return true;
}
