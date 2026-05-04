/**
 * components/esercizi/families/word-chain/levels.ts
 *
 * Livelli per Word Chain Alfabetico (lv 1–10).
 * Modello A — timer 90s.
 * Micro-progressione: targetTimeMs −2000ms per trial bonus, max −2 step, floor 15s.
 */

export type WCSemanticDistance = "alta" | "media";

export interface WCLevelConfig {
  livello:          number;
  nWords:           number;
  tLimMs:           number;       // hard deadline per trial
  targetTimeMs:     number;       // soglia promozione
  distanza:         WCSemanticDistance;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS    = 90_000;
export const WC_TARGET_FLOOR_MS  = 15_000;

export const WC_LEVELS: readonly WCLevelConfig[] = [
  { livello:  1, nWords:  5, tLimMs: 40_000, targetTimeMs: 30_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  2, nWords:  6, tLimMs: 45_000, targetTimeMs: 33_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  3, nWords:  7, tLimMs: 50_000, targetTimeMs: 37_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  4, nWords:  7, tLimMs: 50_000, targetTimeMs: 35_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  5, nWords:  8, tLimMs: 55_000, targetTimeMs: 40_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  6, nWords:  8, tLimMs: 55_000, targetTimeMs: 38_000, distanza: "media", trialsPerSession: 3 },
  { livello:  7, nWords:  9, tLimMs: 60_000, targetTimeMs: 44_000, distanza: "media", trialsPerSession: 3 },
  { livello:  8, nWords:  9, tLimMs: 60_000, targetTimeMs: 42_000, distanza: "media", trialsPerSession: 3 },
  { livello:  9, nWords: 10, tLimMs: 65_000, targetTimeMs: 48_000, distanza: "media", trialsPerSession: 3 },
  { livello: 10, nWords: 10, tLimMs: 65_000, targetTimeMs: 46_000, distanza: "media", trialsPerSession: 3 },
];

export function getWCLevel(livello: number): WCLevelConfig {
  return WC_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getWCMechanicWarning(
  livelloPrec: number | undefined,
  livelloCorrente: number,
): string | null {
  if (livelloPrec === 5 && livelloCorrente === 6) {
    return "Da questo livello le parole appartengono a categorie più simili — richiede più attenzione.";
  }
  return null;
}
