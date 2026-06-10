"use client";

/**
 * "La Casalinga" — Memoria visuospaziale · Change detection in scena cucina.
 *
 * Tutorial → (warning cambio meccanica) → 5 trial valutativi.
 * Modello B: nessun timer di sessione, page.tsx riceve null da getSessionDurationMs.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import {
  getCasalingaLevel, getCasalingaMechanicWarning,
} from "./levels";
import { CasalingaSession } from "./CasalingaSession";
import { ObjectSprite, KITCHEN_PALETTE, SurfaceFrame } from "./kitchen";

const ACCENT = CATEGORIA_COLORS.visuospaziali.text; // La Casalinga = dominio Visuospaziali

/**
 * Mini-demo PRIMA/DOPO per il tutorial: mostra una mensola con 3 oggetti,
 * uno dei quali si è spostato. Lo slot "diverso" lampeggia per indicare
 * cosa va toccato in fase recall.
 */
function MiniEsempio() {
  const slotStyle = (highlight: "none" | "ring" | "ringSrc"): React.CSSProperties => ({
    width: "100%",
    minWidth: 0,
    height: 56,
    background: "#FBF4E8",
    border: `2px solid ${
      highlight === "ring"    ? KITCHEN_PALETTE.err :
      highlight === "ringSrc" ? KITCHEN_PALETTE.err :
                                 KITCHEN_PALETTE.tileEdge
    }`,
    borderRadius: "0.4rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation:
      highlight === "ring" || highlight === "ringSrc"
        ? "casa-tut-blink 1100ms ease-in-out infinite"
        : undefined,
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      alignItems: "stretch",
    }}>
      <style>{`
        @keyframes casa-tut-blink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,0); }
          50%      { box-shadow: 0 0 0 5px rgba(185,28,28,0.35); }
        }
      `}</style>

      {/* PRIMA */}
      <div style={{ borderRadius: "0.45rem", overflow: "hidden", border: `1px solid rgba(76,52,28,0.18)` }}>
        <div style={{
          padding: "0.2rem 0.4rem",
          fontSize: "0.6rem",
          fontWeight: 700,
          textAlign: "center",
          color: KITCHEN_PALETTE.inkSoft,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          background: "#FBF4E8",
          borderBottom: `1px solid rgba(76,52,28,0.12)`,
        }}>
          Prima
        </div>
        <SurfaceFrame surface="piano">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.3rem",
            marginTop: "0.85rem",
          }}>
            <div style={slotStyle("none")}><ObjectSprite id="moka"     size={40} /></div>
            <div style={slotStyle("none")}><ObjectSprite id="tazzina"  size={40} /></div>
            <div style={slotStyle("none")}><ObjectSprite id="barattolo" size={40} /></div>
            <div style={slotStyle("none")} />
          </div>
        </SurfaceFrame>
      </div>

      {/* freccia verso il basso */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: KITCHEN_PALETTE.inkSoft,
        fontSize: "1.1rem",
        fontWeight: 700,
        lineHeight: 1,
        padding: "0.1rem 0",
      }}>
        ↓
      </div>

      {/* DOPO */}
      <div style={{ borderRadius: "0.45rem", overflow: "hidden", border: `1px solid rgba(76,52,28,0.18)` }}>
        <div style={{
          padding: "0.2rem 0.4rem",
          fontSize: "0.6rem",
          fontWeight: 700,
          textAlign: "center",
          color: KITCHEN_PALETTE.inkSoft,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          background: "#FFF1DA",
          borderBottom: `1px solid rgba(76,52,28,0.12)`,
        }}>
          Dopo
        </div>
        <SurfaceFrame surface="piano">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.3rem",
            marginTop: "0.85rem",
          }}>
            <div style={{ ...slotStyle("none"), opacity: 0.55 }} />
            <div style={slotStyle("none")}><ObjectSprite id="tazzina"  size={40} /></div>
            <div style={slotStyle("none")}><ObjectSprite id="barattolo" size={40} /></div>
            <div style={slotStyle("ring")}><ObjectSprite id="moka" size={40} /></div>
          </div>
        </SurfaceFrame>
      </div>
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Inizia",
  pagine: [{
    titolo: "La Casalinga",
    demo: <MiniEsempio />,
    righe: [
      { icona: "🔍", testo: "Osserva la cucina e ricorda dove si trova ogni oggetto. Niente fretta." },
      { icona: "🔀", testo: "La scena cambia: qualcosa si sposta, si scambia o si capovolge." },
      { icona: "👆", testo: "Tocca solo gli oggetti che sono cambiati, poi premi Conferma." },
    ],
  }],
};

type Fase = "tutorial" | "warning" | "sessione";

export function CasalingaTaskEngine({
  livello, livelloPrec, tempoScaduto, mostraTutorial,
  onReady, onComplete, onProgress,
}: GameEngineProps) {
  const config  = getCasalingaLevel(livello);
  const warning = getCasalingaMechanicWarning(livelloPrec, livello);

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
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1.5rem 1rem",
        background: KITCHEN_PALETTE.bg,
        borderRadius: "0.6rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            margin: 0,
            fontSize: "0.62rem",
            fontWeight: 600,
            color: KITCHEN_PALETTE.inkSoft,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            Avviso
          </p>
          <h2 style={{
            margin: "0.2rem 0 0 0",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: KITCHEN_PALETTE.ink,
          }}>
            {warning.titolo}
          </h2>
        </div>

        <p style={{
          margin: 0,
          fontSize: "0.92rem",
          color: "#3A2A18",
          textAlign: "center",
          lineHeight: 1.5,
        }}>
          {warning.testo}
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: "0.4rem",
            border: "none",
            background: KITCHEN_PALETTE.ink,
            color: "#FBF4E8",
            fontSize: "0.98rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Continua
        </button>
      </div>
    );
  }

  return (
    <CasalingaSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
      onProgress={onProgress}
    />
  );
}
