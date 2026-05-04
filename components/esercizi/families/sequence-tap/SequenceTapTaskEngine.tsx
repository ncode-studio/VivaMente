"use client";

/**
 * SequenceTapTaskEngine — engine top-level per i 4 esercizi Sequence Tap.
 *
 * Discriminazione via esercizioId:
 *   sequence_tap_numeri_forward   → mode numeri_forward
 *   sequence_tap_numeri_backward  → mode numeri_backward
 *   sequence_tap_parole_forward   → mode parole_forward
 *   sequence_tap_parole_backward  → mode parole_backward
 *
 * Modello A (timer 90s).
 * Micro-progressione TrialFlow-native: +1 seqLen/wordLen, max +2.
 *
 * Riferimento: docs/gdd/families/sequence-tap.md
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getSTStreamLevel,
  getSTBackwardLevel,
  getSTMechanicWarning,
  type STMode,
} from "./levels";
import {
  generaNumeriForward,
  generaNumeriBackward,
  generaParoleForward,
  generaParoleBackward,
  creaParolePoolRef,
  type StimoloST,
  type RispostaST,
} from "./sequence";
import { SequenceTapStreamSession }   from "./SequenceTapStreamSession";
import { SequenceTapBackwardSession } from "./SequenceTapBackwardSession";

// ── Helper: esercizioId → STMode ─────────────────────────────────────────────

function modeFromId(id: string): STMode {
  if (id === "sequence_tap_numeri_backward") return "numeri_backward";
  if (id === "sequence_tap_parole_forward")  return "parole_forward";
  if (id === "sequence_tap_parole_backward") return "parole_backward";
  return "numeri_forward";
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function SequenceTapTaskEngine({
  livello,
  esercizioId,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const rng      = useRef(Math.random);
  const poolRef  = useRef(creaParolePoolRef());
  const usedBwd  = useRef(new Set<string>());

  const mode = useMemo(() => modeFromId(esercizioId), [esercizioId]);

  // ── trialsPerSession ───────────────────────────────────────────────────────
  const trialsPerSession = useMemo(() => {
    if (mode === "parole_backward") return getSTBackwardLevel(livello).trialsPerSession;
    return getSTStreamLevel(mode, livello).trialsPerSession;
  }, [mode, livello]);

  // ── microProgressione ──────────────────────────────────────────────────────
  const microProgressione = useMemo((): MicroProgressioneConfig => {
    if (mode === "parole_backward") {
      return { valoreBase: getSTBackwardLevel(livello).wordLen, delta: 1, maxDelta: 2 };
    }
    return { valoreBase: getSTStreamLevel(mode, livello).seqLen, delta: 1, maxDelta: 2 };
  }, [mode, livello]);

  // ── generaStimolo ──────────────────────────────────────────────────────────
  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }): StimoloST => {
      const override = ctx.valoreCorrente;
      if (mode === "numeri_forward") {
        return generaNumeriForward(getSTStreamLevel("numeri_forward", livello), override, rng.current);
      }
      if (mode === "numeri_backward") {
        return generaNumeriBackward(getSTStreamLevel("numeri_backward", livello), override, rng.current);
      }
      if (mode === "parole_forward") {
        return generaParoleForward(getSTStreamLevel("parole_forward", livello), override, poolRef.current, rng.current);
      }
      return generaParoleBackward(getSTBackwardLevel(livello), override, usedBwd.current, rng.current);
    },
    [mode, livello],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────
  const valutaRisposta = useCallback(
    (stimolo: StimoloST, risposta: RispostaST | null): boolean => {
      if (risposta === null) return false;
      const target = stimolo.targetSequence;
      return (
        risposta.length === target.length &&
        risposta.every((r, i) => r === target[i])
      );
    },
    [],
  );

  // ── aggiornaMetriche ───────────────────────────────────────────────────────
  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      _stimolo: StimoloST,
      _risposta: RispostaST | null,
      corretto: boolean,
    ): Record<string, number> => ({
      ...precedenti,
      trial_corretti: (precedenti.trial_corretti ?? 0) + (corretto ? 1 : 0),
    }),
    [],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────
  const renderStimolo = useCallback(
    (props: { stimolo: StimoloST; onRisposta: (r: RispostaST) => void }) => {
      if (props.stimolo.mode === "parole_backward") {
        return (
          <SequenceTapBackwardSession
            stimolo={props.stimolo}
            onRisposta={props.onRisposta}
          />
        );
      }
      return (
        <SequenceTapStreamSession
          stimolo={props.stimolo}
          onRisposta={props.onRisposta}
        />
      );
    },
    [],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const tutorial: TutorialConfig | null = mostraTutorial
    ? { pagine: [{ titolo: TUTORIAL_TITOLO[mode], testo: TUTORIAL_TESTO[mode] }] }
    : null;

  // ── Warning cambio meccanica ───────────────────────────────────────────────
  const warning = useMemo(
    () => getSTMechanicWarning(livelloPrec, livello, mode),
    [livelloPrec, livello, mode],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TrialFlow<StimoloST, RispostaST>
      tLimMs={null}
      trialValutativi={trialsPerSession}
      microProgressione={microProgressione}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      aggiornaMetriche={aggiornaMetriche}
      tutorial={tutorial}
      warning={warning}
      feedbackType="standard"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete}
      onProgress={onProgress}
    />
  );
}

// ── Testi tutorial ────────────────────────────────────────────────────────────

const TUTORIAL_TITOLO: Record<STMode, string> = {
  numeri_forward:  "Sequenza Numeri — Ordine Diretto",
  numeri_backward: "Sequenza Numeri — Ordine Inverso",
  parole_forward:  "Sequenza Parole — Ordine Diretto",
  parole_backward: "Parola al Contrario",
};

const TUTORIAL_TESTO: Record<STMode, string> = {
  numeri_forward:
    "Guarda i numeri uno alla volta e memorizzali nell'ordine in cui appaiono. " +
    "Quando finiscono, toccali nella stessa sequenza.",
  numeri_backward:
    "Guarda i numeri uno alla volta. Quando finiscono, toccali in ordine inverso, " +
    "partendo dall'ultimo numero visto.",
  parole_forward:
    "Guarda le parole una alla volta e memorizzale nell'ordine in cui appaiono. " +
    "Quando finiscono, toccale nella stessa sequenza.",
  parole_backward:
    "Guarda la parola sullo schermo e memorizzala. Quando scompare, " +
    "tocca le sue lettere in ordine inverso, dalla fine verso l'inizio.",
};
