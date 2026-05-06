/**
 * components/esercizi/families/updating-wm/levels.ts
 *
 * Livelli per Updating WM (lv 1–10):
 *   Tabella A — updating_wm_parole + updating_wm_immagini (pre-cue, MC)
 *   Tabella B — updating_wm_numeri (trasformazione, MC)
 *
 * Modello A (timer 90s). tLimMs={null} — timing gestito internamente.
 * Micro-progressione: nStimuli/nDigits +1 per trial bonus, max +2.
 *
 * Riferimento: docs/gdd/families/updating-wm.md
 */

export type UWMProprieta   = "dimensione" | "peso";
export type UWMTransform   = "+1" | "-1" | "+2" | "-2";

// ── Tabella A (Parole + Immagini) ─────────────────────────────────────────────

export interface UWMTabALevel {
  livello:          number;
  nStimuli:         number;
  speedMs:          number;
  proprieta:        UWMProprieta[];
  trialsPerSession: number;
}

export const SESSION_TIMER_MS = 60_000;

export const UWM_TABA_LEVELS: readonly UWMTabALevel[] = [
  { livello:  1, nStimuli: 4, speedMs: 2500, proprieta: ["dimensione"],            trialsPerSession: 5 },
  { livello:  2, nStimuli: 4, speedMs: 2300, proprieta: ["dimensione"],            trialsPerSession: 5 },
  { livello:  3, nStimuli: 5, speedMs: 2300, proprieta: ["dimensione"],            trialsPerSession: 5 },
  { livello:  4, nStimuli: 5, speedMs: 2000, proprieta: ["dimensione"],            trialsPerSession: 6 },
  { livello:  5, nStimuli: 5, speedMs: 2000, proprieta: ["dimensione"],            trialsPerSession: 6 },
  { livello:  6, nStimuli: 6, speedMs: 1800, proprieta: ["dimensione", "peso"],   trialsPerSession: 6 },
  { livello:  7, nStimuli: 6, speedMs: 1800, proprieta: ["dimensione", "peso"],   trialsPerSession: 7 },
  { livello:  8, nStimuli: 6, speedMs: 1600, proprieta: ["dimensione", "peso"],   trialsPerSession: 7 },
  { livello:  9, nStimuli: 7, speedMs: 1600, proprieta: ["dimensione", "peso"],   trialsPerSession: 7 },
  { livello: 10, nStimuli: 7, speedMs: 1500, proprieta: ["dimensione", "peso"],   trialsPerSession: 7 },
];

export function getUWMTabALevel(livello: number): UWMTabALevel {
  return UWM_TABA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Tabella B (Numeri) ────────────────────────────────────────────────────────

export interface UWMTabBLevel {
  livello:          number;
  nDigits:          number;
  speedMs:          number;
  trasformazioni:   UWMTransform[];  // ["+1"] | ["-1"] | ["+2","-2"] (alternate)
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

// ── Mechanic warnings (Numeri only, per lv 1–10) ─────────────────────────────

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

// ── Label regola per display ──────────────────────────────────────────────────

export function regolaLabel(trasf: UWMTransform): string {
  switch (trasf) {
    case "+1": return "Aggiungi 1 a ogni numero";
    case "-1": return "Sottrai 1 a ogni numero";
    case "+2": return "Aggiungi 2 a ogni numero";
    case "-2": return "Sottrai 2 a ogni numero";
  }
}
