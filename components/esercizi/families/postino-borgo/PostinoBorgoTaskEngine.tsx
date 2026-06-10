"use client";

/**
 * "Il Postino del Borgo" — Visuospaziale · Path planning con vincoli stradali.
 *
 * Tutorial → (warning cambio meccanica) → 2 trial valutativi.
 * Modello B: nessun timer di sessione, page.tsx riceve null da
 * getSessionDurationMs.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import {
  getPostinoBorgoLevel, getPostinoBorgoMechanicWarning,
} from "./levels";
import { PostinoBorgoSession } from "./PostinoBorgoSession";
import { PALETTE, PostinoSprite, Decor, DestinatarioPin } from "./village";

type Fase = "tutorial" | "warning" | "sessione";

const ACCENT = CATEGORIA_COLORS.visuospaziali.text; // Postino del Borgo = dominio Visuospaziali

// Anteprima: il postino e i destinatari del borgo da raggiungere.
function BorgoDemo() {
  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem",
      width: "100%", padding: "0.7rem", borderRadius: "0.5rem",
      background: "#FBF5E5", border: `1.4px solid ${PALETTE.streetEdge}`,
    }}>
      <PostinoSprite size={48} />
      <DestinatarioPin idx={1} consegnato={false} size={28} />
      <DestinatarioPin idx={2} consegnato={false} size={28} />
      <Decor kind="fontana" size={56} />
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Parti con le consegne",
  pagine: [{
    titolo: "Il Postino del Borgo",
    demo: <BorgoDemo />,
    righe: [
      { icona: "✉️", testo: "Il postino deve consegnare le lettere a tutti i destinatari del borgo." },
      { icona: "🗺️", testo: "Tocca le case vicine per tracciare il percorso più corto che le raggiunge tutte." },
      { icona: "🚶", testo: "Premi Conferma e il postino partirà. Sbagliato un passo? Annulla e riprova con calma." },
    ],
  }],
};

export function PostinoBorgoTaskEngine({
  livello, livelloPrec, tempoScaduto, mostraTutorial,
  onReady, onComplete, onProgress,
}: GameEngineProps) {
  const config  = getPostinoBorgoLevel(livello);
  const warning = getPostinoBorgoMechanicWarning(livelloPrec, livello);

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
        display: "flex", flexDirection: "column", gap: "1rem",
        padding: "1.5rem 1rem",
        background: PALETTE.bg, borderRadius: "0.6rem",
        fontFamily: "Georgia, serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            margin: 0, fontSize: "0.62rem", fontWeight: 600,
            color: PALETTE.inkSoft, letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            Avviso
          </p>
          <h2 style={{
            margin: "0.2rem 0 0 0", fontSize: "1.2rem",
            fontWeight: 700, color: PALETTE.ink,
          }}>
            {warning.titolo}
          </h2>
        </div>

        <p style={{
          margin: 0, fontSize: "0.95rem",
          color: "#3A2A18", textAlign: "center", lineHeight: 1.5,
        }}>
          {warning.testo}
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", padding: "0.9rem",
            borderRadius: "0.4rem", border: "none",
            background: PALETTE.ink, color: "#FBF5E5",
            fontSize: "1rem", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 0 #2A1B0C",
          }}
        >
          Continua
        </button>
      </div>
    );
  }

  return (
    <PostinoBorgoSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
      onProgress={onProgress}
    />
  );
}
