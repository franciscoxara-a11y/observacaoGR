/**
 * Ecrã "Registar Lance" — onde se passa o jogo.
 *
 * Dois estados:
 *  - SEM lance em curso: em cima a Origem do Lance (T0.8, e T0.9 quando é
 *    bola parada), porque mudam a cada lance; depois os cinco botões grandes
 *    de tema. Clicar num tema cria o lance (com a origem escolhida) e abre o
 *    painel desse tema.
 *  - COM lance em curso: o painel do tema (PainelTema).
 *
 * Decisão: a origem NÃO fica memorizada de um lance para o seguinte — depois
 * de cada lance volta a vazio, obrigando a uma escolha consciente. Herdar a
 * origem anterior pouparia um toque mas produzia dados errados em silêncio
 * (o pior tipo de erro para a análise); vazio = "esqueci-me" fica visível.
 */

import { useState } from "react";
import { campoPorId, TEMAS, type TemaId } from "../config/campos.ts";
import type { Lance, LanceEmCurso } from "../logica/modelo.ts";
import { PainelBotoes } from "../components/PainelBotoes.tsx";
import { PainelTema } from "./PainelTema.tsx";
import { categoriaVideo } from "../logica/derivacoes.ts";

type Props = {
  emCurso: LanceEmCurso | null;
  proximoNumero: number;
  lances: Lance[];
  onCriarLance: (tema: TemaId, origem: string, tipoBP: string) => void;
  onAtualizarLance: (campoId: string, valor: string) => void;
  onConcluir: () => void;
  onApagarEmCurso: () => void;
};

/* Cor de cada botão de tema (pela ordem de TEMAS). É só apresentação — os
   temas em si vêm da configuração. Paleta nos tons do Sporting CP (verdes,
   dourado e preto), sem vermelho. */
const CORES_TEMA = [
  "bg-green-800 active:bg-green-900",
  "bg-teal-700 active:bg-teal-800",
  "bg-stone-800 active:bg-stone-900",
  "bg-amber-600 active:bg-amber-700",
  "bg-emerald-600 active:bg-emerald-700",
];

export function PaginaRegisto(props: Props) {
  // Escolha de origem para o PRÓXIMO lance (ainda não existe lance).
  const [origem, setOrigem] = useState("");
  const [tipoBP, setTipoBP] = useState("");

  if (props.emCurso) {
    return (
      <PainelTema
        emCurso={props.emCurso}
        onAtualizar={props.onAtualizarLance}
        onConcluir={props.onConcluir}
        onApagar={props.onApagarEmCurso}
      />
    );
  }

  function criar(tema: TemaId) {
    props.onCriarLance(tema, origem, tipoBP);
    // Limpa a escolha para o lance seguinte (ver comentário no topo).
    setOrigem("");
    setTipoBP("");
  }

  const ultimos = props.lances.slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* Origem do lance — sempre visível porque muda a cada lance */}
      <section className="rounded-xl border border-stone-300 bg-white p-3">
        <h2 className="mb-2 font-bold">
          Origem do Lance
          <span className="ml-2 text-xs font-normal text-stone-400">T0.8</span>
        </h2>
        <PainelBotoes
          campo={campoPorId("T0.8")}
          valor={origem}
          onEscolher={(v) => {
            setOrigem(v);
            // Mudar a origem invalida o tipo de bola parada escolhido antes.
            setTipoBP("");
          }}
        />
        {/* T0.9 só aparece quando a origem é bola parada; nos restantes
            casos grava-se "NA" automaticamente ao criar o lance. */}
        {origem === "BP" && (
          <div className="mt-3 border-t border-stone-200 pt-3">
            <h3 className="mb-2 font-bold">
              Tipo de Bola Parada
              <span className="ml-2 text-xs font-normal text-stone-400">T0.9</span>
            </h3>
            <PainelBotoes
              campo={campoPorId("T0.9")}
              valor={tipoBP}
              onEscolher={setTipoBP}
              ocultar={["NA"]}
            />
          </div>
        )}
      </section>

      {/* Botões de tema — criar o lance nº proximoNumero */}
      <section>
        <h2 className="mb-2 font-bold">
          Lance {props.proximoNumero} — escolhe o tema
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TEMAS.map((tema, i) => (
            <button
              key={tema.id}
              type="button"
              onClick={() => criar(tema.id)}
              className={
                "min-h-20 rounded-xl px-4 text-left text-white shadow " +
                CORES_TEMA[i]
              }
            >
              <span className="block text-sm font-semibold opacity-80">{tema.id}</span>
              <span className="block text-lg font-bold leading-tight">{tema.nome}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Últimos lances — contexto rápido sem sair do ecrã */}
      {ultimos.length > 0 && (
        <section className="text-sm text-stone-500">
          <h3 className="mb-1 font-semibold text-stone-600">Últimos lances</h3>
          <ul className="space-y-1">
            {ultimos.map((lance) => (
              <li key={lance.numero}>
                #{lance.numero} · {lance.tema} · {categoriaVideo(lance)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
