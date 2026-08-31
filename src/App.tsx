/**
 * Raiz da aplicação: dona de TODO o estado (sessão, lance em curso, listas)
 * e da navegação entre ecrãs.
 *
 * Decisão: sem biblioteca de estado nem de routing — o estado vive aqui em
 * `useState` e desce por props. A app é pequena o suficiente para isto ser
 * mais legível do que qualquer abstração, e um único dono do estado torna a
 * persistência trivial: três `useEffect`, um por pedaço de estado.
 */

import { useEffect, useState } from "react";
import type { TemaId } from "./config/campos.ts";
import type { ListasEditaveis } from "./config/listas.ts";
import type { LanceEmCurso, Sessao } from "./logica/modelo.ts";
import { sessaoVazia } from "./logica/modelo.ts";
import {
  gravarLanceEmCurso,
  gravarListas,
  gravarSessao,
  lerLanceEmCurso,
  lerListas,
  lerSessao,
} from "./logica/persistencia.ts";
import type { FicheiroSessao } from "./logica/exportacao.ts";
import { PaginaJogo } from "./paginas/PaginaJogo.tsx";
import { PaginaRegisto } from "./paginas/PaginaRegisto.tsx";
import { PaginaDados } from "./paginas/PaginaDados.tsx";
import { PaginaConfiguracao } from "./paginas/PaginaConfiguracao.tsx";
import { PaginaAnalise } from "./paginas/PaginaAnalise.tsx";

export type Ecra = "jogo" | "registo" | "dados" | "configuracao" | "analise";

const ECRAS: { id: Ecra; rotulo: string }[] = [
  { id: "jogo", rotulo: "Jogo" },
  { id: "registo", rotulo: "Registar Lance" },
  { id: "dados", rotulo: "Dados" },
  { id: "analise", rotulo: "Análise" },
  { id: "configuracao", rotulo: "Configuração" },
];

export function App() {
  // Estado inicial lido do localStorage — é isto que faz a app sobreviver a
  // um refresh a meio do jogo.
  const [sessao, setSessao] = useState<Sessao>(lerSessao);
  const [emCurso, setEmCurso] = useState<LanceEmCurso | null>(lerLanceEmCurso);
  const [listas, setListas] = useState<ListasEditaveis>(lerListas);
  // Se já há dados de jogo gravados, arranca direto no ecrã de registo.
  const [ecra, setEcra] = useState<Ecra>(() =>
    Object.keys(lerSessao().jogo).length > 0 ? "registo" : "jogo"
  );

  // Persistência automática: cada pedaço de estado grava-se ao mudar.
  useEffect(() => gravarSessao(sessao), [sessao]);
  useEffect(() => gravarLanceEmCurso(emCurso), [emCurso]);
  useEffect(() => gravarListas(listas), [listas]);

  /* ── Dados do jogo (T0.1..T0.7) ─────────────────────────────────────── */

  function atualizarJogo(campoId: string, valor: string) {
    setSessao((s) => ({ ...s, jogo: { ...s.jogo, [campoId]: valor } }));
  }

  /* ── Ciclo de vida de um lance ──────────────────────────────────────── */

  /** Clicar num tema no ecrã de registo cria o lance e abre o painel. */
  function criarLance(tema: TemaId, origem: string, tipoBP: string) {
    const valores: Record<string, string> = {};
    if (origem !== "") {
      valores["T0.8"] = origem;
      // Regra do domínio: quando a origem não é bola parada, T0.9 grava
      // "NA" automaticamente — distingue "não se aplica" de "esqueci-me"
      // (que fica vazio). Quando É bola parada, o tipo tem de ser escolhido.
      if (origem === "BP") {
        if (tipoBP !== "") valores["T0.9"] = tipoBP;
      } else {
        valores["T0.9"] = "NA";
      }
    }
    setEmCurso({
      lance: { numero: sessao.proximoNumero, tema, valores },
      reaberto: false,
    });
  }

  /** Atualiza um campo do lance em curso (valor "" = desselecionar). */
  function atualizarLance(campoId: string, valor: string) {
    setEmCurso((atual) => {
      if (!atual) return atual;
      const valores = { ...atual.lance.valores };
      if (valor === "") {
        delete valores[campoId];
      } else {
        valores[campoId] = valor;
      }
      // Mudar a origem do lance reaplica a regra do T0.9 (ver criarLance).
      if (campoId === "T0.8") {
        if (valor === "" || valor === "BP") {
          delete valores["T0.9"];
        } else {
          valores["T0.9"] = "NA";
        }
      }
      return { ...atual, lance: { ...atual.lance, valores } };
    });
  }

  function concluirLance() {
    if (!emCurso) return;
    setSessao((s) => {
      if (emCurso.reaberto) {
        // Lance reaberto: substitui a versão antiga, mantém o número.
        return {
          ...s,
          lances: s.lances.map((l) =>
            l.numero === emCurso.lance.numero ? emCurso.lance : l
          ),
        };
      }
      // Lance novo: entra na lista e o número seguinte avança. O número
      // nunca é reutilizado, mesmo que se apaguem lances (ver modelo.ts).
      return {
        ...s,
        lances: [...s.lances, emCurso.lance],
        proximoNumero: s.proximoNumero + 1,
      };
    });
    setEmCurso(null);
  }

  /** Descarta o lance em curso (novo: o número não chegou a ser consumido;
      reaberto: a versão antiga na tabela fica como estava). */
  function apagarLanceEmCurso() {
    setEmCurso(null);
  }

  function apagarLance(numero: number) {
    setSessao((s) => ({ ...s, lances: s.lances.filter((l) => l.numero !== numero) }));
  }

  /** Reabre um lance da tabela para correção no painel do tema. */
  function reabrirLance(numero: number) {
    const lance = sessao.lances.find((l) => l.numero === numero);
    if (!lance) return;
    // Cópia profunda dos valores: as edições só tocam na tabela ao concluir.
    setEmCurso({ lance: { ...lance, valores: { ...lance.valores } }, reaberto: true });
    setEcra("registo");
  }

  /* ── Sessão inteira ─────────────────────────────────────────────────── */

  function novoJogo() {
    setSessao(sessaoVazia());
    setEmCurso(null);
    setEcra("jogo");
  }

  function importarSessao(ficheiro: FicheiroSessao) {
    setSessao(ficheiro.sessao);
    setEmCurso(null);
    // As listas do ficheiro juntam-se às locais (união sem duplicados):
    // importar uma sessão de outro tablet não pode apagar listas daqui.
    setListas((atuais) => ({
      competicoes: [...new Set([...atuais.competicoes, ...(ficheiro.listas?.competicoes ?? [])])],
      guardaRedes: [...new Set([...atuais.guardaRedes, ...(ficheiro.listas?.guardaRedes ?? [])])],
    }));
    setEcra("registo");
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  const resumoJogo = [sessao.jogo["T0.6"], sessao.jogo["T0.2"]]
    .filter(Boolean)
    .join(" vs ");

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-300 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2">
          <h1 className="mr-2 text-sm font-bold leading-tight">
            Observação GR
            {resumoJogo && (
              <span className="block font-normal text-stone-500">{resumoJogo}</span>
            )}
          </h1>
          <nav className="flex flex-1 flex-wrap gap-1">
            {ECRAS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEcra(e.id)}
                className={
                  "min-h-12 rounded-lg px-3 text-sm font-semibold " +
                  (ecra === e.id
                    ? "bg-green-700 text-white"
                    : "bg-stone-200 text-stone-700 active:bg-stone-300")
                }
              >
                {e.rotulo}
                {/* Nº de lances registados sempre à vista no separador Dados */}
                {e.id === "dados" && sessao.lances.length > 0 && (
                  <span className="ml-1 rounded-full bg-white/80 px-1.5 text-xs text-stone-700">
                    {sessao.lances.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-3 pb-24">
        {ecra === "jogo" && (
          <PaginaJogo
            jogo={sessao.jogo}
            listas={listas}
            onMudar={atualizarJogo}
            onComecar={() => setEcra("registo")}
          />
        )}
        {ecra === "registo" && (
          <PaginaRegisto
            emCurso={emCurso}
            proximoNumero={sessao.proximoNumero}
            lances={sessao.lances}
            onCriarLance={criarLance}
            onAtualizarLance={atualizarLance}
            onConcluir={concluirLance}
            onApagarEmCurso={apagarLanceEmCurso}
          />
        )}
        {ecra === "dados" && (
          <PaginaDados
            sessao={sessao}
            listas={listas}
            onApagarLance={apagarLance}
            onReabrirLance={reabrirLance}
            onImportar={importarSessao}
            onNovoJogo={novoJogo}
          />
        )}
        {ecra === "analise" && <PaginaAnalise lances={sessao.lances} />}
        {ecra === "configuracao" && (
          <PaginaConfiguracao listas={listas} onMudar={setListas} />
        )}
      </main>
    </div>
  );
}
