# Alpha G — História, rivalidades e memória

## Resultado

A simulação explica sua própria história: acontecimentos possuem causas e consequências, rivalidades emergem, imprensa repercute e pessoas, patrimônios e tradições permanecem consultáveis.

## Relação com o plano mestre

Macroetapas 23–26 e 30–35, com `HistoricalLedger` como infraestrutura transversal.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| G1 | Contrato e índices do `HistoricalLedger` | Alphas A–F | Referências válidas e consultas eficientes |
| G2 | Cadeias de causa e consequência | G1 | Eventos relevantes apontam antecedentes |
| G3 | Relações de rivalidade multidimensionais | F11, G1 | Nenhuma rivalidade nasce por sorteio |
| G4 | Incidentes e clássicos | G3 | Consequências reais; violência sem recompensa |
| G5 | Torcida separada de associados | D5, F4 | Afinidade familiar/social não determinística |
| G6 | Imprensa por templates e eras | G1–G5 | Toda pessoa/clube citado existe |
| G7 | Legacy de pessoas | E11, G1 | Memória deriva de carreira e momentos |
| G8 | Homenagens e oposição política | G7, D9 | Propostas têm contexto e votação |
| G9 | Tradições e versões | C3, G1 | Nomes/escudos/estádios antigos preservados |
| G10 | Arquivo e timeline 1910–1959 | G1–G9 | História navegável por entidades e data |
| G11 | Mapas e comparação histórica | B10, G10 | 1910 ↔ 1959 legível e impactante |
| G12 | Interface integrada ao mapa | G10–G11 | Informação física não vira dashboard solto |

## Testes obrigatórios

Integridade referencial do ledger, causalidade sem ciclos inválidos, decaimento sem apagar memória, templates sem entidades fantasmas e snapshots históricos reproduzíveis.

## Não objetivos e riscos

Sem LLM online ou texto que invente fatos. O maior risco é explosão de volume; eventos precisam de importância, índices e políticas de retenção.
