import { CampaignRng, DEFAULT_WORLD_SEED } from './CampaignRng';
import type { CampaignRngState } from './CampaignRng';
import { HistoricalClock } from './HistoricalClock';
import { InterruptionQueue } from './InterruptionQueue';
import type { InterruptionQueueState } from './InterruptionQueue';
import { DecisionLog } from './DecisionLog';
import type { DecisionLogState } from './DecisionLog';

export const WORLD_SAVE_VERSION = 25;

export interface CampaignSaveState {
  worldSeed: string;
  rng: CampaignRngState;
  clock: { version: 1; elapsedDays: number };
  interruptions: InterruptionQueueState;
  nextIds: { buildings: number; structures: number };
  decisions: DecisionLogState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nextLegacyId(entries: unknown): number {
  if (!Array.isArray(entries)) return 0;
  let next = 0;
  for (const entry of entries) {
    if (isRecord(entry) && typeof entry.id === 'number') next = Math.max(next, entry.id + 1);
  }
  return next;
}

/**
 * v19 never recorded campaign identity, RNG state or deleted entity ID counters.
 * Preserve its spatial data and elapsed-day count; initialize missing state explicitly.
 * The storage layer retains the original bytes and reports the migration to the user.
 */
export function migrateSaveEnvelope(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  if (value.v === WORLD_SAVE_VERSION) return value;
  if (value.v === 24) {
    if (!isRecord(value.campaign)) return null;
    return { ...value, v: WORLD_SAVE_VERSION, club: null };
  }
  if (value.v === 23) {
    if (!isRecord(value.campaign)) return null;
    return { ...value, v: WORLD_SAVE_VERSION, cityTransformation: null, transformationNeedsMigration: true, club: null };
  }
  if (value.v === 22) {
    if (!isRecord(value.campaign)) return null;
    return { ...value, v: WORLD_SAVE_VERSION, cityGrowth: null, cityTransformation: null, transformationNeedsMigration: true, club: null };
  }
  if (value.v === 21) {
    if (!isRecord(value.campaign)) return null;
    return { ...value, v: WORLD_SAVE_VERSION, city: null, cityGrowth: null, cityTransformation: null, transformationNeedsMigration: true, club: null };
  }
  if (value.v === 20) {
    if (!isRecord(value.campaign)) return null;
    return {
      ...value,
      v: WORLD_SAVE_VERSION,
      city: null,
      cityGrowth: null,
      cityTransformation: null,
      transformationNeedsMigration: true,
      club: null,
      campaign: { ...value.campaign, decisions: new DecisionLog(false).snapshot() },
    };
  }
  if (value.v !== 19) return null;
  return {
    ...value,
    v: WORLD_SAVE_VERSION,
    city: null,
    cityGrowth: null,
    cityTransformation: null,
    transformationNeedsMigration: true,
    club: null,
    campaign: {
      worldSeed: DEFAULT_WORLD_SEED,
      rng: new CampaignRng(DEFAULT_WORLD_SEED).snapshot(),
      clock: { version: 1, elapsedDays: value.d },
      interruptions: new InterruptionQueue().snapshot(),
      nextIds: { buildings: nextLegacyId(value.b), structures: nextLegacyId(value.s) },
      decisions: new DecisionLog(false).snapshot(),
    },
  };
}

/** Validate the whole campaign before any live World mutation. */
export function validateCampaignSave(value: unknown, elapsedDays: number): CampaignSaveState | null {
  if (!isRecord(value) || typeof value.worldSeed !== 'string' || value.worldSeed.length === 0) return null;
  if (!isRecord(value.clock) || value.clock.version !== 1 || value.clock.elapsedDays !== elapsedDays) return null;
  const clock = new HistoricalClock();
  if (!clock.setElapsedDays(elapsedDays)) return null;
  const rng = new CampaignRng(value.worldSeed);
  if (!rng.restore(value.rng as CampaignRngState)) return null;
  const queue = InterruptionQueue.fromSnapshot(value.interruptions);
  if (!queue) return null;
  const decisions = DecisionLog.fromSnapshot(value.decisions);
  if (!decisions || decisions.snapshot().entries.some((entry) => entry.day > elapsedDays)) return null;
  const date = clock.getDate();
  const dateKey = date.year * 10000 + date.month * 100 + date.day;
  if (queue.getAll().some((item) => item.date.year * 10000 + item.date.month * 100 + item.date.day > dateKey)) return null;
  if (!isRecord(value.nextIds)) return null;
  const { buildings, structures } = value.nextIds;
  if (![buildings, structures].every((id) => typeof id === 'number' && Number.isSafeInteger(id) && id >= 0 && id <= 0x7fffffff)) return null;
  return {
    worldSeed: value.worldSeed,
    rng: rng.snapshot(),
    clock: { version: 1, elapsedDays },
    interruptions: queue.snapshot(),
    nextIds: { buildings: buildings as number, structures: structures as number },
    decisions: decisions.snapshot(),
  };
}
