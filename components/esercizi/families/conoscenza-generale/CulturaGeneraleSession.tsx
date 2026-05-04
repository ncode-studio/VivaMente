"use client";

/**
 * CulturaGeneraleSession — UI per un singolo trial Conoscenza Generale.
 *
 * Mostra la domanda + 4 pulsanti opzione + barra conto alla rovescia.
 * Gestisce internamente T.Lim: chiama onRisposta(null) allo scadere,
 * oppure onRisposta(indice) alla selezione. Feedback visivo interno
 * (verde = corretto, rosso = errato + verde = corretto).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { StimoloCG, RispostaCG } from "./sequence";

type Props = {
  stimolo:    StimoloCG;
  onRisposta: (r: RispostaCG) => void;
};

type FbState = { indice: number; corretto: boolean } | null;

const FEEDBACK_MS = 700;

// ── Componente ─────────────────────────────────────────────────────────────────

export function CulturaGeneraleSession({ stimolo, onRisposta }: Props) {
  const [progressPct, setProgressPct] = useState(100);
  const [fb,          setFb]          = useState<FbState>(null);
  const [submitted,   setSubmitted]   = useState(false);

  const startMsRef = useRef(Date.now());
  const barRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const tlimRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fbRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submRef    = useRef(false);

  const finalize = useCallback((risposta: RispostaCG) => {
    if (submRef.current) return;
    submRef.current = true;
    setSubmitted(true);
    if (barRef.current)  clearInterval(barRef.current);
    if (tlimRef.current) clearTimeout(tlimRef.current);
    onRisposta(risposta);
  }, [onRisposta]);

  // Reset e avvio timer su cambio stimolo
  useEffect(() => {
    submRef.current  = false;
    setSubmitted(false);
    setFb(null);
    setProgressPct(100);
    startMsRef.current = Date.now();

    barRef.current = setInterval(() => {
      const elapsed = Date.now() - startMsRef.current;
      const pct = Math.max(0, 100 - (elapsed / stimolo.tLimMs) * 100);
      setProgressPct(pct);
    }, 50);

    tlimRef.current = setTimeout(() => {
      setProgressPct(0);
      finalize(null);
    }, stimolo.tLimMs);

    return () => {
      if (barRef.current)  clearInterval(barRef.current);
      if (tlimRef.current) clearTimeout(tlimRef.current);
      if (fbRef.current)   clearTimeout(fbRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  const handleTap = useCallback((indice: number) => {
    if (submitted || submRef.current) return;

    // Stoppa timer T.Lim e barra
    if (barRef.current)  clearInterval(barRef.current);
    if (tlimRef.current) clearTimeout(tlimRef.current);

    const corretto = indice === stimolo.indiceCor;
    setFb({ indice, corretto });

    // Dopo feedback, invia risposta
    fbRef.current = setTimeout(() => {
      finalize(indice);
    }, FEEDBACK_MS);
  }, [submitted, stimolo, finalize]);

  // ── Colori pulsante ──────────────────────────────────────────────────────────
  const getBtnStyle = (i: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
      padding: "0.9rem 1rem",
      borderRadius: "0.85rem",
      fontSize: "0.95rem",
      fontWeight: 600,
      textAlign: "left",
      border: "2px solid #D1D5DB",
      backgroundColor: "#FFFFFF",
      color: "#111827",
      cursor: fb !== null || submitted ? "default" : "pointer",
      transition: "background-color 120ms, border-color 120ms",
      lineHeight: 1.3,
    };

    if (fb === null) return base;

    if (i === stimolo.indiceCor) {
      return { ...base, backgroundColor: "#DCFCE7", borderColor: "#22C55E", color: "#15803D" };
    }
    if (i === fb.indice && !fb.corretto) {
      return { ...base, backgroundColor: "#FEE2E2", borderColor: "#EF4444", color: "#B91C1C" };
    }
    return { ...base, opacity: 0.45 };
  };

  const LETTERE = ["A", "B", "C", "D"];

  return (
    <div className="flex flex-col gap-5 px-4 py-4">

      {/* Barra T.Lim */}
      <div style={{ width: "100%", height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${progressPct}%`,
          height: "100%",
          backgroundColor: progressPct > 30 ? "#3B82F6" : "#EF4444",
          borderRadius: 3,
          transition: "width 50ms linear, background-color 200ms",
        }} />
      </div>

      {/* Domanda */}
      <div
        style={{
          padding: "1.2rem",
          borderRadius: "1rem",
          backgroundColor: "#F0F9FF",
          border: "1px solid #BAE6FD",
        }}
      >
        <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.4 }}>
          {stimolo.domanda}
        </p>
      </div>

      {/* Opzioni */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {stimolo.opzioni.map((opz, i) => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            disabled={fb !== null || submitted}
            className={fb === null && !submitted ? "active:scale-[0.98]" : ""}
            style={getBtnStyle(i)}
          >
            <span style={{ fontWeight: 800, marginRight: "0.6rem", color: "#6B7280" }}>
              {LETTERE[i]}.
            </span>
            {opz}
          </button>
        ))}
      </div>
    </div>
  );
}
