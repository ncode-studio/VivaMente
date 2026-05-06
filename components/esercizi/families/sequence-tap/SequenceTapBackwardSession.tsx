"use client";

/**
 * SequenceTapBackwardSession — UI per Parole Backward.
 *
 * Fasi:
 *   esposizione — mostra la parola per espoMs, poi transizione automatica
 *   recall      — input QWERTY: l'utente digita la parola al contrario
 *   done        — risposta inviata
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { StimoloSTBackward, RispostaST } from "./sequence";

type Props = {
  stimolo:    StimoloSTBackward;
  onRisposta: (r: RispostaST) => void;
};

type Fase = "esposizione" | "recall" | "done";

export function SequenceTapBackwardSession({ stimolo, onRisposta }: Props) {
  const [fase,       setFase]       = useState<Fase>("esposizione");
  const [inputValue, setInputValue] = useState("");

  const submittedRef  = useRef(false);
  const tLimRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef("");

  const submit = useCallback((typed: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (tLimRef.current) clearTimeout(tLimRef.current);
    setFase("done");
    onRisposta(typed.trim().split(""));
  }, [onRisposta]);

  // Transizione esposizione → recall
  useEffect(() => {
    setFase("esposizione");
    setInputValue("");
    submittedRef.current = false;
    const id = setTimeout(() => setFase("recall"), stimolo.espoMs);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // Focus automatico all'entrata in recall
  useEffect(() => {
    if (fase === "recall") setTimeout(() => inputRef.current?.focus(), 80);
  }, [fase]);

  // T.Lim: parte all'entrata in recall
  useEffect(() => {
    if (fase !== "recall") return;
    tLimRef.current = setTimeout(() => submit(inputValueRef.current), stimolo.tLimMs);
    return () => { if (tLimRef.current) clearTimeout(tLimRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const handleConferma = useCallback(() => {
    if (fase !== "recall" || !inputValue.trim()) return;
    submit(inputValue.trim());
  }, [fase, inputValue, submit]);

  if (fase === "done") return null;

  // ── Esposizione ──────────────────────────────────────────────────────────────
  if (fase === "esposizione") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-6 px-4">
        <div
          className="flex items-center justify-center w-full"
          style={{ minHeight: 160, backgroundColor: "#F9FAFB", borderRadius: "1.5rem", border: "1px solid #E5E7EB" }}
          aria-label={`Parola: ${stimolo.parola}`}
        >
          <span style={{ fontSize: "3rem", fontWeight: 800, color: "#111827", letterSpacing: "0.15em" }}>
            {stimolo.parola}
          </span>
        </div>
      </div>
    );
  }

  // ── Recall ───────────────────────────────────────────────────────────────────
  const wordLen = stimolo.targetSequence.length;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); inputValueRef.current = e.target.value; }}
        onKeyDown={(e) => { if (e.key === "Enter") handleConferma(); }}
        placeholder=""
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        maxLength={wordLen}
        style={{
          width: "100%",
          padding: "1rem",
          fontSize: "1.6rem",
          fontWeight: 700,
          borderRadius: "0.85rem",
          border: "2px solid #2563EB",
          outline: "none",
          color: "#111827",
          backgroundColor: "#FFFFFF",
          textAlign: "center",
          letterSpacing: "0.15em",
        }}
      />
      <button
        onClick={handleConferma}
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
    </div>
  );
}
