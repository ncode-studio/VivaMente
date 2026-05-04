/**
 * components/esercizi/families/associative-memory/levels.ts
 *
 * Livelli per Associative Memory (lv 1–10, tutte e 3 le varianti).
 * Modello B — sessione a completamento (no timer fisso).
 * Micro-progressione: +1 coppia per trial bonus, max +2.
 *
 * Riferimento: docs/gdd/families/associative-memory.md
 */

export interface AMLevelConfig {
  livello:          number;
  nCoppie:          number;
  speedMs:          number; // esposizione per coppia durante encoding
  delayMs:          number; // durata delay (BouncingBall)
  trialsPerSession: number;
}

export const AM_LEVELS: readonly AMLevelConfig[] = [
  { livello:  1, nCoppie: 2, speedMs: 3000, delayMs:  30_000, trialsPerSession: 5 },
  { livello:  2, nCoppie: 2, speedMs: 2800, delayMs:  30_000, trialsPerSession: 5 },
  { livello:  3, nCoppie: 3, speedMs: 2800, delayMs:  30_000, trialsPerSession: 5 },
  { livello:  4, nCoppie: 3, speedMs: 2500, delayMs:  30_000, trialsPerSession: 5 },
  { livello:  5, nCoppie: 3, speedMs: 2500, delayMs:  60_000, trialsPerSession: 4 },
  { livello:  6, nCoppie: 4, speedMs: 2200, delayMs:  60_000, trialsPerSession: 4 },
  { livello:  7, nCoppie: 4, speedMs: 2200, delayMs:  60_000, trialsPerSession: 4 },
  { livello:  8, nCoppie: 4, speedMs: 2000, delayMs:  60_000, trialsPerSession: 4 },
  { livello:  9, nCoppie: 5, speedMs: 2000, delayMs:  90_000, trialsPerSession: 3 },
  { livello: 10, nCoppie: 5, speedMs: 1800, delayMs:  90_000, trialsPerSession: 3 },
];

export const AM_MICRO_DELTA    = 1;
export const AM_MICRO_MAX_OVER = 2;

export function getAMLevel(livello: number): AMLevelConfig {
  return AM_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getAMMechanicWarning(
  livelloPrec: number | undefined,
  livelloCorrente: number,
): string | null {
  if (livelloPrec === 4 && livelloCorrente === 5) {
    return "Da questo livello il tempo di attesa tra memorizzazione e domande aumenta a 1 minuto.";
  }
  if (livelloPrec === 8 && livelloCorrente === 9) {
    return "Da questo livello il tempo di attesa aumenta a 1 minuto e 30 secondi.";
  }
  return null;
}
