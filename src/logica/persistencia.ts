/**
 * Persistência em localStorage.
 *
 * A app tem de sobreviver a um refresh a meio de um jogo, por isso TUDO o
 * que é estado de trabalho — a sessão, o lance em curso e as listas
 * editáveis — é gravado a cada alteração (ver App.tsx) e relido no arranque.
 *
 * As chaves têm um sufixo de versão: se o formato do modelo mudar no futuro,
 * basta mudar a versão para não tentar ler dados antigos incompatíveis.
 */

import type { LanceEmCurso, Sessao } from "./modelo.ts";
import { sessaoVazia } from "./modelo.ts";
import type { ListasEditaveis } from "../config/listas.ts";
import { LISTAS_POR_OMISSAO } from "../config/listas.ts";

const CHAVE_SESSAO = "gr-observacao:sessao:v1";
const CHAVE_LANCE_EM_CURSO = "gr-observacao:lance-em-curso:v1";
const CHAVE_LISTAS = "gr-observacao:listas:v1";

/**
 * Leitura defensiva: localStorage pode falhar (modo privado, quota) e o
 * conteúdo pode estar corrompido. Nunca deixamos a app rebentar no arranque
 * por causa disso — no pior caso começa-se com o estado por omissão.
 */
function ler<T>(chave: string, porOmissao: T): T {
  try {
    const texto = localStorage.getItem(chave);
    return texto === null ? porOmissao : (JSON.parse(texto) as T);
  } catch {
    return porOmissao;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaço ou sem permissão: a app continua a funcionar em memória.
    // Não interrompemos a observação por causa da persistência.
  }
}

export function lerSessao(): Sessao {
  return ler<Sessao>(CHAVE_SESSAO, sessaoVazia());
}

export function gravarSessao(sessao: Sessao): void {
  gravar(CHAVE_SESSAO, sessao);
}

export function lerLanceEmCurso(): LanceEmCurso | null {
  return ler<LanceEmCurso | null>(CHAVE_LANCE_EM_CURSO, null);
}

export function gravarLanceEmCurso(emCurso: LanceEmCurso | null): void {
  gravar(CHAVE_LANCE_EM_CURSO, emCurso);
}

export function lerListas(): ListasEditaveis {
  const listas = ler<ListasEditaveis>(CHAVE_LISTAS, LISTAS_POR_OMISSAO);
  // Se uma versão antiga gravou listas parciais, completa com as omissões.
  return {
    competicoes: listas.competicoes ?? LISTAS_POR_OMISSAO.competicoes,
    guardaRedes: listas.guardaRedes ?? LISTAS_POR_OMISSAO.guardaRedes,
  };
}

export function gravarListas(listas: ListasEditaveis): void {
  gravar(CHAVE_LISTAS, listas);
}
