import { CampaignRng } from '../core/CampaignRng';
import { createCityState } from '../core/city/CityState';
import { generateCityDistricts1910 } from '../core/city/cityDistricts';
import { generateCityFoundation1910 } from '../core/city/cityFoundation';
import { advanceCityGrowthYear, createCityGrowthState, type CityGrowthCalibration } from '../core/city/cityGrowth';
import { generateCityLandValue1910, type LandValueCalibration } from '../core/city/cityLandValue';
import { generateCityParcels1910 } from '../core/city/cityParcels';
import { createCitySnapshot, CITY_SNAPSHOT_YEARS, serializeCitySnapshots, type CitySnapshot } from '../core/city/citySnapshots';
import { generateCityTerrain } from '../core/city/cityTerrain';
import { advanceCityTransformationYear, createCityTransformationState, type CityTransformationCalibration } from '../core/city/cityTransformation';

const PREVIEW_REFERENCES = Object.freeze([{
  id: 'illustrative-preview-model',
  source: 'Synthetic review scenario bundled with Cidade de Minas',
  notes: 'Illustrative design assumptions for visual review only; not historical data or production calibration.',
}]);

const LAND_CALIBRATION: LandValueCalibration = {
  id: 'review-preview-land-value',
  baseLandValuePpuPerTile: 10,
  minimumMultiplier: 0.5,
  maximumMultiplier: 2,
  weights: {
    centrality: 0.15, accessibility: 0.15, railAccess: 0.15, roadAccess: 0.15,
    commerceAccess: 0.1, industryAccess: 0.1, terrainQuality: 0.1, neighborhoodPopulation: 0.1,
  },
  references: PREVIEW_REFERENCES,
  notes: 'Synthetic visualization profile. The 1910 PPU values demonstrate the overlay mechanics only.',
};

const GROWTH_CALIBRATION: CityGrowthCalibration = {
  id: 'review-preview-city-growth',
  weights: {
    accessibility: 0.3, availableJobs: 0.2, nearbyPopulation: 0.2, infrastructure: 0.2,
    commercialActivity: 0.1, landDemand: 0.2, landCost: 0.1, terrainDifficulty: 0.1, congestion: 0.1,
  },
  railwayInfluence: { 'railway-centered': 0.8, 'road-expansion': 0.3 },
  minimumPressure: 30,
  maximumDevelopmentsPerYear: 3,
  populationUnitsPerDevelopment: 2,
  jobUnitsPerDevelopment: 1,
  references: PREVIEW_REFERENCES,
  notes: 'Synthetic visualization profile. Development rates and weights are not historical calibration.',
};

const TRANSFORMATION_CALIBRATION: CityTransformationCalibration = {
  id: 'review-preview-urban-transformation',
  annualConditionLoss: 2,
  demolitionConditionThreshold: 55,
  redevelopmentAttractivenessThreshold: 55,
  densityIncreasePerRedevelopment: 1,
  maximumDensityUnits: 3,
  centralityThreshold: 58,
  avenueActivityThreshold: 8,
  references: PREVIEW_REFERENCES,
  notes: 'Synthetic visualization profile. Building condition, redevelopment, density, center, and avenue thresholds are hypotheses, not measured history.',
};

export interface CityHistoryPreview {
  readonly worldSeed: string;
  readonly scenarioLabel: 'synthetic-review-scenario';
  readonly warning: string;
  readonly snapshots: readonly CitySnapshot[];
  readonly serializedSnapshots: string;
}

/** Builds a repeatable, visibly marked review scenario without changing the live campaign. */
export function buildCityHistoryPreview(worldSeed = 'CM-1910-REVIEW-DEMO'): CityHistoryPreview {
  const initialCity = createCityState(worldSeed, { year: 1910, month: 1, day: 1 });
  const rng = new CampaignRng(worldSeed);
  const terrain = generateCityTerrain(initialCity, rng, 24, 24);
  const foundation = generateCityFoundation1910(initialCity, terrain, rng);
  const districts = generateCityDistricts1910(initialCity, terrain, foundation, rng);
  const parcels = generateCityParcels1910(initialCity, terrain, districts, foundation);
  const landValue = generateCityLandValue1910(initialCity, parcels, districts, foundation, LAND_CALIBRATION);
  let growthState = createCityGrowthState(initialCity);
  let transformationState = createCityTransformationState(initialCity);
  const snapshots: CitySnapshot[] = [createCitySnapshot(
    initialCity, terrain, foundation, districts, parcels, landValue, growthState, transformationState,
  )];

  for (let year = 1911; year <= 1959; year++) {
    const city = createCityState(worldSeed, { year, month: 1, day: 1 });
    const growth = advanceCityGrowthYear(city, growthState, parcels, districts, foundation, landValue, GROWTH_CALIBRATION);
    growthState = growth.state;
    const transformation = advanceCityTransformationYear(
      city, transformationState, growth, parcels, foundation, TRANSFORMATION_CALIBRATION,
    );
    transformationState = transformation.state;
    if (CITY_SNAPSHOT_YEARS.includes(year as (typeof CITY_SNAPSHOT_YEARS)[number])) {
      snapshots.push(createCitySnapshot(
        city, terrain, foundation, districts, parcels, landValue, growthState, transformationState,
      ));
    }
  }

  return Object.freeze({
    worldSeed,
    scenarioLabel: 'synthetic-review-scenario',
    warning: 'Demonstração visual do modelo com parâmetros sintéticos. Cidade, população, valores e datas de transformação não são dados históricos calibrados nem estado de uma campanha salva.',
    snapshots: Object.freeze(snapshots),
    serializedSnapshots: serializeCitySnapshots(snapshots),
  });
}
