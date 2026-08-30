# Cidade de Minas — Alpha 0.1

Simulador histórico-procedural de clube, cidade e futebol, com campanha de 1910 a 1959.

## Estado atual

O projeto concluiu a Etapa 0 e está no **Alpha A — fundação técnica**. O pacote A1 incorporou a revisão fixada do Cimulity; nenhuma adaptação do código upstream é permitida antes da auditoria A2.

## Leitura inicial

1. `AGENTS.md` — regras canônicas de trabalho.
2. `PLANO MESTRE DE IMPLEMENTAÇÃO.md` — especificação integral do Alpha.
3. `docs/CONTEXTO.md` — estado verificado, decisões, progresso e riscos.
4. `docs/PIPELINE.md` — fluxos e comandos que existem de fato.
5. `docs/00-etapa-0-auditoria.md` — auditoria da estrutura inicial e delimitação da Etapa 0.
6. `docs/plans/README.md` — índice dos nove planos Alpha e seus pacotes.
7. `docs/00-cimulity-audit.md` — auditoria progressiva obrigatória da base.
8. `docs/upstream/PROVENANCE.md` — origem, commit e licença da base incorporada.

## Verificação disponível

No PowerShell, a partir da raiz do projeto:

```powershell
./scripts/validate-governance.ps1
```

Os comandos reais da aplicação e os resultados do baseline ficam em `docs/PIPELINE.md` e `docs/CONTEXTO.md`.
