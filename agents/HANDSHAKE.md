# Protocolo de colaboração biagente

Atualizado em: 11/10/2026
Agentes ativos: **Antigravity** (Google Deepmind) · **GPT** (OpenAI)

Este documento governa como os dois agentes dividem o trabalho, comunicam estado e evitam conflitos. Leia junto com `AGENTS.md` (regras operacionais) e `docs/CONTEXTO.md` (estado verificado).

---

## Ordem de autoridade dentro deste protocolo

1. Pedido explícito atual do responsável.
2. `AGENTS.md` e `PLANO MESTRE DE IMPLEMENTAÇÃO.md` — regras canônicas.
3. `docs/CONTEXTO.md` — estado verificado.
4. Este `HANDSHAKE.md` — divisão de trabalho e protocolo de entrega.

---

## Princípio fundamental

**Um pacote por vez, um agente por vez.**

Nenhum agente inicia um pacote enquanto outro ainda não terminou e registrou evidência em `docs/CONTEXTO.md`. A janela de trabalho ativo de um agente é o pacote atual; a janela de revisão é o `HANDSHAKE.md` atualizado pelo agente que concluiu.

---

## Como iniciar um pacote

Antes de qualquer mudança, o agente que vai trabalhar deve:

1. Ler `AGENTS.md`, `PLANO MESTRE DE IMPLEMENTAÇÃO.md`, `docs/CONTEXTO.md` e `docs/PIPELINE.md` inteiros.
2. Confirmar que o estado do pacote anterior em `docs/CONTEXTO.md` é `CONCLUÍDO` com evidência.
3. Ler este `HANDSHAKE.md` e verificar que nenhum outro agente declarou estar `EM ANDAMENTO`.
4. Declarar início neste arquivo (seção "Turno atual") antes de escrever qualquer linha de código.

---

## Turno atual

| Campo | Valor |
|---|---|
| Agente | — |
| Pacote em andamento | Sprint 3 do Alpha I (I12: Validação de Regressão Integral de Saves v19 a v25 e Release Candidate Alpha 0.1) |
| Estado | AGUARDANDO INÍCIO |
| Iniciado em | — |
| Concluído em | — |
| Evidência | Aguardando início da validação de regressão de saves para fechamento do Alpha 0.1. |

---

## Último pacote concluído

| Campo | Valor |
|---|---|
| Agente | Antigravity (Google Deepmind) |
| Pacote | Texturas Dinâmicas por Época (1910–1959), Renderização do Campo/Estádio do Clube no Mapa e Conexão Urbana no HUD |
| Estado | CONCLUÍDO |
| Concluído em | 08/11/2026 |
| Evidência | (1) `game/render/CityInfrastructureRenderer.ts`: Renderização do campo oficial de futebol em 2.5D isométrico sobre a parcela da sede com gramado em faixas de corte de grama, marcações com cal branca (linhas laterais, divisória central, círculo central, grandes áreas e marcas de pênalti), traves 3D com redes isométricas, mastro alto com estandarte oficial nas cores primária e secundária do clube, arquibancadas que evoluem fisicamente pelas épocas (cerca de madeira rústica e banco em 1910 -> pavilhão de tábuas e cobertura nos anos 20 -> sede social de alvenaria nos anos 30 -> estádio de concreto armado com torres de refletores e torcida lotando as arquibancadas nos anos 40/50), e distintivo dourado flutuante; (2) `game/render/CityInfrastructureRenderer.ts`: Texturas dinâmicas de ruas que se transformam de 1910 a 1959 (macadame/terra batida nos anos 10 -> paralelepípedos e trilhos de bonde elétrico nos anos 20 -> pavimento de ardósia industrial nos anos 30 -> asfalto escuro com faixa central pintada nos anos 40 -> boulevards metropolitanos com divisor amarelo duplo nos anos 50); (3) `game/engine/GameSession.ts` e `app/components/GameCanvas.tsx`: Métodos `focusClubGround()` e `getClubGroundTile()` e ref `commandFocusClubGroundRef` para centralizar a câmera diretamente no estádio e selecionar a parcela; (4) `app/components/GameHUD.tsx` e `app/page.tsx`: Botão de acesso instantâneo `[ 📍 LOCALIZAR NOSSO CAMPO NO MAPA ]` com efeito sonoro e centralização imediata; (5) `game/render/CityInfrastructureRenderer.test.ts`: 4 testes unitários cobrindo o ciclo de renderização, avanço pelas 5 eras históricas, campo do clube e destruição; (6) 11/11 testes vitest verdes e build Next.js com Webpack gerando 9/9 rotas estáticas com 0 erros de compilação. |



---

## Regras de entrega

Ao **concluir** um pacote, o agente que trabalhou deve, no mesmo conjunto de mudanças:

1. Atualizar `docs/CONTEXTO.md` com estado CONCLUÍDO, evidência e última verificação.
2. Atualizar `docs/PIPELINE.md` se houver novo comando ou fluxo.
3. Atualizar `agents/VISUAL-AUDIT.md` marcando o critério visual do pacote como `VERIFICADO`.
4. Atualizar a tabela "Turno atual" deste arquivo para o próximo pacote, com estado `AGUARDANDO INÍCIO` e o agente vazio.
5. Executar as checagens do `docs/PIPELINE.md` e registrar resultados.

**Nenhum pacote muda para CONCLUÍDO sem evidência visual no jogo registrada neste fluxo.**

---

## Divisão de responsabilidades sugerida

Esta divisão é uma sugestão; o responsável pode redistribuir a qualquer momento.

| Domínio | Agente preferencial | Motivo |
|---|---|---|
| Arquitetura, testes e pipeline | Antigravity | Acesso direto ao workspace e comandos |
| Lógica de simulação histórica | Antigravity ou GPT | Ambos podem; quem receber o pacote decide |
| Interface React e inspetor | Antigravity | Pode rodar build e verificar visualmente |
| Pesquisa histórica (Macroetapa 41) | GPT ou ambos | Pesquisa documental; não exige acesso ao FS |
| Revisão de documentos canônicos | Qualquer um | Sempre com evidência; nunca inventar estado |

---

## Conflitos e lacunas

Se um agente encontrar:

- estado inconsistente entre `docs/CONTEXTO.md` e o código;
- lacuna material não coberta pelo plano;
- decisão que muda escopo ou arquitetura;

deve registrar a divergência em `docs/CONTEXTO.md` (campo Pendências ou Riscos) e **não preencher por suposição**. Aguardar decisão do responsável antes de avançar.

---

## Histórico de turnos

| Pacote | Agente | Concluído em | Evidência resumida |
|---|---|---|---|
| B1–B11 | Antigravity | 27/08/2026 | Fundação técnica Alpha B; testes aprovados |
| B12–B13 | Antigravity | 27/09/2026 | Cidade de 1910 na campanha; inspeção confirmada |
| B14 | Antigravity | 28/09/2026 | Crescimento anual visível; save v23 aprovado |
| B15 | Antigravity | 28/09/2026 | Transformação urbana visível; save v24 aprovado |
| B16 | Antigravity | 28/09/2026 | Inspetor de parcela com cadastro completo |
| B17 | Antigravity | 28/09/2026 | PPU explicável no inspetor; hipótese rotulada |
| Revisão visibilidade ME 1–5 | Antigravity | 28/09/2026 | Cidade dos Esportes; menus e câmera inicial |
| Reorganização `agents/` | Antigravity | 11/10/2026 | Pasta `agents/` criada; protocolo biagente estabelecido |
| B18 | Antigravity | 11/10/2026 | Exibição nominal honesta (Réis < 01/11/1942, Cruzeiros >= 01/11/1942); Macroetapa 7 e Alpha B concluídos |
| C1 | Antigravity | 11/10/2026 | Contrato ClubState tipado (`Club.ts`), integrado ao `World` e save `v25`; round-trip e migração `v24→v25` validados; 159 testes verdes; build Webpack OK. |
| C2 | Antigravity | 12/10/2026 | 6 origens históricas implementadas com matrizes de atributos/classes sociais em `FoundingGroup.ts`; gerador determinístico via `CampaignRng` (stream `club`); ata formal citando fundadores reais; painel &quot;Fundação (1910)&quot; e etapas 6–8 no GameHUD; 145 testes verdes; lint e build Next.js 100% OK. |
| C3–C5 (Sprint 1) | Antigravity | 26/10/2026 | Identidade visual de 1910 (paletas, nomes por origem, 5 formatos heráldicos e CrestBadge SVG), viabilidade de parcelas e contratos de ocupação em 7 modalidades (`ClubLandContract.ts`), integração com `World.foundClubWithParcel`, TileInfoPanel e GameHUD. 2.073 testes aprovados, lint 100% verde e tipos validados. |
| C6+C9+C10 (Sprint 2) | Antigravity | 26/10/2026 | Sede do clube, instalações de 1910 (`ClubFacilities.ts`) e livro-caixa contábil (`ClubFinances.ts`). Decaimento e reformas de instalações, balanço PPU, transações imutáveis e dedução mensal de manutenção/aluguel no ciclo do relógio. HUD com abas Geral, Instalações e Livro-Caixa; inspeção de instalações na sede. 2.089 testes vitest verdes (100%), lint 100% limpo. |
| C7+C8 (Sprint 3) | Antigravity | 26/10/2026 | Quadro de associados de 1910 (`ClubMembers.ts`), categorias sociais, valores de jóia e mensalidade por origem, arrecadação mensal automática no ciclo contábil do `World.tick()`, inadimplência determinística via `rng.club`, ação de admissão de novos sócios e aba "Quadro Social" no HUD. 2.097 testes vitest verdes (122/122 arquivos), lint 100% limpo. |
| C11+C12 (Sprint 4) | Antigravity | 27/10/2026 | Diretoria Estatutária de 1910 (`ClubBoard.ts`), 8 cargos formais, mandatos anuais (1910 a 1911), Conselho Deliberativo, persistência no save v25, aba "Diretoria (1910)" no HUD e painel unificado. 2.102 testes vitest verdes (123/123 arquivos), lint 100% limpo. Encerramento integral do Alpha C. |
| D1+D2 (Sprint 1) | Antigravity | 27/10/2026 | Contrato `Person` canônico em `game/core/person/Person.ts`, gerador determinístico de genealogias de 1910 via stream `population`, `PersonRegistry` gerenciando pessoas L2, bootstrap de fundadores e pais no `World.foundClubWithParcel`, serialização no save v25 e Inspetor de Pessoas L2 no `GameHUD.tsx`. 2.107 testes vitest verdes, lint 100% limpo. |
| D3+D4 (Sprint 2) | Antigravity | 27/10/2026 | Famílias completas (`FamilyTreeNode`, `getFamilyTree`) em `PersonRegistry.ts`, transmissão geracional de afinidade clubística (`clubAffinities`) em `Person.ts`, modelo de domínio `SocialIdentity.ts` dinâmico com 7 segmentos e distritos, evolução contínua no `World.tick()`, aba "Identidade Social" e navegação genealógica interativa no `GameHUD.tsx`. 2.114 testes vitest verdes, lint 100% limpo e build Webpack OK. |
| D5+D6 (Sprint 3) | Antigravity | 27/10/2026 | Demografia em 3 camadas (`PopulationLayers.ts`: L0 agregada urbana, L1 coortes estatísticas com ocupações/futebol e L2 materializada com pessoas reais) e Facções Políticas emergentes do clube (`ClubPolitics.ts` integrado ao `ClubState`); novo painel "Demografia (L0–L2)" e aba "Política & Facções" no HUD. 2.121 testes vitest verdes (127/127 arquivos), lint 100% limpo e build Webpack OK. |
| D7–D9 (Sprint 4) | Antigravity | 27/10/2026 | Processo Eleitoral Estatutário (`ClubElections.ts`) com apuração proporcional ponderada pelas facções ativas e voto do jogador; candidatos presidenciais biografados com 7 variáveis canônicas (`PresidentProfile`); posse do novo presidente na Diretoria com alívio de tensão e histórico de pleitos; interface eleitoral no `GameHUD` e `GameCanvas`. 2.124 testes vitest verdes (128/128 arquivos), lint 100% limpo e build Webpack OK. Encerramento integral do Alpha D. |
| E1+E2 (Sprint 1) | Antigravity | 27/10/2026 | Contrato de jogador `Footballer.ts` com atributos técnicos, físicos e mentais (sem overall único no motor), posições históricas da Pirâmide (2-3-5: Guardião, Zagueiros, Médios e Linha de Frente); emersão de atletas da população materializada (Person L2) via stream `football`; esquadrão inaugural de 1910 com titulares, reservas, capitão e vice; nova aba "Futebol & Elenco" no `GameHUD`. 2.127 testes vitest verdes (129 arquivos), lint 100% limpo e build Webpack OK. |
| E3+E4 (Sprint 2) | Antigravity | 27/10/2026 | Rotinas de treino amador de 1910 (`FootballTraining.ts`) com 4 regimes históricos (Bate-bola livre, Ensaio 2-3-5, Calistenia e Coletivo 1º vs 2º Quadro); modulação por praça de esportes (vestiário acelera recuperação de fadiga, campo de terra amplia técnica e risco); desgaste físico, fadiga acumulada e boletim médico com lesões em semanas; envelhecimento anual com declínio biológico veterano e maturação juvenil; controles interativos e boletim médico no HUD. 2.134 testes vitest verdes (130 arquivos), lint e build Webpack 100% OK. |
| E5+E6 (Sprint 3) | Antigravity | 28/10/2026 | Mercado de jogadores amadoristas de 1910 (`FootballMarket.ts`), políticas do clube (`strict_amateur` vs `assisted_amateur` com auxílio de bonde, chuteiras e bicho), dedução contábil mensal de estipêndios no livro-caixa, convites a cidadãos locais (Person L2), dispensa de atletas, alternância entre titular e reserva, sondagens mensais de rivais históricos (América, Villa Nova, Yale, etc.) e controles completos na UI. 2.141 testes vitest verdes (131/131 arquivos), lint 100% limpo e build Webpack OK. |
| E7–E10 (Sprint 4) | Antigravity | 28/10/2026 | Motor de Partidas Histórico (`MatchEngine.ts`) 2-3-5 sem overall único resolvendo duelos posicionais; regras da época (`FootballRulesByEra.ts`: 0 substituições, arbitragem verbal, impedimento clássico, 2 pts por vitória); festivais e amistosos de 1910 com bilheteria e custos operacionais no livro-caixa PPU; crônica minuto a minuto, súmula oficial, notas de atuação, desgaste físico e lesões; aba "Partidas (1910)" no HUD. 2.148 testes vitest verdes (133/133 arquivos), lint 100% limpo e build Webpack com 9 rotas estáticas OK. Encerramento integral do Alpha E. |
| F1+F2 (Sprint 1) | Antigravity | 28/10/2026 | Ecossistema clubístico de Cidade de Minas com nascimento procedural e orgânico de clubes rivais (`ClubBirthEngine.ts`), 5 agremiações pioneiras de 1910, avaliação anual de fundações históricas (América 1912, União Operária 1914, Palestra 1918, Sete de Setembro 1921), diretoria de IA autônoma (`AIClubDirector.ts`) com 5 arquétipos e tomada de decisões mensais (mensalidades, caixa, obras, desafios), persistência no save v25 e aba dedicada "Outros Clubes (1910)" no GameHUD com desafio a amistosos. 2.158 testes vitest verdes (136/136 arquivos), lint 100% limpo e build Webpack com 9 rotas aprovado. Macroetapa 15 concluída. |
| F3+F4 (Sprint 2) | Antigravity | 28/10/2026 | Dissidências e cismas históricos (`ClubDissidenceEngine.ts`) com 5 causas canônicas, registro histórico bilateral obrigatório no ledger e rivalidade inicial aguda; Clubes Regionais de Minas Gerais (`RegionalClub.ts`) nas 7 regiões canônicas (Central, Zona da Mata, Sul, Triângulo, Oeste, Norte, Vale), cálculo de horas e custos de viagem ferroviária em PPU (`calculateRailwayTravelCostPpu`), estádios, torcidas e atitudes; persistência no save v25 e visualização com sub-abas Capital vs Interior Mineiro no GameHUD com desafio a prélio intermunicipal. 2.170 testes vitest verdes (139 arquivos), lint 100% limpo e build Next.js com 9 rotas aprovado. Macroetapas 15 e 16 concluídas. |
| F5+F6 (Sprint 3) | Antigravity | 28/10/2026 | Emergência formal da Liga Mineira de Desportos Terrestres (LMDT) em 1915 (`FederationFormationEngine.ts`), contrato institucional `Federation.ts`, estatuto canônico de 1915 (voto, amadorismo estrito, campo cercado obrigatório, tribunal de penas), presidência bienal com plataforma e conquistas, blocos de poder (Bancada Aristocrática vs Frente Popular/Interior), cisma histórico da AMEA em 1916 com campeonato paralelo e posterior reunificação com pacto de paz. Persistência no save v25, eventos na InterruptionQueue e visualização rica no GameHUD com sub-aba 'Federação Mineira (LMDT)'. 2.178 testes vitest verdes (142 arquivos), architecture.test.ts 100% verde e build Webpack com 9 rotas estáticas aprovado. Macroetapa 17 concluída. |
| F7–F9 (Sprint 4) | Antigravity | 28/10/2026 | Competições oficiais da Federação e Taças Municipais/Estaduais (`Competition.ts`, `CompetitionGenerator.ts`, `CompetitionEngine.ts`), Algoritmo de Berger em turno único (1910–1914) e turno/returno (1915+), cisma de 1916 (LMDT + AMEA paralelos), pontuação clássica (2 pts vitória, 1 pt empate), Match de Desempate (playoff) na liderança, premiação de troféus perpétuos (`ClubTrophy`) expostos na sala de troféus do clube e nos marcos dos clubes locais, persistência no save v25 em `mapSerialization.ts`, aba '🏆 Competições' no HUD com tabela oficial, confrontos da rodada e botão de disputar prélio. 44 testes do módulo de futebol/competições e save v25 verdes, build Webpack 100% OK com 9 rotas estáticas. Encerramento integral do ciclo Alpha F. |
| G1+G2 (Sprint 1) | Antigravity | 29/10/2026 | Matriz de Rivalidade Causal em 5 eixos (`RivalryRelationship.ts`), intensidade contínua [0, 100], 4 tiers históricos (`friendly`, `traditional`, `fierce`, `deadly_derby`), geração autêntica de nomes de clássicos e evolução causal; Incidentes de jogo e consequências disciplinares duras (`MatchIncidents.ts`) com julgamentos pelo Tribunal de Penas da Federação LMDT aplicando multas em PPU deduzidas no livro-caixa, perda de mando e suspensão de atletas ("violência sem benefício"); integração no `World.ts`, `ClubFinances.ts` (`fine_tribunal`), save v25, `GameCanvas`, `page.tsx` e `GameHUD` com termômetro visual de rivalidade nos cards de clubes e badge de dérbi nos jogos da tabela. 132 testes vitest verdes, conformidade estrita com arquitetura sem Math.random(), build Webpack 100% OK. Macroetapas 23 e 24 concluídas. |
| G3+G4 (Sprint 2) | Antigravity | 29/10/2026 | Torcida territorial por distritos urbanos (`SupporterTerritory.ts`) com redutos dominantes, market share por bairro, fanatismo e bilheteria amplificada por clássicos (+80%); Imprensa procedural de época (`HistoricalPress.ts`) com as 3 gazetas canônicas de 1910 (A Gazeta Esportiva de Minas, O Diário da Manhã, O Clarim Operário), crônicas pós-jogo, sentenças do Tribunal e fundação; save v25 atualizado com `pressArchive`; UI com detalhamento territorial na aba 'Identidade Social' e banca de jornais de época na nova aba '📰 Imprensa (1910)'. 130 testes vitest verdes, zero Math.random(), build Webpack com 9 rotas aprovado. Macroetapas 25 e 26 concluídas. |
| G5+G6+G7 (Sprint 3) | Antigravity | 30/10/2026 | Evolução da Imprensa 1910s→1950s (`HistoricalPress.ts` com gazetas, crônica ilustrada nos anos 20, Rádio Inconfidência ao vivo nos anos 30 e imprensa diária nos anos 40/50); Modelo puro de legado de atletas e dirigentes `LegacyScore.ts` nas 4 categorias canônicas (MEMORAVEL, IDOLO, LENDA, FIGURA_FUNDADORA) com pontuação analítica por dedicação, títulos, jogos, fidelidade e impacto patrimonial; Sistema de deliberação política de homenagens institucionais `InstitutionalHonors.ts` (estátua, busto, setor de estádio, benemérito) votado pelo Conselho Deliberativo sob responsabilidade fiscal e forças de facções; integração ao Core (`World.ts`), Engine (`GameSession.ts`), `GameCanvas.tsx`, `page.tsx` e nova aba '⭐ Lendas & Homenagens' no `GameHUD.tsx`. 19 testes vitest verdes, arquitetura estrita sem Math.random(), build Webpack Next.js com 9 rotas estáticas validado com código 0. Macroetapas 30 e 31 concluídas. |
| G8–G11 (Sprint 4) | Antigravity | 30/10/2026 | Tradições Sagradas (`TraditionSystem.ts`), HistoricalLedger Causal bidirecional (`HistoricalLedger.ts`), Arquivo Histórico de 50 Anos (`ClubArchive.ts`), aba '📜 Arquivo dos 50 Anos' no GameHUD com Timeline Causal, Perfil de Tradições e Panorama Decenal. 26 testes verdes, zero Math.random(), build Webpack OK. Encerramento integral do Alpha G. |
| H1–H3 (Sprint 1) | Antigravity | 30/10/2026 | Taça Brasil de 1959 da CBD, Clubes Nacionais Históricos (`NationalAbstractClub.ts`), Qualificação Estadual Causal e Torneio Eliminatório Nacional por Zonas (`TacaBrasil1959.ts`), Rebranding Canônico do Projeto para "Tradição Esporte Clube" (layout, HUD, manifest, icon SVG, package.json, symlinks). 14 testes verdes, zero Math.random(), build Webpack com 9 rotas estáticas aprovado. |
| H4+H5 (Sprint 2) | Antigravity | 30/10/2026 | Relatório Jubilar dos 50 Anos 1910–1959 (`FiftyYearsReport.ts`) com os 10 campos canônicos obrigatórios das Seções 9 e 14 do Plano Mestre, encerramento digno e não destrutivo da campanha em 31/12/1959 com estado 100% consultável pelo jogador, modal solene de gala no GameHUD com 6 abas temáticas e exportação do replay JSON (`reproducible-replay.json`). 11 testes verdes, zero Math.random(), build Webpack OK. Encerramento integral do ciclo Alpha H e das Macroetapas 35 e 36. |

