/**
 * Testes da exportação CSV e da própria configuração de campos (a ordem das
 * colunas é um contrato com o Excel original — vale a pena guardá-lo num
 * teste).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { CAMPOS } from "../config/campos.ts";
import { GRELHAS } from "../config/grelhas.ts";
import type { Sessao } from "./modelo.ts";
import {
  cabecalhosCsv,
  escaparCelulaCsv,
  exportarCsv,
  lerJsonImportado,
  exportarJson,
  valoresDoLance,
} from "./exportacao.ts";

/** Gera a sequência de colunas do Excel: A, B, …, Z, AA, AB, … */
function colunaExcel(indice: number): string {
  let n = indice + 1;
  let resultado = "";
  while (n > 0) {
    n -= 1;
    resultado = String.fromCharCode(65 + (n % 26)) + resultado;
    n = Math.floor(n / 26);
  }
  return resultado;
}

test("são exatamente 60 campos, com colunas sequenciais A..BH", () => {
  assert.equal(CAMPOS.length, 60);
  CAMPOS.forEach((campo, i) => {
    assert.equal(
      campo.coluna,
      colunaExcel(i),
      `campo ${campo.id} devia estar na coluna ${colunaExcel(i)}`
    );
  });
});

test("os ids dos campos são únicos", () => {
  const ids = new Set(CAMPOS.map((c) => c.id));
  assert.equal(ids.size, CAMPOS.length);
});

test("cabeçalho tem 62 colunas e termina nas duas derivadas", () => {
  const cabecalhos = cabecalhosCsv();
  assert.equal(cabecalhos.length, 62);
  assert.equal(cabecalhos[0], "T0.1 Escalão");
  assert.equal(cabecalhos[60], "Categoria de Vídeo (auto)");
  assert.equal(cabecalhos[61], "Golo Sofrido (auto)");
});

const sessaoExemplo: Sessao = {
  jogo: {
    "T0.1": "S19",
    "T0.2": "Benfica",
    "T0.3": "Campeonato Nacional Sub19",
    "T0.4": "4",
    "T0.5": "2026-08-26",
    "T0.6": "Sara Silva",
    "T0.7": "SEC",
  },
  lances: [
    {
      numero: 1,
      tema: "T2",
      valores: { "T0.8": "ODEF", "T0.9": "NA", "T2.4": "1E1", "T2.10": "FGOL" },
    },
  ],
  proximoNumero: 2,
};

test("valores do lance repetem os transversais e deixam vazios os outros temas", () => {
  const valores = valoresDoLance(sessaoExemplo.lances[0], sessaoExemplo);
  assert.equal(valores.length, 60);
  assert.equal(valores[0], "S19"); // T0.1 vem do jogo
  assert.equal(valores[9], "1"); // T0.10 = nº do lance
  assert.equal(valores[10], "T2"); // T0.11 = tema
  const indiceT1_1 = CAMPOS.findIndex((c) => c.id === "T1.1");
  assert.equal(valores[indiceT1_1], ""); // campo de outro tema fica vazio
});

test("CSV: BOM, 62 colunas por linha e derivadas calculadas", () => {
  const csv = exportarCsv(sessaoExemplo);
  assert.ok(csv.startsWith("﻿"), "tem de começar pelo BOM UTF-8");
  const linhas = csv.replace("﻿", "").trim().split("\r\n");
  assert.equal(linhas.length, 2);
  // 62 colunas — atenção: só é válido porque nenhuma célula deste exemplo
  // contém ";" (o cabeçalho e os códigos nunca contêm).
  assert.equal(linhas[1].split(";").length, 62);
  assert.ok(linhas[1].includes("Cruzamentos — Jogo Aéreo"));
  assert.ok(linhas[1].endsWith("SIM")); // T2.10 = FGOL → golo sofrido
});

test("CSV protege 1E1 da notação científica do Excel", () => {
  // A célula sai como fórmula de texto ="1E1" (com aspas CSV duplicadas).
  assert.equal(escaparCelulaCsv("1E1"), '"=""1E1"""');
  const csv = exportarCsv(sessaoExemplo);
  assert.ok(csv.includes('"=""1E1"""'), "o CSV devia conter a célula protegida");
  // Os restantes códigos não são tocados.
  assert.equal(escaparCelulaCsv("BLQA"), "BLQA");
  assert.equal(escaparCelulaCsv("LE1"), "LE1"); // letra antes do E — não é notação
});

test("CSV escapa células com separador ou aspas", () => {
  assert.equal(escaparCelulaCsv("a;b"), '"a;b"');
  assert.equal(escaparCelulaCsv('diz "olá"'), '"diz ""olá"""');
});

test("exportar JSON e voltar a importar devolve a mesma sessão", () => {
  const listas = { competicoes: ["Torneio"], guardaRedes: ["Sara Silva"] };
  const ficheiro = lerJsonImportado(exportarJson(sessaoExemplo, listas));
  assert.deepEqual(ficheiro.sessao, sessaoExemplo);
  assert.deepEqual(ficheiro.listas, listas);
});

test("importação rejeita ficheiros que não são sessões", () => {
  assert.throws(() => lerJsonImportado("isto não é json"));
  assert.throws(() => lerJsonImportado('{"formato":"outro"}'));
});

/* ── Sanidade das grelhas — apanha gralhas nas coordenadas ──────────────── */

test("grelhas: códigos esperados e zonas dentro do viewBox", () => {
  assert.equal(GRELHAS.grid1.zonas.length, 15);
  assert.equal(GRELHAS.grid2.zonas.length, 9);
  assert.equal(GRELHAS.grid3.zonas.length, 9); // 8 códigos, FEC duplicado
  assert.equal(new Set(GRELHAS.grid3.zonas.map((z) => z.codigo)).size, 8);
  assert.equal(GRELHAS.gridDestino.zonas.length, 6);

  for (const grelha of Object.values(GRELHAS)) {
    const { x, y, w, h } = grelha.viewBox;
    for (const zona of grelha.zonas) {
      assert.ok(
        zona.x >= x && zona.y >= y && zona.x + zona.w <= x + w && zona.y + zona.h <= y + h,
        `zona ${zona.codigo} de ${grelha.id} sai do viewBox`
      );
    }
  }
});

test("grid2: numeração da direita para a esquerda, de baixo para cima", () => {
  const zona = (codigo: string) => GRELHAS.grid2.zonas.find((z) => z.codigo === codigo)!;
  assert.equal(zona("1").descricao, "Rasteiro — Direita");
  assert.equal(zona("9").descricao, "Alto — Esquerda");
  // 9 (Alto Esquerda) desenha-se no canto superior esquerdo do ecrã…
  assert.equal(zona("9").x, 0);
  assert.equal(zona("9").y, 0);
  // …e 1 (Rasteiro Direita) no canto inferior direito.
  assert.ok(zona("1").x > zona("3").x);
  assert.ok(zona("1").y > zona("7").y);
});
