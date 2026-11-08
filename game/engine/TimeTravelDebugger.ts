/**
 * TimeTravelDebugger.ts - Ferramentas de debug, inspeção de RNG e Time-Travel de Replay (Macroetapa 40).
 *
 * Permite examinar marcos temporais canônicos da campanha (1910 a 1959),
 * inspecionar os contadores de RNG das 8 streams determinísticas e
 * exportar pacotes reproduzíveis de Replay de decisões sem tocar em Math.random().
 */

import { CampaignRngState } from '../core/CampaignRng';

export interface TimeTravelMilestone {
  readonly year: number;
  readonly dateIso: string;
  readonly title: string;
  readonly era: string;
  readonly contextDescription: string;
  readonly keyRules: readonly string[];
  readonly monetarySystem: 'REIS' | 'CRUZEIRO';
  readonly footballStatus: string;
  readonly urbanStatus: string;
}

export interface ReproducibleSeedPackage {
  readonly version: string;
  readonly exportTimestamp: string;
  readonly worldSeed: string;
  readonly rngStateSnapshot?: CampaignRngState;
  readonly totalDecisionsLogged: number;
  readonly decisionLog: readonly unknown[];
  readonly gameChecksum: string;
}

/**
 * 7 Marcos Canônicos da História de Cidade de Minas (1910 a 1959).
 */
export const TIME_TRAVEL_MILESTONES: readonly TimeTravelMilestone[] = Object.freeze([
  {
    year: 1910,
    dateIso: '1910-01-01',
    title: 'Fundação & Alvorecer do Futebol',
    era: 'Era Pioneira Amadorista',
    contextDescription: 'Fundação do clube na virada do ano. Praça de esportes rústica, 6 origens sociais em disputa e primeiros festivais esportivos aos domingos.',
    keyRules: [
      'Pirâmide Tática Britânica 2-3-5',
      '0 Substituições permitidas',
      'Padrão Monetário em Mil-Réis (1$000)',
      'Arbitragem verbal sem cartões',
    ],
    monetarySystem: 'REIS',
    footballStatus: 'Amadorismo estrito; festivais e desafios locais',
    urbanStatus: 'Cidade planejada em consolidação; eixo ferroviário dominante',
  },
  {
    year: 1915,
    dateIso: '1915-05-15',
    title: 'Emergência da Federação Mineira (LMDT)',
    era: 'Institucionalização Inicial',
    contextDescription: 'Os pioneiros da capital e do interior ferroviário fundam a Liga Mineira de Desportos Terrestres. Surge o primeiro campeonato formal por pontos corridos.',
    keyRules: [
      'Pontos corridos (2 pts vitória, 1 pt empate)',
      'Estatuto formal com exigência de campo cercado',
      'Tribunal de Penas para indisciplina',
    ],
    monetarySystem: 'REIS',
    footballStatus: 'Primeiro Campeonato da Cidade oficial',
    urbanStatus: 'Expansão dos bondes elétricos e primeiros bairros periféricos',
  },
  {
    year: 1916,
    dateIso: '1916-08-20',
    title: 'O Grande Cisma da Capital (AMEA)',
    era: 'Racha Federativo',
    contextDescription: 'Cisão política gera a dissidente AMEA e certames paralelos. Rivalidades bairristas e aristocráticas se aprofundam.',
    keyRules: [
      'Dois certames municipais simultâneos',
      'Disputa por prestígio institucional e público',
      'Elevação imediata do termômetro de dérbi',
    ],
    monetarySystem: 'REIS',
    footballStatus: 'Cisma político; dois campeões da cidade',
    urbanStatus: 'Densificação intramuros da Av. do Contorno',
  },
  {
    year: 1930,
    dateIso: '1930-10-03',
    title: 'Fim da Era Ferroviária e Modernização',
    era: 'Transição Urbana',
    contextDescription: 'Revolução de 1930 e declínio do transporte ferroviário exclusivo. Abertura das primeiras radiais rodoviárias e loteamentos suburbanos.',
    keyRules: [
      'Redução da influência ferroviária sobre o valor da terra',
      'Expansão de praças de esportes com alambrados',
      'Adoção gradual de refletores elétricos para treinos',
    ],
    monetarySystem: 'REIS',
    footballStatus: 'Emergência do amadorismo assistido e bicho de jogo',
    urbanStatus: 'Expansão automobilística e loteamento da periferia',
  },
  {
    year: 1933,
    dateIso: '1933-04-01',
    title: 'Oficialização do Profissionalismo',
    era: 'Era dos Contratos',
    contextDescription: 'Minas Gerais adota formalmente o profissionalismo esportivo sob a égide da CBD. Atletas assinam contratos de trabalho e recebem ordenados formais.',
    keyRules: [
      'Contratos de trabalho com passe e ordenado mensal',
      'Cobrança sistemática de ingressos e taxas federativas',
      'Exigência de saúde financeira das diretorias',
    ],
    monetarySystem: 'REIS',
    footballStatus: 'Profissionalismo reconhecido legalmente',
    urbanStatus: 'Grandes praças esportivas de alvenaria',
  },
  {
    year: 1942,
    dateIso: '1942-11-01',
    title: 'Reforma Monetária: Surge o Cruzeiro',
    era: 'Reforma Nacional',
    contextDescription: 'Decreto federal extingue o secular sistema de réis. A moeda oficial passa a ser o Cruzeiro (Cr$ 1,00 = 1$000 réis).',
    keyRules: [
      'Moeda oficial: Cruzeiro (Cr$)',
      'Conversão obrigatória dos livros contábeis',
      'Inflação de guerra e custo de vida operário tabelado',
    ],
    monetarySystem: 'CRUZEIRO',
    footballStatus: 'Consolidação das rivalidades de massa e rádios de galena',
    urbanStatus: 'Cidade Industrial de Contagem e polos manufatureiros',
  },
  {
    year: 1959,
    dateIso: '1959-12-31',
    title: 'Epílogo dos 50 Anos & Inaugural Taça Brasil',
    era: 'Consagração Cinquentenária',
    contextDescription: 'Cinqüentenário do clube fundado em 1910. A CBD inaugura a Taça Brasil para apontar o primeiro campeão nacional que irá à Taça Libertadores.',
    keyRules: [
      'Mata-mata interestadual da Taça Brasil',
      'Indicação do campeão mineiro ao certame nacional',
      'Emissão do Relatório Oficial de 50 Anos (1910–1959)',
    ],
    monetarySystem: 'CRUZEIRO',
    footballStatus: 'Disputa da Taça Brasil e consagração das lendas',
    urbanStatus: 'Metrópole moderna com mais de 500.000 habitantes',
  },
]);

/**
 * Monta o pacote canônico de Replay e Decision Log v25 para exportação determinística.
 */
export function buildReproducibleSeedPackage(
  worldSeed: string,
  decisionLog: readonly unknown[] = [],
  rngSnapshot?: CampaignRngState
): ReproducibleSeedPackage {
  // Checksum determinístico simples
  const logLen = decisionLog.length;
  const seedHash = worldSeed
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  const checksum = `REP-v25-S${Math.abs(seedHash).toString(16)}-L${logLen}`;

  return {
    version: '25.0.0',
    exportTimestamp: '1910-1959-CAMPAIGN-RUNNER',
    worldSeed,
    rngStateSnapshot: rngSnapshot,
    totalDecisionsLogged: logLen,
    decisionLog,
    gameChecksum: checksum,
  };
}

/**
 * Consulta marco por ano.
 */
export function getMilestoneByYear(year: number): TimeTravelMilestone | undefined {
  return TIME_TRAVEL_MILESTONES.find((m) => m.year === year);
}
