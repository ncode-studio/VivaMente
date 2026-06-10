"use client";

/**
 * "Il Vivaio" — Flessibilità attentiva · Task switching inferenziale.
 *
 * Tutorial → (warning cambio meccanica) → sessione 10 step.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getVivaioLevel, getVivaioMechanicWarning } from "./levels";
import { VivaioSession } from "./VivaioSession";
import { CartaFioreSvg, type FioreStimolo } from "./flowers";

type Fase = "tutorial" | "warning" | "sessione";

const BG       = "#F7F4EE";
const INK      = "#1F2937";
const INK_SOFT = "#6B7280";
const ACCENT   = "#4A6B5D";

const TUTORIAL_ACCENT = CATEGORIA_COLORS["esecutive"].text; // Il Vivaio = dominio Esecutive

// Anteprima: un fiore-stimolo di esempio, come appare in cima alla schermata.
function FioreDemo() {
  return (
    <CartaFioreSvg
      stimolo={{
        colore: "rosa",
        forma:  "margherita",
        numero: 2,
        taglia: "medio",
        gambo:  "verde",
        sfondo: "panna",
      } as FioreStimolo}
      baseSize={48}
    />
  );
}

const TUTORIAL: TutorialConfig = {
  accent: TUTORIAL_ACCENT,
  ctaLabel: "Inizia",
  pagine: [{
    titolo: "Il Vivaio",
    demo: <FioreDemo />,
    righe: [
      { icona: "🌸", testo: "In alto appare un fiore, in basso tre mazzi. Scopri a quale mazzo va abbinato." },
      { icona: "✅", testo: "Tocca un mazzo: bordo verde se è giusto, rosso se è sbagliato. Segui la stessa idea finché funziona." },
      { icona: "🔄", testo: "Se cominci a sbagliare, la regola è cambiata: prova con un'altra caratteristica del fiore." },
    ],
  }],
};

export function VivaioTaskEngine({
  livello,
  livelloPrec,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const config  = getVivaioLevel(livello);
  const warning = getVivaioMechanicWarning(livelloPrec, livello);

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
        padding: "1.5rem 1rem", gap: "1rem",
        backgroundColor: BG,
        borderRadius: "0.6rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            margin: 0,
            fontSize: "0.62rem",
            fontWeight: 600,
            color: INK_SOFT,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            Avviso
          </p>
          <h2 style={{
            margin: "0.2rem 0 0 0",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: INK,
          }}>
            {warning.titolo}
          </h2>
        </div>

        <p style={{
          fontSize: "0.92rem", color: "#374151", textAlign: "center",
          lineHeight: 1.5, margin: 0,
        }}>
          {warning.testo}
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.4rem", border: "none",
            backgroundColor: ACCENT, color: "#FFFFFF",
            fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          Continua
        </button>
      </div>
    );
  }

  return (
    <VivaioSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
      onProgress={onProgress}
    />
  );
}
