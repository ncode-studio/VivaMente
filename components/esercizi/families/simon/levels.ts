/**
 * components/esercizi/families/simon/levels.ts
 *
 * Livelli per Simon Spaziale (lv 1–10), esercizio `simon_spaziale`.
 *
 * Costrutto: controllo dell'interferenza spaziale (stimulus-response compatibility).
 * L'utente risponde alla DIREZIONE della freccia, ignorando la POSIZIONE in cui appare.
 *
 * Modalità:
 *   lv 1-7:  2 direzioni (sx/dx), 2 zone, 2 pulsanti
 *   lv 8-10: 4 direzioni (sx/dx/su/giu), 4 zone, 4 pulsanti a croce
 *
 * Modello A timer 60s, on-demand stimulus generation, feedback standard,
 * no micro-progressione (la difficoltà è interamente definita dal livello).
 *
 * Riferimento: docs/gdd/families/simon.md
 */

export type SimonDirezione = "sx" | "dx" | "su" | "giu";

export interface SimonLevelConfig {
  livello:          number;
  /** Finestra di risposta per trial (ms). */
  tLimMs:           number;
  /** Pausa tra stimoli (ms). */
  isiMs:            number;
  /** Frazione di stimoli incongruenti (posizione ≠ direzione). 0..1 */
  incongrueRate:    number;
  /** Numero di direzioni (e zone, e pulsanti) attive: 2 = sx/dx, 4 = sx/dx/su/giu. */
  nDirezioni:       2 | 4;
}

export const SESSION_TIMER_MS = 60_000;

export const SIMON_LEVELS: readonly SimonLevelConfig[] = [
  { livello:  1, tLimMs: 1800, isiMs: 500, incongrueRate: 0.20, nDirezioni: 2 },
  { livello:  2, tLimMs: 1700, isiMs: 450, incongrueRate: 0.30, nDirezioni: 2 },
  { livello:  3, tLimMs: 1600, isiMs: 400, incongrueRate: 0.40, nDirezioni: 2 },
  { livello:  4, tLimMs: 1500, isiMs: 350, incongrueRate: 0.50, nDirezioni: 2 },
  { livello:  5, tLimMs: 1400, isiMs: 300, incongrueRate: 0.60, nDirezioni: 2 },
  { livello:  6, tLimMs: 1300, isiMs: 250, incongrueRate: 0.65, nDirezioni: 2 },
  { livello:  7, tLimMs: 1200, isiMs: 200, incongrueRate: 0.70, nDirezioni: 2 },
  { livello:  8, tLimMs: 1200, isiMs: 200, incongrueRate: 0.70, nDirezioni: 4 },
  { livello:  9, tLimMs: 1100, isiMs: 180, incongrueRate: 0.75, nDirezioni: 4 },
  { livello: 10, tLimMs: 1000, isiMs: 150, incongrueRate: 0.75, nDirezioni: 4 },
];

export function getSimonLevel(livello: number): SimonLevelConfig {
  return SIMON_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getSimonMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 7 && livelloCorrente === 8) {
    return {
      titolo: "Quattro direzioni",
      testo:  "Da questo livello le frecce possono indicare anche SU e GIÙ. Hai quattro pulsanti disposti a croce: tocca la direzione della freccia, non la sua posizione sullo schermo.",
    };
  }
  return null;
}

/** Simbolo Unicode di ciascuna direzione (per display). */
export const SIMBOLO_DIREZIONE: Record<SimonDirezione, string> = {
  sx:   "←",  // ←
  dx:   "→",  // →
  su:   "↑",  // ↑
  giu:  "↓",  // ↓
};
