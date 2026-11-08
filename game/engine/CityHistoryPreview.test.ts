import { describe, expect, it } from 'vitest';
import { buildCityHistoryPreview } from './CityHistoryPreview';

describe('buildCityHistoryPreview', () => {
  it('produces the six reproducible review snapshots without mutating a campaign save', () => {
    const first = buildCityHistoryPreview();
    const second = buildCityHistoryPreview();

    expect(first.scenarioLabel).toBe('synthetic-review-scenario');
    expect(first.warning).toMatch(/não são dados históricos calibrados/);
    expect(first.snapshots.map(({ year }) => year)).toEqual([1910, 1920, 1930, 1940, 1950, 1959]);
    expect(first.snapshots[0].metrics.developedParcels).toBe(0);
    expect(first.snapshots.at(-1)!.metrics.developedParcels).toBeGreaterThan(0);
    expect(first.snapshots.at(-1)!.metrics.activeBuildings).toBeGreaterThan(0);
    expect(first.snapshots.at(-1)!.roads.length).toBeGreaterThan(first.snapshots[0].roads.length);
    expect(first.snapshots.at(-1)!.metrics.landValuePpu).toBeNull();
    expect(first.serializedSnapshots).toBe(second.serializedSnapshots);
    expect(JSON.parse(first.serializedSnapshots).snapshots).toHaveLength(6);
  });

  it('supports an explicit seed for deterministic comparisons', () => {
    const first = buildCityHistoryPreview('CM-1910-REVIEW-ALT');
    const second = buildCityHistoryPreview('CM-1910-REVIEW-ALT');
    expect(first.worldSeed).toBe('CM-1910-REVIEW-ALT');
    expect(first.serializedSnapshots).toBe(second.serializedSnapshots);
  });
});
