# Alpha F — Ecossistema de clubes e federação

## Resultado

O jogador participa de um mundo em que clubes locais nascem por causas sociais, clubes regionais sustentam o estadual e instituições/competições evoluem conforme pressão sistêmica.

## Relação com o plano mestre

Macroetapas 15–17 e 22.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| F1 | `ClubBirthEngine` | Alphas B–D | Toda fundação referencia causas válidas |
| F2 | Dissidências, fusões e desaparecimentos | F1 | Histórias ligadas nos clubes envolvidos |
| F3 | `AIClubDirector` | Alpha C, E | Estratégias variam por administração |
| F4 | Clubes locais profundamente simulados | F1–F3 | Mesmo modelo causal essencial do jogador |
| F5 | `RegionalClub` agregado | Alpha E | Interior viabiliza competição sem mapa gráfico |
| F6 | Pressão de formação institucional | F1, F5 | Janela histórica influencia, não fixa a data |
| F7 | Federação, estatutos e blocos | F6 | Fundadores e dirigentes existem |
| F8 | Cisões e reconciliações federativas | F7 | Títulos simultâneos são preservados |
| F9 | `CompetitionGenerator` | F4–F8 | Formato deriva de clubes, custos e época |
| F10 | Calendário local/estadual evolutivo | F9 | Amistosos precedem estruturas maduras |
| F11 | Ecossistema 1910–1959 | F1–F10 | Nenhum clube domina todas as seeds |

## Testes obrigatórios

Integridade causal de fundações, IA com perfis distintos, competições fechando tabelas, federação emergindo em faixa plausível e ausência de campeões/rivais hardcoded.

## Não objetivos

Outras cidades graficamente profundas, federação moderna pronta em 1910 ou formato fixo de Campeonato Mineiro.
