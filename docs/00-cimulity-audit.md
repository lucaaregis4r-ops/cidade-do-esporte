# Auditoria Cimulity

Status: **INICIADA — A1 CONCLUÍDO; A2 PENDENTE**
Revisão auditada: `330e59e1fa0f9df6f01e09d327ac57d437a0c466`

## Escopo desta primeira passagem

Este documento existe antes de qualquer alteração no código importado, conforme a Macroetapa 1. O pacote A1 limita-se a proveniência, incorporação e baseline. A classificação profunda PRESERVAR/ADAPTAR/REMOVER DA AGÊNCIA DO JOGADOR pertence ao A2 e ainda não está concluída.

## Inventário verificado em A1

- Next.js 16.1.1, React 19.2.3, PixiJS 8.15.x e TypeScript estrito.
- npm com `package-lock.json` lockfile v3.
- 275 arquivos rastreados no commit incorporado.
- 211 arquivos TypeScript/TSX em `app/` e `game/`.
- 91 arquivos de teste colocados junto ao código.
- Vitest 4.1.6; cobertura configurada para lógica pura selecionada.
- Um workflow GitHub Pages em `.github/workflows/deploy.yml`, usando Node 20, `npm ci` e `npm run build`.
- Arquitetura documentada em `docs/architecture.md` e regras upstream em `CLAUDE.md`.

## Arquitetura observada, ainda não classificada

```text
React Shell
→ Input
→ Engine / Tools
→ Core
→ Render (leitura do Core)
```

Mutações por ferramenta passam por `CommandDispatcher.applyCommands`. Outras mutações documentadas são `World.tick`, hidratação de save, reset da sessão e seed de desenvolvimento. `GameSession` é a raiz de composição e `worldStore` mantém o singleton do mundo.

## Áreas obrigatórias localizadas

| Área do plano | Situação A1 |
|---|---|
| `app/` | PRESENTE |
| `game/core/` | PRESENTE |
| `game/engine/` | PRESENTE |
| `game/input/` | PRESENTE |
| `game/render/` | PRESENTE |
| `game/tools/` | PRESENTE |
| `game/types/` | PRESENTE |
| `docs/` | PRESENTE |

## Comandos encontrados

| Objetivo | Comando upstream |
|---|---|
| Desenvolvimento | `npm run dev` |
| Build | `npm run build` |
| Produção local | `npm run start` |
| Lint | `npm run lint` |
| Testes | `npm test` |
| Testes em watch | `npm run test:watch` |

Os resultados executados pertencem à seção “Última verificação” de `docs/CONTEXTO.md` e ao pipeline.

## Baseline A1

| Checagem | Resultado |
|---|---|
| Integridade contra o commit fixado | APROVADA para código, configuração, lockfile, workflow e licença |
| `npm ci` | APROVADO — 409 pacotes; lockfile inalterado |
| `npm ls --depth=0` | APROVADO — dependências resolvidas |
| `npm run lint` | APROVADO |
| `npm test` | APROVADO — 91 arquivos, 1.880 testes |
| `npm run build` | APROVADO — compilação, TypeScript e 7 páginas estáticas |

O npm reportou 13 vulnerabilidades (1 baixa, 1 moderada, 11 altas) e scripts pendentes para `sharp` e `unrs-resolver`. Nenhuma correção automática foi aplicada, pois alteraria o baseline antes do A2.

## Restrições até A2

- Nenhum subsistema está classificado como PRESERVAR, ADAPTAR ou REMOVER.
- Exemplos prováveis do plano não foram promovidos a decisão.
- Nenhum código upstream pode ser alterado antes da auditoria completa.
- O conflito de linguagem é explícito: `CLAUDE.md` pede inglês em todo conteúdo upstream; `AGENTS.md` permite documentação canônica do projeto em português e mantém código, identificadores e comentários em inglês.
- Node local `v26.3.0` produziu avisos de depreciação em testes/build; o workflow upstream fixa Node 20. A matriz de runtime será decidida no A2.

## Checklist A2 pendente

- Ler e mapear implementações de GameLoop, World, GameMap, Tile, Building/BuildingMap, LandValueMap, roadGraph, laborMarket e TrafficMap.
- Auditar câmera, transformação isométrica, picking, PixiJS e shell React.
- Auditar RNG, terreno procedural, save/serialização e testes.
- Verificar dependências reais entre camadas por imports.
- Classificar cada subsistema com evidência por arquivo e teste.
- Identificar dívida técnica, acoplamentos, limites de performance e riscos para saves.
