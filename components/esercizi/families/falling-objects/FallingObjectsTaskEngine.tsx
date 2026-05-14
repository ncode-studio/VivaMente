"use client";

import { useState } from "react";
import type { GameEngineProps, SessionResult } from "@/lib/exercise-types";
import { getFallLevel, getFallMechanicWarning } from "./levels";
import { FallingObjectsSession } from "./FallingObjectsSession";

type Fase = "tutorial" | "warning" | "sessione";

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.25rem" }}>

        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6366F1",
          letterSpacing: "0.08em", margin: 0 }}>
          COME SI GIOCA
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1E3A5F",
          textAlign: "center", margin: 0 }}>
          Stimoli Cadenti
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
          <RigaIstruzione
            emoji="⭐"
            bg="linear-gradient(135deg,#22C55E,#15803D)"
            testo="Le stelle cadono dall'alto. Toccale subito — sono le uniche che devi toccare!"
          />
          {config.nogoRate > 0 && (
            <RigaIstruzione
              emoji="🍎"
              bg="linear-gradient(135deg,#8B5CF6,#6D28D9)"
              testo="Cadono anche altre cose colorate. Non toccarle — lascia che cadano."
            />
          )}
          <RigaIstruzione
            emoji="💣"
            bg="linear-gradient(135deg,#1F2937,#111827)"
            testo="La bomba è una trappola! Se la tocchi, la partita finisce subito."
          />
        </div>

        <button
          onClick={() => setFase(warning ? "warning" : "sessione")}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#3B82F6", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          Ho capito — Inizia!
        </button>
      </div>
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

// ── Componente riga istruzione tutorial ────────────────────────────────────────

function RigaIstruzione({
  emoji, bg, testo,
}: { emoji: string; bg: string; testo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem",
      padding: "0.6rem 0.85rem", borderRadius: "0.85rem",
      backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.4rem",
      }}>
        {emoji}
      </div>
      <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.4, margin: 0 }}>
        {testo}
      </p>
    </div>
  );
}
