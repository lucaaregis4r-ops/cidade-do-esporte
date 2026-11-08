# PLANO MESTRE DE IMPLEMENTAÇÃO
# CIDADE DOS ESPORTES — Alpha 0.1
## Simulador histórico-procedural de clube, cidade e futebol (1910–1959)

> **Versão:** 2.0 — Reconstrução modular para implementação por agentes de IA  
> **Data:** 12/10/2026  
> **Estado atual:** Alpha A e Alpha B CONCLUÍDOS; Alpha C em andamento (C1 concluído, C2 em andamento); Alpha D–I não iniciados

---

## 0. VISÃO CANÔNICA

**O que é:**
> Um simulador histórico-procedural em que o jogador funda um clube de futebol em 1910, escolhe onde ele nascerá em uma cidade fictícia de Minas Gerais e acompanha cinquenta anos de crescimento urbano, associativismo, política, patrimônio, futebol, pessoas, rivalidades e memória até a chegada da Taça Brasil de 1959.

**A principal recompensa não é ganhar partidas. É chegar a 1959 com uma história que não existia antes daquela campanha.**

**O que NÃO é:**
- Clone de SimCity
- Football Manager simplificado
- Tycoon de estádio
- Dashboard de métricas
- Reconstrução histórica de Belo Horizonte

**Papel do jogador:**  
O jogador representa **a continuidade institucional do clube**, não uma pessoa específica. Presidentes morrem, renunciam, perdem eleições. O jogador continua.

---

## 0.1 PRINCÍPIO FUNDAMENTAL

Todo sistema deve responder a pelo menos uma dessas perguntas:
1. Isso cria uma **decisão**?
2. Isso produz **consequência**?
3. Isso deixa **memória**?

Se a resposta for "não" para as três, a mecânica não é prioritária para o Alpha.

---

## 0.2 REGRAS CANÔNICAS INVIOLÁVEIS (25)

| # | Regra |
|---|---|
| 1 | Não transformar Cidade de Minas em Belo Horizonte |
| 2 | Não permitir que o jogador controle a prefeitura |
| 3 | Não criar clubes sem causa procedural |
| 4 | Não criar rivalidade por sorteio |
| 5 | Não criar atleta adulto do nada durante a campanha |
| 6 | Não tratar associados apenas como dinheiro |
| 7 | Não tratar presidente apenas como decoração |
| 8 | Não usar moeda nominal diretamente como unidade econômica interna |
| 9 | Não usar preços históricos sem registrar fonte ou hipótese |
| 10 | Não criar instalação esportiva apenas como `level` |
| 11 | Não apagar nomes antigos, escudos antigos ou estádios antigos do histórico |
| 12 | Não fixar identidade social do clube na origem |
| 13 | Não usar `Math.random()` na simulação — usar `CampaignRng` |
| 14 | Não hardcode vencedor histórico |
| 15 | Não hardcode rival histórico |
| 16 | Não hardcode fundador histórico |
| 17 | Não hardcode Campeonato Mineiro moderno em 1910 |
| 18 | Não aplicar regras modernas de futebol em toda a campanha |
| 19 | Não simular profundamente todo cidadão — usar camadas L0/L1/L2 |
| 20 | Não simular graficamente outras cidades — usar abstração regional |
| 21 | Não adicionar outros esportes durante o Alpha |
| 22 | Não sacrificar determinismo por variedade |
| 23 | Não sacrificar save antigo por refatoração — migração explícita sempre |
| 24 | Não criar menus desconectados do mapa quando informação pode existir fisicamente |
| 25 | Todo acontecimento importante deve entrar no `HistoricalLedger` |

---

## 0.3 INVARIANTES TÉCNICAS

```
Arquitetura: React Shell → Input → Engine → Core → Render
RNG: CampaignRng com streams nomeadas — nunca Math.random() no Core
Tempo: HistoricalClock — 01/01/1910 a 31/12/1959
Economia interna: PPU (Purchasing Power Unit) — moeda nominal apenas na UI
Save: versionado com migração explícita — nunca quebrar silenciosamente
Determinismo: seed + decisões → mesma história sempre
```

---

## 0.4 COMO USAR ESTE PLANO (para agentes de IA)

1. **Leia `AGENTS.md`** antes de qualquer código.
2. **Leia `docs/CONTEXTO.md`** para saber o estado atual verificado.
3. **Leia `agents/HANDSHAKE.md`** para saber quem está trabalhando.
4. **Encontre o pacote `EM ANDAMENTO`** — trabalhe somente nele.
5. **Consulte o pacote em `agents/NEXT-STEPS.md`** para o briefing detalhado.
6. **Ao concluir**: demonstre o efeito no jogo em `http://localhost:3000/`, registre em `docs/CONTEXTO.md` e atualize `agents/HANDSHAKE.md`.

**Um pacote por vez. Um agente por vez. Sem exceção.**

---

## 1. MAPA DE IMPLEMENTAÇÃO — ALPHAS A–I

```
Alpha A ████████████████████ CONCLUÍDO   Fundação técnica
Alpha B ████████████████████ CONCLUÍDO   Cidade autônoma
Alpha C ░░░░░░░░░░░░░░░░░░░░ EM ANDAMENTO Clube (C1 concluído, C2 em andamento)
Alpha D ░░░░░░░░░░░░░░░░░░░░ NÃO INICIADO Sociedade
Alpha E ░░░░░░░░░░░░░░░░░░░░ NÃO INICIADO Futebol
Alpha F ░░░░░░░░░░░░░░░░░░░░ NÃO INICIADO Ecossistema
Alpha G ░░░░░░░░░░░░░░░░░░░░ NÃO INICIADO História
Alpha H ░░░░░░░░░░░░░░░░░░░░ NÃO INICIADO 1959 e epílogo
Alpha I ░░░░░░░░░░░░░░░░░░░░ NÃO INICIADO Qualidade e balanceamento
```

**Cada Alpha depende do anterior. Não iniciar C sem B concluído. Não iniciar D sem C concluído. Etc.**

---

## 2. ALPHA A — FUNDAÇÃO TÉCNICA ✅ CONCLUÍDO

**Resultado:** Base técnica auditada, determinismo garantido, relógio histórico, save versionado, simulação vazia atravessa 1910–1959 reproduzível.

**Macroetapas cobertas:** 1, 2, 3, 37 (parcial), 39 (parcial), 40 (parcial)

### Pacotes concluídos

| ID | Entrega | Estado |
|---|---|---|
| A0 | Governança, contexto e pipeline | ✅ CONCLUÍDO |
| A1 | Base Cimulity incorporada | ✅ CONCLUÍDO |
| A2 | Auditoria PRESERVAR/ADAPTAR/REMOVER | ✅ CONCLUÍDO |
| A3 | Fronteiras arquiteturais protegidas por testes | ✅ CONCLUÍDO |
| A4 | `worldSeed` e streams RNG independentes | ✅ CONCLUÍDO |
| A5 | Proibição verificável de `Math.random()` no Core | ✅ CONCLUÍDO |
| A6 | `HistoricalClock` com cadências e velocidades | ✅ CONCLUÍDO |
| A7 | Fila de interrupções e auto-pause | ✅ CONCLUÍDO |
| A8 | Save versionado com seed, RNG e relógio | ✅ CONCLUÍDO |
| A9 | Decision log e reprodução determinística | ✅ CONCLUÍDO |
| A10 | Simulação headless vazia 1910–1959 | ✅ CONCLUÍDO |

**Evidência:** ver `docs/plans/alpha-a-fundacao-tecnica.md` e `docs/CONTEXTO.md`.

---

## 3. ALPHA B — CIDADE AUTÔNOMA ✅ CONCLUÍDO

**Resultado:** Cidade de Minas fictícia nasce em 1910, cresce e envelhece autonomamente até 1959. O jogador observa e escolhe terrenos, mas não administra a prefeitura.

**Macroetapas cobertas:** 4, 5, 6, 7

### Pacotes concluídos (todos B1–B18)

| ID | Entrega | Estado | Critério visual |
|---|---|---|---|
| B1 | Contrato `CityState` e dados por era | ✅ CONCLUÍDO | — |
| B2 | Terreno, água e relevo procedural | ✅ CONCLUÍDO | — |
| B3 | Centro, ferrovia, vias e instituições de 1910 | ✅ CONCLUÍDO | — |
| B4 | Distritos, população, empregos e centralidade | ✅ CONCLUÍDO | — |
| B5 | Parcelas e propriedade | ✅ CONCLUÍDO | — |
| B6 | `HistoricalEconomy` em PPU | ✅ CONCLUÍDO | — |
| B7 | Valor da terra e overlays | ✅ CONCLUÍDO | — |
| B8 | `CityGrowthDirector` | ✅ CONCLUÍDO | — |
| B9 | Envelhecimento, demolição e novas centralidades | ✅ CONCLUÍDO | — |
| B10 | Snapshots e visor de revisão `/city-history` | ✅ CONCLUÍDO | — |
| B11 | Simulação headless e faixas por seed | ✅ CONCLUÍDO | — |
| B12 | Macroetapa 4: mapa de 1910 na campanha | ✅ CONCLUÍDO | Relevo, água, ferrovia no mapa |
| B13 | Macroetapa 4: cidade inicial identificável | ✅ CONCLUÍDO | Centro, vias e 5 instituições |
| B14 | Macroetapa 5: crescimento anual visível | ✅ CONCLUÍDO | Expansão anual de parcelas |
| B15 | Macroetapa 5: transformação anual visível | ✅ CONCLUÍDO | Envelhecimento, demolições, avenidas |
| B16 | Macroetapa 6: inspeção de parcela na campanha | ✅ CONCLUÍDO | Cadastro e biografia da parcela |
| B17 | Macroetapa 7: PPU explicável com hipótese rotulada | ✅ CONCLUÍDO | PPU com 8 fatores explicados |
| B18 | Macroetapa 7: moeda nominal condicionada a índice | ✅ CONCLUÍDO | Réis < 1942, Cruzeiros >= 1942 ou ausência honesta |

**B18 encerrou o Alpha B e a Macroetapa 7.**

### O que foi construído (auditoria B1–B18)

**Arquitetura urbana implementada:**
- `game/core/city/CityState.ts` — identidade e eras da cidade
- `game/core/city/cityTerrain.ts` — terreno/água procedural
- `game/core/city/cityFoundation.ts` — centro, ferrovia, ruas, instituições de 1910
- `game/core/city/cityDistricts.ts` — partição em 9 distritos
- `game/core/city/cityParcels.ts` — cadastro de parcelas com biografia
- `game/core/economy/HistoricalEconomy.ts` — PPU/réis/cruzeiros
- `game/core/city/cityLandValue.ts` — 8 fatores de valor PPU
- `game/core/city/cityGrowth.ts` — `CityGrowthDirector` autônomo
- `game/core/city/cityTransformation.ts` — envelhecimento, demolição, adensamento
- `game/core/city/citySnapshots.ts` — snapshots versionados 1910–1959
- Save v25 com ledgers B14/B15, migrações v19–v24 e suporte a ClubState

**Estado do save:** v25 (campanha, cidade, crescimento, transformação, decisão log, clube opcional v24→v25)

---

## 4. ALPHA C — CLUBE 🔄 EM ANDAMENTO

**Dependência:** Alpha B completamente concluído (B18 entregue)  
**Resultado:** O jogador funda e mantém um clube — com identidade, terreno real, associados, ledger financeiro e patrimônio com biografia.  
**Macroetapas cobertas:** 8 (fundação), 9 (terreno), 10 (modelo do clube), 11 (associados), 27 (instalações), 28 (patrimônio), 29 (finanças)

### Pacotes do Alpha C

| ID | Entrega | Depende de | Estado | Critério visual |
|---|---|---|---|---|
| C1 | Contrato `Club` com identidade e serialização | Alpha B | ✅ CONCLUÍDO | Clube existe no save v25 e persiste após recarga |
| C2 | 6 origens e `FoundingGroup` com fundadores reais | C1 | 🔄 EM ANDAMENTO | Tela/inspeção de fundação; nomes citados existem no mundo |
| C3 | Nome, cores e primeira versão de escudo | C2 | 🔲 PLANEJADO | Clube aparece com identidade visual no mapa |
| C4 | Inspeção e escolha livre de parcela viável | B5, B7 | 🔲 PLANEJADO | Mapa abre overlay; parcela selecionada mostra ficha real |
| C5 | Formas de ocupação e contratos | C4 | 🔲 PLANEJADO | Contrato persistido; eventos de obrigação no ledger |
| C6 | Instalações iniciais com biografia | C5 | 🔲 PLANEJADO | Instalação no mapa com condição, data e histórico |
| C7 | Categorias e coortes de associados | C2, C5 | 🔲 PLANEJADO | Painel mostra coortes agregadas + membros materializados |
| C8 | Adesão, saída, joia e mensalidade | C7, B6 | 🔲 PLANEJADO | Entradas/saídas visíveis; afinidade e preço influenciam |
| C9 | Ledger financeiro — saldo só muda por transação | C5–C8 | 🔲 PLANEJADO | Painel com receitas, despesas e saldo reconciliável |
| C10 | Obras, manutenção, dívida e recuperação | C6, C9 | 🔲 PLANEJADO | Crise visível; não vira Game Over imediato |
| C11 | Vertical "fundar e sobreviver 5 anos" | C1–C10 | 🔲 PLANEJADO | Fluxo jogável do início ao HMR; save/load preserva história |

### Especificações de sistema (C1–C11)

**`Club` — contrato de dados:**
```ts
interface Club {
  id: string;
  name: string;
  foundingDate: GameDate;        // HistoricalClock
  foundingOrigin: FoundingOrigin;
  foundingStory: string;         // texto procedural com pessoas reais
  colors: ClubColors;
  crestHistory: CrestVersion[];  // nunca apagar versão antiga
  founders: string[];            // IDs de Person existentes
  parcels: string[];
  facilities: string[];
  members: ClubMembershipSystem;
  finances: ClubFinances;
  politics: ClubPolitics;
  football: FootballDepartment;
  socialIdentity: SocialIdentity;
  reputation: Reputation;
  supporters: SupporterModel;
  rivalries: RivalryRelationship[];
  presidents: PresidencyTerm[];
  historicalEvents: string[];    // IDs no HistoricalLedger
}
```

**6 origens de fundação:**
- `FERROVIARIOS` — trabalhadores da ferrovia; capital baixo; força no distrito ferroviário
- `ESTUDANTES` — jovens de escola/faculdade; redes sociais amplas
- `IMIGRANTES` — comunidade coesa; comercial; nomes de origem estrangeira
- `TRABALHADORES` — bairro operário; base popular desde o início
- `COMERCIANTES` — capital médio; conexões comerciais
- `ELITE_LOCAL` — capital alto; prestígio inicial; patrimônio mais caro

**Regra:** cada origem gera fundadores com biografia. Nomes citados no texto precisam existir como `Person`. Não inventar texto desconectado do mundo.

**`CrestVersion`:**
```ts
interface CrestVersion {
  startYear: number;
  endYear?: number;
  designId: string;
  changeReason: string;
}
```

**Formas de ocupação (C5):**
- `COMPRA` — clube é proprietário; custo alto; liberdade total
- `ALUGUEL` — custo mensal; rescisão possível
- `ARRENDAMENTO` — longo prazo; cláusulas específicas
- `CESSAO_EMPRESARIAL` — empresa ganha influência; conflitos futuros
- `DOACAO` — custo zero; vínculos afetivos
- `CONCESSAO_PUBLICA` — sujeita a condições
- `USO_COMPARTILHADO` — restrições de horário e uso

**`ClubFinances` — ledger:**
```ts
// Receitas Alpha
type Revenue = 'joia' | 'mensalidade' | 'contribuicao_extra' | 'bilheteria' | 
               'doacao' | 'patrocinio' | 'aluguel' | 'transferencia' | 'premiacao';
// Despesas Alpha
type Expense = 'folha' | 'ajuda_atleta' | 'manutencao' | 'obra' | 'viagem' | 
               'taxa_federativa' | 'arbitragem' | 'administracao' | 'divida';
// NUNCA alterar saldo diretamente — sempre via ledger.transfer()
```

**Clube inicial em 1910:**
- Sem CT moderno, departamento médico ou dezenas de empregados
- Começa: terreno + campo + pequena sede + vestiário rudimentar + poucos associados

### Não objetivos do Alpha C
- Política completa e eleições (→ Alpha D)
- Partidas e futebol (→ Alpha E)
- Estádio moderno (→ evolução orgânica nas décadas seguintes)
- Identidade social congelada pela origem (→ deve evoluir)

---

## 5. ALPHA D — SOCIEDADE 🔲 NÃO INICIADO

**Dependência:** Alpha C concluído  
**Resultado:** O clube possui pessoas reais, famílias, identidade social dinâmica, política interna e eleições.  
**Macroetapas cobertas:** 12 (identidade social), 13 (pessoas), 14 (política e eleições)

### Pacotes planejados

| ID | Entrega | Depende de | Critério visual |
|---|---|---|---|
| D1 | Contrato `Person` com genealogia e bootstrap de 1910 | Alpha C | Fundadores têm pais; genealogias existem antes de 1910 |
| D2 | Emergência de pessoas materializadas | D1 | Pessoas aparecem no inspetor com biografia consistente |
| D3 | Famílias e transmissão geracional | D1 | Árvore familiar navegável com datas consistentes |
| D4 | `SocialIdentity` dinâmica do clube | C2, D1 | Composição do clube muda com o tempo; identidade não congela |
| D5 | Camadas L0/L1/L2 de população | D1 | HUD mostra métricas urbanas por camada |
| D6 | `ClubPolitics` — estatuto e facções | C1, D2 | Facções emergem de interesses; não todas existem em todo clube |
| D7 | Eleições com candidatos biografados | D6 | Tela de eleição com histórico real do candidato |
| D8 | Presidência e efeitos no clube | D7 | Vitória muda parâmetros do clube visivelmente |
| D9 | Vertical "eleição completa com consequência" | D1–D8 | Candidatos reais, facções, votação, resultado e efeito no jogo |

### Especificações de sistema (D1–D9)

**`Person` — contrato de dados:**
```ts
interface Person {
  id: string;
  name: string;
  birthDate: GameDate;
  deathDate?: GameDate;
  parents: string[];
  children: string[];
  partnerId?: string;
  districtId: string;
  occupation: Occupation;
  economicClass: SocialClass;
  wealthIndex: number;
  footballInterest: number;        // 0–100
  clubAffinities: Record<string, number>; // clubId → 0–100
  reputation: number;
  traits: PersonTraits;
  relationships: Relationship[];
  careerHistory: CareerEntry[];
  clubHistory: ClubRole[];
  eventHistory: string[];          // IDs no HistoricalLedger
}
```

**Camadas de população:**
- **L0 Agregada:** A maioria da cidade — estatísticas por bairro/classe/faixa etária
- **L1 Coortes:** Bairro × idade × classe × ocupação — comportamento coletivo
- **L2 Materializada:** Somente indivíduos historicamente relevantes — fundadores, presidentes, jogadores, jornalistas, empresários influentes

**`SocialIdentity` — segmentos:**
```
operários / ferroviários / estudantes / comerciantes / classe média / 
elite / imigrantes / bairros / famílias / cidade inteira
```
Affinity por segmento: 0–100. Muda por preço de mensalidade, bairro, títulos, dirigentes, imprensa, obras, inclusão, expansão da cidade.

**`ClubPolitics` — facções emergentes:**
```
Fundadores / Futebolistas / Patrimonialistas / Fiscalistas / 
Populares / Elitistas / Modernizadores / Tradicionalistas
```
Não criar todas em todo clube. Emergem de interesses reais.

**Presidente — parâmetros que afeta:**
```ts
type PresidentProfile = {
  budgetTolerance: number;
  debtTolerance: number;
  sportInvestment: number;
  socialInvestment: number;
  propertyStrategy: number;
  professionalismPreference: number;
  membershipPricingPreference: number;
};
```

**Eleição — candidato tem:**
```
nome / idade / tempo de clube / cargos anteriores / facção / prioridades / posições conhecidas
```

### Não objetivos do Alpha D
- Jogadores de futebol (→ Alpha E)
- Outros clubes e federação (→ Alpha F)
- Media/imprensa (→ Alpha G)

---

## 6. ALPHA E — FUTEBOL 🔲 NÃO INICIADO

**Dependência:** Alpha D concluído  
**Resultado:** Futebol funciona por décadas — jogadores nascem da população, envelhecem, se profissionalizam, e partidas produzem resultados e memória.  
**Macroetapas cobertas:** 18 (jogadores), 19 (formação), 20 (mercado e profissionalização), 21 (motor de partidas)

### Pacotes planejados

| ID | Entrega | Depende de | Critério visual |
|---|---|---|---|
| E1 | Contrato `Footballer` com atributos históricos | Alpha D | Perfil de jogador com posição, atributos e era |
| E2 | `AthleteEmergence` — jogadores nascem da população | D1–D3, E1 | Linha de vida: nascimento → descoberta → clube |
| E3 | Formação histórica — peladas, juvenis, categorias | E2 | Formação evolui por época; não cria academia moderna em 1910 |
| E4 | `FootballEra` — evolução de treinamento e tática | E1 | Atributos e táticas mudam com a década |
| E5 | `ClubPolicy` — amador/semi-pro/profissional | D8, E1 | Troca de política visível; consequências em folha e atletas |
| E6 | Mercado — propostas, movimentações, efeitos | E5 | Propostas no feed; decisão afeta caixa e elenco |
| E7 | `MatchEngine` — simulação estatística coerente | E1–E4 | Partida navegável com eventos e resultado reproduzível |
| E8 | `FootballRulesByEra` — regras históricas | E7 | Regras de 1910 ≠ regras de 1959 aplicadas corretamente |
| E9 | `ProfessionalizationPressure` — pressão sistêmica | E5–E6 | Por volta de 1933, ambiente muda visivelmente |
| E10 | Vertical "clube com elenco por 10 anos" | E1–E9 | Save/load preserva carreiras; envelhecimento consistente |

### Especificações de sistema (E1–E10)

**`Footballer` — contrato:**
```ts
interface Footballer {
  personId: string;    // referência a Person existente
  positions: Position[];
  technical: TechnicalAttributes;  // finalização, passe, domínio, drible, desarme, aéreo, goleiro
  physical: PhysicalAttributes;    // velocidade, resistência, força, agilidade
  mental: MentalAttributes;        // decisão, posicionamento, concentração, coragem, disciplina
  personality: FootballPersonality;
  potential: number;
  reputation: number;
  condition: number;
  injuryRisk: number;
  clubHistory: PlayerClubSpell[];
  matchHistory: MatchRecord[];
  achievements: Achievement[];
}
```

**Regra:** Não usar `overall` único no motor. A UI pode resumir, o motor não.

**`MatchEngine` — entradas:**
```
qualidade dos jogadores / posição / condição / moral / entrosamento /
tática / mando de campo / viagem / qualidade do gramado / era histórica
```

**`MatchEngine` — saídas:**
```
gols / finalizações / posse estimada / faltas / cartões (quando aplicável) /
lesões / destaques / expulsões / substituições conforme regras da época
```

**`ClubPolicy`:**
```
STRICT_AMATEUR → ASSISTED_AMATEUR → SEMI_PRO → PROFESSIONAL
```
- Amador: preserva tradição, perde atletas para concorrentes
- Profissional: melhora competitividade, aumenta drasticamente os custos

**Profissionalização — por volta de 1933:** criar pressão sistêmica forte. Não hardcode `if (year === 1933) makeProfessional()`. A pressão emerge de receita, competição, talento dos rivais, popularidade e federação.

**Formação histórica por era:**
- 1910–1920: peladas, times de bairro, esquemas informais
- 1920–1935: juvenis, times secundários, organização incipiente
- 1935–1959: categorias mais formais, peneiras, vínculos

### Não objetivos do Alpha E
- Campeonatos organizados (→ Alpha F)
- Rivalidades (→ Alpha G)
- Estádio com capacidade real (→ evolução orgânica)

---

## 7. ALPHA F — ECOSSISTEMA 🔲 NÃO INICIADO

**Dependência:** Alpha E concluído  
**Resultado:** O jogador não joga contra entidades artificiais sem passado — outros clubes nascem, competem, morrem; a federação emerge; campeonatos acontecem.  
**Macroetapas cobertas:** 15 (outros clubes locais), 16 (clubes regionais), 17 (federação), 22 (competições)

### Pacotes planejados

| ID | Entrega | Depende de | Critério visual |
|---|---|---|---|
| F1 | `ClubBirthEngine` — outros clubes nascem organicamente | Alpha E | Mapa mostra novos clubes com data e causa de fundação |
| F2 | `AIClubDirector` — IA toma decisões institucionais | F1 | Cada clube age diferente; não seguem estratégia ótima única |
| F3 | Dissidências — clubes nascendo de clubes | F1 | Evento registrado no ledger dos dois clubes |
| F4 | `RegionalClub` — clubes abstratos do interior | F1 | Visão regional com clubes, regiões e relações |
| F5 | `FederationFormationEngine` — emergência institucional | F1–F2 | Timeline da formação entre ~1913–1917 |
| F6 | `Federation` — estatuto, blocos, política federativa | F5 | Conflitos e cisões visíveis; dois campeões em anos de cisão |
| F7 | `CompetitionGenerator` — formatos emergentes | F5–F6 | Primeira competição gerada; chave/tabela navegável |
| F8 | Evolução competitiva 1910–1959 | F7 | Formato muda com época, número de clubes e federação |
| F9 | Vertical "primeira temporada completa" | F1–F8 | Temporada com partidas, tabela, campeão e registros no ledger |

### Especificações de sistema (F1–F9)

**`ClubBirthEngine` — avalia anualmente:**
```
população / bairros / empresas / escolas / trabalhadores / 
comunidades / interesse esportivo / clubes existentes / insatisfações
```

**Motivos de fundação:**
```
bairro / ferrovia / fábrica / estudantes / imigrantes / elite / trabalhadores / dissidência
```

**`AIClubDirector` decide:**
```
associados / orçamento / terreno / estádio / contratação / 
profissionalização / política / competições
```

**`RegionalClub` — dados mínimos:**
```
cidade fictícia / região mineira / fundação / origem / finanças /
elenco / estádio abstrato / torcida / tradição / administração / histórico
```

**Regiões de Minas (genéricas, não reais):**
```
Central / Zona da Mata / Sul / Triângulo / Oeste / Norte / Vale
```

**`Federation` — contrato:**
```ts
interface Federation {
  id: string; name: string; foundingDate: GameDate;
  foundingClubs: string[]; affiliatedClubs: string[];
  presidents: PresidencyTerm[]; statutes: FederationStatutes;
  blocs: FederationBloc[]; competitions: string[];
  professionalismPolicy: ProfessionalismPolicy;
  historicalEvents: string[];
}
```

**`CompetitionGenerator` — formato depende de:**
```
número de clubes / distâncias / finanças / federação / época / calendário
```
Formatos: turno único / turno e returno / grupos / fase final / divisões

**Regra:** Campeonato Mineiro não tem formato fixo. Nasce da história da campanha.

### Não objetivos do Alpha F
- Rivalidades profundas (→ Alpha G)
- Taça Brasil nacional (→ Alpha H)

---

## 8. ALPHA G — HISTÓRIA 🔲 NÃO INICIADO

**Dependência:** Alpha F concluído  
**Resultado:** A simulação começa a produzir narrativa — rivalidades emergem, imprensa reporta, memória acumula, legado se constrói.  
**Macroetapas cobertas:** 23 (rivalidades), 24 (incidentes e clássicos), 25 (torcida), 26 (imprensa), 30 (lendas), 31 (homenagens), 32 (tradição), 33 (historical ledger), 34 (arquivo)

### Pacotes planejados

| ID | Entrega | Depende de | Critério visual |
|---|---|---|---|
| G1 | `RivalryRelationship` — rivalidade por causas | Alpha F | Relação entre dois clubes com fatores e acontecimentos |
| G2 | Incidentes e clássicos com consequências | G1 | Registro de incidente com punições e memória |
| G3 | `SupporterModel` — torcida separada de associados | F2, G1 | Distribuição territorial de torcida por clube |
| G4 | `MediaEngine` — imprensa procedural por template | G1–G3 | Notícia procedural ligada a evento/clube/pessoa reais |
| G5 | Evolução da imprensa 1910s→1950s (jornal→rádio) | G4 | Cobertura e alcance mudam com a época |
| G6 | `LegacyScore` — lendas, ídolos, figuras fundadoras | Alpha F | Galeria com critérios e acontecimentos de cada categoria |
| G7 | Homenagens — propostas com contexto político | G6 | Proposta de homenagem com apoiadores e oposição |
| G8 | `TraditionSystem` — objetos de tradição | G6–G7 | Linha visual de escudo/estádio/bairro ao longo das décadas |
| G9 | `HistoricalLedger` — eventos com causação | All | Timeline causal; causas e consequências linkadas |
| G10 | Arquivo do clube — tela de consulta histórica | G9 | Arquivo com mapas comparáveis 1910/1920/.../1959 |
| G11 | Vertical "50 anos de história navegável" | G1–G10 | Campanha completa com narrativa consultável no arquivo |

### Especificações de sistema (G1–G11)

**`RivalryRelationship` — contrato:**
```ts
interface RivalryRelationship {
  clubs: [string, string];
  geographic: number; sporting: number; social: number;
  political: number; supporter: number; historical: number;
  intensity: number;
  firstMatch?: string;
  majorMatches: string[]; incidents: string[];
  transfers: string[]; pressNames: string[];
  historicalEvents: string[];
}
```

**`RivalryScore` cresce por:**
```
proximidade / mesma torcida-base / decisões / equilíbrio competitivo /
frequência de jogos / finais / goleadas / transferências polêmicas /
disputas federativas / incidentes / cisões
```

**Incidentes — possíveis:**
```
discussão / provocação / invasão / tumulto / briga de jogadores /
conflito de dirigentes / arbitragem controversa
```
**Regra:** não gamificar violência como benefício. Consequências: punição, suspensão, multa, perda de mando, imprensa negativa.

**`MediaEngine` — não usar LLM online:**
- Templates procedurais com slots para evento/pessoas/clubes
- 1910s: jornal → 1920s: imprensa esportiva maior → 1930s: rádio → 1940s–1950s: cobertura intensa

**`HistoricalEvent` — contrato:**
```ts
interface HistoricalEvent {
  id: string; date: GameDate;
  category: HistoricalCategory;  // FUNDACAO, PRIMEIRO_JOGO, TITULO, ELEICAO, OBRA, etc.
  importance: number;
  title: string; description: string;
  people: string[]; clubs: string[];
  facilities: string[]; competitionId?: string;
  causes: string[];       // IDs de eventos anteriores
  consequences: string[]; // IDs de eventos posteriores
  tags: string[];
}
```

**`LegacyScore` — categorias:**
```
MEMORAVEL / IDOLO / LENDA / FIGURA_FUNDADORA
```
Fatores: tempo, títulos, recordes, importância, lealdade, momentos decisivos, origem na base, relação com torcida, impacto institucional.

**`TraditionSystem` — objetos:**
```
escudo / cores / estádio / bairro / origem / estilo / rivalidade / nomes / rituais
```

**Arquivo do clube — seções:**
```
História / Presidentes / Elencos / Lendas / Títulos / Rivalidades / 
Estádios / Escudos / Famílias / Finanças históricas / Mapas
```

### Não objetivos do Alpha G
- Taça Brasil nacional (→ Alpha H)
- Balanceamento fino (→ Alpha I)

---

## 9. ALPHA H — 1959 E EPÍLOGO 🔲 NÃO INICIADO

**Dependência:** Alpha G concluído  
**Resultado:** A campanha chega a 1959, o representante mineiro é determinado e o jogador recebe o relatório dos 50 anos.  
**Macroetapas cobertas:** 36 (1959 e Taça Brasil)

### Pacotes planejados

| ID | Entrega | Depende de | Critério visual |
|---|---|---|---|
| H1 | `NationalAbstractClub` — clubes de outros estados | Alpha G | Visão esquemática dos participantes nacionais |
| H2 | Classificação para Taça Brasil — emergência da campanha | H1 | Quem se classifica depende da história; jogador pode não ir |
| H3 | Taça Brasil — competição épica ou contextual | H2 | Se classificado: competição navegável com epílogo especial |
| H4 | Relatório "Cinquenta Anos 1910–1959" | H2–H3 | Relatório com cidade inicial/final, presidentes, lendas, títulos, rival, maior vitória, etc. |
| H5 | Encerramento e continuidade de campanha | H4 | Campanha encerra com estado consultável; save preservado |

### Relatório final — campos obrigatórios

```
Cidade inicial (mapa 1910) / Cidade final (mapa 1959)
Fundadores / Presidentes
Associados iniciais e finais
Patrimônio / Estádio
Títulos / Lendas
Maior rival / Clássico mais memorável
Maior vitória / Maior derrota / Jogo mais importante
Pessoa mais importante / Família mais influente
Maior crise / Maior obra
Escudos (todos) / Valor dos terrenos
```

**Regra:** se o jogador não se classificar para a Taça Brasil, a campanha continua com a história do clube até 31/12/1959. Não é Game Over.

---

## 10. ALPHA I — QUALIDADE E BALANCEAMENTO 🔲 NÃO INICIADO

**Dependência:** Alpha H concluído  
**Resultado:** 100+ seeds, performance medida, pesquisa histórica calibrada, UX polida.  
**Macroetapas cobertas:** 37 (save completo), 38 (performance), 39 (testes longos), 40 (debug), 41 (pesquisa histórica)

### Pacotes planejados

| ID | Entrega | Depende de | Critério visual |
|---|---|---|---|
| I1 | 100+ seeds — relatório de faixas e dispersão | Alpha H | Gráficos de faixas com min/média/máx; replay selecionável |
| I2 | Camadas L0/L1/L2 — performance medida | D5 | Painel de orçamento por escala e camada |
| I3 | DEV mode completo — seed, RNG, time travel | A10 | DEV ao vivo com seed, pressão, time travel e exportação |
| I4 | Pesquisa histórica como dado | All | Cartão de pesquisa com valor/ano/fonte/interpretação/limitação |
| I5 | Save v-final — todos os domínios integrados | All | Save/load completo com migração e erro legíveis |
| I6 | UX — tela principal unificada | All | Todas as seções acessíveis sem rota separada |
| I7 | Campanha de referência reproduzível completa | All | Seed + log → mesma campanha do início ao relatório 1959 |

### Especificações (I1–I7)

**100 seeds — verificar:**
- Cidade: cresceu, não explodiu, bairros coherentes, valor imobiliário plausível
- Clubes: novos nascem, alguns desaparecem, nenhum domina todas as seeds
- Futebol: campeonatos acontecem, jogadores surgem/envelhecem/se aposentam
- Economia: sem NaN, dívida limitada, receita plausível
- Política: eleições ocorrem, presidentes mudam, facções existem
- Federação: entidade emerge, competições organizadas
- Rivalidade: clássicos surgem, nem todo par vira rival
- História: ledger não vazio, eventos com referências válidas

**Pesquisa histórica — todo dado calibrado precisa de:**
```
valor / ano / fonte / interpretação / limitação
```

**Fontes prioritárias:** IBGE / Banco Central / Min. do Trabalho / FMF / CBF / UFMG / SciELO / FGV / IPEA / teses acadêmicas

**Regra de calibração:** dado histórico define janelas e tendências; seed define personagens, datas específicas, vencedores. NÃO hardcode eventos.

---

## 11. MACROETAPAS FORMAIS — MAPA DE RASTREAMENTO

| # | Macroetapa | Alpha | Estado |
|---:|---|---|---|
| 1 | Fork, auditoria e fundação técnica | A | ✅ CONCLUÍDA |
| 2 | Determinismo e world seed | A | ✅ CONCLUÍDA |
| 3 | Relógio histórico 1910–1959 | A | ✅ CONCLUÍDA |
| 4 | Geração procedural de Cidade de Minas | B | ✅ CONCLUÍDA |
| 5 | Cidade autônoma | B | ✅ CONCLUÍDA |
| 6 | Parcelas e mercado imobiliário | B | ✅ CONCLUÍDA |
| 7 | Economia histórica | B | ✅ CONCLUÍDA |
| 8 | História de fundação | C | 🔄 EM ANDAMENTO |
| 9 | Escolha do terreno | C | 🔲 NÃO INICIADA |
| 10 | Modelo do clube | C | 🔲 NÃO INICIADA |
| 11 | Associados | C | 🔲 NÃO INICIADA |
| 12 | Identidade social dinâmica | D | 🔲 NÃO INICIADA |
| 13 | Pessoas e genealogias | D | 🔲 NÃO INICIADA |
| 14 | Política e eleições | D | 🔲 NÃO INICIADA |
| 15 | Outros clubes de Cidade de Minas | F | 🔲 NÃO INICIADA |
| 16 | Clubes do interior de Minas | F | 🔲 NÃO INICIADA |
| 17 | Federação e instituições | F | 🔲 NÃO INICIADA |
| 18 | Futebol: jogadores | E | 🔲 NÃO INICIADA |
| 19 | Nascimento e formação | E | 🔲 NÃO INICIADA |
| 20 | Mercado e profissionalização | E | 🔲 NÃO INICIADA |
| 21 | Motor de partidas | E | 🔲 NÃO INICIADA |
| 22 | Competições | F | 🔲 NÃO INICIADA |
| 23 | Rivalidades | G | 🔲 NÃO INICIADA |
| 24 | Incidentes e clássicos | G | 🔲 NÃO INICIADA |
| 25 | Torcida e popularidade | G | 🔲 NÃO INICIADA |
| 26 | Imprensa | G | 🔲 NÃO INICIADA |
| 27 | Instalações | C | 🔲 NÃO INICIADA |
| 28 | Patrimônio e valorização | C | 🔲 NÃO INICIADA |
| 29 | Finanças do clube | C | 🔲 NÃO INICIADA |
| 30 | Lendas e legado | G | 🔲 NÃO INICIADA |
| 31 | Homenagens | G | 🔲 NÃO INICIADA |
| 32 | Tradição | G | 🔲 NÃO INICIADA |
| 33 | Historical Ledger | G | 🔲 NÃO INICIADA |
| 34 | Arquivo do clube | G | 🔲 NÃO INICIADA |
| 35 | Interface principal | I | 🔲 NÃO INICIADA |
| 36 | 1959 e Taça Brasil | H | 🔲 NÃO INICIADA |
| 37 | Save versionado | A+todos | 🔄 EM ANDAMENTO |
| 38 | Performance | I | 🔲 NÃO INICIADA |
| 39 | Testes históricos de longa duração | I | 🔄 EM ANDAMENTO (parcial) |
| 40 | Ferramentas de debug | I | 🔄 EM ANDAMENTO (parcial) |
| 41 | Pesquisa histórica como dado | I | 🔲 NÃO INICIADA |
| 42 | Ordem real de implementação | Todos | ✅ CONCLUÍDA (este plano) |

---

## 12. CRITÉRIO VISUAL POR MACROETAPA

Ver `agents/VISUAL-AUDIT.md` para o estado atual e percurso de verificação.

| # | O que deve ser demonstrável no jogo |
|---:|---|
| 1 | Diagrama das camadas auditadas identificável no menu |
| 2 | Duas execuções da mesma seed com estado final idêntico |
| 3 | Relógio 1910–1959 percorrível com cadências visíveis |
| 4 | Mapa jogável de 1910 com água, relevo, centro, ferrovia, vias, instituições gerados pela seed ✅ |
| 5 | Expansão, envelhecimento, demolições e avenidas no mapa ao avançar o relógio ✅ |
| 6 | Clique em parcela mostra topografia, acessos e histórico ✅ |
| 7 | PPU com perfil citado; moeda nominal com índice válido ou ausência honesta (🔄 B17 ✅, B18 pendente) |
| 8 | Tela de fundação com origem, fundadores e narrativa com nomes reais |
| 9 | Mapa com parcelas viáveis inspecionáveis e ocupáveis |
| 10 | Ficha do clube com identidade, origem, cores e patrimônio inicial |
| 11 | Painel de associados com coortes e membros materializados |
| 12 | Composição social do clube mudando com o tempo |
| 13 | Árvore familiar navegável com datas consistentes |
| 14 | Eleição com candidatos biografados, facções e resultado causalmente explicável |
| 15 | Mapa mostrando clubes locais com datas e causas |
| 16 | Visão regional esquemática com clubes abstratos de Minas |
| 17 | Timeline da formação da federação e primeiras competições |
| 18 | Perfil de jogador com atributos, clube e situação |
| 19 | Linha de carreira de atleta da formação à aposentadoria |
| 20 | Mercado com propostas, decisões e efeitos financeiros |
| 21 | Partida navegável com escalações, eventos e resultado reproduzível |
| 22 | Chave/tabela de competição gerada pelos clubes e regras da época |
| 23 | Relação entre dois clubes com fatores e acontecimentos da rivalidade |
| 24 | Registro de incidente com consequências e links para envolvidos |
| 25 | Distribuição territorial de torcida, separada de associados |
| 26 | Notícia procedural ligada a evento/clube/pessoa reais da campanha |
| 27 | Instalação no mapa com capacidade, condição, reformas e histórico de nomes |
| 28 | Imóvel com aquisições, obras, avaliações datadas e memória afetiva |
| 29 | Ledger com receitas, despesas, dívidas e saldo reconciliável |
| 30 | Galeria de legado com critérios e acontecimentos por categoria |
| 31 | Proposta de homenagem com apoiadores, oposição e efeito na nomenclatura |
| 32 | Linha visual de escudo/cores/estádio/bairro ao longo das décadas |
| 33 | Timeline causal navegável com causas e consequências linkadas |
| 34 | Arquivo do clube com mapas comparáveis 1910/1920/.../1959 |
| 35 | Tela principal reunindo cidade, clube, decisões, inspeção e interrupções |
| 36 | Epílogo de 1959 com classificação, Taça Brasil e relatório de 50 anos |
| 37 | Save carregado antes/depois com continuação idêntica e migração legível |
| 38 | Painel de performance por escala e camada de população |
| 39 | Gráficos de 100+ seeds com faixas, falhas e replay de execução selecionada |
| 40 | DEV mode com seed, RNG, pressão, time travel e exportação de replay |
| 41 | Cartão de calibração com valor/ano/fonte/interpretação/limitação |
| 42 | Campanha completa reproduzível do início ao relatório 1959 |

---

## 13. DEFINIÇÃO DE PRONTO DO ALPHA

O Alpha estará realmente concluído quando uma pessoa puder:

1. Iniciar uma seed nova em 1910
2. Observar Cidade de Minas procedural crescendo autonomamente
3. Escolher uma origem de fundação com fundadores reais
4. Dar nome, cores e escudo ao clube
5. Escolher qualquer terreno viável no mapa e ocupá-lo
6. Captar associados organicamente
7. Pagar despesas e construir patrimônio
8. Disputar partidas que produzem resultados e memória
9. Acompanhar jogadores envelhecendo e jovens surgindo
10. Observar outros clubes nascerem e desaparecerem
11. Participar da formação institucional do futebol mineiro
12. Disputar campeonatos que evoluem historicamente
13. Assistir e participar de eleições internas com consequências
14. Conviver com facções e identidade social mudando
15. Ver rivalidades surgindo organicamente de eventos reais
16. Acompanhar imprensa e memória se acumulando
17. Ver Cidade de Minas crescer ao redor do patrimônio
18. Descobrir que terrenos antigos valorizaram
19. Acompanhar lendas envelhecendo e sendo homenageadas
20. Consultar cinquenta anos no arquivo histórico
21. Chegar a 1959 e conhecer o representante mineiro
22. Disputar a Taça Brasil se o clube se classificar
23. Receber o relatório histórico de 1910–1959
24. Salvar e carregar preservando exatamente a história
25. Repetir a campanha com a mesma seed obtendo o mesmo mundo

---

## 14. TESTE NARRATIVO FINAL

Ao terminar o Alpha, o jogador deve conseguir contar uma história como:

> *"Fundamos o clube em 1910 com vinte e sete ferroviários em um terreno barato depois da estação. O União nasceu em 1914 com estudantes do centro e a gente nem ligava para eles. Depois começaram a ganhar. Perdemos a final de 1919, teve aquela confusão em 1922 e o nosso melhor atacante foi para lá em 1926. Virou o Clássico da Estação.*
>
> *O nosso campo ficou pequeno porque a cidade cresceu ao redor. Quase vendemos tudo nos anos 30, mas o presidente Álvaro Mendes segurou o terreno. O filho dele jogou no clube depois.*
>
> *Profissionalizamos o time e quase quebramos. Nos anos 40 o clube deixou de ser só ferroviário e virou um dos mais populares da cidade. Construímos o estádio em 1948.*
>
> *Quando Álvaro morreu em 1952, o conselho colocou o nome dele no estádio.*
>
> *Em 1959 finalmente fomos campeões mineiros e disputamos a Taça Brasil."*

**Se o motor produzir histórias assim sem que esse roteiro tenha sido escrito previamente: o Alpha cumpriu seu objetivo.**

---

*Documentos de referência: `docs/CONTEXTO.md` (estado), `docs/PIPELINE.md` (comandos), `agents/HANDSHAKE.md` (turno), `agents/VISUAL-AUDIT.md` (critérios visuais), `agents/NEXT-STEPS.md` (próximo pacote).*
