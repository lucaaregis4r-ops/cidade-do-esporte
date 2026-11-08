import { describe, expect, it } from 'vitest';
import {
  evaluatePerformanceBudget,
  getBaselineTelemetry,
  PERFORMANCE_BUDGETS,
  type PerformanceTelemetrySnapshot,
} from './PerformanceBudget';

describe('PerformanceBudget', () => {
  it('defines valid budget specifications for layers L0, L1, L2', () => {
    expect(PERFORMANCE_BUDGETS.L0.maxDurationMsPerCall).toBe(4.5);
    expect(PERFORMANCE_BUDGETS.L1.maxDurationMsPerCall).toBe(1.5);
    expect(PERFORMANCE_BUDGETS.L2.maxDurationMsPerCall).toBe(8.0);
  });

  it('approves baseline telemetry within all budgets', () => {
    const baseline = getBaselineTelemetry();
    const evaluation = evaluatePerformanceBudget(baseline);
    expect(evaluation.allPassed).toBe(true);
    expect(evaluation.l0Passed).toBe(true);
    expect(evaluation.l1Passed).toBe(true);
    expect(evaluation.l2Passed).toBe(true);
    expect(evaluation.fpsPassed).toBe(true);
    expect(evaluation.memoryPassed).toBe(true);
    expect(evaluation.details).toHaveLength(0);
  });

  it('detects violations when layer budgets or FPS thresholds are exceeded', () => {
    const failingSnapshot: PerformanceTelemetrySnapshot = {
      timestampMs: Date.now(),
      fps: 15, // Below 28
      l0AverageMs: 12.0, // Above 4.5
      l1AverageMs: 0.5,
      l2AverageMs: 25.0, // Above 8.0
      memoryHeapMb: 512, // Above 256
      totalCampaignElapsedSec: 45,
    };

    const evaluation = evaluatePerformanceBudget(failingSnapshot);
    expect(evaluation.allPassed).toBe(false);
    expect(evaluation.l0Passed).toBe(false);
    expect(evaluation.l1Passed).toBe(true);
    expect(evaluation.l2Passed).toBe(false);
    expect(evaluation.fpsPassed).toBe(false);
    expect(evaluation.memoryPassed).toBe(false);
    expect(evaluation.details.length).toBeGreaterThanOrEqual(4);
  });
});
