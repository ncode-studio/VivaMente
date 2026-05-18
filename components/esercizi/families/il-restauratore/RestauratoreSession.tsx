"use client";

/**
 * RestauratoreSession — sessione "Il Restauratore" (Modello B, 3 trial).
 *
 * Flow trial:
 *   1. Mostra le due versioni del dipinto affiancate (o stacked su mobile).
 *   2. L'utente tocca le aree dove vede differenze.
 *      - Click vicino al centro di una differenza non ancora trovata → "found"
 *        (cerchio verde su entrambi i lati).
 *      - Click lontano da qualsiasi differenza → falso allarme (flash ambra
 *        attorno al punto cliccato per un attimo).
 *   3. Quando tutte le differenze sono trovate → animazione di "restauro":
 *      i dipinti si illuminano, breve pausa, poi trial successivo.
 *
 * Scoring per trial:
 *   accuratezza = found / (totale + falsiAllarmi)
 * Accuratezza di sessione = media degli accuratezza dei 3 trial.
 */

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  type RestauratoreLevelConfig,
  RESTAURATORE_TRIAL_VALUTATIVI,
  RESTAURATORE_PALETTE as PAL,
} from "./levels";
import {
  type TrialScene,
  PaintingView,
  generaTrialScene,
} from "./paintings";

type Fase = "gioco" | "restauro" | "isi";

interface Props {
  config:       RestauratoreLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
  onProgress?:  (current: number, total: number | null) => void;
}

const HIT_RADIUS = 24;   // viewBox units (200×150) — ~12% del lato per click generosi

const ANIM_CSS = `
@keyframes rest-scene-in { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes rest-shimmer  { 0%, 100% { box-shadow: 0 0 0 2px ${PAL.shimmer}, 0 0 14px rgba(242,209,136,0.55); } 50% { box-shadow: 0 0 0 4px ${PAL.shimmer}, 0 0 22px rgba(242,209,136,0.85); } }
@keyframes rest-counter-bump { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }
`;

export function RestauratoreSession({
  config, tempoScaduto, onReady, onComplete, onProgress,
}: Props) {
  const rng = useRef(Math.random);
  const configRef = useRef(config);
  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const [trialIdx, setTrialIdx] = useState(0);
  const trialIdxRef = useRef(0);
  useLayoutEffect(() => { trialIdxRef.current = trialIdx; }, [trialIdx]);

  const [scene, setScene] = useState<TrialScene | null>(null);
  const sceneRef = useRef<TrialScene | null>(null);
  useLayoutEffect(() => { sceneRef.current = scene; }, [scene]);

  const [fase, setFase] = useState<Fase>("gioco");
  const faseRef = useRef<Fase>(fase);
  useLayoutEffect(() => { faseRef.current = fase; }, [fase]);

  const [found, setFound] = useState<Set<string>>(new Set());
  const foundRef = useRef<Set<string>>(found);
  useLayoutEffect(() => { foundRef.current = found; }, [found]);

  const [falsiAllarmi, setFalsiAllarmi] = useState<number>(0);
  const [counterBumpKey, setCounterBumpKey] = useState<number>(0);
  const noHints = useMemo(() => new Set<string>(), []);

  const accCumRef = useRef(0);
  const totFoundRef = useRef(0);
  const totFalsiAllarmiRef = useRef(0);
  const totDiffRef = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });
  const onProgressRef = useRef(onProgress);
  useLayoutEffect(() => { onProgressRef.current = onProgress; });

  // ── Bootstrap primo trial ─────────────────────────────────────────────────
  useEffect(() => {
    onReady();
    const s = generaTrialScene(configRef.current, rng.current);
    setScene(s);
    setFase("gioco");
    setFound(new Set());
    setFalsiAllarmi(0);
  }, []); // eslint-disable-line

  // ── Fine sessione su tempo scaduto (fallback) ────────────────────────────
  const fineSessione = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const trialsCompletati = trialIdxRef.current;
    const acc = trialsCompletati > 0 ? accCumRef.current / trialsCompletati : 0;
    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           Math.round(acc * 100),
      metriche: {
        trial_completati:        trialsCompletati,
        differenze_trovate:      totFoundRef.current,
        differenze_totali:       totDiffRef.current,
        falsi_allarmi:           totFalsiAllarmiRef.current,
      },
    });
  }, []);

  useEffect(() => {
    if (tempoScaduto) fineSessione();
  }, [tempoScaduto, fineSessione]);

  // ── Click su un punto del dipinto (in viewBox coords) ────────────────────
  const handleClick = useCallback((_side: "A" | "B", xVB: number, yVB: number) => {
    if (faseRef.current !== "gioco") return;
    const s = sceneRef.current;
    if (!s) return;
    // Solo il dipinto "Da restaurare" (lato B) è interattivo.
    // Trova la differenza più vicina sul lato B, non ancora trovata.
    let bestId: string | null = null;
    let bestDist = HIT_RADIUS;
    for (const d of s.differences) {
      if (foundRef.current.has(d.elementId)) continue;
      const c = d.centerB;
      if (!c) continue;
      const dx = c.x - xVB;
      const dy = c.y - yVB;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; bestId = d.elementId; }
    }

    if (bestId) {
      setFound((prev) => {
        const next = new Set(prev);
        next.add(bestId!);
        return next;
      });
      setCounterBumpKey((k) => k + 1);
    } else {
      setFalsiAllarmi((n) => n + 1);
    }
  }, []);

  // ── Quando found.size raggiunge totale → fase restauro ───────────────────
  useEffect(() => {
    if (faseRef.current !== "gioco") return;
    const s = sceneRef.current;
    if (!s) return;
    if (found.size === s.differences.length && s.differences.length > 0) {
      // chiudi trial
      const totale = s.differences.length;
      const fa = falsiAllarmi;
      const acc = totale / (totale + fa);
      accCumRef.current += acc;
      totFoundRef.current += totale;
      totFalsiAllarmiRef.current += fa;
      totDiffRef.current += totale;

      setFase("restauro");
      onProgressRef.current?.(trialIdxRef.current + 1, RESTAURATORE_TRIAL_VALUTATIVI);
    }
  }, [found, falsiAllarmi]);

  // ── Restauro 1500ms → ISI → trial successivo / fine ──────────────────────
  useEffect(() => {
    if (fase !== "restauro") return;
    const t = setTimeout(() => setFase("isi"), 1500);
    return () => clearTimeout(t);
  }, [fase]);

  useEffect(() => {
    if (fase !== "isi") return;
    if (completedRef.current) return;
    const t = setTimeout(() => {
      const next = trialIdxRef.current + 1;
      if (next >= RESTAURATORE_TRIAL_VALUTATIVI) {
        if (completedRef.current) return;
        completedRef.current = true;
        const acc = accCumRef.current / RESTAURATORE_TRIAL_VALUTATIVI;
        onCompleteRef.current({
          accuratezzaValutativa: acc,
          scoreGrezzo:           Math.round(acc * 100),
          metriche: {
            trial_completati:        RESTAURATORE_TRIAL_VALUTATIVI,
            differenze_trovate:      totFoundRef.current,
            differenze_totali:       totDiffRef.current,
            falsi_allarmi:           totFalsiAllarmiRef.current,
          },
        });
        return;
      }
      setTrialIdx(next);
      setScene(generaTrialScene(configRef.current, rng.current));
      setFound(new Set());
      setFalsiAllarmi(0);
        setFase("gioco");
    }, 700);
    return () => clearTimeout(t);
  }, [fase]);

  const totale = scene?.differences.length ?? 0;
  const restaurato = fase === "restauro" || fase === "isi";

  const intestazione = useMemo(() => {
    if (!scene) return "";
    if (restaurato) return "Dipinto restaurato!";
    return "Trova le differenze";
  }, [scene, restaurato]);

  return (
    <div
      style={{
        width: "100%",
        userSelect: "none",
        background: PAL.bgDeep,
        borderRadius: "0.6rem",
        overflow: "hidden",
        border: `1px solid rgba(76,52,28,0.18)`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <style>{ANIM_CSS}</style>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.55rem 0.75rem",
        background: PAL.bg,
        borderBottom: "1px solid rgba(76,52,28,0.12)",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: RESTAURATORE_TRIAL_VALUTATIVI }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: 99,
                background:
                  i < trialIdx  ? PAL.ok :
                  i === trialIdx ? PAL.ink :
                  "rgba(58,42,24,0.18)",
              }}
            />
          ))}
        </div>

        <p style={{
          margin: 0,
          fontSize: "0.88rem",
          fontWeight: 700,
          color: PAL.ink,
          textAlign: "center",
          flex: 1,
          paddingLeft: "0.5rem",
        }}>
          {intestazione}
        </p>

        <div
          key={counterBumpKey}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            fontWeight: 700,
            color: PAL.ink,
            fontSize: "0.95rem",
            animation: counterBumpKey > 0 ? "rest-counter-bump 360ms ease-out" : undefined,
            background: "#FBF4E8",
            border: "1px solid rgba(76,52,28,0.18)",
            borderRadius: "0.4rem",
            padding: "0.15rem 0.5rem",
          }}
        >
          <span style={{ color: PAL.found }}>{found.size}</span>
          <span style={{ color: PAL.inkSoft, fontSize: "0.85rem" }}>/ {totale}</span>
        </div>
      </div>

      {/* Dipinti stacked verticali — ognuno full-width per massimizzare leggibilità */}
      {scene && (
        <div
          key={`${trialIdx}-${fase}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "0.6rem 0.6rem 0.6rem 0.6rem",
            background: PAL.bgDeep,
            animation: "rest-scene-in 320ms ease-out",
          }}
        >
          <div>
            <p style={{
              margin: "0 0 0.3rem 0",
              fontSize: "0.7rem",
              letterSpacing: "0.16em",
              color: PAL.inkSoft,
              fontWeight: 700,
              textTransform: "uppercase",
              textAlign: "center",
            }}>
              Originale · riferimento
            </p>
            <PaintingView
              background={scene.background}
              elements={scene.elementsA}
              differences={scene.differences}
              foundOnThisSide={found}
              hintIds={noHints}
              side="A"
              restaurato={restaurato}
              onClickPoint={() => {}}
              interactive={false}
              ariaLabel="Dipinto originale di riferimento (non interattivo)"
            />
          </div>
          <div>
            <p style={{
              margin: "0 0 0.3rem 0",
              fontSize: "0.72rem",
              letterSpacing: "0.16em",
              color: PAL.ink,
              fontWeight: 700,
              textTransform: "uppercase",
              textAlign: "center",
            }}>
              Da restaurare · tocca qui
            </p>
            <PaintingView
              background={scene.background}
              elements={scene.elementsB}
              differences={scene.differences}
              foundOnThisSide={found}
              hintIds={noHints}
              side="B"
              restaurato={restaurato}
              onClickPoint={(x, y) => handleClick("B", x, y)}
              interactive={fase === "gioco"}
              ariaLabel="Dipinto da restaurare"
            />
          </div>
        </div>
      )}

      {/* Footer: contatore tocchi a vuoto */}
      <div style={{
        padding: "0.55rem 0.75rem 0.75rem 0.75rem",
        background: PAL.bg,
        borderTop: "1px solid rgba(76,52,28,0.12)",
      }}>
        <p style={{
          margin: 0,
          fontSize: "0.78rem",
          color: PAL.inkSoft,
          lineHeight: 1.35,
          textAlign: "center",
        }}>
          {falsiAllarmi > 0
            ? <>Tocchi a vuoto: <strong style={{ color: PAL.hint }}>{falsiAllarmi}</strong></>
            : <>Tocca il dipinto da restaurare dove vedi qualcosa di diverso.</>}
        </p>
      </div>
    </div>
  );
}
