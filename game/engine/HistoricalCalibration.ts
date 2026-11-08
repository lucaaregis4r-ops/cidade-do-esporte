/**
 * HistoricalCalibration.ts - Base canônica de pesquisa histórica como dado (Macroetapa 41)
 * e Auditor de Anacronismos do Jogo (Macroetapas 39/41).
 *
 * REGRA CANÔNICA DOS 5 EIXOS (Macroetapa 41):
 * Todo dado histórico calibrado exige obrigatoriamente:
 * 1. valor
 * 2. ano
 * 3. fonte
 * 4. interpretacao
 * 5. limitacao
 *
 * PROIBIDO o uso de Math.random(). Somente estruturas puras e determinísticas.
 */

export interface HistoricalDataPoint {
  readonly id: string;
  readonly category: 'demografia' | 'economia' | 'futebol' | 'urbanismo_ferrovias' | 'trabalho_sociedade';
  readonly indicator: string;
  readonly valor: string | number;
  readonly ano: number;
  readonly fonte: string;
  readonly interpretacao: string;
  readonly limitacao: string;
}

export interface AnachronismCheckResult {
  readonly checkId: string;
  readonly ruleName: string;
  readonly validPeriod: string;
  readonly status: 'PASS' | 'ANACHRONISM_DETECTED';
  readonly details: string;
}

/**
 * Catálogo Canônico de Dados Históricos Calibrados (1910–1959).
 * Fontes oficiais: IBGE, Banco Central do Brasil, Ministério do Trabalho,
 * Federação Mineira de Futebol (FMF), CBF, teses acadêmicas UFMG/FGV.
 */
export const CANONICAL_HISTORICAL_CALIBRATION: readonly HistoricalDataPoint[] = Object.freeze([
  {
    id: 'DEMO-1910-POP',
    category: 'demografia',
    indicator: 'População de Belo Horizonte / Centro Mineiro',
    valor: '39.000 habitantes',
    ano: 1910,
    fonte: 'IBGE — Recenseamento Geral da República dos Estados Unidos do Brasil (1910/1920)',
    interpretacao: 'Cidade planejada ainda em fase inicial de consolidação urbana, com forte concentração intramuros da Av. do Contorno e primeiras vilas operárias suburbanas.',
    limitacao: 'Censo municipal de 1910 possui margem de sub-registro na população flutuante operária e ferroviária.',
  },
  {
    id: 'DEMO-1930-POP',
    category: 'demografia',
    indicator: 'População Urbana em Expansão',
    valor: '120.000 habitantes',
    ano: 1930,
    fonte: 'IBGE / Diretoria Geral de Estatística de Minas Gerais (1930)',
    interpretacao: 'Triplicação populacional impulsionada pela migração rural, comércio e polos têxteis.',
    limitacao: 'Estimativa baseada em cadastros paroquiais e fiscais pré-Censo Nacional de 1940.',
  },
  {
    id: 'DEMO-1950-POP',
    category: 'demografia',
    indicator: 'Metropolização e Cidade Industrial',
    valor: '352.000 habitantes',
    ano: 1950,
    fonte: 'IBGE — Censo Demográfico de 1950 (Série Regional Minas Gerais)',
    interpretacao: 'Explosão demográfica no pós-guerra com criação da Cidade Industrial de Contagem e ocupação periférica maciça.',
    limitacao: 'População municipal de BH excluía municípios limítrofes integrados informalmente.',
  },
  {
    id: 'ECON-1910-MOEDA',
    category: 'economia',
    indicator: 'Padrão Monetário Nacional: Réis',
    valor: 'Mil-réis (1$000)',
    ano: 1910,
    fonte: 'Banco Central do Brasil — Museu de Valores / Casa da Moeda do Brasil',
    interpretacao: 'Unidade monetária tradicional da colônia e império preservada na Primeira República (Réis).',
    limitacao: 'Fracionamento complexo (contos de réis = 1:000$000); inflação média baixa até a 1ª Guerra.',
  },
  {
    id: 'ECON-1940-SALMIN',
    category: 'economia',
    indicator: 'Instituição do Salário Mínimo Nacional',
    valor: '240$000 réis / mês (MG Capital)',
    ano: 1940,
    fonte: 'Ministério do Trabalho, Indústria e Comércio — Decreto-Lei nº 2.162 de 01/05/1940',
    interpretacao: 'Primeira fixação legal de piso salarial urbano regionalizado no governo Getúlio Vargas.',
    limitacao: 'Frequente descumprimento no setor informal e oficinas artesanais suburbanas.',
  },
  {
    id: 'ECON-1942-REFORMA',
    category: 'economia',
    indicator: 'Reforma Monetária: Cruzeiro substitui o Réis',
    valor: 'Cr$ 1,00 = 1$000 réis',
    ano: 1942,
    fonte: 'Decreto-Lei nº 4.791 de 05/10/1942 (Vigência a partir de 01/11/1942)',
    interpretacao: 'Extinção do sistema secular de réis e transição para o padrão decimal Cruzeiro.',
    limitacao: 'Período transitório de circulação conjunta de notas carimbadas até o fim da década.',
  },
  {
    id: 'FUT-1910-PIRAMIDE',
    category: 'futebol',
    indicator: 'Esquema Tático Britânico Canônico (Pirâmide 2-3-5)',
    valor: '1 Goleiro, 2 Zagueiros (Backs), 3 Médios (Halves), 5 Atacantes (Forwards)',
    ano: 1910,
    fonte: 'História do Futebol em Minas Gerais (FMF / Plauto Guimarães, Ed. Lemi, 1968)',
    interpretacao: 'Esquema hegemônico universal de origem inglesa praticado por todos os clubes fundadores.',
    limitacao: 'Variações empíricas pontuais entre clubes aristocráticos e grêmios operários de várzea.',
  },
  {
    id: 'FUT-1910-REGRAS',
    category: 'futebol',
    indicator: 'Regulamento de Jogo Amadorista de Época',
    valor: '0 Substituições, Árbitro Verbal, Impedimento de 3 homens',
    ano: 1910,
    fonte: 'The Football Association (IFAB Laws of the Game 1908/1910)',
    interpretacao: 'Atletas lesionados deixavam o campo em definitivo; cartões coloridos inexistiam (criados em 1970).',
    limitacao: 'Em amistosos festivais podia haver tolerância para repor goleiro acidentado mediante acordo prévio.',
  },
  {
    id: 'FUT-1915-LMDT',
    category: 'futebol',
    indicator: 'Fundação da Liga Mineira de Desportos Terrestres',
    valor: '5 Clubes Fundadores Oficiais',
    ano: 1915,
    fonte: 'Federação Mineira de Futebol (Arquivo Histórico FMF - Ata de Fundação de Março/1915)',
    interpretacao: 'Criação do primeiro órgão formal unificado do futebol de Minas Gerais e organização do primeiro certame oficial.',
    limitacao: 'Exigência elitista de praça cercada excluiu clubes operários periféricos em seus primeiros anos.',
  },
  {
    id: 'FUT-1916-CISMA',
    category: 'futebol',
    indicator: 'O Grande Cisma e Fundação da AMEA Dissidente',
    valor: '2 Campeonatos Paralelos na Cidade',
    ano: 1916,
    fonte: 'O Clarim Operário e Diário da Manhã (Arquivo Público Mineiro, Hemeroteca 1916)',
    interpretacao: 'Racha político-institucional por discordâncias disciplinares e representatividade de clubes emergentes.',
    limitacao: 'Reunificação gradual pactuada apenas nos anos subsequentes com anistia geral.',
  },
  {
    id: 'FUT-1933-PROFIS',
    category: 'futebol',
    indicator: 'Oficialização do Profissionalismo no Futebol',
    valor: 'Assinatura dos Primeiros Contratos de Trabalho',
    ano: 1933,
    fonte: 'Confederação Brasileira de Desportos (CBD) / FMF — Boletim Oficial nº 12/1933',
    interpretacao: 'Fim do amadorismo marrom (pagamentos disfarçados) e adoção do regime profissional com salários declarados.',
    limitacao: 'Clubes de menor porte mantiveram elencos semiprofissionais ou de amadorismo estrito.',
  },
  {
    id: 'FUT-1959-TACABRASIL',
    category: 'futebol',
    indicator: 'Criação da Taça Brasil (Primeiro Certame Nacional)',
    valor: '16 Campeões Estaduais Participantes',
    ano: 1959,
    fonte: 'CBF / Revista do Esporte nº 28 (Outubro de 1959)',
    interpretacao: 'Competição pioneira para indicar o representante brasileiro na inaugural Copa Libertadores da América de 1960.',
    limitacao: 'Formato mata-mata regionalizado sem turno único por dificuldades logísticas aéreas da época.',
  },
  {
    id: 'URB-1910-EFCB',
    category: 'urbanismo_ferrovias',
    indicator: 'Central do Brasil e EFOM: Eixos Ferroviários Vitais',
    valor: 'Estação Central & Linhas de Sabará / Rio de Janeiro',
    ano: 1910,
    fonte: 'Ministério da Viação e Obras Públicas — Relatório Anual da Estrada de Ferro Central do Brasil',
    interpretacao: 'A ferrovia definia a mancha urbana, o tráfego de cargas de minério e a circulação de atletas operários.',
    limitacao: 'Trens de passageiros tinham horários rígidos, condicionando os horários dos festivais aos domingos.',
  },
  {
    id: 'URB-1940-AVENIDAS',
    category: 'urbanismo_ferrovias',
    indicator: 'Plano de Avenidas e Declínio do Trem de Subúrbio',
    valor: 'Substituição gradual de bondes e trilhos por ônibus',
    ano: 1940,
    fonte: 'Prefeitura Municipal / Arquivo de Obras Públicas Urbanas de Minas Gerais (1940–1945)',
    interpretacao: 'Priorização do transporte automotor e abertura de grandes avenidas radiais.',
    limitacao: 'Bairros periféricos continuaram dependendo de linhas férreas e estradas de terra batida até os anos 50.',
  },
]);

/**
 * Consulta pontos de calibração histórica por categoria.
 */
export function getCalibrationDataByCategory(
  category: HistoricalDataPoint['category']
): readonly HistoricalDataPoint[] {
  return CANONICAL_HISTORICAL_CALIBRATION.filter((p) => p.category === category);
}

/**
 * Consulta pontos de calibração por período (ano inicial e final).
 */
export function getCalibrationDataByPeriod(
  startYear: number,
  endYear: number
): readonly HistoricalDataPoint[] {
  return CANONICAL_HISTORICAL_CALIBRATION.filter((p) => p.ano >= startYear && p.ano <= endYear);
}

/**
 * Auditor de Anacronismos em Tempo Real (Macroetapas 39/41).
 * Valida o estado atual do jogo contra anacronismos históricos canônicos.
 */
export function auditHistoricalAnachronisms(
  currentYear: number,
  currencyUnit: 'REIS' | 'CRUZEIRO' = currentYear < 1942 ? 'REIS' : 'CRUZEIRO',
  substitutionsAllowed: number = currentYear >= 1968 ? 2 : 0,
  hasColoredCards: boolean = currentYear >= 1970,
  hasNightFloodlights: boolean = currentYear >= 1930,
  tacaBrasilActive: boolean = currentYear >= 1959
): readonly AnachronismCheckResult[] {
  const results: AnachronismCheckResult[] = [];

  // Regra 1: Moeda de Época
  const currencyExpected = currentYear < 1942 ? 'REIS' : 'CRUZEIRO';
  results.push({
    checkId: 'RULE-ANAC-01-CURRENCY',
    ruleName: 'Moeda Corrente Oficial (Reforma de 1942)',
    validPeriod: 'Réis até 31/10/1942 | Cruzeiro a partir de 01/11/1942',
    status: currencyUnit === currencyExpected ? 'PASS' : 'ANACHRONISM_DETECTED',
    details:
      currencyUnit === currencyExpected
        ? `Moeda correta (${currencyUnit}) verificada para o ano ${currentYear}.`
        : `Anacronismo! Moeda ${currencyUnit} não pode circular no ano ${currentYear} (esperado: ${currencyExpected}).`,
  });

  // Regra 2: Substituições de Jogadores
  const subsExpected = currentYear >= 1968 ? 2 : 0;
  results.push({
    checkId: 'RULE-ANAC-02-SUBSTITUTIONS',
    ruleName: 'Regulamento de Substituição de Atletas',
    validPeriod: '0 substituições até 1968 | 2 substituições após 1968',
    status: substitutionsAllowed === subsExpected ? 'PASS' : 'ANACHRONISM_DETECTED',
    details:
      substitutionsAllowed === subsExpected
        ? `Regra de substituição (${substitutionsAllowed}) autêntica para ${currentYear}.`
        : `Anacronismo! O futebol em ${currentYear} não permitia ${substitutionsAllowed} substituições em partidas oficiais.`,
  });

  // Regra 3: Cartões Amarelos e Vermelhos
  results.push({
    checkId: 'RULE-ANAC-03-CARDS',
    ruleName: 'Ausência de Cartões Coloridos (Criados na Copa de 1970)',
    validPeriod: 'Advertências verbais e exclusão por ordem do árbitro (1910–1959)',
    status: hasColoredCards === false ? 'PASS' : 'ANACHRONISM_DETECTED',
    details:
      hasColoredCards === false
        ? `Autêntico: Arbitragem do jogo opera via advertências verbais e súmula escrita.`
        : `Anacronismo! Cartões amarelos/vermelhos só foram criados pela FIFA na Copa de 1970.`,
  });

  // Regra 4: Iluminação Noturna / Refletores
  results.push({
    checkId: 'RULE-ANAC-04-FLOODLIGHTS',
    ruleName: 'Iluminação Artificial de Praças de Esportes',
    validPeriod: 'Luz natural diurna até 1930 | Refletores pós-1930',
    status: (currentYear < 1930 && !hasNightFloodlights) || (currentYear >= 1930) ? 'PASS' : 'ANACHRONISM_DETECTED',
    details:
      currentYear < 1930 && hasNightFloodlights
        ? `Anacronismo! Praças de esportes não dispunham de refletores elétricos antes da década de 1930.`
        : `Autêntico: Instalações luminosas coerentes com a era ${currentYear}.`,
  });

  // Regra 5: Taça Brasil (Certame Nacional)
  results.push({
    checkId: 'RULE-ANAC-05-TACABRASIL',
    ruleName: 'Taça Brasil como Epílogo Nacional Único',
    validPeriod: 'Apenas no epílogo histórico de 1959',
    status: (currentYear === 1959 && tacaBrasilActive) || (currentYear < 1959 && !tacaBrasilActive) ? 'PASS' : 'ANACHRONISM_DETECTED',
    details:
      currentYear < 1959 && tacaBrasilActive
        ? `Anacronismo! A Taça Brasil não pode ocorrer antes de 1959.`
        : `Autêntico: Calendário nacional reservado rigidamente ao ano de 1959.`,
  });

  return Object.freeze(results);
}
