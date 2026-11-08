/**
 * HistoricalPress domain model (Alpha G: G4 & G5 / Macroetapas 26 e 30-31).
 * Governs procedural sports journalism, period newspapers, radio broadcasting,
 * and chronicles of Cidade de Minas (1910–1959).
 *
 * CANONICAL RULES:
 * - Deterministic: purely causal, zero unseeded randomness or unseeded PRNG.
 * - NO Date.now(): strictly derived from HistoricalClock / deterministic parameters.
 * - Period authenticity: vocabulary from Brazilian sports journalism:
 *   - 1910s: formal, Belle Époque ("prélio", "match", "têmpera", "esquadrão", "prestigiosa assistência").
 *   - 1920s: illustrated sports chronicles and debate ("combate", "reviravolta", "bastidores").
 *   - 1930s+: The Golden Age of Radio ("PRK-5 transmite!", "alô ouvintes da capital", "gool no éter").
 *   - 1940s-1950s: Mass sports journalism ("caderno de esportes", "multidão em delírio", "clássico das multidões").
 */

import type { GameDate } from '../HistoricalClock';
import type { MatchRecord } from '../football/MatchEngine';
import type { MatchIncidentEvent } from '../football/MatchIncidents';

export type MediaOutletType = 'newspaper' | 'radio';

export type NewspaperId =
  | 'gazeta'
  | 'diario'
  | 'clarim'
  | 'combate'
  | 'radio_inconfidencia'
  | 'folha';

export type PressCategory =
  | 'match_report'
  | 'derby_headline'
  | 'tribunal_verdict'
  | 'club_founding'
  | 'election'
  | 'scandal'
  | 'institutional_honor';

export type EditorialStance =
  | 'conservative_legalist'
  | 'capital_sensationalist'
  | 'working_class_polemical'
  | 'pugnacious_illustrated'
  | 'radio_broadcaster'
  | 'popular_mass_daily';

export interface NewspaperProfile {
  readonly id: NewspaperId;
  readonly name: string;
  readonly mediaType: MediaOutletType;
  readonly foundedYear: number;
  readonly targetAudiencePt: string;
  readonly editorialStance: EditorialStance;
  readonly mottoPt: string;
  readonly reachMultiplier: number;
}

export interface PressArticle {
  readonly id: string;
  readonly newspaperId: NewspaperId;
  readonly newspaperName: string;
  readonly mediaType?: MediaOutletType;
  readonly date: Readonly<GameDate>;
  readonly category: PressCategory;
  readonly headline: string;
  readonly subheadline: string;
  readonly bodyText: string;
  readonly editorialTone: 'conservative' | 'enthusiastic' | 'polemic' | 'working_class' | 'radio_broadcast';
  readonly relatedClubIds: readonly string[];
  readonly relatedMatchId?: string;
}

export const ALL_HISTORICAL_OUTLETS: readonly NewspaperProfile[] = Object.freeze([
  {
    id: 'gazeta',
    name: 'A Gazeta Esportiva de Minas',
    mediaType: 'newspaper',
    foundedYear: 1908,
    targetAudiencePt: 'Círculos desportivos oficiais, dirigentes da Liga e famílias da sociedade',
    editorialStance: 'conservative_legalist',
    mottoPt: 'Pela disciplina cívica e nobreza do amadorismo esportivo.',
    reachMultiplier: 1.0,
  },
  {
    id: 'diario',
    name: 'O Diário da Manhã',
    mediaType: 'newspaper',
    foundedYear: 1902,
    targetAudiencePt: 'Comércio central, funcionários públicos e grande público da capital',
    editorialStance: 'capital_sensationalist',
    mottoPt: 'A voz vibrante da metrópole em marcha triunfal.',
    reachMultiplier: 1.2,
  },
  {
    id: 'clarim',
    name: 'O Clarim Operário',
    mediaType: 'newspaper',
    foundedYear: 1909,
    targetAudiencePt: 'Operários fabris, ferroviários, alfaiates e esportistas dos bairros populares',
    editorialStance: 'working_class_polemical',
    mottoPt: 'Sem medo e sem amarras: a força do povo nos campos e nas oficinas!',
    reachMultiplier: 1.1,
  },
  {
    id: 'combate',
    name: 'O Combate Esportivo',
    mediaType: 'newspaper',
    foundedYear: 1922,
    targetAudiencePt: 'Torcedores apaixonados, cronistas boêmios e assíduos dos cafés da capital',
    editorialStance: 'pugnacious_illustrated',
    mottoPt: 'A crônica afiada que desmascara as frouxidões do prélio.',
    reachMultiplier: 1.6,
  },
  {
    id: 'radio_inconfidencia',
    name: 'Rádio Inconfidência (Ondas Médias)',
    mediaType: 'radio',
    foundedYear: 1936,
    targetAudiencePt: 'Todos os lares de Minas Gerais, dos aparelhos de galena aos radiolas da praça',
    editorialStance: 'radio_broadcaster',
    mottoPt: 'A voz de Minas no éter: emoção e verdade ao vivo dos gramados!',
    reachMultiplier: 2.8,
  },
  {
    id: 'folha',
    name: 'Folha dos Esportes',
    mediaType: 'newspaper',
    foundedYear: 1945,
    targetAudiencePt: 'Massa urbana, operários, bancários e jovens da modernização do pós-guerra',
    editorialStance: 'popular_mass_daily',
    mottoPt: 'A maior circulação de Minas Gerais a serviço da paixão do povo!',
    reachMultiplier: 2.4,
  },
]);

/**
 * Historical 1910 newspapers (for backward compatibility).
 */
export const NEWSPAPERS_1910: readonly NewspaperProfile[] = Object.freeze(
  ALL_HISTORICAL_OUTLETS.filter((n) => n.foundedYear <= 1910)
);

/**
 * Returns the media outlets available for a specific year in the simulation.
 */
export function getAvailableMediaOutlets(year: number): readonly NewspaperProfile[] {
  return Object.freeze(ALL_HISTORICAL_OUTLETS.filter((o) => o.foundedYear <= year));
}

/**
 * Validates a press article defensivel.
 */
export function validatePressArticle(a: unknown): a is PressArticle {
  if (!a || typeof a !== 'object') return false;
  const art = a as Partial<PressArticle>;
  const validIds: NewspaperId[] = ['gazeta', 'diario', 'clarim', 'combate', 'radio_inconfidencia', 'folha'];
  return (
    typeof art.id === 'string' &&
    validIds.includes(art.newspaperId as NewspaperId) &&
    typeof art.newspaperName === 'string' &&
    !!art.date &&
    typeof art.date.year === 'number' &&
    typeof art.headline === 'string' &&
    typeof art.bodyText === 'string' &&
    Array.isArray(art.relatedClubIds)
  );
}

/**
 * Generates match chronicles from period newspapers and radio broadcasts.
 * Adapts available outlets based on the match year (1910s newspapers -> 1920s chronicles -> 1930s radio -> 1940s mass press).
 */
export function generateMatchPressArticles(
  match: Readonly<MatchRecord>,
  derbyInfo?: { derbyName?: string; intensity: number }
): readonly PressArticle[] {
  const isDerby = !!derbyInfo && derbyInfo.intensity >= 50;
  const isHomeWin = match.homeScore > match.awayScore;
  const isAwayWin = match.awayScore > match.homeScore;
  const isDraw = match.homeScore === match.awayScore;

  const scoreText = `${match.homeScore} x ${match.awayScore}`;
  const totalGoals = match.homeScore + match.awayScore;
  const isBlowout = Math.abs(match.homeScore - match.awayScore) >= 3;
  const matchYear = match.date.year;

  const articles: PressArticle[] = [];

  // 1. A Gazeta Esportiva de Minas (formal, legalista)
  let gazetaHeadline = `O Prélio da Capital: ${match.homeClubName} ${scoreText} ${match.awayClubName}`;
  let gazetaSub = `Prestigiosa assistência compareceu à praça para saudar os briosos esquadrões.`;
  if (isDerby && derbyInfo?.derbyName) {
    gazetaHeadline = `No Clássico "${derbyInfo.derbyName}", o placar registrou ${scoreText}`;
  }
  let gazetaBody = `Em tarde de elevada compostura desportiva, defrontaram-se perante seleta assistência as esquadras do ${match.homeClubName} e do ${match.awayClubName}. `;
  if (isBlowout) {
    gazetaBody += `O conjunto vencedor impôs severa disciplina tática na linha de frente, dominando com superioridade técnica os adversários perante o público pagante de ${match.attendance} cidadãos.`;
  } else if (isDraw) {
    gazetaBody += `A peleja caracterizou-se pela rígida vigilância dos zagueiros e pelo equilíbrio irredutível das linhas médias, fechando em justa igualdade.`;
  } else {
    gazetaBody += `Com tenacidade exemplar dos avançados e defesa inexpugnável, coube a honra do triunfo ao quadro vitorioso, cabendo louvores à arbitragem pelo zelo às regras oficiais.`;
  }

  articles.push(
    Object.freeze({
      id: `art-gazeta-${match.id}`,
      newspaperId: 'gazeta',
      newspaperName: 'A Gazeta Esportiva de Minas',
      mediaType: 'newspaper',
      date: match.date,
      category: isDerby ? 'derby_headline' : 'match_report',
      headline: gazetaHeadline,
      subheadline: gazetaSub,
      bodyText: gazetaBody,
      editorialTone: 'conservative',
      relatedClubIds: Object.freeze([match.homeClubId, match.awayClubId]),
      relatedMatchId: match.id,
    })
  );

  // 2. O Diário da Manhã (entusiasta, vibrante)
  let diarioHeadline = `Sensação nos Campos! ${match.homeClubName} e ${match.awayClubName} Vibram a Cidade!`;
  if (isHomeWin) {
    diarioHeadline = `${match.homeClubName} Vence Prélio Emocionante por ${scoreText}!`;
  } else if (isAwayWin) {
    diarioHeadline = `Façanha Forasteira! ${match.awayClubName} Calou a Torcida por ${scoreText}!`;
  } else {
    diarioHeadline = `Batalha Titânica Termina em Empate Eletrizante: ${scoreText}!`;
  }
  const diarioSub = `Mais de ${match.attendance} pagantes lotaram o gramado em delírio esportivo.`;
  let diarioBody = `A capital parou na tarde dominical para testemunhar o embate formidável entre ${match.homeClubName} e ${match.awayClubName}. `;
  if (totalGoals >= 4) {
    diarioBody += `Chuva de gols encantou a massa! Os atacantes desferiram tiros indefensáveis, fazendo as matracas retumbarem das gerais à arquibancada. Um espetáculo digno da história esportiva de Minas!`;
  } else {
    diarioBody += `Cada palmo de chão foi disputado com fervor febril. A multidão não economizou aplausos para os guardiões e centro-médios, num prélio que ficará gravado na memória dos aficionados da bola.`;
  }

  articles.push(
    Object.freeze({
      id: `art-diario-${match.id}`,
      newspaperId: 'diario',
      newspaperName: 'O Diário da Manhã',
      mediaType: 'newspaper',
      date: match.date,
      category: isDerby ? 'derby_headline' : 'match_report',
      headline: diarioHeadline,
      subheadline: diarioSub,
      bodyText: diarioBody,
      editorialTone: 'enthusiastic',
      relatedClubIds: Object.freeze([match.homeClubId, match.awayClubId]),
      relatedMatchId: match.id,
    })
  );

  // 3. O Clarim Operário (combate social, proletário)
  let clarimHeadline = `O Esporte Popular em Marcha: ${match.homeClubName} ${scoreText} ${match.awayClubName}`;
  const clarimSub = `O povo trabalhador fez ouvir sua voz nas cercanias da praça de esportes.`;
  let clarimBody = `A classe operária e a mocidade trabalhadora compareceram em peso ao combate dominical. `;
  if (isHomeWin) {
    clarimBody += `Com bravura operária e fôlego de aço forjado nas oficinas, o ${match.homeClubName} conquistou os louros com raça inquebrantável. O povo comemora a dignidade esportiva que as elites tentam monopolizar!`;
  } else if (isAwayWin) {
    clarimBody += `Em peleja disputada, o ${match.awayClubName} fez prevalecer sua determinação. Que sirva de lição para os dirigentes manterem o pé no chão e o respeito aos homens de labuta!`;
  } else {
    clarimBody += `Ninguém cedeu um milímetro de terreno! Bravos homens do povo lutaram até o último apito do prélio, honrando o suor e a paixão dos bairros populares.`;
  }

  articles.push(
    Object.freeze({
      id: `art-clarim-${match.id}`,
      newspaperId: 'clarim',
      newspaperName: 'O Clarim Operário',
      mediaType: 'newspaper',
      date: match.date,
      category: 'match_report',
      headline: clarimHeadline,
      subheadline: clarimSub,
      bodyText: clarimBody,
      editorialTone: 'working_class',
      relatedClubIds: Object.freeze([match.homeClubId, match.awayClubId]),
      relatedMatchId: match.id,
    })
  );

  // 4. O Combate Esportivo (1922+: crónica ilustrada e polêmica)
  if (matchYear >= 1922) {
    const combateHeadline = isBlowout
      ? `Humilhação e Soberania: ${match.homeClubName} e ${match.awayClubName} em Dia de Choque!`
      : `Bastonadas Táticas e Fervor: O Termômetro do Duelo ${scoreText}`;
    const combateSub = `Nossa reportagem de campo desvenda as falhas da zaga e as decisões inflamadas do juiz.`;
    const combateBody = `O prélio foi digno dos anais do futebol moderno da capital. Os pontas avançaram sem piedade, expondo os zagueiros lentos ao ridículo das vaias da bancada. Quem esperava marasmo presenciou 90 minutos de sangue e pólvora esportiva.`;

    articles.push(
      Object.freeze({
        id: `art-combate-${match.id}`,
        newspaperId: 'combate',
        newspaperName: 'O Combate Esportivo',
        mediaType: 'newspaper',
        date: match.date,
        category: isDerby ? 'derby_headline' : 'match_report',
        headline: combateHeadline,
        subheadline: combateSub,
        bodyText: combateBody,
        editorialTone: 'polemic',
        relatedClubIds: Object.freeze([match.homeClubId, match.awayClubId]),
        relatedMatchId: match.id,
      })
    );
  }

  // 5. Rádio Inconfidência (1936+: Transmissão ao vivo pelo rádio)
  if (matchYear >= 1936) {
    const radioHeadline = `📻 [AO VIVO NO ÉTER] "Atenção Ouvintes de Toda Minas Gerais: Termina o Jogo em ${scoreText}!"`;
    const radioSub = `Transmissão esportiva direta da cabine de locução com a equipe campeã da Inconfidência.`;
    const radioBody = `(Vinheta musical da emissora toca ao fundo) "Alô ouvintes dos sertões e da capital! Vibram os alto-falantes nos botequins e nas praças! Apita o árbitro no círculo central! Final de prélio consagrador: ${match.homeClubName} ${scoreText} ${match.awayClubName}! Que tarde memorável para o desporto mineiro através das ondas de 880 quilociclos!"`;

    articles.push(
      Object.freeze({
        id: `art-radio-${match.id}`,
        newspaperId: 'radio_inconfidencia',
        newspaperName: 'Rádio Inconfidência (Ondas Médias)',
        mediaType: 'radio',
        date: match.date,
        category: isDerby ? 'derby_headline' : 'match_report',
        headline: radioHeadline,
        subheadline: radioSub,
        bodyText: radioBody,
        editorialTone: 'radio_broadcast',
        relatedClubIds: Object.freeze([match.homeClubId, match.awayClubId]),
        relatedMatchId: match.id,
      })
    );
  }

  // 6. Folha dos Esportes (1945+: Imprensa de massa)
  if (matchYear >= 1945) {
    const folhaHeadline = `MULTIDÃO EM DELÍRIO: ${match.homeClubName.toUpperCase()} ${scoreText} ${match.awayClubName.toUpperCase()}!`;
    const folhaSub = `Edição extraordinária de domingo com fotos exclusivas da peleja.`;
    const folhaBody = `Mais um capítulo monumental do futebol de Minas! Os refletores e as arquibancadas lotadas testemunharam uma tarde inesquecível de jogadas plásticas e paixão incontrolável. A cidade dorme respirando a repercussão deste placar de ${scoreText}.`;

    articles.push(
      Object.freeze({
        id: `art-folha-${match.id}`,
        newspaperId: 'folha',
        newspaperName: 'Folha dos Esportes',
        mediaType: 'newspaper',
        date: match.date,
        category: 'match_report',
        headline: folhaHeadline,
        subheadline: folhaSub,
        bodyText: folhaBody,
        editorialTone: 'enthusiastic',
        relatedClubIds: Object.freeze([match.homeClubId, match.awayClubId]),
        relatedMatchId: match.id,
      })
    );
  }

  return Object.freeze(articles);
}

/**
 * Generates a press article covering federation disciplinary tribunal sanctions.
 */
export function generateTribunalPressArticle(
  incident: Readonly<MatchIncidentEvent>,
  clubName: string,
  newspaperId: NewspaperId = 'gazeta'
): PressArticle {
  const targetNews = ALL_HISTORICAL_OUTLETS.find((n) => n.id === newspaperId) ?? ALL_HISTORICAL_OUTLETS[0];

  const fineSanction = incident.sanctions.find((s) => s.finePpu > 0 || (s as any).type === 'fine_ppu');
  const suspensionSanction = incident.sanctions.find((s) => s.stadiumBanMatches > 0 || (s as any).type === 'stadium_suspension_days');

  const fineText = fineSanction
    ? `${fineSanction.finePpu || (fineSanction as any).amount} PPU`
    : 'sem multa pecuniária';
  const suspText = suspensionSanction
    ? (suspensionSanction.stadiumBanMatches ? `${suspensionSanction.stadiumBanMatches} partidas` : `${(suspensionSanction as any).amount} dias`)
    : 'sem interdição de praça';

  let headline = `Tribunal de Penas: Sanções Severas Contra ${clubName}!`;
  let subheadline = `Incidentes graves no prélio motivaram julgamento sumário dos auditores federativos.`;
  let bodyText = `O Tribunal de Justiça Desportiva reuniu-se em sessão extraordinária para apreciar os fatos ocorridos no prélio. `;

  if (newspaperId === 'gazeta') {
    headline = `A Legalidade Mantida: Tribunal da Liga Sanciona ${clubName}`;
    subheadline = `A Federação zela pelo decoro moral e reprime os excessos da assistência.`;
    bodyText += `Diante do incidente de "${incident.title}", os magistrados desportivos aplicaram a pena de ${fineText} e suspensão de ${suspText}. A integridade dos estatutos não será vergada por arroubos passionais.`;
  } else if (newspaperId === 'clarim') {
    headline = `Injustiça Clamorosa no Tribunal da Liga Contra ${clubName}!`;
    subheadline = `Auditores palacianos impõem asfixia financeira e interdição ao clube!`;
    bodyText += `Mais uma vez a mão pesada dos figurões da capital pune com fúria os grêmios de raízes populares. Multa de ${fineText} e ${suspText} de estádio interditado provam que o compadrio teme a força das massas!`;
  } else if (newspaperId === 'radio_inconfidencia') {
    headline = `📻 [URGENTE NO PLANTÃO] "O Tribunal da Federação acaba de decretar punição a ${clubName}!"`;
    subheadline = `Plantão esportivo no éter traz em primeira mão as penas aplicadas aos envolvidos.`;
    bodyText = `Atenção ouvintes! Nossos microfones registraram o martelo da justiça bater: pena de ${fineText} e ${suspText} de interdição. Os dirigentes prometem recurso enquanto as torcidas protestam no centro da cidade!`;
  } else {
    headline = `Bancada de Penas da Federação Aplica ${fineText} e ${suspText} de Suspensão a ${clubName}!`;
    subheadline = `Reunião agitada na sede federativa selou o destino disciplinar do certame.`;
    bodyText += `O veredito provocou inflamada polêmica entre conselheiros e torcedores. Diante de "${incident.descriptionPt}", a autoridade impôs multa de ${fineText} e ${suspText} de praça interditada.`;
  }

  const primaryTargetClub = incident.sanctions[0]?.clubId ?? 'club-unknown';

  return Object.freeze({
    id: `art-tribunal-${incident.id}-${newspaperId}`,
    newspaperId,
    newspaperName: targetNews.name,
    mediaType: targetNews.mediaType,
    date: incident.date,
    category: 'tribunal_verdict',
    headline,
    subheadline,
    bodyText,
    editorialTone: newspaperId === 'clarim' ? 'working_class' : newspaperId === 'gazeta' ? 'conservative' : 'polemic',
    relatedClubIds: Object.freeze([primaryTargetClub]),
    relatedMatchId: incident.matchId,
  });
}

/**
 * Generates institutional, political, or election press articles.
 * Strictly deterministic ID without Date.now().
 */
export function generateGeneralPressArticle(input: {
  readonly newspaperId: NewspaperId;
  readonly date: Readonly<GameDate>;
  readonly category: PressCategory;
  readonly headline: string;
  readonly subheadline: string;
  readonly bodyText: string;
  readonly relatedClubIds: readonly string[];
  readonly sequenceIndex?: number;
}): PressArticle {
  const news = ALL_HISTORICAL_OUTLETS.find((n) => n.id === input.newspaperId) ?? ALL_HISTORICAL_OUTLETS[0];
  const seq = input.sequenceIndex ?? 1;
  const deterministicId = `art-gen-${input.newspaperId}-${input.date.year}${String(input.date.month).padStart(2, '0')}${String(input.date.day).padStart(2, '0')}-${seq}`;

  return Object.freeze({
    id: deterministicId,
    newspaperId: input.newspaperId,
    newspaperName: news.name,
    mediaType: news.mediaType,
    date: input.date,
    category: input.category,
    headline: input.headline,
    subheadline: input.subheadline,
    bodyText: input.bodyText,
    editorialTone:
      input.newspaperId === 'clarim'
        ? 'working_class'
        : input.newspaperId === 'gazeta'
        ? 'conservative'
        : input.newspaperId === 'radio_inconfidencia'
        ? 'radio_broadcast'
        : 'enthusiastic',
    relatedClubIds: Object.freeze([...input.relatedClubIds]),
  });
}

/**
 * Generates an institutional honor press release celebrating a club legend.
 */
export function generateHonorPressArticle(input: {
  readonly clubName: string;
  readonly clubId: string;
  readonly legendName: string;
  readonly honorTypeTitlePt: string;
  readonly date: Readonly<GameDate>;
  readonly newspaperId?: NewspaperId;
}): PressArticle {
  const chosenOutlet = input.newspaperId
    ? (ALL_HISTORICAL_OUTLETS.find((o) => o.id === input.newspaperId) ?? ALL_HISTORICAL_OUTLETS[0])
    : input.date.year >= 1936
    ? ALL_HISTORICAL_OUTLETS.find((o) => o.id === 'radio_inconfidencia')!
    : ALL_HISTORICAL_OUTLETS[0];

  const headline = chosenOutlet.mediaType === 'radio'
    ? `📻 [MEMÓRIA & GLÓRIA] "${input.clubName} Imortaliza ${input.legendName} com ${input.honorTypeTitlePt}!"`
    : `Imortalidade no Desporto: ${input.clubName} Consagra ${input.legendName}`;

  const subheadline = `O Conselho Deliberativo aprovou em sessão solene a honraria ao insigne benfeitor e ídolo da agremiação.`;

  const bodyText = chosenOutlet.mediaType === 'radio'
    ? `Atenção desportistas de toda a capital! Nossos microfones transmitem o clamor de justiça histórica que comove as hostes do ${input.clubName}: foi outorgado a ${input.legendName} a distinção de ${input.honorTypeTitlePt}. Uma salva de palmas reverente ecoa pelas ondas da Inconfidência!`
    : `Em reunião marcada por comovida exaltação cívica, os conselheiros e associados do ${input.clubName} conferiram a ${input.legendName} a nobre homenagem de "${input.honorTypeTitlePt}". Seu nome fica gravado para a posteridade nos anais e no coração da torcida mineira.`;

  return generateGeneralPressArticle({
    newspaperId: chosenOutlet.id,
    date: input.date,
    category: 'institutional_honor',
    headline,
    subheadline,
    bodyText,
    relatedClubIds: [input.clubId],
  });
}
