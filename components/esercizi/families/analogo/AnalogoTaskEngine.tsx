"use client";

/**
 * "L'Analogo" — analogie verbali visuali (Linguaggio).
 * Modello B: trial-based con T.Lim per trial. Tutorial alla prima sessione.
 *
 * Metriche salvate (JSON in sessioni.metriche):
 *   analogo_<tipo>_total / _correct      per oppositiva, funzionale, categoriale, astratta
 *   analogo_tempo_totale_ms              somma tempi risposta (per calcolare media)
 *   analogo_risposte_tempo               numero risposte con tempo (= trial non-timeout)
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getAnalogoLevel, FLOOR_TLIM_ANALOGO } from "./levels";
import {
  creaPoolRef,
  generaAnalogo,
  type AnalogoPoolRef,
  type StimoloAnalogo,
  type RispostaAnalogo,
} from "./sequence";
import { AnalogoSession } from "./AnalogoSession";

const ACCENT = CATEGORIA_COLORS.linguaggio.text; // L'Analogo = dominio Linguaggio

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [{
    titolo: "L'Analogo",
    righe: [
      { icona: "🔗", testo: "Vedrai una coppia di parole legate fra loro, ad esempio CALDO sta a FREDDO." },
      { icona: "❓", testo: "Poi una seconda coppia con una parola mancante, segnata da un punto interrogativo." },
      { icona: "👆", testo: "Tocca, fra le quattro opzioni, quella legata allo stesso modo. Con calma, hai tempo." },
    ],
  }],
};

export function AnalogoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level = useMemo(() => getAnalogoLevel(livello), [livello]);

  const rng     = useRef(Math.random);
  const poolRef = useRef<AnalogoPoolRef>(creaPoolRef(rng.current));

  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase: level.tLimMs,
    delta:      -500,
    maxDelta:   2,
    limite:     FLOOR_TLIM_ANALOGO,
  }), [level.tLimMs]);

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloAnalogo => {
      const tLimMs = Math.max(FLOOR_TLIM_ANALOGO, ctx.valoreCorrente);
      return generaAnalogo({ ...level, tLimMs }, poolRef.current, rng.current);
    },
    [level],
  );

  const valutaRisposta = useCallback(
    (stimolo: StimoloAnalogo, risposta: RispostaAnalogo | null): boolean => {
      if (!risposta || !risposta.scelta) return false;
      return risposta.scelta === stimolo.item.risposta;
    },
    [],
  );

  const aggiornaMetriche = useCallback(
    (
      prev:     Record<string, number>,
      stimolo:  StimoloAnalogo,
      risposta: RispostaAnalogo | null,
      corretto: boolean,
    ): Record<string, number> => {
      const tipo    = stimolo.item.tipo;
      const keyTot  = `analogo_${tipo}_total`;
      const keyCorr = `analogo_${tipo}_correct`;

      const next: Record<string, number> = { ...prev };
      next[keyTot]  = (prev[keyTot]  ?? 0) + 1;
      next[keyCorr] = (prev[keyCorr] ?? 0) + (corretto ? 1 : 0);

      // Conteggio tempo solo per risposte effettive (no timeout/null)
      if (risposta && risposta.scelta) {
        next.analogo_tempo_totale_ms = (prev.analogo_tempo_totale_ms ?? 0) + risposta.tempoMs;
        next.analogo_risposte_tempo  = (prev.analogo_risposte_tempo  ?? 0) + 1;
      }
      return next;
    },
    [],
  );

  const renderStimolo = useCallback(
    (props: { stimolo: StimoloAnalogo; onRisposta: (r: RispostaAnalogo) => void }) => (
      <AnalogoSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
      />
    ),
    [],
  );

  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

  return (
    <TrialFlow<StimoloAnalogo, RispostaAnalogo>
      tLimMs={null}
      trialValutativi={level.trialsPerSession}
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
      onComplete={onComplete}
      onProgress={onProgress}
    />
  );
}
