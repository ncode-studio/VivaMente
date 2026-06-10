"use client";

/**
 * "Il Correttore di Bozze" — Linguaggio · Rilevamento errori lessicali/sintattici.
 *
 * Tutorial → sessione di 6 bozze (Modello B, nessun timer di sessione).
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getCorrettoreLevel } from "./levels";
import { CorrettoreBozzeSession } from "./CorrettoreBozzeSession";

type Fase = "tutorial" | "sessione";

const ACCENT = CATEGORIA_COLORS.linguaggio.text; // Correttore = dominio Linguaggio

const PAPER     = "#F0E4C8";
const INK       = "#1F1A12";
const INK_FADED = "#5A4C32";
const RULE      = "#7A6240";
const STAMP_RED = "#8B2A1C";

const SERIF_BODY = "'Libre Caslon Text', 'Times New Roman', Georgia, serif";
const SANS_LABEL = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Anteprima: una bozza d'esempio con la parola sbagliata barrata e la correzione.
function BozzaDemo() {
  return (
    <div style={{
      width: "100%",
      background: PAPER,
      border: `1px solid ${RULE}`,
      borderRadius: "0.4rem",
      padding: "0.85rem 0.9rem",
      fontFamily: SERIF_BODY,
      color: INK,
      boxShadow: "inset 0 0 14px rgba(122,98,64,0.16)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "0.5rem", paddingBottom: "0.3rem",
        borderBottom: `1px dashed ${RULE}`,
      }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.65rem", color: INK_FADED, letterSpacing: "0.14em", fontWeight: 700 }}>
          ESEMPIO
        </span>
        <span style={{
          fontFamily: SANS_LABEL, fontSize: "0.55rem", color: STAMP_RED,
          letterSpacing: "0.22em", fontWeight: 800,
          border: `1px solid ${STAMP_RED}`, padding: "1px 5px", borderRadius: 2,
        }}>
          REVISIONE
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "1.1rem", lineHeight: 1.7, color: INK }}>
        Il pittore{" "}
        <span style={{
          backgroundColor: "rgba(161,42,31,0.22)",
          color: "#A12A1F",
          padding: "1px 6px",
          borderRadius: 4,
          fontWeight: 700,
          textDecoration: "line-through",
          textDecorationThickness: 2,
        }}>cantava</span>
        {" "}un grande quadro sulla parete.
      </p>
      <p style={{
        margin: "0.55rem 0 0 0", fontSize: "0.85rem",
        color: INK_FADED, fontStyle: "italic", textAlign: "center",
      }}>
        la parola giusta era <span style={{ color: "#3F6A2E", fontWeight: 700, fontStyle: "normal" }}>«dipingeva»</span>
      </p>
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Inizia la revisione",
  pagine: [{
    titolo: "Il Correttore di Bozze",
    demo: <BozzaDemo />,
    righe: [
      { icona: "📰", testo: "Ogni bozza è una frase con una sola parola sbagliata." },
      { icona: "🔍", testo: "Legga con calma e individui la parola fuori posto." },
      { icona: "👆", testo: "Tocchi la parola da correggere. Ha sessanta secondi: ne corregga quante più riesce." },
    ],
  }],
};

export function CorrettoreBozzeTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config = getCorrettoreLevel(livello);

  const [fase, setFase] = useState<Fase>(mostraTutorial ? "tutorial" : "sessione");

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase("sessione")}
      />
    );
  }

  return (
    <CorrettoreBozzeSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
