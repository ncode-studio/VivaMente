"use client";

/**
 * TrialFlow — wrapper riusabile per il ciclo trial-by-trial degli esercizi cognitivi.
 *
 * Implementa la macchina a stati descritta in:
 *   docs/gdd/shared/02-trial-flow.md  (ISI, T.Lim, feedback, tutorial, warning)
 *   docs/gdd/shared/03-progression.md (micro-progressione, bonusStep, accuratezza valutativa)
 *
 * ASSUNZIONE: Il timer di sessione (prop tempoScaduto) è gestito dalla pagina padre,
 * che lo avvia solo dopo aver ricevuto la callback onReady(). La macchina interna
 * assume che tempoScaduto non possa diventare true prima che il primo trial sia in
 * fase 'presenting'. Gestire tempoScaduto durante tutorial/warning è quindi fuori
 * scope: il timer non sta ancora correndo in quei momenti.
 *
 * ULTIMO TRIAL: anche l'ultimo trial esegue la sequenza completa feedback (300ms) +
 * ISI (default 500ms) prima di chiamare onComplete. Scelta intenzionale per coerenza
 * UX — l'utente vede sempre il feedback della propria risposta finale. Non è
 * implementata la variante "skip ISI all'ultimo trial".
 *
 * ANTI-FLICKER: lo stato 'generating' mostra uno spinner solo se generaStimolo() è
 * asincrona e impiega > 100ms. Per generazioni sync o sub-100ms, il passaggio a
 * 'presenting' è istantaneo senza rendering intermedio.
 */

import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import type {
  FeedbackType,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import {
  FEEDBACK_DURATION_MS,
  DEFAULT_ISI_MS,
} from "@/lib/exercise-types";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { useTimerControl } from "@/components/esercizi/shared/TimerControlContext";

// ── Costanti ──────────────────────────────────────────────────────────────────
// FEEDBACK_DURATION_MS e DEFAULT_ISI_MS provengono da @/lib/exercise-types
// (condivisi con le famiglie che usano TRIAL_OVERHEAD_MS nella formula pool_min).

/** Soglia anti-flicker: lo spinner appare solo se generating supera questa durata. */
const SPINNER_THRESHOLD_MS = 100;
/** Trial valutativi corretti consecutivi necessari per attivare un trial bonus.
 *  see docs/gdd/shared/03-progression.md §Micro-progressione intra-livello */
const CONSECUTIVI_PER_BONUS = 3;

// ── Props pubbliche ───────────────────────────────────────────────────────────

export interface TrialFlowProps<TStimulus, TResponse> {
  // Configurazione livello
  /** T.Lim per trial in ms. null = nessun timeout (la famiglia gestisce i propri timer
   *  interni, es. Sort It per-carta o Memoria Lista recall 90s). */
  tLimMs: number | null;
  /** Trial valutativi da completare (Modello B — completamento).
   *  null = Modello A — timer fisso: la sessione termina solo via tempoScaduto. */
  trialValutativi: number | null;

  // Micro-progressione — see docs/gdd/shared/03-progression.md
  /** null = nessuna micro-progressione (es. Memoria Prospettica). */
  microProgressione: MicroProgressioneConfig | null;

  // Ciclo stimolo
  /** Genera il prossimo stimolo. Può essere async (fetch da pool DB).
   *  valoreCorrente: valore del parametro di micro-progressione per questo trial.
   *                  Per trial valutativi: sempre valoreBase.
   *                  Per trial bonus: valoreBase + bonusLevel × delta (clampato al limite).
   *                  Se microProgressione=null: 0 (la famiglia può ignorarlo).
   *  isBonus: true se il trial è bonus (la famiglia può mostrare un badge UI). */
  generaStimolo(ctx: {
    valoreCorrente: number;
    isBonus: boolean;
  }): TStimulus | Promise<TStimulus>;

  /**
   * Componente che renderizza lo stimolo e raccoglie la risposta.
   *
   * INVARIANTE DI RIMONTO: TrialFlow rimonta questo componente ad ogni trial
   * (conditional rendering: non è nel tree durante feedback e ISI).
   * I componenti famiglia possono quindi usare useRef(performance.now()) al mount
   * per misurare il tempo di risposta — il ref è sempre inizializzato fresh.
   * Non serve useEffect([stimolo]) per resettare il timer.
   *
   * onRisposta va chiamato una sola volta per trial — chiamate successive sono no-op
   * (TrialFlow le ignora perché la fase è già cambiata da 'presenting').
   */
  renderStimolo: React.ComponentType<{
    stimolo: TStimulus;
    onRisposta(risposta: TResponse): void;
  }>;

  // Validazione — see docs/gdd/shared/02-trial-flow.md
  /** Determina se la risposta è corretta. risposta=null → timeout.
   *
   *  La firma non riceve valoreCorrente deliberatamente: la regola di correttezza
   *  è sempre derivabile dallo stimolo stesso, che generaStimolo() ha già calibrato
   *  al valoreCorrente corretto. Nessuna famiglia del catalogo valuta la correttezza
   *  in modo dipendente dal parametro di micro-progressione indipendentemente dallo stimolo. */
  valutaRisposta(stimolo: TStimulus, risposta: TResponse | null): boolean;

  // Tutorial e warning — see docs/gdd/shared/02-trial-flow.md
  /**
   * tutorial e warning sono mutualmente esclusivi nel design.
   * Se entrambi sono non-null (situazione anomala): tutorial ha priorità
   * e warning viene scartato silenziosamente. In dev mode (NODE_ENV !== 'production')
   * un console.warn segnala l'anomalia.
   */
  tutorial: TutorialConfig | null;
  warning?: { titolo: string; testo: string } | null;

  // Override eccezioni GDD — see docs/gdd/shared/02-trial-flow.md §Feedback risposta
  /** Default: 'standard'.
   *  'none'       → Sort It lv 14–20, Hayling lv 13–20.
   *  'error-only' → SART, Go/No-Go.
   *  Usare 'none' anche quando la famiglia gestisce il proprio feedback internamente
   *  (es. Sort It a tutti i livelli — il componente mostra full/reduced/none per carta
   *  internamente; il feedback TrialFlow tra blocchi non è desiderato). */
  feedbackType?: FeedbackType;
  /** Override ISI standard (DEFAULT_ISI_MS = 500ms). see docs/gdd/shared/02-trial-flow.md §ISI.
   *  SART: isiMs = maskingMs. Go/No-Go: isiMs = 0 (flusso continuo). */
  isiMs?: number;

  // Metriche famiglia-specifiche
  /** Chiamata dopo ogni trial per accumulare metriche custom.
   *  Restituisce il nuovo oggetto metriche. TrialFlow aggiunge automaticamente
   *  mp_bonus_step_max, mp_trial_bonus_totali, mp_trial_bonus_corretti
   *  (solo se microProgressione !== null). */
  aggiornaMetriche?: (
    precedenti: Record<string, number>,
    stimolo: TStimulus,
    risposta: TResponse | null,
    corretto: boolean,
  ) => Record<string, number>;

  /** Calcola scoreGrezzo (0–100) da mostrare nella UI.
   *  Se non fornita: (trialCorretti / trialTotali) × 100. */
  calcolaScore?: (
    metriche: Record<string, number>,
    corretti: number,
    totali: number,
  ) => number;

  // Lifecycle
  /** true quando il timer di sessione della pagina padre è scaduto.
   *  TrialFlow completa il trial in corso (feedback + ISI inclusi), poi chiama onComplete.
   *  Non può essere true prima di onReady() per costruzione — vedi commento file. */
  tempoScaduto: boolean;
  /** Setup completo (tutorial/warning gestiti, primo stimolo pronto).
   *  La pagina avvia il timer di sessione solo dopo questa callback. */
  onReady(): void;
  onComplete(risultato: SessionResult): void;
  /** Chiamato quando un trial valutativo viene completato (fase feedback).
   *  Modello B: total = trialValutativi (number). Modello A: total = null.
   *  current è 1-based. Trial bonus non incrementano current. */
  onProgress?: (current: number, total: number | null) => void;
  /** Opzionale — solo per debugging e test.
   *  Emessa ad ogni transizione della macchina a stati con uno snapshot
   *  dello stato interno. Non usare in produzione. */
  onStateChange?: (snapshot: TrialFlowDebugSnapshot) => void;
}

// ── Stato interno della macchina a stati ─────────────────────────────────────

export type Phase =
  | "tutorial"
  | "warning"
  | "generating"
  | "presenting"
  | "feedback"
  | "isi"
  | "bonus-incoming"
  | "session-end";

/** Snapshot dello stato interno emesso da onStateChange ad ogni transizione.
 *  Usato esclusivamente per debugging e test — non fa parte del contratto API. */
export interface TrialFlowDebugSnapshot {
  phase: Phase;
  consecutiviCorretti: number;
  bonusStep: number;
  nextTrialIsBonus: boolean;
  trialValutativiCompletati: number;
  trialBonusTotali: number;
  sessioneDaTerminare: boolean;
}

interface MachineState<TStimulus> {
  phase: Phase;
  hasWarning: boolean; // necessario per la transizione TUTORIAL_CONFIRMED

  // Trial corrente
  stimoloCorrente: TStimulus | null;
  isBonusTrial: boolean;    // snapshot di nextTrialIsBonus al momento della generazione
  feedbackCorretto: boolean;

  // Contatori sessione
  trialValutativi: number | null;   // null = Modello A (timer)
  trialValutativiCompletati: number;
  trialValutativiCorretti: number;
  trialBonusTotali: number;
  trialBonusCorretti: number;

  // Micro-progressione — see docs/gdd/shared/03-progression.md
  microProgressione: MicroProgressioneConfig | null;
  consecutiviCorretti: number;  // 0→3; reset a 0 su errore valutativo o quando == 3
  bonusStep: number;            // 0→maxDelta; reset a 0 SOLO su bonus errato
  nextTrialIsBonus: boolean;

  // Controllo sessione
  sessioneDaTerminare: boolean;

  // Metriche
  metriche: Record<string, number>;
}

// ── Azioni ───────────────────────────────────────────────────────────────────

type MachineAction<TStimulus> =
  | { type: "TUTORIAL_CONFIRMED" }
  | { type: "WARNING_CONFIRMED" }
  | { type: "STIMULUS_GENERATED"; stimolo: TStimulus }
  | { type: "RESPONSE_EVALUATED"; corretto: boolean; nuoveMetriche: Record<string, number> }
  | { type: "FEEDBACK_DONE" }
  | { type: "ISI_DONE" }
  | { type: "BONUS_INCOMING_DONE" }
  | { type: "TEMPO_SCADUTO" }
  /** Salta direttamente a session-end scartando lo stimolo appena generato.
   *  Usato in generating quando sessioneDaTerminare=true al resolve di generaStimolo
   *  (Bug 1: evita che l'utente giochi un trial extra dopo il timer). */
  | { type: "SKIP_TO_END" };

// ── Funzioni helper ───────────────────────────────────────────────────────────

/**
 * Calcola il valore del parametro di micro-progressione da passare a generaStimolo.
 * see docs/gdd/shared/03-progression.md §Micro-progressione intra-livello
 */
function computeValoreCorrente(
  mp: MicroProgressioneConfig | null,
  bonusStep: number,
  isBonus: boolean,
): number {
  if (mp === null) return 0;           // nessuna micro-progressione; la famiglia ignora
  if (!isBonus) return mp.valoreBase;  // trial valutativo: sempre al base

  // Trial bonus: valoreBase + min(bonusStep+1, maxDelta) × delta, clampato al limite
  const bonusLevel = Math.min(mp.maxDelta, bonusStep + 1);
  const raw = mp.valoreBase + bonusLevel * mp.delta;

  if (mp.limite === undefined) return raw;
  // delta negativo (es. −200ms T.Lim): limite è un floor; delta positivo: è un ceiling
  return mp.delta >= 0 ? Math.min(raw, mp.limite) : Math.max(raw, mp.limite);
}

/**
 * Durata del feedback in ms in base a feedbackType e risultato.
 * see docs/gdd/shared/02-trial-flow.md §Feedback risposta (300ms)
 */
function computeFeedbackDurationMs(feedbackType: FeedbackType, corretto: boolean): number {
  if (feedbackType === "none") return 0;
  if (feedbackType === "error-only" && corretto) return 0;
  return FEEDBACK_DURATION_MS;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function trialFlowReducerImpl<TStimulus>(
  state: MachineState<TStimulus>,
  action: MachineAction<TStimulus>,
): MachineState<TStimulus> {
  switch (action.type) {

    case "TUTORIAL_CONFIRMED":
      // see docs/gdd/shared/02-trial-flow.md §Schermata tutorial
      return { ...state, phase: state.hasWarning ? "warning" : "generating" };

    case "WARNING_CONFIRMED":
      // see docs/gdd/shared/02-trial-flow.md §Cambi di livello con cambio di meccanica
      return { ...state, phase: "generating" };

    case "STIMULUS_GENERATED":
      return {
        ...state,
        phase: "presenting",
        stimoloCorrente: action.stimolo,
        isBonusTrial: state.nextTrialIsBonus,
      };

    case "RESPONSE_EVALUATED": {
      // see docs/gdd/shared/03-progression.md §Micro-progressione intra-livello
      const { corretto, nuoveMetriche } = action;
      const mp = state.microProgressione;

      let { consecutiviCorretti, bonusStep, nextTrialIsBonus } = state;
      let {
        trialValutativiCompletati,
        trialValutativiCorretti,
        trialBonusTotali,
        trialBonusCorretti,
      } = state;

      if (state.isBonusTrial) {
        trialBonusTotali++;
        if (corretto) {
          trialBonusCorretti++;
          bonusStep = mp ? Math.min(mp.maxDelta, bonusStep + 1) : 0;
          nextTrialIsBonus = true; // bonus corretto → subito un altro bonus a difficoltà maggiore
        } else {
          bonusStep = 0;
          nextTrialIsBonus = false; // bonus errato → torna ai trial valutativi al base
        }
      } else {
        // Trial valutativo
        trialValutativiCompletati++;
        if (corretto) {
          trialValutativiCorretti++;
          consecutiviCorretti++;
          // Dopo CONSECUTIVI_PER_BONUS valutativi corretti → prossimo trial è bonus
          // bonusStep NON si tocca qui: un errore valutativo non azzera il bonus accumulato
          if (mp !== null && consecutiviCorretti >= CONSECUTIVI_PER_BONUS) {
            consecutiviCorretti = 0;
            nextTrialIsBonus = true;
          }
        } else {
          // Errore valutativo: reset streak, bonusStep invariato
          consecutiviCorretti = 0;
        }
      }

      // Sessione completa se abbiamo raggiunto il target di trial valutativi (Modello B)
      const sessioneCompleta =
        state.trialValutativi !== null &&
        trialValutativiCompletati >= state.trialValutativi;

      return {
        ...state,
        phase: "feedback",
        feedbackCorretto: corretto,
        consecutiviCorretti,
        bonusStep,
        nextTrialIsBonus,
        trialValutativiCompletati,
        trialValutativiCorretti,
        trialBonusTotali,
        trialBonusCorretti,
        sessioneDaTerminare: state.sessioneDaTerminare || sessioneCompleta,
        metriche: nuoveMetriche,
      };
    }

    case "FEEDBACK_DONE":
      return { ...state, phase: "isi" };

    case "ISI_DONE": {
      if (state.sessioneDaTerminare) return { ...state, phase: "session-end" };
      // Primo trial bonus: mostra avviso 3s (solo al passaggio valutativi→bonus)
      if (!state.isBonusTrial && state.nextTrialIsBonus) return { ...state, phase: "bonus-incoming" };
      return { ...state, phase: "generating" };
    }

    case "BONUS_INCOMING_DONE":
      return { ...state, phase: state.sessioneDaTerminare ? "session-end" : "generating" };

    case "TEMPO_SCADUTO":
      // Non interrompe il trial in corso — verrà controllato alla fine dell'ISI
      return { ...state, sessioneDaTerminare: true };

    case "SKIP_TO_END":
      // Bug 1 fix: stimolo appena generato scartato perché sessioneDaTerminare=true
      // al resolve di generaStimolo. Porta direttamente a session-end senza presentare
      // il trial — l'utente non gioca trial extra dopo il timer.
      return { ...state, phase: "session-end" };

    default:
      return state;
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TrialFlow<TStimulus, TResponse>({
  tLimMs,
  trialValutativi,
  microProgressione,
  generaStimolo,
  renderStimolo: RenderStimolo,
  valutaRisposta,
  tutorial,
  warning = null,
  feedbackType = "standard",
  isiMs = DEFAULT_ISI_MS,
  aggiornaMetriche,
  calcolaScore,
  tempoScaduto,
  onReady,
  onComplete,
  onProgress,
  onStateChange,
}: TrialFlowProps<TStimulus, TResponse>) {

  // Dev-mode: tutorial e warning non dovrebbero essere entrambi non-null
  if (process.env.NODE_ENV !== "production" && tutorial !== null && warning != null) {
    console.warn(
      "[TrialFlow] tutorial e warning sono entrambi non-null. " +
      "Questa è una situazione anomala: tutorial ha priorità e warning sarà scartato.",
    );
  }

  const timerControl = useTimerControl();

  // ── Bug 2 fix: snapshot di tutorial/warning al mount ──────────────────────
  // Le prop tutorial/warning vengono lette solo al mount per determinare la fase iniziale
  // e nel render. Non devono aggiornarsi dopo il mount: un cambio di prop a sessione
  // avviata è fuori dal contratto del componente. I refs garantiscono coerenza tra
  // stato iniziale del reducer e render anche se la prop cambia durante il ciclo di vita.
  const tutorialRef = useRef(tutorial);
  const warningRef  = useRef(warning ?? null);

  // ── Reducer setup ──────────────────────────────────────────────────────────
  // Chiarimento 3.1: TypeScript 5.x supporta generic instantiation expressions.
  // trialFlowReducerImpl<TStimulus> produce il tipo concreto richiesto da useReducer
  // senza bisogno di un ref wrapper. Verificato: npx tsc --noEmit pulito.
  const [state, dispatch] = useReducer(
    trialFlowReducerImpl<TStimulus>,
    undefined,
    (_: undefined): MachineState<TStimulus> => ({
      phase: tutorialRef.current !== null ? "tutorial"
           : warningRef.current  !== null ? "warning"
           : "generating",
      hasWarning: warningRef.current !== null,
      stimoloCorrente: null,
      isBonusTrial: false,
      feedbackCorretto: false,
      trialValutativi,
      trialValutativiCompletati: 0,
      trialValutativiCorretti: 0,
      trialBonusTotali: 0,
      trialBonusCorretti: 0,
      microProgressione,
      consecutiviCorretti: 0,
      bonusStep: 0,
      nextTrialIsBonus: false,
      sessioneDaTerminare: false,
      metriche: {},
    }),
  );

  // ── Refs (accesso stabile a valori mutabili da dentro gli effect) ──────────

  const latestState = useRef(state);
  latestState.current = state;

  // Chiarimento 3.2: latestProps.current aggiornato in un effect senza deps
  // (equivalente a "dopo ogni commit") per evitare l'anti-pattern di assegnare
  // un ref durante il render, che può causare problemi in StrictMode.
  const latestProps = useRef({
    generaStimolo, valutaRisposta, aggiornaMetriche, calcolaScore,
    onReady, onComplete, onStateChange, feedbackType, isiMs, tLimMs,
  });
  useEffect(() => {
    latestProps.current = {
      generaStimolo, valutaRisposta, aggiornaMetriche, calcolaScore,
      onReady, onComplete, onStateChange, feedbackType, isiMs, tLimMs,
    };
  }); // niente dependency array: aggiornato ad ogni commit

  // Emette snapshot ad ogni transizione del reducer — solo se onStateChange è fornita.
  // Posizionato DOPO l'effect di aggiornamento latestProps: React esegue gli effects
  // nell'ordine di definizione, quindi latestProps è già aggiornato quando questo gira.
  useEffect(() => {
    latestProps.current.onStateChange?.({
      phase: state.phase,
      consecutiviCorretti: state.consecutiviCorretti,
      bonusStep: state.bonusStep,
      nextTrialIsBonus: state.nextTrialIsBonus,
      trialValutativiCompletati: state.trialValutativiCompletati,
      trialBonusTotali: state.trialBonusTotali,
      sessioneDaTerminare: state.sessioneDaTerminare,
    });
  }, [state]); // ogni dispatch del reducer produce un nuovo oggetto state → effect si attiva

  const onReadyCalledRef = useRef(false);
  const tLimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stato anti-flicker per generating ─────────────────────────────────────

  const [showSpinner, setShowSpinner] = useState(false);

  // ── Callback: gestione risposta (utente o timeout) ────────────────────────

  /**
   * Handler condiviso per risposta utente e timeout.
   * Il primo a chiamarlo "vince" — il secondo trova phase !== 'presenting' e si ferma.
   * Cancella il timer T.Lim per prevenire double-dispatch.
   */
  const handleEvaluation = useCallback((risposta: TResponse | null) => {
    const s = latestState.current;
    if (s.phase !== "presenting" || s.stimoloCorrente === null) return;

    // Cancella T.Lim per evitare double-dispatch
    if (tLimTimerRef.current !== null) {
      clearTimeout(tLimTimerRef.current);
      tLimTimerRef.current = null;
    }

    const { valutaRisposta: validate, aggiornaMetriche: accumulate } = latestProps.current;
    const corretto = validate(s.stimoloCorrente, risposta);
    const nuoveMetriche = accumulate
      ? accumulate(s.metriche, s.stimoloCorrente, risposta, corretto)
      : s.metriche;

    dispatch({ type: "RESPONSE_EVALUATED", corretto, nuoveMetriche });
  }, []);

  /** Callback stabile passata a renderStimolo. */
  const handleRisposta = useCallback(
    (risposta: TResponse) => handleEvaluation(risposta),
    [handleEvaluation],
  );

  // ── Effect: onProgress init al mount (Modello B) ──────────────────────────
  // Emette (0, total) subito al mount per rendere il badge visibile prima del
  // primo feedback. Modello A: trialValutativi === null → noop.

  useEffect(() => {
    if (trialValutativi !== null) {
      onProgress?.(0, trialValutativi);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect: TEMPO_SCADUTO prop ────────────────────────────────────────────

  useEffect(() => {
    if (tempoScaduto) dispatch({ type: "TEMPO_SCADUTO" });
  }, [tempoScaduto]);

  // ── Effect: tempoScaduto durante presenting → forza chiusura trial ─────────
  // Per famiglie con T.Lim trial lungo (Odd One Out lv 1-12 = 8s default
  // tramite deroga, oppure null GDD) il trial in corso bloccherebbe la
  // sessione fino al T.Lim. Forziamo handleEvaluation(null) per chiudere
  // immediatamente come timeout (= trial errato, coerente con
  // shared/02-trial-flow.md §Comportamento a timeout).
  //
  // Path no-op per Modello B (tempoScaduto sempre false) e per famiglie
  // con mini-engine che gestiscono internamente tempoScaduto (Recall Grid).
  useEffect(() => {
    if (!tempoScaduto) return;
    if (state.phase !== "presenting" || state.stimoloCorrente === null) return;
    handleEvaluation(null);
  }, [tempoScaduto, state.phase, state.stimoloCorrente, handleEvaluation]);

  // ── Effect: fase GENERATING ────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "generating") {
      setShowSpinner(false);
      return;
    }

    let cancelled = false;

    // Anti-flicker: spinner visibile solo se generaStimolo() impiega > SPINNER_THRESHOLD_MS
    const spinnerTimer = setTimeout(() => {
      if (!cancelled) setShowSpinner(true);
    }, SPINNER_THRESHOLD_MS);

    const { bonusStep, nextTrialIsBonus, microProgressione: mp } = latestState.current;
    const valoreCorrente = computeValoreCorrente(mp, bonusStep, nextTrialIsBonus);

    Promise.resolve(
      latestProps.current.generaStimolo({ valoreCorrente, isBonus: nextTrialIsBonus }),
    ).then((stimolo) => {
      if (cancelled) return;
      clearTimeout(spinnerTimer);
      setShowSpinner(false);

      // Bug 1 fix: se sessioneDaTerminare è diventato true mentre attendevamo
      // il resolve di generaStimolo, lo stimolo viene scartato e la macchina
      // salta direttamente a session-end senza presentare un trial aggiuntivo.
      // see schema macchina a stati: generating + resolve + sessioneDaTerminare=true → session-end
      if (latestState.current.sessioneDaTerminare) {
        dispatch({ type: "SKIP_TO_END" });
      } else {
        dispatch({ type: "STIMULUS_GENERATED", stimolo });
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(spinnerTimer);
    };
  }, [state.phase]);

  // ── Effect: fase PRESENTING — onReady + T.Lim ─────────────────────────────

  useEffect(() => {
    if (state.phase !== "presenting") return;

    // onReady() una sola volta: informa la pagina che il primo stimolo è pronto
    // e il timer di sessione può partire. see docs/gdd/shared/02-trial-flow.md §Timer
    if (!onReadyCalledRef.current) {
      onReadyCalledRef.current = true;
      latestProps.current.onReady();
    }

    const { tLimMs: limit } = latestProps.current;
    if (limit === null) return; // nessun T.Lim per questa famiglia

    // see docs/gdd/shared/02-trial-flow.md §Comportamento a timeout (T.Lim)
    tLimTimerRef.current = setTimeout(() => {
      tLimTimerRef.current = null;
      handleEvaluation(null); // null = timeout → risposta errata
    }, limit);

    return () => {
      if (tLimTimerRef.current !== null) {
        clearTimeout(tLimTimerRef.current);
        tLimTimerRef.current = null;
      }
    };
  }, [state.phase, handleEvaluation]);

  // ── Effect: fase FEEDBACK ─────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "feedback") return;

    // Notifica progresso a page.tsx — solo trial valutativi, i bonus non incrementano current.
    if (!state.isBonusTrial) {
      onProgress?.(state.trialValutativiCompletati, state.trialValutativi);
    }

    // see docs/gdd/shared/02-trial-flow.md §Feedback risposta (verde/rosso 300ms)
    const duration = computeFeedbackDurationMs(
      latestProps.current.feedbackType,
      state.feedbackCorretto,
    );

    const timer = setTimeout(() => {
      dispatch({ type: "FEEDBACK_DONE" });
    }, duration);

    return () => clearTimeout(timer);
  }, [state.phase, state.feedbackCorretto, state.isBonusTrial, state.trialValutativiCompletati, state.trialValutativi, onProgress]);

  // ── Effect: fase ISI ──────────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "isi") return;

    // see docs/gdd/shared/02-trial-flow.md §ISI standard (500ms)
    // Anche l'ultimo trial esegue ISI per coerenza UX (vedi commento file header).
    const timer = setTimeout(() => {
      dispatch({ type: "ISI_DONE" });
    }, latestProps.current.isiMs);

    return () => clearTimeout(timer);
  }, [state.phase]);

  // ── Effect: fase BONUS-INCOMING ──────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "bonus-incoming") return;
    timerControl?.pausa();
    const timer = setTimeout(() => {
      timerControl?.riprendi();
      dispatch({ type: "BONUS_INCOMING_DONE" });
    }, 3000);
    return () => {
      clearTimeout(timer);
      timerControl?.riprendi();
    };
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect: fase SESSION-END ──────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "session-end") return;

    const {
      trialValutativiCompletati,
      trialValutativiCorretti,
      trialBonusTotali,
      trialBonusCorretti,
      bonusStep,
      metriche,
      microProgressione: mp,
    } = latestState.current;

    const accuratezzaValutativa =
      trialValutativiCompletati > 0
        ? trialValutativiCorretti / trialValutativiCompletati
        : 0;

    // see docs/gdd/shared/03-progression.md — metriche auto-emesse (prefisso mp_)
    const metricheFinali: Record<string, number> = {
      ...metriche,
      ...(mp !== null
        ? {
            mp_bonus_step_max: bonusStep,
            mp_trial_bonus_totali: trialBonusTotali,
            mp_trial_bonus_corretti: trialBonusCorretti,
          }
        : {}),
    };

    const { calcolaScore: customScore, onComplete: complete } = latestProps.current;
    const scoreGrezzo = customScore
      ? customScore(metricheFinali, trialValutativiCorretti, trialValutativiCompletati)
      : Math.round(accuratezzaValutativa * 100);

    complete({ accuratezzaValutativa, scoreGrezzo, metriche: metricheFinali });
  }, [state.phase]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Tutorial — see docs/gdd/shared/02-trial-flow.md §Schermata tutorial
  // Bug 2 fix: usa tutorialRef.current (snapshot al mount) invece della prop corrente.
  if (state.phase === "tutorial" && tutorialRef.current !== null) {
    return (
      <TutorialOverlay
        config={tutorialRef.current}
        onComplete={() => dispatch({ type: "TUTORIAL_CONFIRMED" })}
      />
    );
  }

  // Warning — see docs/gdd/shared/02-trial-flow.md §Cambi di livello con cambio di meccanica
  // Bug 2 fix: usa warningRef.current (snapshot al mount).
  if (state.phase === "warning" && warningRef.current !== null) {
    return (
      <WarningOverlayShell
        titolo={warningRef.current.titolo}
        testo={warningRef.current.testo}
        onConfirm={() => dispatch({ type: "WARNING_CONFIRMED" })}
      />
    );
  }

  // Generating: spinner solo se async e dura > 100ms (anti-flicker)
  if (state.phase === "generating") {
    return showSpinner ? <GeneratingSpinner /> : null;
  }

  // Bonus-incoming: avviso 3s auto-dismiss, solo al primo bonus della sequenza
  if (state.phase === "bonus-incoming") {
    return <BonusIncomingOverlay />;
  }

  // Presenting: lo stimolo è visibile, l'utente può rispondere
  if (state.phase === "presenting" && state.stimoloCorrente !== null) {
    return (
      <div className="flex flex-col w-full">
        {state.isBonusTrial && (
          <div style={{ display: "flex", justifyContent: "center", padding: "0.4rem 0 0.2rem" }}>
            <span style={{ fontSize: "1.2rem", color: "#F59E0B", lineHeight: 1 }}>★</span>
          </div>
        )}
        <RenderStimolo
          stimolo={state.stimoloCorrente}
          onRisposta={handleRisposta}
        />
      </div>
    );
  }

  // Feedback: overlay colorato 300ms (o nulla se feedbackType='none' o skip)
  if (state.phase === "feedback") {
    const duration = computeFeedbackDurationMs(feedbackType, state.feedbackCorretto);
    if (duration === 0) return null; // skip visivo ma il timer è comunque in corso nell'effect
    return <FeedbackOverlay corretto={state.feedbackCorretto} />;
  }

  // ISI: schermo vuoto — see docs/gdd/shared/02-trial-flow.md §ISI standard
  // session-end: nulla (la pagina gestirà la navigazione dopo onComplete)
  return null;
}

// ── Componenti UI interni (da implementare nei file dedicati) ─────────────────
// Questi shell verranno sostituiti dai componenti completi in:
//   components/esercizi/shared/TutorialOverlay.tsx
//   components/esercizi/shared/WarningOverlay.tsx


function WarningOverlayShell({
  titolo,
  testo,
  onConfirm,
}: {
  titolo: string;
  testo: string;
  onConfirm(): void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-6 gap-4">
      <p className="text-lg font-bold text-center">{titolo}</p>
      <p className="text-base leading-relaxed text-center max-w-xs text-gray-600">{testo}</p>
      <button
        onClick={onConfirm}
        className="mt-4 w-full max-w-xs rounded-2xl bg-blue-600 py-4 text-white font-semibold text-base"
      >
        Ho capito
      </button>
    </div>
  );
}

function FeedbackOverlay({ corretto }: { corretto: boolean }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{
        backgroundColor: corretto
          ? "rgba(22, 163, 74, 0.15)"   // verde
          : "rgba(220, 38, 38, 0.15)",  // rosso
        borderRadius: 0,
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: corretto
            ? "rgba(22, 163, 74, 0.9)"
            : "rgba(220, 38, 38, 0.9)",
        }}
      >
        <span className="text-white text-3xl font-bold">
          {corretto ? "✓" : "✗"}
        </span>
      </div>
    </div>
  );
}

function GeneratingSpinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
    </div>
  );
}

function BonusIncomingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "rgba(254, 243, 199, 0.97)" }}
    >
      <span style={{ fontSize: "3rem", lineHeight: 1, color: "#F59E0B" }}>★</span>
      <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#92400E", textAlign: "center" }}>
        Bonus!
      </p>
    </div>
  );
}
