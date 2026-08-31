/**
 * Ecrã "Jogo" — os campos transversais preenchidos uma vez por sessão
 * (T0.1 a T0.7). São repetidos automaticamente em cada lance exportado;
 * o observador não volta a vê-los durante o registo.
 *
 * Os campos vêm todos de CAMPOS_JOGO (config/campos.ts) — nada escrito à mão.
 */

import { CAMPOS_JOGO } from "../config/campos.ts";
import type { Jogo } from "../logica/modelo.ts";
import type { ListasEditaveis } from "../config/listas.ts";
import { CampoEditor } from "../components/CampoEditor.tsx";

type Props = {
  jogo: Jogo;
  listas: ListasEditaveis;
  onMudar: (campoId: string, valor: string) => void;
  onComecar: () => void;
};

export function PaginaJogo({ jogo, listas, onMudar, onComecar }: Props) {
  const porPreencher = CAMPOS_JOGO.filter((c) => !jogo[c.id]).length;

  return (
    <div className="space-y-6">
      <p className="text-stone-600">
        Dados do jogo — ficam fixos para a sessão e repetem-se em todos os
        lances.
      </p>

      {CAMPOS_JOGO.map((campo) => (
        <section key={campo.id}>
          <h2 className="mb-2 font-bold">
            {campo.nome}
            <span className="ml-2 text-xs font-normal text-stone-400">{campo.id}</span>
          </h2>
          <CampoEditor
            campo={campo}
            valor={jogo[campo.id] ?? ""}
            onMudar={(v) => onMudar(campo.id, v)}
            listas={listas}
          />
        </section>
      ))}

      <div className="flex items-center gap-3 border-t border-stone-300 pt-4">
        <button
          type="button"
          onClick={onComecar}
          className="min-h-16 rounded-xl bg-green-700 px-8 text-lg font-bold text-white active:bg-green-800"
        >
          Começar a registar →
        </button>
        {porPreencher > 0 && (
          <p className="text-sm text-amber-700">
            {porPreencher} {porPreencher === 1 ? "campo" : "campos"} por
            preencher — podes começar na mesma e voltar aqui depois.
          </p>
        )}
      </div>
    </div>
  );
}
