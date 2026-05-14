/**
 * components/esercizi/families/pasat-light/levels.ts
 *
 * Livelli per Pasat Light (lv 1–10), esercizio `pasat_light_visivo`.
 *
 * Modello A (timer 60s). Modalità continua: una sola sequenza per tutta la sessione,
 * la somma corrente si resetta solo quando l'utente sbaglia o non risponde in tempo.
 *
 * Nessuna micro-progressione intra-livello: la difficoltà cresce solo tra livelli
 * (più operatori disponibili + tempi più stretti).
 *
 * Progressione operatori:
 *   lv 1-2: +
 *   lv 3-4: +, −
 *   lv 5-7: +, −, ×
 *   lv 8-10: +, −, ×, ÷
 *
 * Riferimento: docs/gdd/families/pasat-light.md
 */

export type PLOp = "+" | "−" | "×" | "÷";

export interface PLLevelConfig {
  livello: number;
  isiMs:   number;
  ops:     PLOp[];
}

export const SESSION_TIMER_MS = 60_000;

export const PL_LEVELS: readonly PLLevelConfig[] = [
  { livello:  1, isiMs: 7000, ops: ["+"] },
  { livello:  2, isiMs: 6500, ops: ["+"] },
  { livello:  3, isiMs: 6000, ops: ["+", "−"] },
  { livello:  4, isiMs: 5500, ops: ["+", "−"] },
  { livello:  5, isiMs: 5000, ops: ["+", "−", "×"] },
  { livello:  6, isiMs: 4700, ops: ["+", "−", "×"] },
  { livello:  7, isiMs: 4400, ops: ["+", "−", "×"] },
  { livello:  8, isiMs: 4200, ops: ["+", "−", "×", "÷"] },
  { livello:  9, isiMs: 4000, ops: ["+", "−", "×", "÷"] },
  { livello: 10, isiMs: 3800, ops: ["+", "−", "×", "÷"] },
];

export function getPLLevel(livello: number): PLLevelConfig {
  return PL_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getPLMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 2 && livelloCorrente === 3) {
    return { titolo: "Novità: sottrazione", testo: "Da questo livello appaiono anche sottrazioni. Applica sempre l'operazione tra il risultato corrente e la nuova cifra." };
  }
  if (livelloPrec === 4 && livelloCorrente === 5) {
    return { titolo: "Novità: moltiplicazione", testo: "Da questo livello appaiono anche moltiplicazioni." };
  }
  if (livelloPrec === 7 && livelloCorrente === 8) {
    return { titolo: "Novità: divisione", testo: "Da questo livello appaiono anche divisioni. Il risultato è sempre un numero intero." };
  }
  return null;
}
