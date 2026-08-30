# PLANO MESTRE DE IMPLEMENTAÇÃO
# CIDADE DE MINAS — ALPHA 0.1
## Simulador histórico-procedural de clube, cidade e futebol
### Período jogável: 1910–1959

---

# 0. VISÃO CANÔNICA DO PROJETO

Este documento é a especificação principal do Alpha.

Antes de escrever ou alterar código, leia este documento por completo.

O projeto NÃO é:

- um clone de SimCity;
- um Football Manager simplificado;
- um tycoon de estádio;
- um jogo de futebol com menus;
- um dashboard;
- uma reconstrução histórica de Belo Horizonte.

O projeto é:

> **um simulador histórico-procedural no qual o jogador funda um clube de futebol em 1910, escolhe onde ele nascerá em uma cidade fictícia de Minas Gerais e acompanha cinquenta anos de crescimento urbano, associativismo, política, patrimônio, futebol, pessoas, rivalidades e memória até a chegada da Taça Brasil de 1959.**

A principal recompensa do jogador não é simplesmente ganhar partidas.

É chegar a 1959 e possuir uma história que não existia antes daquela campanha.

---

# 0.1 PRINCÍPIO FUNDAMENTAL

Todo sistema importante deve responder a pelo menos uma destas perguntas:

1. Isso cria uma decisão?
2. Isso produz consequência?
3. Isso deixa memória?

Se a resposta for "não" para as três, a mecânica provavelmente não é prioritária para o Alpha.

---

# 0.2 ESCOPO CONGELADO DO ALPHA

## Incluído

- Cidade de Minas procedural;
- cidade crescendo autonomamente;
- terrenos e valorização imobiliária;
- fundação do clube;
- diferentes histórias de origem;
- escolha livre do terreno;
- patrimônio;
- associados;
- mensalidades;
- joias/taxas de ingresso;
- política interna;
- eleições;
- facções;
- dirigentes;
- famílias;
- futebol;
- jogadores;
- categorias de formação simplificadas;
- outros clubes locais;
- clubes de outras cidades mineiras abstratos;
- federação/liga mineira procedural;
- competições;
- profissionalização;
- rivalidades;
- clássicos;
- imprensa;
- torcida;
- identidade social;
- instalações;
- finanças;
- acontecimentos;
- memória;
- arquivo histórico;
- Taça Brasil de 1959 como epílogo.

## NÃO incluído no Alpha

Não implementar agora:

- basquete;
- voleibol;
- futsal;
- natação;
- tênis;
- outros estados profundamente simulados;
- cidades reais;
- seleções;
- competições internacionais;
- transferência internacional sofisticada;
- multiplayer;
- IA generativa online;
- reconstrução de Belo Horizonte;
- editor completo de cidade.

A arquitetura deve permitir esses sistemas futuramente.

Mas eles não devem atrasar o Alpha.

---

# 0.3 PAPEL DO JOGADOR

Para o Alpha, o jogador NÃO representa uma pessoa específica.

O jogador representa:

# A CONTINUIDADE INSTITUCIONAL DO CLUBE

Isso resolve a campanha de cinquenta anos.

Presidentes podem:

- morrer;
- renunciar;
- perder eleições;
- voltar ao poder.

O jogador continua.

Entretanto, o presidente e a coalizão eleita alteram:

- prioridades;
- orçamento disponível;
- aprovação dos projetos;
- tolerância à dívida;
- esportividade da administração;
- interesse imobiliário;
- preço das mensalidades;
- relação com associados.

Portanto:

o jogador possui agência estratégica,

mas NÃO possui poder político ilimitado.

---

# MACROETAPA 1 — FORK, AUDITORIA E FUNDAÇÃO TÉCNICA

## Base técnica principal

Utilizar:

`zeikar/cimulity`

Licença:

MIT.

Antes de modificar qualquer coisa:

criar uma auditoria completa.

Arquivo obrigatório:

`docs/00-cimulity-audit.md`

---

## Auditar especialmente

```text
app/
game/core/
game/engine/
game/input/
game/render/
game/tools/
game/types/
docs/
```

Mapear:

- GameLoop;
- World;
- GameMap;
- Tile;
- Building;
- BuildingMap;
- LandValueMap;
- roadGraph;
- laborMarket;
- TrafficMap;
- PixiJS;
- Camera;
- IsoTransform;
- save;
- serialization;
- RNG existente;
- testes;
- React shell.

---

## Classificar cada subsistema

### PRESERVAR

Exemplo provável:

- projeção isométrica;
- câmera;
- picking;
- renderer;
- estrutura de tiles;
- save versionado;
- timestep fixo.

### ADAPTAR

Exemplo:

- LandValueMap;
- economia;
- população;
- edifícios;
- demanda;
- tráfego.

### REMOVER DA AGÊNCIA DO JOGADOR

Principalmente:

- zoneamento residencial;
- zoneamento comercial;
- zoneamento industrial;
- construção livre de estradas;
- serviços municipais.

Esses sistemas podem continuar existindo.

Mas deixam de ser ferramentas do jogador.

---

# PRINCÍPIO ARQUITETURAL

Preservar a separação:

```text
React Shell
      ↓
Input
      ↓
Engine
      ↓
Core
      ↓
Render
```

Não colocar regras de simulação em componentes React.

Não colocar regras históricas em CSS/UI.

Não deixar render modificar o core.

---

# Criar novos domínios

```text
game/
  core/
    city/
    economy/
    population/
    club/
    membership/
    politics/
    football/
    federation/
    competition/
    rivalry/
    media/
    history/
    legacy/

  data/
    history/
    economy/
    demographics/
    football/
    names/
    city/
    club/
```

---

# MACROETAPA 2 — DETERMINISMO E WORLD SEED

Antes de adicionar sistemas complexos, consolidar determinismo.

Toda campanha recebe:

```ts
worldSeed: string
```

Exemplo:

```text
CM-1910-839174
```

Criar streams independentes:

```ts
rng.city
rng.population
rng.club
rng.football
rng.politics
rng.federation
rng.events
rng.media
```

É proibido utilizar diretamente:

```ts
Math.random()
```

no domínio da simulação.

---

## Motivo

Uma alteração visual não pode fazer com que:

- outro atleta nasça;
- outro presidente seja eleito;
- outro clube seja fundado;
- uma partida antiga tenha outro resultado.

---

## Teste obrigatório

```text
seed A
+
mesmas decisões
+
mesma versão
=
mesma história
```

---

# MACROETAPA 3 — RELÓGIO HISTÓRICO 1910–1959

Criar:

```ts
HistoricalClock
```

Data inicial:

```text
01/01/1910
```

Fim:

```text
31/12/1959
```

ou após conclusão da Taça Brasil de 1959.

---

## Cadências

Não processar tudo diariamente.

### DIÁRIO

- partidas;
- acontecimentos;
- lesões;
- notícias importantes.

### SEMANAL

- treinamentos abstratos;
- condição esportiva;
- decisões de escalação da IA;
- movimentação de jogadores;
- interesse público.

### MENSAL

- mensalidades;
- folha;
- manutenção;
- contas;
- crescimento urbano;
- associados;
- valor imobiliário;
- torcida;
- receitas.

### ANUAL

- nascimento;
- mortalidade;
- desenvolvimento das famílias;
- eleições quando aplicável;
- novas instituições;
- novos clubes;
- crescimento estrutural da cidade;
- atualização demográfica;
- relatório histórico.

---

## Velocidades

```text
PAUSA
1x
2x
4x
8x
```

Para cinquenta anos serem jogáveis, o jogo deve avançar rapidamente quando nada exige decisão.

---

# Sistema de interrupções

Não obrigar o jogador a assistir o calendário passar.

Quando surge algo relevante:

```text
ELEIÇÃO
PROPOSTA
FINAL
CRISE
OBRA
TRANSFERÊNCIA IMPORTANTE
INCIDENTE
FUNDAÇÃO DE RIVAL
```

pode ocorrer auto-pause configurável.

---

# MACROETAPA 4 — GERAÇÃO PROCEDURAL DE CIDADE DE MINAS

Cidade de Minas é fictícia.

Ela NÃO é Belo Horizonte.

O mapa não deve copiar:

- ruas;
- bairros;
- rios;
- relevo;
- população;
- equipamentos;

de BH.

---

# Geração inicial

Criar:

```ts
CityGenerator
```

Entrada:

```text
worldSeed
1910
```

Saída:

```text
terrain
water
roads
railway
center
districts
population
employment
parcels
landValue
institutions
```

---

# Cidade inicial

Em 1910:

pequena e relativamente compacta.

Não gerar skyline moderno.

Possíveis estruturas:

- centro;
- estação ferroviária;
- praça;
- comércio;
- oficinas;
- pequena indústria;
- bairros residenciais;
- bairro operário;
- áreas de elite;
- áreas suburbanas;
- terrenos rurais.

---

# Centro inicial

Criar explicitamente:

```ts
HistoricalCenter
```

O centro possui inicialmente:

- maior acessibilidade;
- maior comércio;
- maior infraestrutura;
- maior valor imobiliário.

Mas isso poderá mudar ao longo das décadas.

---

# MACROETAPA 5 — CIDADE AUTÔNOMA

Essa é a maior modificação em relação ao Cimulity.

O jogador NÃO administra a prefeitura.

Criar:

```ts
CityGrowthDirector
```

Ele decide autonomamente:

- novas ruas;
- extensão de vias;
- ocupação de lotes;
- bairros;
- comércio;
- indústria;
- serviços;
- novas centralidades.

---

# GrowthPressure

Cada área recebe pressão por desenvolvimento:

```ts
growthPressure =
  accessibility
+ availableJobs
+ nearbyPopulation
+ infrastructure
+ commercialActivity
+ landDemand
- landCost
- terrainDifficulty
- congestion
```

Os pesos variam por época.

---

# Ferrovia

1910–1930:

a proximidade ferroviária deve ter forte importância para:

- indústria;
- trabalhadores;
- circulação;
- valorização.

Posteriormente novas vias reduzem parcialmente essa dependência.

---

# Cidade deve envelhecer

Não apenas crescer.

Edifícios podem:

- envelhecer;
- ser demolidos;
- ser substituídos;
- receber maior densidade.

Ruas podem tornar-se avenidas.

Áreas periféricas podem tornar-se centrais.

---

# MACROETAPA 6 — PARCELAS E MERCADO IMOBILIÁRIO

O jogador precisa poder escolher qualquer terreno plausível.

Criar:

```ts
Parcel
```

```ts
interface Parcel {
  id: string;

  tiles: Coordinate[];

  area: number;
  terrainDifficulty: number;

  districtId: string;

  ownerId?: string;

  landValue: number;

  centrality: number;
  accessibility: number;

  railAccess: number;
  roadAccess: number;

  neighborhoodPopulation: number;
  neighborhoodIncomeIndex: number;

  prestige: number;
  developmentPressure: number;

  purchaseHistory: Transaction[];
  historicalEvents: string[];
}
```

---

# Overlays obrigatórios

Ao escolher terreno:

- preço;
- população;
- renda;
- transporte;
- ferrovia;
- comércio;
- indústria;
- topografia;
- clubes;
- valorização.

---

# Biografia imobiliária

Um terreno nunca perde sua história.

Guardar:

```text
comprado em
preço
vendedor
expansões
obras
valor histórico
eventos
```

Isso é essencial.

---

# MACROETAPA 7 — ECONOMIA HISTÓRICA

Não colocar preços arbitrários.

Criar:

```ts
HistoricalEconomy
```

---

# UNIDADE INTERNA

Usar unidade estável:

```text
PPU = Purchasing Power Unit
```

Toda economia funciona em PPU.

---

# UI monetária

1910–31/10/1942:

```text
Réis
```

Exemplo:

```text
1:250$000
```

A partir de novembro de 1942:

```text
Cruzeiro
```

Conversão histórica:

```text
1$000 = Cr$ 1
```

---

# Calibração econômica

Criar:

```text
game/data/history/economic-index.json
```

A série deve usar pesquisa documentada.

Para 1910–1939:

utilizar índices históricos de custo de vida, salários e poder de compra.

Para 1940+:

incorporar:

- salário mínimo;
- custo de vida;
- padrão monetário.

---

# Toda constante histórica precisa de fonte

Criar:

```ts
interface HistoricalReference {
  id: string;
  source: string;
  year?: number;
  notes: string;
}
```

---

# Arquivo

```text
docs/research/economy.md
```

Registrar:

- terrenos;
- salários;
- mensalidades;
- obras;
- jogadores;
- viagens;
- manutenção;
- receitas;
- inflação.

---

# NÃO mostrar automaticamente

```text
equivalente em reais de 2026
```

Isso não é necessário para gameplay.

---

# MACROETAPA 8 — CRIAÇÃO DA HISTÓRIA DE FUNDAÇÃO

Após gerar Cidade de Minas:

abrir:

# FUNDE SEU CLUBE

---

## Origins Alpha

Implementar inicialmente:

### FERROVIÁRIOS

### ESTUDANTES

### IMIGRANTES

### TRABALHADORES

### COMERCIANTES

### ELITE LOCAL

---

# Cada origem gera fundadores

Não apenas bônus.

Exemplo:

```ts
FoundingGroup {
  origin;

  founders[];

  initialCapital;
  socialConnections;
  politicalConnections;

  preferredDistricts[];

  membershipProfile;

  landOpportunities[];

  foundingNarrative;
}
```

---

# Imigrantes

Gerar comunidade coerente com a população do mundo.

Evitar caricaturas.

Origem pode influenciar:

- nomes;
- redes comerciais;
- bairros;
- relações.

Mas nunca determinar personalidade.

---

# Texto procedural

Exemplo:

> Em novembro de 1909, funcionários das oficinas da Estrada de Ferro Mineira começaram a discutir a criação de uma associação para disputar partidas aos domingos. No dia 12 de janeiro de 1910, vinte e três trabalhadores reuniram-se no salão de José Faria e aprovaram a criação do clube.

Todos os personagens citados precisam existir.

---

# MACROETAPA 9 — ESCOLHA DO TERRENO

Depois da origem:

abrir mapa inteiro.

O jogador escolhe.

---

# Não oferecer apenas três opções

Permitir inspeção real.

---

# Formas de ocupação

Dependendo da origem:

### compra;

### aluguel;

### arrendamento;

### cessão empresarial;

### doação;

### concessão pública;

### uso compartilhado.

---

# Consequências

Cessão de empresa pode ser barata.

Mas:

- empresa ganha influência;
- terreno pode possuir cláusulas;
- conflitos futuros podem acontecer.

---

# MACROETAPA 10 — MODELO DO CLUBE

Criar:

```ts
Club
```

```ts
interface Club {
  id: string;

  name: string;

  foundingDate: GameDate;
  foundingOrigin: FoundingOrigin;
  foundingStory: string;

  colors: ClubColors;
  crestHistory: CrestVersion[];

  founders: string[];

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

  historicalEvents: string[];
}
```

---

# Clube inicial simples

1910 não começa com:

- CT;
- departamento médico;
- estádio moderno;
- dezenas de empregados.

Pode começar com:

- terreno;
- campo;
- pequena sede;
- vestiário rudimentar;
- poucos associados.

---

# MACROETAPA 11 — ASSOCIADOS

Associados são um sistema central.

Não apenas receita mensal.

Criar:

```ts
ClubMember
```

Só materializar individualmente associados politicamente/socialmente importantes.

O restante pode permanecer agregado em coortes.

---

# Categorias Alpha

### fundador;

### patrimonial;

### contribuinte;

### familiar;

### honorário.

Não precisam existir todas em todo clube.

O estatuto define.

---

# Receita

```text
joia de admissão
+
mensalidade
+
contribuição extraordinária
```

---

# Associados possuem

```text
classe econômica
bairro
idade
profissão
família
tempo de clube
preferência política
interesse no futebol
interesse social
tradição
capacidade contributiva
```

---

# Adesão

Pessoa decide associar-se com base em:

```text
afinidade
proximidade
prestígio
rede social
preço
sucesso
instalações
origem
família
```

---

# Saída

Pode cancelar por:

- preço;
- mudança;
- insatisfação;
- crise;
- divergência política.

---

# MACROETAPA 12 — IDENTIDADE SOCIAL DINÂMICA

Origem não pode virar destino.

Criar:

```ts
SocialIdentity
```

Segmentos:

```text
operários
ferroviários
estudantes
comerciantes
classe média
elite
imigrantes
bairros
famílias
cidade inteira
```

---

# Affinity

```text
0–100
```

Mas não mostrar necessariamente como número cru.

---

# Mudanças

Identidade muda por:

- preço de mensalidade;
- preço do ingresso;
- bairro;
- títulos;
- jogadores;
- dirigentes;
- imprensa;
- política;
- obras;
- inclusão;
- expansão da cidade.

---

# Exemplo

1910:

> Clube dos ferroviários.

1955:

> Grande clube popular de Cidade de Minas, ainda orgulhoso de sua origem ferroviária.

A memória e a composição atual são coisas diferentes.

---

# MACROETAPA 13 — PESSOAS E GENEALOGIAS

Utilizar TownBox como referência conceitual.

Não copiar todo o simulador humano.

Nosso sistema precisa ser mais seletivo.

---

# População em duas camadas

## AGREGADA

A maioria da cidade.

## MATERIALIZADA

Somente pessoas relevantes:

- fundadores;
- dirigentes;
- presidentes;
- associados influentes;
- jogadores;
- treinadores;
- jornalistas importantes;
- empresários;
- familiares relevantes.

---

# Person

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

  footballInterest: number;
  clubAffinities: Record<string, number>;

  reputation: number;

  traits: PersonTraits;

  relationships: Relationship[];

  careerHistory: CareerEntry[];

  clubHistory: ClubRole[];

  eventHistory: string[];
}
```

---

# World bootstrap

Em 1910:

já existem pessoas adultas.

Portanto:

gerar genealogias anteriores a 1910.

Não criar todos em 1910.

---

# MACROETAPA 14 — POLÍTICA E ELEIÇÕES

Criar:

```ts
ClubPolitics
```

Cada clube possui estatuto.

---

# Estatuto

```text
quem vota
mandato
reeleição
conselho
diretoria
assembleia
quórum
competências
```

---

# Facções

Facções devem emergir de interesses.

Exemplos:

### Fundadores

### Futebolistas

### Patrimonialistas

### Fiscalistas

### Populares

### Elitistas

### Modernizadores

### Tradicionalistas

---

Não criar sempre todas.

---

# PoliticalFaction

```ts
interface PoliticalFaction {
  id: string;

  foundingYear: number;

  leaders: string[];

  members: string[];

  priorities: PoliticalPriority[];

  relations: Record<string, number>;

  historicalEvents: string[];
}
```

---

# Eleições

Candidatos precisam possuir biografia.

Exemplo:

```text
ARMANDO FARIA
48 anos
sócio desde 1916
ex-diretor financeiro

Defende:
+ ampliação do campo
+ aumento das mensalidades
- contratações caras
```

---

# Resultado eleitoral

Depende de:

- facções;
- associados votantes;
- reputação;
- economia;
- títulos;
- promessas;
- crises.

---

# Presidência

O presidente altera:

```text
budgetTolerance
debtTolerance
sportInvestment
socialInvestment
propertyStrategy
professionalismPreference
membershipPricingPreference
```

---

# MACROETAPA 15 — OUTROS CLUBES DE CIDADE DE MINAS

Esses recebem simulação profunda.

Não criar todos em 1910.

---

# ClubBirthEngine

Avaliar anualmente:

```text
população
bairros
empresas
escolas
trabalhadores
comunidades
interesse esportivo
clubes existentes
insatisfações
```

---

# Motivos de fundação

```text
bairro
ferrovia
fábrica
estudantes
imigrantes
elite
trabalhadores
dissidência
```

---

# Dissidências

Clubes podem nascer de clubes.

Exemplo:

> 31 associados abandonam o Atlético Central após a assembleia retirar recursos do futebol.

Dois meses depois:

> Fundado o Independente Football Club.

Isso precisa ficar registrado nas histórias de ambos.

---

# IA de clubes

Criar:

```ts
AIClubDirector
```

A IA decide:

- associados;
- orçamento;
- terreno;
- estádio;
- contratação;
- profissionalização;
- política;
- competições.

---

# Personalidade institucional

Cada administração possui preferências.

Evitar todos os clubes seguirem a mesma estratégia ótima.

---

# MACROETAPA 16 — CLUBES DO INTERIOR DE MINAS

Não simular outras cidades graficamente.

Criar:

```ts
RegionalClub
```

---

# Dados

```text
cidade fictícia
região mineira
fundação
origem
finanças
elenco
estádio abstrato
torcida
tradição
administração
histórico
```

---

# Regiões

Utilizar regiões mineiras genéricas:

- Central;
- Zona da Mata;
- Sul;
- Triângulo;
- Oeste;
- Norte;
- Vale.

---

# Objetivo

Permitir campeonato estadual sem criar dezenas de cidades.

---

# MACROETAPA 17 — FEDERAÇÃO E INSTITUIÇÕES

Este sistema é obrigatório no Alpha.

Em 1910:

não começar necessariamente com uma FMF moderna.

---

# FederationFormationEngine

Clubes podem organizar inicialmente:

- amistosos;
- desafios;
- torneios;
- pequenas ligas.

---

# Pressão institucional

Criar:

```ts
institutionalPressure =
  numberOfClubs
+ footballPopularity
+ matchFrequency
+ travelFeasibility
+ clubProfessionalization
```

---

# Janela histórica

Entre aproximadamente:

```text
1913–1917
```

deve existir pressão forte para criação de entidade estadual.

Não obrigar exatamente 1915.

---

# Federation

```ts
interface Federation {
  id: string;

  name: string;

  foundingDate: GameDate;

  foundingClubs: string[];

  affiliatedClubs: string[];

  presidents: PresidencyTerm[];

  statutes: FederationStatutes;

  blocs: FederationBloc[];

  competitions: string[];

  professionalismPolicy: ProfessionalismPolicy;

  historicalEvents: string[];
}
```

---

# Política federativa

Conflitos:

- capital × interior;
- grandes × pequenos;
- profissionais × amadores;
- calendário curto × longo;
- divisão única × divisões;
- custos de viagem.

---

# Cisões

Federações podem:

- rachar;
- concorrer;
- reconciliar;
- fundir.

---

# Títulos simultâneos

Se houver duas ligas:

podem existir dois campeões no mesmo ano.

Registrar isso.

Nunca apagar retrospectivamente.

---

# MACROETAPA 18 — FUTEBOL: JOGADORES

Alpha possui apenas futebol.

Portanto o futebol precisa ter profundidade suficiente para criar memória.

---

# Footballer

```ts
interface Footballer {
  personId: string;

  positions: Position[];

  technical: TechnicalAttributes;

  physical: PhysicalAttributes;

  mental: MentalAttributes;

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

---

# NÃO usar Overall único

A UI pode resumir.

O motor não.

---

# Atributos

## Técnicos

- finalização;
- passe;
- domínio;
- drible;
- desarme;
- jogo aéreo;
- goleiro.

## Físicos

- velocidade;
- resistência;
- força;
- agilidade.

## Mentais

- decisão;
- posicionamento;
- concentração;
- coragem;
- disciplina.

---

# Evolução histórica

Treinamento de 1910 não deve ser igual ao de 1959.

Criar:

```ts
FootballEra
```

afetando:

- treinamento;
- preparação;
- capacidade física;
- tática;
- scouting.

---

# MACROETAPA 19 — NASCIMENTO E FORMAÇÃO DE JOGADORES

Jogadores precisam nascer da população.

---

# AthleteEmergence

Uma criança possui probabilidade latente de talento.

A descoberta depende de:

```text
população
bairro
acesso ao futebol
clubes próximos
escolas
popularidade
rede social
estrutura do clube
```

---

# Não criar jovens magicamente

Exemplo:

```text
1917 — nasce João Mendes
1931 — começa a jogar em torneios escolares
1934 — observado pelo clube
1935 — entra na equipe
```

---

# Base Alpha

Não construir academia moderna.

Categorias de formação devem evoluir historicamente.

Inicialmente:

- peladas;
- juvenis;
- times secundários;
- equipes de bairro.

Posteriormente:

estrutura mais formal.

---

# MACROETAPA 20 — MERCADO E PROFISSIONALIZAÇÃO

1910 começa predominantemente amador.

Jogadores podem receber:

- ajuda;
- emprego;
- benefícios;
- gratificações;
- pagamento informal.

---

# ProfessionalizationPressure

Aumenta por:

```text
receita
competição
talento
clubes rivais
público
federação
```

---

# Década de 1930

Criar forte pressão histórica pela profissionalização.

Não obrigar a campanha a exatamente copiar um único dia.

Mas por volta de 1933:

o ambiente deve mudar significativamente.

---

# ClubPolicy

```text
STRICT_AMATEUR
ASSISTED_AMATEUR
SEMI_PRO
PROFESSIONAL
```

---

# Consequência

Clube amador pode preservar tradição.

Mas perder atletas.

Clube profissional pode melhorar competitividade.

Mas aumentar brutalmente seus custos.

---

# MACROETAPA 21 — MOTOR DE PARTIDAS

Não fazer Football Manager completo.

Mas também não sortear placar.

Criar simulação estatística coerente.

---

# Inputs

```text
qualidade dos jogadores
posição
condição
moral
entrosamento
tática
mando
viagem
gramado
era
```

---

# MatchEngine

Produzir:

- gols;
- finalizações;
- posse estimada;
- faltas;
- cartões quando historicamente aplicável;
- lesões;
- destaques;
- expulsões;
- substituições conforme regras da época.

---

# Regras históricas

Criar:

```text
FootballRulesByEra
```

Não aplicar regras modernas em 1910.

---

# Eventos importantes

Registrar:

```text
gol em final
hat-trick
virada
goleada
estreia
último jogo
recorde
```

Esses alimentam Legacy.

---

# MACROETAPA 22 — COMPETIÇÕES

Estruturas precisam evoluir.

---

# 1910–1914

Principalmente:

- amistosos;
- desafios;
- torneios locais.

---

# Após organização institucional

Criar:

- campeonato da cidade;
- campeonato estadual;
- copas eventuais.

---

# CompetitionGenerator

Formato depende de:

```text
clubes
distâncias
finanças
federação
época
calendário
```

---

# Formatos possíveis

- turno único;
- turno e returno;
- grupos;
- fase final;
- divisões.

---

# NÃO hardcode

```text
Campeonato Mineiro sempre tem 12 clubes
```

Ele precisa nascer da história da campanha.

---

# MACROETAPA 23 — RIVALIDADES

Sistema essencial.

Criar relacionamento para cada par relevante.

```ts
interface RivalryRelationship {
  clubs: [string, string];

  geographic: number;
  sporting: number;
  social: number;
  political: number;
  supporter: number;
  historical: number;

  intensity: number;

  firstMatch?: string;

  majorMatches: string[];

  incidents: string[];

  transfers: string[];

  pressNames: string[];

  historicalEvents: string[];
}
```

---

# RivalryScore

Cresce por:

### proximidade;

### mesma torcida;

### decisões;

### equilíbrio competitivo;

### jogos frequentes;

### finais;

### goleadas;

### transferências;

### dirigentes;

### disputas federativas;

### incidentes;

### cisões.

---

# Decaimento

Rivalidade pode esfriar.

Mas memória histórica não desaparece.

---

# MACROETAPA 24 — INCIDENTES E CLÁSSICOS

Quando rivalidade cresce:

```text
confronto
rival
clássico local
grande clássico
```

---

# Incidentes possíveis

- discussão;
- provocação;
- invasão;
- tumulto;
- briga entre jogadores;
- conflito de dirigentes;
- arbitragem controversa.

---

# Não gamificar violência como benefício

Consequências:

- punição;
- suspensão;
- multa;
- perda de mando;
- imprensa negativa;
- alteração política.

---

# Memória

Exemplo:

```text
"A Briga do Campo Novo — 1927"
```

Pode continuar sendo citada em 1959.

---

# MACROETAPA 25 — TORCIDA E POPULARIDADE

Associado e torcedor NÃO são a mesma coisa.

Criar:

```ts
SupporterModel
```

---

# População potencial

Distribuir preferência entre:

- clubes;
- nenhum clube;
- interesse pequeno.

---

# Afinidade

Depende de:

```text
bairro
família
origem
classe
jogadores
títulos
proximidade
preço
imprensa
tradição
```

---

# Transmissão familiar

Filhos têm maior probabilidade de herdar identificação.

Não deve ser determinístico.

---

# Expansão

Um clube pode sair de:

```text
time do bairro
```

para:

```text
clube da cidade
```

---

# MACROETAPA 26 — IMPRENSA

Criar:

```ts
MediaEngine
```

Não usar LLM online.

Templates procedurais.

---

# Evolução

### 1910s

jornal.

### 1920s

imprensa esportiva maior.

### 1930s+

rádio começa a ampliar alcance.

### 1940s–1950s

cultura de torcida e cobertura muito mais intensa.

---

# NewspaperArticle

```ts
{
  date,
  publication,
  headline,
  eventId,
  clubs,
  people,
  sentiment,
  importance
}
```

---

# Exemplos

> Ferroviários vencem Central em partida tumultuada.

> União rompe com Liga Mineira.

> Mendes deixa o Atlético após dez temporadas.

---

# A imprensa influencia

- reputação;
- alcance;
- torcida;
- rivalidade;
- eleições.

---

# MACROETAPA 27 — INSTALAÇÕES

Começar pequeno.

---

# Tipos Alpha

### campo;

### sede;

### arquibancada;

### vestiário;

### escritório;

### estádio;

### centro social simplificado;

### iluminação/refletores quando historicamente plausível.

---

# Facility

```ts
interface Facility {
  id: string;

  type: FacilityType;

  parcelId: string;

  name: string;

  openedAt: GameDate;

  capacity?: number;

  condition: number;

  prestige: number;

  renovations: Renovation[];

  historicalEvents: string[];

  namingHistory: FacilityName[];
}
```

---

# NÃO usar apenas

```text
stadiumLevel = 3
```

Uma instalação possui biografia.

---

# MACROETAPA 28 — PATRIMÔNIO E VALORIZAÇÃO

Todos os ativos imobiliários ficam registrados.

---

# PropertyLedger

```text
terreno
aquisição
preço
valor atual
obras
receitas
custos
valor afetivo
```

---

# Pressão imobiliária

Com a cidade crescendo:

incorporadoras podem fazer propostas.

---

# Decisão

Exemplo:

> Construtora oferece Cr$ 4.200.000 pelo antigo Campo da Estação.

Aceitar pode:

+ resolver dívida;
+ financiar estádio.

Mas:

- associados protestam;
- tradição cai;
- clube abandona bairro histórico.

---

# MACROETAPA 29 — FINANÇAS DO CLUBE

Criar contabilidade clara.

---

# Receitas

Alpha:

```text
joias
mensalidades
contribuições extraordinárias
bilheteria
doações
patronos
aluguel
transferências
premiações
eventos sociais simplificados
```

---

# Despesas

```text
folha
ajudas a atletas
manutenção
obras
viagens
taxas federativas
arbitragem
administração
dívidas
```

---

# Ledger

Toda movimentação:

```ts
FinancialTransaction
```

---

# Nunca alterar saldo diretamente

Usar:

```ts
ledger.transfer()
```

ou equivalente.

---

# Dívida

Permitir:

- empréstimos;
- atrasos;
- crise;
- intervenção;
- venda de patrimônio.

---

# Falência

Não necessariamente Game Over imediato.

Pode gerar:

- fusão;
- refundação;
- rebaixamento;
- liquidação de patrimônio;
- desaparecimento.

Para o clube do jogador:

usar mecanismos de recuperação antes de Game Over.

---

# MACROETAPA 30 — LENDAS E LEGADO

Criar:

```ts
LegacyScore
```

Para:

- jogadores;
- presidentes;
- treinadores;
- fundadores;
- dirigentes.

---

# Fatores

```text
tempo
títulos
recordes
importância
lealdade
momentos decisivos
origem na base
relação com torcida
impacto institucional
```

---

# Categorias internas

```text
MEMORÁVEL
ÍDOLO
LENDA
FIGURA FUNDADORA
```

Não mostrar necessariamente números.

---

# Pós-carreira

Ex-jogador pode:

- treinar;
- dirigir;
- tornar-se conselheiro;
- presidir;
- abandonar futebol.

---

# MACROETAPA 31 — HOMENAGENS

Pessoas importantes podem ser homenageadas.

---

# Triggers

```text
morte
jubileu
obra
aniversário
grande conquista
```

---

# Propostas

> Conselho propõe nomear o estádio em homenagem a Joaquim Mendes.

O jogador não simplesmente digita qualquer nome.

Existe contexto político.

---

# Pode existir oposição

> Grupo Renovação considera inadequado retirar o nome histórico Campo da Estação.

---

# NamingHistory

Guardar todos os nomes antigos.

---

# MACROETAPA 32 — TRADIÇÃO

Criar:

```ts
TraditionSystem
```

Tradição não é apenas reputação.

---

# Objetos de tradição

- escudo;
- cores;
- estádio;
- bairro;
- origem;
- estilo;
- rivalidade;
- nomes;
- rituais.

---

# TraditionWeight

Quanto mais tempo + acontecimentos:

maior resistência à mudança.

---

# Escudo

Alpha deve armazenar versões.

```ts
CrestVersion {
  startYear;
  endYear?;
  designId;
  changeReason;
}
```

---

# Redesign

Pode melhorar:

- modernidade;
- comunicação;
- interesse comercial.

Pode piorar:

- satisfação tradicionalista;
- pertencimento;
- política.

---

# MACROETAPA 33 — HISTORICAL LEDGER

Este é um dos módulos mais importantes.

Todo acontecimento relevante deve produzir:

```ts
HistoricalEvent
```

---

```ts
interface HistoricalEvent {
  id: string;

  date: GameDate;

  category: HistoricalCategory;

  importance: number;

  title: string;

  description: string;

  people: string[];
  clubs: string[];
  facilities: string[];
  competitionId?: string;

  causes: string[];
  consequences: string[];

  tags: string[];
}
```

---

# Exemplos

```text
FUNDAÇÃO
PRIMEIRO JOGO
PRIMEIRO TÍTULO
ELEIÇÃO
CONSTRUÇÃO
MORTE
CISÃO
PROFISSIONALIZAÇÃO
GOLEADA
CLÁSSICO
INCIDENTE
FALÊNCIA
TRANSFERÊNCIA
HOMENAGEM
```

---

# Causação

Sempre que possível:

evento deve referenciar sua causa.

Exemplo:

```text
Cisão de 1923
→ Fundação do Independente
→ Primeiro clássico em 1925
→ Incidente em 1927
```

Assim temos cadeias históricas.

---

# MACROETAPA 34 — ARQUIVO DO CLUBE

Criar tela fundamental:

# ARQUIVO

---

## Timeline

1910 → 1959.

---

## Seções

### História

### Presidentes

### Elencos

### Lendas

### Títulos

### Rivalidades

### Estádios

### Escudos

### Famílias

### Finanças históricas

### Mapas

---

# Mapa histórico

Permitir selecionar:

```text
1910
1920
1930
1940
1950
1959
```

Mostrar snapshots simplificados.

---

# Comparação

```text
1910 ↔ 1959
```

deve ser visualmente impactante.

---

# MACROETAPA 35 — INTERFACE PRINCIPAL

A cidade deve permanecer protagonista visual.

Não transformar o jogo em dashboard.

---

# HUD

Topo:

```text
15 DE MAIO DE 1928

CLUBE ATLÉTICO DA ESTAÇÃO

Caixa
Associados
Prestígio
Torcida estimada
```

---

# Menu

```text
CIDADE
CLUBE
FUTEBOL
ASSOCIADOS
POLÍTICA
FINANÇAS
FEDERAÇÃO
ARQUIVO
```

---

# Feed lateral/inferior

```text
Jornal de Minas publica crítica ao árbitro.

União FC inaugura nova arquibancada.

Novo bairro começa a crescer ao norte.

Conselho votará aumento da mensalidade.
```

---

# Mapa

Clicar em:

### terreno

mostra história e valor.

### estádio

mostra partidas e história.

### clube rival

mostra rivalidade e patrimônio.

### bairro

mostra população e desenvolvimento.

---

# MACROETAPA 36 — 1959 E TAÇA BRASIL

O Alpha culmina em 1959.

---

# Nacionalização abstrata

Somente neste ponto criar:

```ts
NationalAbstractClub
```

Não gerar cidades de outros estados.

---

# Dados

```text
estado
força
tradição
elenco
estádio
estilo
```

---

# Representante mineiro

Deve emergir da campanha.

Não garantir que seja o jogador.

---

# Se o jogador se classificar

A competição torna-se um epílogo extraordinário.

---

# Se não se classificar

O jogo continua mostrando o representante mineiro.

A história do clube ainda é concluída.

Não transformar não-classificação em Game Over.

---

# Após Taça Brasil

Criar relatório:

# CINQUENTA ANOS
## 1910–1959

---

# Mostrar

```text
Cidade inicial
Cidade final

Fundadores

Número inicial de associados
Número final

Presidentes

Patrimônio

Estádio

Títulos

Lendas

Maior rival

Clássico

Maior vitória

Maior derrota

Jogo mais importante

Pessoa mais importante

Família mais influente

Maior crise

Maior obra

Escudos

Valor dos terrenos

Mapa 1910
Mapa 1959
```

---

# MACROETAPA 37 — SAVE VERSIONADO

Usar fundação do Cimulity.

Expandir.

---

# Save precisa conter

```text
seed
rng states
date

city
parcels
buildings

population
people
families

clubs
members
politics
finances

footballers
matches
competitions

federations
rivalries

media
historical ledger
```

---

# Schema version

```ts
saveVersion
```

Criar migrações.

Nunca quebrar save silenciosamente.

---

# MACROETAPA 38 — PERFORMANCE

Não simular cada morador de Cidade de Minas.

---

# Camadas

## L0 — agregado

População da cidade.

## L1 — coortes

Bairro × idade × classe × ocupação.

## L2 — pessoas materializadas

Somente indivíduos historicamente relevantes.

---

# Outros clubes

### Cidade de Minas

simulação profunda.

### resto de Minas

simulação agregada.

### outros estados

somente 1959.

---

# MACROETAPA 39 — TESTES HISTÓRICOS DE LONGA DURAÇÃO

Criar:

```text
scripts/simulate-campaign.ts
```

Executar campanha sem UI.

---

# Cenários

```text
1910 → 1920
1910 → 1933
1910 → 1942
1910 → 1950
1910 → 1959
```

---

# Testar no mínimo 100 seeds

Ao final:

gerar relatório estatístico.

---

# Verificar

## Cidade

- cresceu;
- não explodiu;
- possui bairros;
- valor imobiliário coerente.

## Clubes

- novos clubes nasceram;
- alguns desapareceram;
- nenhum domina todas as seeds.

## Futebol

- campeonatos acontecem;
- jogadores surgem;
- jogadores envelhecem;
- aposentadorias acontecem.

## Economia

- nenhum NaN;
- dívida limitada;
- receita plausível.

## Política

- eleições ocorrem;
- presidentes mudam;
- facções existem.

## Federação

- entidade emerge;
- competições são organizadas.

## Rivalidade

- clássicos podem surgir;
- nem todo par vira rival.

## História

- ledger não fica vazio;
- eventos possuem referências válidas.

---

# MACROETAPA 40 — FERRAMENTAS DE DEBUG

Criar DEV MODE.

---

# Inspecionar

```text
seed
RNG state
população
clubes
rivalry score
social affinity
land value
faction support
federation pressure
professionalization pressure
```

---

# Time travel DEV

Permitir:

```text
+1 ano
+5 anos
+10 anos
```

somente desenvolvimento.

---

# Reprodutibilidade

Permitir copiar:

```text
seed + decision log
```

para reproduzir bugs.

---

# MACROETAPA 41 — PESQUISA HISTÓRICA COMO DADO

Criar:

```text
docs/research/
```

---

# Arquivos

```text
1910-1959-economy.md
minas-football.md
club-associativism.md
professionalization.md
stadiums.md
transport.md
urbanization.md
currency.md
```

---

# Fontes prioritárias

Usar preferencialmente:

- IBGE;
- Banco Central;
- Ministério do Trabalho;
- Federação Mineira de Futebol;
- CBF;
- UFMG;
- SciELO;
- FGV;
- IPEA;
- artigos e teses acadêmicas.

---

# Toda variável historicamente calibrada

precisa possuir:

```text
valor
ano
fonte
interpretação
limitação
```

---

# Não transformar história em script

Exemplo:

Dado histórico:

> profissionalização mineira ocorreu em 1933.

Implementação:

> forte pressão sistêmica ao redor dessa época.

NÃO:

```ts
if (year === 1933) makeProfessional();
```

---

# REGRA DOS HISTORICAL PRESSURES

Criar:

```ts
HistoricalPressure
```

História real define:

```text
janelas
tendências
limites tecnológicos
pressões institucionais
```

Seed + mundo procedural definem:

```text
personagens
clubes
vencedores
datas específicas
rivalidades
decisões
```

---

# MACROETAPA 42 — ORDEM REAL DE IMPLEMENTAÇÃO

Não tentar construir tudo simultaneamente.

## ALPHA A — FUNDAÇÃO TÉCNICA

1. Fork Cimulity.
2. Auditoria.
3. Determinismo.
4. Clock 1910–1959.
5. Save.

Resultado:

mundo roda cinquenta anos deterministicamente.

---

## ALPHA B — CIDADE

6. CityGenerator.
7. CityGrowthDirector.
8. parcels.
9. LandValue histórico.
10. snapshots.

Resultado:

Cidade de Minas 1910 consegue chegar a 1959 autonomamente.

---

## ALPHA C — CLUBE

11. fundação;
12. origem;
13. terreno;
14. patrimônio;
15. associados;
16. finanças.

Resultado:

é possível fundar e manter um clube.

---

## ALPHA D — SOCIEDADE

17. pessoas;
18. famílias;
19. identidade social;
20. política;
21. eleições.

Resultado:

clube possui sociedade e dirigentes.

---

## ALPHA E — FUTEBOL

22. jogador;
23. formação;
24. elenco;
25. match engine;
26. mercado;
27. profissionalização.

Resultado:

futebol funciona por décadas.

---

## ALPHA F — ECOSSISTEMA

28. novos clubes;
29. clubes regionais;
30. federação;
31. campeonatos.

Resultado:

o jogador não joga contra entidades artificiais sem passado.

---

## ALPHA G — HISTÓRIA

32. rivalidades;
33. imprensa;
34. HistoricalLedger;
35. Legacy;
36. homenagens;
37. arquivo.

Resultado:

simulação começa a produzir narrativa.

---

## ALPHA H — 1959

38. Taça Brasil abstrata;
39. relatório final;
40. campanha completa.

---

## ALPHA I — BALANCEAMENTO

41. 100+ seeds;
42. métricas;
43. regressão;
44. performance;
45. UX.

---

# REGRAS CANÔNICAS PARA O CODEX

## 1

Não transformar Cidade de Minas em Belo Horizonte.

---

## 2

Não permitir que o jogador controle a prefeitura.

---

## 3

Não criar clubes sem causa procedural.

---

## 4

Não criar rivalidade por sorteio.

---

## 5

Não criar atleta adulto do nada durante a campanha.

---

## 6

Não tratar associados apenas como dinheiro.

---

## 7

Não tratar presidente apenas como decoração.

---

## 8

Não usar moeda nominal diretamente como unidade econômica da simulação.

---

## 9

Não usar preços históricos sem registrar fonte ou hipótese.

---

## 10

Não criar edifício esportivo apenas como `level`.

---

## 11

Não apagar nomes antigos, escudos antigos ou estádios antigos do histórico.

---

## 12

Não permitir que a origem social fixe para sempre a identidade do clube.

---

## 13

Não usar `Math.random()` dentro da simulação.

---

## 14

Não hardcode vencedor histórico.

---

## 15

Não hardcode rival histórico.

---

## 16

Não hardcode fundador histórico.

---

## 17

Não hardcode Campeonato Mineiro moderno em 1910.

---

## 18

Não aplicar regras modernas de futebol a toda a campanha.

---

## 19

Não simular profundamente todo cidadão.

---

## 20

Não simular profundamente cidades fora de Cidade de Minas.

---

## 21

Não adicionar outros esportes durante o Alpha.

---

## 22

Não sacrificar determinismo por variedade.

---

## 23

Não sacrificar save antigo por refatoração.

---

## 24

Não criar menus desconectados do mapa quando a informação puder existir fisicamente.

---

## 25

Todo acontecimento suficientemente importante precisa entrar no HistoricalLedger.

---

# DEFINIÇÃO DE PRONTO DO ALPHA

O Alpha estará realmente concluído quando for possível:

1. iniciar uma seed nova em 1910;

2. observar Cidade de Minas procedural;

3. escolher uma origem de fundação;

4. receber fundadores reais;

5. escolher nome, cores e escudo;

6. escolher qualquer terreno viável;

7. adquirir ou ocupar esse terreno;

8. iniciar um clube pequeno;

9. captar associados;

10. pagar despesas;

11. construir patrimônio;

12. disputar partidas;

13. acompanhar jogadores envelhecerem;

14. revelar novos jogadores;

15. observar outros clubes nascerem;

16. observar clubes desaparecerem ou se dividirem;

17. participar da formação institucional do futebol mineiro;

18. disputar campeonatos que evoluem historicamente;

19. assistir a eleições;

20. conviver com facções;

21. perceber mudança da identidade social;

22. ver rivalidades surgirem organicamente;

23. compreender por que uma rivalidade existe;

24. acompanhar imprensa e memória;

25. ver Cidade de Minas crescer ao redor do patrimônio;

26. descobrir que terrenos antigos valorizaram;

27. acompanhar lendas envelhecerem;

28. homenagear personagens relevantes;

29. consultar cinquenta anos no arquivo histórico;

30. chegar a 1959;

31. conhecer o representante mineiro na Taça Brasil;

32. disputar a competição caso o clube se classifique;

33. gerar o relatório histórico de 1910–1959;

34. salvar e carregar preservando exatamente a história;

35. repetir uma campanha com a mesma seed e decisões obtendo o mesmo mundo.

---

# TESTE FINAL

Ao terminar uma boa campanha de Alpha, o jogador deve conseguir contar uma história semelhante a:

> “Fundamos o clube em 1910 com vinte e sete ferroviários em um terreno barato depois da estação. O União nasceu em 1914 com estudantes do centro e a gente nem ligava para eles. Depois começaram a ganhar. Perdemos a final de 1919, teve aquela confusão em 1922 e o nosso melhor atacante foi para lá em 1926. Virou o Clássico da Estação.
>
> O nosso campo ficou pequeno porque a cidade cresceu ao redor. Quase vendemos tudo nos anos 30, mas o presidente Álvaro Mendes segurou o terreno. O filho dele jogou no clube depois.
>
> Profissionalizamos o time e quase quebramos. Nos anos 40 o clube deixou de ser só ferroviário e virou um dos mais populares da cidade. Construímos o estádio em 1948.
>
> Quando Álvaro morreu em 1952, o conselho colocou o nome dele no estádio.
>
> Em 1959 finalmente fomos campeões mineiros e disputamos a Taça Brasil.”

Se o motor for capaz de produzir histórias assim sem que esse roteiro tenha sido escrito previamente:

# o Alpha cumpriu seu objetivo.