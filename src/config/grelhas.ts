/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYOUTS DAS GRELHAS DE ZONA (componentes SVG clicáveis)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cada grelha é descrita por dados (retângulos + molduras decorativas) e
 * desenhada por um único componente genérico, `<GrelhaZonas />`. Para
 * acrescentar ou alterar uma zona basta mexer aqui.
 *
 * Convenções de desenho:
 *  - Vista de cima com a BALIZA EM BAIXO AO CENTRO (grid1, grid3, gridDestino)
 *    ou baliza vista de frente (grid2).
 *  - O `codigo` é o valor gravado no lance. Duas zonas podem partilhar o
 *    mesmo código (caso das duas caixas FEC na grid3) — é intencional: o
 *    realce da seleção apanha ambas, e qualquer uma grava o mesmo valor.
 */

export type GrelhaId = "grid1" | "grid2" | "grid3" | "gridDestino";

export type ZonaLayout = {
  codigo: string;
  descricao: string; // usado na legenda, na tabela de dados e no README
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Desvio vertical do rótulo em relação ao centro da zona. Usado quando o
   * centro geométrico calha em cima de uma moldura (caso do FC na grid3).
   */
  rotuloDy?: number;
};

/** Moldura decorativa (grande área, pequena área, baliza) — sem interação. */
export type Moldura = { x: number; y: number; w: number; h: number };

export type LayoutGrelha = {
  id: GrelhaId;
  nome: string;
  /** viewBox do SVG — mantém as proporções em qualquer largura de ecrã. */
  viewBox: { x: number; y: number; w: number; h: number };
  zonas: ZonaLayout[];
  molduras: Moldura[];
};

/* ── grid1 — Zona de Campo (15 zonas) ──────────────────────────────────────
   Usada em T1.2, T3.2, T4.4, T4.9 e T5.3.
   Profundidade (de baixo para cima): Interior Pequena Área → Interior Grande
   Área → Exterior Grande Área (até 25m) → Zona Intermédia (25-40m) → Metade
   Defensiva (+40m). Largura: Lateral Esquerda / Corredor Central / Lateral
   Direita. As zonas 7 e 9 são "caixas altas": o corredor lateral exterior à
   grande área estende-se até à linha de fundo. */

const PROFUNDIDADES_GRID1 = [
  "Interior Pequena Área",
  "Interior Grande Área",
  "Exterior Grande Área (até 25m)",
  "Zona Intermédia (25-40m)",
  "Metade Defensiva (+40m)",
];
const LARGURAS_GRID1 = ["Lateral Esquerda", "Corredor Central", "Lateral Direita"];

/** Descrição da zona n (1..15): profundidade = faixa de 3, largura = resto. */
function descricaoGrid1(n: number): string {
  const profundidade = PROFUNDIDADES_GRID1[Math.floor((n - 1) / 3)];
  const largura = LARGURAS_GRID1[(n - 1) % 3];
  return `${profundidade} — ${largura}`;
}

// Coordenadas exatas fornecidas pelo departamento (equivalem ao desenho do
// Excel original). Formato: [zona, x, y, w, h].
const RECTS_GRID1: [number, number, number, number, number][] = [
  [13, 0, 0, 96, 62],
  [14, 96, 0, 240, 62],
  [15, 336, 0, 96, 62],
  [10, 0, 63, 96, 40],
  [11, 96, 63, 240, 40],
  [12, 336, 63, 96, 40],
  [7, 0, 103, 96, 115],
  [8, 96, 103, 240, 40],
  [9, 336, 103, 96, 115],
  [4, 96, 143, 48, 75],
  [5, 144, 143, 144, 49],
  [6, 288, 143, 48, 75],
  [1, 144, 191, 48, 26],
  [2, 192, 191, 48, 26],
  [3, 240, 191, 48, 26],
];

export const GRID1: LayoutGrelha = {
  id: "grid1",
  nome: "Zona de Campo",
  viewBox: { x: 0, y: 0, w: 432, h: 240 },
  zonas: RECTS_GRID1.map(([n, x, y, w, h]) => ({
    codigo: String(n),
    descricao: descricaoGrid1(n),
    x,
    y,
    w,
    h,
  })),
  molduras: [
    { x: 0, y: 63, w: 432, h: 154 }, // Grande Área
    { x: 96, y: 143, w: 240, h: 75 }, // Pequena Área
    { x: 168, y: 218, w: 96, h: 19 }, // Baliza
  ],
};

/* ── grid2 — Zona da Baliza (9 zonas) ──────────────────────────────────────
   Usada em T1.3. Baliza vista de frente, 3 colunas × 3 alturas.
   A numeração é DA DIREITA PARA A ESQUERDA, de baixo para cima:
   1=Rasteiro Direita … 9=Alto Esquerda. No ecrã (esquerda→direita) a fila de
   cima desenha-se 9-8-7 e a de baixo 3-2-1. As proporções do viewBox
   aproximam uma baliza real (7,32m × 2,44m). */

const ALTURAS_GRID2 = ["Rasteiro", "Médio", "Alto"];
const LADOS_GRID2 = ["Direita", "Centro", "Esquerda"];

function zonaGrid2(n: number): ZonaLayout {
  const fila = Math.floor((n - 1) / 3); // 0=rasteiro, 1=médio, 2=alto
  const posicaoNoLado = (n - 1) % 3; // 0=direita, 1=centro, 2=esquerda
  const w = 122;
  const h = 41;
  return {
    codigo: String(n),
    descricao: `${ALTURAS_GRID2[fila]} — ${LADOS_GRID2[posicaoNoLado]}`,
    // direita do GR = coluna da direita no ecrã → x cresce quando o lado
    // vai de "esquerda" (0) para "direita" (2·w)
    x: (2 - posicaoNoLado) * w,
    // rasteiro fica em baixo → y cresce quando a fila desce
    y: (2 - fila) * h,
    w,
    h,
  };
}

export const GRID2: LayoutGrelha = {
  id: "grid2",
  nome: "Zona da Baliza",
  viewBox: { x: 0, y: 0, w: 366, h: 123 },
  zonas: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(zonaGrid2),
  molduras: [{ x: 0, y: 0, w: 366, h: 123 }], // o próprio aro da baliza
};

/* ── grid3 — Zona de Origem do Cruzamento (8 zonas, 9 caixas) ──────────────
   Usada em T2.2. Réplica do desenho do departamento: vista de cima do meio
   campo defensivo, baliza em baixo ao centro. As linhas PRETAS são molduras
   (limites do meio campo, grande área, pequena área e baliza); as linhas
   BRANCAS são as fronteiras das zonas — as duas coisas não coincidem: a
   grande área é mais estreita do que os corredores de zona e a moldura é
   desenhada por cima delas.

   Zonas (a numeração 1→3 cresce do centro para fora):
     LE1/LD1 = frente à baliza, cada uma até ao eixo central (incluem a
               respetiva metade da pequena área)
     LE2/LD2 = corredor lateral da grande área (da FEC à linha de fundo)
     LE3/LD3 = flanco exterior (coluna a toda a altura)
     FC      = frontal, corredor central — desde a linha de meio campo (o
               topo do desenho) até à zona frente à baliza
     FEC     = frontal, entre corredores — duas caixas no topo dos
               corredores laterais, que gravam o MESMO código (o lado não é
               distinguido — intencional, não fundir nem distinguir)

   Colunas: 0-66 flanco esq · 66-122 corredor esq · 122-310 centro ·
   310-366 corredor dir · 366-432 flanco dir. Linha de fundo em y=218;
   a baliza desenha-se abaixo dela. */

export const GRID3: LayoutGrelha = {
  id: "grid3",
  nome: "Zona de Origem do Cruzamento",
  viewBox: { x: 0, y: 0, w: 432, h: 240 },
  zonas: [
    // Flancos exteriores — colunas a toda a altura do meio campo
    { codigo: "LE3", descricao: "Flanco Esquerdo — Exterior à Grande Área", x: 0, y: 0, w: 66, h: 218 },
    { codigo: "LD3", descricao: "Flanco Direito — Exterior à Grande Área", x: 366, y: 0, w: 66, h: 218 },
    // Frontal, entre corredores — topo dos corredores laterais
    { codigo: "FEC", descricao: "Frontal — Entre Corredores", x: 66, y: 0, w: 56, h: 73 },
    { codigo: "FEC", descricao: "Frontal — Entre Corredores", x: 310, y: 0, w: 56, h: 73 },
    // Corredores laterais da grande área, abaixo das FEC até à linha de fundo
    { codigo: "LE2", descricao: "Esquerda — Corredor da Grande Área", x: 66, y: 73, w: 56, h: 145 },
    { codigo: "LD2", descricao: "Direita — Corredor da Grande Área", x: 310, y: 73, w: 56, h: 145 },
    // Frontal, corredor central — da linha de meio campo até à frente da
    // baliza (a moldura da grande área atravessa-o, desenhada por cima)
    { codigo: "FC", descricao: "Frontal — Corredor Central", x: 122, y: 0, w: 188, h: 148, rotuloDy: 22 },
    // Frente à baliza, até ao eixo central (incluem metade da pequena área)
    { codigo: "LE1", descricao: "Esquerda — Frente à Baliza", x: 122, y: 148, w: 94, h: 70 },
    { codigo: "LD1", descricao: "Direita — Frente à Baliza", x: 216, y: 148, w: 94, h: 70 },
  ],
  molduras: [
    { x: 0, y: 0, w: 432, h: 218 }, // limites do meio campo defensivo
    { x: 86, y: 73, w: 260, h: 145 }, // Grande Área (mais estreita que os corredores)
    { x: 168, y: 158, w: 96, h: 60 }, // Pequena Área
    { x: 188, y: 218, w: 56, h: 20 }, // Baliza (abaixo da linha de fundo)
  ],
};

/* ── gridDestino — Zona Destino do Cruzamento (6 zonas) ────────────────────
   Usada em T2.4. Reutiliza a geometria da grande área da grid1:
   E3/D3 são caixas altas nos corredores da grande área, C3 é a faixa larga
   recuada, e 1E1/C1/1D1 ficam em frente à baliza à largura da pequena área.
   ⚠️ O código "1E1" parece notação científica ao Excel — a exportação CSV
   protege-o (ver exportacao.ts). */

export const GRID_DESTINO: LayoutGrelha = {
  id: "gridDestino",
  nome: "Zona Destino do Cruzamento",
  // O viewBox começa em y=60 para recortar a faixa acima da grande área,
  // que nesta grelha não tem zonas.
  viewBox: { x: 0, y: 60, w: 432, h: 180 },
  zonas: [
    { codigo: "E3", descricao: "Corredor Esquerdo da Grande Área", x: 0, y: 63, w: 96, h: 155 },
    { codigo: "D3", descricao: "Corredor Direito da Grande Área", x: 336, y: 63, w: 96, h: 155 },
    { codigo: "C3", descricao: "Faixa Central Recuada da Grande Área", x: 96, y: 63, w: 240, h: 80 },
    { codigo: "1E1", descricao: "Frente à Baliza — Esquerda", x: 96, y: 143, w: 80, h: 75 },
    { codigo: "C1", descricao: "Frente à Baliza — Centro", x: 176, y: 143, w: 80, h: 75 },
    { codigo: "1D1", descricao: "Frente à Baliza — Direita", x: 256, y: 143, w: 80, h: 75 },
  ],
  molduras: [
    { x: 0, y: 63, w: 432, h: 154 }, // Grande Área
    { x: 96, y: 143, w: 240, h: 75 }, // Pequena Área
    { x: 168, y: 218, w: 96, h: 19 }, // Baliza
  ],
};

export const GRELHAS: Record<GrelhaId, LayoutGrelha> = {
  grid1: GRID1,
  grid2: GRID2,
  grid3: GRID3,
  gridDestino: GRID_DESTINO,
};

/** Descrição legível de um código de zona (para legendas e tabelas). */
export function descricaoDeZona(grelha: GrelhaId, codigo: string): string {
  const zona = GRELHAS[grelha].zonas.find((z) => z.codigo === codigo);
  return zona ? zona.descricao : codigo;
}
