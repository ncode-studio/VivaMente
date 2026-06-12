"use client";

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getMCTOrdineNarrativoLevel,
  MCTON_MICRO_DELTA,
  MCTON_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloOrdineNarrativo,
  type StimoloOrdineNarrativo,
  type RispostaOrdineNarrativo,
} from "./sequence-ordine";
import { useUserStore } from "@/lib/store";
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
  // userId per la persistenza anti-ripetizione cross-sessione (per utente).
  const userId  = useUserStore((s) => s.userId);

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
      generaStimoloOrdineNarrativo({
        nEventi:      ctx.valoreCorrente,
        nDistractors: config.nDistractors,
        tipo:         "ordine",
        userId,
        now:          Date.now(),
        rng:          rngRef.current,
      }),
    [config.nDistractors, userId],
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
        accent: CATEGORIA_COLORS.memoria.text,
        ctaLabel: "Inizia a leggere",
        pagine: [
          {
            titolo: "Ricostruisci la storia",
            righe: [
              { icona: "📖", testo: "Leggi con calma il testo che ti mostriamo." },
              { icona: "🔀", testo: "Poi vedrai i pezzi della storia in ordine sbagliato." },
              { icona: "👆", testo: "Tocca un pezzo per sceglierlo (diventa giallo), poi tocca il numero dove metterlo." },
            ],
          },
          {
            titolo: "Come funziona",
            righe: [
              { icona: "↩️", testo: "Per cambiare idea, tocca uno slot per rimettere il pezzo nel mazzo." },
              { icona: "🔢", testo: "Metti i pezzi nell'ordine in cui sono avvenuti nel testo." },
              { icona: "✅", testo: "Riempiti tutti gli slot, tocca 'Conferma ordine'. Non c'è fretta." },
            ],
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
