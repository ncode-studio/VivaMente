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
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getMPHybridLevel, getMPMechanicWarning } from "./levels";
import {
  generaTrialMPHybrid,
  type TrialMPHybrid,
  type RispostaMP,
} from "./sequence";
import { MemoriaProspetticaSession } from "./MemoriaProspetticaSession";

// ── Tutorial ──────────────────────────────────────────────────────────────────

const ACCENT = CATEGORIA_COLORS.memoria.text; // Memoria Prospettica = dominio Memoria

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [{
    titolo: "Memoria Prospettica",
    righe: [
      { icona: "📖", testo: "Le parole scorrono una alla volta. Tocca il pulsante della categoria quando la parola appartiene al gruppo indicato." },
      { icona: "⏰", testo: "L'orologio in alto scorre. Ricordati di toccare 'Ricordami' a intervalli regolari, aiutandoti con il tempo." },
      { icona: "👆", testo: "Porta avanti i due compiti insieme, con calma. Non c'è fretta, prenditi il tuo tempo." },
    ],
  }],
};

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
      const m = risultato.metriche;
      // Hit: finestre prospettiche corrette + parole-target tappate.
      const finestreTot = m.finestre_totali            ?? 0;
      const finestreOk  = m.finestre_corrette          ?? 0;
      const distrTot    = m.distrattori_target_totali  ?? 0;
      const distrOk     = m.distrattori_target_tappati ?? 0;
      // False alarm: clic Ricordami fuori finestra + clic categoria su
      // parole NON della categoria. Entrambi sono errori veri e devono
      // pesare sull'accuratezza (fix: prima erano ignorati e il punteggio
      // risultava 100% anche con tutti i clic categoria sbagliati).
      const ricordamiFA = m.ricordami_falsi_tap    ?? 0;
      const distrFA     = m.distrattori_falsi_tap  ?? 0;
      const falseAlarms = ricordamiFA + distrFA;

      const hits   = finestreOk + distrOk;
      const totali = finestreTot + distrTot;
      // Penalty model: ogni false alarm costa un hit pieno (peso 1.0). Clamp [0,1].
      // #6: prima il peso era 0.5 → lo scoring restava alto anche con molti
      // errori di commissione (tap categoria su parole sbagliate, "Ricordami"
      // fuori finestra). Con peso 1.0 ogni tap errato annulla una risposta
      // corretta, così l'accuratezza scende davvero quando si sbaglia molto.
      const rawAcc = totali > 0 ? (hits - falseAlarms) / totali : 0;
      const acc    = Math.max(0, Math.min(1, rawAcc));

      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           Math.round(acc * 100),
      });
    },
    [onComplete],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

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
