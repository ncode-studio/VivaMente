"use client";

/**
 * CasalingaSession — sessione "La Casalinga" (Modello B, 5 trial).
 *
 * Flow trial:
 *   1. MEMO     — scena cucina con N oggetti, candela che brucia (memoMs).
 *   2. TRANSIZ. — overlay morbido 600ms con messaggio "Cosa è cambiato?".
 *   3. RECALL   — scena modificata, slot cliccabili.
 *                 L'utente tappa gli slot che ritiene cambiati e conferma.
 *   4. FEEDBACK — slot evidenziati: verde=hit, ambra=miss, rosso=falso allarme.
 *   5. ISI 700ms → trial successivo.
 *
 * Scoring per trial: jaccard = hits / (nCambiamenti + falseAlarms).
 * Accuratezza di sessione = media dei jaccard sui 5 trial.
 */

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  type CasalingaLevelConfig, type Superficie, type TipoModifica,
  CASALINGA_TRIAL_VALUTATIVI,
} from "./levels";
import {
  ALL_OBJECTS, KITCHEN_PALETTE, ObjectSprite, Candle, SurfaceFrame,
  type ObjectId,
} from "./kitchen";

// ── Tipi runtime ────────────────────────────────────────────────────────────

interface SlotState {
  surface:  Superficie;
  idx:      number;
  obj:      ObjectId | null;
  flipped:  boolean;
}

interface Trial {
  id:       number;
  scenaA:   SlotState[];          // memo
  scenaB:   SlotState[];          // recall
  changedKeys: Set<string>;       // chiavi `${surface}:${idx}` cambiate
  tipiModifica: TipoModifica[];   // diagnostica
}

type Fase = "memo" | "transizione" | "recall" | "feedback" | "isi";

interface Props {
  config:       CasalingaLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
  onProgress?:  (current: number, total: number | null) => void;
}

// ── Utils ───────────────────────────────────────────────────────────────────

function pickOne<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function keyOf(s: { surface: Superficie; idx: number }) {
  return `${s.surface}:${s.idx}`;
}

// ── Generazione trial ──────────────────────────────────────────────────────

function generaTrial(cfg: CasalingaLevelConfig, trialId: number, rng: () => number): Trial {
  // 1. Allestisci scenaA: distribuzione casuale di nOggetti su tutti gli slot disponibili.
  const slotsAll: SlotState[] = [];
  for (const surface of cfg.superfici) {
    for (let i = 0; i < cfg.slotPerSuperficie; i++) {
      slotsAll.push({ surface, idx: i, obj: null, flipped: false });
    }
  }
  const indici = slotsAll.map((_, i) => i);
  shuffleInPlace(indici, rng);
  const pool = [...ALL_OBJECTS];
  shuffleInPlace(pool, rng);
  const nMax = Math.min(cfg.nOggetti, slotsAll.length, pool.length);
  for (let i = 0; i < nMax; i++) {
    slotsAll[indici[i]].obj = pool[i];
  }

  const scenaA = slotsAll.map((s) => ({ ...s }));
  const scenaB = scenaA.map((s) => ({ ...s }));

  // 2. Applica nCambiamenti modifiche distinte su scenaB.
  const changedKeys = new Set<string>();
  const tipiModifica: TipoModifica[] = [];
  let tentativi = 0;

  while (changedKeys.size < cfg.nCambiamenti && tentativi < 80) {
    tentativi++;
    const tipo = pickOne(cfg.modificheAmmesse, rng);
    // Esclude slot già coinvolti in modifiche precedenti (sia src che dst di moved).
    const usedSlotKeys = new Set<string>(changedKeys);
    // Per moved aggiungiamo anche le sorgenti (vuote) all'esclusione tramite un
    // secondo set: lo manteniamo separato per non includerle in changedKeys.
    const pieni = scenaB.filter((s) => s.obj !== null && !usedSlotKeys.has(keyOf(s)));
    const vuoti = scenaB.filter((s) => s.obj === null && !usedSlotKeys.has(keyOf(s)));
    if (pieni.length === 0) break;

    if (tipo === "moved" && vuoti.length > 0) {
      const src = pickOne(pieni, rng);
      const dst = pickOne(vuoti, rng);
      const srcRef = scenaB.find((s) => keyOf(s) === keyOf(src))!;
      const dstRef = scenaB.find((s) => keyOf(s) === keyOf(dst))!;
      dstRef.obj = srcRef.obj;
      dstRef.flipped = srcRef.flipped;
      srcRef.obj = null;
      srcRef.flipped = false;
      // Solo lo slot DI DESTINAZIONE è "cambiato" cliccabile (contiene l'oggetto).
      // La sorgente è ora vuota e non sarà cliccabile.
      changedKeys.add(keyOf(dst));
      tipiModifica.push("moved");
    } else if (tipo === "swapped" && pieni.length >= 2) {
      const a = pickOne(pieni, rng);
      const rest = pieni.filter((p) => keyOf(p) !== keyOf(a));
      const b = pickOne(rest, rng);
      const aRef = scenaB.find((s) => keyOf(s) === keyOf(a))!;
      const bRef = scenaB.find((s) => keyOf(s) === keyOf(b))!;
      const tmp = aRef.obj;
      const tmpFlip = aRef.flipped;
      aRef.obj = bRef.obj;
      aRef.flipped = bRef.flipped;
      bRef.obj = tmp;
      bRef.flipped = tmpFlip;
      changedKeys.add(keyOf(a));
      changedKeys.add(keyOf(b));
      tipiModifica.push("swapped");
    } else if (tipo === "flipped") {
      const src = pickOne(pieni, rng);
      const ref = scenaB.find((s) => keyOf(s) === keyOf(src))!;
      ref.flipped = !ref.flipped;
      changedKeys.add(keyOf(src));
      tipiModifica.push("flipped");
    }
  }

  return { id: trialId, scenaA, scenaB, changedKeys, tipiModifica };
}

// ── CSS ─────────────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes casa-flicker {
  0%   { transform: scale(1) translateY(0); }
  100% { transform: scale(1.05) translateY(-0.4px); }
}
@keyframes casa-scene-in {
  0%   { transform: scale(0.985); opacity: 0; }
  100% { transform: scale(1);     opacity: 1; }
}
@keyframes casa-pulse-ok {
  0%, 100% { box-shadow: 0 0 0 0  rgba(21,128,61,0.50); }
  50%      { box-shadow: 0 0 0 10px rgba(21,128,61,0); }
}
@keyframes casa-pulse-err {
  0%, 100% { box-shadow: 0 0 0 0  rgba(185,28,28,0.55); }
  50%      { box-shadow: 0 0 0 10px rgba(185,28,28,0); }
}
@keyframes casa-pulse-miss {
  0%, 100% { box-shadow: 0 0 0 0  rgba(245,158,11,0.55); }
  50%      { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
}
`;

// ── Componente ──────────────────────────────────────────────────────────────

export function CasalingaSession({
  config, tempoScaduto, onReady, onComplete, onProgress,
}: Props) {
  const rng = useRef(Math.random);
  const configRef = useRef(config);
  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const [trialIdx, setTrialIdx] = useState(0);
  const trialIdxRef = useRef(0);
  useLayoutEffect(() => { trialIdxRef.current = trialIdx; }, [trialIdx]);

  const [trial, setTrial] = useState<Trial | null>(null);
  const trialRef = useRef<Trial | null>(null);
  useLayoutEffect(() => { trialRef.current = trial; }, [trial]);

  const [fase, setFase] = useState<Fase>("memo");
  const faseRef = useRef<Fase>(fase);
  useLayoutEffect(() => { faseRef.current = fase; }, [fase]);

  const [memoStart, setMemoStart] = useState<number>(Date.now());
  const [memoProgress, setMemoProgress] = useState<number>(1);
  const [selezioni, setSelezioni] = useState<Set<string>>(new Set());

  const accCumRef = useRef(0);
  const hitsRef   = useRef(0);
  const missRef   = useRef(0);
  const faRef     = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });
  const onProgressRef = useRef(onProgress);
  useLayoutEffect(() => { onProgressRef.current = onProgress; });

  // ── Bootstrap primo trial ─────────────────────────────────────────────────
  useEffect(() => {
    onReady();
    const t = generaTrial(configRef.current, 1, rng.current);
    setTrial(t);
    setFase("memo");
    setMemoStart(Date.now());
    setMemoProgress(1);
    setSelezioni(new Set());
  }, []); // eslint-disable-line

  // ── Fine sessione su tempo scaduto (fallback) ─────────────────────────────
  const fineSessione = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const trialsCompletati = trialIdxRef.current;
    const acc = trialsCompletati > 0 ? accCumRef.current / trialsCompletati : 0;
    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           Math.round(acc * 100),
      metriche: {
        trial_completati: trialsCompletati,
        hits:             hitsRef.current,
        missing:          missRef.current,
        falsi_allarmi:    faRef.current,
      },
    });
  }, []);

  useEffect(() => {
    if (tempoScaduto) fineSessione();
  }, [tempoScaduto, fineSessione]);

  // ── Tick candela fase memo (solo se NON manuale) ──────────────────────────
  useEffect(() => {
    if (fase !== "memo") return;
    if (configRef.current.memoManuale) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - memoStart;
      const ratio = 1 - elapsed / configRef.current.memoMs;
      if (ratio <= 0) {
        setMemoProgress(0);
        setFase("transizione");
      } else {
        setMemoProgress(ratio);
      }
    }, 80);
    return () => clearInterval(id);
  }, [fase, memoStart]);

  // ── Transizione 1.6s → recall ─────────────────────────────────────────────
  useEffect(() => {
    if (fase !== "transizione") return;
    const t = setTimeout(() => setFase("recall"), 1600);
    return () => clearTimeout(t);
  }, [fase]);

  // ── Tap slot in recall ────────────────────────────────────────────────────
  const handleTapSlot = useCallback((k: string) => {
    if (faseRef.current !== "recall" || !trialRef.current) return;
    // Solo slot con oggetto sono selezionabili.
    const slot = trialRef.current.scenaB.find((s) => keyOf(s) === k);
    if (!slot || slot.obj === null) return;
    setSelezioni((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }, []);

  // ── Conferma → calcola scoring → feedback ─────────────────────────────────
  const confermaRisposta = useCallback(() => {
    if (faseRef.current !== "recall" || !trialRef.current) return;
    const t = trialRef.current;
    let hits = 0;
    let fa = 0;
    selezioni.forEach((k) => {
      if (t.changedKeys.has(k)) hits++;
      else fa++;
    });
    const miss = t.changedKeys.size - hits;
    const jaccard = t.changedKeys.size === 0
      ? 0
      : hits / (t.changedKeys.size + fa);

    accCumRef.current += jaccard;
    hitsRef.current   += hits;
    missRef.current   += miss;
    faRef.current     += fa;

    setFase("feedback");
    onProgressRef.current?.(trialIdxRef.current + 1, CASALINGA_TRIAL_VALUTATIVI);
  }, [selezioni]);

  // ── Feedback 1.4s → ISI → trial successivo / fine ────────────────────────
  useEffect(() => {
    if (fase !== "feedback") return;
    const t = setTimeout(() => setFase("isi"), 1400);
    return () => clearTimeout(t);
  }, [fase]);

  useEffect(() => {
    if (fase !== "isi") return;
    if (completedRef.current) return;
    const t = setTimeout(() => {
      const next = trialIdxRef.current + 1;
      if (next >= CASALINGA_TRIAL_VALUTATIVI) {
        // Fine sessione (success path).
        if (completedRef.current) return;
        completedRef.current = true;
        const acc = accCumRef.current / CASALINGA_TRIAL_VALUTATIVI;
        onCompleteRef.current({
          accuratezzaValutativa: acc,
          scoreGrezzo:           Math.round(acc * 100),
          metriche: {
            trial_completati: CASALINGA_TRIAL_VALUTATIVI,
            hits:             hitsRef.current,
            missing:          missRef.current,
            falsi_allarmi:    faRef.current,
          },
        });
        return;
      }
      setTrialIdx(next);
      setTrial(generaTrial(configRef.current, next + 1, rng.current));
      setSelezioni(new Set());
      setFase("memo");
      setMemoStart(Date.now());
      setMemoProgress(1);
    }, 700);
    return () => clearTimeout(t);
  }, [fase]);

  // ── Helpers render ────────────────────────────────────────────────────────

  const isMemo     = fase === "memo";
  const isTransiz  = fase === "transizione";
  const isFeedback = fase === "feedback";
  const showScena  = !isTransiz;
  const scenaCorrente: SlotState[] = isMemo ? (trial?.scenaA ?? []) : (trial?.scenaB ?? []);

  const slotBorderFor = (k: string, hasObj: boolean): string => {
    if (!isFeedback || !trial) return KITCHEN_PALETTE.tileEdge;
    const isChanged = trial.changedKeys.has(k);
    const isSelected = selezioni.has(k);
    if (isChanged && isSelected)  return KITCHEN_PALETTE.ok;
    if (isChanged && !isSelected) return KITCHEN_PALETTE.miss;
    if (!isChanged && isSelected) return KITCHEN_PALETTE.err;
    return KITCHEN_PALETTE.tileEdge;
    void hasObj;
  };

  const slotAnimFor = (k: string): string | undefined => {
    if (!isFeedback || !trial) return undefined;
    const isChanged = trial.changedKeys.has(k);
    const isSelected = selezioni.has(k);
    if (isChanged && isSelected)  return "casa-pulse-ok 1200ms ease-out";
    if (isChanged && !isSelected) return "casa-pulse-miss 1200ms ease-out";
    if (!isChanged && isSelected) return "casa-pulse-err 1200ms ease-out";
    return undefined;
  };

  // Raggruppa slot per superficie nell'ordine dichiarato.
  const slotPerSurfaceUI = useMemo(() => {
    const map: Record<Superficie, SlotState[]> = { mensola: [], piano: [], tavolo: [] };
    scenaCorrente.forEach((s) => map[s.surface].push(s));
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.idx - b.idx));
    return map;
  }, [scenaCorrente]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        width: "100%",
        userSelect: "none",
        background: KITCHEN_PALETTE.bg,
        borderRadius: "0.6rem",
        overflow: "hidden",
        border: `1px solid rgba(76,52,28,0.18)`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <style>{ANIM_CSS}</style>

      {/* ── Header: indicatore trial + titolo fase grande + candela ──────── */}
      <div
        style={{
          padding: "0.6rem 0.85rem 0.7rem 0.85rem",
          background: isMemo ? "#FBF4E8" : fase === "recall" ? "#FFF1DA" : "#FBF4E8",
          borderBottom: "1px solid rgba(76,52,28,0.12)",
          transition: "background 220ms",
        }}
      >
        {/* riga 1: pallini progresso */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "0.4rem" }}>
          {Array.from({ length: CASALINGA_TRIAL_VALUTATIVI }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: 99,
                background:
                  i < trialIdx ? KITCHEN_PALETTE.ok :
                  i === trialIdx ? KITCHEN_PALETTE.ink :
                  "rgba(58,42,24,0.18)",
              }}
            />
          ))}
        </div>

        {/* riga 2: titolo fase centrato; candela in posizione assoluta a destra */}
        <div
          style={{
            position: "relative",
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{
              margin: 0,
              fontSize: "0.58rem",
              fontWeight: 700,
              color: KITCHEN_PALETTE.inkSoft,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}>
              {isMemo     && "Passo 1 di 2"}
              {isTransiz  && "Attenzione"}
              {fase === "recall"   && "Passo 2 di 2"}
              {isFeedback && "Risultato"}
              {fase === "isi"      && " "}
            </p>
            <p style={{
              margin: "0.1rem 0 0 0",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: KITCHEN_PALETTE.ink,
              lineHeight: 1.15,
            }}>
              {isMemo     && "Memorizza la cucina"}
              {isTransiz  && "Qualcosa è cambiato…"}
              {fase === "recall"   && "Tocca cosa è diverso"}
              {isFeedback && "Ecco le risposte"}
              {fase === "isi"      && " "}
            </p>
          </div>

          {isMemo && !config.memoManuale && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}>
              <Candle progress={memoProgress} height={44} />
            </div>
          )}
        </div>

        {/* riga 3: sotto-istruzione contestuale */}
        {(isMemo || fase === "recall") && (
          <p style={{
            margin: "0.45rem 0 0 0",
            fontSize: "0.78rem",
            color: KITCHEN_PALETTE.inkSoft,
            textAlign: "center",
            lineHeight: 1.35,
          }}>
            {isMemo && (config.memoManuale
              ? "Guarda dove si trova ogni oggetto. Quando sei pronto, premi il pulsante."
              : "Guarda dove si trova ogni oggetto. La candela segna il tempo.")}
            {fase === "recall" && "Tocca solo gli oggetti che sono stati spostati o cambiati."}
          </p>
        )}
      </div>

      {/* ── Scena ────────────────────────────────────────────────────────── */}
      {showScena && trial && (
        <div key={`${trial.id}-${fase}`} style={{ animation: "casa-scene-in 280ms ease-out" }}>
          {config.superfici.map((surface) => (
            <SurfaceFrame key={surface} surface={surface}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${config.slotPerSuperficie}, minmax(0, 1fr))`,
                  gap: "0.4rem",
                  marginTop: "0.95rem",
                  paddingBottom: "0.15rem",
                }}
              >
                {slotPerSurfaceUI[surface].map((slot) => {
                  const k = keyOf(slot);
                  const isRecall = fase === "recall";
                  const isSelected = selezioni.has(k);
                  const hasObj = slot.obj !== null;
                  // Solo gli slot con oggetto sono cliccabili in fase recall.
                  const interactive = isRecall && hasObj;
                  const borderCol =
                    isFeedback
                      ? slotBorderFor(k, hasObj)
                      : isSelected
                        ? KITCHEN_PALETTE.ink
                        : KITCHEN_PALETTE.tileEdge;
                  const bgCol =
                    isSelected && isRecall
                      ? "#FFEFD5"
                      : KITCHEN_PALETTE.tile;
                  return (
                    <button
                      key={k}
                      onClick={() => handleTapSlot(k)}
                      disabled={!interactive}
                      aria-pressed={isSelected}
                      aria-label={
                        hasObj
                          ? `Oggetto: ${slot.obj}${slot.flipped ? " capovolto" : ""}`
                          : "Spazio vuoto (non selezionabile)"
                      }
                      style={{
                        all: "unset",
                        cursor: interactive ? "pointer" : "default",
                        boxSizing: "border-box",
                        background: bgCol,
                        border: `2px solid ${borderCol}`,
                        borderRadius: "0.45rem",
                        padding: "0.25rem",
                        minHeight: 78,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        WebkitTapHighlightColor: "transparent",
                        transition: "background 160ms, border-color 180ms",
                        animation: slotAnimFor(k),
                        position: "relative",
                        opacity: !hasObj && isRecall ? 0.55 : 1,
                      }}
                    >
                      {slot.obj
                        ? <ObjectSprite id={slot.obj} size={62} flipped={slot.flipped} />
                        : <span style={{
                            fontSize: "0.65rem",
                            color: "rgba(58,42,24,0.25)",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                          }}>·</span>}
                      {isFeedback && trial.changedKeys.has(k) && !selezioni.has(k) && (
                        <span style={{
                          position: "absolute",
                          top: 3, right: 5,
                          fontSize: "0.55rem",
                          fontWeight: 700,
                          color: KITCHEN_PALETTE.miss,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}>
                          qui!
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </SurfaceFrame>
          ))}
        </div>
      )}

      {/* ── Overlay morbido in transizione ───────────────────────────────── */}
      {isTransiz && (
        <div
          style={{
            padding: "2.2rem 1.1rem 2.4rem 1.1rem",
            background: "#F4E9D8",
            textAlign: "center",
          }}
        >
          <p style={{
            margin: 0,
            fontSize: "2rem",
            lineHeight: 1,
          }}>
            👀
          </p>
          <p style={{
            margin: "0.7rem 0 0.3rem 0",
            fontSize: "1.15rem",
            fontWeight: 700,
            color: KITCHEN_PALETTE.ink,
          }}>
            Qualcosa è cambiato in cucina
          </p>
          <p style={{
            margin: 0,
            fontSize: "0.92rem",
            color: KITCHEN_PALETTE.inkSoft,
            lineHeight: 1.4,
          }}>
            Tra un istante tocca <strong>solo gli oggetti</strong>
            <br />che si sono spostati o sono cambiati.
          </p>
        </div>
      )}

      {/* ── Pulsante "Sono pronto" in memo manuale ──────────────────────── */}
      {isMemo && config.memoManuale && (
        <div
          style={{
            padding: "0.75rem 0.85rem 0.95rem 0.85rem",
            background: "#FBF4E8",
            borderTop: "1px solid rgba(76,52,28,0.12)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <p style={{
            margin: 0,
            flex: 1,
            fontSize: "0.78rem",
            color: KITCHEN_PALETTE.inkSoft,
            lineHeight: 1.35,
          }}>
            Nessuna fretta — premi quando hai memorizzato.
          </p>
          <button
            onClick={() => setFase("transizione")}
            style={{
              all: "unset",
              padding: "0.7rem 1.1rem",
              borderRadius: "0.4rem",
              background: KITCHEN_PALETTE.ink,
              color: "#FBF4E8",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Sono pronto
          </button>
        </div>
      )}

      {/* ── Conferma in recall ──────────────────────────────────────────── */}
      {fase === "recall" && (
        <div
          style={{
            padding: "0.75rem 0.85rem 0.95rem 0.85rem",
            background: "#FBF4E8",
            borderTop: "1px solid rgba(76,52,28,0.12)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <p style={{
            margin: 0,
            flex: 1,
            fontSize: "0.78rem",
            color: KITCHEN_PALETTE.inkSoft,
            lineHeight: 1.35,
          }}>
            Selezionati: <strong style={{ color: KITCHEN_PALETTE.ink }}>{selezioni.size}</strong>
          </p>
          <button
            onClick={confermaRisposta}
            disabled={selezioni.size === 0}
            style={{
              all: "unset",
              padding: "0.7rem 1.1rem",
              borderRadius: "0.4rem",
              background: selezioni.size === 0 ? "rgba(58,42,24,0.25)" : KITCHEN_PALETTE.ink,
              color: "#FBF4E8",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: selezioni.size === 0 ? "not-allowed" : "pointer",
              textAlign: "center",
            }}
          >
            Conferma
          </button>
        </div>
      )}
    </div>
  );
}
