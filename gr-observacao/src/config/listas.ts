/**
 * Valores POR OMISSÃO das duas listas editáveis (T0.3 e T0.6).
 *
 * Estas listas são geríveis no ecrã de Configuração e guardadas em
 * localStorage — os valores abaixo só são usados na primeira utilização
 * (ou depois de limpar os dados do browser). Ao contrário dos restantes
 * campos, o valor gravado no lance é o próprio texto, não um código: as
 * listas mudam de época para época e um código estável não traria nada.
 */

export type ListasEditaveis = {
  competicoes: string[];
  guardaRedes: string[];
};

export const LISTAS_POR_OMISSAO: ListasEditaveis = {
  competicoes: [
    "2ª Liga Nacional Seniores",
    "Campeonato Nacional Sub19",
    "Campeonato Nacional Sub17",
    "Campeonato Distrital Feminino Sub 17",
    "Campeonato Distrital Misto Sub 14",
    "Torneio",
    "Amigável",
  ],
  guardaRedes: [
    "Sara Silva",
    "Leonor Serralheiro",
    "Sofia Fernandes",
    "Lara Ferreira",
    "Maria Cruz",
    "Mariana Courela",
    "Teresa Pedroso",
    "Inês Jorge",
    "Maria Ruas",
    "Vitória Pina",
  ],
};
