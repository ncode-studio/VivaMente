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
  MicroProgressioneConfig,
  TutorialConfig,
  SessionResult,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getRilevamentoLevel,
  getRilevamentoMechanicWarning,
  RILEVAMENTO_MICRO_DELTA,
  RILEVAMENTO_MICRO_MAX_OVER,
  RILEVAMENTO_MICRO_LIMITE,
} from "./levels";
import {
  generaStimoloRilevamento,
  type StimoloRilevamento,
  type RispostaRilevamento,
} from "./sequence";
import { RilevamentoStimulus } from "./RilevamentoStimulus";

const ACCENT = CATEGORIA_COLORS.attenzione.text; // Rilevamento = dominio Attenzione

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [
    {
      titolo: "Rilevamento del Cambiamento",
      righe: [
        { icona: "🖼️", testo: "Vedrai una griglia di immagini che lampeggia avanti e indietro." },
        { icona: "🔄", testo: "A ogni lampeggio, una sola immagine cambia. Guarda con attenzione." },
        { icona: "👆", testo: "Tocca l'immagine che cambia. Se sbagli, riprova con calma." },
      ],
    },
  ],
};

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

  // #8 — Micro-progressione su nItem (più immagini nei trial bonus).
  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: level.nItem,
      delta:      RILEVAMENTO_MICRO_DELTA,
      maxDelta:   RILEVAMENTO_MICRO_MAX_OVER,
      limite:     RILEVAMENTO_MICRO_LIMITE,
    }),
    [level.nItem],
  );

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }) =>
      generaStimoloRilevamento(
        ctx.valoreCorrente > 0 ? { ...level, nItem: ctx.valoreCorrente } : level,
        rng.current,
      ),
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
      // #8: con i trial bonus attivi l'accuratezza valutativa la calcola
      // TrialFlow ESCLUDENDO i bonus (GDD: i bonus non contano per
      // l'accuratezza inter-livello). Le metriche totale/trovati/tempo
      // restano in risultato.metriche per analytics.
      onComplete(risultato);
    },
    [onComplete],
  );

  const renderStimolo = useCallback(
    (props: { stimolo: StimoloRilevamento; onRisposta: (r: RispostaRilevamento) => void }) => (
      <RilevamentoStimulus stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

  const warning = useMemo(
    () => getRilevamentoMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  return (
    <TrialFlow<StimoloRilevamento, RispostaRilevamento>
      tLimMs={level.tLimMsPerTrial + 500}
      trialValutativi={null}
      microProgressione={microProgressione}
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
