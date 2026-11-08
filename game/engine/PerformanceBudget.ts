/**
 * PerformanceBudget: Telemetry and Scale Budgets for Layers L0, L1, L2
 *
 * Implements Master Plan Section 10 (Alpha I: Package I2 & I5).
 * Enforces execution time and memory limits across the three simulation tiers:
 * - L0: Urban & Geographic Autonomous Layer (monthly cadence)
 * - L1: Club, Institutional, Financial & Calendar Layer (daily/weekly cadence)
 * - L2: 2-3-5 Football Match Engine & Tactical Resolution (match event cadence)
 */

export interface LayerBudgetSpec {
  readonly layer: 'L0' | 'L1' | 'L2';
  readonly name: string;
  readonly targetFrequency: string;
  readonly maxDurationMsPerCall: number;
  readonly description: string;
}

export const PERFORMANCE_BUDGETS: Readonly<Record<'L0' | 'L1' | 'L2', LayerBudgetSpec>> = Object.freeze({
  L0: {
    layer: 'L0',
    name: 'Cidade Autônoma & Geografia',
    targetFrequency: 'Mensal / Anual',
    maxDurationMsPerCall: 4.5,
    description: 'Crescimento urbano, expansão de parcelas e adensamento demográfico.',
  },
  L1: {
    layer: 'L1',
    name: 'Institucional, Sócios & Finanças',
    targetFrequency: 'Diária / Semanal',
    maxDurationMsPerCall: 1.5,
    description: 'Arrecadação de mensalidades, manutenção da sede, eleições e ranking de lendas.',
  },
  L2: {
    layer: 'L2',
    name: 'Motor Tático 2-3-5 & Súmula',
    targetFrequency: 'Por Prélio / Jogo',
    maxDurationMsPerCall: 8.0,
    description: 'Resolução tática das 11 posições sem overall, gols, súmula e crônica esportiva.',
  },
});

export interface PerformanceTelemetrySnapshot {
  readonly timestampMs: number;
  readonly fps: number;
  readonly l0AverageMs: number;
  readonly l1AverageMs: number;
  readonly l2AverageMs: number;
  readonly memoryHeapMb: number;
  readonly totalCampaignElapsedSec: number;
}

export interface BudgetEvaluationResult {
  readonly allPassed: boolean;
  readonly l0Passed: boolean;
  readonly l1Passed: boolean;
  readonly l2Passed: boolean;
  readonly fpsPassed: boolean;
  readonly memoryPassed: boolean;
  readonly details: readonly string[];
}

/** Evaluates whether the current performance snapshot meets canonical budgets */
export function evaluatePerformanceBudget(snapshot: PerformanceTelemetrySnapshot): BudgetEvaluationResult {
  const details: string[] = [];
  const l0Passed = snapshot.l0AverageMs <= PERFORMANCE_BUDGETS.L0.maxDurationMsPerCall;
  const l1Passed = snapshot.l1AverageMs <= PERFORMANCE_BUDGETS.L1.maxDurationMsPerCall;
  const l2Passed = snapshot.l2AverageMs <= PERFORMANCE_BUDGETS.L2.maxDurationMsPerCall;
  const fpsPassed = snapshot.fps >= 28; // Tolerant 30fps baseline for retro canvas
  const memoryPassed = snapshot.memoryHeapMb <= 256; // 256MB budget

  if (!l0Passed) {
    details.push(`L0 excede orçamento: ${snapshot.l0AverageMs.toFixed(2)}ms > ${PERFORMANCE_BUDGETS.L0.maxDurationMsPerCall}ms`);
  }
  if (!l1Passed) {
    details.push(`L1 excede orçamento: ${snapshot.l1AverageMs.toFixed(2)}ms > ${PERFORMANCE_BUDGETS.L1.maxDurationMsPerCall}ms`);
  }
  if (!l2Passed) {
    details.push(`L2 excede orçamento: ${snapshot.l2AverageMs.toFixed(2)}ms > ${PERFORMANCE_BUDGETS.L2.maxDurationMsPerCall}ms`);
  }
  if (!fpsPassed) {
    details.push(`Taxa de quadros abaixo de 30 FPS: ${snapshot.fps} FPS`);
  }
  if (!memoryPassed) {
    details.push(`Uso de heap excede 256 MB: ${snapshot.memoryHeapMb} MB`);
  }

  const allPassed = l0Passed && l1Passed && l2Passed && fpsPassed && memoryPassed;

  return Object.freeze({
    allPassed,
    l0Passed,
    l1Passed,
    l2Passed,
    fpsPassed,
    memoryPassed,
    details: Object.freeze(details),
  });
}

/** Provides simulated or measured baseline telemetry for retro arcade display */
export function getBaselineTelemetry(): PerformanceTelemetrySnapshot {
  return Object.freeze({
    timestampMs: Date.now(),
    fps: 60,
    l0AverageMs: 0.28,
    l1AverageMs: 0.35,
    l2AverageMs: 3.8,
    memoryHeapMb: 42,
    totalCampaignElapsedSec: 22.4,
  });
}
