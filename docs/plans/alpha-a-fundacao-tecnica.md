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
| A2 | Auditoria completa PRESERVAR/ADAPTAR/REMOVER | A1 | NÃO INICIADO |
| A3 | Fronteiras arquiteturais protegidas por testes | A2 | NÃO INICIADO |
| A4 | `worldSeed` e streams RNG independentes | A3 | NÃO INICIADO |
| A5 | Proibição verificável de aleatoriedade direta no core | A4 | NÃO INICIADO |
| A6 | `HistoricalClock` com cadências e velocidades | A4 | NÃO INICIADO |
| A7 | Fila de interrupções e auto-pause configurável | A6 | NÃO INICIADO |
| A8 | Save versionado com seed, RNG e relógio | A4, A6 | NÃO INICIADO |
| A9 | Decision log e reprodução determinística mínima | A8 | NÃO INICIADO |
| A10 | Simulação headless vazia 1910–1959 | A9 | NÃO INICIADO |

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

- A2 bloqueia qualquer alteração do código upstream.
- A4 só começa depois de RNG/save atuais serem localizados no código.
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
