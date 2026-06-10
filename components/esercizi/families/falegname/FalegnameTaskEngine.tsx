"use client";

/**
 * "Il Falegname" — rotazione mentale (Visuospaziale).
 *
 * Modello A: timer di sessione 60s. T.Lim per trial decresce col livello
 * (10s → 5s). Micro-progressione intra-livello: dopo 3 trial valutativi
 * corretti consecutivi parte un trial bonus con T.Lim ridotto.
 *
 * Metriche salvate (JSON in sessioni.metriche):
 *   falegname_total              numero trial valutativi totali
 *   falegname_correct            risposte corrette
 *   falegname_specchio_total     trial con distrattore specchiato (L7+)
 *   falegname_specchio_correct   risposte corrette in quei trial
 *   falegname_tempo_totale_ms    somma tempi risposta
 *   falegname_risposte_tempo     conteggio risposte effettive
 */

import { useCallback, useMemo, useRef } from "react";
import type {
  GameEngineProps,
  TutorialConfig,
  MicroProgressioneConfig,
} from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TrialFlow } from "@/components/esercizi/shared/TrialFlow";
import { getFalegnameLevel, FLOOR_TLIM_FALEGNAME } from "./levels";
import {
  creaPoolRef,
  generaFalegname,
  type FalegnamePoolRef,
  type StimoloFalegname,
  type RispostaFalegname,
} from "./sequence";
import { FalegnameSession } from "./FalegnameSession";
import { PezzoLegno } from "./shapes";

const ACCENT = CATEGORIA_COLORS.visuospaziali.text; // Il Falegname = dominio Visuospaziale

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Entra in bottega",
  pagine: [{
    titolo: "Il Falegname",
    demo: <TutorialDemo />,
    righe: [
      { icona: "🪵", testo: "Sul banco da lavoro appare un pezzo di legno sagomato." },
      { icona: "🔄", testo: "Fra le 4 opzioni, lo stesso pezzo è solo ruotato o capovolto." },
      { icona: "👆", testo: "Tocca quello identico. Con calma, prendi il tuo tempo." },
    ],
  }],
};

export function FalegnameTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const level = useMemo(() => getFalegnameLevel(livello), [livello]);

  const rng     = useRef(Math.random);
  const poolRef = useRef<FalegnamePoolRef>(creaPoolRef(rng.current));

  const microProgressione = useMemo((): MicroProgressioneConfig => ({
    valoreBase: level.tLimMs,
    delta:      -500,
    maxDelta:   2,
    limite:     FLOOR_TLIM_FALEGNAME,
  }), [level.tLimMs]);

  const generaStimolo = useCallback(
    (ctx: { valoreCorrente: number }): StimoloFalegname => {
      const tLimMs = Math.max(FLOOR_TLIM_FALEGNAME, ctx.valoreCorrente);
      return generaFalegname({ ...level, tLimMs }, poolRef.current, rng.current);
    },
    [level],
  );

  const valutaRisposta = useCallback(
    (stimolo: StimoloFalegname, risposta: RispostaFalegname | null): boolean => {
      if (!risposta || !risposta.sceltaKey) return false;
      const opt = stimolo.opzioni.find((o) => o.key === risposta.sceltaKey);
      return !!opt?.isTarget;
    },
    [],
  );

  const aggiornaMetriche = useCallback(
    (
      prev:     Record<string, number>,
      stimolo:  StimoloFalegname,
      risposta: RispostaFalegname | null,
      corretto: boolean,
    ): Record<string, number> => {
      const next: Record<string, number> = { ...prev };
      next.falegname_total   = (prev.falegname_total   ?? 0) + 1;
      next.falegname_correct = (prev.falegname_correct ?? 0) + (corretto ? 1 : 0);

      const hasSpecchio = stimolo.opzioni.some((o) => o.shapeId === stimolo.target && o.specchio);
      if (hasSpecchio) {
        next.falegname_specchio_total   = (prev.falegname_specchio_total   ?? 0) + 1;
        next.falegname_specchio_correct = (prev.falegname_specchio_correct ?? 0) + (corretto ? 1 : 0);
      }

      // Trial con near-miss (varianti): traccia quanti utenti scelgono per errore una variante.
      const hasVariante = stimolo.opzioni.some((o) => o.kind !== "base");
      if (hasVariante) {
        next.falegname_variante_total = (prev.falegname_variante_total ?? 0) + 1;
        if (risposta?.sceltaKey) {
          const opt = stimolo.opzioni.find((o) => o.key === risposta.sceltaKey);
          if (opt && opt.kind !== "base") {
            next.falegname_errore_variante = (prev.falegname_errore_variante ?? 0) + 1;
          }
        }
      }

      if (risposta && risposta.sceltaKey) {
        next.falegname_tempo_totale_ms = (prev.falegname_tempo_totale_ms ?? 0) + risposta.tempoMs;
        next.falegname_risposte_tempo  = (prev.falegname_risposte_tempo  ?? 0) + 1;
      }
      return next;
    },
    [],
  );

  const renderStimolo = useCallback(
    (props: { stimolo: StimoloFalegname; onRisposta: (r: RispostaFalegname) => void }) => (
      <FalegnameSession
        stimolo={props.stimolo}
        onRisposta={props.onRisposta}
      />
    ),
    [],
  );

  const tutorial: TutorialConfig | null = mostraTutorial ? TUTORIAL : null;

  return (
    <TrialFlow<StimoloFalegname, RispostaFalegname>
      tLimMs={level.tLimMs}
      trialValutativi={null}
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
      onComplete={onComplete}
      onProgress={onProgress}
    />
  );
}

function TutorialDemo() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "1.2rem",
      padding: "0.5rem 0",
    }}>
      <div style={{ textAlign: "center" }}>
        <PezzoLegno shapeId="chiave_inglese" rotZ={0} size={90} />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", color: "#C28A4D", fontStyle: "italic" }}>
          sul banco
        </p>
      </div>
      <span style={{ fontSize: "1.8rem", color: "#C28A4D", fontWeight: 700 }}>=</span>
      <div style={{ textAlign: "center" }}>
        <PezzoLegno shapeId="chiave_inglese" rotZ={140} size={90} />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", color: "#C28A4D", fontStyle: "italic" }}>
          stessa, ruotata
        </p>
      </div>
    </div>
  );
}
