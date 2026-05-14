/**
 * Livelli per "Il Guardiano del Giardino".
 *
 * Dominio: Attenzione — Go/No-Go con stimoli in movimento. Solo le
 * farfalle sono GO; tutti gli altri animali del giardino sono NO-GO.
 *
 * Progressione (10 livelli, target over 60):
 *   - lv 1–3 : farfalle + api + uccellini
 *   - lv 4–7 : entra la libellula come 3° distrattore
 *   - lv 8–10: entra la coccinella come 4° distrattore
 *   - crossMs decresce, maxActive cresce, rate distrattori cresce
 *
 * Timer sessione: 60s (Modello A).
 */

export const GG_SESSION_TIMER_MS = 60_000;

/** Altezza area di gioco in px. */
export const GG_GAME_H_PX = 420;
/** Diametro hit-area sprite in px (over 60: target grandi). */
export const GG_SPRITE_SIZE_PX = 84;

export type GGTipoSprite =
  | "farfalla"
  | "ape"
  | "uccellino"
  | "libellula"
  | "coccinella";

export interface GGLevelConfig {
  livello:        number;
  crossMs:        number;
  spawnRateMs:    number;
  maxActive:      number;
  apeRate:        number;
  uccelloRate:    number;
  libellulaRate:  number;
  coccinellaRate: number;
}

/**
 * Curva difficoltà:
 *   - distrattori cumulativi: 2 → 3 (lv 4+) → 4 (lv 8+)
 *   - farfalle restano l'evento più frequente lungo tutta la curva
 */
export const GG_LEVELS: readonly GGLevelConfig[] = [
  // lv 1–3: 2 distrattori — rate equi (ape = uccellino)
  { livello:  1, crossMs: 3200, spawnRateMs: 2000, maxActive: 2, apeRate: 0.20, uccelloRate: 0.20, libellulaRate: 0.00, coccinellaRate: 0.00 },
  { livello:  2, crossMs: 2900, spawnRateMs: 1850, maxActive: 2, apeRate: 0.22, uccelloRate: 0.22, libellulaRate: 0.00, coccinellaRate: 0.00 },
  { livello:  3, crossMs: 2600, spawnRateMs: 1700, maxActive: 3, apeRate: 0.24, uccelloRate: 0.24, libellulaRate: 0.00, coccinellaRate: 0.00 },
  // lv 4–7: 3 distrattori — rate equi (ape = uccellino = libellula)
  { livello:  4, crossMs: 2400, spawnRateMs: 1550, maxActive: 3, apeRate: 0.18, uccelloRate: 0.18, libellulaRate: 0.18, coccinellaRate: 0.00 },
  { livello:  5, crossMs: 2200, spawnRateMs: 1400, maxActive: 3, apeRate: 0.19, uccelloRate: 0.19, libellulaRate: 0.19, coccinellaRate: 0.00 },
  { livello:  6, crossMs: 2000, spawnRateMs: 1300, maxActive: 4, apeRate: 0.20, uccelloRate: 0.20, libellulaRate: 0.20, coccinellaRate: 0.00 },
  { livello:  7, crossMs: 1800, spawnRateMs: 1200, maxActive: 4, apeRate: 0.21, uccelloRate: 0.21, libellulaRate: 0.21, coccinellaRate: 0.00 },
  // lv 8–10: 4 distrattori — rate equi (ape = uccellino = libellula = coccinella)
  { livello:  8, crossMs: 1600, spawnRateMs: 1100, maxActive: 4, apeRate: 0.16, uccelloRate: 0.16, libellulaRate: 0.16, coccinellaRate: 0.16 },
  { livello:  9, crossMs: 1450, spawnRateMs: 1000, maxActive: 5, apeRate: 0.17, uccelloRate: 0.17, libellulaRate: 0.17, coccinellaRate: 0.17 },
  { livello: 10, crossMs: 1300, spawnRateMs:  900, maxActive: 5, apeRate: 0.18, uccelloRate: 0.18, libellulaRate: 0.18, coccinellaRate: 0.18 },
] as const;

export function getGGLevel(livello: number): GGLevelConfig {
  return GG_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}
