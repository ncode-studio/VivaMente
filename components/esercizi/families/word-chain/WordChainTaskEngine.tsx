"use client";

/**
 * WordChainTaskEngine — engine per Word Chain Alfabetico (word_chain_alfabetico).
 *
 * Modello A (timer 90s). T.Lim gestito internamente dalla session (tLimMs={null}).
 * Micro-progressione su targetTimeMs: −2000ms per trial bonus, max −2 step, floor 15s.
 * Promozione: trial completato entro targetTimeMs.
 *
 * Riferimento: docs/gdd/families/word-chain.md
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getWCLevel, getWCMechanicWarning, WC_TARGET_FLOOR_MS } from "./levels";
import {
  creaWCPoolRef,
  generaStimoloWC,
  type StimoloWC,
  type RispostaWC,
  type WCPoolRef,
} from "./sequence";
import { WordChainSession } from "./WordChainSession";

// ── Engine ─────────────────────────────────────────────────────────────────────

export function WordChainTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level   = useMemo(() => getWCLevel(livello), [livello]);
  const rng     = useRef(Math.random);
  const poolRef = useRef<WCPoolRef>(creaWCPoolRef(rng.current));

  // ── Micro-progressione: targetTimeMs −2000ms per trial bonus ─────────────
  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase: level.targetTimeMs,
    delta:      -2000,
    maxDelta:   2,
    limite:     WC_TARGET_FLOOR_MS,
  }), [level.targetTimeMs]);

  // ── generaStimolo ──────────────────────────────────────────────────────────
  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloWC =>
      generaStimoloWC(
        level.nWords,
        level.distanza,
        level.tLimMs,
        Math.max(WC_TARGET_FLOOR_MS, ctx.valoreCorrente),
        poolRef.current,
        rng.current,
      ),
    [level],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────
  const valutaRisposta = useCallback(
    (stimolo: StimoloWC, risposta: RispostaWC): boolean =>
      risposta !== null && risposta.tempoMs <= stimolo.targetTimeMs,
    [],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────
  const renderStimolo = useCallback(
    (props: { stimolo: StimoloWC; onRisposta: (r: RispostaWC) => void }) => (
      <WordChainSession stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [{
          titolo: "Word Chain",
          testo:
            "Vedrai una griglia di parole in ordine sparso. " +
            "Toccale in ordine alfabetico: prima quella che inizia per A, poi per B, poi per C, e così via. " +
            "Un tocco sbagliato non ha effetto. Completa la sequenza il più velocemente possibile!",
        }],
      }
    : null;

  // ── Warning ────────────────────────────────────────────────────────────────
  const warning = useMemo(
    () => getWCMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  return (
    <TrialFlow<StimoloWC, RispostaWC>
      tLimMs={null}
      trialValutativi={level.trialsPerSession}
      microProgressione={microProgressione}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
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
