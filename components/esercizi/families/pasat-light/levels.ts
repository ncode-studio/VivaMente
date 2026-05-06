/**
 * components/esercizi/families/pasat-light/levels.ts
 *
 * Livelli per Pasat Light (lv 1–10), esercizio `pasat_light_visivo`.
 *
 * Modello A (timer 90s). Timing gestito internamente dalla session (tLimMs={null}).
 * ISI = durata di visualizzazione di ogni cifra (non ISI standard 500ms — deroga GDD).
 * Risposta: scelta multipla per lv 1-10 (NP solo da lv 14, fuori scope).
 *
 * Micro-progressione: seqLen +1 per trial bonus (max +2 step).
 * Mechanic warning: lv 6 → 7 (introduzione sottrazione).
 *
 * Riferimento: docs/gdd/families/pasat-light.md
 */

export type PLOp = "+" | "−";

export interface PLLevelConfig {
  livello:          number;
  isiMs:            number;
  ops:              PLOp[];
  seqLen:           number;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS = 60_000;

export const PL_LEVELS: readonly PLLevelConfig[] = [
  { livello:  1, isiMs: 2500, ops: ["+"],      seqLen: 6, trialsPerSession: 5 },
  { livello:  2, isiMs: 2200, ops: ["+"],      seqLen: 6, trialsPerSession: 5 },
  { livello:  3, isiMs: 2000, ops: ["+"],      seqLen: 7, trialsPerSession: 5 },
  { livello:  4, isiMs: 1800, ops: ["+"],      seqLen: 7, trialsPerSession: 6 },
  { livello:  5, isiMs: 1600, ops: ["+"],      seqLen: 8, trialsPerSession: 6 },
  { livello:  6, isiMs: 1400, ops: ["+"],      seqLen: 8, trialsPerSession: 6 },
  { livello:  7, isiMs: 1400, ops: ["+", "−"], seqLen: 8, trialsPerSession: 6 },
  { livello:  8, isiMs: 1300, ops: ["+", "−"], seqLen: 9, trialsPerSession: 7 },
  { livello:  9, isiMs: 1200, ops: ["+", "−"], seqLen: 9, trialsPerSession: 7 },
  { livello: 10, isiMs: 1100, ops: ["+", "−"], seqLen: 9, trialsPerSession: 7 },
];

export function getPLLevel(livello: number): PLLevelConfig {
  return PL_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getPLMechanicWarning(
  livelloPrec: number | undefined,
  livelloCorrente: number,
): string | null {
  if (livelloPrec === 6 && livelloCorrente === 7) {
    return "Da questo livello appaiono anche sottrazioni: calcola sempre [precedente] − [nuovo numero].";
  }
  return null;
}
