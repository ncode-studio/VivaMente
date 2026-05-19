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
  getMLLevel,
  getMLMechanicWarning,
  ML_MICRO_DELTA,
  ML_MICRO_MAX_OVER,
} from "./levels";
import {
  generaStimoloML,
  creaMLPoolRef,
  type StimoloML,
  type RispostaML,
  type MLVariante,
} from "./sequence";
import { MemoriaListaSession } from "./MemoriaListaSession";
import { MemoriaListaRievocazioneParoleSession } from "./MemoriaListaRievocazioneParoleSession";
import { BouncingBall } from "@/components/esercizi/shared/distrattore-palla/BouncingBall";

export function MemoriaListaTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
  esercizioId,
}: GameEngineProps) {

  const isRievocazioneImmagini = esercizioId === "memoria_lista_immagini_rievocazione";
  const isRievocazioneParole  = esercizioId === "memoria_lista_parole_rievocazione";
  const variante: MLVariante  =
    esercizioId === "memoria_lista_immagini_riconoscimento" ||
    esercizioId === "memoria_lista_immagini_rievocazione"
      ? "immagini"
      : "parole";

  const config  = getMLLevel(livello);
  const rngRef  = useRef<() => number>(Math.random);
  const poolRef = useRef(creaMLPoolRef(rngRef.current));

  // ── Micro-progressione su nItems ──────────────────────────────────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.nItems,
      delta:      ML_MICRO_DELTA,
      maxDelta:   ML_MICRO_MAX_OVER,
    }),
    [config.nItems],
  );

  // ── generaStimolo ─────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }): StimoloML => {
      const nItems = ctx.isBonus
        ? Math.max(config.nItems, ctx.valoreCorrente)
        : config.nItems;

      // rievocazione immagini: griglia più affollata; rievocazione parole: nessun foil
      const nFoil = isRievocazioneParole
        ? 0
        : isRievocazioneImmagini
          ? Math.min(nItems * 3, 24)
          : config.nFoil;

      // Timer recall: 20s per riconoscimento parole/immagini, 40s per la
      // rievocazione (richiede scrittura/recall libera). null = no timer
      // per i livelli più alti dove l'utente decide il proprio tempo.
      const recallTimerMs = isRievocazioneParole || isRievocazioneImmagini
        ? 40_000
        : 20_000;

      // Recall in ordine di presentazione per le varianti immagini
      // (riconoscimento e rievocazione). Per parole resta libero.
      const requireOrder = variante === "immagini" && !isRievocazioneParole;

      return generaStimoloML(
        nItems,
        nFoil,
        variante,
        config.speedMs,
        config.delayMs,
        poolRef.current,
        rngRef.current,
        recallTimerMs,
        requireOrder,
      );
    },
    [config, variante, isRievocazioneParole, isRievocazioneImmagini],
  );

  // ── valutaRisposta (strict: tutti i target, nessun foil) ──────────────────

  const valutaRisposta = useCallback(
    (stimolo: StimoloML, risposta: RispostaML | null): boolean => {
      if (!risposta) return false;
      // Se richiesto l'ordine, confronto posizionale stretto.
      if (stimolo.requireOrder) {
        if (risposta.selezionati.length !== stimolo.items.length) return false;
        return stimolo.items.every((it, i) => risposta.selezionati[i] === it.id);
      }
      const sel       = new Set(risposta.selezionati);
      const targetIds = new Set(stimolo.items.map((i) => i.id));
      return (
        stimolo.items.every((i) => sel.has(i.id)) &&
        risposta.selezionati.every((id) => targetIds.has(id))
      );
    },
    [],
  );

  // ── aggiornaMetriche ──────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo: StimoloML,
      risposta: RispostaML | null,
      _corretto: boolean,
    ): Record<string, number> => {
      if (!risposta) return precedenti;

      const targetIds = new Set(stimolo.items.map((i) => i.id));
      const sel       = new Set(risposta.selezionati);
      const hit       = stimolo.items.filter((i) => sel.has(i.id)).length;
      const fa        = risposta.selezionati.filter((id) => !targetIds.has(id)).length;

      return {
        ...precedenti,
        item_totali:      (precedenti.item_totali      ?? 0) + stimolo.items.length,
        hit:              (precedenti.hit              ?? 0) + hit,
        falso_allarme:    (precedenti.falso_allarme    ?? 0) + fa,
        trial_completati: (precedenti.trial_completati ?? 0) + 1,
      };
    },
    [],
  );

  // ── renderStimolo ─────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo: StimoloML;
      onRisposta: (risposta: RispostaML) => void;
    }) => {
      if (isRievocazioneParole) {
        return (
          <MemoriaListaRievocazioneParoleSession
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
        );
      }
      return (
        <MemoriaListaSession
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
      );
    },
    [tempoScaduto, isRievocazioneParole],
  );

  // ── onCompleteWrapped — accuratezza per item ───────────────────────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m      = risultato.metriche;
      const totali = m.item_totali ?? 0;
      const hits   = m.hit        ?? 0;
      const acc    = totali > 0 ? hits / totali : 0;

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
          titolo: isRievocazioneParole
            ? "Memorizza le parole"
            : variante === "immagini" ? "Memorizza le immagini" : "Memorizza le parole",
          testo: isRievocazioneParole
            ? "Leggi le parole che appaiono una alla volta. Dopo una breve pausa farai una piccola attività, poi dovrai scrivere tutte le parole che ricordi. Puoi inserirle in qualsiasi ordine."
            : isRievocazioneImmagini
              ? "Guarda le immagini che appaiono una alla volta. Dopo una breve pausa vedrai una griglia con molte immagini: tocca solo quelle che hai visto prima, poi premi Conferma."
              : variante === "immagini"
                ? "Guarda le immagini che appaiono una alla volta. Dopo una breve pausa vedrai una griglia: tocca tutte le immagini che hai visto prima, poi premi Conferma."
                : "Leggi le parole che appaiono una alla volta. Dopo una breve pausa vedrai una griglia: tocca tutte le parole che hai visto prima, poi premi Conferma.",
        }],
      }
    : null;

  // ── Warning cambio meccanica ──────────────────────────────────────────────

  const warning = useMemo(
    () => getMLMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render (Modello B) ────────────────────────────────────────────────────

  return (
    <TrialFlow<StimoloML, RispostaML>
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
