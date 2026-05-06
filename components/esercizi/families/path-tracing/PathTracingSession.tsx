"use client";

/**
 * PathTracingSession — canvas touch/mouse per navigare il labirinto.
 *
 * Flusso:
 *   - L'utente inizia trascinando dal cerchio verde (0,0).
 *   - Ogni volta che tocca un muro il tracciato si azzera (reset visivo).
 *   - Arrivare in (size-1,size-1) chiude la sessione con il tempo impiegato.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import type { StimoloPathTracing, RispostaPathTracing } from "./sequence";

const CANVAS_PX   = 280;
const PADDING     = 18;   // px bordo interno
const START_COLOR = "#22C55E";
const END_COLOR   = "#EF4444";
const CUR_COLOR   = "#3B82F6";
const WALL_COLOR  = "#1E293B";
const VISIT_COLOR = "#BFDBFE"; // azzurro chiaro celle visitate
const BG_COLOR    = "#F8FAFC";

type Props = {
  stimolo:      StimoloPathTracing;
  onRisposta:   (r: RispostaPathTracing) => void;
  tempoScaduto: boolean;
};

export function PathTracingSession({ stimolo, onRisposta, tempoScaduto }: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const completedRef   = useRef(false);
  const startedRef     = useRef(false);
  const startTimeRef   = useRef(0);
  const resetCountRef  = useRef(0);
  const currentCellRef = useRef<[number, number]>([0, 0]);
  const visitedRef     = useRef<Set<string>>(new Set(["0,0"]));
  const isDownRef      = useRef(false);
  const stimoloRef     = useRef(stimolo);
  const onRispostaRef  = useRef(onRisposta);

  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  const { maze } = stimolo;
  const { size } = maze;

  const cellPx = (CANVAS_PX - PADDING * 2) / size;

  // ── Helpers coordinate ─────────────────────────────────────────────────────

  const cellCenter = useCallback(
    (r: number, c: number): [number, number] => [
      PADDING + c * cellPx + cellPx / 2,
      PADDING + r * cellPx + cellPx / 2,
    ],
    [cellPx],
  );

  const pixelToCell = useCallback(
    (px: number, py: number): [number, number] => {
      const c = Math.floor((px - PADDING) / cellPx);
      const r = Math.floor((py - PADDING) / cellPx);
      return [
        Math.max(0, Math.min(size - 1, r)),
        Math.max(0, Math.min(size - 1, c)),
      ];
    },
    [cellPx, size],
  );

  // ── Draw ───────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

    // sfondo
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    // celle visitate
    ctx.fillStyle = VISIT_COLOR;
    Array.from(visitedRef.current).forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      ctx.fillRect(
        PADDING + c * cellPx,
        PADDING + r * cellPx,
        cellPx,
        cellPx,
      );
    });

    // muri
    ctx.strokeStyle = WALL_COLOR;
    ctx.lineWidth   = 2;
    ctx.lineCap     = "square";

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = maze.cells[r][c];
        const x = PADDING + c * cellPx;
        const y = PADDING + r * cellPx;

        ctx.beginPath();
        if (cell.n) { ctx.moveTo(x, y);           ctx.lineTo(x + cellPx, y);           }
        if (cell.e) { ctx.moveTo(x + cellPx, y);  ctx.lineTo(x + cellPx, y + cellPx);  }
        if (cell.s) { ctx.moveTo(x, y + cellPx);  ctx.lineTo(x + cellPx, y + cellPx);  }
        if (cell.w) { ctx.moveTo(x, y);            ctx.lineTo(x, y + cellPx);           }
        ctx.stroke();
      }
    }

    // etichette START / END
    const [sx, sy] = cellCenter(0, 0);
    const [ex, ey] = cellCenter(size - 1, size - 1);

    ctx.fillStyle  = START_COLOR;
    ctx.beginPath();
    ctx.arc(sx, sy, cellPx * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle  = END_COLOR;
    ctx.beginPath();
    ctx.arc(ex, ey, cellPx * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // posizione corrente (sopra start/end se coincide)
    if (startedRef.current) {
      const [cr, cc] = currentCellRef.current;
      const [cx, cy] = cellCenter(cr, cc);
      ctx.fillStyle  = CUR_COLOR;
      ctx.beginPath();
      ctx.arc(cx, cy, cellPx * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [cellCenter, cellPx, maze, size]);

  // Ridisegna ogni volta che cambia lo stimolo
  useEffect(() => {
    completedRef.current  = false;
    startedRef.current    = false;
    resetCountRef.current = 0;
    currentCellRef.current = [0, 0];
    visitedRef.current    = new Set(["0,0"]);
    isDownRef.current     = false;
    draw();
  }, [stimolo, draw]);

  // ── tempoScaduto ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;
    isDownRef.current    = false;
    onRispostaRef.current(null);
  }, [tempoScaduto]);

  // ── Logica movimento ──────────────────────────────────────────────────────

  const tryMoveTo = useCallback(
    (pr: number, pc: number) => {
      if (completedRef.current) return;
      const [cr, cc] = currentCellRef.current;
      if (pr === cr && pc === cc) return;

      const dr = pr - cr;
      const dc = pc - cc;

      // Accettiamo solo adiacenti (1 passo alla volta)
      if (Math.abs(dr) + Math.abs(dc) !== 1) return;

      const cell = maze.cells[cr][cc];

      // Controlla muro tra cella corrente e destinazione
      let wallHit = false;
      if (dr === -1 && cell.n) wallHit = true;
      if (dr ===  1 && cell.s) wallHit = true;
      if (dc === -1 && cell.w) wallHit = true;
      if (dc ===  1 && cell.e) wallHit = true;

      if (wallHit) {
        // Reset
        resetCountRef.current += 1;
        currentCellRef.current = [0, 0];
        visitedRef.current     = new Set(["0,0"]);
        draw();
        return;
      }

      currentCellRef.current = [pr, pc];
      visitedRef.current.add(`${pr},${pc}`);
      draw();

      // Arrivo?
      if (pr === size - 1 && pc === size - 1) {
        if (completedRef.current) return;
        completedRef.current = true;
        const tempoMs = Date.now() - startTimeRef.current;
        onRispostaRef.current({
          tempoMs,
          resetCount: resetCountRef.current,
        });
      }
    },
    [draw, maze, size],
  );

  // Gestione puntatore con interpolazione step-by-step
  const handlePointerAt = useCallback(
    (px: number, py: number) => {
      if (!isDownRef.current || completedRef.current) return;
      const [nr, nc] = pixelToCell(px, py);
      const [cr, cc] = currentCellRef.current;

      // Interpolazione: può saltare più pixel, percorriamo ogni passo
      let r = cr, c = cc;
      const steps = Math.max(Math.abs(nr - r), Math.abs(nc - c));
      for (let i = 0; i < steps; i++) {
        const dr = nr - r;
        const dc = nc - c;
        if (Math.abs(dr) >= Math.abs(dc) && dr !== 0) {
          tryMoveTo(r + Math.sign(dr), c);
          r += Math.sign(dr);
        } else if (dc !== 0) {
          tryMoveTo(r, c + Math.sign(dc));
          c += Math.sign(dc);
        }
        if (completedRef.current) break;
        [r, c] = currentCellRef.current; // potrebbe essere stato resettato
      }
    },
    [pixelToCell, tryMoveTo],
  );

  const getXY = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = CANVAS_PX / rect.width;
    return [
      (e.clientX - rect.left) * scale,
      (e.clientY - rect.top)  * scale,
    ];
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (completedRef.current) return;
      const [px, py] = getXY(e);
      const [nr, nc] = pixelToCell(px, py);
      const [cr, cc] = currentCellRef.current;
      // Avvia solo se si tocca la cella corrente
      if (nr !== cr || nc !== cc) return;
      isDownRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      if (!startedRef.current) {
        startedRef.current  = true;
        startTimeRef.current = Date.now();
        draw();
      }
    },
    [draw, pixelToCell],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDownRef.current) return;
      const [px, py] = getXY(e);
      handlePointerAt(px, py);
    },
    [handlePointerAt],
  );

  const onPointerUp = useCallback(() => {
    isDownRef.current = false;
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">
      <p style={{
        fontSize: "0.7rem", color: "#7C3AED", fontWeight: 700,
        letterSpacing: "0.08em",
      }}>
        TRACCIA IL PERCORSO
      </p>
      <div style={{ fontSize: "0.85rem", color: "#475569", textAlign: "center" }}>
        Trascina dal cerchio&nbsp;
        <span style={{ color: START_COLOR, fontWeight: 700 }}>verde</span>
        &nbsp;fino al cerchio&nbsp;
        <span style={{ color: END_COLOR, fontWeight: 700 }}>rosso</span>
        &nbsp;senza toccare i muri.
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        style={{
          width: `${CANVAS_PX}px`,
          height: `${CANVAS_PX}px`,
          maxWidth: "100%",
          borderRadius: "1rem",
          border: "2px solid #CBD5E1",
          touchAction: "none",
          cursor: "crosshair",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {resetCountRef.current > 0 && (
        <p style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
          Reset: {resetCountRef.current}
        </p>
      )}
    </div>
  );
}
