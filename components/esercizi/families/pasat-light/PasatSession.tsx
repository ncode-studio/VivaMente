"use client";

/**
 * PasatSession — UI continua per Pasat Light.
 *
 * Modalità continua: una sola lunga catena per tutta la sessione.
 *   - Fase "memorizza": viene mostrata una cifra di partenza (no risposta).
 *   - Fase "calc": appare op+cifra, l'utente digita il risultato cumulativo e conferma.
 *     - Risposta corretta → si prosegue con il nuovo risultato come somma corrente.
 *     - Risposta sbagliata o assente → reset: nuova "memorizza" con cifra nuova.
 *   - La sessione termina quando tempoScaduto diventa true.
 *
 * Riporta corretti / totali / chainMax via onFine al termine.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PLLevelConfig } from "./levels";
import {
  generaCifraIniziale,
  generaPasso,
  type PLPasso,
} from "./sequence";

export interface PasatSessionMetriche {
  corretti: number;
  totali:   number;
  chainMax: number;
}

type Props = {
  level:        PLLevelConfig;
  tempoScaduto: boolean;
  onFine:       (m: PasatSessionMetriche) => void;
};

const FEEDBACK_MS = 350;

// ── Componente ─────────────────────────────────────────────────────────────────

export function PasatSession({ level, tempoScaduto, onFine }: Props) {
  const [dispCifra,   setDispCifra]   = useState<number>(0);
  const [dispOp,      setDispOp]      = useState<PLPasso["op"] | null>(null);
  const [isMemorizza, setIsMemorizza] = useState(true);
  const [dispPct,     setDispPct]     = useState(100);
  const [inputVal,    setInputVal]    = useState("");
  const [feedback,    setFeedback]    = useState<"ok" | "ko" | null>(null);

  // Stato sessione
  const risCorrenteRef = useRef<number>(0);
  const correttiRef    = useRef(0);
  const totaliRef      = useRef(0);
  const chainCorrRef   = useRef(0);   // catena corrente di corrette
  const chainMaxRef    = useRef(0);   // catena più lunga della sessione
  const passoRef       = useRef<PLPasso | null>(null);
  const rispostaRef    = useRef<number | null>(null);

  // Timer
  const cancelledRef    = useRef(false);
  const barIntRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tempoScadutoRef = useRef(tempoScaduto);

  const onFineRef = useRef(onFine);
  useLayoutEffect(() => { onFineRef.current = onFine; });

  const rng = useRef<() => number>(Math.random).current;

  // ── Pulizia timer ──────────────────────────────────────────────────────────
  const clearTimers = () => {
    if (barIntRef.current) { clearInterval(barIntRef.current); barIntRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  // ── Fine sessione ──────────────────────────────────────────────────────────
  const terminaSessione = useCallback(() => {
    cancelledRef.current = true;
    clearTimers();
    onFineRef.current({
      corretti: correttiRef.current,
      totali:   totaliRef.current,
      chainMax: chainMaxRef.current,
    });
  }, []);

  // ── Fase "memorizza": mostra cifra iniziale, attende isiMs, poi avvia calc ─
  const avviaMemorizza = useCallback(() => {
    if (cancelledRef.current) return;
    clearTimers();

    chainCorrRef.current = 0;

    const cifra = generaCifraIniziale(rng);
    risCorrenteRef.current = cifra;
    passoRef.current   = null;
    rispostaRef.current = null;

    setIsMemorizza(true);
    setDispCifra(cifra);
    setDispOp(null);
    setInputVal("");
    setFeedback(null);
    setDispPct(100);

    const t0    = Date.now();
    const isiMs = level.isiMs;

    barIntRef.current = setInterval(() => {
      if (cancelledRef.current) { clearTimers(); return; }
      setDispPct(Math.max(0, 100 - (Date.now() - t0) / isiMs * 100));
    }, 50);

    timeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (tempoScadutoRef.current) { terminaSessione(); return; }
      avviaCalc();
    }, isiMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, terminaSessione]);

  const avviaCalcRef = useRef<() => void>(() => {});

  // ── Fase "calc": genera passo, mostra op+cifra, attende risposta ───────────
  const avviaCalc = useCallback(() => {
    if (cancelledRef.current) return;
    if (tempoScadutoRef.current) { terminaSessione(); return; }
    clearTimers();

    const passo = generaPasso(risCorrenteRef.current, level.ops, rng);
    passoRef.current    = passo;
    rispostaRef.current = null;

    setIsMemorizza(false);
    setDispCifra(passo.cifraCorr);
    setDispOp(passo.op);
    setInputVal("");
    setFeedback(null);
    setDispPct(100);

    const t0    = Date.now();
    const isiMs = level.isiMs;

    barIntRef.current = setInterval(() => {
      if (cancelledRef.current) { clearTimers(); return; }
      setDispPct(Math.max(0, 100 - (Date.now() - t0) / isiMs * 100));
    }, 50);

    timeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      // Timeout senza risposta = errore → mostra feedback breve, poi reset catena
      totaliRef.current++;
      setFeedback("ko");
      clearTimers();
      timeoutRef.current = setTimeout(() => {
        finalizzaPasso(false);
      }, FEEDBACK_MS);
    }, isiMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, terminaSessione]);

  useLayoutEffect(() => { avviaCalcRef.current = avviaCalc; });

  // ── Finalizza passo e prosegue ─────────────────────────────────────────────
  const finalizzaPasso = useCallback((corretto: boolean) => {
    if (cancelledRef.current) return;
    clearTimers();

    if (tempoScadutoRef.current) { terminaSessione(); return; }

    if (corretto) {
      const passo = passoRef.current;
      if (passo) risCorrenteRef.current = passo.risultato;
      avviaCalcRef.current();
    } else {
      avviaMemorizza();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avviaMemorizza, terminaSessione]);

  // ── Mount: avvia prima memorizza ───────────────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false;
    correttiRef.current  = 0;
    totaliRef.current    = 0;
    chainCorrRef.current = 0;
    chainMaxRef.current  = 0;
    avviaMemorizza();
    return () => {
      cancelledRef.current = true;
      clearTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Watch tempoScaduto ─────────────────────────────────────────────────────
  useEffect(() => {
    tempoScadutoRef.current = tempoScaduto;
    if (tempoScaduto && !cancelledRef.current) {
      terminaSessione();
    }
  }, [tempoScaduto, terminaSessione]);

  // ── Input handlers ─────────────────────────────────────────────────────────
  const isLocked = feedback !== null || isMemorizza || rispostaRef.current !== null;

  const handleDigit = useCallback((d: string) => {
    if (isLocked) return;
    setInputVal((prev) => (prev + d).slice(0, 4));
  }, [isLocked]);

  const handleBackspace = useCallback(() => {
    if (isLocked) return;
    setInputVal((prev) => prev.slice(0, -1));
  }, [isLocked]);

  const handleSubmit = useCallback(() => {
    if (isLocked) return;
    if (inputVal === "") return;
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    const passo = passoRef.current;
    if (!passo) return;

    rispostaRef.current = val;
    const corretto = val === passo.risultato;
    totaliRef.current++;

    if (corretto) {
      correttiRef.current++;
      chainCorrRef.current++;
      if (chainCorrRef.current > chainMaxRef.current) {
        chainMaxRef.current = chainCorrRef.current;
      }
    }
    setFeedback(corretto ? "ok" : "ko");

    clearTimers();
    timeoutRef.current = setTimeout(() => {
      finalizzaPasso(corretto);
    }, FEEDBACK_MS);
  }, [inputVal, isLocked, finalizzaPasso]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const keypadBtnStyle: React.CSSProperties = {
    padding: "1.1rem 0",
    borderRadius: "0.85rem",
    fontSize: "1.4rem",
    fontWeight: 800,
    border: "2px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    color: "#111827",
    cursor: isLocked ? "default" : "pointer",
    transition: "background-color 100ms",
    width: "100%",
  };

  const submitDisabled = isLocked || inputVal === "";
  const submitBtnStyle: React.CSSProperties = {
    ...keypadBtnStyle,
    backgroundColor: submitDisabled ? "#E5E7EB" : "#3B82F6",
    color: submitDisabled ? "#9CA3AF" : "#FFFFFF",
    borderColor: submitDisabled ? "#D1D5DB" : "#2563EB",
  };

  const inputDisplayStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 56,
    padding: "0.5rem 1rem",
    borderRadius: "0.85rem",
    fontSize: "1.75rem",
    fontWeight: 800,
    textAlign: "center",
    border: `2px solid ${feedback === "ok" ? "#22C55E" : feedback === "ko" ? "#EF4444" : "#D1D5DB"}`,
    backgroundColor: feedback === "ok" ? "#DCFCE7" : feedback === "ko" ? "#FEE2E2" : "#F9FAFB",
    color: feedback === "ok" ? "#15803D" : feedback === "ko" ? "#B91C1C" : "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">

      {/* Barra ISI */}
      <div style={{ width: "100%", height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${dispPct}%`,
          height: "100%",
          backgroundColor: dispPct > 30 ? "#3B82F6" : "#EF4444",
          borderRadius: 3,
          transition: "width 50ms linear, background-color 200ms",
        }} />
      </div>

      {/* Cifra / operazione */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          width: "100%",
          borderRadius: "1.5rem",
          backgroundColor: isMemorizza ? "#F0F9FF" : "#F5F3FF",
          border: `2px solid ${isMemorizza ? "#BAE6FD" : "#DDD6FE"}`,
        }}
      >
        <p style={{
          fontSize: "4.5rem",
          fontWeight: 900,
          color: isMemorizza ? "#0C4A6E" : "#3730A3",
          lineHeight: 1,
        }}>
          {isMemorizza ? dispCifra : `${dispOp ?? ""}${dispCifra}`}
        </p>
      </div>

      {/* Input display + tastierino (solo durante calc) */}
      {!isMemorizza && (
        <>
          <div style={inputDisplayStyle}>
            {inputVal === "" ? " " : inputVal}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", width: "100%" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleDigit(String(n))}
                disabled={isLocked}
                style={keypadBtnStyle}
                className={!isLocked ? "active:scale-95" : ""}
              >
                {n}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              disabled={isLocked || inputVal === ""}
              style={{ ...keypadBtnStyle, fontSize: "1.6rem" }}
              className={!isLocked && inputVal !== "" ? "active:scale-95" : ""}
            >
              ⌫
            </button>
            <button
              onClick={() => handleDigit("0")}
              disabled={isLocked}
              style={keypadBtnStyle}
              className={!isLocked ? "active:scale-95" : ""}
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitDisabled}
              style={submitBtnStyle}
              className={!submitDisabled ? "active:scale-95" : ""}
            >
              ✓
            </button>
          </div>
        </>
      )}

      {/* Contatore corretti/totali */}
      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", alignSelf: "flex-end" }}>
        {correttiRef.current} / {totaliRef.current}
      </p>
    </div>
  );
}
