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
import type { StimoloUWM, RispostaUWM, UWMOpzione } from "./sequence";

type Fase = "cue" | "sequenza" | "risposta" | "feedback-round" | "ponte";

type Props = {
  stimolo:    StimoloUWM;
  onRisposta: (r: RispostaUWM) => void;
};

const CUE_MS      = 2000;
const FEEDBACK_MS = 600;
const PONTE_MS    = 2800; // durata schermata-ponte tra un gruppo e l'altro

// Layout tastiera QWERTY italiana
const QWERTY_ROWS: readonly (readonly string[])[] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

// Colori neutri delle card di stimolo (parole = verde, numeri = viola).
const PAROLE_BG = "#F0FDF4", PAROLE_BORDER = "#BBF7D0", PAROLE_TEXT = "#065F46";
const NUMERI_BG = "#F5F3FF", NUMERI_BORDER = "#DDD6FE", NUMERI_TEXT = "#3730A3";

// ── Componente principale ──────────────────────────────────────────────────────

export function UpdatingWMSession({ stimolo, onRisposta }: Props) {
  const [fase,        setFase]        = useState<Fase>("cue");
  const [roundIdx,    setRoundIdx]    = useState(0);
  const [seqIdx,      setSeqIdx]      = useState(0);
  const [input,       setInput]       = useState("");
  const [feedback,    setFeedback]    = useState<"ok" | "ko" | null>(null);
  const [mcSelected,  setMcSelected]  = useState<string | null>(null);
  const [ponteAvviato, setPonteAvviato] = useState(false); // toggle per animare la barra

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
    setMcSelected(null);
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
    setMcSelected(null);

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
  const handleSubmit = useCallback((valoreEsplicito?: string) => {
    if (fase !== "risposta") return;
    const val = (valoreEsplicito ?? input).trim();
    if (val.length === 0) return;
    if (submittedRef.current) return;

    risposteRef.current.push(val);

    // Valuta correttezza locale per feedback visivo
    let corretto = false;
    if (stimolo.variante === "numeri") {
      corretto = val === stimolo.rispostaAttesa;
    } else {
      const norm = val.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
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
      // Risposta corretta su un gruppo non finale: feedback breve, poi la
      // schermata-ponte che invita a tenere a mente le parole già viste
      // (NON le rimostra: aiuto solo verbale, l'allenamento WM resta intatto).
      setFase("feedback-round");
      setTimeout(() => {
        if (cancelledRef.current) return;
        setFase("ponte");
      }, FEEDBACK_MS);
    }
  }, [fase, input, roundIdx, stimolo, totRound]);

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

  // ── Schermata-ponte: avanza da sola dopo PONTE_MS (niente pulsante) ─────────
  useEffect(() => {
    if (fase !== "ponte") { setPonteAvviato(false); return; }
    const raf = setTimeout(() => setPonteAvviato(true), 30); // innesca la barra
    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      avviaRound(roundIdx + 1);
    }, PONTE_MS);
    return () => { clearTimeout(raf); clearTimeout(t); };
  }, [fase, roundIdx, avviaRound]);

  // ── Render: CUE ────────────────────────────────────────────────────────────
  // Per la variante numeri, la regola viene mostrata SOLO all'inizio
  // dell'esercizio o quando cambia (mostraRegola viene settato dall'engine).
  // Se mostraRegola è false e siamo in cue, saltiamo direttamente.
  if (
    fase === "cue" &&
    stimolo.variante === "numeri" &&
    stimolo.mostraRegola === false
  ) {
    // Avanza subito a sequenza
    setTimeout(() => setFase("sequenza"), 0);
    return null;
  }
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
        {/* Pallini di avanzamento (sostituiscono il vecchio doppio contatore) */}
        <ProgressDots total={seqItems.length} done={seqIdx}
          color={isNumero ? "#7C3AED" : "#059669"} />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", minHeight: 160, borderRadius: "1.5rem",
          backgroundColor: isNumero ? NUMERI_BG : PAROLE_BG,
          border: `2px solid ${isNumero ? NUMERI_BORDER : PAROLE_BORDER}`,
        }}>
          <p style={{
            fontSize: isNumero ? "5rem" : "2.4rem",
            fontWeight: isNumero ? 900 : 800,
            color: isNumero ? NUMERI_TEXT : PAROLE_TEXT,
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

  // ── Render: PONTE inter-gruppo ─────────────────────────────────────────────
  // Tra un gruppo di stimoli e il successivo. Solo testo: invita a trattenere
  // le parole già viste, senza rimostrarle.
  if (fase === "ponte") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-10"
        style={{ minHeight: 280 }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "0.75rem", width: "100%",
          minHeight: 150, borderRadius: "1.5rem",
          backgroundColor: "#FFFBEB", border: "2px solid #FDE68A", padding: "1.5rem",
        }}>
          <span style={{ fontSize: "2.4rem", lineHeight: 1 }}>🧠</span>
          <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#92400E",
            textAlign: "center", lineHeight: 1.4 }}>
            Tieni ancora a mente queste parole.
          </p>
        </div>
        {/* Barra che si svuota: indica che la schermata avanza da sola */}
        <div style={{ width: "100%", height: 6, borderRadius: 3,
          backgroundColor: "#FDE68A", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3, backgroundColor: "#F59E0B",
            width: ponteAvviato ? "0%" : "100%",
            transition: `width ${PONTE_MS}ms linear`,
          }} />
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
      onSubmit={() => handleSubmit()}
    />;
  }

  // Scelta multipla (lv 1-2): sempre single round, opzioni su rounds[0].
  const opzioniMC = stimolo.risposta === "mc" ? stimolo.rounds[roundIdx].opzioni : undefined;
  if (opzioniMC) {
    return <MCRisposta
      opzioni={opzioniMC}
      selected={mcSelected}
      onSelect={(parola) => {
        if (submittedRef.current) return;
        setMcSelected(parola);
        handleSubmit(parola);
      }}
    />;
  }

  return <QwertyKeyboardRisposta
    input={input}
    onChar={handleChar}
    onBackspace={handleBackspace}
    onSubmit={() => handleSubmit()}
  />;
}

// ── Sub-componenti: tastiere ───────────────────────────────────────────────────

type KeyboardProps = {
  input:        string;
  onChar:       (c: string) => void;
  onBackspace:  () => void;
  onSubmit:     () => void;
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

function QwertyKeyboardRisposta({ input, onChar, onBackspace, onSubmit }: KeyboardProps) {
  const submitDisabled = input.length === 0;
  return (
    <div className="flex flex-col items-center gap-3 px-3 py-4">
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

// ── Pallini di avanzamento (sostituiscono il contatore "i/n") ───────────────────

function ProgressDots({ total, done, color }: { total: number; done: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: 9, height: 9, borderRadius: "50%",
          backgroundColor: i <= done ? color : "#E2E8F0",
          transition: "background-color 150ms",
        }} />
      ))}
    </div>
  );
}

// ── Risposta a scelta multipla (lv 1-2) ─────────────────────────────────────────

function MCRisposta({
  opzioni, selected, onSelect,
}: {
  opzioni:  UWMOpzione[];
  selected: string | null;
  onSelect: (parola: string) => void;
}) {
  const locked = selected !== null;
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem", width: "100%",
      }}>
        {opzioni.map((opt) => {
          const isSel = selected === opt.parola;
          return (
            <button
              key={opt.parola}
              onClick={() => onSelect(opt.parola)}
              disabled={locked}
              className={!locked ? "active:scale-95" : ""}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "0.3rem", padding: "1rem 0.5rem", borderRadius: "1rem",
                border: `2px solid ${isSel ? "#2563EB" : "#D1D5DB"}`,
                backgroundColor: isSel ? "#DBEAFE" : "#FFFFFF",
                opacity: locked && !isSel ? 0.5 : 1,
                cursor: locked ? "default" : "pointer",
                transition: "opacity 150ms, background-color 150ms",
              }}
            >
              <span style={{ fontSize: "2rem", lineHeight: 1 }}>{opt.emoji}</span>
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111827",
                textAlign: "center" }}>
                {opt.parola}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
