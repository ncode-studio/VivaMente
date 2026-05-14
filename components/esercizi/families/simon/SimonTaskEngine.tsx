"use client";

/**
 * SimonTaskEngine — game engine per Simon Spaziale (Funzioni Esecutive).
 *
 * Costrutto: controllo dell'interferenza spaziale (stimulus-response compatibility).
 * Modello A timer 60s, on-demand stimulus generation, feedback standard,
 * no micro-progressione (la difficoltà è interamente definita dal livello).
 *
 * Metriche raccolte:
 *   - congr_totali, congr_corretti, tempo_totale_congr_ms
 *   - incongr_totali, incongr_corretti, tempo_totale_incongr_ms
 *   - Effetto Simon (derivabile a posteriori): RT_incongr - RT_congr
 *
 * Score: accuratezza globale (corretti/totali) × 100.
 */

import { useRef, useCallback } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  SessionResult,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getSimonLevel,
  getSimonMechanicWarning,
  SIMBOLO_DIREZIONE,
} from "./levels";
import {
  creaSimonStreamState,
  generaProssimoStimoloSimon,
  type SimonStimolo,
  type SimonStreamState,
} from "./sequence";
import { SimonStimulus, type SimonRisposta } from "./SimonStimulus";

// ── Engine ─────────────────────────────────────────────────────────────────────

export function SimonTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const config = getSimonLevel(livello);

  const rngRef         = useRef<() => number>(Math.random);
  const streamStateRef = useRef<SimonStreamState>(creaSimonStreamState());

  // ── generaStimolo ──────────────────────────────────────────────────────────
  const generaStimolo = useCallback((): SimonStimolo => {
    return generaProssimoStimoloSimon(
      streamStateRef.current,
      config.incongrueRate,
      config.nDirezioni,
      rngRef.current,
    );
  }, [config.incongrueRate, config.nDirezioni]);

  // ── renderStimolo ──────────────────────────────────────────────────────────
  const renderStimolo = useCallback(
    (props: { stimolo: SimonStimolo; onRisposta: (r: SimonRisposta) => void }) => (
      <SimonStimulus
        stimolo={props.stimolo}
        nDirezioni={config.nDirezioni}
        onRisposta={props.onRisposta}
        disabilitato={false}
      />
    ),
    [config.nDirezioni],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────
  const valutaRisposta = useCallback(
    (stimolo: SimonStimolo, risposta: SimonRisposta | null): boolean => {
      if (risposta === null) return false;
      return risposta.direzioneScelta === stimolo.direzione;
    },
    [],
  );

  // ── aggiornaMetriche ───────────────────────────────────────────────────────
  const aggiornaMetriche = useCallback(
    (
      prev: Record<string, number>,
      stimolo: SimonStimolo,
      risposta: SimonRisposta | null,
      corretto: boolean,
    ): Record<string, number> => {
      const isCongr = stimolo.congruente;
      const tempoMs = risposta?.tempoMs ?? 0;
      return {
        ...prev,
        congr_totali:           (prev.congr_totali           ?? 0) + (isCongr  ? 1 : 0),
        congr_corretti:         (prev.congr_corretti         ?? 0) + (isCongr  && corretto ? 1 : 0),
        tempo_totale_congr_ms:  (prev.tempo_totale_congr_ms  ?? 0) + (isCongr  && corretto && risposta !== null ? tempoMs : 0),
        incongr_totali:         (prev.incongr_totali         ?? 0) + (!isCongr ? 1 : 0),
        incongr_corretti:       (prev.incongr_corretti       ?? 0) + (!isCongr && corretto ? 1 : 0),
        tempo_totale_incongr_ms:(prev.tempo_totale_incongr_ms?? 0) + (!isCongr && corretto && risposta !== null ? tempoMs : 0),
      };
    },
    [],
  );

  // ── onCompleteWrapped — score = accuratezza globale ────────────────────────
  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m = risultato.metriche;
      const totali   = (m.congr_totali ?? 0) + (m.incongr_totali ?? 0);
      const corretti = (m.congr_corretti ?? 0) + (m.incongr_corretti ?? 0);
      const acc = totali > 0 ? corretti / totali : 0;

      // Effetto Simon (esposto come metrica interna, derivabile dai tempi)
      const rtCongr = (m.congr_corretti ?? 0) > 0
        ? (m.tempo_totale_congr_ms ?? 0) / (m.congr_corretti ?? 1)
        : 0;
      const rtIncongr = (m.incongr_corretti ?? 0) > 0
        ? (m.tempo_totale_incongr_ms ?? 0) / (m.incongr_corretti ?? 1)
        : 0;
      const effettoSimonMs = Math.round(rtIncongr - rtCongr);

      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           Math.round(acc * 100),
        metriche: {
          ...m,
          rt_medio_congr_ms:   Math.round(rtCongr),
          rt_medio_incongr_ms: Math.round(rtIncongr),
          effetto_simon_ms:    effettoSimonMs,
        },
      });
    },
    [onComplete],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [
          {
            titolo: "Tocca la direzione della freccia",
            testo:
              "Apparirà una freccia in un punto dello schermo. " +
              "Tocca il pulsante che corrisponde alla direzione che indica la freccia. " +
              "Esempio: se la freccia è " + SIMBOLO_DIREZIONE.dx + ", tocca il pulsante " + SIMBOLO_DIREZIONE.dx + ", " +
              "indipendentemente da dove appare la freccia.",
          },
          {
            titolo: "Attenzione alla posizione!",
            testo:
              "La freccia può apparire dalla parte OPPOSTA alla direzione che indica " +
              "(es. una freccia " + SIMBOLO_DIREZIONE.dx + " sulla sinistra dello schermo). " +
              "Non farti ingannare: tocca sempre il pulsante della DIREZIONE della freccia, " +
              "non della sua posizione.",
          },
        ],
      }
    : null;

  // ── Warning cambio meccanica ────────────────────────────────────────────────
  const warning = getSimonMechanicWarning(livelloPrec, livello);

  return (
    <TrialFlow<SimonStimolo, SimonRisposta>
      tLimMs={config.tLimMs}
      trialValutativi={null}
      microProgressione={null}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      tutorial={tutorial}
      warning={warning}
      aggiornaMetriche={aggiornaMetriche}
      feedbackType="standard"
      isiMs={config.isiMs}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
