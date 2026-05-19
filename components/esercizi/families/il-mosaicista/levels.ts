/**
 * Livelli per "Il Mosaicista".
 *
 * Dominio: Visuospaziale — atelier di restauro mosaici. Il giocatore
 * trascina frammenti SVG nelle posizioni corrette di una griglia per
 * ricostruire un'immagine target (soggetto familiare).
 *
 * Modello A — timer sessione 90s, mosaici a catena. Score composito
 * combina correttezza e velocità; accuratezza valutativa = % drop
 * corretti al primo tentativo.
 *
 * Progressione (10 livelli):
 *   - lv 1–3 : geometrici procedurali, 4-6 frammenti grandi, no rotazione
 *   - lv 4–7 : soggetti figurativi curati, 8-12 frammenti, no rotazione
 *   - lv 8–10: soggetti complessi 16-20 frammenti, alcuni colori
 *              quasi-identici, rotazione 90° richiesta
 */

export const MOSAICISTA_SESSION_TIMER_MS = 60_000;

/** Lato cella in px nell'area di gioco. Touch target over 60. */
export const CELL_SIZE_PX_BY_LEVEL: Record<number, number> = {
  1: 92, 2: 88, 3: 84, 4: 80, 5: 76, 6: 72, 7: 68, 8: 66, 9: 62, 10: 58,
};

/** Raggio di snap magnetico (frazione del lato cella). */
export const SNAP_RADIUS_FRACTION = 0.55;

export type MosaicSourceKind = "procedural" | "curato";

export interface MosaicistaLevelConfig {
  livello: number;
  /** Quali sorgenti di mosaico campionare per questo livello. */
  source: MosaicSourceKind;
  /** Min/max numero di frammenti del mosaico da pescare. */
  fragmentsMin: number;
  fragmentsMax: number;
  /** Rotazione richiesta prima del drop (in alcuni frammenti). */
  rotazioneAttiva: boolean;
  /** Percentuale di frammenti con rotazione random iniziale (0-1). */
  rotazioneRatio: number;
  /** Colori quasi-identici tra frammenti diversi (lv 8+). */
  coloriAmbigui: boolean;
  /**
   * Tempo limite per singolo mosaico (ms). Usato per il bonus velocità
   * dello score composito. Oltre il T.Lim il mosaico vale solo per
   * correttezza, senza bonus.
   */
  tLimMosaicoMs: number;
  /**
   * Tempo di esposizione del modello (ms) prima della fase di ricostruzione.
   * Cresce con livello (più frammenti = più tempo per memorizzare).
   */
  previewMs: number;
  /** Lato cella in px (touch target). */
  cellSizePx: number;
}

export const MOSAICISTA_LEVELS: readonly MosaicistaLevelConfig[] = [
  // lv 1–3: geometrici procedurali, frammenti grandi, no rotazione
  { livello:  1, source: "procedural", fragmentsMin: 4,  fragmentsMax: 4,  rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: false, tLimMosaicoMs: 12_000, previewMs: 4_500, cellSizePx: 92 },
  { livello:  2, source: "procedural", fragmentsMin: 4,  fragmentsMax: 6,  rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: false, tLimMosaicoMs: 14_000, previewMs: 4_500, cellSizePx: 88 },
  { livello:  3, source: "procedural", fragmentsMin: 6,  fragmentsMax: 6,  rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: false, tLimMosaicoMs: 16_000, previewMs: 3_500, cellSizePx: 84 },
  // lv 4–7: soggetti figurativi curati, frammenti medi
  { livello:  4, source: "curato",     fragmentsMin: 8,  fragmentsMax: 12, rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: false, tLimMosaicoMs: 18_000, previewMs: 4_000, cellSizePx: 80 },
  { livello:  5, source: "curato",     fragmentsMin: 9,  fragmentsMax: 12, rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: false, tLimMosaicoMs: 20_000, previewMs: 4_500, cellSizePx: 76 },
  { livello:  6, source: "curato",     fragmentsMin: 12, fragmentsMax: 15, rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: false, tLimMosaicoMs: 22_000, previewMs: 5_000, cellSizePx: 72 },
  { livello:  7, source: "curato",     fragmentsMin: 12, fragmentsMax: 16, rotazioneAttiva: false, rotazioneRatio: 0,    coloriAmbigui: true,  tLimMosaicoMs: 25_000, previewMs: 6_000, cellSizePx: 68 },
  // lv 8–10: complessi, rotazione richiesta, colori ambigui
  { livello:  8, source: "curato",     fragmentsMin: 15, fragmentsMax: 20, rotazioneAttiva: true,  rotazioneRatio: 0.35, coloriAmbigui: true,  tLimMosaicoMs: 28_000, previewMs: 6_500, cellSizePx: 66 },
  { livello:  9, source: "curato",     fragmentsMin: 16, fragmentsMax: 20, rotazioneAttiva: true,  rotazioneRatio: 0.50, coloriAmbigui: true,  tLimMosaicoMs: 32_000, previewMs: 7_000, cellSizePx: 62 },
  { livello: 10, source: "curato",     fragmentsMin: 18, fragmentsMax: 25, rotazioneAttiva: true,  rotazioneRatio: 0.65, coloriAmbigui: true,  tLimMosaicoMs: 36_000, previewMs: 8_000, cellSizePx: 58 },
] as const;

export function getMosaicistaLevel(livello: number): MosaicistaLevelConfig {
  return MOSAICISTA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}
