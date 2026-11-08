import { describe, it, expect } from 'vitest';
import { CANONICAL_ERA_THEMES, getEraVisualTheme } from './EraVisualTheme';

describe('EraVisualTheme', () => {
  it('contém exatamente 5 temas de era canônicos ordenados de 1910 a 1959', () => {
    expect(CANONICAL_ERA_THEMES.length).toBe(5);

    const keys = CANONICAL_ERA_THEMES.map((t) => t.key);
    expect(keys).toEqual(['era-1910', 'era-1920', 'era-1930', 'era-1940', 'era-1950']);

    for (const theme of CANONICAL_ERA_THEMES) {
      expect(theme.eraName).toBeTruthy();
      expect(theme.aestheticTitle).toBeTruthy();
      expect(theme.canvasFilter).toBeTruthy();
      expect(theme.headerBadge).toBeTruthy();
      expect(theme.quoteText).toBeTruthy();
      expect(theme.visualCharacteristics.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('retorna o tema correto para cada ano histórico', () => {
    expect(getEraVisualTheme(1910).key).toBe('era-1910');
    expect(getEraVisualTheme(1915).key).toBe('era-1910');
    expect(getEraVisualTheme(1919).key).toBe('era-1910');

    expect(getEraVisualTheme(1920).key).toBe('era-1920');
    expect(getEraVisualTheme(1925).key).toBe('era-1920');

    expect(getEraVisualTheme(1930).key).toBe('era-1930');
    expect(getEraVisualTheme(1933).key).toBe('era-1930');

    expect(getEraVisualTheme(1940).key).toBe('era-1940');
    expect(getEraVisualTheme(1942).key).toBe('era-1940');

    expect(getEraVisualTheme(1950).key).toBe('era-1950');
    expect(getEraVisualTheme(1959).key).toBe('era-1950');
  });

  it('exibe a moeda correta em cada tema de era (Réis vs Cruzeiro)', () => {
    expect(getEraVisualTheme(1910).currencyBadge).toContain('RÉIS');
    expect(getEraVisualTheme(1930).currencyBadge).toContain('RÉIS');
    expect(getEraVisualTheme(1940).currencyBadge).toContain('CRUZEIRO');
    expect(getEraVisualTheme(1959).currencyBadge).toContain('CRUZEIRO');
  });
});
