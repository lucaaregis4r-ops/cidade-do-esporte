/**
 * ClubArchive domain model (Alpha G: G10 & G11 / Macroetapas 34 e fechamento do Alpha G).
 * Consolidates the complete 50-year searchable historical archive of the club (1910–1959).
 *
 * CANONICAL SECTIONS:
 * 1. História (timeline causal & marcos do HistoricalLedger)
 * 2. Presidentes (mandatos, chapas eleitorais e biografias)
 * 3. Elencos (quadros de atletas pelas eras)
 * 4. Lendas (galeria de imortais, LegacyScore e homenagens)
 * 5. Títulos (sala de troféus com finais e datas)
 * 6. Rivalidades (dérbis, termômetro e retrospecto H2H)
 * 7. Estádios (evolução patrimonial de campo a estádio)
 * 8. Escudos (linha evolutiva heráldica)
 * 9. Famílias (árvores genealógicas e fidelidade clubística)
 * 10. Finanças históricas (balanço acumulado em PPU e moedas de época)
 * 11. Mapas comparáveis (marcos temporais da cidade: 1910, 1920, 1930, 1940, 1950, 1959)
 */

import type { ClubState, CrestVersion } from './Club';
import type { ClubTraditionProfile } from './TraditionSystem';
import type { HistoricalLedgerState, HistoricalEvent } from './HistoricalLedger';
import type { ClubLegend } from './LegacyScore';
import type { InstitutionalHonorProposal } from './InstitutionalHonors';
import type { ClubTrophy } from '../football/Competition';
import type { RivalryRelationship } from '../football/RivalryRelationship';

export interface DecadeUrbanSummary {
  readonly year: number;
  readonly eraLabel: string;
  readonly populationEstimate: number;
  readonly districtCount: number;
  readonly summaryPt: string;
}

export interface ClubArchiveData {
  readonly clubId: string;
  readonly clubName: string;
  readonly foundationYear: number;
  readonly currentYear: number;
  readonly tradition: Readonly<ClubTraditionProfile>;
  readonly timeline: readonly HistoricalEvent[];
  readonly presidentsHistory: readonly {
    readonly id: string;
    readonly name: string;
    readonly termPt: string;
    readonly occupation: string;
    readonly socialClass: string;
  }[];
  readonly legends: readonly ClubLegend[];
  readonly honors: readonly InstitutionalHonorProposal[];
  readonly trophies: readonly ClubTrophy[];
  readonly rivalries: readonly RivalryRelationship[];
  readonly facilitiesHistory: readonly {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    readonly condition: number;
  }[];
  readonly crestHistory: readonly CrestVersion[];
  readonly financialSummary: {
    readonly balancePPU: number;
    readonly totalIncomePPU: number;
    readonly totalExpensesPPU: number;
    readonly transactionCount: number;
  };
  readonly comparativeMaps: readonly DecadeUrbanSummary[];
}

export const CANONICAL_DECADE_MAPS: readonly DecadeUrbanSummary[] = Object.freeze([
  {
    year: 1910,
    eraLabel: '1910: A Fundação Pioneira',
    populationEstimate: 35000,
    districtCount: 6,
    summaryPt: 'Cidade recém-inaugurada. Vias de terra batida, iluminação a lampiões de gás e primeiros campos de futebol amador nos arrabaldes da Estação e do Barro Preto.',
  },
  {
    year: 1920,
    eraLabel: '1920: A Consolidação Urbana',
    populationEstimate: 58000,
    districtCount: 8,
    summaryPt: 'Expansão dos bondes elétricos, consolidação do comércio central e surgimento das primeiras praças de esportes com cercamento e bilheteria formal.',
  },
  {
    year: 1930,
    eraLabel: '1930: A Era do Rádio e Modernização',
    populationEstimate: 120000,
    districtCount: 11,
    summaryPt: 'Início da industrialização fabril, advento da Rádio Inconfidência e primeiras arquibancadas de madeira apinhadas de torcedores operários e estudantes.',
  },
  {
    year: 1940,
    eraLabel: '1940: O Crescimento Metropolitano',
    populationEstimate: 210000,
    districtCount: 15,
    summaryPt: 'Reforma monetária (Cruzeiros), abertura de grandes avenidas radiais, estádios de concreto armado e clássicos atraindo multidões recordes.',
  },
  {
    year: 1950,
    eraLabel: '1950: A Metrópole em Marcha',
    populationEstimate: 360000,
    districtCount: 20,
    summaryPt: 'Ano da Copa do Mundo no Brasil. Cidade dos Esportes fervilha com o futebol moderno, iluminação por refletores e profissionalismo pleno.',
  },
  {
    year: 1959,
    eraLabel: '1959: O Cinquentenário de Ouro',
    populationEstimate: 520000,
    districtCount: 24,
    summaryPt: 'Consagração de meio século de história. Clubes consolidados como gigantes do desporto mineiro e entrada na Taça Brasil nacional.',
  },
]);

/**
 * Builds the comprehensive 50-year club archive from the current campaign state.
 */
export function buildClubArchive(input: {
  readonly club: Readonly<ClubState>;
  readonly tradition: Readonly<ClubTraditionProfile>;
  readonly historicalLedger: Readonly<HistoricalLedgerState>;
  readonly legends: readonly ClubLegend[];
  readonly honors: readonly InstitutionalHonorProposal[];
  readonly rivalries: readonly RivalryRelationship[];
  readonly currentYear: number;
}): ClubArchiveData {
  const presidentsHistory = (input.club.board?.members ?? [])
    .filter((m) => m.role === 'presidente')
    .map((p) => ({
      id: p.id,
      name: p.name,
      termPt: `${p.termStart.year}–${p.termEnd.year}`,
      occupation: p.occupation,
      socialClass: p.socialClass,
    }));

  const facilitiesHistory = (input.club.facilityDetails ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    category: f.type,
    condition: f.condition,
  }));

  const finances = input.club.finances;
  const financialSummary = {
    balancePPU: finances?.balancePPU ?? 0,
    totalIncomePPU: finances?.totalIncomePPU ?? 0,
    totalExpensesPPU: finances?.totalExpensesPPU ?? 0,
    transactionCount: finances?.transactions.length ?? 0,
  };

  return Object.freeze({
    clubId: input.club.id,
    clubName: input.club.name,
    foundationYear: input.club.foundingDate.year,
    currentYear: input.currentYear,
    tradition: input.tradition,
    timeline: input.historicalLedger.events,
    presidentsHistory: Object.freeze(presidentsHistory),
    legends: Object.freeze([...input.legends]),
    honors: Object.freeze([...input.honors]),
    trophies: input.club.trophies ? Object.freeze([...input.club.trophies]) : Object.freeze([]),
    rivalries: Object.freeze([...input.rivalries]),
    facilitiesHistory: Object.freeze(facilitiesHistory),
    crestHistory: Object.freeze([...input.club.crestHistory]),
    financialSummary,
    comparativeMaps: CANONICAL_DECADE_MAPS,
  });
}
