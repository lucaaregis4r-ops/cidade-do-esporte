import { World } from '../core/World';
import { MAX_CAMPAIGN_ELAPSED_DAYS } from '../core/HistoricalClock';
import { decodeReplayPackage } from '../core/DecisionLog';
import type { CampaignDecision, ReplayPackage } from '../core/DecisionLog';
import { serializeWorld } from '../core/mapSerialization';
import { Tool } from '../tools/Tool';
import { executeClick, executeDrag } from './CommandDispatcher';

export interface HeadlessCampaignResult {
  finalDate: { year: number; month: number; day: number };
  elapsedDays: number;
  decisionsApplied: number;
  finalState: string;
  digest: string;
}

function digest(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function applyDecision(world: World, decision: CampaignDecision): boolean {
  const tool = decision.tool as Tool;
  const result = decision.kind === 'click'
    ? executeClick(tool, decision.start, world)
    : executeDrag(tool, decision.start, decision.end, world);
  return result.changedTiles.length > 0;
}

export function runHeadlessCampaign(
  input: string | ReplayPackage,
  dimensions: { width: number; height: number } = { width: 64, height: 64 },
): HeadlessCampaignResult | null {
  const replay = typeof input === 'string' ? decodeReplayPackage(input) : decodeReplayPackage(JSON.stringify(input));
  if (!replay || !Number.isInteger(dimensions.width) || !Number.isInteger(dimensions.height) ||
      dimensions.width <= 0 || dimensions.height <= 0) return null;
  const entries = replay.decisions.entries;
  if (entries.some((entry) => entry.day > MAX_CAMPAIGN_ELAPSED_DAYS)) return null;

  const world = new World(dimensions.width, dimensions.height, { worldSeed: replay.worldSeed });
  let decisionsApplied = 0;
  let cursor = 0;
  while (!world.isCampaignComplete()) {
    while (entries[cursor]?.day === world.getElapsedDays()) {
      if (!applyDecision(world, entries[cursor])) return null;
      decisionsApplied++;
      cursor++;
    }
    world.tick();
  }
  while (entries[cursor]?.day === world.getElapsedDays()) {
    if (!applyDecision(world, entries[cursor])) return null;
    decisionsApplied++;
    cursor++;
  }
  if (cursor !== entries.length) return null;
  const finalState = serializeWorld(world);
  return {
    finalDate: world.getDate(),
    elapsedDays: world.getElapsedDays(),
    decisionsApplied,
    finalState,
    digest: digest(finalState),
  };
}
