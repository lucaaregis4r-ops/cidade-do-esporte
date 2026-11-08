/**
 * HistoricalLedger domain model (Alpha G: G9 / Macroetapa 33).
 * Governs the causal historical event ledger of the club and city (1910–1959).
 *
 * CANONICAL RULES:
 * - Deterministic: purely causal, zero unseeded randomness or uncontrolled PRNG.
 * - Bidirectional causal links: each event explicitly tracks its direct causes
 *   (`causes: string[]`) and consequences (`consequences: string[]`).
 * - Immutable: events once recorded cannot be silently mutated or dropped.
 */

import type { GameDate } from '../HistoricalClock';

export type HistoricalCategory =
  | 'FUNDACAO'
  | 'PRIMEIRO_JOGO'
  | 'TITULO'
  | 'ELEICAO'
  | 'OBRA'
  | 'CISMA'
  | 'TRIBUNAL'
  | 'DERBI_HISTORICO'
  | 'HOMENAGEM';

export interface HistoricalEvent {
  readonly id: string;
  readonly date: Readonly<GameDate>;
  readonly category: HistoricalCategory;
  readonly importance: number; // 1 to 100
  readonly title: string;
  readonly description: string;
  readonly people: readonly string[];
  readonly clubs: readonly string[];
  readonly facilities: readonly string[];
  readonly competitionId?: string;
  readonly causes: readonly string[];       // IDs of preceding cause events
  readonly consequences: readonly string[]; // IDs of resulting subsequent events
  readonly tags: readonly string[];
}

export interface HistoricalLedgerState {
  readonly events: readonly HistoricalEvent[];
}

/**
 * Validates a HistoricalEvent object defensivel.
 */
export function validateHistoricalEvent(obj: unknown): obj is HistoricalEvent {
  if (!obj || typeof obj !== 'object') return false;
  const ev = obj as Partial<HistoricalEvent>;
  const validCategories: HistoricalCategory[] = [
    'FUNDACAO',
    'PRIMEIRO_JOGO',
    'TITULO',
    'ELEICAO',
    'OBRA',
    'CISMA',
    'TRIBUNAL',
    'DERBI_HISTORICO',
    'HOMENAGEM',
  ];

  return (
    typeof ev.id === 'string' &&
    !!ev.date &&
    typeof ev.date.year === 'number' &&
    validCategories.includes(ev.category as HistoricalCategory) &&
    typeof ev.importance === 'number' &&
    typeof ev.title === 'string' &&
    typeof ev.description === 'string' &&
    Array.isArray(ev.people) &&
    Array.isArray(ev.clubs) &&
    Array.isArray(ev.facilities) &&
    Array.isArray(ev.causes) &&
    Array.isArray(ev.consequences) &&
    Array.isArray(ev.tags)
  );
}

/**
 * Creates an empty historical ledger state.
 */
export function createEmptyHistoricalLedger(): HistoricalLedgerState {
  return Object.freeze({
    events: Object.freeze([]),
  });
}

/**
 * Records a new historical event, bidirectionally linking it as a consequence
 * of all designated cause events.
 */
export function recordHistoricalEvent(
  ledger: Readonly<HistoricalLedgerState>,
  input: {
    readonly id: string;
    readonly date: Readonly<GameDate>;
    readonly category: HistoricalCategory;
    readonly importance: number;
    readonly title: string;
    readonly description: string;
    readonly people?: readonly string[];
    readonly clubs?: readonly string[];
    readonly facilities?: readonly string[];
    readonly competitionId?: string;
    readonly causes?: readonly string[];
    readonly tags?: readonly string[];
  }
): HistoricalLedgerState {
  if (ledger.events.some((e) => e.id === input.id)) {
    return ledger; // Prevent duplicate IDs
  }

  const causeIds = input.causes ? Object.freeze([...input.causes]) : Object.freeze([]);
  const people = input.people ? Object.freeze([...input.people]) : Object.freeze([]);
  const clubs = input.clubs ? Object.freeze([...input.clubs]) : Object.freeze([]);
  const facilities = input.facilities ? Object.freeze([...input.facilities]) : Object.freeze([]);
  const tags = input.tags ? Object.freeze([...input.tags]) : Object.freeze([]);

  const newEvent: HistoricalEvent = Object.freeze({
    id: input.id,
    date: input.date,
    category: input.category,
    importance: Math.max(1, Math.min(100, input.importance)),
    title: input.title,
    description: input.description,
    people,
    clubs,
    facilities,
    competitionId: input.competitionId,
    causes: causeIds,
    consequences: Object.freeze([]),
    tags,
  });

  // Update cause events so that newEvent.id is added to their consequences
  const updatedEvents = ledger.events.map((existing) => {
    if (causeIds.includes(existing.id)) {
      if (existing.consequences.includes(newEvent.id)) return existing;
      return Object.freeze({
        ...existing,
        consequences: Object.freeze([...existing.consequences, newEvent.id]),
      });
    }
    return existing;
  });

  return Object.freeze({
    events: Object.freeze([...updatedEvents, newEvent]),
  });
}

/**
 * Retrieves the full causal chain for a specific event (all its recursive causes and consequences).
 */
export function getCausalChain(
  ledger: Readonly<HistoricalLedgerState>,
  targetEventId: string
): {
  readonly rootCauses: readonly HistoricalEvent[];
  readonly targetEvent?: HistoricalEvent;
  readonly downstreamConsequences: readonly HistoricalEvent[];
} {
  const eventsMap = new Map<string, HistoricalEvent>(ledger.events.map((e) => [e.id, e]));
  const target = eventsMap.get(targetEventId);
  if (!target) {
    return {
      rootCauses: Object.freeze([]),
      downstreamConsequences: Object.freeze([]),
    };
  }

  // Traverse causes upward
  const causesVisited = new Set<string>();
  const collectCauses = (id: string) => {
    const ev = eventsMap.get(id);
    if (!ev) return;
    for (const cId of ev.causes) {
      if (!causesVisited.has(cId)) {
        causesVisited.add(cId);
        collectCauses(cId);
      }
    }
  };
  collectCauses(targetEventId);

  // Traverse consequences downward
  const consequencesVisited = new Set<string>();
  const collectConsequences = (id: string) => {
    const ev = eventsMap.get(id);
    if (!ev) return;
    for (const cqId of ev.consequences) {
      if (!consequencesVisited.has(cqId)) {
        consequencesVisited.add(cqId);
        collectConsequences(cqId);
      }
    }
  };
  collectConsequences(targetEventId);

  const rootCauses = Array.from(causesVisited)
    .map((id) => eventsMap.get(id)!)
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.date.year - b.date.year ||
        a.date.month - b.date.month ||
        a.date.day - b.date.day
    );

  const downstreamConsequences = Array.from(consequencesVisited)
    .map((id) => eventsMap.get(id)!)
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.date.year - b.date.year ||
        a.date.month - b.date.month ||
        a.date.day - b.date.day
    );

  return {
    rootCauses: Object.freeze(rootCauses),
    targetEvent: target,
    downstreamConsequences: Object.freeze(downstreamConsequences),
  };
}

/**
 * Filters ledger events by decade (e.g. 1910s, 1920s, 1930s, 1940s, 1950s).
 */
export function getEventsByDecade(
  ledger: Readonly<HistoricalLedgerState>,
  decadeStartYear: number
): readonly HistoricalEvent[] {
  const decadeEnd = decadeStartYear + 9;
  return Object.freeze(
    ledger.events
      .filter((e) => e.date.year >= decadeStartYear && e.date.year <= decadeEnd)
      .sort((a, b) => a.date.year - b.date.year || a.date.month - b.date.month || a.date.day - b.date.day)
  );
}
