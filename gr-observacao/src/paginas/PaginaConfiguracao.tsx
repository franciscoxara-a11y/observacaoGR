/**
 * Ecrã "Configuração" — gestão das duas listas editáveis (competições e
 * guarda-redes), guardadas em localStorage.
 *
 * Remover uma entrada NÃO altera lances já registados: o valor gravado no
 * lance é o próprio texto, por isso os dados históricos ficam intactos
 * mesmo que a lista mude de época para época.
 */

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { ListasEditaveis } from "../config/listas.ts";
import { BotaoConfirmar } from "../components/BotaoConfirmar.tsx";

type Props = {
  listas: ListasEditaveis;
  onMudar: (listas: ListasEditaveis) => void;
};

export function PaginaConfiguracao({ listas, onMudar }: Props) {
  return (
    <div className="space-y-8">
      <EditorLista
        titulo="Competições (T0.3)"
        entradas={listas.competicoes}
        onMudar={(competicoes) => onMudar({ ...listas, competicoes })}
      />
      <EditorLista
        titulo="Guarda-Redes (T0.6)"
        entradas={listas.guardaRedes}
        onMudar={(guardaRedes) => onMudar({ ...listas, guardaRedes })}
      />
      <p className="text-sm text-stone-500">
        As alterações ficam guardadas neste dispositivo. Remover uma entrada
        não altera lances já registados.
      </p>
    </div>
  );
}

function EditorLista(props: {
  titulo: string;
  entradas: string[];
  onMudar: (entradas: string[]) => void;
}) {
  const [nova, setNova] = useState("");

  function acrescentar() {
    const texto = nova.trim();
    // Ignora vazios e duplicados (comparação exata — os nomes são curtos e
    // o observador vê a lista toda por baixo do campo).
    if (texto === "" || props.entradas.includes(texto)) return;
    props.onMudar([...props.entradas, texto]);
    setNova("");
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-bold">{props.titulo}</h2>
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={nova}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNova(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && acrescentar()}
          placeholder="Nova entrada…"
          className="w-full max-w-md rounded-xl border-2 border-stone-300 px-4 py-3"
        />
        <button
          type="button"
          onClick={acrescentar}
          className="min-h-14 rounded-xl bg-green-700 px-5 font-bold text-white active:bg-green-800"
        >
          Acrescentar
        </button>
      </div>
      <ul className="max-w-md divide-y divide-stone-200 rounded-xl border border-stone-300 bg-white">
        {props.entradas.map((entrada) => (
          <li key={entrada} className="flex items-center justify-between gap-2 p-2 pl-4">
            <span>{entrada}</span>
            <BotaoConfirmar
              rotulo="Remover"
              rotuloConfirmar="Confirmar?"
              onConfirmado={() =>
                props.onMudar(props.entradas.filter((e) => e !== entrada))
              }
              className="!min-h-10 text-sm"
            />
          </li>
        ))}
        {props.entradas.length === 0 && (
          <li className="p-4 text-sm text-stone-400">Lista vazia.</li>
        )}
      </ul>
    </section>
  );
}
