export type LDDifficoltà = "bassa" | "media";

export interface SynonymAntonymLevelConfig {
  livello:          number;
  tLimMs:           number;
  difficoltà:       LDDifficoltà;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS = 60_000;

export const SYNONYM_ANTONYM_LEVELS: readonly SynonymAntonymLevelConfig[] = [
  { livello:  1, tLimMs: 5000, difficoltà: "bassa", trialsPerSession: 14 },
  { livello:  2, tLimMs: 4500, difficoltà: "bassa", trialsPerSession: 15 },
  { livello:  3, tLimMs: 4000, difficoltà: "bassa", trialsPerSession: 17 },
  { livello:  4, tLimMs: 3500, difficoltà: "bassa", trialsPerSession: 19 },
  { livello:  5, tLimMs: 3000, difficoltà: "media", trialsPerSession: 22 },
  { livello:  6, tLimMs: 2800, difficoltà: "media", trialsPerSession: 23 },
  { livello:  7, tLimMs: 2600, difficoltà: "media", trialsPerSession: 25 },
  { livello:  8, tLimMs: 2400, difficoltà: "media", trialsPerSession: 27 },
  { livello:  9, tLimMs: 2200, difficoltà: "media", trialsPerSession: 29 },
  { livello: 10, tLimMs: 2000, difficoltà: "media", trialsPerSession: 32 },
];

export function getSynonymAntonymLevel(livello: number): SynonymAntonymLevelConfig {
  return SYNONYM_ANTONYM_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export const FLOOR_TLIM_SYNONYM_ANTONYM = 800;
