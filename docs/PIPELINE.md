# Pipeline e fluxos reais

Atualizado em: 30/08/2026
Escopo observado: Etapa 0 + baseline técnico A1 + auditoria A2

Este documento registra somente fluxos executáveis ou práticas atualmente sustentadas pelos arquivos do projeto. Itens futuros ficam marcados como pendentes e não são apresentados como existentes.

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
6. a Macroetapa 1 está em andamento e as demais não foram antecipadas;
7. A2 está concluído no plano Alpha A e no relatório de auditoria;
8. o commit Cimulity fixado existe no histórico e o remote `upstream` aponta para a URL registrada.

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

- A2 foi concluído sem modificar o código importado; A3 é o primeiro pacote autorizado a adicionar proteções arquiteturais.
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

## Pipeline upstream existente: GitHub Pages

`.github/workflows/deploy.yml` roda em push para `main` e manualmente. Ele usa Node 20, executa `npm ci` e `npm run build`, publica `out` no GitHub Pages. Ele não executa lint nem testes; portanto não é, sozinho, gate suficiente para este projeto derivado.

## Pipelines ainda inexistentes

| Pipeline | Estado | Condição para documentar como real |
|---|---|---|
| Aplicação do runtime Node 24 LTS | PENDENTE | Atualizar configuração e CI, depois validar a matriz |
| Remediação das dependências triadas | PENDENTE | Atualização controlada, sem `--force`, seguida por pipeline completo |
| Testes de determinismo | PENDENTE | Macroetapa 2 implementada |
| Simulação longa/100 seeds | PENDENTE | Macroetapa 39 implementada |
| CI derivada com lint + testes | PENDENTE | Criar após A2; workflow upstream só faz build/deploy |

## Política de atualização

Qualquer alteração nos comandos, entradas, saídas ou ordem operacional exige atualização deste documento no mesmo conjunto de mudanças. Exemplos do plano não contam como pipeline existente.
