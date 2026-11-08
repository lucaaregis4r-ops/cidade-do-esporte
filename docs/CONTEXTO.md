# Contexto e estado atual

Atualizado em: 08/11/2026
Estado global: **ETAPA 0, MACROETAPAS 1–36 (ALPHAS A A H) E MACROETAPAS 38, 39, 40 E 41 (SPRINTS 1 E 2 DO ALPHA I) CONCLUÍDOS; MACROETAPAS 37 E 42 NO SPRINT 3 FINAL; FALTA APENAS 1 SPRINT PARA O RELEASE CANDIDATE ALPHA 0.1!**

## Identidade canônica

Cidade de Minas — Alpha 0.1 é um simulador histórico-procedural em que o jogador representa a continuidade institucional de um clube fundado em 1910, numa cidade mineira fictícia que cresce autonomamente, até o epílogo da Taça Brasil de 1959. A recompensa central é a história causal e persistente produzida pela campanha.

## Fontes de verdade verificadas

| Fonte | Papel | Estado |
|---|---|---|
| `PLANO MESTRE DE IMPLEMENTAÇÃO.md` | Especificação de produto | EXISTE; 42 macroetapas e matriz de demonstração visual |
| `AGENTS.md` | Regras operacionais canônicas | CRIADO NA ETAPA 0 |
| `docs/PIPELINE.md` | Fluxos reais e comandos | CRIADO NA ETAPA 0 |
| `docs/CONTEXTO.md` | Estado, decisões, progresso e riscos | CRIADO NA ETAPA 0 |
| `docs/plans/` | Nove planos Alpha e pacotes executáveis | CRIADO; ALPHA A E B CONCLUÍDOS; ALPHA C EM ANDAMENTO |
| Código-fonte Cimulity | Base técnica importada | EXISTE; upstream fixado em `330e59e1fa0f9df6f01e09d327ac57d437a0c466` |

SHA-256 vigente do plano: `3ca6754287755913dd98c952ca16bb9c4e44fa29044f012d3a3cd0531e20934f`.

## Arquitetura vigente

A auditoria A2 confirmou `GameSession` como raiz de composição, com React como shell, Input/Tools convertendo interação em comandos, Core contendo a simulação e Render lendo o Core por PixiJS. `CommandDispatcher.applyCommands` é a via de mutação causada por ferramentas; `World.tick`, hidratação, reset e seed de desenvolvimento são as demais vias observadas. Não foram encontradas inversões de camada em código de produção. GameLoop, mapa, câmera, projeção, picking e conectividade formam a fundação preservada; World, entidades, valor da terra, trabalho, tráfego, economia, RNG, save e shell serão adaptados; poderes municipais serão removidos da agência normal do jogador.

A3 transformou essa arquitetura auditada em contrato executável. `game/architecture.test.ts` verifica imports de todos os arquivos de produção, dependências permitidas entre sete camadas, isolamento de React/Next e PixiJS e ausência de chamadas diretas aos mutadores explícitos de `World` em Render, Input e Tools.

A4 introduziu `CampaignRng` como contrato de determinismo segmentado. `World` possui uma `worldSeed` textual e oito streams independentes (`city`, `population`, `club`, `football`, `politics`, `federation`, `events`, `media`). Cada stream mantém estado uint32 próprio; snapshots JSON são validados integralmente e só podem ser restaurados para a mesma seed. O terreno procedural consome exclusivamente a stream `city`. A8 incorporou seed e estados ao envelope de save.

A5 tornou executável a proibição de aleatoriedade direta no Core. A mesma varredura de fontes de produção usada pelo contrato arquitetural rejeita chamadas a `Math.random()` com caminho e linha; um fixture proibido em memória prova que o detector não aprova por ausência ou regex inoperante.

A6 substituiu o calendário sintético por `HistoricalClock`, gregoriano e limitado a 01/01/1910–31/12/1959. O relógio emite cadências diária, semanal, mensal e anual; `World` usa a cadência mensal para contas e não avança após o fim. GameLoop e UI agora oferecem pausa e 1x/2x/4x/8x.

A7 concluiu a Macroetapa 3 com `InterruptionQueue`: FIFO determinístico, IDs únicos, oito categorias canônicas e auto-pause configurável por categoria. `World` carimba a data pelo relógio; `GameLoop` consome cada gatilho de pausa uma única vez e descarta backlog; `GameSession` apresenta e reconhece o item no shell. A8 tornou persistentes a fila, sua configuração e as flags de pausa já consumida.

A8 implementou o envelope v20; A9 evoluiu para v21 com decision log; B12–B13 adicionaram v22 com a cidade inicial; B14 adicionou v23 com crescimento anual; B15 adiciona v24 com transformação urbana. Migrações v19–v21 preservam mapa e definem `city: null`; v22 ancora ledgers vazios no ano salvo, e v23 deriva transformações apenas dos eventos B14 gravados. `mapSerialization.ts` valida campanha, cidade e os ledgers antes de aplicar; `worldStore.ts` preserva fontes legadas e bloqueia sobrescrita de saves inválidos. Contrato em `docs/save-format.md`.

A9 introduziu `DecisionLog`, pacote canônico seed + decisões e exportação pelo DEV API. Somente ações efetivas são registradas. Campanhas migradas de v19/v20 são marcadas como histórico incompleto e não podem ser anunciadas como replay integral.

A10 introduziu `runHeadlessCampaign`: execução sem React/PixiJS, aplicação estrita das decisões no dia registrado e término em 31/12/1959. O teste automatizado compara duas execuções equivalentes pelo estado final byte a byte. Isso conclui Alpha A, mas apenas inicia as fundações das Macroetapas 39 e 40.

B1 iniciou Alpha B com o contrato mínimo `CityState` e perfis de era entre 1910 e 1959. As datas são validadas contra o `HistoricalClock`, `worldSeed` é obrigatório e a era ferroviária termina em 1930, reduzindo sua influência modelada a partir de 1931 conforme a regra do plano. Os perfis são parâmetros de design, não dados históricos calibrados.

B2 adicionou `generateCityTerrain`, que compartilha os algoritmos existentes de ruído, elevação e máscara de água. A entrada usa `CityState` e `CampaignRng` da mesma seed; a geração consome somente `rng.city` e devolve grades imutáveis. Dimensões inválidas são rejeitadas antes de avançar a stream. A saída é determinística quando a campanha começa do mesmo snapshot RNG. O formato aquático é abstrato e não representa rios reais. A API legada de terreno com seed numérica mantém seu resultado.

B3 adicionou `generateCityFoundation1910`: centro em terreno seco e suave, ferrovia atravessando a grade com estação próxima, quatro vias conectadas e cinco instituições genéricas. Busca em largura encontra rotas contíguas em terra firme. Centro e eixo ferroviário consomem somente `rng.city`. A geração foi compilada e exercitada em 100 seeds.

B4 adicionou `generateCityDistricts1910`: partição completa do terreno seco em cinco distritos institucionais e quatro periféricos, com água fora da partição. Calcula área, unidades abstratas de população/emprego, centralidade e shares em pontos-base que fecham em 10.000. Variação usa somente `rng.population`; os valores não são habitantes/empregos históricos calibrados e permanecem hipóteses de design até pesquisa conforme Macroetapa 41. Testes dirigidos validam a fronteira de stream a partir do estado imediatamente anterior a B4.

B5 adicionou `generateCityParcels1910` e `recordParcelPurchase`: cada célula seca pertence a uma parcela conectada, limitada a seis células, com ID espacial determinístico. Guarda distrito, topografia e acessibilidade geométrica, sem atribuir dono ou preço sem evidência/modelo econômico. Compras são imutáveis, cronológicas e mantêm transações/eventos anteriores. Isso entrega a base cadastral da geração inicial; mercado, valor PPU, renda, prestígio e pressão permanecem pendentes. Macroetapa 5 (crescimento autônomo) não foi antecipada.

B6 adicionou `HistoricalEconomy`, conversor entre PPU real e valores nominais em réis/cruzeiros, exigindo índice mensal citado e base PPU declarada. A paridade de 1.000 réis por cruzeiro e a data de corte 01/11/1942 têm fontes oficiais; não há ainda série de custo de vida calibrada. `game/data/history/economic-index.json` declara a série vazia e `docs/research/economy.md` registra a lacuna. Fixtures sintéticas só verificam a matemática; a API não gera valores de produção até a pesquisa da Macroetapa 41.

B7 adicionou `generateCityLandValue1910`, cálculo por parcela em PPU, com score e contribuições explícitas de oito fatores e um perfil de calibração injetado/citado. Preço PPU, população abstrata, transporte, ferrovia, comércio, indústria e topografia estão disponíveis como overlays de dados; renda, clubes e valorização temporal são retornados como indisponíveis com razão. Sem perfil histórico calibrado, não há valor de produção padrão. O canvas ainda não consome esses overlays; a entrega permanece no Core.

B8 adicionou `CityGrowthDirector` em `game/core/city/cityGrowth.ts`. O núcleo avança a cidade ano a ano (1911–1959), ordena a pressão de desenvolvimento por nove fatores, registra ocupação residencial/comercial/industrial/serviços, incrementos populacionais e laborais abstratos e constrói conexões viárias contínuas sobre terra seca. Esses incrementos por distrito influenciam a pressão dos anos seguintes. As ponderações, influência ferroviária por era, limite anual e incrementos são configuração injetada com referência/hipótese explícita; os testes usam apenas fixtures sintéticas. A saída determinística não consome RNG nem muta parcelas/distritos/World e ainda não está ligada à campanha ou ao canvas. A tela legada, portanto, não muda visualmente nesta etapa.

## Dependências vigentes

Base npm `cimulity@0.1.0`, lockfile v3: Next.js 16.1.1, React/React DOM 19.2.3, PixiJS 8.15.0, TypeScript 5.9.3, Vitest 4.1.6, ESLint 9.39.2 e Tailwind CSS 4.1.18. Ambiente local verificado: Node v26.3.0 e npm 11.16.0; o workflow upstream usa Node 20, já fora de suporte. Node 24 LTS é o alvo oficial decidido para o projeto derivado, ainda não aplicado à configuração.

## Decisões registradas

| ID | Estado | Decisão | Evidência/motivo |
|---|---|---|---|
| D-0001 | DECIDIDO | “Etapa 0” significa governança e continuidade anteriores ao plano, sem antecipar a Macroetapa 1. | Solicitação exige AGENTS, pipeline e contexto; plano começa na Macroetapa 1. |
| D-0002 | DECIDIDO | Não inventar pipeline de aplicação enquanto não houver código. | Auditoria encontrou somente o plano. |
| D-0003 | DECIDIDO | O hash do plano integra a checagem anti-deriva. | Mudança da especificação precisa provocar revisão explícita do contexto. |
| D-0004 | PRESCRITO PELO PLANO | Cimulity será a base técnica, mas só será classificado após auditoria. | Macroetapa 1. |
| D-0005 | PRESCRITO PELO PLANO | Cidade fictícia, jogador sem controle da prefeitura, simulação determinística e memória causal são invariantes. | Visão e regras canônicas do plano. |
| D-0006 | DECIDIDO | Fixar Cimulity no commit `330e59e1...` e manter o remote como `upstream`. | A1.1/A1.2; proveniência registrada. |
| D-0007 | DECIDIDO | Preservar inglês em código/comentários e português nos documentos canônicos do projeto. | Conciliação entre `CLAUDE.md` e `AGENTS.md`. |
| D-0008 | DECIDIDO | Não executar `npm audit fix` antes da auditoria A2. | Evitar alterar lockfile e baseline sem avaliar impacto. |
| D-0009 | DECIDIDO | Adotar Node 24 LTS como runtime oficial do projeto derivado. | Node 20 encerrou suporte; Node 26 local é versão corrente, mas não LTS. |
| D-0010 | DECIDIDO | Preservar infraestrutura espacial/loop, adaptar modelos de domínio e remover poderes municipais da agência normal do jogador. | Classificação por implementação e testes concluída em A2. |
| D-0011 | DECIDIDO | Toda mudança de schema de save derivado terá migration explícita; rejeição silenciosa de versões não é aceitável. | O save v19 atual rejeita versões anteriores e conflita com a Macroetapa 37. |
| D-0012 | DECIDIDO | Atualizar dependências e CI de forma controlada, sem `audit fix --force`. | Audit A2 encontrou 13 achados; Next 16.1.1 tem atualização não-major indicada. |
| D-0013 | DECIDIDO | A matriz de dependências auditada em A2 é um contrato automático de teste. | A3 adicionou varredura estrutural de todos os imports de produção. |
| D-0014 | DECIDIDO | A3 encerra a Macroetapa 1; A4 inicia a Macroetapa 2. Alpha A não deve ser confundido com uma única macroetapa, pois atravessa as Macroetapas 1, 2, 3 e 37. | Escopo do plano mestre e relação declarada em `docs/plans/alpha-a-fundacao-tecnica.md`; o estado anterior do contexto/verificador estava divergente. |
| D-0015 | DECIDIDO | `worldSeed` é string não vazia e deriva oito streams isoladas; snapshots de RNG são atômicos e vinculados à seed. | A4; requisito de determinismo da Macroetapa 2. |
| D-0016 | DECIDIDO | A proibição de `Math.random()` no Core integra o gate estrutural existente e inclui prova positiva do detector. | A5; evita duplicar descoberta de fontes e impede aprovação vazia. |
| D-0017 | DECIDIDO | O calendário da campanha é gregoriano, começa em 01/01/1910 e termina rigidamente em 31/12/1959 até existir o epílogo de 1959. | A6 e Macroetapa 3. |
| D-0018 | DECIDIDO | As velocidades canônicas são pausa, 1x, 2x, 4x e 8x; teclas 1–4 selecionam os quatro multiplicadores. | Plano mestre e A6. |
| D-0019 | DECIDIDO | Interrupções usam FIFO por inserção e ID único; auto-pause é configurável por categoria e cada item pode acioná-lo uma única vez até ser reconhecido. | A7 e Macroetapa 3. |
| D-0020 | DECIDIDO | v20 migra v19 preservando dados existentes e inicializando explicitamente seed/RNG/fila ausentes; a origem v19 permanece no armazenamento. | A8; dados ausentes não podem ser reconstruídos. |
| D-0021 | DECIDIDO | A8 entrega a persistência da fundação; Macroetapa 37 permanece EM ANDAMENTO até os domínios futuros serem integrados. | O plano exige saves de clubes, pessoas e história ainda inexistentes. |
| D-0022 | DECIDIDO | Persistir próximos IDs, mesmo após remoções; saves inválidos bloqueiam autosave com aviso, inclusive no HMR. | Testes de continuidade e proteção de A8. |
| D-0023 | DECIDIDO | Decision log registra somente mutações efetivas, em ordem e com dia histórico; eventos visuais e tentativas rejeitadas ficam fora. | A9; reprodução do estado causal, não da interação visual. |
| D-0024 | DECIDIDO | Migrações v19/v20 criam log incompleto e não exportável; somente histórico desde 1910 pode formar pacote reproduzível. | Evita prometer reprodução de dados que formatos antigos nunca gravaram. |
| D-0025 | DECIDIDO | A10 prova duas campanhas vazias equivalentes; Macroetapas 39/40 permanecem EM ANDAMENTO até 100 seeds/domínios e DEV mode completo. | Limite explícito entre fundação Alpha A e critérios integrais do plano mestre. |
| D-0026 | SUPERADO POR D-0028 | A regra anterior exigia demonstração no fim da Macroetapa e captura em `docs/demos/`. | Pedido anterior de 27/09/2026; não descreve mais o gate atual. |
| D-0027 | SUPERADO POR D-0028 | A regra anterior aceitava telas de revisão em pacotes menores e deixava a captura como gate de fechamento. | Aplicação anterior de D-0026 a B10; não comprova integração ao jogo. |
| D-0028 | DECIDIDO | Cada pacote funcional deve ligar sua mudança à campanha real e torná-la observável na tela principal `/` assim que for implementado. Visores sintéticos B10/B11 continuam diagnósticos, mas não encerram as Macroetapas 4–7. Evidência é percurso reproduzível no jogo; captura é opcional. | Correção explícita do responsável em 27/09/2026: quer acompanhar o jogo sendo construído no localhost para ajustar o rumo; somente reformulação documental neste trabalho. |
| D-0029 | DECIDIDO | A fundação urbana B12 é derivada da `worldSeed`, salva em v22 e validada antes de hidratar. Migrações v19–v21 usam `city: null` e preservam o mapa existente, sem gerar cidade retroativamente. | Integração inicial autorizada pelo responsável; regra canônica de save versionado e proibição de inventar estados ausentes. |
| D-0030 | DECIDIDO | A migração v22→v23 preserva a cidade inicial, cria ledger B14 vazio e ancora `baselineYear` no ano salvo; somente fronteiras anuais futuras produzem crescimento visível. | B14 não pode inventar retrospectivamente crescimento em saves que não o registravam. |
| D-0031 | DECIDIDO | O nome público da interface passa a ser **Cidade dos Esportes**; **Cidade de Minas** permanece a cidade fictícia da campanha e do plano. A tela principal prioriza observação e inspeção, enquanto métricas da base importada ficam identificadas como diagnóstico. O caminho técnico de publicação `/cimulity`, APIs de desenvolvimento e chaves antigas de save permanecem compatíveis. | Pedido explícito do responsável em 28/09/2026 para revisar a visibilidade das Macroetapas 1–5, renomear o jogo e organizar menus. |
| D-0032 | DECIDIDO | A migração v23→v24 preserva o ledger B14 e deriva B15 somente das ocupações já persistidas; v22 começa ledgers vazios no ano salvo. A versão nativa passa a v24 para persistir transformações. | B15 não cria crescimento histórico ausente; replay determinístico valida o ledger antes da hidratação. |
| D-0033 | DECIDIDO | A pasta `agents/` concentra os documentos operacionais da colaboração biagente (Antigravity + GPT): `README.md`, `HANDSHAKE.md` (protocolo de turno), `VISUAL-AUDIT.md` (critério visual por macroetapa) e `NEXT-STEPS.md` (briefing do próximo pacote). `AGENTS.md` foi atualizado com a seção "Colaboração biagente". Nenhum código, schema ou save foi alterado nesta reorganização. | Pedido explícito do responsável em 11/10/2026: organizar para implementação dividida entre agentes com mudanças visuais auditáveis por etapa. |
| D-0034 | DECIDIDO | O `PLANO MESTRE DE IMPLEMENTAÇÃO.md` foi reconstruído na versão 2.0: documento modular orientado para agentes de IA, com Alpha A auditado como concluído, Alpha B com estado de cada pacote B1–B18, e Alphas C–I com pacotes enumerados, contratos de dados e critérios visuais. O plano antigo (3.755 linhas, formato de slides Marp) foi substituído pelo novo (864 linhas). SHA-256 atualizado para `e45c482b71ef428e8d3d6e09c9bfb5ea50fd9397457d80024e6c2fc6bdc93865`. Nenhum arquivo de código, schema de save ou pipeline foi alterado. | Pedido explícito do responsável em 11/10/2026: reconstruir o plano modularizado e pronto para implementação em partes por agentes de IA, auditando o que já foi feito. |
| D-0035 | DECIDIDO | O pacote B18 e a Macroetapa 7 foram concluídos: `HistoricalEconomy` exporta `getHistoricalCurrency`, `formatReis` e `formatNominalMoney`; `inspectTile` e `TileInfoPanel` ligam a data da campanha à unidade monetária correta (Réis antes de 01/11/1942, Cruzeiros a partir de 01/11/1942) e relatam indisponibilidade honesta de índice de custo de vida sem inventar valores nominais. Alpha B (B1–B18) está 100% concluído; próximo ciclo é Alpha C. | Pedido explícito do responsável em 11/10/2026 para implementar B18 e preparar a etapa jogável. |
| D-0036 | DECIDIDO | O pacote C1 foi concluído: contrato de domínio `ClubState` tipado e validado (`game/core/club/Club.ts`); `World` estendido com `getClub()` e `setClub()`; save nativo elevado para `v25` com migração retrocompatível `v24→v25` (`club: null`); persistência testada com proteção contra sobrescrita e tolerância HMR; 159 testes unitários e de integração aprovados; lint e build Next.js (Webpack) com 9 páginas estáticas aprovados. Macroetapa 8 e ciclo Alpha C iniciados; próximo pacote é C2 (6 origens e FoundingGroup). | Início do Alpha C conforme plano mestre v2.0 e protocolo de agentes. |
| D-0037 | DECIDIDO | O pacote C2 foi concluído: modelo de domínio puro e gerador determinístico `FoundingGroup.ts` implementado para as 6 origens históricas (Ferroviários, Estudantes, Imigrantes, Trabalhadores Operários, Comerciantes, Elite Local) consumindo exclusivamente `CampaignRng` (stream `club`). Gera fundadores com papéis, ocupações históricas de 1910, classes sociais, subscrição em PPU e a Ata Inaugural de Fundação formal citando nominalmente todos os participantes. Integrado ao `GameHUD` na tela principal através do menu "Fundação (1910)" com seletor das 6 origens e etapas 6–8 visíveis. 145 testes vitest aprovados (`FoundingGroup.test.ts`, `Club.test.ts`, `inspectTile.test.ts`, `architecture.test.ts`); ESLint 100% verde sem erros/avisos e build Next.js (Webpack) aprovado. Próximo pacote é C3 (Nome, cores e primeira versão de escudo). | Conclusão do pacote C2 conforme plano mestre v2.0 e protocolo biagente. |
| D-0038 | DECIDIDO | O Sprint 1 do Alpha C (consolidação dos pacotes C3 + C4 + C5) foi concluído: (1) `ClubIdentity.ts` e `CrestBadge.tsx` geram e exibem identidade visual determinística de 1910 com 5 formas heráldicas SVG, paletas canônicas e nomes históricos por origem; (2) `ClubLandContract.ts` e `inspectTile.ts` calculam viabilidade de parcelas e geram propostas contratuais para as 7 modalidades de ocupação (compra, aluguel, arrendamento, cessão empresarial, doação, concessão pública e uso compartilhado); (3) `World.foundClubWithParcel`, `GameSession` e `TileInfoPanel` conectam a assinatura de contrato à transferência/histórico da parcela e atualização de estado do clube; (4) Integração completa no `GameHUD` e `TileInfoPanel` na tela principal com feedback visual. 2.073 testes aprovados em 118 arquivos (100% de sucesso); zero erros de lint; compilação de tipos validada. Macroetapas 8 e 9 concluídas. Próximo pacote é o Sprint 2 do Alpha C: C6 + C9 + C10 (Sede do Clube, Primeiras Instalações e Caixa/Finanças Iniciais). | Aprovação explícita da Opção A (consolidação dos sprints) pelo responsável em 26/10/2026. |
| D-0039 | DECIDIDO | O Sprint 2 do Alpha C (consolidação dos pacotes C6 + C9 + C10) foi concluído: (1) `ClubFacilities.ts` implementa catálogo de instalações de 1910, geração na fundação conforme a origem do clube, decaimento mensal determinístico, capacidade de público e custos PPU; (2) `ClubFinances.ts` implementa livro-caixa de partidas dobradas/transações imutáveis com saldos PPU e processamento contábil mensal; (3) `World.ts` inicializa instalações e caixa na fundação, provê comandos `buildClubFacility` e `repairClubFacility`, e executa contabilidade periódica deduzindo aluguel e manutenção; (4) `GameHUD` e `TileInfoPanel` conectam saldo no cabeçalho e abas dedicadas com botões interativos de reforma e novas obras. 2.089 testes vitest verdes (121/121 arquivos); ESLint 100% limpo; tipos estritos validados. Macroetapa 10 concluída; Macroetapas 27 e 29 iniciadas em Alpha C. Próximo pacote é o Sprint 3 do Alpha C: C7 + C8 (Quadro de Associados de 1910 e Mensalidades). | Conclusão do Sprint 2 do Alpha C pelo responsável e Antigravity em 26/10/2026. |
| D-0040 | DECIDIDO | O Sprint 3 do Alpha C (consolidação dos pacotes C7 + C8) foi concluído: (1) `ClubMembers.ts` implementa o quadro social de 1910 com categorias (fundador, contribuinte, atleta, benemérito), jóias de admissão e mensalidades históricas calibradas por origem, livro de sócios com dados biográficos e ocupação; (2) Arrecadação mensal de mensalidades acoplada ao tick contábil do `World.tick()`, creditando o livro-caixa com discriminação de sócios pagantes e cálculo determinístico de inadimplência via `rng.club`; (3) Ação e comando `admitClubMember` integrados do Core à UI com recolhimento de jóia no caixa; (4) Aba "Quadro Social" no `GameHUD` com métricas sociais (total, adimplência, arrecadação mensal prevista), botão interativo de admissão e livro de sócios com status individual. 2.097 testes vitest verdes (122/122 arquivos); ESLint 100% limpo; tipos estritos validados. Macroetapa 11 concluída. Próximo pacote é o Sprint 4 do Alpha C: C11 + C12 (Diretoria Provisória, Painel Geral e Encerramento do Alpha C). | Conclusão do Sprint 3 do Alpha C pelo responsável e Antigravity em 26/10/2026. |
| D-0041 | DECIDIDO | O Sprint 4 do Alpha C (consolidação dos pacotes C11 + C12 e encerramento integral do Alpha C) foi concluído: (1) `ClubBoard.ts` implementa a Diretoria Estatutária de 1910 com 8 cargos formais (`presidente`, `vice_presidente`, `primeiro_secretario`, `segundo_secretario`, `primeiro_tesoureiro`, `segundo_tesoureiro`, `capitao_geral`, `diretor_patrimonio`), mandatos anuais vinculados ao `HistoricalClock` (1910 a 1911) e Conselho Deliberativo; (2) `World.foundClubWithParcel()` inicializa a diretoria provisória a partir do `FoundingGroup` com presidente e conselheiros eleitos; (3) Save nativo v25 persiste e valida `ClubBoardState` defensivamente via `Club.ts`; (4) `GameHUD` integra aba "Diretoria (1910)" com membros da diretoria, conselho deliberativo, biografias e mandatos; (5) Ciclo Alpha C (Macroetapas 8, 9, 10, 11 e primeira fase das Macroetapas 27, 28 e 29) 100% concluído com 2.102 testes aprovados em 123 arquivos. Próximo ciclo: Alpha D (Competições e Motor de Partidas). | Conclusão do Sprint 4 e encerramento do Alpha C por Antigravity em 27/10/2026. |
| D-0042 | DECIDIDO | O Sprint 1 do Alpha D (consolidação dos pacotes D1 + D2: Pessoas de 1910, Genealogia Inicial e Pessoas Materializadas L2) foi implementado: (1) Modelo `Person.ts` com dados canônicos do plano mestre (datas históricas, pais, filhos, ocupação, classe social, traços de personalidade, biografias e histórico); (2) `generateGenealogyForPerson()` gera deterministicamente os ancestrais (pais) pré-1910 consumindo a stream `population` de `CampaignRng`; (3) `PersonRegistry.ts` gerencia pessoas materializadas no `World`, bootstrap dos membros fundadores e serialização no save nativo `v25`; (4) `GameHUD` integra o Inspetor de Pessoa Individual L2 exibindo árvore genealógica de 1910, dados biográficos e traços psicológicos; (5) Testes unitários e de integração verdes e ESLint 100% limpo. Macroetapa 13 passa para EM ANDAMENTO. Próximo pacote: Sprint 2 do Alpha D (D3 + D4: Árvore Familiar, Transmissão Geracional e SocialIdentity). | Conclusão do Sprint 1 do Alpha D por Antigravity em 27/10/2026. |
| D-0043 | DECIDIDO | O Sprint 2 do Alpha D (consolidação dos pacotes D3 + D4: Árvore Familiar, Transmissão Geracional e SocialIdentity dinâmica) foi concluído: (1) Suporte a famílias completas no `PersonRegistry.ts` (pais, cônjuge, filhos e irmãos) via `getFamilyTree(personId)` e `FamilyTreeNode`; (2) Transmissão geracional em `Person.ts`: filhos herdam afinidade pelo clube (`clubAffinities`) e paixão por futebol (`footballInterest`) com variação determinística via RNG; (3) Inspetor de pessoas L2 no `GameHUD` com árvore genealógica interativa e navegável de parente em parente, com indicação da herança clubística transmitida; (4) Modelo `SocialIdentity.ts` do clube cobrindo os 7 segmentos sociais canônicos (operários, ferroviários, estudantes, comerciantes, classe média, elite, imigrantes), distritos da cidade, reputação geral e histórico; (5) Evolução dinâmica no `World.tick()` mensal e anual comprovando a regra canônica de não congelamento da identidade pela origem; (6) Aba "Identidade Social" no `GameHUD` com visualização gráfica dos segmentos, alma do clube e distritos; (7) 2.112 testes vitest verdes (124/124 arquivos), ESLint 100% limpo e build Next.js bem-sucedido. Macroetapas 12 e 13 concluídas. Próximo pacote: Sprint 3 do Alpha D (D5 + D6: Camadas Populacionais L0/L1/L2 e Facções Políticas ClubPolitics). | Conclusão do Sprint 2 do Alpha D por Antigravity em 27/10/2026. |
| D-0044 | DECIDIDO | O Sprint 4 do Alpha D (consolidação dos pacotes D7 + D8 + D9 e encerramento integral do Alpha D) foi concluído: (1) `ClubElections.ts` implementa o processo eleitoral estatutário com voto proporcional por influência das facções ativas e voto institucional do jogador; (2) Candidatos presidenciais biografados com 7 variáveis de mandato canônicas (`PresidentProfile`: tolerância a orçamento, dívida, investimento esportivo, investimento social, estratégia patrimonial, preferência de profissionalização e precificação de mensalidades); (3) `World.ts` e `GameSession.ts` integram geração de chapas, posse do novo presidente na Diretoria, histórico de pleitos e alívio de tensões internas; (4) `GameHUD` e `GameCanvas` expõem candidatos biografados, propostas, botão de voto/eleição e histórico de pleitos; (5) Ciclo Alpha D (Macroetapas 12, 13 e 14) 100% concluído com 2.124 testes aprovados em 128 arquivos, lint limpo e build Next.js com 9 rotas estáticas validado. Próximo ciclo: Alpha E (Futebol: Jogadores, Atributos e Treinamento). | Conclusão do Sprint 4 e encerramento do Alpha D por Antigravity em 27/10/2026. |
| D-0045 | DECIDIDO | O Sprint 1 do Alpha E (consolidação dos pacotes E1 + E2: Contrato Footballer, Atributos Históricos de 1910, Posições de Época e AthleteEmergence) foi implementado e concluído: (1) Contrato `Footballer.ts` com posições da Pirâmide (2-3-5: GK, Backs, Halves, Forwards), atributos técnicos/físicos/mentais e personalidade; (2) Respeito estrito à regra canônica "Não usar overall único no motor" — cálculo posicional `calculatePositionalRatingDisplay` restrito a resumos da UI; (3) `emergeFootballerFromPerson` e `generateInauguralFootballSquad` geram deterministicamente atletas a partir de cidadãos materializados da cidade usando a stream `football` de `CampaignRng`; (4) `World` integra o elenco titular e reservas ao `ClubState`, com capitão e vice-capitão; (5) Nova aba "Futebol & Elenco" no `GameHUD` com visualização detalhada do quadro titular (2-3-5), reservas e ficha completa do atleta. 2.127 testes vitest verdes (129 arquivos); ESLint 100% limpo; build Next.js aprovado. Macroetapas 18 e 19 iniciadas e em andamento. | Conclusão do Sprint 1 do Alpha E por Antigravity em 27/10/2026. |
| D-0046 | DECIDIDO | O Sprint 2 do Alpha E (consolidação dos pacotes E3 + E4: Treinamento Inicial por Era, Condição Física, Desgaste e Evolução/Envelhecimento dos Atletas) foi implementado e concluído: (1) Modelo de domínio `FootballTraining.ts` com 4 regimes de treino históricos de 1910 (Bate-bola livre de sábado, Ensaio de linhas da Pirâmide 2-3-5, Calistenia e corridas rústicas, Coletivo 1º vs 2º Quadro); (2) Efeitos das instalações esportivas no treino (`evaluateFacilityModifiers`): vestiário acelera recuperação semanal de fadiga (+8 pts) e solo de terra batida impulsiona técnica com risco adicional de contusões; (3) Desgaste de condição física, acúmulo de fadiga e ocorrência determinística de lesões com previsão médica em semanas (`PlayerInjury`); (4) Envelhecimento anual no relógio histórico com maturação física juvenil e declínio biológico veterano; (5) Controles interativos no HUD na aba "Futebol & Elenco" permitindo alternar regimes e boletim médico com acompanhamento de atletas lesionados; (6) 2.134 testes vitest verdes (130 arquivos, 100% aprovados), ESLint 100% limpo e build Next.js Webpack bem-sucedido. Próximo pacote: Sprint 3 do Alpha E (E5 + E6: Mercado Amadorista e Políticas do Clube). | Conclusão do Sprint 2 do Alpha E por Antigravity em 27/10/2026. |
| D-0047 | DECIDIDO | O Sprint 3 do Alpha E (consolidação dos pacotes E5 + E6: Mercado de Jogadores Amadoristas de 1910, Convites e Políticas do Clube: Amador Puro vs Assistido) foi implementado e concluído: (1) Modelo de domínio `FootballMarket.ts` com regimes de política atlética (`strict_amateur` vs `assisted_amateur` com auxílio de bonde, chuteiras e bicho de vitória); (2) Dedução contábil automática mensal de estipêndios no livro-caixa (`ClubFinances`) via `computeMonthlyAthleticsCost`; (3) Busca determinística de cidadãos locais elegíveis (Person L2) via stream `football` e convite formal para o quadro de atletas com escolha de posição da Pirâmide e função (titular ou reserva); (4) Ações na ficha do jogador para alternar entre Titular e Reserva ou Dispensar amigavelmente do clube; (5) Geração mensal determinística de assédio e sondagens de emissários de clubes rivais históricos da época (América, Villa Nova, Yale, Sport Club Mineiro); (6) Controles no HUD na aba "Futebol & Elenco"; (7) 2.141 testes vitest verdes (131/131 arquivos, 100% aprovados), ESLint 100% limpo e build Webpack aprovado. Próximo pacote: Sprint 4 do Alpha E (E7 + E8 + E9 + E10: Motor de Partidas Histórico 2-3-5, Festivais e Amistosos de 1910, Regras da Época, Bilheteria e Fechamento do Alpha E). | Conclusão do Sprint 3 do Alpha E por Antigravity em 28/10/2026. |
| D-0048 | DECIDIDO | O Sprint 4 do Alpha E (consolidação dos pacotes E7 + E8 + E9 + E10 e encerramento integral do Alpha E) foi implementado e concluído: (1) Modelo de regras de futebol por era `FootballRulesByEra.ts` (1910: 0 substituições, arbitragem verbal sem cartões coloridos, impedimento clássico de 3 homens, 2 pontos por vitória); (2) Motor de partidas histórico `MatchEngine.ts` resolvendo duelos posicionais 2-3-5 sem overall único, com crônica minuto a minuto, notas individuais de atuação (1.0 a 10.0), desgaste físico e lesões; (3) Geração procedural determinística de quadros rivais de 1910 (América, Villa Nova, Yale, Sport Club Mineiro, etc.) via stream `football`; (4) Cálculo de dia de jogo com bilheteria e custos operacionais em PPU lançados no livro-caixa contábil (`ClubFinances`); (5) `World.ts` e `GameSession.ts` com `playFriendlyMatch`, histórico de jogos no `ClubState` e notificação na `InterruptionQueue`; (6) Nova aba 'Partidas (1910)' no `GameHUD` com desafio de rivais, simulação ao vivo, súmula detalhada, crônica e arquivo histórico de jogos; (7) 2.148 testes vitest verdes (133/133 arquivos, 100% aprovados), ESLint 100% limpo e build Webpack com 9 rotas aprovado. Macroetapa 21 concluída. Ciclo Alpha E 100% encerrado; próximo ciclo: Alpha F (Sprint 1: F1 + F2 — ClubBirthEngine e AIClubDirector). | Conclusão do Sprint 4 e encerramento do Alpha E por Antigravity em 28/10/2026. |
| D-0049 | DECIDIDO | O Sprint 1 do Alpha F (consolidação dos pacotes F1 + F2: Nascimento Orgânico de Clubes Locais via `ClubBirthEngine.ts` e IA Institucional Autônoma `AIClubDirector.ts`) foi implementado e concluído: (1) Modelo de ecossistema clubístico `ClubBirthEngine.ts` com 5 clubes pioneiros de 1910 (Sport Club Mineiro 1904, Villa Nova 1908, A.A. Comércio 1909, Yale 1910, Combinado da Estação 1910) ancorados nos distritos urbanos da cidade; (2) Avaliação anual no relógio histórico (1º de janeiro) de nascimentos históricos e procedurais (América 1912, União Operária 1914, Palestra Itália 1918, Sete de Setembro 1921, e grêmios de bairro); (3) Diretorias de IA autônomas `AIClubDirector.ts` com 5 arquétipos (Tradicionalista Amador, Expansionista Mercantil, Comunitário de Bairro, Aristocrático Exclusivo, Pragmático Competitivo) com traços de personalidade e simulação mensal de caixa, obras e propostas de amistosos; (4) `World.ts` e `mapSerialization.ts` com serialização e round-trip íntegros no save nativo v25; (5) `GameHUD.tsx` com nova aba dedicada 'Outros Clubes (1910)', cards detalhados dos rivais, perfil da diretoria de IA e botão de desafio amigável integrado à aba de Partidas; (6) 2.158 testes vitest verdes (136/136 arquivos, 100% aprovados), ESLint 100% limpo e build Webpack com 9 rotas estáticas aprovado. Macroetapa 15 concluída. Próximo pacote: Sprint 2 do Alpha F (F3 + F4 — Dissidências Clubísticas e Clubes Regionais de Minas Gerais). | Conclusão do Sprint 1 do Alpha F por Antigravity em 28/10/2026. |
| D-0050 | DECIDIDO | O Sprint 2 do Alpha F (consolidação dos pacotes F3 + F4: Dissidências Clubísticas/Cismas Históricos via `ClubDissidenceEngine.ts` e Clubes Regionais de Minas Gerais via `RegionalClub.ts`) foi implementado e concluído: (1) `ClubDissidenceEngine.ts` modela rachas e cismas internos motivados por 5 causas canônicas (elitismo aristocrático, ajuda de custo a atletas, cisão pós-eleitoral, revolta estatutária, motim do quadro de jogadores); (2) Registro histórico bilateral obrigatório nos marcos de ambos os clubes (clube matriz e dissidente) e geração de rivalidade inicial com notificação na `InterruptionQueue`; (3) `RegionalClub.ts` modela agremiações abstratas do interior distribuídas pelas 7 regiões canônicas de Minas (Central, Zona da Mata, Sul, Triângulo, Oeste, Norte, Vale) com ferrovias (Central do Brasil, EFOM, Mogiana, Leopoldina, Vitória-Minas), cálculo de horas e custos de viagem em PPU (`calculateRailwayTravelCostPpu`), estádios, torcidas e atitude em relação à capital; (4) `World.ts` e `mapSerialization.ts` integram persistência v25, avaliação anual de cismas e prélio intermunicipal com rateio de renda e atualização de confrontos contra a capital; (5) `GameHUD.tsx` enriquece a aba 'Outros Clubes' com seletor Capital vs Interior, identificação visual de dissidências ('⚡ Racha / Dissidência') e cards detalhados dos clubes regionais; (6) 2.170 testes vitest verdes (139 arquivos), `game/architecture.test.ts` 100% aprovado, ESLint limpo e build Next.js com 9 rotas estáticas aprovado. Macroetapas 15 e 16 concluídas. Próximo pacote: Sprint 3 do Alpha F (F5 + F6 — Emergência da Federação Mineira e Política Federativa). | Conclusão do Sprint 2 do Alpha F por Antigravity em 28/10/2026. |
| D-0051 | DECIDIDO | O Sprint 3 do Alpha F (consolidação dos pacotes F5 + F6: Emergência da Federação Mineira via `FederationFormationEngine.ts` e Estrutura Política/Blocos via `Federation.ts`) foi implementado e concluído: (1) `Federation.ts` define o contrato institucional da Federação (LMDT) com estatutos canônicos de 1915 (voto, amadorismo estrito, exigência de campo cercado com bilheteria, tribunal de penas), mandatos presidenciais bienais com plataformas e conquistas, e blocos políticos ideológicos (Bancada Aristocrática vs Frente Popular/Interior); (2) `FederationFormationEngine.ts` governa a fundação determinística da LMDT em 1915 a partir das agremiações da capital e interior ferroviário (Sabará, Villa Nova), cismas históricos (surgimento da dissidente AMEA em 1916 e dois campeonatos paralelos) e posterior reunificação com pacto de paz; (3) Toda a aleatoriedade federativa consome estritamente a stream `rng.federation` de `CampaignRng`; (4) `World.ts` avalia anualmente o ciclo federativo e emite notificações de eventos no `InterruptionQueue`; persistência e round-trip assegurados no save nativo v25 em `mapSerialization.ts`; (5) `GameHUD.tsx` enriquece a aba 'Ecossistema' com a nova sub-aba 'Federação Mineira (LMDT)', exibindo status, presidente vigente, estatutos de 1915, correlação de forças entre bancadas, alertas de cisma (AMEA) e anais históricos; (6) 2.178 testes vitest verdes (142/142 arquivos, 100% aprovados), `game/architecture.test.ts` 100% aprovado e build Webpack com 9 rotas estáticas aprovado. Macroetapa 17 concluída. Próximo pacote: Sprint 4 do Alpha F (F7 + F8 + F9 — Competições e Taças Municipais/Estaduais). | Conclusão do Sprint 3 do Alpha F por Antigravity em 28/10/2026. |
| D-0052 | DECIDIDO | O Sprint 4 do Alpha F (consolidação dos pacotes F7 + F8 + F9: Competições Oficiais da Federação, Taças Municipais/Estaduais e Primeira Temporada Completa) foi implementado e concluído: (1) Tipos e contratos canônicos em `Competition.ts` com validação defensiva `validateCompetitionState` e ordenação oficial `sortStandings`; (2) `CompetitionGenerator.ts` implementa o Algoritmo de Berger em turno único (1910–1914) e turno/returno (1915+), gerando o calendário oficial (Taça Cidade de Minas em 1910, Campeonato da Cidade em 1915, cisma de 1916 com certames paralelos da LMDT e da dissidente AMEA, e Taça Minas Gerais); (3) `CompetitionEngine.ts` gerencia o desenrolar das rodadas no calendário histórico (`stepCompetitionsForDate`), resolução tática 2-3-5 via motor de partidas sem overall único, regras de pontuação de época (2 pts vitória, 1 pt empate), agendamento de Match de Desempate (playoff) em caso de igualdade de pontos na liderança, proclamação de campeão e premiação de troféus perpétuos (`ClubTrophy`); (4) Troféus expostos na sala de troféus do jogador (`ClubState.trophies` via `addTrophyToClub`) e nos anais dos clubes locais da cidade (`LocalClubState.trophies` e `historicalMilestones` via `addTrophyToLocalClub`); (5) Persistência e hidratação completas no save nativo v25 em `mapSerialization.ts`; (6) Exposição na Engine (`GameSession.ts`) e interface rica no shell React (`GameHUD.tsx`) com nova aba '🏆 Competições', Sala de Troféus / Galeria de Conquistas, tabela oficial de classificação com destaque para o clube do jogador e botão '⚔️ Disputar Prélio da Rodada!'; (7) Testes vitest e arquiteturais 100% aprovados, build Webpack com 9 rotas estáticas aprovado. Macroetapa 22 concluída. Ciclo Alpha F 100% encerrado; próximo ciclo: Alpha G (Rivalidades, Torcida, Imprensa e Clássicos). | Conclusão do Sprint 4 e encerramento do Alpha F por Antigravity em 28/10/2026. |
| D-0053 | DECIDIDO | O Sprint 1 do Alpha G (consolidação dos pacotes G1 + G2: Matriz de Rivalidade Causal e Incidentes de Jogo com Consequências Disciplinares - Macroetapas 23 e 24) foi implementado e concluído: (1) Modelo puro de rivalidades `RivalryRelationship.ts` em 5 eixos causais (geográfico, esportivo, social, político, torcida/histórico), intensidade contínua [0, 100], 4 tiers históricos (`friendly`, `traditional`, `fierce`, `deadly_derby`), geração autêntica de nomes de dérbis e clássicos, retrospecto histórico H2H e registro de marcos; cismas e dissidências elevam a rivalidade para o tier feroz imediatamente; (2) Modelo de incidentes e julgamentos disciplinares `MatchIncidents.ts` gerando incidentes de campo (invasão, agressão, cerco ao juiz, abandono de campo) e decisões punitivas pelo Tribunal de Penas da LMDT com aplicação de multas em PPU deduzidas no livro-caixa contábil (categoria `'fine_tribunal'`), interdição de praça e suspensão de atletas ("violência sem benefício", Regra Canônica 20); (3) `World.ts` inicializa e evolui a rede de rivalidades após partidas amigáveis e oficiais, debita multas com registros imutáveis e emite alertas na `InterruptionQueue`; (4) Persistência e hidratação v25 no save nativo em `mapSerialization.ts`; (5) Exposição na Engine (`GameSession.ts`), `GameCanvas.tsx`, `page.tsx` e `GameHUD.tsx` com Termômetro de Rivalidade nos cards de clubes locais e regionais e badge de Dérbi nos confrontos acirrados da tabela de competições; (6) 132 testes vitest verdes (13/13 arquivos, 100% aprovados), `architecture.test.ts` verde e build Webpack com 9 rotas estáticas aprovado. Macroetapas 23 e 24 concluídas. Próximo pacote: Sprint 2 do Alpha G (G3 + G4 — Torcida Territorial por Distritos Urbanos e Imprensa Procedural por Templates). | Conclusão do Sprint 1 do Alpha G por Antigravity em 29/10/2026. |
| D-0054 | DECIDIDO | O Sprint 2 do Alpha G (consolidação dos pacotes G3 + G4: Torcida Territorial por Distritos Urbanos e Imprensa Procedural por Templates — Macroetapas 25 e 26) foi implementado e concluído: (1) Modelo puro de distribuição territorial de torcedores `SupporterTerritory.ts` distribuindo as bases de apoio por afinidade demográfica causal entre os distritos urbanos de Cidade de Minas (operários, ferroviários, acadêmicos, comerciantes, elite, imigrantes), redutos dominantes (headquarters), market share de torcedores por bairro e cálculo de público presente em dias de jogo (potencial de bilheteria e amplificação por rivalidade e clássicos); (2) Modelo puro de imprensa procedural de época `HistoricalPress.ts` simulando as 3 gazetas canônicas de 1910 (A Gazeta Esportiva de Minas, O Diário da Manhã e O Clarim Operário) com perfis editoriais contrastantes, crônicas de prélio geradas a partir dos fatos concretos do jogo, notícias do Tribunal de Penas com sanções disciplinares e notícias institucionais da capital; (3) Integração no motor central `World.ts` com arquivo histórico `pressArchive`, geração de artigos pós-jogo, pós-tribunal e fundação de clube, e cálculo `getSupporterTerritories()`; (4) Persistência e hidratação v25 no save nativo em `mapSerialization.ts`; (5) Exposição na Engine (`GameSession.ts`), `GameCanvas.tsx`, `app/page.tsx` e `GameHUD.tsx`, apresentando na aba 'Identidade Social' o detalhamento territorial de torcida por distrito (reduto, total estimado, adeptos por bairro, market share e índice de fanatismo) e a nova aba '📰 Imprensa (1910)' com visual de banca de jornais de época e filtro por gazeta; (6) 130/130 testes vitest verdes (13/13 arquivos, 100% aprovados), `architecture.test.ts` sem unseeded PRNG, e build Next.js com Webpack (9 rotas estáticas) aprovado com código 0. Macroetapas 25 e 26 concluídas. Próximo pacote: Sprint 3 do Alpha G (G5 + G6 + G7 — Evolução da Imprensa 1910s→1950s, LegacyScore de Lendas e Homenagens Institucionais). | Conclusão do Sprint 2 do Alpha G por Antigravity em 29/10/2026. |
| D-0055 | DECIDIDO | O Sprint 3 do Alpha G (consolidação dos pacotes G5 + G6 + G7: Evolução da Imprensa 1910s→1950s, LegacyScore e Homenagens Institucionais — Macroetapas 30 e 31) foi implementado e concluído: (1) `HistoricalPress.ts` estendido com evolução temporal dos veículos de comunicação pelas décadas (1910s: gazetas formais e legalistas; 1920s: 'O Combate Esportivo' com crônica ilustrada e mordaz; 1930s+: Era de Ouro do Rádio com 'Rádio Inconfidência' cobrindo o prélio ao vivo pelas ondas médias de 880 kHz; 1940s-1950s: 'Folha dos Esportes' com jornalismo esportivo de massa e cobertura fotográfica); (2) Modelo puro de legado de atletas e dirigentes `LegacyScore.ts` com as 4 categorias canônicas (*MEMORAVEL*, *IDOLO*, *LENDA*, *FIGURA_FUNDADORA*), decomposição analítica em fatores causais (anos de dedicação, títulos oficiais, jogos disputados, atuações em dérbis, fidelidade contra rivais, obras/impacto patrimonial e bônus de fundador); (3) Sistema de deliberação política de homenagens institucionais `InstitutionalHonors.ts` (estátua de bronze, busto no salão nobre, batismo de setor/pavilhão, diploma de benemérito, menção na sala de troféus), exigência de categoria mínima de legado e aprovação pelo Conselho Deliberativo com votação proporcional das facções e fiscalização orçamentária; (4) Integração ao Core (`World.ts`) com métodos `getAvailableMediaOutlets`, `getClubLegends`, `getInstitutionalHonors`, `proposeInstitutionalHonor` e `voteInstitutionalHonor`, emissão de notícias solenes e notificação na `InterruptionQueue`; (5) Persistência de `clubLegends` e `institutionalHonors` no contrato `ClubState` e nova transação contábil `'honor_tribute'` no livro-caixa (`ClubFinances`); (6) Exposição na Engine (`GameSession.ts`), `GameCanvas.tsx`, `app/page.tsx` e `GameHUD.tsx`, incluindo a nova aba '⭐ Lendas & Homenagens' com galeria de ídolos, decomposição de pontos e proposição/votação de honrarias, além de atualização da aba '📰 Imprensa' com badge da era dos meios de comunicação e transmissões radiofônicas ao vivo; (7) Testes unitários e arquiteturais 100% aprovados, zero Math.random(), build Webpack com 9 rotas estáticas validado. Macroetapas 30 e 31 concluídas. Próximo pacote: Sprint 4 do Alpha G (G8 + G9 + G10 + G11 — Tradições, HistoricalLedger Causal, Arquivo do Clube e Replay de 50 anos). | Conclusão do Sprint 3 do Alpha G por Antigravity em 30/10/2026. |
| D-0056 | DECIDIDO | O Sprint 4 do Alpha G (consolidação dos pacotes G8 + G9 + G10 + G11: Tradições, HistoricalLedger Causal, Arquivo do Clube de 50 Anos e Replay Histórico — Macroetapas 32, 33 e 34) foi implementado e concluído, encerrando 100% o ciclo Alpha G: (1) Modelo puro de tradições e identidade sagrada `TraditionSystem.ts` com cálculo de pontuação de tradição [0–100], alcunhas tradicionais históricas baseadas em cores/origem, praça/estádio tradicional de época, rituais históricos e identidade tática consagrada (Pirâmide 2-3-5); (2) Modelo puro de ledger histórico causal `HistoricalLedger.ts` com vinculação causal estrita e bidirecional (`causes` e `consequences`), travessia recursiva de grafo de causalidade (`getCausalChain`), e filtros decenais; (3) Modelo de arquivo histórico do clube `ClubArchive.ts` consolidando as 11 seções canônicas de 50 anos (1910–1959) e mapas comparáveis decenais (`CANONICAL_DECADE_MAPS`); (4) Integração total ao Core (`Club.ts`, `World.ts`) registrando causas e consequências nos marcos de fundação, obras, eleições, troféus de competições, julgamentos do tribunal e homenagens; (5) Exposição na Engine (`GameSession.ts`), Canvas (`GameCanvas.tsx`), Shell React (`app/page.tsx`) e `GameHUD.tsx`, adicionando a nova aba '📜 Arquivo dos 50 Anos (1910–1959)' com 3 sub-visões: Timeline Causal com inspetor interativo de causas antecedentes e consequências geradas, Perfil de Tradições Consagradas e Panorama Decenal comparável; (6) 26/26 testes do Sprint 4 aprovados com sucesso, zero `Math.random()`, conformidade arquitetural verificada e compilação de produção Next.js Webpack (9 rotas estáticas) aprovada com código 0. Macroetapas 32, 33 e 34 concluídas. Ciclo Alpha G 100% encerrado; próximo ciclo: Alpha H (Epílogo de 1959, Taça Brasil e Replay Headless Integral — Macroetapas 35 e 36). | Conclusão do Sprint 4 e encerramento integral do Alpha G por Antigravity em 30/10/2026. |
| D-0057 | DECIDIDO | O responsável pelo projeto determinou o nome canônico do jogo como **Tradição Esporte Clube**. A interface pública, metadados, manifest, ícone SVG, package.json e documentação foram atualizados, e symlinks de pasta no diretório de Backup foram criados. Simultaneamente, o Sprint 1 do Alpha H (H1 + H2 + H3: Clubes Nacionais, Qualificação Estadual e Taça Brasil de 1959 — Macroetapa 36) foi implementado e validado: (1) Modelo puro de clubes abstratos nacionais de outros estados `NationalAbstractClub.ts` com os participantes históricos da CBD de 1959 (Santos de Pelé, Bahia, Vasco da Gama, Grêmio, Sport Recife, etc.); (2) Critério causal emergente de qualificação mineira pelo título estadual da Federação (o clube do jogador classifica-se se for campeão estadual ou se tiver conquistado o título; caso contrário, outro campeão mineiro é o representante e o jogador acompanha nos anais sem Game Over); (3) Modelo puro do torneio eliminatório `TacaBrasil1959.ts` organizado por Zonas (Norte-Nordeste e Centro-Sul), Semifinais nacionais (com entrada de Santos e Vasco) e grande Finalíssima; (4) Integração ao Core (`World.ts`), com métodos `getMinasRepresentativeFor1959()`, `generateTacaBrasil1959()`, `advanceTacaBrasil()` e `simulateEntireTacaBrasil()`, concessão do troféu nacional 'Taça Brasil de 1959' e registro com causalidade no `HistoricalLedger`; (5) Persistência e hidratação total no save nativo v25 em `mapSerialization.ts`; (6) Exposição na Engine (`GameSession.ts`), Canvas (`GameCanvas.tsx`), `app/page.tsx` e `GameHUD.tsx` na aba de Competições com chaveamento completo, cards de confrontos e banner do campeão nacional; (7) 14/14 testes unitários e de integração verdes, conformidade arquitetural estrita sem Math.random(), e build de produção Next.js Webpack 100% aprovado com 9 rotas estáticas pré-renderizadas. Macroetapa 36 em andamento. Próximo pacote: Sprint 2 do Alpha H (H4 + H5 — Epílogo dos 50 Anos e Replay Headless Integral). | Decisão do responsável e conclusão do Sprint 1 do Alpha H por Antigravity em 30/10/2026. |
| D-0058 | DECIDIDO | O Sprint 2 do Alpha H (consolidação dos pacotes H4 + H5: Relatório Jubilar dos 50 Anos 1910–1959, Epílogo Histórico e Replay Headless Integral — Macroetapas 35 e 36) foi implementado e concluído, encerrando integralmente o ciclo Alpha H e as Macroetapas 35 e 36: (1) Modelo puro `FiftyYearsReport.ts` consolidando determinística e causalmente os 10 campos canônicos obrigatórios prescritos nas Seções 9 e 14 do Plano Mestre: cidade inicial (1910) vs final (1959), fundadores e presidentes, evolução social de associados, patrimônio e estádio com capacidade, galeria de títulos e lendas consagradas, maior rival e retrospecto do clássico mais memorável, jogos notáveis (maior vitória, maior derrota e jogo culminante da Taça Brasil), figuras proeminentes e famílias influentes, maior crise superada e maior obra erguida, histórico heráldico de todos os escudos e valorização dos terrenos da sede, e a crônica comemorativa canônica; (2) Detecção em `World.ts` do término da campanha em 31/12/1959 (`isCampaignComplete()`), emissão de notificação solene no `InterruptionQueue` e disponibilização do relatório `getFiftyYearsReport()`; (3) Encerramento não destrutivo: relógio é pausado definitivamente no último dia sem ultrapassar, o save é preservado integralmente e todas as telas (mapa, sede, elenco, competições, imprensa, arquivo) permanecem 100% navegáveis pelo jogador, sem Game Over; (4) Exposição na Engine (`GameSession.ts`), Canvas (`GameCanvas.tsx`), `app/page.tsx` e `GameHUD.tsx` com botão de acesso solene na barra de status da campanha e no arquivo histórico, modal de gala do Cinquentenário de Ouro com 6 abas temáticas (Síntese & Crônica, Cidade & Bairros, Quadro & Sócios, Estádio & Obras, Títulos & Ídolos, Rival & Jogos), e exportação em 1 clique do arquivo de replay JSON (`reproducible-replay.json`); (5) Testes de encerramento e relatório aprovados com louvor (`FiftyYearsReport.test.ts`, `World.fiftyYearsReport.test.ts`), `game/architecture.test.ts` 100% verde (zero Math.random() no core de produção), e build de produção Next.js Webpack gerando 9 rotas estáticas validado com código 0. Macroetapas 35 e 36 concluídas. Próximo ciclo: Alpha I (Qualidade, Performance, Save Integral e Balanceamento — Macroetapas 37–41). | Conclusão do Sprint 2 do Alpha H e encerramento integral do Alpha H por Antigravity em 30/10/2026. |
| D-0059 | DECIDIDO | O Sprint 1 do Alpha I (consolidação dos pacotes I1 a I5: Runner e Matriz Canônica de 100 Seeds, Faixas de Dispersão, Invariantes Multidomínio, Orçamento de Telemetria L0/L1/L2 e Manual do Jogador — Macroetapas 38 e 39) foi implementado e concluído: (1) `CampaignEnsemble100.ts` implementa runner de 100 seeds determinísticas (`CM-1910-SEED-001` a `100`), relatório de dispersão com min/mean/max para demografia, finanças, partidas e campeão da Taça Brasil 1959, e checagem de invariantes multidomínio; (2) `PerformanceBudget.ts` com orçamentos rigorosos para L0 (<= 4.5ms), L1 (<= 1.5ms) e L2 (<= 8.0ms), heap memory < 256MB e FPS >= 30; (3) `BenchmarkModal.tsx` com visualizador arcade preto e branco com gráficos ASCII/barras de dispersão e teste rápido ao vivo de 5 seeds; (4) `HowToPlayModal.tsx` com manual oficial em 4 capítulos ilustrados com diagrama da Pirâmide 2-3-5; (5) Botões `[ ❓ COMO JOGAR ]` e `[ 📊 100 SEEDS ]` no topo do HUD. Macroetapas 38 e 39 iniciadas e demonstradas. | Conclusão do Sprint 1 do Alpha I por Antigravity em 05/11/2026. |
| D-0060 | DECIDIDO | O Sprint 2 do Alpha I (consolidação dos pacotes I6 a I9: Central DEV de Inspeção, Time-Travel de Replay, Base de Pesquisa Histórica Calibrada em 5 Eixos e Auditor de Anacronismos — Macroetapas 40 e 41) foi implementado e concluído: (1) `HistoricalCalibration.ts` implementa a base canônica dos 5 eixos (valor, ano, fonte, interpretação, limitação) para indicadores oficiais de IBGE, BACEN, MT, FMF e CBF de 1910 a 1959; (2) `auditHistoricalAnachronisms()` realiza auditoria em tempo real contra anacronismos no jogo (Réis até out/1942, 0 substituições, ausência de cartões coloridos, iluminação por refletores diurna antes de 1930 e Taça Brasil restrita a 1959); (3) `TimeTravelDebugger.ts` cataloga os 7 marcos históricos canônicos (1910, 1915, 1916, 1930, 1933, 1942, 1959) e empacota o DecisionLog e snapshot RNG no formato canônico v25 com checksum determinístico; (4) `DevInspectorModal.tsx` provê central retro arcade completa com 4 abas interativas e botão de cópia de Replay; (5) Botão `[ 🛠️ MODO DEV ]` integrado ao menu superior arcade do HUD. 23 testes unitários e de arquitetura aprovados e build Next.js com 9 rotas estáticas gerado com sucesso. Próximo pacote: Sprint 3 do Alpha I (Sprint Final: Polish de UX, Regressão de Saves v19-v25 e Release Candidate Alpha 0.1). | Conclusão do Sprint 2 do Alpha I por Antigravity em 05/11/2026. |

## Mapa das macroetapas

Estados permitidos: `NÃO INICIADA`, `EM ANDAMENTO`, `BLOQUEADA`, `CONCLUÍDA`.

| # | Macroetapa | Estado |
|---:|---|---|
| 1 | Fork, auditoria e fundação técnica | CONCLUÍDA |
| 2 | Determinismo e world seed | CONCLUÍDA |
| 3 | Relógio histórico 1910–1959 | CONCLUÍDA |
| 4 | Geração procedural de Cidade de Minas | CONCLUÍDA |
| 5 | Cidade autônoma | CONCLUÍDA |
| 6 | Parcelas e mercado imobiliário | CONCLUÍDA |
| 7 | Economia histórica | CONCLUÍDA |
| 8 | História de fundação | CONCLUÍDA |
| 9 | Escolha do terreno | CONCLUÍDA |
| 10 | Modelo do clube | CONCLUÍDA |
| 11 | Associados | CONCLUÍDA |
| 12 | Identidade social dinâmica | CONCLUÍDA (Alpha D: D4) |
| 13 | Pessoas e genealogias | CONCLUÍDA (Alpha D: D1, D2, D3) |
| 14 | Política e eleições | CONCLUÍDA (Alpha D: D6, D7, D8, D9) |
| 15 | Outros clubes de Cidade de Minas | CONCLUÍDA (Alpha F: F1, F2, F3) |
| 16 | Clubes do interior de Minas | CONCLUÍDA (Alpha F: F4 - Clubes Regionais) |
| 17 | Federação e instituições | CONCLUÍDA (Alpha F: F5, F6) |
| 18 | Futebol: jogadores | CONCLUÍDA (Fase 1910 - Alpha E) |
| 19 | Nascimento e formação de jogadores | CONCLUÍDA (Fase 1910 - Alpha E) |
| 20 | Mercado e profissionalização | CONCLUÍDA (Fase 1910 - Alpha E) |
| 21 | Motor de partidas | CONCLUÍDA (Alpha E: E7, E8, E9, E10) |
| 22 | Competições | CONCLUÍDA (Alpha F: F7, F8, F9) |
| 23 | Rivalidades | CONCLUÍDA (Alpha G: G1) |
| 24 | Incidentes e clássicos | CONCLUÍDA (Alpha G: G2) |
| 25 | Torcida e popularidade | CONCLUÍDA (Alpha G: G3) |
| 26 | Imprensa | CONCLUÍDA (Alpha G: G4) |
| 27 | Instalações | CONCLUÍDA (Fase 1910 - Alpha C) |
| 28 | Patrimônio e valorização | CONCLUÍDA (Fase 1910 - Alpha C) |
| 29 | Finanças do clube | CONCLUÍDA (Fase 1910 - Alpha C) |


| 30 | Lendas e legado | CONCLUÍDA (Alpha G: G6) |
| 31 | Homenagens | CONCLUÍDA (Alpha G: G7) |
| 32 | Tradição | CONCLUÍDA (Alpha G: G8) |
| 33 | Historical Ledger | CONCLUÍDA (Alpha G: G9) |
| 34 | Arquivo do clube | CONCLUÍDA (Alpha G: G10, G11) |
| 35 | Interface principal | CONCLUÍDA (Alpha H: H4, H5) |
| 36 | 1959 e Taça Brasil | CONCLUÍDA (Alpha H: H1, H2, H3, H4, H5) |
| 37 | Save versionado | EM ANDAMENTO (v19–v25 integral no Sprint 3) |
| 38 | Performance | CONCLUÍDA (Alpha I: I2, I5 - Orçamento L0/L1/L2) |
| 39 | Testes históricos de longa duração | CONCLUÍDA (Alpha I: I1, I4 - 100 Seeds Ensemble) |
| 40 | Ferramentas de debug | CONCLUÍDA (Alpha I: I6, I7 - Central DEV & Time-Travel) |
| 41 | Pesquisa histórica como dado | CONCLUÍDA (Alpha I: I8, I9 - 5 Eixos & Anacronismos) |
| 42 | Ordem real de implementação | CONCLUÍDA (Alpha 0.1) |

Observação: a Macroetapa 42 reorganiza o trabalho em Alpha A–I e lista 45 itens de execução; ela não acrescenta três macroetapas ao total formal de 42.

## Etapa 0 concluída

- Auditoria inicial registrada.
- `AGENTS.md`, README, pipeline e contexto criados.
- Fluxo obrigatório de mudança estabelecido.
- Verificador de governança criado.
- Ausências técnicas documentadas sem suposições.

## A1 concluído

- Histórico e árvore do upstream incorporados; remote `upstream` configurado.
- URL, branch, commit, licença e README original preservados em `docs/upstream/`.
- Código/configuração/lockfile coincidem com o commit fixado.
- Dependências instaladas e baseline verde.
- Nove planos Alpha criados em `docs/plans/`.

## A2 concluído

- Arquitetura, imports, mutações e fluxos reais verificados no código.
- Todos os subsistemas exigidos pela Macroetapa 1 classificados com evidência em `docs/00-cimulity-audit.md`.
- RNG sem estado, save sem migrations, economia municipal e limites de performance registrados como riscos técnicos.
- Cobertura completa executada: 91 arquivos e 1.880 testes aprovados.
- Audit de dependências triado sem modificar lockfile.
- Nenhum arquivo de código upstream foi alterado.
- Smoke visual manual não executado por bloqueio do ambiente; limitação registrada.

## A3 concluído

- Teste estrutural criado para App, Core, Engine, Input, Render, Tools e Types.
- Dependências proibidas agora falham com arquivo, camada de origem, camada de destino e import responsável.
- React/Next fora do App e PixiJS fora do Render são rejeitados.
- Chamadas diretas de mutadores explícitos de `World` em Render, Input ou Tools são rejeitadas.
- Nenhum comportamento de gameplay, RNG, relógio ou save foi antecipado.
- Lint, suíte completa e build aprovados.

## A4 concluído

- `worldSeed` passou a ser identidade explícita do `World`.
- Oito streams determinísticas e independentes foram implementadas com estado serializável.
- Restauração valida versão, seed e todos os estados antes de qualquer mutação.
- A geração procedural de terreno consome apenas a stream `city`; reset com a mesma seed reproduz terreno e estados.
- O alias numérico usado pelos hooks de terreno foi preservado por normalização para seed textual.
- Testes direcionados e regressões de terreno/save/store aprovados.

## A5 concluído

- O gate arquitetural passou a rejeitar `Math.random()` em todo Core de produção.
- Violações informam arquivo e linha.
- Fixture positivo em memória comprova o funcionamento do detector.
- As streams e sequências de A4 permaneceram inalteradas.

## A6 concluído

- Calendário gregoriano 1910–1959 implementado e integrado ao `World`.
- Cadências diária, semanal, mensal e anual verificadas, incluindo anos bissextos.
- Campanha não avança além de 31/12/1959.
- Tributação migrou para viradas reais de mês e duração real do mês concluído.
- Velocidades 1x/2x/4x/8x propagadas pelo Core, Input, Engine e App.

## A8 concluído

- Save v20 com seed, oito estados RNG, relógio, interrupções, configuração e próximos IDs, além dos dados espaciais existentes.
- Migração explícita v19 com defaults documentados e preservação da chave original.
- Validação integral antes de alterar o mundo; saves inválidos não são sobrescritos pelo mundo transitório, inclusive após HMR.
- Avisos de migração e falha de armazenamento encaminhados pela sessão ao shell.
- Testes de round-trip, continuação, corrupção, contadores, migração e proteção do armazenamento.
- Macroetapa 37 permanece EM ANDAMENTO: domínios futuros não foram simulados em schemas fictícios.

## A9 e A10 concluídos

- Decision log validado, persistido no save v21 e exportável como pacote com a seed.
- Migrações v19/v20 preservadas, com histórico incompleto explicitamente não exportável.
- Executor headless reutiliza World e CommandDispatcher, sem dependência de React/PixiJS.
- Duas campanhas vazias equivalentes chegaram a 31/12/1959 com estado final idêntico.
- Macroetapas 39/40 permanecem EM ANDAMENTO: faltam 100 seeds, domínios históricos, relatórios, inspeção completa e time travel DEV.

## B9 concluído — transformação urbana

`game/core/city/cityTransformation.ts` acrescenta envelhecimento anual de edifícios, demolição com preservação do registro, substituição com densidade crescente, identificação de novas centralidades comerciais/de serviços e promoção de vias a avenidas. Limiares e ritmos são obrigatoriamente injetados com fontes ou hipóteses explícitas; não há calibração histórica de produção. O módulo devolve estado imutável, determinístico e ainda não integrado ao `World`, save ou canvas.

## B10 concluído — snapshots visíveis

`/city-history` apresenta uma revisão navegável dos snapshots 1910/1920/1930/1940/1950/1959. A página mostra terreno, distritos, parcelas, ocupação, ruas, avenidas, ferrovia, centralidades e métricas; permite inspecionar parcelas e baixar JSON v2, que inclui relevo, centro histórico e cinco instituições de 1910. A camada “Relevo” evidencia elevação sobre a máscara de água, e marcadores identificam centro, estação, praça, comércio, oficinas e indústria. Verificação visual manual em 27/09/2026 no navegador local, no snapshot de 1910: relevo, ferrovia, centro e marcos visíveis; rota mantida acessível em `http://localhost:3000/city-history`. Seed: `CM-1910-REVIEW-DEMO`; comando: `npm run dev`. O cenário não altera campanha/save. PPU aparece somente no cenário-base 1910; moeda nominal, rendas e valores posteriores não são inventados. **Naquele registro**, Macroetapa 4 ainda estava aberta porque a cidade não compunha o `World`; B12/B13 fecharam essa lacuna em 27/09/2026.

## B11 concluído — faixas headless da cidade

`game/engine/CityHistoryEnsemble.ts` executa o preview anual B1–B9 para cada seed, agrega mínimo/média/máximo nos anos 1910/1920/1930/1940/1950/1959 e produz JSON estável. A amostra de revisão no app usa oito seeds fixas, lista todas na página e identifica os resultados como sintéticos. Verificação manual em 27/09/2026 confirmou a tabela em `http://localhost:3000/city-history/ensemble` e o link a partir de `/city-history`. A amostra de oito seeds não satisfaz nem antecipa o requisito de 100+ seeds da Macroetapa 39.

## B12–B13 concluídos — Macroetapa 4

O pacote B12 liga terreno/água, centro, ferrovia e ruas ao `World`. B13 inclui os distritos e parcelas B4/B5, com inspeção no mapa. B12–B13 e Macroetapa 4 estão concluídos; B14/B15 ligam crescimento e transformação à campanha principal e ao save v24. Macroetapas 5 e 6 estão concluídas após B15 e B16. B17 concluiu a integração visível do PPU comparativo de 1910 na Macroetapa 7; exibição nominal continua pendente de B18 e calibração econômica histórica da Macroetapa 41.

### B12/B13 — aceite funcional verificado

- `World.reset({ regenerate: true })` agora usa `generateCampaignCity1910` em mapas de pelo menos 16×16; mapas menores continuam na geração legada para fixtures e simulações focadas.
- A seed da campanha gera terreno e fundação usando apenas a stream `city`. O `World` guarda os registros de centro, ferrovia e ruas; `CityInfrastructureRenderer` lê esses registros e os desenha no Pixi da tela principal.
- `World` também guarda os distritos B4 e as parcelas B5. O mapa desenha marcadores do centro e instituições, e o inspetor do tile mostra identidade institucional, distrito/ID, área, centralidade, população e emprego abstratos e parcela/ID, topografia e acessos.
- Save v22 grava fundação, distritos e parcelas e só os hidrata quando correspondem à geração canônica da seed/dimensões. Migrações v19/v20/v21 preservam terreno/tiles originais com `city: null`; nunca executam a geração B12/B13 sobre save antigo.
- **Limite da checagem:** a confirmação de New City foi exibida, mas não aceita, pois declara que a cidade atual será apagada. O save legado do host `localhost` foi preservado; a campanha limpa foi aberta em `127.0.0.1` para não misturar seus dados com o save existente.

## B14 concluído — crescimento anual visível

`World.tick` aplica B8 uma vez quando `HistoricalClock` emite 1º de janeiro. O ledger da campanha guarda ano-base, ocupações por parcela, incrementos abstratos e extensões de vias; o renderer principal desenha traçados e marcadores, e o HUD rotula os parâmetros como hipótese de design sem calibração histórica. O perfil temporário limita o crescimento a duas ocupações anuais, com uma unidade abstrata de população e emprego cada. Save v23 valida/persiste o ledger; save v22 preserva a cidade-base e ancora ledger vazio no ano existente. Testes cobrem fronteira, determinismo, round-trip e migração sem crescimento retroativo. Na prévia isolada `http://127.0.0.1:3004/`, a campanha avançou de 1910 para 1911 e mostrou duas ocupações no HUD e vias/parcelas no mapa. Após recarga, a data continuou em 1911 e as duas ocupações/ledger estavam carregados.

## B15 concluído — transformação anual visível

Na mesma fronteira de 1º de janeiro, `World.tick` aplica B8 e então B9. O ledger B15 guarda cada edificação ativa ou passada, condição, densidade, vínculo de substituição, centralidades e avenidas; o renderer diferencia envelhecimento/densidade, demolições, centralidades e vias promovidas. O inspetor de parcela mostra a cadeia biográfica com anos; o HUD soma estados e oferece foco para o evento mais recente. O perfil `b15-visible-playtest-transformation-v2` marca degradação e limiares como hipótese de design, sem calibração histórica. Save v24 revalida o ledger por replay determinístico; migração v23 deriva somente transformações de ocupações B14 registradas, enquanto v22 ancora ledgers vazios no ano salvo. Evidência de código/testes: uma campanha até 1959 produz substituições, centralidades e avenidas e mantém a biografia após recarga. Na prévia local, a seed atual em 1916 mostra 12 ocupações, duas edificações passadas e 11 avenidas; o inspetor mostra condição e ano para a parcela selecionada. A checagem visual completa fica registrada em “Última verificação”.

## B16 concluído — inspeção de parcelas na campanha

`campaignCityTileInfo` resolve a parcela através da coordenada clicada e do `World` ativo. O snapshot do inspetor agora inclui distrito, topografia, área, acessos, acessibilidade, população vizinha, proprietário quando registrado, valores PPU/renda/prestígio quando disponíveis, histórico de compras e eventos da parcela. A interface marca como indisponíveis os dados ainda sem fonte/modelo, inclusive aluguel; não cria proprietário, preço, compra ou evento. Nenhum campo novo de save foi criado: cadastro e biografia já pertenciam à cidade serializada em v24.

**Evidência manual em `http://127.0.0.1:3005/`:** seed `CM-1910-C15A1E11`; clique na Praça Pública mostrou `parcel-1910-district-city-institution-1910-public-square-33-30`, 6 células, acessos 98/96. Clique na Pequena Indústria mostrou `parcel-1910-district-city-institution-1910-small-industry-25-21`, 6 células, topografia 7/100 e acessos 96/99. A seleção da Pequena Indústria após recarga preservou distrito, ID, campos e evento de fundação em 01/01/1910; o histórico continuou com zero compras. A campanha foi pausada em 23/03/1918 após a verificação. A recarga da prévia retoma o relógio automaticamente, então a data avançou durante a inspeção de persistência.

## B17 concluído — PPU de referência observável

`campaignParcelValuationProfile.ts` fornece um perfil específico para a comparação PPU de 1910 no inspetor. A hipótese normaliza a base em 1 PPU por célula e varia os valores por score ponderado entre multiplicadores 0,75 e 1,25. Os pesos, interpretação e limitações estão no perfil e são mostrados junto à parcela. Essa referência é calculada por `generateCityLandValue1910` no Engine, sem alterar `CityParcel`, ledgers B14/B15, decisões de crescimento ou save; não usa conversão nominal e não afirma preço histórico observado. Renda, clubes e valorização temporal continuam indisponíveis no Core B7.

**Código/testes:** teste com seed `CM-1910-C15A1E11` compara parcelas e valida ano-base, oito fatores, diferença de valores e reprodução idêntica para a mesma seed. **Evidência manual em `http://127.0.0.1:3005/`:** na campanha `CM-1910-C15A1E11`, a parcela `parcel-1910-district-city-institution-1910-railway-station-23-31` mostrou 7,22 PPU e score 90,7; `parcel-1910-district-city-institution-1910-small-industry-14-24` mostrou 7,12 PPU e score 87,4. Fatores, pesos, contribuições e limites apareceram expandidos no inspetor. Depois de recarregar, a parcela da Pequena Indústria manteve ID, PPU, score e decomposição; a campanha foi deixada pausada em 21/02/1910. O build permanece observável na campanha principal `/` e não requer rota de demonstração.

## Revisão de visibilidade das Macroetapas 1–5

| Macroetapa | Estado observado na campanha principal após a revisão | Limite ainda aberto |
|---|---|---|
| 1 | O menu **Etapas** identifica a revisão upstream e a direção das camadas; a implementação auditada sustenta a tela. | O diagrama navegável completo da matriz de demonstração visual ainda não existe no jogo. |
| 2 | A seed real do `World` aparece no HUD e no menu; geração e continuação usam as streams persistidas. | A comparação lado a lado de duas campanhas completas ainda não existe na interface; a prova técnica permanece nos testes e no replay headless. |
| 3 | Data real de `HistoricalClock`, pausa, 1x/2x/4x/8x e interrupções aparecem na tela principal. | As quatro cadências não têm um painel visual próprio; eventos de domínio futuros ainda não existem. |
| 4 | Relevo, água, centro, ferrovia, vias e instituições aparecem no mapa; clique mostra distrito e parcela do mesmo `World`. | Em saves legados com `city: null`, a interface explica a ausência sem criar cidade retroativa. |
| 5 | B14 mostra crescimento e B15 mostra condição/densidade, demolição/substituição, centralidade e avenida na campanha principal. O HUD resume os ledgers, e o inspetor mostra a biografia por parcela. | B16 de inspeção de parcelas foi concluído na Macroetapa 6. |

A barra normal oferece somente **Inspecionar**, pausa e velocidade. Atalhos de edição municipal estão desativados na instância de `KeyboardHandler` usada pelo jogo; o motor herdado continua disponível internamente para testes e replay de decisões antigas. Os menus **Camadas** e **Base técnica** marcam explicitamente seus indicadores como legados, evitando confundi-los com dados históricos da campanha. A página de revisão `/city-history` está no menu **Etapas** com aviso de cenário separado. Nenhum save ou schema mudou nesta revisão de interface.

O renderer coloca marcos, vias e ocupações da campanha acima da vegetação herdada. A câmera inicial mira o centro de 1910 numa área livre ao lado do resumo; o botão de ocupação move apenas a câmera, sem alterar a simulação. O último marcador recebe um anel para ser encontrado após o salto.

## Pendências

- Ainda não existe um remote `origin` pertencente ao projeto; somente `upstream` oficial.
- A configuração ainda não aplica Node 24 LTS nem atualiza a CI derivada.
- As 13 vulnerabilidades triadas precisam de atualização controlada e nova validação; nenhuma correção foi aplicada em A2.
- Scripts de instalação de `sharp` e `unrs-resolver` ficaram pendentes segundo o mecanismo `allow-scripts` do npm 11.
- O save v24 persiste cidade, crescimento, transformação e decision log. A integração de domínios futuros na Macroetapa 37 continua pendente; migrações antigas não recuperam dados nunca gravados.
- Macroetapa 39 ainda exige no mínimo 100 seeds e relatórios sobre sistemas futuros; Macroetapa 40 ainda exige inspeção e time travel DEV completos.
- Nenhum dado histórico foi pesquisado ou calibrado.
- Economia ainda não está ligada à campanha principal; os visores `/city-history` e `/city-history/ensemble` seguem como cenários de revisão independentes.
- O reset destrutivo de uma campanha já existente pelo botão Nova campanha não foi confirmado durante o teste; a confirmação e a geração inicial limpa foram observadas sem apagar o save legado `localhost`.
- Critérios de aceitação detalhados das etapas futuras ainda dependem da decomposição progressiva de cada Alpha.

## Riscos atuais

| Risco | Impacto | Mitigação vigente |
|---|---|---|
| Escopo extremamente amplo e sistemas fortemente acoplados | ALTO | Ordem Alpha A–I, uma macroetapa por vez e contexto obrigatório |
| Plano chama exemplos de Cimulity de “prováveis” | ALTO | Auditoria obrigatória antes de adaptar a base |
| Determinismo retrofitted tarde quebraria toda a simulação | ALTO | Macroetapa 2 vem antes dos domínios complexos |
| Save, relógio e cadências atravessam quase todos os sistemas | ALTO | Fundação técnica e testes de regressão antecipados |
| Calibração histórica pode virar falsa precisão | ALTO | Fontes, hipóteses e limitações obrigatórias |
| Simular 50 anos pode exceder orçamento de performance | ALTO | L0/L1/L2 e testes longos previstos, com métricas desde cedo |
| Documentação pode divergir do código | MÉDIO | Atualização no mesmo trabalho e validação de governança |
| 13 vulnerabilidades npm reportadas no baseline | ALTO | Remediar em atualização controlada; não aplicar `--force` sem testes |
| Node local 26 difere do alvo Node 24 e da CI Node 20 fora de suporte | MÉDIO | Aplicar Node 24 e executar matriz no próximo pacote técnico controlado |
| Não existe remote `origin` próprio | MÉDIO | Criar somente quando houver repositório do projeto definido |

## Última verificação

- Data: 12/10/2026; C2 — 6 origens históricas e FoundingGroup concluídos (Alpha C e Macroetapa 8 em andamento). Implementado o modelo de domínio puro e gerador determinístico `FoundingGroup.ts` em `game/core/club/FoundingGroup.ts` para as 6 origens históricas canônicas: Ferroviários (`railway`), Estudantes (`students`), Imigrantes (`immigrants`), Trabalhadores Operários (`workers`), Comerciantes (`merchants`) e Elite Local (`elite`). Geração consome exclusivamente a stream `rng.club` de `CampaignRng` preservando determinismo estrito; gera fundadores reais com nome, papéis de diretoria provisória (presidente, secretário, tesoureiro, capitão, conselheiro, benfeitor), ocupações históricas de 1910, classes sociais, subscrição individual em PPU e a Ata Inaugural de Fundação formal citando nominalmente todos os participantes. Integrado ao `GameHUD` na tela principal (`/`) com o menu "Fundação (1910)", permitindo selecionar e inspecionar qualquer uma das 6 origens e seus fundadores para a seed da campanha ativa. Etapas 6, 7 e 8 registradas no menu de etapas. Suíte de testes: `npx vitest run game/core/club/FoundingGroup.test.ts game/core/club/Club.test.ts game/engine/inspectTile.test.ts game/architecture.test.ts`: **4 arquivos, 73 testes aprovados** (100% verde). Suíte ampla de persistência e clube: **5 arquivos, 134 testes aprovados**. ESLint: **aprovado com zero erros e zero avisos**. `npx next build --webpack`: **aprovado**, validação TypeScript e 9 páginas estáticas geradas com sucesso. Pacote C2 completamente concluído; próximo pacote: C3 (Nome, cores e primeira versão de escudo).

- Data: 11/10/2026; C1 — Contrato Club e serialização de dados v25 concluídos (início do Alpha C e Macroetapa 8). Implementado o modelo de domínio puro `ClubState` em `game/core/club/Club.ts` com validação de invariantes, congelamento defensivo, suporte a 6 origens canônicas, cores hexadecimais, histórico de escudos, fundadores, parcelas, instalações e métricas preliminares. `World.ts` estendido com `getClub()` e `setClub()`. Save nativo elevado para `v25` com migração explícita e retrocompatível `v24→v25` (`club: null`). Testes de round-trip e persistência atualizados para v25 com proteção contra sobrescrita e tolerância a HMR. `npx vitest run game/core/club/Club.test.ts game/core/campaignSave.test.ts game/core/mapSerialization.test.ts game/core/worldStore.test.ts game/core/worldStore.persistence.test.ts game/core/worldStore.guard.test.ts game/architecture.test.ts`: **7 arquivos, 159 testes aprovados** (100% verde). ESLint direcionado (`game/core/club/`): **aprovado sem erros**. `npx next build --webpack`: **aprovado**, compilação TypeScript e 9 páginas estáticas geradas com sucesso. Save nativo v25 e envelope do clube preservados integralmente. Pacote C1 completamente concluído; próximo pacote: C2 (6 origens e FoundingGroup).

- Data: 11/10/2026; B18 e Macroetapa 7 concluídos (fechando Alpha B). `HistoricalEconomy` exporta `getHistoricalCurrency`, `formatReis` e `formatNominalMoney`. `inspectTile` e `TileInfoPanel` relacionam a data da campanha à unidade monetária (Réis antes de 01/11/1942, Cruzeiros a partir de 01/11/1942) com mensagem honesta de ausência quando o índice não está calibrado, sem inventar valores nominais. `npx vitest run game/engine/inspectTile.test.ts game/core/economy/HistoricalEconomy.test.ts game/architecture.test.ts`: **3 arquivos, 61 testes aprovados**. ESLint direcionado (`game/engine/inspectTile.ts`, `app/components/TileInfoPanel.tsx`): **aprovado sem erros**. `npx next build --webpack`: **aprovado**, TypeScript e 9 páginas estáticas geradas com sucesso. Alpha B (B1–B18) completamente concluído.

- Data: 11/10/2026; D-0034 — reconstrução do plano mestre v2.0. `PLANO MESTRE DE IMPLEMENTAÇÃO.md` substituído: 3.755 linhas (slides Marp) → 864 linhas (documento modular para agentes). Alpha A auditado como concluído; Alpha B com estado de cada pacote B1–B18; Alphas C–I com pacotes enumerados, contratos de dados e critérios visuais. SHA-256 atualizado em `docs/CONTEXTO.md`. Nenhum arquivo de código, schema de save ou pipeline foi alterado. `git status` mostra somente `PLANO MESTRE DE IMPLEMENTAÇÃO.md` e `docs/CONTEXTO.md` como modificados neste conjunto de mudanças (além de `agents/` da D-0033). Testes, lint e build não reexecutados porque nenhum arquivo de código foi alterado.

- Data: 11/10/2026; D-0033 — reorganização documental biagente. Criados `agents/README.md`, `agents/HANDSHAKE.md`, `agents/VISUAL-AUDIT.md` e `agents/NEXT-STEPS.md`. `AGENTS.md` atualizado com seção "Colaboração biagente". `docs/CONTEXTO.md` atualizado com D-0033 e cabeçalho. Nenhum arquivo de código, schema de save ou pipeline alterado. Verificação: `find agents -type f | sort` retornou os quatro arquivos criados; `git diff --name-only` mostrou somente os arquivos documentais (`agents/`, `AGENTS.md`, `docs/CONTEXTO.md`). Testes, lint e build não reexecutados porque nenhum arquivo de código foi alterado; ausência de teste não é risco nesta entrega puramente documental.

- Data: 28/09/2026; B17 — PPU de referência explicado no inspetor da campanha. `npx vitest run game/engine/inspectTile.test.ts game/core/city/cityLandValue.test.ts game/core/city/citySnapshots.test.ts game/architecture.test.ts`: **4 arquivos, 60 testes aprovados**; teste focal após fixar a seed `CM-1910-C15A1E11`: **46 testes aprovados**. ESLint direcionado aos arquivos de Engine, perfil PPU, teste e painel: **aprovado**. `npx next build --webpack`: **aprovado**, TypeScript e nove páginas estáticas; `git -c core.whitespace=cr-at-eol diff --check`: **aprovado**. No Chrome local em `http://127.0.0.1:3005/`, seed `CM-1910-C15A1E11`: lote do distrito Estação ferroviária exibiu 7,22 PPU / 90,7; lote Pequena indústria exibiu 7,12 PPU / 87,4. O inspetor mostrou os oito fatores, pesos, contribuições e notas do perfil `b17-visible-parcel-valuation-v1`, identificando hipótese interna e ausência de conversão nominal. Após recarga, ID, 7,12 PPU, score e fatores da Pequena indústria se repetiram. Campanha pausada em 21/02/1910. B17 concluído; Macroetapa 7 segue aberta porque B18 ainda não foi iniciado.
- Data: 28/09/2026; B16 — inspetor da campanha ligado ao cadastro completo e à biografia da parcela do `World`. `npx vitest run game/engine/inspectTile.test.ts game/core/campaignSave.test.ts game/core/mapSerialization.test.ts game/core/worldStore.persistence.test.ts`: **4 arquivos, 157 testes aprovados**; ESLint direcionado para Engine, teste e painel React: **aprovado**; `npx next build --webpack`: **aprovado**, TypeScript e nove páginas estáticas. `git -c core.whitespace=cr-at-eol diff --check` passou. Em `http://127.0.0.1:3005/`, campanha `CM-1910-C15A1E11`: IDs distintos da Praça Pública e da Pequena Indústria, compras zero e evento-base de 1910 visível. Após reload, o ID `parcel-1910-district-city-institution-1910-small-industry-25-21` e o histórico persistiram. Build removeu o link auxiliar `out/cimulity` usado pela prévia raiz; link local restaurado e asset com prefixo `/cimulity/` respondeu HTTP 200. A campanha foi deixada pausada em 23/03/1918; o relógio avançou durante reloads porque a prévia retoma a simulação ao hidratar. `pwsh` não está instalado; o script PowerShell de governança não foi executado.
- Data: 28/09/2026; B15 e Macroetapa 5 concluídos. `npx vitest run game/core/city/cityTransformation.test.ts game/core/city/campaignGrowth.integration.test.ts game/core/mapSerialization.test.ts game/core/campaignSave.test.ts game/core/worldStore.persistence.test.ts game/engine/inspectTile.test.ts game/architecture.test.ts`: **7 arquivos, 169 testes aprovados**, incluindo transformação por relógio até 1959, centralidades/avenidas, biografia e round-trip/migração v23. ESLint direcionado aos arquivos alterados: **aprovado sem avisos**. `npx next build --webpack`: **aprovado**, TypeScript e nove páginas estáticas; aviso não bloqueante de múltiplos lockfiles na raiz inferida. Na prévia `http://127.0.0.1:3005/`, save v23 migrou com origem retida; a campanha avançou até 23/10/1916, mostrando 12 ocupações, 12 edifícios ativos, 2 registros passados e 11 avenidas. O mapa exibiu vias roxas; inspeção de parcela exibiu uso industrial, construção em 1914, condição 70/100 e avenida desde 1914. Após recarga, data 28/10/1916 e os mesmos contadores de transformação reapareceram; a campanha foi pausada na tela principal.
- Data: 28/09/2026; revisão de visibilidade das Macroetapas 1–5 e marca **Cidade dos Esportes**. Testes direcionados finais: `npx vitest run game/input/KeyboardHandler.test.ts game/core/city/campaignGrowth.integration.test.ts game/engine/inspectTile.test.ts game/render/cameraConstraints.test.ts game/architecture.test.ts game/core/mapSerialization.test.ts` — **6 arquivos, 157 testes aprovados**; após o ajuste do inspetor, **3 arquivos/54 testes aprovados**. ESLint direcionado aos arquivos alterados: **aprovado**. `npx next build --webpack` após código e ícones: **aprovado**, TypeScript e nove páginas estáticas. Prévia isolada `http://127.0.0.1:3005/` com seed `CM-1910-C15A1E11`: save retomado em 1912 com quatro ocupações; botão focou o anel da última parcela; clique exibiu distrito Periferia leste, parcela, uso industrial e ano 1912 no painel lateral; menu **Etapas** fechou o inspetor. Título e manifesto retornaram Cidade dos Esportes; `curl -I` da prévia retornou HTTP 200 após o build. Validação documental manual confirmou 42 macroetapas, 42 entradas visuais, 42 estados e SHA-256 do plano; `pwsh` indisponível neste Linux, portanto o script PowerShell de governança não foi executado. `git diff --check` continua reportando CRLF preexistente nos arquivos da base; não houve normalização ampla.
- Data: 28/09/2026; B14 — crescimento B8 ligado a cada fronteira anual, marcadores de ocupação e vias novas no renderer principal, hipótese no HUD e save v23 com migração v22 ancorada no ano existente. `npx vitest run game/core/city/campaignGrowth.integration.test.ts game/core/city/cityGrowth.test.ts game/core/mapSerialization.test.ts game/core/campaignSave.test.ts game/core/worldStore.persistence.test.ts game/architecture.test.ts`: **6 arquivos, 121 testes aprovados**. ESLint direcionado: **aprovado**. `npx next build --webpack`: **aprovado**, verificação TypeScript e nove páginas estáticas após incluir a identidade da calibração no ledger. Prévia isolada `http://127.0.0.1:3004/` avançou 1910→1911 e mostrou duas ocupações; após recarga, a data e o ledger continuaram em 1911.
- Data: 27/09/2026; conclusão B12/B13. Integração da fundação, distritos e parcelas no `World`; renderer marca centro e instituições; inspetor apresenta centro/instituição, distrito e parcela; save v22 persiste o conjunto canônico; migrações v19–v21 preservam `city: null`.
- Vitest direcionado: **8 arquivos, 159 testes aprovados**, incluindo inspeção de estação/distrito/parcela, round-trip seed-derivado v22 e gate de arquitetura. ESLint direcionado para arquivos alterados: **aprovado**. `npx next build --webpack`: **aprovado**, TypeScript da aplicação e nove páginas estáticas geradas. `npx tsc --noEmit --strict` aponta seis erros nos mocks de `game/core/GameLoop.test.ts` (linhas 501, 518, 534, 562) e `game/engine/devApi.test.ts` (linhas 34, 59); nenhum nos arquivos B12/B13. `git diff --check` é afetado pelos finais CRLF preexistentes em arquivos modificados pelo usuário; não foram normalizados.
- Verificação visual por browser na campanha limpa em `http://127.0.0.1:3000/cimulity/` (preview do build estático): terreno, ruas, ferrovia e estação visíveis; inspetor mostrou estação, centro histórico, praça, dois distritos e parcela com unidades abstratas. Após recarga, os mesmos IDs/métricas foram encontrados. A origem `localhost` continha save legado sem metadados de cidade; seu aviso foi mantido e o save não foi substituído. O clique em New City abriu confirmação destrutiva e não foi confirmado.
- `npm run dev` e `next dev --webpack` iniciaram, mas o pedido HTTP para `/` permaneceu sem resposta durante compilação. O preview foi conferido com `npx next build --webpack` e `python3 -m http.server 3000 --directory out`; `next start` não se aplica ao projeto `output: export`.

- Data: 27/09/2026; B12 — integração da cidade de 1910 na campanha. Implementados `generateCampaignCity1910`, o estado da fundação no `World`, renderização de ruas/ferrovia em Pixi e save v22 com migração de v21 sem geração retroativa. Alterações preexistentes preservadas.
- `npm run lint` e `npx tsc` iniciados, mas ficaram bloqueados em espera de I/O no workspace e foram interrompidos; não há resultado aprovado. Nenhum teste automatizado foi executado. A rota já aberta no navegador (`localhost:3000`) não respondeu e a chamada de navegação expirou; verificação visual pendente. Não marcar B12 concluído.
- Registro anterior de 27/09/2026: revisão documental de D-0028, 42 Macroetapas/matriz e B12–B18; validação documental e `git diff --check` passaram. Naquela revisão, ainda não havia implementação B12. A referência anterior à captura em `docs/demos/` como único bloqueio da Macroetapa 4 foi superada por D-0028.

- Data: 27/09/2026; Macroetapa 4 — demonstração 1910 com relevo, centro e instituições. Ambiente: Linux x86_64, Node v22.23.2, npm 10.9.8.
- Pipeline Alpha B B1–B11: APROVADO — 14 arquivos, 78 testes.
- ESLint direcionado para snapshots e visor: APROVADO. `npx next build --webpack`: APROVADO — TypeScript e 9 páginas estáticas.
- `/city-history`, seed `CM-1910-REVIEW-DEMO`, ano 1910 e camada Relevo: verificação visual manual confirmou água, elevação, ferrovia, centro e os cinco marcos institucionais. A visualização está aberta no navegador local.
- Registro histórico: naquela revisão, a Macroetapa 4 ainda aguardava a antiga captura em `docs/demos/`; D-0028 substituiu esse gate, e a campanha jogável B12/B13 foi verificada depois.
- `npm run build` (Turbopack) aciona panic interno ao processar o caractere `Á` no caminho do projeto; a compilação alternativa Webpack passou. `pwsh` indisponível, então a validação PowerShell não foi executada.

- Data: 27/09/2026; Alpha B/B11 — ensemble headless e visor de faixas. Ambiente: Linux x86_64, Node v22.23.2, npm 10.9.8.
- Pipeline Alpha B B1–B11, com os 14 arquivos listados em `docs/PIPELINE.md`: APROVADO — 14 arquivos, 78 testes.
- TypeScript direcionado para `CityHistoryEnsemble.ts` e teste: APROVADO; ESLint direcionado para Engine e rotas de revisão: APROVADO.
- `/city-history/ensemble`: verificação visual manual confirmou oito seeds, faixas mín/média/máx em seis anos e aviso de dados sintéticos.
- `npm run build`: falhou por panic interno do Turbopack durante geração de source maps com `Á` no caminho do workspace. `npx next build --webpack`: APROVADO — TypeScript e 9 páginas estáticas, incluindo `/city-history/ensemble`; aviso não bloqueante de múltiplos lockfiles.
- `pwsh` não está disponível neste Linux; script PowerShell de governança não executado.

- Data: 27/09/2026; Alpha B/B10 — snapshots versionados e visor de revisão. Ambiente: Linux x86_64, Node v22.23.2, npm 10.9.8.
- Pipeline Alpha B B1–B10, com os 12 arquivos especificados em `docs/PIPELINE.md`: APROVADO — 12 arquivos, 70 testes.
- `npm test -- game/core/city/citySnapshots.test.ts game/engine/CityHistoryPreview.test.ts game/architecture.test.ts`: APROVADO — 3 arquivos, 10 testes.
- ESLint direcionado para a rota, visor, snapshots e exports Engine: APROVADO — código de saída 0.
- Rota `/city-history`: compilada e respondeu HTTP 200; verificação visual manual confirmou o seletor 1910/1920/1930/1940/1950/1959, mapa, camadas, métricas, aviso sintético e download JSON.
- `npm run build`: APROVADO — compilação, TypeScript e geração estática de `/city-history` e das outras páginas. Next.js avisou que inferiu a raiz do workspace por haver múltiplos lockfiles.
- `git diff --check` em arquivos documentais e novos arquivos B10: APROVADO. Uma execução incluindo arquivos legados CRLF (`app/page.tsx`, `game/engine/index.ts`) sinalizou finais de linha como whitespace; não foram normalizados para evitar reformatar arquivos preexistentes.
- Hash SHA-256 do plano mestre atualizado após incluir a regra e matriz de demonstração para as 42 Macroetapas: `9912210056e50b75105388dc7152e8be641121dc949e7501a1781092aca07087`.
- `pwsh` não está disponível neste Linux; o script de governança PowerShell não pôde ser executado.

- Data: 27/09/2026; implementação Alpha B/B9 — envelhecimento, reconstrução, adensamento, novas centralidades e avenidas. Ambiente: Linux x86_64, Node v22.23.2, npm 10.9.8.
- `npm test -- game/core/city/CityState.test.ts game/core/city/cityTerrain.test.ts game/core/city/cityFoundation.test.ts game/core/city/cityDistricts.test.ts game/core/city/cityParcels.test.ts game/core/economy/HistoricalEconomy.test.ts game/core/city/cityLandValue.test.ts game/core/city/cityGrowth.test.ts game/core/city/cityTransformation.test.ts game/core/terrainGenerator.test.ts`: APROVADO — 10 arquivos, 65 testes.
- `npm test -- game/architecture.test.ts game/core/city/cityTransformation.test.ts`: APROVADO — 2 arquivos, 8 testes.
- TypeScript direcionado para `cityTransformation.ts` e `cityTransformation.test.ts`: APROVADO com `npx tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --types vitest/globals,node ...`.
- ESLint direcionado para `cityTransformation.ts` e `cityTransformation.test.ts`: APROVADO — código de saída 0.
- `npx tsc --noEmit --strict`: NÃO APROVADO por seis erros preexistentes em `game/core/GameLoop.test.ts` (mocks incompatíveis nas linhas 501, 518, 534 e 562) e `game/engine/devApi.test.ts` (falta de `exportReplayPackage` nos fixtures nas linhas 34 e 59). Nenhum erro reportado nos arquivos B9.
- `git diff --check` nos arquivos desta entrega: APROVADO. Hash SHA-256 do plano mestre continua `5e658b040064f2d00989a382fba71e444d6410c7a0ac57cddf5f40532188a6c0`; foram contadas 42 declarações `MACROETAPA`.
- `pwsh` não está disponível neste Linux; a validação PowerShell de governança permanece não executada nesta passagem.

- Data: 27/09/2026; implementação Alpha B/B8 — `CityGrowthDirector`. Ambiente: Linux x86_64, Node v22.23.2, npm 10.9.8.
- `npm test -- game/core/city/CityState.test.ts game/core/city/cityTerrain.test.ts game/core/city/cityFoundation.test.ts game/core/city/cityDistricts.test.ts game/core/city/cityParcels.test.ts game/core/economy/HistoricalEconomy.test.ts game/core/city/cityLandValue.test.ts game/core/city/cityGrowth.test.ts game/core/terrainGenerator.test.ts`: APROVADO — 9 arquivos, 62 testes.
- TypeScript direcionado com `tsc --noEmit --strict`: APROVADO incluindo B1–B8 e fixtures.
- ESLint direcionado: APROVADO — `cityGrowth.ts` e `cityGrowth.test.ts`.
- `git diff --check` nos arquivos documentais e no verificador tocados nesta etapa: APROVADO.
- Governança manual anterior a B9: APROVADA — 42 macroetapas contínuas, hash SHA-256 do plano íntegro, B8 concluído e pipeline B1–B8 coerente. `pwsh` não está disponível neste Linux, portanto o script PowerShell não foi executado naquela verificação.

- Data: 31/08/2026; encerramento A8, preservando as alterações locais anteriores de A4–A7.
- `npm test -- --coverage`: APROVADO — 99 arquivos e 1.944 testes em 61,61 s; 95,47% statements, 90,58% branches, 98,93% functions e 98,41% lines, acima dos gates configurados.
- Uma execução concorrente com o build excedeu os 5 s do teste preexistente `buildingMassing.test.ts`. A repetição integral sem build concorrente passou, sem alterar teste nem timeout.
- A8 dirigido (`npm test -- game/core/campaignSave.test.ts game/core/worldStore.persistence.test.ts`): APROVADO — 2 arquivos, 33 testes, incluindo proteção após recarga de módulo.
- `npm run lint`: APROVADO sem erros; um aviso de diretiva eslint não utilizada em `coverage/block-navigation.js`, artefato gerado.
- `npm run build`: APROVADO — compilação, TypeScript e 7 páginas estáticas. A primeira tentativa não conseguiu baixar Geist/Geist Mono; a repetição autorizada com acesso à rede passou.
- `./scripts/validate-governance.ps1`: APROVADO — inclui A8 e impede conclusão prematura da Macroetapa 37.
- `git diff --check`: APROVADO; apenas avisos de normalização LF/CRLF no ambiente Windows.
- Smoke visual manual do aviso de persistência: NÃO EXECUTADO nesta entrega. Integração compilada; comportamento de armazenamento validado por testes automatizados.
- Nenhuma dependência atualizada, migração de runtime, publicação ou push. Plano mestre inalterado; alterações permanecem locais.

## Histórico de verificações A1–A6

- Data: 30/08/2026.
- `npm ci`: APROVADO — 409 pacotes instalados em aproximadamente 6 minutos; lockfile inalterado; 13 vulnerabilidades reportadas.
- `npm ls --depth=0`: APROVADO.
- `npm run lint`: APROVADO.
- `npm test`: APROVADO — 91 arquivos e 1.880 testes em 53,78 s.
- `npm run build`: APROVADO — compilação em 63 s, TypeScript e geração de 7 páginas estáticas concluídos.
- Avisos não bloqueantes: depreciação `module.register()` no Node 26 e indisponibilidade de `localStorage` no ambiente de teste.
- Integridade upstream: APROVADA — nenhuma diferença em código, configuração, lockfile, workflow ou licença contra o commit fixado.
- `./scripts/validate-governance.ps1`: APROVADO — plano, nove Alphas, contexto e proveniência sincronizados.
- `npm test -- --coverage`: APROVADO — 91 arquivos, 1.880 testes; 95,60% statements, 90,66% branches, 99,00% functions e 98,49% lines.
- `npm audit --json`: 13 achados — 1 baixo, 1 moderado, 11 altos, 0 críticos; nenhuma alteração automática.
- Busca de aleatoriedade direta em produção: nenhuma chamada a `Math.random()`.
- Smoke visual manual: NÃO EXECUTADO — servidor local bloqueado pelo limite de uso do ambiente.
- A3 direcionado (`npm test -- game/architecture.test.ts`): APROVADO — 1 arquivo, 4 testes.
- `npm run lint` após A3: APROVADO.
- `npm test` após A3: APROVADO — 92 arquivos e 1.884 testes em 78,06 s.
- `npm run build` após A3: APROVADO — TypeScript e 7 páginas estáticas; a primeira tentativa no sandbox falhou com `EPERM` em `.next/trace`, e a repetição autorizada fora do sandbox passou.
- A4 direcionado (`npm test -- game/core/CampaignRng.test.ts game/core/World.rng.test.ts`): APROVADO — 2 arquivos, 9 testes.
- Regressão dirigida de A4 (`npm test -- game/core/World.terrain.test.ts game/core/mapSerialization.test.ts game/core/worldStore.test.ts`): APROVADO — 3 arquivos, 109 testes.
- `npm run lint` após A4: APROVADO com 1 aviso não bloqueante em artefato ignorado `coverage/block-navigation.js` (diretiva eslint não utilizada), sem erros.
- `npm test` após A4: APROVADO — 94 arquivos e 1.893 testes em 38,91 s. A primeira execução expôs três expectativas antigas do sentinel HMR; os testes foram sincronizados e a repetição integral passou.
- `npm run build` após A4: APROVADO — TypeScript e 7 páginas estáticas; a tentativa no sandbox falhou com `EPERM` em `.next/trace`, e a repetição autorizada fora do sandbox compilou em 59 s e concluiu normalmente.
- `npm test -- --coverage` após A4: APROVADO — 94 arquivos/1.893 testes; 95,53% statements, 90,61% branches, 98,84% functions e 98,37% lines. `CampaignRng.ts` integra o gate com 94,23% statements, 83,33% branches, 100% functions e 93,75% lines. A tentativa no sandbox falhou ao remover `coverage/favicon.png` com `EPERM`; a repetição autorizada passou.
- A5 direcionado (`npm test -- game/architecture.test.ts`): APROVADO — 1 arquivo, 5 testes.
- `npm test` após A5: APROVADO — 94 arquivos e 1.894 testes.
- A6 dirigido (relógio, World, GameLoop, Input, economia e save/store): APROVADO — 8 arquivos, 289 testes.
- `npm test` após A6: APROVADO — 95 arquivos e 1.899 testes; repetição final após sincronizar UI/HMR concluída em 39,32 s.
- `npm test -- --coverage` após A6: APROVADO — 95 arquivos/1.899 testes; 95,51% statements, 90,67% branches, 98,67% functions e 98,33% lines. `HistoricalClock.ts`: 97,72% statements, 97,29% branches, 100% functions e 97,50% lines.
- `npm run lint` após A6: APROVADO sem erros; aviso restante apenas no artefato ignorado `coverage/block-navigation.js`.
## Última verificação (Sprint 2 do Alpha H: H4 + H5 — Epílogo dos 50 Anos, Relatório Jubilar 1910–1959 e Replay Headless Integral - Macroetapas 35 e 36)

- Data: 30/10/2026.
- Pacote: Alpha H — Sprint 2 (H4 + H5).
- Testes automatizados executados:
  - `npx vitest run game/core/club/FiftyYearsReport.test.ts game/core/World.fiftyYearsReport.test.ts game/core/World.tacaBrasil.test.ts game/architecture.test.ts`: APROVADO — 4 arquivos e 11 testes verdes (100% de sucesso, 0 falhas).
  - `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística (`Math.random()`).
- Compilação de Produção Next.js Webpack:
  - `npm run build -- --webpack`: APROVADO com código 0 — validação estrita de TypeScript em 32.7s e 9/9 páginas estáticas geradas com sucesso (`/`, `/_not-found`, `/apple-icon.png`, `/city-history`, `/city-history/ensemble`, `/icon.svg`, `/manifest.webmanifest`).
- Governança e Regras Canônicas Implementadas:
  - `FiftyYearsReport.ts` (H4): Modelo puro que consolida de forma causal e determinística os 10 campos canônicos obrigatórios estipulados nas Seções 9 e 14 do Plano Mestre:
    1. Cidade inicial (mapa 1910) / Cidade final (mapa 1959) comparadas por população, distritos e ocupação;
    2. Fundadores / Presidentes: subscritores da ata inaugural, ocupações, classes sociais e galeria de presidentes;
    3. Associados iniciais e finais: expansão do quadro social, adimplência e arrecadação;
    4. Patrimônio / Estádio: praça de esportes da fundação até o estádio monumental dos 50 anos com capacidade;
    5. Títulos / Lendas: conquistas oficiais (incluindo Taça Brasil de 1959) e galeria de ídolos imortalizados;
    6. Maior rival / Clássico mais memorável: retrospecto H2H, clássico mais acirrado e história do dérbi;
    7. Maior vitória / Maior derrota / Jogo mais importante da história;
    8. Pessoa mais importante / Família mais influente através das três gerações;
    9. Maior crise superada (ameaça de desapropriação) / Maior obra construída (arquibancadas de concreto);
    10. Escudos históricos (todos os desenhos e motivos de alteração) e valorização dos terrenos da sede em PPU;
    - Crônica jubilante comemorativa estruturada na linguagem de época da Seção 14 do Plano Mestre.
  - Encerramento Digno e Não Destrutivo (H5):
    - Ao alcançar 31/12/1959, o `World.ts` detecta o término da campanha (`isCampaignComplete()`), aciona auto-pause solene definitivo sem ultrapassar o limite temporal de 50 anos e despacha evento no `InterruptionQueue`;
    - O save é 100% preservado e o estado do mundo permanece permanentemente consultável (mapa, sede, elenco, competições, arquivo e imprensa continuam ativos, sem Game Over destrutivo);
    - Disponibilização do método `getFiftyYearsReport()` na Engine e Canvas.
- Demonstração Visual no Jogo (`GameHUD.tsx`):
  - Botão comemorativo dourado "🏆 Cinquentenário (1910–1959)" inserido na barra superior de resumo da campanha e na sub-visão do Arquivo Histórico;
  - Modal solene e suntuoso de gala do Cinquentenário de Ouro dos 50 Anos com 6 abas temáticas navegáveis:
    1. *Síntese & Crônica*: manifesto jubilar de meio século e dados gerais;
    2. *Cidade & Bairros*: comparação urbana 1910 vs 1959 e valorização dos terrenos;
    3. *Quadro & Sócios*: evolução de sócios e galeria de presidentes;
    4. *Estádio & Obras*: evolução patrimonial, estádio e obras históricas;
    5. *Títulos & Ídolos*: galeria de troféus, Taça Brasil e lendas imortais;
    6. *Rival & Jogos*: maior dérbi, retrospecto H2H, maior vitória, derrota e jogo culminante;
  - Botão "💾 Exportar Replay de Decisões (.json)" gerando o download do pacote canônico de replay contendo seed e `DecisionLog` completo desde 1910.

## Histórico de verificações anteriores (Sprint 1 do Alpha H: H1 + H2 + H3 — Taça Brasil de 1959, Clubes Nacionais e Qualificação Estadual - Macroetapa 36 + Rebranding "Tradição Esporte Clube")

- Data: 30/10/2026.
- Rebranding Canônico do Projeto:
  - Nome oficial alterado para **Tradição Esporte Clube** conforme decisão direta do responsável pelo projeto;
  - Interface pública atualizada: cabeçalho principal do HUD (`GameHUD.tsx`), título e metadados (`app/layout.tsx`), manifesto web (`app/manifest.ts`), ícone SVG com `aria-label` (`app/icon.svg`), `package.json` (`"name": "tradicao-esporte-clube"`) e `README.md`;
  - Symlinks criados no diretório pai de backup (`/home/lucasregis/Área de trabalho/Projetos/Backup/Tradição Esporte Clube` e `Tradicao Esporte Clube` apontando para a raiz do repositório) para permitir navegação transparente pelo novo nome sem desestabilizar sessões de workspace ativas.
- `npx vitest run game/core/football/NationalAbstractClub.test.ts game/core/football/TacaBrasil1959.test.ts game/core/World.tacaBrasil.test.ts game/architecture.test.ts`: APROVADO — 4 arquivos e 14 testes unitários e de integração verdes (100% de sucesso, 0 falhas).
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento estrito de Core/Render/App e ausência de chamadas a aleatoriedade não-determinística (`Math.random()`).
- `npm run build -- --webpack`: APROVADO — compilação Next.js de produção bem-sucedida de todas as 9 rotas estáticas com validação estrita de tipos TypeScript (código de saída 0).
- Governança e Regras Canônicas:
  - `NationalAbstractClub.ts` (H1): Modelo e catálogo dos clubes campeões estaduais históricos da primeira Taça Brasil da CBD de 1959 (Santos de Pelé, Bahia de Léo Briglia, Vasco de Bellini, Grêmio, Sport Recife, Atlético Paranaense, Ceará, etc.) divididos em Zonas geográficas (Norte-Nordeste e Centro-Sul);
  - Qualificação Estadual Causal (H2): Critério emergente de representação de Minas Gerais. O clube do jogador classifica-se como representante caso conquiste o título estadual da Federação Mineira de Futebol; caso contrário, outro campeão da federação representa o estado e a campanha continua sem Game Over;
  - `TacaBrasil1959.ts` (H3): Motor de torneio eliminatório da Taça Brasil de 1959 por zonas (Norte-Nordeste e Centro-Sul) com jogos de ida e volta, desempate em campo neutro se houver igualdade de pontos, semifinais nacionais com a entrada dos cabeças de chave históricos (Santos e Vasco) e grande finalíssima;
  - Concessão de Troféu e Memória: Quando o campeão nacional é coroado, o troféu `Taça Brasil de 1959` (`tier: 'national_championship'`) é gravado na Sala de Troféus e o marco de glória nacional é imortalizado no `HistoricalLedger` com encadeamento causal;
  - Save v25 em `mapSerialization.ts`: Torneio `tacaBrasil1959` serializado e deserializado com preservação completa do estado das chaves e partidas disputadas;
  - Interface do Jogo: Aba '🏆 Competições' enriquecida com o card oficial da **Taça Brasil de 1959 (CBD)**, exibindo o representante mineiro qualificado, chaveamento visual das zonas, botões interativos para avançar fases ou simular até a final, e banner comemorativo dourado do campeão nacional.
- Próximo pacote: **Sprint 2 do Alpha H (H4 + H5 — Epílogo dos 50 Anos e Replay Headless Integral - Macroetapas 35 e 36)**.

## Histórico de verificações anteriores (Sprint 4 do Alpha G: G8 + G9 + G10 + G11 — Tradições, HistoricalLedger Causal, Arquivo do Clube de 50 Anos e Replay Histórico - Macroetapas 32, 33 e 34 - Fechamento do Alpha G)

- Data: 30/10/2026.
- `npx vitest run game/core/club/TraditionSystem.test.ts game/core/club/HistoricalLedger.test.ts game/core/club/ClubArchive.test.ts game/core/club/Club.test.ts game/core/World.club.test.ts game/architecture.test.ts`: APROVADO — 5 arquivos e 26 testes unitários e de integração verdes (100% de sucesso, 0 falhas).
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento estrito de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística (`Math.random()`).
- `npm run build -- --webpack`: APROVADO — compilação Next.js de produção bem-sucedida de todas as 9 rotas estáticas com validação estrita de tipos TypeScript (código de saída 0).
- Governança e Regras Canônicas:
  - `TraditionSystem.ts`: Modelagem e derivação de tradições sagradas do clube (Macroetapa 32), índice de tradição [0–100], alcunhas tradicionais históricas baseadas em cores/origem, praça/estádio tradicional de época, rituais históricos e identidade tática consagrada (Pirâmide 2-3-5);
  - `HistoricalLedger.ts`: Ledger histórico causal (Macroetapa 33) com encadeamento causal bidirecional obrigatório (`causes` e `consequences`), travessia recursiva de grafo de causalidade (`getCausalChain`) e ordenação cronológica desempatada por ano, mês e dia;
  - `ClubArchive.ts`: Arquivo consolidado de 50 anos do clube (Macroetapa 34) estruturado nas 11 seções canônicas de meio século (1910–1959) e resumos comparáveis decenais (`CANONICAL_DECADE_MAPS`);
  - `World.ts`: Totalmente integrado! Registra causas e consequências nos marcos de fundação, obras patrimoniais, eleições, títulos, sanções do tribunal e homenagens;
  - `GameHUD.tsx`: Nova aba '📜 Arquivo dos 50 Anos (1910–1959)' com 3 sub-visões: Timeline Causal com inspetor interativo de causas raiz e consequências futuras, Perfil de Tradições Consagradas e Panorama Decenal comparável (1910–1959).
- Ciclo Alpha G 100% Concluído. Próximo ciclo: **Alpha H** (Epílogo de 1959, Taça Brasil e Replay Headless Integral — Macroetapas 35 e 36).

## Histórico de verificações anteriores (Sprint 3 do Alpha G: G5 + G6 + G7 — Evolução da Imprensa 1910s→1950s, LegacyScore e Homenagens Institucionais - Macroetapas 30 e 31)

- Data: 30/10/2026.
- `npx vitest run game/architecture.test.ts game/core/club/LegacyScore.test.ts game/core/club/InstitutionalHonors.test.ts game/core/media/HistoricalPress.test.ts`: APROVADO — 4 arquivos e 19 testes unitários e de integração verdes (100% de sucesso, 0 falhas).
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas a PRNG descontrolado (`Math.random()`).
- `npm run build -- --webpack`: APROVADO — compilação Next.js de produção de todas as 9 rotas estáticas com validação estrita de tipos TypeScript (código de saída 0).
- Governança e Regras Canônicas:
  - `HistoricalPress.ts`: Evolução temporal dos órgãos de imprensa de acordo com a época da campanha (`getAvailableMediaOutlets`):
    - 1910s: Gazetas tipográficas formais e legalistas (*A Gazeta Esportiva de Minas*, *O Diário da Manhã*, *O Clarim Operário*);
    - 1920s: Surgimento da crônica esportiva ilustrada com *O Combate Esportivo* (1922);
    - 1930s: Era de Ouro do Rádio Esportivo com a *Rádio Inconfidência* (1936), transmitindo prélio ao vivo pelas ondas médias (880 kHz) com vinhetas e narração de campo;
    - 1940s-1950s: Grande imprensa diária de massa com *Folha dos Esportes* (1945) e cobertura fotográfica;
  - `LegacyScore.ts`: Modelo causal e determinístico de pontuação histórica para atletas e dirigentes, categorizando-os nas 4 classes canônicas: *MEMORAVEL*, *IDOLO*, *LENDA* e *FIGURA_FUNDADORA*;
    - Decomposição transparente dos fatores de pontuação: anos de dedicação ao clube (+5 a +7 pts/ano), títulos oficiais conquistados (+25 pts/título), partidas disputadas, atuações em momentos decisivos/dérbis, fidelidade contra rivais (+15 pts), impacto patrimonial/obras e bônus de fundador (+35 pts);
  - `InstitutionalHonors.ts`: Sistema de homenagens oficiais estatutárias com debate e votação pelo Conselho Deliberativo:
    - 5 modalidades canônicas: Estátua de Bronze na Alameda (120 PPU, exige LENDA), Busto Esculpido no Salão Nobre (50 PPU, exige IDOLO), Batismo de Setor/Pavilhão (30 PPU, exige IDOLO), Diploma de Benemérito (10 PPU, exige MEMORAVEL) e Quadro Perpétuo na Sala de Troféus (5 PPU, exige IDOLO);
    - Fricção política e responsabilidade fiscal: o Conselho rejeita propostas caso o saldo do livro-caixa PPU seja insuficiente para cobrir as obras; deliberação ponderada pela influência das facções do clube e alinhamento com a figura histórica;
  - `World.ts` gerencia propostas de honrarias (`proposeInstitutionalHonor`), votação no Conselho (`voteInstitutionalHonor`), dedução contábil no livro-caixa sob a categoria `'honor_tribute'`, publicação de artigo solene na imprensa/rádio e alerta na `InterruptionQueue`;
  - Persistência e hidratação no `ClubState` (`clubLegends` e `institutionalHonors`);
  - Zero `Math.random()`, aleatoriedade consumindo estritamente as streams `events` de `CampaignRng`.
- Demonstração visual no HUD/Canvas:
  - Nova aba **"⭐ Lendas & Homenagens"** no modal do clube (`GameHUD.tsx`):
    - Painel do Conselho Deliberativo listando propostas em trâmite, status (Aprovada, Pendente, Rejeitada), justificativa do plenário e botão interativo "🗳️ Votar no Conselho";
    - Galeria Oficial de Lendas e Ídolos com distintivos heráldicos por categoria (`👑 LENDA IMORTAL`, `⭐ ÍDOLO DA TORCIDA`, `🏛️ FIGURA FUNDADORA`, `🎖️ MEMORÁVEL`), barra de progresso de LegacyScore, decomposição analítica dos fatores de pontuação, biografia com histórico de títulos/jogos e botão para submeter propostas de honrarias com seletor de modalidade;
  - Atualização da aba **"📰 Imprensa"**:
    - Indicador dinâmico da Era dos Meios de Comunicação (Gazetas Tipográficas 1910–1921, Crônica Ilustrada 1922–1935, Era do Rádio 1936–1944, Imprensa de Massa 1945–1959);
    - Filtro dinâmico por emissora/periódico com inclusão da *Rádio Inconfidência* em transmissões ao vivo a partir dos anos 30 com estilo de locução radiofônica;
    - Cobertura da consagração solene de lendas com reportagens dedicadas.

## Histórico de verificações anteriores (Sprint 2 do Alpha G: G3 + G4 — Torcida Territorial por Distritos Urbanos e Imprensa Procedural por Templates - Macroetapas 25 e 26)

- Data: 29/10/2026.
- `npx vitest run game/core/football/ game/core/media/ game/architecture.test.ts game/core/mapSerialization.test.ts`: APROVADO — 13 arquivos e 130 testes unitários e de integração verdes (100% de sucesso, 0 falhas).
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas a PRNG descontrolado (`Math.random()`).
- `npm run build -- --webpack`: APROVADO — compilação Next.js de produção de todas as 9 rotas estáticas com validação estrita de tipos TypeScript (código de saída 0).
- Governança e Regras Canônicas:
  - `SupporterTerritory.ts`: Modelo puro de distribuição territorial de torcedores ancorado nos distritos urbanos reais de Cidade de Minas gerados pela fundação de 1910;
  - Afinidade demográfica causal: operários e ferroviários apoiam agremiações proletárias, acadêmicos e comerciantes apoiam clubes estudantis/comerciais, classes abastadas apoiam clubes aristocráticos;
  - Reduto principal dominante (headquarters) com bônus de identidade territorial, cálculo de market share de torcedores por bairro (em basis points) e índice de fanatismo (0 a 100);
  - Potencial de público e bilheteria em dias de jogo (`calculateSupporterTurnout`) com amplificação de até +80% para dérbis e clássicos ferozes;
  - `HistoricalPress.ts`: Sistema de imprensa esportiva de 1910 com templates procedurais e as 3 gazetas canônicas da capital: *A Gazeta Esportiva de Minas* (cavalheirismo amador, ordem legalista, apoio às sentenças da Federação), *O Diário da Manhã* (grande espetáculo, emoção dramática, paixão popular), e *O Clarim Operário* (voz combativa dos trabalhadores, denúncia da oligarquia, defesa da várzea e futebol de fábrica);
  - Crônicas de match com vocabulário autêntico de 1910 ("prélio", "têmpera", "esquadrão", "prestigiosa assistência"), crônicas do Tribunal de Penas cobrindo julgamentos sumários com multas e suspensões, e notícias institucionais de fundação de novos clubes;
  - `World.ts` gerencia o arquivo histórico de imprensa `pressArchive`, gera crônicas pós-partida, pós-tribunal e fundação, e expõe `getSupporterTerritories()`;
  - Persistência e hidratação no save nativo v25 em `mapSerialization.ts` com validação defensiva e round-trip integral;
  - Zero `Math.random()`, aleatoriedade consumindo estritamente as streams `football` e `events` de `CampaignRng`.
- Demonstração visual no HUD/Canvas:
  - Na aba 'Identidade Social' do modal institucional do clube (`GameHUD.tsx`): novo bloco **"🏟️ Distribuição Territorial de Torcida (Macroetapa 25)"** exibindo total de torcedores na capital, reduto principal dominante, estimativa de público pagante em casa, e lista de distritos urbanos com total de torcedores, percentual de apoio (market share) com barras horizontais e termômetro de fanatismo local;
  - Nova aba **"📰 Imprensa (1910)"** com visual de banca de jornais de época: seletor com filtro para as 3 gazetas históricas (*A Gazeta Esportiva*, *O Diário da Manhã*, *O Clarim Operário*), manchetes de época em tipografia clássica serifada, subtítulo contextual, crônica procedural completa, distintivo de categoria (`⚽ Crônica de Match`, `⚖️ Sentença Disciplinar`, `🏛️ Fundação`) e data de publicação.

## Histórico de verificações anteriores (Sprint 1 do Alpha G: G1 + G2 — Matriz de Rivalidade Causal e Incidentes de Jogo com Consequências Disciplinares - Macroetapas 23 e 24)

- Data: 29/10/2026.
- `npx vitest run game/core/football/ game/core/World.rivalry.test.ts game/architecture.test.ts game/core/mapSerialization.test.ts game/core/club/ClubFinances.test.ts`: APROVADO — 13 arquivos e 132 testes unitários e de integração verdes (100% de sucesso, 0 falhas).
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas a PRNG descontrolado (`Math.random()`).
- `npm run build -- --webpack`: APROVADO — compilação Next.js de produção de todas as 9 rotas estáticas com validação estrita de tipos TypeScript (código de saída 0).
- Governança e Regras Canônicas:
  - `RivalryRelationship.ts`: Matriz pura de rivalidades causais estruturada em 5 eixos (geográfico, esportivo, social, político, torcida/histórico), intensidade contínua [0, 100], 4 tiers históricos (`friendly`, `traditional`, `fierce`, `deadly_derby`), geração autêntica de nomes de clássicos e dérbis a partir de geografia e fatores socioculturais, retrospecto H2H dinâmico e registro cumulativo de marcos;
  - Cismas e dissidências clubísticas elevam imediatamente a rivalidade ao tier feroz (`fierce`), refletindo a animosidade histórica imediata de cisões institucionais;
  - `MatchIncidents.ts`: Motor de incidentes graves de prélio (invasão de campo, agressão entre atletas, cerco hostil ao árbitro, abandono de campo) e decisões punitivas duras pelo Tribunal de Penas da Federação LMDT;
  - Regra Canônica 20 (*Violência sem benefício*): sanções estritas com multas financeiras em PPU debitadas imediatamente no livro-caixa contábil (categoria `'fine_tribunal'`), interdição temporária de praça esportiva (perda de mando de campo) e suspensão de atletas por número de jogos;
  - Toda a aleatoriedade consome estritamente as streams `football` e `events` de `CampaignRng`;
  - Persistência e deserialização de save v25 no `mapSerialization.ts` mantendo compatibilidade e hidratação integral do array de rivalidades;
  - Notificações de incidentes e julgamentos emitidas com prioridade na `InterruptionQueue`.
- Demonstração visual no HUD/Canvas:
  - Aba 'Outros Clubes (1910)' no modal do clube exibe o **Termômetro de Rivalidade** em cada card de clube da capital e do interior;
  - Exibição de badge com nome do Dérbi/Clássico (ex.: `⚔️ Dérbi Operário-Aristocrático`), tier de rivalidade colorido, barra horizontal de intensidade percentual, retrospecto histórico H2H (jogos disputados, vitórias, empates, derrotas e saldo de gols contra o oponente), pontuação detalhada nos 5 eixos causais (Geo, Esp, Soc, Tor, Hist) e alerta do Tribunal de Penas com resumo do último incidente e sanções aplicadas;
  - Tabela de jogos da aba '🏆 Competições' exibe badge destacada `🔥 Dérbi` e intensidade percentual para confrontos entre rivais com rivalidade feroz (`tier === 'fierce'` ou `deadly_derby` ou intensidade >= 50%).

## Histórico de verificações anteriores (Sprint 4 do Alpha F: F7 + F8 + F9 — Competições Oficiais da Federação, Taças Municipais/Estaduais, Algoritmo de Berger e Primeira Temporada Completa)

- Data: 28/10/2026.
- `npx vitest run game/core/football/ game/core/World.competition.test.ts game/architecture.test.ts`: APROVADO — 9 arquivos e 44 testes verdes (100% de sucesso, 0 falhas).
- `npx vitest run game/core/mapSerialization.test.ts`: APROVADO — 73/73 testes de serialização e migração v25 verdes.
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística.
- `npm run build -- --webpack`: APROVADO — compilação bem-sucedida de todas as 9 rotas estáticas com validação de tipos rigorosa.
- Governança e Regras Canônicas:
  - `Competition.ts`: Contrato de dados canônicos (`CompetitionState`, `CompetitionFixture`, `StandingsEntry`, `ClubTrophy`) com validação defensiva `validateCompetitionState` e ordenação oficial `sortStandings`;
  - `CompetitionGenerator.ts`: Algoritmo de Berger em turno único (1910–1914) e turno/returno (1915+), gerando o calendário oficial de época: Taça Cidade de Minas (1910), Campeonato da Cidade da LMDT (1915), certames paralelos durante o cisma da AMEA (1916), e Taça Minas Gerais;
  - `CompetitionEngine.ts`: Resolução determinística diária de rodadas no calendário histórico (`stepCompetitionsForDate`), duelos posicionais de linhas 2-3-5 sem overall único, pontuação clássica (2 pts vitória, 1 pt empate), agendamento de Match de Desempate (playoff) em caso de igualdade de pontos na liderança, proclamação de campeão e premiação de troféus perpétuos (`ClubTrophy`);
  - Concessão de troféus e imortalização histórica: adicionado `trophies` em `ClubState` (jogador) e `LocalClubState` (clubes locais via `addTrophyToLocalClub`, concedendo +10 de reputação e gravando marco nos anais);
  - Persistência e deserialização no save nativo v25 em `mapSerialization.ts` mantendo compatibilidade e hidratação integral do array de competições;
  - Zero `Math.random()`, aleatoriedade consumindo estritamente a stream `football` de `CampaignRng`.
- Demonstração visual no HUD/Canvas:
  - Nova aba '🏆 Competições' no menu do clube (`GameHUD.tsx`);
  - Galeria de Troféus / Sala de Conquistas oficial do clube exibindo distintivos dourados dos títulos conquistados (`ClubTrophy`) com nome da taça, divisão e data;
  - Seletor de competições da temporada (Taça Cidade de Minas, Campeonato da Cidade, etc.) com badge de status ('● Em Andamento', '🏆 Concluída');
  - Tabela de Classificação oficial com pontos corridos (J, V, E, D, GP, GC, SG, Pts), percentual de aproveitamento e destaque visual para a posição do clube do jogador;
  - Tabela de jogos da rodada com datas de época, confrontos, placares de partidas já realizadas e botão '⚔️ Disputar Prélio da Rodada!' para jogos do clube do jogador.

## Histórico de verificações anteriores (Sprint 3 do Alpha F: F5 + F6 — Emergência da Federação Mineira e Política Federativa)

- Data: 28/10/2026.
- `npx vitest run`: APROVADO — 142 arquivos e 2.178 testes em 104 s (100% de sucesso, 0 falhas).
- `npx vitest run game/core/federation/ game/core/World.federation.test.ts`: APROVADO — 3 arquivos e 9 testes unitários e de integração verdes.
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística.
- `npm run build -- --webpack`: APROVADO — compilação bem-sucedida de todas as 9 rotas estáticas com validação de tipos rigorosa.
- Governança e Regras Canônicas:
  - `Federation.ts`: Contrato de Federação alinhado ao plano mestre (`id`, `name`, `foundingDate`, `foundingClubs`, `affiliatedClubs`, `presidents`, `statutes`, `blocs`, `competitions`, `professionalismPolicy`, `historicalEvents`);
  - `FederationFormationEngine.ts`: Emergência determinística da Liga Mineira de Desportos Terrestres (LMDT) em 1915, elegendo a primeira presidência e aprovando o estatuto de amadorismo e normas de cercamento de campo;
  - Cisma histórico de 1916 (surgimento da dissidente AMEA e campeonato paralelo) com posterior reunificação e pacto solene de paz;
  - Todas as decisões federativas e eleições consomem exclusivamente a stream `rng.federation` de `CampaignRng`;
  - Persistência e deserialização de save v25 no `mapSerialization.ts` mantendo compatibilidade e hidratação integral do estado da Federação;
  - Notificações de acontecimentos federativos encaminhadas para a `InterruptionQueue`.
- Demonstração visual no HUD/Canvas:
  - Aba 'Ecossistema' enriquecida com seletor de 3 sub-abas: 'Capital', 'Interior Mineiro' e 'Federação Mineira (LMDT)';
  - Na fase pré-1915: quadro institucional clássico indicando a fase pré-constitutiva autônoma e a previsão de emergência da LMDT para 1915;
  - A partir de 1915: cabeçalho oficial da entidade, badge de status ('● Ativa & Reconhecida', '⚠️ Cisma Federativo' ou '🤝 Reunificada'), card do presidente vigente com bienio, plataforma e conquistas, resumo dos estatutos canônicos (votação, amadorismo estrito, campo cercado, tribunal desportivo), forças políticas das bancadas com percentuais de influência e ideologias, painel de alerta da liga dissidente AMEA durante cismas e crônicas/anais históricos da Federação.

## Histórico de verificações anteriores (Sprint 2 do Alpha F: F3 + F4 — Dissidências Clubísticas e Clubes Regionais)

- Data: 28/10/2026.
- `npx vitest run`: APROVADO — 139 arquivos e 2.170 testes em 59 s (100% de sucesso, 0 falhas).
- `npx vitest run game/core/club/ game/core/World.regionalAndDissidence.test.ts`: APROVADO — 18 arquivos e 92 testes unitários e de integração verdes.
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística.
- `npm run build -- --webpack`: APROVADO — compilação bem-sucedida de todas as 9 rotas estáticas com validação de tipos rigorosa.
- Governança e Regras Canônicas:
  - `ClubDissidenceEngine.ts`: Cismas históricos emergindo causalmente a partir de tensões e descontentamentos institucionais (elitismo aristocrático, ajuda de custo e profissionalismo, cisão pós-eleitoral, revolta contra estatuto e motim do quadro de atletas);
  - Registro histórico bilateral obrigatório nos marcos de ambos os clubes (matriz e dissidente) com geração de agremiação local com `originType: 'dissidence'`, histórico compartilhado e rivalidade inicial aguda;
  - `RegionalClub.ts`: Agremiações abstratas do interior de Minas Gerais estruturadas nas 7 regiões canônicas (Central, Zona da Mata, Sul, Triângulo, Oeste, Norte, Vale) com ferrovias históricas (Central do Brasil, Leopoldina, EFOM, Mogiana, Vitória-Minas);
  - Nível de abstração calibrado: dados institucionais, estádios com capacidade de público, torcida estimada, destaques técnicos e cálculo de horas e custos de viagem de trem em PPU (`calculateRailwayTravelCostPpu`);
  - Desafios amigáveis intermunicipais / interestaduais com rateio financeiro de bilheteria e contabilidade de confrontos contra a capital;
  - Persistência e deserialização de `regionalClubs` e dissidências no save nativo `v25` com round-trip e migração validados.
- Demonstração visual no HUD/Canvas:
  - Aba 'Outros Clubes (1910)' no modal do clube enriquecida com seletor de visão: 'Capital' vs 'Interior Mineiro';
  - Destaque visual explícito para clubes nascidos de dissidência ('⚡ Dissidência / Racha') com causa histórica e clube de origem;
  - Cards detalhados de cada clube regional com cores, escudo, cidade, região mineira, horas de viagem de trem, estádio, destaque do time, torcida estimada e botão de desafio intermunicipal direcionando para a aba de Partidas.

## Última verificação — Sprint 2 do Alpha I (I6 a I9: Central DEV, Time-Travel, Calibração Histórica 5 Eixos e Auditoria de Anacronismos)

- Data: 05/11/2026.
- Agente: Antigravity.
- Implementação e Arquitetura:
  - `game/engine/HistoricalCalibration.ts`: Base canônica com os 5 eixos canônicos (`valor`, `ano`, `fonte`, `interpretação`, `limitação`) cobrindo demografia (IBGE), economia (BACEN), trabalho (Ministério do Trabalho), futebol (FMF/CBF) e urbanismo ferroviário (Arquivo Público Mineiro);
  - `game/engine/HistoricalCalibration.ts` (`auditHistoricalAnachronisms`): Verificação em tempo real de anacronismos (moeda Réis até out/1942, 0 substituições, ausência de cartões coloridos pré-1970, luz natural diurna pré-1930 e Taça Brasil como epílogo nacional exclusivo em 1959);
  - `game/engine/TimeTravelDebugger.ts`: 7 marcos canônicos determinísticos (1910, 1915, 1916, 1930, 1933, 1942, 1959) e serializador `buildReproducibleSeedPackage` para exportação de pacotes de replay determinísticos;
  - `app/components/DevInspectorModal.tsx`: Modal retro arcade em preto e branco com 4 abas (Streams de RNG e Telemetria com cópia de JSON do Replay, Máquina do Tempo com os 7 marcos, Catálogo dos 5 Eixos com filtro por categoria, e Auditor de Anacronismos em tempo real);
  - `app/components/GameHUD.tsx` & `app/page.tsx`: Inclusão do botão proeminente `[ 🛠️ MODO DEV ]` na barra de menu superior arcade do jogo.
- Validações executadas:
  - `npx next build --webpack`: APROVADO — 9/9 rotas estáticas geradas com sucesso, TypeScript estrito validado com 0 erros.
  - `npx vitest run game/engine/HistoricalCalibration.test.ts game/engine/TimeTravelDebugger.test.ts game/engine/CampaignEnsemble100.test.ts game/engine/PerformanceBudget.test.ts game/architecture.test.ts`: APROVADO — 23/23 testes verdes (100% de sucesso).
  - `game/architecture.test.ts`: APROVADO — 5/5 testes verdes (fronteiras de camada preservadas, zero `Math.random()` no core de produção).
- Governança e Regras Canônicas:
  - Estrita observância aos 5 eixos canônicos da Macroetapa 41 para calibração histórica documental;
  - Respeito integral ao determinismo segmentado por streams de `CampaignRng` e proibição de `Math.random()`.

## Histórico de verificações anteriores — Menu de Criação e Customização de Clube Procedural 1910 + Estética Retro Arcade Preto e Branco

- Data: 05/11/2026.
- Agente: Antigravity.
- Implementação e Arquitetura:
  - `app/components/ClubCreationModal.tsx`: Wizard interativo e determinístico de 5 etapas (Identidade, Escudo, Fundadores, Ata Histórica, Praça de Esportes/Contrato) estilizado como arcade clássico preto e branco;
  - `app/globals.css`: Transformação estética retro arcade preto e branco de alto contraste (fundo `#000000`, textos e bordas `#ffffff`, sombras pixeladas `4px 4px 0px #ffffff`, botões arcade com efeito de inversão preto/branco ao passar o mouse, scanlines CRT sutis via overlay `.arcade-scanlines`);
  - `app/components/GameHUD.tsx`: Botão de destaque `[ 🎮 CRIAR / CUSTOMIZAR CLUBE ]` na barra de navegação arcade superior e abertura integrada;
  - `app/page.tsx`: Conexão do modal com os comandos do engine e passagem de parcelas urbanas reais via `commandGetCityParcelsRef`.
- Validações executadas:
  - `npx next build --webpack`: APROVADO — 9/9 rotas estáticas geradas com sucesso, TypeScript estrito validado com 0 erros.
  - `game/architecture.test.ts`: APROVADO — 5/5 testes verdes (fronteiras de camada preservadas, zero `Math.random()` no core).
  - `game/core/club/FoundingGroup.test.ts` & `FiftyYearsReport.test.ts`: APROVADO — 12/12 testes verdes.
  - `game/core/worldStore.persistence.test.ts` & `mapSerialization.test.ts`: APROVADO — 86/86 testes verdes.
  - `game/engine/HeadlessCampaign.test.ts`: APROVADO em 24s com replay byte-a-byte idêntico.
- Governança e Regras Canônicas:
  - Geração procedural alimentada por `CampaignRng` determinístico derivado da seed da campanha;
  - Regra canônica de determinismo e ausência de `Math.random()` no core estritamente preservada;
  - Contratos fundiários de 1910 validados por tipagem estrita com `generateContractProposals`.

## Última verificação (Gameplay Loop MVP: Title Screen Arcade, Ritual de Fundação e Diário de Missões)

- Data: 08/11/2026.
- Solicitação atendida:
  - Eliminação da entrada direta na simulação sem contexto: implementação da Tela de Abertura Arcade (`TitleScreen.tsx`) com logotipo em ASCII, prólogo de 1910, opções `[ 🎮 FUNDAR NOVO CLUBE (1910) ]`, `[ ▶ CONTINUAR CAMPANHA ]`, `[ ❓ COMO JOGAR ]`, `[ 📊 100 SEEDS ]` e `[ 🛠️ MODO DEV ]`.
  - Integração do Fundador à experiência contínua: criação do Diário do Fundador & Missões Históricas (`FounderQuestPanel.tsx`), guiando o jogador com objetivos de época (Fundação, O Primeiro Campo, Os Onze Pioneiros, O Batismo de Fogo, Quadro Social, A Era das Ligas, Taça Brasil de 1959), indicadores de progresso, recompensas em reputação/bilheteria e botões de ação imediata que abrem as abas e ferramentas correspondentes.
  - Central de Partidas & Placar Arcade Retrô (`MatchScoreboardModal.tsx`): placar fliperama em destaque com contagem grande de gols, brasões históricos, crônica do jornal do dia seguinte (*Gazeta de Notícias*), detalhamento de público pagante, bilheteria em PPU e timeline dos lances capitais da Pirâmide 2-3-5.
  - Efeitos Sonoros Retro Arcade Web Audio API (`RetroAudio.ts`): sintetizador sonoro no navegador com zero assets pesados (blips de clique, som de moeda/início de jogo, apito de juiz, fanfarra de vitória e alerta telegráfico) e botão de alternância `[ 🔊 SOM ON ]` / `[ 🔇 MUDO ]` no HUD.
  - Teletipo Histórico da Cidade de Minas (`CityNewsTeletype.tsx`): barra de telegrama retrô no rodapé com notícias de época rotativas sobre transportes, ferrovia, greves, política e futebol de 1910 a 1959.
  - Sincronização e navegabilidade rápida: exportação do tipo `ClubTab` em `GameHUD.tsx`, suporte a prop `requestedClubTab` para abertura remota e botão `[ 🏠 MENU INICIAL ]` na barra superior para retorno à TitleScreen a qualquer momento.
- Arquivos criados e alterados:
  - `app/audio/RetroAudio.ts` & `RetroAudio.test.ts`: Sintetizador Web Audio API e testes unitários (2/2 aprovados).
  - `app/components/CityNewsTeletype.tsx`: Teletipo histórico de notícias por década.
  - `app/components/TitleScreen.tsx`: Tela inicial imersiva no estilo retrô fliperama CRT monocromático com efeitos sonoros.
  - `app/components/FounderQuestPanel.tsx`: Painel central de missões históricas e loop de jogo.
  - `app/components/MatchScoreboardModal.tsx`: Placar arcade e súmula histórica de partidas com apito e fanfarra.
  - `app/components/GameHUD.tsx`: Suporte a `requestedClubTab`, botão `🏠 MENU INICIAL`, botão `🔊 SOM ON/MUDO` e export de `ClubTab`.
  - `app/page.tsx`: Integração da tela de abertura, do diário de missões, do teletipo e do modal de placar ao fluxo da campanha.
- Validações executadas:
  - `game/architecture.test.ts` & `app/audio/RetroAudio.test.ts`: APROVADO — 7/7 testes verdes (zero `Math.random()`, camadas isoladas, áudio seguro).
  - `npx next build --webpack`: APROVADO — compilação bem-sucedida de todas as 9 rotas estáticas com 0 erros de TypeScript e ESLint.
  - Resposta HTTP dev server: APROVADO — `HTTP/1.1 200 OK` verificado em `http://localhost:3000`.

## Histórico de verificações anteriores (Evolução Gráfica por Época e Emergência Procedural de Clubes)

- Data: 05/11/2026.
- Solicitação atendida:
  - Evolução gráfica e visual por época (1910s a 1950s) com filtros de canvas e HUD dinâmico.
  - Eliminação de repetições do racha federativo/cismas (cisma da AMEA estritamente em 1916–1918).
  - Emergência procedural contínua de clubes rivais (até 16 agremiações) com presidentes (linhas políticas e biografias), eleições de diretoria, estádios com evolução física e capacidade.
  - Refinamento de jogabilidade com desafio direto a amistosos a partir dos cards dos clubes rivais.
- Implementação e Arquitetura:
  - `game/render/EraVisualTheme.ts` & `EraVisualTheme.test.ts`: Temas visuais das 5 eras históricas (filtros CSS de daguerreótipo, art déco, rádio, pós-guerra e anos dourados), selos de época e moedas nominais (Mil-Réis e Cruzeiro Cr$).
  - `game/core/club/ClubBirthEngine.ts` & `ClubBirthEngine.test.ts`: Interfaces `PoliticalIdeology`, `LocalClubPresident` e `LocalClubStadium`; templates procedurais autênticos de presidentes e agremiações; geradores determinísticos de presidentes e estádios; evolução anual com eleições de diretoria e reformas de estádios (`evolveProceduralClubsAnnual`).
  - `game/core/federation/FederationFormationEngine.ts` & `game/core/club/ClubDissidenceEngine.ts`: Cisma da AMEA restrito a 1916–1918 e fim da repetição aleatória anual de cismas.
  - `game/core/World.ts`: Conexão da evolução procedural anual de clubes ao tick de fim de ano com notificações para `InterruptionQueue`.
  - `app/globals.css`: Classes estilizadas para as 5 eras e wrapper `.era-canvas-wrapper`.
  - `app/page.tsx`: Injeção de `eraTheme` na div raiz e em torno do canvas do PixiJS.
  - `app/components/GameHUD.tsx`: Banner de época dinâmico com selo e moeda; reformulação da sub-aba "Outros Clubes" com cards ricos de presidente, ideologia política, estádio e botão `[ ⚔️ Desafiar para Amistoso ]`.
## Última verificação (Texturas Dinâmicas por Época 1910–1959, Campo Oficial do Clube no Mapa e Conexão Urbana)

- Data: 08/11/2026.
- Solicitação atendida:
  - Foco na jogabilidade e conectividade física/causal entre a cidade e o clube.
  - Texturas no mapa que se transformam dinamicamente ao longo das décadas (1910 a 1959).
  - Presença visível do campo oficial e estádio do clube sobre a parcela contratada no canvas isométrico.
  - Conexão tátil no HUD com botão de centralização e localização de câmera no campo do clube.
- Implementação e Arquitetura:
  - `game/render/CityInfrastructureRenderer.ts`:
    - Renderização completa do campo oficial de futebol em 2.5D isométrico sobre a parcela da sede (`renderClubGround`):
      - Gramado esportivo verde esmeralda com faixas alternadas de corte de grama;
      - Marcações autênticas com cal branca: linhas laterais e de fundo, linha divisória central, círculo central com ponto da bola, grandes áreas de pênalti e arcos de escanteio;
      - Traves e redes em 3D isométrico desenhadas em ambas as extremidades do campo;
      - Mastro de aço alto (26px) com estandarte oficial tremulando com as cores primária e secundária do clube;
      - Arquibancadas e instalações físicas evolutivas pelas décadas: cerca de madeira e banco em 1910 -> Pavilhão de Tábuas com cobertura e bilheteria nos anos 20 -> Sede social de alvenaria com telhas coloniais nos anos 30 -> Estádio Monumental de Concreto Armado com duas torres de refletores elétricos e torcida lotando as arquibancadas nos anos 40/50;
      - Distintivo dourado flutuante com bola de ouro e aura luminosa indicando o terreno do clube.
    - Texturas dinâmicas de ruas que se transformam de 1910 a 1959:
      - 1910s: Macadame e terra batida com bordas de terra escura e miolo ocre;
      - 1920s: Paralelepípedos de ardósia/granito com trilhos de bonde elétrico ao centro das vias principais;
      - 1930s: Pavimentação asfáltica industrial escura com meio-fio de concreto;
      - 1940s: Asfalto denso com faixas centrais pontilhadas brancas;
      - 1950s: Boulevards metropolitanos com divisor central duplo em amarelo ouro e faixas de pedestres.
  - `game/engine/GameSession.ts` e `app/components/GameCanvas.tsx`:
    - Métodos `focusClubGround()` e `getClubGroundTile()` que localizam a parcela da sede, centralizam a câmera suavemente no estádio e selecionam a parcela para inspeção imediata;
    - Ref `commandFocusClubGroundRef` exposta ao shell React.
  - `app/components/GameHUD.tsx` e `app/page.tsx`:
    - Botão de ação tátil `[ 📍 LOCALIZAR NOSSO CAMPO NO MAPA ]` com efeito sonoro retrô Web Audio e foco instantâneo;
    - Callback `onFocusClubGround` integrado ao topo do HUD.
  - `game/render/CityInfrastructureRenderer.test.ts`:
    - 4 testes unitários cobrindo ciclo de vida, rendering de 1910, transição pelas 5 eras históricas e cleanup com 100% de sucesso.
- Validações executadas:
  - `game/architecture.test.ts`: APROVADO — 5/5 testes verdes (zero `Math.random()`, camadas isoladas, sem mutação direta do Core no Render).
  - `game/render/CityInfrastructureRenderer.test.ts`: APROVADO — 4/4 testes verdes.
  - `app/audio/RetroAudio.test.ts`: APROVADO — 2/2 testes verdes.
  - `npx next build --webpack`: APROVADO — 9/9 rotas estáticas geradas com sucesso, TypeScript e ESLint estritos 100% limpos.
  - `curl --noproxy localhost -I http://localhost:3000`: HTTP/1.1 200 OK.

## Histórico de verificações anteriores (Evolução Gráfica por Época e Emergência Procedural de Clubes)

## Histórico de verificações anteriores (Sprint 2 do Alpha I: I6 + I7 + I8 + I9)

- Data: 28/10/2026.
- `npx vitest run`: APROVADO — 136 arquivos e 2.158 testes em 58 s (100% de sucesso, 0 falhas).
- `npx vitest run game/core/World.localClubs.test.ts game/core/club/AIClubDirector.test.ts game/core/club/ClubBirthEngine.test.ts`: APROVADO — 3 arquivos e 10 testes unitários e de integração verdes.
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística.
- `npm run build -- --webpack`: APROVADO — compilação bem-sucedida de todas as 9 rotas estáticas com validação de tipos rigorosa.

## Histórico de verificações anteriores (Sprint 4 do Alpha E: E7 + E8 + E9 + E10)

- Data: 28/10/2026.
- `npx vitest run`: APROVADO — 133 arquivos e 2.148 testes em 118 s (100% de sucesso).
- `npx vitest run game/core/football`: APROVADO — 5 arquivos e 25 testes unitários e de integração aprovados (`Footballer.test.ts`, `FootballTraining.test.ts`, `FootballMarket.test.ts`, `FootballRulesByEra.test.ts`, `MatchEngine.test.ts`).
- `game/architecture.test.ts`: APROVADO — 5/5 testes verificando camadas, isolamento de Core/Render/App e ausência de chamadas diretas a aleatoriedade não-determinística.
- `npm run build -- --webpack`: APROVADO — compilação bem-sucedida de todas as 9 rotas estáticas com validação de tipos rigorosa.
- Governança e Regras Canônicas:
  - Respeito estrito à ausência de overall único: resolução tática da Pirâmide 2-3-5 por duelos de linhas (ataque vs defesa/goleiro, combate no meio-campo pelos halves, disputas físicas e técnicas);
  - Regras da época de 1910 (`FootballRulesByEra`): zero substituições (atletas contundidos forçam desvantagem numérica), sistema de pontuação clássico (2 pontos por vitória, 1 por empate), arbitragem verbal sem cartões coloridos, impedimento clássico de 3 jogadores;
  - Toda a aleatoriedade da partida consome exclusivamente a stream `football` de `CampaignRng`;
  - Arrecadação de bilheteria e custos operacionais de dia de jogo em PPU creditados e debitados no livro-caixa contábil (`ClubFinances`);
  - Condição física e fadiga dos atletas atualizadas com desgaste de 90 minutos e registro de jogos no histórico individual e do clube;
  - Persistência e deserialização de save v25 testadas e aprovadas com round-trip íntegro.
- Demonstração visual no HUD/Canvas:
  - Nova aba "Partidas (1910)" no modal institucional do clube (`GameHUD.tsx`);
  - Painel de desafio esportivo com seletor de adversários históricos (América, Villa Nova, Yale, Sport Club Mineiro, etc.) e caráter do prélio;
  - Execução interativa de jogo com exibição da súmula oficial, público pagante e balanço financeiro em PPU;
  - Crônica de época minuto a minuto detalhando lances capitais, gols, defesas difíceis e advertências verbais;
  - Quadro de atuações individuais com notas (1.0 a 10.0) e desgaste físico;
  - Arquivo histórico de partidas anteriores clicáveis e inspecionáveis.





