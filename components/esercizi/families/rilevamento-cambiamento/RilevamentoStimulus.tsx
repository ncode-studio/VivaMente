"use client";

/**
 * RilevamentoStimulus — UI trial Change Detection.
 *
 * La griglia alterna: ScenaA → blank → ScenaB → blank → ScenaA → ...
 * L'utente tocca l'elemento che cambia tra le due scene.
 *
 * Tap corretto → highlight verde + onRisposta chiamata dopo 350ms (per l'animazione).
 * Tap errato → shake rosso, l'alternanza continua.
 * Timeout (tLimMs) → onRisposta(null).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StimoloRilevamento, RispostaRilevamento } from "./sequence";

const ANIM = `
@keyframes rc-shake {
  0%, 100% { transform: translateX(0); }
  25%  { transform: translateX(-5px); }
  75%  { transform: translateX(5px); }
}
@keyframes rc-found {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}
@keyframes rc-ripple {
  0%   { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.8); opacity: 0; }
}
`;

type ScenaVis = "A" | "B" | "blank";

type Props = {
  stimolo:    StimoloRilevamento;
  onRisposta: (r: RispostaRilevamento) => void;
};

export function RilevamentoStimulus({ stimolo, onRisposta }: Props) {
  const [scenaVis, setScenaVis]   = useState<ScenaVis>("A");
  const [wrongIdx, setWrongIdx]   = useState<number | null>(null);
  const [foundIdx, setFoundIdx]   = useState<number | null>(null);

  const completedRef   = useRef(false);
  const startTimeRef   = useRef(0);
  const scenaVisRef    = useRef<ScenaVis>("A");
  const wrongTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRispostaRef  = useRef(onRisposta);
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // Sincronizza ref e state
  const setScenaVis_ = (v: ScenaVis) => {
    scenaVisRef.current = v;
    setScenaVis(v);
  };

  useEffect(() => {
    completedRef.current = false;
    setScenaVis_("A");
    setWrongIdx(null);
    setFoundIdx(null);
    startTimeRef.current = Date.now();

    let active = true;

    // Loop di alternanza
    (async () => {
      while (active && !completedRef.current) {
        setScenaVis_("A");
        await sleep(stimolo.sceneMs);
        if (!active || completedRef.current) break;
        setScenaVis_("blank");
        await sleep(stimolo.blankMs);
        if (!active || completedRef.current) break;
        setScenaVis_("B");
        await sleep(stimolo.sceneMs);
        if (!active || completedRef.current) break;
        setScenaVis_("blank");
        await sleep(stimolo.blankMs);
      }
    })();

    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        active = false;
        onRispostaRef.current(null);
      }
    }, stimolo.tLimMs);

    return () => {
      active = false;
      clearTimeout(timeout);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  const handleTap = useCallback((idx: number) => {
    if (completedRef.current) return;
    if (scenaVisRef.current === "blank") return;

    const tempoMs = Date.now() - startTimeRef.current;

    if (idx === stimolo.changeIdx) {
      completedRef.current = true;
      setFoundIdx(idx);
      setTimeout(() => {
        onRispostaRef.current({ idxTappato: idx, tempoMs });
      }, 380);
    } else {
      setWrongIdx(idx);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongIdx(null), 380);
    }
  }, [stimolo.changeIdx]);

  // ── Rendering ──────────────────────────────────────────────────────────────

  const scenaCorrente: string[] | null =
    scenaVis === "A" ? stimolo.scenaA :
    scenaVis === "B" ? stimolo.scenaB :
    null;

  const nItem = stimolo.scenaA.length;
  const cols  = nItem <= 4 ? 2 : nItem <= 9 ? 3 : 4;
  const emojiFontSize = nItem <= 4 ? "3rem" : nItem <= 6 ? "2.5rem" : nItem <= 9 ? "2.1rem" : "1.7rem";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      width: "100%", padding: "0.75rem", gap: "0.5rem" }}>
      <style>{ANIM}</style>

      <p style={{ fontSize: "0.78rem", color: "#6B7280", textAlign: "center", marginBottom: "0.1rem" }}>
        Tocca l'immagine che cambia
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "0.5rem",
        width: "100%",
      }}>
        {stimolo.scenaA.map((_, idx) => {
          const emoji   = scenaCorrente ? scenaCorrente[idx] : "";
          const isBlank = scenaVis === "blank";
          const isWrong = wrongIdx === idx;
          const isFound = foundIdx === idx;

          return (
            <button
              key={idx}
              onClick={() => handleTap(idx)}
              disabled={isBlank || !!completedRef.current}
              className={!isBlank && !isFound ? "active:scale-95" : ""}
              style={{
                aspectRatio: "1",
                borderRadius: "1rem",
                border: `2.5px solid ${
                  isFound ? "#22C55E" :
                  isWrong ? "#EF4444" :
                  "#E5E7EB"
                }`,
                backgroundColor: isFound ? "#DCFCE7" : isWrong ? "#FEE2E2" : "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: emojiFontSize,
                lineHeight: 1,
                cursor: !isBlank ? "pointer" : "default",
                opacity: isBlank ? 0 : 1,
                transition: "opacity 55ms linear, border-color 80ms, background-color 80ms",
                animation: isWrong ? "rc-shake 280ms ease" :
                            isFound ? "rc-found 380ms cubic-bezier(.2,1.5,.6,1)" :
                            undefined,
                position: "relative", overflow: "hidden",
                userSelect: "none",
              }}
            >
              {emoji}

              {/* Ripple sul tap corretto */}
              {isFound && (
                <div style={{
                  position: "absolute", width: "100%", paddingTop: "100%",
                  top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  backgroundColor: "#22C55E",
                  animation: "rc-ripple 420ms ease-out forwards",
                  pointerEvents: "none",
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
