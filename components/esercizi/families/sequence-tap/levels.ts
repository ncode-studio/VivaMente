/**
 * components/esercizi/families/sequence-tap/levels.ts
 *
 * 4 esercizi distinti — tutti MBT, Modello A (timer 90s):
 *   sequence_tap_numeri_forward   — span fonologico cifre, richiamo ordine diretto
 *   sequence_tap_numeri_backward  — WM verbale-esecutiva cifre, ordine inverso
 *   sequence_tap_parole_forward   — span lessico-fonologico, ordine diretto
 *   sequence_tap_parole_backward  — WM verbale + inibizione, lettere parola al contrario
 *
 * Livelli compressi 1–10 (dal GDD 1–20).
 * Micro-progressione: +1 seqLen (o wordLen) per trial bonus, max +2.
 *
 * Riferimento: docs/gdd/families/sequence-tap.md
 */

// ── Tipi ──────────────────────────────────────────────────────────────────────

export type STMode =
  | "numeri_forward"
  | "numeri_backward"
  | "parole_forward"
  | "parole_backward";

/** Modalità tastiera per Parole Backward. */
export type TasteraMode = "assistita" | "mista_4" | "mista_6" | "alfabeto";

/** Config livello per i 3 esercizi "stream" (es. 1–3). */
export interface STStreamLevelConfig {
  livello:          number;
  seqLen:           number;
  speedMs:          number;
  tLimMs:           number | null;
  trialsPerSession: number;
}

/** Config livello per Parole Backward (es. 4). */
export interface STBackwardLevelConfig {
  livello:          number;
  wordLen:          number;
  espoMs:           number;
  tLimMs:           number;
  tastiera:         TasteraMode;
  trialsPerSession: number;
}

// ── Costante timer sessione ────────────────────────────────────────────────────

export const SESSION_TIMER_MS = 90_000;

// ── Tabelle livelli ────────────────────────────────────────────────────────────

export const NUMERI_FORWARD_LEVELS: readonly STStreamLevelConfig[] = [
  { livello:  1, seqLen: 3, speedMs: 2000, tLimMs: null, trialsPerSession: 5 },
  { livello:  2, seqLen: 3, speedMs: 1800, tLimMs: null, trialsPerSession: 5 },
  { livello:  3, seqLen: 4, speedMs: 1800, tLimMs: null, trialsPerSession: 6 },
  { livello:  4, seqLen: 4, speedMs: 1600, tLimMs: null, trialsPerSession: 6 },
  { livello:  5, seqLen: 5, speedMs: 1600, tLimMs: null, trialsPerSession: 7 },
  { livello:  6, seqLen: 5, speedMs: 1400, tLimMs: null, trialsPerSession: 7 },
  { livello:  7, seqLen: 6, speedMs: 1400, tLimMs: null, trialsPerSession: 8 },
  { livello:  8, seqLen: 6, speedMs: 1200, tLimMs: null, trialsPerSession: 8 },
  { livello:  9, seqLen: 7, speedMs: 1000, tLimMs: null, trialsPerSession: 9 },
  { livello: 10, seqLen: 7, speedMs:  900, tLimMs: 6000, trialsPerSession: 9 },
];

export const NUMERI_BACKWARD_LEVELS: readonly STStreamLevelConfig[] = [
  { livello:  1, seqLen: 2, speedMs: 2000, tLimMs:  null, trialsPerSession: 5 },
  { livello:  2, seqLen: 2, speedMs: 1800, tLimMs:  null, trialsPerSession: 5 },
  { livello:  3, seqLen: 3, speedMs: 1800, tLimMs:  null, trialsPerSession: 6 },
  { livello:  4, seqLen: 3, speedMs: 1600, tLimMs:  null, trialsPerSession: 6 },
  { livello:  5, seqLen: 4, speedMs: 1600, tLimMs:  null, trialsPerSession: 7 },
  { livello:  6, seqLen: 4, speedMs: 1400, tLimMs:  null, trialsPerSession: 7 },
  { livello:  7, seqLen: 5, speedMs: 1400, tLimMs:  null, trialsPerSession: 8 },
  { livello:  8, seqLen: 5, speedMs: 1200, tLimMs:  null, trialsPerSession: 8 },
  { livello:  9, seqLen: 6, speedMs: 1000, tLimMs:  null, trialsPerSession: 9 },
  { livello: 10, seqLen: 6, speedMs:  900, tLimMs: 9000, trialsPerSession: 9 },
];

export const PAROLE_FORWARD_LEVELS: readonly STStreamLevelConfig[] = [
  { livello:  1, seqLen: 2, speedMs: 2500, tLimMs: null, trialsPerSession: 5 },
  { livello:  2, seqLen: 2, speedMs: 2300, tLimMs: null, trialsPerSession: 5 },
  { livello:  3, seqLen: 3, speedMs: 2300, tLimMs: null, trialsPerSession: 6 },
  { livello:  4, seqLen: 3, speedMs: 2100, tLimMs: null, trialsPerSession: 6 },
  { livello:  5, seqLen: 4, speedMs: 2000, tLimMs: null, trialsPerSession: 7 },
  { livello:  6, seqLen: 4, speedMs: 1800, tLimMs: null, trialsPerSession: 7 },
  { livello:  7, seqLen: 5, speedMs: 1700, tLimMs: null, trialsPerSession: 8 },
  { livello:  8, seqLen: 5, speedMs: 1500, tLimMs: null, trialsPerSession: 8 },
  { livello:  9, seqLen: 6, speedMs: 1400, tLimMs: null, trialsPerSession: 9 },
  { livello: 10, seqLen: 6, speedMs: 1300, tLimMs: 8000, trialsPerSession: 9 },
];

export const PAROLE_BACKWARD_LEVELS: readonly STBackwardLevelConfig[] = [
  { livello:  1, wordLen: 3, espoMs: 3000, tLimMs: 15000, tastiera: "assistita", trialsPerSession: 5 },
  { livello:  2, wordLen: 3, espoMs: 2800, tLimMs: 14000, tastiera: "assistita", trialsPerSession: 5 },
  { livello:  3, wordLen: 4, espoMs: 2500, tLimMs: 13000, tastiera: "assistita", trialsPerSession: 6 },
  { livello:  4, wordLen: 4, espoMs: 2200, tLimMs: 12000, tastiera: "assistita", trialsPerSession: 6 },
  { livello:  5, wordLen: 5, espoMs: 2200, tLimMs: 12000, tastiera: "mista_4",   trialsPerSession: 7 },
  { livello:  6, wordLen: 5, espoMs: 2000, tLimMs: 11000, tastiera: "mista_4",   trialsPerSession: 7 },
  { livello:  7, wordLen: 6, espoMs: 2000, tLimMs: 10000, tastiera: "mista_6",   trialsPerSession: 8 },
  { livello:  8, wordLen: 6, espoMs: 1800, tLimMs:  9000, tastiera: "mista_6",   trialsPerSession: 8 },
  { livello:  9, wordLen: 7, espoMs: 1600, tLimMs:  9000, tastiera: "alfabeto",  trialsPerSession: 9 },
  { livello: 10, wordLen: 7, espoMs: 1400, tLimMs:  8000, tastiera: "alfabeto",  trialsPerSession: 9 },
];

// ── Lookup con clamp ──────────────────────────────────────────────────────────

export function getSTStreamLevel(
  mode: "numeri_forward" | "numeri_backward" | "parole_forward",
  livello: number,
): STStreamLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  const table =
    mode === "numeri_forward"  ? NUMERI_FORWARD_LEVELS
    : mode === "numeri_backward" ? NUMERI_BACKWARD_LEVELS
    : PAROLE_FORWARD_LEVELS;
  return table[clamped - 1];
}

export function getSTBackwardLevel(livello: number): STBackwardLevelConfig {
  return PAROLE_BACKWARD_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Warning cambio meccanica (solo Parole Backward) ──────────────────────────

export function getSTMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
  mode: STMode,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null || mode !== "parole_backward") return null;

  if (livelloPrec <= 4 && livelloCorrente >= 5 && livelloCorrente <= 8) {
    return {
      titolo: "La tastiera cambia",
      testo:
        "Da questo livello vedrai le lettere della parola mescolate ad altre lettere. " +
        "Devi trovare quelle giuste e toccarle nell'ordine inverso.",
    };
  }
  if (livelloPrec >= 5 && livelloPrec <= 8 && livelloCorrente <= 4) {
    return {
      titolo: "Tastiera semplificata",
      testo: "Da questo livello la tastiera mostra solo le lettere della parola — più semplice.",
    };
  }
  if (livelloPrec <= 8 && livelloCorrente >= 9) {
    return {
      titolo: "Alfabeto completo",
      testo:
        "Da questo livello la tastiera mostra tutte le lettere dell'alfabeto. " +
        "Cerca quelle giuste e toccale in ordine inverso.",
    };
  }
  if (livelloPrec >= 9 && livelloCorrente <= 8) {
    return {
      titolo: "Tastiera ridotta",
      testo: "Da questo livello la tastiera torna con meno lettere — più semplice.",
    };
  }
  return null;
}
