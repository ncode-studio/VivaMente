"use client";

/**
 * "Il Pescatore" — Attenzione divisa · Dual task.
 *
 * Tutorial → (warning cambio meccanica) → sessione 60s.
 */

import { useState, type ReactNode } from "react";
import type { GameEngineProps, SessionResult } from "@/lib/exercise-types";
import { getPescLevel, getPescMechanicWarning } from "./levels";
import { PescatoreSession } from "./PescatoreSession";
import { PesceSprite } from "./sprites";

type Fase = "tutorial" | "warning" | "sessione";

export function PescatoreTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config  = getPescLevel(livello);
  const warning = getPescMechanicWarning(livelloPrec, livello);

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
        padding: "1.5rem 1.25rem", gap: "1.1rem",
      }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 700, color: "#0EA5E9",
          letterSpacing: "0.08em", margin: 0,
        }}>
          COME SI GIOCA
        </p>

        <h2 style={{
          fontSize: "1.25rem", fontWeight: 900, color: "#1D3A5A",
          textAlign: "center", margin: 0,
        }}>
          Il Pescatore
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" }}>
          <RigaIstruzione
            etichetta="LAGO"
            etichettaColor="#3F5E55"
            bg="linear-gradient(135deg,#B3D4D8,#5C8E9B)"
            sprite={<PesceSprite specie="trota" dir={1} size={42} />}
            testo="A sinistra c'è il lago. In alto vedi quale pesce devi pescare: tocca solo quello."
          />
          <RigaIstruzione
            etichetta="MARE"
            etichettaColor="#1D3A5A"
            bg="linear-gradient(135deg,#3F6A87,#0E2C4A)"
            sprite={<PesceSprite specie="tonno" dir={-1} size={42} />}
            testo="A destra c'è il mare. Attento: il pesce da pescare cambia durante la partita!"
          />
          <RigaIstruzione
            etichetta="NO"
            etichettaColor="#B91C1C"
            bg="linear-gradient(135deg,#FCA5A5,#DC2626)"
            testo="Non toccare i pesci della specie sbagliata e non lasciar scappare quelli giusti."
          />
        </div>

        <button
          onClick={() => setFase(warning ? "warning" : "sessione")}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#0EA5E9", color: "#FFFFFF",
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
        <span style={{ fontSize: "2.5rem" }}>🌊</span>

        <h2 style={{
          fontSize: "1.2rem", fontWeight: 900, color: "#0C4A6E",
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
            backgroundColor: "#0EA5E9", color: "#FFFFFF",
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
    <PescatoreSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}

// ── Riga istruzione tutorial ───────────────────────────────────────────────────

function RigaIstruzione({
  etichetta, etichettaColor, bg, sprite, testo,
}: {
  etichetta:      string;
  etichettaColor: string;
  bg:             string;
  /** Sprite opzionale (es. <PesceSprite />) sovrapposto al cerchio. */
  sprite?:        ReactNode;
  testo:          string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.85rem",
      padding: "0.6rem 0.85rem", borderRadius: "0.85rem",
      backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB",
    }}>
      <div style={{
        position: "relative",
        width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${etichettaColor}`,
        boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.2)",
        overflow: "hidden",
      }}>
        {sprite ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))",
          }}>
            {sprite}
          </div>
        ) : (
          <span style={{
            fontSize: "0.78rem", fontWeight: 900, color: "#FFFFFF",
            letterSpacing: "0.05em",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}>
            {etichetta}
          </span>
        )}
      </div>
      <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.4, margin: 0 }}>
        {testo}
      </p>
    </div>
  );
}
