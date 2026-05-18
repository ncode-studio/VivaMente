"use client";

/**
 * Sprite e fondali per "Il Naturalista".
 *
 * Stile: tavole naturalistiche d'epoca (Audubon/Haeckel). Palette
 * ocra/seppia/verde-oliva/blu-prussia su carta invecchiata. Tutto SVG,
 * niente raster.
 *
 * Le scene sono SVG con viewBox 1000×700. Le creature sono <g> che
 * vengono posizionate via transform sul piano scena.
 */

import type { CSSProperties, ReactNode } from "react";

// ── Palette tavole d'epoca ───────────────────────────────────────────────────

export const NAT_COLORS = {
  cartaChiara: "#F2E6CC",
  cartaMedia:  "#E6D4B0",
  cartaScura:  "#C9A96F",
  inchiostro:  "#3B2A18",
  seppia:      "#6B4A24",
  verdeOliva:  "#5C6B3A",
  verdeBosco:  "#3E5128",
  verdeMuschio:"#7A8C4F",
  blu:         "#244B66",
  bluProfondo: "#162F44",
  bluAcqua:    "#5E8AA0",
  ocra:        "#B97A2E",
  ocraChiaro:  "#D9A95C",
  rossoMattone:"#9A4226",
  giallo:      "#D9B14A",
};

// ── Wrapper carta invecchiata ────────────────────────────────────────────────

export function PaperBackground({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background:
          "radial-gradient(ellipse at center, #F2E6CC 0%, #E6D4B0 60%, #C9A96F 100%)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Icone UI ─────────────────────────────────────────────────────────────────

export function LenteIcon({ size = 18, color = NAT_COLORS.inchiostro }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={color} strokeWidth="2.2" />
      <line x1="15.2" y1="15.2" x2="20.5" y2="20.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="8.5" cy="8.5" r="1.6" fill={color} opacity="0.35" />
    </svg>
  );
}

// ── Definizioni scene ────────────────────────────────────────────────────────
// Ciascuna scena è un <g> di sfondo. Le creature vengono sovrapposte dopo.

export function PratoScene({ densita }: { densita: number }) {
  const elementi = Math.round(20 + densita * 50);
  return (
    <g>
      <rect width="1000" height="700" fill={NAT_COLORS.cartaChiara} />
      <rect width="1000" height="700" fill="url(#pratoSeed)" opacity="0.55" />
      {/* fasci d'erba sparsi */}
      {Array.from({ length: elementi }).map((_, i) => {
        const x = ((i * 73) % 980) + 10;
        const y = 380 + ((i * 47) % 300);
        const h = 24 + ((i * 13) % 40);
        const lean = ((i * 37) % 18) - 9;
        const c = i % 3 === 0 ? NAT_COLORS.verdeOliva : i % 3 === 1 ? NAT_COLORS.verdeMuschio : NAT_COLORS.verdeBosco;
        return (
          <path
            key={`g${i}`}
            d={`M${x} ${y + h} Q${x + lean} ${y + h / 2} ${x + lean * 1.6} ${y}`}
            stroke={c}
            strokeWidth="1.4"
            fill="none"
            opacity="0.7"
          />
        );
      })}
      {/* macchie d'erba al suolo */}
      {Array.from({ length: Math.round(elementi / 3) }).map((_, i) => {
        const x = ((i * 131) % 1000);
        const y = 420 + ((i * 89) % 260);
        return (
          <ellipse
            key={`gp${i}`}
            cx={x} cy={y} rx={18 + (i % 6) * 3} ry={3.5}
            fill={NAT_COLORS.verdeOliva}
            opacity="0.18"
          />
        );
      })}
      {/* sole alto */}
      <circle cx="120" cy="100" r="55" fill={NAT_COLORS.giallo} opacity="0.25" />
    </g>
  );
}

export function PratoFiorito({ densita }: { densita: number }) {
  const fiori = Math.round(30 + densita * 60);
  return (
    <g>
      <PratoScene densita={densita * 0.8} />
      {Array.from({ length: fiori }).map((_, i) => {
        const x = ((i * 97) % 980) + 10;
        const y = 380 + ((i * 71) % 290);
        const tipo = i % 4;
        return <Fiorellino key={`f${i}`} x={x} y={y} tipo={tipo} />;
      })}
    </g>
  );
}

function Fiorellino({ x, y, tipo }: { x: number; y: number; tipo: number }) {
  const colors: Record<number, string> = {
    0: NAT_COLORS.giallo,
    1: NAT_COLORS.rossoMattone,
    2: "#C9748F",
    3: "#7A6BA3",
  };
  const c = colors[tipo];
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="0" x2="0" y2="14" stroke={NAT_COLORS.verdeOliva} strokeWidth="1.4" />
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse
          key={a}
          cx="0" cy="-4" rx="3" ry="5.5"
          fill={c}
          transform={`rotate(${a})`}
          opacity="0.85"
        />
      ))}
      <circle r="2.4" cy="-4" fill={NAT_COLORS.ocra} />
    </g>
  );
}

export function BoscoScene({ densita, fitto }: { densita: number; fitto: boolean }) {
  const tronchi = Math.round((fitto ? 9 : 6) + densita * 6);
  const foglie = Math.round((fitto ? 80 : 40) + densita * 120);
  return (
    <g>
      <rect width="1000" height="700" fill={NAT_COLORS.cartaChiara} />
      {/* lontananza */}
      <rect y="0" width="1000" height="280" fill={NAT_COLORS.verdeMuschio} opacity="0.12" />
      <rect y="280" width="1000" height="420" fill={NAT_COLORS.verdeBosco} opacity="0.08" />
      {/* tronchi sullo sfondo */}
      {Array.from({ length: tronchi }).map((_, i) => {
        const x = ((i * 131) % 980) + 8;
        const w = 22 + ((i * 7) % 18);
        return (
          <g key={`t${i}`}>
            <rect x={x} y="120" width={w} height="580" fill={NAT_COLORS.seppia} opacity={fitto ? 0.55 : 0.4} />
            <rect x={x + w * 0.2} y="120" width={w * 0.25} height="580" fill={NAT_COLORS.inchiostro} opacity="0.18" />
            {/* venature */}
            {Array.from({ length: 5 }).map((__, k) => (
              <line key={k} x1={x + 2} y1={150 + k * 110} x2={x + w - 2} y2={155 + k * 110}
                stroke={NAT_COLORS.inchiostro} strokeWidth="0.6" opacity="0.4" />
            ))}
          </g>
        );
      })}
      {/* baldacchino di foglie */}
      {Array.from({ length: foglie }).map((_, i) => {
        const x = ((i * 53) % 1000);
        const y = ((i * 79) % 420);
        const r = 8 + ((i * 11) % 14);
        const c = i % 3 === 0 ? NAT_COLORS.verdeMuschio : i % 3 === 1 ? NAT_COLORS.verdeOliva : NAT_COLORS.verdeBosco;
        return <ellipse key={`l${i}`} cx={x} cy={y} rx={r} ry={r * 0.65} fill={c} opacity={fitto ? 0.55 : 0.45} />;
      })}
      {/* foglie a terra */}
      {Array.from({ length: Math.round(foglie / 2) }).map((_, i) => {
        const x = ((i * 97) % 980) + 10;
        const y = 470 + ((i * 67) % 220);
        const rot = (i * 23) % 360;
        return (
          <ellipse key={`fa${i}`} cx={x} cy={y} rx="9" ry="3"
            fill={i % 2 === 0 ? NAT_COLORS.ocra : NAT_COLORS.seppia}
            opacity="0.55"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        );
      })}
      {/* rami in primo piano */}
      <path d="M-20 200 Q200 250 420 220 T880 240 L1020 235 L1020 252 Q700 270 420 245 Q200 260 -20 220 Z"
        fill={NAT_COLORS.seppia} opacity="0.6" />
      <path d="M-20 480 Q260 520 520 500 T1020 510 L1020 524 Q700 538 520 518 Q260 532 -20 500 Z"
        fill={NAT_COLORS.seppia} opacity="0.5" />
    </g>
  );
}

export function FondaleScene({ densita, fitto }: { densita: number; fitto: boolean }) {
  const alghe = Math.round((fitto ? 18 : 10) + densita * 14);
  const bolle = Math.round(15 + densita * 30);
  const coralli = Math.round((fitto ? 8 : 4) + densita * 6);
  return (
    <g>
      <rect width="1000" height="700" fill={NAT_COLORS.bluAcqua} />
      <rect width="1000" height="700" fill="url(#acquaGrad)" />
      {/* raggi di luce */}
      {[120, 320, 560, 760].map((x, i) => (
        <polygon key={i}
          points={`${x},0 ${x - 60},700 ${x + 60},700 ${x + 30},0`}
          fill={NAT_COLORS.cartaChiara} opacity="0.07" />
      ))}
      {/* sabbia */}
      <path d="M0 540 Q200 510 400 530 T800 520 T1000 535 L1000 700 L0 700 Z"
        fill={NAT_COLORS.ocraChiaro} opacity="0.85" />
      <path d="M0 580 Q250 560 500 575 T1000 570 L1000 700 L0 700 Z"
        fill={NAT_COLORS.ocra} opacity="0.5" />
      {/* coralli */}
      {Array.from({ length: coralli }).map((_, i) => {
        const x = ((i * 137) % 950) + 30;
        const h = 70 + ((i * 19) % 90);
        const c = i % 2 === 0 ? NAT_COLORS.rossoMattone : "#C46B5E";
        return (
          <g key={`co${i}`}>
            <path d={`M${x} 560 Q${x - 12} ${560 - h * 0.6} ${x - 4} ${560 - h} Q${x + 6} ${560 - h * 0.6} ${x + 14} 560`}
              fill={c} opacity="0.8" stroke={NAT_COLORS.inchiostro} strokeWidth="0.5" />
            <circle cx={x - 4} cy={560 - h} r="6" fill={c} opacity="0.7" />
            <circle cx={x + 2} cy={560 - h * 0.7} r="4" fill={c} opacity="0.6" />
          </g>
        );
      })}
      {/* alghe ondulate */}
      {Array.from({ length: alghe }).map((_, i) => {
        const x = ((i * 79) % 980) + 10;
        const h = 100 + ((i * 31) % 220);
        const sway = ((i * 11) % 24) - 12;
        const c = i % 2 === 0 ? NAT_COLORS.verdeOliva : NAT_COLORS.verdeBosco;
        return (
          <path key={`al${i}`}
            d={`M${x} 560 Q${x + sway} ${560 - h * 0.5} ${x - sway} ${560 - h}`}
            stroke={c} strokeWidth={3 + (i % 3)} fill="none" opacity="0.75" strokeLinecap="round"
          />
        );
      })}
      {/* bolle */}
      {Array.from({ length: bolle }).map((_, i) => {
        const x = ((i * 113) % 1000);
        const y = ((i * 53) % 540);
        const r = 3 + ((i * 7) % 8);
        return <circle key={`b${i}`} cx={x} cy={y} r={r} fill={NAT_COLORS.cartaChiara} opacity="0.3" stroke={NAT_COLORS.cartaChiara} strokeOpacity="0.5" />;
      })}
    </g>
  );
}

// ── Definitions: gradiente per fondali ───────────────────────────────────────

export function SceneDefs() {
  return (
    <defs>
      <linearGradient id="acquaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={NAT_COLORS.bluProfondo} stopOpacity="0.45" />
        <stop offset="60%" stopColor={NAT_COLORS.blu} stopOpacity="0.12" />
        <stop offset="100%" stopColor={NAT_COLORS.bluAcqua} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="autunnoGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A36B2E" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#6B4A24" stopOpacity="0.4" />
      </linearGradient>
      <pattern id="pratoSeed" patternUnits="userSpaceOnUse" width="40" height="40">
        <circle cx="8" cy="12" r="1.2" fill={NAT_COLORS.verdeOliva} opacity="0.4" />
        <circle cx="28" cy="30" r="1" fill={NAT_COLORS.verdeBosco} opacity="0.45" />
        <circle cx="18" cy="6" r="0.8" fill={NAT_COLORS.verdeMuschio} opacity="0.4" />
      </pattern>
    </defs>
  );
}

// ── Creature: 12 tipi disegnati a mano ───────────────────────────────────────
// Ogni creatura è un <g> centrato su (0, 0), disegnata in un box ~100×100
// con vista frontale o laterale. La camuffabilità è gestita lato Session
// applicando un filtro (saturazione/opacità) all'esterno.

export type CreatureKind =
  | "farfalla" | "scarabeo" | "lumaca" | "uccello" | "scoiattolo" | "bruco"
  | "rana" | "pesce" | "medusa" | "stellaMarina" | "granchio" | "cavalluccio"
  | "libellula" | "ape" | "coccinella" | "lucertola" | "ragno" | "riccio";

interface CreatureProps {
  kind: CreatureKind;
  /** Opacità complessiva (per mimetismo). */
  opacity?: number;
  /** Tinta da miscelare con i colori vivaci (mimetismo). */
  tintColor?: string;
  /** Intensità tinta (0–1). */
  tintMix?: number;
}

function blend(base: string, tint: string | undefined, mix: number): string {
  if (!tint || mix <= 0) return base;
  // miscela hex semplice
  const a = hexToRgb(base);
  const b = hexToRgb(tint);
  const r = Math.round(a.r * (1 - mix) + b.r * mix);
  const g = Math.round(a.g * (1 - mix) + b.g * mix);
  const bl = Math.round(a.b * (1 - mix) + b.b * mix);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(h: string): { r: number; g: number; b: number } {
  if (h.startsWith("rgb")) {
    const m = h.match(/rgb\((\d+),(\d+),(\d+)\)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  }
  const s = h.replace("#", "");
  const r = parseInt(s.substring(0, 2), 16);
  const g = parseInt(s.substring(2, 4), 16);
  const b = parseInt(s.substring(4, 6), 16);
  return { r, g, b };
}

export function Creature({ kind, opacity = 1, tintColor, tintMix = 0 }: CreatureProps) {
  const tint = (c: string) => blend(c, tintColor, tintMix);
  const ink = NAT_COLORS.inchiostro;

  switch (kind) {
    case "farfalla":
      return (
        <g opacity={opacity}>
          {/* ali superiori */}
          <path d="M0 0 Q-22 -28 -38 -16 Q-46 -2 -32 8 Q-16 6 0 0 Z" fill={tint("#C97A2E")} stroke={ink} strokeWidth="1" />
          <path d="M0 0 Q22 -28 38 -16 Q46 -2 32 8 Q16 6 0 0 Z" fill={tint("#C97A2E")} stroke={ink} strokeWidth="1" />
          {/* ali inferiori */}
          <path d="M0 2 Q-18 18 -28 12 Q-30 4 -16 4 Q-8 4 0 2 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="1" />
          <path d="M0 2 Q18 18 28 12 Q30 4 16 4 Q8 4 0 2 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="1" />
          {/* macchie ocelli */}
          <circle cx="-22" cy="-8" r="3.5" fill={tint("#F2E6CC")} stroke={ink} strokeWidth="0.6" />
          <circle cx="22" cy="-8" r="3.5" fill={tint("#F2E6CC")} stroke={ink} strokeWidth="0.6" />
          <circle cx="-22" cy="-8" r="1.4" fill={ink} />
          <circle cx="22" cy="-8" r="1.4" fill={ink} />
          {/* corpo */}
          <ellipse cx="0" cy="0" rx="2.2" ry="14" fill={ink} />
          {/* antenne */}
          <path d="M-1 -12 Q-6 -22 -4 -28" stroke={ink} strokeWidth="0.8" fill="none" />
          <path d="M1 -12 Q6 -22 4 -28" stroke={ink} strokeWidth="0.8" fill="none" />
          <circle cx="-4" cy="-28" r="0.9" fill={ink} />
          <circle cx="4" cy="-28" r="0.9" fill={ink} />
        </g>
      );
    case "scarabeo":
      return (
        <g opacity={opacity}>
          <ellipse cx="0" cy="0" rx="20" ry="26" fill={tint("#3E5128")} stroke={ink} strokeWidth="1" />
          <path d="M0 -26 L0 26" stroke={ink} strokeWidth="0.8" />
          <ellipse cx="0" cy="-18" rx="9" ry="8" fill={tint("#244B66")} stroke={ink} strokeWidth="0.8" />
          {/* zampe */}
          {[-1, 1].map(s => (
            <g key={s}>
              <line x1={s * 12} y1="-8" x2={s * 24} y2="-14" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
              <line x1={s * 14} y1="0" x2={s * 28} y2="2" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
              <line x1={s * 12} y1="10" x2={s * 24} y2="18" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
            </g>
          ))}
          {/* lucentezza */}
          <ellipse cx="-6" cy="-4" rx="3" ry="6" fill="#FFFFFF" opacity="0.18" />
        </g>
      );
    case "lumaca":
      return (
        <g opacity={opacity}>
          {/* corpo */}
          <path d="M-30 14 Q-30 4 -10 4 Q14 4 22 12 L34 12 L34 18 L-28 18 Z" fill={tint("#D9A95C")} stroke={ink} strokeWidth="1" />
          {/* guscio */}
          <circle cx="-2" cy="-2" r="16" fill={tint("#C97A2E")} stroke={ink} strokeWidth="1" />
          <path d="M-2 -2 m-12 0 a12 12 0 0 1 24 0 a8 8 0 0 1 -16 0 a4 4 0 0 1 8 0" fill="none" stroke={ink} strokeWidth="0.8" />
          {/* antenne */}
          <line x1="-26" y1="6" x2="-32" y2="-6" stroke={ink} strokeWidth="0.8" />
          <line x1="-22" y1="4" x2="-26" y2="-8" stroke={ink} strokeWidth="0.8" />
          <circle cx="-32" cy="-6" r="1.5" fill={ink} />
          <circle cx="-26" cy="-8" r="1.5" fill={ink} />
        </g>
      );
    case "uccello":
      return (
        <g opacity={opacity}>
          <path d="M-20 0 Q-26 -10 -10 -12 Q14 -14 24 -2 Q22 8 8 8 Q-10 10 -20 0 Z" fill={tint("#244B66")} stroke={ink} strokeWidth="1" />
          {/* ala */}
          <path d="M-4 -6 Q-2 -16 14 -10 Q8 -4 -4 -2 Z" fill={tint("#162F44")} stroke={ink} strokeWidth="0.8" />
          {/* testa */}
          <circle cx="-18" cy="-6" r="8" fill={tint("#244B66")} stroke={ink} strokeWidth="0.8" />
          <circle cx="-22" cy="-8" r="1.4" fill={NAT_COLORS.cartaChiara} stroke={ink} strokeWidth="0.4" />
          <circle cx="-22" cy="-8" r="0.7" fill={ink} />
          {/* becco */}
          <path d="M-26 -6 L-32 -4 L-26 -2 Z" fill={tint("#D9B14A")} stroke={ink} strokeWidth="0.6" />
          {/* coda */}
          <path d="M22 0 L34 -6 L32 4 Z" fill={tint("#162F44")} stroke={ink} strokeWidth="0.8" />
          {/* zampe */}
          <line x1="-2" y1="8" x2="-2" y2="16" stroke={ink} strokeWidth="0.9" />
          <line x1="6" y1="8" x2="6" y2="16" stroke={ink} strokeWidth="0.9" />
        </g>
      );
    case "scoiattolo":
      return (
        <g opacity={opacity}>
          {/* coda voluminosa */}
          <path d="M18 8 Q40 0 32 -22 Q22 -28 12 -16 Q14 -6 18 8 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="1" />
          <path d="M18 8 Q34 4 30 -16 Q24 -22 18 -10" fill="none" stroke={ink} strokeWidth="0.6" />
          {/* corpo */}
          <ellipse cx="0" cy="6" rx="14" ry="12" fill={tint("#B97A2E")} stroke={ink} strokeWidth="1" />
          {/* testa */}
          <circle cx="-12" cy="-2" r="8" fill={tint("#B97A2E")} stroke={ink} strokeWidth="1" />
          {/* orecchio */}
          <path d="M-16 -8 L-18 -14 L-12 -10 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="0.6" />
          {/* occhio */}
          <circle cx="-15" cy="-3" r="1.4" fill={ink} />
          {/* zampe */}
          <line x1="-2" y1="16" x2="-4" y2="22" stroke={ink} strokeWidth="1.2" />
          <line x1="6" y1="16" x2="8" y2="22" stroke={ink} strokeWidth="1.2" />
        </g>
      );
    case "bruco":
      return (
        <g opacity={opacity}>
          {[-22, -11, 0, 11, 22].map((cx, i) => (
            <circle key={i} cx={cx} cy="0" r="9" fill={tint(i === 4 ? "#5C6B3A" : "#7A8C4F")} stroke={ink} strokeWidth="0.9" />
          ))}
          <circle cx="-22" cy="-2" r="1.4" fill={ink} />
          <line x1="-22" y1="-9" x2="-26" y2="-14" stroke={ink} strokeWidth="0.8" />
          <line x1="-20" y1="-9" x2="-18" y2="-15" stroke={ink} strokeWidth="0.8" />
        </g>
      );
    case "rana":
      return (
        <g opacity={opacity}>
          {/* corpo */}
          <ellipse cx="0" cy="6" rx="22" ry="14" fill={tint("#5C6B3A")} stroke={ink} strokeWidth="1" />
          <ellipse cx="0" cy="-2" rx="16" ry="10" fill={tint("#7A8C4F")} stroke={ink} strokeWidth="0.8" />
          {/* occhi sporgenti */}
          <circle cx="-10" cy="-10" r="5" fill={tint("#7A8C4F")} stroke={ink} strokeWidth="0.8" />
          <circle cx="10" cy="-10" r="5" fill={tint("#7A8C4F")} stroke={ink} strokeWidth="0.8" />
          <circle cx="-10" cy="-10" r="2.4" fill={NAT_COLORS.giallo} />
          <circle cx="10" cy="-10" r="2.4" fill={NAT_COLORS.giallo} />
          <circle cx="-10" cy="-10" r="1" fill={ink} />
          <circle cx="10" cy="-10" r="1" fill={ink} />
          {/* zampe */}
          <path d="M-22 12 Q-32 18 -26 24 L-18 22" fill={tint("#5C6B3A")} stroke={ink} strokeWidth="0.8" />
          <path d="M22 12 Q32 18 26 24 L18 22" fill={tint("#5C6B3A")} stroke={ink} strokeWidth="0.8" />
        </g>
      );
    case "pesce":
      return (
        <g opacity={opacity}>
          <path d="M-22 0 Q-12 -14 14 -10 Q26 -2 26 4 Q26 10 14 14 Q-12 18 -22 4 Z" fill={tint("#D9A95C")} stroke={ink} strokeWidth="1" />
          {/* coda */}
          <path d="M-22 0 L-36 -10 L-32 4 L-36 14 Z" fill={tint("#C97A2E")} stroke={ink} strokeWidth="0.8" />
          {/* pinne */}
          <path d="M-4 -8 L0 -16 L8 -8 Z" fill={tint("#C97A2E")} stroke={ink} strokeWidth="0.6" />
          <path d="M-4 8 L4 14 L8 8 Z" fill={tint("#C97A2E")} stroke={ink} strokeWidth="0.6" />
          {/* occhio */}
          <circle cx="14" cy="-2" r="2.4" fill={NAT_COLORS.cartaChiara} stroke={ink} strokeWidth="0.4" />
          <circle cx="14" cy="-2" r="1.1" fill={ink} />
          {/* scaglie */}
          {[-8, 0, 8].map(x => (
            <path key={x} d={`M${x} -2 Q${x + 4} 2 ${x} 6`} fill="none" stroke={ink} strokeWidth="0.4" opacity="0.6" />
          ))}
        </g>
      );
    case "medusa":
      return (
        <g opacity={opacity}>
          {/* cupola */}
          <path d="M-24 -2 Q-24 -28 0 -28 Q24 -28 24 -2 Q24 4 0 4 Q-24 4 -24 -2 Z" fill={tint("#C9748F")} stroke={ink} strokeWidth="1" opacity="0.85" />
          <path d="M-18 -10 Q-12 -22 -2 -22" fill="none" stroke={ink} strokeWidth="0.6" opacity="0.6" />
          <path d="M18 -10 Q12 -22 2 -22" fill="none" stroke={ink} strokeWidth="0.6" opacity="0.6" />
          {/* tentacoli */}
          {[-18, -10, -2, 6, 14].map((x, i) => (
            <path key={i} d={`M${x} 4 Q${x + 2} 18 ${x - 2} 32`} fill="none" stroke={tint("#C9748F")} strokeWidth="2" opacity="0.7" />
          ))}
          {[-14, -6, 2, 10, 18].map((x, i) => (
            <path key={`b${i}`} d={`M${x} 4 Q${x - 4} 20 ${x + 2} 36`} fill="none" stroke={tint("#9A4226")} strokeWidth="1" opacity="0.5" />
          ))}
        </g>
      );
    case "stellaMarina":
      return (
        <g opacity={opacity}>
          <path
            d="M0 -24 L7 -8 L24 -6 L11 4 L16 22 L0 12 L-16 22 L-11 4 L-24 -6 L-7 -8 Z"
            fill={tint("#C97A2E")} stroke={ink} strokeWidth="1"
          />
          {/* puntini */}
          {[0, 72, 144, 216, 288].map(a => (
            <circle key={a} cx="0" cy="-14" r="1.6" fill={ink} opacity="0.6" transform={`rotate(${a})`} />
          ))}
          <circle r="3" fill={tint("#9A4226")} opacity="0.7" />
        </g>
      );
    case "granchio":
      return (
        <g opacity={opacity}>
          {/* corpo */}
          <ellipse cx="0" cy="0" rx="20" ry="12" fill={tint("#9A4226")} stroke={ink} strokeWidth="1" />
          <path d="M-14 -6 Q0 -14 14 -6" fill="none" stroke={ink} strokeWidth="0.7" />
          {/* occhi */}
          <line x1="-6" y1="-10" x2="-6" y2="-16" stroke={ink} strokeWidth="0.9" />
          <line x1="6" y1="-10" x2="6" y2="-16" stroke={ink} strokeWidth="0.9" />
          <circle cx="-6" cy="-17" r="1.8" fill={ink} />
          <circle cx="6" cy="-17" r="1.8" fill={ink} />
          {/* chele */}
          <path d="M-20 -2 Q-30 -8 -34 0 Q-30 4 -24 4 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="0.8" />
          <path d="M-34 0 Q-38 -4 -36 4 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="0.6" />
          <path d="M20 -2 Q30 -8 34 0 Q30 4 24 4 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="0.8" />
          <path d="M34 0 Q38 -4 36 4 Z" fill={tint("#9A4226")} stroke={ink} strokeWidth="0.6" />
          {/* zampe */}
          {[-1, 1].map(s => [0, 1, 2].map(j => (
            <line key={`l${s}${j}`}
              x1={s * (10 - j * 2)} y1="8"
              x2={s * (22 + j * 2)} y2={14 + j * 3}
              stroke={ink} strokeWidth="1.1" strokeLinecap="round" />
          )))}
        </g>
      );
    case "cavalluccio":
      return (
        <g opacity={opacity}>
          <path d="M-2 -22 Q-12 -20 -10 -10 Q-2 -8 -2 0 Q-2 10 -10 14 Q-6 22 4 22 Q12 18 12 8 Q12 -2 4 -6 Q6 -16 0 -22 Z"
            fill={tint("#D9B14A")} stroke={ink} strokeWidth="1" />
          {/* muso */}
          <path d="M-2 -22 L-8 -22 L-6 -16 Z" fill={tint("#D9B14A")} stroke={ink} strokeWidth="0.6" />
          {/* occhio */}
          <circle cx="-4" cy="-16" r="1.4" fill={ink} />
          {/* aletta dorsale */}
          <path d="M0 -4 Q8 -6 6 4" fill="none" stroke={ink} strokeWidth="0.7" />
          {/* anelli */}
          {[-10, -4, 4, 12].map((y, i) => (
            <path key={i} d={`M-8 ${y} Q0 ${y + 1} 10 ${y - 1}`} fill="none" stroke={ink} strokeWidth="0.5" opacity="0.6" />
          ))}
        </g>
      );
    case "libellula":
      return (
        <g opacity={opacity}>
          {/* corpo lungo */}
          <ellipse cx="0" cy="0" rx="3" ry="26" fill={tint("#3E8BA8")} stroke={ink} strokeWidth="0.8" />
          {/* segmenti corpo */}
          {[-18, -12, -6, 0, 6, 12, 18].map(y => (
            <line key={y} x1="-3" y1={y} x2="3" y2={y} stroke={ink} strokeWidth="0.4" opacity="0.6" />
          ))}
          {/* testa con occhi grandi */}
          <circle cx="0" cy="-30" r="6" fill={tint("#3E8BA8")} stroke={ink} strokeWidth="0.8" />
          <circle cx="-3.5" cy="-31" r="3" fill={tint("#244B66")} stroke={ink} strokeWidth="0.5" />
          <circle cx="3.5" cy="-31" r="3" fill={tint("#244B66")} stroke={ink} strokeWidth="0.5" />
          {/* ali — 4 ali trasparenti, venate */}
          <ellipse cx="-22" cy="-12" rx="22" ry="6" fill={tint("#E6F0F4")} stroke={ink} strokeWidth="0.7" opacity="0.7" />
          <ellipse cx="22" cy="-12" rx="22" ry="6" fill={tint("#E6F0F4")} stroke={ink} strokeWidth="0.7" opacity="0.7" />
          <ellipse cx="-22" cy="4" rx="20" ry="5.5" fill={tint("#E6F0F4")} stroke={ink} strokeWidth="0.7" opacity="0.7" />
          <ellipse cx="22" cy="4" rx="20" ry="5.5" fill={tint("#E6F0F4")} stroke={ink} strokeWidth="0.7" opacity="0.7" />
          {/* venature ali */}
          {[-32, -22, -12].map(x => (
            <line key={`vu${x}`} x1={x} y1="-15" x2={x + 2} y2="-9" stroke={ink} strokeWidth="0.3" opacity="0.5" />
          ))}
          {[12, 22, 32].map(x => (
            <line key={`vd${x}`} x1={x} y1="-15" x2={x - 2} y2="-9" stroke={ink} strokeWidth="0.3" opacity="0.5" />
          ))}
        </g>
      );
    case "ape":
      return (
        <g opacity={opacity}>
          {/* corpo a strisce */}
          <ellipse cx="0" cy="0" rx="14" ry="10" fill={tint("#D9B14A")} stroke={ink} strokeWidth="1" />
          {[-7, 0, 7].map(x => (
            <rect key={x} x={x - 1.8} y="-10" width="3.6" height="20" fill={ink} opacity="0.85" />
          ))}
          {/* testa */}
          <circle cx="-12" cy="-2" r="6" fill={tint("#2A2010")} stroke={ink} strokeWidth="0.7" />
          <circle cx="-14" cy="-3" r="1.2" fill={NAT_COLORS.cartaChiara} />
          {/* antenne */}
          <line x1="-14" y1="-7" x2="-18" y2="-14" stroke={ink} strokeWidth="0.7" />
          <line x1="-11" y1="-7" x2="-12" y2="-14" stroke={ink} strokeWidth="0.7" />
          <circle cx="-18" cy="-14" r="0.9" fill={ink} />
          <circle cx="-12" cy="-14" r="0.9" fill={ink} />
          {/* ali */}
          <ellipse cx="-2" cy="-10" rx="9" ry="5" fill={tint("#FFFFFF")} stroke={ink} strokeWidth="0.5" opacity="0.7" />
          <ellipse cx="6" cy="-10" rx="7" ry="4" fill={tint("#FFFFFF")} stroke={ink} strokeWidth="0.5" opacity="0.7" />
          {/* pungiglione */}
          <path d="M14 0 L18 0 L14 2 Z" fill={ink} />
        </g>
      );
    case "coccinella":
      return (
        <g opacity={opacity}>
          {/* corpo rotondo */}
          <ellipse cx="0" cy="0" rx="18" ry="16" fill={tint("#C8362B")} stroke={ink} strokeWidth="1.2" />
          {/* linea centrale */}
          <line x1="0" y1="-14" x2="0" y2="14" stroke={ink} strokeWidth="1.3" />
          {/* macchie */}
          {[[-8, -6, 3], [-7, 7, 3], [8, -6, 3], [7, 7, 3], [-4, 0, 2.5], [4, 0, 2.5]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={ink} />
          ))}
          {/* testa */}
          <path d="M-9 -14 Q0 -22 9 -14 Q5 -10 -5 -10 Z" fill={tint("#1F1810")} stroke={ink} strokeWidth="0.8" />
          {/* zampette */}
          {[-1, 1].map(s => [0, 1, 2].map(j => (
            <line key={`l${s}${j}`}
              x1={s * (8 - j)} y1={-6 + j * 6}
              x2={s * (20 + j)} y2={-6 + j * 8}
              stroke={ink} strokeWidth="0.9" strokeLinecap="round" />
          )))}
        </g>
      );
    case "lucertola":
      return (
        <g opacity={opacity}>
          {/* corpo allungato + coda lunga */}
          <path
            d="M-24 0 Q-10 -8 6 -6 Q22 -4 30 6 Q24 14 8 14 Q-8 14 -16 8 Q-22 6 -24 0 Z
               M-24 0 Q-32 -2 -38 4 Q-40 8 -36 8 Q-30 6 -24 4 Z"
            fill={tint("#7A8C4F")} stroke={ink} strokeWidth="1"
          />
          {/* coda */}
          <path d="M30 6 Q44 4 50 -4 Q52 -8 48 -8 Q42 -4 36 0" fill={tint("#5C6B3A")} stroke={ink} strokeWidth="0.8" />
          {/* testa con occhio */}
          <circle cx="-26" cy="-2" r="2" fill={ink} />
          {/* macchie sul dorso */}
          {[-10, 0, 10, 20].map((x, i) => (
            <ellipse key={i} cx={x} cy="-2" rx="3" ry="2" fill={tint("#5C6B3A")} opacity="0.8" />
          ))}
          {/* zampe */}
          <path d="M-14 8 L-18 16 L-12 14 L-10 10 Z" fill={tint("#5C6B3A")} stroke={ink} strokeWidth="0.7" />
          <path d="M14 8 L18 16 L12 14 L10 10 Z" fill={tint("#5C6B3A")} stroke={ink} strokeWidth="0.7" />
        </g>
      );
    case "ragno":
      return (
        <g opacity={opacity}>
          {/* zampe — 8 zampe simmetriche, articolate */}
          {[-1, 1].map(s => [0, 1, 2, 3].map(j => {
            const ang = -55 + j * 35; // °
            const rad = (ang * Math.PI) / 180;
            const x1 = s * 6 * Math.cos((j - 1.5) * 0.4);
            const y1 = -2 + (j - 1.5) * 3;
            const len = 20 + j * 1.5;
            const x2 = x1 + s * len * Math.cos(rad);
            const y2 = y1 + len * Math.sin(rad);
            const xm = (x1 + x2) / 2 + s * 4;
            const ym = (y1 + y2) / 2 - 4;
            return (
              <path key={`leg${s}${j}`}
                d={`M${x1} ${y1} Q${xm} ${ym} ${x2} ${y2}`}
                stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round"
                opacity="0.92"
              />
            );
          }))}
          {/* addome */}
          <ellipse cx="0" cy="2" rx="14" ry="12" fill={tint("#3B2A18")} stroke={ink} strokeWidth="1" />
          {/* segno chiaro sul dorso */}
          <path d="M-4 -2 Q0 -6 4 -2 Q2 4 0 6 Q-2 4 -4 -2 Z" fill={tint("#D9A95C")} opacity="0.7" />
          {/* cefalotorace */}
          <ellipse cx="0" cy="-8" rx="7" ry="6" fill={tint("#2A1F12")} stroke={ink} strokeWidth="0.7" />
          {/* occhietti */}
          <circle cx="-2" cy="-10" r="0.8" fill={NAT_COLORS.cartaChiara} />
          <circle cx="2" cy="-10" r="0.8" fill={NAT_COLORS.cartaChiara} />
        </g>
      );
    case "riccio":
      return (
        <g opacity={opacity}>
          {/* corpo */}
          <ellipse cx="0" cy="4" rx="24" ry="16" fill={tint("#6B4A24")} stroke={ink} strokeWidth="1" />
          {/* aculei (linee fitte) */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = -Math.PI * 0.9 + (i * Math.PI * 1.05) / 23;
            const x1 = Math.cos(a) * 22;
            const y1 = 4 + Math.sin(a) * 14;
            const x2 = Math.cos(a) * 30;
            const y2 = 4 + Math.sin(a) * 22;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={tint("#3B2A18")} strokeWidth="1.3" strokeLinecap="round" />
            );
          })}
          {/* musetto */}
          <ellipse cx="-20" cy="4" rx="8" ry="6" fill={tint("#E0C9A0")} stroke={ink} strokeWidth="0.8" />
          {/* naso */}
          <circle cx="-26" cy="4" r="1.4" fill={ink} />
          {/* occhio */}
          <circle cx="-18" cy="0" r="1.2" fill={ink} />
          {/* zampette piccole */}
          <line x1="-8" y1="18" x2="-8" y2="22" stroke={ink} strokeWidth="1.2" />
          <line x1="8" y1="18" x2="8" y2="22" stroke={ink} strokeWidth="1.2" />
        </g>
      );
  }
}

// ── Scene aggiuntive ─────────────────────────────────────────────────────────

export function StagnoNinfeeScene({ densita }: { densita: number }) {
  const ninfee = Math.round(5 + densita * 7);
  const canne = Math.round(8 + densita * 14);
  return (
    <g>
      <rect width="1000" height="700" fill={NAT_COLORS.cartaChiara} />
      {/* riva di fondo */}
      <path d="M0 0 L1000 0 L1000 220 Q700 240 500 230 T0 240 Z"
        fill={NAT_COLORS.verdeMuschio} opacity="0.25" />
      {/* acqua */}
      <rect y="240" width="1000" height="460" fill={NAT_COLORS.bluAcqua} opacity="0.55" />
      <rect y="240" width="1000" height="460" fill="url(#acquaGrad)" opacity="0.7" />
      {/* riflessi superficie */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = (i * 91) % 980;
        const y = 280 + ((i * 67) % 380);
        return <ellipse key={`r${i}`} cx={x} cy={y} rx={26 + (i % 5) * 4} ry="1.5"
          fill={NAT_COLORS.cartaChiara} opacity="0.35" />;
      })}
      {/* canneti che spuntano */}
      {Array.from({ length: canne }).map((_, i) => {
        const x = ((i * 67) % 980) + 10;
        const y = 240 + ((i * 41) % 60);
        const h = 80 + ((i * 17) % 90);
        return (
          <g key={`c${i}`}>
            <line x1={x} y1={y} x2={x + ((i % 3) - 1) * 4} y2={y - h}
              stroke={NAT_COLORS.verdeBosco} strokeWidth="2.2" />
            <ellipse cx={x + ((i % 3) - 1) * 4} cy={y - h - 6}
              rx="2.4" ry="10" fill={NAT_COLORS.seppia} />
          </g>
        );
      })}
      {/* ninfee con fiore */}
      {Array.from({ length: ninfee }).map((_, i) => {
        const x = 80 + ((i * 173) % 880);
        const y = 320 + ((i * 71) % 320);
        return (
          <g key={`n${i}`} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="0" rx="44" ry="24" fill={NAT_COLORS.verdeOliva} stroke={NAT_COLORS.inchiostro} strokeWidth="0.8" opacity="0.85" />
            <path d="M0 0 L40 4" stroke={NAT_COLORS.inchiostro} strokeWidth="0.5" opacity="0.5" />
            <path d="M0 0 L-32 14" stroke={NAT_COLORS.inchiostro} strokeWidth="0.5" opacity="0.5" />
            {i % 2 === 0 && (
              <g transform="translate(0 -2)">
                {[0, 60, 120, 180, 240, 300].map(a => (
                  <ellipse key={a} cx="0" cy="-5" rx="3.5" ry="7"
                    fill="#F2E6E8" stroke={NAT_COLORS.inchiostro} strokeWidth="0.4"
                    transform={`rotate(${a})`} />
                ))}
                <circle r="3" fill={NAT_COLORS.giallo} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function SottoboscoAutunnaleScene({ densita }: { densita: number }) {
  const foglie = Math.round(80 + densita * 140);
  const funghi = Math.round(4 + densita * 10);
  const rametti = Math.round(8 + densita * 12);
  return (
    <g>
      <rect width="1000" height="700" fill="#D9B98A" />
      <rect width="1000" height="700" fill="url(#autunnoGrad)" />
      {/* tronchi sfondo */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = 80 + i * 240 + ((i * 31) % 60);
        return (
          <g key={`tr${i}`}>
            <rect x={x} y="0" width={32 + (i % 3) * 8} height="700"
              fill={NAT_COLORS.seppia} opacity="0.55" />
            <rect x={x + 4} y="0" width="6" height="700" fill={NAT_COLORS.inchiostro} opacity="0.2" />
          </g>
        );
      })}
      {/* tappeto di foglie ocra/rosso/seppia */}
      {Array.from({ length: foglie }).map((_, i) => {
        const x = ((i * 53) % 1000);
        const y = 200 + ((i * 71) % 500);
        const rot = (i * 29) % 360;
        const palette = [NAT_COLORS.ocra, NAT_COLORS.rossoMattone, NAT_COLORS.seppia, NAT_COLORS.giallo, "#A3411A"];
        const c = palette[i % palette.length];
        return (
          <g key={`f${i}`} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <path d="M0 -10 Q8 -4 6 4 Q3 8 0 6 Q-3 8 -6 4 Q-8 -4 0 -10 Z"
              fill={c} stroke={NAT_COLORS.inchiostro} strokeWidth="0.5" opacity="0.85" />
            <line x1="0" y1="-10" x2="0" y2="6" stroke={NAT_COLORS.inchiostro} strokeWidth="0.4" opacity="0.6" />
          </g>
        );
      })}
      {/* rametti */}
      {Array.from({ length: rametti }).map((_, i) => {
        const x = ((i * 113) % 980);
        const y = 380 + ((i * 47) % 280);
        const len = 50 + ((i * 7) % 30);
        const rot = (i * 53) % 180;
        return (
          <g key={`rr${i}`} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <line x1="0" y1="0" x2={len} y2="0" stroke={NAT_COLORS.inchiostro} strokeWidth="1.6" opacity="0.7" />
            <line x1={len * 0.5} y1="0" x2={len * 0.6} y2="-12" stroke={NAT_COLORS.inchiostro} strokeWidth="1.1" opacity="0.6" />
          </g>
        );
      })}
      {/* funghi rossi a pois */}
      {Array.from({ length: funghi }).map((_, i) => {
        const x = 60 + ((i * 167) % 900);
        const y = 460 + ((i * 53) % 200);
        return (
          <g key={`fu${i}`} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="-4" rx="14" ry="10" fill={NAT_COLORS.rossoMattone} stroke={NAT_COLORS.inchiostro} strokeWidth="0.8" />
            {[[-4, -6, 1.5], [4, -4, 1.4], [0, -2, 1.2], [-7, -2, 1], [6, -7, 1]].map(([x, y, r], j) => (
              <circle key={j} cx={x} cy={y} r={r} fill={NAT_COLORS.cartaChiara} />
            ))}
            <rect x="-3" y="-3" width="6" height="14" fill={NAT_COLORS.cartaMedia} stroke={NAT_COLORS.inchiostro} strokeWidth="0.6" rx="1" />
          </g>
        );
      })}
    </g>
  );
}

export function ScoglieraMarinaScene({ densita }: { densita: number }) {
  const cespugli = Math.round(6 + densita * 8);
  const conchiglie = Math.round(4 + densita * 8);
  return (
    <g>
      {/* cielo */}
      <rect width="1000" height="700" fill="#D6E5EE" />
      <rect width="1000" height="280" fill={NAT_COLORS.bluAcqua} opacity="0.3" />
      {/* nuvole */}
      {[200, 600, 880].map((x, i) => (
        <g key={i} transform={`translate(${x} ${80 + (i % 2) * 30})`}>
          <ellipse cx="0" cy="0" rx="60" ry="14" fill={NAT_COLORS.cartaChiara} opacity="0.75" />
          <ellipse cx="-20" cy="-6" rx="30" ry="10" fill={NAT_COLORS.cartaChiara} opacity="0.75" />
        </g>
      ))}
      {/* mare */}
      <path d="M0 280 L1000 280 L1000 360 Q500 380 0 360 Z" fill={NAT_COLORS.blu} opacity="0.55" />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 73) % 1000;
        const y = 300 + ((i * 31) % 50);
        return <path key={`w${i}`} d={`M${x} ${y} q14 -4 28 0`} stroke={NAT_COLORS.cartaChiara} strokeWidth="1.4" fill="none" opacity="0.6" />;
      })}
      {/* scogli (massa rocciosa in primo piano) */}
      <path
        d="M-30 580 Q60 480 160 540 Q240 500 320 560 Q420 510 520 560 Q620 520 720 570 Q820 530 920 580 L1030 580 L1030 720 L-30 720 Z"
        fill={NAT_COLORS.seppia}
      />
      <path
        d="M-30 580 Q60 480 160 540 Q240 500 320 560 Q420 510 520 560 Q620 520 720 570 Q820 530 920 580"
        fill="none" stroke={NAT_COLORS.inchiostro} strokeWidth="1.4" opacity="0.7"
      />
      {/* spaccature/venature roccia */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = (i * 53) % 1000;
        const y = 600 + ((i * 11) % 80);
        return <path key={`cr${i}`} d={`M${x} ${y} L${x + 10 + (i % 5) * 3} ${y + 14}`}
          stroke={NAT_COLORS.inchiostro} strokeWidth="1" opacity="0.55" />;
      })}
      {/* macchie umide più scure */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 79) % 980 + 10;
        const y = 590 + ((i * 23) % 100);
        return <ellipse key={`u${i}`} cx={x} cy={y} rx={18 + (i % 4) * 5} ry="6"
          fill={NAT_COLORS.inchiostro} opacity="0.22" />;
      })}
      {/* alghe verdi e brune sugli scogli */}
      {Array.from({ length: cespugli }).map((_, i) => {
        const x = 60 + ((i * 137) % 900);
        const y = 580 + ((i * 17) % 30);
        return (
          <g key={`alg${i}`}>
            {[0, 1, 2, 3, 4].map(j => (
              <path key={j}
                d={`M${x + j * 3} ${y} q${(j % 2 === 0 ? 4 : -4)} -14 ${(j % 2 === 0 ? 8 : -8)} -28`}
                stroke={i % 2 === 0 ? NAT_COLORS.verdeBosco : NAT_COLORS.seppia}
                strokeWidth="2" fill="none" opacity="0.78" strokeLinecap="round" />
            ))}
          </g>
        );
      })}
      {/* conchiglie sparse */}
      {Array.from({ length: conchiglie }).map((_, i) => {
        const x = 80 + ((i * 191) % 880);
        const y = 620 + ((i * 41) % 70);
        return (
          <g key={`co${i}`} transform={`translate(${x} ${y}) rotate(${(i * 37) % 60 - 30})`}>
            <path d="M0 0 Q-8 -10 0 -14 Q8 -10 0 0 Z" fill={NAT_COLORS.cartaMedia} stroke={NAT_COLORS.inchiostro} strokeWidth="0.6" />
            <path d="M0 -2 L0 -12" stroke={NAT_COLORS.inchiostro} strokeWidth="0.4" />
            <path d="M-3 -4 L3 -4 M-4 -8 L4 -8" stroke={NAT_COLORS.inchiostro} strokeWidth="0.3" />
          </g>
        );
      })}
    </g>
  );
}

export function PratoAlpinoScene({ densita }: { densita: number }) {
  const fiorellini = Math.round(40 + densita * 70);
  const sassi = Math.round(8 + densita * 14);
  const ciuffi = Math.round(20 + densita * 30);
  return (
    <g>
      {/* cielo chiaro */}
      <rect width="1000" height="700" fill="#E5EEF5" />
      {/* montagne lontane */}
      <path d="M0 260 L140 140 L240 220 L360 100 L480 200 L620 130 L760 220 L880 140 L1000 250 L1000 320 L0 320 Z"
        fill={NAT_COLORS.bluAcqua} opacity="0.55" stroke={NAT_COLORS.inchiostro} strokeWidth="0.6" />
      {/* nevai */}
      <path d="M340 110 L360 100 L380 130 L360 170 L350 140 Z" fill={NAT_COLORS.cartaChiara} opacity="0.95" />
      <path d="M600 140 L620 130 L640 160 L625 180 Z" fill={NAT_COLORS.cartaChiara} opacity="0.9" />
      {/* erba alpina (verde più freddo) */}
      <path d="M0 320 Q200 340 400 325 T800 320 T1000 330 L1000 700 L0 700 Z"
        fill="#5F7B4A" opacity="0.85" />
      {/* sassi affioranti */}
      {Array.from({ length: sassi }).map((_, i) => {
        const x = ((i * 137) % 960) + 20;
        const y = 380 + ((i * 73) % 280);
        const w = 28 + (i % 4) * 10;
        return (
          <g key={`s${i}`}>
            <ellipse cx={x} cy={y} rx={w} ry={w * 0.45} fill={NAT_COLORS.cartaScura} stroke={NAT_COLORS.inchiostro} strokeWidth="0.7" />
            <ellipse cx={x - w * 0.3} cy={y - 3} rx={w * 0.4} ry={w * 0.2} fill={NAT_COLORS.cartaChiara} opacity="0.6" />
          </g>
        );
      })}
      {/* ciuffi d'erba bassi */}
      {Array.from({ length: ciuffi }).map((_, i) => {
        const x = ((i * 47) % 1000);
        const y = 360 + ((i * 53) % 320);
        return (
          <g key={`ci${i}`}>
            <line x1={x} y1={y} x2={x - 4} y2={y - 10} stroke={NAT_COLORS.verdeBosco} strokeWidth="1.2" />
            <line x1={x + 2} y1={y} x2={x + 1} y2={y - 12} stroke={NAT_COLORS.verdeBosco} strokeWidth="1.2" />
            <line x1={x + 5} y1={y} x2={x + 7} y2={y - 9} stroke={NAT_COLORS.verdeBosco} strokeWidth="1.2" />
          </g>
        );
      })}
      {/* fiorellini alpini (genzianella, stella alpina, papavero) */}
      {Array.from({ length: fiorellini }).map((_, i) => {
        const x = ((i * 89) % 990) + 5;
        const y = 360 + ((i * 67) % 330);
        const tipo = i % 4;
        const colors = ["#4A5BD9", "#F2E6CC", "#E08A4A", "#C4458A"];
        const c = colors[tipo];
        return (
          <g key={`fl${i}`} transform={`translate(${x} ${y})`}>
            <line x1="0" y1="0" x2="0" y2="10" stroke={NAT_COLORS.verdeBosco} strokeWidth="1" />
            {[0, 72, 144, 216, 288].map(a => (
              <ellipse key={a} cx="0" cy="-3" rx="2.5" ry="4.5" fill={c} stroke={NAT_COLORS.inchiostro} strokeWidth="0.3"
                transform={`rotate(${a})`} opacity="0.95" />
            ))}
            <circle r="1.5" cy="-3" fill={NAT_COLORS.giallo} />
          </g>
        );
      })}
    </g>
  );
}

