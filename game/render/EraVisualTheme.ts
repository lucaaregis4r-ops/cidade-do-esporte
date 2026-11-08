/**
 * EraVisualTheme.ts - Temas visuais e atmosféricos dinâmicos por época (1910 a 1959).
 *
 * Governa a evolução gráfica do jogo conforme a campanha avança no relógio histórico:
 * 1910s: Belle Époque / Daguerreótipo / Imprensa Monocromática Primitiva
 * 1920s: Anos Loucos / Art Déco / Gazetas Esportivas Ilustradas
 * 1930s: Era do Rádio de Galena / Arquitetura Industrial / Vagas de Concreto
 * 1940s: Pós-Guerra / Reforma Monetária do Cruzeiro / Manchetes Oficiais
 * 1950s: Anos Dourados / Maracanazo / Revista Esportiva de Gala & Taça Brasil
 *
 * Zero uso de Math.random(). Somente lógica pura determinística.
 */

export type EraKey = 'era-1910' | 'era-1920' | 'era-1930' | 'era-1940' | 'era-1950';

export interface EraVisualTheme {
  readonly key: EraKey;
  readonly eraName: string;
  readonly periodLabel: string;
  readonly yearStart: number;
  readonly yearEnd: number;
  readonly aestheticTitle: string;
  readonly aestheticSubtitle: string;
  readonly icon: string;
  readonly cssClass: string;
  readonly canvasFilter: string;
  readonly headerBadge: string;
  readonly currencyBadge: string;
  readonly quoteText: string;
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly visualCharacteristics: readonly string[];
}

export const CANONICAL_ERA_THEMES: readonly EraVisualTheme[] = Object.freeze([
  {
    key: 'era-1910',
    eraName: 'Belle Époque & Alvorecer Amador',
    periodLabel: '1910–1919',
    yearStart: 1910,
    yearEnd: 1919,
    aestheticTitle: 'GAZETA DE MINAS · ANNO MCMX',
    aestheticSubtitle: 'Foot-ball amador nos arrabaldes e linhas férreas da Central',
    icon: '📜',
    cssClass: 'era-1910',
    canvasFilter: 'grayscale(35%) sepia(20%) contrast(110%)',
    headerBadge: '📜 BELLE ÉPOQUE (1910–1919)',
    currencyBadge: 'RÉIS (1$000)',
    quoteText: '"O prélio de foot-ball realizou-se com luz diurna no ground cercado de tábuas."',
    primaryColor: '#ffffff',
    accentColor: '#e0d8c3',
    visualCharacteristics: [
      'Estilo daguerreótipo e tipografia em chumbo de jornal antigo',
      'Monocromático de alto contraste com tons de marfim e carvão',
      'Molduras de linha dupla e vinhetas clássicas da Primeira República',
      'Scanlines CRT suaves de tela analógica de época',
    ],
  },
  {
    key: 'era-1920',
    eraName: 'Anos Loucos & Estilo Art Déco',
    periodLabel: '1920–1929',
    yearStart: 1920,
    yearEnd: 1929,
    aestheticTitle: 'O COMBATE ESPORTIVO · ANOS 20',
    aestheticSubtitle: 'Festivais populares, dérbis acirrados e cartazes ilustrados',
    icon: '⚡',
    cssClass: 'era-1920',
    canvasFilter: 'contrast(120%) grayscale(15%)',
    headerBadge: '⚡ ART DÉCO (1920–1929)',
    currencyBadge: 'MIL-RÉIS (1$000)',
    quoteText: '"A mocidade esportiva vibra com os festivais e as grandes dissidências de bairro."',
    primaryColor: '#ffffff',
    accentColor: '#ffd54f',
    visualCharacteristics: [
      'Grafismos geométricos chanfrados e linhas angulares Art Déco',
      'Bordas sólidas com chanfros nos cantos e tipografia dinâmica',
      'Manchetes impactantes de crônica esportiva ilustrada',
      'Alto contraste com reflexos metálicos prateados e dourados',
    ],
  },
  {
    key: 'era-1930',
    eraName: 'Era do Rádio & Vagas de Concreto',
    periodLabel: '1930–1939',
    yearStart: 1930,
    yearEnd: 1939,
    aestheticTitle: 'RÁDIO INCONFIDÊNCIA · 880 kHz',
    aestheticSubtitle: 'A oficialização do profissionalismo e as primeiras transmissões ao vivo',
    icon: '📻',
    cssClass: 'era-1930',
    canvasFilter: 'contrast(115%) saturate(90%) hue-rotate(5deg)',
    headerBadge: '📻 ERA DO RÁDIO (1930–1939)',
    currencyBadge: 'RÉIS / CONTRATOS (1933)',
    quoteText: '"Pelas ondas médias irradiamos o clássico sob os novos refletores elétricos."',
    primaryColor: '#ffffff',
    accentColor: '#81c784',
    visualCharacteristics: [
      'Mostradores analógicos de frequência e ondas radiofônicas vintage',
      'Bordas e caixas com cantos arredondados industriais em estilo baquelite',
      'Iluminação de válvula e refletores nas praças de esportes',
      'Tipografia sem serifa em caixa alta dos parques fabris',
    ],
  },
  {
    key: 'era-1940',
    eraName: 'Pós-Guerra & Reforma do Cruzeiro',
    periodLabel: '1940–1949',
    yearStart: 1940,
    yearEnd: 1949,
    aestheticTitle: 'FOLHA DOS ESPORTES · PADRÃO CRUZEIRO',
    aestheticSubtitle: 'Reforma monetária, grandes avenidas e consolidação das massas',
    icon: '🪙',
    cssClass: 'era-1940',
    canvasFilter: 'contrast(125%) saturate(90%)',
    headerBadge: '🪙 REFORMA MONETÁRIA (1940–1949)',
    currencyBadge: 'CRUZEIRO (Cr$ 1,00)',
    quoteText: '"Com a extinção dos réis em 1942, o futebol mineiro adota a moeda do Cruzeiro."',
    primaryColor: '#ffffff',
    accentColor: '#64b5f6',
    visualCharacteristics: [
      'Estilo documental oficial com carimbos burocráticos de Estado Novo',
      'Valores financeiros convertidos obrigatoriamente para Cruzeiros (Cr$)',
      'Manchetes garrafais e fotografia esportiva impressa em rotogravura',
      'Estádios de alvenaria e batismo de setores em homenagem a dirigentes',
    ],
  },
  {
    key: 'era-1950',
    eraName: 'Anos Dourados & Epílogo da Taça Brasil',
    periodLabel: '1950–1959',
    yearStart: 1950,
    yearEnd: 1959,
    aestheticTitle: 'REVISTA DO ESPORTE · EDIÇÃO DE JUBILEU',
    aestheticSubtitle: 'O cinquentenário do clube de 1910 e a consagração nacional de 1959',
    icon: '🏆',
    cssClass: 'era-1950',
    canvasFilter: 'contrast(115%) saturate(110%)',
    headerBadge: '🏆 ANOS DOURADOS (1950–1959)',
    currencyBadge: 'CRUZEIRO NACIONAL (Cr$)',
    quoteText: '"Meio século de glórias e tradição: Minas Gerais disputa a primeira Taça Brasil."',
    primaryColor: '#ffffff',
    accentColor: '#ffd700',
    visualCharacteristics: [
      'Design moderno e otimista da era JK / Bossa Nova / Maracanã',
      'Estrelas e coroas comemorativas do Cinquentenário de Ouro (1910–1959)',
      'Chaveamento de gala nacional da Taça Brasil da CBD',
      'Estádios monumentais de concreto armado com capacidade para multidões',
    ],
  },
]);

/**
 * Retorna o tema visual e atmosférico correspondente ao ano da campanha.
 */
export function getEraVisualTheme(year: number): EraVisualTheme {
  if (year < 1920) return CANONICAL_ERA_THEMES[0];
  if (year < 1930) return CANONICAL_ERA_THEMES[1];
  if (year < 1940) return CANONICAL_ERA_THEMES[2];
  if (year < 1950) return CANONICAL_ERA_THEMES[3];
  return CANONICAL_ERA_THEMES[4];
}
