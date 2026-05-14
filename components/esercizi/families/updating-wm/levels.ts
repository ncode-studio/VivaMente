/**
 * components/esercizi/families/updating-wm/levels.ts
 *
 * Livelli per Updating WM (lv 1–10):
 *   Tabella A — updating_wm_parole (modalità single o updating, QWERTY)
 *   Tabella B — updating_wm_numeri (trasformazione, tastierino)
 *
 * Modalità Tabella A:
 *   single   (lv 1-3): un'unica batch di N stimoli, una domanda finale.
 *   updating (lv 4+):  più round di 3 stimoli ciascuno; dopo ogni round
 *                      l'utente digita la risposta cumulativa (il vincitore
 *                      considerando tutti gli stimoli mostrati finora).
 *
 * Modello A (timer 60s). tLimMs={null} — timing gestito internamente.
 * Micro-progressione: nPerRound +1 per trial bonus, max +2.
 *
 * Riferimento: docs/gdd/families/updating-wm.md
 */

export type UWMProprieta = "dimensione" | "peso" | "prezzo";
export type UWMTransform = "+1" | "-1" | "+2" | "-2";

// ── Tabella A (Parole) ─────────────────────────────────────────────────────────

export type UWMModalita = "single" | "updating";

export interface UWMTabALevel {
  livello:          number;
  modalita:         UWMModalita;
  nRounds:          number;     // 1 per single, >=2 per updating
  nPerRound:        number;     // 4-5 per single, 3 per updating
  speedMs:          number;
  proprieta:        UWMProprieta[];
  trialsPerSession: number;
}

export const SESSION_TIMER_MS = 60_000;

export const UWM_TABA_LEVELS: readonly UWMTabALevel[] = [
  { livello:  1, modalita: "single",   nRounds: 1, nPerRound: 4, speedMs: 2500, proprieta: ["dimensione"],                       trialsPerSession: 5 },
  { livello:  2, modalita: "single",   nRounds: 1, nPerRound: 4, speedMs: 2300, proprieta: ["dimensione", "peso"],               trialsPerSession: 5 },
  { livello:  3, modalita: "single",   nRounds: 1, nPerRound: 5, speedMs: 2000, proprieta: ["dimensione", "peso"],               trialsPerSession: 5 },
  { livello:  4, modalita: "updating", nRounds: 2, nPerRound: 3, speedMs: 2300, proprieta: ["dimensione", "peso"],               trialsPerSession: 5 },
  { livello:  5, modalita: "updating", nRounds: 2, nPerRound: 3, speedMs: 2000, proprieta: ["dimensione", "peso", "prezzo"],     trialsPerSession: 5 },
  { livello:  6, modalita: "updating", nRounds: 2, nPerRound: 3, speedMs: 1800, proprieta: ["dimensione", "peso", "prezzo"],     trialsPerSession: 6 },
  { livello:  7, modalita: "updating", nRounds: 3, nPerRound: 3, speedMs: 1800, proprieta: ["dimensione", "peso", "prezzo"],     trialsPerSession: 6 },
  { livello:  8, modalita: "updating", nRounds: 3, nPerRound: 3, speedMs: 1600, proprieta: ["dimensione", "peso", "prezzo"],     trialsPerSession: 6 },
  { livello:  9, modalita: "updating", nRounds: 4, nPerRound: 3, speedMs: 1600, proprieta: ["dimensione", "peso", "prezzo"],     trialsPerSession: 6 },
  { livello: 10, modalita: "updating", nRounds: 4, nPerRound: 3, speedMs: 1500, proprieta: ["dimensione", "peso", "prezzo"],     trialsPerSession: 6 },
];

export function getUWMTabALevel(livello: number): UWMTabALevel {
  return UWM_TABA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Tabella B (Numeri) ────────────────────────────────────────────────────────

export interface UWMTabBLevel {
  livello:          number;
  nDigits:          number;
  speedMs:          number;
  trasformazioni:   UWMTransform[];
  trialsPerSession: number;
}

export const UWM_TABB_LEVELS: readonly UWMTabBLevel[] = [
  { livello:  1, nDigits: 3, speedMs: 2500, trasformazioni: ["+1"],       trialsPerSession: 5 },
  { livello:  2, nDigits: 3, speedMs: 2300, trasformazioni: ["+1"],       trialsPerSession: 5 },
  { livello:  3, nDigits: 4, speedMs: 2300, trasformazioni: ["+1"],       trialsPerSession: 5 },
  { livello:  4, nDigits: 4, speedMs: 2000, trasformazioni: ["+1"],       trialsPerSession: 6 },
  { livello:  5, nDigits: 4, speedMs: 2000, trasformazioni: ["+1"],       trialsPerSession: 6 },
  { livello:  6, nDigits: 5, speedMs: 1800, trasformazioni: ["-1"],       trialsPerSession: 6 },
  { livello:  7, nDigits: 5, speedMs: 1800, trasformazioni: ["-1"],       trialsPerSession: 7 },
  { livello:  8, nDigits: 5, speedMs: 1600, trasformazioni: ["+2", "-2"], trialsPerSession: 7 },
  { livello:  9, nDigits: 6, speedMs: 1600, trasformazioni: ["+2", "-2"], trialsPerSession: 7 },
  { livello: 10, nDigits: 6, speedMs: 1500, trasformazioni: ["+2", "-2"], trialsPerSession: 7 },
];

export function getUWMTabBLevel(livello: number): UWMTabBLevel {
  return UWM_TABB_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Mechanic warnings ─────────────────────────────────────────────────────────

export function getUWMParoleWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 1 && livelloCorrente === 2) {
    return { titolo: "Nuova proprietà", testo: "Le domande possono ora chiederti anche del peso degli oggetti." };
  }
  if (livelloPrec === 3 && livelloCorrente === 4) {
    return { titolo: "Modalità aggiornamento", testo: "Da questo livello gli oggetti arrivano in più round. Dopo ogni round ti viene chiesta la risposta considerando TUTTI gli oggetti visti finora, anche quelli dei round precedenti." };
  }
  if (livelloPrec === 4 && livelloCorrente === 5) {
    return { titolo: "Nuova proprietà", testo: "Le domande possono ora chiederti anche del prezzo degli oggetti (più o meno costoso)." };
  }
  return null;
}

export function getUWMNumeriWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 5 && livelloCorrente === 6) {
    return { titolo: "Nuova regola", testo: "Sottrai 1 a ogni numero della sequenza." };
  }
  if (livelloPrec === 7 && livelloCorrente === 8) {
    return { titolo: "Nuova regola", testo: "La trasformazione alterna tra +2 e −2 ad ogni trial." };
  }
  return null;
}

// ── Label regola per display (Numeri) ─────────────────────────────────────────

export function regolaLabel(trasf: UWMTransform): string {
  switch (trasf) {
    case "+1": return "Aggiungi 1 a ogni numero";
    case "-1": return "Sottrai 1 a ogni numero";
    case "+2": return "Aggiungi 2 a ogni numero";
    case "-2": return "Sottrai 2 a ogni numero";
  }
}
