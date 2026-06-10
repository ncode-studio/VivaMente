"use client";

/**
 * IlMosaicistaTaskEngine — engine "Il Mosaicista" (id esercizio: il_mosaicista).
 *
 * Dominio: Visuospaziale — atelier di restauro mosaici. Drag-and-drop di
 * frammenti SVG su una griglia target. Modello A timer 90s, mosaici a catena.
 *
 * Bypassa TrialFlow: gestisce direttamente tutorial → sessione drag.
 * Timer sessione gestito da page.tsx via tempoScaduto.
 */

import { useState } from "react";
import type { GameEngineProps, SessionResult, TutorialConfig } from "@/lib/exercise-types";
import { CATEGORIA_COLORS } from "@/lib/design-tokens";
import { TutorialOverlay } from "@/components/esercizi/shared/TutorialOverlay";
import { getMosaicistaLevel } from "./levels";
import { IlMosaicistaSession } from "./IlMosaicistaSession";
import { MosaicCellRenderer } from "./sprites";

type Fase = "tutorial" | "sessione";

const ACCENT = CATEGORIA_COLORS.visuospaziali.text; // Mosaicista = dominio Visuospaziale

// Anteprima: alcune tessere già posate + una tessera che si aggancia al posto vuoto.
function DemoMini() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: "1.1rem",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 36px)",
        gridTemplateRows: "repeat(2, 36px)",
        gap: 2,
      }}>
        <MosaicCellRenderer cell={{ col: 0, row: 0, shape: "solid", color: "#C0573B" }} sizePx={36} highlight="placed" />
        <MosaicCellRenderer cell={{ col: 1, row: 0, shape: "solid", color: "#E8DECD" }} sizePx={36} highlight="placed" />
        <MosaicCellRenderer cell={{ col: 0, row: 1, shape: "solid", color: "#E8DECD" }} sizePx={36} highlight="placed" />
        <div style={{
          width: 36, height: 36,
          border: "2px dashed #B23A3A",
          borderRadius: 4,
          background: "rgba(178,58,58,0.08)",
        }} />
      </div>
      <div style={{ fontSize: "1.8rem", color: ACCENT }} aria-hidden>→</div>
      <MosaicCellRenderer cell={{ col: 0, row: 0, shape: "solid", color: "#C0573B" }} sizePx={42} highlight="drag" />
    </div>
  );
}

const TUTORIAL: TutorialConfig = {
  accent: ACCENT,
  ctaLabel: "Comincia il restauro",
  pagine: [{
    titolo: "Il Mosaicista",
    demo: <DemoMini />,
    righe: [
      { icona: "🖼️", testo: "Prima osservi il mosaico finito: guardalo con calma e memorizzalo." },
      { icona: "🧩", testo: "Poi il modello sparisce e restano le tessere sparse sul tavolo." },
      { icona: "👆", testo: "Trascina ogni tessera al suo posto: vicino alla casella si aggancia da sola." },
    ],
  }],
};

export function IlMosaicistaTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
}: GameEngineProps) {
  const config = getMosaicistaLevel(livello);
  const [fase, setFase] = useState<Fase>(mostraTutorial ? "tutorial" : "sessione");

  if (fase === "tutorial") {
    return (
      <TutorialOverlay
        config={TUTORIAL}
        onComplete={() => setFase("sessione")}
      />
    );
  }

  return (
    <IlMosaicistaSession
      config={config}
      tempoScaduto={tempoScaduto}
      onReady={onReady}
      onComplete={onComplete as (r: SessionResult) => void}
    />
  );
}
