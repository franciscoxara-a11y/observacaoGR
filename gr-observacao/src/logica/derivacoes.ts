/**
 * Lógica derivada — funções PURAS, calculadas a partir dos códigos gravados
 * num lance. Nunca são introduzidas à mão e não são guardadas no lance:
 * calculam-se sempre que são precisas (tabela, filtros, exportação), o que
 * garante que uma correção manual de um campo atualiza também as derivadas.
 */

import type { Lance } from "./modelo.ts";

export const SEM_CATEGORIA = "(sem categoria)";

/**
 * Categoria de Vídeo — organiza os clips em sessão de vídeo. As regras
 * aplicam-se POR ORDEM DE PRIORIDADE e paramos na primeira que corresponda.
 */
export function categoriaVideo(lance: Lance): string {
  const origem = lance.valores["T0.8"];
  const tipoBP = lance.valores["T0.9"];

  // Regras 1-2: bolas paradas de canto/livre têm pasta própria,
  // independentemente do tema em que o lance foi registado.
  if (origem === "BP" && tipoBP === "CNT") return "Esquema Tático — Canto";
  if (origem === "BP" && tipoBP === "LIV") return "Esquema Tático — Livre";

  // Penálti: deliberadamente SEM categoria (decisão do departamento — os
  // penáltis não têm pasta de vídeo própria). Sem este retorno explícito, o
  // lance cairia nas regras de tema abaixo e ganharia uma pasta errada.
  if (origem === "BP" && tipoBP === "PEN") return SEM_CATEGORIA;

  // Regras 3-9: por tema.
  switch (lance.tema) {
    case "T3":
      return "Defesa Baliza — 1x1";
    case "T2":
      return "Cruzamentos — Jogo Aéreo";
    case "T5":
      return "Domínio da Profundidade — Decisão";
    case "T4": {
      const origemPosse = lance.valores["T4.1"];
      if (origemPosse === "GR") return "Jogo Ofensivo — 1ª Fase de Construção";
      if (origemPosse === "PATR") return "Jogo de Continuidade — 1ª Fase de Construção";
      return SEM_CATEGORIA; // T4.1 por preencher — não dá para escolher pasta
    }
    case "T1":
      // Sem ação do GR = o remate saiu fora ou ao poste → pasta própria.
      return lance.valores["T1.6"] === "NACT"
        ? "Defesa Baliza — Remate Fora"
        : "Defesa Baliza — Remate Baliza";
  }
}

/**
 * Golo Sofrido — booleano derivado. Os golos aparecem em campos diferentes
 * consoante o tema, por isso a regra junta os três sítios possíveis.
 * (T4 e T5 não têm desfecho "golo" no modelo de dados — ver README.)
 */
export function goloSofrido(lance: Lance): boolean {
  const desfechoT1 = lance.valores["T1.7"];
  return (
    desfechoT1 === "TGOL" ||
    desfechoT1 === "SGOL" ||
    lance.valores["T2.10"] === "FGOL" ||
    lance.valores["T3.8"] === "GOL"
  );
}

/** Lista das categorias possíveis, para montar filtros na tabela de dados. */
export const CATEGORIAS_VIDEO = [
  "Esquema Tático — Canto",
  "Esquema Tático — Livre",
  "Defesa Baliza — 1x1",
  "Cruzamentos — Jogo Aéreo",
  "Domínio da Profundidade — Decisão",
  "Jogo Ofensivo — 1ª Fase de Construção",
  "Jogo de Continuidade — 1ª Fase de Construção",
  "Defesa Baliza — Remate Fora",
  "Defesa Baliza — Remate Baliza",
  SEM_CATEGORIA,
];
