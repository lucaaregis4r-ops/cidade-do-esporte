import type { LandValueCalibration } from './cityLandValue';

/**
 * Explicit B17 design hypothesis for displaying comparative 1910 parcel values.
 * It is not a historical price series and is never fed into city growth.
 */
export const CAMPAIGN_PARCEL_VALUATION_PROFILE: LandValueCalibration = Object.freeze({
  id: 'b17-visible-parcel-valuation-v1',
  baseLandValuePpuPerTile: 1,
  minimumMultiplier: 0.75,
  maximumMultiplier: 1.25,
  weights: Object.freeze({
    centrality: 0.2,
    accessibility: 0.18,
    railAccess: 0.12,
    roadAccess: 0.12,
    commerceAccess: 0.12,
    industryAccess: 0.1,
    terrainQuality: 0.1,
    neighborhoodPopulation: 0.06,
  }),
  references: Object.freeze([{
    id: 'b17-design-hypothesis',
    source: 'Internal design hypothesis for visible parcel comparison',
    notes: 'Weights and a normalized base of 1 PPU per tile are chosen only to expose how parcel factors affect the 1910 comparison. They are not observed or calibrated historical prices; Macroetapa 41 research must replace or revise them.',
  }]),
  notes: 'Comparative 1910 design estimate only. The score, weights, and normalized PPU base are hypotheses; no nominal currency or present-year price is implied.',
});
