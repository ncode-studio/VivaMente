/**
 * components/esercizi/families/memoria-lista/levels.ts
 *
 * Livelli per Memoria Lista — varianti Riconoscimento (parole + immagini).
 * Modello B — sessione a completamento (no timer fisso).
 * Tabella condivisa per le due varianti di riconoscimento (lv 1-10).
 *
 * GDD Famiglia 9, tabella livelli standard:
 * - lv 1-4: delay 30s, 4 foil
 * - lv 5-8: delay 60s, 6 foil
 * - lv 9-10: delay 90s, 8 foil
 */

export interface MLLevelConfig {
  livello:          number;
  nItems:           number;   // item da memorizzare
  speedMs:          number;   // esposizione per item durante encoding
  delayMs:          number;   // durata BouncingBall
  nFoil:            number;   // foil nella griglia di riconoscimento
  trialsPerSession: number;
}

export const ML_LEVELS: readonly MLLevelConfig[] = [
  { livello:  1, nItems: 3, speedMs: 2000, delayMs:  10_000, nFoil: 3, trialsPerSession: 4 },
  { livello:  2, nItems: 3, speedMs: 2000, delayMs:  10_000, nFoil: 3, trialsPerSession: 4 },
  { livello:  3, nItems: 5, speedMs: 1800, delayMs:  10_000, nFoil: 4, trialsPerSession: 4 },
  { livello:  4, nItems: 5, speedMs: 1800, delayMs:  10_000, nFoil: 4, trialsPerSession: 4 },
  { livello:  5, nItems: 6, speedMs: 1600, delayMs:  20_000, nFoil: 6, trialsPerSession: 4 },
  { livello:  6, nItems: 6, speedMs: 1600, delayMs:  20_000, nFoil: 6, trialsPerSession: 4 },
  { livello:  7, nItems: 7, speedMs: 1500, delayMs:  20_000, nFoil: 6, trialsPerSession: 3 },
  { livello:  8, nItems: 7, speedMs: 1500, delayMs:  20_000, nFoil: 6, trialsPerSession: 3 },
  { livello:  9, nItems: 8, speedMs: 1400, delayMs:  30_000, nFoil: 8, trialsPerSession: 3 },
  { livello: 10, nItems: 8, speedMs: 1400, delayMs:  30_000, nFoil: 8, trialsPerSession: 3 },
];

export const ML_MICRO_DELTA    = 1;
export const ML_MICRO_MAX_OVER = 2;

export function getMLLevel(livello: number): MLLevelConfig {
  return ML_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getMLMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 4 && livelloCorrente === 5) {
    return { titolo: "Cambio difficoltà", testo: "Da questo livello il tempo di attesa tra la lista e il riconoscimento aumenta a 20 secondi." };
  }
  if (livelloPrec === 8 && livelloCorrente === 9) {
    return { titolo: "Cambio difficoltà", testo: "Da questo livello il tempo di attesa aumenta a 30 secondi." };
  }
  return null;
}
