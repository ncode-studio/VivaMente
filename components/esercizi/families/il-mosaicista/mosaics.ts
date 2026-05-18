/**
 * Catalogo mosaici per "Il Mosaicista".
 *
 * Struttura: ogni mosaico è una griglia cols×rows di celle. Ogni cella
 * è un frammento che il giocatore deve trascinare nella sua posizione.
 * Le celle possono essere:
 *   - "solid": un unico colore che riempie la cella quadrata
 *   - "diagonal": due triangoli diagonalmente divisi (alto-sx/basso-dx)
 *
 * I mosaici curati sono fissi (estetica controllata). I procedurali
 * vengono generati a runtime con pattern geometrici parametrici.
 */

export type CellShape = "solid" | "diagonal-/" | "diagonal-\\";

export interface MosaicCell {
  /** Coordinata griglia 0-based. */
  col: number;
  row: number;
  /** Forma della cella. */
  shape: CellShape;
  /** Colore primario (riempie tutta la cella o triangolo principale). */
  color: string;
  /** Colore secondario per shape "diagonal-*". */
  color2?: string;
}

export interface MosaicDef {
  /** Identificatore stabile. */
  id: string;
  /** Nome user-facing (mostrato in anteprima). */
  nome: string;
  cols: number;
  rows: number;
  cells: MosaicCell[];
}

// ── Palette mediterranea (terracotta, ocra, blu, verde oliva) ──────────────

const C = {
  // pietra / sfondo
  pietra:       "#E8DECD",
  pietraScura:  "#C9B894",
  // mare / cielo
  blu:          "#3A6E94",
  bluChiaro:    "#7AAFD0",
  bluScuro:     "#27516E",
  // sole / ocra
  ocra:         "#E8A341",
  ocraChiaro:   "#F2C572",
  giallo:       "#F4D35E",
  // terracotta
  terracotta:   "#C0573B",
  terracottaCh: "#D88067",
  // verde oliva / natura
  oliva:        "#7A8F4A",
  olivaChiaro:  "#A3B673",
  olivaScuro:   "#5C6E36",
  // legno / tronco
  legno:        "#8B5A2B",
  legnoScuro:   "#5E3A1A",
  // bianco / nero
  bianco:       "#F5EFE6",
  nero:         "#2A2420",
  // ambigui (lv 7+): coppie quasi-identiche
  oliva_a:      "#7A8F4A",
  oliva_b:      "#84954F",  // 4-5 punti di differenza
  blu_a:        "#3A6E94",
  blu_b:        "#3F7298",
  terra_a:      "#C0573B",
  terra_b:      "#C45C40",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function solid(col: number, row: number, color: string): MosaicCell {
  return { col, row, shape: "solid", color };
}

// ── Mosaici curati (16 soggetti) ───────────────────────────────────────────

export const MOSAICI_CURATI: readonly MosaicDef[] = [
  // ── Soggetti semplici 8-9 frammenti (lv 4-5) ────────────────────────────
  {
    id: "sole",
    nome: "Il Sole",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, C.giallo),    solid(1,0, C.ocra),       solid(2,0, C.giallo),
      solid(0,1, C.ocra),      solid(1,1, C.ocraChiaro), solid(2,1, C.ocra),
      solid(0,2, C.giallo),    solid(1,2, C.ocra),       solid(2,2, C.giallo),
    ],
  },
  {
    id: "fiore",
    nome: "Il Fiore",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracotta),  solid(2,0, C.pietra),
      solid(0,1, C.terracotta),   solid(1,1, C.giallo),      solid(2,1, C.terracotta),
      solid(0,2, C.pietra),       solid(1,2, C.oliva),       solid(2,2, C.pietra),
    ],
  },
  {
    id: "cuore",
    nome: "Il Cuore",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, C.terracotta),     solid(1,0, C.pietra),         solid(2,0, C.terracotta),
      solid(0,1, C.terracotta),     solid(1,1, C.terracotta),     solid(2,1, C.terracotta),
      solid(0,2, C.pietra),         solid(1,2, C.terracotta),     solid(2,2, C.pietra),
    ],
  },

  // ── Soggetti 10-12 frammenti (lv 5-6) ───────────────────────────────────
  {
    id: "pesce",
    nome: "Il Pesce",
    cols: 4, rows: 3,
    cells: [
      solid(0,0, C.bluChiaro), solid(1,0, C.blu),       solid(2,0, C.blu),       solid(3,0, C.bluChiaro),
      solid(0,1, C.blu),       solid(1,1, C.bianco),    solid(2,1, C.bluScuro),  solid(3,1, C.ocra),
      solid(0,2, C.bluChiaro), solid(1,2, C.blu),       solid(2,2, C.blu),       solid(3,2, C.bluChiaro),
    ],
  },
  {
    id: "albero",
    nome: "L'Albero",
    cols: 3, rows: 4,
    cells: [
      solid(0,0, C.olivaChiaro), solid(1,0, C.oliva),       solid(2,0, C.olivaChiaro),
      solid(0,1, C.oliva),       solid(1,1, C.olivaScuro),  solid(2,1, C.oliva),
      solid(0,2, C.olivaChiaro), solid(1,2, C.oliva),       solid(2,2, C.olivaChiaro),
      solid(0,3, C.pietra),      solid(1,3, C.legno),       solid(2,3, C.pietra),
    ],
  },
  {
    id: "casa",
    nome: "La Casa",
    cols: 3, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracotta),     solid(2,0, C.pietra),
      solid(0,1, C.terracotta),   solid(1,1, C.terracotta),     solid(2,1, C.terracotta),
      solid(0,2, C.pietraScura),  solid(1,2, C.legnoScuro),     solid(2,2, C.pietraScura),
      solid(0,3, C.pietraScura),  solid(1,3, C.legnoScuro),     solid(2,3, C.pietraScura),
    ],
  },

  // ── Soggetti 12-16 frammenti (lv 6-8) ───────────────────────────────────
  {
    id: "barca",
    nome: "La Barca",
    cols: 4, rows: 4,
    cells: [
      solid(0,0, C.bluChiaro),    solid(1,0, C.bluChiaro),    solid(2,0, C.bianco),       solid(3,0, C.bluChiaro),
      solid(0,1, C.bluChiaro),    solid(1,1, C.bianco),       solid(2,1, C.legno),        solid(3,1, C.bluChiaro),
      solid(0,2, C.terracotta),   solid(1,2, C.legno),        solid(2,2, C.legno),        solid(3,2, C.terracotta),
      solid(0,3, C.blu),          solid(1,3, C.blu),          solid(2,3, C.blu),          solid(3,3, C.blu),
    ],
  },
  {
    id: "uva",
    nome: "Il Grappolo",
    cols: 4, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.oliva),        solid(2,0, C.oliva),        solid(3,0, C.pietra),
      solid(0,1, C.pietra),       solid(1,1, C.bluScuro),     solid(2,1, C.bluScuro),     solid(3,1, C.pietra),
      solid(0,2, C.bluScuro),     solid(1,2, C.bluScuro),     solid(2,2, C.bluScuro),     solid(3,2, C.bluScuro),
      solid(0,3, C.pietra),       solid(1,3, C.bluScuro),     solid(2,3, C.bluScuro),     solid(3,3, C.pietra),
    ],
  },
  {
    id: "gatto",
    nome: "Il Gatto",
    cols: 4, rows: 4,
    cells: [
      solid(0,0, C.ocra),         solid(1,0, C.pietra),       solid(2,0, C.pietra),       solid(3,0, C.ocra),
      solid(0,1, C.ocra),         solid(1,1, C.nero),         solid(2,1, C.nero),         solid(3,1, C.ocra),
      solid(0,2, C.ocra),         solid(1,2, C.ocra),         solid(2,2, C.ocra),         solid(3,2, C.ocra),
      solid(0,3, C.pietra),       solid(1,3, C.ocra),         solid(2,3, C.ocra),         solid(3,3, C.pietra),
    ],
  },

  // ── Soggetti complessi 16-20 frammenti (lv 8-10) con colori ambigui ─────
  {
    id: "paesaggio",
    nome: "Il Paesaggio",
    cols: 5, rows: 4,
    cells: [
      solid(0,0, C.blu_a),      solid(1,0, C.blu_a),      solid(2,0, C.blu_b),      solid(3,0, C.blu_a),      solid(4,0, C.blu_b),
      solid(0,1, C.bluChiaro),  solid(1,1, C.giallo),     solid(2,1, C.bluChiaro),  solid(3,1, C.giallo),     solid(4,1, C.bluChiaro),
      solid(0,2, C.oliva_a),    solid(1,2, C.oliva_b),    solid(2,2, C.oliva_a),    solid(3,2, C.oliva_b),    solid(4,2, C.oliva_a),
      solid(0,3, C.olivaScuro), solid(1,3, C.oliva_a),    solid(2,3, C.olivaScuro), solid(3,3, C.oliva_a),    solid(4,3, C.olivaScuro),
    ],
  },
  {
    id: "ulivo",
    nome: "L'Ulivo",
    cols: 4, rows: 4,
    cells: [
      solid(0,0, C.oliva_a),    solid(1,0, C.oliva_b),    solid(2,0, C.oliva_a),    solid(3,0, C.oliva_b),
      solid(0,1, C.oliva_b),    solid(1,1, C.olivaScuro), solid(2,1, C.olivaScuro), solid(3,1, C.oliva_a),
      solid(0,2, C.oliva_a),    solid(1,2, C.legno),      solid(2,2, C.legno),      solid(3,2, C.oliva_b),
      solid(0,3, C.pietraScura),solid(1,3, C.legnoScuro), solid(2,3, C.legnoScuro), solid(3,3, C.pietraScura),
    ],
  },
  {
    id: "anfora",
    nome: "L'Anfora",
    cols: 4, rows: 5,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracotta),   solid(2,0, C.terracotta),   solid(3,0, C.pietra),
      solid(0,1, C.pietra),       solid(1,1, C.terra_a),      solid(2,1, C.terra_b),      solid(3,1, C.pietra),
      solid(0,2, C.terra_a),      solid(1,2, C.terra_b),      solid(2,2, C.terra_a),      solid(3,2, C.terra_b),
      solid(0,3, C.terra_b),      solid(1,3, C.terra_a),      solid(2,3, C.terra_b),      solid(3,3, C.terra_a),
      solid(0,4, C.pietra),       solid(1,4, C.terra_a),      solid(2,4, C.terra_b),      solid(3,4, C.pietra),
    ],
  },
  {
    id: "uccello",
    nome: "L'Uccellino",
    cols: 5, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.blu_a),        solid(2,0, C.blu_b),        solid(3,0, C.blu_a),        solid(4,0, C.pietra),
      solid(0,1, C.blu_a),        solid(1,1, C.blu_b),        solid(2,1, C.bianco),       solid(3,1, C.blu_a),        solid(4,1, C.ocra),
      solid(0,2, C.blu_a),        solid(1,2, C.blu_b),        solid(2,2, C.blu_a),        solid(3,2, C.blu_b),        solid(4,2, C.pietra),
      solid(0,3, C.pietra),       solid(1,3, C.legno),        solid(2,3, C.legnoScuro),   solid(3,3, C.legno),        solid(4,3, C.pietra),
    ],
  },
  {
    id: "tartaruga",
    nome: "La Tartaruga",
    cols: 5, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.oliva_a),      solid(2,0, C.oliva_b),      solid(3,0, C.oliva_a),      solid(4,0, C.pietra),
      solid(0,1, C.oliva_b),      solid(1,1, C.olivaScuro),   solid(2,1, C.oliva_a),      solid(3,1, C.olivaScuro),   solid(4,1, C.oliva_b),
      solid(0,2, C.oliva_a),      solid(1,2, C.oliva_b),      solid(2,2, C.olivaScuro),   solid(3,2, C.oliva_b),      solid(4,2, C.oliva_a),
      solid(0,3, C.olivaScuro),   solid(1,3, C.pietra),       solid(2,3, C.olivaChiaro),  solid(3,3, C.pietra),       solid(4,3, C.olivaScuro),
    ],
  },
  {
    id: "lumaca",
    nome: "La Lumaca",
    cols: 5, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terra_a),      solid(2,0, C.terra_b),      solid(3,0, C.terra_a),      solid(4,0, C.pietra),
      solid(0,1, C.terra_b),      solid(1,1, C.ocra),         solid(2,1, C.ocraChiaro),   solid(3,1, C.terra_b),      solid(4,1, C.pietra),
      solid(0,2, C.terra_a),      solid(1,2, C.ocraChiaro),   solid(2,2, C.ocra),         solid(3,2, C.terra_a),      solid(4,2, C.olivaChiaro),
      solid(0,3, C.pietra),       solid(1,3, C.terra_a),      solid(2,3, C.terra_b),      solid(3,3, C.olivaChiaro),  solid(4,3, C.pietra),
    ],
  },
  {
    id: "rosa",
    nome: "La Rosa",
    cols: 4, rows: 5,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terra_a),      solid(2,0, C.terra_b),      solid(3,0, C.pietra),
      solid(0,1, C.terra_b),      solid(1,1, C.terracotta),   solid(2,1, C.terracottaCh), solid(3,1, C.terra_a),
      solid(0,2, C.terra_a),      solid(1,2, C.terracottaCh), solid(2,2, C.terracotta),   solid(3,2, C.terra_b),
      solid(0,3, C.pietra),       solid(1,3, C.oliva_a),      solid(2,3, C.oliva_b),      solid(3,3, C.pietra),
      solid(0,4, C.pietra),       solid(1,4, C.oliva_b),      solid(2,4, C.olivaScuro),   solid(3,4, C.pietra),
    ],
  },

  // ── Set 2: icone familiari semplici (lv 4-7) ──────────────────────────────
  {
    id: "chiave",
    nome: "La Chiave",
    cols: 4, rows: 3,
    cells: [
      solid(0,0, C.ocra),         solid(1,0, C.ocraChiaro),   solid(2,0, C.pietra),       solid(3,0, C.pietra),
      solid(0,1, C.ocra),         solid(1,1, C.ocra),         solid(2,1, C.ocra),         solid(3,1, C.ocra),
      solid(0,2, C.ocra),         solid(1,2, C.ocraChiaro),   solid(2,2, C.pietra),       solid(3,2, C.ocra),
    ],
  },
  {
    id: "fungo",
    nome: "Il Fungo",
    cols: 3, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracotta),   solid(2,0, C.pietra),
      solid(0,1, C.terracotta),   solid(1,1, C.bianco),       solid(2,1, C.terracotta),
      solid(0,2, C.terracottaCh), solid(1,2, C.terracotta),   solid(2,2, C.terracottaCh),
      solid(0,3, C.pietra),       solid(1,3, C.pietraScura),  solid(2,3, C.pietra),
    ],
  },
  {
    id: "candela",
    nome: "La Candela",
    cols: 3, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.giallo),       solid(2,0, C.pietra),
      solid(0,1, C.pietra),       solid(1,1, C.ocra),         solid(2,1, C.pietra),
      solid(0,2, C.bianco),       solid(1,2, C.bianco),       solid(2,2, C.bianco),
      solid(0,3, C.legno),        solid(1,3, C.legno),        solid(2,3, C.legno),
    ],
  },
  {
    id: "stella",
    nome: "La Stella",
    cols: 5, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.pietra),       solid(2,0, C.giallo),       solid(3,0, C.pietra),       solid(4,0, C.pietra),
      solid(0,1, C.giallo),       solid(1,1, C.giallo),       solid(2,1, C.giallo),       solid(3,1, C.giallo),       solid(4,1, C.giallo),
      solid(0,2, C.pietra),       solid(1,2, C.giallo),       solid(2,2, C.ocra),         solid(3,2, C.giallo),       solid(4,2, C.pietra),
      solid(0,3, C.giallo),       solid(1,3, C.pietra),       solid(2,3, C.pietra),       solid(3,3, C.pietra),       solid(4,3, C.giallo),
    ],
  },
  {
    id: "tazzina",
    nome: "La Tazzina",
    cols: 4, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.pietra),       solid(2,0, C.pietra),       solid(3,0, C.pietra),
      solid(0,1, C.bianco),       solid(1,1, C.legnoScuro),   solid(2,1, C.legnoScuro),   solid(3,1, C.bianco),
      solid(0,2, C.bianco),       solid(1,2, C.bianco),       solid(2,2, C.bianco),       solid(3,2, C.bianco),
      solid(0,3, C.pietra),       solid(1,3, C.pietraScura),  solid(2,3, C.pietraScura),  solid(3,3, C.pietra),
    ],
  },
  {
    id: "anguria",
    nome: "L'Anguria",
    cols: 4, rows: 3,
    cells: [
      solid(0,0, C.oliva),        solid(1,0, C.olivaChiaro),  solid(2,0, C.olivaChiaro),  solid(3,0, C.oliva),
      solid(0,1, C.bianco),       solid(1,1, C.bianco),       solid(2,1, C.bianco),       solid(3,1, C.bianco),
      solid(0,2, C.terracotta),   solid(1,2, C.terracottaCh), solid(2,2, C.terracotta),   solid(3,2, C.terracottaCh),
    ],
  },
  {
    id: "coccinella",
    nome: "La Coccinella",
    cols: 4, rows: 3,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.nero),         solid(2,0, C.nero),         solid(3,0, C.pietra),
      solid(0,1, C.terracotta),   solid(1,1, C.nero),         solid(2,1, C.nero),         solid(3,1, C.terracotta),
      solid(0,2, C.terracotta),   solid(1,2, C.terracotta),   solid(2,2, C.terracotta),   solid(3,2, C.terracotta),
    ],
  },
  {
    id: "conchiglia",
    nome: "La Conchiglia",
    cols: 4, rows: 3,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracottaCh), solid(2,0, C.terracottaCh), solid(3,0, C.pietra),
      solid(0,1, C.terracottaCh), solid(1,1, C.terracotta),   solid(2,1, C.terracotta),   solid(3,1, C.terracottaCh),
      solid(0,2, C.terracotta),   solid(1,2, C.terra_a),      solid(2,2, C.terra_b),      solid(3,2, C.terracotta),
    ],
  },
  {
    id: "cupcake",
    nome: "Il Dolce",
    cols: 3, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracottaCh), solid(2,0, C.pietra),
      solid(0,1, C.terracottaCh), solid(1,1, C.terracotta),   solid(2,1, C.terracottaCh),
      solid(0,2, C.bianco),       solid(1,2, C.bianco),       solid(2,2, C.bianco),
      solid(0,3, C.ocra),         solid(1,3, C.ocraChiaro),   solid(2,3, C.ocra),
    ],
  },

  // ── Set 3: icone complesse (lv 8-10) ──────────────────────────────────────
  {
    id: "farfalla",
    nome: "La Farfalla",
    cols: 5, rows: 4,
    cells: [
      solid(0,0, C.blu_a),        solid(1,0, C.blu_b),        solid(2,0, C.nero),         solid(3,0, C.blu_b),        solid(4,0, C.blu_a),
      solid(0,1, C.blu_b),        solid(1,1, C.bluChiaro),    solid(2,1, C.nero),         solid(3,1, C.bluChiaro),    solid(4,1, C.blu_b),
      solid(0,2, C.bluChiaro),    solid(1,2, C.blu_a),        solid(2,2, C.nero),         solid(3,2, C.blu_a),        solid(4,2, C.bluChiaro),
      solid(0,3, C.pietra),       solid(1,3, C.blu_b),        solid(2,3, C.nero),         solid(3,3, C.blu_b),        solid(4,3, C.pietra),
    ],
  },
  {
    id: "ancora",
    nome: "L'Ancora",
    cols: 4, rows: 4,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.bluScuro),     solid(2,0, C.bluScuro),     solid(3,0, C.pietra),
      solid(0,1, C.pietra),       solid(1,1, C.blu_a),        solid(2,1, C.blu_b),        solid(3,1, C.pietra),
      solid(0,2, C.bluScuro),     solid(1,2, C.blu_b),        solid(2,2, C.blu_a),        solid(3,2, C.bluScuro),
      solid(0,3, C.pietra),       solid(1,3, C.bluScuro),     solid(2,3, C.bluScuro),     solid(3,3, C.pietra),
    ],
  },
  {
    id: "faro",
    nome: "Il Faro",
    cols: 3, rows: 5,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.giallo),       solid(2,0, C.pietra),
      solid(0,1, C.terra_a),      solid(1,1, C.terra_b),      solid(2,1, C.terra_a),
      solid(0,2, C.bianco),       solid(1,2, C.terra_b),      solid(2,2, C.bianco),
      solid(0,3, C.terra_a),      solid(1,3, C.terra_b),      solid(2,3, C.terra_a),
      solid(0,4, C.pietraScura),  solid(1,4, C.pietraScura),  solid(2,4, C.pietraScura),
    ],
  },
  {
    id: "gelato",
    nome: "Il Gelato",
    cols: 3, rows: 5,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.terracottaCh), solid(2,0, C.pietra),
      solid(0,1, C.terracottaCh), solid(1,1, C.terracotta),   solid(2,1, C.terracottaCh),
      solid(0,2, C.bianco),       solid(1,2, C.bianco),       solid(2,2, C.bianco),
      solid(0,3, C.pietra),       solid(1,3, C.ocra),         solid(2,3, C.pietra),
      solid(0,4, C.pietra),       solid(1,4, C.ocraChiaro),   solid(2,4, C.pietra),
    ],
  },
  {
    id: "margherita",
    nome: "La Margherita",
    cols: 5, rows: 5,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.bianco),       solid(2,0, C.bianco),       solid(3,0, C.bianco),       solid(4,0, C.pietra),
      solid(0,1, C.bianco),       solid(1,1, C.bianco),       solid(2,1, C.giallo),       solid(3,1, C.bianco),       solid(4,1, C.bianco),
      solid(0,2, C.bianco),       solid(1,2, C.giallo),       solid(2,2, C.ocra),         solid(3,2, C.giallo),       solid(4,2, C.bianco),
      solid(0,3, C.pietra),       solid(1,3, C.oliva_a),      solid(2,3, C.oliva_b),      solid(3,3, C.oliva_a),      solid(4,3, C.pietra),
      solid(0,4, C.pietra),       solid(1,4, C.pietra),       solid(2,4, C.olivaScuro),   solid(3,4, C.pietra),       solid(4,4, C.pietra),
    ],
  },
  {
    id: "limone",
    nome: "Il Limone",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, C.pietra),       solid(1,0, C.giallo),       solid(2,0, C.pietra),
      solid(0,1, C.giallo),       solid(1,1, C.ocraChiaro),   solid(2,1, C.giallo),
      solid(0,2, C.pietra),       solid(1,2, C.oliva_b),      solid(2,2, C.pietra),
    ],
  },
];

// ── Generatori procedurali (lv 1-3) ────────────────────────────────────────

const PROC_PALETTES: ReadonlyArray<readonly [string, string]> = [
  [C.terracotta, C.pietra],
  [C.blu, C.bluChiaro],
  [C.oliva, C.olivaChiaro],
  [C.ocra, C.pietra],
  [C.bluScuro, C.giallo],
  [C.terracotta, C.giallo],
  [C.olivaScuro, C.bianco],
  [C.bluScuro, C.terracottaCh],
  [C.legno, C.ocraChiaro],
  [C.bluChiaro, C.bianco],
  [C.terracottaCh, C.bluScuro],
  [C.giallo, C.olivaScuro],
  [C.ocra, C.bluChiaro],
];

/** Palette a 4 colori per pattern policromi (lv 1-2). */
const PROC_PALETTES_QUAD: ReadonlyArray<readonly [string, string, string, string]> = [
  [C.terracotta, C.giallo, C.blu, C.oliva],
  [C.ocra, C.bluScuro, C.terracottaCh, C.olivaChiaro],
  [C.blu, C.giallo, C.terracotta, C.bianco],
  [C.oliva, C.terracotta, C.ocra, C.bluChiaro],
  [C.pietra, C.terracotta, C.oliva, C.bluScuro],
];

/** Pattern: croce centrale 2×2 con bordi pietra (4 frammenti se 2×2, 9 se 3×3). */
function procCroce(size: 2 | 3, palette: readonly [string, string]): MosaicDef {
  const [primario, secondario] = palette;
  const cells: MosaicCell[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isCenter = size === 3 ? (r === 1 || c === 1) : true;
      cells.push(solid(c, r, isCenter ? primario : secondario));
    }
  }
  return { id: `proc-croce-${size}-${primario}`, nome: "Croce", cols: size, rows: size, cells };
}

/** Pattern: scacchiera 2×2 o 2×3. */
function procScacchiera(cols: 2 | 3, rows: 2, palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  const cells: MosaicCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(solid(c, r, (c + r) % 2 === 0 ? a : b));
    }
  }
  return { id: `proc-scacchi-${cols}x${rows}-${a}`, nome: "Scacchiera", cols, rows, cells };
}

/** Pattern: cornice — bordi colore A, centro colore B (3×3, 8 frammenti utili). */
function procCornice(palette: readonly [string, string]): MosaicDef {
  const [bordo, centro] = palette;
  const cells: MosaicCell[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const isCenter = r === 1 && c === 1;
      cells.push(solid(c, r, isCenter ? centro : bordo));
    }
  }
  return { id: `proc-cornice-${bordo}`, nome: "Cornice", cols: 3, rows: 3, cells };
}

/** Pattern: diagonale — alterna colori sulle diagonali (4 celle 2×2). */
function procDiagonale(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-diag-${a}`,
    nome: "Diagonale",
    cols: 2, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b),
      solid(0,1, b), solid(1,1, a),
    ],
  };
}

/** Pattern: due strisce orizzontali — alto A, basso B (2×2). */
function procStriscaOrizz(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-striscia-h-${a}`,
    nome: "Strisce",
    cols: 2, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, a),
      solid(0,1, b), solid(1,1, b),
    ],
  };
}

/** Pattern: due strisce verticali — sinistra A, destra B (2×2). */
function procStriscaVert(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-striscia-v-${a}`,
    nome: "Colonne",
    cols: 2, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b),
      solid(0,1, a), solid(1,1, b),
    ],
  };
}

/** Pattern: 3 celle colore A + 1 angolo B (4 varianti per quadrante, 2×2). */
function procAngoloUnico(palette: readonly [string, string], angolo: 0|1|2|3): MosaicDef {
  const [a, b] = palette;
  const cells: MosaicCell[] = [
    solid(0,0, angolo === 0 ? b : a),
    solid(1,0, angolo === 1 ? b : a),
    solid(0,1, angolo === 2 ? b : a),
    solid(1,1, angolo === 3 ? b : a),
  ];
  return { id: `proc-angolo-${angolo}-${a}`, nome: "Angolo", cols: 2, rows: 2, cells };
}

/** Pattern: 4 colori distinti uno per cella (2×2 policromo). */
function procQuattroColori(palette: readonly [string, string, string, string]): MosaicDef {
  const [a, b, c, d] = palette;
  return {
    id: `proc-quattro-${a}`,
    nome: "Quattro",
    cols: 2, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b),
      solid(0,1, c), solid(1,1, d),
    ],
  };
}

/** Pattern: tre colonne verticali ABA (3×2 = 6 frammenti). */
function procTreColonne(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-3col-${a}`,
    nome: "Tre Colonne",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, a),
      solid(0,1, a), solid(1,1, b), solid(2,1, a),
    ],
  };
}

/** Pattern: L invertita su 3×2 (6 frammenti). */
function procL_3x2(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-l32-${a}`,
    nome: "L corta",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, b),
      solid(0,1, a), solid(1,1, a), solid(2,1, a),
    ],
  };
}

/** Pattern: T orizzontale su 3×2 (6 frammenti). */
function procT_3x2(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-t32-${a}`,
    nome: "T corta",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, a), solid(2,0, a),
      solid(0,1, b), solid(1,1, a), solid(2,1, b),
    ],
  };
}

/** Pattern: freccia compatta su 3×2 (6 frammenti). */
function procFreccia_3x2(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-frec32-${a}`,
    nome: "Freccia",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, b), solid(1,0, a), solid(2,0, b),
      solid(0,1, a), solid(1,1, a), solid(2,1, a),
    ],
  };
}

/** Pattern: V su 3×2 (6 frammenti). */
function procV_3x2(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-v32-${a}`,
    nome: "V",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, a),
      solid(0,1, b), solid(1,1, a), solid(2,1, b),
    ],
  };
}

/** Pattern: due strisce orizzontali su 3×2 (6 frammenti). */
function procStriscaOrizz_3x2(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-h32-${a}`,
    nome: "Bande",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, a), solid(2,0, a),
      solid(0,1, b), solid(1,1, b), solid(2,1, b),
    ],
  };
}

/**
 * Pattern: meander romano (greca) — 3×3, bordo che si "piega" su un lato.
 * Pattern classico delle bordure di mosaici romani.
 */
function procMeander(palette: readonly [string, string]): MosaicDef {
  const [linea, fondo] = palette;
  return {
    id: `proc-meander-${linea}`,
    nome: "Greca",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, linea), solid(1,0, linea), solid(2,0, linea),
      solid(0,1, linea), solid(1,1, fondo), solid(2,1, fondo),
      solid(0,2, linea), solid(1,2, linea), solid(2,2, fondo),
    ],
  };
}

/**
 * Pattern: doppia cornice — bordo esterno colore A, bordo interno colore B,
 * centro colore A. 3×3 con tutti gli stessi colori sui bordi.
 */
function procDoppiaCornice(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-doppia-${a}`,
    nome: "Doppia Cornice",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, a),
      solid(0,1, b), solid(1,1, a), solid(2,1, b),
      solid(0,2, a), solid(1,2, b), solid(2,2, a),
    ],
  };
}

/** Pattern: tre fasce orizzontali alternate colore A/B/A. */
function procFasce(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-fasce-${a}`,
    nome: "Fasce",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, a), solid(2,0, a),
      solid(0,1, b), solid(1,1, b), solid(2,1, b),
      solid(0,2, a), solid(1,2, a), solid(2,2, a),
    ],
  };
}

/** Pattern: T-shape — fila superiore + colonna centrale colore A, resto B (3×3). */
function procT(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-t-${a}`,
    nome: "T",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, a), solid(2,0, a),
      solid(0,1, b), solid(1,1, a), solid(2,1, b),
      solid(0,2, b), solid(1,2, a), solid(2,2, b),
    ],
  };
}

/** Pattern: L-shape — colonna sinistra + fila inferiore colore A, resto B (3×3). */
function procL(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-l-${a}`,
    nome: "L",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, b),
      solid(0,1, a), solid(1,1, b), solid(2,1, b),
      solid(0,2, a), solid(1,2, a), solid(2,2, a),
    ],
  };
}

/** Pattern: X diagonale — entrambe le diagonali colore A, resto B (3×3). */
function procX(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-x-${a}`,
    nome: "X",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, a),
      solid(0,1, b), solid(1,1, a), solid(2,1, b),
      solid(0,2, a), solid(1,2, b), solid(2,2, a),
    ],
  };
}

/** Pattern: clessidra — triangoli orizzontali alto/basso colore A, centro B (3×3). */
function procClessidra(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-clessidra-${a}`,
    nome: "Clessidra",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, a), solid(2,0, a),
      solid(0,1, b), solid(1,1, a), solid(2,1, b),
      solid(0,2, a), solid(1,2, a), solid(2,2, a),
    ],
  };
}

/** Pattern: tre colonne verticali alternate (3×2 = 6 frammenti). */
function procColonne(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-colonne-${a}`,
    nome: "Colonne",
    cols: 3, rows: 2,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, a),
      solid(0,1, a), solid(1,1, b), solid(2,1, a),
    ],
  };
}

/** Pattern: freccia verso destra (3×3). */
function procFreccia(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-freccia-${a}`,
    nome: "Freccia",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, b), solid(1,0, a), solid(2,0, b),
      solid(0,1, a), solid(1,1, a), solid(2,1, a),
      solid(0,2, b), solid(1,2, a), solid(2,2, b),
    ],
  };
}

/** Pattern: angoli — 4 angoli colore A, croce centrale colore B (3×3). */
function procAngoli(palette: readonly [string, string]): MosaicDef {
  const [a, b] = palette;
  return {
    id: `proc-angoli-${a}`,
    nome: "Angoli",
    cols: 3, rows: 3,
    cells: [
      solid(0,0, a), solid(1,0, b), solid(2,0, a),
      solid(0,1, b), solid(1,1, b), solid(2,1, b),
      solid(0,2, a), solid(1,2, b), solid(2,2, a),
    ],
  };
}

/** Sceglie un mosaico procedurale per il livello richiesto. */
export function generateProceduralMosaic(livello: number): MosaicDef {
  const palette = PROC_PALETTES[Math.floor(Math.random() * PROC_PALETTES.length)];
  const quadPalette = PROC_PALETTES_QUAD[Math.floor(Math.random() * PROC_PALETTES_QUAD.length)];

  if (livello === 1) {
    // 4 frammenti — pattern 2×2 semplici (9 pattern × varie palette)
    const generators = [
      () => procDiagonale(palette),
      () => procStriscaOrizz(palette),
      () => procStriscaVert(palette),
      () => procAngoloUnico(palette, 0),
      () => procAngoloUnico(palette, 1),
      () => procAngoloUnico(palette, 2),
      () => procAngoloUnico(palette, 3),
      () => procQuattroColori(quadPalette),
    ];
    return generators[Math.floor(Math.random() * generators.length)]();
  }

  if (livello === 2) {
    // 4-6 frammenti — 2×2 e 3×2
    const generators = [
      // 2×2 base
      () => procDiagonale(palette),
      () => procStriscaOrizz(palette),
      () => procStriscaVert(palette),
      () => procAngoloUnico(palette, 0),
      () => procAngoloUnico(palette, 1),
      () => procAngoloUnico(palette, 2),
      () => procAngoloUnico(palette, 3),
      () => procQuattroColori(quadPalette),
      // 3×2 = 6 frammenti
      () => procScacchiera(3, 2, palette),
      () => procColonne(palette),
      () => procTreColonne(palette),
      () => procStriscaOrizz_3x2(palette),
      () => procL_3x2(palette),
      () => procT_3x2(palette),
      () => procFreccia_3x2(palette),
      () => procV_3x2(palette),
      () => procCroce(2, palette),
    ];
    return generators[Math.floor(Math.random() * generators.length)]();
  }

  // livello 3: 6-9 frammenti — pattern 3×3 incluse forme romane e icone
  const generators = [
    () => procScacchiera(3, 2, palette),
    () => procTreColonne(palette),
    () => procL_3x2(palette),
    () => procT_3x2(palette),
    () => procFreccia_3x2(palette),
    () => procV_3x2(palette),
    () => procCroce(3, palette),
    () => procCornice(palette),
    () => procMeander(palette),
    () => procDoppiaCornice(palette),
    () => procFasce(palette),
    () => procT(palette),
    () => procL(palette),
    () => procX(palette),
    () => procClessidra(palette),
    () => procFreccia(palette),
    () => procAngoli(palette),
    () => procColonne(palette),
  ];
  return generators[Math.floor(Math.random() * generators.length)]();
}

/** Sceglie un mosaico curato adatto al range frammenti richiesto. */
export function pickCuratedMosaic(fragmentsMin: number, fragmentsMax: number, excludeId?: string): MosaicDef {
  const candidati = MOSAICI_CURATI.filter(m => {
    const n = m.cells.length;
    return n >= fragmentsMin && n <= fragmentsMax && m.id !== excludeId;
  });
  if (candidati.length === 0) {
    // fallback: il più vicino in size
    const sorted = [...MOSAICI_CURATI].sort((a, b) =>
      Math.abs(a.cells.length - fragmentsMin) - Math.abs(b.cells.length - fragmentsMin)
    );
    return sorted[0];
  }
  return candidati[Math.floor(Math.random() * candidati.length)];
}
