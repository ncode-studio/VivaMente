/**
 * components/esercizi/families/hayling-game/levels.ts
 *
 * Livelli per Hayling Game (lv 1–10). Modello A — timer sessione 90s.
 * Per-trial T.Lim gestito internamente nella session (non dal TrialFlow).
 *
 * Promozione inter-livello: score ≥ 70 % corretto nella sessione (calcolato da page.tsx).
 * Micro-progressione: tRispostaMs −1000ms per trial bonus (floor 7s).
 */

export interface HaylingLevelConfig {
  livello:      number;
  tRispostaMs:  number;  // limite per singola risposta in ms
}

export const SESSION_TIMER_MS         = 60_000;
export const HAYLING_MICRO_DELTA      = -1_000;
export const HAYLING_MICRO_MAX_OVER   = 2;
export const HAYLING_RISPOSTA_FLOOR   = 7_000;

export const HAYLING_LEVELS: readonly HaylingLevelConfig[] = [
  { livello:  1, tRispostaMs: 20_000 },
  { livello:  2, tRispostaMs: 19_000 },
  { livello:  3, tRispostaMs: 17_000 },
  { livello:  4, tRispostaMs: 16_000 },
  { livello:  5, tRispostaMs: 15_000 },
  { livello:  6, tRispostaMs: 13_000 },
  { livello:  7, tRispostaMs: 12_000 },
  { livello:  8, tRispostaMs: 11_000 },
  { livello:  9, tRispostaMs: 10_000 },
  { livello: 10, tRispostaMs:  9_000 },
];

export function getHaylingLevel(livello: number): HaylingLevelConfig {
  return HAYLING_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}
