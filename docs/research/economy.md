# Pesquisa econômica

## Estado

A série de custo de vida ainda não foi calibrada. `game/data/history/economic-index.json` registra essa ausência explicitamente; não há índices numéricos de 1910–1959, base PPU ou preços históricos no dataset de produção. As cinco entradas de teste em `HistoricalEconomy.test.ts` são sintéticas e não representam a história brasileira.

## Padrão monetário

| Valor | Ano/período | Fonte | Interpretação | Limitação |
|---|---|---|---|---|
| Cr$ 1,00 = Rs 1$000 (1.000 réis) | Decreto-lei de 1942; referência monetária aplicável de 01/11/1942 a 31/12/1959 | [Decreto-lei nº 4.791, de 5/10/1942](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del4791.htm); [Síntese dos Padrões Monetários Brasileiros, Banco Central](https://www.bcb.gov.br/content/acessoinformacao/museudocs/pub/SintesePadroesMonetariosBrasileiros.pdf) | Lei institui o Cruzeiro, define correspondência ao mil-réis e determina referências à nova moeda a partir de 01/11/1942. O BCB lista o período e a paridade. | O decreto permitiu uso simultâneo de réis e cruzeiros durante a transição. A exibição canônica do jogo segue o corte de novembro do plano; a paridade nominal não converte poder de compra. O BCB adverte que seus exemplos de conversão não corrigem valores nem representam poder de compra. |

## Índices de poder de compra

Pendente de pesquisa conforme Macroetapa 41:

- índices mensais de custo de vida, com base temporal e metodologia explícitas;
- indicadores de salários/poder de compra para comparação e calibração;
- dados a partir de 1940 e tratamento da introdução do salário mínimo;
- fontes por observação, cobertura, revisões e limitações regionais.

A API `HistoricalEconomy` aceita somente observações mensais com uma ou mais `HistoricalReference`s. Não interpola meses ausentes, não extrapola fora da série e não produz valor nominal sem o índice do mês consultado. `baseNominalReisPerPpu` também é obrigatório e precisa ser uma decisão calibrada; não há valor padrão fictício.

## Escopo econômico ainda não implementado

Salários, mensalidades, obras, jogadores, viagens, manutenção, receitas, inflação e equivalentes em reais modernos dependem de dados e regras futuras. O PPU é a unidade interna estável; a conversão de exibição é uma camada separada.
