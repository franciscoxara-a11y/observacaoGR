/**
 * Editor genérico de um campo: escolhe o componente certo consoante o
 * `tipo` declarado em `config/campos.ts`. É este dispatch que garante que
 * nenhum campo é escrito à mão nas páginas — elas limitam-se a iterar os
 * campos da configuração e a delegar aqui.
 */

import type { ChangeEvent } from "react";
import type { Campo } from "../config/campos.ts";
import { GRELHAS, type GrelhaId } from "../config/grelhas.ts";
import type { ListasEditaveis } from "../config/listas.ts";
import { PainelBotoes } from "./PainelBotoes.tsx";
import { GrelhaZonas } from "./GrelhaZonas.tsx";

type Props = {
  campo: Campo;
  valor: string;
  onMudar: (valor: string) => void;
  /** Só necessário para campos de tipo "listaEditavel" (T0.3 e T0.6). */
  listas?: ListasEditaveis;
  /** Códigos a esconder num painel (ex.: o "NA" automático do T0.9). */
  ocultar?: string[];
};

export function CampoEditor({ campo, valor, onMudar, listas, ocultar }: Props) {
  switch (campo.tipo) {
    case "texto":
      return (
        <input
          type="text"
          value={valor}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onMudar(e.target.value)}
          className="w-full max-w-md rounded-xl border-2 border-stone-300 px-4 py-3 text-lg"
          placeholder={campo.nome}
        />
      );

    case "data":
      // Sem valor por omissão (nunca inventamos dados); o botão "Hoje"
      // torna o caso comum num único toque, sem teclado.
      return (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={valor}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onMudar(e.target.value)}
            className="rounded-xl border-2 border-stone-300 px-4 py-3 text-lg"
          />
          <button
            type="button"
            onClick={() => onMudar(new Date().toISOString().slice(0, 10))}
            className="min-h-14 rounded-xl border-2 border-stone-300 bg-white px-4 font-semibold"
          >
            Hoje
          </button>
        </div>
      );

    case "lista":
    case "painel":
      return (
        <PainelBotoes campo={campo} valor={valor} onEscolher={onMudar} ocultar={ocultar} />
      );

    case "listaEditavel": {
      // As entradas da lista gerida tornam-se opções cujo código é o próprio
      // texto (ver comentário em config/listas.ts).
      const entradas = listas?.[campo.listaEditavel!] ?? [];
      return (
        <PainelBotoes
          campo={campo}
          opcoes={entradas.map((texto) => ({ codigo: texto, descricao: texto }))}
          valor={valor}
          onEscolher={onMudar}
        />
      );
    }

    case "grid1":
    case "grid2":
    case "grid3":
    case "gridDestino":
      return (
        <GrelhaZonas
          layout={GRELHAS[campo.tipo as GrelhaId]}
          valor={valor}
          // Toggle como nos botões: repetir o clique desseleciona.
          onEscolher={(codigo) => onMudar(codigo === valor ? "" : codigo)}
        />
      );

    case "calculado":
      // Nunca editável — mostrado apenas a título informativo.
      return <p className="text-lg font-semibold">{valor}</p>;
  }
}
