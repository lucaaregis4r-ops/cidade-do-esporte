import { describe, expect, it } from 'vitest';
import { World } from './World';

function terrainJson(world: World): unknown {
  return world.getTerrain().toJSON();
}

describe('World campaign RNG ownership', () => {
  it('generates identical terrain and stream state from the same worldSeed', () => {
    const a = new World(12, 12, { worldSeed: 'CM-1910-SAME' });
    const b = new World(12, 12, { worldSeed: 'CM-1910-SAME' });
    expect(terrainJson(a)).toEqual(terrainJson(b));
    expect(a.getRngStreams().snapshot()).toEqual(b.getRngStreams().snapshot());
  });

  it('changes the city stream and terrain for a different worldSeed', () => {
    const a = new World(16, 16, { worldSeed: 'CM-1910-A' });
    const b = new World(16, 16, { worldSeed: 'CM-1910-B' });
    expect(a.getRngStreams().city.getState()).not.toBe(b.getRngStreams().city.getState());
    expect(terrainJson(a)).not.toEqual(terrainJson(b));
  });

  it('reset with the same worldSeed resets every stream before regeneration', () => {
    const world = new World(12, 12, { worldSeed: 'CM-1910-RESET' });
    const expectedTerrain = terrainJson(world);
    world.getRngStreams().football.next();
    world.getRngStreams().media.next();

    world.reset({ regenerate: true, worldSeed: 'CM-1910-RESET' });
    const control = new World(12, 12, { worldSeed: 'CM-1910-RESET' });
    expect(terrainJson(world)).toEqual(expectedTerrain);
    expect(world.getRngStreams().snapshot()).toEqual(control.getRngStreams().snapshot());
  });
});
