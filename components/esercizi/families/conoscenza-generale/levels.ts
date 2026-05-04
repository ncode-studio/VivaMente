/**
 * components/esercizi/families/conoscenza-generale/levels.ts
 *
 * Livelli per Conoscenza Generale (lv 1–10), esercizio `cultura_generale`.
 *
 * Modello A (timer 90s). T.Lim gestito internamente dalla session (tLimMs={null}).
 * Micro-progressione: rarità index +1 per trial bonus (max +2 step, ceiling 4).
 *   base rarità per fascia livello: molto_nota (lv1-3), nota (lv4-7), media (lv8-10)
 *
 * Riferimento: docs/gdd/families/conoscenza-generale.md
 */

export type CGRarità = "molto_nota" | "nota" | "media" | "meno_nota" | "rara";

export const RARITÀ_INDEX: Record<CGRarità, number> = {
  molto_nota: 0,
  nota:       1,
  media:      2,
  meno_nota:  3,
  rara:       4,
};

export const RARITÀ_BY_INDEX: readonly CGRarità[] = [
  "molto_nota", "nota", "media", "meno_nota", "rara",
];

export interface CGLevelConfig {
  livello:          number;
  tLimMs:           number;
  rarità:           CGRarità;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS = 90_000;

// trialsPerSession = ceil(90000 / (tLimMs + 800)) + 3
export const CG_LEVELS: readonly CGLevelConfig[] = [
  { livello:  1, tLimMs: 12000, rarità: "molto_nota", trialsPerSession: 11 },
  { livello:  2, tLimMs: 11000, rarità: "molto_nota", trialsPerSession: 11 },
  { livello:  3, tLimMs: 10000, rarità: "molto_nota", trialsPerSession: 12 },
  { livello:  4, tLimMs:  9000, rarità: "nota",        trialsPerSession: 13 },
  { livello:  5, tLimMs:  9000, rarità: "nota",        trialsPerSession: 13 },
  { livello:  6, tLimMs:  8000, rarità: "nota",        trialsPerSession: 14 },
  { livello:  7, tLimMs:  8000, rarità: "nota",        trialsPerSession: 14 },
  { livello:  8, tLimMs:  7000, rarità: "media",       trialsPerSession: 15 },
  { livello:  9, tLimMs:  7000, rarità: "media",       trialsPerSession: 15 },
  { livello: 10, tLimMs:  6000, rarità: "media",       trialsPerSession: 17 },
];

export function getCGLevel(livello: number): CGLevelConfig {
  return CG_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}
