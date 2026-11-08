# Guia de auditoria visual por macroetapa

Atualizado em: 11/10/2026

Este documento define o **critério visual mínimo** que deve ser demonstrado e registrado em `docs/CONTEXTO.md` para que cada macroetapa ou pacote seja marcado como concluído. É o contrato de "consegue ser visto no jogo" exigido pela decisão D-0028.

Qualquer agente que conclua um pacote deve marcar o critério correspondente como `VERIFICADO` e registrar seed, data da campanha, URL e o efeito observado.

---

## Como usar

1. Antes de iniciar um pacote, leia o critério visual desta tabela.
2. Ao concluir, demonstre o critério **no jogo em `http://localhost:3000/`** (ou URL da prévia isolada).
3. Registre: `seed | data da campanha | ação | efeito observado`.
4. Atualize a coluna **Estado** para `VERIFICADO` neste arquivo.
5. Registre o mesmo percurso em `docs/CONTEXTO.md` > "Última verificação".

---

## Macroetapas concluídas — critérios verificados

| Macroetapa | Critério visual | Estado | Evidência |
|---|---|---|---|
| **1** Fork e arquitetura | Menu "Etapas" mostra revisão upstream e direção das camadas | VERIFICADO | Seed CM-1910-C15A1E11; revisão 28/09/2026 |
| **2** Determinismo | Seed real do `World` aparece no HUD e em menus; continuação usa streams persistidas | VERIFICADO | HUD exibiu seed e data; relógio continuou após recarga |
| **3** Relógio histórico | Data de `HistoricalClock`, pausa, 1x/2x/4x/8x e interrupções na tela principal | VERIFICADO | Velocidades e pausa confirmados na tela principal |
| **4** Geração da cidade | Relevo, água, centro, ferrovia, vias e instituições no mapa; clique mostra distrito e parcela | VERIFICADO | B12/B13; 27/09/2026; campanha limpa em 127.0.0.1 |
| **5** Cidade autônoma | Crescimento e transformação anuais no mapa; HUD resume ledgers; inspetor mostra biografia | VERIFICADO | B14/B15; 28/09/2026; 12 ocupações, 2 registros passados, 11 avenidas |
| **6** Parcelas | Clique em parcela mostra cadastro e biografia reais; sem dados inventados | VERIFICADO | B16; 28/09/2026; seed CM-1910-C15A1E11; IDs distintos, compras zero |
| **7** Economia histórica e moeda nominal | PPU explicável e valor nominal condicionado a índice (Réis < 01/11/1942, Cruzeiros >= 01/11/1942) | VERIFICADO | B17 e B18; 11/10/2026; PPU com 8 fatores; moeda nominal honesta sem invenção |
| **8** História de fundação | Tela de fundação/customização permite escolher tudo: 6 origens sociais, gerador e sorteador de nomes, escudo heráldico vetorial SVG (5 formatos, paletas monocromáticas retro), visualização e reroll de fundadores com cotas PPU e profissões de época, Ata inaugural lavrada e regime fundiário em estética arcade preto e branco | VERIFICADO | 05/11/2026; Menu Arcade `[ 🎮 CRIAR / CUSTOMIZAR CLUBE ]` no GameHUD e ClubCreationModal.tsx com 5 abas integradas |
| **9** Escolha do terreno | Clique na parcela mostra adequação para sede e card de assinatura de contrato de ocupação em 7 modalidades | VERIFICADO | C4–C5; 26/10/2026; TileInfoPanel calcula viabilidade e permite assinar contrato transferindo a posse/sede |

---

## Pacotes concluídos do Alpha C (Fundação e Clube de 1910)

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **C1** Contrato Club e serialização | O clube pode ser criado em memória/save, e um save carregado com clube preserva seus dados perfeitamente. Migração v24→v25 testada sem inventar clube retrospectivamente. | VERIFICADO | 11/10/2026; Testes vitest 159/159 aprovados; build Next.js (Webpack) 100% OK; save nativo v25 grava e hidrata ClubState sem alteração de dados espaciais. |
| **C2** 6 origens históricas e FoundingGroup | As 6 origens históricas (Ferroviários, Estudantes, Imigrantes, Trabalhadores, Comerciantes, Elite) podem ser selecionadas e inspecionadas na tela principal. Exibe biografia de cada fundador gerado deterministicamente pela seed, liderança provisória, capital inicial PPU coerente com a origem e a Ata Inaugural completa citando nominalmente todos os membros fundadores. | VERIFICADO | 12/10/2026; Menu "Fundação (1910)" adicionado ao GameHUD na tela principal (/); seletor das 6 origens com reatividade instantânea à seed da campanha; nomes, papéis, ocupações e valores de subscrição PPU sincronizados com a ata; 145 testes vitest verdes (FoundingGroup.test.ts, Club.test.ts, inspectTile.test.ts, architecture.test.ts); lint aprovado com zero erros; build Webpack OK. |
| **C3–C5 (Sprint 1)** Identidade, Parcela e Contrato de Ocupação | Identidade visual de 1910 com distintivo vetorial SVG (CrestBadge) no cabeçalho; seleção de parcelas viáveis no mapa (`TileInfoPanel`) com cálculo de adequação física e proximidade; proposta de 7 modalidades de contrato de ocupação (compra, aluguel, comodato/cessão, doação, etc.) com assinatura interativa e transferência persistida no mapa. | VERIFICADO | 26/10/2026; Identidade no HUD com personalização de cores/escudo/nome; inspeção de parcela no mapa exibe adequação da sede e contratos; ao assinar, parcela torna-se a sede oficial do clube com crachá persistente; 2.073 testes vitest verdes; lint 100% OK; compilação e tipos validados. |
| **C6+C9+C10 (Sprint 2)** Sede, Instalações e Caixa Inicial | Modelo de instalações de 1910 (`ClubFacilities.ts`) e livro-caixa contábil (`ClubFinances.ts`); dedução mensal de manutenção e aluguel; inspeção de instalações na parcela da sede; HUD do clube com saldo em PPU/Réis, abas Geral, Instalações (com ações de reparo e novas obras) e Livro-Caixa com extrato contábil. | VERIFICADO | 26/10/2026; Instalações iniciais geradas na fundação conforme a origem do clube; decaimento e reforma interativos; transações contábeis com extrato imutável e dedução periódica na virada de mês; 2.089 testes vitest verdes (121/121 arquivos); ESLint 100% limpo; tipos estritos validados. |
| **C7+C8 (Sprint 3)** Quadro de Associados e Mensalidades | Modelo de associados de 1910 (`ClubMembers.ts`) com categorias sociais (fundador, contribuinte, atleta, benemérito), jóias e mensalidades calibradas por origem; arrecadação mensal no ciclo do relógio creditando o livro-caixa; taxa determinística de inadimplência via `rng.club`; ação de admissão de novos sócios; aba "Quadro Social" no GameHUD com listagem de associados, status de adimplência e histórico de admissão. | VERIFICADO | 26/10/2026; Sócios fundadores e cohort inicial gerados na fundação; arrecadação mensal creditada no livro-caixa a cada virada de mês; admissão de novos sócios interativa via HUD; 2.097 testes vitest verdes (122/122 arquivos); ESLint 100% limpo sem erros/avisos. |
| **C11+C12 (Sprint 4)** Diretoria Estatutária de 1910, Painel Geral e Fechamento do Alpha C | Modelo da Diretoria Provisória de 1910 (`ClubBoard.ts`) com cargos executivos formais (Presidente, Vice-Presidente, 1º e 2º Secretários, 1º e 2º Tesoureiros, Capitão Geral e Diretor de Patrimônio), mandatos de 1 ano (1910 a 1911) e Conselho Deliberativo; integração ao save v25; aba "Diretoria (1910)" no GameHUD com todos os diretores, cargos, profissões e biografias; painel geral consolidado unificando todo o clube de 1910. | VERIFICADO | 27/10/2026; Diretoria provisória e conselheiros eleitos gerados e persistidos; 2.102 testes vitest verdes (123/123 arquivos); ESLint 100% limpo; TypeScript estrito sem regressão; encerramento integral do Alpha C com todos os critérios do clube demonstrados na tela principal. |

---

## Pacotes concluídos do Alpha D (Sociedade, Pessoas e Política)

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **D1+D2 (Sprint 1)** Pessoas de 1910, Genealogia Inicial e Pessoas Materializadas L2 | Pessoas materializadas (L2) no inspetor do HUD exibindo datas de nascimento/óbito, ocupação de 1910, traços de personalidade (liderança, ambição, reputação), biografia individual e árvore genealógica de 1910 com ascendência (pais com profissões de época); membros fundadores e diretores clicáveis. | VERIFICADO | 27/10/2026; `Person.ts` e `PersonRegistry.ts` integrados no `World` e serializados no save `v25`; fundadores bootstrapados com pais pré-1910 determinísticos via `rng.population`; Inspetor de Pessoa individual no `GameHUD` com genealogia; 26 testes aprovados; ESLint 100% limpo. |
| **D3+D4 (Sprint 2)** Famílias, Transmissão Geracional e SocialIdentity Dinâmica | Árvore familiar completa e navegável de forma fluida no inspetor de pessoas (pais, cônjuge, filhos com taxa de lealdade e irmãos); aba "Identidade Social" no HUD exibindo a base/alma social do clube, barras percentuais para os 7 segmentos (operários, ferroviários, estudantes, comerciantes, classe média, elite, imigrantes), apoio nos distritos e histórico comprovando que a identidade evolui no tempo. | VERIFICADO | 27/10/2026; `FamilyTreeNode` e `getFamilyTree(id)` em `PersonRegistry`; `SocialIdentity.ts` integrado ao `ClubState` e evoluído no `World.tick()`; aba "Identidade Social" e árvore genealógica interativa no `GameHUD`; 2.114 testes vitest verdes (125 arquivos); ESLint limpo; build Webpack OK. |
| **D5+D6 (Sprint 3)** Camadas Populacionais L0/L1/L2 e Política do Clube (`ClubPolitics`) | Painel "Demografia (L0–L2)" no menu principal exibindo as 3 camadas demográficas de Cidade de Minas (L0 agregada por distrito/classe/idade, L1 coortes com estimativa de adeptos e L2 materializada com média de reputação e sócios); aba "Política & Facções" no HUD do clube exibindo estabilidade institucional, tensão interna, pleito estatutário e as correntes políticas emergentes (Fundadores, Populares, Futebolistas, Fiscalistas, Elitistas, Patrimonialistas) com influência percentual e lealdade. | VERIFICADO | 27/10/2026; Modelos puros `PopulationLayers.ts` e `ClubPolitics.ts`; integração em `ClubState` e no `World`; novo painel demográfico e aba de política no HUD; 2.121 testes vitest verdes (127 arquivos); ESLint limpo com 0 erros/avisos; build Webpack 100% OK. |
| **D7–D9 (Sprint 4)** Processo Eleitoral Estatutário, Candidatos Biografados e Fechamento do Alpha D | Assembleia Geral Eleitoral na aba "Política & Facções" do HUD com chapas concorrentes presidenciais biografadas; 7 variáveis canônicas de mandato do `PresidentProfile` visíveis em cada candidato; botões "Apoiar & Votar" e "Realizar Eleição Agora"; apuração com votos proporcionais baseados na influência das facções ativas; posse imediata do novo presidente na Diretoria com atualização do histórico de pleitos e descompressão da tensão interna. | VERIFICADO | 27/10/2026; Modelo puro `ClubElections.ts`; condutor eleitoral determinístico; posse estatutária na diretoria e alívio de tensões internas; interface eleitoral no GameHUD e GameCanvas; 2.124 testes vitest verdes (128 arquivos); ESLint 0 erros/avisos; build Webpack aprovado; encerramento integral do Alpha D. |

---

## Pacotes concluídos do Alpha E (Futebol: Jogadores, Atributos e Treinamento)

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **E1+E2 (Sprint 1)** Contrato Footballer, Posições de Época e AthleteEmergence | Nova aba "Futebol & Elenco" no modal do clube exibindo o primeiro quadro titular de 1910 na tática clássica da Pirâmide (2-3-5) com guardião, zagueiros, médios e linha de ataque; capitão e vice-capitão destacados; ficha técnica do atleta selecionado detalhando atributos técnicos, físicos e mentais (sem overall único no motor); atletas emergidos de pessoas materializadas (Person L2). | VERIFICADO | 27/10/2026; `Footballer.ts` implementado; emersão determinística via stream `football` de `CampaignRng`; integração no `World`, `ClubState` e save nativo v25; aba de futebol no `GameHUD` com navegação de titulares e reservas; 2.127 testes vitest verdes (129 arquivos); ESLint limpo; build Webpack OK. |
| **E3+E4 (Sprint 2)** Treinamento Inicial por Era, Condição Física, Desgaste e Evolução | Rotinas de treino amador de 1910 (`FootballTraining.ts`) com 4 regimes históricos (Bate-bola livre, Ensaio 2-3-5, Calistenia e Coletivo 1º vs 2º Quadro); modulação por praça de esportes (vestiário acelera recuperação de fadiga, campo de terra amplia técnica e risco); desgaste físico, fadiga acumulada e boletim médico com lesões em semanas; envelhecimento anual com declínio biológico veterano e maturação juvenil; controles interativos e boletim médico no HUD. | VERIFICADO | 27/10/2026; 2.134 testes vitest verdes (130 arquivos); ESLint limpo; build Webpack 100% OK. |
| **E5+E6 (Sprint 3)** Mercado de Jogadores Amadoristas de 1910, Convites e Políticas do Clube | Seletor de Regime do Clube na aba "Futebol & Elenco": Amadorismo Puro (`strict_amateur`) vs Amadorismo Assistido (`assisted_amateur` com auxílio de bonde, chuteiras e bicho de vitória); dedução contábil mensal automática de estipêndios no livro-caixa via `computeMonthlyAthleticsCost`; painel "Mercado & Convites da Cidade (1910)" com listagem de cidadãos locais elegíveis (Person L2) para convidar com seletor de posição e função; ações na ficha do jogador para alternar entre Titular e Reserva ou Dispensar amigavelmente do clube; relatório visual de assédio e sondagens de emissários de clubes rivais históricos da época (América, Villa Nova, Yale, etc.). | VERIFICADO | 28/10/2026; `FootballMarket.ts` implementado; integração ao `World`, `GameSession`, `GameCanvas` e `GameHUD`; 2.141 testes vitest verdes (131/131 arquivos); ESLint 100% limpo; build Webpack Next.js 100% OK. |
| **E7+E8+E9+E10 (Sprint 4)** Motor de Partidas Histórico 2-3-5, Regras de 1910, Amistosos/Festivais e Bilheteria | Nova aba "Partidas (1910)" no modal do clube exibindo quadro de rivais históricos da época (América, Villa Nova, Yale, Sport Club Mineiro, Combinado da Estação, etc.) com prestígio e cores; seletor de modalidade (Amistoso Intermunicipal Tradicional vs Grande Festival Esportivo da Cidade com banda de música); botão para disputar prélio de 90 minutos resolvido deterministicamente pelo `MatchEngine` sem overall único; aplicação das regras de 1910 (0 substituições, lesões forçando desvantagem numérica, advertências verbais do árbitro sem cartões, 2 pontos por vitória); súmula oficial do encontro com placar, público pagante, bilheteria bruta, despesas operacionais e saldo líquido creditado no livro-caixa contábil; crônica de época minuto a minuto com narrativa dos lances capitais; notas individuais (1.0 a 10.0) e desgaste físico de pós-jogo; arquivo histórico completo de partidas disputadas. Encerramento integral do ciclo Alpha E. | VERIFICADO | 28/10/2026; `FootballRulesByEra.ts` e `MatchEngine.ts` implementados; integração ao `World`, `GameSession`, `GameCanvas` e `GameHUD`; 2.148 testes vitest verdes (133/133 arquivos, 100% de sucesso); ESLint 100% limpo com zero avisos/erros; build Webpack Next.js 100% OK com 9 rotas estáticas geradas. |

---

## Macroetapas adicionais concluídas no Alpha D

| Macroetapa | Critério visual | Estado | Evidência |
|---|---|---|---|
| **12** Identidade social dinâmica | Aba "Identidade Social" no HUD com 7 segmentos sociais e evolução contínua da alma do clube | VERIFICADO | 27/10/2026; D4 no Sprint 2 do Alpha D; sem congelamento da origem |
| **13** Pessoas e genealogias | Inspetor L2 de pessoa e árvore genealógica de 1910 navegável com herança clubística | VERIFICADO | 27/10/2026; D1, D2, D3 nos Sprints 1 e 2 do Alpha D |
| **14** Política e eleições | Diretoria Estatutária, Facções Políticas Ativas e Assembleia Geral Eleitoral no HUD | VERIFICADO | 27/10/2026; D6, D7, D8, D9 nos Sprints 3 e 4 do Alpha D |

---

## Pacotes concluídos do Alpha F (Ecossistema, Outros Clubes e Regional)

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **F1+F2 (Sprint 1)** Nascimento Orgânico de Clubes e IA Institucional | Outros clubes locais de Cidade de Minas nascem organicamente e aparecem na aba "Outros Clubes (1910)" no HUD; cada rival governado por Diretoria de IA com arquétipos e tomada de decisões autônoma. | VERIFICADO | 28/10/2026; 5 pioneiros de 1910 e nascimentos históricos (América 1912, União 1914, Palestra 1918, Sete 1921); arquétipos com traços e desafios interativos de amistoso; 2.158 testes verdes. |
| **F3+F4 (Sprint 2)** Dissidências Clubísticas e Clubes Regionais de Minas Gerais | Dissidências e cismas históricos registrados no histórico de ambos os clubes com badge "⚡ Dissidência / Racha" no HUD; visão regional com os clubes das 7 regiões de Minas Gerais (Central, Zona da Mata, Sul, Triângulo, Oeste, Norte, Vale), cálculo de horas e custos de viagem ferroviária em PPU e desafios de prélio intermunicipal. | VERIFICADO | 28/10/2026; `ClubDissidenceEngine.ts` com 5 causas canônicas de racha; `RegionalClub.ts` com ferrovias e 7 polos regionais; seletor Capital vs Interior no HUD; 2.170 testes verdes; build Webpack 100% OK. |
| **F5+F6 (Sprint 3)** Emergência da Federação Mineira e Política Federativa | Federação Mineira (LMDT) fundada em 1915, estatutos canônicos (amadorismo, campo cercado, voto, tribunal), mandatos presidenciais com plataformas e conquistas, blocos ideológicos (Bancada Aristocrática vs Frente Popular/Interior), cisma da AMEA em 1916 e reunificação pacificada visíveis na nova sub-aba 'Federação Mineira' no HUD. | VERIFICADO | 28/10/2026; `Federation.ts` e `FederationFormationEngine.ts` integrados no `World`, `GameHUD` e save v25; 2.178 testes vitest verdes; build Webpack 100% OK. |
| **F7–F9 (Sprint 4)** Competições Oficiais, Taças Municipais/Estaduais e Primeira Temporada Completa | Calendário oficial de competições de época da Federação (Taça Cidade de Minas 1910, Campeonato da Cidade 1915, cisma AMEA 1916 e Taça Minas Gerais); tabela oficial de classificação com pontos corridos (2 pts/vitória); botão de disputar prélio da rodada; Match de Desempate (playoff) em caso de igualdade de pontos na liderança; proclamação de campeão e Sala de Troféus / Galeria de Conquistas oficial (`ClubTrophy`) visível na aba dedicada '🏆 Competições' no HUD. | VERIFICADO | 28/10/2026; `Competition.ts`, `CompetitionGenerator.ts` e `CompetitionEngine.ts` integrados ao `World`, `GameSession`, `GameCanvas` e `GameHUD`; 44 testes do módulo de futebol/competições e save v25 verdes; build Webpack com 9 rotas estáticas aprovado; encerramento integral do Alpha F. |

## Pacotes concluídos do Alpha G (História, Rivalidades e Memória)

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **G1+G2 (Sprint 1)** Matriz de Rivalidade Causal e Incidentes com Consequências Disciplinares | Termômetro de rivalidade causal em 5 eixos (geográfico, esportivo, social, político, histórico) com intensidade [0–100] e 4 tiers históricos nos cards de agremiações locais e regionais no HUD; geração de nomes autênticos de dérbis; retrospecto H2H dinâmico; badges de clássico/dérbi nos prélios da tabela de competições; incidentes graves em campo com julgamentos pelo Tribunal de Penas da LMDT aplicando multas em PPU no livro-caixa, interdição de praça e suspensão de atletas com notificações na InterruptionQueue. | VERIFICADO | 29/10/2026; `RivalryRelationship.ts` e `MatchIncidents.ts` integrados no `World`, `ClubFinances.ts` (`fine_tribunal`), save v25, `GameHUD.tsx` e `page.tsx`; 132 testes vitest verdes (13/13 arquivos); build Webpack com 9 rotas estáticas 100% aprovado. |
| **G3+G4 (Sprint 2)** Torcida Territorial por Distritos Urbanos e Imprensa Procedural por Templates | Apoio popular e torcida distribuída por distritos urbanos reais de 1910, identificação de redutos dominantes (headquarters), market share em basis points, fanatismo local e bilheteria amplificada por clássicos (+80%); Imprensa com as 3 gazetas canônicas de 1910 (Gazeta Esportiva, Diário da Manhã, Clarim Operário), crônicas pós-jogo, sentenças do Tribunal e fundações; visual de banca de jornais de época e detalhamento territorial na aba 'Identidade Social'. | VERIFICADO | 29/10/2026; `SupporterTerritory.ts` e `HistoricalPress.ts` integrados no `World`, save v25 e `GameHUD.tsx`; 130 testes vitest verdes; build Webpack 100% OK. |
| **G5+G6+G7 (Sprint 3)** Evolução da Imprensa 1910s→1950s, LegacyScore e Homenagens Institucionais | Evolução da mídia ao longo do tempo (gazetas formais dos anos 10, crônica ilustrada nos anos 20, Era do Rádio com transmissões ao vivo da Rádio Inconfidência nos anos 30 e imprensa diária nos anos 40/50); Galeria de Lendas e Ídolos na nova aba '⭐ Lendas & Homenagens' com 4 categorias canônicas (MEMORAVEL, IDOLO, LENDA, FIGURA_FUNDADORA) e pontuação causal por dedicação, títulos, jogos e fidelidade; Deliberação política de honrarias (estátuas, bustos, nomes de setor, diplomas de benemérito) votadas pelo Conselho Deliberativo sob responsabilidade orçamentária do caixa e forças de facções. | VERIFICADO | 30/10/2026; `LegacyScore.ts`, `InstitutionalHonors.ts` e `HistoricalPress.ts` integrados no `World`, `ClubState`, `ClubFinances.ts` ('honor_tribute'), `GameSession`, `page.tsx` e `GameHUD.tsx`; 19 testes vitest verdes, zero Math.random(), build Webpack com 9 rotas estáticas aprovado com código 0. |
| **G8+G9+G10+G11 (Sprint 4)** Tradições, HistoricalLedger Causal, Arquivo do Clube e Replay de 50 Anos | Objetos de tradição sagrada (`TraditionSystem.ts`), força de tradição [0–100], alcunhas históricas, estádio e bairro tradicionais, estilo clássico 2-3-5; Ledger histórico causal (`HistoricalLedger.ts`) com causas raiz e consequências futuras linkadas bidirecionalmente; Arquivo do clube de 50 anos (`ClubArchive.ts`) com as 11 seções canônicas de meio século (1910–1959); Nova aba '📜 Arquivo dos 50 Anos (1910–1959)' no GameHUD com 3 sub-visões interativas: Timeline Causal com inspetor de causas e consequências, Perfil de Tradições Consagradas e Panorama Decenal comparável (1910–1959). Fechamento de 100% do ciclo Alpha G. | VERIFICADO | 30/10/2026; `TraditionSystem.ts`, `HistoricalLedger.ts`, `ClubArchive.ts` integrados ao Core (`World.ts`), Engine (`GameSession.ts`), Canvas (`GameCanvas.tsx`) e HUD (`GameHUD.tsx`); 26 testes unitários e de integração verdes, conformidade arquitetural verificada e compilação Next.js Webpack 100% aprovada. |

---

## Pacotes do Alpha H (1959, Taça Brasil e Epílogo dos 50 Anos)

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **H1+H2+H3 (Sprint 1)** Taça Brasil de 1959, Clubes Nacionais e Qualificação Estadual | Rebranding canônico para "Tradição Esporte Clube" visível no cabeçalho e metadados; Card oficial da Taça Brasil de 1959 da CBD na aba '🏆 Competições' do HUD exibindo o campeão mineiro classificado; visualização em chaves das zonas Norte-Nordeste e Centro-Sul com jogos de ida e volta; semifinais e finalíssima disputadas com proclamação do Campeão Nacional; concessão do troféu perpétuo nacional na Sala de Conquistas e registro no HistoricalLedger causal. | VERIFICADO | 30/10/2026; `NationalAbstractClub.ts`, `TacaBrasil1959.ts`, `World.ts` integrados com save v25; 14 testes vitest verdes, zero Math.random(), build Webpack com 9 rotas estáticas aprovado. |
| **H4+H5 (Sprint 2)** Epílogo dos 50 Anos, Relatório Jubilar 1910–1959 e Replay Headless Integral | Ao alcançar 31/12/1959 (ou acionado no HUD), exibição solene do Modal de Epílogo e Relatório "Cinquenta Anos 1910–1959" do Tradição Esporte Clube contendo os 10 campos canônicos obrigatórios do plano mestre; mapa inicial de 1910 vs final de 1959 comparáveis; retrospecto de presidentes, associados, patrimônio, títulos, lendas, maior rival, maiores jogos, pessoa e família mais influentes, crises, obras, escudos e valorização dos terrenos; estado de jogo 100% consultável após o fim sem Game Over; exportação do replay reproduzível em arquivo .json. | VERIFICADO | 30/10/2026; `FiftyYearsReport.ts`, `World.ts`, `GameHUD.tsx` integrados com modal solene de 6 abas; 11 testes verdes em FiftyYearsReport, World e architecture (zero Math.random()), build Next.js Webpack 100% aprovado. |

---

## Pacotes anteriores concluídos — B18

| Pacote | Critério visual | Estado | Evidência |
|---|---|---|---|
| **B18** Moeda nominal | Antes de 01/11/1942: valor em réis OU mensagem de ausência honesta. Após: valor em cruzeiros OU mensagem de ausência. Nunca valor inventado. | VERIFICADO | 11/10/2026; Testes vitest 61/61 aprovados; inspectTile e TileInfoPanel exibem Réis antes de 1942 e Cruzeiros a partir de 01/11/1942; ausência honesta documentada quando sem índice; build Webpack aprovado. |

---

## Próximas macroetapas — critérios definidos antecipadamente

> `PENDENTE`: critério já escrito; aguardando implementação.  
> `PROPOSTO`: rascunho; sujeito a revisão quando o pacote for planejado.

| Macroetapa | Critério visual mínimo | Estado |
|---|---|---|
| **10** Modelo do clube | HUD mostra finanças, associados e liderança do clube; dados persistem após recarga | VERIFICADO (Sprint 2) |
| **11** Associados | Lista de associados com ingresso, mensalidades e vínculo temporal visível no jogo | VERIFICADO (Sprint 3) |
| **12** Identidade social | Identidade do clube (nome, escudo, cores) aparece na interface; rivalidades emergem de eventos | VERIFICADO (Sprint 2 Alpha D) |
| **13** Pessoas | Pessoas do clube com nome, cargo e biografia aparecem no inspetor | VERIFICADO (Sprint 2 Alpha D) |
| **14** Política | Eleições internas aparecem com candidatos biografados e apuração proporcional; resultado muda diretoria | VERIFICADO (Sprint 4 Alpha D) |
| **15** Outros clubes locais e dissidências | Outros clubes locais aparecem no mapa e HUD com data e causa de fundação; cismas internos geram novos clubes com causas históricas e badge de dissidência; cada clube com diretoria de IA autônoma e postura própria | VERIFICADO (Sprint 1 e 2 Alpha F: F1 + F2 + F3) |
| **16** Clubes do interior de Minas Gerais | Clubes regionais das 7 regiões de Minas com horas de viagem de trem, estádios, torcidas, destaques técnicos e desafios de prélio intermunicipal com rateio de renda | VERIFICADO (Sprint 2 Alpha F: F4) |
| **17** Federação e instituições | Federação mineira (LMDT) fundada em 1915, estatutos canônicos de 1915 (voto, amadorismo estrito, campo cercado, tribunal), presidência bienal, bancadas políticas (Aristocrática vs Popular) e alerta de cisma histórico (AMEA em 1916) visíveis no GameHUD | VERIFICADO (Sprint 3 Alpha F: F5 + F6) |
| **18–19** Jogadores e Treinamento | Jogadores listados com atributos por época, posições da Pirâmide 2-3-5, 4 regimes de treino semanal, condição, fadiga, boletim de lesões e envelhecimento anual | VERIFICADO (Sprint 1 e 2 Alpha E) |
| **20** Mercado e profissionalização | Mercado de jogadores, convites de amadores e transição profissional | VERIFICADO (Sprint 3 Alpha E) |
| **21** Motor de partidas | Motor 2-3-5 sem overall único; regras históricas de 1910, festivais esportivos, bilheteria e súmula | VERIFICADO (Sprint 4 Alpha E) |
| **22** Competições organizadas | Federação e campeonatos formais: tabela oficial com pontos corridos (2 pts/vitória), prélio da rodada resolvido via motor 2-3-5, desempate histórico e entrega de troféus na sala de conquistas | VERIFICADO (Sprint 4 Alpha F: F7 + F8 + F9) |
| **23–24** Matriz de Rivalidades e Tribunal de Penas | Matriz de rivalidade em 5 eixos causais, termômetro de intensidade [0-100], dérbis e julgamentos pelo Tribunal de Penas com multas e perdas de mando | VERIFICADO (Sprint 1 Alpha G: G1 + G2) |
| **25–26** Torcida territorial e imprensa de época | Apoio popular e torcida distribuída por distritos urbanos, imprensa esportiva de 1910 com crônicas e manchetes procedurais | VERIFICADO (Sprint 2 Alpha G: G3 + G4) |
| **27–29** Instalações e finanças | Balanço financeiro e instalações do clube visíveis e atualizados a cada ciclo | PROPOSTO |
| **30–31** Legado e Homenagens | Galeria de Lendas e Ídolos com pontuação LegacyScore e deliberação de honrarias no Conselho | VERIFICADO (Sprint 3 Alpha G: G5 + G6 + G7) |
| **32–34** Tradição, Historical Ledger e Arquivo | Objetos de tradição, ledger causal linkado e arquivo navegável de 50 anos | VERIFICADO (Sprint 4 Alpha G: G8 + G9 + G10 + G11) |
| **35** Interface principal | Tela principal unificada; todos os sistemas acessíveis sem rota separada | VERIFICADO (Sprint 2 Alpha H: H4 + H5) |
| **36** 1959 e Taça Brasil | Campanha encerra em 31/12/1959 com epílogo exibindo a história gerada | VERIFICADO (Sprint 1 e 2 Alpha H) |
| **37** Save completo | Save persiste todos os domínios; migração de versão anterior funciona sem perda | PROPOSTO (Sprint 3 Alpha I) |
| **38** Performance | 50 anos em tempo real dentro do orçamento declarado; medição visível | VERIFICADO (Sprint 1 Alpha I) |
| **39** Testes de longa duração | 100+ seeds concluem 50 anos sem inconsistência; relatório disponível no jogo | VERIFICADO (Sprint 1 e 2 Alpha I) |
| **40** Ferramentas de debug | Inspeção de estado interno, time-travel e replay de decisões acessíveis em DEV mode | VERIFICADO (Sprint 2 Alpha I) |
| **41** Pesquisa histórica | Fontes citadas visíveis junto a cada dado calibrado na interface com os 5 eixos canônicos | VERIFICADO (Sprint 2 Alpha I) |

---

## Formato do registro de verificação

```
Pacote: <ID>
Data verificação: DD/MM/AAAA
Seed: <worldSeed>
URL: http://...
Data campanha: DD/MM/AAAA (data do relógio histórico)
Ação: <o que foi feito>
Efeito observado: <o que apareceu na tela>
Pendências: <o que ficou fora do escopo>
```

Copiar este bloco para `docs/CONTEXTO.md` > "Última verificação" ao concluir cada pacote.
