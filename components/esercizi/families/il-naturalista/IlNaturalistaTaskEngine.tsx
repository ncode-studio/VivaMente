"use client";

/**
 * IlNaturalistaTaskEngine — engine "Il Naturalista" (id esercizio: il_naturalista).
 *
 * Dominio: Visuospaziale — discriminazione figura/sfondo. Ricerca visiva di
 * creature mimetizzate in scene naturalistiche (bosco, fondale, prato) in
 * stile tavole d'epoca. Modello A timer 90s, scene a catena.
 *
 * Bypassa TrialFlow: gestisce direttamente tutorial → sessione di ricerca.
 * Timer sessione gestito da page.tsx via tempoScaduto.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult } from "@/lib/exercise-types";
import { getNaturalistaLevel } from "./levels";
import { IlNaturalistaSession } from "./IlNaturalistaSession";
import {
  PaperBackground, NAT_COLORS, SceneDefs,
  Creature, BoscoScene, LenteIcon,
} from "./sprites";

type Fase = "tutorial" | "sessione";

export function IlNaturalistaTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config = getNaturalistaLevel(livello);
  const [fase, setFase] = useState<Fase>(mostraTutorial ? "tutorial" : "sessione");

  if (fase === "tutorial") {
    return (
      <PaperBackground style={{ minHeight: 540, padding: "1.4rem 1.1rem", borderRadius: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.95rem" }}>
          <p style={{
            fontSize: "0.7rem", fontWeight: 700, color: NAT_COLORS.seppia,
            letterSpacing: "0.08em", margin: 0,
          }}>
            COME SI GIOCA
          </p>
          <h2 style={{
            fontSize: "1.35rem", fontWeight: 900, color: NAT_COLORS.inchiostro,
            textAlign: "center", margin: 0, fontFamily: "Georgia, 'Times New Roman', serif",
          }}>
            Il Naturalista
          </h2>

          <p style={{
            fontSize: "0.94rem", color: NAT_COLORS.inchiostro, textAlign: "center",
            lineHeight: 1.5, margin: 0, maxWidth: 380,
          }}>
            Sul taccuino c'è una tavola illustrata. <strong>Animali e insetti
            sono nascosti</strong> nel paesaggio. Trovali tutti e
            toccali per catturarli.
          </p>

          <DemoMini />

          <div style={{
            display: "flex", flexDirection: "column", gap: "0.55rem",
            width: "100%", maxWidth: 380,
          }}>
            <Hint icona={<LenteIcon size={16} color={NAT_COLORS.cartaChiara} />} testo="Osserva con calma la tavola: ogni creatura è lì da scovare." />
            <Hint icona="•" testo="L'area attorno a ogni creatura è generosa: basta toccarla vicino." />
            <Hint icona="•" testo="Più sali di livello, più sono mimetizzate con lo sfondo." />
          </div>

          <p style={{
            fontSize: "0.78rem", color: NAT_COLORS.seppia, textAlign: "center", margin: 0,
          }}>
            Hai un minuto e mezzo. Lavora con calma.
          </p>

          <button
            onClick={() => setFase("sessione")}
            style={{
              width: "100%", maxWidth: 380, padding: "0.95rem",
              borderRadius: "0.9rem", border: "none",
              backgroundColor: NAT_COLORS.seppia,
              color: NAT_COLORS.cartaChiara,
              fontSize: "1.02rem", fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(60,40,20,0.42)",
            }}
          >
            Ho capito — Comincia!
          </button>
        </div>
      </PaperBackground>
    );
  }

  return (
    <IlNaturalistaSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}

function Hint({ icona, testo }: { icona: React.ReactNode; testo: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.5rem 0.8rem", borderRadius: "0.7rem",
      background: "rgba(255,250,235,0.7)",
      border: `1.5px solid ${NAT_COLORS.cartaScura}`,
    }}>
      <div style={{
        width: 22, height: 22, flexShrink: 0,
        borderRadius: "50%", background: NAT_COLORS.seppia, color: NAT_COLORS.cartaChiara,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: 800,
      }}>{icona}</div>
      <p style={{ fontSize: "0.85rem", color: NAT_COLORS.inchiostro, lineHeight: 1.35, margin: 0 }}>
        {testo}
      </p>
    </div>
  );
}

function DemoMini() {
  // Una mini scena bosco con due creature: una farfalla (facile) e uno scarabeo (più mimetico)
  return (
    <div style={{
      width: "100%", maxWidth: 380,
      borderRadius: 8,
      border: `2px solid ${NAT_COLORS.seppia}`,
      overflow: "hidden",
      background: NAT_COLORS.cartaChiara,
      boxShadow: "inset 0 0 14px rgba(60,40,20,0.18)",
    }}>
      <svg viewBox="0 0 1000 320" style={{ display: "block", width: "100%" }}>
        <SceneDefs />
        <BoscoScene densita={0.3} fitto={false} />
        <g transform="translate(280 160) scale(1.4)">
          <Creature kind="farfalla" />
        </g>
        <g transform="translate(680 220) scale(1.2)">
          <Creature kind="scarabeo" tintColor={NAT_COLORS.verdeBosco} tintMix={0.3} />
        </g>
        {/* indicatore tap */}
        <circle cx="280" cy="160" r="60" fill="none" stroke="#3A8E45" strokeWidth="4" opacity="0.9" strokeDasharray="8 6" />
      </svg>
    </div>
  );
}
