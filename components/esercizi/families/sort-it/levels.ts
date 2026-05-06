/**
 * components/esercizi/families/sort-it/levels.ts
 *
 * Tabella livelli condivisa per sort_it_percettivo e sort_it_semantico.
 * Livelli 1–10 (cap dal GDD 1–20).
 *
 * Micro-progressione: ruleSwitchEveryN −1, floor 1, max −2.
 * Attivata solo da lv 4+ (lv 1–3 hanno switchOgniN=null → nessun cambio regola).
 *
 * Riferimento: docs/gdd/families/sort-it.md
 */

export type FeedbackModeSI = "full" | "reduced";

export interface SortItLevelConfig {
  livello:             number;
  nCategorie:          number;
  stimoliPerCategoria: number;
  switchOgniN:         number | null;
  feedbackMode:        FeedbackModeSI;
  tLimCartaMs:         number | null;
  trialsPerSession:    number;
}

export const SESSION_TIMER_MS = 60_000;

export const SORT_IT_LEVELS: readonly SortItLevelConfig[] = [
  { livello:  1, nCategorie: 2, stimoliPerCategoria: 3, switchOgniN: null, feedbackMode: "full",    tLimCartaMs: null, trialsPerSession: 6 },
  { livello:  2, nCategorie: 2, stimoliPerCategoria: 3, switchOgniN: null, feedbackMode: "full",    tLimCartaMs: null, trialsPerSession: 6 },
  { livello:  3, nCategorie: 2, stimoliPerCategoria: 4, switchOgniN: null, feedbackMode: "full",    tLimCartaMs: null, trialsPerSession: 6 },
  { livello:  4, nCategorie: 2, stimoliPerCategoria: 4, switchOgniN: 4,    feedbackMode: "full",    tLimCartaMs: null, trialsPerSession: 7 },
  { livello:  5, nCategorie: 2, stimoliPerCategoria: 4, switchOgniN: 4,    feedbackMode: "full",    tLimCartaMs: null, trialsPerSession: 7 },
  { livello:  6, nCategorie: 3, stimoliPerCategoria: 3, switchOgniN: 4,    feedbackMode: "full",    tLimCartaMs: null, trialsPerSession: 7 },
  { livello:  7, nCategorie: 3, stimoliPerCategoria: 3, switchOgniN: 3,    feedbackMode: "reduced", tLimCartaMs: null, trialsPerSession: 8 },
  { livello:  8, nCategorie: 3, stimoliPerCategoria: 3, switchOgniN: 3,    feedbackMode: "reduced", tLimCartaMs: null, trialsPerSession: 8 },
  { livello:  9, nCategorie: 3, stimoliPerCategoria: 4, switchOgniN: 3,    feedbackMode: "reduced", tLimCartaMs: null, trialsPerSession: 8 },
  { livello: 10, nCategorie: 3, stimoliPerCategoria: 4, switchOgniN: 3,    feedbackMode: "reduced", tLimCartaMs: null, trialsPerSession: 8 },
] as const;

export function getSortItLevel(livello: number): SortItLevelConfig {
  return SORT_IT_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getSortItMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;

  // lv 6→7: feedback cambia da full a reduced
  if (livelloPrec <= 6 && livelloCorrente >= 7) {
    return {
      titolo: "Meno aiuto",
      testo:
        "Da questo livello non vedrai più evidenziato il bin corretto quando sbagli. " +
        "Dovrai ricordare la regola da solo.",
    };
  }
  if (livelloPrec >= 7 && livelloCorrente <= 6) {
    return {
      titolo: "Aiuto visivo attivo",
      testo: "Da questo livello torni a vedere il bin corretto quando sbagli — più semplice.",
    };
  }
  return null;
}
