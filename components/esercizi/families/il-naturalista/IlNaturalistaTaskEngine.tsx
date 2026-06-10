"use client";

/**
 * IlNaturalistaTaskEngine — engine "Il Naturalista" (id esercizio: il_naturalista).
 *
 * Dominio: Visuospaziale — ricerca visiva del bersaglio (#15). Una scena
 * naturalistica affollata di tante creature; il giocatore deve scovare e
 * toccare le istanze del bersaglio mostrato come riferimento, ignorando i
 * distrattori. Modello A timer 60s, scene a catena.
 *
 * Bypassa TrialFlow: gestisce direttamente tutorial → sessione di ricerca.
 * Timer sessione gestito da page.tsx via tempoScaduto.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getNaturalistaLevel } from "./levels";
import { IlNaturalistaSession } from "./IlNaturalistaSession";
import {
  NAT_COLORS, SceneDefs,
  Creature, BoscoScene,
} from "./sprites";

type Fase = "tutorial" | "sessione";

const ACCENT = CATEGORIA_COLORS.visuospaziali.text; // Il Naturalista = dominio Visuospaziale

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia la ricerca",
  pagine: [{
    titolo: "Il Naturalista",
    demo: <DemoMini />,
    righe: [
      { icona: "🔍", testo: "In alto vedi una creatura: è il tuo bersaglio da cercare." },
      { icona: "🌿", testo: "La tavola è affollata di tante creature diverse, alcune mimetizzate." },
      { icona: "👆", testo: "Tocca solo quelle uguali al bersaglio. Toccare le altre è un errore." },
    ],
  }],
};

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
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase("sessione")}
      />
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

function DemoMini() {
  // Mostra il bersaglio (farfalla) come riferimento e una mini scena affollata
  // in cui le farfalle (target) sono cerchiate di verde e le altre creature
  // (distrattori) no.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380 }}>
      {/* Riferimento bersaglio */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: NAT_COLORS.inchiostro }}>Trova</span>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: 8,
          background: NAT_COLORS.cartaChiara, border: `1.8px solid ${NAT_COLORS.seppia}`,
        }}>
          <svg viewBox="0 0 100 100" width={34} height={34} style={{ display: "block" }}>
            <SceneDefs />
            <g transform="translate(50 50)"><Creature kind="farfalla" /></g>
          </svg>
        </span>
      </div>
      {/* Mini scena affollata */}
      <div style={{
        borderRadius: 8, border: `2px solid ${NAT_COLORS.seppia}`, overflow: "hidden",
        background: NAT_COLORS.cartaChiara, boxShadow: "inset 0 0 14px rgba(60,40,20,0.18)",
      }}>
        <svg viewBox="0 0 1000 320" style={{ display: "block", width: "100%" }}>
          <SceneDefs />
          <BoscoScene densita={0.3} fitto={false} />
          {/* target (farfalle) — cerchiate */}
          <g transform="translate(230 150) scale(1.2)"><Creature kind="farfalla" /></g>
          <circle cx="230" cy="150" r="62" fill="none" stroke="#3A8E45" strokeWidth="4" opacity="0.9" strokeDasharray="8 6" />
          <g transform="translate(760 210) scale(1.1)"><Creature kind="farfalla" /></g>
          <circle cx="760" cy="210" r="58" fill="none" stroke="#3A8E45" strokeWidth="4" opacity="0.9" strokeDasharray="8 6" />
          {/* distrattori — non cerchiati */}
          <g transform="translate(480 120) scale(1.0)"><Creature kind="scarabeo" tintColor={NAT_COLORS.verdeBosco} tintMix={0.3} /></g>
          <g transform="translate(560 240) scale(1.0)"><Creature kind="coccinella" /></g>
          <g transform="translate(330 250) scale(1.0)"><Creature kind="ape" /></g>
        </svg>
      </div>
    </div>
  );
}
