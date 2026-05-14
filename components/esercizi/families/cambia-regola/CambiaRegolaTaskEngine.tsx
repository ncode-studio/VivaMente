"use client";

/**
 * "Cambia Regola" — Flessibilità attentiva · Task switching cued.
 *
 * Tutorial → (warning cambio meccanica) → sessione 60s.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult } from "@/lib/exercise-types";
import { getCambiaRegolaLevel, getCambiaRegolaMechanicWarning } from "./levels";
import { CambiaRegolaSession } from "./CambiaRegolaSession";
import { CartaSvg } from "./cards";

type Fase = "tutorial" | "warning" | "sessione";

export function CambiaRegolaTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config  = getCambiaRegolaLevel(livello);
  const warning = getCambiaRegolaMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  if (fase === "tutorial") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1rem",
      }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 700, color: "#B45309",
          letterSpacing: "0.08em", margin: 0,
        }}>
          COME SI GIOCA
        </p>

        <h2 style={{
          fontSize: "1.3rem", fontWeight: 900, color: "#7C2D12",
          textAlign: "center", margin: 0,
        }}>
          Cambia Regola
        </h2>

        <p style={{
          fontSize: "0.9rem", color: "#374151", textAlign: "center",
          lineHeight: 1.45, margin: 0,
        }}>
          Ordina la carta centrale nella categoria giusta seguendo la regola
          mostrata in alto. La regola cambia ogni tanto: leggila sempre prima
          di rispondere.
        </p>

        {/* Esempio visivo: regola "per COLORE" */}
        <div style={{
          width: "100%",
          padding: "0.85rem",
          borderRadius: "0.9rem",
          background: "linear-gradient(180deg,#FFFBEB 0%,#FEF3C7 100%)",
          border: "1.5px solid #FDE68A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.7rem",
        }}>
          <div style={{
            padding: "0.3rem 0.7rem",
            borderRadius: "999px",
            backgroundColor: "#B45309",
            color: "#FFFFFF",
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}>
            REGOLA: PER COLORE
          </div>

          <div style={{
            padding: "0.45rem 0.6rem",
            borderRadius: "0.55rem",
            background: "#FFFFFF",
            border: "2px solid #1F2937",
          }}>
            <CartaSvg forma="quadrato" colore="rosso" numero={2} size={120} />
          </div>

          <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
            <div style={{
              padding: "0.4rem", borderRadius: "0.55rem",
              border: "2px solid #16A34A", background: "#FFFFFF",
            }}>
              <CartaSvg forma="cerchio" colore="rosso" numero={3} size={75} />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803D" }}>
              ←&nbsp;questa<br/>(stesso colore)
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8" }}>
              non<br/>questa →
            </span>
            <div style={{
              padding: "0.4rem", borderRadius: "0.55rem",
              border: "2px solid #94A3B8", background: "#FFFFFF",
            }}>
              <CartaSvg forma="triangolo" colore="blu" numero={1} size={75} />
            </div>
          </div>
        </div>

        <button
          onClick={() => setFase(warning ? "warning" : "sessione")}
          style={{
            width: "100%", padding: "0.9rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#B45309", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
            marginTop: "0.25rem",
          }}
        >
          Ho capito — Inizia!
        </button>
      </div>
    );
  }

  if (fase === "warning" && warning) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.25rem",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          backgroundColor: "#FEF3C7",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #B45309",
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#B45309" }}>!</span>
        </div>

        <h2 style={{
          fontSize: "1.2rem", fontWeight: 900, color: "#7C2D12",
          textAlign: "center", margin: 0,
        }}>
          {warning.titolo}
        </h2>

        <p style={{
          fontSize: "0.95rem", color: "#374151", textAlign: "center",
          lineHeight: 1.5, margin: 0,
        }}>
          {warning.testo}
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", padding: "0.9rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#B45309", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          Capito — Vai!
        </button>
      </div>
    );
  }

  return (
    <CambiaRegolaSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
