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
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getSimonLevel,
  getSimonMechanicWarning,
} from "./levels";
import {
  creaSimonStreamState,
  generaProssimoStimoloSimon,
  type SimonStimolo,
  type SimonStreamState,
} from "./sequence";
import { SimonStimulus, type SimonRisposta } from "./SimonStimulus";

// ── Tutorial ─────────────────────────────────────────────────────────────────

const ACCENT = CATEGORIA_COLORS.esecutive.text; // Simon Spaziale = dominio Funzioni Esecutive

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [
    {
      titolo: "Segui la direzione della freccia",
      righe: [
        { icona: "➡️", testo: "Compare una freccia in un punto dello schermo." },
        { icona: "👆", testo: "Tocca il pulsante che indica la stessa direzione della freccia." },
        { icona: "✅", testo: "Conta solo dove punta la freccia, non dove appare." },
      ],
    },
    {
      titolo: "Attenzione alla posizione",
      righe: [
        { icona: "🔀", testo: "A volte la freccia appare dal lato opposto a dove punta." },
        { icona: "🧭", testo: "Non lasciarti ingannare dalla sua posizione." },
        { icona: "👉", testo: "Tocca sempre il pulsante della direzione, con calma." },
      ],
    },
  ],
};

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
  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

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
