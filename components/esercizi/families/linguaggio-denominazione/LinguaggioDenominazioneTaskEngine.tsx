"use client";

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getSynonymAntonymLevel,
  FLOOR_TLIM_SYNONYM_ANTONYM,
} from "./levels";
import {
  creaPoolRef,
  generaSynonymAntonym,
  type StimoloSA,
  type RispostaLD,
  type LDPoolRef,
} from "./sequence";
import type { SARelazione } from "./word-pools";
import { SynonymAntonymSession } from "./SynonymAntonymSession";

export function LinguaggioDenominazioneTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level = useMemo(() => getSynonymAntonymLevel(livello), [livello]);

  const rng     = useRef(Math.random);
  const poolRef = useRef<LDPoolRef>(creaPoolRef(rng.current));

  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase: level.tLimMs,
    delta:      -200,
    maxDelta:   2,
    limite:     FLOOR_TLIM_SYNONYM_ANTONYM,
  }), [level.tLimMs]);

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloSA => {
      const tLimMs = Math.max(FLOOR_TLIM_SYNONYM_ANTONYM, ctx.valoreCorrente);
      const saLevel = getSynonymAntonymLevel(livello);
      return generaSynonymAntonym(saLevel.difficoltà, tLimMs, poolRef.current);
    },
    [livello],
  );

  const valutaRisposta = useCallback(
    (stimolo: StimoloSA, risposta: RispostaLD): boolean => {
      if (risposta === null) return false;
      return (risposta as SARelazione) === stimolo.relazioneCorrelta;
    },
    [],
  );

  const renderStimolo = useCallback(
    (props: { stimolo: StimoloSA; onRisposta: (r: RispostaLD) => void }) => (
      <SynonymAntonymSession
        stimolo={props.stimolo}
        onRisposta={(r) => props.onRisposta(r)}
      />
    ),
    [],
  );

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [{
          titolo: "Sinonimo o contrario?",
          testo:
            "Vedrai due parole. Scegli se la seconda è un sinonimo (stesso significato), " +
            "un contrario (significato opposto) o non correlata alla prima.",
        }],
      }
    : null;

  return (
    <TrialFlow<StimoloSA, RispostaLD>
      tLimMs={null}
      trialValutativi={level.trialsPerSession}
      microProgressione={microProgressione}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      tutorial={tutorial}
      warning={null}
      feedbackType="standard"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete}
      onProgress={onProgress}
    />
  );
}
