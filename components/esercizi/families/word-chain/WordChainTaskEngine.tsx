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
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
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

const ACCENT = CATEGORIA_COLORS.esecutive.text; // Word Chain = dominio Esecutive

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [{
    titolo: "Word Chain",
    righe: [
      { icona: "🔤", testo: "Vedrai alcune parole sparse sullo schermo." },
      { icona: "🅰️", testo: "Toccale in ordine alfabetico: prima la A, poi la B, poi la C…" },
      { icona: "⏱️", testo: "Tocca solo la parola giusta: un tocco sbagliato lampeggia di rosso e ti fa perdere tempo. Completa la catena con calma, ma cerca di essere rapido." },
    ],
  }],
};

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
  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

  // ── Warning ────────────────────────────────────────────────────────────────
  const warning = useMemo(
    () => getWCMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  return (
    <TrialFlow<StimoloWC, RispostaWC>
      tLimMs={null}
      // Modello A puro: termina solo al timer di sessione.
      trialValutativi={null}
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
