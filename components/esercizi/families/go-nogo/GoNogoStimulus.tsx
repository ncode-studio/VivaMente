"use client";

/**
 * GoNogoStimulus — renderer dinamico per un singolo trial Go/No-Go cromatico.
 *
 * Cambiamenti rispetto alla versione precedente:
 *   - Niente più bottone "Tocca": l'utente tocca direttamente il cerchio.
 *   - Posizione casuale del cerchio nella play area (passata via stimolo).
 *   - Animazione di entrata pop-in (scale 0 → bounce → 1) all'apparire.
 *   - Animazione di uscita: ripple su tap corretto, shake su tap su decoy.
 *   - Multi-spawn (lv 8+): un secondo cerchio "decoy" (sempre nogo) compare
 *     insieme al go. Tappare il decoy = errore. L'engine valuta il target tocco.
 *
 * INVARIANTE DI RIMONTO: TrialFlow rimonta questo componente ad ogni trial.
 * startRef = performance.now() al mount = inizio trial.
 */

import { useRef, useCallback, useState, useEffect } from "react";
import { COLORE_CSS_GO_NOGO } from "./levels";
import type { GoNogoStimolo, PosRel } from "./sequence";

// ── Tipo risposta (esportato — usato da GoNogoTaskEngine) ─────────────────────

export interface GoNogoRisposta {
  tempoMs: number;
  /** Quale cerchio ha toccato l'utente. */
  target:  "main" | "decoy";
}

// ── Costanti ─────────────────────────────────────────────────────────────────

const PLAY_AREA_HEIGHT = 400;     // px, area di gioco fissa
const CIRCLE_SIZE      = 110;     // px
const EXIT_ANIM_MS     = 180;     // durata animazione di uscita prima di onRisposta

// ── Animazioni keyframes inline (iniettati in <style>) ────────────────────────

const ANIM_STYLES = `
@keyframes gn-popin {
  0%   { transform: translate(-50%, -50%) scale(0);   opacity: 0; }
  60%  { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
}
@keyframes gn-ripple {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0;   }
}
@keyframes gn-shake {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  20%      { transform: translate(calc(-50% - 8px), -50%) rotate(-6deg); }
  40%      { transform: translate(calc(-50% + 8px), -50%) rotate(6deg);  }
  60%      { transform: translate(calc(-50% - 6px), -50%) rotate(-4deg); }
  80%      { transform: translate(calc(-50% + 4px), -50%) rotate(3deg);  }
}
@keyframes gn-fadeout {
  0%   { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
}
`;

// ── Props ─────────────────────────────────────────────────────────────────────

interface GoNogoStimulusProps {
  stimolo:      GoNogoStimolo;
  onRisposta(risposta: GoNogoRisposta): void;
  disabilitato: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function posStyle(pos: PosRel): React.CSSProperties {
  return {
    position: "absolute",
    left:  `${pos.x * 100}%`,
    top:   `${pos.y * 100}%`,
    width:  CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export function GoNogoStimulus({
  stimolo,
  onRisposta,
  disabilitato,
}: GoNogoStimulusProps) {

  const startRef = useRef(performance.now());

  // Stato visuale del trial: "active" (in attesa di tap o timeout)
  //   "exit-main"  → tap sul main → ripple
  //   "exit-decoy" → tap sul decoy → shake (errore esplicito)
  const [exitState, setExitState] = useState<"active" | "exit-main" | "exit-decoy">("active");
  const tappedRef = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = useCallback((target: "main" | "decoy") => {
    if (disabilitato || tappedRef.current) return;
    tappedRef.current = true;
    const tempoMs = performance.now() - startRef.current;
    setExitState(target === "main" ? "exit-main" : "exit-decoy");
    // Lascia che l'animazione di uscita parta, poi notifica l'engine
    timerRef.current = setTimeout(() => {
      onRisposta({ tempoMs, target });
    }, EXIT_ANIM_MS);
  }, [disabilitato, onRisposta]);

  const mainColor  = COLORE_CSS_GO_NOGO[stimolo.colore];
  const decoyColor = stimolo.decoy ? COLORE_CSS_GO_NOGO[stimolo.decoy.colore] : null;

  // Animazioni: ad ogni stato corrisponde un'animation CSS
  const mainAnim =
    exitState === "exit-main"  ? `gn-fadeout ${EXIT_ANIM_MS}ms ease-out forwards` :
    exitState === "exit-decoy" ? `gn-shake 200ms ease-in-out` :
    "gn-popin 240ms cubic-bezier(0.34, 1.56, 0.64, 1) both";

  const decoyAnim =
    exitState === "exit-decoy" ? `gn-shake 200ms ease-in-out` :
    exitState === "exit-main"  ? `gn-fadeout ${EXIT_ANIM_MS}ms ease-out forwards` :
    "gn-popin 240ms cubic-bezier(0.34, 1.56, 0.64, 1) both";

  return (
    <div
      className="select-none w-full"
      style={{ touchAction: "manipulation" }}
    >
      <style>{ANIM_STYLES}</style>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: PLAY_AREA_HEIGHT,
          backgroundColor: "#F8FAFC",
          borderRadius: "1.25rem",
          border: "2px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        {/* Cerchio principale (cliccabile) */}
        <button
          onClick={() => handleTap("main")}
          disabled={disabilitato || tappedRef.current}
          aria-label={`Cerchio ${stimolo.colore}`}
          style={{
            ...posStyle(stimolo.pos),
            borderRadius: "50%",
            backgroundColor: mainColor,
            border: "none",
            cursor: "pointer",
            padding: 0,
            animation: mainAnim,
            boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
          }}
        />

        {/* Ripple sotto il main, attivo durante exit-main */}
        {exitState === "exit-main" && (
          <div
            style={{
              ...posStyle(stimolo.pos),
              borderRadius: "50%",
              backgroundColor: "transparent",
              border: `4px solid ${mainColor}`,
              pointerEvents: "none",
              animation: `gn-ripple ${EXIT_ANIM_MS}ms ease-out forwards`,
            }}
          />
        )}

        {/* Decoy (lv 8+, solo su stimoli go con probabilità) */}
        {stimolo.decoy && decoyColor && (
          <button
            onClick={() => handleTap("decoy")}
            disabled={disabilitato || tappedRef.current}
            aria-label={`Cerchio ${stimolo.decoy.colore}`}
            style={{
              ...posStyle(stimolo.decoy.pos),
              borderRadius: "50%",
              backgroundColor: decoyColor,
              border: "none",
              cursor: "pointer",
              padding: 0,
              animation: decoyAnim,
              boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
            }}
          />
        )}
      </div>
    </div>
  );
}
