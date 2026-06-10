/**
 * Tipi condivisi tra layer UI (components/esercizi/) e layer dati (lib/sync.ts).
 *
 * Questi tipi sono consumati da:
 *   - components/esercizi/shared/TrialFlow.tsx
 *   - components/esercizi/families/[famiglia]/
 *   - app/(app)/esercizi/[id]/page.tsx
 *   - lib/sync.ts (aggiornaProgressione riceve accuratezzaValutativa)
 *
 * I tipi di database (Esercizio, UserLevel, ecc.) vivono in lib/types.ts.
 * Questo file è esclusivamente per la logica del game engine.
 */

import type { ReactNode } from "react";

// ── Costanti timing condivise ─────────────────────────────────────────────────
// Esportate qui (non in TrialFlow.tsx) per evitare che file di logica
// importino da un componente UI. TrialFlow.tsx importa da questo file.

/** Durata feedback visivo (ms). see docs/gdd/shared/02-trial-flow.md §Feedback risposta */
export const FEEDBACK_DURATION_MS = 300;
/** ISI standard (ms). see docs/gdd/shared/02-trial-flow.md §ISI standard */
export const DEFAULT_ISI_MS = 500;
/**
 * Overhead per-trial = feedback + ISI (ms).
 * Usato nella formula pool_min di docs/gdd/shared/01-session-rules.md:
 *   pool_min = ceil(sessionDurationMs / (tLimMs + TRIAL_OVERHEAD_MS)) + 3
 */
export const TRIAL_OVERHEAD_MS = FEEDBACK_DURATION_MS + DEFAULT_ISI_MS; // 800

// ── Contratto game engine ─────────────────────────────────────────────────────

/**
 * Risultato di sessione passato a onComplete da ogni game engine.
 * Superset del contratto originale (score, accuratezza) descritto in CLAUDE.md root.
 */
export interface SessionResult {
  /**
   * Accuratezza calcolata SOLO sui trial valutativi (0.0–1.0).
   * I trial bonus sono esclusi dal calcolo.
   * see docs/gdd/shared/03-progression.md
   *
   * Per famiglie score-based (Verbal Fluency, Word Chain):
   *   1.0 se score ≥ soglia del livello, 0.0 altrimenti.
   */
  accuratezzaValutativa: number;

  /** Score normalizzato 0–100 per la UI (card risultato, barra progresso). */
  scoreGrezzo: number;

  /**
   * Metriche famiglia-specifiche accumulate durante la sessione.
   * Default: {} (oggetto vuoto) se la famiglia non passa aggiornaMetriche.
   * TrialFlow aggiunge automaticamente (quando microProgressione !== null):
   *   mp_bonus_step_max      : 0|1|2 — step bonus massimo raggiunto
   *   mp_trial_bonus_totali  : numero di trial bonus eseguiti
   *   mp_trial_bonus_corretti: trial bonus corretti
   */
  metriche: Record<string, number>;
}

/** Contratto fisso per ogni game engine (da CLAUDE.md root, esteso con SessionResult). */
export interface GameEngineProps {
  /**
   * Id dell'esercizio corrente (chiave del registry, corrisponde a esercizi.id
   * nel DB). Le famiglie multi-esercizio (Odd One Out, Sequence Tap, Recall Grid,
   * ecc.) lo leggono per discriminare la variante interna. Le famiglie a singolo
   * esercizio (Stroop, Flanker, Go/No-Go, SART) possono ignorarlo.
   */
  esercizioId: string;
  livello: number;          // 1–20
  /** true quando il timer di sessione nella pagina padre è scaduto.
   *  Il game engine (o il TrialFlow interno) completa il trial in corso, poi chiama onComplete. */
  tempoScaduto: boolean;
  /**
   * true se questa è la prima sessione in assoluto per questo esercizio per questo utente.
   * Page.tsx calcola: COUNT(sessioni WHERE user_id=? AND esercizio_id=?) === 0.
   * Il game engine usa questo flag per decidere se passare tutorial !== null al TrialFlow.
   */
  mostraTutorial: boolean;
  /**
   * Livello dell'ultima sessione completata da questo utente per questo esercizio.
   * null = nessuna sessione precedente (primo accesso).
   * Il game engine usa questo valore per rilevare cambi di meccanica (warning).
   */
  livelloPrec: number | null;
  /** Il setup è completo — la pagina avvia il timer di sessione solo dopo questa callback. */
  onReady(): void;
  onComplete(risultato: SessionResult): void;
  /** Chiamato quando un trial valutativo viene completato (fase feedback in TrialFlow).
   *  Modello B: total = trialValutativi (number). Modello A: total = null (non usare).
   *  current è 1-based. */
  onProgress?: (current: number, total: number | null) => void;
}

// ── Tipi interni a TrialFlow ──────────────────────────────────────────────────

/**
 * Tipo di feedback visivo dopo la risposta.
 * see docs/gdd/shared/02-trial-flow.md §Feedback risposta
 */
export type FeedbackType =
  | "standard"    // verde/rosso 300ms (default)
  | "none"        // nessun feedback per singola risposta (Sort It lv 14+, Hayling lv 13+)
  | "error-only"; // solo rosso su errore, nessun verde su risposta corretta (SART, Go/No-Go)

/**
 * Configurazione micro-progressione intra-sessione.
 * see docs/gdd/shared/03-progression.md §Micro-progressione intra-livello
 */
export interface MicroProgressioneConfig {
  /** Valore base del parametro al livello corrente (es. tLimMs: 1200). */
  valoreBase: number;
  /**
   * Unità di incremento per step bonus.
   * Negativo per parametri decrescenti (es. −200 per T.Lim).
   * Positivo per crescenti (es. +1 per sequenceLength).
   */
  delta: number;
  /** Numero massimo di step bonus oltre il base. GDD default: 2. */
  maxDelta: number;
  /** Floor (delta < 0) o ceiling (delta > 0) assoluto del parametro.
   *  undefined = nessun limite oltre il base. */
  limite?: number;
}

/**
 * Riga-istruzione (struttura "Osservatorio Stellare"): un'icona in un cerchio
 * colorato + un testo breve. Le pagine usano tipicamente 3 righe nell'ordine
 * "stato base → segnale/target → azione da compiere".
 */
export interface TutorialRiga {
  /** Icona emoji mostrata nel cerchio accentato. */
  icona: string;
  /** Testo breve della riga (linguaggio semplice per utenti 60+). */
  testo: string;
}

/** Singola pagina del tutorial. */
export interface TutorialPagina {
  /** Intestazione (nome dell'esercizio o titolo della pagina). */
  titolo?: string;
  /**
   * Paragrafo introduttivo BREVE opzionale, mostrato sopra le righe.
   * Lasciare undefined quando si usano le `righe` (struttura Osservatorio).
   * Mantenuto per retrocompatibilità con i tutorial non ancora migrati.
   */
  testo?: string;
  /**
   * Righe-istruzione (struttura Osservatorio): tipicamente 3, nell'ordine
   * "stato base → segnale → azione". È la forma da preferire.
   */
  righe?: TutorialRiga[];
  /**
   * Demo/anteprima visiva opzionale: ReactNode montato da TutorialOverlay
   * nell'area dedicata. Lo stato interno (animazioni) vive nel componente demo.
   */
  demo?: ReactNode;
}

/**
 * Configurazione del tutorial per la prima sessione e i cambi di meccanica.
 * Struttura di riferimento: L'Osservatorio Stellare (occhiello "Come si gioca"
 * → titolo → anteprima → 3 righe-istruzione → CTA), con accento per categoria.
 * see docs/gdd/shared/02-trial-flow.md §Schermata tutorial
 *
 * Caso monopagina (comune): pagine: [{ titolo, demo, righe }].
 * TutorialOverlay mostra la navigazione multi-pagina solo se pagine.length > 1.
 */
export interface TutorialConfig {
  pagine: TutorialPagina[];
  /**
   * Colore accento (per categoria): usare CATEGORIA_COLORS[dominio].text.
   * Default: blu se non specificato.
   */
  accent?: string;
  /** Etichetta della CTA sull'ultima pagina. Default: "Ho capito — Inizia". */
  ctaLabel?: string;
}
