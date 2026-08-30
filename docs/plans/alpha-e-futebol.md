# Alpha E — Futebol

## Resultado

Atletas nascem da população, são descobertos, desenvolvem carreiras e disputam partidas coerentes com cada era. O sistema produz memória sem tentar reproduzir toda a complexidade de um Football Manager.

## Relação com o plano mestre

Macroetapas 18–21 e preparação para 22 e 30.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| E1 | `Footballer` sem overall único | Alpha D | Atributos tipados e serializáveis |
| E2 | Talento latente ligado ao nascimento | D4 | Nenhum adulto surge do nada |
| E3 | Descoberta e formação por era | E2 | Acesso, bairro e estrutura influenciam |
| E4 | Elenco, posições e disponibilidade | E1–E3 | Escalações sempre válidas |
| E5 | Treino, condição, moral e lesões | E4 | Cadências históricas aplicadas |
| E6 | Regras do futebol por era | A6 | Cartões/substituições não são anacrônicos |
| E7 | Match engine estatístico | E4–E6 | Placar nasce de eventos e inputs |
| E8 | Relatório e eventos memoráveis | E7 | Gols/finais/recordes entram no ledger |
| E9 | Mercado amador e informal | E4, Alpha C | Emprego, ajuda e gratificação representados |
| E10 | Pressão de profissionalização | E9 | Década de 1930 altera incentivos, não vencedor |
| E11 | Carreira, aposentadoria e pós-carreira | E1–E10 | Pessoa continua existindo após jogar |
| E12 | Simulação de 40 temporadas | E11 | Envelhecimento, renovação e resultados válidos |

## Testes obrigatórios

Distribuições por golden seeds, escalações válidas, regras de era, ausência de jogadores sem origem, reprodutibilidade de partidas e temporadas sem NaN.

## Não objetivos e riscos

Sem animação detalhada de partidas, scouting mundial ou transferências internacionais sofisticadas. O risco central é calibrar profundidade suficiente para memória sem tornar a simulação intratável.
