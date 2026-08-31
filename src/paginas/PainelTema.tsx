/**
 * Painel do tema — todos os campos do tema do lance em curso numa página,
 * um clique por campo. A opção escolhida fica realçada; clicar noutra opção
 * do mesmo campo corrige a escolha.
 *
 * Os campos vêm de camposDoTema() — nada escrito à mão. O contexto do lance
 * (T0.8/T0.9) também é editável aqui, para corrigir sem sair do painel.
 *
 * A barra inferior é fixa (sticky): Concluir e Apagar ficam sempre à mão,
 * mesmo com o painel comprido dos temas de 11-12 campos.
 */

import { useState, type MouseEvent } from "react";
import {
  campoPorId,
  camposDoTema,
  nomeDoTema,
} from "../config/campos.ts";
import type { LanceEmCurso } from "../logica/modelo.ts";
import { CampoEditor } from "../components/CampoEditor.tsx";
import { PainelBotoes } from "../components/PainelBotoes.tsx";
import { BotaoConfirmar } from "../components/BotaoConfirmar.tsx";

type Props = {
  emCurso: LanceEmCurso;
  onAtualizar: (campoId: string, valor: string) => void;
  onConcluir: () => void;
  onApagar: () => void;
};

export function PainelTema({ emCurso, onAtualizar, onConcluir, onApagar }: Props) {
  const { lance } = emCurso;
  const campos = camposDoTema(lance.tema);
  const preenchidos = campos.filter((c) => lance.valores[c.id]).length;
  const origem = lance.valores["T0.8"] ?? "";

  // Pop-up de confirmação quando se conclui com campos por preencher.
  const [confirmarIncompleto, setConfirmarIncompleto] = useState(false);

  // O que falta: os campos do tema, mais o contexto transversal do lance
  // (origem em falta, ou bola parada sem tipo escolhido).
  const emFalta = [
    ...(origem === "" ? [campoPorId("T0.8")] : []),
    ...(origem === "BP" && !lance.valores["T0.9"] ? [campoPorId("T0.9")] : []),
    ...campos.filter((c) => !lance.valores[c.id]),
  ];

  /**
   * Concluir: se está tudo preenchido fecha logo; se falta alguma coisa,
   * abre o pop-up — o observador pode concluir na mesma (um lance
   * incompleto é válido), mas nunca sem dar por isso.
   */
  function tentarConcluir() {
    if (emFalta.length === 0) {
      onConcluir();
    } else {
      setConfirmarIncompleto(true);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-lg font-bold">
          Lance {lance.numero} — {lance.tema} · {nomeDoTema(lance.tema)}
          {emCurso.reaberto && (
            <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
              correção
            </span>
          )}
        </h2>
        {/* Indicador de progresso do tema */}
        <p className="text-sm text-stone-500">
          {preenchidos}/{campos.length} campos preenchidos
        </p>
        <div className="mt-1 h-2 w-full max-w-md overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-green-600 transition-all"
            style={{ width: `${(100 * preenchidos) / campos.length}%` }}
          />
        </div>
      </header>

      {/* Contexto do lance (T0.8/T0.9) — editável para correções rápidas */}
      <section className="rounded-xl border border-stone-300 bg-white p-3">
        <h3 className="mb-2 text-sm font-bold text-stone-600">
          Origem do Lance <span className="font-normal text-stone-400">T0.8</span>
        </h3>
        <PainelBotoes
          campo={campoPorId("T0.8")}
          valor={origem}
          onEscolher={(v) => onAtualizar("T0.8", v)}
        />
        {origem === "BP" && (
          <div className="mt-3 border-t border-stone-200 pt-3">
            <h3 className="mb-2 text-sm font-bold text-stone-600">
              Tipo de Bola Parada{" "}
              <span className="font-normal text-stone-400">T0.9</span>
            </h3>
            <PainelBotoes
              campo={campoPorId("T0.9")}
              valor={lance.valores["T0.9"] ?? ""}
              onEscolher={(v) => onAtualizar("T0.9", v)}
              ocultar={["NA"]}
            />
          </div>
        )}
      </section>

      {/* Os campos do tema, pela ordem das colunas */}
      {campos.map((campo) => (
        <section key={campo.id} className="rounded-xl border border-stone-300 bg-white p-3">
          <h3 className="mb-2 font-bold">
            {campo.nome}
            <span className="ml-2 text-xs font-normal text-stone-400">{campo.id}</span>
            {lance.valores[campo.id] && (
              <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">
                ✓
              </span>
            )}
          </h3>
          {campo.nota && <p className="mb-2 text-xs text-stone-500">{campo.nota}</p>}
          {/* Campos de tema nunca usam listas editáveis — a prop fica de fora */}
          <CampoEditor
            campo={campo}
            valor={lance.valores[campo.id] ?? ""}
            onMudar={(v) => onAtualizar(campo.id, v)}
          />
        </section>
      ))}

      {/* Barra fixa de ações */}
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-300 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <BotaoConfirmar
            rotulo="Apagar Lance"
            rotuloConfirmar="Confirmar apagar?"
            onConfirmado={onApagar}
          />
          <button
            type="button"
            onClick={tentarConcluir}
            className="min-h-14 flex-1 rounded-xl bg-green-700 text-lg font-bold text-white active:bg-green-800"
          >
            Concluir Lance ({preenchidos}/{campos.length})
          </button>
        </div>
      </div>

      {/* Pop-up: concluir com campos por preencher. Overlay próprio em vez
          de window.confirm — maior, legível em tablet e lista o que falta. */}
      {confirmarIncompleto && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmarIncompleto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg"
            // O clique dentro da caixa não pode fechar o pop-up.
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">
              {emFalta.length} {emFalta.length === 1 ? "campo" : "campos"} por
              preencher
            </h3>
            <ul className="my-3 max-h-48 space-y-1 overflow-y-auto text-sm text-stone-600">
              {emFalta.map((campo) => (
                <li key={campo.id}>
                  <span className="font-semibold">{campo.id}</span> {campo.nome}
                </li>
              ))}
            </ul>
            <p className="mb-4 text-sm text-stone-500">
              Podes concluir na mesma — o lance fica assinalado com ⚠ na
              tabela de dados.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setConfirmarIncompleto(false)}
                className="min-h-14 flex-1 rounded-xl bg-green-700 font-bold text-white active:bg-green-800"
              >
                Voltar a preencher
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmarIncompleto(false);
                  onConcluir();
                }}
                className="min-h-14 flex-1 rounded-xl border-2 border-stone-300 bg-white font-semibold text-stone-700 active:bg-stone-100"
              >
                Concluir mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
