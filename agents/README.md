# agents/ — Documentos de trabalho biagente

Esta pasta contém os documentos de **operação diária** para os dois agentes que implementam o projeto:  
**Antigravity** (Google Deepmind) e **GPT** (OpenAI).

Estes documentos complementam — mas não substituem — a cadeia canônica de autoridade:

```
PLANO MESTRE DE IMPLEMENTAÇÃO.md
AGENTS.md
docs/CONTEXTO.md
docs/PIPELINE.md
```

---

## Índice

| Arquivo | Propósito | Leia quando |
|---|---|---|
| [`HANDSHAKE.md`](HANDSHAKE.md) | Protocolo de turno entre os dois agentes | Antes de iniciar qualquer pacote |
| [`VISUAL-AUDIT.md`](VISUAL-AUDIT.md) | Critério visual mínimo por macroetapa | Ao concluir um pacote ou auditar progresso |
| [`NEXT-STEPS.md`](NEXT-STEPS.md) | Próximo pacote pronto para execução (B18 e além) | Ao receber um novo turno de trabalho |

---

## Fluxo mínimo de trabalho

```
Ler AGENTS.md + PLANO MESTRE + docs/CONTEXTO.md + docs/PIPELINE.md
→ Ler agents/HANDSHAKE.md (verificar turno)
→ Declarar início em HANDSHAKE.md
→ Implementar pacote (ver agents/NEXT-STEPS.md)
→ Verificar critério visual (ver agents/VISUAL-AUDIT.md)
→ Registrar evidência em docs/CONTEXTO.md
→ Atualizar HANDSHAKE.md e VISUAL-AUDIT.md
→ Executar checagens de docs/PIPELINE.md
```

---

## Regras desta pasta

- Nenhum arquivo aqui substitui `AGENTS.md` ou `docs/CONTEXTO.md`.
- Não colocar código, regras de simulação nem dados de campanha aqui.
- Atualizar `HANDSHAKE.md` e `VISUAL-AUDIT.md` no mesmo commit de conclusão de pacote.
- Não marcar pacote como CONCLUÍDO sem evidência visual registrada em `docs/CONTEXTO.md`.
