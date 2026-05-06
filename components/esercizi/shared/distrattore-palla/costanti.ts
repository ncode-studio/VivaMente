/**
 * components/esercizi/shared/distrattore-palla/costanti.ts
 *
 * Parametri timing/dimensioni del componente BouncingBall (distrattore motorio
 * MLT). Esportati per calibrazione futura e test isolati. GDD non prescrive
 * valori specifici — vedi docs/gdd/shared/04-memory-types.md §22-39.
 */

/** Diametro palla in px (mobile-friendly, tap-target ≥48px). */
export const PALLA_DIAMETRO_PX = 64;

/**
 * Magnitudo velocità iniziale in px/ms (~300px/s). Valore conservativo
 * per essere percepibile su mobile senza causare affaticamento visivo.
 */
export const PALLA_VELOCITA_PX_MS = 0.15;

/** Colore sfondo stage (Tailwind white). */
export const STAGE_COLORE = "#FFFFFF";

/** Colore testo countdown (Tailwind gray-400, sub-discreto in alto). */
export const COUNTDOWN_COLORE = "#9CA3AF";

// ── Go/No-Go colori ───────────────────────────────────────────────────────────

/** Colore target (rosso): l'utente deve toccare SOLO quando la palla è questo colore. */
export const TARGET_COLOR = "#DC2626";   // red-600

/** Colori non-target (l'utente NON deve toccare). */
export const NON_TARGET_COLORS = ["#2563EB", "#16A34A", "#D97706"] as const; // blue, green, amber

/** Probabilità che la prossima finestra sia target (0–1). */
export const TARGET_RATIO = 0.30;

/** Durata minima di ogni finestra colore (ms). */
export const COLOR_WINDOW_MIN_MS = 1500;

/** Durata massima di ogni finestra colore (ms). */
export const COLOR_WINDOW_MAX_MS = 3000;
