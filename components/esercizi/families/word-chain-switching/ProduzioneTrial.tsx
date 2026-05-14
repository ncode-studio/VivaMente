"use client";

/**
 * ProduzioneTrial — UI trial Word Chain Switching modalità PRODUZIONE (lv 4+).
 *
 * L'utente produce le parole digitandole sulla tastiera QWERTY,
 * alternando le due categorie semantiche.
 *
 * Cue iniziale (2.5s): le 2 categorie da alternare.
 * Poi:
 *   - In alto: barra countdown
 *   - Mid: prompt "Scrivi un ANIMALE" che cambia ad ogni passo
 *   - Input box con la parola corrente
 *   - Tastiera QWERTY
 *   - Lista delle parole già accettate (sotto)
 *
 * Validazione locale (no API): pool statico in sequence.ts (POOL_PER_CATEGORIA).
 *   - Parola nel pool della categoria attesa → ACCETTATA
 *   - Parola già usata in questo trial → RIFIUTATA (duplicato)
 *   - Altrimenti → RIFIUTATA (non riconosciuta) + errore semantico
 *
 * Feedback su rifiuto: shake + flash rosso input + messaggio breve. Input ripulito.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  isParolaInCategoria,
  normalizzaWCS,
  type StimoloWCS_Produzione,
  type RispostaWCS,
  type WCSCat,
} from "./sequence";

const CUE_MS = 2500;

const ANIM_STYLES = `
@keyframes wcsp-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-5px); }
  40%      { transform: translateX(5px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(3px); }
}
`;

const QWERTY_ROWS: readonly (readonly string[])[] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

type Props = {
  stimolo:    StimoloWCS_Produzione;
  onRisposta: (r: RispostaWCS) => void;
};

type RejectMotivo = "non_riconosciuta" | "duplicato" | null;

export function ProduzioneTrial({ stimolo, onRisposta }: Props) {
  const [fase,      setFase]     = useState<"cue" | "risposta">("cue");
  const [pointer,   setPointer]  = useState(0);
  const [input,     setInput]    = useState("");
  const [paroleOk,  setParoleOk] = useState<string[]>([]);
  const [dispPct,   setDispPct]  = useState(100);
  const [reject,    setReject]   = useState<RejectMotivo>(null);
  const [shaking,   setShaking]  = useState(false);

  const completedRef    = useRef(false);
  const pointerRef      = useRef(0);
  const paroleOkRef     = useRef<string[]>([]);
  const paroleNormRef   = useRef<Set<string>>(new Set());
  const erroriRef       = useRef(0);
  const startTimeRef    = useRef(0);
  const onRispostaRef   = useRef(onRisposta);
  const rejectTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // ── Reset + cue + countdown ────────────────────────────────────────────────
  useEffect(() => {
    completedRef.current = false;
    pointerRef.current   = 0;
    paroleOkRef.current  = [];
    paroleNormRef.current = new Set();
    erroriRef.current    = 0;
    startTimeRef.current = 0;
    setFase("cue");
    setPointer(0);
    setInput("");
    setParoleOk([]);
    setDispPct(100);
    setReject(null);
    setShaking(false);

    let interval: ReturnType<typeof setInterval> | null = null;

    const cueTimer = setTimeout(() => {
      setFase("risposta");
      startTimeRef.current = Date.now();

      const t0     = startTimeRef.current;
      const tLimMs = stimolo.tLimMs;

      interval = setInterval(() => {
        if (completedRef.current) {
          if (interval) clearInterval(interval);
          return;
        }
        const elapsed = Date.now() - t0;
        const pct = Math.max(0, 100 - (elapsed / tLimMs) * 100);
        setDispPct(pct);
        if (elapsed >= tLimMs) {
          if (interval) clearInterval(interval);
          completedRef.current = true;
          onRispostaRef.current({
            tempoMs:          elapsed,
            errori:           erroriRef.current,
            paroleCompletate: pointerRef.current,
            totale:           stimolo.sequenzaCat.length,
          });
        }
      }, 50);
    }, CUE_MS);

    return () => {
      clearTimeout(cueTimer);
      if (interval) clearInterval(interval);
      if (rejectTimerRef.current !== null) clearTimeout(rejectTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Helpers categoria attesa ──────────────────────────────────────────────
  const catAttesa = (i: number): { cat: WCSCat; nome: string; poolKey: string } => {
    const c: WCSCat = stimolo.sequenzaCat[i];
    return c === "A"
      ? { cat: "A", nome: stimolo.nomiCategorie.A, poolKey: stimolo.catA }
      : { cat: "B", nome: stimolo.nomiCategorie.B, poolKey: stimolo.catB };
  };

  // ── Input handlers ─────────────────────────────────────────────────────────
  const locked = completedRef.current || reject !== null || fase !== "risposta";

  const handleChar = useCallback((c: string) => {
    if (locked) return;
    setInput((prev) => (prev + c).slice(0, 20));
  }, [locked]);

  const handleBackspace = useCallback(() => {
    if (locked) return;
    setInput((prev) => prev.slice(0, -1));
  }, [locked]);

  const flashReject = useCallback((motivo: RejectMotivo) => {
    setReject(motivo);
    setShaking(true);
    if (rejectTimerRef.current !== null) clearTimeout(rejectTimerRef.current);
    rejectTimerRef.current = setTimeout(() => {
      setReject(null);
      setShaking(false);
      setInput("");
    }, 900);
  }, []);

  const handleSubmit = useCallback(() => {
    if (locked) return;
    if (input.trim().length === 0) return;
    if (startTimeRef.current === 0) return;

    const parola = input.trim();
    const norm   = normalizzaWCS(parola);

    // 1. Duplicato?
    if (paroleNormRef.current.has(norm)) {
      erroriRef.current += 1;
      flashReject("duplicato");
      return;
    }

    // 2. Appartiene alla categoria attesa?
    const { poolKey } = catAttesa(pointerRef.current);
    if (!isParolaInCategoria(parola, poolKey)) {
      erroriRef.current += 1;
      flashReject("non_riconosciuta");
      return;
    }

    // ACCETTATA
    paroleNormRef.current.add(norm);
    paroleOkRef.current = [...paroleOkRef.current, parola];
    pointerRef.current += 1;

    setParoleOk([...paroleOkRef.current]);
    setPointer(pointerRef.current);
    setInput("");

    if (pointerRef.current >= stimolo.sequenzaCat.length) {
      completedRef.current = true;
      const tempoMs = Date.now() - startTimeRef.current;
      onRispostaRef.current({
        tempoMs,
        errori:           erroriRef.current,
        paroleCompletate: pointerRef.current,
        totale:           stimolo.sequenzaCat.length,
      });
    }
  }, [input, locked, stimolo, flashReject]);

  // ── Render: CUE ────────────────────────────────────────────────────────────
  const { A: nomeA, B: nomeB } = stimolo.nomiCategorie;

  if (fase === "cue") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <style>{ANIM_STYLES}</style>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 200, width: "100%",
          borderRadius: "1.5rem", backgroundColor: "#F0F9FF",
          border: "2px solid #BAE6FD", padding: "2rem 1.5rem", gap: 14,
        }}>
          <p style={{ fontSize: "0.75rem", color: "#38BDF8", fontWeight: 700,
            letterSpacing: "0.08em" }}>
            ALTERNA QUESTE CATEGORIE
          </p>
          <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0C4A6E",
            textAlign: "center", lineHeight: 1.3 }}>
            {nomeA.toUpperCase()} ↔ {nomeB.toUpperCase()}
          </p>
          <p style={{ fontSize: "0.85rem", color: "#0C4A6E", textAlign: "center",
            marginTop: 4 }}>
            Scriverai tu le parole, una alla volta.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: RISPOSTA ───────────────────────────────────────────────────────
  const inputBorder =
    reject === "non_riconosciuta" ? "#EF4444" :
    reject === "duplicato"        ? "#F59E0B" :
    "#CBD5E1";
  const inputBg =
    reject === "non_riconosciuta" ? "#FEE2E2" :
    reject === "duplicato"        ? "#FEF3C7" :
    "#F9FAFB";
  const inputColor =
    reject === "non_riconosciuta" ? "#B91C1C" :
    reject === "duplicato"        ? "#92400E" :
    "#111827";

  const submitDisabled = locked || input.trim().length === 0;

  return (
    <div className="flex flex-col items-center gap-3 px-3 py-3">
      <style>{ANIM_STYLES}</style>

      {/* Barra countdown */}
      <div style={{ width: "100%", height: 6, backgroundColor: "#E5E7EB",
        borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${dispPct}%`, height: "100%",
          backgroundColor: dispPct > 30 ? "#3B82F6" : "#EF4444",
          borderRadius: 3, transition: "width 50ms linear, background-color 200ms",
        }} />
      </div>

      {/* Input display */}
      <div style={{
        width: "100%",
        minHeight: 56,
        padding: "0.5rem 1rem",
        borderRadius: "0.85rem",
        fontSize: "1.75rem",
        fontWeight: 800,
        textAlign: "center",
        letterSpacing: "0.08em",
        border: `2px solid ${inputBorder}`,
        backgroundColor: inputBg,
        color: inputColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: shaking ? "wcsp-shake 320ms ease-in-out" : undefined,
      }}>
        {reject === "non_riconosciuta" ? "non riconosciuta" :
         reject === "duplicato"        ? "già usata" :
         input === "" ? " " : input.toUpperCase()}
      </div>

      {/* QWERTY */}
      {QWERTY_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: "0.3rem", width: "100%", justifyContent: "center" }}>
          {row.map((c) => (
            <button
              key={c}
              onClick={() => handleChar(c)}
              disabled={locked}
              className="active:scale-95"
              style={{
                flex: 1, padding: "0.85rem 0",
                borderRadius: "0.6rem",
                fontSize: "1rem", fontWeight: 800,
                border: "2px solid #D1D5DB", backgroundColor: "#FFFFFF",
                color: "#111827", cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.4rem", width: "100%" }}>
        <button
          onClick={handleBackspace}
          disabled={locked || input.length === 0}
          className={!locked && input.length > 0 ? "active:scale-95" : ""}
          style={{
            flex: 1, padding: "0.95rem 0",
            borderRadius: "0.7rem",
            fontSize: "1.25rem", fontWeight: 800,
            border: "2px solid #D1D5DB", backgroundColor: "#FFFFFF",
            color: "#111827", cursor: "pointer",
            opacity: locked || input.length === 0 ? 0.4 : 1,
          }}
        >
          ⌫
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitDisabled}
          className={!submitDisabled ? "active:scale-95" : ""}
          style={{
            flex: 2, padding: "0.95rem 0",
            borderRadius: "0.7rem",
            fontSize: "1.15rem", fontWeight: 800,
            border: "2px solid",
            borderColor:     submitDisabled ? "#D1D5DB" : "#2563EB",
            backgroundColor: submitDisabled ? "#E5E7EB" : "#3B82F6",
            color:           submitDisabled ? "#9CA3AF" : "#FFFFFF",
            cursor: submitDisabled ? "default" : "pointer",
          }}
        >
          ✓ Conferma
        </button>
      </div>

      {/* Parole già accettate */}
      {paroleOk.length > 0 && (
        <div style={{
          width: "100%",
          display: "flex", flexWrap: "wrap", gap: "0.35rem",
          marginTop: "0.25rem", justifyContent: "center",
        }}>
          {paroleOk.map((p, i) => (
            <span key={i} style={{
              fontSize: "0.75rem", fontWeight: 700,
              padding: "0.2rem 0.55rem",
              borderRadius: "0.5rem",
              border: "1.5px solid #22C55E",
              backgroundColor: "#DCFCE7",
              color: "#15803D",
            }}>
              {i + 1}. {p}
            </span>
          ))}
        </div>
      )}

      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", alignSelf: "flex-end" }}>
        {pointer} / {stimolo.sequenzaCat.length}
      </p>
    </div>
  );
}
