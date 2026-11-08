# Pipeline e fluxos reais

Atualizado em: 12/10/2026
Escopo observado: Etapa 0 + Alpha A (A1–A10) + Alpha B (B1–B18 concluídos) + Alpha C (C1–C2 concluídos; Macroetapa 8 em andamento)

Este documento registra somente fluxos executáveis ou práticas atualmente sustentadas pelos arquivos do projeto. Itens futuros ficam marcados como pendentes e não são apresentados como existentes.

## Pipeline do Clube e Fundação — Alpha C (C1 e C2)

Comandos direcionados:

```bash
# Validação de domínio de clube, origens de fundação, inspetor e arquitetura
npx vitest run game/core/club/FoundingGroup.test.ts game/core/club/Club.test.ts game/engine/inspectTile.test.ts game/architecture.test.ts

# Validação ampla com persistência nativa v25
npx vitest run game/core/club/ game/core/campaignSave.test.ts game/core/worldStore.persistence.test.ts game/core/mapSerialization.test.ts

# Linter e compilação de produção
npm run lint
npx next build --webpack
```

## Pipeline existente: cidade autônoma Alpha B/B1–B11

Comando direcionado:

```powershell
npm test -- game/core/city/CityState.test.ts game/core/city/cityTerrain.test.ts game/core/city/cityFoundation.test.ts game/core/city/cityDistricts.test.ts game/core/city/cityParcels.test.ts game/core/economy/HistoricalEconomy.test.ts game/core/city/cityLandValue.test.ts game/core/city/cityGrowth.test.ts game/core/city/cityTransformation.test.ts game/core/city/citySnapshots.test.ts game/engine/CityHistoryPreview.test.ts game/engine/CityHistoryEnsemble.test.ts game/core/terrainGenerator.test.ts game/architecture.test.ts
```

Os testes verificam as invariantes B1–B11: eras, terreno, rotas, distritos, parcelas e biografia, conversão nominal/real, fórmula PPU explicável, overlays, decisões autônomas de crescimento, condição e demolição de edifícios, reconstrução com adensamento, novas centralidades, avenidas, snapshots versionados e faixas estatísticas determinísticas em várias seeds. Os parâmetros do cenário visível são hipóteses sintéticas, identificadas como tal; nenhuma série histórica calibrada foi criada.

Checagens executadas para B12–B13:

```bash
npx vitest run game/core/city/cityFoundation.test.ts game/core/city/cityDistricts.test.ts game/core/city/cityParcels.test.ts game/core/mapSerialization.test.ts game/core/worldStore.test.ts game/core/worldStore.persistence.test.ts game/engine/inspectTile.test.ts game/architecture.test.ts
npx eslint game/core/city/campaignCity.ts game/core/World.ts game/core/mapSerialization.ts game/core/worldStore.ts game/engine/inspectTile.ts game/engine/index.ts app/components/TileInfoPanel.tsx game/render/CityInfrastructureRenderer.ts
npx next build --webpack
```

Resultados e limites estão registrados em `docs/CONTEXTO.md`. A compilação direta `npx tsc --noEmit --strict` ainda inclui seis erros preexistentes em fixtures de `GameLoop.test.ts` e `devApi.test.ts`; o build Webpack valida TypeScript da aplicação.

### Visor diagnóstico B10

Com `npm run dev`, abrir `http://localhost:3000/city-history` (também acessível pelo link “Cidade em transformação” na tela inicial). Conferir os seis anos, trocar as camadas, clicar em uma parcela e baixar o envelope JSON v2, que inclui relevo, centro histórico e instituições. A tela não grava dados no save. Em modo de produção, `/city-history` é gerada como rota estática pelo build.

O estado do runtime de teste e os resultados desta execução ficam registrados em `docs/CONTEXTO.md`, seção “Última verificação”. Esta rota usa cenário próprio e não demonstra que o `World` jogável mudou. A regra vigente de aceitação, D-0028, exige observar cada pacote funcional na campanha principal em `/`; capturas são opcionais.

### Visor diagnóstico B11

Com `npm run dev`, abrir `http://localhost:3000/city-history/ensemble` ou seguir “Ver faixas entre seeds” no visor da cidade. A página fixa e identifica oito seeds de revisão, mostra mínimo/média/máximo para os seis checkpoints e permite baixar o relatório JSON. A amostra não substitui a avaliação de 100+ seeds prevista na Macroetapa 39 e não representa dados históricos.

### Observação manual B12 na campanha principal

O percurso de aceite é abrir uma campanha limpa em `http://localhost:3000/`, observar terreno, água, ruas, ferrovia e estação, recarregar e confirmar a mesma seed. Em 27/09/2026, a tela foi verificada numa origem local limpa servindo o build exportado; os traçados/IDs permaneceram e foram inspecionáveis após recarga. O botão New City mostra confirmação antes de substituir a campanha e a confirmação não foi aceita neste teste. A origem `localhost` continha um save legado sem cidade v22; ele permaneceu intacto, conforme a migração v19–v21 (`city: null`).

### Observação manual B13 na campanha principal

No mesmo `/`, clicar no centro, na estação e em tiles secos de dois distritos diferentes. O painel existente mostra marcos/IDs, distrito/ID, área, centralidade e métricas populacionais/empregatícias rotuladas como unidades abstratas; parcelas mostram ID, área, dificuldade do terreno e acessos. O mapa marca o centro e instituições; distritos/parcelas são identificados por inspeção. A inspeção e a recarga foram aprovadas; a Macroetapa 4 foi concluída. O reset New City permanece protegido pelo diálogo de confirmação do próprio jogo.

### B16 — inspeção de parcelas da campanha

Checagens executadas:

```bash
npx vitest run game/engine/inspectTile.test.ts game/core/campaignSave.test.ts game/core/mapSerialization.test.ts game/core/worldStore.persistence.test.ts
npx eslint game/engine/inspectTile.ts game/engine/inspectTile.test.ts app/components/TileInfoPanel.tsx
npx next build --webpack
```

Em `/`, usar **Inspecionar** e clicar em parcelas de distritos diferentes. O painel mostra ID, distrito, área, topografia, acessos, acessibilidade, unidades de população vizinha, compras e eventos já persistidos. Preço PPU, proprietário, renda, prestígio e aluguel ficam indisponíveis quando falta dado válido ou modelo. Expandir **Eventos** para ler a data e a descrição; compras em zero confirmam que inspecionar não inventa transação. Recarregar e selecionar a mesma parcela para conferir ID e biografia. A observação de 28/09/2026 está registrada em `docs/CONTEXTO.md`. B16 não muda o schema v24 porque todos os dados consultados já eram persistidos.

### B17 — PPU comparativo no inspetor

Checagens executadas:

```bash
npx vitest run game/engine/inspectTile.test.ts game/core/city/cityLandValue.test.ts game/core/city/citySnapshots.test.ts game/architecture.test.ts
npx eslint game/engine/inspectTile.ts game/engine/inspectTile.test.ts game/core/city/campaignParcelValuationProfile.ts app/components/TileInfoPanel.tsx
npx next build --webpack
```

O perfil `b17-visible-parcel-valuation-v1` é uma hipótese de design para a comparação-base de 1910 (1 PPU/célula; multiplicadores 0,75–1,25), separada dos pesos que dirigem o crescimento B14. A inspeção apresenta PPU, ano, score, pesos/contribuições e as notas do perfil; não grava valor nem converte para moeda nominal. **Verificado em `http://127.0.0.1:3005/`:** na seed `CM-1910-C15A1E11`, uma parcela do distrito Estação ferroviária mostrou 7,22 PPU / 90,7 e uma da Pequena indústria mostrou 7,12 PPU / 87,4; os oito fatores e as limitações estavam visíveis. Após recarga, ID, valor, score e decomposição da Pequena indústria se repetiram. Evidência registrada em `docs/CONTEXTO.md`. B17 concluído; B18 permanece pendente, então a Macroetapa 7 continua em andamento.

### Crescimento anual B14 na campanha principal

Em `/`, acompanhar a data no HUD e deixar a mesma campanha atravessar 1º de janeiro. No mapa, ocupações aparecem como marcadores coloridos e extensões aparecem como ruas; o HUD informa totais e rotula os parâmetros como hipótese de design, sem calibração histórica. B9 roda após B8 na mesma fronteira anual: condição/densidade das edificações, memória de demolições e substituições, centralidades e avenidas mudam no mesmo mapa. O inspetor de parcela mostra cada ciclo e ano; o HUD resume as contagens e pode focar a transformação mais recente. Recarregar preserva a mesma linha do tempo. Save v24 persiste ambos os ledgers. Migração v23 reconstitui B9 apenas a partir de crescimentos B14 registrados; v22 ancora ledgers vazios no ano guardado, sem preencher crescimento anterior.

Checagens executadas para B14:

```bash
npx vitest run game/core/city/campaignGrowth.integration.test.ts game/core/city/cityGrowth.test.ts game/core/mapSerialization.test.ts game/core/campaignSave.test.ts game/core/worldStore.persistence.test.ts game/architecture.test.ts
npx eslint game/core/city/campaignGrowthProfile.ts game/core/city/cityGrowth.ts game/core/city/campaignGrowth.integration.test.ts game/core/World.ts game/core/campaignSave.ts game/core/mapSerialization.ts game/core/worldStore.ts game/engine/GameSession.ts game/render/CityInfrastructureRenderer.ts app/components/GameHUD.tsx app/page.tsx
npx next build --webpack
```

Percurso manual executado numa prévia isolada em `http://127.0.0.1:3004/`: campanha iniciada em 1910, acelerada até a transição de 1911; HUD indicou duas ocupações e duas unidades abstratas de população/emprego, e o mapa mostrou a malha urbana atualizada. Após recarregar, a data continuou em 1911 e as duas ocupações permaneceram visíveis. A prévia isolada evita alterar o save de teste já existente em `:3000`.

### Revisão de interface e visibilidade das Macroetapas 1–5

Em `/`, conferir o nome **Cidade dos Esportes** e o subtítulo **Cidade de Minas**. O painel esquerdo lê seed, data, distritos, parcelas, instituições e crescimento diretamente do mesmo `World` salvo. A câmera aponta inicialmente ao centro histórico, e marcos/ruas da cidade são desenhados acima das árvores da base para permanecerem visíveis. Após o primeiro crescimento, **Ver última ocupação no mapa** foca a parcela mais recente, marcada com um anel claro. O botão de transformação foca a edificação passada, centralidade ou avenida mais recente. Clicar em uma parcela abre o inspetor lateral com distrito, cadastro, ocupação e toda a biografia B15; abrir um menu fecha o inspetor. O menu **Etapas** descreve os efeitos observáveis e liga ao visor sintético separado. **Camadas** e **Base técnica** identificam os dados urbanos herdados. A barra inferior oferece inspeção, pausa e 1x/2x/4x/8x; teclas de construção municipal não atuam no modo normal da campanha. A nova campanha ainda exige a confirmação destrutiva existente.

Checagens direcionadas desta revisão:

```bash
npx vitest run game/input/KeyboardHandler.test.ts game/core/city/campaignGrowth.integration.test.ts game/engine/inspectTile.test.ts game/render/cameraConstraints.test.ts game/architecture.test.ts game/core/mapSerialization.test.ts
npx vitest run game/core/city/campaignGrowth.integration.test.ts game/engine/inspectTile.test.ts game/architecture.test.ts
npx eslint app/page.tsx app/components/GameHUD.tsx app/components/Toolbar.tsx app/components/TileInfoPanel.tsx app/components/DataViewPanel.tsx app/components/StatsPanel.tsx app/layout.tsx app/manifest.ts game/input/KeyboardHandler.ts game/input/KeyboardHandler.test.ts game/engine/GameSession.ts game/engine/inspectTile.ts game/core/city/campaignGrowth.integration.test.ts
npx eslint app/page.tsx app/components/GameCanvas.tsx app/components/GameHUD.tsx game/engine/GameSession.ts game/render/PixiApp.ts game/render/CityInfrastructureRenderer.ts
npx eslint app/components/TileInfoPanel.tsx app/components/GameHUD.tsx app/page.tsx game/engine/inspectTile.ts
npx next build --webpack
```

O caminho `/cimulity` em exportação de produção e as chaves de save legadas permanecem técnicos por compatibilidade; a marca exibida no jogo, título da página e manifesto passam a Cidade dos Esportes. O estado B14/B15 não muda com esta revisão.

Prévia isolada observada em `http://127.0.0.1:3005/`: seed `CM-1910-C15A1E11`, campanha carregada em 1912 com quatro ocupações preservadas após recarga; foco da última ocupação mostrou anel claro e sua parcela industrial. O inspetor lateral mostrou distrito, ID, uso e ano, e o menu **Etapas** fechou o inspetor ao abrir. Essa origem evita tocar nos saves existentes em `:3000` e `:3004`.

### Recuperar a instalação de dependências no Linux

Ambiente observado: Linux x86_64, Node v22.23.2 e npm 10.9.8 (o alvo do projeto continua Node 24 LTS). Uma execução anterior falhou porque `node_modules/.bin/vitest` não tinha bit de execução e a chamada direta indicou falta do binding opcional `@rolldown/binding-linux-x64-gnu`; o lockfile declara esse binding. Se a falha voltar, com rede disponível recrie apenas as dependências locais na raiz do projeto:

```bash
rm -rf node_modules
npm ci --include=optional
npm ls vitest rolldown @rolldown/binding-linux-x64-gnu
npm test -- game/core/city/cityLandValue.test.ts
```

`npm ci` reinstala conforme o lockfile e remove o `node_modules` anterior; não apaga código nem altera o lockfile. O `--include=optional` pede ao npm os bindings opcionais da plataforma. Em Alpine/musl, confirme que o binding instalado corresponde à libc da distribuição. Se a instalação limpa continuar falhando, confira arquitetura/libc e saída de `npm ls` antes de instalar pacotes manualmente. Um `chmod +x node_modules/.bin/vitest` pode corrigir só a permissão do shim, mas não instala o binding ausente.


## Pipeline existente: validação de governança

Entrada:

- `PLANO MESTRE DE IMPLEMENTAÇÃO.md`;
- `AGENTS.md`;
- `README.md`;
- `docs/00-etapa-0-auditoria.md`;
- `docs/00-cimulity-audit.md`;
- `docs/PIPELINE.md`;
- `docs/CONTEXTO.md`;
- `docs/plans/README.md` e os nove planos Alpha;
- `docs/upstream/PROVENANCE.md`.

Comando, executado na raiz do projeto:

```powershell
./scripts/validate-governance.ps1
```

Checagens reais:

1. arquivos obrigatórios da Etapa 0 existem;
2. o plano contém 42 macroetapas únicas e contínuas, de 1 a 42;
3. o plano continua sem uma Etapa 0 formal;
4. o SHA-256 atual do plano coincide com o registrado em `docs/CONTEXTO.md`;
5. o contexto contém uma linha de status para cada macroetapa;
6. as Macroetapas 1–4 estão concluídas;
7. A2–A10 estão concluídos no plano Alpha A; Macroetapas 4–6 e pacotes B1–B17 estão concluídos; Macroetapa 7 segue em andamento até B18; a matriz visual do plano cobre as 42 macroetapas; Macroetapas 37, 39 e 40 permanecem em andamento;
8. o teste de fronteiras arquiteturais existe;
9. o commit Cimulity fixado existe no histórico e o remote `upstream` aponta para a URL registrada.

Saída:

- código `0` e mensagem de sucesso quando todas as invariantes passam;
- código diferente de `0`, com erros enumerados, quando há deriva.

## Fluxo obrigatório de mudança

```text
Ler regras e plano completo
→ auditar árvore e estado Git
→ delimitar a macroetapa
→ implementar dentro do escopo
→ executar checagens reais
→ atualizar CONTEXTO e PIPELINE
→ executar validação de governança
→ relatar evidências, riscos e pendências
```

Regras:

- A2–A10 foram concluídos; alterações futuras precisam preservar fronteiras, RNG, relógio, interrupções, save e reprodução headless.
- Novos comandos só entram aqui depois de existirem e terem sido executados com sucesso no projeto.
- Falha ou ausência de teste deve ser registrada em `docs/CONTEXTO.md`, nunca omitida.

## Pipeline existente: instalação e baseline

Pré-requisitos observados:

- Node local: `v26.3.0`;
- npm local: `11.16.0`;
- workflow upstream: Node 20;
- `package-lock.json`: lockfile v3.

Comandos reais, na raiz:

```powershell
npm ci
npm ls --depth=0
npm run lint
npm test
npm run build
```

No workspace Linux observado em 27/09/2026, `npm run build` pode falhar com panic interno do Turbopack ao gerar nomes de source map a partir do caminho com `Á`. A compilação equivalente verificada nesta entrega foi `npx next build --webpack`; ela validou TypeScript e gerou nove páginas estáticas. O workspace também contém lockfiles em diretórios ancestrais, causando um aviso de raiz inferida do Next.js.

Resultados do baseline A1 em 30/08/2026:

| Comando | Resultado |
|---|---|
| `npm ci` | 409 pacotes instalados; lockfile preservado |
| `npm ls --depth=0` | árvore direta válida |
| `npm run lint` | aprovado |
| `npm test` | 91 arquivos; 1.880 testes aprovados |
| `npm run build` | aprovado; 7 páginas estáticas |

O npm reportou 13 vulnerabilidades e scripts de instalação pendentes para `sharp` e `unrs-resolver`. `npm audit fix` e `npm audit fix --force` não fazem parte do pipeline e não devem ser executados sem triagem.

## Pipeline existente: auditoria técnica A2

Comandos executados:

```powershell
npm test -- --coverage
npm audit --json
```

Verificações estáticas complementares:

- imports de produção entre Core, Render, Tools, Input e Engine;
- chamadas diretas a `Math.random()` no código de produção;
- vias de mutação do mundo;
- versão e conteúdo do save;
- workflow, runtime e configuração de exportação estática.

Resultados em 30/08/2026:

| Verificação | Resultado |
|---|---|
| Testes com cobertura | 91 arquivos; 1.880 testes aprovados |
| Statements | 95,60% |
| Branches | 90,66% |
| Functions | 99,00% |
| Lines | 98,49% |
| Audit de dependências | 1 baixo, 1 moderado, 11 altos, 0 críticos |
| Aleatoriedade direta em produção | nenhuma chamada a `Math.random()` |
| Inversões de camada em produção | nenhuma encontrada nas fronteiras auditadas |
| Smoke visual manual | não executado; servidor bloqueado pelo limite do ambiente |

O audit é uma leitura de risco, não uma autorização para correção automática. Mudanças em dependências exigem pacote próprio com lockfile revisado, lint, testes e build.

## Runtime oficial decidido

Node 24 LTS é o alvo do projeto derivado. Node 26.3.0 é o ambiente local observado e aprovou o baseline; Node 20 continua apenas na CI upstream e deve ser substituído em uma alteração controlada. Enquanto a configuração ainda não foi atualizada, divergência entre esses runtimes permanece risco conhecido.

## Pipeline existente: proteção arquitetural A3

Comando direcionado:

```powershell
npm test -- game/architecture.test.ts
```

O arquivo `game/architecture.test.ts` lê os arquivos TypeScript/TSX de produção e verifica:

1. matriz permitida de imports entre App, Core, Engine, Input, Render, Tools e Types;
2. React/Next restritos ao App;
3. PixiJS restrito ao Render;
4. ausência de chamadas diretas aos mutadores explícitos de `World` em Render, Input e Tools;
5. descoberta das sete camadas, evitando aprovação vazia por erro de varredura.

Resultado A3 em 30/08/2026: 1 arquivo e 4 testes direcionados aprovados. O gate também integra `npm test`; após a mudança, o pipeline completo aprovou lint, 92 arquivos/1.884 testes e o build de 7 páginas estáticas.

## Pipeline existente: determinismo segmentado A4

Comando direcionado:

```powershell
npm test -- game/core/CampaignRng.test.ts game/core/World.rng.test.ts
```

O gate comprova:

1. repetição de todas as streams para a mesma `worldSeed`;
2. independência entre os oito domínios;
3. divergência entre domínios e seeds diferentes;
4. snapshot JSON e restauração da continuação exata;
5. rejeição atômica de estado inválido;
6. reprodução do terreno e do estado das streams após reset com a mesma seed.

Resultado A4 em 30/08/2026: 2 arquivos e 9 testes aprovados. A regressão dirigida de terreno, serialização v19 e store aprovou 3 arquivos e 109 testes. Após sincronizar três expectativas do sentinel HMR, a suíte integral aprovou 94 arquivos/1.893 testes; lint passou sem erros e o build concluiu TypeScript e 7 páginas estáticas. A cobertura integral, agora incluindo `CampaignRng.ts`, aprovou 95,53% statements, 90,61% branches, 98,84% functions e 98,37% lines. A persistência de `worldSeed` e estados dentro do envelope de save permanece reservada a A8.

## Pipeline existente: proibição verificável de aleatoriedade direta A5

Comando direcionado:

```powershell
npm test -- game/architecture.test.ts
```

Além dos quatro contratos de A3, o quinto teste varre os arquivos de produção da camada Core e rejeita chamadas diretas a `Math.random()` com caminho e linha. Um fixture positivo apenas em memória precisa produzir exatamente uma violação, evitando aprovação vazia do detector.

Resultado A5 em 30/08/2026: gate direcionado com 1 arquivo/5 testes e suíte integral com 94 arquivos/1.894 testes aprovados; lint e build aprovados.

## Pipeline existente: relógio histórico e velocidades A6

Comandos direcionados:

```powershell
npm test -- game/core/HistoricalClock.test.ts game/core/World.test.ts game/core/GameLoop.test.ts game/input/KeyboardHandler.test.ts game/engine/economy.integration.test.ts game/core/worldStore.guard.test.ts game/core/worldStore.test.ts game/core/mapSerialization.test.ts
```

O gate cobre calendário gregoriano e bissextos, limites 1910–1959, quatro cadências, encerramento, integração de World, contas mensais, tiers 1x/2x/4x/8x e regressões de save/store. Resultado: 8 arquivos/289 testes. Pipeline completo: 95 arquivos/1.899 testes, cobertura 95,51% statements/90,67% branches/98,67% functions/98,33% lines, lint sem erros e build com 7 páginas estáticas.

## Pipeline existente: interrupções e auto-pause A7

Comando direcionado:

```powershell
npm test -- game/core/InterruptionQueue.test.ts game/core/World.interruptions.test.ts game/core/GameLoop.test.ts
```

O gate cobre FIFO e IDs únicos, validação de entrada, oito categorias, configuração por categoria, carimbo do `HistoricalClock`, reset, reconhecimento e pausa one-shot no `GameLoop`. Resultado dirigido inicial: 3 arquivos/37 testes aprovados. A fila e sua configuração permanecem fora do save até A8.

## Pipeline upstream existente: GitHub Pages

`.github/workflows/deploy.yml` roda em push para `main` e manualmente. Ele usa Node 20, executa `npm ci` e `npm run build`, publica `out` no GitHub Pages. Ele não executa lint nem testes; portanto não é, sozinho, gate suficiente para este projeto derivado.

## Pipelines ainda inexistentes

| Pipeline | Estado | Condição para documentar como real |
|---|---|---|
| Aplicação do runtime Node 24 LTS | PENDENTE | Atualizar configuração e CI, depois validar a matriz |
| Remediação das dependências triadas | PENDENTE | Atualização controlada, sem `--force`, seguida por pipeline completo |
| Persistência dos domínios futuros | PENDENTE | Integrar clubes, pessoas, competições e história quando existirem |
| Matriz longa/100 seeds e relatórios de domínio | PENDENTE | Domínios futuros e Macroetapa 39 integral implementados |
| CI derivada com lint + testes | PENDENTE | Criar após A2; workflow upstream só faz build/deploy |

## Pipeline existente: save v24 e migrações A8/A9/B12/B14/B15

```powershell
npm test -- game/core/campaignSave.test.ts game/core/mapSerialization.test.ts game/core/worldStore.test.ts game/core/worldStore.guard.test.ts game/core/worldStore.persistence.test.ts
```

O envelope v24 grava os ledgers B14/B15. Migra v23 reconstruindo B15 somente a partir de B14 persistido; v22 cria ledgers vazios ancorados no ano salvo. v19–v21 mantêm `city: null`. O contrato e limites estão em `docs/save-format.md`; as checagens desta entrega estão registradas em `docs/CONTEXTO.md`.

Resultado final em 31/08/2026: suíte integral com cobertura aprovada, 99 arquivos/1.944 testes; 95,47% statements, 90,58% branches, 98,93% functions e 98,41% lines. Lint sem erros (um aviso no artefato gerado de cobertura), build com TypeScript e 7 páginas estáticas aprovado e governança aprovada. O build precisou de acesso à rede para as fontes existentes. Uma execução de testes concorrente com o build sofreu timeout no teste preexistente de geometria; a repetição integral sem build passou sem alterar limites. Smoke visual manual não executado.

## Pipeline existente: replay e campanha headless A9/A10

```powershell
npm test -- game/core/DecisionLog.test.ts game/engine/HeadlessCampaign.test.ts game/core/campaignSave.test.ts game/core/worldStore.persistence.test.ts
```

Verifica validação/ordem/cópias do decision log, pacote seed + decisões, bloqueio de histórico migrado incompleto, persistência v22, aplicação estrita e duas execuções equivalentes até 31/12/1959. Igualdade determinística é comparada pelo estado serializado completo; digest serve somente como diagnóstico.

## Política de atualização documental

Qualquer alteração nos comandos, entradas, saídas ou ordem operacional exige atualização deste documento no mesmo conjunto de mudanças. Exemplos do plano não contam como pipeline existente.
