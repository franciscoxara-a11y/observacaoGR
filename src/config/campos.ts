/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURAÇÃO DECLARATIVA DE TODOS OS CAMPOS DA OBSERVAÇÃO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este ficheiro é a única fonte de verdade sobre os campos: a interface, a
 * exportação CSV e as legendas são todas geradas a partir do array `CAMPOS`.
 * Para acrescentar uma variável nova basta acrescentar uma entrada aqui —
 * nenhum componente tem campos escritos à mão.
 *
 * Convenções:
 *  - O valor gravado num lance é SEMPRE o código curto (ex.: "BLQA"), nunca o
 *    texto longo. A descrição serve para o rótulo do botão e para as legendas.
 *  - A ordem do array é a ordem das colunas no CSV (colunas A..BH do Excel
 *    original); há um teste que verifica que as letras de coluna são
 *    sequenciais e que os campos são exatamente 60.
 */

import { descricaoDeZona, type GrelhaId } from "./grelhas.ts";

/** Uma opção de um campo de botões ou de lista. */
export type Opcao = {
  codigo: string;
  descricao: string;
};

/**
 * Tipos de campo:
 *  - "texto"         input livre (só usado onde o teclado é inevitável)
 *  - "data"          input de data
 *  - "lista"         opções fixas, apresentadas como botões
 *  - "listaEditavel" opções geridas no ecrã de Configuração (localStorage)
 *  - "calculado"     preenchido pela app, nunca pelo observador (nº do lance)
 *  - "painel"        botões grandes, um clique por opção (o caso normal)
 *  - "grid1/2/3/gridDestino"  grelhas de zona clicáveis (SVG) — o layout de
 *                             cada uma vive em `grelhas.ts`
 */
export type TipoCampo =
  | "texto"
  | "data"
  | "lista"
  | "listaEditavel"
  | "calculado"
  | "painel"
  | "grid1"
  | "grid2"
  | "grid3"
  | "gridDestino";

export type TemaId = "T1" | "T2" | "T3" | "T4" | "T5";

export type Campo = {
  id: string; // "T1.6" — usado como chave do valor gravado no lance
  nome: string; // "Ação Técnica GR" — aparece no ecrã e no cabeçalho do CSV
  coluna: string; // "Q" — coluna equivalente no Excel original
  tema: "T0" | TemaId; // "T0" = transversal
  tipo: TipoCampo;
  opcoes?: Opcao[];
  /** Para tipo "listaEditavel": qual das listas geridas na Configuração. */
  listaEditavel?: "competicoes" | "guardaRedes";
  /**
   * Agrupamento visual das opções (só usado quando um campo tem muitas
   * opções, como o T2.10). Cada grupo mostra um subtítulo por cima dos seus
   * botões, para reduzir o tempo de procura. Códigos fora de qualquer grupo
   * aparecem no fim, sem subtítulo.
   */
  grupos?: { titulo: string; codigos: string[] }[];
  /** Nota de apoio mostrada junto ao campo (ex.: critério de sucesso). */
  nota?: string;
};

/* ── Atalho para escrever opções de forma compacta ─────────────────────────
   op("ADQ=Adequado", "DPRF=Desadequado — Profundidade", ...) */
function op(...pares: string[]): Opcao[] {
  return pares.map((par) => {
    const i = par.indexOf("=");
    return { codigo: par.slice(0, i), descricao: par.slice(i + 1) };
  });
}

/** Os cinco temas de lance. O código (T1..T5) é o valor gravado em T0.11. */
export const TEMAS: { id: TemaId; nome: string }[] = [
  { id: "T1", nome: "Defesa de Baliza" },
  { id: "T2", nome: "Jogo Aéreo / Cruzamento" },
  { id: "T3", nome: "1x1" },
  { id: "T4", nome: "Distribuição / Fase de Continuidade / Passe Atrasado" },
  { id: "T5", nome: "Controlo do Espaço / Profundidade" },
];

export const CAMPOS: Campo[] = [
  /* ════════════════ T0 — TRANSVERSAIS (uma vez por jogo, exceto T0.8-T0.11
     que variam por lance) ════════════════ */
  {
    id: "T0.1",
    nome: "Escalão",
    coluna: "A",
    tema: "T0",
    tipo: "lista",
    opcoes: op("S15=Sub-15", "S17=Sub-17", "S19=Sub-19", "EQB=Equipa B"),
  },
  { id: "T0.2", nome: "Adversário", coluna: "B", tema: "T0", tipo: "texto" },
  {
    id: "T0.3",
    nome: "Competição / Jornada",
    coluna: "C",
    tema: "T0",
    tipo: "listaEditavel",
    listaEditavel: "competicoes",
  },
  {
    id: "T0.4",
    nome: "Dificuldade do Jogo",
    coluna: "D",
    tema: "T0",
    tipo: "lista",
    // Escala de 1 a 6 (pedido do departamento).
    opcoes: op(
      "1=Muito baixa",
      "2=Baixa",
      "3=Média",
      "4=Alta",
      "5=Muito alta",
      "6=Máxima"
    ),
  },
  { id: "T0.5", nome: "Data", coluna: "E", tema: "T0", tipo: "data" },
  {
    id: "T0.6",
    nome: "Guarda-Redes em Análise",
    coluna: "F",
    tema: "T0",
    tipo: "listaEditavel",
    listaEditavel: "guardaRedes",
  },
  {
    id: "T0.7",
    nome: "Clima",
    coluna: "G",
    tema: "T0",
    tipo: "lista",
    opcoes: op("SEC=Seco", "CHU=Chuva"),
  },
  {
    id: "T0.8",
    nome: "Origem do Lance",
    coluna: "H",
    tema: "T0",
    tipo: "lista",
    opcoes: op(
      "ODEF=Organização Defensiva",
      "TDEF=Transição Defensiva",
      "BP=Bola Parada"
    ),
  },
  {
    id: "T0.9",
    nome: "Tipo de Bola Parada",
    coluna: "I",
    tema: "T0",
    tipo: "lista",
    // "NA" nunca é mostrado como botão: é gravado automaticamente quando
    // T0.8 ≠ BP, para distinguir "não se aplica" de "esqueci-me" (vazio).
    opcoes: op("CNT=Canto", "LIV=Livre", "PEN=Penálti", "NA=Não aplicável"),
  },
  { id: "T0.10", nome: "Nº do Lance", coluna: "J", tema: "T0", tipo: "calculado" },
  {
    id: "T0.11",
    nome: "Tema",
    coluna: "K",
    tema: "T0",
    tipo: "painel",
    opcoes: TEMAS.map((t) => ({ codigo: t.id, descricao: t.nome })),
  },

  /* ════════════════ T1 — DEFESA DE BALIZA ════════════════ */
  {
    id: "T1.1",
    nome: "Tipo de Remate",
    coluna: "L",
    tema: "T1",
    tipo: "painel",
    opcoes: op(
      "DIR=Direto (sem desvio)",
      "DFL=Desviado",
      "RSS=Após Ressalto / 2ª Bola"
    ),
  },
  { id: "T1.2", nome: "Zona de Origem do Remate", coluna: "M", tema: "T1", tipo: "grid1" },
  { id: "T1.3", nome: "Zona da Baliza (destino)", coluna: "N", tema: "T1", tipo: "grid2" },
  {
    id: "T1.4",
    nome: "Visão do GR no Momento do Remate",
    coluna: "O",
    tema: "T1",
    tipo: "painel",
    opcoes: op(
      "VCOM=Visão Completa",
      "VPAR=Visão Parcialmente Bloqueada",
      "VSEM=Sem Visão"
    ),
  },
  {
    id: "T1.5",
    nome: "Posicionamento GR no Momento do Remate",
    coluna: "P",
    tema: "T1",
    tipo: "painel",
    opcoes: op(
      "ADQ=Adequado",
      "DPRF=Desadequado — Profundidade",
      "DANG=Desadequado — Ângulo"
    ),
  },
  {
    id: "T1.6",
    nome: "Ação Técnica GR",
    coluna: "Q",
    tema: "T1",
    tipo: "painel",
    opcoes: op(
      "BLQB=Bloqueio Baixo",
      "BLQM=Bloqueio Médio",
      "BLQA=Bloqueio Alto",
      "DSV1=Desvio Uma Mão",
      "DSV2=Desvio Duas Mãos",
      "NACT=Sem Ação (Remate Fora / Poste)"
    ),
  },
  {
    id: "T1.7",
    nome: "Desfecho",
    coluna: "R",
    tema: "T1",
    tipo: "painel",
    opcoes: op(
      "SEG1=Bola segura (1ª tentativa)",
      "SEG2=Bola segura, não à 1ª tentativa",
      "AFAS=Bola afastada do perigo",
      "2OPP=Não segura — 2ª oportunidade de finalização",
      "TGOL=Toque na bola, mas golo sofrido",
      "SGOL=Sem toque e golo sofrido"
    ),
  },
  {
    id: "T1.8",
    nome: "Resultado Ação GR",
    coluna: "S",
    tema: "T1",
    tipo: "painel",
    opcoes: op("SUC=Sucesso", "INS=Insucesso"),
    nota: "Critério: sucesso = não sofre golo.",
  },

  /* ════════════════ T2 — JOGO AÉREO / CRUZAMENTO ════════════════ */
  {
    id: "T2.1",
    nome: "Tipo de Cruzamento",
    coluna: "T",
    tema: "T2",
    tipo: "painel",
    opcoes: op("ABT=Aberto", "FCH=Fechado", "INT=Intercetado / Desviado"),
  },
  { id: "T2.2", nome: "Zona de Origem do Cruzamento", coluna: "U", tema: "T2", tipo: "grid3" },
  {
    id: "T2.3",
    nome: "Altura do Cruzamento",
    coluna: "V",
    tema: "T2",
    tipo: "painel",
    opcoes: op("ALT=Alto", "MEI=Meia Altura", "RAS=Rasteiro"),
  },
  { id: "T2.4", nome: "Zona Destino do Cruzamento", coluna: "W", tema: "T2", tipo: "gridDestino" },
  {
    id: "T2.5",
    nome: "Relação Numérica na Grande Área",
    coluna: "X",
    tema: "T2",
    tipo: "painel",
    opcoes: op("VANT=Vantagem", "IGUA=Igualdade numérica", "DESV=Desvantagem"),
  },
  {
    id: "T2.6",
    nome: "Posicionamento GR no Momento do Cruzamento",
    coluna: "Y",
    tema: "T2",
    tipo: "painel",
    opcoes: op(
      "ADQ=Adequado",
      "DAPO=Desadequado — Orientação dos apoios",
      "DLOC=Desadequado — Local escolhido"
    ),
  },
  {
    id: "T2.7",
    nome: "Tomada de Decisão GR",
    coluna: "Z",
    tema: "T2",
    tipo: "painel",
    opcoes: op("SAID=Saída (Ataque à bola)", "RECB=Recolocação na baliza"),
  },
  {
    id: "T2.8",
    nome: "Zona de Intervenção GR",
    coluna: "AA",
    tema: "T2",
    tipo: "painel",
    opcoes: op(
      "IPA=Interior Pequena Área",
      "IGA=Interior Grande Área",
      "EGA=Exterior Grande Área"
    ),
  },
  {
    id: "T2.9",
    nome: "Tipo de Deslocamento na Abordagem à Bola",
    coluna: "AB",
    tema: "T2",
    tipo: "painel",
    opcoes: op(
      "FRT=Frontal",
      "LAT=Lateral (Cruzado / Ajuste)",
      "RET=Retaguarda",
      "EST=Estático"
    ),
  },
  {
    id: "T2.10",
    nome: "Desfecho Cruzamento",
    coluna: "AC",
    tema: "T2",
    tipo: "painel",
    opcoes: op(
      "RBA=Ação GR — Receção/Blocagem Alta",
      "RBM=Ação GR — Receção/Blocagem Média",
      "RBB=Ação GR — Receção/Blocagem Baixa",
      "DP1=Ação GR — Desvio a punhos (1 Mão)",
      "DP2=Ação GR — Desvio a punhos (2 Mãos)",
      "DSV=Ação GR — Desvio",
      "SFAL=Ação GR — Saída em falso",
      "FGR=Ação GR — Falta sobre GR",
      "CORT=Corte / Interceção Defesa",
      "FGOL=Finalização Adv. — Golo",
      "FDEF=Finalização Adv. — Defesa GR",
      "FINT=Finalização Adv. — Intercetada",
      "FFOR=Finalização Adv. — Fora",
      "OUT=Outro"
    ),
    // 14 opções: agrupadas por família para o observador encontrar o botão
    // certo em segundos. "OUT" fica fora dos grupos e aparece no fim.
    grupos: [
      { titulo: "Ação GR", codigos: ["RBA", "RBM", "RBB", "DP1", "DP2", "DSV", "SFAL", "FGR"] },
      { titulo: "Corte da Defesa", codigos: ["CORT"] },
      { titulo: "Finalização Adversário", codigos: ["FGOL", "FDEF", "FINT", "FFOR"] },
    ],
  },
  {
    id: "T2.11",
    nome: "Resultado Ação GR",
    coluna: "AD",
    tema: "T2",
    tipo: "painel",
    opcoes: op("SUC=Sucesso", "INS=Insucesso", "NACT=Sem Ação"),
  },

  /* ════════════════ T3 — 1x1 ════════════════ */
  {
    id: "T3.1",
    nome: "Origem da Situação",
    coluna: "AE",
    tema: "T3",
    tipo: "painel",
    opcoes: op(
      "PROF=Bola em Profundidade",
      "ERRO=Erro / Perda Defensiva",
      "CATR=Contra-Ataque / Transição",
      "BP=Bola Parada"
    ),
  },
  { id: "T3.2", nome: "Zona de Origem", coluna: "AF", tema: "T3", tipo: "grid1" },
  {
    id: "T3.3",
    nome: "Ângulo de Finalização Disponível",
    coluna: "AG",
    tema: "T3",
    tipo: "painel",
    opcoes: op("ABT=Aberto", "FCH=Fechado"),
  },
  {
    id: "T3.4",
    nome: "Tomada de Decisão GR",
    coluna: "AH",
    tema: "T3",
    tipo: "painel",
    opcoes: op("ENC=Encurtar Espaço", "MAN=Manter Posição", "REC=Recuar"),
  },
  {
    id: "T3.5",
    nome: "Timing da Ação",
    coluna: "AI",
    tema: "T3",
    tipo: "painel",
    opcoes: op("ANT=Antecipado", "AJU=Ajustado", "TAR=Tardio"),
  },
  {
    id: "T3.6",
    nome: "Ação Técnica GR",
    coluna: "AJ",
    tema: "T3",
    tipo: "painel",
    opcoes: op(
      "PAR=Parede",
      "TEN=Tensão (Espargata)",
      "EXT=Extensão (Ataque ao espaço)",
      "REA=Reação",
      "CSC=Contenção sem Contacto"
    ),
  },
  {
    id: "T3.7",
    nome: "Recurso do Atacante",
    coluna: "AK",
    tema: "T3",
    tipo: "painel",
    opcoes: op("REM=Remate", "DRB=Drible / Contorno", "PAS=Passe / Assistência"),
  },
  {
    id: "T3.8",
    nome: "Desfecho",
    coluna: "AL",
    tema: "T3",
    tipo: "painel",
    opcoes: op(
      "DEF=Defesa",
      "GOL=Golo",
      "INT=Interceção",
      "FLT=Falta Cometida pelo GR",
      "CTN=Contorno sem Finalização",
      "FOR=Fora"
    ),
  },
  {
    id: "T3.9",
    nome: "Resultado Ação GR",
    coluna: "AM",
    tema: "T3",
    tipo: "painel",
    opcoes: op("SUC=Sucesso", "INS=Insucesso"),
  },

  /* ════════════════ T4 — DISTRIBUIÇÃO / CONTINUIDADE / PASSE ATRASADO ═══ */
  {
    id: "T4.1",
    nome: "Origem da Posse",
    coluna: "AN",
    tema: "T4",
    tipo: "painel",
    opcoes: op("GR=GR", "PATR=Passe Atrasado"),
  },
  {
    id: "T4.2",
    nome: "Pressão no Momento da Ação",
    coluna: "AO",
    tema: "T4",
    tipo: "painel",
    opcoes: op("SPRE=Sem Pressão", "CPRE=Com Pressão"),
  },
  {
    id: "T4.3",
    nome: "Pressão Adversário",
    coluna: "AP",
    tema: "T4",
    tipo: "painel",
    opcoes: op("IND=Individual", "ZON=Zonal"),
  },
  { id: "T4.4", nome: "Zona de Ação do GR", coluna: "AQ", tema: "T4", tipo: "grid1" },
  {
    id: "T4.5",
    nome: "Nº de Toques até Distribuir",
    coluna: "AR",
    tema: "T4",
    tipo: "painel",
    opcoes: op("1T=1 Toque", "2T=2 Toques", "3T=3+ Toques"),
  },
  {
    id: "T4.6",
    nome: "Tipo de Distribuição",
    coluna: "AS",
    tema: "T4",
    tipo: "painel",
    opcoes: op(
      "CUR=Curta",
      "MED=Média",
      "LGR=Longa (Referência)",
      "LGE=Longa (Espaço)"
    ),
  },
  {
    id: "T4.7",
    nome: "Mão / Pé Dominante?",
    coluna: "AT",
    tema: "T4",
    tipo: "painel",
    opcoes: op("SIM=Sim", "NAO=Não"),
  },
  {
    id: "T4.8",
    nome: "Forma de Distribuição",
    coluna: "AU",
    tema: "T4",
    tipo: "painel",
    opcoes: op("PE=Pé", "MAO=Mão", "VOL=Volley"),
  },
  { id: "T4.9", nome: "Zona de Destino", coluna: "AV", tema: "T4", tipo: "grid1" },
  {
    id: "T4.10",
    nome: "Tipo de Linha de Passe",
    coluna: "AW",
    tema: "T4",
    tipo: "painel",
    opcoes: op(
      "JLIV=Jogador Livre / Sem Pressão",
      "JPRE=Jogador sob Pressão",
      "ESP=Espaço"
    ),
  },
  {
    id: "T4.11",
    nome: "Desfecho",
    coluna: "AX",
    tema: "T4",
    tipo: "painel",
    opcoes: op(
      "MPOS=Mantém a Posse",
      "DESB=Desbloqueia Pressão",
      "PPOS=Perde a Posse",
      "ASS=Assistência para Finalização"
    ),
  },
  {
    id: "T4.12",
    nome: "Resultado Ação GR",
    coluna: "AY",
    tema: "T4",
    tipo: "painel",
    opcoes: op("SUC=Sucesso", "INS=Insucesso"),
  },

  /* ════════════════ T5 — CONTROLO DO ESPAÇO / PROFUNDIDADE ════════════════ */
  {
    id: "T5.1",
    nome: "Tipo de Ameaça",
    coluna: "AZ",
    tema: "T5",
    tipo: "painel",
    opcoes: op(
      "PRAS=Profundidade — Rasteira",
      "PAER=Profundidade — Aérea (Lançamento)"
    ),
  },
  {
    id: "T5.2",
    nome: "Origem da Bola",
    coluna: "BA",
    tema: "T5",
    tipo: "painel",
    opcoes: op(
      "OOFE=Organização Ofensiva",
      "TOFE=Transição Ofensiva",
      "BP=Bola Parada"
    ),
  },
  { id: "T5.3", nome: "Zona de Intervenção GR", coluna: "BB", tema: "T5", tipo: "grid1" },
  {
    id: "T5.4",
    nome: "Referência de Posicionamento",
    coluna: "BC",
    tema: "T5",
    tipo: "painel",
    opcoes: op("ALT=Alto", "BAI=Baixo", "AJU=Ajustado"),
  },
  {
    id: "T5.5",
    nome: "Tomada de Decisão GR",
    coluna: "BD",
    tema: "T5",
    tipo: "painel",
    opcoes: op(
      "SCOR=Sair para Cortar",
      "PBAL=Permanecer na Baliza",
      "COMU=Comunicar com colega (sem saída)"
    ),
  },
  {
    id: "T5.6",
    nome: "Timing da Saída",
    coluna: "BE",
    tema: "T5",
    tipo: "painel",
    opcoes: op("ANT=Antecipado", "AJU=Ajustado", "TAR=Tardio / Não Saiu"),
  },
  {
    id: "T5.7",
    nome: "Ação Técnica GR",
    coluna: "BF",
    tema: "T5",
    tipo: "painel",
    opcoes: op(
      "RCP=Receção (Mão/Pé)",
      "CAB=Cabeceamento",
      "PAS=Passe",
      "COR=Corte",
      "COMU=Comunicação Apenas"
    ),
  },
  {
    id: "T5.8",
    nome: "Desfecho",
    coluna: "BG",
    tema: "T5",
    tipo: "painel",
    opcoes: op(
      "RPOS=Recupera a Posse",
      "ALIV=Alívio (Afasta o Perigo)",
      "FALH=Falha / Erro",
      "RCOL=Situação Resolvida por Colega"
    ),
  },
  {
    id: "T5.9",
    nome: "Resultado Ação GR",
    coluna: "BH",
    tema: "T5",
    tipo: "painel",
    opcoes: op("SUC=Sucesso", "INS=Insucesso", "NACT=Sem Ação"),
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * FUNÇÕES DE ACESSO — derivam tudo do array acima, nada é duplicado.
 * ═══════════════════════════════════════════════════════════════════════════ */

const porId = new Map(CAMPOS.map((c) => [c.id, c]));

export function campoPorId(id: string): Campo {
  const campo = porId.get(id);
  if (!campo) throw new Error(`Campo desconhecido: ${id}`);
  return campo;
}

/** Campos preenchidos uma vez por jogo (ecrã "Jogo"): T0.1 a T0.7. */
export const CAMPOS_JOGO: Campo[] = CAMPOS.filter(
  (c) => c.tema === "T0" && !["T0.8", "T0.9", "T0.10", "T0.11"].includes(c.id)
);

/** Campos de um tema, pela ordem de registo (= ordem das colunas). */
export function camposDoTema(tema: TemaId): Campo[] {
  return CAMPOS.filter((c) => c.tema === tema);
}

export function nomeDoTema(tema: TemaId): string {
  return TEMAS.find((t) => t.id === tema)?.nome ?? tema;
}

/** Os tipos de campo que são grelhas de zona (desenhadas em SVG). */
const TIPOS_GRELHA: TipoCampo[] = ["grid1", "grid2", "grid3", "gridDestino"];

export function ehGrelha(campo: Campo): boolean {
  return TIPOS_GRELHA.includes(campo.tipo);
}

/**
 * Descrição legível de um código gravado (para legendas e tabela de dados).
 * Para campos de grelha a descrição vem do layout da grelha; para listas
 * editáveis e texto o valor gravado já é o próprio texto.
 */
export function descricaoDe(campoId: string, codigo: string): string {
  if (codigo === "") return "";
  const campo = porId.get(campoId);
  if (!campo) return codigo;
  if (ehGrelha(campo)) {
    return descricaoDeZona(campo.tipo as GrelhaId, codigo);
  }
  const opcao = campo.opcoes?.find((o) => o.codigo === codigo);
  return opcao ? opcao.descricao : codigo;
}
