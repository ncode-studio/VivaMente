"use client";

/**
 * RecallGridMLTTaskEngine — engine wrapper TrialFlow per Recall Grid MLT
 * (Modello B sessione a completamento, prima famiglia MLT pura nel codice).
 *
 * Differenze chiave vs MBT:
 *   - Modello B: trialValutativi = config.trialsPerSession (vincolante).
 *     La sessione termina al completamento dei trial, non a tempoScaduto.
 *   - stimulusType hardcoded a "immagini" — niente varianti MLT parole
 *     (GDD non prescrive un esercizio Parole MLT).
 *   - Distrattore delay = BouncingBall (componente shared
 *     components/esercizi/shared/distrattore-palla/), non countdown.
 *   - Metric extra `palla_tap_count`: tap utente sulla palla durante
 *     i delay (anti zone-out, no penalty first-pass — vedi Domanda GDD #2
 *     del design doc).
 *
 * Riferimenti:
 *   docs/gdd/families/recall-grid.md §Esercizio 3 (riga 98)
 *   docs/gdd/shared/04-memory-types.md §Task distrattore (riga 22)
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getRecallGridMLTLevel,
  getRecallGridMLTMechanicWarning,
  MICRO_PROGRESSIONE_RECALL_GRID,
  ncells,
} from "./levels";
import {
  generaTrialRecallGrid,
  type TrialRecallGrid,
  type RispostaRecallGrid,
} from "./sequence";
import { RecallGridSession } from "./RecallGridSession";
import { BouncingBall } from "@/components/esercizi/shared/distrattore-palla/BouncingBall";

// ── RecallGridMLTTaskEngine ──────────────────────────────────────────────────

export function RecallGridMLTTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const config = getRecallGridMLTLevel(livello);

  const rngRef              = useRef<() => number>(Math.random);
  const recentlyUsedRef     = useRef<string[]>([]);
  const distrattoreHitsRef  = useRef(0);
  const distrattoreMissRef  = useRef(0);
  const distrattoreFARef    = useRef(0);

  // ── Micro-progressione: limite runtime = ncells(gridSize) ────────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.nStimuli,
      ...MICRO_PROGRESSIONE_RECALL_GRID,
      limite: ncells(config.gridSize),
    }),
    [config.nStimuli, config.gridSize],
  );

  // ── generaStimolo ──────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }): TrialRecallGrid => {
      const rng = rngRef.current;
      const levelEffettivo = ctx.isBonus
        ? { ...config, nStimuli: ctx.valoreCorrente }
        : config;

      try {
        const trial = generaTrialRecallGrid(
          levelEffettivo,
          "immagini",
          new Set(recentlyUsedRef.current),
          rng,
        );
        for (const s of trial.stimuli) recentlyUsedRef.current.push(s.valore);
        if (recentlyUsedRef.current.length > 30) {
          recentlyUsedRef.current.splice(0, recentlyUsedRef.current.length - 30);
        }
        return trial;
      } catch (err) {
        if (err instanceof RangeError) {
          // eslint-disable-next-line no-console
          console.warn("[recall-grid/mlt] recentlyUsed esaurito, reset");
          recentlyUsedRef.current = [];
          const trial = generaTrialRecallGrid(
            levelEffettivo, "immagini", new Set(), rng,
          );
          for (const s of trial.stimuli) recentlyUsedRef.current.push(s.valore);
          return trial;
        }
        throw err;
      }
    },
    [config],
  );

  // ── valutaRisposta (identica MBT: tutti posizione+identità corretti) ──────

  const valutaRisposta = useCallback(
    (stimolo: TrialRecallGrid, risposta: RispostaRecallGrid | null): boolean => {
      if (risposta === null) return false;
      return stimolo.stimuli.every((s) => {
        const p = risposta.posizioni.find((pp) => pp.stimoloId === s.id);
        return p !== undefined && p.row === s.row && p.col === s.col;
      });
    },
    [],
  );

  // ── aggiornaMetriche (6 contatori MBT + palla_tap_count MLT extra) ────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      stimolo: TrialRecallGrid,
      risposta: RispostaRecallGrid | null,
      _corretto: boolean,
    ): Record<string, number> => {
      if (risposta === null) return precedenti;

      const totali = stimolo.stimuli.length;
      let posIdOk    = 0;
      let idOkPosErr = 0;
      for (const s of stimolo.stimuli) {
        const p = risposta.posizioni.find((pp) => pp.stimoloId === s.id);
        if (!p) continue;
        if (p.row === s.row && p.col === s.col) {
          posIdOk++;
        } else {
          idOkPosErr++;
        }
      }
      const omessi = totali - risposta.posizioni.length;

      return {
        ...precedenti,
        stimoli_totali:
          (precedenti.stimoli_totali ?? 0) + totali,
        stimoli_posizione_e_identita_corrette:
          (precedenti.stimoli_posizione_e_identita_corrette ?? 0) + posIdOk,
        stimoli_identita_corretta_posizione_errata:
          (precedenti.stimoli_identita_corretta_posizione_errata ?? 0) + idOkPosErr,
        stimoli_omessi:
          (precedenti.stimoli_omessi ?? 0) + omessi,
        tempo_totale_repro_ms:
          (precedenti.tempo_totale_repro_ms ?? 0) + Math.round(risposta.tempoReproMs),
        trial_completati:
          (precedenti.trial_completati ?? 0) + 1,
        distrattore_hits:        distrattoreHitsRef.current,
        distrattore_misses:      distrattoreMissRef.current,
        distrattore_false_alarms: distrattoreFARef.current,
      };
    },
    [],
  );

  const handleDistrattoreMetriche = useCallback((hits: number, misses: number, falseAlarms: number) => {
    distrattoreHitsRef.current  += hits;
    distrattoreMissRef.current  += misses;
    distrattoreFARef.current    += falseAlarms;
  }, []);

  // ── renderStimolo (monta RecallGridSession + BouncingBall) ───────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo: TrialRecallGrid;
      onRisposta: (risposta: RispostaRecallGrid) => void;
    }) => (
      <RecallGridSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
        delayComponent={({ onCompleto }) => (
          <BouncingBall
            durataMs={props.stimolo.delayMs}
            onCompleto={onCompleto}
            onDistrattoreMetriche={handleDistrattoreMetriche}
          />
        )}
      />
    ),
    [handleDistrattoreMetriche, tempoScaduto],
  );

  // ── onCompleteWrapped — override accuratezza clinica (SART via b) ─────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m = risultato.metriche;
      const totali   = m.stimoli_totali ?? 0;
      const corrette = m.stimoli_posizione_e_identita_corrette ?? 0;
      const accuratezzaClinica = totali > 0 ? corrette / totali : 0;

      onComplete({
        ...risultato,
        accuratezzaValutativa: accuratezzaClinica,
        scoreGrezzo:           Math.round(accuratezzaClinica * 100),
      });
    },
    [onComplete],
  );

  // ── Tutorial ──────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [{
          titolo: "Memorizza e riposiziona",
          testo:
            `Vedrai una griglia con alcune immagini. Memorizza ogni immagine e dove si trova. ` +
            `Alla fine dovrai riposizionare le immagini nella cella giusta.`,
        }],
      }
    : null;

  // ── Warning cambio meccanica ─────────────────────────────────────────────

  const warning = useMemo(
    () => getRecallGridMLTMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  // Modello B: trialValutativi=config.trialsPerSession.

  return (
    <TrialFlow<TrialRecallGrid, RispostaRecallGrid>
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
