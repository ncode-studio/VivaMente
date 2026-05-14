"use client";

/**
 * GoNogoTaskEngine — game engine per la famiglia Go/No-Go Cromatico (Famiglia 12).
 *
 * ## Deroghe GDD (vedi `_deroghe.ts`)
 *
 * 1. **Modello A timer 60s** invece di Modello B (decisione 2026-04-30).
 *    La sessione termina a `tempoScaduto` di pagina, non a count di stimoli.
 *    Conseguenze:
 *      - `trialValutativi = null`.
 *      - Generazione on-demand stimolo-per-stimolo via `generaProssimoStimolo`.
 *      - `getSessionDurationMs` di registry ritorna `GO_NOGO_TIMER_MS`.
 * 2. **N distrattori (No-Go) scalato** da lv 3+ (1→6 colori) invece di sempre
 *    1 vs 1. La coppia GDD-canonical resta usata per Go base (sempre lv 1+)
 *    e per il singolo distrattore lv 1–2.
 * 3. **ISI progressivo** (deroga 2026-04-30): da 400ms (lv 1) a 100ms (lv 12+).
 *    GDD prescrive 0 (flusso continuo). Curva senior-friendly ai livelli bassi.
 * 4. **Feedback "standard"** (deroga 2026-04-30): GDD prescrive "error-only",
 *    deroga per dare conferma positiva sui corretti.
 *
 * ## Comportamento invariato vs precedente versione
 *
 *   - 5 contatori metriche (no `tempo_totale_nogo_ms` — i nogo corretti non hanno tap).
 *   - `valutaRisposta` invertita: timeout su nogo = corretto (inibizione riuscita).
 *   - feedbackType = "error-only".
 *   - Override accuratezza clinica via `onCompleteWrapped` (pattern SART via b).
 *
 * Tutorial differenziato per N distrattori:
 *   - lv 1–2 (n=1): testo binario classico ("NON toccare i cerchi {nogo}").
 *   - lv 3+ (n≥2):  testo multi-distrattore ("Tocca SOLO i cerchi {go},
 *                   ignora tutti gli altri colori").
 *
 * Riferimenti:
 *   docs/gdd/families/go-nogo.md
 *   ./_deroghe.ts
 */

import { useRef, useCallback } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  SessionResult,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import {
  getGoNogoLevel,
  getGoNogoMechanicWarning,
  COLORE_CSS_GO_NOGO,
  type CoppiaColore,
  type ColoreGoNogo,
} from "./levels";
import {
  creaStreamState,
  generaProssimoStimolo,
  type GoNogoStreamState,
  type GoNogoStimolo,
} from "./sequence";
import { GoNogoStimulus, type GoNogoRisposta } from "./GoNogoStimulus";
import { getIsiMs, GO_NOGO_FEEDBACK_TYPE } from "./_deroghe";

// ── Tutti i colori disponibili ───────────────────────────────────────────────

const TUTTI_COLORI: readonly ColoreGoNogo[] = [
  "verde", "rosso", "blu", "arancio",
  "giallo", "viola", "turchese", "azzurro",
];

// ── Helper inline ────────────────────────────────────────────────────────────

/** Pesca `n` elementi univoci dal pool via Fisher-Yates partial. */
function pescaN<T>(pool: readonly T[], n: number, rng: () => number): T[] {
  const arr = [...pool];
  const result: T[] = [];
  for (let i = 0; i < n && i < arr.length; i++) {
    const j = i + Math.floor(rng() * (arr.length - i));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    result.push(arr[i]);
  }
  return result;
}

/** Sceglie una coppia canonical random tra le ammesse del livello. */
function scegliCoppiaCanonical(
  coppie: readonly CoppiaColore[],
  rng: () => number,
): CoppiaColore {
  return coppie[Math.floor(rng() * coppie.length)];
}

// ── Demo per il tutorial — usa la coppia attiva runtime ──────────────────────

function GoNogoDemo({ tipo, coppia }: { tipo: "go" | "nogo"; coppia: CoppiaColore }) {
  const colore = tipo === "go" ? coppia.go : coppia.nogo;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-24 h-24 rounded-full"
        style={{
          backgroundColor: COLORE_CSS_GO_NOGO[colore],
          boxShadow: tipo === "go" ? "0 0 0 4px #22C55E55" : "none",
          opacity: tipo === "go" ? 1 : 0.85,
        }}
        aria-label={`Cerchio ${colore}`}
      />
      <p className="text-sm font-bold" style={{ color: tipo === "go" ? "#15803D" : "#B91C1C" }}>
        {tipo === "go" ? "Tocca il cerchio" : "NON toccare"}
      </p>
    </div>
  );
}

// ── GoNogoTaskEngine ──────────────────────────────────────────────────────────

export function GoNogoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  livelloPrec,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  // ── Configurazione livello ──────────────────────────────────────────────

  const config = getGoNogoLevel(livello);
  const nGoTarget    = config.nGoTarget;
  const nDistrattori = config.nDistrattori;

  // ── RNG sessione ────────────────────────────────────────────────────────
  const rngRef = useRef<() => number>(Math.random);

  // ── Setup colori go + pool distrattori (lazy init al mount) ──────────────

  const coppiaAttivaRef = useRef<CoppiaColore | null>(null);
  const goColoriRef     = useRef<readonly ColoreGoNogo[] | null>(null);
  const distrattoriRef  = useRef<readonly ColoreGoNogo[] | null>(null);

  if (coppiaAttivaRef.current === null) {
    const coppia = scegliCoppiaCanonical(config.coppieAmmesse, rngRef.current);
    coppiaAttivaRef.current = coppia;

    // Colori go: il go della coppia + (eventualmente) un secondo colore go.
    // Il secondo go è SEMPRE l'altro "base" (verde se la coppia ha go=blu, e viceversa).
    const goColori: ColoreGoNogo[] = [coppia.go];
    if (nGoTarget >= 2) {
      const altroBase: ColoreGoNogo = coppia.go === "verde" ? "blu" : "verde";
      goColori.push(altroBase);
    }
    goColoriRef.current = goColori;

    // Distrattori: il nogo canonical della coppia + altri colori non-go pescati a caso.
    if (nDistrattori === 1) {
      distrattoriRef.current = [coppia.nogo];
    } else {
      const candidati = TUTTI_COLORI.filter((c) => !goColori.includes(c) && c !== coppia.nogo);
      const extra = pescaN(candidati, nDistrattori - 1, rngRef.current);
      distrattoriRef.current = [coppia.nogo, ...extra];
    }
  }

  const goColoriAttivi = goColoriRef.current!;

  // ── Stato stream cumulativo (cap + ratio rolling) ────────────────────────
  const streamStateRef = useRef<GoNogoStreamState>(creaStreamState());

  // ── Tutorial (prima sessione) ───────────────────────────────────────────
  // Pagina nogo differenziata in base a nDistrattori:
  //   n=1 (lv 1-2): testo binario classico (nogo specifico per coppia).
  //   n≥2 (lv 3+): testo multi-distrattore ("ignora altri colori").

  const coppia = coppiaAttivaRef.current!;

  // Stringhe colore per il tutorial (es. "verde" oppure "verde o blu")
  const goColoriLabel = goColoriAttivi.length === 1
    ? goColoriAttivi[0]
    : goColoriAttivi.slice(0, -1).join(", ") + " o " + goColoriAttivi[goColoriAttivi.length - 1];

  const paginaGoTitolo = goColoriAttivi.length === 1
    ? `Tocca i cerchi ${goColoriLabel}`
    : `Tocca i cerchi ${goColoriLabel}`;

  const paginaGoTesto = goColoriAttivi.length === 1
    ? `Appariranno cerchi colorati in punti diversi dello schermo. Quando vedi un cerchio ${goColoriLabel}, toccalo subito.`
    : `Appariranno cerchi colorati in punti diversi dello schermo. Tocca subito ogni cerchio ${goColoriLabel}.`;

  const paginaNogoTitolo = nDistrattori === 1
    ? `NON toccare i cerchi ${coppia.nogo}`
    : `NON toccare gli altri colori`;

  const paginaNogoTesto = nDistrattori === 1
    ? `Quando vedi un cerchio ${coppia.nogo}, NON toccare. Aspetta il prossimo.`
    : `Compaiono cerchi di colori diversi. Tocca SOLO i cerchi ${goColoriLabel}, ignora tutti gli altri colori.`;

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [
          {
            titolo: paginaGoTitolo,
            testo:  paginaGoTesto,
            demo:   <GoNogoDemo tipo="go" coppia={coppia} />,
          },
          {
            titolo: paginaNogoTitolo,
            testo:  paginaNogoTesto,
            demo:   <GoNogoDemo tipo="nogo" coppia={coppia} />,
          },
        ],
      }
    : null;

  // ── Warning cambio meccanica ────────────────────────────────────────────

  const warning = getGoNogoMechanicWarning(livelloPrec, livello);

  // ── generaStimolo (on-demand via state cumulativo) ──────────────────────

  const generaStimolo = useCallback((): GoNogoStimolo => {
    return generaProssimoStimolo(
      streamStateRef.current,
      goColoriRef.current!,
      distrattoriRef.current!,
      config.multiSpawnRate,
      rngRef.current,
    );
  }, [config.multiSpawnRate]);

  // ── renderGoNogoStimolo ─────────────────────────────────────────────────

  const renderGoNogoStimolo = useCallback(
    (props: { stimolo: GoNogoStimolo; onRisposta: (r: GoNogoRisposta) => void }) => (
      <GoNogoStimulus
        {...props}
        disabilitato={false}
      />
    ),
    [],
  );

  // ── valutaRisposta ──────────────────────────────────────────────────────

  const valutaRisposta = useCallback(
    (stimolo: GoNogoStimolo, risposta: GoNogoRisposta | null): boolean => {
      // Timeout (no tap) → corretto solo se nogo (inibizione riuscita)
      if (risposta === null) return stimolo.tipo === "nogo";
      // Tap su un cerchio:
      //   - su "main": corretto solo se il main è go
      //   - su "decoy": sempre errato (il decoy è sempre nogo)
      if (risposta.target === "decoy") return false;
      return stimolo.tipo === "go";
    },
    [],
  );

  // ── aggiornaMetriche ────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      prev: Record<string, number>,
      stimolo: GoNogoStimolo,
      risposta: GoNogoRisposta | null,
      corretto: boolean,
    ): Record<string, number> => {
      const isGo = stimolo.tipo === "go";
      return {
        ...prev,
        go_totali:          (prev.go_totali   ?? 0) + (isGo  ? 1 : 0),
        nogo_totali:        (prev.nogo_totali ?? 0) + (!isGo ? 1 : 0),
        go_errori:          (prev.go_errori   ?? 0) + (isGo  && !corretto ? 1 : 0),
        nogo_errori:        (prev.nogo_errori ?? 0) + (!isGo && !corretto ? 1 : 0),
        tempo_totale_go_ms: (prev.tempo_totale_go_ms ?? 0) +
          (isGo && corretto && risposta !== null ? risposta.tempoMs : 0),
      };
    },
    [],
  );

  // ── onCompleteWrapped — override accuratezza clinica (SART via b) ─────────

  const onCompleteWrapped = useCallback(
    (risultato: SessionResult) => {
      const m = risultato.metriche;
      const totali = (m.go_totali ?? 0) + (m.nogo_totali ?? 0);
      const errori = (m.go_errori ?? 0) + (m.nogo_errori ?? 0);
      const accuratezzaClinica = totali > 0 ? (totali - errori) / totali : 0;

      onComplete({
        ...risultato,
        accuratezzaValutativa: accuratezzaClinica,
        scoreGrezzo:           Math.round(accuratezzaClinica * 100),
      });
    },
    [onComplete],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <TrialFlow<GoNogoStimolo, GoNogoRisposta>
      tLimMs={config.tLimMs}
      trialValutativi={null}
      microProgressione={null}
      generaStimolo={generaStimolo}
      renderStimolo={renderGoNogoStimolo}
      valutaRisposta={valutaRisposta}
      tutorial={tutorial}
      warning={warning}
      aggiornaMetriche={aggiornaMetriche}
      feedbackType={GO_NOGO_FEEDBACK_TYPE}
      isiMs={getIsiMs(livello)}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}
