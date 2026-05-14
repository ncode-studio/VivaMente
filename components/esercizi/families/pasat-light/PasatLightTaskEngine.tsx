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
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getPLLevel, getPLMechanicWarning } from "./levels";
import { PasatSession, type PasatSessionMetriche } from "./PasatSession";

type Phase = "tutorial" | "warning" | "session";

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

  const tutorial: TutorialConfig = useMemo(() => ({
    pagine: [{
      titolo: "PASAT",
      testo:
        "Vedrai dei numeri apparire uno alla volta. " +
        "Memorizza il primo numero (in azzurro): sarà il tuo risultato iniziale. " +
        "Per ogni cifra successiva (es. +3, −2, ×4, ÷2) applica l'operazione " +
        "tra il risultato che hai in mente e la nuova cifra, " +
        "poi digita il nuovo risultato sul tastierino e premi ✓. " +
        "Esempio: 4 … +3 → 7 … −2 → 5 … ×3 → 15. " +
        "Se sbagli o non rispondi in tempo, la somma riparte con un nuovo numero da memorizzare. " +
        "Continua più a lungo possibile entro il tempo della sessione.",
    }],
  }), []);

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
        config={tutorial}
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
