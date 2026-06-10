"use client";

/**
 * UpdatingWMTaskEngine — engine per Updating WM (2 varianti).
 *
 *   updating_wm_parole → Tab A, modalità single (lv 1-3) o updating multi-round (lv 4+)
 *   updating_wm_numeri → Tab B, trasformazioni alternanti
 *
 * Modello A (timer 60s). Timing sequenza gestito internamente (tLimMs={null}).
 * Micro-progressione su nPerRound/nDigits: +1 per trial bonus, max +2.
 *
 * Riferimento: docs/gdd/families/updating-wm.md
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import {
  getUWMTabALevel,
  getUWMTabBLevel,
  getUWMNumeriWarning,
  getUWMParoleWarning,
} from "./levels";
import {
  creaUWMPoolRef,
  generaStimoloPIInner,
  generaStimoloN,
  normalizzaUWM,
  type StimoloUWM,
  type RispostaUWM,
  type UWMPoolRef,
} from "./sequence";
import { UpdatingWMSession } from "./UpdatingWMSession";

// ── Engine ─────────────────────────────────────────────────────────────────────

export function UpdatingWMTaskEngine({
  esercizioId,
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const isNumeri    = esercizioId === "updating_wm_numeri";

  const rng         = useRef(Math.random);
  const poolRef     = useRef<UWMPoolRef>(creaUWMPoolRef(rng.current));
  const trasfIdxRef = useRef(0);

  // ── Livelli ────────────────────────────────────────────────────────────────
  const levelA = useMemo(() => (!isNumeri ? getUWMTabALevel(livello) : null), [isNumeri, livello]);
  const levelB = useMemo(() => (isNumeri  ? getUWMTabBLevel(livello) : null), [isNumeri, livello]);

  const valoreBase = isNumeri ? (levelB!.nDigits) : (levelA!.nPerRound);
  const trialCount = isNumeri ? (levelB!.trialsPerSession) : (levelA!.trialsPerSession);

  // ── Micro-progressione: nPerRound / nDigits +1 per trial bonus ───────────
  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase,
    delta:    1,
    maxDelta: 2,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [valoreBase]);

  // ── generaStimolo ──────────────────────────────────────────────────────────
  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloUWM => {
      if (isNumeri && levelB) {
        const list  = levelB.trasformazioni;
        const trasf = list[trasfIdxRef.current % list.length];
        const isFirst   = trasfIdxRef.current === 0;
        const prevTrasf = isFirst ? null : list[(trasfIdxRef.current - 1) % list.length];
        trasfIdxRef.current++;
        const stim = generaStimoloN(levelB, ctx.valoreCorrente, trasf, rng.current);
        return { ...stim, mostraRegola: isFirst || trasf !== prevTrasf };
      }
      if (levelA) {
        return generaStimoloPIInner(
          levelA,
          ctx.valoreCorrente,
          poolRef.current,
          rng.current,
        );
      }
      throw new Error("UWM: livello non disponibile");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isNumeri, levelA, levelB],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────
  //   PI: una risposta per round, tutte devono essere corrette
  //   N:  una sola risposta
  const valutaRisposta = useCallback(
    (stimolo: StimoloUWM, risposta: RispostaUWM): boolean => {
      if (risposta === null || risposta.length === 0) return false;
      if (stimolo.variante === "numeri") {
        return normalizzaUWM(risposta[0]) === stimolo.rispostaAttesa;
      }
      if (risposta.length !== stimolo.rounds.length) return false;
      return stimolo.rounds.every(
        (r, i) => normalizzaUWM(risposta[i]) === r.rispostaAttesa,
      );
    },
    [],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────
  const renderStimolo = useCallback(
    (props: { stimolo: StimoloUWM; onRisposta: (r: RispostaUWM) => void }) => (
      <UpdatingWMSession stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        accent: CATEGORIA_COLORS.esecutive.text,
        ctaLabel: "Comincia",
        pagine: isNumeri
          ? [{
              titolo: "Updating WM — Numeri",
              righe: [
                { icona: "📏", testo: "All'inizio compare una regola, ad esempio «Aggiungi 1 a ogni numero»." },
                { icona: "🔢", testo: "I numeri appaiono uno alla volta: applica la regola a ciascuno." },
                { icona: "⌨️", testo: "Digita la sequenza trasformata sul tastierino e premi ✓." },
              ],
            }]
          : [{
              titolo: "Updating WM — Oggetti",
              righe: [
                { icona: "❓", testo: "Prima compare una domanda, ad esempio «Qual era il più grande?»." },
                { icona: "👀", testo: "Poi gli oggetti appaiono uno alla volta: osservali e tienili a mente." },
                { icona: "👆", testo: "Alla fine scegli (o scrivi) la risposta giusta. Con calma." },
              ],
            }],
      }
    : null;

  // ── Warning ────────────────────────────────────────────────────────────────
  const warning = useMemo(
    () => (isNumeri
      ? getUWMNumeriWarning(livelloPrec, livello)
      : getUWMParoleWarning(livelloPrec, livello)),
    [isNumeri, livelloPrec, livello],
  );

  return (
    <TrialFlow<StimoloUWM, RispostaUWM>
      tLimMs={null}
      trialValutativi={trialCount}
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
