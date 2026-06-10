"use client";

/**
 * OsservatorioStellareTaskEngine — engine "L'Osservatorio Stellare".
 *
 * Modello A timer 75s, flusso continuo (target rari).
 * Wrappa: tutorial (prima sessione) → warning cambio meccanica → sessione.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import {
  getOsservatorioLevel,
  getOsservatorioMechanicWarning,
} from "./levels";
import { OsservatorioStellareSession } from "./OsservatorioStellareSession";

type Fase = "tutorial" | "warning" | "sessione";

const ACCENT = CATEGORIA_COLORS.attenzione.text; // Osservatorio = dominio Attenzione

// Anteprima: mini cielo notturno con la stella speciale evidenziata.
function CieloDemo() {
  return (
    <div style={{
      position: "relative", width: "100%", height: 130, borderRadius: "0.75rem",
      background: "radial-gradient(ellipse at 50% 35%, #1B2755 0%, #0E1535 60%, #050818 100%)",
      overflow: "hidden",
    }}>
      {[
        { x: 18, y: 30, s: 6 }, { x: 38, y: 60, s: 5 },
        { x: 62, y: 25, s: 7 }, { x: 80, y: 55, s: 6 },
        { x: 25, y: 80, s: 5 }, { x: 72, y: 80, s: 6 },
      ].map((p, i) => (
        <span key={i} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.s, height: p.s, borderRadius: "50%",
          background: "#E8EEFF", boxShadow: "0 0 6px rgba(220,230,255,0.7)",
          transform: "translate(-50%,-50%)",
        }} />
      ))}
      <span style={{
        position: "absolute", left: "50%", top: "50%",
        width: 14, height: 14, borderRadius: "50%",
        background: "radial-gradient(circle, #FFE5A0 0%, #FFC75A 50%, transparent 80%)",
        boxShadow: "0 0 22px rgba(255,210,140,0.9)", transform: "translate(-50%,-50%)",
      }} />
      <p style={{
        position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", margin: 0,
        color: "#FCD34D", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em",
      }}>
        ← questa è la stella speciale
      </p>
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia l'osservazione",
  pagine: [{
    titolo: "L'Osservatorio Stellare",
    demo: <CieloDemo />,
    righe: [
      { icona: "✨", testo: "Le stelle brillano lentamente nel cielo. È normale, lasciale brillare." },
      { icona: "⭐", testo: "Ogni tanto UNA stella pulsa diversamente — più vivace e dorata." },
      { icona: "👆", testo: "Toccala prima che torni normale. Non c'è fretta, prendi il tuo tempo." },
    ],
  }],
};

export function OsservatorioStellareTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {

  const config  = getOsservatorioLevel(livello);
  const warning = getOsservatorioMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  // ── Tutorial ──────────────────────────────────────────────────────────────

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase(warning ? "warning" : "sessione")}
      />
    );
  }

  // ── Warning cambio meccanica ──────────────────────────────────────────────

  if (fase === "warning" && warning) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.25rem",
      }}>
        <span style={{ fontSize: "2.5rem" }}>🌌</span>
        <h2 style={{
          fontSize: "1.2rem", fontWeight: 900, color: "#1E3A5F",
          textAlign: "center", margin: 0,
        }}>
          {warning.titolo}
        </h2>
        <p style={{
          fontSize: "0.9rem", color: "#374151", textAlign: "center",
          lineHeight: 1.5, margin: 0,
        }}>
          {warning.testo}
        </p>
        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#6366F1", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          Sono pronto
        </button>
      </div>
    );
  }

  // ── Sessione ──────────────────────────────────────────────────────────────

  return (
    <OsservatorioStellareSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
