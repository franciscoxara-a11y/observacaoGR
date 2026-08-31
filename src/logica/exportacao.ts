/**
 * Exportação CSV/JSON e importação de JSON.
 *
 * O CSV replica o Excel original: uma linha por lance, 62 colunas na ordem
 * A..BJ (60 campos + "Categoria de Vídeo (auto)" + "Golo Sofrido (auto)").
 * Tudo é derivado do array CAMPOS — acrescentar um campo em campos.ts
 * acrescenta automaticamente a coluna certa aqui.
 */

import { CAMPOS } from "../config/campos.ts";
import type { Lance, Sessao } from "./modelo.ts";
import { categoriaVideo, goloSofrido } from "./derivacoes.ts";
import type { ListasEditaveis } from "../config/listas.ts";

/**
 * Separador ponto-e-vírgula: o Excel em português (locale com vírgula
 * decimal) só abre CSVs de vírgulas corretamente via importação manual;
 * com ";" basta fazer duplo clique no ficheiro. Documentado no README para
 * quem for ler o CSV com outras ferramentas (pandas, R, …).
 */
const SEPARADOR = ";";

/**
 * BOM UTF-8: sem ele, o Excel português assume Windows-1252 e estraga os
 * acentos dos cabeçalhos e das competições.
 */
const BOM = "\uFEFF";

/**
 * Devolve os 60 valores de um lance, pela ordem das colunas do Excel.
 * Campos de outros temas e campos por preencher ficam "" (vazio) — um lance
 * incompleto é válido e exportável; a distinção entre "não se aplica" e
 * "esqueci-me" é feita pelos códigos (ex.: o "NA" do T0.9), nunca inventada
 * aqui.
 */
export function valoresDoLance(lance: Lance, sessao: Sessao): string[] {
  return CAMPOS.map((campo) => {
    // T0.1..T0.7 vivem no jogo e repetem-se automaticamente em cada lance.
    if (campo.tema === "T0") {
      if (campo.id === "T0.10") return String(lance.numero);
      if (campo.id === "T0.11") return lance.tema;
      if (campo.id === "T0.8" || campo.id === "T0.9") {
        return lance.valores[campo.id] ?? "";
      }
      return sessao.jogo[campo.id] ?? "";
    }
    // Campos de tema: só o tema do lance pode ter valores.
    return campo.tema === lance.tema ? (lance.valores[campo.id] ?? "") : "";
  });
}

/**
 * Escapa uma célula para CSV.
 *
 * ⚠️ Caso especial: códigos como "1E1" (zona destino de cruzamento) são
 * interpretados pelo Excel como notação científica (1×10¹ = 10), mesmo entre
 * aspas — o que corrompia os dados ao abrir o ficheiro. A proteção clássica
 * é exportar a célula como fórmula de texto: ="1E1". O Excel mostra "1E1";
 * outras ferramentas veem `="1E1"` e o README explica como limpar.
 */
export function escaparCelulaCsv(valor: string): string {
  if (/^[0-9]+E[0-9]+$/i.test(valor)) {
    return `"=""${valor}"""`;
  }
  if (
    valor.includes(SEPARADOR) ||
    valor.includes('"') ||
    valor.includes("\n") ||
    valor.includes("\r")
  ) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Cabeçalhos das 62 colunas, no formato "T1.6 Ação Técnica GR". */
export function cabecalhosCsv(): string[] {
  return [
    ...CAMPOS.map((c) => `${c.id} ${c.nome}`),
    "Categoria de Vídeo (auto)",
    "Golo Sofrido (auto)",
  ];
}

export function exportarCsv(sessao: Sessao): string {
  const linhas = [
    cabecalhosCsv().map(escaparCelulaCsv).join(SEPARADOR),
    ...sessao.lances.map((lance) =>
      [
        ...valoresDoLance(lance, sessao),
        categoriaVideo(lance),
        goloSofrido(lance) ? "SIM" : "NÃO",
      ]
        .map(escaparCelulaCsv)
        .join(SEPARADOR)
    ),
  ];
  // \r\n: fim-de-linha que o Excel espera em CSV.
  return BOM + linhas.join("\r\n") + "\r\n";
}

/* ── JSON — cópia integral da sessão, para arquivo e para retomar ───────── */

/** Formato do ficheiro JSON exportado (validado na importação). */
export type FicheiroSessao = {
  formato: "gr-observacao";
  versao: 1;
  exportadoEm: string; // ISO — informativo, não usado na importação
  sessao: Sessao;
  /** As listas viajam com a sessão para retomar noutro dispositivo. */
  listas: ListasEditaveis;
};

export function exportarJson(sessao: Sessao, listas: ListasEditaveis): string {
  const ficheiro: FicheiroSessao = {
    formato: "gr-observacao",
    versao: 1,
    exportadoEm: new Date().toISOString(),
    sessao,
    listas,
  };
  return JSON.stringify(ficheiro, null, 2);
}

/**
 * Valida e lê um JSON exportado. Lança Error com mensagem legível se o
 * ficheiro não for reconhecido — a página mostra-a ao utilizador em vez de
 * importar dados corrompidos em silêncio.
 */
export function lerJsonImportado(texto: string): FicheiroSessao {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error("O ficheiro não é um JSON válido.");
  }
  const f = dados as Partial<FicheiroSessao>;
  if (f.formato !== "gr-observacao" || !f.sessao || !Array.isArray(f.sessao.lances)) {
    throw new Error(
      "O ficheiro não parece ser uma sessão exportada por esta aplicação."
    );
  }
  return f as FicheiroSessao;
}

/** Nome de ficheiro sugerido: data + adversário, sem caracteres proibidos. */
export function nomeFicheiro(sessao: Sessao, extensao: string): string {
  const data = sessao.jogo["T0.5"] || new Date().toISOString().slice(0, 10);
  const adversario = (sessao.jogo["T0.2"] || "jogo")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .trim()
    .replace(/ +/g, "-");
  return `observacao-gr_${data}_${adversario}.${extensao}`;
}
