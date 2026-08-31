/**
 * Tipos do modelo de dados da sessão de observação.
 *
 * Um "lance" é uma linha da tabela final: os valores são um mapa
 * id-do-campo → código curto (ex.: { "T1.6": "BLQA" }). Campos não
 * preenchidos simplesmente não existem no mapa — nunca inventamos valores
 * por omissão (a única exceção é o "NA" do T0.9, imposto pela regra do
 * domínio quando a origem não é bola parada).
 */

import type { TemaId } from "../config/campos.ts";

export type Lance = {
  /**
   * Nº sequencial (T0.10), atribuído ao criar o lance e NUNCA reatribuído:
   * se um lance for apagado, o número não é reutilizado. Porquê: o número
   * identifica o clip de vídeo correspondente — renumerar depois de apagar
   * dessincronizava os registos dos clips já cortados.
   */
  numero: number;
  tema: TemaId;
  /** id do campo → código curto gravado. Ausente = por preencher. */
  valores: Record<string, string>;
};

export type Jogo = Record<string, string>; // T0.1..T0.7 → valor

/**
 * O lance em curso anda separado da lista de lances: só entra na lista ao
 * "Concluir". `reaberto` distingue um lance novo de um reaberto da tabela
 * para correção — esse, ao concluir, substitui a versão antiga.
 */
export type LanceEmCurso = { lance: Lance; reaberto: boolean };

export type Sessao = {
  jogo: Jogo;
  lances: Lance[];
  /** Próximo T0.10 a atribuir (ver nota em `Lance.numero`). */
  proximoNumero: number;
};

export function sessaoVazia(): Sessao {
  return { jogo: {}, lances: [], proximoNumero: 1 };
}
