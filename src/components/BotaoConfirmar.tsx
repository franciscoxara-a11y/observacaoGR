/**
 * Botão de ação destrutiva com confirmação em dois toques.
 *
 * Porquê não `window.confirm`: os diálogos nativos são pequenos, feios em
 * tablet e fáceis de aceitar por reflexo. Aqui o primeiro toque transforma o
 * botão num pedido de confirmação bem visível; se não houver segundo toque
 * em 3 segundos, volta ao estado normal. Sem diálogo, sem estado global.
 *
 * Cor de aviso em âmbar/dourado (não vermelho) — a paleta da app segue os
 * tons do Sporting CP.
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  rotulo: string;
  rotuloConfirmar: string;
  onConfirmado: () => void;
  className?: string;
};

export function BotaoConfirmar({ rotulo, rotuloConfirmar, onConfirmado, className }: Props) {
  const [aConfirmar, setAConfirmar] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Limpa o temporizador se o componente desaparecer entretanto.
  useEffect(() => () => clearTimeout(temporizador.current), []);

  function clique() {
    if (aConfirmar) {
      clearTimeout(temporizador.current);
      setAConfirmar(false);
      onConfirmado();
    } else {
      setAConfirmar(true);
      temporizador.current = setTimeout(() => setAConfirmar(false), 3000);
    }
  }

  return (
    <button
      type="button"
      onClick={clique}
      className={
        "min-h-14 rounded-xl border-2 px-4 font-semibold " +
        (aConfirmar
          ? "border-amber-700 bg-amber-600 text-white"
          : "border-amber-400 bg-white text-amber-800 active:bg-amber-50") +
        " " +
        (className ?? "")
      }
    >
      {aConfirmar ? rotuloConfirmar : rotulo}
    </button>
  );
}
