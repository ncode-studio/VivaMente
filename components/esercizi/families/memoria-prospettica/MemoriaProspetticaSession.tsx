"use client";

/**
 * MemoriaProspetticaSession — mini-engine del trial ibrido MP.
 *
 * Orchestra 2 fasi:
 *   Fase 1 — Istruzione (5s auto-avanzamento + "Ho capito"):
 *     Mostra coppia.etichetta e intervallo target.
 *   Fase 2 — Task continuo dual-task:
 *     - Stream parole (ISI fisso): utente tocca "✓ {etichetta}" sui target.
 *     - Finestre temporali: utente tocca "🔔 Ricordami" ogni intervalS secondi.
 *     - Orologio mm:ss sempre visibile in alto a destra.
 *     - Barra progresso neutra (tempo trascorso / durationMs).
 *
 * Tracking finestre prospettiche:
 *   setTimeout schedulati in iniziaFase2 aprono/chiudono finestreAperteRef.
 *   Tap "Ricordami" copre la prima finestra aperta (FIFO).
 *   Tap fuori finestra → ricordamiFalsiTap++.
 *
 * Idempotenza tap ongoing via tappatiRef (Set<number> per indice parola).
 * Idempotenza completamento via completatoRef.
 * Cleanup completo timer su unmount.
 */

import {
  useEffect, useRef, useState, useCallback,
  type CSSProperties,
} from "react";
import type { TrialMPHybrid, RispostaMP } from "./sequence";
import { OrologioMP } from "./OrologioMP";

// ── Props ─────────────────────────────────────────────────────────────────────

export type MemoriaProspetticaSessionProps = {
  stimolo:    TrialMPHybrid;
  onRisposta: (esito: RispostaMP) => void;
};

// ── Tipi interni ──────────────────────────────────────────────────────────────

type FasePhase = "istruzione" | "task" | "completata";
type FeedbackState = "corretto" | "falso" | null;

// ── Stili base bottoni ────────────────────────────────────────────────────────

const BASE_BTN: CSSProperties = {
  padding:      "1rem",
  borderRadius: "1rem",
  border:       "1px solid #D1D5DB",
  fontSize:     "1.25rem",
  fontWeight:   700,
  width:        "100%",
  cursor:       "pointer",
  transition:   "background-color 200ms ease-out, transform 60ms ease-out",
};

function bgOngoing(fb: FeedbackState): string {
  if (fb === "corretto") return "#86EFAC";
  if (fb === "falso")    return "#FCA5A5";
  return "#2563EB";
}
function colorOngoing(fb: FeedbackState): string {
  return fb ? "#111827" : "#FFFFFF";
}

function bgRicordami(fb: FeedbackState): string {
  if (fb === "corretto") return "#86EFAC";
  if (fb === "falso")    return "#FCA5A5";
  return "#F3F4F6";
}

// ── FaseIstruzione ────────────────────────────────────────────────────────────

function FaseIstruzione({
  stimolo,
  onConferma,
}: {
  stimolo:    TrialMPHybrid;
  onConferma: () => void;
}) {
  const intervalSec = Math.round(stimolo.intervalliMs[0] / 1000);

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-8 px-4 w-full"
      role="region"
      aria-label="Istruzione esercizio"
    >
      <p className="text-center text-lg font-semibold text-gray-800">
        Hai due compiti contemporaneamente:
      </p>

      <div className="flex flex-col gap-3 w-full max-w-md">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-gray-700 leading-relaxed">
          <strong>1.</strong> Tocca il pulsante{" "}
          <strong className="text-blue-700">✓ {stimolo.coppia.etichetta}</strong>{" "}
          ogni volta che la parola sullo schermo appartiene al gruppo{" "}
          <strong>{stimolo.coppia.etichetta.toUpperCase()}</strong>.
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-gray-700 leading-relaxed">
          <strong>2.</strong> Tocca il pulsante{" "}
          <strong className="text-amber-700">🔔 Ricordami</strong> ogni{" "}
          <strong>{intervalSec} secondi</strong>. L'orologio in alto ti aiuterà
          a tenere il tempo.
        </div>
      </div>

      <button
        onClick={onConferma}
        style={{ ...BASE_BTN, backgroundColor: "#2563EB", color: "#FFFFFF", maxWidth: "20rem" }}
        aria-label="Ho capito, inizia l'esercizio"
      >
        Ho capito
      </button>
    </div>
  );
}

// ── MemoriaProspetticaSession ─────────────────────────────────────────────────

export function MemoriaProspetticaSession({
  stimolo,
  onRisposta,
}: MemoriaProspetticaSessionProps) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [fase,            setFase]            = useState<FasePhase>("istruzione");
  const [currentIdx,      setCurrentIdx]      = useState(0);
  const [fbOngoing,       setFbOngoing]       = useState<FeedbackState>(null);
  const [fbRicordami,     setFbRicordami]     = useState<FeedbackState>(null);
  const [tickNow,         setTickNow]         = useState(() => performance.now());

  // ── Refs ───────────────────────────────────────────────────────────────────
  const taskStartedAtRef          = useRef(0);
  const currentIdxRef             = useRef(0);
  const tappatiRef                = useRef(new Set<number>());
  const finestreAperteRef         = useRef(new Set<number>());
  const finestreCorretteRef       = useRef(new Set<number>());
  const ricordamiFalsiTapRef      = useRef(0);
  const distrattoriTargetTotaliRef    = useRef(0);
  const distrattoriTargetTappatiRef   = useRef(0);
  const distrattoriFalsiTapRef        = useRef(0);
  const completatoRef             = useRef(false);
  const timersRef                 = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalTimersRef         = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Pre-calcola totale target Go
  useEffect(() => {
    distrattoriTargetTotaliRef.current =
      stimolo.sequenza.filter((s) => s.isGo).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      intervalTimersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      intervalTimersRef.current = [];
    };
  }, []);

  // Tick barra progresso (ogni 1s durante fase task)
  useEffect(() => {
    if (fase !== "task") return;
    setTickNow(performance.now());
    const id = setInterval(() => setTickNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, [fase]);

  // ── completaSessione ──────────────────────────────────────────────────────

  const completaSessione = useCallback(() => {
    if (completatoRef.current) return;
    completatoRef.current = true;
    setFase("completata");
    onRisposta({
      finestreTotali:           stimolo.nWindows,
      finestreCorrette:         finestreCorretteRef.current.size,
      ricordamiFalsiTap:        ricordamiFalsiTapRef.current,
      distrattoriTargetTotali:  distrattoriTargetTotaliRef.current,
      distrattoriTargetTappati: distrattoriTargetTappatiRef.current,
      distrattoriFalsiTap:      distrattoriFalsiTapRef.current,
    });
  }, [stimolo.nWindows, onRisposta]);

  // ── iniziaFase2 ───────────────────────────────────────────────────────────

  const iniziaFase2 = useCallback(() => {
    taskStartedAtRef.current = performance.now();
    setFase("task");
    setCurrentIdx(0);
    currentIdxRef.current = 0;

    // Avanzamento parole: setTimeout per ogni step
    const { sequenza, distractorISIMs } = stimolo;
    for (let i = 1; i < sequenza.length; i++) {
      const id = setTimeout(() => {
        currentIdxRef.current = i;
        setCurrentIdx(i);
      }, distractorISIMs * i);
      timersRef.current.push(id);
    }

    // Finestre prospettiche: apertura/chiusura
    stimolo.intervalliMs.forEach((targetMs, idx) => {
      const aperturaMs = Math.max(0, targetMs - stimolo.toleranceMs);
      const chiusuraMs = targetMs + stimolo.toleranceMs;
      const idA = setTimeout(() => finestreAperteRef.current.add(idx), aperturaMs);
      const idC = setTimeout(() => finestreAperteRef.current.delete(idx), chiusuraMs);
      intervalTimersRef.current.push(idA, idC);
    });

    // Timer di fine sessione
    const idFine = setTimeout(completaSessione, stimolo.durationMs);
    timersRef.current.push(idFine);
  }, [stimolo, completaSessione]);

  // ── handleOngoing ─────────────────────────────────────────────────────────

  const handleOngoing = useCallback(() => {
    if (fase !== "task") return;
    const idx = currentIdxRef.current;
    if (tappatiRef.current.has(idx)) return;
    tappatiRef.current.add(idx);

    const stim = stimolo.sequenza[idx];
    if (!stim) return;

    if (stim.isGo) {
      distrattoriTargetTappatiRef.current++;
      setFbOngoing("corretto");
    } else {
      distrattoriFalsiTapRef.current++;
      setFbOngoing("falso");
    }
    const id = setTimeout(() => setFbOngoing(null), 200);
    timersRef.current.push(id);
  }, [fase, stimolo.sequenza]);

  // ── handleRicordami ───────────────────────────────────────────────────────

  const handleRicordami = useCallback(() => {
    if (fase !== "task") return;
    const aperteIds = Array.from(finestreAperteRef.current);
    if (aperteIds.length > 0) {
      const finestraId = aperteIds[0];
      finestreAperteRef.current.delete(finestraId);
      finestreCorretteRef.current.add(finestraId);
      setFbRicordami("corretto");
    } else {
      ricordamiFalsiTapRef.current++;
      setFbRicordami("falso");
    }
    const id = setTimeout(() => setFbRicordami(null), 200);
    timersRef.current.push(id);
  }, [fase]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (fase === "completata") return null;
  if (fase === "istruzione") {
    return <FaseIstruzione stimolo={stimolo} onConferma={iniziaFase2} />;
  }

  // fase === "task"
  const progressoMs  = Math.max(0, tickNow - taskStartedAtRef.current);
  const progressoPct = Math.min(100, (progressoMs / stimolo.durationMs) * 100);
  const parola       = stimolo.sequenza[currentIdx]?.parola ?? "";

  return (
    <div className="flex flex-col gap-4 w-full px-4 py-4">

      {/* Barra progresso neutra (tempo, non performance) */}
      <div
        className="w-full pointer-events-none"
        style={{ height: "4px", backgroundColor: "#E5E7EB" }}
        aria-hidden="true"
      >
        <div
          style={{
            height:          "100%",
            width:           `${progressoPct}%`,
            backgroundColor: "#9CA3AF",
            transition:      "width 1000ms linear",
          }}
        />
      </div>

      {/* Orologio mm:ss */}
      <div className="flex justify-end">
        <OrologioMP startedAtMs={taskStartedAtRef.current} />
      </div>

      {/* Display parola corrente */}
      <div
        className="flex items-center justify-center w-full"
        style={{
          minHeight:       "160px",
          backgroundColor: "#F9FAFB",
          borderRadius:    "1rem",
          border:          "1px solid #E5E7EB",
        }}
        aria-live="polite"
        aria-label={`Parola: ${parola}`}
      >
        <span
          style={{
            fontSize:      "2.5rem",
            fontWeight:    700,
            color:         "#111827",
            letterSpacing: "-0.02em",
          }}
        >
          {parola}
        </span>
      </div>

      {/* Bottone task ongoing */}
      <button
        onClick={handleOngoing}
        className="active:scale-95"
        style={{
          ...BASE_BTN,
          backgroundColor: bgOngoing(fbOngoing),
          color:           colorOngoing(fbOngoing),
        }}
        aria-label={`Appartiene a ${stimolo.coppia.etichetta}`}
      >
        ✓ {stimolo.coppia.etichetta}
      </button>

      {/* Bottone Ricordami */}
      <button
        onClick={handleRicordami}
        className="active:scale-95"
        style={{
          ...BASE_BTN,
          backgroundColor: bgRicordami(fbRicordami),
          color:           "#111827",
        }}
        aria-label="Tocca Ricordami"
      >
        🔔 Ricordami
      </button>

    </div>
  );
}
