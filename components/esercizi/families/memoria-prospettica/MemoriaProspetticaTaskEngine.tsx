"use client";

/**
 * MemoriaProspetticaTaskEngine — engine top-level per Memoria Prospettica Ibrida.
 *
 * Esercizio unico: memoria_prospettica_time_based (dual-task PM + attenzione selettiva).
 *
 * Modello B (sessione a completamento), singolo trial continuo:
 *   - trialValutativi=1: l'intera sessione è un solo trial gestito da
 *     MemoriaProspetticaSession.
 *   - tLimMs=null: il timer vive nel mini-engine (= durationMs del livello).
 *   - microProgressione=null (GDD §Micro-progressione letterale).
 *   - feedbackType="none": il feedback sui tap vive nel mini-engine.
 *
 * Accuratezza clinica: finestreCorrette / finestreTotali — override in
 * onCompleteWrapped (pattern TrialFlow binaria → metrica clinica reale).
 *
 * Riferimento: docs/gdd/families/memoria-prospettica.md
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getMPHybridLevel, getMPMechanicWarning } from "./levels";
import {
  generaTrialMPHybrid,
  type TrialMPHybrid,
  type RispostaMP,
} from "./sequence";
import { MemoriaProspetticaSession } from "./MemoriaProspetticaSession";

// ── MemoriaProspetticaTaskEngine ──────────────────────────────────────────────

export function MemoriaProspetticaTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const rngRef = useRef<() => number>(Math.random);

  // ── generaStimolo ──────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (_ctx: { valoreCorrente: number; isBonus: boolean }): TrialMPHybrid => {
      const level = getMPHybridLevel(livello);
      return generaTrialMPHybrid(level, rngRef.current);
    },
    [livello],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────
  // Binaria per TrialFlow; l'accuratezza clinica reale vive in onCompleteWrapped.

  const valutaRisposta = useCallback(
    (_stimolo: TrialMPHybrid, risposta: RispostaMP | null): boolean => {
      if (risposta === null) return false;
      return risposta.finestreCorrette > 0;
    },
    [],
  );

  // ── aggiornaMetriche ───────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      _stimolo: TrialMPHybrid,
      risposta: RispostaMP | null,
      _corretto: boolean,
    ): Record<string, number> => {
      if (risposta === null) return precedenti;
      return {
        ...precedenti,
        finestre_totali:            (precedenti.finestre_totali            ?? 0) + risposta.finestreTotali,
        finestre_corrette:          (precedenti.finestre_corrette          ?? 0) + risposta.finestreCorrette,
        ricordami_falsi_tap:        (precedenti.ricordami_falsi_tap        ?? 0) + risposta.ricordamiFalsiTap,
        distrattori_target_totali:  (precedenti.distrattori_target_totali  ?? 0) + risposta.distrattoriTargetTotali,
        distrattori_target_tappati: (precedenti.distrattori_target_tappati ?? 0) + risposta.distrattoriTargetTappati,
        distrattori_falsi_tap:      (precedenti.distrattori_falsi_tap      ?? 0) + risposta.distrattoriFalsiTap,
      };
    },
    [],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: { stimolo: TrialMPHybrid; onRisposta: (risposta: RispostaMP) => void }) => (
      <MemoriaProspetticaSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
      />
    ),
    [],
  );

  // ── onCompleteWrapped — override accuratezza clinica ──────────────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m        = risultato.metriche;
      const totali   = m.finestre_totali   ?? 0;
      const corrette = m.finestre_corrette ?? 0;
      const accuratezzaClinica = totali > 0 ? corrette / totali : 0;
      onComplete({
        ...risultato,
        accuratezzaValutativa: accuratezzaClinica,
        scoreGrezzo:           Math.round(accuratezzaClinica * 100),
      });
    },
    [onComplete],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [{
          titolo: "Memoria Prospettica — Due compiti insieme",
          testo:
            "Vedrai delle parole scorrere sullo schermo. " +
            "Tocca il pulsante della categoria ogni volta che la parola appartiene al gruppo indicato. " +
            "Allo stesso tempo, ricordati di toccare 'Ricordami' a intervalli regolari — " +
            "l'orologio in alto ti aiuterà a tenere il ritmo.",
        }],
      }
    : null;

  // ── Warning cambio meccanica ───────────────────────────────────────────────

  const warning = useMemo(
    () => getMPMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TrialFlow<TrialMPHybrid, RispostaMP>
      tLimMs={null}
      trialValutativi={1}
      microProgressione={null}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimolo}
      valutaRisposta={valutaRisposta}
      aggiornaMetriche={aggiornaMetriche}
      tutorial={tutorial}
      warning={warning}
      feedbackType="none"
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
