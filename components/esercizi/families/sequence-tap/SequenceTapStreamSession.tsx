"use client";

/**
 * SequenceTapStreamSession — UI per i 3 esercizi "stream":
 *   numeri_forward, numeri_backward, parole_forward.
 *
 * Fasi:
 *   encoding — mostra gli stimoli uno alla volta (speedMs cadauno)
 *   recall   — griglia di risposta + buffer; T.Lim opzionale
 *   done     — risposta inviata (TrialFlow mostra feedback)
 *
 * parole_forward in recall: input testuale word-by-word (tastiera nativa).
 * numeri_*: NumPad on-screen invariato.
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
  const [wordIdx,     setWordIdx]     = useState(0);
  const [inputValue,  setInputValue]  = useState("");

  const bufferRef    = useRef<string[]>([]);
  const submittedRef = useRef(false);
  const timersRef    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputRef     = useRef<HTMLInputElement>(null);

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
    setWordIdx(0);
    setInputValue("");
    submittedRef.current = false;
    setFase("encoding");

    const { sequence, speedMs } = stimolo;
    for (let i = 1; i < sequence.length; i++) {
      const id = setTimeout(() => setEncodingIdx(i), speedMs * i);
      timersRef.current.push(id);
    }
    const id = setTimeout(() => {
      setFase("recall");
    }, speedMs * sequence.length);
    timersRef.current.push(id);

    return () => timersRef.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // Focus automatico sull'input quando entriamo in recall (parole_forward)
  useEffect(() => {
    if (fase === "recall" && stimolo.mode === "parole_forward") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [fase, stimolo.mode]);

  // T.Lim: parte quando inizia la fase recall
  useEffect(() => {
    if (fase !== "recall" || stimolo.tLimMs === null) return;
    const id = setTimeout(() => submit(bufferRef.current), stimolo.tLimMs);
    return () => clearTimeout(id);
  }, [fase, stimolo.tLimMs, submit]);

  // ── Recall numeri: tap su NumPad ─────────────────────────────────────────────
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

  // ── Recall parole: conferma singola parola ───────────────────────────────────
  const handleConfermaParola = useCallback(() => {
    if (fase !== "recall") return;
    const word = inputValue.trim();
    if (!word) return;
    const next = [...bufferRef.current, word];
    bufferRef.current = next;
    setBuffer(next);
    setInputValue("");
    const nextIdx = wordIdx + 1;
    setWordIdx(nextIdx);
    if (next.length >= stimolo.sequence.length) {
      submit(next);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [fase, inputValue, wordIdx, stimolo.sequence.length, submit]);

  if (fase === "done") return null;

  // ── Encoding ─────────────────────────────────────────────────────────────────
  if (fase === "encoding") {
    const item   = stimolo.sequence[encodingIdx];
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
          style={{
            minHeight: 180,
            backgroundColor: "#F9FAFB",
            borderRadius: "1.5rem",
            border: "1px solid #E5E7EB",
          }}
          aria-live="polite"
          aria-label={`Stimolo: ${item}`}
        >
          <span style={{
            fontSize: isWord ? "2.2rem" : "4rem",
            fontWeight: 800,
            color: "#111827",
            letterSpacing: isWord ? "0.02em" : "0.1em",
          }}>
            {item}
          </span>
        </div>
      </div>
    );
  }

  // ── Recall parole_forward: input testuale word-by-word ───────────────────────
  if (stimolo.mode === "parole_forward") {
    const seqLen  = stimolo.sequence.length;
    const isFull  = wordIdx >= seqLen;

    return (
      <div className="flex flex-col gap-4 px-4 py-4">

        {/* Indicatore progresso + input */}
        {!isFull && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfermaParola(); }}
              placeholder=""
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.3rem",
                fontWeight: 600,
                borderRadius: "0.85rem",
                border: "2px solid #2563EB",
                outline: "none",
                color: "#111827",
                backgroundColor: "#FFFFFF",
                textAlign: "center",
              }}
            />
            <button
              onClick={handleConfermaParola}
              disabled={!inputValue.trim()}
              className="active:scale-95"
              style={{
                width: "100%",
                padding: "0.9rem",
                borderRadius: "0.9rem",
                fontSize: "1rem",
                fontWeight: 700,
                backgroundColor: inputValue.trim() ? "#1E3A5F" : "#CBD5E1",
                color: inputValue.trim() ? "#FFFFFF" : "#94A3B8",
                border: "none",
                cursor: inputValue.trim() ? "pointer" : "not-allowed",
              }}
            >
              Conferma
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Recall numeri_forward / numeri_backward: NumPad ──────────────────────────
  const isFull = buffer.length >= stimolo.sequence.length;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div
        className="flex items-center justify-center gap-2 rounded-xl border px-4"
        style={{ minHeight: 64, backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" }}
        aria-label="Risposte inserite"
      >
        {buffer.length === 0 ? null : (
          <div className="flex flex-wrap gap-2 justify-center">
            {buffer.map((item, i) => (
              <span key={i} style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <NumPad onTap={handleTap} disabled={isFull} />

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
