# Reprodutibilidade e execução headless — A9/A10

Atualizado em: 01/09/2026.

## Pacote reproduzível

`DecisionLog` registra somente ações de ferramenta que efetivamente alteraram o mundo. Cada entrada contém dia decorrido, tipo (`click` ou `drag`), ferramenta, início e fim. Entradas são ordenadas, defensivamente copiadas e validadas antes de restaurar.

`encodeReplayPackage` produz JSON canônico com versão do pacote, `worldSeed` e decision log completo desde o início.

No modo de desenvolvimento, `globalThis.__cimulity.dev.exportReplayPackage()` devolve esse texto. Retorna `null` quando a campanha veio de v19/v20: esses formatos não gravavam decisões anteriores e anunciar o histórico parcial como reprodução completa seria falso. Uma New City inicia um log completo.

## Save v23

O save v23 persiste o log, a cidade inicial derivada da seed e o ledger anual de crescimento B14. v19–v21 migram sem criar uma cidade retroativa; v22 preserva a cidade existente e inicia ledger vazio no ano salvo. As chaves de origem permanecem preservadas. O log não contém movimentos de câmera, hover, seleção, pausa, velocidade ou tentativas rejeitadas, pois esses eventos não alteram o estado histórico.

## Executor headless

`runHeadlessCampaign` cria um World sem React/PixiJS, reproduz decisões no dia e ordem registrados, avança um dia por tick e termina rigidamente em 31/12/1959. Uma decisão que não puder ser aplicada invalida a reprodução; ela não é ignorada silenciosamente.

O resultado inclui data final, dias decorridos, quantidade de decisões aplicadas, estado final serializado e digest FNV-1a de 32 bits para diagnóstico rápido. Igualdade forte usa o estado final byte a byte; o digest não é uma garantia criptográfica.

## Limites honestos

A10 comprova duas campanhas vazias equivalentes até 1959. Isso antecipa somente a fundação da Macroetapa 39. O requisito integral de pelo menos 100 seeds, checkpoints históricos e relatórios dos futuros domínios continua pendente.

A9 entrega exportação/replay mínimos e antecipa parte da Macroetapa 40. Inspeção completa, time travel de 1/5/10 anos e UI de ferramentas DEV continuam pendentes.
