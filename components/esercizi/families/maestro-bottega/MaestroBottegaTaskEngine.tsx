"use client";

/**
 * "Il Maestro di Bottega" — Linguaggio · Denominazione su definizione.
 *
 * Tutorial → (warning cambio meccanica al lv 4) → sessione 60s.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getMaestroLevel, getMaestroMechanicWarning, type ModalitaMaestro } from "./levels";
import { MaestroBottegaSession } from "./MaestroBottegaSession";

type Fase = "tutorial" | "warning" | "sessione";

const ACCENT = CATEGORIA_COLORS.linguaggio.text; // Maestro di Bottega = dominio Linguaggio

// Palette del cartello (bottega artigiana) per l'anteprima.
const PANEL      = "#F5E8CC";
const PANEL_EDGE = "#C9A77A";
const INK        = "#3A2412";
const INK_SOFT   = "#7A4E2A";
const TERRA      = "#B66A3F";
const SERIF      = "Georgia, 'Times New Roman', serif";
const SANS       = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Anteprima: il cartello del maestro con una definizione e la parola giusta.
function CartelloDemo() {
  return (
    <div style={{
      width: "100%",
      background: PANEL,
      border: `1.5px solid ${PANEL_EDGE}`,
      borderRadius: "0.4rem",
      padding: "0.9rem 0.95rem 1rem 0.95rem",
      boxShadow: "0 2px 5px rgba(58,36,18,0.18)",
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(139,90,43,0.05) 0 2px, transparent 2px 9px)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px dashed ${PANEL_EDGE}`,
        paddingBottom: "0.4rem",
        marginBottom: "0.6rem",
        fontFamily: SANS,
        fontSize: "0.6rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: INK_SOFT,
        fontWeight: 700,
      }}>
        Il Maestro dice
      </div>
      <p style={{
        margin: 0, textAlign: "center",
        fontSize: "1.05rem", color: INK,
        fontFamily: SERIF, fontStyle: "italic", lineHeight: 1.5,
      }}>
        «Attrezzo con manico e testa di ferro che si usa per piantare i chiodi.»
      </p>
      <p style={{
        margin: "0.6rem 0 0 0", textAlign: "center",
        fontSize: "0.95rem", color: TERRA, fontWeight: 700,
        fontFamily: SERIF, letterSpacing: "0.04em",
      }}>
        → martello
      </p>
    </div>
  );
}

// Il tutorial cambia la riga "azione" in base alla modalità del livello:
//   - "scelta"  (lv 1-3): si tocca una delle quattro parole
//   - "libera"  (lv 4-10): si scrive la parola e si tocca «Invia»
function buildTutorial(modalita: ModalitaMaestro): TutorialConfig {
  const rigaAzione =
    modalita === "scelta"
      ? { icona: "👆", testo: "Tocca la parola giusta tra i quattro cartellini. Non c'è fretta." }
      : { icona: "✍️", testo: "Scrivi tu la parola e tocca «Invia». Accenti e maiuscole non contano." };

  return {
    accent: ACCENT,
    ctaLabel: "Entra in bottega",
    pagine: [{
      titolo: "Il Maestro di Bottega",
      demo: <CartelloDemo />,
      righe: [
        { icona: "📜", testo: "Il vecchio maestro descrive un oggetto o un'idea. Leggi con calma." },
        { icona: "💡", testo: "Pensa a quale parola corrisponde alla sua descrizione." },
        rigaAzione,
      ],
    }],
  };
}

export function MaestroBottegaTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config  = getMaestroLevel(livello);
  const warning = getMaestroMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  // ── Tutorial ──────────────────────────────────────────────────────────────

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={buildTutorial(config.modalita)}
        onComplete={() => setFase(warning ? "warning" : "sessione")}
      />
    );
  }

  // ── Warning cambio meccanica ──────────────────────────────────────────────

  if (fase === "warning" && warning) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "stretch",
        padding: "1.75rem 1.25rem", gap: "1.1rem",
        backgroundColor: "#E8D5B0", borderRadius: "0.6rem",
        fontFamily: SANS,
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            margin: 0, fontSize: "0.62rem", fontWeight: 700,
            color: INK_SOFT, letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            Avviso
          </p>
          <h2 style={{
            margin: "0.2rem 0 0 0", fontSize: "1.45rem",
            fontWeight: 500, color: INK, fontFamily: SERIF,
          }}>
            {warning.titolo}
          </h2>
        </div>

        <p style={{
          fontSize: "1.05rem", color: INK, textAlign: "center",
          lineHeight: 1.55, margin: 0, fontFamily: SERIF,
        }}>
          {warning.testo}
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", padding: "0.9rem",
            borderRadius: "0.4rem", border: "none",
            backgroundColor: "#8B5A2B", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 600, cursor: "pointer",
            fontFamily: SANS,
          }}
        >
          Continua
        </button>
      </div>
    );
  }

  // ── Sessione ──────────────────────────────────────────────────────────────

  return (
    <MaestroBottegaSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
