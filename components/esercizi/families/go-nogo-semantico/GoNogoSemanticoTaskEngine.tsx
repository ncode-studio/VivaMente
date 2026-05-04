"use client";

/**
 * GoNogoSemanticoTaskEngine — game engine Go/No-Go Semantico.
 *
 * Struttura identica al cromatico (GoNogoTaskEngine):
 *   - Modello A timer 60s (stessa deroga)
 *   - Stessa macchina a blocchi 80/20 + TrialFlow
 *   - Override accuratezza clinica via onCompleteWrapped (pattern SART via b)
 *
 * Differenze rispetto al cromatico:
 *   - Stimolo = parola (StimoloSemantico) invece di cerchio colorato
 *   - La coppia attiva è una CoppiaSemantica (categorie) invece di CoppiaColore
 *   - Header mostra la categoria target ("Tocca solo gli Animali")
 *   - Nessun ISI progressivo: ISI fisso 300ms (elaborazione semantica ha
 *     latenza già dentro T.Lim, non serve ammortizzare ulteriormente)
 */

import { useRef, useCallback, useMemo } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
  SessionResult,
} from "@/lib/exercise-types";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getGoNogoSemanticoLevel } from "./levels";
import {
  creaStreamStateSemantico,
  generaProssimoStimoloSemantico,
  selezionaCoppia,
  type GoNogoSemanticoStreamState,
  type StimoloSemantico,
} from "./sequence";
import { GoNogoSemanticoStimulus, type GoNogoSemanticoRisposta } from "./GoNogoSemanticoStimulus";

// ── Costanti ──────────────────────────────────────────────────────────────────

const TIMER_MS = 60_000;
const ISI_MS   = 300;

export const MICRO_PROGRESSIONE_SEMANTICO = {
  delta:    -50,
  maxDelta: 2,
  limite:   600,
} as const;

// ── GoNogoSemanticoTaskEngine ─────────────────────────────────────────────────

export function GoNogoSemanticoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {

  const config = getGoNogoSemanticoLevel(livello);

  const microProgressione: MicroProgressioneConfig = useMemo(
    () => ({ valoreBase: config.tLimMs, ...MICRO_PROGRESSIONE_SEMANTICO }),
    [config.tLimMs],
  );

  const rngRef = useRef<() => number>(Math.random);

  // Coppia semantica attiva per la sessione (lazy init al mount).
  const coppiaRef = useRef<ReturnType<typeof selezionaCoppia> | null>(null);
  if (coppiaRef.current === null) {
    coppiaRef.current = selezionaCoppia(config.coppieAmmesse, null, rngRef.current);
  }
  const coppia = coppiaRef.current!;

  // Stream state (blocchi 80/20).
  const streamStateRef = useRef<GoNogoSemanticoStreamState | null>(null);
  if (streamStateRef.current === null) {
    streamStateRef.current = creaStreamStateSemantico(coppia, rngRef.current);
  }

  // ── Tutorial ────────────────────────────────────────────────────────────

  const tutorial: TutorialConfig | null = mostraTutorial
    ? {
        pagine: [
          {
            titolo: `Il gruppo di oggi: ${coppia.etichetta}`,
            testo:  `Vedrai apparire una parola alla volta. Premi il pulsante "✓ ${coppia.etichetta}" SOLO se la parola appartiene al gruppo ${coppia.etichetta.toUpperCase()}. Se non appartiene, non fare nulla e aspetta la parola successiva.`,
            demo: (
              <div className="flex flex-col items-center gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  {coppia.paroleGo[0]}
                </span>
                <span className="text-sm text-green-600 font-semibold">
                  ✓ Appartiene a {coppia.etichetta} — premi il pulsante!
                </span>
              </div>
            ),
          },
          {
            titolo: "Non appartiene? Non toccare nulla",
            testo:  `Se la parola NON appartiene al gruppo ${coppia.etichetta.toUpperCase()}, tieni le mani ferme. Non premere nessun pulsante. Aspetta la parola successiva.`,
            demo: (
              <div className="flex flex-col items-center gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  {coppia.paroleNogo[0]}
                </span>
                <span className="text-sm text-red-500 font-semibold">
                  ✗ Non appartiene a {coppia.etichetta} — non toccare!
                </span>
              </div>
            ),
          },
        ],
      }
    : null;

  // ── Genera stimolo ──────────────────────────────────────────────────────

  const generaStimolo = useCallback(
    (): StimoloSemantico =>
      generaProssimoStimoloSemantico(streamStateRef.current!, rngRef.current),
    [],
  );

  // ── Valuta risposta ─────────────────────────────────────────────────────
  // timeout (null) su nogo = inibizione riuscita = corretto.

  const valutaRisposta = useCallback(
    (stimolo: StimoloSemantico, risposta: GoNogoSemanticoRisposta | null): boolean => {
      if (risposta === null) return stimolo.tipo === "nogo";
      return stimolo.tipo === "go";
    },
    [],
  );

  // ── Metriche ────────────────────────────────────────────────────────────

  const aggiornaMetriche = useCallback(
    (
      prev: Record<string, number>,
      stimolo: StimoloSemantico,
      risposta: GoNogoSemanticoRisposta | null,
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

  // ── Override accuratezza clinica (pattern SART via b) ───────────────────

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

  // ── Header categoria (sopra TrialFlow) ─────────────────────────────────
  // TrialFlow non ha slot header, quindi lo rendiamo dentro renderStimolo
  // come parte fissa — ogni stimolo mostra l'etichetta sopra la parola.
  // Alternativa pulita: wrapper div fuori da TrialFlow con position sticky.

  const renderStimoloConHeader = useCallback(
    (props: { stimolo: StimoloSemantico; onRisposta: (r: GoNogoSemanticoRisposta) => void }) => (
      <div className="flex flex-col items-center w-full gap-0">
        {/* Etichetta categoria fissa in cima */}
        <div className="w-full flex justify-center py-3 bg-blue-50 border-b border-blue-100">
          <span className="text-base font-semibold text-blue-700">
            Tocca solo: <strong>{coppia.etichetta}</strong>
          </span>
        </div>
        <GoNogoSemanticoStimulus {...props} disabilitato={false} etichetta={coppia.etichetta} />
      </div>
    ),
    [coppia.etichetta],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <TrialFlow<StimoloSemantico, GoNogoSemanticoRisposta>
      tLimMs={config.tLimMs}
      trialValutativi={null}
      microProgressione={microProgressione}
      generaStimolo={generaStimolo}
      renderStimolo={renderStimoloConHeader}
      valutaRisposta={valutaRisposta}
      tutorial={tutorial}
      aggiornaMetriche={aggiornaMetriche}
      feedbackType="standard"
      isiMs={ISI_MS}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onCompleteWrapped}
      onProgress={onProgress}
    />
  );
}

// Esportata per il registry.
export { TIMER_MS as GO_NOGO_SEMANTICO_TIMER_MS };
