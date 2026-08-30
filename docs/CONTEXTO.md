# Contexto e estado atual

Atualizado em: 30/08/2026
Estado global: **ETAPA 0 E PACOTE A1 CONCLUÍDOS; MACROETAPA 1 EM ANDAMENTO**

## Identidade canônica

Cidade de Minas — Alpha 0.1 é um simulador histórico-procedural em que o jogador representa a continuidade institucional de um clube fundado em 1910, numa cidade mineira fictícia que cresce autonomamente, até o epílogo da Taça Brasil de 1959. A recompensa central é a história causal e persistente produzida pela campanha.

## Fontes de verdade verificadas

| Fonte | Papel | Estado |
|---|---|---|
| `PLANO MESTRE DE IMPLEMENTAÇÃO.md` | Especificação de produto | EXISTE; 3.692 linhas; 42 macroetapas |
| `AGENTS.md` | Regras operacionais canônicas | CRIADO NA ETAPA 0 |
| `docs/PIPELINE.md` | Fluxos reais e comandos | CRIADO NA ETAPA 0 |
| `docs/CONTEXTO.md` | Estado, decisões, progresso e riscos | CRIADO NA ETAPA 0 |
| `docs/plans/` | Nove planos Alpha e pacotes executáveis | CRIADO; ALPHA A EM ANDAMENTO |
| Código-fonte Cimulity | Base técnica importada | EXISTE; upstream fixado em `330e59e1fa0f9df6f01e09d327ac57d437a0c466` |

SHA-256 vigente do plano: `5E658B040064F2D00989A382FBA71E444D6410C7A0AC57CDDF5F40532188A6C0`.

## Arquitetura vigente

A base importada verifica a direção `React Shell → Input → Engine/Tools → Core → Render`. `CommandDispatcher.applyCommands` é a via de mutação causada por ferramentas; `World.tick`, hidratação, reset e seed de desenvolvimento são outras vias documentadas. `GameSession` compõe Pixi/input/engine e `worldStore` mantém o mundo. A auditoria A2 ainda precisa confirmar isso no código e classificar cada subsistema.

## Dependências vigentes

Base npm `cimulity@0.1.0`, lockfile v3: Next.js 16.1.1, React/React DOM 19.2.3, PixiJS 8.15.0, TypeScript 5.9.3, Vitest 4.1.6, ESLint 9.39.2 e Tailwind CSS 4.1.18. Ambiente local verificado: Node v26.3.0 e npm 11.16.0; o workflow upstream usa Node 20.

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

## Mapa das macroetapas

Estados permitidos: `NÃO INICIADA`, `EM ANDAMENTO`, `BLOQUEADA`, `CONCLUÍDA`.

| # | Macroetapa | Estado |
|---:|---|---|
| 1 | Fork, auditoria e fundação técnica | EM ANDAMENTO |
| 2 | Determinismo e world seed | NÃO INICIADA |
| 3 | Relógio histórico 1910–1959 | NÃO INICIADA |
| 4 | Geração procedural de Cidade de Minas | NÃO INICIADA |
| 5 | Cidade autônoma | NÃO INICIADA |
| 6 | Parcelas e mercado imobiliário | NÃO INICIADA |
| 7 | Economia histórica | NÃO INICIADA |
| 8 | História de fundação | NÃO INICIADA |
| 9 | Escolha do terreno | NÃO INICIADA |
| 10 | Modelo do clube | NÃO INICIADA |
| 11 | Associados | NÃO INICIADA |
| 12 | Identidade social dinâmica | NÃO INICIADA |
| 13 | Pessoas e genealogias | NÃO INICIADA |
| 14 | Política e eleições | NÃO INICIADA |
| 15 | Outros clubes de Cidade de Minas | NÃO INICIADA |
| 16 | Clubes do interior de Minas | NÃO INICIADA |
| 17 | Federação e instituições | NÃO INICIADA |
| 18 | Futebol: jogadores | NÃO INICIADA |
| 19 | Nascimento e formação de jogadores | NÃO INICIADA |
| 20 | Mercado e profissionalização | NÃO INICIADA |
| 21 | Motor de partidas | NÃO INICIADA |
| 22 | Competições | NÃO INICIADA |
| 23 | Rivalidades | NÃO INICIADA |
| 24 | Incidentes e clássicos | NÃO INICIADA |
| 25 | Torcida e popularidade | NÃO INICIADA |
| 26 | Imprensa | NÃO INICIADA |
| 27 | Instalações | NÃO INICIADA |
| 28 | Patrimônio e valorização | NÃO INICIADA |
| 29 | Finanças do clube | NÃO INICIADA |
| 30 | Lendas e legado | NÃO INICIADA |
| 31 | Homenagens | NÃO INICIADA |
| 32 | Tradição | NÃO INICIADA |
| 33 | Historical Ledger | NÃO INICIADA |
| 34 | Arquivo do clube | NÃO INICIADA |
| 35 | Interface principal | NÃO INICIADA |
| 36 | 1959 e Taça Brasil | NÃO INICIADA |
| 37 | Save versionado | NÃO INICIADA |
| 38 | Performance | NÃO INICIADA |
| 39 | Testes históricos de longa duração | NÃO INICIADA |
| 40 | Ferramentas de debug | NÃO INICIADA |
| 41 | Pesquisa histórica como dado | NÃO INICIADA |
| 42 | Ordem real de implementação | NÃO INICIADA |

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

## Próxima fronteira autorizada pelo plano

Pacote A2 — auditoria completa da Macroetapa 1. Deve mapear as áreas exigidas, verificar dependências reais entre camadas e classificar cada subsistema em PRESERVAR, ADAPTAR ou REMOVER DA AGÊNCIA DO JOGADOR. Nenhum código upstream pode ser alterado antes desse gate.

## Pendências

- Ainda não existe um remote `origin` pertencente ao projeto; somente `upstream` oficial.
- A auditoria profunda A2 e a classificação dos subsistemas estão pendentes.
- A compatibilidade oficial do projeto derivado com Node 20 versus Node 26 precisa ser decidida no A2.
- As 13 vulnerabilidades reportadas pelo npm precisam ser triadas sem atualização cega.
- Scripts de instalação de `sharp` e `unrs-resolver` ficaram pendentes segundo o mecanismo `allow-scripts` do npm 11.
- Nenhum dado histórico foi pesquisado ou calibrado.
- Critérios de aceitação detalhados por macroetapa ainda dependem da auditoria técnica e da decomposição progressiva.

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
| 13 vulnerabilidades npm reportadas no baseline | ALTO | Triar no A2; não aplicar `--force` sem testes |
| Node local 26 difere do Node 20 da CI upstream | MÉDIO | Definir runtime suportado e executar matriz mínima no A2 |
| Não existe remote `origin` próprio | MÉDIO | Criar somente quando houver repositório do projeto definido |

## Última verificação

- Data: 30/08/2026.
- `npm ci`: APROVADO — 409 pacotes instalados em aproximadamente 6 minutos; lockfile inalterado; 13 vulnerabilidades reportadas.
- `npm ls --depth=0`: APROVADO.
- `npm run lint`: APROVADO.
- `npm test`: APROVADO — 91 arquivos e 1.880 testes em 53,78 s.
- `npm run build`: APROVADO — compilação em 63 s, TypeScript e geração de 7 páginas estáticas concluídos.
- Avisos não bloqueantes: depreciação `module.register()` no Node 26 e indisponibilidade de `localStorage` no ambiente de teste.
- Integridade upstream: APROVADA — nenhuma diferença em código, configuração, lockfile, workflow ou licença contra o commit fixado.
- `./scripts/validate-governance.ps1`: APROVADO — plano, nove Alphas, contexto e proveniência sincronizados.
