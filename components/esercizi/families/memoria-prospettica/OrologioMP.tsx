"use client";

/**
 * OrologioMP — orologio mm:ss sempre visibile per Memoria Prospettica ibrida.
 *
 * Renderizza il tempo trascorso da `startedAtMs` con refresh ogni 1000ms.
 * L'orologio è sempre visibile a tutti i livelli (nessuna logica ridotta/assente).
 */

import { useEffect, useState } from "react";

export type OrologioMPProps = {
  /** Timestamp ms di inizio Fase 2 (= performance.now() all'avvio del task). */
  startedAtMs: number;
};

function formatMMSS(elapsedMs: number): string {
  const totSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const m = Math.floor(totSec / 60);
  const s = totSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function OrologioMP({ startedAtMs }: OrologioMPProps) {
  const [now, setNow] = useState<number>(() => performance.now());

  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = Math.max(0, now - startedAtMs);

  return (
    <div
      style={{
        padding:         "0.5rem 1rem",
        backgroundColor: "#F3F4F6",
        border:          "1px solid #E5E7EB",
        borderRadius:    "0.5rem",
        fontFamily:      'ui-monospace, "JetBrains Mono", monospace',
        fontSize:        "1.5rem",
        fontWeight:      700,
        color:           "#111827",
        display:         "inline-block",
        textAlign:       "center",
        minWidth:        "5rem",
      }}
      aria-label={`Tempo trascorso ${formatMMSS(elapsedMs)}`}
    >
      {formatMMSS(elapsedMs)}
    </div>
  );
}
