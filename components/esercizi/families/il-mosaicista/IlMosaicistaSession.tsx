"use client";

/**
 * IlMosaicistaSession — loop di gioco del Mosaicista.
 *
 * Per ogni mosaico:
 *  1. genera/scegli mosaico in base al livello
 *  2. assegna a ciascun frammento eventuale rotazione iniziale (livello 8+)
 *  3. mescola pool, l'utente trascina i frammenti sul board
 *  4. drag con pointer events: tap = ruota 90°, drag = move + snap magnetico
 *  5. tutti piazzati → animazione lucidatura 800ms → next mosaico
 *
 * Punteggio composito per mosaico:
 *   base = 50 (se mosaico completato senza alcun errore di drop)
 *   bonus_velocità = round(50 * max(0, 1 - tempo_speso / tLimMosaicoMs))
 *   penalità errori = - 4 per ogni drop sbagliato (cap a 0)
 *
 * Accuratezza valutativa = correctDrops / totalDrops (0..1) su tutti i drop
 * della sessione.
 */

import {
  useCallback, useEffect, useRef, useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  type MosaicistaLevelConfig,
  SNAP_RADIUS_FRACTION,
} from "./levels";
import {
  type MosaicDef, type MosaicCell,
  generateProceduralMosaic, pickCuratedMosaic,
} from "./mosaics";
import {
  AtelierBackground, MosaicCellRenderer,
  RotateIcon,
} from "./sprites";

// ── Stato fragment del pool ────────────────────────────────────────────────

type RotationDeg = 0 | 90 | 180 | 270;

interface PoolFragment {
  /** Chiave stabile = `${col}-${row}` del mosaico. */
  key: string;
  cell: MosaicCell;
  rotation: RotationDeg;
  /** Ordine corrente nel pool (per layout). */
  poolIndex: number;
  /** True se piazzato sul board (più dentro al pool). */
  placed: boolean;
}

interface BoardSlot {
  key: string;
  cell: MosaicCell;
  occupatoDa: string | null;  // key del fragment piazzato
  /** true se il fragment piazzato matcha visivamente lo slot; false se errato. */
  corretto: boolean;
}

// ── Layout costanti ────────────────────────────────────────────────────────

const BOARD_GAP_PX = 4;
const POOL_GAP_PX = 8;
const DRAG_TAP_THRESHOLD_PX = 7;
const FINGER_OFFSET_Y = -42;  // frammento sopra il dito durante il drag

// ── Component ──────────────────────────────────────────────────────────────

interface SessionProps {
  config: MosaicistaLevelConfig;
  tempoScaduto: boolean;
  onReady(): void;
  onComplete(r: SessionResult): void;
}

export function IlMosaicistaSession({ config, tempoScaduto, onReady, onComplete }: SessionProps) {

  // ── Stato sessione (refs per accumulatori, state per render) ─────────────
  const completedRef = useRef(false);

  const [currentMosaic, setCurrentMosaic] = useState<MosaicDef | null>(null);
  const [pool, setPool] = useState<PoolFragment[]>([]);
  const [slots, setSlots] = useState<BoardSlot[]>([]);
  const lastMosaicIdRef = useRef<string | undefined>(undefined);
  const mosaicStartTsRef = useRef<number>(0);
  const [fase, setFase] = useState<"preview" | "playing">("preview");
  const [previewElapsedPct, setPreviewElapsedPct] = useState(0);

  // ── Drag state ───────────────────────────────────────────────────────────
  const [dragKey, setDragKey] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverSlotKey, setHoverSlotKey] = useState<string | null>(null);

  // ── Refs sincronizzati con state (fonte fresca dentro handler window) ─────
  const poolRef = useRef<PoolFragment[]>([]);
  const slotsRef = useRef<BoardSlot[]>([]);
  const tempoScadutoRef = useRef(false);
  const faseRef = useRef<"preview" | "playing">("preview");
  useEffect(() => { poolRef.current = pool; }, [pool]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  useEffect(() => { tempoScadutoRef.current = tempoScaduto; }, [tempoScaduto]);

  // ── Refs DOM per snap ─────────────────────────────────────────────────────
  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Genera mosaico ───────────────────────────────────────────────────────
  const setupMosaic = useCallback(() => {
    const numFrags =
      config.fragmentsMin === config.fragmentsMax
        ? config.fragmentsMin
        : config.fragmentsMin + Math.floor(Math.random() * (config.fragmentsMax - config.fragmentsMin + 1));

    let m: MosaicDef;
    if (config.source === "procedural") {
      m = generateProceduralMosaic(config.livello);
    } else {
      m = pickCuratedMosaic(config.fragmentsMin, config.fragmentsMax, lastMosaicIdRef.current);
    }
    lastMosaicIdRef.current = m.id;

    // build slots
    const newSlots: BoardSlot[] = m.cells.map(c => ({
      key: `${c.col}-${c.row}`,
      cell: c,
      occupatoDa: null,
      corretto: false,
    }));

    // build pool (rotazione iniziale solo per cells con shape non-solid:
    // ruotare una tessera "solid" è invisibile e non aggiunge difficoltà)
    const rotated: PoolFragment[] = m.cells.map(c => {
      let rot: RotationDeg = 0;
      if (
        config.rotazioneAttiva &&
        c.shape !== "solid" &&
        Math.random() < config.rotazioneRatio
      ) {
        const opts: RotationDeg[] = [90, 180, 270];
        rot = opts[Math.floor(Math.random() * opts.length)];
      }
      return {
        key: `${c.col}-${c.row}`,
        cell: c,
        rotation: rot,
        poolIndex: 0,
        placed: false,
      };
    });
    // mescola pool
    for (let i = rotated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rotated[i], rotated[j]] = [rotated[j], rotated[i]];
    }
    rotated.forEach((f, idx) => { f.poolIndex = idx; });

    setCurrentMosaic(m);
    setSlots(newSlots);
    setPool(rotated);
    // mosaicStartTsRef sarà settato al passaggio preview → playing
    slotRefs.current.clear();
    setFase("preview");
    faseRef.current = "preview";
    setPreviewElapsedPct(0);

    // suppress unused (numFrags solo per chiarezza intent)
    void numFrags;
  }, [config]);

  // ── onReady all'avvio ─────────────────────────────────────────────────────
  useEffect(() => {
    setupMosaic();
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown della fase preview ──────────────────────────────────────────
  useEffect(() => {
    if (fase !== "preview" || !currentMosaic) return;
    const startTs = performance.now();
    const totalMs = config.previewMs;

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startTs;
      const pct = Math.min(1, elapsed / totalMs);
      setPreviewElapsedPct(pct);
      if (elapsed >= totalMs) {
        // passa alla fase di gioco
        mosaicStartTsRef.current = performance.now();
        setFase("playing");
        faseRef.current = "playing";
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fase, currentMosaic, config.previewMs]);

  // ── Fine sessione ────────────────────────────────────────────────────────
  /**
   * Chiude la sessione con il risultato calcolato sui slot indicati.
   * Chiamata sia quando il mosaico è interamente riempito (esauriti i pezzi),
   * sia quando il timer 60s scade.
   */
  const terminaSessione = useCallback((slotsCorretti: number, slotsTotali: number) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const tempoSpesoMs = performance.now() - mosaicStartTsRef.current;
    const perfetto = slotsTotali > 0 && slotsCorretti === slotsTotali;
    const accuratezzaValutativa = slotsTotali > 0 ? slotsCorretti / slotsTotali : 0;

    let scoreGrezzo: number;
    if (perfetto) {
      const speedFactor = Math.max(0, 1 - tempoSpesoMs / config.tLimMosaicoMs);
      scoreGrezzo = Math.min(100, 60 + Math.round(40 * speedFactor));
    } else {
      scoreGrezzo = Math.round((slotsCorretti / Math.max(1, slotsTotali)) * 50);
    }

    onComplete({
      accuratezzaValutativa,
      scoreGrezzo,
      metriche: {
        mosaico_perfetto: perfetto ? 1 : 0,
        slot_corretti: slotsCorretti,
        slot_totali: slotsTotali,
      },
    });
  }, [config.tLimMosaicoMs, onComplete]);

  // Trigger di fine sessione su timer scaduto (fallback se l'utente non
  // riempie completamente il mosaico entro i 60s).
  useEffect(() => {
    if (!tempoScaduto) return;
    const cur = slotsRef.current;
    const slotsCorretti = cur.filter(s => s.corretto).length;
    const slotsTotali = cur.length;
    terminaSessione(slotsCorretti, slotsTotali);
  }, [tempoScaduto, terminaSessione]);

  // Trigger di fine sessione quando TUTTI gli slot sono occupati (l'utente
  // ha esaurito le mosse). Si attiva solo in fase playing dopo qualunque
  // cambio di stato di `slots` — affidabile anche su drag tra slot.
  useEffect(() => {
    if (fase !== "playing" || completedRef.current) return;
    if (slots.length === 0) return;
    if (!slots.every(s => s.occupatoDa !== null)) return;
    const corretti = slots.filter(s => s.corretto).length;
    const totali = slots.length;
    const id = setTimeout(() => terminaSessione(corretti, totali), 500);
    return () => clearTimeout(id);
  }, [slots, fase, terminaSessione]);

  // ── Drag logic ────────────────────────────────────────────────────────────

  const findNearestSlot = useCallback((x: number, y: number): { key: string; dist: number } | null => {
    let best: { key: string; dist: number } | null = null;
    slotRefs.current.forEach((el, key) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (best === null || d < best.dist) best = { key, dist: d };
    });
    return best;
  }, []);

  /**
   * Inizia drag. Accetta frammenti sia dal pool (placed=false) sia da slot
   * occupati (placed=true): in entrambi i casi si "stacca" il blocco e lo
   * si segue col puntatore. Se viene da uno slot, lo slot torna vuoto subito.
   */
  const handlePointerDown = useCallback((e: ReactPointerEvent, key: string) => {
    if (fase !== "playing" || completedRef.current) return;
    const f = poolRef.current.find(p => p.key === key);
    if (!f) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragKey(key);
    setDragPos({ x: e.clientX, y: e.clientY + FINGER_OFFSET_Y });

    // Se il fragment era piazzato su uno slot, svuota lo slot (il fragment
    // è ora "in mano" all'utente).
    if (f.placed) {
      setSlots(prev => prev.map(s =>
        s.occupatoDa === key ? { ...s, occupatoDa: null, corretto: false } : s
      ));
      setPool(prev => prev.map(p =>
        p.key === key ? { ...p, placed: false } : p
      ));
    }
  }, [fase]);

  // ── Window listeners attivi solo durante drag ─────────────────────────────
  useEffect(() => {
    if (!dragKey) return;

    const snapRadius = config.cellSizePx * SNAP_RADIUS_FRACTION;

    const onMove = (ev: PointerEvent) => {
      setDragPos({ x: ev.clientX, y: ev.clientY + FINGER_OFFSET_Y });
      const nearest = findNearestSlot(ev.clientX, ev.clientY + FINGER_OFFSET_Y);
      if (nearest && nearest.dist <= snapRadius) {
        setHoverSlotKey(nearest.key);  // hover anche su slot occupati (sostituzione)
        return;
      }
      setHoverSlotKey(null);
    };

    const onUp = (ev: PointerEvent) => {
      const start = dragStartRef.current;
      const draggedKey = dragKey;
      // cleanup PRIMA della logica per evitare doppi fire
      setDragKey(null);
      setDragPos(null);
      setHoverSlotKey(null);
      dragStartRef.current = null;

      if (!start) return;
      const fragment = poolRef.current.find(p => p.key === draggedKey);
      if (!fragment) return;

      const dist = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);

      // tap (no drag): rotazione se attiva
      if (dist < DRAG_TAP_THRESHOLD_PX) {
        if (config.rotazioneAttiva && fragment.rotation !== 0) {
          setPool(prev => prev.map(p =>
            p.key === draggedKey
              ? { ...p, rotation: ((p.rotation + 90) % 360) as RotationDeg }
              : p
          ));
        }
        return;
      }

      // drop: trova slot più vicino
      const dropY = ev.clientY + FINGER_OFFSET_Y;
      const nearest = findNearestSlot(ev.clientX, dropY);

      // Drop fuori da ogni slot → fragment torna al pool (no errore conteggiato).
      if (!nearest || nearest.dist > snapRadius) {
        return;  // il fragment è già unplaced dal pointerdown / non era placed
      }

      const targetSlot = slotsRef.current.find(s => s.key === nearest.key);
      if (!targetSlot) return;

      // Calcola match visivo
      const fc = fragment.cell;
      const sc = targetSlot.cell;
      const sameColor = fc.color === sc.color && fc.color2 === sc.color2;
      const sameShape = fc.shape === sc.shape;
      const rotationOk = sc.shape === "solid" ? true : fragment.rotation === 0;
      const isMatch = sameColor && sameShape && rotationOk;

      // Se lo slot era già occupato da un ALTRO fragment, quello torna al pool.
      const previousOccupant = targetSlot.occupatoDa;
      if (previousOccupant && previousOccupant !== draggedKey) {
        setPool(prev => prev.map(p =>
          p.key === previousOccupant ? { ...p, placed: false } : p
        ));
      }

      // Aggiorna slot e pool. Nessun feedback visivo sull'errore: lo stato
      // .corretto è interno, l'utente non sa se ha sbagliato.
      // La detection "tutti slot occupati → termina sessione" è gestita da
      // un useEffect su `slots` (più affidabile dei callback di setSlots).
      setSlots(prev => prev.map(s =>
        s.key === targetSlot.key
          ? { ...s, occupatoDa: draggedKey, corretto: isMatch }
          : s
      ));
      setPool(prev => prev.map(p =>
        p.key === draggedKey ? { ...p, placed: true } : p
      ));
    };

    const onCancel = (ev: PointerEvent) => onUp(ev);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [dragKey, config.cellSizePx, config.rotazioneAttiva, findNearestSlot, terminaSessione]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!currentMosaic) {
    return <div style={{ minHeight: 500 }} />;
  }

  const cellPx = config.cellSizePx;
  const boardWidth = currentMosaic.cols * cellPx + (currentMosaic.cols - 1) * BOARD_GAP_PX;
  const boardHeight = currentMosaic.rows * cellPx + (currentMosaic.rows - 1) * BOARD_GAP_PX;
  const draggingFragment = dragKey ? pool.find(p => p.key === dragKey) : null;
  const visiblePool = pool.filter(p => !p.placed);

  // ── Vista PREVIEW: schermata clean dedicata, solo modello + countdown ───
  if (fase === "preview") {
    const secondiRimasti = Math.max(0, Math.ceil((1 - previewElapsedPct) * (config.previewMs / 1000)));
    return (
      <AtelierBackground style={{ minHeight: 540, borderRadius: 12, padding: "1.2rem 1rem" }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "1.2rem", minHeight: 500,
        }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 800, color: "#6B4F2A",
            letterSpacing: "0.10em",
          }}>
            MEMORIZZA IL MODELLO
          </div>

          <h2 style={{
            fontSize: "1.25rem", fontWeight: 900, color: "#3A2614",
            margin: 0, textAlign: "center",
          }}>
            {currentMosaic.nome}
          </h2>

          <div style={{
            padding: 14,
            background: "rgba(255, 248, 230, 0.85)",
            border: "2px solid #8B5A2B",
            borderRadius: 10,
            boxShadow: "0 6px 18px rgba(110,72,32,0.25)",
          }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${currentMosaic.cols}, ${cellPx}px)`,
                gridTemplateRows: `repeat(${currentMosaic.rows}, ${cellPx}px)`,
                gap: BOARD_GAP_PX,
              }}
            >
              {currentMosaic.cells.map((c) => (
                <div
                  key={`${c.col}-${c.row}`}
                  style={{ gridColumn: c.col + 1, gridRow: c.row + 1 }}
                >
                  <MosaicCellRenderer cell={c} sizePx={cellPx} highlight="placed" />
                </div>
              ))}
            </div>
          </div>

          {/* Countdown */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            width: "100%", maxWidth: 320,
          }}>
            <div style={{
              width: "100%", height: 10, borderRadius: 999,
              background: "rgba(110,72,32,0.18)",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.round((1 - previewElapsedPct) * 100)}%`,
                height: "100%",
                background: "#8B5A2B",
                transition: "width 80ms linear",
              }} />
            </div>
            <div style={{ fontSize: "0.95rem", color: "#6B4F2A", fontWeight: 700 }}>
              {secondiRimasti}s
            </div>
          </div>

          <p style={{
            fontSize: "0.84rem", color: "#6B4F2A",
            textAlign: "center", margin: 0, maxWidth: 320, lineHeight: 1.4,
          }}>
            Guarda con attenzione: tra poco dovrai ricostruirlo a memoria.
          </p>
        </div>
      </AtelierBackground>
    );
  }
  // ── (Fine vista preview — segue la vista playing) ───────────────────────

  return (
    <AtelierBackground style={{ borderRadius: 12, padding: "0.8rem 0.6rem 0.8rem" }}>
      <div
        ref={stageRef}
        style={{
          position: "relative",
          touchAction: "none",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.7rem",
        }}
      >
        {/* ── Header: nome + numero mosaico ───────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", maxWidth: 380, padding: "0.3rem 0.4rem",
          gap: "0.8rem",
        }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            fontSize: "0.78rem", color: "#3F2E1C",
          }}>
            <span style={{
              fontSize: "0.66rem", fontWeight: 700, color: "#6B4F2A",
              letterSpacing: "0.08em",
            }}>
              RICOSTRUISCI A MEMORIA
            </span>
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{currentMosaic.nome}</span>
            {config.rotazioneAttiva && (
              <span style={{
                marginTop: 4, padding: "2px 8px",
                background: "#FFF8EC", borderRadius: 999,
                border: "1.2px solid #C6A476",
                fontSize: "0.68rem", color: "#6B4F2A", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <RotateIcon size={14} /> Tocca per ruotare
              </span>
            )}
          </div>
        </div>

        {/* ── Board ───────────────────────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${currentMosaic.cols}, ${cellPx}px)`,
              gridTemplateRows: `repeat(${currentMosaic.rows}, ${cellPx}px)`,
              gap: BOARD_GAP_PX,
              padding: 10,
              background: "rgba(58, 38, 20, 0.10)",
              border: "2px solid #8B5A2B",
              borderRadius: 8,
              boxShadow: "inset 0 2px 8px rgba(60,40,20,0.18)",
            }}
          >
            {slots.map((slot) => {
              const filled = slot.occupatoDa
                ? pool.find(p => p.key === slot.occupatoDa)
                : null;
              const isHover = hoverSlotKey === slot.key;
              const isDraggingThis = filled && dragKey === filled.key;
              return (
                <div
                  key={slot.key}
                  ref={(el) => {
                    if (el) slotRefs.current.set(slot.key, el);
                    else slotRefs.current.delete(slot.key);
                  }}
                  style={{
                    gridColumn: slot.cell.col + 1,
                    gridRow: slot.cell.row + 1,
                    width: cellPx,
                    height: cellPx,
                  }}
                >
                  {filled ? (
                    <div
                      onPointerDown={(e) => handlePointerDown(e, filled.key)}
                      style={{
                        width: cellPx, height: cellPx,
                        cursor: "grab",
                        touchAction: "none",
                        opacity: isDraggingThis ? 0 : 1,
                        pointerEvents: isDraggingThis ? "none" : "auto",
                      }}
                    >
                      <MosaicCellRenderer
                        cell={filled.cell}
                        sizePx={cellPx}
                        rotation={filled.rotation}
                        highlight="placed"
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: cellPx,
                        height: cellPx,
                        borderRadius: 4,
                        border: isHover
                          ? "3px dashed #3A8E45"
                          : "2px dashed rgba(110,72,32,0.45)",
                        background: isHover
                          ? "rgba(58,142,69,0.10)"
                          : "rgba(255,250,235,0.18)",
                        boxSizing: "border-box",
                        transition: "border-color 80ms, background 80ms",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* ── Pool frammenti ──────────────────────────────────────────────── */}
        <div
          style={{
            width: "100%", maxWidth: 380,
            padding: "0.4rem",
            background: "rgba(255, 248, 230, 0.55)",
            border: "1.5px solid #C6A476",
            borderRadius: 8,
            display: visiblePool.length > 0 ? "flex" : "none",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: POOL_GAP_PX,
          }}
        >
          {visiblePool.map((f) => {
            const isDragging = dragKey === f.key;
            return (
              <div
                key={f.key}
                onPointerDown={(e) => handlePointerDown(e, f.key)}
                style={{
                  width: cellPx, height: cellPx,
                  cursor: "grab",
                  touchAction: "none",
                  opacity: isDragging ? 0 : 1,
                  pointerEvents: isDragging ? "none" : "auto",
                }}
              >
                <MosaicCellRenderer
                  cell={f.cell}
                  sizePx={cellPx}
                  rotation={f.rotation}
                  highlight="none"
                />
              </div>
            );
          })}
        </div>

        {/* ── Frammento in drag (overlay assoluto rispetto al viewport) ───── */}
        {draggingFragment && dragPos && (
          <div
            style={{
              position: "fixed",
              left: dragPos.x - cellPx / 2,
              top: dragPos.y - cellPx / 2,
              width: cellPx, height: cellPx,
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <MosaicCellRenderer
              cell={draggingFragment.cell}
              sizePx={cellPx}
              rotation={draggingFragment.rotation}
              highlight="drag"
            />
          </div>
        )}
      </div>
    </AtelierBackground>
  );
}
