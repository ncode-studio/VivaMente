"use client";

/**
 * GuardianoGiardinoTaskEngine — engine "Il Guardiano del Giardino"
 * (id esercizio: guardiano_giardino).
 *
 * Dominio: Attenzione — Go/No-Go con stimoli in movimento orizzontale,
 * target over 60, estetica naturalistica sobria.
 *
 * Bypassa TrialFlow: gestisce direttamente tutorial → sessione arcade.
 * Tutti e tre i tipi di sprite (farfalla, ape, uccellino) sono presenti
 * fin dal livello 1, quindi non esistono cambi di meccanica.
 *
 * Timer sessione: 60s (gestito da page.tsx via tempoScaduto).
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getGGLevel } from "./levels";
import { GuardianoGiardinoSession } from "./GuardianoGiardinoSession";
import { FarfallaSprite, ApeSprite, UccellinoSprite, LibellulaSprite } from "./sprites";

type Fase = "tutorial" | "sessione";

const ACCENT = CATEGORIA_COLORS.attenzione.text; // Guardiano = dominio Attenzione

// Anteprima: mini giardino con la farfalla evidenziata tra gli altri animali.
function GiardinoDemo() {
  return (
    <div style={{
      position: "relative", width: "100%", height: 130, borderRadius: "0.75rem",
      background: "linear-gradient(180deg, #D9DDD3 0%, #C7CCAA 100%)",
      overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "0 0.5rem",
    }}>
      <div style={{ opacity: 0.7 }}><ApeSprite size={48} /></div>
      {/* Farfalla evidenziata */}
      <div style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 70, height: 70, borderRadius: "50%",
        background: "rgba(255,255,255,0.55)",
        boxShadow: `0 0 0 3px ${ACCENT}`,
      }}>
        <FarfallaSprite size={56} variant={0} />
      </div>
      <div style={{ opacity: 0.7 }}><UccellinoSprite size={48} /></div>
      <div style={{ opacity: 0.7 }}><LibellulaSprite size={48} /></div>
      <p style={{
        position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", margin: 0,
        color: ACCENT, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
      }}>
        ↑ tocca solo la farfalla
      </p>
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia!",
  pagine: [{
    titolo: "Il Guardiano del Giardino",
    demo: <GiardinoDemo />,
    righe: [
      { icona: "🌿", testo: "Nel giardino volano farfalle e tanti altri animaletti." },
      { icona: "🦋", testo: "Tocca le farfalle quando le vedi volare." },
      { icona: "🐝", testo: "Tutti gli altri animali lasciali passare: non toccarli." },
    ],
  }],
};

export function GuardianoGiardinoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {

  const config = getGGLevel(livello);
  const [fase, setFase] = useState<Fase>(mostraTutorial ? "tutorial" : "sessione");

  // ── Tutorial (prima sessione assoluta) ────────────────────────────────────

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase("sessione")}
      />
    );
  }

  // ── Sessione di gioco ───────────────────────────────────────────────────────

  return (
    <GuardianoGiardinoSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
