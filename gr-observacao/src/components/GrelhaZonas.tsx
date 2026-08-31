/**
 * Grelha de zonas clicável — o componente central da app.
 *
 * Um único componente serve as quatro grelhas (grid1, grid2, grid3,
 * gridDestino): tudo o que muda entre elas está declarado em
 * `config/grelhas.ts`. O SVG usa viewBox, por isso escala a qualquer largura
 * sem perder proporções — em tablet ocupa a largura disponível e cada zona
 * fica com uma área de toque generosa.
 *
 * Dois modos:
 *  - registo (com `onEscolher`): clicar numa zona seleciona-a; a zona
 *    selecionada fica realçada. Zonas que partilham código (FEC na grid3)
 *    realçam-se em conjunto — qualquer uma grava o mesmo valor.
 *  - mapa de calor (com `contagens`): pinta cada zona pela contagem e
 *    mostra o número; sem interação. Usado no painel de Análise.
 */

import type { LayoutGrelha } from "../config/grelhas.ts";

type Props = {
  layout: LayoutGrelha;
  /** Código da zona selecionada ("" = nenhuma). Ignorado em modo mapa. */
  valor?: string;
  onEscolher?: (codigo: string) => void;
  /** código → contagem. A presença desta prop ativa o modo mapa de calor. */
  contagens?: Record<string, number>;
};

/* Cores do desenho. Ficam aqui (e não em classes Tailwind) porque são
   atributos de preenchimento SVG calculados por zona.
   Paleta nos tons do Sporting CP: verdes do clube, seleção e mapa de calor
   em dourado (as cores do emblema) — sem vermelho, a pedido do departamento. */
const COR_RELVA = "#0a5c33"; // verde escuro de fundo
const COR_ZONA = "#0f7d44"; // verde Sporting, ligeiramente mais claro
const COR_SELECIONADA = "#f2c200"; // dourado — bem visível sobre o verde
const COR_CALOR = "242, 194, 0"; // o mesmo dourado (rgb), opacidade variável

export function GrelhaZonas({ layout, valor, onEscolher, contagens }: Props) {
  const { viewBox } = layout;
  const modoMapa = contagens !== undefined;
  const maximo = modoMapa ? Math.max(1, ...Object.values(contagens)) : 1;

  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="w-full max-w-2xl"
      role="group"
      aria-label={layout.nome}
    >
      {/* Fundo de relva a cobrir todo o desenho */}
      <rect
        x={viewBox.x}
        y={viewBox.y}
        width={viewBox.w}
        height={viewBox.h}
        fill={COR_RELVA}
      />

      {layout.zonas.map((zona, i) => {
        const selecionada = !modoMapa && valor !== "" && valor === zona.codigo;
        const contagem = contagens?.[zona.codigo] ?? 0;
        // Opacidade proporcional ao máximo: a zona mais "quente" fica a 85%.
        const fill = modoMapa
          ? contagem === 0
            ? COR_ZONA
            : `rgba(${COR_CALOR}, ${0.15 + 0.7 * (contagem / maximo)})`
          : selecionada
            ? COR_SELECIONADA
            : COR_ZONA;
        const rotulo = modoMapa
          ? contagem > 0
            ? String(contagem)
            : ""
          : zona.codigo;
        return (
          // `key` usa o índice porque o código pode repetir-se (FEC).
          <g
            key={i}
            className={onEscolher ? "zona-clicavel" : undefined}
            onClick={onEscolher ? () => onEscolher(zona.codigo) : undefined}
          >
            <rect
              x={zona.x}
              y={zona.y}
              width={zona.w}
              height={zona.h}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            {rotulo && (
              <text
                x={zona.x + zona.w / 2}
                // rotuloDy afasta o rótulo de uma moldura que passe pelo
                // centro da zona (ver ZonaLayout).
                y={zona.y + zona.h / 2 + (zona.rotuloDy ?? 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.min(18, zona.h * 0.55)}
                fontWeight={selecionada ? 700 : 500}
                // Texto escuro sobre dourado (seleção ou zona "quente"),
                // branco sobre o verde.
                fill={
                  selecionada || (modoMapa && contagem > 0) ? "#1c1917" : "#ffffff"
                }
                // O texto não pode roubar o clique ao <g>
                pointerEvents="none"
              >
                {rotulo}
              </text>
            )}
          </g>
        );
      })}

      {/* Molduras decorativas (grande área, pequena área, baliza) por cima
          das zonas: contorno preto grosso, sem preenchimento nem interação. */}
      {layout.molduras.map((m, i) => (
        <rect
          key={i}
          x={m.x}
          y={m.y}
          width={m.w}
          height={m.h}
          fill="none"
          stroke="#1c1917"
          strokeWidth={3}
          pointerEvents="none"
        />
      ))}
    </svg>
  );
}
