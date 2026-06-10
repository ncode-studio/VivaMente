"use client";

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getFallLevel, getFallMechanicWarning } from "./levels";
import { FallingObjectsSession } from "./FallingObjectsSession";

type Fase = "tutorial" | "warning" | "sessione";

const ACCENT = CATEGORIA_COLORS.attenzione.text; // Stimoli Cadenti = dominio Attenzione

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia",
  pagine: [{
    titolo: "Stimoli Cadenti",
    righe: [
      { icona: "⭐", testo: "Le stelle cadono dall'alto: sono le uniche che devi toccare." },
      { icona: "🍎", testo: "Cadono anche altre cose colorate. Lasciale cadere, non toccarle." },
      { icona: "💣", testo: "La bomba è una trappola: se la tocchi, la partita finisce subito." },
    ],
  }],
};

export function FallingObjectsTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config  = getFallLevel(livello);
  const warning = getFallMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  // ── Tutorial ────────────────────────────────────────────────────────────────

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase(warning ? "warning" : "sessione")}
      />
    );
  }

  // ── Warning cambio meccanica ────────────────────────────────────────────────

  if (fase === "warning" && warning) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.25rem" }}>

        <span style={{ fontSize: "2.5rem" }}>⚠️</span>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#92400E",
          textAlign: "center", margin: 0 }}>
          {warning.titolo}
        </h2>

        <p style={{ fontSize: "0.9rem", color: "#374151", textAlign: "center",
          lineHeight: 1.5, margin: 0 }}>
          {warning.testo}
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#F59E0B", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          Capito — Vai!
        </button>
      </div>
    );
  }

  // ── Sessione ─────────────────────────────────────────────────────────────────

  return (
    <FallingObjectsSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
