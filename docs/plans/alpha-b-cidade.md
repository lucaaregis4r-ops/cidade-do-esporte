# Alpha B — Cidade autônoma

## Resultado

Uma Cidade de Minas fictícia, pequena em 1910, cresce e envelhece autonomamente até 1959. O jogador observa e escolhe terrenos, mas não administra a prefeitura.

## Relação com o plano mestre

Macroetapas 4, 5, 6 e 7; snapshots da Macroetapa 34 e níveis de abstração da 38.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| B1 | Contrato `CityState` e dados por era | Alpha A | Tipos e invariantes testados |
| B2 | Terreno, água e relevo procedural | B1 | Mesma seed gera mesmo mapa |
| B3 | Centro, ferrovia, vias e instituições de 1910 | B2 | Cidade inicial plausível e compacta |
| B4 | Distritos, população, empregos e centralidade | B3 | Totais fecham sem NaN |
| B5 | Parcelas e propriedade | B3 | Mapa particionado; biografia preservada |
| B6 | `HistoricalEconomy` em PPU | A6, B1 | Conversão nominal separada do valor real |
| B7 | Valor da terra e overlays | B4–B6 | Cálculo explicável e inspecionável |
| B8 | `CityGrowthDirector` | B4–B7 | Cidade cresce sem comandos municipais do jogador |
| B9 | Envelhecimento, demolição e novas centralidades | B8 | Cidade transforma, não apenas expande |
| B10 | Snapshots 1910/20/30/40/50/59 | B8–B9 | Comparação serializável e visualizável |
| B11 | Simulação headless 50 anos | B10 | Faixas estatísticas e determinismo aprovados |

## Testes obrigatórios

Golden seeds para geração e crescimento; propriedades de parcelas; valores finitos; comparação entre execuções; prova de que nenhuma ação municipal é exposta ao jogador.

## Não objetivos e riscos

Sem clube completo, cidadão individual, outras cidades gráficas, reprodução de Belo Horizonte ou editor urbano. Calibração econômica exige fontes e o desempenho deve ser medido antes de aumentar granularidade.
