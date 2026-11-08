import { describe, expect, it } from 'vitest';
import { DecisionLog, decodeReplayPackage, encodeReplayPackage } from './DecisionLog';

const click = (day = 0) => ({
  day,
  kind: 'click' as const,
  tool: 'road' as const,
  start: { x: 2, y: 3 },
  end: { x: 2, y: 3 },
});

describe('DecisionLog', () => {
  it('keeps ordered defensive snapshots', () => {
    const log = new DecisionLog();
    const entry = click();
    expect(log.append(entry)).toBe(true);
    entry.start.x = 99;
    const snapshot = log.snapshot();
    snapshot.entries[0].start.x = 88;
    expect(log.snapshot()).toEqual({ version: 1, completeFromStart: true, entries: [click()] });
  });

  it('rejects decreasing days and malformed clicks atomically', () => {
    const log = new DecisionLog();
    expect(log.append(click(2))).toBe(true);
    expect(log.append(click(1))).toBe(false);
    expect(log.append({ ...click(3), end: { x: 3, y: 3 } })).toBe(false);
    expect(log.snapshot().entries).toHaveLength(1);
  });

  it.each([
    null, {}, { version: 2, completeFromStart: true, entries: [] },
    { version: 1, completeFromStart: true, entries: null },
    { version: 1, completeFromStart: true, entries: [{ ...click(), tool: 'unknown' }] },
    { version: 1, completeFromStart: true, entries: [{ ...click(), day: -1 }] },
  ])('rejects malformed snapshots %j', (value) => {
    expect(DecisionLog.fromSnapshot(value)).toBeNull();
  });

  it('round-trips the canonical replay package', () => {
    const log = new DecisionLog();
    log.append(click());
    const encoded = encodeReplayPackage('seed-a9', log.snapshot());
    expect(encoded).not.toBeNull();
    expect(decodeReplayPackage(encoded!)).toEqual({
      version: 1,
      worldSeed: 'seed-a9',
      decisions: log.snapshot(),
    });
  });

  it('refuses to advertise a migrated partial log as reproducible', () => {
    expect(encodeReplayPackage('legacy', new DecisionLog(false).snapshot())).toBeNull();
  });

  it.each(['', '{', '[]', '{"version":1,"worldSeed":"","decisions":{"version":1,"entries":[]}}'])
    ('rejects malformed replay packages', (value) => {
      expect(decodeReplayPackage(value)).toBeNull();
    });
});
