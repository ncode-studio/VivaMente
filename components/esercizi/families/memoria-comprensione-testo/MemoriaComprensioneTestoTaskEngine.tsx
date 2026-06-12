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
  getMCTLevel,
  getMCTMechanicWarning,
  MCT_MICRO_DELTA,
  MCT_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloMCT,
  type StimoloMCT,
  type RispostaMCT,
  type MCTVariante,
} from "./sequence";
import { useUserStore } from "@/lib/store";
import { MemoriaComprensioneTestoSession } from "./MemoriaComprensioneTestoSession";

export function MemoriaComprensioneTestoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
  esercizioId,
}: GameEngineProps) {

  const variante: MCTVariante =
    esercizioId === "memoria_comprensione_fattuale_mbt" ? "fattuale" : "inferenziale";

  const config  = getMCTLevel(livello);
  const rngRef  = useRef<() => number>(Math.random);
  // userId per la persistenza anti-ripetizione cross-sessione (per utente).
  const userId  = useUserStore((s) => s.userId);

  // ── Micro-progressione su nDomande ────────────────────────────────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.nDomande,
      delta:      MCT_MICRO_DELTA,
      maxDelta:   MCT_MICRO_MAX_OVER,
    }),
    [config.nDomande],
  );

  // ── generaStimolo ─────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }): StimoloMCT => {
      const nDomande = ctx.isBonus
        ? Math.max(config.nDomande, ctx.valoreCorrente)
        : config.nDomande;

      // La selezione persistente (seenTexts) evita le ripetizioni sia tra
      // sessioni (finestra 21/7 giorni) sia all'interno della sessione corrente
      // (la registrazione immediata fa rientrare il testo appena mostrato nella
      // finestra dei 21 giorni).
      return generaStimoloMCT({
        nFrasi:       config.nFrasi,
        nDomande,
        nOpzioni:     config.nOpzioni,
        variante,
        poolVariante: variante,
        tipo:         variante, // "fattuale" | "inferenziale"
        userId,
        now:          Date.now(),
        rng:          rngRef.current,
      });
    },
    [config, variante, userId],
  );

  // ── valutaRisposta (strict: tutte le domande corrette) ────────────────────

  const valutaRisposta = useCallback(
    (stimolo: StimoloMCT, risposta: RispostaMCT | null): boolean => {
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
      stimolo: StimoloMCT,
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
      stimolo: StimoloMCT;
      onRisposta: (risposta: RispostaMCT) => void;
    }) => (
      <MemoriaComprensioneTestoSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
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
          titolo: variante === "fattuale"
            ? "Leggi e ricorda"
            : "Leggi e ragiona",
          righe: variante === "fattuale"
            ? [
                { icona: "📖", testo: "Leggi con calma il breve testo che ti mostriamo." },
                { icona: "❓", testo: "Poi rispondi ad alcune domande su ciò che hai letto." },
                { icona: "👆", testo: "Tocca la risposta giusta: la trovi direttamente nel testo." },
              ]
            : [
                { icona: "📖", testo: "Leggi con calma il breve testo che ti mostriamo." },
                { icona: "💭", testo: "Poi rispondi ad alcune domande sul testo." },
                { icona: "👆", testo: "La risposta non è scritta: ricavala ragionando su ciò che hai letto." },
              ],
        }],
      }
    : null;

  // ── Warning cambio meccanica ──────────────────────────────────────────────

  const warning = useMemo(
    () => getMCTMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render (Modello B) ────────────────────────────────────────────────────

  return (
    <TrialFlow<StimoloMCT, RispostaMCT>
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
