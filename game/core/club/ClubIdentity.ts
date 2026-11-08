import type { CampaignRng } from '../CampaignRng';
import type { ClubColors, CrestVersion, FoundingOrigin } from './Club';

export type CrestShape =
  | 'swiss'         // Escudo suíço com campo dividido ou monograma
  | 'circle'        // Círculo clássico com aro e letras entrelaçadas
  | 'stripes'       // Escudo com faixas verticais bicolores
  | 'sash'          // Escudo com faixa transversal/diagonal
  | 'diamond';      // Losango clássico de inspiração britânica/mineira

export interface GeneratedClubIdentity {
  readonly name: string;
  readonly shortName: string;
  readonly colors: ClubColors;
  readonly crestShape: CrestShape;
  readonly crestVersion: CrestVersion;
}

interface HistoricalNameTemplate {
  readonly name: string;
  readonly shortName: string;
}

const HISTORICAL_NAMES_BY_ORIGIN: Readonly<Record<FoundingOrigin, readonly HistoricalNameTemplate[]>> = {
  railway: [
    { name: 'Ferroviário Atlético Clube', shortName: 'FAC' },
    { name: 'Central de Minas Sport Club', shortName: 'CMSC' },
    { name: 'Locomotiva Futebol Clube', shortName: 'LFC' },
    { name: 'Leopoldina Athletic Club', shortName: 'LAC' },
    { name: 'Ferrovia Esporte Clube', shortName: 'FEC' },
    { name: 'Oficinas Atlético Clube', shortName: 'OAC' },
  ],
  students: [
    { name: 'Estudantes Futebol Clube', shortName: 'EFC' },
    { name: 'Acadêmico Foot-Ball Club', shortName: 'AFC' },
    { name: 'Gymnasial Atlético Clube', shortName: 'GAC' },
    { name: 'Universitário Sport Club', shortName: 'USC' },
    { name: 'Minerva Futebol Clube', shortName: 'MFC' },
    { name: 'Juventude Acadêmica FC', shortName: 'JAC' },
  ],
  immigrants: [
    { name: 'Palestra Esporte Clube', shortName: 'PEC' },
    { name: 'Circolo Esportivo Mineiro', shortName: 'CEM' },
    { name: 'Sociedade Ibérica Foot-Ball Club', shortName: 'SIFC' },
    { name: 'Albion Athletic Club', shortName: 'AAC' },
    { name: 'Teutônia Foot-Ball Club', shortName: 'TFC' },
    { name: 'Esperança Internacional FC', shortName: 'EIFC' },
  ],
  workers: [
    { name: 'Operário Esporte Clube', shortName: 'OEC' },
    { name: 'União Operária Futebol Clube', shortName: 'UOFC' },
    { name: 'Proletário Foot-Ball Club', shortName: 'PFC' },
    { name: 'Trabalho e Sport Club', shortName: 'TSC' },
    { name: 'Força Operária Atlético Clube', shortName: 'FOAC' },
    { name: 'Progresso da Fábrica FC', shortName: 'PFFC' },
  ],
  merchants: [
    { name: 'Comercial Atlético Clube', shortName: 'CAC' },
    { name: 'Associação Mercantil Esporte Clube', shortName: 'AMEC' },
    { name: 'Pauliceia Foot-Ball Club', shortName: 'PFC' },
    { name: 'Lojistas Sport Club', shortName: 'LSC' },
    { name: 'Cidade Mercantil Futebol Clube', shortName: 'CMFC' },
    { name: 'Praça do Comércio AC', shortName: 'PCAC' },
  ],
  elite: [
    { name: 'Atlético Clube da Cidade', shortName: 'ACC' },
    { name: 'América Esporte Clube', shortName: 'AEC' },
    { name: 'Sport Club da Montanha', shortName: 'SCM' },
    { name: 'Minas Athletic Club', shortName: 'MAC' },
    { name: 'Clube Recreativo Mineiro', shortName: 'CRM' },
    { name: 'Gerais Country and Foot-Ball Club', shortName: 'GCFC' },
  ],
};

export interface HistoricalPalette {
  readonly name: string;
  readonly colors: ClubColors;
}

const HISTORICAL_PALETTES: readonly HistoricalPalette[] = [
  { name: 'Alvinegro Tradicional', colors: { primary: '#111111', secondary: '#f8f8f8', accent: '#cccccc' } },
  { name: 'Rubro-Negro Clássico', colors: { primary: '#b81414', secondary: '#181818', accent: '#f0f0f0' } },
  { name: 'Alviverde Esmeralda', colors: { primary: '#18632e', secondary: '#f4f6f4', accent: '#c4dfc4' } },
  { name: 'Azul e Branco Imperial', colors: { primary: '#123977', secondary: '#ffffff', accent: '#8ab4f8' } },
  { name: 'Tricolor Mineiro (Grená, Ouro e Branco)', colors: { primary: '#6e1526', secondary: '#f5f5f5', accent: '#d4af37' } },
  { name: 'Tricolor Clássico (Vermelho, Preto e Branco)', colors: { primary: '#b51919', secondary: '#ffffff', accent: '#151515' } },
  { name: 'Celeste e Branco', colors: { primary: '#417db8', secondary: '#ffffff', accent: '#1b3b5f' } },
  { name: 'Alvirrubro Ferroviário', colors: { primary: '#9e1b1b', secondary: '#fdfdfd', accent: '#4a1010' } },
];

const CREST_SHAPES: readonly CrestShape[] = ['swiss', 'circle', 'stripes', 'sash', 'diamond'];

/**
 * Deterministically generates a plausible 1910 club identity (name, colors, shield)
 * for a given founding origin using exclusively rng.club.
 */
export function generateClubIdentity(
  origin: FoundingOrigin,
  rng: CampaignRng,
): GeneratedClubIdentity {
  const names = HISTORICAL_NAMES_BY_ORIGIN[origin];
  const nameIndex = rng.club.nextUint32() % names.length;
  const chosenName = names[nameIndex];

  // Specific origins have favored historical color harmonies
  const paletteIndex = (rng.club.nextUint32() + origin.charCodeAt(0)) % HISTORICAL_PALETTES.length;
  const chosenPalette = HISTORICAL_PALETTES[paletteIndex];

  const shapeIndex = rng.club.nextUint32() % CREST_SHAPES.length;
  const crestShape = CREST_SHAPES[shapeIndex];

  const designId = `${crestShape}-1910-${chosenPalette.colors.primary.slice(1)}-${chosenPalette.colors.secondary.slice(1)}`;

  const crestVersion: CrestVersion = Object.freeze({
    startYear: 1910,
    designId,
    changeReason: 'Adoção do pavilhão e distintivo inaugural em assembleia de fundação (1910).',
  });

  return Object.freeze({
    name: chosenName.name,
    shortName: chosenName.shortName,
    colors: chosenPalette.colors,
    crestShape,
    crestVersion,
  });
}

/** Returns all predefined historical name templates for an origin. */
export function getAvailableNamesForOrigin(origin: FoundingOrigin): readonly HistoricalNameTemplate[] {
  return HISTORICAL_NAMES_BY_ORIGIN[origin];
}

/** Returns all available historical palettes. */
export function getAvailablePalettes(): readonly HistoricalPalette[] {
  return HISTORICAL_PALETTES;
}

/** Returns all available crest shapes. */
export function getAvailableCrestShapes(): readonly CrestShape[] {
  return CREST_SHAPES;
}
