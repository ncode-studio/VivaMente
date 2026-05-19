"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StimoloSpesa, RispostaSpesa } from "./sequence";

type Fase = "lista" | "shopping";

interface Props {
  stimolo:      StimoloSpesa;
  onRisposta:   (r: RispostaSpesa) => void;
  tempoScaduto: boolean;
}

export function SpesaSession({ stimolo, onRisposta, tempoScaduto }: Props) {
  const [fase, setFase]           = useState<Fase>("lista");
  const [selezione, setSelezione] = useState<Set<string>>(new Set());
  const [msLeft, setMsLeft]       = useState<number | null>(stimolo.shoppingTimerMs);
  const [listaMsLeft, setListaMsLeft] = useState(stimolo.esposizioneMs);

  const completatoRef = useRef(false);
  const stimoloRef    = useRef(stimolo);
  const onRispostaRef = useRef(onRisposta);
  const selRef        = useRef<string[]>([]);
  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // Reset su cambio stimolo
  useEffect(() => {
    completatoRef.current = false;
    selRef.current = [];
    setSelezione(new Set());
    setFase("lista");
    setMsLeft(stimolo.shoppingTimerMs);
    setListaMsLeft(stimolo.esposizioneMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // tempoScaduto globale
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    completatoRef.current = true;
    onRispostaRef.current({ selezionati: selRef.current });
  }, [tempoScaduto]);

  // Countdown lista (auto-avanza dopo esposizioneMs)
  useEffect(() => {
    if (fase !== "lista") return;
    const start = performance.now();
    const id = setInterval(() => {
      const left = Math.max(0, stimoloRef.current.esposizioneMs - (performance.now() - start));
      setListaMsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        setFase("shopping");
      }
    }, 200);
    return () => clearInterval(id);
  }, [fase]);

  // Countdown shopping
  useEffect(() => {
    if (fase !== "shopping") return;
    const tot = stimoloRef.current.shoppingTimerMs;
    if (!tot) return;
    const start = performance.now();
    setMsLeft(tot);
    const id = setInterval(() => {
      const left = Math.max(0, tot - (performance.now() - start));
      setMsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        if (!completatoRef.current) {
          completatoRef.current = true;
          onRispostaRef.current({ selezionati: selRef.current });
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [fase]);

  const handleProsegui = useCallback(() => setFase("shopping"), []);

  const handleToggle = useCallback((id: string) => {
    setSelezione(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      selRef.current = Array.from(next);
      return next;
    });
  }, []);

  const handleConferma = useCallback(() => {
    if (completatoRef.current) return;
    completatoRef.current = true;
    onRispostaRef.current({ selezionati: selRef.current });
  }, []);

  if (fase === "lista") {
    const secs = Math.ceil(listaMsLeft / 1000);
    return (
      <div className="flex flex-col items-stretch gap-4 px-4 py-4">
        <p style={{ fontSize: "0.7rem", color: "#15803D", fontWeight: 700,
          letterSpacing: "0.08em", textAlign: "center" }}>
          MEMORIZZA LA LISTA · {secs}s
        </p>
        <div style={{
          width: "100%", borderRadius: "1.25rem",
          backgroundColor: "#F0FDF4", border: "2px solid #BBF7D0",
          padding: "1.25rem",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.6rem",
          }}>
            {stimolo.lista.map((a) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.6rem", backgroundColor: "#FFFFFF",
                borderRadius: "0.6rem", border: "1px solid #DCFCE7",
              }}>
                <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{a.emoji}</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#166534" }}>
                  {a.nome}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={handleProsegui}
          style={{
            width: "100%", padding: "0.9rem",
            borderRadius: "0.85rem", border: "none",
            backgroundColor: "#15803D", color: "#FFFFFF",
            fontSize: "1rem", fontWeight: 700, cursor: "pointer",
          }}
        >
          Ho memorizzato — Vai al supermercato
        </button>
      </div>
    );
  }

  const totTimer = stimolo.shoppingTimerMs ?? null;
  const pct      = totTimer && msLeft !== null ? (msLeft / totTimer) * 100 : null;
  const barColor = pct === null ? "#22C55E"
    : pct > 50 ? "#22C55E" : pct > 25 ? "#F59E0B" : "#EF4444";
  const nSel = selezione.size;

  return (
    <div className="flex flex-col items-stretch gap-3 px-4 py-3">
      {pct !== null && msLeft !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            flex: 1, height: 8, borderRadius: 4,
            backgroundColor: "#E2E8F0", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              backgroundColor: barColor,
              transition: "width 0.2s linear",
            }} />
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>
            {Math.ceil(msLeft / 1000)}s
          </span>
        </div>
      )}

      <p style={{ fontSize: "0.75rem", color: "#0369A1", fontWeight: 700,
        letterSpacing: "0.06em", textAlign: "center" }}>
        SUPERMERCATO · {nSel} nel carrello
      </p>
      <p style={{ fontSize: "0.85rem", color: "#475569", textAlign: "center" }}>
        Tocca tutti gli alimenti che erano nella tua lista
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.45rem",
      }}>
        {stimolo.scaffale.map((a) => {
          const sel = selezione.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() => handleToggle(a.id)}
              className="active:scale-95"
              style={{
                position: "relative",
                padding: "0.6rem 0.3rem",
                borderRadius: "0.7rem",
                fontSize: "1.85rem", lineHeight: 1,
                border: sel ? "2px solid #16A34A" : "2px solid #E5E7EB",
                backgroundColor: sel ? "#F0FDF4" : "#FFFFFF",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem",
              }}
            >
              <span>{a.emoji}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#475569" }}>
                {a.nome}
              </span>
              {sel && (
                <span style={{
                  position: "absolute", top: 2, right: 4,
                  fontSize: "0.65rem", color: "#16A34A", fontWeight: 800,
                }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConferma}
        style={{
          width: "100%", padding: "0.8rem",
          borderRadius: "0.85rem", border: "none",
          backgroundColor: "#1E3A5F", color: "#FFFFFF",
          fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
        }}
      >
        Conferma carrello
      </button>
    </div>
  );
}
