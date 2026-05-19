"use client";

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getMCTLevel,
  getMCTMechanicWarning,
  MCT_MICRO_DELTA,
  MCT_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloMCT,
  creaMCTPoolRef,
  type StimoloMCT,
  type RispostaMCT,
  type MCTVariante,
} from "./sequence";
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
  // Lazy init: il pool viene creato UNA sola volta al primo render e poi
  // sopravvive ai re-render (useRef pattern, ma senza ricostruire l'oggetto
  // ad ogni render — l'invocazione precedente con argomento diretto creava
  // un nuovo pool ad ogni render, scartato da useRef ma comunque allocato).
  const poolRef = useRef<ReturnType<typeof creaMCTPoolRef> | null>(null);
  if (poolRef.current === null) {
    poolRef.current = creaMCTPoolRef(rngRef.current, variante);
  }
  // Anti-duplicazione esplicita: tiene traccia dei testi già usati in questa
  // sessione (chiave = testo). Se generaStimoloMCT restituisce un duplicato
  // (es. dopo un re-mount inatteso), forziamo un secondo pescaggio.
  const seenTestiRef = useRef<Set<string>>(new Set());

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

      // Pesca fino a un testo non ancora visto in questa sessione.
      // Limite di tentativi = dimensione banda per evitare loop infiniti
      // se il pool è esaurito.
      const pool = poolRef.current!;
      const bandSize = pool.bands[config.nFrasi]?.shuffled.length ?? 1;
      let stim = generaStimoloMCT(
        config.nFrasi,
        nDomande,
        config.nOpzioni,
        variante,
        pool,
        rngRef.current,
      );
      let tentativi = 0;
      while (seenTestiRef.current.has(stim.testo) && tentativi < bandSize) {
        stim = generaStimoloMCT(
          config.nFrasi,
          nDomande,
          config.nOpzioni,
          variante,
          pool,
          rngRef.current,
        );
        tentativi++;
      }
      seenTestiRef.current.add(stim.testo);
      return stim;
    },
    [config, variante],
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
        pagine: [{
          titolo: variante === "fattuale"
            ? "Leggi e ricorda"
            : "Leggi e ragiona",
          testo: variante === "fattuale"
            ? "Leggi con attenzione il testo che ti viene mostrato. Poi ti faremo alcune domande su quello che hai letto. Le risposte si trovano direttamente nel testo."
            : "Leggi con attenzione il testo che ti viene mostrato. Poi ti faremo alcune domande. Le risposte non sono scritte esplicitamente, ma si possono capire ragionando su ciò che hai letto.",
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
