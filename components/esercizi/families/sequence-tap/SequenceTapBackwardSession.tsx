"use client";

/**
 * SequenceTapBackwardSession — UI per Parole Backward.
 *
 * Fasi:
 *   esposizione — mostra la parola intera per espoMs, poi transizione automatica
 *   recall      — tastiera lettere + buffer; T.Lim dal primo tap nella fase
 *   done        — risposta inviata
 *
 * Modalità tastiera:
 *   assistita — tutte le lettere della parola (occorrenze separate, uso singolo)
 *   mista_4/6 — lettere uniche + distrattori fonetici/visivi (riutilizzabili)
 *   alfabeto  — 26 lettere (riutilizzabili)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { StimoloSTBackward, RispostaST } from "./sequence";

type Props = {
  stimolo:    StimoloSTBackward;
  onRisposta: (r: RispostaST) => void;
};

type Fase = "esposizione" | "recall" | "done";

// ── Componente principale ─────────────────────────────────────────────────────

export function SequenceTapBackwardSession({ stimolo, onRisposta }: Props) {
  const [fase,         setFase]        = useState<Fase>("esposizione");
  const [buffer,       setBuffer]      = useState<string[]>([]);
  const [usedStack,    setUsedStack]   = useState<number[]>([]);

  const bufferRef    = useRef<string[]>([]);
  const submittedRef = useRef(false);
  const tLimRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submit = useCallback((tapped: string[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (tLimRef.current) clearTimeout(tLimRef.current);
    setFase("done");
    onRisposta(tapped);
  }, [onRisposta]);

  // Transizione esposizione → recall
  useEffect(() => {
    setFase("esposizione");
    bufferRef.current = [];
    setBuffer([]);
    setUsedStack([]);
    submittedRef.current = false;

    const id = setTimeout(() => setFase("recall"), stimolo.espoMs);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // T.Lim: parte quando inizia la fase recall
  useEffect(() => {
    if (fase !== "recall") return;
    tLimRef.current = setTimeout(() => submit(bufferRef.current), stimolo.tLimMs);
    return () => { if (tLimRef.current) clearTimeout(tLimRef.current); };
  }, [fase, stimolo.tLimMs, submit]);

  const isAssistita = stimolo.tasteraMode === "assistita";
  const wordLen     = stimolo.targetSequence.length;
  const usedIdxSet  = new Set(usedStack);

  const handleTap = useCallback((letter: string, idx: number) => {
    if (fase !== "recall") return;
    if (bufferRef.current.length >= wordLen) return;
    if (isAssistita && usedStack.includes(idx)) return;

    const next = [...bufferRef.current, letter];
    bufferRef.current = next;
    setBuffer(next);
    if (isAssistita) setUsedStack((prev) => [...prev, idx]);
    if (next.length >= wordLen) submit(next);
  }, [fase, wordLen, isAssistita, usedStack, submit]);

  const handleDelete = useCallback(() => {
    if (fase !== "recall" || bufferRef.current.length === 0) return;
    const next = bufferRef.current.slice(0, -1);
    bufferRef.current = next;
    setBuffer(next);
    if (isAssistita) setUsedStack((prev) => prev.slice(0, -1));
  }, [fase, isAssistita]);

  if (fase === "done") return null;

  // ── Esposizione ────────────────────────────────────────────────────────────
  if (fase === "esposizione") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-6 px-4">
        <p className="text-sm text-gray-500 text-center">Memorizza la parola</p>
        <div
          className="flex items-center justify-center w-full"
          style={{ minHeight: 160, backgroundColor: "#F9FAFB", borderRadius: "1.5rem", border: "1px solid #E5E7EB" }}
          aria-label={`Parola: ${stimolo.parola}`}
        >
          <span style={{ fontSize: "3rem", fontWeight: 800, color: "#111827", letterSpacing: "0.15em" }}>
            {stimolo.parola}
          </span>
        </div>
        <p className="text-sm text-gray-400">Poi toccala al contrario, lettera per lettera</p>
      </div>
    );
  }

  // ── Recall ─────────────────────────────────────────────────────────────────
  const slotW = Math.min(52, Math.floor(300 / wordLen));

  return (
    <div className="flex flex-col gap-4 px-4 py-4">

      {/* Slots buffer */}
      <div className="flex justify-center gap-2" aria-label="Lettere inserite">
        {Array.from({ length: wordLen }, (_, i) => (
          <div
            key={i}
            style={{
              width: slotW, height: 56,
              borderBottom: `2px solid ${buffer[i] ? "#111827" : "#D1D5DB"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 700, color: "#111827",
            }}
          >
            {buffer[i] ?? ""}
          </div>
        ))}
      </div>

      {/* Tastiera */}
      {isAssistita
        ? <AssistitaKeyboard tastiera={stimolo.tastiera} usedIdxSet={usedIdxSet} onTap={handleTap} disabled={buffer.length >= wordLen} />
        : <LetterKeyboard    tastiera={stimolo.tastiera} onTap={handleTap} disabled={buffer.length >= wordLen} />
      }

      {/* Cancella */}
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
        aria-label="Cancella ultima lettera"
      >
        ← Cancella
      </button>
    </div>
  );
}

// ── AssistitaKeyboard ─────────────────────────────────────────────────────────

function AssistitaKeyboard({
  tastiera, usedIdxSet, onTap, disabled,
}: {
  tastiera:   string[];
  usedIdxSet: Set<number>;
  onTap:      (l: string, i: number) => void;
  disabled:   boolean;
}) {
  const btnSize = Math.min(72, Math.floor(320 / Math.min(tastiera.length, 5)));
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {tastiera.map((l, i) => {
        const used = usedIdxSet.has(i);
        return (
          <button
            key={i}
            onClick={() => !disabled && !used && onTap(l, i)}
            className={used ? "" : "active:scale-95"}
            style={{
              width: btnSize, height: btnSize,
              borderRadius: "0.75rem",
              border: `1px solid ${used ? "#D1D5DB" : "#9CA3AF"}`,
              backgroundColor: used ? "#E5E7EB" : "#FFFFFF",
              fontSize: "1.6rem", fontWeight: 700,
              color: used ? "#9CA3AF" : "#111827",
              cursor: (disabled || used) ? "not-allowed" : "pointer",
              opacity: used ? 0.5 : 1,
            }}
            aria-label={`Lettera ${l}${used ? " (usata)" : ""}`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ── LetterKeyboard ────────────────────────────────────────────────────────────

function LetterKeyboard({
  tastiera, onTap, disabled,
}: {
  tastiera: string[];
  onTap:    (l: string, i: number) => void;
  disabled: boolean;
}) {
  const perRow = tastiera.length > 15 ? 6 : 4;
  const rows: string[][] = [];
  for (let i = 0; i < tastiera.length; i += perRow) {
    rows.push(tastiera.slice(i, i + perRow));
  }
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1 justify-center">
          {row.map((l, li) => {
            const idx = ri * perRow + li;
            return (
              <button
                key={idx}
                onClick={() => !disabled && onTap(l, idx)}
                className={disabled ? "" : "active:scale-95"}
                style={{
                  width: 46, height: 46,
                  borderRadius: "0.5rem",
                  border: "1px solid #D1D5DB",
                  backgroundColor: disabled ? "#F3F4F6" : "#FFFFFF",
                  fontSize: "1rem", fontWeight: 700,
                  color: disabled ? "#9CA3AF" : "#111827",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                aria-label={`Lettera ${l}`}
              >
                {l}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
