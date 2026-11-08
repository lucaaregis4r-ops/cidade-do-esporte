/**
 * NationalAbstractClub.ts
 *
 * Contrato e catálogo canônico de clubes abstratos de outros estados brasileiros
 * participantes da Taça Brasil de 1959 (Macroetapa 36 - Alpha H).
 *
 * Disciplina operacional:
 * - Pureza de domínio, estritamente determinístico, zero unseeded randomness ou PRNG não controlado.
 * - Modelagem de clubes históricos com suas federações, estados e zonas de classificação.
 */

import type { ClubColors } from '../club/Club';

export type NationalZone = 'norte-nordeste' | 'centro-sul';

export interface NationalAbstractClub {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly state: string;
  readonly region: NationalZone;
  readonly colors: ClubColors;
  readonly reputation: number; // 70 a 98
  readonly stadium: string;
  readonly tacticalStyle: string;
  readonly notableStars: readonly string[];
}

/**
 * Catálogo dos campeões estaduais históricos da Taça Brasil de 1959.
 * De acordo com os registros históricos da CBD de 1959.
 */
export const HISTORICAL_1959_NATIONAL_CLUBS: readonly NationalAbstractClub[] = Object.freeze([
  // --- ZONA CENTRO-SUL ---
  {
    id: 'club-nac-santos',
    name: 'Santos Futebol Clube',
    shortName: 'Santos',
    state: 'SP',
    region: 'centro-sul',
    colors: { primary: '#FFFFFF', secondary: '#000000', accent: '#D4AF37' },
    reputation: 98,
    stadium: 'Vila Belmiro (Santos)',
    tacticalStyle: 'Ofensivo Imparável e Troca Rápida de Passes',
    notableStars: ['Pelé', 'Pepe', 'Coutinho', 'Zito', 'Dorval'],
  },
  {
    id: 'club-nac-vasco',
    name: 'Club de Regatas Vasco da Gama',
    shortName: 'Vasco',
    state: 'RJ',
    region: 'centro-sul',
    colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#E63946' },
    reputation: 94,
    stadium: 'São Januário (Rio de Janeiro)',
    tacticalStyle: 'Marcação Firme e Contra-ataques Rápidos',
    notableStars: ['Bellini', 'Vavá', 'Almir Pernambuquinho', 'Sabará'],
  },
  {
    id: 'club-nac-gremio',
    name: 'Grêmio Foot-Ball Porto Alegrense',
    shortName: 'Grêmio',
    state: 'RS',
    region: 'centro-sul',
    colors: { primary: '#0099FF', secondary: '#000000', accent: '#FFFFFF' },
    reputation: 90,
    stadium: 'Estádio Olímpico (Porto Alegre)',
    tacticalStyle: 'Garra Sulina e Disputa Física Intensa',
    notableStars: ['Milton Kuelle', 'Juarez', 'Élton', 'Ortunho'],
  },
  {
    id: 'club-nac-atletico-pr',
    name: 'Clube Atlético Paranaense',
    shortName: 'Atlético-PR',
    state: 'PR',
    region: 'centro-sul',
    colors: { primary: '#CC0000', secondary: '#000000', accent: '#FFFFFF' },
    reputation: 84,
    stadium: 'Joaquim Américo (Curitiba)',
    tacticalStyle: 'Futebol Dinâmico Pelas Pontas',
    notableStars: ['Jackson', 'Tião Macalé', 'Tosin'],
  },
  {
    id: 'club-nac-hercilio-luz',
    name: 'Hercílio Luz Futebol Clube',
    shortName: 'Hercílio Luz',
    state: 'SC',
    region: 'centro-sul',
    colors: { primary: '#CC0000', secondary: '#FFFFFF', accent: '#111111' },
    reputation: 76,
    stadium: 'Aníbal Costa (Tubarão)',
    tacticalStyle: 'Fechamento Defensivo e Força Coletiva',
    notableStars: ['Camanga', 'Waldir'],
  },
  {
    id: 'club-nac-rio-branco',
    name: 'Rio Branco Atlético Clube',
    shortName: 'Rio Branco-ES',
    state: 'ES',
    region: 'centro-sul',
    colors: { primary: '#111111', secondary: '#FFFFFF', accent: '#888888' },
    reputation: 75,
    stadium: 'Governador Bley (Vitória)',
    tacticalStyle: 'Transição Longa e Bola Aérea',
    notableStars: ['Alcy', 'Fontana'],
  },

  // --- ZONA NORTE-NORDESTE ---
  {
    id: 'club-nac-bahia',
    name: 'Esporte Clube Bahia',
    shortName: 'Bahia',
    state: 'BA',
    region: 'norte-nordeste',
    colors: { primary: '#003399', secondary: '#FFFFFF', accent: '#CC0000' },
    reputation: 93,
    stadium: 'Fonte Nova (Salvador)',
    tacticalStyle: 'Futebol Técnico de Drible e Eficiência Decisiva',
    notableStars: ['Léo Briglia', 'Alencar', 'Marito', 'Vicente', 'Nadinho'],
  },
  {
    id: 'club-nac-sport',
    name: 'Sport Club do Recife',
    shortName: 'Sport',
    state: 'PE',
    region: 'norte-nordeste',
    colors: { primary: '#CC0000', secondary: '#000000', accent: '#D4AF37' },
    reputation: 89,
    stadium: 'Ilha do Retiro (Recife)',
    tacticalStyle: 'Pressão Territorial e Linha Alta de Ataque',
    notableStars: ['Traçaia', 'Bequinha', 'Oswaldo'],
  },
  {
    id: 'club-nac-ceara',
    name: 'Ceará Sporting Club',
    shortName: 'Ceará',
    state: 'CE',
    region: 'norte-nordeste',
    colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#888888' },
    reputation: 84,
    stadium: 'Presidente Vargas (Fortaleza)',
    tacticalStyle: 'Combate Posicional e Contra-golpe',
    notableStars: ['Gildo', 'Alexandre', 'Pipiu'],
  },
  {
    id: 'club-nac-auto-esporte',
    name: 'Auto Esporte Clube',
    shortName: 'Auto Esporte',
    state: 'PB',
    region: 'norte-nordeste',
    colors: { primary: '#CC0000', secondary: '#FFFFFF', accent: '#000000' },
    reputation: 78,
    stadium: 'Estádio Mangabeira (João Pessoa)',
    tacticalStyle: 'Jogo Físico e Disputa nas Linhas Intermediárias',
    notableStars: ['Chico', 'Pequeno'],
  },
  {
    id: 'club-nac-csa',
    name: 'Centro Sportivo Alagoano',
    shortName: 'CSA',
    state: 'AL',
    region: 'norte-nordeste',
    colors: { primary: '#003399', secondary: '#FFFFFF', accent: '#6699FF' },
    reputation: 77,
    stadium: 'Mutange (Maceió)',
    tacticalStyle: 'Apoio Constante das Alas e Triangulações',
    notableStars: ['Dida', 'Gato'],
  },
  {
    id: 'club-nac-ferroviario-ma',
    name: 'Ferroviário Esporte Clube',
    shortName: 'Ferroviário-MA',
    state: 'MA',
    region: 'norte-nordeste',
    colors: { primary: '#006600', secondary: '#FFFFFF', accent: '#CC0000' },
    reputation: 75,
    stadium: 'Nhozinho Santos (São Luís)',
    tacticalStyle: 'Marcação Serrada e Cruzamentos Rápidos',
    notableStars: ['Neco', 'Beto'],
  },
  {
    id: 'club-nac-paysandu',
    name: 'Paysandu Sport Club',
    shortName: 'Paysandu',
    state: 'PA',
    region: 'norte-nordeste',
    colors: { primary: '#0099FF', secondary: '#FFFFFF', accent: '#003366' },
    reputation: 80,
    stadium: 'Curuzu (Belém)',
    tacticalStyle: 'Ataque Pelos Flancos e Ímpeto Popular',
    notableStars: ['Quarentinha', 'Élcio'],
  },
]);

/**
 * Retorna todos os clubes nacionais registrados para a Taça Brasil.
 */
export function getAllNationalClubs(): readonly NationalAbstractClub[] {
  return HISTORICAL_1959_NATIONAL_CLUBS;
}

/**
 * Retorna os clubes nacionais de uma zona geográfica específica.
 */
export function getNationalClubsByZone(zone: NationalZone): readonly NationalAbstractClub[] {
  return HISTORICAL_1959_NATIONAL_CLUBS.filter((c) => c.region === zone);
}

/**
 * Busca um clube nacional pelo seu ID único.
 */
export function getNationalClubById(id: string): NationalAbstractClub | undefined {
  return HISTORICAL_1959_NATIONAL_CLUBS.find((c) => c.id === id);
}
