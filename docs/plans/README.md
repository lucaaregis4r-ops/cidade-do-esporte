# Planos executáveis do Alpha

Este diretório decompõe a Macroetapa 42 do plano mestre. O plano mestre continua sendo a especificação canônica; estes documentos transformam seu conteúdo em pacotes pequenos, verificáveis e retomáveis.

## Hierarquia

```text
Plano mestre (por quê e o quê)
→ Plano Alpha (resultado sistêmico)
→ Pacote (entrega demonstrável)
→ Subpacote (mudança pequena com teste)
```

## Regras de execução

- Somente um pacote pode estar `EM ANDAMENTO`.
- Cada pacote define entradas, entregáveis, critérios de aceitação, testes e não objetivos.
- Pacote concluído exige evidência em `docs/CONTEXTO.md`.
- Descobertas de código substituem hipóteses, nunca regras canônicas do produto.
- Mudança de ordem ou escopo precisa ser registrada como decisão.

## Índice e dependências

| Plano | Resultado | Depende de | Estado |
|---|---|---|---|
| [Alpha A](alpha-a-fundacao-tecnica.md) | Base auditada roda 1910–1959 deterministicamente e salva | Etapa 0 | EM ANDAMENTO |
| [Alpha B](alpha-b-cidade.md) | Cidade de Minas cresce autonomamente por 50 anos | Alpha A | NÃO INICIADO |
| [Alpha C](alpha-c-clube.md) | Clube pode ser fundado, financiado e patrimonializado | Alpha B | NÃO INICIADO |
| [Alpha D](alpha-d-sociedade.md) | Pessoas, famílias, identidade e política funcionam | Alpha C | NÃO INICIADO |
| [Alpha E](alpha-e-futebol.md) | Futebol produz carreiras e partidas por décadas | Alpha D | NÃO INICIADO |
| [Alpha F](alpha-f-ecossistema.md) | Clubes, federação e competições emergem | Alpha E | NÃO INICIADO |
| [Alpha G](alpha-g-historia.md) | Causas viram rivalidade, imprensa, memória e arquivo | Alpha F | NÃO INICIADO |
| [Alpha H](alpha-h-1959.md) | Campanha chega a 1959 e produz epílogo | Alpha G | NÃO INICIADO |
| [Alpha I](alpha-i-qualidade.md) | 100+ seeds, desempenho, pesquisa e UX validados | Alpha H | NÃO INICIADO |

## Estados permitidos

`NÃO INICIADO` · `EM ANDAMENTO` · `BLOQUEADO` · `CONCLUÍDO`
