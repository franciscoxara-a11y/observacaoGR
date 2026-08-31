# Observação GR — Sporting CP Futebol Feminino

Webapp de recolha de dados de observação de guarda-redes, para uso em tempo
real (durante o jogo ou a rever vídeo), em tablet ou desktop. Substitui o
ficheiro Excel com macros VBA do Departamento de Guarda-Redes: o observador
preenche uma vez os dados do jogo e depois, a cada lance, escolhe um tema e
regista as variáveis com um clique por campo. Cada lance é uma linha na
tabela exportada.

Sem backend, sem base de dados, sem autenticação: tudo vive no browser
(localStorage) e sai por exportação CSV/JSON.

## Como correr

Requisitos: Node.js **22.12 ou superior** e npm.

```bash
npm install       # primeira vez
npm run dev       # desenvolvimento — abre http://localhost:5173
npm test          # testes da lógica derivada e da exportação
npm run build     # produção — gera a pasta dist/
npm run preview   # servir o build de produção localmente
```

A pasta `dist/` gerada pelo build usa caminhos relativos: pode ser servida
por qualquer servidor estático (não precisa de estar na raiz do domínio).
Para usar no tablet, basta abrir o endereço do servidor no browser do
tablet; a partir daí a app funciona offline exceto o primeiro carregamento,
e os dados ficam guardados **nesse browser, nesse dispositivo**.

> **Cópia de segurança**: o localStorage é apagado se se limparem os dados
> do browser. No fim de cada jogo, exporta o JSON (ecrã Dados) — é o backup
> completo da sessão e permite retomá-la em qualquer dispositivo com
> "Importar JSON".

## Fluxo de utilização

1. **Jogo** — preencher escalão, adversário, competição, dificuldade, data,
   guarda-redes e clima. Ficam fixos para a sessão e repetem-se em todos os
   lances exportados.
2. **Registar Lance** — o ecrã principal: escolher a Origem do Lance (e o
   tipo de bola parada, quando aplicável) e tocar num dos cinco temas. Isso
   cria o lance e abre o painel do tema.
3. **Painel do tema** — um clique por campo; a opção escolhida fica
   realçada e pode ser corrigida clicando noutra (ou desselecionada
   repetindo o clique). "Concluir Lance" fecha e prepara o seguinte
   (se houver campos por preencher, um pop-up pede confirmação e lista o
   que falta); "Apagar Lance" descarta-o.
4. **Dados** — tabela de todos os lances com filtros (tema, categoria de
   vídeo, golo sofrido), correção ("Corrigir" reabre o lance no painel),
   eliminação, exportação CSV/JSON e importação de JSON.
5. **Análise** — contagens por tema e categoria, taxas de sucesso e mapas
   de calor das zonas.
6. **Configuração** — gerir as listas de competições e de guarda-redes.

Campos não preenchidos ficam vazios — um lance incompleto é válido e
exportável; a tabela assinala-o com ⚠ mas nunca o bloqueia. A única
exceção é o T0.9: quando a origem não é bola parada grava automaticamente
`NA`, para distinguir "não se aplica" de "esqueci-me".

## Estrutura do código

```
src/
├── config/          ← A ÚNICA fonte de verdade sobre os dados
│   ├── campos.ts       os 60 campos (id, nome, coluna Excel, tipo, opções)
│   ├── grelhas.ts      layouts das 4 grelhas de zona (SVG)
│   └── listas.ts       valores por omissão das listas editáveis
├── logica/          ← Funções puras + persistência (sem React)
│   ├── modelo.ts       tipos Lance / Sessao
│   ├── derivacoes.ts   Categoria de Vídeo e Golo Sofrido
│   ├── exportacao.ts   CSV (62 colunas), JSON, importação
│   ├── persistencia.ts localStorage
│   └── *.test.ts       testes (correm com `npm test`, sem dependências)
├── components/      ← Componentes reutilizáveis
│   ├── GrelhaZonas.tsx grelha SVG genérica (serve as 4 grelhas + mapas de calor)
│   ├── PainelBotoes.tsx um campo = botões grandes, com grupos opcionais
│   ├── CampoEditor.tsx  dispatch por tipo de campo
│   └── BotaoConfirmar.tsx confirmação em dois toques (sem window.confirm)
└── paginas/         ← Um ficheiro por ecrã
```

Nenhum componente tem campos, opções ou botões escritos à mão: a interface
inteira é gerada a partir de `src/config/campos.ts` e `src/config/grelhas.ts`.

## Como acrescentar um campo novo

1. Abre `src/config/campos.ts` e acrescenta uma entrada ao array `CAMPOS`,
   na posição correta do seu tema (a ordem do array É a ordem das colunas
   do CSV):

   ```ts
   {
     id: "T3.10",
     nome: "Nova Variável",
     coluna: "AN",            // ver nota abaixo
     tema: "T3",
     tipo: "painel",
     opcoes: op("ABC=Primeira Opção", "DEF=Segunda Opção"),
   },
   ```

2. Está feito: o botão aparece no painel do tema, a coluna aparece no CSV,
   a legenda na tabela de Dados — tudo gerado da configuração.

3. **Nota sobre as colunas**: inserir um campo a meio desloca as letras de
   coluna de todos os campos seguintes (tal como inserir uma coluna no
   Excel). Atualiza as letras `coluna` dos campos seguintes e o número de
   campos esperado no teste `exportacao.test.ts` — o teste falha de
   propósito até isso estar coerente, para o CSV nunca sair com cabeçalhos
   desalinhados do Excel original.

## Como acrescentar uma zona a uma grelha

Em `src/config/grelhas.ts`, acrescenta um retângulo ao array `zonas` da
grelha respetiva:

```ts
{ codigo: "XYZ", descricao: "Descrição da zona", x: 0, y: 0, w: 96, h: 40 },
```

As coordenadas são no referencial do `viewBox` da grelha (não pixels do
ecrã). Duas zonas podem partilhar o mesmo `codigo` (como as duas caixas
`FEC` da grid3) — realçam-se em conjunto e gravam o mesmo valor. O teste
de sanidade verifica que nenhuma zona sai do `viewBox`.

## Exportação CSV

- **62 colunas** na ordem A..BJ do Excel original: os 60 campos
  (T0.1→T5.9) seguidos de `Categoria de Vídeo (auto)` e
  `Golo Sofrido (auto)`. Cabeçalhos no formato `T1.6 Ação Técnica GR`.
- **Separador `;`** — é o que o Excel português abre com duplo clique.
  Para ler com pandas/R: `sep=";"`.
- **UTF-8 com BOM** — obrigatório para o Excel não estragar os acentos.
- **Código `1E1`** (zona destino de cruzamento): o Excel interpretá-lo-ia
  como notação científica (1×10¹), por isso a célula é exportada como
  fórmula de texto `="1E1"`. No Excel aparece simplesmente `1E1`. Se leres
  o CSV com outra ferramenta, remove o invólucro:
  `df["T2.4 Zona Destino do Cruzamento"].str.extract(r'"?=?"*([^"=]+)')`
  ou simplesmente `.str.replace('="', '').str.replace('"', '')`.
- Células vazias ficam vazias (campo não preenchido ≠ "não se aplica").

## Lógica derivada

**Categoria de Vídeo** (ordem de prioridade; para na primeira regra):
canto e livre de bola parada têm pastas próprias independentemente do tema;
o penálti fica deliberadamente **sem categoria** (não tem pasta de vídeo);
depois decide o tema (T3 → 1x1, T2 → Cruzamentos, T5 → Profundidade,
T4 → 1ª Fase por origem da posse, T1 → Remate Fora/Baliza consoante o
T1.6). Ver `src/logica/derivacoes.ts` — os 10 casos estão cobertos por
testes.

**Golo Sofrido**: `SIM` se `T1.7 ∈ {TGOL, SGOL}` ou `T2.10 = FGOL` ou
`T3.8 = GOL`.

## Tabela de códigos

| ID | Campo | Col. | Códigos |
|---|---|---|---|
| T0.1 | Escalão | A | `S15`&nbsp;Sub-15 · `S17`&nbsp;Sub-17 · `S19`&nbsp;Sub-19 · `EQB`&nbsp;Equipa B |
| T0.2 | Adversário | B | _(texto livre)_ |
| T0.3 | Competição / Jornada | C | _(lista editável — o valor gravado é o próprio texto)_ |
| T0.4 | Dificuldade do Jogo | D | `1`&nbsp;Muito baixa · `2`&nbsp;Baixa · `3`&nbsp;Média · `4`&nbsp;Alta · `5`&nbsp;Muito alta · `6`&nbsp;Máxima |
| T0.5 | Data | E | _(data AAAA-MM-DD)_ |
| T0.6 | Guarda-Redes em Análise | F | _(lista editável — o valor gravado é o próprio texto)_ |
| T0.7 | Clima | G | `SEC`&nbsp;Seco · `CHU`&nbsp;Chuva |
| T0.8 | Origem do Lance | H | `ODEF`&nbsp;Organização Defensiva · `TDEF`&nbsp;Transição Defensiva · `BP`&nbsp;Bola Parada |
| T0.9 | Tipo de Bola Parada | I | `CNT`&nbsp;Canto · `LIV`&nbsp;Livre · `PEN`&nbsp;Penálti · `NA`&nbsp;Não aplicável |
| T0.10 | Nº do Lance | J | _(automático, sequencial)_ |
| T0.11 | Tema | K | `T1`&nbsp;Defesa de Baliza · `T2`&nbsp;Jogo Aéreo / Cruzamento · `T3`&nbsp;1x1 · `T4`&nbsp;Distribuição / Fase de Continuidade / Passe Atrasado · `T5`&nbsp;Controlo do Espaço / Profundidade |
| T1.1 | Tipo de Remate | L | `DIR`&nbsp;Direto (sem desvio) · `DFL`&nbsp;Desviado · `RSS`&nbsp;Após Ressalto / 2ª Bola |
| T1.2 | Zona de Origem do Remate | M | `13`&nbsp;Metade Defensiva (+40m) — Lateral Esquerda · `14`&nbsp;Metade Defensiva (+40m) — Corredor Central · `15`&nbsp;Metade Defensiva (+40m) — Lateral Direita · `10`&nbsp;Zona Intermédia (25-40m) — Lateral Esquerda · `11`&nbsp;Zona Intermédia (25-40m) — Corredor Central · `12`&nbsp;Zona Intermédia (25-40m) — Lateral Direita · `7`&nbsp;Exterior Grande Área (até 25m) — Lateral Esquerda · `8`&nbsp;Exterior Grande Área (até 25m) — Corredor Central · `9`&nbsp;Exterior Grande Área (até 25m) — Lateral Direita · `4`&nbsp;Interior Grande Área — Lateral Esquerda · `5`&nbsp;Interior Grande Área — Corredor Central · `6`&nbsp;Interior Grande Área — Lateral Direita · `1`&nbsp;Interior Pequena Área — Lateral Esquerda · `2`&nbsp;Interior Pequena Área — Corredor Central · `3`&nbsp;Interior Pequena Área — Lateral Direita |
| T1.3 | Zona da Baliza (destino) | N | `1`&nbsp;Rasteiro — Direita · `2`&nbsp;Rasteiro — Centro · `3`&nbsp;Rasteiro — Esquerda · `4`&nbsp;Médio — Direita · `5`&nbsp;Médio — Centro · `6`&nbsp;Médio — Esquerda · `7`&nbsp;Alto — Direita · `8`&nbsp;Alto — Centro · `9`&nbsp;Alto — Esquerda |
| T1.4 | Visão do GR no Momento do Remate | O | `VCOM`&nbsp;Visão Completa · `VPAR`&nbsp;Visão Parcialmente Bloqueada · `VSEM`&nbsp;Sem Visão |
| T1.5 | Posicionamento GR no Momento do Remate | P | `ADQ`&nbsp;Adequado · `DPRF`&nbsp;Desadequado — Profundidade · `DANG`&nbsp;Desadequado — Ângulo |
| T1.6 | Ação Técnica GR | Q | `BLQB`&nbsp;Bloqueio Baixo · `BLQM`&nbsp;Bloqueio Médio · `BLQA`&nbsp;Bloqueio Alto · `DSV1`&nbsp;Desvio Uma Mão · `DSV2`&nbsp;Desvio Duas Mãos · `NACT`&nbsp;Sem Ação (Remate Fora / Poste) |
| T1.7 | Desfecho | R | `SEG1`&nbsp;Bola segura (1ª tentativa) · `SEG2`&nbsp;Bola segura, não à 1ª tentativa · `AFAS`&nbsp;Bola afastada do perigo · `2OPP`&nbsp;Não segura — 2ª oportunidade de finalização · `TGOL`&nbsp;Toque na bola, mas golo sofrido · `SGOL`&nbsp;Sem toque e golo sofrido |
| T1.8 | Resultado Ação GR | S | `SUC`&nbsp;Sucesso · `INS`&nbsp;Insucesso |
| T2.1 | Tipo de Cruzamento | T | `ABT`&nbsp;Aberto · `FCH`&nbsp;Fechado · `INT`&nbsp;Intercetado / Desviado |
| T2.2 | Zona de Origem do Cruzamento | U | `LE3`&nbsp;Flanco Esquerdo — Exterior à Grande Área · `LD3`&nbsp;Flanco Direito — Exterior à Grande Área · `FEC`&nbsp;Frontal — Entre Corredores · `LE2`&nbsp;Esquerda — Corredor da Grande Área · `LD2`&nbsp;Direita — Corredor da Grande Área · `FC`&nbsp;Frontal — Corredor Central · `LE1`&nbsp;Esquerda — Frente à Baliza · `LD1`&nbsp;Direita — Frente à Baliza |
| T2.3 | Altura do Cruzamento | V | `ALT`&nbsp;Alto · `MEI`&nbsp;Meia Altura · `RAS`&nbsp;Rasteiro |
| T2.4 | Zona Destino do Cruzamento | W | `E3`&nbsp;Corredor Esquerdo da Grande Área · `D3`&nbsp;Corredor Direito da Grande Área · `C3`&nbsp;Faixa Central Recuada da Grande Área · `1E1`&nbsp;Frente à Baliza — Esquerda · `C1`&nbsp;Frente à Baliza — Centro · `1D1`&nbsp;Frente à Baliza — Direita |
| T2.5 | Relação Numérica na Grande Área | X | `VANT`&nbsp;Vantagem · `IGUA`&nbsp;Igualdade numérica · `DESV`&nbsp;Desvantagem |
| T2.6 | Posicionamento GR no Momento do Cruzamento | Y | `ADQ`&nbsp;Adequado · `DAPO`&nbsp;Desadequado — Orientação dos apoios · `DLOC`&nbsp;Desadequado — Local escolhido |
| T2.7 | Tomada de Decisão GR | Z | `SAID`&nbsp;Saída (Ataque à bola) · `RECB`&nbsp;Recolocação na baliza |
| T2.8 | Zona de Intervenção GR | AA | `IPA`&nbsp;Interior Pequena Área · `IGA`&nbsp;Interior Grande Área · `EGA`&nbsp;Exterior Grande Área |
| T2.9 | Tipo de Deslocamento na Abordagem à Bola | AB | `FRT`&nbsp;Frontal · `LAT`&nbsp;Lateral (Cruzado / Ajuste) · `RET`&nbsp;Retaguarda · `EST`&nbsp;Estático |
| T2.10 | Desfecho Cruzamento | AC | `RBA`&nbsp;Ação GR — Receção/Blocagem Alta · `RBM`&nbsp;Ação GR — Receção/Blocagem Média · `RBB`&nbsp;Ação GR — Receção/Blocagem Baixa · `DP1`&nbsp;Ação GR — Desvio a punhos (1 Mão) · `DP2`&nbsp;Ação GR — Desvio a punhos (2 Mãos) · `DSV`&nbsp;Ação GR — Desvio · `SFAL`&nbsp;Ação GR — Saída em falso · `FGR`&nbsp;Ação GR — Falta sobre GR · `CORT`&nbsp;Corte / Interceção Defesa · `FGOL`&nbsp;Finalização Adv. — Golo · `FDEF`&nbsp;Finalização Adv. — Defesa GR · `FINT`&nbsp;Finalização Adv. — Intercetada · `FFOR`&nbsp;Finalização Adv. — Fora · `OUT`&nbsp;Outro |
| T2.11 | Resultado Ação GR | AD | `SUC`&nbsp;Sucesso · `INS`&nbsp;Insucesso · `NACT`&nbsp;Sem Ação |
| T3.1 | Origem da Situação | AE | `PROF`&nbsp;Bola em Profundidade · `ERRO`&nbsp;Erro / Perda Defensiva · `CATR`&nbsp;Contra-Ataque / Transição · `BP`&nbsp;Bola Parada |
| T3.2 | Zona de Origem | AF | `13`&nbsp;Metade Defensiva (+40m) — Lateral Esquerda · `14`&nbsp;Metade Defensiva (+40m) — Corredor Central · `15`&nbsp;Metade Defensiva (+40m) — Lateral Direita · `10`&nbsp;Zona Intermédia (25-40m) — Lateral Esquerda · `11`&nbsp;Zona Intermédia (25-40m) — Corredor Central · `12`&nbsp;Zona Intermédia (25-40m) — Lateral Direita · `7`&nbsp;Exterior Grande Área (até 25m) — Lateral Esquerda · `8`&nbsp;Exterior Grande Área (até 25m) — Corredor Central · `9`&nbsp;Exterior Grande Área (até 25m) — Lateral Direita · `4`&nbsp;Interior Grande Área — Lateral Esquerda · `5`&nbsp;Interior Grande Área — Corredor Central · `6`&nbsp;Interior Grande Área — Lateral Direita · `1`&nbsp;Interior Pequena Área — Lateral Esquerda · `2`&nbsp;Interior Pequena Área — Corredor Central · `3`&nbsp;Interior Pequena Área — Lateral Direita |
| T3.3 | Ângulo de Finalização Disponível | AG | `ABT`&nbsp;Aberto · `FCH`&nbsp;Fechado |
| T3.4 | Tomada de Decisão GR | AH | `ENC`&nbsp;Encurtar Espaço · `MAN`&nbsp;Manter Posição · `REC`&nbsp;Recuar |
| T3.5 | Timing da Ação | AI | `ANT`&nbsp;Antecipado · `AJU`&nbsp;Ajustado · `TAR`&nbsp;Tardio |
| T3.6 | Ação Técnica GR | AJ | `PAR`&nbsp;Parede · `TEN`&nbsp;Tensão (Espargata) · `EXT`&nbsp;Extensão (Ataque ao espaço) · `REA`&nbsp;Reação · `CSC`&nbsp;Contenção sem Contacto |
| T3.7 | Recurso do Atacante | AK | `REM`&nbsp;Remate · `DRB`&nbsp;Drible / Contorno · `PAS`&nbsp;Passe / Assistência |
| T3.8 | Desfecho | AL | `DEF`&nbsp;Defesa · `GOL`&nbsp;Golo · `INT`&nbsp;Interceção · `FLT`&nbsp;Falta Cometida pelo GR · `CTN`&nbsp;Contorno sem Finalização · `FOR`&nbsp;Fora |
| T3.9 | Resultado Ação GR | AM | `SUC`&nbsp;Sucesso · `INS`&nbsp;Insucesso |
| T4.1 | Origem da Posse | AN | `GR`&nbsp;GR · `PATR`&nbsp;Passe Atrasado |
| T4.2 | Pressão no Momento da Ação | AO | `SPRE`&nbsp;Sem Pressão · `CPRE`&nbsp;Com Pressão |
| T4.3 | Pressão Adversário | AP | `IND`&nbsp;Individual · `ZON`&nbsp;Zonal |
| T4.4 | Zona de Ação do GR | AQ | `13`&nbsp;Metade Defensiva (+40m) — Lateral Esquerda · `14`&nbsp;Metade Defensiva (+40m) — Corredor Central · `15`&nbsp;Metade Defensiva (+40m) — Lateral Direita · `10`&nbsp;Zona Intermédia (25-40m) — Lateral Esquerda · `11`&nbsp;Zona Intermédia (25-40m) — Corredor Central · `12`&nbsp;Zona Intermédia (25-40m) — Lateral Direita · `7`&nbsp;Exterior Grande Área (até 25m) — Lateral Esquerda · `8`&nbsp;Exterior Grande Área (até 25m) — Corredor Central · `9`&nbsp;Exterior Grande Área (até 25m) — Lateral Direita · `4`&nbsp;Interior Grande Área — Lateral Esquerda · `5`&nbsp;Interior Grande Área — Corredor Central · `6`&nbsp;Interior Grande Área — Lateral Direita · `1`&nbsp;Interior Pequena Área — Lateral Esquerda · `2`&nbsp;Interior Pequena Área — Corredor Central · `3`&nbsp;Interior Pequena Área — Lateral Direita |
| T4.5 | Nº de Toques até Distribuir | AR | `1T`&nbsp;1 Toque · `2T`&nbsp;2 Toques · `3T`&nbsp;3+ Toques |
| T4.6 | Tipo de Distribuição | AS | `CUR`&nbsp;Curta · `MED`&nbsp;Média · `LGR`&nbsp;Longa (Referência) · `LGE`&nbsp;Longa (Espaço) |
| T4.7 | Mão / Pé Dominante? | AT | `SIM`&nbsp;Sim · `NAO`&nbsp;Não |
| T4.8 | Forma de Distribuição | AU | `PE`&nbsp;Pé · `MAO`&nbsp;Mão · `VOL`&nbsp;Volley |
| T4.9 | Zona de Destino | AV | `13`&nbsp;Metade Defensiva (+40m) — Lateral Esquerda · `14`&nbsp;Metade Defensiva (+40m) — Corredor Central · `15`&nbsp;Metade Defensiva (+40m) — Lateral Direita · `10`&nbsp;Zona Intermédia (25-40m) — Lateral Esquerda · `11`&nbsp;Zona Intermédia (25-40m) — Corredor Central · `12`&nbsp;Zona Intermédia (25-40m) — Lateral Direita · `7`&nbsp;Exterior Grande Área (até 25m) — Lateral Esquerda · `8`&nbsp;Exterior Grande Área (até 25m) — Corredor Central · `9`&nbsp;Exterior Grande Área (até 25m) — Lateral Direita · `4`&nbsp;Interior Grande Área — Lateral Esquerda · `5`&nbsp;Interior Grande Área — Corredor Central · `6`&nbsp;Interior Grande Área — Lateral Direita · `1`&nbsp;Interior Pequena Área — Lateral Esquerda · `2`&nbsp;Interior Pequena Área — Corredor Central · `3`&nbsp;Interior Pequena Área — Lateral Direita |
| T4.10 | Tipo de Linha de Passe | AW | `JLIV`&nbsp;Jogador Livre / Sem Pressão · `JPRE`&nbsp;Jogador sob Pressão · `ESP`&nbsp;Espaço |
| T4.11 | Desfecho | AX | `MPOS`&nbsp;Mantém a Posse · `DESB`&nbsp;Desbloqueia Pressão · `PPOS`&nbsp;Perde a Posse · `ASS`&nbsp;Assistência para Finalização |
| T4.12 | Resultado Ação GR | AY | `SUC`&nbsp;Sucesso · `INS`&nbsp;Insucesso |
| T5.1 | Tipo de Ameaça | AZ | `PRAS`&nbsp;Profundidade — Rasteira · `PAER`&nbsp;Profundidade — Aérea (Lançamento) |
| T5.2 | Origem da Bola | BA | `OOFE`&nbsp;Organização Ofensiva · `TOFE`&nbsp;Transição Ofensiva · `BP`&nbsp;Bola Parada |
| T5.3 | Zona de Intervenção GR | BB | `13`&nbsp;Metade Defensiva (+40m) — Lateral Esquerda · `14`&nbsp;Metade Defensiva (+40m) — Corredor Central · `15`&nbsp;Metade Defensiva (+40m) — Lateral Direita · `10`&nbsp;Zona Intermédia (25-40m) — Lateral Esquerda · `11`&nbsp;Zona Intermédia (25-40m) — Corredor Central · `12`&nbsp;Zona Intermédia (25-40m) — Lateral Direita · `7`&nbsp;Exterior Grande Área (até 25m) — Lateral Esquerda · `8`&nbsp;Exterior Grande Área (até 25m) — Corredor Central · `9`&nbsp;Exterior Grande Área (até 25m) — Lateral Direita · `4`&nbsp;Interior Grande Área — Lateral Esquerda · `5`&nbsp;Interior Grande Área — Corredor Central · `6`&nbsp;Interior Grande Área — Lateral Direita · `1`&nbsp;Interior Pequena Área — Lateral Esquerda · `2`&nbsp;Interior Pequena Área — Corredor Central · `3`&nbsp;Interior Pequena Área — Lateral Direita |
| T5.4 | Referência de Posicionamento | BC | `ALT`&nbsp;Alto · `BAI`&nbsp;Baixo · `AJU`&nbsp;Ajustado |
| T5.5 | Tomada de Decisão GR | BD | `SCOR`&nbsp;Sair para Cortar · `PBAL`&nbsp;Permanecer na Baliza · `COMU`&nbsp;Comunicar com colega (sem saída) |
| T5.6 | Timing da Saída | BE | `ANT`&nbsp;Antecipado · `AJU`&nbsp;Ajustado · `TAR`&nbsp;Tardio / Não Saiu |
| T5.7 | Ação Técnica GR | BF | `RCP`&nbsp;Receção (Mão/Pé) · `CAB`&nbsp;Cabeceamento · `PAS`&nbsp;Passe · `COR`&nbsp;Corte · `COMU`&nbsp;Comunicação Apenas |
| T5.8 | Desfecho | BG | `RPOS`&nbsp;Recupera a Posse · `ALIV`&nbsp;Alívio (Afasta o Perigo) · `FALH`&nbsp;Falha / Erro · `RCOL`&nbsp;Situação Resolvida por Colega |
| T5.9 | Resultado Ação GR | BH | `SUC`&nbsp;Sucesso · `INS`&nbsp;Insucesso · `NACT`&nbsp;Sem Ação |

## Decisões que convém conhecer

- **O nº do lance nunca é reutilizado** depois de apagar um lance — o
  número identifica o clip de vídeo correspondente e renumerar
  dessincronizava os clips já cortados.
- **A Origem do Lance não herda do lance anterior**: volta a vazio depois
  de cada registo, para obrigar a uma escolha consciente (vazio =
  esquecimento visível; herdar produzia erros silenciosos).
- **Remover uma competição ou guarda-redes da Configuração não altera
  lances já registados** — o valor gravado é o próprio texto.
- **"Novo Jogo" apaga a sessão atual** (com confirmação em dois toques).
  Exporta o JSON primeiro se quiseres guardar o jogo.
