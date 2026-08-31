/**
 * Ecrã "Análise" — contagens simples para sustentar a otimização do treino.
 * Sem bibliotecas de gráficos: números e as próprias grelhas SVG coloridas
 * por contagem (mapa de calor) chegam perfeitamente.
 *
 * Tudo é calculado na hora a partir dos lances — não há estado próprio além
 * da escolha de qual campo de zona mostrar no mapa.
 */

import { useState } from "react";
import { CAMPOS, nomeDoTema, TEMAS } from "../config/campos.ts";
import { GRELHAS } from "../config/grelhas.ts";
import type { Lance } from "../logica/modelo.ts";
import { categoriaVideo, goloSofrido } from "../logica/derivacoes.ts";
import { GrelhaZonas } from "../components/GrelhaZonas.tsx";

type Props = { lances: Lance[] };

/** Conta ocorrências de cada valor de um campo nos lances dados. */
function contagens(lances: Lance[], campoId: string): Record<string, number> {
  const resultado: Record<string, number> = {};
  for (const lance of lances) {
    const valor = lance.valores[campoId];
    if (valor) resultado[valor] = (resultado[valor] ?? 0) + 1;
  }
  return resultado;
}

// Os campos que usam a grelha de campo (grid1) — para o seletor do mapa.
const CAMPOS_GRID1 = CAMPOS.filter((c) => c.tipo === "grid1");

// O campo "Resultado Ação GR" de cada tema, identificado pelo nome — se um
// tema novo ganhar um campo de resultado, entra aqui automaticamente.
const RESULTADO_POR_TEMA = new Map(
  CAMPOS.filter((c) => c.nome === "Resultado Ação GR").map((c) => [c.tema, c.id])
);

export function PaginaAnalise({ lances }: Props) {
  const [campoMapa, setCampoMapa] = useState(CAMPOS_GRID1[0].id);

  if (lances.length === 0) {
    return <p className="py-8 text-center text-stone-500">Ainda não há lances para analisar.</p>;
  }

  const golos = lances.filter(goloSofrido);

  // Categorias: contagem por ordem decrescente.
  const porCategoria = new Map<string, number>();
  for (const lance of lances) {
    const categoria = categoriaVideo(lance);
    porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      {/* Totais por tema, com taxa de sucesso */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Lances por tema</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMAS.map((tema) => {
            const doTema = lances.filter((l) => l.tema === tema.id);
            const campoResultado = RESULTADO_POR_TEMA.get(tema.id);
            // Taxa de sucesso: SUC / lances COM resultado preenchido.
            // Lances sem resultado ficam de fora do denominador — contá-los
            // como insucesso distorceria a taxa por causa de esquecimentos.
            const comResultado = campoResultado
              ? doTema.filter((l) => l.valores[campoResultado])
              : [];
            const sucessos = campoResultado
              ? comResultado.filter((l) => l.valores[campoResultado] === "SUC").length
              : 0;
            return (
              <div key={tema.id} className="rounded-xl border border-stone-300 bg-white p-3">
                <p className="text-sm font-semibold text-stone-500">
                  {tema.id} · {nomeDoTema(tema.id)}
                </p>
                <p className="text-2xl font-bold">{doTema.length}</p>
                {comResultado.length > 0 && (
                  <p className="text-sm text-stone-600">
                    Sucesso: {sucessos}/{comResultado.length} (
                    {Math.round((100 * sucessos) / comResultado.length)}%)
                  </p>
                )}
              </div>
            );
          })}
          {/* Preto e dourado (tons do clube) em vez de vermelho */}
          <div className="rounded-xl border border-stone-900 bg-stone-800 p-3">
            <p className="text-sm font-semibold text-amber-300">Golos sofridos</p>
            <p className="text-2xl font-bold text-white">{golos.length}</p>
          </div>
        </div>
      </section>

      {/* Contagem por categoria de vídeo */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Lances por categoria de vídeo</h2>
        <ul className="max-w-md divide-y divide-stone-200 rounded-xl border border-stone-300 bg-white">
          {[...porCategoria.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([categoria, total]) => (
              <li key={categoria} className="flex justify-between p-2 pl-4">
                <span>{categoria}</span>
                <span className="font-bold">{total}</span>
              </li>
            ))}
        </ul>
      </section>

      {/* Mapa de calor da grelha de campo, com seletor do campo de zona */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Mapa de calor — zonas de campo</h2>
        <div className="mb-2 flex flex-wrap gap-1">
          {CAMPOS_GRID1.map((campo) => (
            <button
              key={campo.id}
              type="button"
              onClick={() => setCampoMapa(campo.id)}
              className={
                "min-h-10 rounded-full border px-3 text-sm " +
                (campoMapa === campo.id
                  ? "border-green-700 bg-green-700 text-white"
                  : "border-stone-300 bg-white text-stone-700")
              }
            >
              {campo.id} {campo.nome}
            </button>
          ))}
        </div>
        <GrelhaZonas layout={GRELHAS.grid1} contagens={contagens(lances, campoMapa)} />
      </section>

      {/* Zona da baliza: todos os remates vs. golos sofridos */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-bold">Remates por zona da baliza</h2>
          <GrelhaZonas layout={GRELHAS.grid2} contagens={contagens(lances, "T1.3")} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-bold">Golos sofridos por zona da baliza</h2>
          <GrelhaZonas layout={GRELHAS.grid2} contagens={contagens(golos, "T1.3")} />
        </div>
      </section>
    </div>
  );
}
