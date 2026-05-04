"use client";

/**
 * SequenceTapStreamSession — UI per i 3 esercizi "stream":
 *   numeri_forward, numeri_backward, parole_forward.
 *
 * Fasi:
 *   encoding — mostra gli stimoli uno alla volta (speedMs cadauno)
 *   recall   — griglia di risposta + buffer; T.Lim opzionale
 *   done     — risposta inviata (TrialFlow mostra feedback)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { StimoloSTStream, RispostaST } from "./sequence";

type Props = {
  stimolo:    StimoloSTStream;
  onRisposta: (r: RispostaST) => void;
};

type Fase = "encoding" | "recall" | "done";

// ── Componente principale ─────────────────────────────────────────────────────

export function SequenceTapStreamSession({ stimolo, onRisposta }: Props) {
  const [fase,        setFase]        = useState<Fase>("encoding");
  const [encodingIdx, setEncodingIdx] = useState(0);
  const [buffer,      setBuffer]      = useState<string[]>([]);

  const bufferRef      = useRef<string[]>([]);
  const submittedRef   = useRef(false);
  const timersRef      = useRef<ReturnType<typeof setTimeout>[]>([]);

  const submit = useCallback((tapped: string[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFase("done");
    onRisposta(tapped);
  }, [onRisposta]);

  // Avanzamento stimoli durante la fase encoding
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setEncodingIdx(0);
    bufferRef.current = [];
    setBuffer([]);
    submittedRef.current = false;
    setFase("encoding");

    const { sequence, speedMs } = stimolo;
    for (let i = 1; i < sequence.length; i++) {
      const id = setTimeout(() => setEncodingIdx(i), speedMs * i);
      timersRef.current.push(id);
    }
    const id = setTimeout(() => setFase("recall"), speedMs * sequence.length);
    timersRef.current.push(id);

    return () => timersRef.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // T.Lim: parte quando inizia la fase recall
  useEffect(() => {
    if (fase !== "recall" || stimolo.tLimMs === null) return;
    const id = setTimeout(() => submit(bufferRef.current), stimolo.tLimMs);
    return () => clearTimeout(id);
  }, [fase, stimolo.tLimMs, submit]);

  const handleTap = useCallback((item: string) => {
    if (fase !== "recall") return;
    const next = [...bufferRef.current, item];
    bufferRef.current = next;
    setBuffer(next);
    if (next.length >= stimolo.sequence.length) submit(next);
  }, [fase, stimolo.sequence.length, submit]);

  const handleDelete = useCallback(() => {
    if (fase !== "recall" || bufferRef.current.length === 0) return;
    const next = bufferRef.current.slice(0, -1);
    bufferRef.current = next;
    setBuffer(next);
  }, [fase]);

  if (fase === "done") return null;

  // ── Encoding ───────────────────────────────────────────────────────────────
  if (fase === "encoding") {
    const item = stimolo.sequence[encodingIdx];
    const isWord = stimolo.mode === "parole_forward";
    return (
      <div className="flex flex-col items-center gap-5 py-6 px-4">
        <div className="flex gap-2">
          {stimolo.sequence.map((_, i) => (
            <div
              key={i}
              style={{
                width: 12, height: 12, borderRadius: "50%",
                backgroundColor: i <= encodingIdx ? "#2563EB" : "#D1D5DB",
              }}
            />
          ))}
        </div>
        <div
          className="flex items-center justify-center w-full"
          style={{ minHeight: 180, backgroundColor: "#F9FAFB", borderRadius: "1.5rem", border: "1px solid #E5E7EB" }}
          aria-live="polite"
          aria-label={`Stimolo: ${item}`}
        >
          <span style={{ fontSize: isWord ? "2.2rem" : "4rem", fontWeight: 800, color: "#111827", letterSpacing: isWord ? "0.02em" : "0.1em" }}>
            {item}
          </span>
        </div>
        <p className="text-sm text-gray-400">Memorizza la sequenza</p>
      </div>
    );
  }

  // ── Recall ─────────────────────────────────────────────────────────────────
  const isNumeri  = stimolo.mode !== "parole_forward";
  const seqLen    = stimolo.sequence.length;
  const isFull    = buffer.length >= seqLen;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">

      {/* Buffer risposte */}
      <div
        className="flex items-center justify-center gap-2 rounded-xl border px-4"
        style={{ minHeight: 64, backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" }}
        aria-label="Risposte inserite"
      >
        {buffer.length === 0 ? (
          <span className="text-gray-400 text-sm">
            {isNumeri ? "Tocca i numeri nell'ordine corretto" : "Tocca le parole nell'ordine corretto"}
          </span>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {buffer.map((item, i) => (
              <span key={i} style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Griglia risposta */}
      {isNumeri
        ? <NumPad onTap={handleTap} disabled={isFull} />
        : <ParoleGrid options={stimolo.responseOptions} onTap={handleTap} disabled={isFull} />
      }

      {/* Cancella ultimo */}
      <button
        onClick={handleDelete}
        disabled={buffer.length === 0}
        style={{
          padding: "0.7rem",
          borderRadius: "0.75rem",
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFF",
          color: "#6B7280",
          fontSize: "0.875rem",
          cursor: buffer.length === 0 ? "not-allowed" : "pointer",
          opacity: buffer.length === 0 ? 0.4 : 1,
        }}
        aria-label="Cancella ultima risposta"
      >
        ← Cancella ultimo
      </button>
    </div>
  );
}

// ── NumPad ────────────────────────────────────────────────────────────────────

const NUM_ROWS = [["1","2","3"],["4","5","6"],["7","8","9"],["0"]];

function NumPad({ onTap, disabled }: { onTap: (d: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      {NUM_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-2">
          {row.map((d) => (
            <button
              key={d}
              onClick={() => !disabled && onTap(d)}
              className="active:scale-95"
              style={{
                width: 76, height: 76,
                borderRadius: "0.75rem",
                border: "1px solid #D1D5DB",
                backgroundColor: disabled ? "#F3F4F6" : "#FFFFFF",
                fontSize: "2rem",
                fontWeight: 700,
                color: disabled ? "#9CA3AF" : "#111827",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
              aria-label={`Cifra ${d}`}
            >
              {d}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── ParoleGrid ────────────────────────────────────────────────────────────────

function ParoleGrid({
  options, onTap, disabled,
}: { options: string[]; onTap: (w: string) => void; disabled: boolean }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: options.length <= 3 ? "1fr" : "1fr 1fr" }}
    >
      {options.map((w) => (
        <button
          key={w}
          onClick={() => !disabled && onTap(w)}
          className="active:scale-95"
          style={{
            padding: "1rem 0.75rem",
            borderRadius: "0.75rem",
            border: "1px solid #D1D5DB",
            backgroundColor: disabled ? "#F3F4F6" : "#FFFFFF",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: disabled ? "#9CA3AF" : "#111827",
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "center",
          }}
          aria-label={`Parola ${w}`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
