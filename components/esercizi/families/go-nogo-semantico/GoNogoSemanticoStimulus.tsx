"use client";

/**
 * GoNogoSemanticoStimulus — rendering di un singolo trial Go/No-Go Semantico.
 *
 * Mostra una parola grande centrata e un bottone "Tocca". L'utente deve
 * toccare solo se la parola appartiene alla categoria target annunciata
 * nell'header dell'engine. Niente colori differenziati — la distinzione
 * avviene esclusivamente via classificazione semantica.
 *
 * Struttura identica a GoNogoStimulus (cromatico): stesso pulse motorio 80ms,
 * stessa gestione disabilitato, stesso cleanup timer su unmount.
 */

import { useRef, useCallback, useState, useEffect } from "react";
import type { StimoloSemantico } from "./sequence";

export interface GoNogoSemanticoRisposta {
  tempoMs: number;
}

interface GoNogoSemanticoStimulusProps {
  stimolo:      StimoloSemantico;
  onRisposta:   (r: GoNogoSemanticoRisposta) => void;
  disabilitato: boolean;
}

const TAP_PULSE_DURATION_MS = 80;

export function GoNogoSemanticoStimulus({
  stimolo,
  onRisposta,
  disabilitato,
}: GoNogoSemanticoStimulusProps) {
  const startRef     = useRef(performance.now());
  const [tapPulse, setTapPulse] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current !== null) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const onTap = useCallback(() => {
    if (disabilitato) return;
    setTapPulse(true);
    if (pulseTimerRef.current !== null) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setTapPulse(false), TAP_PULSE_DURATION_MS);
    onRisposta({ tempoMs: performance.now() - startRef.current });
  }, [disabilitato, onRisposta]);

  return (
    <div
      className="flex flex-col items-center gap-12 py-8 px-4 select-none"
      style={{ touchAction: "manipulation" }}
    >
      {/* Parola stimolo — testo grande, neutro, no colore semantico */}
      <div
        className="min-h-[120px] flex items-center justify-center"
        aria-label={`Stimolo: ${stimolo.parola}`}
      >
        <span
          className="text-5xl font-bold text-gray-900 text-center leading-tight"
          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
        >
          {stimolo.parola}
        </span>
      </div>

      {/* Bottone tap — #11: NIENTE categoria target a schermo. L'etichetta
          va tenuta in memoria di lavoro (annunciata solo nel tutorial),
          altrimenti la condizione "Go" sarebbe banalizzata. Label neutra. */}
      <button
        onClick={onTap}
        disabled={disabilitato}
        aria-label="Tocca se appartiene al gruppo di oggi"
        style={{
          transform:  tapPulse ? "scale(1.05)" : "scale(1)",
          transition: "transform 40ms ease-out",
        }}
        className="w-full max-w-md min-h-[80px] rounded-2xl bg-blue-600 text-white text-xl font-bold active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      >
        ✓ Tocca
      </button>
    </div>
  );
}
