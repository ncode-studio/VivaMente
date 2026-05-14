"use client";

/**
 * Sprite vista dall'alto (top-down) per i veicoli del Vigile Urbano.
 *
 * Tutti gli sprite sono disegnati con il "muso" verso l'alto (rotazione 0).
 * Il componente <VehicleSprite/> applica la rotazione in base al senso
 * di marcia (vedi rotationDeg in VigileUrbanoSession).
 *
 * ViewBox standard 40×64 → letto come unità astratta; la dimensione
 * effettiva su schermo è gestita via prop size.
 */

import type { VuTipoId } from "./levels";

interface SpriteProps {
  size: number;
}

// ── Auto (berlina, blu) ───────────────────────────────────────────────────────

function AutoSprite({ size }: SpriteProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ display: "block" }}>
      {/* ombra sotto */}
      <ellipse cx="20" cy="60" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />
      {/* fari anteriori */}
      <rect x="7"  y="0" width="6" height="3" rx="1.5" fill="#FFF7CC" />
      <rect x="27" y="0" width="6" height="3" rx="1.5" fill="#FFF7CC" />
      {/* carrozzeria */}
      <rect x="4" y="3" width="32" height="56" rx="9" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.2" />
      {/* tettuccio (più chiaro) */}
      <rect x="8" y="14" width="24" height="34" rx="6" fill="#60A5FA" />
      {/* parabrezza anteriore */}
      <path d="M 10 14 Q 20 9 30 14 L 28 22 L 12 22 Z" fill="#1F2937" opacity="0.78" />
      {/* lunotto posteriore */}
      <path d="M 12 40 L 28 40 L 30 48 Q 20 51 10 48 Z" fill="#1F2937" opacity="0.55" />
      {/* divisione cabina */}
      <line x1="20" y1="22" x2="20" y2="40" stroke="#2563EB" strokeWidth="0.8" />
      {/* specchietti */}
      <rect x="2"  y="15" width="3" height="3" rx="1" fill="#1E3A8A" />
      <rect x="35" y="15" width="3" height="3" rx="1" fill="#1E3A8A" />
      {/* luci posteriori */}
      <rect x="7"  y="59" width="6" height="2.4" rx="1" fill="#DC2626" />
      <rect x="27" y="59" width="6" height="2.4" rx="1" fill="#DC2626" />
    </svg>
  );
}

// ── Autobus (giallo lungo) ────────────────────────────────────────────────────

function BusSprite({ size }: SpriteProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ display: "block" }}>
      <ellipse cx="20" cy="61" rx="15" ry="3" fill="rgba(0,0,0,0.20)" />
      <rect x="7"  y="0" width="6" height="3" rx="1.5" fill="#FFF7CC" />
      <rect x="27" y="0" width="6" height="3" rx="1.5" fill="#FFF7CC" />
      {/* corpo lungo */}
      <rect x="3" y="3" width="34" height="57" rx="6" fill="#F59E0B" stroke="#92400E" strokeWidth="1.2" />
      {/* parabrezza */}
      <rect x="6" y="7" width="28" height="9" rx="3" fill="#1F2937" opacity="0.78" />
      {/* finestrini laterali (3 coppie) */}
      <rect x="4.5" y="20" width="4" height="7" rx="1" fill="#1F2937" opacity="0.65" />
      <rect x="31.5" y="20" width="4" height="7" rx="1" fill="#1F2937" opacity="0.65" />
      <rect x="4.5" y="30" width="4" height="7" rx="1" fill="#1F2937" opacity="0.65" />
      <rect x="31.5" y="30" width="4" height="7" rx="1" fill="#1F2937" opacity="0.65" />
      <rect x="4.5" y="40" width="4" height="7" rx="1" fill="#1F2937" opacity="0.65" />
      <rect x="31.5" y="40" width="4" height="7" rx="1" fill="#1F2937" opacity="0.65" />
      {/* striscia laterale */}
      <rect x="2.5" y="50" width="35" height="2" fill="#DC2626" />
      {/* portellone posteriore */}
      <rect x="14" y="54" width="12" height="6" rx="1.5" fill="#FBBF24" stroke="#92400E" strokeWidth="0.7" />
      <rect x="7"  y="60" width="6" height="2" rx="1" fill="#DC2626" />
      <rect x="27" y="60" width="6" height="2" rx="1" fill="#DC2626" />
    </svg>
  );
}

// ── Moto (rossa, stretta) ─────────────────────────────────────────────────────

function MotoSprite({ size }: SpriteProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ display: "block" }}>
      <ellipse cx="20" cy="59" rx="7" ry="2.5" fill="rgba(0,0,0,0.20)" />
      {/* ruota anteriore */}
      <rect x="17" y="2" width="6" height="11" rx="2" fill="#1F2937" />
      {/* manubrio */}
      <rect x="11" y="11" width="18" height="3.5" rx="1.5" fill="#374151" />
      {/* serbatoio */}
      <path d="M 14 14 Q 20 12 26 14 L 26 28 Q 20 30 14 28 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
      {/* sella */}
      <rect x="15" y="30" width="10" height="14" rx="3" fill="#1F2937" />
      {/* parafango posteriore */}
      <path d="M 14 44 Q 20 47 26 44 L 25 52 L 15 52 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="0.8" />
      {/* ruota posteriore */}
      <rect x="17" y="49" width="6" height="11" rx="2" fill="#1F2937" />
      {/* fanale anteriore */}
      <circle cx="20" cy="6" r="2" fill="#FFF7CC" />
    </svg>
  );
}

// ── Bicicletta (verde, molto stretta) ─────────────────────────────────────────

function BiciSprite({ size }: SpriteProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ display: "block" }}>
      <ellipse cx="20" cy="59" rx="6" ry="2" fill="rgba(0,0,0,0.18)" />
      {/* ruota anteriore */}
      <circle cx="20" cy="9" r="6" fill="#FFFFFF" stroke="#1F2937" strokeWidth="2" />
      <circle cx="20" cy="9" r="1.5" fill="#1F2937" />
      {/* manubrio */}
      <rect x="13" y="13" width="14" height="2.5" rx="1.2" fill="#1F2937" />
      {/* telaio */}
      <path d="M 20 16 L 20 50" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
      {/* sella */}
      <rect x="17" y="29" width="6" height="3" rx="1.5" fill="#1F2937" />
      {/* casco ciclista */}
      <circle cx="20" cy="38" r="5" fill="#16A34A" stroke="#15803D" strokeWidth="1" />
      <circle cx="20" cy="38" r="2.4" fill="#FBBF24" />
      {/* ruota posteriore */}
      <circle cx="20" cy="55" r="6" fill="#FFFFFF" stroke="#1F2937" strokeWidth="2" />
      <circle cx="20" cy="55" r="1.5" fill="#1F2937" />
    </svg>
  );
}

// ── Camion (arancione con rimorchio) ──────────────────────────────────────────

function CamionSprite({ size }: SpriteProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ display: "block" }}>
      <ellipse cx="20" cy="61" rx="15" ry="3" fill="rgba(0,0,0,0.22)" />
      <rect x="7"  y="0" width="6" height="3" rx="1.5" fill="#FFF7CC" />
      <rect x="27" y="0" width="6" height="3" rx="1.5" fill="#FFF7CC" />
      {/* cabina */}
      <rect x="4" y="3" width="32" height="22" rx="4" fill="#EA580C" stroke="#7C2D12" strokeWidth="1.2" />
      <rect x="7" y="7" width="26" height="11" rx="2" fill="#1F2937" opacity="0.8" />
      {/* giuntura */}
      <rect x="14" y="24" width="12" height="3" fill="#374151" />
      {/* rimorchio (cassone) */}
      <rect x="3" y="27" width="34" height="33" rx="2" fill="#E5E7EB" stroke="#4B5563" strokeWidth="1.5" />
      {/* pannelli */}
      <line x1="3"  y1="38" x2="37" y2="38" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="3"  y1="49" x2="37" y2="49" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="20" y1="27" x2="20" y2="60" stroke="#9CA3AF" strokeWidth="1" />
      {/* luci posteriori */}
      <rect x="7"  y="60" width="6" height="2.2" rx="1" fill="#DC2626" />
      <rect x="27" y="60" width="6" height="2.2" rx="1" fill="#DC2626" />
    </svg>
  );
}

// ── Trattore (verde John Deere style) ─────────────────────────────────────────

function TrattoreSprite({ size }: SpriteProps) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ display: "block" }}>
      <ellipse cx="20" cy="61" rx="15" ry="3" fill="rgba(0,0,0,0.22)" />
      {/* fari */}
      <rect x="9"  y="0" width="5" height="3" rx="1.5" fill="#FFF7CC" />
      <rect x="26" y="0" width="5" height="3" rx="1.5" fill="#FFF7CC" />
      {/* radiatore (parte stretta davanti) */}
      <rect x="10" y="3" width="20" height="14" rx="2.5" fill="#16A34A" stroke="#14532D" strokeWidth="1.2" />
      <rect x="13" y="6" width="14" height="8" fill="#15803D" />
      <line x1="13" y1="9"  x2="27" y2="9"  stroke="#052E16" strokeWidth="0.6" />
      <line x1="13" y1="12" x2="27" y2="12" stroke="#052E16" strokeWidth="0.6" />
      {/* ruote piccole anteriori */}
      <rect x="3"  y="6"  width="6" height="10" rx="2" fill="#1F2937" />
      <rect x="31" y="6"  width="6" height="10" rx="2" fill="#1F2937" />
      {/* cabina centrale (gialla) */}
      <rect x="8" y="18" width="24" height="22" rx="3" fill="#FBBF24" stroke="#92400E" strokeWidth="1.2" />
      <rect x="11" y="22" width="18" height="14" rx="2" fill="#1F2937" opacity="0.75" />
      {/* ruote grandi posteriori */}
      <rect x="1"  y="40" width="9" height="20" rx="3" fill="#1F2937" />
      <rect x="30" y="40" width="9" height="20" rx="3" fill="#1F2937" />
      <circle cx="5.5"  cy="50" r="2.5" fill="#4B5563" />
      <circle cx="34.5" cy="50" r="2.5" fill="#4B5563" />
      {/* corpo posteriore */}
      <rect x="11" y="42" width="18" height="18" rx="2" fill="#16A34A" stroke="#14532D" strokeWidth="1" />
    </svg>
  );
}

// ── Dispatcher ─────────────────────────────────────────────────────────────────

export function VehicleSprite({ tipo, size }: { tipo: VuTipoId; size: number }) {
  switch (tipo) {
    case "auto":     return <AutoSprite size={size} />;
    case "bus":      return <BusSprite size={size} />;
    case "moto":     return <MotoSprite size={size} />;
    case "bici":     return <BiciSprite size={size} />;
    case "camion":   return <CamionSprite size={size} />;
    case "trattore": return <TrattoreSprite size={size} />;
  }
}

// ── Icona per HUD "FAR PASSARE: …" (vista frontale piccola, riconoscibile) ────

export function VehicleIconHud({ tipo, size }: { tipo: VuTipoId; size: number }) {
  return (
    <div style={{
      width: size, height: size,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <VehicleSprite tipo={tipo} size={size * 0.55} />
    </div>
  );
}
