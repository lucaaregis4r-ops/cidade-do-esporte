export const DECISION_LOG_VERSION = 1 as const;

export const DECISION_TOOLS = [
  'road', 'zone_residential', 'zone_commercial', 'zone_industrial', 'bulldoze',
  'power_plant', 'water_tower', 'police_station', 'fire_station', 'hospital',
  'school', 'park', 'terrain_up', 'terrain_down', 'terrain_level',
] as const;

export type DecisionTool = typeof DECISION_TOOLS[number];
export type DecisionKind = 'click' | 'drag';
export interface DecisionPoint { x: number; y: number }
export interface CampaignDecision {
  day: number;
  kind: DecisionKind;
  tool: DecisionTool;
  start: DecisionPoint;
  end: DecisionPoint;
}
export interface DecisionLogState {
  version: typeof DECISION_LOG_VERSION;
  completeFromStart: boolean;
  entries: CampaignDecision[];
}
export interface ReplayPackage {
  version: 1;
  worldSeed: string;
  decisions: DecisionLogState;
}

const TOOL_SET = new Set<string>(DECISION_TOOLS);
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function validPoint(value: unknown): value is DecisionPoint {
  return isRecord(value) && Number.isSafeInteger(value.x) && Number.isSafeInteger(value.y);
}

export class DecisionLog {
  private entries: CampaignDecision[] = [];
  constructor(private readonly completeFromStart = true) {}

  append(decision: CampaignDecision): boolean {
    if (!DecisionLog.validateEntry(decision)) return false;
    const previous = this.entries.at(-1);
    if (previous && decision.day < previous.day) return false;
    this.entries.push({
      ...decision,
      start: { ...decision.start },
      end: { ...decision.end },
    });
    return true;
  }

  clear(): void {
    this.entries = [];
  }

  snapshot(): DecisionLogState {
    return {
      version: DECISION_LOG_VERSION,
      completeFromStart: this.completeFromStart,
      entries: this.entries.map((entry) => ({
        ...entry,
        start: { ...entry.start },
        end: { ...entry.end },
      })),
    };
  }

  static fromSnapshot(value: unknown): DecisionLog | null {
    if (!isRecord(value) || value.version !== DECISION_LOG_VERSION ||
        typeof value.completeFromStart !== 'boolean' || !Array.isArray(value.entries)) return null;
    const log = new DecisionLog(value.completeFromStart);
    for (const entry of value.entries) {
      if (!DecisionLog.validateEntry(entry) || !log.append(entry)) return null;
    }
    return log;
  }

  private static validateEntry(value: unknown): value is CampaignDecision {
    return isRecord(value) &&
      Number.isSafeInteger(value.day) && (value.day as number) >= 0 &&
      (value.kind === 'click' || value.kind === 'drag') &&
      typeof value.tool === 'string' && TOOL_SET.has(value.tool) &&
      validPoint(value.start) && validPoint(value.end) &&
      (value.kind !== 'click' ||
        ((value.start as DecisionPoint).x === (value.end as DecisionPoint).x &&
          (value.start as DecisionPoint).y === (value.end as DecisionPoint).y));
  }
}

export function encodeReplayPackage(worldSeed: string, decisions: DecisionLogState): string | null {
  if (typeof worldSeed !== 'string' || worldSeed.length === 0 ||
      !decisions.completeFromStart || !DecisionLog.fromSnapshot(decisions)) return null;
  return JSON.stringify({ version: 1, worldSeed, decisions } satisfies ReplayPackage);
}

export function decodeReplayPackage(value: string): ReplayPackage | null {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { return null; }
  if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.worldSeed !== 'string' || parsed.worldSeed.length === 0) return null;
  const decisions = DecisionLog.fromSnapshot(parsed.decisions);
  if (!decisions) return null;
  return { version: 1, worldSeed: parsed.worldSeed, decisions: decisions.snapshot() };
}
