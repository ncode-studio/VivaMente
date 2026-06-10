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
  TutorialRiga,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
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
  // Rimosso dall'uso: Modello A puro chiude la sessione solo al timer.
  // Calcolo conservato per analytics futura.
  const _trialsPerSession = useMemo(() => {
    if (mode === "parole_backward") return getSTBackwardLevel(livello).trialsPerSession;
    return getSTStreamLevel(mode, livello).trialsPerSession;
  }, [mode, livello]);
  void _trialsPerSession;

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
      if (risposta.length !== target.length) return false;
      const isParole = stimolo.mode === "parole_forward" || stimolo.mode === "parole_backward";
      return risposta.every((r, i) =>
        isParole
          ? r.trim().toLowerCase() === target[i].toLowerCase()
          : r === target[i],
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
    ? {
        accent: ACCENT,
        ctaLabel: TUTORIAL_CTA[mode],
        pagine: [{ titolo: TUTORIAL_TITOLO[mode], righe: TUTORIAL_RIGHE[mode] }],
      }
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
      // Modello A puro: il timer di sessione (registry SESSION_TIMER_MS) è
      // l'unica condizione di fine. trialsPerSession resta come hint ma non
      // chiude l'esercizio in anticipo. (Fix: l'esercizio terminava prima
      // dello scadere del timer.)
      trialValutativi={null}
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

// ── Tutorial ──────────────────────────────────────────────────────────────────
// Dominio Memoria. Struttura canonica (occhiello → titolo → 3 righe → CTA):
// ogni mode segue l'ordine "stato base → segnale/cosa osservare → azione".

const ACCENT = CATEGORIA_COLORS.memoria.text; // Sequence Tap = dominio Memoria

const TUTORIAL_TITOLO: Record<STMode, string> = {
  numeri_forward:  "Sequenza Numeri — Ordine Diretto",
  numeri_backward: "Sequenza Numeri — Ordine Inverso",
  parole_forward:  "Sequenza Parole — Ordine Diretto",
  parole_backward: "Parola al Contrario",
};

const TUTORIAL_CTA: Record<STMode, string> = {
  numeri_forward:  "Inizia",
  numeri_backward: "Inizia",
  parole_forward:  "Inizia",
  parole_backward: "Inizia",
};

const TUTORIAL_RIGHE: Record<STMode, TutorialRiga[]> = {
  numeri_forward: [
    { icona: "🔢", testo: "I numeri appaiono uno alla volta sullo schermo." },
    { icona: "🧠", testo: "Memorizzali nell'ordine in cui li vedi." },
    { icona: "👆", testo: "Quando finiscono, toccali nella stessa sequenza." },
  ],
  numeri_backward: [
    { icona: "🔢", testo: "I numeri appaiono uno alla volta sullo schermo." },
    { icona: "🔁", testo: "Memorizzali: dovrai ripeterli al contrario." },
    { icona: "👆", testo: "Toccali in ordine inverso, dall'ultimo al primo." },
  ],
  parole_forward: [
    { icona: "📖", testo: "Le parole appaiono una alla volta sullo schermo." },
    { icona: "🧠", testo: "Memorizzale nell'ordine in cui le vedi." },
    { icona: "👆", testo: "Quando finiscono, toccale nella stessa sequenza." },
  ],
  parole_backward: [
    { icona: "📖", testo: "Una parola appare per qualche istante, poi scompare." },
    { icona: "🔁", testo: "Ricorda le sue lettere: ti serviranno al contrario." },
    { icona: "👆", testo: "Tocca le lettere in ordine inverso, dall'ultima alla prima." },
  ],
};
