import { buildCityHistoryPreview } from './CityHistoryPreview';
import type { CitySnapshot } from '../core/city/citySnapshots';

export interface CityHistoryMetricBand {
  readonly minimum: number;
  readonly mean: number;
  readonly maximum: number;
}

export interface CityHistoryEnsembleYear {
  readonly year: CitySnapshot['year'];
  readonly metrics: Readonly<{
    populationUnits: CityHistoryMetricBand;
    employmentUnits: CityHistoryMetricBand;
    activeBuildings: CityHistoryMetricBand;
    developedParcels: CityHistoryMetricBand;
    averageCondition: CityHistoryMetricBand;
    centralities: CityHistoryMetricBand;
    avenues: CityHistoryMetricBand;
    baselineLandValuePpu: CityHistoryMetricBand | null;
  }>;
}

export interface CityHistoryEnsemble {
  readonly schemaVersion: 1;
  readonly scenarioLabel: 'synthetic-review-ensemble';
  readonly seedIds: readonly string[];
  readonly sampleCount: number;
  readonly years: readonly CityHistoryEnsembleYear[];
}

function compareSeeds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function metricBand(values: readonly number[]): CityHistoryMetricBand {
  const total = values.reduce((sum, value) => sum + value, 0);
  return Object.freeze({
    minimum: Math.min(...values),
    mean: Math.round((total / values.length) * 100) / 100,
    maximum: Math.max(...values),
  });
}

/** Runs the synthetic city model for a named seed set and summarizes six historical checkpoints. */
export function runCityHistoryEnsemble(seedIds: readonly string[]): CityHistoryEnsemble {
  if (!Array.isArray(seedIds) || seedIds.length < 2) {
    throw new RangeError('A city history ensemble requires at least two world seeds');
  }
  if (seedIds.some((seed) => typeof seed !== 'string' || seed.trim().length === 0)) {
    throw new TypeError('City history ensemble seeds must be non-empty strings');
  }

  const seeds = [...seedIds].sort(compareSeeds);
  if (seeds.some((seed, index) => index > 0 && seeds[index - 1] === seed)) {
    throw new TypeError('City history ensemble seeds must be unique');
  }

  const byYear = new Map<number, CitySnapshot[]>();
  for (const seed of seeds) {
    for (const snapshot of buildCityHistoryPreview(seed).snapshots) {
      const samples = byYear.get(snapshot.year) ?? [];
      samples.push(snapshot);
      byYear.set(snapshot.year, samples);
    }
  }

  const years = [...byYear.entries()].sort(([left], [right]) => left - right).map(([year, samples]) => {
    const collect = (read: (snapshot: CitySnapshot) => number) => metricBand(samples.map(read));
    const baseLandValues = samples.flatMap(({ metrics }) => metrics.landValuePpu === null ? [] : [metrics.landValuePpu]);
    return Object.freeze({
      year: year as CitySnapshot['year'],
      metrics: Object.freeze({
        populationUnits: collect(({ metrics }) => metrics.populationUnits),
        employmentUnits: collect(({ metrics }) => metrics.employmentUnits),
        activeBuildings: collect(({ metrics }) => metrics.activeBuildings),
        developedParcels: collect(({ metrics }) => metrics.developedParcels),
        averageCondition: collect(({ metrics }) => metrics.averageCondition),
        centralities: collect(({ metrics }) => metrics.centralities),
        avenues: collect(({ metrics }) => metrics.avenues),
        baselineLandValuePpu: baseLandValues.length === 0 ? null : metricBand(baseLandValues),
      }),
    });
  });

  return Object.freeze({
    schemaVersion: 1,
    scenarioLabel: 'synthetic-review-ensemble',
    seedIds: Object.freeze(seeds),
    sampleCount: seeds.length,
    years: Object.freeze(years),
  });
}

/** Stable JSON for review pages and downloadable headless experiment records. */
export function serializeCityHistoryEnsemble(ensemble: CityHistoryEnsemble): string {
  return JSON.stringify({ format: 'cidade-de-minas-city-history-ensemble', ...ensemble });
}
