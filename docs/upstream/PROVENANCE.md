# Proveniência da base Cimulity

## Revisão incorporada

| Campo | Valor verificado |
|---|---|
| Projeto | `zeikar/cimulity` |
| URL | `https://github.com/zeikar/cimulity.git` |
| Remote local | `upstream` |
| Branch de origem | `main` |
| Commit fixado | `330e59e1fa0f9df6f01e09d327ac57d437a0c466` |
| Data do commit | `2026-08-27T20:45:00+09:00` |
| Assunto | `fix(engine): apply Codex code-review findings` |
| Data de incorporação | 30/08/2026 |
| Licença | MIT, copyright 2026 zeikar |

O arquivo `LICENSE` da revisão foi preservado na raiz. O README original foi preservado em `docs/upstream/cimulity-README.md`, pois o README da raiz descreve o projeto derivado Cidade de Minas.

## Método de incorporação

A árvore e o histórico Git foram obtidos do repositório oficial. O diretório `.git` mantém o commit upstream como `HEAD`; o remote original foi renomeado para `upstream`. Os documentos da Etapa 0 foram reaplicados como mudanças locais do projeto derivado.

## Verificação de integridade A1

O comando abaixo não apresentou diferenças no código, configuração, lockfile, workflow ou licença importados:

```powershell
git diff --exit-code HEAD -- app game public .github CLAUDE.md LICENSE next.config.ts package.json package-lock.json postcss.config.mjs tsconfig.json vitest.config.ts eslint.config.mjs
```

Diferenças intencionais nesta etapa restringem-se ao README do projeto e a novos documentos/scripts de governança. Qualquer modificação futura do código só poderá começar após a conclusão do pacote A2.

## Atualizações futuras

Não acompanhar `upstream/main` automaticamente. Toda atualização exige:

1. registrar o novo commit;
2. revisar diferenças e licença;
3. executar novamente o baseline;
4. registrar impacto arquitetural e em saves;
5. atualizar este documento, o contexto e o pipeline.
