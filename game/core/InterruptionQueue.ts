import { daysInMonth } from './HistoricalClock';
import type { GameDate } from './HistoricalClock';

export const INTERRUPTION_KINDS = [
  'election',
  'proposal',
  'final',
  'crisis',
  'construction',
  'important_transfer',
  'incident',
  'rival_foundation',
] as const;

export type InterruptionKind = typeof INTERRUPTION_KINDS[number];

export interface Interruption {
  readonly id: string;
  readonly kind: InterruptionKind;
  readonly date: GameDate;
  readonly title: string;
  readonly description: string;
}

export interface InterruptionInput {
  id: string;
  kind: InterruptionKind;
  date: GameDate;
  title: string;
  description?: string;
}

export type AutoPauseConfig = Readonly<Record<InterruptionKind, boolean>>;

export const DEFAULT_AUTO_PAUSE_CONFIG: AutoPauseConfig = Object.freeze({
  election: true,
  proposal: true,
  final: true,
  crisis: true,
  construction: true,
  important_transfer: true,
  incident: true,
  rival_foundation: true,
});

interface QueueEntry {
  interruption: Interruption;
  autoPauseHandled: boolean;
}

export interface InterruptionQueueState {
  version: 1;
  entries: { interruption: Interruption; autoPauseHandled: boolean }[];
  autoPauseConfig: AutoPauseConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidDate(date: GameDate): boolean {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) return false;
  if (date.month < 1 || date.month > 12 || date.day < 1) return false;
  return date.day <= daysInMonth(date.year, date.month);
}

/**
 * Deterministic FIFO for decision-worthy campaign events.
 *
 * The queue owns no wall-clock state and performs no persistence. An eligible
 * interruption is claimed for auto-pause at most once, so resuming the game
 * cannot immediately pause again on the same unacknowledged item.
 */
export class InterruptionQueue {
  private entries: QueueEntry[] = [];
  private ids = new Set<string>();
  private autoPauseConfig: Record<InterruptionKind, boolean> = { ...DEFAULT_AUTO_PAUSE_CONFIG };

  snapshot(): InterruptionQueueState {
    return {
      version: 1,
      entries: this.entries.map(({ interruption, autoPauseHandled }) => ({
        interruption: { ...interruption, date: { ...interruption.date } },
        autoPauseHandled,
      })),
      autoPauseConfig: { ...this.autoPauseConfig },
    };
  }

  /** Validate into a new queue, never partially changing a live queue. */
  static fromSnapshot(value: unknown): InterruptionQueue | null {
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.entries) || !isRecord(value.autoPauseConfig)) return null;
    const queue = new InterruptionQueue();
    for (const kind of INTERRUPTION_KINDS) {
      const enabled = value.autoPauseConfig[kind];
      if (typeof enabled !== 'boolean') return null;
      queue.setAutoPause(kind, enabled);
    }
    for (const entry of value.entries) {
      if (!isRecord(entry) || !isRecord(entry.interruption) || typeof entry.autoPauseHandled !== 'boolean') return null;
      const item = entry.interruption;
      if (typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.kind !== 'string' || !isRecord(item.date)) return null;
      const date = item.date as unknown as GameDate;
      if (!isValidDate(date) || date.year < 1910 || date.year > 1959) return null;
      if (!queue.enqueue({ id: item.id, title: item.title, description: item.description, kind: item.kind as InterruptionKind, date })) return null;
      queue.entries[queue.entries.length - 1].autoPauseHandled = entry.autoPauseHandled;
    }
    return queue;
  }

  enqueue(input: InterruptionInput): boolean {
    if (this.ids.has(input.id)) return false;
    if (!input.id.trim() || !input.title.trim() || !isValidDate(input.date)) return false;
    if (!(INTERRUPTION_KINDS as readonly string[]).includes(input.kind)) return false;

    const interruption: Interruption = Object.freeze({
      id: input.id,
      kind: input.kind,
      date: Object.freeze({ ...input.date }),
      title: input.title,
      description: input.description ?? '',
    });
    this.entries.push({ interruption, autoPauseHandled: false });
    this.ids.add(input.id);
    return true;
  }

  peek(): Interruption | null {
    return this.entries[0]?.interruption ?? null;
  }

  dequeue(): Interruption | null {
    const entry = this.entries.shift();
    if (!entry) return null;
    this.ids.delete(entry.interruption.id);
    return entry.interruption;
  }

  /** A displayed auto-pause item may follow older disabled items in the FIFO. */
  acknowledge(id: string): Interruption | null {
    const index = this.entries.findIndex((entry) => entry.interruption.id === id);
    if (index < 0) return null;
    const [entry] = this.entries.splice(index, 1);
    this.ids.delete(id);
    return entry.interruption;
  }

  getAll(): ReadonlyArray<Interruption> {
    return this.entries.map((entry) => entry.interruption);
  }

  get size(): number {
    return this.entries.length;
  }

  setAutoPause(kind: InterruptionKind, enabled: boolean): boolean {
    if (!(INTERRUPTION_KINDS as readonly string[]).includes(kind) || typeof enabled !== 'boolean') return false;
    this.autoPauseConfig[kind] = enabled;
    return true;
  }

  getAutoPauseConfig(): AutoPauseConfig {
    return Object.freeze({ ...this.autoPauseConfig });
  }

  /** Returns and marks the first eligible queued interruption, if any. */
  claimAutoPause(): Interruption | null {
    const entry = this.entries.find(
      (candidate) => !candidate.autoPauseHandled && this.autoPauseConfig[candidate.interruption.kind],
    );
    if (!entry) return null;
    entry.autoPauseHandled = true;
    return entry.interruption;
  }

  clear(): void {
    this.entries = [];
    this.ids.clear();
  }
}
