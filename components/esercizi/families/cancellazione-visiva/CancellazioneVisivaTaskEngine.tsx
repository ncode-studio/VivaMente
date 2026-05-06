"use client";

import { useCallback, useRef } from "react";
import type {
  GameEngineProps,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getCancellazioneVisivaLevel } from "./levels";
import {
  generaGriglia,
  type StimoloCancellazione,
  type RispostaCancellazione,
} from "./stimuli";
import { CancellazioneVisivaSession } from "./CancellazioneVisivaSession";

export function CancellazioneVisivaTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const config = getCancellazioneVisivaLevel(livello);
  const rngRef = useRef<() => number>(Math.random);

  // ── generaStimolo ──────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (_ctx: { valoreCorrente: number }): StimoloCancellazione =>
      generaGriglia(config, rngRef.current),
    [config],
  );

  // ── valutaRisposta (strict: tutti i target + nessun falso allarme) ─────────

  const valutaRisposta = useCallback(
    (
      stimolo:  StimoloCancellazione,
      risposta: RispostaCancellazione | null,
    ): boolean => {
      if (!risposta) return false;
      const targetSet = new Set(stimolo.targetIndices);
      const allHits   = stimolo.targetIndices.every((i) => risposta.toccate.includes(i));
      const noFalse   = risposta.toccate.every((i) => targetSet.has(i));
      return allHits && noFalse;
    },
    [],
  );

  // ── aggiornaMetriche ───────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo:    StimoloCancellazione,
      risposta:   RispostaCancellazione | null,
      _corretto:  boolean,
    ): Record<string, number> => {
      if (!risposta) return precedenti;
      const targetSet  = new Set(stimolo.targetIndices);
      const hits       = risposta.toccate.filter((i) =>  targetSet.has(i)).length;
      const falseAlarm = risposta.toccate.filter((i) => !targetSet.has(i)).length;
      return {
        ...precedenti,
        target_totali:    (precedenti.target_totali    ?? 0) + stimolo.targetIndices.length,
        colpiti:          (precedenti.colpiti          ?? 0) + hits,
        falsi_allarmi:    (precedenti.falsi_allarmi    ?? 0) + falseAlarm,
        trial_completati: (precedenti.trial_completati ?? 0) + 1,
      };
    },
    [],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo:    StimoloCancellazione;
      onRisposta: (r: RispostaCancellazione) => void;
    }) => (
      <CancellazioneVisivaSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
      />
    ),
    [tempoScaduto],
  );

  // ── onCompleteWrapped — accuratezza con penalità falsi allarmi ─────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m      = risultato.metriche;
      const totali = m.target_totali  ?? 0;
      const hits   = m.colpiti        ?? 0;
      const falsi  = m.falsi_allarmi  ?? 0;
      const acc    = totali > 0 ? Math.max(0, (hits - falsi) / totali) : 0;
      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           Math.round(acc * 100),
      });
    },
    [onComplete],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [
          {
            titolo: "Trova la lettera",
            testo:
              "In alto vedrai una lettera da cercare. Nella griglia ci sono tante lettere mescolate: tocca tutte le copie della lettera target, una per una.",
          },
          {
            titolo: "Poi tocca Fatto",
            testo:
              "Quando pensi di averle trovate tutte, tocca 'Fatto'. Attenzione: toccare la lettera sbagliata penalizza il punteggio — meglio essere sicuri prima di toccare.",
          },
        ],
      }
    : null;

  // ── Render (Modello A — timer 60s) ────────────────────────────────────────

  return (
    <TrialFlow<StimoloCancellazione, RispostaCancellazione>
      tLimMs={null}
      trialValutativi={null}
      microProgressione={null}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      aggiornaMetriche={aggiornaMetriche}
      tutorial={tutorial}
      warning={null}
      feedbackType="standard"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
