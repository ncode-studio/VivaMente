"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  StimoloCancellazione,
  RispostaCancellazione,
} from "./stimuli";

type Props = {
  stimolo:      StimoloCancellazione;
  onRisposta:   (r: RispostaCancellazione) => void;
  tempoScaduto: boolean;
};

// Tempo di preview del target (target visibile, griglia nascosta).
const PREVIEW_MS = 2500;
// Mini-timer per trial dopo che la griglia compare. Ogni trial deve
// chiudersi entro questa finestra: rende esplicita la pressione temporale.
const TRIAL_MS = 12_000;

export function CancellazioneVisivaSession({
  stimolo,
  onRisposta,
  tempoScaduto,
}: Props) {
  const [toccate, setToccate]  = useState<Set<number>>(() => new Set());
  const [fase, setFase]        = useState<"preview" | "play">("preview");
  const [trialMsLeft, setTrialMsLeft] = useState(TRIAL_MS);
  const completatoRef          = useRef(false);
  const onRispostaRef          = useRef(onRisposta);
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // ── tempoScaduto ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    completatoRef.current = true;
    onRispostaRef.current(null);
  }, [tempoScaduto]);

  // ── Reset su cambio stimolo ─────────────────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    setToccate(new Set());
    setFase("preview");
    setTrialMsLeft(TRIAL_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Fase preview → play ────────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== "preview") return;
    const id = setTimeout(() => setFase("play"), PREVIEW_MS);
    return () => clearTimeout(id);
  }, [fase]);

  // ── Mini-timer trial in fase play ─────────────────────────────────────────
  useEffect(() => {
    if (fase !== "play" || completatoRef.current) return;
    const start = performance.now();
    const id = setInterval(() => {
      const left = Math.max(0, TRIAL_MS - (performance.now() - start));
      setTrialMsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        if (!completatoRef.current) {
          completatoRef.current = true;
          setToccate(prev => {
            onRispostaRef.current({ toccate: Array.from(prev) });
            return prev;
          });
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [fase]);

  // ── Toggle cella ────────────────────────────────────────────────────────────
  const handleToggle = useCallback((i: number) => {
    if (completatoRef.current) return;
    setToccate((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  // ── Conferma ────────────────────────────────────────────────────────────────
  const handleFatto = useCallback(() => {
    if (completatoRef.current) return;
    completatoRef.current = true;
    setToccate((prev) => {
      onRispostaRef.current({ toccate: Array.from(prev) });
      return prev;
    });
  }, []);

  const emojiSize =
    stimolo.colonne <= 4 ? "2rem"
    : stimolo.colonne <= 5 ? "1.7rem"
    : "1.5rem";

  const cellH =
    stimolo.colonne <= 4 ? "5rem"
    : stimolo.colonne <= 5 ? "4.2rem"
    : "3.5rem";

  // ── Preview: target grande al centro, niente griglia ──────────────────────
  if (fase === "preview") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-10"
        style={{ minHeight: "60vh" }}>
        <p style={{
          fontSize: "0.75rem", color: "#92400E",
          fontWeight: 700, letterSpacing: "0.1em",
        }}>
          MEMORIZZA IL TARGET
        </p>
        <div style={{
          fontSize: "6rem", lineHeight: 1, padding: "1rem 2rem",
          backgroundColor: "#FEF3C7",
          border: "3px solid #FCD34D",
          borderRadius: "1.5rem",
        }}>
          {stimolo.target}
        </div>
        <p style={{ fontSize: "0.85rem", color: "#64748B" }}>
          Dovrai toccare tutti i {stimolo.target} nella griglia che apparirà
        </p>
      </div>
    );
  }

  const trialPct = (trialMsLeft / TRIAL_MS) * 100;
  const barColor = trialPct > 50 ? "#22C55E" : trialPct > 25 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">

      {/* Mini-timer trial (target NON visibile, è memorizzato) */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          flex: 1, height: 8, borderRadius: 4,
          backgroundColor: "#E2E8F0", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${trialPct}%`,
            backgroundColor: barColor,
            transition: "width 0.2s linear",
          }} />
        </div>
        <span style={{
          fontSize: "0.85rem", fontWeight: 700,
          color: trialPct < 25 ? "#EF4444" : "#475569",
          minWidth: "2.5rem", textAlign: "right",
        }}>
          {Math.ceil(trialMsLeft / 1000)}s
        </span>
      </div>

      {/* Contatore trovati (target nascosto a memoria) */}
      <p style={{
        textAlign: "center", fontSize: "0.75rem",
        color: "#64748B", fontWeight: 600,
      }}>
        Trovati: <span style={{ color: "#1E3A5F", fontSize: "1rem" }}>{toccate.size}</span>
      </p>

      {/* Griglia */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stimolo.colonne}, 1fr)`,
        gap: "0.35rem",
      }}>
        {stimolo.celle.map((emoji, i) => {
          const sel = toccate.has(i);
          return (
            <button
              key={i}
              onClick={() => handleToggle(i)}
              className="active:scale-90"
              style={{
                height: cellH,
                borderRadius: "0.7rem",
                fontSize: emojiSize,
                lineHeight: 1,
                border:          sel ? "2px solid #7C3AED" : "2px solid #E2E8F0",
                backgroundColor: sel ? "#EDE9FE"           : "#FFFFFF",
                boxShadow:       sel ? "0 0 0 2px #C4B5FD" : "none",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background-color 60ms, border-color 60ms",
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p style={{
        fontSize: "0.7rem", color: "#94A3B8",
        textAlign: "center", fontWeight: 500,
      }}>
        Tocca un'emoji per selezionarla o deselezionarla
      </p>

      {/* Conferma */}
      <button
        onClick={handleFatto}
        className="active:scale-95"
        style={{
          width: "100%", padding: "0.9rem",
          borderRadius: "0.9rem", fontSize: "1rem", fontWeight: 700,
          backgroundColor: "#1E3A5F", color: "#FFFFFF",
          border: "none", cursor: "pointer",
        }}
      >
        Fatto
      </button>
    </div>
  );
}
