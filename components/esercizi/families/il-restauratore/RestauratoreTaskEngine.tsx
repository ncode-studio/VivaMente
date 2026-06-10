"use client";

/**
 * "Il Restauratore" — Visuospaziali · Find the differences su dipinti.
 *
 * Tutorial → (warning cambio meccanica) → 3 trial valutativi.
 * Modello B: nessun timer di sessione (page.tsx riceve null da getSessionDurationMs).
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import {
  getRestauratoreLevel, getRestauratoreMechanicWarning,
  RESTAURATORE_PALETTE as PAL,
} from "./levels";
import { RestauratoreSession } from "./RestauratoreSession";
import { PaintingView, generaTrialScene } from "./paintings";

type Fase = "tutorial" | "warning" | "sessione";

export const RESTAURATORE_SESSION_TIMER_MS = null;

const ACCENT = CATEGORIA_COLORS.visuospaziali.text; // Il Restauratore = dominio Visuospaziali

export function RestauratoreTaskEngine({
  livello, livelloPrec, tempoScaduto, mostraTutorial,
  onReady, onComplete, onProgress,
}: GameEngineProps) {
  const config  = getRestauratoreLevel(livello);
  const warning = getRestauratoreMechanicWarning(livelloPrec, livello);

  const [fase, setFase] = useState<Fase>(
    mostraTutorial ? "tutorial" :
    warning        ? "warning"  :
    "sessione",
  );

  // ── Scena demo per il tutorial (deterministica con 2 differenze cromatiche) ──
  const [demoScene] = useState(() =>
    generaTrialScene(
      { livello: 1, nDifferenze: 2, dipintiAmmessi: ["natura_morta"], tipiAmmessi: ["color"], intensita: 1 },
      Math.random,
    )
  );

  if (fase === "tutorial") {
    const tutorial: TutorialConfig = {
      accent: ACCENT,
      ctaLabel: "Inizia il restauro",
      pagine: [{
        titolo: "Il Restauratore",
        demo: (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            padding: "0.4rem",
            background: PAL.bgDeep,
            borderRadius: "0.4rem",
            border: `1px solid rgba(76,52,28,0.18)`,
            maxWidth: 320,
            margin: "0 auto",
            width: "100%",
          }}>
            <PaintingView
              background={demoScene.background}
              elements={demoScene.elementsA}
              differences={demoScene.differences}
              foundOnThisSide={new Set()}
              hintIds={new Set(demoScene.differences.map((d) => d.elementId))}
              side="A"
              restaurato={false}
              onClickPoint={() => {}}
              ariaLabel="Esempio originale"
            />
            <PaintingView
              background={demoScene.background}
              elements={demoScene.elementsB}
              differences={demoScene.differences}
              foundOnThisSide={new Set()}
              hintIds={new Set(demoScene.differences.map((d) => d.elementId))}
              side="B"
              restaurato={false}
              onClickPoint={() => {}}
              ariaLabel="Esempio da restaurare"
            />
          </div>
        ),
        righe: [
          { icona: "🖼️", testo: "Vedi due versioni dello stesso dipinto, una accanto all'altra." },
          { icona: "🔍", testo: "Qualcosa è cambiato: un oggetto ha un colore diverso, oppure un oggetto c'è in un dipinto e manca nell'altro." },
          { icona: "👆", testo: "Tocca ogni differenza sul dipinto da restaurare. Quando le trovi tutte, il dipinto si illumina." },
        ],
      }],
    };

    return (
      <TutorialOverlay
        config={tutorial}
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
        background: PAL.bg,
        borderRadius: "0.6rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            margin: 0,
            fontSize: "0.62rem",
            fontWeight: 600,
            color: PAL.inkSoft,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            Avviso
          </p>
          <h2 style={{
            margin: "0.2rem 0 0 0",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: PAL.ink,
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
            background: PAL.ink,
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
    <RestauratoreSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
      onProgress={onProgress}
    />
  );
}
