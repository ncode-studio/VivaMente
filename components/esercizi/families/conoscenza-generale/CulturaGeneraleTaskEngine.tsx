"use client";

/**
 * CulturaGeneraleTaskEngine — engine per Conoscenza Generale (cultura_generale).
 *
 * Modello A (timer 90s). T.Lim gestito internamente dalla session (tLimMs={null}).
 * Micro-progressione su rarità index: +1 per trial bonus, max +2 step, ceiling 4.
 *   valoreBase = RARITÀ_INDEX[level.rarità]  (0=molto_nota … 4=rara)
 *   ctx.valoreCorrente → rarità index per il trial corrente
 *
 * T.Lim è fisso per livello (non modulato dalla micro-progressione).
 * Accuratezza: corretti / trial valutativi (standard TrialFlow).
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getCGLevel, RARITÀ_INDEX } from "./levels";
import {
  creaPoolRef,
  generaDomanda,
  type StimoloCG,
  type RispostaCG,
  type CGPoolRef,
} from "./sequence";
import { CulturaGeneraleSession } from "./CulturaGeneraleSession";

// ── Engine ─────────────────────────────────────────────────────────────────────

export function CulturaGeneraleTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level   = useMemo(() => getCGLevel(livello), [livello]);
  const poolRef = useRef<CGPoolRef>(creaPoolRef(Math.random));

  // ── Micro-progressione: rarità index +1 per trial bonus ──────────────────────
  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase: RARITÀ_INDEX[level.rarità],
    delta:      1,
    maxDelta:   2,
  }), [level.rarità]);

  // ── generaStimolo ─────────────────────────────────────────────────────────────
  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloCG =>
      generaDomanda(ctx.valoreCorrente, level.tLimMs, poolRef.current),
    [level.tLimMs],
  );

  // ── valutaRisposta ────────────────────────────────────────────────────────────
  const valutaRisposta = useCallback(
    (stimolo: StimoloCG, risposta: RispostaCG): boolean =>
      risposta !== null && risposta === stimolo.indiceCor,
    [],
  );

  // ── renderStimolo ─────────────────────────────────────────────────────────────
  const renderStimolo = useCallback(
    (props: { stimolo: StimoloCG; onRisposta: (r: RispostaCG) => void }) => (
      <CulturaGeneraleSession stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  // ── Tutorial ──────────────────────────────────────────────────────────────────
  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [{
          titolo: "Cultura Generale",
          testo:
            "Leggi la domanda e scegli la risposta giusta tra le quattro opzioni. " +
            "Tocca il pulsante con la risposta che ritieni corretta. " +
            "Rispondi entro il tempo indicato dalla barra in cima.",
        }],
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <TrialFlow<StimoloCG, RispostaCG>
      tLimMs={null}
      trialValutativi={level.trialsPerSession}
      microProgressione={microProgressione}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      tutorial={tutorial}
      warning={null}
      feedbackType="none"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete}
      onProgress={onProgress}
    />
  );
}
