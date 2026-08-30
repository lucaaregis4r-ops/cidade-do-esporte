# Regras canônicas de trabalho

Este arquivo governa qualquer trabalho realizado neste projeto. A especificação de produto permanece em `PLANO MESTRE DE IMPLEMENTAÇÃO.md`; este arquivo define como executar essa especificação sem inventar estado, arquitetura ou progresso.

## Ordem de autoridade

1. Pedido explícito atual do responsável pelo projeto.
2. `PLANO MESTRE DE IMPLEMENTAÇÃO.md` para escopo e regras do produto.
3. Este `AGENTS.md` para disciplina operacional.
4. `docs/CONTEXTO.md` para o estado verificado e decisões vigentes.
5. `docs/PIPELINE.md` para os fluxos e comandos que realmente existem.

Se houver conflito ou lacuna material, não preencher por suposição. Registrar a divergência em `docs/CONTEXTO.md` e pedir decisão quando ela mudar escopo, arquitetura ou dados históricos.

## Leitura obrigatória antes de alterar

1. Ler este arquivo inteiro.
2. Ler o plano mestre inteiro, não apenas a macroetapa em foco.
3. Ler `docs/CONTEXTO.md` e `docs/PIPELINE.md` inteiros.
4. Ler arquivos de arquitetura, README e regras adicionais que existirem.
5. Auditar a árvore e o estado do Git antes de editar. Mudanças preexistentes pertencem ao usuário.

## Regra de evidência

- `VERIFICADO`: observado em arquivo, comando ou teste; citar o caminho ou comando.
- `DECIDIDO`: escolha registrada pelo responsável ou formalizada em decisão do projeto.
- `PROPOSTO`: ideia ainda não aprovada ou implementada.
- Nunca descrever `PROPOSTO` como existente.
- Código é a fonte de verdade para comportamento real; documentação divergente deve ser corrigida no mesmo trabalho.
- Dados históricos calibrados exigem valor, ano, fonte, interpretação e limitação, conforme a Macroetapa 41.

## Escopo e sequência

- Trabalhar em uma macroetapa por vez, salvo autorização explícita.
- Não antecipar sistemas de macroetapas posteriores só para “preparar” abstrações sem consumidor real.
- A Macroetapa 1 começa com o fork do Cimulity e exige `docs/00-cimulity-audit.md` antes de modificar a base importada.
- A “Etapa 0” é uma convenção operacional criada em 30/08/2026 porque o plano começa na Macroetapa 1. Ela contém apenas auditoria inicial, governança, continuidade e validação documental.
- Uma macroetapa só muda para `CONCLUÍDA` em `docs/CONTEXTO.md` quando seus critérios forem demonstrados por testes ou inspeção registrável.

## Limites arquiteturais canônicos

- Preservar a direção `React Shell → Input → Engine → Core → Render` até que a auditoria da Macroetapa 1 prove e refine a arquitetura real.
- Não colocar regra de simulação em React, regra histórica em CSS/UI ou mutação do core no render.
- Cidade de Minas é fictícia e não pode se tornar uma reconstrução de Belo Horizonte.
- O jogador representa a continuidade institucional do clube e não controla a prefeitura.
- Não usar `Math.random()` no domínio da simulação.
- Não hardcodear fundador, clube, rival, campeão ou resultado histórico.
- Economia interna usa PPU; valores históricos precisam de fonte ou hipótese explícita.
- Pessoas, terrenos, instalações, nomes, escudos e eventos relevantes preservam biografia e memória.
- Associados, presidentes, identidade social e rivalidades são sistemas causais, não decoração ou bônus estáticos.
- Apenas futebol integra o Alpha; população e regiões externas usam os níveis de abstração definidos no plano.
- Save é versionado e alterações futuras não podem quebrá-lo silenciosamente.

As 25 regras canônicas completas permanecem no plano mestre e são obrigatórias mesmo quando não repetidas aqui.

## Regras herdadas da base

- `CLAUDE.md` registra invariantes da revisão upstream e deve ser lido antes de tocar no código importado.
- Código, identificadores, comentários e documentação técnica junto ao código permanecem em inglês.
- Documentos canônicos de produto, planos, contexto e pipeline podem permanecer em português.
- Quando `CLAUDE.md` conflitar com o plano mestre ou este arquivo, registrar o conflito; a ordem de autoridade deste `AGENTS.md` prevalece para o projeto derivado.

## Atualização obrigatória no mesmo trabalho

Ao alterar código, dados, arquitetura, dependências ou comportamento:

1. Atualizar `docs/CONTEXTO.md` com estado, decisões, concluídos, pendências e riscos afetados.
2. Atualizar `docs/PIPELINE.md` se comandos, entradas, saídas ou fluxos reais mudarem.
3. Atualizar documentação arquitetural/README relacionada, quando existir.
4. Executar todas as checagens aplicáveis descritas em `docs/PIPELINE.md`.
5. Registrar comandos e resultados na seção “Última verificação” de `docs/CONTEXTO.md`.

Mudança apenas editorial pode dispensar testes de produto inexistentes, mas nunca a validação documental.

## Definição operacional de pronto

- Escopo da etapa rastreável ao plano ou a uma decisão registrada.
- Implementação sem violações conhecidas das regras canônicas.
- Testes relevantes aprovados; ausência de teste deve ser declarada como risco.
- `CONTEXTO.md` e `PIPELINE.md` refletem o repositório ao final.
- Nenhuma pendência é ocultada por linguagem de conclusão.
