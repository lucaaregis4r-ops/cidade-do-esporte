# Próximas etapas prontas para execução

Atualizado em: 28/10/2026
Estado: **Alpha A, B, C, D, E e F CONCLUÍDOS; Macroetapas 1–22 CONCLUÍDAS. Alpha G é o próximo ciclo.**

Este documento lista os próximos pacotes em ordem de execução, com entradas, critério de aceitação e checagens aplicáveis. Serve de briefing imediato para qualquer agente que for iniciar um pacote.

**Antes de começar:** ler `AGENTS.md`, `docs/CONTEXTO.md`, `docs/PIPELINE.md` e `agents/HANDSHAKE.md`.

---

## Ciclo concluído — Alpha B (B1–B18) ✅

- B18 (Macroetapa 7 — exibição nominal honesta): **CONCLUÍDO** em 11/10/2026.
- A Macroetapa 7 e o Alpha B estão formalmente encerrados com 61 testes aprovados e compilação Next.js Webpack 100% verde.

---

## Próximo ciclo — Alpha C: Fundação e gestão do clube 🔲

**Dependência:** Alpha B concluído.
**Macroetapas:** 8 (Fundação), 9 (Terreno), 10 (Modelo do clube), 11 (Associados), 27 (Instalações), 28 (Patrimônio), 29 (Finanças).

### Pacotes concluídos do Alpha C ✅

- **C1: Contrato `Club` e serialização de dados** (11/10/2026): Modelo `ClubState` em `game/core/club/Club.ts`, `World` com `getClub()`/`setClub()`, envelope de save nativo `v25` e migração retrocompatível `v24→v25` (`club: null`). 159 testes verdes, build Next.js Webpack OK.
- **C2: 6 origens históricas e `FoundingGroup`** (12/10/2026): Modelo e gerador determinístico em `game/core/club/FoundingGroup.ts` com matrizes históricas (Ferroviários, Estudantes, Imigrantes, Trabalhadores, Comerciantes, Elite); ata inaugural formal citando fundadores reais; painel "Fundação (1910)" e etapas 6–8 no GameHUD; 145 testes vitest verdes, lint e build Webpack 100% OK.
- **C3–C5 (Sprint 1): Identidade, Escolha de Parcela e Contrato de Ocupação** (26/10/2026): Identidade visual determinística de 1910 (`ClubIdentity.ts`), componente SVG `CrestBadge.tsx` com 5 formas heráldicas e paletas canônicas; avaliação de viabilidade de parcelas e contratos de ocupação em 7 modalidades (`ClubLandContract.ts`); mutador `World.foundClubWithParcel`, inspeção enriquecida com `clubViability`/`clubOccupancy` no `inspectTile.ts` e integração no `TileInfoPanel` e `GameHUD`. 2.073 testes verdes (100%), lint zero erros e tipos estritos validados.
- **C6+C9+C10 (Sprint 2): Sede do Clube, Primeiras Instalações e Caixa/Finanças** (26/10/2026): Catálogo e ciclo de vida de instalações esportivas de 1910 (`ClubFacilities.ts`: campo de terra, tapume de madeira, vestiário, sede social, arquibancada, lampiões); livro-caixa de transações imutáveis (`ClubFinances.ts`); dedução periódica no `tick()` do `World` de aluguel do terreno e conservação patrimonial; ações no HUD para reparos e novas obras; exibição contábil no cabeçalho e abas dedicadas no `GameHUD`. 2.089 testes vitest verdes (121/121 arquivos), ESLint 100% limpo.
- **C7+C8 (Sprint 3): Quadro de Associados de 1910, Livro de Sócios e Arrecadação de Mensalidades** (26/10/2026): Modelo de associados (`ClubMembers.ts`) com categorias sociais (fundador, contribuinte, atleta, benemérito), jóias e mensalidades históricas; arrecadação mensal no ciclo do relógio creditando o livro-caixa (`ClubFinances.ts`); taxa de inadimplência determinística via `rng.club`; ação de admissão de novos sócios; aba "Quadro Social" no HUD com listagem, status e métricas. 2.097 testes vitest verdes (122/122 arquivos), ESLint 100% limpo.
- **C11+C12 (Sprint 4): Diretoria Estatutária de 1910, Painel Geral do Clube e Fechamento do Alpha C** (27/10/2026): Modelo da Diretoria Estatutária (`ClubBoard.ts`) com cargos executivos formais de 1910, mandatos temporais vinculados ao `HistoricalClock` (1910–1911), Conselho Deliberativo com 12 conselheiros, aba "Diretoria (1910)" no HUD e painel institucional unificado do clube de 1910. 2.102 testes vitest verdes (123/123 arquivos), ESLint 100% limpo. Ciclo Alpha C 100% concluído.

---

## Ciclo Concluído — Alpha C: Fundação e Gestão do Clube de 1910 ✅

- Todos os 4 Sprints do Alpha C foram integralmente concluídos com 2.102 testes automatizados aprovados e sem violações arquiteturais.
- O jogo conta com um ciclo de clube completo: identidade visual e heráldica, ata de fundação, aquisição e posse de praça de esportes em 7 contratos, instalações esportivas com decaimento/reforma, contabilidade em livro-caixa PPU com despesas de aluguel e manutenção, quadro de associados com admissão e arrecadação de mensalidades, e governança estatutária empossada.

---

## Próximo ciclo — Alpha D: Sociedade, Pessoas, Genealogia e Política do Clube 🔲

**Dependência:** Alpha C concluído.  
**Resultado:** O clube possui pessoas reais materializadas, famílias, genealogias, identidade social dinâmica, política interna e eleições.  
**Macroetapas cobertas:** 12 (Identidade social dinâmica), 13 (Pessoas e genealogias), 14 (Política e eleições).

### Pacotes planejados do Alpha D (D1–D9):

| ID | Pacote | Depende de | Critério visual |
|---|---|---|---|
| **D1** | Contrato `Person` com genealogia e bootstrap de 1910 | Alpha C | Fundadores têm pais e ascendência; genealogias existem antes de 1910 |
| **D2** | Emergência de pessoas materializadas | D1 | Pessoas aparecem no inspetor com biografia consistente |
| **D3** | Famílias e transmissão geracional | D1 | Árvore familiar navegável com datas e idades consistentes |
| **D4** | `SocialIdentity` dinâmica do clube | C2, D1 | Composição do clube muda com o tempo; afinidade por segmentos da cidade |
| **D5** | Camadas L0/L1/L2 de população | D1 | HUD mostra métricas urbanas por camada (agregada, coortes, materializada) |
| **D6** | `ClubPolitics` — estatuto e facções | C1, D2 | Facções emergem de interesses reais do clube |
| **D7** | Eleições com candidatos biografados | D6 | Tela de eleição com histórico real do candidato |
| **D8** | Presidência e efeitos no clube | D7 | Vitória eleitoral altera parâmetros e tolerâncias do clube |
| **D9** | Vertical: eleição completa com consequência | D1–D8 | Candidatos reais, facções, votação, resultado e impacto institucional |

---

### Proposta de Sprints para o Alpha D (Estratégia Ágil Biagente):

- **Sprint 1 (D1 + D2):** Pessoas de 1910, Genealogia Inicial e Emergência Materializada (L2). ✅ CONCLUÍDO (27/10/2026)
- **Sprint 2 (D3 + D4):** Árvore Familiar, Transmissão Geracional e Identidade Social Dinâmica (`SocialIdentity`). ✅ CONCLUÍDO (27/10/2026)
- **Sprint 3 (D5 + D6):** Camadas Populacionais L0/L1/L2 no HUD e Facções Políticas Internas (`ClubPolitics`). ✅ CONCLUÍDO (27/10/2026)
- **Sprint 4 (D7 + D8 + D9):** Processo Eleitoral Estatutário, Candidatos Biografados e Consequências de Mandato (Fechamento do Alpha D). ✅ CONCLUÍDO (27/10/2026)

---

## Ciclo Concluído — Alpha D: Sociedade, Pessoas, Genealogia e Política do Clube ✅

- Todos os 4 Sprints do Alpha D foram integralmente concluídos com 2.124 testes vitest verdes (128 arquivos) e sem violações de determinismo.
- O clube possui agora:
  1. Contrato `Person` e árvore genealógica de 1910 (`PersonRegistry.ts`) com transmissão geracional de paixão por futebol e lealdade ao clube;
  2. Identidade social dinâmica (`SocialIdentity.ts`) com 7 segmentos urbanos sem congelamento por origem;
  3. Demografia em 3 camadas (L0 agregada urbana, L1 coortes estatísticas, L2 indivíduos biografados);
  4. Facções políticas internas e ativas (`ClubPolitics.ts`) com níveis de lealdade e influência;
  5. Processo Eleitoral Estatutário (`ClubElections.ts`) com candidatos presidenciais biografados, 7 parâmetros canônicos de mandato (`PresidentProfile`), voto deliberativo do jogador e alternância de poder na Diretoria.

---

## Ciclo Concluído — Alpha E: Futebol: Jogadores, Atributos, Treinamento, Mercado e Motor 2-3-5 ✅

- Todos os 4 Sprints do Alpha E foram integralmente concluídos com 2.148 testes vitest verdes (133 arquivos) e sem violações de determinismo.
- O jogo conta agora com:
  1. Contrato `Footballer.ts` com posições da Pirâmide (2-3-5: GK, Backs, Halves, Forwards), atributos de época e respeito à regra de não usar overall único no motor;
  2. Emersão determinística de atletas da população materializada (Person L2) via stream `football` e esquadrão inaugural de 1910 com capitão e vice;
  3. Treinamento com 4 regimes de 1910 (`FootballTraining.ts`), modulação por instalações, desgaste físico, fadiga acumulada, lesões em semanas e envelhecimento biológico anual;
  4. Mercado amadorista de 1910 (`FootballMarket.ts`) com regimes de amadorismo puro vs assistido, estipêndios debitados no livro-caixa, convites a cidadãos locais, alternância titular/reserva e sondagens de rivais;
  5. Motor de partidas histórico (`MatchEngine.ts`) 2-3-5 por duelos posicionais de linhas, regras da época (`FootballRulesByEra.ts`: 0 substituições, arbitragem verbal sem cartões modernos, 2 pts por vitória), bilheteria e custos em PPU no livro-caixa contábil, crônica minuto a minuto, súmula oficial e notas individuais de atuação;
  6. Abas "Futebol & Elenco" e "Partidas (1910)" no `GameHUD`.

---

## Próximo ciclo — Alpha F: Ecossistema: Outros Clubes, IA Institucional e Competições 🔲

**Dependência:** Alpha E concluído.  
**Resultado:** O jogador não joga contra entidades artificiais sem passado — outros clubes nascem, competem, morrem; a federação emerge; campeonatos acontecem.  
**Macroetapas cobertas:** 15 (Outros clubes locais), 16 (Clubes regionais/interior), 17 (Federação e instituições), 22 (Competições).

### Pacotes planejados do Alpha F (F1–F9):

| ID | Pacote | Depende de | Critério visual |
|---|---|---|---|
| **F1** | `ClubBirthEngine` — outros clubes nascem organicamente | Alpha E | Mapa mostra novos clubes com data e causa de fundação |
| **F2** | `AIClubDirector` — IA toma decisões institucionais | F1 | Cada clube age diferente; não seguem estratégia ótima única |
| **F3** | Dissidências — clubes nascendo de clubes | F1 | Evento registrado no ledger dos dois clubes |
| **F4** | `RegionalClub` — clubes abstratos do interior | F1 | Visão regional com clubes, regiões e relações |
| **F5** | `FederationFormationEngine` — emergência institucional | F1–F2 | Timeline da formação entre ~1913–1917 |
| **F6** | `Federation` — estatuto, blocos, política federativa | F5 | Conflitos e cisões visíveis; dois campeões em anos de cisão |
| **F7** | `CompetitionGenerator` — formatos emergentes | F5–F6 | Primeira competição gerada; chave/tabela navegável |
| **F8** | Evolução competitiva 1910–1959 | F7 | Formato muda com época, número de clubes e federação |
| **F9** | Vertical "primeira temporada completa" | F1–F8 | Temporada com partidas, tabela, campeão e registros no ledger |

---

### Proposta de Sprints para o Alpha F (Estratégia Ágil Biagente):

- **Sprint 1 (F1 + F2):** Nascimento Orgânico de Clubes Locais (`ClubBirthEngine`) e IA Institucional Autônoma (`AIClubDirector`). ✅ CONCLUÍDO (28/10/2026)
- **Sprint 2 (F3 + F4):** Dissidências Clubísticas e Clubes Regionais de Minas Gerais (`RegionalClub`). ✅ CONCLUÍDO (28/10/2026)
- **Sprint 3 (F5 + F6):** Emergência da Federação Mineira (`FederationFormationEngine`) e Estrutura Política/Blocos (`Federation`). ✅ CONCLUÍDO (28/10/2026)
- **Sprint 4 (F7 + F8 + F9):** Gerador de Competições (`CompetitionGenerator`), Evolução 1910–1959 e Primeira Temporada Completa (Fechamento do Alpha F). ✅ CONCLUÍDO (28/10/2026)

---

## Ciclo Concluído — Alpha F: Ecossistema: Outros Clubes, IA Institucional e Competições ✅

- Todos os 4 Sprints do Alpha F foram integralmente concluídos com testes automatizados aprovados, sem violações arquiteturais e build Webpack com 9 rotas estáticas validado.
- O jogo conta agora com:
  1. Ecossistema clubístico vivo com nascimento orgânico de agremiações pioneiras e históricas (`ClubBirthEngine.ts`);
  2. Diretorias de IA autônomas com arquétipos comportamentais (`AIClubDirector.ts`);
  3. Cismas e dissidências clubísticas bilaterais (`ClubDissidenceEngine.ts`);
  4. Clubes Regionais de Minas Gerais em 7 regiões canônicas com cálculo de viagens ferroviárias em PPU (`RegionalClub.ts`);
  5. Fundação e dinâmica política da Federação Mineira LMDT e cisma histórico da AMEA (`FederationFormationEngine.ts` e `Federation.ts`);
  6. Competições oficiais com Algoritmo de Berger em turno único e turno/returno (`CompetitionGenerator.ts`), pontuação de época (2 pts vitória), desempate por playoff, premiação de troféus perpétuos (`CompetitionEngine.ts`), persistência no save v25 e aba dedicada '🏆 Competições' no `GameHUD.tsx`.

---

## Ciclo em Andamento — Alpha G: História, Rivalidades e Memória (Macroetapas 23–26, 30–34) 🔲

**Dependência:** Alpha F concluído.  
**Resultado:** Rivalidades profundas em 5 eixos causais, incidentes e Tribunal de Penas, torcida territorial por distritos, imprensa procedural de época, ídolos, tradições e ledger histórico de 50 anos.

### Pacotes e Sprints do Alpha G:

- **Sprint 1 (G1 + G2):** Matriz de Rivalidade Causal e Incidentes com Consequências Disciplinares (Macroetapas 23 e 24). ✅ **CONCLUÍDO (29/10/2026)**
  - *Evidência:* `RivalryRelationship.ts`, `MatchIncidents.ts`, multas em PPU deduzidas no livro-caixa, interdições e suspensões pelo Tribunal de Penas da LMDT, termômetro visual nos cards de clubes e badge de dérbi nos jogos da tabela. 132 testes vitest verdes, build Webpack 100% OK.
- **Sprint 2 (G3 + G4):** Torcida Territorial por Distritos Urbanos e Imprensa Procedural por Templates (Macroetapas 25 e 26). ✅ **CONCLUÍDO (29/10/2026)**
  - *Evidência:* `SupporterTerritory.ts` com modelo demográfico causal de torcida por distrito, reduto principal dominante, market share e cálculo de bilheteria amplificada por rivalidade e clássicos; `HistoricalPress.ts` com as 3 gazetas canônicas de 1910 (*A Gazeta Esportiva de Minas*, *O Diário da Manhã*, *O Clarim Operário*), crônicas pós-jogo, sentenças do Tribunal de Penas e fundação; persistência do save v25 com `pressArchive`; UI na aba 'Identidade Social' com detalhamento territorial por distrito e nova aba '📰 Imprensa (1910)' com visual de banca de jornais de época e filtros por jornal. 130 testes vitest verdes, zero Math.random(), build Webpack com 9 rotas estáticas aprovado.
- **Sprint 3 (G5 + G6 + G7):** Evolução da Imprensa 1910s→1950s (Jornal→Rádio), `LegacyScore` de Ídolos/Lendas e Homenagens Institucionais (Macroetapas 30 e 31). ✅ **CONCLUÍDO (30/10/2026)**
  - *Evidência:* `HistoricalPress.ts` com evolução das mídias pelas décadas e transmissões ao vivo da Rádio Inconfidência a partir dos anos 30; `LegacyScore.ts` com as 4 categorias canônicas (*MEMORAVEL*, *IDOLO*, *LENDA*, *FIGURA_FUNDADORA*) e decomposição causal de fatores; `InstitutionalHonors.ts` com proposição e votação política no Conselho Deliberativo sob responsabilidade orçamentária do caixa; integração no Core (`World.ts`), Engine (`GameSession.ts`), `GameCanvas.tsx`, `app/page.tsx` e nova aba dedicada '⭐ Lendas & Homenagens' no `GameHUD.tsx`. 19 testes vitest verdes, conformidade estrita com arquitetura sem Math.random(), build Webpack com 9 rotas estáticas validado com código 0.
- **Sprint 4 (G8 + G9 + G10 + G11):** Tradições, HistoricalLedger Causal, Arquivo do Clube e Replay de 50 anos (Macroetapas 32, 33 e 34). ✅ **CONCLUÍDO (30/10/2026)**
  - *Evidência:* `TraditionSystem.ts` com cálculo de força de tradição [0–100], alcunhas históricas, estádio e bairro tradicionais e rituais de época; `HistoricalLedger.ts` com grafo causal bidirecional de eventos (`causes` e `consequences`) e travessia recursiva `getCausalChain`; `ClubArchive.ts` consolidando as 11 seções de meio século e mapas comparáveis decenais (`CANONICAL_DECADE_MAPS`); integração total no Core (`World.ts`), Engine (`GameSession.ts`) e Shell React (`GameHUD.tsx` com a nova aba '📜 Arquivo dos 50 Anos (1910–1959)' com Timeline Causal interativa, Perfil de Tradições e Panorama Decenal). 26 testes verdes, zero Math.random() e build Next.js Webpack 100% aprovado. Ciclo Alpha G 100% concluído.

---

## Ciclo Concluído — Alpha G: História, Rivalidades e Memória ✅

- Todos os 4 Sprints do Alpha G foram integralmente concluídos com testes automatizados aprovados, sem violações arquiteturais e build Webpack com 9 rotas estáticas validado.
- O jogo conta agora com:
  1. Matriz de Rivalidade Causal em 5 eixos e Tribunal de Penas da LMDT com julgamentos disciplinares;
  2. Torcida territorializada pelos distritos urbanos de Cidade de Minas com redutos e amplificação de clássicos;
  3. Imprensa procedural de época evoluindo de gazetas de 1910 até as transmissões de rádio dos anos 30 e jornais de massa dos anos 40/50;
  4. Galeria de Lendas e Ídolos (`LegacyScore.ts`) e deliberação política de honrarias institucionais no Conselho;
  5. Perfil de Tradições Consagradas (`TraditionSystem.ts`);
  6. HistoricalLedger Causal com rastreamento bidirecional de causas e consequências (`HistoricalLedger.ts`);
  7. Arquivo de 50 Anos do Clube (`ClubArchive.ts`) e painel interativo de navegação histórica de meio século no HUD.

---

## Ciclo Concluído — Alpha H: Epílogo de 1959, Taça Brasil e Replay Headless Integral (Macroetapas 35 e 36) ✅

- Todos os 2 Sprints do Alpha H foram integralmente concluídos com testes automatizados aprovados, sem violações arquiteturais e build Webpack com 9 rotas estáticas validado.
- O jogo conta agora com:
  1. Rebranding Canônico: nome oficial **Tradição Esporte Clube** em toda a interface, layout, manifest, package.json e metadados;
  2. Catálogo de Clubes Nacionais de outros estados (`NationalAbstractClub.ts`) com os campeões históricos de 1959 (Santos, Bahia, Vasco, Grêmio, Sport, etc.);
  3. Qualificação mineira emergente pelo título estadual e Torneio Eliminatório Nacional por Zonas (`TacaBrasil1959.ts`) com jogos de ida e volta, semifinais e grande finalíssima;
  4. Relatório Jubilar dos 50 Anos (1910–1959) em `FiftyYearsReport.ts` consolidando de forma determinística e causal os 10 campos canônicos obrigatórios das Seções 9 e 14 do Plano Mestre;
  5. Encerramento digno e não destrutivo da campanha em 31/12/1959: o mundo, o mapa, o clube e todas as telas permanecem 100% consultáveis pelo jogador (sem Game Over destrutivo);
  6. Modal de Gala do Cinquentenário de Ouro no `GameHUD.tsx` com 6 abas temáticas e exportação em 1 clique do pacote reproduzível de replay (`DecisionLog` + seed).

---

## Próximo ciclo — Alpha I: Qualidade, Performance, Save Integral e Calibração Histórica (Macroetapas 37–41) 🔲

**Dependência:** Alpha H concluído.  
**Resultado:** Save integral versionado migrando sem perda entre todas as versões anteriores, garantia de performance para simulação de 50 anos em headless dentro do orçamento temporal, validação de estabilidade em suíte massiva de 100+ seeds, ferramentas completas de inspeção de estado e calibração de dados históricos com fontes explícitas.  
**Macroetapas cobertas:** 37 (Save versionado integral), 38 (Orçamento de performance), 39 (Testes de longa duração em 100+ seeds), 40 (Ferramentas de debug e time-travel), 41 (Pesquisa histórica como dado).

### Proposta de Sprints para o Alpha I:

- **Sprint 1 (I1 + I2 — Macroetapas 37 e 38):** Save Integral Versionado e Orçamento de Performance:
  - Envelope v26 com serialização canônica de todos os subsistemas acumulados nos Alphas A–H;
  - Testes de migração retrocompatível v19→v26, v22→v26 e v25→v26 sem perda de dados;
  - Otimização do loop e profiling de memória/ticks para simulação dos 50 anos (18.262 dias) respeitando os orçamentos do plano mestre.
- **Sprint 2 (I3 + I4 — Macroetapas 39 e 40):** Suíte Massiva de 100 Seeds e Ferramentas de Debug / DEV Mode:
  - Execução e verificação determinística de 100+ seeds completando 50 anos headless sem desvios, violações de integridade ou travamentos;
  - Console e inspetor de DEV mode com visualização de streams RNG, inspeção direta de tabelas e salto temporal / time-travel de depuração.
- **Sprint 3 (I5 — Macroetapa 41):** Calibração e Fontes Históricas:
  - Preenchimento rigoroso de referências bibliográficas, fontes primárias e hipóteses declaradas nos dados econômicos, demográficos e esportivos de 1910 a 1959.
