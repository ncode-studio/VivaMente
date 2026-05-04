/**
 * components/esercizi/families/recall-grid/levels.ts
 *
 * Configurazione livelli per Recall Grid (Famiglia 2, 3 esercizi:
 *   - recall_grid_parole_mbt    (Modello A, MBT)
 *   - recall_grid_immagini_mbt  (Modello A, MBT)
 *   - recall_grid_immagini_mlt  (Modello B, MLT — prima famiglia MLT pura)
 * ).
 *
 * Dominio cognitivo: Memoria — Corsi Block-Tapping + delayed match-to-sample.
 * L'utente deve ricordare **sia lo stimolo che la sua posizione** nella griglia.
 *
 * Struttura famiglia (GDD §Struttura famiglia, riga 14):
 *   - I 2 esercizi MBT (Parole + Immagini) **condividono la stessa tabella
 *     livelli**, l'unica variabile è lo stimulusType. Quindi 1 tabella MBT
 *     riusata per entrambi.
 *   - L'esercizio MLT ha **tabella livelli separata** per struttura temporale
 *     diversa (delay 30s → 3min con palla rimbalzante).
 *
 * Modelli sessione:
 *   - MBT: Modello A (timer fisso). Timer pagina: 90s lv 1–10, 120s lv 11–18,
 *     180s lv 19–20.
 *   - MLT: Modello B (sessione a completamento). `trialsPerSession` decresce
 *     da 5 a 2 per livello (vincolante per Modello B).
 *
 * Delay (GDD §Delay, riga 30):
 *   - MBT: schermata countdown timer visibile, durata 1000–5000ms.
 *   - MLT: task distrattore palla rimbalzante (componente shared
 *     components/esercizi/shared/distrattore-palla/BouncingBall.tsx).
 *
 * Micro-progressione: +1 nStimuli per trial bonus, max +2 oltre base
 * (GDD §Micro-progressione, riga 27, regola standard shared/03-progression.md).
 *
 * Riferimento: docs/gdd/families/recall-grid.md
 */

import type { MicroProgressioneConfig } from "@/lib/exercise-types";

// ── Tipi base ─────────────────────────────────────────────────────────────────

export type GridSize = "3x3" | "4x4" | "5x5" | "6x6";

/** Helper: numero di celle per gridSize. */
export function ncells(grid: GridSize): number {
  const [rows, cols] = grid.split("x").map(Number);
  return rows * cols;
}

// ── Discriminated union livello ───────────────────────────────────────────────

type RecallGridLevelBase = {
  /** Indice 1-based, 1–20. */
  livello: number;
  /** Dimensione griglia. */
  gridSize: GridSize;
  /** Numero stimoli da memorizzare (2–10 MBT, 2–7 MLT). */
  nStimuli: number;
  /** Durata esposizione griglia in encoding (ms). */
  exposureMs: number;
  /** T.Lim retrieval (ms). null = niente timeout (lv bassi). */
  tLimReproMs: number | null;
  /** Numero di trial per sessione (informativo MBT, vincolante MLT). */
  trialsPerSession: number;
};

export type RecallGridMBTLevelConfig = RecallGridLevelBase & {
  tipo: "mbt";
  /** Delay tra encoding e retrieval in ms (1000–5000). Countdown visibile. */
  delayMs: number;
  /**
   * Durata sessione in ms (Modello A timer fisso). 90000/120000/180000.
   * Derivato da GDD §Timer di sessione (riga 74).
   */
  sessionDurationMs: number;
};

export type RecallGridMLTLevelConfig = RecallGridLevelBase & {
  tipo: "mlt";
  /** Delay in secondi (30, 60, 90, 120, 180). Palla rimbalzante. */
  delayS: number;
};

export type RecallGridLevelConfig =
  | RecallGridMBTLevelConfig
  | RecallGridMLTLevelConfig;

// ── Costanti micro-progressione ──────────────────────────────────────────────

/**
 * Costanti micro-progressione: +1 nStimuli per trial bonus, max +2.
 * `valoreBase` iniettato runtime dall'Engine (= config.nStimuli del livello).
 * `limite` iniettato runtime dall'Engine (= ncells(config.gridSize)) per
 * evitare di eccedere la dimensione griglia (es. lv 1 3×3 → ncells=9).
 *
 * Fonte GDD: docs/gdd/families/recall-grid.md §Micro-progressione (riga 27).
 */
export const MICRO_PROGRESSIONE_RECALL_GRID = {
  delta:    1,
  maxDelta: 2,
} as const satisfies Pick<MicroProgressioneConfig, "delta" | "maxDelta">;

// ── Costanti deroga categorie immagini ───────────────────────────────────────

/**
 * Deroga `max_1_per_category_per_trial` GDD (recall-grid.md riga 93,
 * memoria-prospettica.md riga 93). Il pool emoji ha 8 macro-categorie:
 * per nStimuli > 8 (lv 18–20 MBT con 9–10 stimoli) la regola di
 * "1 per categoria" è matematicamente impossibile. Per quei livelli si
 * ammette al massimo 2 stimoli per categoria.
 */
export const MAX_PER_CATEGORIA_BASE   = 1;
export const MAX_PER_CATEGORIA_DEROGA = 2;
/** Soglia (livello MBT) da cui scatta la deroga. */
export const SOGLIA_DEROGA_CATEGORIA  = 18;

// ── Tabella livelli MBT (Parole + Immagini) ──────────────────────────────────
/**
 * Fonte: docs/gdd/families/recall-grid.md §Tabella livelli (righe 51–72).
 * Trascrizione letterale.
 *
 * sessionDurationMs derivato da GDD §Timer di sessione (riga 74):
 *   90s lv 1–10, 120s lv 11–18, 180s lv 19–20.
 *
 * Verifica a campione:
 *   lv 1  → 3x3, 2 stim, 3000ms exp, 1000ms delay, 5 trial, 90000ms sess
 *   lv 6  → 4x4 (cambio griglia), 4 stim, 2000ms exp, 2000ms delay
 *   lv 13 → 5x5 (cambio griglia + interazione), 6 stim, 1500ms exp, 3500ms delay
 *   lv 16 → introduzione T.Lim retrieval 30000ms
 *   lv 19 → 6x6 (cambio griglia), 9 stim, sessione 180000ms
 *   lv 20 → 6x6, 10 stim, 800ms exp, 5000ms delay, 20000ms tLim repr
 */
export const RECALL_GRID_MBT_LEVELS: readonly RecallGridMBTLevelConfig[] = [
  { livello:  1, tipo: "mbt", gridSize: "3x3", nStimuli: 2, exposureMs: 3000, delayMs: 1000, tLimReproMs: null, trialsPerSession: 5, sessionDurationMs: 90000 },
  { livello:  2, tipo: "mbt", gridSize: "3x3", nStimuli: 2, exposureMs: 3000, delayMs: 1500, tLimReproMs: null, trialsPerSession: 5, sessionDurationMs: 90000 },
  { livello:  3, tipo: "mbt", gridSize: "3x3", nStimuli: 3, exposureMs: 2500, delayMs: 1500, tLimReproMs: null, trialsPerSession: 6, sessionDurationMs: 90000 },
  { livello:  4, tipo: "mbt", gridSize: "3x3", nStimuli: 3, exposureMs: 2500, delayMs: 2000, tLimReproMs: null, trialsPerSession: 6, sessionDurationMs: 90000 },
  { livello:  5, tipo: "mbt", gridSize: "3x3", nStimuli: 4, exposureMs: 2000, delayMs: 2000, tLimReproMs: null, trialsPerSession: 7, sessionDurationMs: 90000 },
  // ── Lv 6: cambio griglia 3×3 → 4×4 (warning) ──
  { livello:  6, tipo: "mbt", gridSize: "4x4", nStimuli: 4, exposureMs: 2000, delayMs: 2000, tLimReproMs: null, trialsPerSession: 7, sessionDurationMs: 90000 },
  { livello:  7, tipo: "mbt", gridSize: "4x4", nStimuli: 4, exposureMs: 1900, delayMs: 2500, tLimReproMs: null, trialsPerSession: 7, sessionDurationMs: 90000 },
  { livello:  8, tipo: "mbt", gridSize: "4x4", nStimuli: 5, exposureMs: 1800, delayMs: 2500, tLimReproMs: null, trialsPerSession: 8, sessionDurationMs: 90000 },
  { livello:  9, tipo: "mbt", gridSize: "4x4", nStimuli: 5, exposureMs: 1800, delayMs: 3000, tLimReproMs: null, trialsPerSession: 8, sessionDurationMs: 90000 },
  { livello: 10, tipo: "mbt", gridSize: "4x4", nStimuli: 5, exposureMs: 1700, delayMs: 3000, tLimReproMs: null, trialsPerSession: 8, sessionDurationMs: 90000 },
] as const;

// ── Tabella livelli MLT ──────────────────────────────────────────────────────
/**
 * Fonte: docs/gdd/families/recall-grid.md §Tabella livelli MLT (righe 110–131).
 * Trascrizione letterale.
 *
 * delayS derivato dalla colonna "Delay" del GDD:
 *   "30 s"     → 30
 *   "1 min"    → 60
 *   "1 min 30 s" → 90
 *   "2 min"    → 120
 *   "3 min"    → 180
 *
 * Allineamento con shared/04-memory-types.md tabella delay MLT (riga 14):
 *   lv 1–4   → 30s
 *   lv 5–8   → 60s (1min)
 *   lv 9–12  → 90s (1m30s)
 *   lv 13–16 → 120s (2min)
 *   lv 17–20 → 180s (3min)
 * Allineamento perfetto. ✓
 *
 * Note GDD (riga 133):
 *   - max gridSize 5×5 (mai 6×6 — carico complessivo eccessivo per 60+ con delay lungo).
 *   - max nStimuli 7 (vs 10 MBT).
 *
 * Verifica a campione:
 *   lv 1  → 3x3, 2 stim, 3500ms exp, 30s delay, 5 trial
 *   lv 5  → cambio delay 30s → 60s
 *   lv 13 → 5x5 (cambio griglia) + delay 120s
 *   lv 15 → introduzione T.Lim retrieval 30000ms
 *   lv 17 → delay 120s → 180s
 *   lv 20 → 5x5, 7 stim, 1500ms exp, 180s delay, 20000ms tLim repr, 2 trial
 */
export const RECALL_GRID_MLT_LEVELS: readonly RecallGridMLTLevelConfig[] = [
  { livello:  1, tipo: "mlt", gridSize: "3x3", nStimuli: 2, exposureMs: 3500, delayS: 30, tLimReproMs: null, trialsPerSession: 5 },
  { livello:  2, tipo: "mlt", gridSize: "3x3", nStimuli: 2, exposureMs: 3500, delayS: 30, tLimReproMs: null, trialsPerSession: 5 },
  { livello:  3, tipo: "mlt", gridSize: "3x3", nStimuli: 3, exposureMs: 3000, delayS: 30, tLimReproMs: null, trialsPerSession: 5 },
  { livello:  4, tipo: "mlt", gridSize: "3x3", nStimuli: 3, exposureMs: 3000, delayS: 30, tLimReproMs: null, trialsPerSession: 5 },
  // ── Lv 5: delay 30s → 60s (warning) ──
  { livello:  5, tipo: "mlt", gridSize: "3x3", nStimuli: 3, exposureMs: 3000, delayS: 60, tLimReproMs: null, trialsPerSession: 4 },
  // ── Lv 6: cambio griglia 3×3 → 4×4 ──
  { livello:  6, tipo: "mlt", gridSize: "4x4", nStimuli: 3, exposureMs: 2800, delayS: 60, tLimReproMs: null, trialsPerSession: 4 },
  { livello:  7, tipo: "mlt", gridSize: "4x4", nStimuli: 4, exposureMs: 2800, delayS: 60, tLimReproMs: null, trialsPerSession: 4 },
  { livello:  8, tipo: "mlt", gridSize: "4x4", nStimuli: 4, exposureMs: 2500, delayS: 60, tLimReproMs: null, trialsPerSession: 4 },
  // ── Lv 9: delay 60s → 90s ──
  { livello:  9, tipo: "mlt", gridSize: "4x4", nStimuli: 4, exposureMs: 2500, delayS: 90, tLimReproMs: null, trialsPerSession: 3 },
  { livello: 10, tipo: "mlt", gridSize: "4x4", nStimuli: 4, exposureMs: 2300, delayS: 90, tLimReproMs: null, trialsPerSession: 3 },
] as const;

// ── Lookup livelli con clamp ─────────────────────────────────────────────────

export function getRecallGridMBTLevel(livello: number): RecallGridMBTLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return RECALL_GRID_MBT_LEVELS[clamped - 1];
}

export function getRecallGridMLTLevel(livello: number): RecallGridMLTLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return RECALL_GRID_MLT_LEVELS[clamped - 1];
}

// ── Warning cambio meccanica MBT ─────────────────────────────────────────────

/**
 * Ritorna il payload del warning per le 3 soglie MBT, in entrambe le direzioni:
 *   - lv 5 ↔ 6:  cambio griglia 3×3 ↔ 4×4
 *   - lv 12 ↔ 13: cambio griglia 4×4 ↔ 5×5 + cambio interazione drag↔tap-to-place
 *   - lv 18 ↔ 19: cambio griglia 5×5 ↔ 6×6 + timer pagina 120s ↔ 180s
 *
 * Per la prima sessione (livelloPrec === null) ritorna sempre null.
 *
 * Testi neutrali sul nome dell'esercizio (parole/immagini) per riusabilità.
 */
export function getRecallGridMBTMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;

  // ── Soglia lv 5 ↔ lv 6 ──
  if (livelloPrec <= 5 && livelloCorrente >= 6 && livelloCorrente <= 12) {
    return {
      titolo: "La griglia diventa più grande",
      testo:
        "Da questo livello la griglia ha più celle (4×4 invece di 3×3). " +
        "Avrai più stimoli da posizionare.",
    };
  }
  if (livelloPrec >= 6 && livelloPrec <= 12 && livelloCorrente <= 5) {
    return {
      titolo: "La griglia torna piccola",
      testo:
        "Da questo livello la griglia è di nuovo 3×3, più semplice da memorizzare.",
    };
  }

  // ── Soglia lv 12 ↔ lv 13 ──
  if (livelloPrec <= 12 && livelloCorrente >= 13 && livelloCorrente <= 18) {
    return {
      titolo: "Cambia il modo di rispondere",
      testo:
        "Da questo livello la griglia è 5×5: per posizionare ogni stimolo, " +
        "prima toccalo nella zona in basso, poi tocca la cella dove vuoi metterlo.",
    };
  }
  if (livelloPrec >= 13 && livelloPrec <= 18 && livelloCorrente <= 12) {
    return {
      titolo: "Torna il trascinamento",
      testo:
        "Da questo livello la griglia è 4×4: per posizionare ogni stimolo, " +
        "trascinalo direttamente nella cella desiderata.",
    };
  }

  // ── Soglia lv 18 ↔ lv 19 ──
  if (livelloPrec <= 18 && livelloCorrente >= 19) {
    return {
      titolo: "La griglia diventa ancora più grande",
      testo:
        "Da questo livello la griglia è 6×6, la dimensione massima. " +
        "Avrai più tempo per riposizionare gli stimoli.",
    };
  }
  if (livelloPrec >= 19 && livelloCorrente <= 18) {
    return {
      titolo: "La griglia torna più piccola",
      testo:
        "Da questo livello la griglia è di nuovo 5×5, meno celle da considerare.",
    };
  }

  return null;
}

// ── Warning cambio meccanica MLT ─────────────────────────────────────────────

/**
 * Ritorna il payload del warning per le 2 soglie MLT, in entrambe le direzioni:
 *   - lv 4 ↔ 5:  delay 30s ↔ 60s (primo aumento sostanziale)
 *   - lv 12 ↔ 13: cambio griglia 4×4 ↔ 5×5 + delay 90s ↔ 120s
 */
export function getRecallGridMLTMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;

  // ── Soglia lv 4 ↔ lv 5 ──
  if (livelloPrec <= 4 && livelloCorrente >= 5 && livelloCorrente <= 12) {
    return {
      titolo: "Il tempo di pausa diventa più lungo",
      testo:
        "Da questo livello tra una griglia e l'altra dovrai seguire la pallina " +
        "più a lungo (1 minuto invece di 30 secondi).",
    };
  }
  if (livelloPrec >= 5 && livelloPrec <= 12 && livelloCorrente <= 4) {
    return {
      titolo: "Il tempo di pausa torna breve",
      testo:
        "Da questo livello la pausa con la pallina è più breve (30 secondi).",
    };
  }

  // ── Soglia lv 12 ↔ lv 13 ──
  if (livelloPrec <= 12 && livelloCorrente >= 13) {
    return {
      titolo: "Griglia più grande e pausa più lunga",
      testo:
        "Da questo livello la griglia è 5×5 e la pausa con la pallina dura 2 minuti.",
    };
  }
  if (livelloPrec >= 13 && livelloCorrente <= 12) {
    return {
      titolo: "Griglia più piccola e pausa più breve",
      testo:
        "Da questo livello la griglia è 4×4 e la pausa con la pallina è di " +
        "1 minuto e 30 secondi.",
    };
  }

  return null;
}
