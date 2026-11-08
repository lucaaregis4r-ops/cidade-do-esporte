# Alpha B — Cidade autônoma

## Resultado

Uma Cidade de Minas fictícia, pequena em 1910, cresce e envelhece autonomamente até 1959. O jogador observa e escolhe terrenos, mas não administra a prefeitura.

## Relação com o plano mestre

Macroetapas 4, 5, 6 e 7; snapshots da Macroetapa 34 e níveis de abstração da 38.

## Pacotes

| ID | Entrega | Dependências | Aceitação principal |
|---|---|---|---|
| B1 | Contrato `CityState` e dados por era | Alpha A | Tipos e invariantes testados — CONCLUÍDO |
| B2 | Terreno, água e relevo procedural | B1 | Mesma seed gera mesmo mapa — CONCLUÍDO |
| B3 | Centro, ferrovia, vias e instituições de 1910 | B2 | Cidade inicial plausível e compacta — CONCLUÍDO |
| B4 | Distritos, população, empregos e centralidade | B3 | Totais fecham sem NaN — CONCLUÍDO |
| B5 | Parcelas e propriedade | B3 | Mapa particionado; biografia preservada — CONCLUÍDO |
| B6 | `HistoricalEconomy` em PPU | A6, B1 | Conversão nominal separada do valor real — CONCLUÍDO |
| B7 | Valor da terra e overlays | B4–B6 | Cálculo explicável e inspecionável — CONCLUÍDO |
| B8 | `CityGrowthDirector` | B4–B7 | Cidade cresce sem comandos municipais do jogador — CONCLUÍDO |
| B9 | Envelhecimento, demolição e novas centralidades | B8 | Cidade transforma, não apenas expande — CONCLUÍDO |
| B10 | Snapshots 1910/20/30/40/50/59 e visor de revisão | B8–B9 | Comparação serializável e visualizável em `/city-history` — CONCLUÍDO |
| B11 | Simulação headless 50 anos em múltiplas seeds | B10 | Faixas estatísticas e determinismo aprovados — CONCLUÍDO |
| B12 | Macro 4: mapa de 1910 na campanha | B2–B3 | `/` usa terreno, água, ferrovia e ruas da seed do `World` — CONCLUÍDO |
| B13 | Macro 4: cidade inicial identificável | B4–B5, B12 | Centro, instituições, distritos e parcelas do mesmo `World` visíveis/inspecionáveis em `/` — CONCLUÍDO |
| B14 | Macro 5: crescimento anual na campanha | B8, B13 | Ano avançado pelo relógio muda ocupação e vias no mapa jogável — CONCLUÍDO |
| B15 | Macro 5: transformação anual na campanha | B9, B14 | Envelhecimento, substituição, centralidade e avenida aparecem no mesmo mapa — CONCLUÍDO |
| B16 | Macro 6: inspeção da parcela jogável | B5, B15 | Clique em parcela mostra cadastro e biografia reais da campanha — CONCLUÍDO |
| B17 | Macro 7: PPU visível com hipótese explícita | B7, B16 | Inspetor mostra cálculo PPU rastreável ou indisponibilidade — CONCLUÍDO |
| B18 | Macro 7: moeda nominal condicionada a índice | B6, B17 | Valor nominal só aparece com índice mensal citado; lacuna é legível — CONCLUÍDO |

B1–B11 são fundações técnicas concluídas; B12–B13 conectam a cidade de 1910 à campanha principal e fecham a Macroetapa 4. Executar B14–B18 em ordem, fechando uma Macroetapa antes de iniciar a próxima. Não iniciar Alpha C com a cidade ainda desconectada.

## B1 — Contrato `CityState` e dados por era

Estado: **CONCLUÍDO**.

- `game/core/city/CityState.ts` define a identidade da cidade pela `worldSeed`, data histórica e era derivada.
- `game/core/city/cityEras.ts` cobre 1910–1959. A influência ferroviária é alta em 1910–1930 e moderada em 1931–1959, como regra de modelagem derivada do plano mestre; esses rótulos não são calibração histórica.
- A criação rejeita seeds vazias, datas inválidas e datas fora da campanha; copia e congela o estado para impedir alteração acidental.
- B1 não cria terreno, centro, distritos, população ou parcelas. Esses dados entram nos pacotes seguintes.

## B2 — Terreno, água e relevo procedural

Estado: **CONCLUÍDO**.

- `game/core/city/cityTerrain.ts` gera grade de elevação e máscara de água a partir da cidade e do `CampaignRng` da mesma `worldSeed`.
- Só a stream nomeada `city` é consumida. O snapshot de RNG permite persistir a continuação do fluxo; outra seed é rejeitada antes do consumo.
- Reutiliza o gerador existente de ruído, conformação de relevo e máscara de água, sem alterar os resultados legados da API numérica.
- Saída finita, compatível com a faixa de elevação do Core e imutável. Água fica no nível do mar; terreno não aquático permanece acima dele.
- A máscara indica células aquáticas procedurais, sem pretender modelar hidrologia real ou reproduzir uma cidade existente.

## B3 — Centro, ferrovia, vias e instituições de 1910

Estado: **CONCLUÍDO**.

- `game/core/city/cityFoundation.ts` gera um centro histórico compacto em terreno seco e de relevo suave, uma ferrovia que cruza o mapa e uma estação próxima ao centro.
- A malha inclui uma rua principal conectando estação e centro, além de acessos ao comércio, às oficinas ferroviárias e à pequena indústria.
- Todos os percursos são caminhos contíguos sobre terra seca. As cinco instituições são registros genéricos datados de 1910, sem nomes ou fatos históricos fixados.
- A seleção de centro e eixo ferroviário usa somente `CampaignRng.city`; a função exige seed compatível, ano de campanha 1910 e mapa mínimo de 16×16.
- Teste de runtime adicional percorreu 100 seeds, validando instituições, rotas e continuidade de todos os segmentos.

## B4 — Distritos, população, empregos e centralidade

Estado: **CONCLUÍDO**.

- `game/core/city/cityDistricts.ts` reparte cada célula seca entre os cinco marcos institucionais e quatro âncoras periféricas; água permanece sem distrito.
- Cada distrito guarda área, unidades abstratas de população e emprego, centralidade entre 0 e 100 e participação normalizada em pontos-base. Totais são somas explícitas dos registros e as participações fecham exatamente em 10.000.
- População e emprego são unidades de modelo para teste de consistência, sem interpretação como habitantes ou empregos históricos calibrados. Os pesos por função são hipóteses de design pendentes de pesquisa conforme a Macroetapa 41.
- Variação determinística consome somente `CampaignRng.population`; identidade e partição espacial são independentes dessa variação.
- Testes cobrem partição seca/água, totais, centralidade finita, shares normalizados, seed, fronteira de RNG e validação de ano. Execução compilada em 100 seeds confirmou nove distritos não vazios.

## B5 — Parcelas e propriedade

Estado: **CONCLUÍDO**.

- `game/core/city/cityParcels.ts` divide cada distrito em parcelas conectadas de até seis células. A partição cobre exatamente toda terra seca e deixa água sem parcela; IDs derivam do distrito e da coordenada inicial, sem RNG adicional.
- Cada parcela preserva distrito, área, dificuldade topográfica, centralidade, acessibilidade, acesso rodoviário/ferroviário e população abstrata do distrito. Métricas são geométricas ou agregadas, não valores históricos calibrados.
- `ownerId` e preço permanecem ausentes no estado inicial: B5 não inventa proprietários ou preços. Renda, prestígio, pressão de desenvolvimento e valor PPU ficam reservados aos pacotes de economia e valorização.
- Toda parcela inicia com evento de estabelecimento datado pela `CityState` e lista de compras vazia. `recordParcelPurchase` valida cronologia, PPU finito/não negativo e continuidade do vendedor, e devolve novo registro mantendo toda a biografia anterior.
- Testes verificam cobertura exata, conectividade, ausência de sobreposição, métricas finitas, IDs determinísticos e histórico de duas transferências. Execução compilada em 100 seeds confirmou a partição.

## B6 — `HistoricalEconomy` em PPU

Estado: **CONCLUÍDO**.

- `game/core/economy/HistoricalEconomy.ts` mantém PPU real separado da moeda nominal e converte nos dois sentidos somente quando recebe observação mensal de custo de vida citada e base PPU explícita.
- Índice ausente, moeda incompatível com a data, observações duplicadas ou referências incompletas causam erro; não há interpolação, extrapolação nem índice padrão inventado.
- A moeda nominal canônica muda de réis para cruzeiros em 01/11/1942, com paridade de 1.000 réis por cruzeiro conforme o Decreto-lei 4.791/1942 e a síntese do Banco Central. A convenção de exibição segue o plano, embora tenha havido circulação simultânea na transição.
- `game/data/history/economic-index.json` registra a fonte da paridade, mas a série de custo de vida está vazia. A documentação em `docs/research/economy.md` explica a lacuna; sem dados históricos calibrados, o conversor é uma API injetável, ainda sem dataset de produção.
- Testes usam somente índices sintéticos identificados como fixtures; verificam separação real/nominal, paridade legal, limites, validação e ausência de preenchimento silencioso.

## B7 — Valor da terra e overlays

Estado: **CONCLUÍDO**.

- `game/core/city/cityLandValue.ts` calcula PPU por parcela a partir de oito fatores visíveis: centralidade, acessibilidade, acesso ferroviário/rodoviário, proximidade de comércio/indústria, qualidade do terreno e população abstrata do distrito.
- O perfil injeta valor-base por célula, limites de multiplicador, pesos que somam 1 e referências/limitações. O resultado inclui score, contribuição de cada fator, PPU total e citação; não existe preço-base, peso ou inflação histórica implícita no Core.
- Overlays fornecem preço PPU, população abstrata, transporte, ferrovia, comércio, indústria e topografia com unidades explícitas. Renda, clubes e valorização temporal retornam `deferred`, `null` e uma justificativa até existirem dados ou sistemas necessários.
- Se receber um `HistoricalEconomy`, o cálculo também retorna a cotação nominal do mês. Sem série de custo de vida daquele mês, a conversão falha de forma explícita em vez de estimar.
- O app ainda não consome estes resultados para pintar overlays no canvas. Esta entrega é o cálculo Core inspecionável, com fixture sintética só nos testes; nenhuma calibração histórica de produção foi adicionada.
- Testes cobrem determinismo, explicabilidade da fórmula, overlays disponíveis/adiados, conversão nominal com índice citado e validações de calibração.

## B8 — `CityGrowthDirector`

Estado: **CONCLUÍDO**.

- `game/core/city/cityGrowth.ts` avança exatamente um ano por chamada, de 1911 até 1959, e registra decisões autônomas por parcela: uso residencial, comercial, industrial ou serviços; cada desenvolvimento registra pressão, distrito, ano e acréscimos abstratos de população/emprego.
- A pressão usa acessibilidade, empregos disponíveis, população próxima, infraestrutura, atividade comercial, demanda, custo da terra, dificuldade do terreno e congestionamento. Os acréscimos de população e emprego por distrito retornam às pressões dos anos seguintes. As regras ferroviárias recebem peso por era; esse peso, a quantidade de construções e os incrementos vêm de `CityGrowthCalibration` explícita, com fontes ou hipóteses citadas.
- Parcelas já desenvolvidas são excluídas dos anos seguintes. Novas ocupações recebem conexão viária sobre terra firme com caminho contíguo até a malha existente. Empates são resolvidos pelos IDs estáveis das parcelas; nenhuma stream aleatória é consumida.
- A saída é imutável e inclui pressão por parcela, decisões anuais, extensões viárias e totais abstratos acumulados. Ainda não altera `CityParcels1910`, `CityDistricts1910`, `World` ou o canvas; conexão à campanha/jogo e visualização permanecem pendentes de integração posterior.
- Testes cobrem determinismo, crescimento por ano, ausência de ocupação duplicada, conexão viária, fronteiras do calendário e exigência de hipóteses citadas. A calibração usada é sintética apenas nas fixtures; não há perfil de produção nem dados históricos aprovados.

## B9 — Envelhecimento, demolição e novas centralidades

Estado: **CONCLUÍDO**.

- `game/core/city/cityTransformation.ts` avança exatamente um ano por chamada após o resultado de crescimento do mesmo ano. Edifícios ativos perdem condição segundo taxa injetada; ao atingir o limiar, são demolidos e podem ser substituídos se a atratividade do terreno superar outro limiar explícito.
- A demolição nunca apaga a biografia: registros antigos mantêm data e status, e substituições apontam para predecessor e sucessor. Reconstruções elevam unidades de densidade até um máximo injetado.
- Atividade comercial/de serviços pode estabelecer novas centralidades por parcela. Vias com atividade adjacente suficiente recebem um registro datado de promoção a avenida, mantendo o traçado anterior.
- A API não fornece números de calibração de produção. Taxa de desgaste, limiares, densidade, centralidade e atividade exigem referências ou hipóteses citadas pelo chamador; testes usam somente fixtures sintéticas.
- Os resultados são imutáveis e determinísticos, sem RNG. O módulo ainda não integra crescimento ao `World`, save ou canvas.
- Testes cobrem ciclo de vida, preservação histórica, substituição/adensamento, centralidades, avenidas e validação de calendário/calibração.

## B10 — Snapshots e visor de revisão

Estado: **CONCLUÍDO**.

Entrega visível exigida pela nova regra do plano mestre: rota `/city-history` no app com seletor 1910/1920/1930/1940/1950/1959, mapa navegável por ano, camadas de distritos/ocupação/parcelas/valor-base/relevo, centro histórico, instituições, vias/ferrovia, avenidas e centralidades, além de métricas resumidas. A tela lê snapshots versionados produzidos por Core/Engine; não recalcula regras no React.

A página é uma demonstração de revisão do Alpha B, identificada como cenário sintético não calibrado. Não substitui a Macroetapa 35 nem altera o estado persistido da campanha. Snapshots agora carregam relevo, centro e instituições em schema v2. Esta subetapa do Alpha B deixa a rota, seed e limitações registradas em `docs/CONTEXTO.md`.

Correção de escopo após B11: a rota é diagnóstico de um cenário independente; sua captura não encerra a Macroetapa 4. A aceitação atual exige a cidade no `World` jogável em `/`, conforme B12–B13. A antiga regra de captura foi superada pela decisão D-0028 em `docs/CONTEXTO.md`.

## B11 — Simulação headless e faixas por seed

Estado: **CONCLUÍDO**.

`game/engine/CityHistoryEnsemble.ts` executa o cenário anual da cidade de 1910 a 1959 para um conjunto explícito de seeds, reúne os seis snapshots e calcula mínimo, média e máximo das métricas observáveis. A ordenação canônica das seeds torna o JSON estável mesmo que o chamador forneça a mesma amostra em outra ordem. Os testes comparam execuções idênticas, ordem invertida e uma amostra diferente.

Em `npm run dev`, consultar `/city-history/ensemble`, ligada ao visor `/city-history`. A tela exibe a amostra fixa de oito seeds de revisão e permite baixar o relatório JSON. É uma verificação de comportamento com parâmetros sintéticos, não um resultado histórico. O requisito de 100+ seeds e análise de longa duração permanece na Macroetapa 39. A Alpha B e as Macroetapas 4–7 continuam em andamento porque os sistemas anuais ainda não integram o `World`, o save e o fluxo principal do jogo.

## Integração incremental no jogo — B12–B18

**Regra de execução para Luna:** em cada pacote, alterar apenas o menor caminho Core → `World`/Engine → tela principal necessário para seu efeito, sem criar outra rota. Usar o mesmo `World` de `worldStore`, o mesmo `HistoricalClock` e a seed da campanha. Antes de codar, identificar os arquivos atuais desse caminho; exemplos prováveis são `game/core/World.ts`, `game/core/worldStore.ts`, `game/core/mapSerialization.ts`, `game/engine/GameSession.ts`, `game/render/` e `app/page.tsx`, mas a auditoria do código define os arquivos finais. Persistir qualquer estado novo com schema versionado e migração explícita; não preencher saves antigos com uma cidade passada inventada. Se essa migração exigir escolha de comportamento histórico não definida, registrar a lacuna e pedir decisão antes dessa parte. Não converter fixtures de testes em números históricos. Parâmetros de crescimento ou PPU usados no jogo devem ser hipóteses de design identificadas, com referência, interpretação e limitação; não são calibração histórica.

**B12 — Macroetapa 4, mapa inicial jogável. Estado: CONCLUÍDO.** A campanha recém-iniciada constrói uma cidade a partir da própria `worldSeed`: relevo/água B2 e traçado de centro, ferrovia e ruas B3 pertencem ao `World` e usam streams canônicas. O renderer principal lê os registros. O estado espacial seed-derivado é persistido no save v22 e validado antes da hidratação; v19–v21 preservam mapa e recebem `city: null`. Implementação em `World`, `campaignCity.ts`, `CityInfrastructureRenderer.ts` e `mapSerialization.ts`. **Evidência em localhost:** campanha limpa mostrou relevo, ferrovia, ruas e estação; após recarga os marcos e IDs mantiveram a mesma seed e puderam ser inspecionados novamente. O botão New City apresentou confirmação antes de substituir a cidade; a confirmação não foi aceita nesta revisão para preservar a campanha de teste. Testes de round-trip e build cobrem o fluxo determinístico.

**B13 — Macroetapa 4, leitura da cidade inicial. Estado: CONCLUÍDO.** O mesmo estado de 1910 contém distritos B4, parcelas B5 e marcos B3 com IDs estáveis. O mapa principal marca o centro e as cinco instituições; a inspeção do tile apresenta instituição/ID, distrito/ID, área, centralidade, população e emprego em **unidades abstratas**, e parcela/ID, relevo e acessos. Esse estado integra `World` e save v22 e é recalculado/validado pela mesma seed antes de hidratar. **Evidência em localhost:** inspetor mostrou centro histórico e praça, estação, dois distritos distintos e parcela; após recarga, estação, distrito, métricas e IDs permaneceram consistentes. Nenhum preço foi acrescentado; valor monetário permanece em B17–B18.

**B14 — Macroetapa 5, crescimento visível. Estado: CONCLUÍDO.** `World.tick` aplica exatamente uma transição B8 a cada 1º de janeiro emitido por `HistoricalClock`; o ledger registra ocupações, incrementos abstratos e extensões viárias. `CityInfrastructureRenderer` desenha vias e ocupações no mapa principal. O HUD mostra totais e identifica a hipótese sintética como não calibrada historicamente. Save v23 valida/persiste o ledger; v22 preserva a cidade-base e inicia ledger vazio no ano salvo, sem fabricar crescimento anterior. **Evidência:** testes cobrem fronteira anual, determinismo, round-trip e migração v22; na prévia isolada `http://127.0.0.1:3004/`, a campanha avançou de 1910 a 1911, exibiu duas ocupações e manteve data/ledger após recarga. **Aceite:** uma aplicação por ano, continuação determinística e nenhuma transformação B9 neste pacote.

Revisão de visibilidade em 28/09/2026: a tela principal identifica seed/data e separa métricas históricas abstratas dos diagnósticos herdados; o botão de última ocupação localiza no mapa o registro mais recente do ledger B14 e o inspetor lateral mostra uso e ano. A câmera inicial aponta ao centro de 1910. Este refinamento não altera o escopo nem o estado B15.

**B15 — Macroetapa 5, cidade que envelhece. Estado: CONCLUÍDO.** `World.tick` aplica B9 logo após B8 a cada 1º de janeiro; o ledger v24 guarda condição, densidade, demolições/substituições, centralidades e avenidas. O renderer principal mostra condição/densidade, memória demolida, centralidades e avenidas; o inspetor mostra todos os ciclos de edificação por parcela e as datas das transformações. O HUD soma edifícios ativos, registros anteriores, centralidades e avenidas e oferece foco na transformação mais recente. O perfil de campanha identifica limiares e ritmos como hipótese de design, sem calibração histórica. Migrações v23 reconstroem somente as transformações deriváveis do ledger B14 já salvo; saves v22 ancoram ambos os ledgers no ano guardado sem inventar crescimento anterior. **Ver em localhost:** avançar uma campanha até uma substituição; comparar o marcador no mapa e a biografia no inspetor, recarregar e confirmar o mesmo ledger. **Aceite da Macroetapa 5:** crescimento e transformação decorrem do relógio, sem decisões municipais do jogador ou cenário separado. O arquivo histórico completo da Macroetapa 34 permanece fora do escopo.

**B16 — Macroetapa 6, parcelas no mapa do jogo. Estado: CONCLUÍDO.** O inspetor da tela principal resolve a parcela clicada pelo `World` atual e apresenta ID, distrito, área, topografia, acessos, acessibilidade, população vizinha e eventos/compras persistidos. Campos sem dado válido exibem indisponibilidade; não há valor, proprietário, renda, prestígio nem aluguel inventados. **Verificado em localhost:** seed `CM-1910-C15A1E11`, campanha observada em 23/03/1918; cliques em parcelas da Praça Pública e da Pequena Indústria mostraram IDs, distritos, áreas e acessos distintos. A parcela da Pequena Indústria manteve o mesmo ID, cadastro e evento de fundação de 1910 depois de recarregar; compras continuaram em zero. A seleção não cria transação. A modalidade de aquisição pelo clube pertence à Macroetapa 9; não criar clube ou transação fictícia para esta inspeção.

**B17 — Macroetapa 7, valor PPU explicável. Estado: CONCLUÍDO.** O Core calcula a referência comparativa de 1910 com o perfil explícito `b17-visible-parcel-valuation-v1`: hipótese interna de 1 PPU normalizado por célula, multiplicador 0,75–1,25 e pesos publicados nos fatores; não estima preços históricos observados e fica isolado do perfil de crescimento B14. O inspetor mostra valor PPU base, ano, score, peso/contribuição por fator e fonte/limitação; não converte para moeda nominal nem grava valor no save. **Verificado em localhost:** na seed `CM-1910-C15A1E11`, a parcela `parcel-1910-district-city-institution-1910-railway-station-23-31` mostrou 7,22 PPU e score 90,7; a parcela `parcel-1910-district-city-institution-1910-small-industry-14-24` mostrou 7,12 PPU e score 87,4, com oito fatores e pesos/contribuições visíveis. O perfil identificou a estimativa como hipótese interna, sem cotação ou preço histórico observado. Após recarregar a campanha, a parcela da Pequena Indústria manteve o mesmo ID, PPU, score e fatores. **Aceite:** cálculo do Core reprodutível, explicado e rotulado como hipótese; nenhum valor nominal inferido de PPU.

**B18 — Macroetapa 7, exibição nominal honesta. Estado: CONCLUÍDO.** Ligar B6 à data da campanha: réis até 31/10/1942, cruzeiros desde 01/11/1942. Converter PPU somente quando houver índice mensal citado e base explícita; enquanto a série de produção estiver vazia, indicar no inspetor o motivo da ausência do valor nominal, mantendo PPU e fonte/hipótese visíveis quando válidos. **Ver em localhost:** conferir uma data anterior e outra posterior ao corte no mesmo jogo; a unidade muda, mas o valor nominal permanece indisponível sem índice. **Aceite:** nenhuma cotação inventada; o estado da Macroetapa 7 só muda para concluído se seus critérios econômicos do plano mestre forem cumpridos e a lacuna de calibração estiver declarada. Pesquisa da Macroetapa 41 continua pendente.

**Fechamento de cada pacote:** executar as checagens aplicáveis de `docs/PIPELINE.md`, verificar manualmente o percurso de `/` descrito no próprio pacote e anotar em `docs/CONTEXTO.md` seed, data, ação, resultado observado, testes e pendências. Se não houver comprovação visual no jogo, manter o pacote `EM ANDAMENTO`; screenshot é opcional. Não executar a suíte longa de 100+ seeds da Macroetapa 39 como condição de cada pacote.

## Testes obrigatórios

Golden seeds para geração e crescimento; propriedades de parcelas; valores finitos; comparação entre execuções; prova de que nenhuma ação municipal é exposta ao jogador.

## Não objetivos e riscos

Sem clube completo, cidadão individual, outras cidades gráficas, reprodução de Belo Horizonte ou editor urbano. Calibração econômica exige fontes e o desempenho deve ser medido antes de aumentar granularidade.
