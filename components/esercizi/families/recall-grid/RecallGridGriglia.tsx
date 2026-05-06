"use client";

/**
 * RecallGridGriglia — componente griglia interattiva per Recall Grid.
 *
 * 2 modalità di rendering:
 *   - "encoding": griglia con stimoli pre-posizionati (read-only). L'utente
 *     osserva durante la fase di esposizione.
 *   - "retrieval": griglia vuota + tray con stimoli da riposizionare.
 *
 * ## Modalità di interazione: tap-to-select + tap-to-place (sempre)
 *
 * GDD `docs/gdd/shared/05-ui-conventions.md` §Esercizi con griglia (riga 13)
 * prescrive drag&drop per griglie ≤ 4×4 e tap-to-select+place per ≥ 5×5.
 *
 * Deroga implementativa: usiamo **tap-to-select+place per ogni dimensione**.
 * Ragione: l'API HTML5 drag&drop nativa non funziona in modo affidabile su
 * dispositivi touch senza polyfill non triviali. Per non introdurre librerie
 * pesanti (`react-dnd` ecc.) e mantenere il codice senior-friendly, unifichiamo
 * sull'interazione tap (anche più accessibile su mobile portrait).
 *
 * Comportamento:
 *   - Tap su tray item → highlight (border 2px blu). Selezione singola.
 *   - Tap su cella vuota con item selezionato → posiziona.
 *   - Tap su cella occupata: se selectedId vuoto → seleziona quello stimolo
 *     per spostamento successivo; se selectedId attivo → swap (lo stimolo
 *     precedente torna in tray).
 *   - Tap su tray item già selezionato → deseleziona.
 *
 * Riferimento: docs/gdd/families/recall-grid.md §Interfaccia (riga 20)
 */

import { useState, useMemo, useCallback, type CSSProperties } from "react";
import type { GridSize } from "./levels";
import type {
  StimoloRecallGrid,
  PosizionamentoUtente,
} from "./sequence";

// ── Props ─────────────────────────────────────────────────────────────────────

export type RecallGridGrigliaProps = {
  gridSize: GridSize;
  /**
   * Stimoli del trial. In encoding: posizioni in stimuli[].row/col sono
   * usate per il rendering. In retrieval: stimuli[] è la "biblioteca", il
   * rendering segue posizionamenti[].
   */
  stimuli: StimoloRecallGrid[];
  modalita: "encoding" | "retrieval";
  /** Solo retrieval: posizionamenti correnti dell'utente (controlled). */
  posizionamenti?: PosizionamentoUtente[];
  /** Solo retrieval: callback ad ogni posizionamento/swap/spostamento. */
  onPosizionamentoChange?: (nuovi: PosizionamentoUtente[]) => void;
};

// ── Helper styling per dimensione griglia ────────────────────────────────────

function cellaSizePx(gridSize: GridSize): number {
  if (gridSize === "3x3" || gridSize === "4x4") return 80;
  if (gridSize === "5x5") return 60;
  return 50; // 6x6
}

function isStimoloEmoji(stim: StimoloRecallGrid): boolean {
  // Convenzione id da sequence.ts: "p_..." parole, "e_..." emoji.
  return stim.id.startsWith("e_");
}

function fontSizeStimolo(gridSize: GridSize, isEmoji: boolean, wordLength?: number): string {
  const piccola = gridSize === "5x5" || gridSize === "6x6";
  if (isEmoji) return piccola ? "2.5rem" : "3rem";

  // Per le parole: calcola la dimensione che fa stare il testo in una riga.
  // Monospace: larghezza carattere ≈ 0.6 × fontSize.
  const cellSize = cellaSizePx(gridSize);
  const availW   = cellSize - 10; // 5px padding per lato
  const charW    = 0.6;
  const maxFs    = piccola ? 16 : 20;
  const len      = wordLength ?? 6;
  const fs       = Math.min(maxFs, availW / (len * charW));
  return `${Math.max(10, Math.round(fs))}px`;
}

function fontFamilyStimolo(isEmoji: boolean): string {
  return isEmoji
    ? 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    : 'ui-monospace, "JetBrains Mono", monospace';
}

// ── Componente ────────────────────────────────────────────────────────────────

export function RecallGridGriglia({
  gridSize,
  stimuli,
  modalita,
  posizionamenti,
  onPosizionamentoChange,
}: RecallGridGrigliaProps) {

  // ── Stato per tap-to-select+place ─────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Derivazioni ────────────────────────────────────────────────────────────

  const [rowsStr, colsStr] = gridSize.split("x");
  const rows = Number(rowsStr);
  const cols = Number(colsStr);
  const cellSize = cellaSizePx(gridSize);

  /** Lookup veloce stimulus per id. */
  const mappaStimolo = useMemo(() => {
    const m = new Map<string, StimoloRecallGrid>();
    for (const s of stimuli) m.set(s.id, s);
    return m;
  }, [stimuli]);

  /** Mappa posizionamenti per chiave "row,col" (solo retrieval). */
  const posizionamentiPerCella = useMemo(() => {
    const m = new Map<string, PosizionamentoUtente>();
    for (const p of posizionamenti ?? []) {
      m.set(`${p.row},${p.col}`, p);
    }
    return m;
  }, [posizionamenti]);

  /** Stimoli rimasti nel tray (retrieval mode). */
  const stimoliInTray = useMemo(() => {
    if (modalita !== "retrieval") return [];
    const placedIds = new Set((posizionamenti ?? []).map((p) => p.stimoloId));
    return stimuli.filter((s) => !placedIds.has(s.id));
  }, [modalita, stimuli, posizionamenti]);

  /** Mappa "row,col" → stimulus per encoding mode. */
  const stimoliPerCellaEncoding = useMemo(() => {
    if (modalita !== "encoding") return new Map<string, StimoloRecallGrid>();
    const m = new Map<string, StimoloRecallGrid>();
    for (const s of stimuli) m.set(`${s.row},${s.col}`, s);
    return m;
  }, [modalita, stimuli]);

  // ── Handler posizionamento (tap mode) ─────────────────────────────────────

  const handlePosiziona = useCallback(
    (stimoloId: string, row: number, col: number) => {
      const correnti = posizionamenti ?? [];
      // Rimuovi eventuale precedente posizionamento dello stesso stimolo
      // E rimuovi eventuale occupante della cella target (swap → torna in tray).
      const filtrati = correnti.filter(
        (p) => p.stimoloId !== stimoloId && !(p.row === row && p.col === col),
      );
      const nuovi = [...filtrati, { stimoloId, row, col }];
      onPosizionamentoChange?.(nuovi);
      setSelectedId(null);
    },
    [posizionamenti, onPosizionamentoChange],
  );

  // ── Stili ──────────────────────────────────────────────────────────────────

  const cellaBaseStyle: CSSProperties = {
    width:           `${cellSize}px`,
    height:          `${cellSize}px`,
    backgroundColor: "#FFFFFF",
    border:          "1px solid #E5E7EB",
    borderRadius:    "0.5rem",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    color:           "#111827",
    userSelect:      "none",
    overflow:        "hidden",
  };

  const cellaVuotaInteractiva: CSSProperties = {
    ...cellaBaseStyle,
    cursor:          "pointer",
    // Hint visivo quando una selezione è attiva: cella vuota leggermente
    // chiarita per invitare al placement.
    backgroundColor: selectedId !== null ? "#F9FAFB" : "#FFFFFF",
  };

  const cellaPienaInteractiva = (selezionata: boolean): CSSProperties => ({
    ...cellaBaseStyle,
    cursor:          "pointer",
    backgroundColor: selezionata ? "#DBEAFE" : "#FFFFFF",
  });

  const trayItemStyle = (selezionato: boolean): CSSProperties => ({
    ...cellaBaseStyle,
    backgroundColor: "#F3F4F6",
    border:          selezionato ? "2px solid #2563EB" : "1px solid #D1D5DB",
    cursor:          "pointer",
  });

  // ── Render stimolo (testo/emoji) ──────────────────────────────────────────

  function renderContenutoStimolo(stim: StimoloRecallGrid) {
    const emoji = isStimoloEmoji(stim);
    return (
      <span
        style={{
          fontFamily:  fontFamilyStimolo(emoji),
          fontSize:    fontSizeStimolo(gridSize, emoji, emoji ? undefined : stim.valore.length),
          fontWeight:  700,
          lineHeight:  1,
          textAlign:   "center",
          whiteSpace:  "nowrap",
          padding:     "2px",
        }}
      >
        {stim.valore}
      </span>
    );
  }

  // ── Render cella griglia ──────────────────────────────────────────────────

  const renderCella = (row: number, col: number) => {
    const key = `${row},${col}`;

    // Encoding: read-only.
    if (modalita === "encoding") {
      const stim = stimoliPerCellaEncoding.get(key);
      return (
        <div
          key={key}
          style={{ ...cellaBaseStyle, pointerEvents: "none" }}
          aria-label={stim ? `Cella ${row},${col} con ${stim.valore}` : `Cella ${row},${col} vuota`}
        >
          {stim && renderContenutoStimolo(stim)}
        </div>
      );
    }

    // Retrieval (tap mode unico).
    const piazz = posizionamentiPerCella.get(key);
    const stim  = piazz ? mappaStimolo.get(piazz.stimoloId) : undefined;

    return (
      <div
        key={key}
        onClick={() => {
          if (selectedId !== null) {
            // Una selezione è attiva → posiziona / swap.
            handlePosiziona(selectedId, row, col);
            return;
          }
          // Nessuna selezione attiva: se la cella è occupata, seleziona
          // lo stimolo per uno spostamento successivo.
          if (stim) setSelectedId(stim.id);
        }}
        style={
          stim
            ? cellaPienaInteractiva(selectedId === stim.id)
            : cellaVuotaInteractiva
        }
        aria-label={stim ? `Cella ${row},${col} con ${stim.valore}` : `Cella ${row},${col} vuota`}
      >
        {stim && renderContenutoStimolo(stim)}
      </div>
    );
  };

  // ── Render tray item ──────────────────────────────────────────────────────

  const renderTrayItem = (stim: StimoloRecallGrid) => {
    const selezionato = selectedId === stim.id;
    return (
      <div
        key={stim.id}
        onClick={() => setSelectedId(selezionato ? null : stim.id)}
        style={trayItemStyle(selezionato)}
        aria-label={`Stimolo ${stim.valore} ${selezionato ? "selezionato" : "non selezionato"}`}
        aria-pressed={selezionato}
      >
        {renderContenutoStimolo(stim)}
      </div>
    );
  };

  // ── Render principale ──────────────────────────────────────────────────────

  const cellArr: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cellArr.push({ row: r, col: c });
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap:                 "4px",
        }}
        aria-label={`Griglia ${gridSize}`}
        role="grid"
      >
        {cellArr.map(({ row, col }) => renderCella(row, col))}
      </div>

      {modalita === "retrieval" && (
        <div
          className="flex flex-wrap gap-2 p-2 rounded-lg w-full justify-center"
          style={{
            border:          "1px solid #D1D5DB",
            backgroundColor: "#F9FAFB",   // gray-50
            minHeight:       `${cellSize + 16}px`,
          }}
          aria-label="Zona stimoli da posizionare"
        >
          {stimoliInTray.map((s) => renderTrayItem(s))}
        </div>
      )}
    </div>
  );
}
