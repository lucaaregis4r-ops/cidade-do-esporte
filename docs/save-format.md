# Save da campanha — A8/A9/B12/B14/B15/C1

Atualizado em: 11/10/2026. Formato nativo: **v25**. Responsáveis: `game/core/campaignSave.ts`, `mapSerialization.ts`, `worldStore.ts`, `InterruptionQueue.ts`, `DecisionLog.ts`, `city/` e `club/Club.ts`.

## Contrato existente

O envelope mantém dimensões, tiles, níveis, dinheiro, dias decorridos, edifícios, estruturas e terreno. Acrescenta `campaign` com:

- `worldSeed`: identidade textual da campanha;
- `rng`: versão 1, mesma seed e estado uint32 das oito streams;
- `clock`: versão 1 e `elapsedDays`, obrigatoriamente igual a `d` e dentro de 1910–1959;
- `interruptions`: versão 1, FIFO de eventos e flags `autoPauseHandled`, mais configuração das oito categorias;
- `nextIds`: próximo ID de edifício e estrutura, incluindo o histórico de IDs já removidos.
- `decisions`: log versionado, ordenado e marcado como completo ou incompleto desde 1910.
- `city`: `null` para saves antigos sem estado urbano B12 ou metadados seed-derivados da cidade inicial de 1910. Metadados não nulos contêm fundação, distritos e parcelas, e precisam coincidir com o conjunto canônico gerado pela mesma `worldSeed` e dimensões antes de o save ser aplicado.
- `cityGrowth`: ledger B14 com ano-base, perfil, ocupações anuais, unidades abstratas acumuladas e extensões viárias.
- `cityTransformation`: ledger B15 com ano avançado, condição/densidade das edificações, ciclos de demolição/substituição, centralidades e avenidas. Antes de hidratar o `World`, a transformação é reexecutada a partir do crescimento salvo e do perfil de campanha; o conteúdo precisa coincidir integralmente, com a mesma seed e calendário.
- `club`: `null` se nenhum clube foi fundado na campanha, ou objeto `ClubState` validado com ID, nome, data de fundação (`HistoricalClock`), origem canônica (`FoundingOrigin`), cores (`ClubColors`), histórico de escudos (`crestHistory`), vínculos com fundadores/parcelas/instalações e métricas preliminares.

Datas da fila precisam ser válidas, pertencer ao período da campanha e não estar no futuro em relação ao relógio salvo. IDs são únicos na fila. Os próximos IDs devem ser maiores que todos os IDs vivos do respectivo registro.

O carregamento segue: JSON → migração → validação de campanha → validação espacial → aplicação. Falha de validação não altera o World de destino. A geração de terreno não é executada durante hidratação. Campos derivados de utilidades, trabalho, tráfego e valor da terra são invalidados/recalculados a partir dos dados restaurados.

## Migrações v19/v20/v21/v22/v23/v24 → v25

O leitor aceita v19, v20, v21, v22, v23 e v24. Versões anteriores a 19 ou futuras desconhecidas não são convertidas por suposição.

Na migração v19:

1. terreno, tiles, edifícios, estruturas, dinheiro e dias decorridos são preservados;
2. os dias decorridos são interpretados a partir de 01/01/1910, conforme o relógio vigente;
3. a seed recebe `CM-1910-C15A1E11`; streams começam nos estados derivados dessa seed, sem gerar terreno novamente;
4. a fila inicia vazia, com auto-pause habilitado para todas as categorias;
5. próximos IDs são derivados do maior ID vivo + 1, ou zero se o registro estiver vazio.
6. decision log inicia vazio e incompleto, pois o formato não registrava ações.
7. cidade e clube iniciam como `null`.

Na migração v20, todos os campos de campanha existentes são preservados e somente o decision log ausente é criado como vazio e incompleto; clube inicia como `null`.

Na migração v21, os campos existentes são preservados e `city: null` e `club: null` são acrescentados. O mapa salvo permanece intacto; não se gera nem se inventa retroativamente a cidade B12.

Na migração v22, a cidade inicial B12/B13 é preservada. Como v22 não gravava o ledger B14, a migração cria um ledger vazio com `baselineYear` igual ao ano do relógio salvo. Assim, não atribui ocupações urbanas passadas ao save; os anos seguintes voltam a avançar normalmente; clube inicia como `null`.

Na migração v23, cidade e ledger B14 são preservados. O ledger B15 é reconstruído de forma determinística somente a partir das ocupações já registradas em B14 e do perfil de transformação explícito; nenhum novo crescimento é criado. Saves v19–v21 continuam com `city: null`; clube inicia como `null`.

Na migração v24, cidade, crescimento e transformação urbana B15 são integralmente preservados. Apenas `club: null` é atribuído, preservando o estado pré-fundação sem inventar agremiação histórica retroativamente.

**Limitação irrecuperável:** v19 não gravava seed, estados RNG, fila nem contadores de entidades removidas. Esses dados não podem ser recuperados. A migração não promete reconstruir a sequência histórica anterior nem converter o antigo calendário sintético para uma data histórica exata.

## Armazenamento e proteção

- Leitura preferencial: `cimulity:save:v25`.
- Sem chave v25: procurar `cimulity:save:v24`, `cimulity:save:v23`, `cimulity:save:v22`, `cimulity:save:v21`, `cimulity:save:v20` e `cimulity:save:v19`, nessa ordem, e migrar em memória.
- Gravação: apenas `cimulity:save:v25`; origens v19–v24 ficam preservadas.
- Um save atual inválido não provoca fallback silencioso para outra campanha v19.
- Falha de carregamento abre um mundo transitório com aviso e bloqueia sua gravação automática, mantendo os bytes originais. O bloqueio e aviso sobrevivem ao HMR.
- Falha de escrita retorna `false` e é apresentada pelo shell; não se anuncia sucesso silencioso.
- “New City” é a ação explícita que remove as chaves conhecidas e libera a gravação. Fazer cópia do armazenamento antes dessa ação quando houver dados a recuperar.
- Reconhecimento e acionamento de auto-pause são salvos pela sessão. Uma interrupção já acionada continua visível após carregar, mas não dispara a mesma pausa de novo.

Pausa/velocidade do loop e estado visual não fazem parte da identidade histórica salva. Novos domínios deverão acrescentar campos e migrações ao mesmo contrato, nunca descartar saves silenciosamente.

## Escopo da Macroetapa 37

A8 entrega a persistência dos sistemas existentes. A Macroetapa 37 integral permanece **EM ANDAMENTO**: parcelas, população materializada, clubes, futebol, federações e Historical Ledger ainda não existem e deverão ser integrados quando forem implementados. A9 trata decision log; A10 comprova a execução headless longa. Não foram criados campos fictícios para declarar essas entregas prontas.

## Evidências automatizadas

- `game/core/campaignSave.test.ts`: round-trip, continuidade diária/mensal, oito RNGs, fila/configuração/flags, contadores, migração e rejeição atômica.
- `game/core/worldStore.persistence.test.ts`: origem preservada, preferência da chave atual, armazenamento bloqueado/cheio, erro visível, proteção contra sobrescrita e HMR.
- Testes originais de serialização, store, mundo e arquitetura continuam obrigatórios.
