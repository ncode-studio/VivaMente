// Tutte le durate sono in millisecondi. Nessuna eccezione.
// sessionDurationMs usa valori letterali 90_000 | 120_000.
// poolMin e poolSize sono derivati nell'engine — mai replicati qui.

import type { MicroProgressioneConfig } from "@/lib/exercise-types";

// ── Tipo colore ────────────────────────────────────────────────────────────────

export type ColoreStroop =
  | "rosso" | "blu" | "verde" | "giallo"  // lv 1–12
  | "arancio" | "viola";                  // lv 13–20

// ── Palette colori attivi per range di livello ────────────────────────────────

export const COLORI_BASE   = ["rosso", "blu", "verde", "giallo"]                    as const;
export const COLORI_ESTESI = ["rosso", "blu", "verde", "giallo", "arancio", "viola"] as const;

// ── Hex CSS per ciascun colore (testo su surface #FFFFFF) ─────────────────────
// Tutti i valori passano WCAG AA (≥ 4.5:1 su bianco).
// giallo: #D97706 (amber-600, 4.7) — #FACC15 yellow-400 (1.9) non passa WCAG AA su bianco.

export const COLORE_CSS: Record<ColoreStroop, string> = {
  rosso:   "#DC2626",  // red-600    4.5:1
  blu:     "#2563EB",  // blue-600   5.0:1
  verde:   "#16A34A",  // green-600  5.4:1
  giallo:  "#D97706",  // amber-600  4.7:1
  arancio: "#EA580C",  // orange-600 4.6:1
  viola:   "#7C3AED",  // violet-600 5.5:1
};

// ── Configurazione livello ────────────────────────────────────────────────────

export interface StroopLevelConfig {
  livello: number;
  tLimMs: number;
  sessionDurationMs: 90_000 | 120_000;
  incongruentRatio: number;
  /** Numero di riquadri risposta: 2 (lv 1–10) oppure 3 (lv 11–20). */
  nOptions: 2 | 3;
  /** Colori attivi nel livello: 4 (lv 1–12) oppure 6 (lv 13–20). */
  nColors: 4 | 6;
  coloriAttivi: readonly ColoreStroop[];
}

// ── Micro-progressione (costanti di famiglia) ─────────────────────────────────
// see docs/gdd/families/stroop.md §Micro-progressione

export const MICRO_PROGRESSIONE_STROOP = {
  delta:    -200,  // −200ms T.Lim per trial bonus
  maxDelta: 2,     // max 2 step bonus → −400ms totale
  limite:   800,   // floor assoluto: T.Lim non scende sotto 800ms
} satisfies Omit<MicroProgressioneConfig, "valoreBase">;

// ── Messaggi warning cambio meccanica ─────────────────────────────────────────
// see docs/gdd/families/stroop.md §Cambi di meccanica
// Lv 11: nOptions 2→3. Lv 13: nColors 4→6.
// Il messaggio descrive lo STATO CORRENTE (funziona per promozione e regressione).
// Doppio cambio simultaneo (livelloPrec < 11, livelloCorrente ≥ 13): modal composito.

const W_OPTIONS: { titolo: string; testo: string } = {
  titolo: "Tre opzioni di risposta",
  testo:  "Ora ci sono 3 riquadri colorati tra cui scegliere.",
};

const W_COLORS: { titolo: string; testo: string } = {
  titolo: "Due nuovi colori",
  testo:  "Ora compaiono anche le parole ARANCIO e VIOLA.",
};

const W_BOTH: { titolo: string; testo: string } = {
  titolo: "Due novità",
  testo:  "Ora ci sono 3 riquadri di risposta. Compaiono anche le parole ARANCIO e VIOLA.",
};

/**
 * Restituisce il messaggio di avviso se la meccanica è cambiata rispetto
 * all'ultima sessione (nOptions, nColors o entrambi).
 * null se livelloPrec === null (prima sessione) o nessun cambio.
 */
export function getStroopMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;
  const prev = getStroopLevel(livelloPrec);
  const curr = getStroopLevel(livelloCorrente);
  const optChanged    = prev.nOptions !== curr.nOptions;
  const colorsChanged = prev.nColors  !== curr.nColors;
  if (optChanged && colorsChanged) return W_BOTH;
  if (optChanged)    return W_OPTIONS;
  if (colorsChanged) return W_COLORS;
  return null;
}

// ── Tabella livelli (fonte: docs/gdd/families/stroop.md §Tabella livelli) ──────

export const STROOP_LEVELS: readonly StroopLevelConfig[] = [
  { livello: 1,  tLimMs: 4000, incongruentRatio: 0.20, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 2,  tLimMs: 3800, incongruentRatio: 0.20, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 3,  tLimMs: 3600, incongruentRatio: 0.25, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 4,  tLimMs: 3400, incongruentRatio: 0.25, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 5,  tLimMs: 3200, incongruentRatio: 0.30, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 6,  tLimMs: 3000, incongruentRatio: 0.30, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 7,  tLimMs: 2800, incongruentRatio: 0.35, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 8,  tLimMs: 2600, incongruentRatio: 0.35, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 9,  tLimMs: 2400, incongruentRatio: 0.40, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
  { livello: 10, tLimMs: 2200, incongruentRatio: 0.40, nOptions: 2, nColors: 4, coloriAttivi: COLORI_BASE, sessionDurationMs: 90_000 },
] as const;

export function getStroopLevel(livello: number): StroopLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return STROOP_LEVELS[clamped - 1];
}
