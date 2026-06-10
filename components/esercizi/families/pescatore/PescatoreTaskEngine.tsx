"use client";

/**
 * "Il Pescatore" — Attenzione divisa · Dual task.
 *
 * Tutorial → (warning cambio meccanica) → sessione 60s.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getPescLevel, getPescMechanicWarning } from "./levels";
import { PescatoreSession } from "./PescatoreSession";

type Fase = "tutorial" | "warning" | "sessione";

const ACCENT = CATEGORIA_COLORS.attenzione.text; // Il Pescatore = dominio Attenzione

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia a pescare",
  pagine: [{
    titolo: "Il Pescatore",
    righe: [
      { icona: "🎣", testo: "Due specchi d'acqua: il lago a sinistra e il mare a destra. In alto, l'insegna dice quale pesce raccogliere in ciascuno." },
      { icona: "🐟", testo: "Tocca solo i pesci giusti. Attenzione: il pesce da pescare nel mare cambia durante la partita." },
      { icona: "🚫", testo: "Non toccare le specie sbagliate e non lasciar scappare quelle giuste. Un pesce alla volta, con calma." },
    ],
  }],
};

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
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase(warning ? "warning" : "sessione")}
      />
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
