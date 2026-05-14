"use client";

/**
 * Sprite SVG inline per "Il Guardiano del Giardino".
 *
 * Stile: illustrazione naturalistica sobria (target 60+), palette tenue,
 * contorni sottili, nessun look "cartoon infantile".
 *
 * Convenzione orientamento:
 *   - lo sprite di default rappresenta un volo "verso destra"
 *     (testa/becco/pungiglione a destra)
 *   - `dir = -1` applica scaleX(-1) per flippare
 *
 * La farfalla è simmetrica (ali aperte frontali) — `dir` è ininfluente.
 *
 * Animazione ali via CSS keyframes definite nella Session.
 */

import type { CSSProperties } from "react";

interface SpriteProps {
  size?: number;
  /** Direzione di volo (1 = verso destra, -1 = verso sinistra). */
  dir?: 1 | -1;
  /** Variante colore (per farfalle). */
  variant?: number;
  style?: CSSProperties;
}

// ── Palette farfalle naturalistiche ────────────────────────────────────────────
//
// Riferimenti: monarca, vanessa atalanta, papilio machaon, aurora.

const FARFALLA_PALETTE = [
  // Monarca — arancio bruciato + nervature scure
  { ala: "#C2410C", alaInt: "#FDBA74", venatura: "#1F1A17", puntini: "#FEF3C7" },
  // Vanessa — rosso mattone + bordi neri
  { ala: "#9F1239", alaInt: "#FCA5A5", venatura: "#1F1A17", puntini: "#F3F4F6" },
  // Papilio — giallo paglierino + nervature
  { ala: "#CA8A04", alaInt: "#FDE68A", venatura: "#1F1A17", puntini: "#1F1A17" },
  // Aurora — bianco crema + dettagli polvere
  { ala: "#E5E0D5", alaInt: "#FFFFFF", venatura: "#5B5A55", puntini: "#7F8C9B" },
];

export function FarfallaSprite({ size = 84, dir = 1, variant = 0, style }: SpriteProps) {
  const p = FARFALLA_PALETTE[Math.abs(variant) % FARFALLA_PALETTE.length];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        ...style,
        transform: `${style?.transform ?? ""} scaleX(${dir})`.trim(),
        overflow: "visible",
      }}
      aria-label="Farfalla"
    >
      {/* Ala superiore sinistra */}
      <g className="gg-wing gg-wing-l">
        <path
          d="M 50 50 Q 30 26 18 30 Q 10 40 16 52 Q 26 58 40 56 Z"
          fill={p.ala}
          stroke={p.venatura}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M 50 50 Q 34 36 24 38 Q 20 44 24 50 Q 34 52 42 50 Z"
          fill={p.alaInt}
          opacity="0.85"
        />
        <circle cx="22" cy="44" r="2.2" fill={p.puntini} />
        <circle cx="32" cy="50" r="1.6" fill={p.puntini} />
      </g>

      {/* Ala inferiore sinistra */}
      <g className="gg-wing gg-wing-l">
        <path
          d="M 50 52 Q 38 64 28 72 Q 22 76 22 66 Q 30 56 44 56 Z"
          fill={p.ala}
          stroke={p.venatura}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="30" cy="66" r="1.6" fill={p.puntini} />
      </g>

      {/* Ala superiore destra */}
      <g className="gg-wing gg-wing-r">
        <path
          d="M 50 50 Q 70 26 82 30 Q 90 40 84 52 Q 74 58 60 56 Z"
          fill={p.ala}
          stroke={p.venatura}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M 50 50 Q 66 36 76 38 Q 80 44 76 50 Q 66 52 58 50 Z"
          fill={p.alaInt}
          opacity="0.85"
        />
        <circle cx="78" cy="44" r="2.2" fill={p.puntini} />
        <circle cx="68" cy="50" r="1.6" fill={p.puntini} />
      </g>

      {/* Ala inferiore destra */}
      <g className="gg-wing gg-wing-r">
        <path
          d="M 50 52 Q 62 64 72 72 Q 78 76 78 66 Q 70 56 56 56 Z"
          fill={p.ala}
          stroke={p.venatura}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="70" cy="66" r="1.6" fill={p.puntini} />
      </g>

      {/* Corpo */}
      <ellipse cx="50" cy="52" rx="2.6" ry="18" fill="#1F1A17" />
      {/* Antenne sottili */}
      <path d="M 48.5 34 Q 45 24 42 22" stroke="#1F1A17" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 51.5 34 Q 55 24 58 22" stroke="#1F1A17" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ── Ape ─ stile naturalistico, ambra/seppia. Testa a DESTRA di default. ───────

export function ApeSprite({ size = 84, dir = 1, style }: SpriteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        ...style,
        transform: `${style?.transform ?? ""} scaleX(${dir})`.trim(),
        overflow: "visible",
      }}
      aria-label="Ape"
    >
      {/* Ali (sfondo, animano) */}
      <g className="gg-bee-wing">
        <ellipse
          cx="42"
          cy="38"
          rx="16"
          ry="9"
          fill="#F3F4F6"
          stroke="#9CA3AF"
          strokeWidth="1.2"
          opacity="0.75"
        />
        <ellipse
          cx="58"
          cy="38"
          rx="14"
          ry="8"
          fill="#F3F4F6"
          stroke="#9CA3AF"
          strokeWidth="1.2"
          opacity="0.65"
        />
      </g>
      {/* Addome (a sinistra) */}
      <ellipse cx="38" cy="58" rx="20" ry="14" fill="#B45309" stroke="#451A03" strokeWidth="1.6" />
      {/* Strisce sottili */}
      <path d="M 30 50 Q 30 58 32 66" stroke="#1C1917" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 40 47 Q 40 58 40 70" stroke="#1C1917" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 50 50 Q 50 58 48 66" stroke="#1C1917" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Torace */}
      <ellipse cx="60" cy="56" rx="8" ry="8" fill="#78350F" stroke="#451A03" strokeWidth="1.4" />
      {/* Testa (a destra) */}
      <circle cx="74" cy="54" r="7" fill="#3F2A1A" stroke="#1C1917" strokeWidth="1.4" />
      {/* Occhio */}
      <ellipse cx="78" cy="52" rx="2.2" ry="2.6" fill="#1C1917" />
      <circle cx="78.6" cy="51.2" r="0.7" fill="#F3F4F6" />
      {/* Antenne sottili */}
      <path d="M 77 48 Q 80 40 82 38" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 73 48 Q 74 40 73 36" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Pungiglione a sinistra (coda dell'addome) */}
      <path d="M 18 58 L 12 56 L 12 60 Z" fill="#1C1917" />
    </svg>
  );
}

// ── Uccellino ─ profilo di passero/pettirosso. Testa/becco a DESTRA. ──────────
//
// Silhouette inequivocabilmente "uccello":
//   - corpo a goccia/pera (più alto che lungo, non ovale orizzontale)
//   - testa rotonda staccata, in alto a destra
//   - becco corto e appuntito
//   - ala SOPRA il corpo (anima), non incassata nel fianco
//   - coda a ventaglio dietro (non biforcuta tipo "coda di pesce")
//   - zampine sottili accennate sotto

export function UccellinoSprite({ size = 84, dir = 1, style }: SpriteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        ...style,
        transform: `${style?.transform ?? ""} scaleX(${dir})`.trim(),
        overflow: "visible",
      }}
      aria-label="Uccellino"
    >
      {/* Coda — ventaglio corto orizzontale dietro */}
      <path
        d="M 26 60
           Q 12 56 8 60
           Q 12 64 14 66
           Q 18 66 22 64
           Q 26 64 28 62 Z"
        fill="#5B6573"
        stroke="#2A3340"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Corpo a goccia (più alto che lungo, profilo da uccello posato/in volo) */}
      <path
        d="M 30 64
           Q 26 50 36 42
           Q 50 36 60 46
           Q 64 56 60 66
           Q 50 74 38 72
           Q 30 70 30 64 Z"
        fill="#7B8794"
        stroke="#2A3340"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Pancia chiara (sottoforma) */}
      <path
        d="M 38 66
           Q 46 72 56 68
           Q 50 74 42 72
           Q 38 70 38 66 Z"
        fill="#E5E9EE"
        opacity="0.9"
      />

      {/* Macchia rossiccia sul petto (tocco da pettirosso) */}
      <path
        d="M 46 52
           Q 54 50 58 56
           Q 54 60 46 58
           Q 44 55 46 52 Z"
        fill="#B23A2E"
        opacity="0.85"
      />

      {/* Testa rotonda staccata in alto a destra */}
      <circle cx="64" cy="36" r="13" fill="#7B8794" stroke="#2A3340" strokeWidth="1.6" />
      {/* Calotta più scura (effetto piumaggio) */}
      <path
        d="M 53 32
           Q 64 22 76 32
           Q 70 28 64 28
           Q 58 28 53 32 Z"
        fill="#5B6573"
        opacity="0.9"
      />

      {/* Occhio */}
      <circle cx="68" cy="34" r="2.4" fill="#F5F2E7" stroke="#2A3340" strokeWidth="0.8" />
      <circle cx="68.5" cy="33.6" r="1.3" fill="#0F172A" />
      <circle cx="68.9" cy="33.2" r="0.4" fill="#F8FAFC" />

      {/* Becco — corto, appuntito, in due valve */}
      <path
        d="M 76 36
           L 88 35
           L 76 39 Z"
        fill="#D4A028"
        stroke="#7A5A14"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <line x1="76" y1="37" x2="88" y2="36" stroke="#7A5A14" strokeWidth="0.6" />

      {/* Ala (sopra il corpo, anima) */}
      <g className="gg-bird-wing">
        <path
          d="M 38 50
             Q 42 36 56 38
             Q 60 46 56 54
             Q 48 58 40 56
             Q 36 54 38 50 Z"
          fill="#5B6573"
          stroke="#2A3340"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Penne accennate sull'ala */}
        <path d="M 42 50 Q 48 50 54 52" stroke="#2A3340" strokeWidth="0.7" fill="none" />
        <path d="M 44 54 Q 50 54 56 54" stroke="#2A3340" strokeWidth="0.7" fill="none" />
      </g>

      {/* Zampine sottili */}
      <line x1="42" y1="72" x2="42" y2="80" stroke="#3F2A1A" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="50" y1="73" x2="50" y2="80" stroke="#3F2A1A" strokeWidth="1.4" strokeLinecap="round" />
      {/* Dita */}
      <path d="M 42 80 L 39 82 M 42 80 L 45 82" stroke="#3F2A1A" strokeWidth="1" strokeLinecap="round" />
      <path d="M 50 80 L 47 82 M 50 80 L 53 82" stroke="#3F2A1A" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// ── Libellula ─ profilo laterale, addome lungo verso sinistra, testa a DESTRA ─

export function LibellulaSprite({ size = 84, dir = 1, style }: SpriteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        ...style,
        transform: `${style?.transform ?? ""} scaleX(${dir})`.trim(),
        overflow: "visible",
      }}
      aria-label="Libellula"
    >
      {/* Ali — 4 lamine allungate semi-trasparenti, sovrapposte */}
      <g className="gg-dragon-wing">
        {/* Ala superiore sinistra */}
        <ellipse
          cx="40" cy="38" rx="22" ry="6"
          fill="#E8F0F4" stroke="#7B8FA1" strokeWidth="1"
          opacity="0.78"
          transform="rotate(-8 40 38)"
        />
        {/* Ala inferiore sinistra */}
        <ellipse
          cx="44" cy="54" rx="20" ry="5"
          fill="#E8F0F4" stroke="#7B8FA1" strokeWidth="1"
          opacity="0.7"
          transform="rotate(8 44 54)"
        />
        {/* Ala superiore destra */}
        <ellipse
          cx="64" cy="38" rx="20" ry="5.5"
          fill="#E8F0F4" stroke="#7B8FA1" strokeWidth="1"
          opacity="0.78"
          transform="rotate(8 64 38)"
        />
        {/* Ala inferiore destra */}
        <ellipse
          cx="60" cy="54" rx="18" ry="4.5"
          fill="#E8F0F4" stroke="#7B8FA1" strokeWidth="1"
          opacity="0.7"
          transform="rotate(-8 60 54)"
        />
      </g>

      {/* Nervature ali (sottili) */}
      <g stroke="#7B8FA1" strokeWidth="0.5" fill="none" opacity="0.65">
        <line x1="22" y1="38" x2="58" y2="38" />
        <line x1="26" y1="54" x2="62" y2="54" />
        <line x1="46" y1="38" x2="82" y2="38" />
        <line x1="42" y1="54" x2="76" y2="54" />
      </g>

      {/* Addome lungo segmentato (a sinistra) */}
      <g>
        <rect x="12" y="46" width="44" height="5" rx="2.5" fill="#2A6B5A" />
        {/* Segmenti scuri */}
        <line x1="22" y1="46" x2="22" y2="51" stroke="#0F3D33" strokeWidth="1.2" />
        <line x1="30" y1="46" x2="30" y2="51" stroke="#0F3D33" strokeWidth="1.2" />
        <line x1="38" y1="46" x2="38" y2="51" stroke="#0F3D33" strokeWidth="1.2" />
        <line x1="46" y1="46" x2="46" y2="51" stroke="#0F3D33" strokeWidth="1.2" />
        {/* Estremità addome appuntita */}
        <path d="M 12 46 L 6 48 L 12 51 Z" fill="#0F3D33" />
        {/* Riflesso metallico verde brillante sopra */}
        <rect x="14" y="46.5" width="40" height="1.4" fill="#5BA890" opacity="0.7" />
      </g>

      {/* Torace */}
      <ellipse cx="62" cy="48" rx="7" ry="6.5" fill="#1F4A3D" stroke="#0A2B22" strokeWidth="1.2" />
      {/* Riflesso torace */}
      <ellipse cx="60" cy="46" rx="3" ry="2" fill="#5BA890" opacity="0.55" />

      {/* Testa con occhi enormi (caratteristica libellula) */}
      <circle cx="74" cy="46" r="8" fill="#0F3D33" stroke="#0A2B22" strokeWidth="1.2" />
      {/* Occhio composto enorme */}
      <circle cx="76" cy="44" r="5" fill="#1F1A17" />
      <circle cx="76" cy="44" r="4" fill="#2A6B5A" opacity="0.85" />
      <circle cx="77.5" cy="42.5" r="1.4" fill="#A8D8C0" />
      <circle cx="78" cy="42" r="0.6" fill="#FFFFFF" />
    </svg>
  );
}

// ── Coccinella ─ profilo laterale, testa a DESTRA, ala sollevata in volo ──────

export function CoccinellaSprite({ size = 84, dir = 1, style }: SpriteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        ...style,
        transform: `${style?.transform ?? ""} scaleX(${dir})`.trim(),
        overflow: "visible",
      }}
      aria-label="Coccinella"
    >
      {/* Ala posteriore trasparente sollevata (vola — anima) */}
      <g className="gg-ladybug-wing">
        <path
          d="M 36 46
             Q 22 30 18 36
             Q 22 48 40 50 Z"
          fill="#F0F4F1"
          stroke="#7B8FA1"
          strokeWidth="0.9"
          opacity="0.6"
        />
      </g>

      {/* Cupola (elitra visibile dal lato) */}
      <path
        d="M 22 60
           Q 22 38 50 36
           Q 76 38 78 60 Z"
        fill="#B7222B"
        stroke="#5C0E14"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Linea inferiore di chiusura elitra */}
      <line x1="22" y1="60" x2="76" y2="60" stroke="#5C0E14" strokeWidth="1.6" strokeLinecap="round" />
      {/* Riflesso lucido in alto */}
      <path
        d="M 30 46
           Q 40 38 56 40"
        stroke="#E15159"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Puntini neri visibili sul fianco (4, distribuiti sull'elitra) */}
      <circle cx="34" cy="52" r="2.6" fill="#1C1917" />
      <circle cx="46" cy="48" r="2.4" fill="#1C1917" />
      <circle cx="58" cy="52" r="2.6" fill="#1C1917" />
      <circle cx="68" cy="56" r="2.2" fill="#1C1917" />

      {/* Testa nera sporgente a destra */}
      <ellipse cx="82" cy="54" rx="8" ry="7" fill="#1C1917" stroke="#000" strokeWidth="0.8" />
      {/* Occhio */}
      <circle cx="85" cy="52" r="1.8" fill="#F5F2E7" />
      <circle cx="85.4" cy="51.6" r="0.9" fill="#1C1917" />

      {/* Antenne corte rivolte avanti */}
      <path d="M 84 47 Q 88 40 90 36" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 80 47 Q 82 40 81 36" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="90" cy="36" r="1.1" fill="#1C1917" />
      <circle cx="81" cy="36" r="1.1" fill="#1C1917" />

      {/* Zampine sottili sotto (3 visibili sul lato) */}
      <line x1="32" y1="60" x2="26" y2="70" stroke="#1C1917" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="48" y1="60" x2="46" y2="72" stroke="#1C1917" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="64" y1="60" x2="66" y2="70" stroke="#1C1917" strokeWidth="1.4" strokeLinecap="round" />
      {/* Tarsi accennati */}
      <path d="M 26 70 L 23 72 M 26 70 L 29 72" stroke="#1C1917" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M 46 72 L 43 74 M 46 72 L 49 74" stroke="#1C1917" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M 66 70 L 63 72 M 66 70 L 69 72" stroke="#1C1917" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

// ── GardenBackground ─ scenario realistico sobrio per target 60+ ──────────────
//
// Composizione SVG inline a strati (parallasse statico):
//   - cielo gradient morbido (alba/giorno)
//   - colline lontane silhouette sfumate
//   - filare alberi sullo sfondo
//   - cespugli + prato in primo piano con ciuffi d'erba
//   - qualche papavero e margherita sparsi (forme realistiche, non cartoon)
//
// Tutto in `position: absolute; inset: 0` — pointer-events: none.

export function GardenBackground() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 420"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <defs>
        {/* Cielo: blu polvere → bianco caldo → ambra chiara all'orizzonte */}
        <linearGradient id="gg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#A8BCC9" />
          <stop offset="55%" stopColor="#D9DDD3" />
          <stop offset="78%" stopColor="#E8E0C4" />
          <stop offset="80%" stopColor="#C7CCAA" />
        </linearGradient>
        {/* Prato vicino: verde salvia → verde oliva profondo */}
        <linearGradient id="gg-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#9CAE7E" />
          <stop offset="60%"  stopColor="#7E8F5E" />
          <stop offset="100%" stopColor="#5F7048" />
        </linearGradient>
        <linearGradient id="gg-hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#9BA8A0" />
          <stop offset="100%" stopColor="#7C8C84" />
        </linearGradient>
        <linearGradient id="gg-hill-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7E9075" />
          <stop offset="100%" stopColor="#5F7459" />
        </linearGradient>
        {/* Bagliore solare leggero */}
        <radialGradient id="gg-sun" cx="0.78" cy="0.18" r="0.35">
          <stop offset="0%"   stopColor="#FBF3D6" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#FBF3D6" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#FBF3D6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cielo */}
      <rect x="0" y="0" width="800" height="336" fill="url(#gg-sky)" />
      {/* Bagliore solare */}
      <rect x="0" y="0" width="800" height="336" fill="url(#gg-sun)" />

      {/* Colline lontane (orizzonte) */}
      <path
        d="M 0 280 Q 120 248 240 268 Q 360 252 480 274 Q 600 256 720 270 L 800 268 L 800 336 L 0 336 Z"
        fill="url(#gg-hill-far)"
        opacity="0.85"
      />
      {/* Colline medie */}
      <path
        d="M 0 302 Q 100 282 200 298 Q 320 280 440 300 Q 560 286 680 302 Q 740 296 800 302 L 800 336 L 0 336 Z"
        fill="url(#gg-hill-mid)"
        opacity="0.92"
      />

      {/* Filare di alberi sullo sfondo (silhouette stilizzate, no cerchi cartoon) */}
      <g opacity="0.78">
        <TreeFar x={70}  y={300} h={42} c="#4F6347" />
        <TreeFar x={130} y={302} h={36} c="#556B4A" />
        <TreeFar x={210} y={300} h={48} c="#4A5F42" />
        <TreeFar x={320} y={304} h={32} c="#56684C" />
        <TreeFar x={400} y={300} h={44} c="#4D6044" />
        <TreeFar x={520} y={303} h={38} c="#55694D" />
        <TreeFar x={620} y={300} h={46} c="#4A5E42" />
        <TreeFar x={710} y={303} h={34} c="#536648" />
      </g>

      {/* Prato in primo piano */}
      <path
        d="M 0 320 Q 200 314 400 322 Q 600 316 800 322 L 800 420 L 0 420 Z"
        fill="url(#gg-grass)"
      />

      {/* Cespugli sparsi sul prato (silhouette morbide) */}
      <g opacity="0.92">
        <Cespuglio x={60}  y={340} w={70} c="#5C6E48" />
        <Cespuglio x={240} y={350} w={58} c="#536744" />
        <Cespuglio x={480} y={345} w={80} c="#5A6D47" />
        <Cespuglio x={680} y={352} w={64} c="#566942" />
      </g>

      {/* Ciuffi d'erba sottili (linee curve) */}
      <g stroke="#3E4F33" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.65">
        {Array.from({ length: 60 }).map((_, i) => {
          const x  = (i * 13.5) % 800;
          const y  = 360 + ((i * 7) % 50);
          const dx = (i % 2 === 0 ? -3 : 3);
          return <path key={`g-${i}`} d={`M ${x} ${y} Q ${x + dx} ${y - 7} ${x + dx * 2} ${y - 12}`} />;
        })}
      </g>

      {/* Fiori sparsi: papaveri rossi + margherite bianche, pochi e realistici */}
      <Papavero x={120} y={388} />
      <Papavero x={310} y={396} />
      <Papavero x={555} y={388} />
      <Papavero x={720} y={398} />
      <Margherita x={185} y={400} />
      <Margherita x={420} y={392} />
      <Margherita x={620} y={400} />
      <Margherita x={760} y={392} />
    </svg>
  );
}

// ── Sub-componenti del background ──────────────────────────────────────────────

function TreeFar({ x, y, h, c }: { x: number; y: number; h: number; c: string }) {
  // Albero a chioma irregolare, no forme cartoon
  const w = h * 0.85;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M ${-w / 2} 0
            Q ${-w / 2} ${-h * 0.7} 0 ${-h}
            Q ${w / 2} ${-h * 0.7} ${w / 2} 0 Z`}
        fill={c}
      />
      <rect x="-1.5" y="-2" width="3" height="6" fill="#3E2E22" />
    </g>
  );
}

function Cespuglio({ x, y, w, c }: { x: number; y: number; w: number; c: string }) {
  // Cespuglio basso, profilo organico
  const h = w * 0.5;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M ${-w / 2} 0
            Q ${-w / 2.3} ${-h * 1.1} ${-w / 4} ${-h}
            Q 0 ${-h * 1.3} ${w / 4} ${-h}
            Q ${w / 2.3} ${-h * 1.1} ${w / 2} 0 Z`}
        fill={c}
      />
    </g>
  );
}

function Papavero({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Stelo */}
      <path d="M 0 0 Q -1 -10 0 -16" stroke="#3E5232" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Petali (4 lobi sovrapposti, asimmetrici) */}
      <ellipse cx="-3" cy="-19" rx="4.2" ry="3.2" fill="#A11D25" transform="rotate(-25)" />
      <ellipse cx="3"  cy="-19" rx="4.2" ry="3.2" fill="#B1232C" transform="rotate(25)" />
      <ellipse cx="0"  cy="-22" rx="4.6" ry="3"   fill="#7E1A1F" />
      {/* Pistilli */}
      <circle cx="0" cy="-20" r="1.2" fill="#1F1A17" />
    </g>
  );
}

function Margherita({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M 0 0 Q 1 -8 0 -12" stroke="#3E5232" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 6 petali bianchi */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60) - 90;
        return (
          <ellipse
            key={i}
            cx="0" cy="-14" rx="2.6" ry="1.4"
            fill="#F5F2E7"
            stroke="#9A9684"
            strokeWidth="0.4"
            transform={`rotate(${angle} 0 -12)`}
          />
        );
      })}
      {/* Centro giallo */}
      <circle cx="0" cy="-12" r="1.6" fill="#D4A028" />
    </g>
  );
}
