/**
 * Tile inspector for the SELECT-tool info panel.
 *
 * Gathers a one-shot snapshot of everything the UI shows about a tile by
 * reading core maps. Lives in engine because it reads across several core
 * maps (tiles, power, water, service coverage, fire coverage, hospital coverage,
 * school coverage, land value, buildings, structures) — the same downward read direction the
 * dispatcher uses.
 *
 * Land value is recomputed lazily (dirtied on edits, drained on the next
 * tick), so a fresh edit while paused would otherwise read a stale value.
 * We drain the dirty cache before snapshotting so the panel always reflects
 * the current map — power, water, and service coverage are already drained
 * eagerly by the dispatcher.
 */

import type { World } from '../core/World';
import type { GameMap } from '../core/Map';
import type { TileCoord } from '../types/coordinates';
import type { TileType } from '../core/Tile';
import type { Building, BuildingType } from '../core/Building';
import type { Structure, StructureType } from '../core/StructureMap';
import { isBuildingPowered, isStructurePowered, type PowerMap } from '../core/PowerMap';
import { isBuildingWatered, isStructureWatered, type WaterMap } from '../core/WaterMap';
import { SERVICE_COVERAGE_THRESHOLD_RAW } from '../core/ServiceCoverageMap';
import { buildingCapacity } from '../core/buildingCapacity';
import { lotBboxOf } from '../core/buildingFootprint';
import { lotWidthAlongFrontage, maxDensityForLot } from '../core/zoneGrowth';
import type { CityInstitutionKind } from '../core/city/cityFoundation';
import type { CityDistrictKind } from '../core/city/cityDistricts';
import type { CityDevelopmentKind } from '../core/city/cityGrowth';
import type { CityBuildingRecord, CityCentrality } from '../core/city/cityTransformation';
import type { ParcelHistoricalEvent, ParcelTransaction } from '../core/city/cityParcels';
import { createCityState } from '../core/city/CityState';
import { generateCityLandValue1910, type CityLandValue1910, type LandValueCalibration, type ValuedParcel } from '../core/city/cityLandValue';
import { CAMPAIGN_PARCEL_VALUATION_PROFILE } from '../core/city/campaignParcelValuationProfile';
import {
  getHistoricalCurrency,
  formatNominalMoney,
  type HistoricalCurrency,
  type HistoricalEconomy,
} from '../core/economy/HistoricalEconomy';
import type { GameDate } from '../core/HistoricalClock';
import {
  evaluateParcelForClub,
  type ParcelClubViability,
  type OccupancyType,
} from '../core/club/ClubLandContract';

export interface ParcelNominalValuation {
  readonly status: 'available' | 'unavailable';
  readonly currency: HistoricalCurrency;
  readonly currencyLabel: 'Réis' | 'Cruzeiros';
  readonly date: Readonly<GameDate>;
  readonly amount?: number;
  readonly formatted?: string;
  readonly reason?: string;
}

export interface TileBuildingInfo {
  readonly type: BuildingType;
  readonly level: number;
  readonly density: 0 | 1 | 2;
  readonly age: number;
  readonly abandoned: boolean;
  /** Workforce/population units this building contributes — buildingCapacity(b), pure geometry. */
  readonly capacity: number;
  /** Lot width along the frontage axis — the same measure maxDensityForLot/structureDepthCap gate on. */
  readonly lotWidth: number;
  /** Highest density tier this lot's width allows (1 unmerged, 2 once assembled >=2 wide). */
  readonly maxDensity: 1 | 2;
}

export interface CampaignCityTileInfo {
  readonly center: boolean;
  readonly institution: { readonly id: string; readonly kind: CityInstitutionKind; readonly year: 1910 } | null;
  readonly district: {
    readonly id: string;
    readonly kind: CityDistrictKind;
    readonly landArea: number;
    readonly populationUnits: number;
    readonly employmentUnits: number;
    readonly centrality: number;
  } | null;
  readonly parcel: {
    readonly id: string;
    readonly districtId: string;
    readonly area: number;
    readonly terrainDifficulty: number;
    readonly ownerId: string | null;
    readonly landValuePpu: number | null;
    readonly neighborhoodIncomeIndex: number | null;
    readonly prestige: number | null;
    readonly centrality: number;
    readonly accessibility: number;
    readonly neighborhoodPopulation: number;
    readonly roadAccess: number;
    readonly railAccess: number;
    readonly purchaseHistory: readonly ParcelTransaction[];
    readonly historicalEvents: readonly ParcelHistoricalEvent[];
    readonly valuation: (Pick<ValuedParcel, 'landValuePpu' | 'relativeScore' | 'factors'> & {
      readonly year: CityLandValue1910['year'];
      readonly calibrationId: string;
      readonly references: CityLandValue1910['references'];
      readonly notes: string;
      readonly weights: LandValueCalibration['weights'];
    }) | null;
    readonly nominalValuation: ParcelNominalValuation | null;
    readonly clubViability?: ParcelClubViability | null;
    readonly clubOccupancy?: {
      readonly clubName: string;
      readonly contractType: OccupancyType;
      readonly grantorName: string;
    } | null;
  } | null;
  readonly development: {
    readonly kind: CityDevelopmentKind;
    readonly year: number;
    readonly populationUnitsAdded: number;
    readonly jobUnitsAdded: number;
  } | null;
  readonly transformation: {
    readonly buildings: readonly CityBuildingRecord[];
    readonly centrality: CityCentrality | null;
    readonly avenue: { readonly roadId: string; readonly upgradedYear: number } | null;
  };
}

/**
 * One-shot readout for the SELECT-tool panel.
 *
 * WHICH CELL a field describes depends on its kind, mirroring the split World.tick gates on.
 * The GRADED fields (`landValue`, `congestionPenalty`, and the four `*Coverage` / `*Covered`
 * pairs) are read at the building ANCHOR when a building occupies the tile, because that is
 * the cell the growth gates evaluate, and at the clicked cell otherwise — including on a
 * structure. `powered` / `watered` do NOT follow that rule: they are reported at the entity
 * level throughout (structure source/connectivity, any footprint cell for a building, the raw
 * cell for bare land) — see the readout comments below.
 */
export interface TileInfo {
  readonly x: number;
  readonly y: number;
  readonly type: TileType;
  /** Zone growth level for zone tiles; 0 otherwise. */
  readonly level: number;
  readonly powered: boolean;
  readonly watered: boolean;
  /** Police-service coverage in [0, 1]. */
  readonly coverage: number;
  /** True when the raw coverage meets the simulation gate threshold (same gate as growth). */
  readonly serviceCovered: boolean;
  /** True when this tile's structure is a police station (the coverage source). */
  readonly isServiceSource: boolean;
  /** Fire-service coverage in [0, 1]. */
  readonly fireCoverage: number;
  /** True when the raw fire coverage meets the simulation gate threshold (same gate as growth). */
  readonly fireServiceCovered: boolean;
  /** True when this tile's structure is a fire station (the fire coverage source). */
  readonly isFireSource: boolean;
  /** Hospital-service coverage in [0, 1]. */
  readonly hospitalCoverage: number;
  /** True when the raw hospital coverage meets the simulation gate threshold (same gate as growth). */
  readonly hospitalServiceCovered: boolean;
  /** True when this tile's structure is a hospital (the hospital coverage source). */
  readonly isHospitalSource: boolean;
  /** School-service coverage in [0, 1]. */
  readonly schoolCoverage: number;
  /** True when the raw school coverage meets the simulation gate threshold (same gate as growth). */
  readonly schoolServiceCovered: boolean;
  /** True when this tile's structure is a school (the school coverage source). */
  readonly isSchoolSource: boolean;
  /** Land value in [0, 1] — compared against LEVEL_THRESHOLDS by the growth gates. */
  readonly landValue: number;
  /** Applied land-value penalty from road congestion, in [0, 1] — same unit as `landValue`. */
  readonly congestionPenalty: number;
  /** Grown building occupying this tile, if any. */
  readonly building: TileBuildingInfo | null;
  /** Player-placed structure (e.g. power plant) occupying this tile, if any. */
  readonly structure: { readonly type: StructureType } | null;
  /** 1910 campaign city identities at this tile, if this World has city metadata. */
  readonly city: CampaignCityTileInfo | null;
}

function campaignCityTileInfo(world: World, coord: TileCoord, economy?: HistoricalEconomy): CampaignCityTileInfo | null {
  const city = world.getCityData1910();
  if (!city) return null;
  const institution = city.foundation.institutions.find(({ coordinate }) => coordinate.x === coord.x && coordinate.y === coord.y);
  const districtId = city.districts.districtByTile[coord.y]?.[coord.x] ?? null;
  const parcelId = city.parcels.parcelByTile[coord.y]?.[coord.x] ?? null;
  const district = districtId ? city.districts.districts.find((item) => item.id === districtId) : null;
  const parcel = parcelId ? city.parcels.parcels.find((item) => item.id === parcelId) : null;
  const valuationResult = parcel ? generateCityLandValue1910(
    createCityState(world.getWorldSeed(), { year: 1910, month: 1, day: 1 }),
    city.parcels,
    city.districts,
    city.foundation,
    CAMPAIGN_PARCEL_VALUATION_PROFILE,
  ) : null;
  const valuation = parcel ? valuationResult?.parcels.find((item) => item.parcelId === parcel.id) ?? null : null;
  const development = parcelId ? world.getCityGrowthState()?.developments.find((item) => item.parcelId === parcelId) : null;
  const transformationState = world.getCityTransformationState();
  const buildings = parcelId ? transformationState?.buildings.filter((item) => item.parcelId === parcelId) ?? [] : [];
  const centrality = parcelId ? transformationState?.centralities.find((item) => item.parcelId === parcelId) ?? null : null;
  const avenue = transformationState?.avenueUpgrades.find((item) => item.path.some(({ x, y }) => x === coord.x && y === coord.y));

  const campaignDate = world.getDate();
  const currency = getHistoricalCurrency(campaignDate);
  const currencyLabel: 'Réis' | 'Cruzeiros' = currency === 'cruzeiro' ? 'Cruzeiros' : 'Réis';

  let nominalValuation: ParcelNominalValuation | null = null;
  if (parcel && valuation) {
    if (economy) {
      try {
        const nominal = economy.toNominal(valuation.landValuePpu, campaignDate);
        nominalValuation = {
          status: 'available',
          currency: nominal.currency,
          currencyLabel: nominal.currency === 'cruzeiro' ? 'Cruzeiros' : 'Réis',
          date: { ...campaignDate },
          amount: nominal.amount,
          formatted: formatNominalMoney(nominal),
        };
      } catch (err) {
        nominalValuation = {
          status: 'unavailable',
          currency,
          currencyLabel,
          date: { ...campaignDate },
          reason: err instanceof Error ? err.message : String(err),
        };
      }
    } else {
      nominalValuation = {
        status: 'unavailable',
        currency,
        currencyLabel,
        date: { ...campaignDate },
        reason: `Índice de custo de vida não calibrado para ${String(campaignDate.month).padStart(2, '0')}/${campaignDate.year}; pesquisa histórica necessária (Macroetapa 41).`,
      };
    }
  }

  const club = world.getClub();
  const clubViability = parcel
    ? evaluateParcelForClub(parcel, Boolean(institution), club ? club.foundingOrigin : 'railway')
    : null;

  let clubOccupancy: {
    readonly clubName: string;
    readonly contractType: OccupancyType;
    readonly grantorName: string;
  } | null = null;

  if (parcel && club && club.parcels.includes(parcel.id)) {
    const activeContract = club.contracts?.find((c) => c.parcelId === parcel.id);
    clubOccupancy = {
      clubName: club.name,
      contractType: activeContract?.type ?? 'COMPRA',
      grantorName: activeContract?.grantorName ?? 'Particular',
    };
  }

  return {
    center: city.foundation.center.coordinate.x === coord.x && city.foundation.center.coordinate.y === coord.y,
    institution: institution ? { id: institution.id, kind: institution.kind, year: 1910 } : null,
    district: district ? {
      id: district.id, kind: district.kind, landArea: district.landArea,
      populationUnits: district.populationUnits, employmentUnits: district.employmentUnits,
      centrality: district.centrality,
    } : null,
    parcel: parcel ? {
      id: parcel.id, districtId: parcel.districtId, area: parcel.area,
      terrainDifficulty: parcel.terrainDifficulty, ownerId: parcel.ownerId ?? null,
      landValuePpu: parcel.landValuePpu ?? null,
      neighborhoodIncomeIndex: parcel.neighborhoodIncomeIndex ?? null,
      prestige: parcel.prestige ?? null, centrality: parcel.centrality,
      accessibility: parcel.accessibility, neighborhoodPopulation: parcel.neighborhoodPopulation,
      roadAccess: parcel.roadAccess, railAccess: parcel.railAccess,
      purchaseHistory: parcel.purchaseHistory.map((transaction) => ({ ...transaction, date: { ...transaction.date } })),
      historicalEvents: parcel.historicalEvents.map((event) => ({ ...event, date: { ...event.date } })),
      valuation: valuation ? {
        year: valuationResult!.year,
        calibrationId: valuationResult!.calibrationId,
        landValuePpu: valuation.landValuePpu,
        relativeScore: valuation.relativeScore,
        factors: valuation.factors,
        references: valuationResult!.references,
        notes: CAMPAIGN_PARCEL_VALUATION_PROFILE.notes,
        weights: CAMPAIGN_PARCEL_VALUATION_PROFILE.weights,
      } : null,
      nominalValuation,
      clubViability,
      clubOccupancy,
    } : null,
    development: development ? {
      kind: development.kind,
      year: development.year,
      populationUnitsAdded: development.populationUnitsAdded,
      jobUnitsAdded: development.jobUnitsAdded,
    } : null,
    transformation: {
      buildings: buildings.map((item) => ({ ...item })),
      centrality: centrality ? { ...centrality } : null,
      avenue: avenue ? { roadId: avenue.roadId, upgradedYear: avenue.upgradedYear } : null,
    },
  };
}

/**
 * Power readout for a structure. A power plant is the source (always powered);
 * a water tower sits off the power grid (never powered); every other service
 * structure is a consumer reported by grid connectivity.
 */
function structurePowered(structure: Structure, power: PowerMap, map: GameMap): boolean {
  if (structure.type === 'power_plant') return true;
  if (structure.type === 'water_tower') return false;
  return isStructurePowered(structure, power, map);
}

/**
 * Water readout for a structure — mirror of {@link structurePowered}. A water
 * tower is the source; a power plant sits off the water grid; every other
 * service structure is reported by grid connectivity.
 */
function structureWatered(structure: Structure, water: WaterMap, map: GameMap): boolean {
  if (structure.type === 'water_tower') return true;
  if (structure.type === 'power_plant') return false;
  return isStructureWatered(structure, water, map);
}

/**
 * Building readout. Pulled out of the return-object ternary because `lot`
 * (lotBboxOf(building.footprint)) is shared by two fields (lotWidth,
 * maxDensity) but only exists inside the nullable `building` branch — a
 * helper avoids an IIFE or a hoisted `const lot` plus a non-null assertion.
 */
function buildingInfo(building: Building): TileBuildingInfo {
  const lot = lotBboxOf(building.footprint);
  return {
    type: building.type,
    level: building.level,
    density: building.density,
    age: building.age,
    abandoned: building.abandoned,
    capacity: buildingCapacity(building),
    lotWidth: lotWidthAlongFrontage(lot, building.frontage),
    maxDensity: maxDensityForLot(lot, building.frontage),
  };
}

/**
 * Snapshot the inspectable state of a single tile. Returns null for
 * out-of-bounds coordinates (no tile exists there).
 */
export function inspectTile(world: World, coord: TileCoord, economy?: HistoricalEconomy): TileInfo | null {
  const tile = world.getMap().getTile(coord.x, coord.y);
  if (tile === null) return null;

  // Drain the lazily-recomputed land-value cache so an edit made while paused
  // is reflected immediately instead of showing the pre-edit value.
  world.recomputeLandValueIfDirty();

  const map = world.getMap();
  const building = map.getBuildings().getBuildingAt(coord.x, coord.y);
  const structure = world.getStructureMap().getStructureAt(coord.x, coord.y);
  const power = world.getPowerMap();
  const water = world.getWaterMap();
  const svc = world.getServiceCoverageMap();
  const fire = world.getFireCoverageMap();
  const hospital = world.getHospitalCoverageMap();
  const school = world.getSchoolCoverageMap();

  // Report each utility at the entity level, not the raw cell, to match how the
  // simulation reasons about it:
  //  - A structure is a SOURCE for exactly one utility (a power plant for power, a
  //    water tower for water): show its source utility active and the OTHER inactive
  //    (it does not sit on that network). Every OTHER structure (police, fire, hospital,
  //    school, park) reports grid CONNECTIVITY: powered/watered iff orthogonally adjacent
  //    to a powered/watered ROAD — requiring a road (not just any powered cell) avoids the
  //    1-tile grass-halo false positive — so a station wired next to a powered road reads
  //    "Powered", not "No Power". (Services don't strictly consume power in the sim today;
  //    this readout is informational. Parks report connectivity the same way.)
  //  - A building counts as served if ANY footprint cell is (isBuildingPowered /
  //    isBuildingWatered) — the predicate growth uses; per-cell would falsely show
  //    interior tiles as unserved even though the building is served.
  //  - A bare tile reports its own cell.
  const powered = structure
    ? structurePowered(structure, power, map)
    : building
      ? isBuildingPowered(building, power)
      : power.isPowered(coord.x, coord.y);
  const watered = structure
    ? structureWatered(structure, water, map)
    : building
      ? isBuildingWatered(building, water)
      : water.isWatered(coord.x, coord.y);

  // GRADED readouts — land value, its congestion penalty, and the four service coverages —
  // resolve at the building ANCHOR. World.tick states the split this mirrors: "Graded fields
  // (land value, coverage) gate at the ANCHOR; binary fields (power, water) scan the
  // FOOTPRINT." Power and water above are that binary half and correctly scan the footprint.
  // Reporting a graded field at the clicked cell would show a threshold as cleared that the
  // deciding cell has not — these fields step across a lot at a park or coverage edge — so a
  // player would read an open gate and wait for growth that cannot fire.
  const gradedCoord = building ? building.anchor : coord;

  // Police coverage: a police_station tile is the source — its footprint cells
  // are excluded from the coverage sweep, so we report coverage 0/false for it
  // (matching the power_plant/water_tower source exclusion pattern). All other
  // tiles read the raw cell value and apply the same raw threshold as the gate.
  const isServiceSource = structure !== null && structure.type === 'police_station';
  const coverageRaw = isServiceSource ? 0 : svc.getCoverage(gradedCoord.x, gradedCoord.y);
  const coverage = coverageRaw / 255;
  const serviceCovered = isServiceSource ? false : coverageRaw >= SERVICE_COVERAGE_THRESHOLD_RAW;

  // Fire coverage: a fire_station tile is the source — same source-exclusion
  // pattern as the police readout above.
  const isFireSource = structure !== null && structure.type === 'fire_station';
  const fireRaw = isFireSource ? 0 : fire.getCoverage(gradedCoord.x, gradedCoord.y);
  const fireCoverage = fireRaw / 255;
  const fireServiceCovered = isFireSource ? false : fireRaw >= SERVICE_COVERAGE_THRESHOLD_RAW;

  // Hospital coverage: a hospital tile is the source — same source-exclusion
  // pattern as the police/fire readout above.
  const isHospitalSource = structure !== null && structure.type === 'hospital';
  const hospitalRaw = isHospitalSource ? 0 : hospital.getCoverage(gradedCoord.x, gradedCoord.y);
  const hospitalCoverage = hospitalRaw / 255;
  const hospitalServiceCovered = isHospitalSource ? false : hospitalRaw >= SERVICE_COVERAGE_THRESHOLD_RAW;

  // School coverage: a school tile is the source — same source-exclusion
  // pattern as the police/fire/hospital readout above.
  const isSchoolSource = structure !== null && structure.type === 'school';
  const schoolRaw = isSchoolSource ? 0 : school.getCoverage(gradedCoord.x, gradedCoord.y);
  const schoolCoverage = schoolRaw / 255;
  const schoolServiceCovered = isSchoolSource ? false : schoolRaw >= SERVICE_COVERAGE_THRESHOLD_RAW;

  return {
    x: coord.x,
    y: coord.y,
    type: tile.type,
    level: tile.level,
    powered,
    watered,
    coverage,
    serviceCovered,
    isServiceSource,
    fireCoverage,
    fireServiceCovered,
    isFireSource,
    hospitalCoverage,
    hospitalServiceCovered,
    isHospitalSource,
    schoolCoverage,
    schoolServiceCovered,
    isSchoolSource,
    landValue: world.getLandValue().getValue(gradedCoord.x, gradedCoord.y),
    congestionPenalty: world.getLandValue().getCongestionPenalty(gradedCoord.x, gradedCoord.y),
    building: building ? buildingInfo(building) : null,
    structure: structure ? { type: structure.type } : null,
    city: campaignCityTileInfo(world, coord, economy),
  };
}
