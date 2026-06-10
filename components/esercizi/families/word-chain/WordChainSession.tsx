"use client";

/**
 * WordChainSession — UI trial per Word Chain Alfabetico.
 *
 * L'utente vede una griglia di parole in ordine casuale.
 * Deve tapparle in sequenza alfabetica (per lettera iniziale).
 *   • Tap corretto: parola si colora di verde e mostra numero d'ordine.
 *   • Tap sbagliato: la parola lampeggia di rosso e l'errore viene contato
 *     (#10). Il tempo perso nel tap sbagliato è la penalità naturale, dato
 *     che la promozione è a tempo.
 *
 * Gestisce internamente il countdown (tLimMs).
 * Chiama onRisposta({ tempoMs }) al completamento o onRisposta(null) a timeout.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StimoloWC, RispostaWC } from "./sequence";
import type { LetteraIT } from "./words";

type Props = {
  stimolo:    StimoloWC;
  onRisposta: (r: RispostaWC) => void;
};

// ── Componente ─────────────────────────────────────────────────────────────────

export function WordChainSession({ stimolo, onRisposta }: Props) {
  const [ordine,   setOrdine]   = useState<Partial<Record<LetteraIT, number>>>({});
  const [dispPct,  setDispPct]  = useState(100);
  const [flashErrato, setFlashErrato] = useState<LetteraIT | null>(null);

  const completedRef  = useRef(false);
  const pointerRef    = useRef(0);
  const ordineRef     = useRef<Partial<Record<LetteraIT, number>>>({});
  const erroriRef     = useRef(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef  = useRef(0);
  const stimoloRef    = useRef(stimolo);
  const onRispostaRef = useRef(onRisposta);

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });
  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });

  // ── Reset e avvio countdown ────────────────────────────────────────────────
  useEffect(() => {
    completedRef.current = false;
    pointerRef.current   = 0;
    ordineRef.current    = {};
    erroriRef.current    = 0;
    startTimeRef.current = Date.now();
    setOrdine({});
    setDispPct(100);
    setFlashErrato(null);

    const t0     = Date.now();
    const tLimMs = stimolo.tLimMs;

    const interval = setInterval(() => {
      if (completedRef.current) { clearInterval(interval); return; }
      const elapsed = Date.now() - t0;
      const pct = Math.max(0, 100 - (elapsed / tLimMs) * 100);
      setDispPct(pct);
      if (elapsed >= tLimMs) {
        clearInterval(interval);
        completedRef.current = true;
        onRispostaRef.current(null);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Tap parola ─────────────────────────────────────────────────────────────
  const handleTap = useCallback((lettera: LetteraIT) => {
    if (completedRef.current) return;
    const s = stimoloRef.current;
    const expected = s.sequenza[pointerRef.current];
    if (lettera !== expected) {
      // #10: tap sbagliato cliccabile → lampeggio rosso + conteggio errore.
      // Il tempo speso è la penalità (la promozione è a tempo).
      if (ordineRef.current[lettera] !== undefined) return; // già completata: ignora
      erroriRef.current++;
      setFlashErrato(lettera);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashErrato(null), 350);
      return;
    }

    const newOrdine = { ...ordineRef.current, [lettera]: pointerRef.current + 1 };
    ordineRef.current = newOrdine;
    pointerRef.current++;
    setOrdine({ ...newOrdine });

    if (pointerRef.current >= s.sequenza.length) {
      completedRef.current = true;
      const tempoMs = Date.now() - startTimeRef.current;
      onRispostaRef.current({ tempoMs, errori: erroriRef.current });
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">

      {/* Barra countdown */}
      <div style={{ width: "100%", height: 6, backgroundColor: "#E5E7EB",
        borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${dispPct}%`, height: "100%",
          backgroundColor: dispPct > 30 ? "#3B82F6" : "#EF4444",
          borderRadius: 3, transition: "width 50ms linear, background-color 200ms",
        }} />
      </div>

      {/* Istruzione */}
      <p style={{ fontSize: "0.75rem", color: "#6B7280", textAlign: "center" }}>
        Tocca le parole in ordine alfabetico (A → B → C…)
      </p>

      {/* Griglia parole */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0.6rem", width: "100%",
      }}>
        {stimolo.parole.map((p) => {
          const tapped = ordine[p.lettera] !== undefined;
          const num    = ordine[p.lettera];
          const errato = flashErrato === p.lettera;
          return (
            <button
              key={p.lettera}
              onClick={() => handleTap(p.lettera)}
              disabled={tapped}
              className={!tapped ? "active:scale-95" : ""}
              style={{
                position: "relative",
                padding: "0.85rem 0.5rem",
                borderRadius: "0.85rem",
                fontSize: "1.1rem",
                fontWeight: 700,
                border: `2px solid ${tapped ? "#22C55E" : errato ? "#EF4444" : "#D1D5DB"}`,
                backgroundColor: tapped ? "#DCFCE7" : errato ? "#FEE2E2" : "#FFFFFF",
                color: tapped ? "#15803D" : errato ? "#B91C1C" : "#111827",
                cursor: tapped ? "default" : "pointer",
                transition: "background-color 150ms, border-color 150ms",
                textAlign: "center",
              }}
            >
              {p.parola}
              {tapped && num !== undefined && (
                <span style={{
                  position: "absolute", top: -8, right: -8,
                  width: 22, height: 22, borderRadius: "50%",
                  backgroundColor: "#16A34A", color: "#FFFFFF",
                  fontSize: "0.7rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {num}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progresso tap */}
      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", alignSelf: "flex-end" }}>
        {Object.keys(ordine).length} / {stimolo.sequenza.length}
      </p>
    </div>
  );
}
