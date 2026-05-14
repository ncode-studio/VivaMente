"use client";

/**
 * SelezioneTrial — UI trial Word Chain Switching modalità SELEZIONE (lv 1-3).
 *
 * Vengono mostrate N parole appartenenti a 2 categorie semantiche.
 * Le parole sono visualizzate con lo STESSO stile (niente colore guida).
 * L'utente le tappa alternando categoria: A → B → A → B → …
 *
 *   • Tap corretto (categoria attesa): la parola diventa verde + numero d'ordine.
 *   • Tap sbagliato: flash rosso breve (~320ms) + shake; la parola può essere ri-tappata.
 *
 * Cue iniziale (2.5s): pannello con le 2 categorie da alternare, poi griglia parole.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StimoloWCS_Selezione, RispostaWCS, WCSCat } from "./sequence";

// Stili neutri condivisi
const STYLE_NEUTRA = { bg: "#FFFFFF", border: "#CBD5E1", text: "#0F172A" };
const STYLE_OK     = { bg: "#DCFCE7", border: "#22C55E", text: "#15803D" };
const STYLE_KO     = { bg: "#FEE2E2", border: "#EF4444", text: "#B91C1C" };

const WRONG_FLASH_MS = 320;
const CUE_MS         = 2500;

const ANIM_STYLES = `
@keyframes wcs-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-5px); }
  40%      { transform: translateX(5px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(3px); }
}
`;

type Props = {
  stimolo:    StimoloWCS_Selezione;
  onRisposta: (r: RispostaWCS) => void;
};

export function SelezioneTrial({ stimolo, onRisposta }: Props) {
  const [fase,      setFase]      = useState<"cue" | "risposta">("cue");
  const [ordineMap, setOrdineMap] = useState<Record<number, number>>({});
  const [tappati,   setTappati]   = useState<Set<number>>(new Set());
  const [wrongSet,  setWrongSet]  = useState<Set<number>>(new Set());
  const [dispPct,   setDispPct]   = useState(100);
  const [pointer,   setPointer]   = useState(0);

  const completedRef  = useRef(false);
  const pointerRef    = useRef(0);
  const ordineRef     = useRef<Record<number, number>>({});
  const tappatiRef    = useRef<Set<number>>(new Set());
  const erroriRef     = useRef(0);
  const startTimeRef  = useRef(0);
  const stimoloRef    = useRef(stimolo);
  const onRispostaRef = useRef(onRisposta);
  const wrongTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });
  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });

  useEffect(() => {
    completedRef.current = false;
    pointerRef.current   = 0;
    ordineRef.current    = {};
    tappatiRef.current   = new Set();
    erroriRef.current    = 0;
    startTimeRef.current = 0;
    setFase("cue");
    setOrdineMap({});
    setTappati(new Set());
    setWrongSet(new Set());
    setDispPct(100);
    setPointer(0);

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
            totale:           stimoloRef.current.sequenzaCat.length,
          });
        }
      }, 50);
    }, CUE_MS);

    return () => {
      clearTimeout(cueTimer);
      if (interval) clearInterval(interval);
      wrongTimersRef.current.forEach((t) => clearTimeout(t));
      wrongTimersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  const handleTap = useCallback((idx: number) => {
    if (completedRef.current) return;
    if (tappatiRef.current.has(idx)) return;
    if (wrongTimersRef.current.has(idx)) return;
    if (startTimeRef.current === 0) return;

    const s      = stimoloRef.current;
    const parola = s.parole.find((p) => p.idx === idx);
    if (!parola) return;

    const expected: WCSCat = s.sequenzaCat[pointerRef.current];

    if (parola.cat !== expected) {
      erroriRef.current += 1;
      setWrongSet((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
      const t = setTimeout(() => {
        setWrongSet((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
        wrongTimersRef.current.delete(idx);
      }, WRONG_FLASH_MS);
      wrongTimersRef.current.set(idx, t);
      return;
    }

    const order = pointerRef.current + 1;
    tappatiRef.current = new Set(tappatiRef.current).add(idx);
    ordineRef.current  = { ...ordineRef.current, [idx]: order };
    pointerRef.current++;

    setTappati(new Set(tappatiRef.current));
    setOrdineMap({ ...ordineRef.current });
    setPointer(pointerRef.current);

    if (pointerRef.current >= s.sequenzaCat.length) {
      completedRef.current = true;
      const tempoMs = Date.now() - startTimeRef.current;
      onRispostaRef.current({
        tempoMs,
        errori:           erroriRef.current,
        paroleCompletate: pointerRef.current,
        totale:           s.sequenzaCat.length,
      });
    }
  }, []);

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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">
      <style>{ANIM_STYLES}</style>

      <div style={{ width: "100%", height: 6, backgroundColor: "#E5E7EB",
        borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${dispPct}%`, height: "100%",
          backgroundColor: dispPct > 30 ? "#3B82F6" : "#EF4444",
          borderRadius: 3, transition: "width 50ms linear, background-color 200ms",
        }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0.6rem", width: "100%" }}>
        {stimolo.parole.map((p) => {
          const tapped = tappati.has(p.idx);
          const wrong  = wrongSet.has(p.idx);
          const num    = ordineMap[p.idx];
          const style  =
            tapped ? STYLE_OK :
            wrong  ? STYLE_KO :
            STYLE_NEUTRA;
          return (
            <button
              key={p.idx}
              onClick={() => handleTap(p.idx)}
              disabled={tapped}
              className={!tapped && !wrong ? "active:scale-95" : ""}
              style={{
                position: "relative",
                padding: "0.85rem 0.4rem",
                borderRadius: "0.85rem",
                fontSize: "1.05rem",
                fontWeight: 700,
                border: `2px solid ${style.border}`,
                backgroundColor: style.bg,
                color: style.text,
                cursor: tapped ? "default" : "pointer",
                transition: "background-color 150ms, border-color 150ms",
                textAlign: "center",
                animation: wrong ? "wcs-shake 250ms ease-in-out" : undefined,
              }}
            >
              <span>{p.parola}</span>
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

      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", alignSelf: "flex-end" }}>
        {pointer} / {stimolo.sequenzaCat.length}
      </p>
    </div>
  );
}
