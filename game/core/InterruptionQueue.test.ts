import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTO_PAUSE_CONFIG,
  INTERRUPTION_KINDS,
  InterruptionQueue,
  type InterruptionInput,
} from './InterruptionQueue';

function interruption(id: string, kind: InterruptionInput['kind'] = 'election'): InterruptionInput {
  return {
    id,
    kind,
    date: { year: 1910, month: 1, day: 2 },
    title: `Event ${id}`,
    description: `Description ${id}`,
  };
}

describe('InterruptionQueue', () => {
  it('preserves deterministic FIFO order and returns immutable snapshots', () => {
    const queue = new InterruptionQueue();
    expect(queue.enqueue(interruption('a'))).toBe(true);
    expect(queue.enqueue(interruption('b', 'crisis'))).toBe(true);

    expect(queue.size).toBe(2);
    expect(queue.peek()?.id).toBe('a');
    expect(queue.getAll().map((item) => item.id)).toEqual(['a', 'b']);
    expect(Object.isFrozen(queue.peek())).toBe(true);
    expect(Object.isFrozen(queue.peek()?.date)).toBe(true);
    expect(queue.dequeue()?.id).toBe('a');
    expect(queue.dequeue()?.id).toBe('b');
    expect(queue.dequeue()).toBeNull();
  });

  it('rejects duplicate ids and malformed runtime input without mutating', () => {
    const queue = new InterruptionQueue();
    expect(queue.enqueue(interruption('stable'))).toBe(true);
    expect(queue.enqueue(interruption('stable', 'final'))).toBe(false);
    expect(queue.enqueue({ ...interruption(''), title: 'Missing id' })).toBe(false);
    expect(queue.enqueue({ ...interruption('title'), title: '  ' })).toBe(false);
    expect(queue.enqueue({ ...interruption('date'), date: { year: 1910, month: 2, day: 30 } })).toBe(false);
    expect(queue.enqueue({ ...interruption('kind'), kind: 'unknown' as InterruptionInput['kind'] })).toBe(false);
    expect(queue.size).toBe(1);
  });

  it('supports every canonical kind and auto-pauses each item at most once', () => {
    const queue = new InterruptionQueue();
    for (const kind of INTERRUPTION_KINDS) {
      expect(queue.enqueue(interruption(kind, kind))).toBe(true);
    }

    expect(queue.getAutoPauseConfig()).toEqual(DEFAULT_AUTO_PAUSE_CONFIG);
    expect(INTERRUPTION_KINDS.map(() => queue.claimAutoPause()?.kind)).toEqual(INTERRUPTION_KINDS);
    expect(queue.claimAutoPause()).toBeNull();
    expect(queue.size).toBe(INTERRUPTION_KINDS.length);
  });

  it('lets configuration skip disabled kinds without disturbing FIFO acknowledgement', () => {
    const queue = new InterruptionQueue();
    queue.enqueue(interruption('proposal', 'proposal'));
    queue.enqueue(interruption('incident', 'incident'));

    expect(queue.setAutoPause('proposal', false)).toBe(true);
    expect(queue.claimAutoPause()?.id).toBe('incident');
    expect(queue.claimAutoPause()).toBeNull();
    expect(queue.getAll().map((item) => item.id)).toEqual(['proposal', 'incident']);

    expect(queue.setAutoPause('proposal', true)).toBe(true);
    expect(queue.claimAutoPause()?.id).toBe('proposal');
  });

  it('clears events and releases ids for deterministic reuse', () => {
    const queue = new InterruptionQueue();
    queue.enqueue(interruption('reusable'));
    queue.clear();
    expect(queue.size).toBe(0);
    expect(queue.enqueue(interruption('reusable'))).toBe(true);
  });

  it('acknowledges the displayed item without removing an older disabled item', () => {
    const queue = new InterruptionQueue();
    queue.setAutoPause('proposal', false);
    queue.enqueue(interruption('older', 'proposal'));
    queue.enqueue(interruption('displayed', 'crisis'));
    const displayed = queue.claimAutoPause()!;
    expect(queue.acknowledge(displayed.id)?.id).toBe('displayed');
    expect(queue.getAll().map((item) => item.id)).toEqual(['older']);
    expect(queue.acknowledge('missing')).toBeNull();
  });
});
