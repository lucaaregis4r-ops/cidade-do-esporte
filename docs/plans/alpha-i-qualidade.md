# Alpha I — Qualidade, pesquisa e balanceamento

## Resultado

O Alpha é reproduzível, performático, historicamente fundamentado, compreensível e estável em pelo menos 100 seeds, sem uma história dominante ou colapsos silenciosos.

## Relação com o plano mestre

Macroetapas 38–41 e fechamento transversal de todas as anteriores.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| I1 | Runner headless de campanhas | Alpha H | Executa sem UI e exporta métricas |
| I2 | Matriz de 100+ seeds | I1 | Seeds e versões registradas |
| I3 | Invariantes de cidade/economia/política/futebol | I1 | Falhas apontam seed e data |
| I4 | Relatório estatístico | I2–I3 | Distribuições, extremos e outliers visíveis |
| I5 | Orçamento de performance L0/L1/L2 | I1 | Tempo, memória e volumes limitados |
| I6 | DEV mode e inspeção | I3 | Estado crítico observável sem mutar produção |
| I7 | Time travel e reprodução de bugs | I6 | Seed + decisions reproduzem falha |
| I8 | Base de pesquisa histórica | Todos os sistemas calibrados | Valor/ano/fonte/interpretação/limitação |
| I9 | Auditoria de anacronismos | I8 | Regras e tecnologias respeitam janelas |
| I10 | UX e acessibilidade | Alpha H | Decisões e consequências compreensíveis |
| I11 | Regressão de saves | A8, H7 | Migrações ou rejeições explícitas |
| I12 | Release candidate Alpha 0.1 | I1–I11 | Zero bloqueador conhecido; riscos publicados |

## Testes obrigatórios

Campanhas 1910→1920/1933/1942/1950/1959, 100+ seeds completas, perfil de desempenho, integridade histórica e referencial, regressão de saves e sessões manuais de UX.

## Não objetivos e gates

Sem outros esportes, multiplayer, IA generativa online ou conteúdo internacional profundo. Qualquer relaxamento de determinismo, fontes ou integridade para “melhorar variedade” bloqueia a release.
