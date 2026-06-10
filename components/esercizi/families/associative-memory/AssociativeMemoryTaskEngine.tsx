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
  getAMLevel,
  getAMMechanicWarning,
  AM_MICRO_DELTA,
  AM_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloAM,
  creaAMPoolRef,
  type StimoloAM,
  type RispostaAM,
  type AMVariante,
} from "./sequence";
import { AssociativeMemorySession } from "./AssociativeMemorySession";
import { BouncingBall } from "@/components/esercizi/shared/distrattore-palla/BouncingBall";

const VARIANTI: AMVariante[] = [
  "parola_immagine",
  "immagine_immagine",
  "parola_parola",
];

const ACCENT = CATEGORIA_COLORS.memoria.text; // Associative Memory = dominio Memoria

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [{
    titolo: "Memorizza le coppie",
    righe: [
      { icona: "🃏", testo: "Ti mostriamo alcune coppie, una alla volta. Osservale con calma e prova a ricordarle." },
      { icona: "🔴", testo: "Poi una breve pausa con una pallina che rimbalza: toccala solo quando è rossa, mai quando è di un altro colore." },
      { icona: "👆", testo: "Infine ti mostriamo un elemento: tocca quello che era abbinato a lui." },
    ],
  }],
};

export function AssociativeMemoryTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const config = getAMLevel(livello);

  const rngRef      = useRef<() => number>(Math.random);
  const poolRef     = useRef(creaAMPoolRef(rngRef.current));
  const varianteRef = useRef<AMVariante>(
    VARIANTI[Math.floor(Math.random() * VARIANTI.length)],
  );

  // ── Micro-progressione su nCoppie ─────────────────────────────────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.nCoppie,
      delta:      AM_MICRO_DELTA,
      maxDelta:   AM_MICRO_MAX_OVER,
    }),
    [config.nCoppie],
  );

  // ── generaStimolo ─────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }): StimoloAM => {
      const nCoppie = ctx.isBonus
        ? Math.max(config.nCoppie, ctx.valoreCorrente)
        : config.nCoppie;

      return generaStimoloAM(
        nCoppie,
        varianteRef.current,
        config.speedMs,
        config.delayMs,
        poolRef.current,
        rngRef.current,
      );
    },
    [config],
  );

  // ── valutaRisposta (tutte le coppie corrette) ─────────────────────────────

  const valutaRisposta = useCallback(
    (stimolo: StimoloAM, risposta: RispostaAM | null): boolean => {
      if (risposta === null) return false;
      return risposta.risposte.every(
        (r, i) => r === stimolo.coppie[i].idxCorr,
      );
    },
    [],
  );

  // ── aggiornaMetriche ──────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo: StimoloAM,
      risposta: RispostaAM | null,
      _corretto: boolean,
    ): Record<string, number> => {
      if (risposta === null) return precedenti;

      const totali   = stimolo.coppie.length;
      const corrette = risposta.risposte.filter(
        (r, i) => r === stimolo.coppie[i].idxCorr,
      ).length;

      return {
        ...precedenti,
        coppie_totali:   (precedenti.coppie_totali   ?? 0) + totali,
        coppie_corrette: (precedenti.coppie_corrette ?? 0) + corrette,
        trial_completati:(precedenti.trial_completati ?? 0) + 1,
      };
    },
    [],
  );

  // ── renderStimolo ─────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo: StimoloAM;
      onRisposta: (risposta: RispostaAM) => void;
    }) => (
      <AssociativeMemorySession
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

  // ── onCompleteWrapped — accuratezza per coppia ────────────────────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m        = risultato.metriche;
      const totali   = m.coppie_totali   ?? 0;
      const corrette = m.coppie_corrette ?? 0;
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

  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

  // ── Warning cambio meccanica ──────────────────────────────────────────────

  const warning = useMemo(
    () => getAMMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render (Modello B) ────────────────────────────────────────────────────

  return (
    <TrialFlow<StimoloAM, RispostaAM>
      tLimMs={null}
      trialValutativi={null}
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
