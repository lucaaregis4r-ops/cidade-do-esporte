# Alpha C — Fundação e gestão do clube

## Resultado

O jogador funda um clube coerente com a população, ocupa um terreno real, capta associados, mantém um livro-caixa e constrói patrimônio com biografia.

## Relação com o plano mestre

Macroetapas 8–11 e 27–29.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| C1 | Contrato `Club` e identificadores históricos | Alpha B | Referências e serialização testadas |
| C2 | Seis origens e `FoundingGroup` | C1 | Fundadores citados existem no mundo |
| C3 | Nome, cores e primeira versão de escudo | C2 | Histórico nasce junto do clube |
| C4 | Inspeção e escolha livre de parcela viável | B5, B7 | Sem três opções artificiais |
| C5 | Formas de ocupação e contratos | C4 | Obrigações e eventos persistentes |
| C6 | Instalações iniciais simples | C5 | Biografia, não “level” |
| C7 | Categorias e coortes de associados | C2, C5 | Associados não são somente receita |
| C8 | Adesão, saída, joia e mensalidade | C7, B6 | Afinidade e preço influenciam decisões |
| C9 | Ledger financeiro | C5–C8 | Saldo só muda por transação válida |
| C10 | Obras, manutenção, dívida e recuperação | C6, C9 | Crises não viram Game Over imediato |
| C11 | Vertical “fundar e sobreviver 5 anos” | C1–C10 | Fluxo jogável e determinístico |

## Testes obrigatórios

Invariantes de ledger, propriedade e referências; cenários por origem; save/load; simulação de cinco anos com caixa, associados e patrimônio consistentes.

## Não objetivos

Política completa, partidas profundas, estádio moderno inicial ou identidade social congelada pela origem.
