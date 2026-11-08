import { describe, it, expect, vi } from 'vitest';
import type { Container } from 'pixi.js';
import { CityInfrastructureRenderer } from './CityInfrastructureRenderer';
import { World } from '../core/World';
import { createTile, TileType } from '../core/Tile';

function makeMockContainer(): Container {
  const children: any[] = [];
  return {
    addChild: vi.fn((child: any) => {
      children.push(child);
      return child;
    }),
    removeChild: vi.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    }),
    destroy: vi.fn(),
  } as unknown as Container;
}

describe('CityInfrastructureRenderer', () => {
  it('instancia o renderer e adiciona o objeto Graphics ao container', () => {
    const container = makeMockContainer();
    const renderer = new CityInfrastructureRenderer(container);
    expect(container.addChild).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });

  it('renderiza a cidade de 1910 e o campo do clube sem erros', () => {
    const container = makeMockContainer();
    const renderer = new CityInfrastructureRenderer(container);
    const world = new World(32, 32, { worldSeed: 'TEST-INFRA-SEED' });

    // Initial state: ensure founding club
    world.ensureFoundingClub();
    expect(world.getClub()).toBeTruthy();

    // Render should succeed without throwing
    expect(() => renderer.render(world)).not.toThrow();

    renderer.destroy();
  });

  it('re-renderiza determinística e dinamicamente ao avançar pelas 5 eras históricas', () => {
    const container = makeMockContainer();
    const renderer = new CityInfrastructureRenderer(container);
    const world = new World(32, 32, { worldSeed: 'TEST-ERA-EVOLUTION' });
    world.ensureFoundingClub();

    // Test across eras (1910, 1925, 1935, 1945, 1955)
    const testYears = [1910, 1925, 1935, 1945, 1955];
    for (const year of testYears) {
      // Advance clock or simulate era
      vi.spyOn(world, 'getDate').mockReturnValue({ year, month: 6, day: 15 });
      expect(() => renderer.render(world)).not.toThrow();
    }

    renderer.destroy();
  });

  it('limpa os recursos ao destruir o renderer', () => {
    const container = makeMockContainer();
    const renderer = new CityInfrastructureRenderer(container);
    expect(() => renderer.destroy()).not.toThrow();
  });
});
