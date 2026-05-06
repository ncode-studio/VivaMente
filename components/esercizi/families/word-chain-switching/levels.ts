/**
 * components/esercizi/families/word-chain-switching/levels.ts
 *
 * Livelli per Word Chain Switching (lv 1–10).
 * Modello A — timer 90s.
 *
 * Meccanica: 2 categorie semantiche, tap alternando A→B→A→B…
 * Lv 1–5: cue = etichetta + colore. Lv 6–10: solo colore.
 * Micro-progressione: targetTimeMs −2000ms per trial bonus, max −2 step, floor 15s.
 */

export type WCSSemanticDistance = "alta" | "media";
export type WCSCategoryCue      = "etichetta_colore" | "solo_colore";

export interface WCSLevelConfig {
  livello:          number;
  nWords:           number;   // sempre multiplo di 2
  tLimMs:           number;
  targetTimeMs:     number;
  distanza:         WCSSemanticDistance;
  cue:              WCSCategoryCue;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS   = 60_000;
export const WCS_TARGET_FLOOR_MS = 15_000;

export const WCS_LEVELS: readonly WCSLevelConfig[] = [
  { livello:  1, nWords:  6, tLimMs: 40_000, targetTimeMs: 30_000, distanza: "alta",  cue: "etichetta_colore", trialsPerSession: 3 },
  { livello:  2, nWords:  6, tLimMs: 40_000, targetTimeMs: 28_000, distanza: "alta",  cue: "etichetta_colore", trialsPerSession: 3 },
  { livello:  3, nWords:  8, tLimMs: 50_000, targetTimeMs: 37_000, distanza: "alta",  cue: "etichetta_colore", trialsPerSession: 3 },
  { livello:  4, nWords:  8, tLimMs: 50_000, targetTimeMs: 35_000, distanza: "alta",  cue: "etichetta_colore", trialsPerSession: 3 },
  { livello:  5, nWords: 10, tLimMs: 60_000, targetTimeMs: 44_000, distanza: "alta",  cue: "etichetta_colore", trialsPerSession: 3 },
  { livello:  6, nWords: 10, tLimMs: 60_000, targetTimeMs: 42_000, distanza: "alta",  cue: "solo_colore",      trialsPerSession: 3 },
  { livello:  7, nWords: 10, tLimMs: 60_000, targetTimeMs: 40_000, distanza: "media", cue: "solo_colore",      trialsPerSession: 3 },
  { livello:  8, nWords: 12, tLimMs: 70_000, targetTimeMs: 51_000, distanza: "media", cue: "solo_colore",      trialsPerSession: 3 },
  { livello:  9, nWords: 12, tLimMs: 70_000, targetTimeMs: 49_000, distanza: "media", cue: "solo_colore",      trialsPerSession: 3 },
  { livello: 10, nWords: 12, tLimMs: 70_000, targetTimeMs: 47_000, distanza: "media", cue: "solo_colore",      trialsPerSession: 3 },
];

export function getWCSLevel(livello: number): WCSLevelConfig {
  return WCS_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getWCSMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 5 && livelloCorrente === 6) {
    return { titolo: "Cambio difficoltà", testo: "Da questo livello scompare il nome della categoria — guida solo il colore delle parole." };
  }
  return null;
}
