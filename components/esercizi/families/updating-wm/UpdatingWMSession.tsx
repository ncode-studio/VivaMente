"use client";

/**
 * UpdatingWMSession — UI trial per Updating WM (2 varianti).
 *
 * PAROLE
 *   - Cue (2s): domanda (es. "Quale era il più GRANDE?")
 *   - Sequenza: parole una alla volta (solo testo, niente emoji né domanda).
 *   - Risposta: input testuale via tastiera QWERTY (niente domanda visibile).
 *   - Multi-round (lv 4+): dopo la risposta di un round, feedback breve poi
 *     parte il round successivo. La risposta attesa è il vincitore cumulativo
 *     considerando tutti gli stimoli mostrati nei round precedenti + il corrente.
 *
 * NUMERI
 *   - Cue (2s): regola (es. "Aggiungi 1 a ogni numero")
 *   - Sequenza: cifre una alla volta.
 *   - Risposta: tastierino numerico, solo input visibile.
 *
 * Chiama onRisposta(string[] | null) al completamento del trial.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StimoloUWM, RispostaUWM } from "./sequence";

type Fase = "cue" | "sequenza" | "risposta" | "feedback-round";

type Props = {
  stimolo:    StimoloUWM;
  onRisposta: (r: RispostaUWM) => void;
};

const CUE_MS      = 2000;
const FEEDBACK_MS = 600;

// Layout tastiera QWERTY italiana
const QWERTY_ROWS: readonly (readonly string[])[] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

// ── Componente principale ──────────────────────────────────────────────────────

export function UpdatingWMSession({ stimolo, onRisposta }: Props) {
  const [fase,        setFase]        = useState<Fase>("cue");
  const [roundIdx,    setRoundIdx]    = useState(0);
  const [seqIdx,      setSeqIdx]      = useState(0);
  const [input,       setInput]       = useState("");
  const [feedback,    setFeedback]    = useState<"ok" | "ko" | null>(null);

  const cancelledRef  = useRef(false);
  const submittedRef  = useRef(false);
  const risposteRef   = useRef<string[]>([]);
  const onRispostaRef = useRef(onRisposta);

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // ── Numero round e items per round ─────────────────────────────────────────
  const totRound = stimolo.variante === "numeri" ? 1 : stimolo.rounds.length;

  const seqItems: { testo: string; isParola: boolean }[] = (() => {
    if (stimolo.variante === "numeri") {
      return stimolo.cifre.map((c) => ({ testo: String(c), isParola: false }));
    }
    return stimolo.rounds[roundIdx]?.items.map((it) => ({
      testo: it.parola, isParola: true,
    })) ?? [];
  })();

  // ── Avanza la sequenza item per item ────────────────────────────────────────
  const avanzaSequenza = useCallback((idx: number, len: number) => {
    if (cancelledRef.current) return;

    setSeqIdx(idx);

    setTimeout(() => {
      if (cancelledRef.current) return;
      const next = idx + 1;
      if (next < len) {
        avanzaSequenza(next, len);
      } else {
        setFase("risposta");
      }
    }, stimolo.speedMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Avvio nuovo round ──────────────────────────────────────────────────────
  const avviaRound = useCallback((r: number) => {
    if (cancelledRef.current) return;
    setRoundIdx(r);
    setSeqIdx(0);
    setInput("");
    setFeedback(null);
    setFase("sequenza");

    const len = stimolo.variante === "numeri"
      ? stimolo.cifre.length
      : stimolo.rounds[r].items.length;
    avanzaSequenza(0, len);
  }, [stimolo, avanzaSequenza]);

  // ── Reset e avvio su cambio stimolo ────────────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false;
    submittedRef.current = false;
    risposteRef.current  = [];
    setFase("cue");
    setRoundIdx(0);
    setSeqIdx(0);
    setInput("");
    setFeedback(null);

    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      avviaRound(0);
    }, CUE_MS);

    return () => {
      cancelledRef.current = true;
      clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Submit risposta del round corrente ─────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (fase !== "risposta") return;
    if (input.length === 0) return;
    if (submittedRef.current) return;

    risposteRef.current.push(input);

    // Valuta correttezza locale per feedback visivo
    let corretto = false;
    if (stimolo.variante === "numeri") {
      corretto = input === stimolo.rispostaAttesa;
    } else {
      const norm = input.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
      corretto = norm === stimolo.rounds[roundIdx].rispostaAttesa;
    }
    setFeedback(corretto ? "ok" : "ko");

    const isLastRound = roundIdx + 1 >= totRound;
    // Stop al primo errore: il trial termina subito se la risposta è sbagliata
    const shouldEnd = !corretto || isLastRound;

    if (shouldEnd) {
      submittedRef.current = true;
      setTimeout(() => {
        if (cancelledRef.current) return;
        onRispostaRef.current(risposteRef.current);
      }, FEEDBACK_MS);
    } else {
      setFase("feedback-round");
      setTimeout(() => {
        if (cancelledRef.current) return;
        avviaRound(roundIdx + 1);
      }, FEEDBACK_MS);
    }
  }, [fase, input, roundIdx, stimolo, totRound, avviaRound]);

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleChar = useCallback((c: string) => {
    if (fase !== "risposta" || submittedRef.current) return;
    const maxLen = stimolo.variante === "numeri" ? 16 : 24;
    setInput((prev) => (prev + c).slice(0, maxLen));
  }, [fase, stimolo.variante]);

  const handleBackspace = useCallback(() => {
    if (fase !== "risposta" || submittedRef.current) return;
    setInput((prev) => prev.slice(0, -1));
  }, [fase]);

  // ── Render: CUE ────────────────────────────────────────────────────────────
  if (fase === "cue") {
    const testo = stimolo.variante === "numeri" ? stimolo.regola : stimolo.domanda;
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 160, width: "100%",
          borderRadius: "1.5rem", backgroundColor: "#F0F9FF",
          border: "2px solid #BAE6FD", padding: "1.5rem",
        }}>
          <p style={{ fontSize: "0.7rem", color: "#38BDF8", fontWeight: 700,
            letterSpacing: "0.08em", marginBottom: 12 }}>
            {totRound > 1 ? "RICORDA (vale per tutti i round)" : "RICORDA"}
          </p>
          <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0C4A6E",
            textAlign: "center", lineHeight: 1.4 }}>
            {testo}
          </p>
        </div>
      </div>
    );
  }

  // ── Render: SEQUENZA ───────────────────────────────────────────────────────
  if (fase === "sequenza") {
    const item = seqItems[seqIdx];
    const isNumero = !item?.isParola;
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-8">
        <p style={{ fontSize: "0.7rem", color: isNumero ? "#7C3AED" : "#059669",
          fontWeight: 600, letterSpacing: "0.08em" }}>
          {totRound > 1
            ? `Round ${roundIdx + 1}/${totRound} — ${seqIdx + 1}/${seqItems.length}`
            : `${seqIdx + 1} / ${seqItems.length}`}
        </p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", minHeight: 160, borderRadius: "1.5rem",
          backgroundColor: isNumero ? "#F5F3FF" : "#F0FDF4",
          border: `2px solid ${isNumero ? "#DDD6FE" : "#BBF7D0"}`,
        }}>
          <p style={{
            fontSize: isNumero ? "5rem" : "2.4rem",
            fontWeight: isNumero ? 900 : 800,
            color: isNumero ? "#3730A3" : "#065F46",
            textAlign: "center", lineHeight: 1.2,
            padding: isNumero ? 0 : "0 1rem",
          }}>
            {isNumero ? item?.testo : item?.testo.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  // ── Render: FEEDBACK INTER-ROUND ───────────────────────────────────────────
  if (fase === "feedback-round") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8" style={{ minHeight: 240 }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: feedback === "ok" ? "#DCFCE7" : "#FEE2E2",
          border: `3px solid ${feedback === "ok" ? "#22C55E" : "#EF4444"}`,
        }}>
          <span style={{
            fontSize: "3rem", lineHeight: 1,
            color: feedback === "ok" ? "#15803D" : "#B91C1C",
          }}>
            {feedback === "ok" ? "✓" : "✗"}
          </span>
        </div>
      </div>
    );
  }

  // ── Render: RISPOSTA ───────────────────────────────────────────────────────
  if (stimolo.variante === "numeri") {
    return <NumericKeypadRisposta
      input={input}
      onChar={handleChar}
      onBackspace={handleBackspace}
      onSubmit={handleSubmit}
    />;
  }

  return <QwertyKeyboardRisposta
    input={input}
    onChar={handleChar}
    onBackspace={handleBackspace}
    onSubmit={handleSubmit}
    showRoundLabel={totRound > 1 ? `Round ${roundIdx + 1}/${totRound}` : null}
  />;
}

// ── Sub-componenti: tastiere ───────────────────────────────────────────────────

type KeyboardProps = {
  input:        string;
  onChar:       (c: string) => void;
  onBackspace:  () => void;
  onSubmit:     () => void;
  showRoundLabel?: string | null;
};

const inputBoxStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 60,
  padding: "0.6rem 1rem",
  borderRadius: "0.85rem",
  fontSize: "1.75rem",
  fontWeight: 800,
  textAlign: "center",
  letterSpacing: "0.1em",
  border: "2px solid #D1D5DB",
  backgroundColor: "#F9FAFB",
  color: "#111827",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const submitDisabledStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "1rem 0",
  borderRadius: "0.85rem",
  fontSize: "1.3rem",
  fontWeight: 800,
  border: "2px solid",
  width: "100%",
  cursor: disabled ? "default" : "pointer",
  backgroundColor: disabled ? "#E5E7EB" : "#3B82F6",
  color:           disabled ? "#9CA3AF" : "#FFFFFF",
  borderColor:     disabled ? "#D1D5DB" : "#2563EB",
});

const keyBaseStyle: React.CSSProperties = {
  padding: "0.95rem 0",
  borderRadius: "0.7rem",
  fontSize: "1.15rem",
  fontWeight: 800,
  border: "2px solid #D1D5DB",
  backgroundColor: "#FFFFFF",
  color: "#111827",
  cursor: "pointer",
  width: "100%",
  transition: "background-color 100ms",
};

function NumericKeypadRisposta({ input, onChar, onBackspace, onSubmit }: KeyboardProps) {
  const submitDisabled = input.length === 0;
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">
      <div style={inputBoxStyle}>
        {input === "" ? " " : input}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", width: "100%" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => onChar(String(n))}
            style={keyBaseStyle}
            className="active:scale-95"
          >
            {n}
          </button>
        ))}
        <button
          onClick={onBackspace}
          disabled={input.length === 0}
          style={{ ...keyBaseStyle, fontSize: "1.45rem", opacity: input.length === 0 ? 0.4 : 1 }}
          className={input.length > 0 ? "active:scale-95" : ""}
        >
          ⌫
        </button>
        <button
          onClick={() => onChar("0")}
          style={keyBaseStyle}
          className="active:scale-95"
        >
          0
        </button>
        <button
          onClick={onSubmit}
          disabled={submitDisabled}
          style={submitDisabledStyle(submitDisabled)}
          className={!submitDisabled ? "active:scale-95" : ""}
        >
          ✓
        </button>
      </div>
    </div>
  );
}

function QwertyKeyboardRisposta({ input, onChar, onBackspace, onSubmit, showRoundLabel }: KeyboardProps) {
  const submitDisabled = input.length === 0;
  return (
    <div className="flex flex-col items-center gap-3 px-3 py-4">
      {showRoundLabel && (
        <p style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700,
          letterSpacing: "0.08em", alignSelf: "center" }}>
          {showRoundLabel}
        </p>
      )}
      <div style={inputBoxStyle}>
        {input === "" ? " " : input.toUpperCase()}
      </div>

      {QWERTY_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: "0.3rem", width: "100%", justifyContent: "center" }}>
          {row.map((c) => (
            <button
              key={c}
              onClick={() => onChar(c)}
              style={{ ...keyBaseStyle, padding: "0.85rem 0", fontSize: "1rem" }}
              className="active:scale-95"
            >
              {c}
            </button>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.4rem", width: "100%" }}>
        <button
          onClick={onBackspace}
          disabled={input.length === 0}
          style={{ ...keyBaseStyle, fontSize: "1.3rem", flex: 1, opacity: input.length === 0 ? 0.4 : 1 }}
          className={input.length > 0 ? "active:scale-95" : ""}
        >
          ⌫
        </button>
        <button
          onClick={onSubmit}
          disabled={submitDisabled}
          style={{ ...submitDisabledStyle(submitDisabled), flex: 2 }}
          className={!submitDisabled ? "active:scale-95" : ""}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
