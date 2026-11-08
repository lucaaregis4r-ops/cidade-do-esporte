import type { CityGrowthCalibration } from './cityGrowth';
import type { LandValueCalibration } from './cityLandValue';
import type { CityTransformationCalibration } from './cityTransformation';

/**
 * Visible-playtest assumptions for B14. These values are design controls, not
 * historical data; the HUD labels them accordingly until Macroetapa 41 research.
 */
export const CAMPAIGN_LAND_VALUE_PROFILE: LandValueCalibration = Object.freeze({
  id: 'b14-visible-playtest-land-value-v1',
  baseLandValuePpuPerTile: 1,
  minimumMultiplier: 1,
  maximumMultiplier: 1,
  weights: Object.freeze({
    centrality: 0.15,
    accessibility: 0.15,
    railAccess: 0.15,
    roadAccess: 0.15,
    commerceAccess: 0.1,
    industryAccess: 0.1,
    terrainQuality: 0.1,
    neighborhoodPopulation: 0.1,
  }),
  references: Object.freeze([{
    id: 'b14-playtest-hypothesis',
    source: 'Internal design hypothesis for observable campaign growth',
    notes: 'Uniform relative baseline keeps B14 growth deterministic and inspectable. It is not a land-price estimate and must be replaced or reviewed with Macroetapa 41 research.',
  }]),
  notes: 'Temporary neutral valuation for visible playtesting only; no historical PPU claim.',
});

export const CAMPAIGN_GROWTH_PROFILE: CityGrowthCalibration = Object.freeze({
  id: 'b14-visible-playtest-growth-v1',
  weights: Object.freeze({
    accessibility: 0.3,
    availableJobs: 0.2,
    nearbyPopulation: 0.2,
    infrastructure: 0.2,
    commercialActivity: 0.1,
    landDemand: 0.2,
    landCost: 0.1,
    terrainDifficulty: 0.1,
    congestion: 0.1,
  }),
  railwayInfluence: Object.freeze({ 'railway-centered': 0.8, 'road-expansion': 0.3 }),
  minimumPressure: -900,
  maximumDevelopmentsPerYear: 2,
  populationUnitsPerDevelopment: 1,
  jobUnitsPerDevelopment: 1,
  references: Object.freeze([{
    id: 'b14-playtest-hypothesis',
    source: 'Internal design hypothesis for observable campaign growth',
    notes: 'At most two abstract parcel occupations per campaign year, with one population and one employment unit each. These are pacing values, not historical rates; Macroetapa 41 must research or revise them.',
  }]),
  notes: 'Temporary pacing profile to make annual growth visible in the main campaign; not historically calibrated.',
});

/** Temporary, explicit pacing assumptions for observing urban change in a campaign. */
export const CAMPAIGN_TRANSFORMATION_PROFILE: CityTransformationCalibration = Object.freeze({
  id: 'b15-visible-playtest-transformation-v2',
  annualConditionLoss: 15,
  demolitionConditionThreshold: 25,
  redevelopmentAttractivenessThreshold: 50,
  densityIncreasePerRedevelopment: 1,
  maximumDensityUnits: 5,
  centralityThreshold: 40,
  avenueActivityThreshold: 1,
  references: Object.freeze([{
    id: 'b15-playtest-hypothesis',
    source: 'Internal design hypothesis for observable campaign transformation',
    notes: 'Condition loss, redevelopment, density, centrality and avenue thresholds are pacing controls for playtesting, not measured historical rates. Review them with historical research in Macroetapa 41.',
  }]),
  notes: 'Temporary deterministic pacing profile for B15; it makes ageing and redevelopment legible without claiming historical calibration.',
});
