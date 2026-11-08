# Alpha A — Fundação técnica

## Resultado

Uma base Cimulity com proveniência verificável, arquitetura auditada, baseline verde, RNG segmentado, relógio 1910–1959 e save versionado. Uma simulação vazia deve atravessar cinquenta anos com resultado reproduzível.

## Relação com o plano mestre

Macroetapas 1, 2, 3 e 37; fundações antecipadas das Macroetapas 39 e 40 apenas quando necessárias para provar determinismo.

## Pacotes

| Pacote | Entrega observável | Dependência | Estado |
|---|---|---|---|
| A0 | Governança, contexto e pipeline anti-deriva | — | CONCLUÍDO |
| A1 | Base Cimulity incorporada com baseline reproduzível | A0 | CONCLUÍDO |
| A2 | Auditoria completa PRESERVAR/ADAPTAR/REMOVER | A1 | CONCLUÍDO |
| A3 | Fronteiras arquiteturais protegidas por testes | A2 | CONCLUÍDO |
| A4 | `worldSeed` e streams RNG independentes | A3 | CONCLUÍDO |
| A5 | Proibição verificável de aleatoriedade direta no core | A4 | CONCLUÍDO |
| A6 | `HistoricalClock` com cadências e velocidades | A4 | CONCLUÍDO |
| A7 | Fila de interrupções e auto-pause configurável | A6 | CONCLUÍDO |
| A8 | Save versionado com seed, RNG e relógio | A4, A6, A7 | CONCLUÍDO |
| A9 | Decision log e reprodução determinística mínima | A8 | CONCLUÍDO |
| A10 | Simulação headless vazia 1910–1959 | A9 | CONCLUÍDO |

## A1 — Obter e registrar a base

### Subpacotes

| ID | Trabalho | Evidência de conclusão |
|---|---|---|
| A1.1 | Registrar URL, branch, commit, data e licença | Documento de proveniência + `LICENSE` |
| A1.2 | Incorporar árvore upstream sem alterar código | Comparação Git sem diferenças em código importado |
| A1.3 | Identificar runtime, gerenciador e scripts reais | `package.json`, lockfile e versões registradas |
| A1.4 | Instalar de forma reproduzível | `npm ci` concluído sem alterar lockfile |
| A1.5 | Executar lint, testes e build originais | comandos, contagens e resultados registrados |
| A1.6 | Fixar baseline e fronteira para A2 | contexto/pipeline atualizados; A2 claramente pendente |

### Não objetivos

- Não adaptar gameplay, arquitetura, UI ou nomenclatura.
- Não implementar Cidade de Minas.
- Não corrigir falha upstream sem primeiro registrar o baseline exato.
- Não concluir a auditoria profunda da Macroetapa 1; isso é A2.

### Critérios de aceitação

- Repositório Git aponta para `zeikar/cimulity` como upstream.
- Commit incorporado é identificável e licença MIT está preservada.
- Código da base coincide com a revisão registrada.
- Instalação limpa, lint, testes e build têm resultados reproduzíveis documentados.
- `docs/00-cimulity-audit.md` existe com status e evidências, sem classificações prematuras.

## Gates seguintes

- A2–A10 foram concluídos; Alpha A está encerrado.
- A8 persiste seed, RNG, relógio e fila com migração explícita, preservando o contrato de A7.
- Concluir A8 não conclui toda a Macroetapa 37: cada domínio futuro deverá integrar seu estado e suas migrações ao contrato existente.
- A10 só conclui com duas execuções equivalentes comparadas automaticamente.

## Riscos

- Base ativa pode mudar: sempre trabalhar pelo commit fixado.
- Regras upstream podem conflitar com o plano: registrar conflito antes de decidir.
- Build pode depender de rede ou versão específica do Node: capturar ambiente e erro real.

## Evidência de encerramento do A1

- Commit upstream fixado: `330e59e1fa0f9df6f01e09d327ac57d437a0c466`.
- Código/configuração importados sem diferenças contra esse commit.
- `npm ci`: 409 pacotes instalados; lockfile inalterado.
- `npm run lint`: aprovado.
- `npm test`: 91 arquivos e 1.880 testes aprovados.
- `npm run build`: aprovado; 7 páginas estáticas geradas.
- Ambiente local observado: Node `v26.3.0`, npm `11.16.0`; CI upstream usa Node 20.

## Evidência de encerramento do A2

- Arquitetura, imports e vias de mutação verificados diretamente no código.
- GameLoop, World, mapa, entidades, valor da terra, vias, trabalho, tráfego, PixiJS, câmera, picking, RNG, save, React e ferramentas classificados.
- Infraestrutura espacial e loop marcados para PRESERVAR; modelos de domínio para ADAPTAR; poderes municipais para REMOVER DA AGÊNCIA DO JOGADOR.
- `npm test -- --coverage`: 91 arquivos e 1.880 testes aprovados; 95,60% statements, 90,66% branches, 99,00% functions e 98,49% lines no escopo configurado.
- `npm audit --json`: 13 achados triados, sem correção automática.
- Node 24 LTS definido como alvo do projeto derivado; CI e dependências serão alterados somente em pacote técnico controlado.
- Smoke visual manual pendente por bloqueio do ambiente; build e testes de renderização permanecem verdes.

## Evidência de encerramento do A3

- `game/architecture.test.ts` lê os imports reais de todos os arquivos TypeScript/TSX de produção em `app/` e `game/`.
- O teste protege as dependências permitidas entre App, Core, Engine, Input, Render, Tools e Types.
- React/Next ficam restritos ao shell App; PixiJS fica restrito ao Render.
- Render, Input e Tools falham se chamarem diretamente mutadores explícitos de `World`.
- Gate direcionado: 1 arquivo e 4 testes aprovados.
- Pipeline completo: lint aprovado, 92 arquivos e 1.884 testes aprovados, build e 7 páginas estáticas aprovados.

## Evidência de encerramento do A4

- `CampaignRng` deriva oito streams estáveis de uma `worldSeed`: cidade, população, clube, futebol, política, federação, eventos e mídia.
- Cada stream possui estado uint32 próprio; snapshots são JSON-serializáveis, validados integralmente e restaurados apenas para a mesma seed.
- `World` é o proprietário da seed e das streams; regenerar com a mesma seed reinicia todas as streams e reproduz o mesmo terreno pela stream de cidade.
- O alias numérico legado de terreno é normalizado para o formato de seed de campanha, preservando os hooks de desenvolvimento existentes.
- Testes direcionados de A4: 2 arquivos e 9 testes aprovados; regressões de terreno/save/store: 3 arquivos e 109 testes aprovados.
- Pipeline completo: lint sem erros, 94 arquivos/1.893 testes aprovados e build com TypeScript/7 páginas estáticas aprovado.
- Cobertura integral com `CampaignRng.ts` no gate: 95,53% statements, 90,61% branches, 98,84% functions e 98,37% lines.

## Evidência de encerramento do A5

- `game/architecture.test.ts` varre todo arquivo TypeScript/TSX de produção já descoberto pelo gate arquitetural.
- Chamadas diretas a `Math.random()` em qualquer arquivo da camada Core falham com caminho e linha.
- O teste inclui um fixture positivo em memória que demonstra que o detector encontra a chamada proibida; aprovação vazia por regex inoperante fica bloqueada.
- Nenhuma sequência ou API de `CampaignRng` foi alterada.

## Evidência de encerramento do A6

- `HistoricalClock` usa calendário gregoriano de 01/01/1910 a 31/12/1959 e impede avanço além do fim da campanha.
- Cada avanço retorna cadências diária, semanal, mensal e anual, além dos dias do mês concluído.
- `World` delega data e dias decorridos ao relógio; tributação mensal usa a virada real e a duração do mês concluído.
- `GameLoop`, teclado, shell React e toolbar usam os tiers canônicos 1x/2x/4x/8x; pausa permanece volátil e determinística.
- Testes direcionados de relógio, World, loop, input, economia e save/store: 8 arquivos e 289 testes aprovados.
- Pipeline completo: 95 arquivos/1.899 testes aprovados, lint sem erros, cobertura acima dos gates e build de 7 páginas estáticas aprovado.

## Evidência de encerramento do A7

- `InterruptionQueue` mantém FIFO determinístico, IDs únicos e as oito categorias prescritas pelo plano mestre.
- `World` data toda interrupção pelo `HistoricalClock`, expõe configuração de auto-pause por categoria e separa pausa, retomada e reconhecimento.
- `GameLoop` pausa antes de outro dia histórico quando encontra item elegível e consome o gatilho uma única vez, sem rajada de tempo ao retomar.
- `GameSession` sincroniza a pausa automática e a interrupção com o shell React; o aviso pode ser reconhecido sem retomar a simulação implicitamente.
- A persistência da fila e da configuração, fora do escopo de A7, foi entregue em A8.

## Evidência de encerramento do A8

- Envelope v20 persistindo seed, oito streams, relógio, FIFO, flags de pausa, configuração e contadores de IDs.
- Validação de campanha e espaço antes de qualquer mutação no mundo de destino.
- Migração v19 explícita, preservando o armazenamento original e declarando defaults para dados nunca gravados.
- Falhas de leitura/escrita informadas ao shell; saves inválidos protegidos de autosave inclusive após HMR.
- Round-trip, continuação determinística, corrupção e armazenamento verificados por `campaignSave.test.ts`, `worldStore.persistence.test.ts` e regressões existentes.
- Contrato e limites em `docs/save-format.md`; resultados finais em `docs/CONTEXTO.md`.

## Evidência de encerramento do A9

- `DecisionLog` versionado registra ações efetivas com dia, ordem, ferramenta e coordenadas.
- O save v21 persiste o log e migra v20 explicitamente; histórico ausente recebe `completeFromStart: false`.
- Pacotes seed + log são validados, codificados e decodificados de forma canônica.
- O DEV API exporta o pacote apenas quando o histórico existe desde o dia zero.
- Testes cobrem cópias defensivas, ordem, corrupção, round-trip, save e migração incompleta.

## Evidência de encerramento do A10

- `runHeadlessCampaign` executa World e CommandDispatcher sem React/PixiJS.
- Decisões são aplicadas no dia e ordem registrados; divergência invalida a execução.
- Duas campanhas vazias com a mesma seed chegam a 31/12/1959 com estado final byte a byte idêntico.
- Seeds diferentes produzem identidades finais diferentes.
- A matriz integral de 100 seeds da Macroetapa 39 permanece futura e não é declarada pronta.
