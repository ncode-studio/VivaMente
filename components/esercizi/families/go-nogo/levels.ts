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
 *   - 6 coppie colore GDD implementate (2 per saliency). Selezione runtime nell'engine.
 *   - ISI inter-trial = 0 (flusso continuo, deroga GDD shared/02-trial-flow.md).
 *     TrialFlow consuma: tLimMs = config.tLimMs, isiMs = 0, feedbackType = "error-only".
 *
 * Riferimenti:
 *   docs/gdd/families/go-nogo.md
 *   ./_deroghe.ts
 */

import type { MicroProgressioneConfig } from "@/lib/exercise-types";

// ── Tipo colore ────────────────────────────────────────────────────────────────
// 8 colori totali: 2 "go base" (verde, blu) condivisi tra le saliency,
// 6 "nogo specifici" che variano per saliency.

export type ColoreGoNogo =
  | "verde"    // go base — saliency alta e media
  | "rosso"    // nogo — saliency alta
  | "blu"      // go base — saliency alta e media
  | "arancio"  // nogo — saliency alta
  | "giallo"   // nogo — saliency media
  | "viola"    // nogo — saliency media
  | "turchese" // nogo — saliency bassa
  | "azzurro"; // nogo — saliency bassa

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
  saliency: "alta" | "media" | "bassa";
  /**
   * Coppie colore go/nogo ammesse a questo livello.
   * L'engine seleziona random tra le coppie all'inizio di ogni sessione,
   * escludendo l'ultima coppia usata per impedire ripetizione consecutiva.
   * Per lv 1–13: sempre 2 coppie (una per saliency level).
   */
  coppieAmmesse: readonly [CoppiaColore, CoppiaColore] | readonly [CoppiaColore];
}

// ── Micro-progressione (costanti di famiglia) ─────────────────────────────────
// see docs/gdd/families/go-nogo.md §Micro-progressione
// Parametro modulato: tLimMs (= ISI del GDD).

export const MICRO_PROGRESSIONE_GO_NOGO = {
  delta:    -50,   // GDD: −50ms ISI per trial bonus
  maxDelta: 2,     // GDD: max 2 step (−100ms totale)
  limite:   600,   // GDD: floor 600ms
} satisfies Omit<MicroProgressioneConfig, "valoreBase">;

// ── Warning cambio meccanica ──────────────────────────────────────────────────

/**
 * TODO lv 14–20: implementare warning cambio meccanica al lv 14
 * (regola singola → congiunzione, GDD §Cambio meccanica → schermata di avviso).
 * Per first-pass lv 1–13 nessun cambio meccanica → ritorna sempre null.
 */
export function getGoNogoMechanicWarning(
  _livelloPrec: number | null,
  _livelloCorrente: number,
): { titolo: string; testo: string } | null {
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
  { livello: 1,  tLimMs: 1500, saliency: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA] },
  { livello: 2,  tLimMs: 1400, saliency: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA] },
  { livello: 3,  tLimMs: 1300, saliency: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA] },
  { livello: 4,  tLimMs: 1300, saliency: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA] },
  { livello: 5,  tLimMs: 1200, saliency: "alta",  coppieAmmesse: [COPPIA_VR, COPPIA_BA] },
  { livello: 6,  tLimMs: 1200, saliency: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV] },
  { livello: 7,  tLimMs: 1100, saliency: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV] },
  { livello: 8,  tLimMs: 1100, saliency: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV] },
  { livello: 9,  tLimMs: 1000, saliency: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV] },
  { livello: 10, tLimMs: 1000, saliency: "media", coppieAmmesse: [COPPIA_VG, COPPIA_BV] },
] as const;

export function getGoNogoLevel(livello: number): GoNogoLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return GO_NOGO_LEVELS[clamped - 1];
}
