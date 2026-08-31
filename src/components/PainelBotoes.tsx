/**
 * Painel de botões de um campo: uma opção = um botão grande.
 *
 * É o mecanismo de introdução principal da app — otimizado para toque
 * rápido em tablet: alvos altos, texto legível, seleção bem visível.
 * Clicar noutra opção corrige a escolha; clicar na opção já selecionada
 * desseleciona (permite voltar a "por preencher" sem apagar o lance).
 */

import type { Campo, Opcao } from "../config/campos.ts";

type Props = {
  campo: Campo;
  /** Opções a mostrar: por omissão as do campo; as listas editáveis passam
      aqui as suas entradas convertidas em opções. */
  opcoes?: Opcao[];
  valor: string;
  onEscolher: (codigo: string) => void;
  /** Esconde códigos específicos (ex.: o "NA" automático do T0.9). */
  ocultar?: string[];
};

export function PainelBotoes({ campo, opcoes, valor, onEscolher, ocultar }: Props) {
  const todas = (opcoes ?? campo.opcoes ?? []).filter(
    (o) => !ocultar?.includes(o.codigo)
  );

  // Sem grupos: um único bloco de botões. Com grupos (ex.: T2.10): um bloco
  // por grupo com subtítulo, e as opções fora de qualquer grupo no fim.
  const grupos = campo.grupos
    ? [
        ...campo.grupos.map((g) => ({
          titulo: g.titulo as string | null,
          opcoes: g.codigos
            .map((codigo) => todas.find((o) => o.codigo === codigo))
            .filter((o): o is Opcao => o !== undefined),
        })),
        {
          titulo: null,
          opcoes: todas.filter(
            (o) => !campo.grupos!.some((g) => g.codigos.includes(o.codigo))
          ),
        },
      ].filter((g) => g.opcoes.length > 0)
    : [{ titulo: null, opcoes: todas }];

  return (
    <div className="space-y-2">
      {grupos.map((grupo, i) => (
        <div key={i}>
          {grupo.titulo && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
              {grupo.titulo}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {grupo.opcoes.map((opcao) => {
              const selecionada = valor === opcao.codigo;
              return (
                <button
                  key={opcao.codigo}
                  type="button"
                  // Toggle: repetir o clique desseleciona (correção rápida).
                  onClick={() => onEscolher(selecionada ? "" : opcao.codigo)}
                  aria-pressed={selecionada}
                  className={
                    "min-h-14 rounded-xl border-2 px-4 py-2 text-left text-base leading-tight " +
                    (selecionada
                      ? "border-green-700 bg-green-600 text-white shadow-inner"
                      : "border-stone-300 bg-white text-stone-800 active:bg-stone-100")
                  }
                >
                  <span className="block font-semibold">
                    {rotuloDoBotao(opcao, grupo.titulo)}
                  </span>
                  <span
                    className={
                      "block text-xs " +
                      (selecionada ? "text-green-100" : "text-stone-400")
                    }
                  >
                    {opcao.codigo}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dentro de um grupo, tira o prefixo redundante da descrição: "Ação GR —
 * Receção/Blocagem Alta" no grupo "Ação GR" mostra só "Receção/Blocagem
 * Alta". Também apanha prefixos abreviados ("Finalização Adv." no grupo
 * "Finalização Adversário"). Menos texto = botão mais rápido de encontrar.
 * O código completo continua visível no botão e é o que fica gravado.
 */
function rotuloDoBotao(opcao: Opcao, tituloGrupo: string | null): string {
  if (!tituloGrupo) return opcao.descricao;
  const separador = opcao.descricao.indexOf(" — ");
  if (separador === -1) return opcao.descricao;
  // "Finalização Adv." → "Finalização Adv"; é prefixo de "Finalização
  // Adversário", logo é redundante com o subtítulo do grupo.
  const prefixo = opcao.descricao.slice(0, separador).replace(/\.$/, "");
  return tituloGrupo.startsWith(prefixo)
    ? opcao.descricao.slice(separador + 3)
    : opcao.descricao;
}
