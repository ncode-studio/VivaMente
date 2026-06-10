/**
 * Livelli per "Il Restauratore" — Visuospaziali · Find the differences su dipinti.
 *
 * Dominio: Visuospaziali (categoria_id = "visuospaziali").
 * Modello: B (trial-based) — 3 trial valutativi per sessione (3 dipinti),
 * niente timer di sessione.
 *
 * Flow per trial:
 *   1. Due versioni del dipinto affiancate (Originale vs Da Restaurare).
 *   2. Il giocatore tocca le differenze su uno qualsiasi dei due dipinti.
 *   3. Quando tutte le differenze sono trovate i dipinti si "illuminano"
 *      come restaurati, poi parte il trial successivo.
 *
 * Progressione 10 livelli:
 *   - differenze per dipinto: 3 → 8
 *   - dipinti: da composizioni semplici (natura morta a 6 oggetti) a
 *     dense (paesaggi con orizzonte, figure, dettagli).
 *   - tipi di modifica (#13): SOLO due categorie affidabili e sempre visibili
 *       • "color"             → stesso oggetto, colore diverso
 *       • "added" / "removed" → oggetto presente in un dipinto e assente nell'altro
 *     I tipi "scale", "moved", "rotate" sono stati rimossi: producevano
 *     differenze non percepibili (es. rotazione di una forma simmetrica) o
 *     esteticamente sgradevoli (sovrapposizioni, oggetti sproporzionati).
 *       lv 1   : solo "color"
 *       lv 2+  : "color" + "removed"/"added" (oggetti che spariscono/compaiono)
 */

export type RestauroPaintingId = "natura_morta" | "paesaggio" | "ritratto";

export type RestauroDiffType =
  | "color"
  | "moved"
  | "scale"
  | "rotate"
  | "added"
  | "removed";

export interface RestauratoreLevelConfig {
  livello: number;
  /** Numero di differenze tra le due versioni del dipinto. */
  nDifferenze: number;
  /** Pool di dipinti che possono essere proposti per il livello. */
  dipintiAmmessi: readonly RestauroPaintingId[];
  /** Tipi di modifica possibili per il livello. */
  tipiAmmessi: readonly RestauroDiffType[];
  /**
   * Intensità delle modifiche cromatiche/scala (0.5 = poco percettibili,
   * 1.0 = molto evidenti). Modula `cromaShift` e `scaleShift` nel mutation
   * engine così le prime differenze sono molto leggibili.
   */
  intensita: number;
}

export const RESTAURATORE_LEVELS: readonly RestauratoreLevelConfig[] = [
  { livello:  1, nDifferenze: 3, dipintiAmmessi: ["natura_morta"],                              tipiAmmessi: ["color"],                       intensita: 1.00 },
  { livello:  2, nDifferenze: 3, dipintiAmmessi: ["natura_morta", "paesaggio"],                  tipiAmmessi: ["color", "removed"],            intensita: 0.95 },
  { livello:  3, nDifferenze: 4, dipintiAmmessi: ["natura_morta", "paesaggio"],                  tipiAmmessi: ["color", "added", "removed"],   intensita: 0.90 },
  { livello:  4, nDifferenze: 4, dipintiAmmessi: ["natura_morta", "paesaggio"],                  tipiAmmessi: ["color", "added", "removed"],   intensita: 0.85 },
  { livello:  5, nDifferenze: 5, dipintiAmmessi: ["natura_morta", "paesaggio", "ritratto"],      tipiAmmessi: ["color", "added", "removed"],   intensita: 0.80 },
  { livello:  6, nDifferenze: 5, dipintiAmmessi: ["natura_morta", "paesaggio", "ritratto"],      tipiAmmessi: ["color", "added", "removed"],   intensita: 0.75 },
  { livello:  7, nDifferenze: 6, dipintiAmmessi: ["natura_morta", "paesaggio", "ritratto"],      tipiAmmessi: ["color", "added", "removed"],   intensita: 0.70 },
  { livello:  8, nDifferenze: 6, dipintiAmmessi: ["natura_morta", "paesaggio", "ritratto"],      tipiAmmessi: ["color", "added", "removed"],   intensita: 0.65 },
  { livello:  9, nDifferenze: 7, dipintiAmmessi: ["natura_morta", "paesaggio", "ritratto"],      tipiAmmessi: ["color", "added", "removed"],   intensita: 0.60 },
  { livello: 10, nDifferenze: 7, dipintiAmmessi: ["natura_morta", "paesaggio", "ritratto"],      tipiAmmessi: ["color", "added", "removed"],   intensita: 0.55 },
] as const;

export const RESTAURATORE_TRIAL_VALUTATIVI = 3;

export function getRestauratoreLevel(livello: number): RestauratoreLevelConfig {
  return RESTAURATORE_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getRestauratoreMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  // #13: l'unica nuova meccanica oltre al colore è "oggetto presente/assente",
  // che inizia dal livello 2.
  if (livelloPrec !== null && livelloPrec <= 1 && livello >= 2) {
    return {
      titolo: "Oggetti che spariscono",
      testo: "Oltre ai colori diversi, ora un oggetto può essere presente in un dipinto e mancare nell'altro. Cerca anche ciò che c'è di troppo o di meno.",
    };
  }
  return null;
}

export const RESTAURATORE_PALETTE = {
  bg:         "#F2E9D5",   // pergamena chiara
  bgDeep:     "#E8DCC2",
  ink:        "#3A2A18",
  inkSoft:    "#7A6242",
  frame:      "#8C6A3D",   // cornice museale
  frameDark:  "#5A4423",
  ok:         "#15803D",
  found:      "#0E7A3A",
  hint:       "#B45309",
  shimmer:    "#F2D188",
} as const;
