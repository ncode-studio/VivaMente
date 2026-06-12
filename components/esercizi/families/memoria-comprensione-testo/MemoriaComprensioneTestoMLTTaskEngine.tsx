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
import { BouncingBall } from "@/components/esercizi/shared/distrattore-palla/BouncingBall";
import {
  getMCTMLTLevel,
  getMCTMechanicWarning,
  MCTMLT_MICRO_DELTA,
  MCTMLT_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloMCT,
  type StimoloMCT,
  type RispostaMCT,
} from "./sequence";
import { useUserStore } from "@/lib/store";
import { MemoriaComprensioneTestoMLTSession } from "./MemoriaComprensioneTestoMLTSession";

// StimoloMCT esteso con delayMs (valoreCorrente della micro-progressione)
interface StimoloMCTMLT extends StimoloMCT {
  delayMs: number;
}

export function MemoriaComprensioneTestoMLTTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const config  = getMCTMLTLevel(livello);
  const rngRef  = useRef<() => number>(Math.random);
  // userId per la persistenza anti-ripetizione cross-sessione (per utente).
  const userId  = useUserStore((s) => s.userId);

  // ── Micro-progressione su delayMs (+15s per bonus, max +30s) ─────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.delayMs,
      delta:      MCTMLT_MICRO_DELTA,
      maxDelta:   MCTMLT_MICRO_MAX_OVER,
    }),
    [config.delayMs],
  );

  // ── generaStimolo ─────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloMCTMLT => {
      // Pool intero (poolVariante undefined): l'MLT non condivide lo split
      // pari/dispari delle varianti MBT e ha la propria storia anti-ripetizione.
      const base = generaStimoloMCT({
        nFrasi:    config.nFrasi,
        nDomande:  config.nDomande,
        nOpzioni:  config.nOpzioni,
        variante:  "fattuale",
        tipo:      "mlt",
        userId,
        now:       Date.now(),
        rng:       rngRef.current,
      });
      return { ...base, delayMs: ctx.valoreCorrente };
    },
    [config, userId],
  );

  // ── valutaRisposta (strict: tutte le domande corrette) ────────────────────

  const valutaRisposta = useCallback(
    (stimolo: StimoloMCTMLT, risposta: RispostaMCT | null): boolean => {
      if (!risposta) return false;
      return risposta.risposte.every(
        (r, i) => r === stimolo.domande[i]?.idxCorr,
      );
    },
    [],
  );

  // ── aggiornaMetriche ──────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo: StimoloMCTMLT,
      risposta: RispostaMCT | null,
      _corretto: boolean,
    ): Record<string, number> => {
      if (!risposta) return precedenti;

      const corrette = risposta.risposte.filter(
        (r, i) => r === stimolo.domande[i]?.idxCorr,
      ).length;

      return {
        ...precedenti,
        domande_totali:   (precedenti.domande_totali   ?? 0) + stimolo.domande.length,
        domande_corrette: (precedenti.domande_corrette ?? 0) + corrette,
        trial_completati: (precedenti.trial_completati ?? 0) + 1,
      };
    },
    [],
  );

  // ── renderStimolo ─────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo: StimoloMCTMLT;
      onRisposta: (risposta: RispostaMCT) => void;
    }) => (
      <MemoriaComprensioneTestoMLTSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
        delayComponent={({ onCompleto }) => (
          <BouncingBall
            durataMs={props.stimolo.delayMs}
            onCompleto={onCompleto}
            mostraCountdown
          />
        )}
      />
    ),
    [tempoScaduto],
  );

  // ── onCompleteWrapped — accuratezza per domanda ────────────────────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m        = risultato.metriche;
      const totali   = m.domande_totali   ?? 0;
      const corrette = m.domande_corrette ?? 0;
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
        pagine: [{
          titolo: "Leggi, poi ricorda",
          righe: [
            { icona: "📖", testo: "Leggi con calma il testo: dopo ti faremo alcune domande." },
            { icona: "🔴", testo: "Prima delle domande c'è una breve pausa con una pallina: toccala solo quando è rossa, mai quando è di un altro colore." },
            { icona: "👆", testo: "Poi tocca la risposta giusta su ciò che hai letto. Le risposte sono nel testo." },
          ],
        }],
      }
    : null;

  // ── Warning cambio meccanica (condiviso con MBT) ──────────────────────────

  const warning = useMemo(
    () => getMCTMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render (Modello B) ────────────────────────────────────────────────────

  return (
    <TrialFlow<StimoloMCTMLT, RispostaMCT>
      tLimMs={null}
      trialValutativi={config.trialsPerSession}
      microProgressione={microProgressione}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      aggiornaMetriche={aggiornaMetriche}
      tutorial={tutorial}
      warning={warning}
      feedbackType="standard"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
