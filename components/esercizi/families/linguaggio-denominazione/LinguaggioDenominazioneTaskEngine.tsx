"use client";

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
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

const ACCENT = CATEGORIA_COLORS.linguaggio.text; // dominio Linguaggio

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Inizia",
  pagine: [{
    titolo: "Sinonimo o contrario?",
    righe: [
      { icona: "📖", testo: "Vedrai due parole, una sopra e una sotto." },
      { icona: "🔗", testo: "Guarda se la seconda ha lo stesso significato, il significato opposto, oppure nessun legame." },
      { icona: "👆", testo: "Tocca «Sinonimo», «Contrario» o «Non correlato». Con calma, hai tutto il tempo." },
    ],
  }],
};

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

  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

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
