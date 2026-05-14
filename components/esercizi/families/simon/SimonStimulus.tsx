"use client";

/**
 * SimonStimulus — renderer di un singolo trial Simon Spaziale.
 *
 * Layout:
 *   - In alto: area di gioco con la freccia che appare in una delle 2 o 4 zone.
 *   - In basso: pulsanti di risposta fissi (2 orizzontali o 4 a croce).
 *
 * Animazioni:
 *   - Entrata freccia: pop-in con scale + bounce (~220ms).
 *   - Tap su pulsante corretto/errato: feedback locale immediato (ripple/shake).
 *   - Uscita freccia: fade-out rapido (~150ms) prima di onRisposta.
 *
 * INVARIANTE DI RIMONTO: TrialFlow rimonta ad ogni trial.
 * startRef = performance.now() al mount = inizio trial.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { type SimonDirezione } from "./levels";
import type { SimonStimolo } from "./sequence";

// ── Freccia SVG: stessa forma per tutte le direzioni, solo ruotata ───────────

const ROTAZIONE: Record<SimonDirezione, number> = {
  dx:  0,
  giu: 90,
  sx:  180,
  su:  270,
};

interface FrecciaProps {
  direzione: SimonDirezione;
  size:      number;
  color:     string;
  strokeWidth?: number;
}

function Freccia({ direzione, size, color, strokeWidth = 2.8 }: FrecciaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        transform: `rotate(${ROTAZIONE[direzione]}deg)`,
        display: "block",
      }}
      aria-hidden="true"
    >
      {/* Asta orizzontale + punta a destra (forma canonica = "dx", poi ruotata) */}
      <path
        d="M4 12 L18 12 M18 12 L11 5 M18 12 L11 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ── Tipo risposta (esportato — usato da SimonTaskEngine) ──────────────────────

export interface SimonRisposta {
  tempoMs:        number;
  direzioneScelta: SimonDirezione;
}

// ── Costanti ─────────────────────────────────────────────────────────────────

const PLAY_AREA_HEIGHT = 320; // px
const ARROW_FONT_SIZE  = 88;  // px
const EXIT_ANIM_MS     = 150;

// ── Animazioni keyframes inline ──────────────────────────────────────────────

const ANIM_STYLES = `
@keyframes sim-popin {
  0%   { transform: translate(-50%, -50%) scale(0);   opacity: 0; }
  60%  { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
}
@keyframes sim-fadeout {
  0%   { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
}
@keyframes sim-shake-btn {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(3px); }
}
`;

// ── Helpers di posizionamento ────────────────────────────────────────────────

/** Coordinate (in % play-area) per ciascuna zona, 2 e 4 direzioni. */
function zonaCoord(pos: SimonDirezione, nDirezioni: 2 | 4): { x: number; y: number } {
  if (nDirezioni === 2) {
    // 2 zone orizzontali, centrate verticalmente
    return pos === "sx" ? { x: 0.25, y: 0.5 } : { x: 0.75, y: 0.5 };
  }
  // 4 zone a croce
  switch (pos) {
    case "sx":  return { x: 0.20, y: 0.50 };
    case "dx":  return { x: 0.80, y: 0.50 };
    case "su":  return { x: 0.50, y: 0.22 };
    case "giu": return { x: 0.50, y: 0.78 };
  }
}

// ── Props ────────────────────────────────────────────────────────────────────

interface SimonStimulusProps {
  stimolo:      SimonStimolo;
  nDirezioni:   2 | 4;
  onRisposta(risposta: SimonRisposta): void;
  disabilitato: boolean;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function SimonStimulus({
  stimolo,
  nDirezioni,
  onRisposta,
  disabilitato,
}: SimonStimulusProps) {

  const startRef = useRef(performance.now());

  const [exiting,  setExiting]  = useState(false);
  const [errorBtn, setErrorBtn] = useState<SimonDirezione | null>(null);
  const tappedRef = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = useCallback((direzioneScelta: SimonDirezione) => {
    if (disabilitato || tappedRef.current) return;
    tappedRef.current = true;
    const tempoMs = performance.now() - startRef.current;

    const corretto = direzioneScelta === stimolo.direzione;
    if (!corretto) setErrorBtn(direzioneScelta);
    setExiting(true);

    timerRef.current = setTimeout(() => {
      onRisposta({ tempoMs, direzioneScelta });
    }, EXIT_ANIM_MS);
  }, [disabilitato, onRisposta, stimolo.direzione]);

  const coord = zonaCoord(stimolo.posizione, nDirezioni);
  const arrowAnim = exiting
    ? `sim-fadeout ${EXIT_ANIM_MS}ms ease-out forwards`
    : "sim-popin 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both";

  const direzioniPulsanti: readonly SimonDirezione[] =
    nDirezioni === 2 ? ["sx", "dx"] : ["sx", "dx", "su", "giu"];

  return (
    <div className="select-none w-full" style={{ touchAction: "manipulation" }}>
      <style>{ANIM_STYLES}</style>

      {/* ── Area di gioco ──────────────────────────────────────────────── */}
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
        <div
          style={{
            position: "absolute",
            left: `${coord.x * 100}%`,
            top:  `${coord.y * 100}%`,
            animation: arrowAnim,
            userSelect: "none",
          }}
          aria-label={`Freccia ${stimolo.direzione}`}
        >
          <Freccia
            direzione={stimolo.direzione}
            size={ARROW_FONT_SIZE}
            color="#1E40AF"
            strokeWidth={3.2}
          />
        </div>
      </div>

      {/* ── Pulsanti risposta ──────────────────────────────────────────── */}
      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "center" }}>
        {nDirezioni === 2 ? (
          <PulsantiOrizzontali
            direzioni={direzioniPulsanti}
            errorBtn={errorBtn}
            onTap={handleTap}
            disabled={disabilitato || tappedRef.current}
          />
        ) : (
          <PulsantiCroce
            errorBtn={errorBtn}
            onTap={handleTap}
            disabled={disabilitato || tappedRef.current}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-componenti pulsanti ──────────────────────────────────────────────────

type PulsantiCommon = {
  errorBtn: SimonDirezione | null;
  onTap:    (d: SimonDirezione) => void;
  disabled: boolean;
};

function btnStyle(direzione: SimonDirezione, errorBtn: SimonDirezione | null): React.CSSProperties {
  const isError = errorBtn === direzione;
  return {
    width: 88, height: 88,
    borderRadius: "1rem",
    backgroundColor: isError ? "#DC2626" : "#2563EB",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
    transition: "background-color 100ms",
    animation: isError ? "sim-shake-btn 220ms ease-in-out" : undefined,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };
}

const BTN_ARROW_SIZE = 56;

function PulsantiOrizzontali({
  direzioni, errorBtn, onTap, disabled,
}: PulsantiCommon & { direzioni: readonly SimonDirezione[] }) {
  return (
    <div style={{ display: "flex", gap: "1.5rem" }}>
      {direzioni.map((d) => (
        <button
          key={d}
          onClick={() => onTap(d)}
          disabled={disabled}
          style={btnStyle(d, errorBtn)}
          className="active:scale-95"
          aria-label={`Risposta ${d}`}
        >
          <Freccia direzione={d} size={BTN_ARROW_SIZE} color="#FFFFFF" strokeWidth={3.2} />
        </button>
      ))}
    </div>
  );
}

function PulsantiCroce({ errorBtn, onTap, disabled }: PulsantiCommon) {
  // Layout 3x3 con pulsanti su, sx, dx, giu posizionati a croce
  const cell = { width: 88, height: 88 };
  const renderBtn = (d: SimonDirezione) => (
    <button
      onClick={() => onTap(d)}
      disabled={disabled}
      style={btnStyle(d, errorBtn)}
      className="active:scale-95"
      aria-label={`Risposta ${d}`}
    >
      <Freccia direzione={d} size={BTN_ARROW_SIZE} color="#FFFFFF" strokeWidth={3.2} />
    </button>
  );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 88px 88px",
        gridTemplateRows:    "88px 88px 88px",
        gap: "0.6rem",
      }}
    >
      <div style={cell} />
      {renderBtn("su")}
      <div style={cell} />

      {renderBtn("sx")}
      <div style={cell} />
      {renderBtn("dx")}

      <div style={cell} />
      {renderBtn("giu")}
      <div style={cell} />
    </div>
  );
}
