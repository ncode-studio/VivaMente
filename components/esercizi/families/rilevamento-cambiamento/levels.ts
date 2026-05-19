/**
 * Livelli per Rilevamento del Cambiamento (Change Detection / Change Blindness).
 *
 * Dominio: Attenzione — attenzione focalizzata, memoria visiva di lavoro.
 * Riferimento: Simons & Rensink (2005), Change blindness: past, present and future.
 *              Trends in Cognitive Sciences 9(1):16–20.
 *
 * Meccanica:
 *   La griglia alterna: ScenaA → blank → ScenaB → blank → ScenaA → …
 *   In ScenaB un elemento è diverso rispetto a ScenaA (changeIdx).
 *   L'utente tocca l'elemento che cambia.
 *
 * Progressione:
 *   - nItem crescente (4 → 12): più oggetti = ricerca più estesa
 *   - sceneMs decrescente: la scena rimane meno a lungo in memoria
 *   - blankMs decrescente: il blank si accorcia → più difficile (paradossalmente,
 *     un blank più lungo facilita la detection, uno corto la rende più difficile
 *     perché si confonde con il flicker naturale)
 *   - tipoChange "inter" → "intra": cambio tra categorie diverse → tra simili
 *
 * Timer sessione: 90s (Modello A, flusso continuo).
 * Timeout per trial: 18s — dopo l'utente passa al prossimo stimolo.
 */

export const RILEVAMENTO_SESSION_TIMER_MS = 60_000;

export type TipoChange = "inter" | "intra";

export interface RilevamentoLevelConfig {
  livello:        number;
  nItem:          number;    // dimensione griglia
  sceneMs:        number;    // durata di ogni scena (A o B) in ms
  blankMs:        number;    // durata del blank tra scene in ms
  tipoChange:     TipoChange;
  tLimMsPerTrial: number;    // timeout massimo per trial
}

export const RILEVAMENTO_LEVELS: readonly RilevamentoLevelConfig[] = [
  { livello:  1, nItem:  4, sceneMs: 700, blankMs: 150, tipoChange: "inter", tLimMsPerTrial: 18000 },
  { livello:  2, nItem:  4, sceneMs: 600, blankMs: 130, tipoChange: "inter", tLimMsPerTrial: 18000 },
  { livello:  3, nItem:  6, sceneMs: 550, blankMs: 120, tipoChange: "inter", tLimMsPerTrial: 18000 },
  { livello:  4, nItem:  6, sceneMs: 500, blankMs: 110, tipoChange: "inter", tLimMsPerTrial: 18000 },
  { livello:  5, nItem:  8, sceneMs: 450, blankMs: 100, tipoChange: "inter", tLimMsPerTrial: 18000 },
  { livello:  6, nItem:  8, sceneMs: 400, blankMs:  90, tipoChange: "intra", tLimMsPerTrial: 18000 },
  { livello:  7, nItem:  9, sceneMs: 380, blankMs:  85, tipoChange: "intra", tLimMsPerTrial: 18000 },
  { livello:  8, nItem:  9, sceneMs: 350, blankMs:  80, tipoChange: "intra", tLimMsPerTrial: 18000 },
  { livello:  9, nItem: 12, sceneMs: 300, blankMs:  75, tipoChange: "intra", tLimMsPerTrial: 18000 },
  { livello: 10, nItem: 12, sceneMs: 250, blankMs:  70, tipoChange: "intra", tLimMsPerTrial: 18000 },
] as const;

export function getRilevamentoLevel(livello: number): RilevamentoLevelConfig {
  return RILEVAMENTO_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getRilevamentoMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec <= 5 && livello >= 6) {
    return {
      titolo: "Cambiamenti più sottili",
      testo:
        "Da questo livello le due immagini che si scambiano si assomigliano di più. " +
        "Guarda con ancora più attenzione ad ogni lampeggio!",
    };
  }
  return null;
}
