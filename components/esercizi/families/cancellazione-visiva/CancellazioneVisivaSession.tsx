"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  StimoloCancellazione,
  RispostaCancellazione,
} from "./stimuli";

type Props = {
  stimolo:      StimoloCancellazione;
  onRisposta:   (r: RispostaCancellazione) => void;
  tempoScaduto: boolean;
};

export function CancellazioneVisivaSession({
  stimolo,
  onRisposta,
  tempoScaduto,
}: Props) {
  const [toccate, setToccate]  = useState<Set<number>>(() => new Set());
  const completatoRef          = useRef(false);
  const onRispostaRef          = useRef(onRisposta);
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // ── tempoScaduto ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    completatoRef.current = true;
    onRispostaRef.current(null);
  }, [tempoScaduto]);

  // ── Reset su cambio stimolo ─────────────────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    setToccate(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Toggle cella ────────────────────────────────────────────────────────────
  const handleToggle = useCallback((i: number) => {
    if (completatoRef.current) return;
    setToccate((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  // ── Conferma ────────────────────────────────────────────────────────────────
  const handleFatto = useCallback(() => {
    if (completatoRef.current) return;
    completatoRef.current = true;
    setToccate((prev) => {
      onRispostaRef.current({ toccate: Array.from(prev) });
      return prev;
    });
  }, []);

  const emojiSize =
    stimolo.colonne <= 4 ? "2rem"
    : stimolo.colonne <= 5 ? "1.7rem"
    : "1.5rem";

  const cellH =
    stimolo.colonne <= 4 ? "5rem"
    : stimolo.colonne <= 5 ? "4.2rem"
    : "3.5rem";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">

      {/* Banner target */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.75rem 1.25rem",
        backgroundColor: "#FEF3C7",
        borderRadius: "1rem",
        border: "2px solid #FCD34D",
      }}>
        <span style={{
          fontSize: "0.65rem", color: "#92400E",
          fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0,
        }}>
          TROVA TUTTI
        </span>
        <span style={{ fontSize: "2.4rem", lineHeight: 1, flexShrink: 0 }}>
          {stimolo.target}
        </span>
        <span style={{
          fontSize: "0.7rem", color: "#B45309",
          fontWeight: 600, marginLeft: "auto",
        }}>
          trovati: {toccate.size}
        </span>
      </div>

      {/* Griglia */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stimolo.colonne}, 1fr)`,
        gap: "0.35rem",
      }}>
        {stimolo.celle.map((emoji, i) => {
          const sel = toccate.has(i);
          return (
            <button
              key={i}
              onClick={() => handleToggle(i)}
              className="active:scale-90"
              style={{
                height: cellH,
                borderRadius: "0.7rem",
                fontSize: emojiSize,
                lineHeight: 1,
                border:          sel ? "2px solid #7C3AED" : "2px solid #E2E8F0",
                backgroundColor: sel ? "#EDE9FE"           : "#FFFFFF",
                boxShadow:       sel ? "0 0 0 2px #C4B5FD" : "none",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background-color 60ms, border-color 60ms",
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p style={{
        fontSize: "0.7rem", color: "#94A3B8",
        textAlign: "center", fontWeight: 500,
      }}>
        Tocca un'emoji per selezionarla o deselezionarla
      </p>

      {/* Conferma */}
      <button
        onClick={handleFatto}
        className="active:scale-95"
        style={{
          width: "100%", padding: "0.9rem",
          borderRadius: "0.9rem", fontSize: "1rem", fontWeight: 700,
          backgroundColor: "#1E3A5F", color: "#FFFFFF",
          border: "none", cursor: "pointer",
        }}
      >
        Fatto
      </button>
    </div>
  );
}
