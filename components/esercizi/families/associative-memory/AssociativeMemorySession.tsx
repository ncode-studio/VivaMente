"use client";

/**
 * AssociativeMemorySession — sessione 3 fasi per Associative Memory.
 *
 * Flusso:
 *   1. encoding  — mostra N coppie una alla volta (speedMs ciascuna)
 *   2. delay     — BouncingBall iniettato dall'engine (delayMs)
 *   3. retrieval — per ogni coppia: cue + 4 opzioni MC; avanza al tap
 *
 * Chiama onRisposta({ risposte }) dopo l'ultima coppia del retrieval,
 * o onRisposta(null) se tempoScaduto arriva durante encoding/delay.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { StimoloAM, RispostaAM } from "./sequence";

type Fase = "encoding" | "delay" | "retrieval";

type Props = {
  stimolo:        StimoloAM;
  onRisposta:     (r: RispostaAM) => void;
  delayComponent: (props: { onCompleto: () => void }) => ReactNode;
  tempoScaduto:   boolean;
};

// ── Componente ─────────────────────────────────────────────────────────────────

export function AssociativeMemorySession({
  stimolo,
  onRisposta,
  delayComponent,
  tempoScaduto,
}: Props) {
  const [fase,     setFase]     = useState<Fase>("encoding");
  const [encIdx,   setEncIdx]   = useState(0);
  const [retriIdx, setRetriIdx] = useState(0);

  const completatoRef = useRef(false);
  const cancelledRef  = useRef(false);
  const risposteRef   = useRef<number[]>([]);
  const stimoloRef    = useRef(stimolo);
  const onRispostaRef = useRef(onRisposta);

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });
  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });

  // ── tempoScaduto: chiudi con null se ancora in corso ──────────────────────
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    cancelledRef.current  = true;
    completatoRef.current = true;
    onRispostaRef.current(null);
  }, [tempoScaduto]);

  // ── Encoding: avanza coppia per coppia ────────────────────────────────────
  const avanzaEncoding = useCallback((idx: number) => {
    if (cancelledRef.current) return;
    setEncIdx(idx);
    const timer = setTimeout(() => {
      if (cancelledRef.current) return;
      if (idx + 1 < stimoloRef.current.coppie.length) {
        avanzaEncoding(idx + 1);
      } else {
        setFase("delay");
      }
    }, stimoloRef.current.speedMs);
    return timer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reset completo su cambio stimolo ──────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    cancelledRef.current  = false;
    risposteRef.current   = [];
    setFase("encoding");
    setEncIdx(0);
    setRetriIdx(0);

    avanzaEncoding(0);

    return () => { cancelledRef.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Delay completato ───────────────────────────────────────────────────────
  const handleDelayCompleto = useCallback(() => {
    if (cancelledRef.current) return;
    setFase("retrieval");
    setRetriIdx(0);
  }, []);

  // ── Tap opzione MC durante retrieval ──────────────────────────────────────
  const handleTapOpzione = useCallback((optIdx: number) => {
    if (completatoRef.current) return;

    const s         = stimoloRef.current;
    const newList   = [...risposteRef.current, optIdx];
    risposteRef.current = newList;

    if (newList.length >= s.coppie.length) {
      completatoRef.current = true;
      onRispostaRef.current({ risposte: newList });
    } else {
      setRetriIdx(newList.length);
    }
  }, []);

  // ── Render encoding ────────────────────────────────────────────────────────
  if (fase === "encoding") {
    const coppia = stimolo.coppie[encIdx];
    const isEmoji = (v: string) => [...v].length <= 2 && v.charCodeAt(0) > 127;
    const renderEl = (val: string, tipo: "parola" | "emoji") =>
      tipo === "emoji" || isEmoji(val)
        ? <span style={{ fontSize: "3.5rem", lineHeight: 1 }}>{val}</span>
        : <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E3A5F" }}>{val}</span>;

    return (
      <div className="flex flex-col items-center gap-5 px-4 py-6">
        <p style={{ fontSize: "0.7rem", color: "#38BDF8", fontWeight: 700,
          letterSpacing: "0.08em" }}>
          MEMORIZZA {encIdx + 1} / {stimolo.coppie.length}
        </p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "1.5rem", width: "100%", minHeight: 140,
          borderRadius: "1.5rem", backgroundColor: "#F0F9FF",
          border: "2px solid #BAE6FD", padding: "1.5rem",
        }}>
          {renderEl(coppia.cue, coppia.cueTipo)}
          <span style={{ fontSize: "1.5rem", color: "#94A3B8" }}>↔</span>
          {renderEl(coppia.target, coppia.targetTipo)}
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

  // ── Render retrieval ───────────────────────────────────────────────────────
  const coppia  = stimolo.coppie[retriIdx];
  const isEmoji = (tipo: "parola" | "emoji") => tipo === "emoji";
  const emojiOpts = isEmoji(coppia.targetTipo);

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-4">
      {/* Progresso */}
      <p style={{ fontSize: "0.7rem", color: "#7C3AED", fontWeight: 700,
        letterSpacing: "0.08em" }}>
        DOMANDA {retriIdx + 1} / {stimolo.coppie.length}
      </p>

      {/* Cue */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", minHeight: 100, borderRadius: "1.5rem",
        backgroundColor: "#F5F3FF", border: "2px solid #DDD6FE",
        padding: "1rem",
      }}>
        {coppia.cueTipo === "emoji"
          ? <span style={{ fontSize: "3.5rem" }}>{coppia.cue}</span>
          : <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#3730A3" }}>{coppia.cue}</span>
        }
      </div>

      <p style={{ fontSize: "0.8rem", color: "#6D28D9", fontWeight: 600 }}>
        Quale era abbinato a questo?
      </p>

      {/* Opzioni MC */}
      {emojiOpts ? (
        // Griglia 2×2 per emoji
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem", width: "100%" }}>
          {coppia.opzioniMC.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleTapOpzione(i)}
              className="active:scale-95"
              style={{
                padding: "1rem 0.5rem", borderRadius: "0.85rem",
                fontSize: "2.5rem", border: "2px solid #D1D5DB",
                backgroundColor: "#FFFFFF", cursor: "pointer",
                transition: "background-color 100ms",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        // Lista verticale per parole
        <div style={{ display: "flex", flexDirection: "column",
          gap: "0.6rem", width: "100%" }}>
          {coppia.opzioniMC.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleTapOpzione(i)}
              className="active:scale-95"
              style={{
                width: "100%", padding: "0.9rem 1rem",
                borderRadius: "0.85rem", fontSize: "1.1rem", fontWeight: 700,
                border: "2px solid #D1D5DB", backgroundColor: "#FFFFFF",
                color: "#111827", cursor: "pointer",
                transition: "background-color 100ms",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
