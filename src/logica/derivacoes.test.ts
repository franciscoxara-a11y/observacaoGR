/**
 * Testes da lógica derivada. Correm com o test runner nativo do Node:
 *
 *   npm test   (= node --experimental-strip-types --test src/logica/*.test.ts)
 *
 * Sem dependências de teste — o Node 22+ executa TypeScript diretamente.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import type { Lance } from "./modelo.ts";
import type { TemaId } from "../config/campos.ts";
import { categoriaVideo, goloSofrido, SEM_CATEGORIA } from "./derivacoes.ts";

/** Atalho para construir um lance de teste. */
function lance(tema: TemaId, valores: Record<string, string> = {}): Lance {
  return { numero: 1, tema, valores };
}

/* ── Categoria de Vídeo — os 10 casos da especificação, por ordem ───────── */

test("regra 1: BP + canto → Esquema Tático — Canto", () => {
  assert.equal(
    categoriaVideo(lance("T1", { "T0.8": "BP", "T0.9": "CNT" })),
    "Esquema Tático — Canto"
  );
});

test("regra 2: BP + livre → Esquema Tático — Livre", () => {
  assert.equal(
    categoriaVideo(lance("T2", { "T0.8": "BP", "T0.9": "LIV" })),
    "Esquema Tático — Livre"
  );
});

test("regras 1-2 têm prioridade sobre as regras de tema", () => {
  // Um cruzamento (T2) originado num canto conta como Esquema Tático.
  assert.equal(
    categoriaVideo(lance("T2", { "T0.8": "BP", "T0.9": "CNT" })),
    "Esquema Tático — Canto"
  );
});

test("regra 3: tema T3 → Defesa Baliza — 1x1", () => {
  assert.equal(
    categoriaVideo(lance("T3", { "T0.8": "TDEF", "T0.9": "NA" })),
    "Defesa Baliza — 1x1"
  );
});

test("regra 4: tema T2 → Cruzamentos — Jogo Aéreo", () => {
  assert.equal(
    categoriaVideo(lance("T2", { "T0.8": "ODEF", "T0.9": "NA" })),
    "Cruzamentos — Jogo Aéreo"
  );
});

test("regra 5: tema T5 → Domínio da Profundidade — Decisão", () => {
  assert.equal(
    categoriaVideo(lance("T5", { "T0.8": "ODEF", "T0.9": "NA" })),
    "Domínio da Profundidade — Decisão"
  );
});

test("regra 6: T4 com posse do GR → Jogo Ofensivo — 1ª Fase de Construção", () => {
  assert.equal(
    categoriaVideo(lance("T4", { "T0.8": "ODEF", "T0.9": "NA", "T4.1": "GR" })),
    "Jogo Ofensivo — 1ª Fase de Construção"
  );
});

test("regra 7: T4 com passe atrasado → Jogo de Continuidade — 1ª Fase de Construção", () => {
  assert.equal(
    categoriaVideo(lance("T4", { "T0.8": "ODEF", "T0.9": "NA", "T4.1": "PATR" })),
    "Jogo de Continuidade — 1ª Fase de Construção"
  );
});

test("regra 8: T1 sem ação do GR (NACT) → Defesa Baliza — Remate Fora", () => {
  assert.equal(
    categoriaVideo(lance("T1", { "T0.8": "ODEF", "T0.9": "NA", "T1.6": "NACT" })),
    "Defesa Baliza — Remate Fora"
  );
});

test("regra 9: T1 restantes → Defesa Baliza — Remate Baliza", () => {
  assert.equal(
    categoriaVideo(lance("T1", { "T0.8": "TDEF", "T0.9": "NA", "T1.6": "BLQA" })),
    "Defesa Baliza — Remate Baliza"
  );
  // T1.6 por preencher também cai na regra 9 (só NACT muda de pasta).
  assert.equal(
    categoriaVideo(lance("T1", { "T0.8": "TDEF", "T0.9": "NA" })),
    "Defesa Baliza — Remate Baliza"
  );
});

test("regra 10: T4 sem origem de posse preenchida → sem categoria", () => {
  assert.equal(
    categoriaVideo(lance("T4", { "T0.8": "ODEF", "T0.9": "NA" })),
    SEM_CATEGORIA
  );
});

test("penálti fica deliberadamente sem categoria, qualquer que seja o tema", () => {
  // Decisão do departamento: penáltis não têm pasta de vídeo própria.
  for (const tema of ["T1", "T2", "T3", "T4", "T5"] as const) {
    assert.equal(
      categoriaVideo(lance(tema, { "T0.8": "BP", "T0.9": "PEN" })),
      SEM_CATEGORIA
    );
  }
});

test("BP com T0.9 esquecido cai nas regras de tema (dado incompleto, não penálti)", () => {
  assert.equal(
    categoriaVideo(lance("T3", { "T0.8": "BP" })),
    "Defesa Baliza — 1x1"
  );
});

/* ── Golo Sofrido — os 3 caminhos possíveis ─────────────────────────────── */

test("golo via T1.7 (TGOL e SGOL)", () => {
  assert.equal(goloSofrido(lance("T1", { "T1.7": "TGOL" })), true);
  assert.equal(goloSofrido(lance("T1", { "T1.7": "SGOL" })), true);
  assert.equal(goloSofrido(lance("T1", { "T1.7": "SEG1" })), false);
});

test("golo via T2.10 = FGOL", () => {
  assert.equal(goloSofrido(lance("T2", { "T2.10": "FGOL" })), true);
  assert.equal(goloSofrido(lance("T2", { "T2.10": "FDEF" })), false);
});

test("golo via T3.8 = GOL", () => {
  assert.equal(goloSofrido(lance("T3", { "T3.8": "GOL" })), true);
  assert.equal(goloSofrido(lance("T3", { "T3.8": "DEF" })), false);
});

test("lance vazio não é golo", () => {
  assert.equal(goloSofrido(lance("T1")), false);
});
