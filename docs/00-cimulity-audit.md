# Auditoria técnica da base Cimulity

Status: **A2 CONCLUÍDO**
Revisão auditada: `330e59e1fa0f9df6f01e09d327ac57d437a0c466`
Data: 30/08/2026

## Resultado executivo

A base Cimulity é viável como fundação técnica de Cidade de Minas, mas não como modelo de domínio pronto. A auditoria encontrou uma separação de camadas útil, loop de tempo fixo, mapa isométrico, câmera, picking, renderização PixiJS, estruturas de dados determinísticas e uma suíte forte de testes. Em contrapartida, o RNG não preserva estado, o save rejeita versões anteriores, a economia é um único saldo municipal, a cidade depende de ferramentas típicas de city builder e as regras históricas de 1910–1959 não existem.

A decisão é preservar a infraestrutura espacial e de execução; adaptar os modelos de simulação; e remover da agência normal do jogador qualquer poder de prefeitura. Nenhum código importado foi alterado durante A2.

## Método e evidências

A auditoria foi derivada de imports, implementações, testes, configuração, workflow e comandos executados. Foram inspecionados `app/`, `game/core/`, `game/engine/`, `game/input/`, `game/render/`, `game/tools/`, `game/types/`, `package.json`, `vitest.config.ts`, `next.config.ts`, o workflow de deploy e a documentação upstream.

Evidências executadas:

- `npm test -- --coverage`: 91 arquivos e 1.880 testes aprovados;
- cobertura: 95,60% statements, 90,66% branches, 99,00% functions e 98,49% lines no escopo configurado;
- `npm audit --json`: 13 achados, sendo 1 baixo, 1 moderado, 11 altos e 0 críticos;
- busca por `Math.random(` em código de produção: nenhuma chamada;
- inspeção de imports de produção: nenhuma inversão encontrada nas fronteiras Core, Render e Tools;
- integridade contra a revisão fixada: código-fonte e configuração permanecem inalterados.

O smoke test visual manual não foi executado: a abertura do servidor local foi bloqueada pelo limite de uso do ambiente. O baseline de build e os testes de renderização permanecem aprovados, mas isso não substitui a validação visual.

## Arquitetura verificada

```text
React Shell (app/)
        │ cria sessão e exibe estado
        ▼
GameSession (engine/) ── composição de loop, input, tools e render
        │
        ├── Input → Tool/CommandDispatcher → mutações explícitas
        ├── GameLoop → World.tick → simulação
        └── Render → leitura de World/Core → PixiJS

Core não depende das camadas de interface em código de produção.
```

`GameSession` é a raiz de composição. `CommandDispatcher.applyCommands` centraliza mutações originadas por ferramentas. `World.tick`, hidratação do save, reset e seed de desenvolvimento são as outras vias observadas. `worldStore` mantém o singleton da sessão. Imports de Engine/Tools presentes em alguns testes de Core são fixtures de teste, não dependências de produção.

## Inventário e classificação

| Subsistema | Evidência principal | Classificação | Decisão para Cidade de Minas |
|---|---|---|---|
| `GameLoop` | `game/engine/GameLoop.ts` | PRESERVAR | Manter timestep fixo, acumulador, pause e catch-up; ligar ao relógio histórico em A6. |
| `World` | `game/core/World.ts` | ADAPTAR | Preservar papel de orquestração, mas decompor domínios e cadências históricas. |
| `GameMap` e `Tile` | `game/core/GameMap.ts`, `Tile.ts` | PRESERVAR | Manter grade e acesso espacial; estender terreno, parcelas e memória. |
| `Building`/`BuildingMap` | `game/core/Building.ts`, `BuildingMap.ts` | ADAPTAR | Preservar registro/ocupação; substituir semântica RCI por edificações históricas e parcelas. |
| `StructureMap` | `game/core/StructureMap.ts` | ADAPTAR | Preservar registro e footprints; separar instalações do clube, cidade e instituições. |
| `LandValueMap` | `game/core/LandValueMap.ts` | ADAPTAR | Reaproveitar campo derivado e invalidação; substituir fórmula moderna por pressão fundiária histórica. |
| `roadGraph` | `game/core/roadGraph.ts` | PRESERVAR | Manter base determinística de conectividade, com evolução futura por modais/época. |
| `laborMarket` | `game/core/laborMarket.ts` | ADAPTAR | Manter agregação/BFS como ponto de partida; empregos e deslocamento modernos não servem sem recalibração. |
| `TrafficMap` | `game/core/TrafficMap.ts` | ADAPTAR | Manter estrutura de fluxo; modelar pedestres, bondes e automóveis por período. |
| Economia | `World.trySpend`, `World.earn`, impostos mensais | ADAPTAR | Substituir saldo municipal único por economia histórica e ledger próprio do clube. |
| Terreno procedural e RNG | `terrainGenerator.ts`, `prng.ts` | ADAPTAR | Manter geração determinística; introduzir `worldSeed`, streams independentes e estado serializável. |
| Save/serialização | `game/core/worldSave.ts` | ADAPTAR | Preservar serialização ordenada; criar migrations, seed, estados RNG, relógio e decision log. |
| PixiJS/TileRenderer | `game/render/` | PRESERVAR | Manter renderer isométrico e dirty updates; medir custo por tile em mapas maiores. |
| `Camera` | `game/render/Camera.ts` | PRESERVAR | Pan, zoom e limites são base adequada. |
| `IsoTransform` e picking | `game/render/IsoTransform.ts` e testes | PRESERVAR | Manter projeção 64x32, elevação e hit test por polígono. |
| Shell React | `app/page.tsx`, `app/components/` | ADAPTAR | Manter React como casca de apresentação; remover importações de domínio à medida que view models surgirem. |
| Ferramentas RCI/prefeitura | `game/tools/Tool.ts`, `ToolActions.ts` | REMOVER DA AGÊNCIA | Estradas, zoneamento, serviços e bulldoze podem existir como ações internas da cidade, nunca como poderes normais do jogador. |
| Edição de terreno | ferramentas terrain up/down/level | REMOVER DA AGÊNCIA | Restringir a debug/desenvolvimento; o dirigente do clube não remodela livremente a cidade. |
| Seleção/inspeção | `Tool.SELECT` e input | PRESERVAR | Continua como interação de consulta e seleção legítima. |

“REMOVER DA AGÊNCIA” não significa apagar imediatamente o algoritmo: significa retirar o comando da interface normal e, quando útil, reutilizá-lo por sistemas autônomos ou ferramentas de debug.

## Fluxos reais encontrados

### Tempo e simulação

`GameLoop` usa timestep fixo de 1.000 ms, velocidades 1x/2x/3x e até cinco ticks de recuperação. Cada tick chama `World.tick`; no modelo atual um tick equivale a um dia. O calendário é 0-based, com 30 dias por mês e 12 meses por ano. A6 deve manter o loop e substituir a interpretação temporal pelo `HistoricalClock` 1910–1959.

### Mutação e renderização

Entrada do usuário produz comandos de ferramenta, aplicados pelo dispatcher ao Core. O renderer lê o mundo, converte coordenadas pela projeção isométrica, realiza culling e atualiza elementos sujos. React monta a sessão e exibe estado, sem ser o motor da simulação.

### Crescimento urbano atual

`World.tick` resolve utilidades, cobertura de serviços, tráfego e valor da terra; aplica receita mensal; e executa crescimento, merge e abandono de zonas. Esse pipeline é determinístico, porém representa um city builder moderno. O futuro `CityGrowthDirector` deve assumir decisões autônomas sem expor zoneamento ao jogador.

### Save atual

O save usa `WORLD_SAVE_VERSION = 19` e a chave `cimulity:save:v19`. Serializa dimensões, tiles, níveis, dinheiro, dias, prédios, estruturas e terreno, ordenando entidades por ID. Mapas derivados são recalculados. Qualquer versão anterior é rejeitada e falhas de `localStorage` são silenciosas. Isso conflita com a exigência do plano de migração explícita e compatibilidade controlada.

## Determinismo

Pontos favoráveis:

- simulação e módulos puros usam ordem estável;
- geração procedural recebe seed numérica;
- save ordena coleções antes da serialização;
- não há chamada direta a `Math.random()` em produção;
- fontes de tempo do loop podem ser injetadas em teste.

Lacunas bloqueadoras para a campanha:

- RNG é uma closure sem leitura/restauração de estado;
- não existe `worldSeed` canônico nem streams por domínio;
- seed padrão é um número fixo interno;
- save não guarda estados RNG;
- não existe decision log nem teste de replay 1910–1959.

Essas lacunas pertencem a A4, A5, A8, A9 e A10 e devem ser resolvidas antes de qualquer domínio histórico amplo.

## Performance e escalabilidade

O baseline é adequado ao mapa atual de 64x64, mas ainda não prova cinquenta anos ou múltiplas escalas. Riscos observados:

- `LandValueMap` varre o campo e vizinhanças quando recalculado;
- mercado de trabalho usa buscas por origem e tráfego agrupa buscas por destino;
- `World` concentra vários sistemas e pode criar invalidações amplas;
- renderer mantém gráficos por tile;
- cobertura não mede GameSession, DOM/Pixi glue ou orçamento de frame.

A arquitetura L0/L1/L2 e os testes longos das Macroetapas 38–40 continuam obrigatórios. A3 deve primeiro proteger fronteiras; não deve otimizar sem métricas.

## Runtime, dependências e CI

- O ambiente local Node 26.3.0 aprovou lint, testes e build, com aviso de depreciação de `module.register()`.
- O workflow usa Node 20, que encerrou suporte em 24/03/2026.
- O alvo oficial decidido para o projeto derivado é Node 24 LTS; Node 26 permanece apenas ambiente local observado até a matriz ser atualizada.
- O audit encontrou 13 vulnerabilidades, todas com correção indicada. A dependência direta relevante é Next 16.1.1, com atualização não-major indicada para 16.3.3; os demais achados são majoritariamente transitivos de runtime/toolchain.
- Nenhum `audit fix` foi aplicado. A atualização deve ser controlada, com lockfile, lint, testes e build comparados.
- O workflow atual só executa build e publica `out`; não roda lint nem testes. Além disso, `basePath` ainda usa `/cimulity`.

## Riscos e limites da auditoria

| Risco | Severidade | Tratamento |
|---|---:|---|
| Save v19 rejeita versões anteriores | ALTA | Projetar migrations antes de mudar schema em A8. |
| RNG sem estado/streams | ALTA | Implementar A4/A5 antes dos sistemas históricos. |
| Poder municipal exposto ao jogador | ALTA | Remover agência na evolução da UI e transferir ações úteis à cidade autônoma. |
| Modelo econômico incompatível | ALTA | Separar economia da cidade e ledger do clube. |
| Node 20 fora de suporte e 13 vulnerabilidades | ALTA | Atualização controlada no início da fase técnica seguinte. |
| Custos não medidos para 50 anos | ALTA | Headless, métricas e testes de longa duração antes de conteúdo amplo. |
| Smoke visual não executado nesta passagem | MÉDIA | Realizar na primeira execução local autorizada; build e testes não substituem inspeção. |
| Acoplamento crescente em `World` | MÉDIA | Criar contratos e testes de fronteira em A3. |

## Gate de saída A2

- [x] Arquitetura e imports reais auditados.
- [x] GameLoop, World, mapa, entidades, valor da terra, vias, trabalho e tráfego mapeados.
- [x] PixiJS, câmera, projeção, picking, shell React e ferramentas auditados.
- [x] RNG, save, serialização, testes, CI e dependências auditados.
- [x] Cada subsistema classificado como PRESERVAR, ADAPTAR ou REMOVER DA AGÊNCIA.
- [x] Nenhum código upstream alterado.
- [x] Riscos e próximos gates registrados.
- [ ] Smoke visual manual, bloqueado pelo ambiente nesta execução.

A2 está concluído documentalmente. A próxima fronteira é A3: proteger as fronteiras arquiteturais verificadas e transformar as decisões desta auditoria em testes automáticos, sem ainda implementar gameplay histórico.
