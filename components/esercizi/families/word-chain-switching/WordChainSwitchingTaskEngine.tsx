"use client";

/**
 * WordChainSwitchingTaskEngine — engine Word Chain Switching Categoriale.
 *
 * Modello A (timer 90s). T.Lim gestito internamente (tLimMs={null}).
 * Micro-progressione su targetTimeMs: −2000ms per trial bonus, max −2, floor 15s.
 * Promozione: completato entro targetTimeMs.
 *
 * Riferimento: docs/gdd/families/word-chain-switching.md
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
  SessionResult,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getWCSLevel, getWCSMechanicWarning, WCS_TARGET_FLOOR_MS } from "./levels";
import {
  creaWCSPoolRef,
  generaStimoloWCSSelezione,
  generaStimoloWCSProduzione,
  type StimoloWCS,
  type RispostaWCS,
  type WCSPoolRef,
} from "./sequence";
import { WordChainSwitchingSession } from "./WordChainSwitchingSession";

// ── Engine ─────────────────────────────────────────────────────────────────────

export function WordChainSwitchingTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level   = useMemo(() => getWCSLevel(livello), [livello]);
  const rng     = useRef(Math.random);
  const poolRef = useRef<WCSPoolRef>(creaWCSPoolRef(rng.current));

  // ── Micro-progressione ─────────────────────────────────────────────────────
  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase: level.targetTimeMs,
    delta:      -2000,
    maxDelta:   2,
    limite:     WCS_TARGET_FLOOR_MS,
  }), [level.targetTimeMs]);

  // ── generaStimolo ──────────────────────────────────────────────────────────
  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloWCS => {
      const targetTime = Math.max(WCS_TARGET_FLOOR_MS, ctx.valoreCorrente);
      if (level.modalita === "produzione") {
        return generaStimoloWCSProduzione(
          level.nWords,
          level.distanza,
          level.tLimMs,
          targetTime,
          rng.current,
        );
      }
      return generaStimoloWCSSelezione(
        level.nWords,
        level.distanza,
        level.tLimMs,
        targetTime,
        poolRef.current,
        rng.current,
      );
    },
    [level],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────
  // Trial "valutativamente corretto" = completato per intero entro targetTimeMs.
  // Usato da TrialFlow per la logica di trial bonus / consecutivi.
  const valutaRisposta = useCallback(
    (stimolo: StimoloWCS, risposta: RispostaWCS): boolean =>
      risposta !== null &&
      risposta.paroleCompletate >= risposta.totale &&
      risposta.tempoMs <= stimolo.targetTimeMs,
    [],
  );

  // ── aggiornaMetriche ───────────────────────────────────────────────────────
  // Aggrega parole completate e parole totali su tutta la sessione, così
  // l'accuratezza finale è proporzionale (es. 1/6 parole completate → 0.167).
  const aggiornaMetriche = useCallback(
    (
      prev: Record<string, number>,
      _stimolo: StimoloWCS,
      risposta: RispostaWCS,
    ): Record<string, number> => ({
      ...prev,
      parole_completate: (prev.parole_completate ?? 0) + (risposta?.paroleCompletate ?? 0),
      parole_totali:     (prev.parole_totali     ?? 0) + (risposta?.totale ?? 0),
      errori_semantici:  (prev.errori_semantici  ?? 0) + (risposta?.errori ?? 0),
    }),
    [],
  );

  // ── onCompleteWrapped — accuratezza = parole_completate / parole_totali ──
  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m         = risultato.metriche;
      const completate = m.parole_completate ?? 0;
      const totali     = m.parole_totali     ?? 0;
      const acc        = totali > 0 ? completate / totali : 0;

      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           Math.round(acc * 100),
      });
    },
    [onComplete],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────
  const renderStimolo = useCallback(
    (props: { stimolo: StimoloWCS; onRisposta: (r: RispostaWCS) => void }) => (
      <WordChainSwitchingSession stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: level.modalita === "produzione"
          ? [{
              titolo: "Word Chain — Categorie (scrivi tu)",
              testo:
                "All'inizio del trial vedrai DUE categorie semantiche (es. ANIMALI e OGGETTI). " +
                "Devi scrivere parole alternando le due categorie: prima una ANIMALE, poi un OGGETTO, " +
                "poi di nuovo un ANIMALE, e così via. " +
                "Usa la tastiera per digitare ogni parola e premi ✓ per confermare. " +
                "Se la parola non appartiene alla categoria attesa (o non è riconosciuta) viene segnalata e non conta. " +
                "Non si possono ripetere parole già usate nello stesso trial. " +
                "Completa la sequenza il più velocemente possibile.",
            }]
          : [{
              titolo: "Word Chain — Categorie",
              testo:
                "Vedrai un insieme di parole appartenenti a DUE categorie diverse " +
                "(es. ANIMALI e OGGETTI). I nomi delle due categorie sono mostrati all'inizio. " +
                "Tocca le parole alternando le categorie: prima una ANIMALE, poi una OGGETTO, " +
                "poi di nuovo una ANIMALE, e così via. " +
                "Le parole NON sono colorate: devi leggerle e capire da sola/o a quale categoria appartengono. " +
                "Un tocco sulla categoria sbagliata viene segnalato in rosso e non viene contato. " +
                "Completa la sequenza il più velocemente possibile.",
            }],
      }
    : null;

  // ── Warning ────────────────────────────────────────────────────────────────
  const warning = useMemo(
    () => getWCSMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  return (
    <TrialFlow<StimoloWCS, RispostaWCS>
      tLimMs={null}
      trialValutativi={level.trialsPerSession}
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
