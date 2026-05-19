"use client";

/**
 * BouncingBall — distrattore Go/No-Go con pallina rimbalzante.
 *
 * La pallina cambia colore a intervalli irregolari (1.5–3s).
 * L'utente deve toccare lo stage SOLO quando la pallina è rossa (target).
 * Toccare durante altri colori è un falso allarme.
 *
 * Metriche raccolte e restituite via onDistrattoreMetriche al termine:
 *   hits         — tap corretti durante finestre target
 *   misses       — finestre target senza tap
 *   falseAlarms  — tap durante finestre non-target
 *
 * Fisica: loop RAF con mutazione DOM diretta (no re-render per posizione).
 * Colore: aggiornato direttamente su pallaRef.style + setState per il re-render
 * dell'indicatore istruzione (cambio ~1/2s, accettabile).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  PALLA_DIAMETRO_PX,
  PALLA_VELOCITA_PX_MS,
  STAGE_COLORE,
  COUNTDOWN_COLORE,
  TARGET_COLOR,
  NON_TARGET_COLORS,
  TARGET_RATIO,
  COLOR_WINDOW_MIN_MS,
  COLOR_WINDOW_MAX_MS,
} from "./costanti";

// ── Props ─────────────────────────────────────────────────────────────────────

export type BouncingBallProps = {
  durataMs: number;
  onCompleto: () => void;
  mostraCountdown?: boolean;
  onDistrattoreMetriche?: (hits: number, misses: number, falseAlarms: number) => void;
};

// ── Componente ────────────────────────────────────────────────────────────────

export function BouncingBall({
  durataMs,
  onCompleto,
  mostraCountdown = true,
  onDistrattoreMetriche,
}: BouncingBallProps) {

  // ── Refs fisici (mutati senza re-render) ─────────────────────────────────
  const stageRef      = useRef<HTMLDivElement>(null);
  const pallaRef      = useRef<HTMLDivElement>(null);
  const posRef        = useRef({ x: 0, y: 0 });
  const velRef        = useRef({ vx: 0, vy: 0 });
  const rafRef        = useRef<number | null>(null);
  const finalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completatoRef = useRef(false);
  const startedAtRef  = useRef(0);

  // ── Refs Go/No-Go ─────────────────────────────────────────────────────────
  const coloreCorrenteRef = useRef<string>(NON_TARGET_COLORS[0]);
  const tapInWindowRef    = useRef(false);
  const hitsRef           = useRef(0);
  const missesRef         = useRef(0);
  const falseAlarmsRef    = useRef(0);
  const tapFlashRef       = useRef(false);

  // ── State (re-render solo al cambio colore ~1/2s e countdown 1Hz) ─────────
  const [coloreCorrente, setColoreCorrente] = useState<string>(NON_TARGET_COLORS[0]);
  const [tickNow, setTickNow]               = useState(() => performance.now());
  const [mostraIstruzione, setMostraIstruzione] = useState(true);
  // Burst attivo quando l'utente colpisce un target: la pallina "esplode"
  // (overlay raggi) e si nasconde brevemente prima di riapparire con un
  // colore non-target. Rende il distrattore meno passivo.
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const burstIdRef = useRef(0);

  // ── Loop RAF + timer finale + Go/No-Go (mount-only) ──────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const w = stage.clientWidth;
    const h = stage.clientHeight;
    posRef.current = { x: w / 2, y: h / 2 };
    const angolo = Math.random() * Math.PI * 2;
    velRef.current = {
      vx: Math.cos(angolo) * PALLA_VELOCITA_PX_MS,
      vy: Math.sin(angolo) * PALLA_VELOCITA_PX_MS,
    };
    startedAtRef.current = performance.now();
    let lastT = startedAtRef.current;

    // ── Fisica RAF ──────────────────────────────────────────────────────────
    const loop = (now: number) => {
      const dt = now - lastT;
      lastT = now;
      const r = PALLA_DIAMETRO_PX / 2;
      posRef.current.x += velRef.current.vx * dt;
      posRef.current.y += velRef.current.vy * dt;
      if (posRef.current.x - r < 0) { posRef.current.x = r; velRef.current.vx = Math.abs(velRef.current.vx); }
      if (posRef.current.x + r > w) { posRef.current.x = w - r; velRef.current.vx = -Math.abs(velRef.current.vx); }
      if (posRef.current.y - r < 0) { posRef.current.y = r; velRef.current.vy = Math.abs(velRef.current.vy); }
      if (posRef.current.y + r > h) { posRef.current.y = h - r; velRef.current.vy = -Math.abs(velRef.current.vy); }
      if (pallaRef.current) {
        const scale = tapFlashRef.current ? " scale(1.45)" : "";
        pallaRef.current.style.transform = `translate3d(${posRef.current.x - r}px, ${posRef.current.y - r}px, 0)${scale}`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // ── Go/No-Go: catena di setTimeout per cambi colore ─────────────────────
    let colorTimeout: ReturnType<typeof setTimeout> | null = null;

    const pickNext = (): string => {
      if (Math.random() < TARGET_RATIO) return TARGET_COLOR;
      const others = NON_TARGET_COLORS.filter(c => c !== coloreCorrenteRef.current);
      return others[Math.floor(Math.random() * others.length)];
    };

    const scheduleNext = () => {
      const delay = COLOR_WINDOW_MIN_MS + Math.random() * (COLOR_WINDOW_MAX_MS - COLOR_WINDOW_MIN_MS);
      colorTimeout = setTimeout(() => {
        if (completatoRef.current) return;
        // Finestra chiusa: controlla miss
        if (coloreCorrenteRef.current === TARGET_COLOR && !tapInWindowRef.current) {
          missesRef.current++;
        }
        tapInWindowRef.current = false;
        const next = pickNext();
        coloreCorrenteRef.current = next;
        setColoreCorrente(next);
        if (pallaRef.current) pallaRef.current.style.backgroundColor = next;
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    // ── Timer fine delay ─────────────────────────────────────────────────────
    finalTimerRef.current = setTimeout(() => {
      if (completatoRef.current) return;
      completatoRef.current = true;
      if (colorTimeout) clearTimeout(colorTimeout);
      // Ultima finestra: controlla miss
      if (coloreCorrenteRef.current === TARGET_COLOR && !tapInWindowRef.current) {
        missesRef.current++;
      }
      onDistrattoreMetriche?.(hitsRef.current, missesRef.current, falseAlarmsRef.current);
      onCompleto();
    }, durataMs);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (finalTimerRef.current !== null) clearTimeout(finalTimerRef.current);
      if (colorTimeout) clearTimeout(colorTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-hide istruzione dopo 2.5s ───────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setMostraIstruzione(false), 2500);
    return () => clearTimeout(id);
  }, []);

  // ── Tick countdown 1 Hz ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mostraCountdown) return;
    const id = setInterval(() => setTickNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, [mostraCountdown]);

  // ── Handler tap ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (completatoRef.current) return;
    if (coloreCorrenteRef.current === TARGET_COLOR) {
      hitsRef.current++;
      tapInWindowRef.current = true;
      // Esplosione: burst alla posizione corrente, pallina sparisce ~300ms,
      // poi rinasce con un colore non-target. La finestra target viene
      // consumata immediatamente (no doppio hit).
      setBurst({
        x: posRef.current.x,
        y: posRef.current.y,
        id: burstIdRef.current++,
      });
      // Nascondi pallina e cambia colore subito.
      if (pallaRef.current) {
        pallaRef.current.style.opacity = "0";
      }
      const nonTarget = NON_TARGET_COLORS[Math.floor(Math.random() * NON_TARGET_COLORS.length)];
      coloreCorrenteRef.current = nonTarget;
      setColoreCorrente(nonTarget);
      setTimeout(() => {
        if (completatoRef.current) return;
        // Riposiziona random e ri-mostra la pallina.
        const stage = stageRef.current;
        if (stage) {
          const r = PALLA_DIAMETRO_PX / 2;
          posRef.current.x = r + Math.random() * (stage.clientWidth  - 2 * r);
          posRef.current.y = r + Math.random() * (stage.clientHeight - 2 * r);
        }
        if (pallaRef.current) {
          pallaRef.current.style.backgroundColor = nonTarget;
          pallaRef.current.style.opacity = "1";
        }
        setBurst(null);
      }, 320);
      return;
    }
    falseAlarmsRef.current++;
    // Scale flash via RAF ref (nessun re-render)
    tapFlashRef.current = true;
    setTimeout(() => { tapFlashRef.current = false; }, 200);
  }, []);

  // ── Countdown ────────────────────────────────────────────────────────────
  const residuoMs  = Math.max(0, durataMs - Math.max(0, tickNow - startedAtRef.current));
  const totSec     = Math.ceil(residuoMs / 1000);
  const mm         = Math.floor(totSec / 60);
  const ss         = totSec % 60;
  const countdown  = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const isTarget = coloreCorrente === TARGET_COLOR;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>

      {/* Istruzione Go/No-Go: visibile solo all'arrivo, scompare dopo 2.5s */}
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             "0.5rem",
        padding:         "0.5rem 1rem",
        backgroundColor: "#FEF2F2",
        borderRadius:    "0.75rem",
        border:          "1px solid #FECACA",
        opacity:         mostraIstruzione ? 1 : 0,
        transition:      "opacity 0.4s ease",
        pointerEvents:   "none",
      }}>
        <span style={{ fontSize: "0.85rem", color: "#6B7280", fontWeight: 500 }}>
          Tocca quando è
        </span>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          backgroundColor: TARGET_COLOR,
          flexShrink: 0,
          boxShadow: "0 0 0 2px #fff, 0 0 0 3px " + TARGET_COLOR,
        }} />
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        onClick={handleTap}
        style={{
          position:        "relative",
          width:           "100%",
          minHeight:       "340px",
          backgroundColor: STAGE_COLORE,
          borderRadius:    "1rem",
          border:          isTarget ? `2px solid ${TARGET_COLOR}` : "1px solid #E5E7EB",
          overflow:        "hidden",
          cursor:          "pointer",
          userSelect:      "none",
          transition:      "border-color 0.15s ease",
        }}
        aria-label="Tocca quando la pallina è rossa"
        role="button"
      >
        {mostraCountdown && (
          <div style={{
            position:      "absolute",
            top:           "0.5rem",
            left:          "50%",
            transform:     "translateX(-50%)",
            color:         COUNTDOWN_COLORE,
            fontSize:      "0.875rem",
            fontFamily:    'ui-monospace, "JetBrains Mono", monospace',
            pointerEvents: "none",
          }} aria-hidden="true">
            {countdown}
          </div>
        )}
        <div
          ref={pallaRef}
          style={{
            position:        "absolute",
            width:           `${PALLA_DIAMETRO_PX}px`,
            height:          `${PALLA_DIAMETRO_PX}px`,
            borderRadius:    "50%",
            backgroundColor: NON_TARGET_COLORS[0],
            willChange:      "transform",
            pointerEvents:   "none",
            transition:      "background-color 0.12s ease, opacity 0.12s ease",
          }}
          aria-hidden="true"
        />
        {burst && (
          <div
            key={burst.id}
            style={{
              position: "absolute",
              left:  burst.x - PALLA_DIAMETRO_PX / 2,
              top:   burst.y - PALLA_DIAMETRO_PX / 2,
              width:  PALLA_DIAMETRO_PX,
              height: PALLA_DIAMETRO_PX,
              borderRadius: "50%",
              pointerEvents: "none",
              background: `radial-gradient(circle, ${TARGET_COLOR} 0%, ${TARGET_COLOR}80 40%, transparent 75%)`,
              animation: "vm-ball-burst 320ms ease-out forwards",
            }}
            aria-hidden="true"
          />
        )}
        <style>{`
          @keyframes vm-ball-burst {
            0%   { transform: scale(1);   opacity: 1; }
            60%  { transform: scale(2.4); opacity: 0.6; }
            100% { transform: scale(3.5); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
