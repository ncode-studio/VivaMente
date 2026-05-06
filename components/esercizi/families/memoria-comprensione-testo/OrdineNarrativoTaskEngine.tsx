"use client";

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getMCTOrdineNarrativoLevel,
  MCTON_MICRO_DELTA,
  MCTON_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloOrdineNarrativo,
  creaMCTONPoolRef,
  type StimoloOrdineNarrativo,
  type RispostaOrdineNarrativo,
} from "./sequence-ordine";
import { OrdineNarrativoSession } from "./OrdineNarrativoSession";

export function OrdineNarrativoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const config  = getMCTOrdineNarrativoLevel(livello);
  const rngRef  = useRef<() => number>(Math.random);
  const poolRef = useRef(creaMCTONPoolRef(rngRef.current));

  // ── Micro-progressione su nEventi (+1 per trial bonus, max +2) ───────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.nEventi,
      delta:      MCTON_MICRO_DELTA,
      maxDelta:   MCTON_MICRO_MAX_OVER,
    }),
    [config.nEventi],
  );

  // ── generaStimolo ─────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloOrdineNarrativo =>
      generaStimoloOrdineNarrativo(
        ctx.valoreCorrente,
        config.nDistractors,
        poolRef.current,
        rngRef.current,
      ),
    [config.nDistractors],
  );

  // ── valutaRisposta (strict: tutte le posizioni corrette) ─────────────────

  const valutaRisposta = useCallback(
    (
      stimolo: StimoloOrdineNarrativo,
      risposta: RispostaOrdineNarrativo | null,
    ): boolean => {
      if (!risposta) return false;
      return risposta.slotIds.every(
        (id, i) => id === stimolo.ordineCorretto[i],
      );
    },
    [],
  );

  // ── aggiornaMetriche ──────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo:    StimoloOrdineNarrativo,
      risposta:   RispostaOrdineNarrativo | null,
      _corretto:  boolean,
    ): Record<string, number> => {
      if (!risposta) return precedenti;

      const corrette = risposta.slotIds.filter(
        (id, i) => id === stimolo.ordineCorretto[i],
      ).length;

      return {
        ...precedenti,
        posizioni_totali:   (precedenti.posizioni_totali   ?? 0) + stimolo.nSlot,
        posizioni_corrette: (precedenti.posizioni_corrette ?? 0) + corrette,
        trial_completati:   (precedenti.trial_completati   ?? 0) + 1,
      };
    },
    [],
  );

  // ── renderStimolo ─────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo:    StimoloOrdineNarrativo;
      onRisposta: (risposta: RispostaOrdineNarrativo) => void;
    }) => (
      <OrdineNarrativoSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
      />
    ),
    [tempoScaduto],
  );

  // ── onCompleteWrapped — accuratezza per posizione ─────────────────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m        = risultato.metriche;
      const totali   = m.posizioni_totali   ?? 0;
      const corrette = m.posizioni_corrette ?? 0;
      const acc      = totali > 0 ? corrette / totali : 0;

      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           Math.round(acc * 100),
      });
    },
    [onComplete],
  );

  // ── Tutorial ──────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [
          {
            titolo: "Ricostruisci la storia",
            testo:
              "Leggi con attenzione il testo. Poi vedrai i pezzi della storia nell'ordine sbagliato — toccane uno per selezionarlo (diventa giallo), poi tocca il numero dove vuoi metterlo.",
          },
          {
            titolo: "Come funziona",
            testo:
              "Puoi rimettere un pezzo nel mazzo toccando lo slot. Quando hai riempito tutti gli slot, tocca 'Conferma ordine'. Metti i pezzi nell'ordine in cui sono avvenuti nel testo.",
          },
        ],
      }
    : null;

  // ── Render (Modello B) ────────────────────────────────────────────────────

  return (
    <TrialFlow<StimoloOrdineNarrativo, RispostaOrdineNarrativo>
      tLimMs={null}
      trialValutativi={config.trialsPerSession}
      microProgressione={microProgressione}
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
