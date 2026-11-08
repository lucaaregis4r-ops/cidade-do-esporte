import { describe, expect, it } from 'vitest';
import { World } from './World';

describe('World interruption integration', () => {
  it('timestamps events from HistoricalClock and acknowledges FIFO order', () => {
    const world = new World(4, 4, { regenerate: false });
    world.tick();
    world.enqueueInterruption({ id: 'first', kind: 'election', title: 'First election' });
    world.tick();
    world.enqueueInterruption({ id: 'second', kind: 'final', title: 'Championship final' });

    expect(world.getInterruptions().map((event) => event.date)).toEqual([
      { year: 1910, month: 1, day: 2 },
      { year: 1910, month: 1, day: 3 },
    ]);
    expect(world.acknowledgeInterruption()?.id).toBe('first');
    expect(world.acknowledgeInterruption()?.id).toBe('second');
    expect(world.acknowledgeInterruption()).toBeNull();
  });

  it('clears campaign events on reset while retaining the volatile auto-pause preference', () => {
    const world = new World(4, 4, { regenerate: false });
    world.setAutoPause('incident', false);
    world.enqueueInterruption({ id: 'incident', kind: 'incident', title: 'Stand incident' });

    world.reset({ regenerate: false });

    expect(world.getInterruptions()).toEqual([]);
    expect(world.getAutoPauseConfig().incident).toBe(false);
  });
});
