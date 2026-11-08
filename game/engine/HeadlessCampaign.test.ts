import { describe, expect, it } from 'vitest';
import { DecisionLog, encodeReplayPackage } from '../core/DecisionLog';
import { MAX_CAMPAIGN_ELAPSED_DAYS } from '../core/HistoricalClock';
import { runHeadlessCampaign } from './HeadlessCampaign';

function emptyReplay(seed: string): string {
  return encodeReplayPackage(seed, new DecisionLog().snapshot())!;
}

describe('headless campaign 1910-1959', () => {
  it('runs two equivalent empty campaigns to byte-identical final state', () => {
    const replay = emptyReplay('A10-TWIN-RUN');
    const first = runHeadlessCampaign(replay, { width: 16, height: 16 });
    const second = runHeadlessCampaign(replay, { width: 16, height: 16 });
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(first?.elapsedDays).toBe(MAX_CAMPAIGN_ELAPSED_DAYS);
    expect(first?.finalDate).toEqual({ year: 1959, month: 12, day: 31 });
    expect(first?.decisionsApplied).toBe(0);
  }, 60_000);

  const itLong = process.env.CIMULITY_LONG_TESTS === '1' ? it : it.skip;
  itLong('repeats the full 64x64 application world byte-for-byte through 1959', () => {
    const replay = emptyReplay('A10-FULL-64');
    const first = runHeadlessCampaign(replay);
    const second = runHeadlessCampaign(replay);
    expect(second).toEqual(first);
    expect(first?.finalDate).toEqual({ year: 1959, month: 12, day: 31 });
  }, 180_000);

  it('makes campaign identity observable in the final state', () => {
    const first = runHeadlessCampaign(emptyReplay('A10-SEED-A'), { width: 8, height: 8 });
    const second = runHeadlessCampaign(emptyReplay('A10-SEED-B'), { width: 8, height: 8 });
    expect(first?.digest).not.toBe(second?.digest);
  }, 60_000);

  it('rejects invalid input and decisions beyond the campaign', () => {
    expect(runHeadlessCampaign('{bad')).toBeNull();
    const invalid = JSON.stringify({
      version: 1,
      worldSeed: 'future',
      decisions: {
        version: 1,
        completeFromStart: true,
        entries: [{
          day: MAX_CAMPAIGN_ELAPSED_DAYS + 1,
          kind: 'click',
          tool: 'road',
          start: { x: 0, y: 0 },
          end: { x: 0, y: 0 },
        }],
      },
    });
    expect(runHeadlessCampaign(invalid, { width: 8, height: 8 })).toBeNull();
  });
});
