"use client";

/**
 * PostinoBorgoSession — sessione "Il Postino del Borgo" (Modello B, 2 trial).
 *
 * Flow trial:
 *   1. PLANNING   — il giocatore traccia il percorso cliccando le caselle
 *                   adiacenti (preview rosa tratteggiato). Bottone "Annulla
 *                   ultimo passo" e "Conferma percorso".
 *   2. ANIMAZIONE — il postino cammina lungo il percorso animato. Dal lv 6 i
 *                   `cambi` possono attivarsi a step specifici.
 *   3. FEEDBACK   — esito visivo (✓ verde se tutti consegnati nei limiti,
 *                   ✗ rosso altrimenti).
 *   4. ISI 700ms  → trial successivo (se < 2) oppure onComplete.
 *
 * Scoring trial:
 *   - illegale o non tutti consegnati                       → 0.0
 *   - completato, passi ≤ ottimo + 1                        → 1.0
 *   - completato, passi ≤ ottimo + (capPassi-ottimo)/2 +1   → 0.6
 *   - completato, passi ≤ capPassi                          → 0.3
 *   - passi > capPassi                                      → 0.0
 *
 * Accuratezza di sessione = media dei trial.
 */

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  type PostinoLevelConfig, POSTINO_BORGO_TRIAL_VALUTATIVI,
} from "./levels";
import {
  generaMappa, type VillageMap, type NodeId, type VillageEdge,
} from "./mapgen";
import {
  canTraverse,
} from "./pathfinding";
import {
  PALETTE, Decor, PostinoSprite, DestinatarioPin,
} from "./village";

interface Props {
  config:       PostinoLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
  onProgress?:  (current: number, total: number | null) => void;
}

type Fase = "planning" | "animazione" | "feedback" | "isi";

interface TrialState {
  map:       VillageMap;
  path:      NodeId[];          // include il postino in posizione 0
  consegnati:Set<string>;       // key "r,c" dei destinatari toccati
  appliedChanges: Set<number>;  // indici dei cambi già applicati
}

const CELL_PX = 86;          // dimensione visiva della cella della griglia
const CELL_GAP = 4;          // gap tra celle
const STEP_MS = 520;         // velocità di animazione del postino (era 380, troppo veloce per le transizioni SVG)

function eq(a: NodeId, b: NodeId)         { return a.row === b.row && a.col === b.col; }
function nkey(n: NodeId)                  { return `${n.row},${n.col}`; }
function isAdjacent(a: NodeId, b: NodeId) {
  return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
}

export function PostinoBorgoSession({
  config, tempoScaduto, onReady, onComplete, onProgress,
}: Props) {
  // ── Setup trial pool ──────────────────────────────────────────────────────
  const trials = useMemo<VillageMap[]>(() => {
    const out: VillageMap[] = [];
    for (let v = 0; v < POSTINO_BORGO_TRIAL_VALUTATIVI; v++) {
      out.push(generaMappa(config, v));
    }
    return out;
  }, [config]);

  const [trialIdx, setTrialIdx] = useState(0);
  const [trial, setTrial] = useState<TrialState>(() => freshTrial(trials[0]));
  const [fase, setFase] = useState<Fase>("planning");
  const [animStep, setAnimStep] = useState(0);
  const [accuratezze, setAccuratezze] = useState<number[]>([]);
  const [esitoLastTrial, setEsitoLastTrial] = useState<{
    ok: boolean; punti: number; passi: number; ottimo: number;
  } | null>(null);

  const completedRef = useRef(false);
  const onReadyCalled = useRef(false);

  useLayoutEffect(() => {
    if (!onReadyCalled.current) {
      onReadyCalled.current = true;
      onReady();
    }
  }, [onReady]);

  // tempoScaduto in Modello B non dovrebbe arrivare (durata = null), ma per
  // sicurezza chiudiamo subito con quanto raccolto.
  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    finalize(accuratezze);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoScaduto]);

  const finalize = useCallback((acc: number[]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const avg = acc.length === 0 ? 0 : acc.reduce((a, b) => a + b, 0) / acc.length;
    onComplete({
      accuratezzaValutativa: avg,
      scoreGrezzo: Math.round(avg * 100),
      metriche: {
        trial_completati: acc.length,
        ottimo_medio: Math.round(
          acc.length === 0 ? 0 : trials.slice(0, acc.length).reduce((s, t) => s + t.ottimo, 0) / acc.length,
        ),
      },
    });
  }, [onComplete, trials]);

  // ── Helpers di interazione ────────────────────────────────────────────────

  const last = trial.path[trial.path.length - 1];
  const canClickCell = useCallback((target: NodeId): "extend" | "undo" | "no" => {
    if (fase !== "planning") return "no";
    if (eq(target, last)) return "no";
    // Undo: se è il penultimo della path, è equivalente a tornare indietro.
    if (trial.path.length >= 2) {
      const prev = trial.path[trial.path.length - 2];
      if (eq(target, prev)) return "undo";
    }
    if (!isAdjacent(target, last)) return "no";
    if (!canTraverse(trial.map.edges, last, target)) return "no";
    return "extend";
  }, [fase, last, trial]);

  const onCellClick = useCallback((target: NodeId) => {
    const k = canClickCell(target);
    if (k === "no") return;
    if (k === "undo") {
      setTrial(prev => ({
        ...prev,
        path: prev.path.slice(0, -1),
      }));
      return;
    }
    // extend
    setTrial(prev => {
      const nuovaPath = [...prev.path, target];
      const consegnati = new Set(prev.consegnati);
      const isDest = prev.map.destinatari.some(d => eq(d, target));
      if (isDest) consegnati.add(nkey(target));
      return { ...prev, path: nuovaPath, consegnati };
    });
  }, [canClickCell]);

  const annullaUltimo = useCallback(() => {
    if (fase !== "planning") return;
    setTrial(prev => {
      if (prev.path.length <= 1) return prev;
      const nuova = prev.path.slice(0, -1);
      // ricalcola consegnati basandoti sui nodi rimasti
      const consegnati = new Set<string>();
      for (const n of nuova) {
        if (prev.map.destinatari.some(d => eq(d, n))) consegnati.add(nkey(n));
      }
      return { ...prev, path: nuova, consegnati };
    });
  }, [fase]);

  const resettaPercorso = useCallback(() => {
    if (fase !== "planning") return;
    setTrial(prev => ({
      ...prev,
      path: [prev.map.postino],
      consegnati: new Set(),
    }));
  }, [fase]);

  // ── Conferma + animazione ──────────────────────────────────────────────────

  const onConferma = useCallback(() => {
    if (fase !== "planning") return;
    setAnimStep(0);
    setFase("animazione");
  }, [fase]);

  // Loop animazione: avanza animStep ogni STEP_MS finché < path.length.
  useEffect(() => {
    if (fase !== "animazione") return;

    // Per L6+ applichiamo i cambi a step pianificati. Quando `animStep`
    // raggiunge un trigger, modifichiamo edges live; se l'arco successivo
    // diventa intransitabile interrompiamo l'animazione con esito negativo.
    const cambiDaApplicare = trial.map.cambi.filter(
      c => c.triggerStep === animStep && !trial.appliedChanges.has(animStep),
    );
    if (cambiDaApplicare.length > 0) {
      setTrial(prev => {
        const nuoviEdges = new Map(prev.map.edges);
        const applicati = new Set(prev.appliedChanges);
        for (const c of cambiDaApplicare) {
          const e = nuoviEdges.get(c.edgeKey);
          if (e) nuoviEdges.set(c.edgeKey, { ...e, kind: c.newKind });
          applicati.add(c.triggerStep);
        }
        return {
          ...prev,
          map: { ...prev.map, edges: nuoviEdges },
          appliedChanges: applicati,
        };
      });
    }

    if (animStep >= trial.path.length - 1) {
      // animazione conclusa → valuta
      const punti = scoreTrial(trial);
      const passi = trial.path.length - 1;
      const ottimo = trial.map.ottimo;
      const ok = punti > 0;
      setEsitoLastTrial({ ok, punti, passi, ottimo });
      const nuoveAcc = [...accuratezze, punti];
      setAccuratezze(nuoveAcc);
      onProgress?.(nuoveAcc.length, POSTINO_BORGO_TRIAL_VALUTATIVI);
      setFase("feedback");
      return;
    }

    // Verifica se il prossimo passo è ancora legale (può essere cambiato dal
    // sistema dinamico applicato un istante fa).
    const a = trial.path[animStep];
    const b = trial.path[animStep + 1];
    if (!canTraverse(trial.map.edges, a, b)) {
      const punti = 0;
      const passi = animStep;
      setEsitoLastTrial({ ok: false, punti, passi, ottimo: trial.map.ottimo });
      const nuoveAcc = [...accuratezze, punti];
      setAccuratezze(nuoveAcc);
      onProgress?.(nuoveAcc.length, POSTINO_BORGO_TRIAL_VALUTATIVI);
      setFase("feedback");
      return;
    }

    const t = setTimeout(() => setAnimStep(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [fase, animStep, trial, accuratezze, onProgress]);

  // ── ISI + avanzamento trial ──────────────────────────────────────────────

  useEffect(() => {
    if (fase !== "feedback") return;
    const t = setTimeout(() => setFase("isi"), 1400);
    return () => clearTimeout(t);
  }, [fase]);

  useEffect(() => {
    if (fase !== "isi") return;
    const t = setTimeout(() => {
      const next = trialIdx + 1;
      if (next >= POSTINO_BORGO_TRIAL_VALUTATIVI) {
        finalize(accuratezze);
        return;
      }
      setTrialIdx(next);
      setTrial(freshTrial(trials[next]));
      setEsitoLastTrial(null);
      setAnimStep(0);
      setFase("planning");
    }, 700);
    return () => clearTimeout(t);
  }, [fase, trialIdx, accuratezze, trials, finalize]);

  // ── Render ────────────────────────────────────────────────────────────────

  const { rows, cols, nodes, edges, postino, destinatari, capPassi } = trial.map;
  const consegnatiCount = trial.consegnati.size;
  const totaleDestinatari = destinatari.length;
  const passiCorrenti = trial.path.length - 1;

  // Posizione corrente del postino (durante animazione interpoliamo).
  const postinoNodo = fase === "animazione"
    ? trial.path[Math.min(animStep, trial.path.length - 1)]
    : postino;

  // Container scaling: facciamo un viewBox unico e lasciamo che il CSS scali.
  const W = cols * CELL_PX + (cols - 1) * CELL_GAP + 24;
  const H = rows * CELL_PX + (rows - 1) * CELL_GAP + 24;

  const cellXY = (n: NodeId) => ({
    x: 12 + n.col * (CELL_PX + CELL_GAP),
    y: 12 + n.row * (CELL_PX + CELL_GAP),
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "0.8rem",
      padding: "0.9rem 0.7rem",
      background: PALETTE.bg, borderRadius: "0.6rem",
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>
      {/* HUD trial + consegne + passi */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "0.6rem",
        padding: "0.55rem 0.8rem",
        background: "#FBF5E5", border: `1.5px solid ${PALETTE.streetEdge}`,
        borderRadius: "0.45rem",
      }}>
        <div style={{ fontSize: "0.82rem", color: PALETTE.ink, fontWeight: 700 }}>
          Consegna {trialIdx + 1}/{POSTINO_BORGO_TRIAL_VALUTATIVI}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {destinatari.map((d, i) => (
            <DestinatarioPin
              key={i}
              idx={i + 1}
              consegnato={trial.consegnati.has(nkey(d))}
              size={22}
            />
          ))}
        </div>
        <div style={{
          fontSize: "0.78rem", color: PALETTE.ink, fontWeight: 600,
          background: passiCorrenti > capPassi ? "#F7CCC3" : "transparent",
          padding: passiCorrenti > capPassi ? "0.15rem 0.4rem" : 0,
          borderRadius: "0.3rem",
        }}>
          Passi {passiCorrenti}{capPassi > 0 && capPassi < 99 ? ` / ${capPassi}` : ""}
        </div>
      </div>

      {/* Mappa */}
      <div style={{ display: "flex", justifyContent: "center", overflow: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: "100%",
            maxWidth: `${Math.min(560, W)}px`,
            height: "auto",
            background: PALETTE.mapBg,
            border: `2px solid ${PALETTE.streetEdge}`,
            borderRadius: "0.5rem",
            display: "block",
          }}
        >
          {/* Sfondo stradale: rettangoli "strada" sotto la griglia */}
          {renderStreets(rows, cols, edges, cellXY)}

          {/* Decorazioni dei nodi */}
          {nodes.flat().map((n, i) => {
            const { x, y } = cellXY(n);
            const isPost = eq(n, postino);
            const dest = destinatari.findIndex(d => eq(d, n));
            const onPath = trial.path.some(p => eq(p, n));
            return (
              <g
                key={i}
                transform={`translate(${x},${y})`}
                onClick={() => onCellClick(n)}
                style={{ cursor: canClickCell(n) !== "no" ? "pointer" : "default" }}
              >
                <rect
                  x={0} y={0} width={CELL_PX} height={CELL_PX}
                  rx={6}
                  fill={onPath ? "#FDEBC9" : "#F4DFB4"}
                  stroke={onPath ? PALETTE.pathLine : PALETTE.streetEdge}
                  strokeWidth={onPath ? 2.4 : 1.4}
                />
                <g transform={`translate(${CELL_PX/2 - 30},${CELL_PX/2 - 30})`}>
                  <Decor kind={n.decor} size={60} />
                </g>
                {dest >= 0 && (
                  <g transform={`translate(${CELL_PX - 26},6)`}>
                    <DestinatarioPin
                      idx={dest + 1}
                      consegnato={trial.consegnati.has(nkey(n))}
                      size={22}
                    />
                  </g>
                )}
                {isPost && !eq(postinoNodo, n) && (
                  <g transform={`translate(6,6)`}>
                    <circle cx="10" cy="10" r="9" fill={PALETTE.postino}
                            stroke={PALETTE.ink} strokeWidth="1.6" />
                    <text x="10" y="14" textAnchor="middle"
                          fontFamily="Georgia, serif" fontSize="11"
                          fontWeight="700" fill="#FBF5E5">✉</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Linea del percorso pianificato (rosa tratteggiata) */}
          {trial.path.length >= 2 && (
            <polyline
              points={trial.path.map(n => {
                const { x, y } = cellXY(n);
                return `${x + CELL_PX/2},${y + CELL_PX/2}`;
              }).join(" ")}
              fill="none"
              stroke={fase === "planning" ? PALETTE.pathPreview : PALETTE.pathLine}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={fase === "planning" ? "8 6" : undefined}
              opacity={0.85}
            />
          )}

          {/* Indicatori archi: sensi unici (frecce), strade chiuse (sbarra),
              scalinate (zig-zag). Sovrapposti alla griglia. */}
          {renderEdgeMarkers(edges, cellXY)}

          {/* Postino animato: transform SVG nativo via attribute per garantire
              che ogni cella del percorso venga effettivamente attraversata.
              CSS transform su <g> SVG ha supporto incoerente — l'attributo
              transform è universale. La transizione visiva si ottiene via
              animation key sul prevNodo. */}
          <g
            transform={`translate(${cellXY(postinoNodo).x + CELL_PX/2 - 18},${cellXY(postinoNodo).y + CELL_PX/2 - 18})`}
            style={{ transition: `transform ${STEP_MS - 40}ms linear` }}
          >
            <PostinoSprite size={36} flip={animStep > 0 &&
              animStep < trial.path.length &&
              trial.path[animStep].col < trial.path[animStep - 1]?.col} />
          </g>
        </svg>
      </div>

      {/* Controlli (planning) o esito (feedback) */}
      {fase === "planning" && (
        <div style={{
          display: "flex", gap: "0.5rem", alignItems: "stretch",
          padding: "0 0.2rem",
        }}>
          <button
            onClick={annullaUltimo}
            disabled={trial.path.length <= 1}
            style={{
              flex: 1, padding: "0.75rem",
              background: trial.path.length <= 1 ? "#E0CFA5" : "#FBF5E5",
              color: PALETTE.ink,
              border: `1.6px solid ${PALETTE.streetEdge}`,
              borderRadius: "0.4rem",
              fontSize: "0.92rem", fontWeight: 700,
              cursor: trial.path.length <= 1 ? "default" : "pointer",
              opacity: trial.path.length <= 1 ? 0.6 : 1,
            }}
          >
            ← Annulla passo
          </button>
          <button
            onClick={resettaPercorso}
            disabled={trial.path.length <= 1}
            style={{
              padding: "0.75rem 1rem",
              background: "transparent",
              color: PALETTE.inkSoft,
              border: `1.4px dashed ${PALETTE.inkSoft}`,
              borderRadius: "0.4rem",
              fontSize: "0.85rem", fontWeight: 600,
              cursor: trial.path.length <= 1 ? "default" : "pointer",
              opacity: trial.path.length <= 1 ? 0.5 : 1,
            }}
          >
            Resetta
          </button>
          <button
            onClick={onConferma}
            disabled={consegnatiCount < totaleDestinatari}
            style={{
              flex: 1.4, padding: "0.75rem",
              background: consegnatiCount < totaleDestinatari
                ? "#E0CFA5"
                : PALETTE.ink,
              color: consegnatiCount < totaleDestinatari ? PALETTE.inkSoft : "#FBF5E5",
              border: "none",
              borderRadius: "0.4rem",
              fontSize: "0.95rem", fontWeight: 700,
              cursor: consegnatiCount < totaleDestinatari ? "default" : "pointer",
              boxShadow: consegnatiCount < totaleDestinatari ? "none" : "0 2px 0 #2A1B0C",
            }}
          >
            {consegnatiCount < totaleDestinatari
              ? `Manca ${totaleDestinatari - consegnatiCount} consegna${totaleDestinatari - consegnatiCount > 1 ? "" : ""}`
              : "Conferma percorso →"}
          </button>
        </div>
      )}

      {fase === "feedback" && esitoLastTrial && (
        <div style={{
          padding: "0.7rem 0.9rem",
          background: esitoLastTrial.ok ? "#D5EAD8" : "#F7CCC3",
          border: `1.6px solid ${esitoLastTrial.ok ? PALETTE.ok : PALETTE.err}`,
          color: esitoLastTrial.ok ? "#244D2E" : "#5F1F18",
          borderRadius: "0.45rem",
          fontSize: "0.95rem", fontWeight: 700, textAlign: "center",
        }}>
          {esitoLastTrial.ok
            ? esitoLastTrial.passi <= esitoLastTrial.ottimo + 1
              ? `✓ Percorso ottimo (${esitoLastTrial.passi} passi)`
              : `✓ Tutte consegnate in ${esitoLastTrial.passi} passi (ottimo: ${esitoLastTrial.ottimo})`
            : "Percorso interrotto — riprova al prossimo borgo"}
        </div>
      )}
    </div>
  );
}

// ── Funzioni di supporto ────────────────────────────────────────────────────

function freshTrial(map: VillageMap): TrialState {
  return {
    map,
    path: [map.postino],
    consegnati: new Set(),
    appliedChanges: new Set(),
  };
}

function scoreTrial(t: TrialState): number {
  const allConsegnati = t.consegnati.size === t.map.destinatari.length;
  if (!allConsegnati) return 0;
  const passi  = t.path.length - 1;
  const ottimo = t.map.ottimo;
  const cap    = t.map.capPassi;
  if (cap > 0 && cap < 99 && passi > cap) return 0;
  if (passi <= ottimo + 1) return 1.0;
  const margine = (cap > 0 && cap < 99) ? cap : ottimo * 2 + 6;
  const mid = ottimo + Math.max(1, Math.floor((margine - ottimo) / 2));
  if (passi <= mid) return 0.6;
  return 0.3;
}

// ── Rendering archi (strade + marcatori) ────────────────────────────────────

function renderStreets(
  rows: number, cols: number,
  edges: Map<string, VillageEdge>,
  cellXY: (n: NodeId) => { x: number; y: number },
) {
  const strisce: JSX.Element[] = [];
  edges.forEach((e, k) => {
    if (e.kind === "closed" || e.kind === "stairs") return;
    const a = { row: e.fromRow, col: e.fromCol };
    const b = { row: e.toRow,   col: e.toCol };
    const pa = cellXY(a);
    const pb = cellXY(b);
    const x1 = pa.x + CELL_PX / 2;
    const y1 = pa.y + CELL_PX / 2;
    const x2 = pb.x + CELL_PX / 2;
    const y2 = pb.y + CELL_PX / 2;
    strisce.push(
      <line key={k} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={PALETTE.street} strokeWidth={20} strokeLinecap="round" />,
    );
    strisce.push(
      <line key={`${k}-edge`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={PALETTE.streetEdge} strokeWidth={1.4}
            strokeDasharray="4 4" opacity={0.5} />,
    );
  });
  return <g>{strisce}</g>;
}

function renderEdgeMarkers(
  edges: Map<string, VillageEdge>,
  cellXY: (n: NodeId) => { x: number; y: number },
) {
  const out: JSX.Element[] = [];
  edges.forEach((e, k) => {
    const a = { row: e.fromRow, col: e.fromCol };
    const b = { row: e.toRow,   col: e.toCol };
    const pa = cellXY(a); const pb = cellXY(b);
    const mx = (pa.x + pb.x) / 2 + CELL_PX / 2;
    const my = (pa.y + pb.y) / 2 + CELL_PX / 2;
    if (e.kind === "closed") {
      out.push(
        <g key={`m-${k}`} transform={`translate(${mx - 14},${my - 6})`}>
          <rect x="0" y="0" width="28" height="12" rx="2"
                fill="#FBF5E5" stroke={PALETTE.err} strokeWidth="2" />
          <line x1="3" y1="6" x2="25" y2="6" stroke={PALETTE.err} strokeWidth="2.4" />
          <line x1="6" y1="2" x2="6" y2="10" stroke={PALETTE.err} strokeWidth="2.4" />
          <line x1="14" y1="2" x2="14" y2="10" stroke={PALETTE.err} strokeWidth="2.4" />
          <line x1="22" y1="2" x2="22" y2="10" stroke={PALETTE.err} strokeWidth="2.4" />
        </g>,
      );
    } else if (e.kind === "stairs") {
      const vert = a.col === b.col;
      out.push(
        <g key={`m-${k}`} transform={`translate(${mx - 14},${my - 8})`}>
          <rect x="0" y="0" width="28" height="16" rx="2"
                fill={PALETTE.stone} stroke={PALETTE.ink} strokeWidth="1.4" />
          {vert ? (
            <>
              <line x1="2"  y1="3"  x2="26" y2="3"  stroke={PALETTE.ink} strokeWidth="1.2" />
              <line x1="2"  y1="7"  x2="26" y2="7"  stroke={PALETTE.ink} strokeWidth="1.2" />
              <line x1="2"  y1="11" x2="26" y2="11" stroke={PALETTE.ink} strokeWidth="1.2" />
            </>
          ) : (
            <>
              <line x1="6"  y1="2" x2="6"  y2="14" stroke={PALETTE.ink} strokeWidth="1.2" />
              <line x1="14" y1="2" x2="14" y2="14" stroke={PALETTE.ink} strokeWidth="1.2" />
              <line x1="22" y1="2" x2="22" y2="14" stroke={PALETTE.ink} strokeWidth="1.2" />
            </>
          )}
        </g>,
      );
    } else if (e.kind === "oneway") {
      // freccia che punta da from → to
      const dx = pb.x - pa.x; const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len; const uy = dy / len;
      const cx = mx; const cy = my;
      const tipx = cx + ux * 10; const tipy = cy + uy * 10;
      const baseLx = cx - ux * 6 + uy * 6;
      const baseLy = cy - uy * 6 - ux * 6;
      const baseRx = cx - ux * 6 - uy * 6;
      const baseRy = cy - uy * 6 + ux * 6;
      out.push(
        <polygon key={`m-${k}`}
                 points={`${tipx},${tipy} ${baseLx},${baseLy} ${baseRx},${baseRy}`}
                 fill={PALETTE.stamp} stroke={PALETTE.ink} strokeWidth="1.2"
                 strokeLinejoin="round" />,
      );
    }
  });
  return <g>{out}</g>;
}
