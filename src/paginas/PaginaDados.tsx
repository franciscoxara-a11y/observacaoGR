/**
 * Ecrã "Dados" — a tabela de todos os lances, com filtros, correção e
 * exportação.
 *
 * A tabela mostra um resumo por linha (as 62 colunas completas iriam para o
 * CSV, não para um tablet); tocar numa linha expande-a e mostra todos os
 * campos preenchidos com as descrições completas. Lances com campos em falta
 * são assinalados, nunca bloqueados — em jogo não há tempo de preencher tudo
 * e um lance incompleto continua a ser um lance válido.
 */

import { useState, type ChangeEvent, type MouseEvent } from "react";
import { camposDoTema, descricaoDe, campoPorId, TEMAS } from "../config/campos.ts";
import type { Lance, Sessao } from "../logica/modelo.ts";
import type { ListasEditaveis } from "../config/listas.ts";
import { categoriaVideo, goloSofrido } from "../logica/derivacoes.ts";
import {
  exportarCsv,
  exportarJson,
  lerJsonImportado,
  nomeFicheiro,
  type FicheiroSessao,
} from "../logica/exportacao.ts";
import { BotaoConfirmar } from "../components/BotaoConfirmar.tsx";

type Props = {
  sessao: Sessao;
  listas: ListasEditaveis;
  onApagarLance: (numero: number) => void;
  onReabrirLance: (numero: number) => void;
  onImportar: (ficheiro: FicheiroSessao) => void;
  onNovoJogo: () => void;
};

/** Descarrega um texto como ficheiro (sem servidor: via Blob + link). */
function descarregar(nome: string, conteudo: string, tipoMime: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipoMime }));
  const ligacao = document.createElement("a");
  ligacao.href = url;
  ligacao.download = nome;
  ligacao.click();
  URL.revokeObjectURL(url);
}

export function PaginaDados(props: Props) {
  const { sessao } = props;
  const [filtroTema, setFiltroTema] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroGolo, setFiltroGolo] = useState(""); // "" | "SIM" | "NÃO"
  const [expandido, setExpandido] = useState<number | null>(null);
  const [erroImportacao, setErroImportacao] = useState("");

  // Só oferecemos como filtro as categorias que existem nos dados.
  const categoriasPresentes = [...new Set(sessao.lances.map(categoriaVideo))];

  const visiveis = sessao.lances.filter((lance) => {
    if (filtroTema && lance.tema !== filtroTema) return false;
    if (filtroCategoria && categoriaVideo(lance) !== filtroCategoria) return false;
    if (filtroGolo && (goloSofrido(lance) ? "SIM" : "NÃO") !== filtroGolo) return false;
    return true;
  });

  function importarFicheiro(ficheiros: FileList | null) {
    const ficheiro = ficheiros?.[0];
    if (!ficheiro) return;
    ficheiro.text().then((texto) => {
      try {
        props.onImportar(lerJsonImportado(texto));
        setErroImportacao("");
      } catch (erro) {
        setErroImportacao(erro instanceof Error ? erro.message : String(erro));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Exportação e gestão da sessão */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            descarregar(nomeFicheiro(sessao, "csv"), exportarCsv(sessao), "text/csv;charset=utf-8")
          }
          className="min-h-14 rounded-xl bg-green-700 px-4 font-bold text-white active:bg-green-800"
        >
          Exportar CSV
        </button>
        <button
          type="button"
          onClick={() =>
            descarregar(
              nomeFicheiro(sessao, "json"),
              exportarJson(sessao, props.listas),
              "application/json"
            )
          }
          className="min-h-14 rounded-xl bg-stone-700 px-4 font-bold text-white active:bg-stone-800"
        >
          Exportar JSON
        </button>
        {/* Importar JSON = retomar uma sessão exportada (substitui a atual) */}
        <label className="min-h-14 cursor-pointer rounded-xl border-2 border-stone-300 bg-white px-4 py-3.5 font-semibold">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => importarFicheiro(e.target.files)}
          />
        </label>
        <BotaoConfirmar
          rotulo="Novo Jogo"
          rotuloConfirmar="Apaga a sessão atual?"
          onConfirmado={props.onNovoJogo}
        />
      </section>
      {erroImportacao && (
        <p className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">{erroImportacao}</p>
      )}

      {/* Filtros */}
      <section className="space-y-2 text-sm">
        <FilaFiltros
          rotulo="Tema"
          opcoes={TEMAS.map((t) => ({ valor: t.id, rotulo: t.id }))}
          ativo={filtroTema}
          onMudar={setFiltroTema}
        />
        <FilaFiltros
          rotulo="Categoria"
          opcoes={categoriasPresentes.map((c) => ({ valor: c, rotulo: c }))}
          ativo={filtroCategoria}
          onMudar={setFiltroCategoria}
        />
        <FilaFiltros
          rotulo="Golo sofrido"
          opcoes={[
            { valor: "SIM", rotulo: "Sim" },
            { valor: "NÃO", rotulo: "Não" },
          ]}
          ativo={filtroGolo}
          onMudar={setFiltroGolo}
        />
      </section>

      {/* Tabela */}
      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-stone-500">
          {sessao.lances.length === 0
            ? "Ainda não há lances registados."
            : "Nenhum lance corresponde aos filtros."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left text-xs uppercase text-stone-500">
                <th className="p-2">Nº</th>
                <th className="p-2">Tema</th>
                <th className="p-2">Origem</th>
                <th className="p-2">Categoria de Vídeo</th>
                <th className="p-2">Golo</th>
                <th className="p-2">Campos</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((lance) => (
                <LinhaLance
                  key={lance.numero}
                  lance={lance}
                  expandido={expandido === lance.numero}
                  onExpandir={() =>
                    setExpandido(expandido === lance.numero ? null : lance.numero)
                  }
                  onReabrir={() => props.onReabrirLance(lance.numero)}
                  onApagar={() => props.onApagarLance(lance.numero)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Subcomponentes ─────────────────────────────────────────────────────── */

function FilaFiltros(props: {
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  ativo: string;
  onMudar: (valor: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 w-24 font-semibold text-stone-600">{props.rotulo}:</span>
      <Chip ativo={props.ativo === ""} onClicar={() => props.onMudar("")} rotulo="Todos" />
      {props.opcoes.map((o) => (
        <Chip
          key={o.valor}
          ativo={props.ativo === o.valor}
          onClicar={() => props.onMudar(props.ativo === o.valor ? "" : o.valor)}
          rotulo={o.rotulo}
        />
      ))}
    </div>
  );
}

function Chip(props: { ativo: boolean; onClicar: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={props.onClicar}
      className={
        "min-h-10 rounded-full border px-3 " +
        (props.ativo
          ? "border-green-700 bg-green-700 text-white"
          : "border-stone-300 bg-white text-stone-700")
      }
    >
      {props.rotulo}
    </button>
  );
}

function LinhaLance(props: {
  lance: Lance;
  expandido: boolean;
  onExpandir: () => void;
  onReabrir: () => void;
  onApagar: () => void;
}) {
  const { lance } = props;
  const campos = camposDoTema(lance.tema);
  const preenchidos = campos.filter((c) => lance.valores[c.id]).length;
  const incompleto = preenchidos < campos.length || !lance.valores["T0.8"];
  const golo = goloSofrido(lance);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-stone-200 active:bg-stone-50"
        onClick={props.onExpandir}
      >
        <td className="p-2 font-bold">{lance.numero}</td>
        <td className="p-2">{lance.tema}</td>
        <td className="p-2">{lance.valores["T0.8"] ?? "—"}</td>
        <td className="p-2">{categoriaVideo(lance)}</td>
        <td className="p-2">
          {/* Preto e dourado (tons do clube) em vez de vermelho */}
          {golo && (
            <span className="rounded bg-stone-900 px-1.5 py-0.5 font-bold text-amber-300">
              GOLO
            </span>
          )}
        </td>
        <td className="p-2">
          {/* Sinaliza lances incompletos sem os bloquear */}
          <span className={incompleto ? "font-semibold text-amber-600" : "text-stone-500"}>
            {incompleto && "⚠ "}
            {preenchidos}/{campos.length}
          </span>
        </td>
        <td className="p-2 text-right text-stone-400">{props.expandido ? "▲" : "▼"}</td>
      </tr>
      {props.expandido && (
        <tr className="border-b border-stone-200 bg-stone-50">
          <td colSpan={7} className="p-3">
            <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
              {/* Contexto transversal do lance + campos do tema, legendados */}
              {["T0.8", "T0.9"].map((id) => (
                <ParDetalhe key={id} id={id} valores={lance.valores} />
              ))}
              {campos.map((campo) => (
                <ParDetalhe key={campo.id} id={campo.id} valores={lance.valores} />
              ))}
            </dl>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  // Sem isto, o clique também expandia/recolhia a linha.
                  e.stopPropagation();
                  props.onReabrir();
                }}
                className="min-h-12 rounded-lg border-2 border-stone-300 bg-white px-4 font-semibold"
              >
                Corrigir
              </button>
              <BotaoConfirmar
                rotulo="Apagar"
                rotuloConfirmar="Confirmar apagar?"
                onConfirmado={props.onApagar}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ParDetalhe(props: { id: string; valores: Record<string, string> }) {
  const codigo = props.valores[props.id] ?? "";
  const campo = campoPorId(props.id);
  return (
    <div className="flex justify-between gap-2 border-b border-stone-200 py-0.5">
      <dt className="text-stone-500">
        {props.id} {campo.nome}
      </dt>
      <dd className={codigo ? "text-right font-semibold" : "text-right text-amber-600"}>
        {codigo ? `${codigo} · ${descricaoDe(props.id, codigo)}` : "por preencher"}
      </dd>
    </div>
  );
}
