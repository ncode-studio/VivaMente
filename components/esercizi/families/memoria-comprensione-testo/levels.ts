/**
 * components/esercizi/families/memoria-comprensione-testo/levels.ts
 *
 * Livelli per Memoria e Comprensione del Testo — varianti MBT:
 *   memoria_comprensione_fattuale_mbt
 *   memoria_comprensione_inferenziale_mbt
 *
 * Tabella A (condivisa per entrambe le varianti, GDD Famiglia 8).
 * Modello B — sessione a completamento.
 * Micro-progressione: +1 domanda per trial bonus (max +2, ceiling 5).
 */

export interface MCTLevelConfig {
  livello:          number;
  nFrasi:           number;  // lunghezza testo (filtra il pool)
  nDomande:         number;  // domande per trial
  nOpzioni:         number;  // opzioni per domanda (3 o 4)
  trialsPerSession: number;
}

export const MCT_LEVELS: readonly MCTLevelConfig[] = [
  { livello:  1, nFrasi: 3, nDomande: 1, nOpzioni: 3, trialsPerSession: 4 },
  { livello:  2, nFrasi: 3, nDomande: 1, nOpzioni: 3, trialsPerSession: 4 },
  { livello:  3, nFrasi: 4, nDomande: 1, nOpzioni: 3, trialsPerSession: 4 },
  { livello:  4, nFrasi: 4, nDomande: 2, nOpzioni: 3, trialsPerSession: 5 },
  { livello:  5, nFrasi: 4, nDomande: 2, nOpzioni: 3, trialsPerSession: 5 },
  { livello:  6, nFrasi: 5, nDomande: 2, nOpzioni: 3, trialsPerSession: 5 },
  { livello:  7, nFrasi: 5, nDomande: 2, nOpzioni: 4, trialsPerSession: 5 },
  { livello:  8, nFrasi: 5, nDomande: 2, nOpzioni: 4, trialsPerSession: 5 },
  { livello:  9, nFrasi: 6, nDomande: 2, nOpzioni: 4, trialsPerSession: 5 },
  { livello: 10, nFrasi: 6, nDomande: 3, nOpzioni: 4, trialsPerSession: 5 },
];

export const MCT_MICRO_DELTA    = 1;
export const MCT_MICRO_MAX_OVER = 2;

// ── Tabella C — Fattuale differito MLT ────────────────────────────────────────

export interface MCTMLTLevelConfig {
  livello:          number;
  nFrasi:           number;
  nDomande:         number;
  nOpzioni:         number;
  delayMs:          number;   // delay tra lettura e domande (palla rimbalzante)
  trialsPerSession: number;
}

/** Micro-progressione MLT: +15 s di delay per trial bonus (max +30 s). */
export const MCTMLT_MICRO_DELTA    = 15_000;
export const MCTMLT_MICRO_MAX_OVER = 2;

export const MCTMLT_LEVELS: readonly MCTMLTLevelConfig[] = [
  { livello:  1, nFrasi: 3, nDomande: 1, nOpzioni: 3, delayMs:  30_000, trialsPerSession: 3 },
  { livello:  2, nFrasi: 3, nDomande: 1, nOpzioni: 3, delayMs:  30_000, trialsPerSession: 3 },
  { livello:  3, nFrasi: 4, nDomande: 1, nOpzioni: 3, delayMs:  30_000, trialsPerSession: 3 },
  { livello:  4, nFrasi: 4, nDomande: 2, nOpzioni: 3, delayMs:  30_000, trialsPerSession: 3 },
  { livello:  5, nFrasi: 4, nDomande: 2, nOpzioni: 3, delayMs:  60_000, trialsPerSession: 3 },
  { livello:  6, nFrasi: 5, nDomande: 2, nOpzioni: 3, delayMs:  60_000, trialsPerSession: 3 },
  { livello:  7, nFrasi: 5, nDomande: 2, nOpzioni: 4, delayMs:  60_000, trialsPerSession: 3 },
  { livello:  8, nFrasi: 5, nDomande: 2, nOpzioni: 4, delayMs:  60_000, trialsPerSession: 3 },
  { livello:  9, nFrasi: 6, nDomande: 2, nOpzioni: 4, delayMs:  90_000, trialsPerSession: 2 },
  { livello: 10, nFrasi: 6, nDomande: 3, nOpzioni: 4, delayMs:  90_000, trialsPerSession: 2 },
];

export function getMCTMLTLevel(livello: number): MCTMLTLevelConfig {
  return MCTMLT_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getMCTLevel(livello: number): MCTLevelConfig {
  return MCT_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Tabella B — Ordine Narrativo MBT ──────────────────────────────────────────

export interface MCTOrdineNarrativoLevelConfig {
  livello:          number;
  nEventi:          number;
  nDistractors:     number;
  trialsPerSession: number;
}

/** Micro-progressione ordine: +1 evento per trial bonus (max +2). */
export const MCTON_MICRO_DELTA    = 1;
export const MCTON_MICRO_MAX_OVER = 2;

export const MCTON_LEVELS: readonly MCTOrdineNarrativoLevelConfig[] = [
  { livello:  1, nEventi: 3, nDistractors: 0, trialsPerSession: 4 },
  { livello:  2, nEventi: 3, nDistractors: 0, trialsPerSession: 4 },
  { livello:  3, nEventi: 4, nDistractors: 0, trialsPerSession: 4 },
  { livello:  4, nEventi: 4, nDistractors: 0, trialsPerSession: 4 },
  { livello:  5, nEventi: 4, nDistractors: 1, trialsPerSession: 5 },
  { livello:  6, nEventi: 5, nDistractors: 1, trialsPerSession: 5 },
  { livello:  7, nEventi: 5, nDistractors: 1, trialsPerSession: 5 },
  { livello:  8, nEventi: 5, nDistractors: 2, trialsPerSession: 5 },
  { livello:  9, nEventi: 6, nDistractors: 2, trialsPerSession: 5 },
  { livello: 10, nEventi: 6, nDistractors: 2, trialsPerSession: 5 },
];

export function getMCTOrdineNarrativoLevel(
  livello: number,
): MCTOrdineNarrativoLevelConfig {
  return MCTON_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getMCTMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 6 && livelloCorrente === 7) {
    return { titolo: "Cambio difficoltà", testo: "Da questo livello ogni domanda avrà quattro possibili risposte invece di tre." };
  }
  return null;
}
