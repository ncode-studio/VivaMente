"use client";

/**
 * RecallGridMBTTaskEngine — engine wrapper TrialFlow per Recall Grid MBT
 * (Modello A timer fisso). Riceve `stimulusType: "parole" | "immagini"`
 * come prop extra (chiamato da wrapper inline nel registry).
 *
 * Struttura:
 *   - Modello A: trialValutativi=null (la sessione termina a tempoScaduto
 *     della pagina), tLimMs=null (i timing per-trial vivono dentro
 *     RecallGridSession).
 *   - Distrattore delay = countdown timer numerico (sub-componente
 *     `CountdownDelay` inline). MLT userà BouncingBall (Engine separato).
 *   - Micro-progressione: +1 nStimuli per trial bonus, limite runtime =
 *     ncells(gridSize) per evitare overflow griglia.
 *   - `accuratezzaValutativa` clinica ricalcolata in `onCompleteWrapped`
 *     come `stimoli_posizione_e_identita_corrette / stimoli_totali`
 *     (pattern SART via b).
 *
 * No-rep cross-trial: ref FIFO `recentlyUsed` capacità 30 (cap conservativo
 * per uno stub di 78 parole / 120 emoji). Recovery RangeError → reset.
 *
 * Riferimenti:
 *   docs/gdd/families/recall-grid.md
 *   docs/gdd/shared/02-trial-flow.md
 *   docs/gdd/shared/03-progression.md
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getRecallGridMBTLevel,
  getRecallGridMBTMechanicWarning,
  MICRO_PROGRESSIONE_RECALL_GRID,
  ncells,
} from "./levels";
import {
  generaTrialRecallGrid,
  type TrialRecallGrid,
  type RispostaRecallGrid,
  type StimulusType,
} from "./sequence";
import { RecallGridSession } from "./RecallGridSession";

// ── Props extra ──────────────────────────────────────────────────────────────

export type RecallGridMBTTaskEngineProps = GameEngineProps & {
  stimulusType: StimulusType;
};

// ── CountdownDelay (sub-componente inline per fase delay MBT) ───────────────

function CountdownDelay({
  durataMs,
  onCompleto,
}: {
  durataMs: number;
  onCompleto: () => void;
}) {
  const startedAtRef = useRef<number>(performance.now());
  const [tickNow, setTickNow] = useState<number>(() => performance.now());

  useEffect(() => {
    const idTick = setInterval(() => setTickNow(performance.now()), 100);
    const idFine = setTimeout(onCompleto, durataMs);
    return () => {
      clearInterval(idTick);
      clearTimeout(idFine);
    };
  }, [durataMs, onCompleto]);

  const residuoMs  = Math.max(0, durataMs - (tickNow - startedAtRef.current));
  const residuoSec = (residuoMs / 1000).toFixed(1);

  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ minHeight: "300px" }}
      aria-label="Pausa breve"
    >
      <span
        style={{
          fontSize:   "5rem",
          fontWeight: 700,
          color:      "#111827",
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          lineHeight: 1,
        }}
      >
        {residuoSec}
      </span>
    </div>
  );
}

// ── RecallGridMBTTaskEngine ──────────────────────────────────────────────────

export function RecallGridMBTTaskEngine({
  stimulusType,
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: RecallGridMBTTaskEngineProps) {

  const config = getRecallGridMBTLevel(livello);

  const rngRef           = useRef<() => number>(Math.random);
  const recentlyUsedRef  = useRef<string[]>([]);

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
      // valoreCorrente sostituisce nStimuli per trial bonus.
      const levelEffettivo = ctx.isBonus
        ? { ...config, nStimuli: ctx.valoreCorrente }
        : config;

      try {
        const trial = generaTrialRecallGrid(
          levelEffettivo,
          stimulusType,
          new Set(recentlyUsedRef.current),
          rng,
        );
        // FIFO cap 30 su recentlyUsed.
        for (const s of trial.stimuli) recentlyUsedRef.current.push(s.valore);
        if (recentlyUsedRef.current.length > 30) {
          recentlyUsedRef.current.splice(0, recentlyUsedRef.current.length - 30);
        }
        return trial;
      } catch (err) {
        if (err instanceof RangeError) {
          // Recovery: svuota recentlyUsed e ritenta una sola volta.
          // eslint-disable-next-line no-console
          console.warn("[recall-grid/mbt] recentlyUsed esaurito, reset");
          recentlyUsedRef.current = [];
          const trial = generaTrialRecallGrid(
            levelEffettivo,
            stimulusType,
            new Set(),
            rng,
          );
          for (const s of trial.stimuli) recentlyUsedRef.current.push(s.valore);
          return trial;
        }
        throw err;
      }
    },
    [config, stimulusType],
  );

  // ── valutaRisposta (stretta: tutti gli stimoli posizione+identità corretti) ─

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

  // ── aggiornaMetriche (6 contatori grezzi) ────────────────────────────────

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
      };
    },
    [],
  );

  // ── renderStimolo (monta RecallGridSession + CountdownDelay) ─────────────

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
          <CountdownDelay
            durataMs={props.stimolo.delayMs}
            onCompleto={onCompleto}
          />
        )}
      />
    ),
    [tempoScaduto],
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
          titolo: stimulusType === "parole"
            ? "Memorizza parole e posizioni"
            : "Memorizza immagini e posizioni",
          testo: stimulusType === "parole"
            ? `Vedrai una griglia con alcune parole. Memorizza ogni parola e dove si ` +
              `trova. Quando la griglia scomparirà, riposiziona ogni parola nella cella giusta.`
            : `Vedrai una griglia con alcune immagini. Memorizza ogni immagine e dove si ` +
              `trova. Quando la griglia scomparirà, riposiziona ogni immagine nella cella giusta.`,
        }],
      }
    : null;

  // ── Warning cambio meccanica ─────────────────────────────────────────────

  const warning = useMemo(
    () => getRecallGridMBTMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

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
