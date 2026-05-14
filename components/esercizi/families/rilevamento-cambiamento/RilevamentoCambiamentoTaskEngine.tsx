"use client";

/**
 * RilevamentoCambiamentoTaskEngine — engine Rilevamento del Cambiamento.
 *
 * Modello A timer 90s. Flusso continuo (trialValutativi=null, microProgressione=null).
 * Ogni trial: griglia di emoji che alterna ScenaA ↔ blank ↔ ScenaB.
 * L'utente trova e tocca l'emoji che cambia tra le due scene.
 *
 * Timeout per trial: 18s (tLimMsPerTrial in levels). Dopo il timeout, nuovo trial.
 * Accuratezza: trovati / totale_trial.
 *
 * Riferimento: Simons D.J. & Rensink R.A. (2005), Trends Cogn Sci 9(1):16–20.
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  SessionResult,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getRilevamentoLevel,
  getRilevamentoMechanicWarning,
} from "./levels";
import {
  generaStimoloRilevamento,
  type StimoloRilevamento,
  type RispostaRilevamento,
} from "./sequence";
import { RilevamentoStimulus } from "./RilevamentoStimulus";

export function RilevamentoCambiamentoTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level = useMemo(() => getRilevamentoLevel(livello), [livello]);
  const rng   = useRef(Math.random);

  const generaStimolo = useCallback(
    () => generaStimoloRilevamento(level, rng.current),
    [level],
  );

  const valutaRisposta = useCallback(
    (stimolo: StimoloRilevamento, risposta: RispostaRilevamento): boolean =>
      risposta !== null && risposta.idxTappato === stimolo.changeIdx,
    [],
  );

  const aggiornaMetriche = useCallback(
    (
      prev: Record<string, number>,
      _stimolo: StimoloRilevamento,
      risposta: RispostaRilevamento,
      corretto: boolean,
    ): Record<string, number> => ({
      ...prev,
      totale:       (prev.totale       ?? 0) + 1,
      trovati:      (prev.trovati      ?? 0) + (corretto ? 1 : 0),
      tempo_tot_ms: (prev.tempo_tot_ms ?? 0) + (corretto && risposta ? risposta.tempoMs : 0),
    }),
    [],
  );

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m       = risultato.metriche;
      const totale  = m.totale  ?? 0;
      const trovati = m.trovati ?? 0;
      const acc = totale > 0 ? trovati / totale : 0;
      onComplete({ ...risultato, accuratezzaValutativa: acc, scoreGrezzo: Math.round(acc * 100) });
    },
    [onComplete],
  );

  const renderStimolo = useCallback(
    (props: { stimolo: StimoloRilevamento; onRisposta: (r: RispostaRilevamento) => void }) => (
      <RilevamentoStimulus stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [
          {
            titolo: "Rilevamento del Cambiamento",
            testo:
              "Vedrai una griglia di immagini che lampeggia avanti e indietro. " +
              "Ogni volta che lampeggia, UNA immagine cambia. " +
              "Tocca l'immagine che cambia! " +
              "Se tocchi sbagliato, la griglia continua a lampeggiare — riprova.",
          },
        ],
      }
    : null;

  const warning = useMemo(
    () => getRilevamentoMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  return (
    <TrialFlow<StimoloRilevamento, RispostaRilevamento>
      tLimMs={level.tLimMsPerTrial + 500}
      trialValutativi={null}
      microProgressione={null}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      aggiornaMetriche={aggiornaMetriche}
      tutorial={tutorial}
      warning={warning}
      feedbackType="standard"
      isiMs={400}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
