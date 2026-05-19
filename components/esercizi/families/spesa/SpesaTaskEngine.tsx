"use client";

import { useCallback, useRef } from "react";
import type {
  GameEngineProps, SessionResult, TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getSpesaLevel } from "./levels";
import {
  creaSpesaPoolRef, generaStimoloSpesa,
  type StimoloSpesa, type RispostaSpesa,
} from "./sequence";
import { SpesaSession } from "./SpesaSession";

export function SpesaTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const config  = getSpesaLevel(livello);
  const rngRef  = useRef<() => number>(Math.random);
  const poolRef = useRef(creaSpesaPoolRef());

  const generaStimolo = useCallback(
    (): StimoloSpesa =>
      generaStimoloSpesa(
        config.nLista, config.nScaffale,
        config.esposizioneMs, config.shoppingTimerMs,
        poolRef.current, rngRef.current,
      ),
    [config],
  );

  const valutaRisposta = useCallback(
    (stimolo: StimoloSpesa, risposta: RispostaSpesa | null): boolean => {
      if (!risposta) return false;
      const targetIds = new Set(stimolo.lista.map(a => a.id));
      const sel       = new Set(risposta.selezionati);
      return (
        stimolo.lista.every(a => sel.has(a.id)) &&
        risposta.selezionati.every(id => targetIds.has(id))
      );
    },
    [],
  );

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo: StimoloSpesa,
      risposta: RispostaSpesa | null,
    ): Record<string, number> => {
      const targetIds = new Set(stimolo.lista.map(a => a.id));
      const sel       = risposta?.selezionati ?? [];
      const hit       = sel.filter(id => targetIds.has(id)).length;
      const miss      = stimolo.lista.length - hit;
      const falseAlarm = sel.filter(id => !targetIds.has(id)).length;
      return {
        ...precedenti,
        item_totali:  (precedenti.item_totali ?? 0) + stimolo.lista.length,
        hit:          (precedenti.hit         ?? 0) + hit,
        miss:         (precedenti.miss        ?? 0) + miss,
        false_alarm:  (precedenti.false_alarm ?? 0) + falseAlarm,
      };
    },
    [],
  );

  const renderStimolo = useCallback(
    (props: { stimolo: StimoloSpesa; onRisposta: (r: RispostaSpesa) => void }) => (
      <SpesaSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
      />
    ),
    [tempoScaduto],
  );

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m   = risultato.metriche;
      const tot = m.item_totali ?? 0;
      const hit = m.hit         ?? 0;
      const fa  = m.false_alarm ?? 0;
      // Hit rate con piccola penalità per falsi allarmi.
      const raw = tot > 0 ? (hit - 0.5 * fa) / tot : 0;
      const acc = Math.max(0, Math.min(1, raw));
      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           Math.round(acc * 100),
      });
    },
    [onComplete],
  );

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [{
          titolo: "Spesa al supermercato",
          testo:
            "Ti mostriamo una piccola lista della spesa. Memorizzala con calma. " +
            "Poi entrerai nel supermercato e dovrai trovare esattamente quegli " +
            "alimenti tra molti altri — senza prendere quelli che non erano in lista.",
        }],
      }
    : null;

  return (
    <TrialFlow<StimoloSpesa, RispostaSpesa>
      tLimMs={null}
      trialValutativi={config.trialsPerSession}
      microProgressione={null}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      aggiornaMetriche={aggiornaMetriche}
      tutorial={tutorial}
      feedbackType="standard"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
