import { readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type Layer = 'app' | 'core' | 'engine' | 'input' | 'render' | 'tools' | 'types';

interface SourceFile {
  absolutePath: string;
  relativePath: string;
  layer: Layer;
  source: string;
}

interface ImportEdge {
  source: SourceFile;
  specifier: string;
  targetLayer: Layer | null;
}

const PROJECT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE_ROOTS = ['app', 'game'] as const;

const ALLOWED_LAYER_IMPORTS: Readonly<Record<Layer, ReadonlySet<Layer>>> = {
  app: new Set(['app', 'core', 'engine', 'input', 'render', 'tools', 'types']),
  core: new Set(['core', 'types']),
  engine: new Set(['core', 'engine', 'input', 'render', 'tools', 'types']),
  input: new Set(['core', 'input', 'render', 'tools', 'types']),
  render: new Set(['core', 'render', 'types']),
  tools: new Set(['core', 'tools', 'types']),
  types: new Set(['types']),
};

const WORLD_MUTATORS = [
  'installTerrain',
  'setElapsedDays',
  'trySpend',
  'earn',
  'setMoney',
  'markLandValueDirty',
  'recomputeLandValue',
  'markPowerDirty',
  'recomputePower',
  'markWaterDirty',
  'recomputeWater',
  'markServiceDirty',
  'recomputeService',
  'markFireDirty',
  'recomputeFire',
  'markHospitalDirty',
  'recomputeHospital',
  'markSchoolDirty',
  'recomputeSchool',
  'markTrafficDirty',
  'recomputeTraffic',
  'markLaborDirty',
  'recomputeLabor',
  'markDemandDirty',
  'reset',
  'regenerateTerrain',
  'tick',
] as const;

function toPosix(path: string): string {
  return path.replaceAll('\\', '/');
}

function layerFor(relativePath: string): Layer | null {
  const normalized = toPosix(relativePath);
  if (normalized === 'app' || normalized.startsWith('app/')) return 'app';

  const match = /^game\/(core|engine|input|render|tools|types)(?:\/|$)/.exec(normalized);
  return (match?.[1] as Layer | undefined) ?? null;
}

function isProductionSource(name: string): boolean {
  return (
    (name.endsWith('.ts') || name.endsWith('.tsx')) &&
    !name.endsWith('.test.ts') &&
    !name.endsWith('.test.tsx') &&
    !name.endsWith('.d.ts')
  );
}

function collectSourceFiles(directory: string): SourceFile[] {
  const files: SourceFile[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }
    if (!entry.isFile() || !isProductionSource(entry.name)) continue;

    const relativePath = toPosix(relative(PROJECT_ROOT, absolutePath));
    const layer = layerFor(relativePath);
    if (!layer) continue;

    files.push({
      absolutePath,
      relativePath,
      layer,
      source: readFileSync(absolutePath, 'utf8'),
    });
  }

  return files;
}

function importSpecifiers(source: string): string[] {
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  return patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
}

function targetLayerFor(source: SourceFile, specifier: string): Layer | null {
  if (specifier.startsWith('@/')) return layerFor(specifier.slice(2));
  if (!specifier.startsWith('.')) return null;

  const targetPath = toPosix(relative(PROJECT_ROOT, resolve(dirname(source.absolutePath), specifier)));
  return layerFor(targetPath);
}

function collectImportEdges(files: SourceFile[]): ImportEdge[] {
  return files.flatMap((source) =>
    importSpecifiers(source.source).map((specifier) => ({
      source,
      specifier,
      targetLayer: targetLayerFor(source, specifier),
    })),
  );
}

function directRandomnessViolations(files: ReadonlyArray<SourceFile>): string[] {
  const directRandomPattern = /\bMath\s*\.\s*random\s*\(/g;
  const violations: string[] = [];

  for (const file of files.filter((candidate) => candidate.layer === 'core')) {
    for (const match of file.source.matchAll(directRandomPattern)) {
      const line = file.source.slice(0, match.index).split('\n').length;
      violations.push(`${file.relativePath}:${line}: direct Math.random() call`);
    }
  }

  return violations;
}

const sourceFiles = SOURCE_ROOTS.flatMap((root) => collectSourceFiles(resolve(PROJECT_ROOT, root)));
const importEdges = collectImportEdges(sourceFiles);

describe('architecture boundaries', () => {
  it('keeps production imports inside the audited layer graph', () => {
    const violations = importEdges
      .filter(
        (edge) =>
          edge.targetLayer !== null &&
          !ALLOWED_LAYER_IMPORTS[edge.source.layer].has(edge.targetLayer),
      )
      .map(
        (edge) =>
          `${edge.source.relativePath}: ${edge.source.layer} must not import ${edge.targetLayer} (${edge.specifier})`,
      );

    expect(violations).toEqual([]);
  });

  it('keeps React and Next in the app shell and PixiJS in render', () => {
    const violations = importEdges
      .filter((edge) => {
        const packageName = edge.specifier.split('/')[0];
        if (packageName === 'react' || packageName === 'next') return edge.source.layer !== 'app';
        if (packageName === 'pixi.js') return edge.source.layer !== 'render';
        return false;
      })
      .map((edge) => `${edge.source.relativePath}: forbidden framework import ${edge.specifier}`);

    expect(violations).toEqual([]);
  });

  it('keeps direct World mutation out of render, input, and tools', () => {
    const protectedLayers = new Set<Layer>(['render', 'input', 'tools']);
    const mutatorPattern = new RegExp(
      `(?:\\bworld|this\\.world)\\.(${WORLD_MUTATORS.join('|')})\\s*\\(`,
      'g',
    );
    const violations: string[] = [];

    for (const file of sourceFiles.filter((candidate) => protectedLayers.has(candidate.layer))) {
      for (const match of file.source.matchAll(mutatorPattern)) {
        const line = file.source.slice(0, match.index).split('\n').length;
        violations.push(`${file.relativePath}:${line}: direct World.${match[1]} mutation`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('guards every audited production layer', () => {
    const discovered = new Set(sourceFiles.map((file) => file.layer));
    expect([...discovered].sort()).toEqual([
      'app',
      'core',
      'engine',
      'input',
      'render',
      'tools',
      'types',
    ]);

    expect(ALLOWED_LAYER_IMPORTS.core.has('render')).toBe(false);
    expect(ALLOWED_LAYER_IMPORTS.render.has('engine')).toBe(false);
    expect(ALLOWED_LAYER_IMPORTS.tools.has('render')).toBe(false);
  });

  it('keeps direct randomness out of production core', () => {
    expect(directRandomnessViolations(sourceFiles)).toEqual([]);

    const fixture: SourceFile = {
      absolutePath: resolve(PROJECT_ROOT, 'game/core/forbidden-randomness-fixture.ts'),
      relativePath: 'game/core/forbidden-randomness-fixture.ts',
      layer: 'core',
      source: ['const safe = 1;', 'const forbidden = Math.random();'].join('\n'),
    };
    expect(directRandomnessViolations([fixture])).toEqual([
      'game/core/forbidden-randomness-fixture.ts:2: direct Math.random() call',
    ]);
  });
});
