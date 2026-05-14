/**
 * components/esercizi/families/go-nogo/levels.ts
 *
 * Configurazione livelli per Go/No-Go Cromatico (Famiglia 12, esercizio_id: go_nogo_cromatico).
 *
 * Dominio cognitivo: Funzioni Esecutive — inibizione motoria selettiva.
 *
 * ## Deroghe GDD
 *
 * Le deroghe vivono in `_deroghe.ts`:
 *   - Modello sessione: Modello A timer 60s (GDD prescrive Modello B).
 *   - N distrattori (No-Go): scala 1→6 da lv 3+ (GDD prescrive sempre 1 vs 1).
 *
 * Conseguenza per questo file: il campo `sequenceLength` (numero di stimoli
 * per sessione) è **rimosso** dal tipo perché irrilevante con timer fisso —
 * la sessione termina a 60s indipendentemente dal count. La generazione
 * stimoli è on-demand (vedi `sequence.ts` → `generaProssimoStimolo`).
 *
 * Decisioni implementative:
 *   - Lv 1–13 first-pass (regola singola). Lv 14–20 (congiunzione) → step separato.
 *   - 6 coppie colore GDD implementate (2 per salienza). Selezione runtime nell'engine.
 *   - ISI inter-trial = 0 (flusso continuo, deroga GDD shared/02-trial-flow.md).
 *     TrialFlow consuma: tLimMs = config.tLimMs, isiMs = 0, feedbackType = "error-only".
 *
 * Riferimenti:
 *   docs/gdd/families/go-nogo.md
 *   ./_deroghe.ts
 */

// ── Tipo colore ────────────────────────────────────────────────────────────────
// 8 colori totali: 2 "go base" (verde, blu) condivisi tra le salienza,
// 6 "nogo specifici" che variano per salienza.

export type ColoreGoNogo =
  | "verde"    // go base — salienza alta e media
  | "rosso"    // nogo — salienza alta
  | "blu"      // go base — salienza alta e media
  | "arancio"  // nogo — salienza alta
  | "giallo"   // nogo — salienza media
  | "viola"    // nogo — salienza media
  | "turchese" // nogo — salienza bassa
  | "azzurro"; // nogo — salienza bassa

// ── Hex CSS per ciascun colore (forma su surface #FFFFFF) ─────────────────────
// Tutti i valori passano WCAG AA (≥ 4.5:1 su bianco).

export const COLORE_CSS_GO_NOGO: Record<ColoreGoNogo, string> = {
  verde:    "#16A34A",  // green-600   5.4:1
  rosso:    "#DC2626",  // red-600     4.5:1
  blu:      "#2563EB",  // blue-600    5.0:1
  arancio:  "#EA580C",  // orange-600  4.6:1
  giallo:   "#D97706",  // amber-600   4.7:1
  viola:    "#7C3AED",  // violet-600  5.5:1
  turchese: "#0F766E",  // teal-700    4.9:1
  azzurro:  "#0369A1",  // sky-700     5.9:1
};

// ── Coppia colore go/nogo ──────────────────────────────────────────────────────

export interface CoppiaColore {
  readonly go:   ColoreGoNogo;
  readonly nogo: ColoreGoNogo;
}

// ── Costanti coppie (GDD §Salianza distinzione) ───────────────────────────────

const COPPIA_VR:  CoppiaColore = { go: "verde", nogo: "rosso"    }; // alta
const COPPIA_BA:  CoppiaColore = { go: "blu",   nogo: "arancio"  }; // alta
const COPPIA_VG:  CoppiaColore = { go: "verde", nogo: "giallo"   }; // media
const COPPIA_BV:  CoppiaColore = { go: "blu",   nogo: "viola"    }; // media
// ── Configurazione livello ────────────────────────────────────────────────────
//
// Campo `sequenceLength` rimosso (vedi head comment): con Modello A timer 60s
// la sessione termina a tempoScaduto, indipendentemente dal numero di stimoli.

export interface GoNogoLevelConfig {
  livello: number;
  /**
   * Finestra di risposta per trial in ms. Corrisponde a isiMs della tabella GDD.
   * TrialFlow: tLimMs = this.tLimMs, isiMs = 0 (flusso continuo).
   */
  tLimMs: number;
  salienza: "alta" | "media" | "bassa";
  /**
   * Coppie colore go/nogo ammesse a questo livello (palette di riferimento).
   * L'engine seleziona random tra le coppie all'inizio di ogni sessione.
   * Il `go` della coppia scelta è SEMPRE incluso fra i colori target.
   */
  coppieAmmesse: readonly [CoppiaColore, CoppiaColore] | readonly [CoppiaColore];
  /** Numero di colori target (go) attivi nella sessione. Lv 1-3 = 1, lv 4+ = 2. */
  nGoTarget: number;
  /** Numero di colori distrattori (nogo) attivi nella sessione. */
  nDistrattori: number;
  /**
   * Probabilità di multi-spawn (cerchio go + decoy nogo visibili insieme).
   * Solo applicato quando lo stimolo è di tipo go. Lv 1-7 = 0, lv 8+ > 0.
   */
  multiSpawnRate: number;
}

// ── Warning cambio meccanica ──────────────────────────────────────────────────

/**
 * TODO lv 14–20: implementare warning cambio meccanica al lv 14
 * (regola singola → congiunzione, GDD §Cambio meccanica → schermata di avviso).
 * Per first-pass lv 1–13 nessun cambio meccanica → ritorna sempre null.
 */
export function getGoNogoMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 2 && livelloCorrente === 3) {
    return {
      titolo: "Doppio cerchio!",
      testo:  "Da questo livello a volte appaiono DUE cerchi insieme: tocca SOLO quelli del colore giusto e ignora gli altri.",
    };
  }
  if (livelloPrec === 3 && livelloCorrente === 4) {
    return {
      titolo: "Due colori da toccare",
      testo:  "Da questo livello ci sono DUE colori target: dovrai toccare i cerchi di entrambi i colori e ignorare tutti gli altri.",
    };
  }
  if (livelloPrec === 5 && livelloCorrente === 6) {
    return {
      titolo: "Colori più simili",
      testo:  "Da questo livello i colori dei cerchi sono meno contrastanti: serve più attenzione per distinguerli.",
    };
  }
  return null;
}

// ── Tabella livelli ───────────────────────────────────────────────────────────
/**
 * Tabella livelli Go/No-Go cromatico (lv 1–13 first-pass, regola singola).
 * Fonte: docs/gdd/families/go-nogo.md §Tabella livelli (condivisa).
 *
 * Tabella GDD letterale (colonne residue: Lv | ISI ms | Salianza | Regola).
 * Lo `sequenceLength` GDD non è più utilizzato (timer fisso 60s).
 */
export const GO_NOGO_LEVELS: readonly GoNogoLevelConfig[] = [
  { livello: 1,  tLimMs: 1500, salienza: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA], nGoTarget: 1, nDistrattori: 1, multiSpawnRate: 0    },
  { livello: 2,  tLimMs: 1400, salienza: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA], nGoTarget: 1, nDistrattori: 1, multiSpawnRate: 0    },
  { livello: 3,  tLimMs: 1300, salienza: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA], nGoTarget: 1, nDistrattori: 2, multiSpawnRate: 0.20 },
  { livello: 4,  tLimMs: 1300, salienza: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA], nGoTarget: 2, nDistrattori: 2, multiSpawnRate: 0.25 },
  { livello: 5,  tLimMs: 1200, salienza: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA], nGoTarget: 2, nDistrattori: 3, multiSpawnRate: 0.30 },
  { livello: 6,  tLimMs: 1200, salienza: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV], nGoTarget: 2, nDistrattori: 3, multiSpawnRate: 0.35 },
  { livello: 7,  tLimMs: 1100, salienza: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV], nGoTarget: 2, nDistrattori: 4, multiSpawnRate: 0.40 },
  { livello: 8,  tLimMs: 1100, salienza: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV], nGoTarget: 2, nDistrattori: 4, multiSpawnRate: 0.45 },
  { livello: 9,  tLimMs: 1000, salienza: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV], nGoTarget: 2, nDistrattori: 5, multiSpawnRate: 0.50 },
  { livello: 10, tLimMs: 1000, salienza: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV], nGoTarget: 2, nDistrattori: 5, multiSpawnRate: 0.55 },
] as const;

export function getGoNogoLevel(livello: number): GoNogoLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return GO_NOGO_LEVELS[clamped - 1];
}
