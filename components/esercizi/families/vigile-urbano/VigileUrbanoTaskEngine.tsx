"use client";

/**
 * "Il Vigile Urbano" — Attenzione spaziale · Multi-focus.
 *
 * Tutorial → (warning cambio meccanica) → sessione 60s.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult } from "@/lib/exercise-types";
import { getVuLevel, getVuMechanicWarning } from "./levels";
import { VigileUrbanoSession } from "./VigileUrbanoSession";

type Fase = "tutorial" | "warning" | "sessione";

export function VigileUrbanoTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config  = getVuLevel(livello);
  const warning = getVuMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  // ── Tutorial ────────────────────────────────────────────────────────────────

  if (fase === "tutorial") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.05rem",
      }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 700, color: "#D97706",
          letterSpacing: "0.08em", margin: 0,
        }}>
          COME SI GIOCA
        </p>

        <h2 style={{
          fontSize: "1.25rem", fontWeight: 900, color: "#7C2D12",
          textAlign: "center", margin: 0,
        }}>
          Il Vigile Urbano 🚦
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" }}>
          <RigaIstruzione
            badge="🚦"
            badgeColor="#1F2937"
            bg="#111827"
            testo="Tutti i semafori partono ROSSI. Tocca un semaforo per farlo diventare VERDE; tocca di nuovo per tornare al rosso."
          />
          <RigaIstruzione
            badge="🚗"
            badgeColor="#15803D"
            bg="#22C55E"
            testo="In alto c'è il cartello del vigile: mostra quale tipo di veicolo è autorizzato. Quello deve passare con il verde."
          />
          <RigaIstruzione
            badge="✋"
            badgeColor="#B91C1C"
            bg="#EF4444"
            testo="Gli altri tipi di veicolo devono trovare il rosso. Attento: nei livelli più alti il vigile cambia la categoria!"
          />
        </div>

        <button
          onClick={() => setFase(warning ? "warning" : "sessione")}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#D97706", color: "#FFFFFF",
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
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.25rem",
      }}>
        <span style={{ fontSize: "2.5rem" }}>🚦</span>

        <h2 style={{
          fontSize: "1.2rem", fontWeight: 900, color: "#7C2D12",
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
            backgroundColor: "#D97706", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          Capito — Vai!
        </button>
      </div>
    );
  }

  // ── Sessione ────────────────────────────────────────────────────────────────

  return (
    <VigileUrbanoSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}

// ── Riga istruzione tutorial ───────────────────────────────────────────────────

function RigaIstruzione({
  badge, badgeColor, bg, testo,
}: { badge: string; badgeColor: string; bg: string; testo: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.85rem",
      padding: "0.6rem 0.85rem", borderRadius: "0.85rem",
      backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: bg, color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem", fontWeight: 900,
        border: `2px solid ${badgeColor}`,
      }}>
        {badge}
      </div>
      <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.4, margin: 0 }}>
        {testo}
      </p>
    </div>
  );
}
