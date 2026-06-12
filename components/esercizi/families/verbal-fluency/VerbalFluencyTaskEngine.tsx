"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  SessionResult,
  TutorialConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getVFLevel,
  VF_MICRO_DELTA,
  VF_MICRO_MAX_OVER,
  VF_TLIM_FLOOR_MS,
} from "./levels";
import {
  creaVFPoolRef,
  generaStimoloVF,
  type StimoloVF,
  type RispostaVF,
  type VFVariante,
} from "./sequence";
import { VerbalFluencySession } from "./VerbalFluencySession";
import { caricaDizionario } from "./dizionario";

// Verbal Fluency = dominio Linguaggio.
const ACCENT = CATEGORIA_COLORS.linguaggio.text;

export function VerbalFluencyTaskEngine({
  livello,
  esercizioId,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const variante: VFVariante =
    esercizioId === "verbal_fluency_fonemica" ? "fonemica" :
    esercizioId === "verbal_fluency_alternata" ? "alternata" :
    "semantica";

  const config  = getVFLevel(livello);
  const rngRef  = useRef<() => number>(Math.random);
  const poolRef = useRef(creaVFPoolRef(rngRef.current));

  // Scalda il dizionario il prima possibile (mentre l'utente legge intro/tutorial),
  // così a inizio trial è già in memoria e il loader è quasi istantaneo.
  useEffect(() => { caricaDizionario().catch(() => {}); }, []);

  // ── Micro-progressione su tLimMs (negativa) ───────────────────────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({
      valoreBase: config.tLimMs,
      delta:      VF_MICRO_DELTA,
      maxDelta:   VF_MICRO_MAX_OVER,
      limite:     VF_TLIM_FLOOR_MS,
    }),
    [config.tLimMs],
  );

  // ── generaStimolo ─────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloVF => {
      return generaStimoloVF(
        variante,
        config.bandaCategoria,
        config.letterPool,
        config.scoreThreshold,
        ctx.valoreCorrente,   // tLimMs (può essere ridotto dalla micro-progressione)
        poolRef.current,
        rngRef.current,
      );
    },
    [variante, config],
  );

  // ── valutaRisposta — score ≥ soglia = corretto ────────────────────────────

  const valutaRisposta = useCallback(
    (stimolo: StimoloVF, risposta: RispostaVF | null): boolean => {
      if (!risposta) return false;
      return risposta.score >= stimolo.scoreThreshold;
    },
    [],
  );

  // ── aggiornaMetriche ──────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      _stimolo: StimoloVF,
      risposta: RispostaVF | null,
      _corretto: boolean,
    ): Record<string, number> => {
      return {
        ...precedenti,
        trial_completati: (precedenti.trial_completati ?? 0) + 1,
        parole_totali:    (precedenti.parole_totali    ?? 0) + (risposta?.score  ?? 0),
        errori_totali:    (precedenti.errori_totali    ?? 0) + (risposta?.errori ?? 0),
      };
    },
    [],
  );

  // ── renderStimolo ─────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: {
      stimolo: StimoloVF;
      onRisposta: (r: RispostaVF) => void;
    }) => (
      <VerbalFluencySession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
        tempoScaduto={tempoScaduto}
      />
    ),
    [tempoScaduto],
  );

  // ── onCompleteWrapped — score come accuratezza normalizzata ───────────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const score = risultato.metriche.parole_totali ?? 0;
      const soglia = config.scoreThreshold;
      const acc    = soglia > 0 ? Math.min(score / soglia, 1) : 0;

      onComplete({
        ...risultato,
        accuratezzaValutativa: acc,
        scoreGrezzo:           score,
      });
    },
    [onComplete, config.scoreThreshold],
  );

  // ── Tutorial ──────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? variante === "semantica"
      ? {
          accent: ACCENT,
          ctaLabel: "Comincia",
          pagine: [{
            titolo: "Quante ne riesci a trovare?",
            righe: [
              { icona: "🗂️", testo: "Compare una categoria, per esempio \"animali\". Leggila con calma." },
              { icona: "✏️", testo: "Scrivi una parola che appartiene a quella categoria e tocca \"Aggiungi\"." },
              { icona: "⏱️", testo: "Continua finché c'è tempo: trovane quante più riesci, senza ripeterle." },
            ],
          }],
        }
      : variante === "alternata"
        ? {
            accent: ACCENT,
            ctaLabel: "Comincia",
            pagine: [{
              titolo: "Due categorie, a turno",
              righe: [
                { icona: "🔀", testo: "Compaiono due categorie, per esempio \"frutti\" e \"animali\"." },
                { icona: "✏️", testo: "Scrivi una parola per la prima, poi una per la seconda, alternando." },
                { icona: "⏱️", testo: "Vai avanti così finché c'è tempo, senza ripetere le parole." },
              ],
            }],
          }
        : {
            accent: ACCENT,
            ctaLabel: "Comincia",
            pagine: [{
              titolo: "Parole dalla stessa lettera",
              righe: [
                { icona: "🔤", testo: "Compare una lettera, per esempio \"S\". Leggila con calma." },
                { icona: "✏️", testo: "Scrivi una parola che inizia con quella lettera e tocca \"Aggiungi\"." },
                { icona: "⏱️", testo: "Trovane quante più riesci, senza ripetere parole né usare nomi propri." },
              ],
            }],
          }
    : null;

  // ── Render (Modello B — 1 trial, timer gestito in session) ───────────────

  return (
    <TrialFlow<StimoloVF, RispostaVF>
      tLimMs={null}
      trialValutativi={config.trialsPerSession}
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
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
