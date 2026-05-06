"use client";

/**
 * MemoriaListaSession — sessione 3 fasi per Memoria Lista Riconoscimento.
 *
 * Flusso:
 *   1. encoding  — mostra N item uno alla volta (speedMs ciascuno)
 *   2. delay     — BouncingBall iniettato dall'engine (delayMs)
 *   3. recognition — griglia N+M item; l'utente tocca quelli visti,
 *                    poi conferma con il tasto "Conferma"
 *
 * Chiama onRisposta({ selezionati }) al tap su Conferma,
 * o onRisposta(null) se tempoScaduto arriva durante encoding/delay.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { StimoloML, RispostaML } from "./sequence";

type Fase = "encoding" | "delay" | "recognition";

type Props = {
  stimolo:        StimoloML;
  onRisposta:     (r: RispostaML) => void;
  delayComponent: (props: { onCompleto: () => void }) => ReactNode;
  tempoScaduto:   boolean;
};

// ── Componente ─────────────────────────────────────────────────────────────────

export function MemoriaListaSession({
  stimolo,
  onRisposta,
  delayComponent,
  tempoScaduto,
}: Props) {
  const [fase,    setFase]    = useState<Fase>("encoding");
  const [encIdx,  setEncIdx]  = useState(0);
  const [selezione, setSelezione] = useState<Set<string>>(new Set());

  const completatoRef  = useRef(false);
  const cancelledRef   = useRef(false);
  const stimoloRef     = useRef(stimolo);
  const onRispostaRef  = useRef(onRisposta);
  // Ref sincrono per handleConferma (evita closure stale su selezione)
  const selezioneRef   = useRef<string[]>([]);

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });
  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });

  // ── tempoScaduto ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    cancelledRef.current  = true;
    completatoRef.current = true;
    onRispostaRef.current(null);
  }, [tempoScaduto]);

  // ── Encoding: avanza item per item ────────────────────────────────────────
  const avanzaEncoding = useCallback((idx: number) => {
    if (cancelledRef.current) return;
    setEncIdx(idx);
    setTimeout(() => {
      if (cancelledRef.current) return;
      if (idx + 1 < stimoloRef.current.items.length) {
        avanzaEncoding(idx + 1);
      } else {
        setFase("delay");
      }
    }, stimoloRef.current.speedMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reset completo su cambio stimolo ──────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    cancelledRef.current  = false;
    selezioneRef.current  = [];
    setSelezione(new Set());
    setFase("encoding");
    setEncIdx(0);
    avanzaEncoding(0);
    return () => { cancelledRef.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Delay completato ──────────────────────────────────────────────────────
  const handleDelayCompleto = useCallback(() => {
    if (cancelledRef.current) return;
    setFase("recognition");
  }, []);

  // ── Toggle selezione ──────────────────────────────────────────────────────
  const handleToggle = useCallback((id: string) => {
    setSelezione(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      selezioneRef.current = Array.from(next);
      return next;
    });
  }, []);

  // ── Conferma ──────────────────────────────────────────────────────────────
  const handleConferma = useCallback(() => {
    if (completatoRef.current) return;
    completatoRef.current = true;
    onRispostaRef.current({ selezionati: selezioneRef.current });
  }, []);

  // ── Render encoding ────────────────────────────────────────────────────────
  if (fase === "encoding") {
    const item = stimolo.items[encIdx];
    return (
      <div className="flex flex-col items-center gap-5 px-4 py-6">
        <p style={{ fontSize: "0.7rem", color: "#38BDF8", fontWeight: 700,
          letterSpacing: "0.08em" }}>
          MEMORIZZA {encIdx + 1} / {stimolo.items.length}
        </p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", minHeight: 140, borderRadius: "1.5rem",
          backgroundColor: "#F0F9FF", border: "2px solid #BAE6FD",
          padding: "1.5rem",
        }}>
          {stimolo.variante === "immagini"
            ? <span style={{ fontSize: "3.5rem", lineHeight: 1 }}>{item.emoji}</span>
            : <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1E3A5F" }}>{item.parola}</span>
          }
        </div>
      </div>
    );
  }

  // ── Render delay ───────────────────────────────────────────────────────────
  if (fase === "delay") {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-4">
        <p style={{ fontSize: "0.75rem", color: "#6B7280", textAlign: "center",
          fontWeight: 600 }}>
          Segui la pallina — poi risponderai alle domande
        </p>
        {delayComponent({ onCompleto: handleDelayCompleto })}
      </div>
    );
  }

  // ── Render recognition ─────────────────────────────────────────────────────
  const nSel = selezione.size;

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">
      {/* Intestazione */}
      <p style={{ fontSize: "0.7rem", color: "#7C3AED", fontWeight: 700,
        letterSpacing: "0.08em" }}>
        RICONOSCI • {nSel} selezionat{nSel === 1 ? "o" : "i"}
      </p>

      <p style={{ fontSize: "0.8rem", color: "#6D28D9", fontWeight: 600 }}>
        Tocca {stimolo.variante === "immagini" ? "le immagini" : "le parole"} che hai visto
      </p>

      {/* Griglia */}
      {stimolo.variante === "immagini" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.5rem",
          width: "100%",
        }}>
          {stimolo.griglia.map((item) => {
            const sel = selezione.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className="active:scale-95"
                style={{
                  position: "relative",
                  padding: "0.65rem 0",
                  borderRadius: "0.75rem",
                  fontSize: "2rem",
                  border: sel ? "2px solid #16A34A" : "2px solid #D1D5DB",
                  backgroundColor: sel ? "#F0FDF4" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "border-color 80ms, background-color 80ms",
                }}
              >
                {item.emoji}
                {sel && (
                  <span style={{
                    position: "absolute", top: 2, right: 5,
                    fontSize: "0.7rem", color: "#16A34A", fontWeight: 800,
                  }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          width: "100%",
        }}>
          {stimolo.griglia.map((item) => {
            const sel = selezione.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className="active:scale-95"
                style={{
                  padding: "0.75rem 0.5rem",
                  borderRadius: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  border: sel ? "2px solid #16A34A" : "2px solid #D1D5DB",
                  backgroundColor: sel ? "#F0FDF4" : "#FFFFFF",
                  color: sel ? "#15803D" : "#111827",
                  cursor: "pointer",
                  transition: "border-color 80ms, background-color 80ms, color 80ms",
                }}
              >
                {item.parola}
              </button>
            );
          })}
        </div>
      )}

      {/* Conferma */}
      <button
        onClick={handleConferma}
        className="active:scale-95"
        style={{
          width: "100%", padding: "0.9rem",
          borderRadius: "0.9rem", fontSize: "1rem", fontWeight: 700,
          backgroundColor: "#7C3AED", color: "#FFFFFF",
          border: "none", cursor: "pointer", marginTop: "0.25rem",
        }}
      >
        Conferma
      </button>
    </div>
  );
}
