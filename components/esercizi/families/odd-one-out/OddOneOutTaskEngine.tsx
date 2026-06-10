"use client";

/**
 * OddOneOutTaskEngine — engine top-level per la famiglia Odd One Out (Famiglia 3).
 *
 * Discrimina le 2 varianti via `esercizioId`:
 *   - odd_one_out_numeri_lettere → strategy programmatica
 *   - odd_one_out_immagini       → strategy emoji Twemoji-compatibile inline
 *
 * Modello A (timer fisso 90s lv 1–10, 120s lv 11–20). La sessione termina
 * a `tempoScaduto`. Trial valutativi = null lato TrialFlow.
 *
 * Differenze chiave vs SartTaskEngine:
 *   1. Modello A (non B): trialValutativi=null, durata gestita da page.tsx.
 *   2. Discrimina 2 varianti via lookup esercizioId → stimulusType.
 *   3. Micro-progressione DOPPIA:
 *      - PRIMARIA: +1 nStimuli, gestita nativamente da TrialFlow.
 *      - SECONDARIA: -1000ms tLimMs quando nStimuli=12 (lv 18+). NON
 *        supportata da TrialFlow (1 solo parametro). L'Engine intercetta
 *        ctx.isBonus + nStimuli=12 in generaStimolo, accumula step in
 *        bonusStepSecondarioRef, applica via setState a tLimMsCorrente.
 *   4. Recovery RangeError su pescaTrialImmagini: se recentlyUsed esaurisce
 *      il pool emoji, svuota recentlyUsed e ritenta una sola volta.
 *      Deroga GDD soft no-rep documentata.
 *
 * Vincolo no-rep:
 *   - immagini: recentlyUsedRef FIFO, capacità 10 × nStimuli. Passato come
 *     Set a pescaTrialImmagini.
 *   - numeri_lettere: nessun no-rep persistente first-pass.
 *
 * ## Deroghe GDD (vedi `_deroghe.ts`)
 *
 *   1. Timer sessione 60s fisso (GDD: 90/120/180s decrescenti).
 *   2. T.Lim default 8s per lv 1-12 (GDD: tLimMs=null). Evita blocco trial
 *      su timer pagina scaduto.
 *   3. Gating beta lv 11+ numeri_lettere: regole astratte non giocabili
 *      per senior senza display criterio. Utente passa a `immagini`.
 *
 * Riferimenti:
 *   docs/gdd/families/odd-one-out.md
 *   docs/gdd/shared/02-trial-flow.md
 *   docs/gdd/shared/03-progression.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GameEngineProps,
  MicroProgressioneConfig,
  TutorialConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { ODD_ONE_OUT_TLIM_DEFAULT_MS, SOGLIA_GATING_NUMERI_LETTERE } from "./_deroghe";
import {
  getOddOneOutLevel,
  getOddOneOutMechanicWarning,
  MICRO_PROGRESSIONE_PRIMARIA_ODD,
  MICRO_PROGRESSIONE_SECONDARIA_ODD,
} from "./levels";
import {
  assemblaTrialOdd,
  type TrialOdd,
  type RispostaOdd,
} from "./sequence";
import { pescaTrialNumeriLettere } from "./stimuli/numeri-lettere";
import { pescaTrialImmagini } from "./stimuli/immagini";
import { OddOneOutStimulus } from "./OddOneOutStimulus";

// Odd One Out = dominio Attenzione (ricerca visiva / attenzione selettiva).
const ACCENT = CATEGORIA_COLORS.attenzione.text;

// ── Lookup esercizioId → stimulusType ─────────────────────────────────────────

type StimulusType = "numeri_lettere" | "immagini";

function stimulusTypeDa(esercizioId: string): StimulusType {
  if (esercizioId === "odd_one_out_numeri_lettere") return "numeri_lettere";
  if (esercizioId === "odd_one_out_immagini")        return "immagini";
  throw new Error(`[odd-one-out] esercizioId non riconosciuto: ${esercizioId}`);
}

// ── Demo statico per il tutorial ──────────────────────────────────────────────

function OddOneOutDemo({ stimulusType }: { stimulusType: StimulusType }) {
  const items =
    stimulusType === "numeri_lettere"
      ? [{ v: "A" }, { v: "B" }, { v: "C" }, { v: "7", anomalia: true }]
      : [{ v: "🍎" }, { v: "🍐" }, { v: "🍌" }, { v: "🚗", anomalia: true }];
  const isMono = stimulusType === "numeri_lettere";
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center rounded-xl bg-white border-2"
            style={{
              width:        "64px",
              height:       "64px",
              borderColor:  it.anomalia ? "#16A34A" : "#E5E7EB",
              boxShadow:    it.anomalia ? "0 0 0 3px rgba(22, 163, 74, 0.25)" : "none",
              fontFamily:   isMono
                ? 'ui-monospace, "JetBrains Mono", monospace'
                : 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
              fontSize:     isMono ? "1.75rem" : "2rem",
              fontWeight:   700,
              color:        "#111827",
              textAlign:    "center",
              padding:      0,
              lineHeight:   1,
            }}
          >
            {it.v}
          </div>
          {it.anomalia && (
            <span className="text-xs font-bold" style={{ color: "#16A34A" }}>
              Tocca
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Gating beta lv 11+ numeri_lettere ────────────────────────────────────────

function GatingNumeriLettere({ livello }: { livello: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 w-full max-w-md mx-auto text-center">
      <span style={{ fontSize: "4rem" }} aria-hidden="true">🚧</span>
      <h2 className="text-2xl font-bold text-gray-900">
        Variante in arrivo
      </h2>
      <p className="text-base text-gray-700">
        La variante <strong>Numeri e Lettere</strong> è disponibile in beta
        limitata fino al livello 10. Sei al livello {livello}.
      </p>
      <p className="text-sm text-gray-600">
        Per i livelli avanzati prova la variante con <strong>immagini</strong>:
        ha più varietà di criteri ed è più adatta ai livelli alti.
      </p>
      <a
        href="/esercizi"
        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold"
      >
        Torna agli esercizi
      </a>
    </div>
  );
}

// ── OddOneOutTaskEngine — wrapper con gating ────────────────────────────────
// Il wrapper fa il check di gating PRIMA di chiamare qualsiasi hook;
// se il check passa, delega all'inner che contiene tutti gli hook in ordine
// stabile (react-hooks/rules-of-hooks rispettato).

export function OddOneOutTaskEngine(props: GameEngineProps) {
  const stimulusType = stimulusTypeDa(props.esercizioId);
  if (
    stimulusType === "numeri_lettere" &&
    props.livello >= SOGLIA_GATING_NUMERI_LETTERE
  ) {
    return <GatingNumeriLettere livello={props.livello} />;
  }
  return <OddOneOutTaskEngineInner {...props} />;
}

// ── OddOneOutTaskEngineInner — engine effettivo (tutti gli hook) ────────────

function OddOneOutTaskEngineInner({
  esercizioId,
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const stimulusType = stimulusTypeDa(esercizioId);
  const config = getOddOneOutLevel(livello);

  // ── Micro-progressione primaria (gestita da TrialFlow) ────────────────────

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({ valoreBase: config.nStimuli, ...MICRO_PROGRESSIONE_PRIMARIA_ODD }),
    [config.nStimuli],
  );

  // ── Micro-progressione secondaria (Engine-managed) ─────────────────────────

  const bonusStepSecondarioRef = useRef(0);
  const [tLimMsCorrente, setTLimMsCorrente] = useState<number | null>(config.tLimMs);

  useEffect(() => {
    bonusStepSecondarioRef.current = 0;
    setTLimMsCorrente(config.tLimMs);
  }, [config.tLimMs]);

  // ── State no-rep (FIFO ref) ────────────────────────────────────────────────
  // Capacità: 10 trial × nStimuli max corrente. Solo per `immagini`.

  const recentlyUsedRef = useRef<string[]>([]);

  const aggiornaRecentlyUsed = useCallback(
    (valori: string[]) => {
      const arr = recentlyUsedRef.current;
      arr.push(...valori);
      const max = 10 * config.nStimuli;
      if (arr.length > max) arr.splice(0, arr.length - max);
    },
    [config.nStimuli],
  );

  // ── RNG (Math.random in produzione) ───────────────────────────────────────
  const rngRef = useRef<() => number>(Math.random);

  // ── generaStimolo ──────────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number; isBonus: boolean }): TrialOdd => {
      const rng = rngRef.current;
      const nStimuli = ctx.valoreCorrente;

      // Micro-progressione SECONDARIA: solo se isBonus + nStimuli al ceiling 12.
      if (ctx.isBonus && config.nStimuli === 12 && config.tLimMs !== null) {
        const step = Math.min(
          MICRO_PROGRESSIONE_SECONDARIA_ODD.maxDelta,
          bonusStepSecondarioRef.current + 1,
        );
        bonusStepSecondarioRef.current = step;
        const nuovo = Math.max(
          MICRO_PROGRESSIONE_SECONDARIA_ODD.limite,
          config.tLimMs + step * MICRO_PROGRESSIONE_SECONDARIA_ODD.delta,
        );
        setTLimMsCorrente(nuovo);
      } else if (!ctx.isBonus && bonusStepSecondarioRef.current !== 0) {
        bonusStepSecondarioRef.current = 0;
        setTLimMsCorrente(config.tLimMs);
      }

      try {
        if (stimulusType === "numeri_lettere") {
          const out = pescaTrialNumeriLettere(livello, config.dimensione, nStimuli, rng);
          return assemblaTrialOdd(out.stimoliBase, out.anomalia, out.regolaId, rng);
        } else {
          // stimulusType === "immagini"
          const out = pescaTrialImmagini(
            livello,
            config.dimensione,
            nStimuli,
            new Set(recentlyUsedRef.current),
            rng,
          );
          aggiornaRecentlyUsed([
            ...out.stimoliBase.map((s) => s.valore),
            out.anomalia.valore,
          ]);
          return assemblaTrialOdd(out.stimoliBase, out.anomalia, out.regolaId, rng);
        }
      } catch (err) {
        // Recovery: recentlyUsed esaurito → svuota e ritenta una volta.
        // Deroga GDD soft no-rep — preferiamo riproposizione di emoji
        // recente piuttosto che blocco sessione.
        if (err instanceof RangeError && stimulusType === "immagini") {
          // eslint-disable-next-line no-console
          console.warn(
            "[odd-one-out] recentlyUsed esaurito, reset (deroga GDD soft no-rep)",
          );
          recentlyUsedRef.current = [];
          const out = pescaTrialImmagini(
            livello,
            config.dimensione,
            nStimuli,
            new Set(),
            rng,
          );
          aggiornaRecentlyUsed([
            ...out.stimoliBase.map((s) => s.valore),
            out.anomalia.valore,
          ]);
          return assemblaTrialOdd(out.stimoliBase, out.anomalia, out.regolaId, rng);
        }
        throw err;
      }
    },
    [
      stimulusType,
      livello,
      config.dimensione,
      config.nStimuli,
      config.tLimMs,
      aggiornaRecentlyUsed,
    ],
  );

  // ── valutaRisposta ─────────────────────────────────────────────────────────

  const valutaRisposta = useCallback(
    (stimolo: TrialOdd, risposta: RispostaOdd | null): boolean => {
      if (risposta === null) return false;
      return risposta.tappato === stimolo.anomaliaIndex;
    },
    [],
  );

  // ── aggiornaMetriche ───────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      precedenti: Record<string, number>,
      _stimolo: TrialOdd,
      risposta: RispostaOdd | null,
      corretto: boolean,
    ): Record<string, number> => ({
      ...precedenti,
      trial_corretti:
        (precedenti.trial_corretti ?? 0) + (corretto ? 1 : 0),
      trial_errati:
        (precedenti.trial_errati ?? 0) + (!corretto && risposta !== null ? 1 : 0),
      trial_timeout:
        (precedenti.trial_timeout ?? 0) + (risposta === null ? 1 : 0),
      tempo_totale_ms:
        (precedenti.tempo_totale_ms ?? 0) +
        (corretto && risposta !== null ? Math.round(risposta.tempoMs) : 0),
    }),
    [],
  );

  // ── renderStimolo ──────────────────────────────────────────────────────────

  const renderStimolo = useCallback(
    (props: { stimolo: TrialOdd; onRisposta: (risposta: RispostaOdd) => void }) => (
      <OddOneOutStimulus stimolo={props.stimolo} onRisposta={props.onRisposta} />
    ),
    [],
  );

  // ── Tutorial (prima sessione) ──────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        accent: ACCENT,
        ctaLabel: "Comincia",
        pagine: [{
          titolo: stimulusType === "numeri_lettere"
            ? "Trova l'elemento diverso"
            : "Trova l'immagine diversa",
          demo: <OddOneOutDemo stimulusType={stimulusType} />,
          righe: stimulusType === "numeri_lettere"
            ? [
                { icona: "🔤", testo: "Vedrai alcuni numeri e lettere sullo schermo." },
                { icona: "🔎", testo: "Uno solo è diverso dagli altri: cercalo con calma." },
                { icona: "👆", testo: "Toccalo. Non c'è fretta, prenditi il tuo tempo." },
              ]
            : [
                { icona: "🖼️", testo: "Vedrai alcune immagini sullo schermo." },
                { icona: "🔎", testo: "Una sola non c'entra con le altre: cercala con calma." },
                { icona: "👆", testo: "Toccala. Non c'è fretta, prenditi il tuo tempo." },
              ],
        }],
      }
    : null;

  // ── Warning cambio meccanica (3 transizioni bidirezionali) ────────────────

  const warning = useMemo(
    () => getOddOneOutMechanicWarning(livelloPrec, livello),
    [livelloPrec, livello],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TrialFlow<TrialOdd, RispostaOdd>
      tLimMs={tLimMsCorrente ?? ODD_ONE_OUT_TLIM_DEFAULT_MS}
      trialValutativi={null}
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
      onComplete={onComplete}
      onProgress={onProgress}
    />
  );
}
