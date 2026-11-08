# Tradição Esporte Clube — Alpha 0.1

Simulador histórico-procedural de clube, cidade e futebol em Cidade de Minas, uma cidade fictícia, com campanha de 1910 a 1959.

## Estado atual

O projeto concluiu a Etapa 0, as Macroetapas 1–5 e o **Alpha A — fundação técnica** (A1–A10). No Alpha B, B1–B15 estão concluídos: a cidade, seu crescimento anual e suas transformações aparecem na campanha principal e são salvos em v24. B16 inicia a Macroetapa 6. `/city-history` e `/city-history/ensemble` são visores diagnósticos de cenários sintéticos. Consulte o [plano Alpha B](docs/plans/alpha-b-cidade.md). As Macroetapas 6–7, 37, 39 e 40 permanecem em andamento. Contratos em `docs/save-format.md` e `docs/reproducibility.md`.

## Observar no jogo

Abrir `/` em `npm run dev`. A tela principal mostra a seed da campanha, a data histórica, a cidade de 1910 e as ocupações anuais. **Ver última ocupação no mapa** encontra a parcela mais recente; clicar nela abre um painel lateral com distrito, parcela, uso e ano. A barra inferior controla pausa e velocidades de 1x a 8x. O menu **Etapas** indica o que cada Macroetapa 1–5 já demonstra. **Camadas** e **Base técnica** mantêm acessíveis os diagnósticos do motor herdado, rotulados como tal; ferramentas municipais não fazem parte dos controles normais da campanha. O nome público da aplicação é Cidade dos Esportes; Cidade de Minas continua sendo a cidade fictícia definida no plano. O caminho técnico `/cimulity` de publicação e as chaves de save mantêm compatibilidade com a base incorporada.

## Leitura inicial

1. `AGENTS.md` — regras canônicas de trabalho.
2. `PLANO MESTRE DE IMPLEMENTAÇÃO.md` — especificação integral do Alpha.
3. `docs/CONTEXTO.md` — estado verificado, decisões, progresso e riscos.
4. `docs/PIPELINE.md` — fluxos e comandos que existem de fato.
5. `docs/00-etapa-0-auditoria.md` — auditoria da estrutura inicial e delimitação da Etapa 0.
6. `docs/plans/README.md` — índice dos nove planos Alpha e seus pacotes.
7. `docs/00-cimulity-audit.md` — auditoria progressiva obrigatória da base.
8. `docs/upstream/PROVENANCE.md` — origem, commit e licença da base incorporada.
9. `docs/reproducibility.md` — pacote de replay, execução headless e limites de A9/A10.

## Verificação disponível

No PowerShell, a partir da raiz do projeto:

```powershell
./scripts/validate-governance.ps1
```

Os comandos reais da aplicação e os resultados do baseline ficam em `docs/PIPELINE.md` e `docs/CONTEXTO.md`.
