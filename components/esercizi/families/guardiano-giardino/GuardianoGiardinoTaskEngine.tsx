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

import { useState, type ReactNode, type CSSProperties } from "react";
import type { GameEngineProps, SessionResult } from "@/lib/exercise-types";
import { getGGLevel } from "./levels";
import { GuardianoGiardinoSession } from "./GuardianoGiardinoSession";
import { FarfallaSprite, ApeSprite, UccellinoSprite, LibellulaSprite, CoccinellaSprite } from "./sprites";

type Fase = "tutorial" | "sessione";

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
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 1.25rem", gap: "1.1rem",
      }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 700, color: "#4F6347",
          letterSpacing: "0.08em", margin: 0,
        }}>
          COME SI GIOCA
        </p>

        <h2 style={{
          fontSize: "1.25rem", fontWeight: 900, color: "#1F2A1A",
          textAlign: "center", margin: 0,
        }}>
          Il Guardiano del Giardino
        </h2>

        <p style={{
          fontSize: "0.92rem", color: "#374151", textAlign: "center",
          lineHeight: 1.5, margin: 0, maxWidth: 360,
        }}>
          Nel giardino volano farfalle e tanti altri animaletti.
          Il tuo compito è semplice: <strong>tocca solo le farfalle</strong>,
          lascia in pace tutti gli altri.
        </p>

        <div style={{
          display: "flex", flexDirection: "column", gap: "0.7rem",
          width: "100%", maxWidth: 360,
        }}>
          <RigaIstruzione
            sprite={<FarfallaSprite size={52} variant={0} />}
            bg="#EDEFE4"
            border="#C7CCAA"
            testo="Tocca le farfalle quando le vedi volare."
          />
          <RigaIstruzione
            sprite={<AltriAnimaliComposito />}
            bg="#E6E2D9"
            border="#B0A78F"
            testo="Tutti gli altri animali del giardino: non toccarli, lasciali passare."
          />
        </div>

        <p style={{
          fontSize: "0.78rem", color: "#6B7280", textAlign: "center", margin: 0,
        }}>
          Hai un minuto. Prenditi il tempo che serve.
        </p>

        <button
          onClick={() => setFase("sessione")}
          style={{
            width: "100%", maxWidth: 360, padding: "0.9rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#4F6347", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79,99,71,0.35)",
          }}
        >
          Ho capito — Comincia!
        </button>
      </div>
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

// ── Icona composita "altri animali" ─ griglia 2×2 di mini-sprite ──────────────

function AltriAnimaliComposito() {
  const cellStyle: CSSProperties = {
    width: 26, height: 26,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "26px 26px",
        gridTemplateRows: "26px 26px",
        gap: 2,
      }}
      aria-hidden
    >
      <div style={cellStyle}><ApeSprite        size={28} /></div>
      <div style={cellStyle}><UccellinoSprite  size={28} /></div>
      <div style={cellStyle}><LibellulaSprite  size={28} /></div>
      <div style={cellStyle}><CoccinellaSprite size={28} /></div>
    </div>
  );
}

// ── Riga tutorial ──────────────────────────────────────────────────────────────

function RigaIstruzione({
  sprite, bg, border, testo,
}: { sprite: ReactNode; bg: string; border: string; testo: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.9rem",
      padding: "0.6rem 0.85rem", borderRadius: "0.85rem",
      backgroundColor: bg, border: `1.5px solid ${border}`,
    }}>
      <div style={{
        width: 56, height: 56, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {sprite}
      </div>
      <p style={{ fontSize: "0.88rem", color: "#1F2937", lineHeight: 1.4, margin: 0 }}>
        {testo}
      </p>
    </div>
  );
}
