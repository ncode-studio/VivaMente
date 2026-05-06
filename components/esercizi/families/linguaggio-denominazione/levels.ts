/**
 * components/esercizi/families/linguaggio-denominazione/levels.ts
 *
 * Livelli per i 2 esercizi Linguaggio e Denominazione (lv 1–10):
 *   picture_naming          — denominazione emoji → digitare il nome
 *   synonym_antonym_decision — decisione sinonimo/contrario/non correlato
 *
 * Modello A (timer 90s). T.Lim gestito da TrialFlow.
 * Micro-progressione: −200ms T.Lim per trial bonus (max −2 step).
 *   Floor picture_naming:  2000ms
 *   Floor synonym_antonym:  800ms
 *
 * Riferimento: docs/gdd/families/linguaggio-denominazione.md
 */

export type LDFrequencyBand = "FO" | "FO+AU";
export type LDDifficoltà    = "bassa" | "media";

export interface PictureNamingLevelConfig {
  livello:          number;
  tLimMs:           number;
  frequencyBand:    LDFrequencyBand;
  trialsPerSession: number;
}

export interface SynonymAntonymLevelConfig {
  livello:          number;
  tLimMs:           number;
  difficoltà:       LDDifficoltà;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS = 60_000;

// ── Picture Naming — tabella lv 1–10 ─────────────────────────────────────────

export const PICTURE_NAMING_LEVELS: readonly PictureNamingLevelConfig[] = [
  { livello:  1, tLimMs: 8000, frequencyBand: "FO",    trialsPerSession: 10 },
  { livello:  2, tLimMs: 7500, frequencyBand: "FO",    trialsPerSession: 10 },
  { livello:  3, tLimMs: 7000, frequencyBand: "FO",    trialsPerSession: 11 },
  { livello:  4, tLimMs: 6500, frequencyBand: "FO",    trialsPerSession: 11 },
  { livello:  5, tLimMs: 6000, frequencyBand: "FO",    trialsPerSession: 12 },
  { livello:  6, tLimMs: 5500, frequencyBand: "FO+AU", trialsPerSession: 13 },
  { livello:  7, tLimMs: 5000, frequencyBand: "FO+AU", trialsPerSession: 14 },
  { livello:  8, tLimMs: 4500, frequencyBand: "FO+AU", trialsPerSession: 15 },
  { livello:  9, tLimMs: 4000, frequencyBand: "FO+AU", trialsPerSession: 17 },
  { livello: 10, tLimMs: 3500, frequencyBand: "FO+AU", trialsPerSession: 19 },
];

// ── Synonym/Antonym Decision — tabella lv 1–10 ───────────────────────────────

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

// ── Lookup ────────────────────────────────────────────────────────────────────

export function getPictureNamingLevel(livello: number): PictureNamingLevelConfig {
  return PICTURE_NAMING_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getSynonymAntonymLevel(livello: number): SynonymAntonymLevelConfig {
  return SYNONYM_ANTONYM_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Micro-progressione floors ─────────────────────────────────────────────────

export const FLOOR_TLIM_PICTURE_NAMING  = 2000;
export const FLOOR_TLIM_SYNONYM_ANTONYM =  800;
