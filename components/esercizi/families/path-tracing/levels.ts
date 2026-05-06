/**
 * components/esercizi/families/path-tracing/levels.ts
 *
 * Livelli per Path Tracing (lv 1-10).
 * Modello B con T.Lim per trial — la sessione termina dopo 1 trial valutativi
 * (+ max 2 bonus). Il timer è per-trial (non di sessione).
 *
 * Promozione inter-livello: tempoMs ≤ targetTimeMs.
 * Micro-progressione: targetTimeMs −2000ms per trial bonus (floor 30 s).
 */

export interface PTLevelConfig {
  livello:          number;
  gridSize:         number;   // dimensione labirinto (NxN)
  tLimMs:           number;   // T.Lim per trial in ms
  targetTimeMs:     number;   // soglia tempo per trial corretto
  trialsPerSession: number;
}

export const PT_LEVELS: readonly PTLevelConfig[] = [
  { livello:  1, gridSize: 4, tLimMs:  60_000, targetTimeMs: 45_000, trialsPerSession: 1 },
  { livello:  2, gridSize: 4, tLimMs:  60_000, targetTimeMs: 40_000, trialsPerSession: 1 },
  { livello:  3, gridSize: 4, tLimMs:  60_000, targetTimeMs: 35_000, trialsPerSession: 1 },
  { livello:  4, gridSize: 5, tLimMs:  75_000, targetTimeMs: 55_000, trialsPerSession: 1 },
  { livello:  5, gridSize: 5, tLimMs:  75_000, targetTimeMs: 50_000, trialsPerSession: 1 },
  { livello:  6, gridSize: 5, tLimMs:  75_000, targetTimeMs: 45_000, trialsPerSession: 1 },
  { livello:  7, gridSize: 5, tLimMs:  75_000, targetTimeMs: 40_000, trialsPerSession: 1 },
  { livello:  8, gridSize: 6, tLimMs:  90_000, targetTimeMs: 65_000, trialsPerSession: 1 },
  { livello:  9, gridSize: 6, tLimMs:  90_000, targetTimeMs: 60_000, trialsPerSession: 1 },
  { livello: 10, gridSize: 6, tLimMs:  90_000, targetTimeMs: 55_000, trialsPerSession: 1 },
];

export const PT_TARGET_FLOOR_MS = 30_000;
export const PT_MICRO_DELTA     = -2_000;
export const PT_MICRO_MAX_OVER  = 2;

export function getPTLevel(livello: number): PTLevelConfig {
  return PT_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getPTMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 3 && livelloCorrente === 4) {
    return { titolo: "Cambio difficoltà", testo: "Da questo livello il labirinto è più grande: 5×5." };
  }
  if (livelloPrec === 7 && livelloCorrente === 8) {
    return { titolo: "Cambio difficoltà", testo: "Da questo livello il labirinto diventa ancora più grande: 6×6." };
  }
  return null;
}
