"use client";

/**
 * "Il Postino" — Linguaggio · Completamento proverbi e modi di dire.
 *
 * Tutorial → (warning cambio meccanica) → sessione 60s.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getPostinoLevel, getPostinoMechanicWarning } from "./levels";
import { IlPostinoSession } from "./IlPostinoSession";

type Fase = "tutorial" | "warning" | "sessione";

// Palette coerente con la sessione (cartolina vintage).
const BG       = "#F2E4C9";
const CARD     = "#FBF5E5";
const CARD_EDGE= "#E0CFA5";
const INK      = "#3D2914";
const INK_SOFT = "#7A5A38";
const ACCENT   = "#7A5A38";
const STAMP    = "#B23A2E";
const SERIF    = "Georgia, 'Times New Roman', serif";
const SANS     = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Accento del tutorial per dominio Linguaggio (struttura Osservatorio Stellare).
const TUTORIAL_ACCENT = CATEGORIA_COLORS.linguaggio.text;

// Anteprima: una cartolina d'esempio con la parola mancante.
function CartolinaDemo() {
  return (
    <div style={{
      width: "100%",
      background: CARD,
      border: `1.5px solid ${CARD_EDGE}`,
      borderRadius: "0.4rem",
      padding: "0.9rem 0.9rem 1rem 0.9rem",
      boxShadow: "0 2px 6px rgba(61,41,20,0.12)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px dashed ${CARD_EDGE}`,
        paddingBottom: "0.4rem", marginBottom: "0.55rem",
        fontSize: "0.6rem", fontWeight: 700, color: INK_SOFT,
        letterSpacing: "0.18em", textTransform: "uppercase",
        fontFamily: SANS,
      }}>
        <span>✉ Cartolina</span>
        <span style={{
          display: "inline-flex", alignItems: "center",
          justifyContent: "center", width: 30, height: 22,
          border: `1.5px solid ${STAMP}`, color: STAMP,
          borderRadius: 2, fontSize: "0.6rem", fontWeight: 800,
        }}>
          ITALIA
        </span>
      </div>
      <div style={{
        fontSize: "3rem", textAlign: "center",
        margin: "0.1rem 0 0.4rem 0",
      }}>
        🎣
      </div>
      <p style={{
        margin: 0, textAlign: "center",
        fontSize: "1.2rem", color: INK,
        fontFamily: SERIF, lineHeight: 1.5,
      }}>
        Chi dorme non piglia{" "}
        <span style={{
          display: "inline-block", minWidth: "4.5rem",
          borderBottom: `2px solid ${INK_SOFT}`,
          height: "1.05em", verticalAlign: "baseline",
          margin: "0 0.2rem",
        }} />
      </p>
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: TUTORIAL_ACCENT,
  ctaLabel: "Comincia",
  pagine: [{
    titolo: "Il Postino",
    demo: <CartolinaDemo />,
    righe: [
      { icona: "✉️", testo: "Arriva una cartolina con un proverbio a cui manca una parola." },
      { icona: "👀", testo: "Leggi con calma la frase e trova la parola che completa il detto." },
      { icona: "👆", testo: "Tocca la parola giusta tra i bottoni. Hai 60 secondi in tutto." },
    ],
  }],
};

export function IlPostinoTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config  = getPostinoLevel(livello);
  const warning = getPostinoMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase(warning ? "warning" : "sessione")}
      />
    );
  }

  if (fase === "warning" && warning) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "stretch",
        padding: "1.75rem 1.25rem", gap: "1.1rem",
        backgroundColor: BG, borderRadius: "0.6rem",
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
            backgroundColor: ACCENT, color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 600, cursor: "pointer",
            fontFamily: SANS,
          }}
        >
          Continua
        </button>
      </div>
    );
  }

  return (
    <IlPostinoSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
