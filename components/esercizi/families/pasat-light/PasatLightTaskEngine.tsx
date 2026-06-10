"use client";

/**
 * PasatLightTaskEngine — engine per Pasat Light (pasat_light_visivo).
 *
 * Modello A (timer 60s). Modalità continua: una sola catena per tutta la sessione,
 * la somma corrente si resetta solo quando l'utente sbaglia o non risponde in tempo.
 * Nessuna micro-progressione intra-livello.
 *
 * L'engine bypassa TrialFlow (che è trial-based) e gestisce direttamente:
 *   - Tutorial (TutorialOverlay condiviso)
 *   - Warning di cambio meccanica (inline)
 *   - Rendering della PasatSession continua
 *   - Aggregazione metriche e calcolo accuratezza al termine
 *
 * Riferimento: docs/gdd/families/pasat-light.md
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameEngineProps, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getPLLevel, getPLMechanicWarning } from "./levels";
import { PasatSession, type PasatSessionMetriche } from "./PasatSession";

type Phase = "tutorial" | "warning" | "session";

const ACCENT = CATEGORIA_COLORS.esecutive.text; // Pasat Light = dominio Esecutive

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia il calcolo",
  pagine: [{
    titolo: "Calcolo a Catena",
    righe: [
      { icona: "🔵", testo: "Appare un numero in azzurro: tienilo a mente, è il tuo punto di partenza." },
      { icona: "➕", testo: "Poi appare un'operazione, ad esempio +3 o −2: applicala al numero che hai in mente." },
      { icona: "✓", testo: "Scrivi il nuovo risultato sul tastierino e premi ✓. Continua con calma, un passo alla volta." },
    ],
  }],
};

// ── Engine ─────────────────────────────────────────────────────────────────────

export function PasatLightTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const level   = useMemo(() => getPLLevel(livello), [livello]);
  const warning = useMemo(() => getPLMechanicWarning(livelloPrec, livello), [livelloPrec, livello]);

  const [phase, setPhase] = useState<Phase>(
    mostraTutorial ? "tutorial" : warning ? "warning" : "session",
  );

  // ── Avanzamento fasi e onReady ─────────────────────────────────────────────
  const passaAFase = useCallback((next: Phase) => setPhase(next), []);

  useEffect(() => {
    if (phase === "session") onReady();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Fine sessione: calcola accuratezza e chiama onComplete ─────────────────
  const handleFine = useCallback((m: PasatSessionMetriche) => {
    const acc = m.totali > 0 ? m.corretti / m.totali : 0;
    onComplete({
      accuratezzaValutativa: acc,
      scoreGrezzo:           Math.round(acc * 100),
      metriche: {
        passi_corretti: m.corretti,
        passi_totali:   m.totali,
        chain_max:      m.chainMax,
      },
    });
  }, [onComplete]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => passaAFase(warning ? "warning" : "session")}
      />
    );
  }

  if (phase === "warning" && warning) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-6 gap-4">
        <p className="text-lg font-bold text-center">{warning.titolo}</p>
        <p className="text-base leading-relaxed text-center max-w-xs text-gray-600">{warning.testo}</p>
        <button
          onClick={() => passaAFase("session")}
          className="mt-4 w-full max-w-xs rounded-2xl bg-blue-600 py-4 text-white font-semibold text-base"
        >
          Ho capito
        </button>
      </div>
    );
  }

  return (
    <PasatSession
      level={level}
      tempoScaduto={tempoScaduto}
      onFine={handleFine}
    />
  );
}
