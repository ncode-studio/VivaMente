/**
 * Componente CartaSvg — renderizza una carta con N copie di una forma in
 * un colore. Stile flat, minimale, pulito.
 *
 * viewBox dinamico in base al numero di copie:
 *   numero=1 → 60×100
 *   numero=2 → 110×100
 *   numero=3 → 160×100
 *
 * Le forme hanno tutte stesso bounding box (40×40) e sono centrate
 * verticalmente nel viewBox. Tra le forme c'è 10px di spazio.
 */

import type { JSX } from "react";
import {
  COLORE_HEX,
  type Colore,
  type Forma,
  type Numero,
} from "./levels";

const STROKE_W = 2.5;
const STROKE   = "#1F2937";

function disegnaForma(forma: Forma, cx: number, cy: number, fill: string): JSX.Element {
  switch (forma) {
    case "cerchio":
      return <circle cx={cx} cy={cy} r={18} fill={fill} stroke={STROKE} strokeWidth={STROKE_W} />;
    case "quadrato":
      return <rect x={cx - 18} y={cy - 18} width={36} height={36} fill={fill} stroke={STROKE} strokeWidth={STROKE_W} rx={3} />;
    case "triangolo":
      return (
        <polygon
          points={`${cx},${cy - 20} ${cx + 19},${cy + 16} ${cx - 19},${cy + 16}`}
          fill={fill}
          stroke={STROKE}
          strokeWidth={STROKE_W}
          strokeLinejoin="round"
        />
      );
  }
}

interface Props {
  forma:  Forma;
  colore: Colore;
  numero: Numero;
  size:   number; // larghezza desiderata in px
}

export function CartaSvg({ forma, colore, numero, size }: Props): JSX.Element {
  // Larghezza viewBox in base al numero (mantiene aspect ratio costante per forma).
  const padX = 14;
  const formaW = 40;
  const gap = 10;
  const totalW = padX * 2 + formaW * numero + gap * (numero - 1);
  const totalH = 80;

  const cy = totalH / 2;
  const fill = COLORE_HEX[colore];

  // Calcola posizioni X centrate.
  const startX = padX + formaW / 2;
  const positions = Array.from({ length: numero }, (_, i) => startX + i * (formaW + gap));

  // Scala size mantenendo proporzione di altezza.
  const heightPx = (size * totalH) / totalW;

  return (
    <svg
      width={size}
      height={heightPx}
      viewBox={`0 0 ${totalW} ${totalH}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {positions.map((cx, i) => (
        <g key={i}>{disegnaForma(forma, cx, cy, fill)}</g>
      ))}
    </svg>
  );
}
