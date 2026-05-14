/**
 * Livelli per Stimoli Cadenti (Falling Go/No-Go).
 *
 * Paradigma:
 *   ⭐  GO   — tocca subito
 *   emoji NO-GO — ignora (da lv 2); errore leggero se tappata
 *   💣  BOMB  — non toccare MAI: game over immediato; presente da lv 1
 *
 * Nessuna colonna: gli stimoli cadono in posizione X casuale nell'area.
 */

export const FALL_SESSION_TIMER_MS = 60_000;
export const GAME_H_PX             = 420;
export const STIMOLO_SIZE_PX       = 72;

export interface FallLevelConfig {
  livello:   number;
  fallMs:    number;   // velocità caduta: diminuisce con il livello (più veloce)
  isiMs:     number;   // inter-stimulus interval: diminuisce con il livello (più fitto)
  maxActive: number;
  nogoRate:  number;
  bombRate:  number;
}

export const FALL_LEVELS: readonly FallLevelConfig[] = [
  { livello:  1, fallMs: 3200, isiMs: 2200, maxActive: 1, nogoRate: 0.00, bombRate: 0.20 },
  { livello:  2, fallMs: 3000, isiMs: 2000, maxActive: 1, nogoRate: 0.25, bombRate: 0.22 },
  { livello:  3, fallMs: 2700, isiMs: 1800, maxActive: 2, nogoRate: 0.28, bombRate: 0.24 },
  { livello:  4, fallMs: 2400, isiMs: 1600, maxActive: 2, nogoRate: 0.30, bombRate: 0.26 },
  { livello:  5, fallMs: 2200, isiMs: 1500, maxActive: 2, nogoRate: 0.32, bombRate: 0.28 },
  { livello:  6, fallMs: 2000, isiMs: 1400, maxActive: 3, nogoRate: 0.33, bombRate: 0.29 },
  { livello:  7, fallMs: 1800, isiMs: 1300, maxActive: 3, nogoRate: 0.34, bombRate: 0.30 },
  { livello:  8, fallMs: 1600, isiMs: 1200, maxActive: 3, nogoRate: 0.35, bombRate: 0.31 },
  { livello:  9, fallMs: 1450, isiMs: 1100, maxActive: 4, nogoRate: 0.36, bombRate: 0.32 },
  { livello: 10, fallMs: 1300, isiMs: 1000, maxActive: 4, nogoRate: 0.37, bombRate: 0.33 },
] as const;

export function getFallLevel(livello: number): FallLevelConfig {
  return FALL_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getFallMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec <= 1 && livello === 2) {
    return {
      titolo: "Attenzione ai distrattori!",
      testo:
        "Da questo livello cadono anche altre cose colorate. " +
        "Tocca solo le stelle ⭐ — ignora tutto il resto!",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 5 && livello === 6) {
    return {
      titolo: "Velocità aumentata!",
      testo:
        "Gli stimoli cadono più veloci e arrivano in più contemporaneamente. " +
        "Mantieni la concentrazione!",
    };
  }
  return null;
}
